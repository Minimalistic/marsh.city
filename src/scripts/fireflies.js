// fireflies — always spawned, but visible only in dark mode. In light
// mode the render loop and every fly's fade loop park (no frames, no
// layout reads) until 'marsh:theme' switches back to dark.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const _ffMobile = window.innerWidth <= 820;
  const COUNT = _ffMobile ? 6 : 14;
  const FLEE_RADIUS = 80;       // how close cursor must be to agitate
  const FLEE_FORCE = 3.6;       // continuous repulsion strength
  const JITTER = 1.4;            // per-frame random nudge while agitated
  const WANDER_JITTER = 0.35;    // brownian drift while wandering away from home
  const DAMPING = 0.93;          // velocity friction per frame
  const RETURN_SPRING = 0.0014;  // very soft pull home — bugs don't b-line
  const RETURN_JITTER = 0.22;    // keeps the return path meandering, not straight
  const WANDER_MIN_MS = 3000;
  const WANDER_MAX_MS = 8000;
  const IDLE = 0, FLEEING = 1, WANDERING = 2, RETURNING = 3;
  const flies = [];

  // Depth planes: fixed full-screen layers that pan with the page via the
  // same CSS scroll-driven timeline as the foliage (global.css,
  // .firefly-plane), so flies ride the background on the compositor
  // instead of trailing a JS scroll handler. Farther planes travel less.
  const PLANE_TRAVEL_VH = { far: 10, mid: 20, near: 30, fore: 40 };
  // Each plane is slotted just in front of a foliage layer so flies glow
  // between the plants: far flies ahead of the treeline, behind the
  // cattails, and so on. 'fore' goes after the ground layer, so those
  // flies hover in front of every plant. Without the foliage stack they
  // go on <body>.
  const PLANE_SLOT = {
    far: ['before', 'back'],
    mid: ['before', 'mid'],
    near: ['before', 'front'],
    fore: ['after', 'ground'],
  };
  const planes = {};
  for (const name of Object.keys(PLANE_TRAVEL_VH)) {
    const plane = document.createElement('div');
    plane.className = `firefly-plane firefly-plane--${name}`;
    plane.setAttribute('aria-hidden', 'true');
    const [where, layer] = PLANE_SLOT[name];
    const frame = document.querySelector(`.foliage-frame--${layer}`);
    if (frame) frame[where](plane);
    else document.body.appendChild(plane);
    planes[name] = plane;
  }
  const planeFor = (depth) =>
    depth < 0.35 ? 'far' : depth < 0.6 ? 'mid' : depth < 0.82 ? 'near' : 'fore';
  const planeOffset = {};  // current translateY of each plane, px
  function readPlaneOffsets() {
    for (const name in planes) planeOffset[name] = planes[name].getBoundingClientRect().top;
  }

  // Fallback for browsers without scroll-driven animations: move the
  // three planes (not every fly) from scroll progress, like the foliage.
  const cssDriven = CSS.supports('animation-timeline: scroll()');
  function movePlanesFallback() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, window.scrollY / max / 0.9) : 0;
    for (const name in planes) {
      const px = -progress * PLANE_TRAVEL_VH[name] * window.innerHeight / 100;
      planes[name].style.transform = `translateY(${px.toFixed(1)}px)`;
    }
  }

  let mx = -9999, my = -9999;    // cursor position; off-screen until first move

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });
  document.addEventListener('mouseleave', () => {
    mx = -9999;
    my = -9999;
  });

  // read plane positions before spawning so a page restored mid-scroll
  // still places its first flies on screen
  if (!cssDriven) movePlanesFallback();
  readPlaneOffsets();

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'firefly';
    // depth drives parallax speed + visual scale so flies read as being
    // at varying distances. All flies render behind cards regardless.
    // Floor pushed lower (0.08) so more flies populate the far-distance
    // end of the range, giving a deeper "fireflies in the jungle" feel.
    const depth = 0.08 + Math.random() * 0.92;  // 0.08 – 1.0
    const sizeFactor = 0.5 + depth * 0.6;       // 0.55 – 1.1
    const opacityFactor = 0.45 + depth * 0.6;   // 0.50 – 1.05
    // Size is set once, for life. Resizing on every respawn reallocated
    // the fly's ~330px glow texture, and on iOS that churn under a
    // card's backdrop-filter made the foliage layers blink out.
    const size = (3 + Math.random() * 5) * sizeFactor;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    const plane = planeFor(depth);
    planes[plane].appendChild(el);
    flies.push({
      el, depth, sizeFactor, opacityFactor, plane,
      baseX: 0, baseY: 0,
      driftX: 0, driftY: 0,
      fleeX: 0, fleeY: 0,
      fleeVX: 0, fleeVY: 0,
      mode: IDLE,
      returnAt: 0,
      agitation: 0,  // 0–1, ramps up while disturbed, decays while calm
    });
    animateFirefly(flies[i], true);
  }

  // parked = light mode with the crossfade finished; a fade into dark
  // also starts at mix 0, so the theme itself decides
  const parked = () => (window.__themeMix ?? 0) < 0.01 && !window.__isDark();
  let rendering = false;
  function startRender() {
    if (rendering) return;
    rendering = true;
    requestAnimationFrame(renderLoop);
  }

  // render loop — state machine: idle → fleeing → wandering → returning → idle
  function renderLoop() {
    if (parked()) { rendering = false; return; }
    const now = performance.now();
    if (!cssDriven) movePlanesFallback();
    readPlaneOffsets();
    // stage bounds — fireflies get clamped here so they can't drift
    // into the side frame on ultrawide viewports
    const STAGE_MAX = 1200;
    const vw = window.innerWidth;
    const stageLeft = Math.max(0, (vw - STAGE_MAX) / 2);
    const stageRight = vw - stageLeft;
    const MARGIN = 8;
    for (const fly of flies) {
      // soft wall: if flee offset would push the fly outside the stage,
      // clamp and dampen-reverse the velocity so it bounces gently inward
      {
        const probeX = fly.baseX + fly.driftX + fly.fleeX;
        if (probeX < stageLeft + MARGIN) {
          fly.fleeX = (stageLeft + MARGIN) - fly.baseX - fly.driftX;
          if (fly.fleeVX < 0) fly.fleeVX = -fly.fleeVX * 0.4;
        } else if (probeX > stageRight - MARGIN) {
          fly.fleeX = (stageRight - MARGIN) - fly.baseX - fly.driftX;
          if (fly.fleeVX > 0) fly.fleeVX = -fly.fleeVX * 0.4;
        }
      }
      const flyX = fly.baseX + fly.driftX + fly.fleeX;
      // baseY is plane-local; add the plane's pan to get viewport coords
      const flyY = fly.baseY + planeOffset[fly.plane] + fly.driftY + fly.fleeY;

      const dx = flyX - mx;
      const dy = flyY - my;
      const dist = Math.hypot(dx, dy);
      const cursorNear = dist < FLEE_RADIUS && dist > 0.01;

      if (cursorNear) {
        // agitated — strong continuous repulsion + jitter, no matter prior state
        const force = (1 - dist / FLEE_RADIUS) * FLEE_FORCE;
        fly.fleeVX += (dx / dist) * force + (Math.random() - 0.5) * JITTER;
        fly.fleeVY += (dy / dist) * force + (Math.random() - 0.5) * JITTER;
        fly.mode = FLEEING;
      } else if (fly.mode === FLEEING) {
        // cursor gone — start wandering in the new area for a random 3-8s
        fly.mode = WANDERING;
        fly.returnAt = now + WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS);
      } else if (fly.mode === WANDERING) {
        // brownian drift, no pull home yet
        fly.fleeVX += (Math.random() - 0.5) * WANDER_JITTER;
        fly.fleeVY += (Math.random() - 0.5) * WANDER_JITTER;
        if (now >= fly.returnAt) fly.mode = RETURNING;
      } else if (fly.mode === RETURNING) {
        // soft spring + continuous brownian jitter — it's a bug finding
        // its way back, not a missile homing on a target. The spring is
        // weak and the jitter is persistent, so the path meanders.
        fly.fleeVX -= fly.fleeX * RETURN_SPRING;
        fly.fleeVY -= fly.fleeY * RETURN_SPRING;
        fly.fleeVX += (Math.random() - 0.5) * RETURN_JITTER;
        fly.fleeVY += (Math.random() - 0.5) * RETURN_JITTER;
        const offset = Math.hypot(fly.fleeX, fly.fleeY);
        const speed = Math.hypot(fly.fleeVX, fly.fleeVY);
        // loosened threshold — with constant jitter a fly rarely sits
        // perfectly still, so "close enough" counts as home.
        if (offset < 8 && speed < 0.8) {
          fly.mode = IDLE;
          fly.fleeX = 0; fly.fleeY = 0;
          fly.fleeVX = 0; fly.fleeVY = 0;
        }
      }

      // always apply damping + integrate
      fly.fleeVX *= DAMPING;
      fly.fleeVY *= DAMPING;
      fly.fleeX += fly.fleeVX;
      fly.fleeY += fly.fleeVY;

      // brightness ramp while disturbed — bugs "excite" slowly and
      // cool off slowly, so the boost reads as a sustained glow not a
      // flicker. Read in the fadeIn/glow/fadeOut tick as a multiplier.
      if (fly.mode === FLEEING || fly.mode === WANDERING) {
        fly.agitation = Math.min(1, fly.agitation + 0.008);
      } else {
        fly.agitation = Math.max(0, fly.agitation - 0.004);
      }

      // scroll parallax lives on the plane; the fly carries its spawn
      // point plus its own motion, all in the transform so a respawn
      // never touches layout (see animateFirefly)
      fly.el.style.transform =
        `translate(${fly.baseX + fly.driftX + fly.fleeX}px, ${fly.baseY + fly.driftY + fly.fleeY}px)`;
    }
    requestAnimationFrame(renderLoop);
  }
  if (!parked()) startRender();
  window.addEventListener('marsh:theme', () => {
    if (!window.__isDark()) return;
    if (!cssDriven) movePlanesFallback();
    readPlaneOffsets();
    startRender();
    // flies parked mid-cycle restart fresh, staggered like a first load
    for (const fly of flies) {
      if (fly.parked) { fly.parked = false; animateFirefly(fly, true); }
    }
  });

  function animateFirefly(fly, first) {
    const { el } = fly;
    // spawn within the stage bounds (see --stage-max in global.css) so
    // flies don't drift into the side frame on ultrawide viewports.
    const STAGE_MAX = 1200;
    const vw = window.innerWidth;
    const stageW = Math.min(vw, STAGE_MAX);
    const stageInset = Math.max(0, (vw - STAGE_MAX) / 2);
    const x = stageInset + Math.random() * stageW;
    // subtract the plane's current pan so respawned flies land in the
    // visible viewport, then ride the plane from there
    // fireflies hang low: sqrt skews the pick toward the bottom of the
    // viewport (down in the plants), with a few strays drifting higher
    const low = Math.random() < 0.85;
    const viewportY = window.innerHeight *
      (low ? 0.45 + 0.55 * Math.sqrt(Math.random()) : Math.random() * 0.5);
    const y = viewportY - (planeOffset[fly.plane] ?? 0);
    // position goes through the render loop's transform, not left/top:
    // moving a fly is then a compositor-only change, with no layout pass
    // baseX is viewport x (planes never move sideways); baseY is plane-local
    fly.baseX = x;
    fly.baseY = y;

    const dx = (Math.random() - 0.5) * 200;
    const dy = (Math.random() - 0.5) * 160;

    const fadeIn = 1600 + Math.random() * 2400;
    const glow = 4000 + Math.random() * 8000;
    const fadeOut = 1600 + Math.random() * 2400;
    const totalDrift = fadeIn + glow + fadeOut;
    const delay = first ? Math.random() * 5000 : 200 + Math.random() * 3000;

    fly.driftX = 0;
    fly.driftY = 0;
    fly.fleeX = 0;
    fly.fleeY = 0;
    fly.fleeVX = 0;
    fly.fleeVY = 0;
    fly.mode = IDLE;
    fly.returnAt = 0;

    setTimeout(() => {
      const start = performance.now();
      function tick(now) {
        if (parked()) { el.style.opacity = 0; fly.parked = true; return; }
        const elapsed = now - start;
        const progress = Math.min(elapsed / totalDrift, 1);

        // update drift (parallax loop reads this)
        fly.driftX = dx * progress;
        fly.driftY = dy * progress;

        let opacity;
        if (elapsed < fadeIn) {
          opacity = (elapsed / fadeIn) * 0.7;
        } else if (elapsed < fadeIn + glow) {
          const t = (elapsed - fadeIn) / glow;
          opacity = 0.5 + 0.2 * Math.sin(t * Math.PI * 2);
        } else {
          opacity = 0.7 * (1 - (elapsed - fadeIn - glow) / fadeOut);
        }
        // crossfade with theme, then scale by the fly's depth-derived
        // opacity factor so deeper flies read as farther/dimmer.
        // agitation adds up to +55% brightness when fully excited.
        // BRIGHTNESS is a global tuning dial on the whole firefly look.
        const BRIGHTNESS = 1.25;
        const mix = window.__themeMix ?? 0;
        const boost = 1 + fly.agitation * 0.55;
        el.style.opacity = Math.max(0, opacity * mix * fly.opacityFactor * boost * BRIGHTNESS);

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.style.opacity = 0;
          animateFirefly(fly, false);
        }
      }
      requestAnimationFrame(tick);
    }, delay);
  }
})();
