// lightbox — click any .prose img to view fullscreen; JS-driven
// pinch-to-zoom + pan, confined to the overlay (touch-action: none in CSS).
(() => {
  let overlay = null;   // active overlay element, or null
  let detach = null;    // teardown for the active viewer's window listeners
  let returnFocus = null;  // element that opened the lightbox, refocused on close

  function mount() {
    if (!returnFocus) returnFocus = document.activeElement;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.lightbox-close').focus();
  }

  function closeLightbox() {
    if (!overlay) return;
    const el = overlay;
    overlay = null;
    if (detach) { detach(); detach = null; }
    el.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => el.remove(), 250);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  function makeCloseBtn(label) {
    const btn = document.createElement('button');
    btn.className = 'lightbox-close';
    btn.setAttribute('aria-label', label);
    btn.textContent = '✕';
    btn.addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
    return btn;
  }

  // one pointer-based engine per overlay: pinch + wheel zoom, drag-pan,
  // double-tap/dblclick zoom, swipe-down-to-close. Pointer Events unify
  // touch + mouse + trackpad, replacing the old touch/Safari-gesture split
  // that ran two zoom handlers at once. zoomable=false (video) keeps only
  // swipe-close + backdrop-tap-close. Returns a teardown function.
  function attachViewer(ov, target, zoomable) {
    const MIN = 1, MAX = 5;
    let scale = 1, tx = 0, ty = 0;
    const pointers = new Map();          // pointerId -> { x, y }
    let downTarget = null, moved = false;
    // pinch snapshot
    let startDist = 0, startScale = 1, startMidX = 0, startMidY = 0, startTx = 0, startTy = 0;
    // single-pointer pan + swipe-to-close
    let panX = 0, panY = 0, swiping = false, swipeStartY = 0, swipeDy = 0;
    // double-tap (touch only; mouse uses dblclick)
    let lastTap = 0, lastTapX = 0, lastTapY = 0;

    const ctrX = () => window.innerWidth / 2;
    const ctrY = () => window.innerHeight / 2;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    // keep the scaled image from being panned past its own edges
    function clamp() {
      const maxX = Math.max(0, (target.offsetWidth * scale - window.innerWidth) / 2);
      const maxY = Math.max(0, (target.offsetHeight * scale - window.innerHeight) / 2);
      tx = Math.max(-maxX, Math.min(maxX, tx));
      ty = Math.max(-maxY, Math.min(maxY, ty));
    }
    const apply = () => { target.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')'; };
    function animated(fn) {
      target.style.transition = 'transform 0.2s ease';
      fn();
      setTimeout(() => { target.style.transition = ''; }, 200);
    }
    function reset(animate) {
      scale = 1; tx = 0; ty = 0;
      if (animate) animated(apply); else apply();
    }
    // zoom toward a screen anchor, keeping that point fixed under finger/cursor.
    // the target is centered (flex) with transform-origin center, so the
    // viewport center is its origin when tx/ty are 0.
    function zoomToward(next, ax, ay) {
      next = Math.max(MIN, Math.min(MAX, next));
      const ratio = next / scale;
      tx = ax - ctrX() - (ax - ctrX() - tx) * ratio;
      ty = ay - ctrY() - (ay - ctrY() - ty) * ratio;
      scale = next;
      clamp(); apply();
    }

    function onDown(e) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { downTarget = e.target; moved = false; }
      if (zoomable && pointers.size === 2) {
        const p = [...pointers.values()];
        startDist = dist(p[0], p[1]);
        startScale = scale;
        startMidX = (p[0].x + p[1].x) / 2; startMidY = (p[0].y + p[1].y) / 2;
        startTx = tx; startTy = ty;
        swiping = false;
      } else if (pointers.size === 1) {
        panX = e.clientX; panY = e.clientY;
        if (scale <= 1.01) { swiping = true; swipeStartY = e.clientY; swipeDy = 0; }
      }
    }

    function onMove(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = [...pointers.values()];
      if (zoomable && p.length >= 2) {
        moved = true;
        const d = dist(p[0], p[1]);
        const mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2;
        const next = Math.max(MIN, Math.min(MAX, startScale * (d / startDist)));
        const ratio = next / startScale;
        tx = mx - ctrX() - (startMidX - ctrX() - startTx) * ratio;
        ty = my - ctrY() - (startMidY - ctrY() - startTy) * ratio;
        scale = next;
        clamp(); apply();
      } else if (p.length === 1) {
        const dx = e.clientX - panX, dy = e.clientY - panY;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        panX = e.clientX; panY = e.clientY;
        if (scale > 1.01) {
          tx += dx; ty += dy; clamp(); apply();
        } else if (swiping) {
          swipeDy = e.clientY - swipeStartY;
          const prog = Math.min(1, Math.abs(swipeDy) / 300);
          target.style.transform = 'translateY(' + swipeDy + 'px)';
          ov.style.background = 'rgba(0,0,0,' + (0.92 * (1 - prog * 0.7)) + ')';
        }
      }
    }

    function onUp(e) {
      pointers.delete(e.pointerId);
      if (pointers.size === 1) {
        const r = [...pointers.values()][0];
        panX = r.x; panY = r.y;          // reanchor pan after a pinch finger lifts
      }
      if (pointers.size > 0) return;

      if (swiping && moved) {
        swiping = false;
        ov.style.background = '';
        if (Math.abs(swipeDy) > 90) { closeLightbox(); return; }
        animated(apply);                 // not far enough — snap back into place
        return;
      }
      swiping = false;

      if (scale < 1.01 && scale !== 1) reset(true);
      if (moved) return;

      if (downTarget === ov) { closeLightbox(); return; }   // tap the dark backdrop
      // double-tap the image toggles zoom (touch only; mouse uses dblclick)
      if (zoomable && e.pointerType === 'touch' && target.contains(downTarget)) {
        const now = e.timeStamp;
        if (now - lastTap < 300 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 30) {
          lastTap = 0;
          if (scale > 1.01) reset(true);
          else animated(() => zoomToward(2.5, e.clientX, e.clientY));
        } else {
          lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
        }
      }
    }

    function onWheel(e) {
      if (!zoomable) return;
      e.preventDefault();
      zoomToward(scale * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    }
    function onDblClick(e) {
      if (!zoomable) return;
      if (scale > 1.01) animated(() => reset(false));
      else animated(() => zoomToward(2.5, e.clientX, e.clientY));
    }
    const onResize = () => { clamp(); apply(); };

    ov.addEventListener('pointerdown', onDown);
    ov.addEventListener('pointermove', onMove);
    ov.addEventListener('pointerup', onUp);
    ov.addEventListener('pointercancel', onUp);
    ov.addEventListener('wheel', onWheel, { passive: false });
    ov.addEventListener('dblclick', onDblClick);
    // Safari's trackpad pinch fires gesture events, not ctrl+wheel; scope the
    // block to the overlay so the rest of the page keeps native zoom
    ov.addEventListener('gesturestart', e => e.preventDefault());
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }

  function openLightbox(src, alt) {
    if (overlay) closeLightbox();
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', alt || 'Image preview');

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.draggable = false;

    overlay.appendChild(makeCloseBtn('Close image preview'));
    overlay.appendChild(img);
    mount();

    detach = attachViewer(overlay, img, true);
    requestAnimationFrame(() => { if (overlay) overlay.classList.add('open'); });
  }

  function openVideoLightbox(src, alt) {
    if (overlay) closeLightbox();
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', alt || 'Video preview');

    const vid = document.createElement('video');
    vid.src = src;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.draggable = false;

    overlay.appendChild(makeCloseBtn('Close video preview'));
    overlay.appendChild(vid);
    mount();

    detach = attachViewer(overlay, vid, false);
    requestAnimationFrame(() => { if (overlay) overlay.classList.add('open'); });
  }

  // mermaid diagrams: render the cloned SVG inline (not as <img src=blob>) so
  // foreignObject HTML labels survive — browsers refuse to render them inside
  // an image-context SVG, which is why the old blob path showed broken/empty.
  function openSvgLightbox(srcSvg) {
    if (overlay) closeLightbox();
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Diagram preview');

    var wrap = document.createElement('div');
    wrap.className = 'lightbox-svg';

    var clone = srcSvg.cloneNode(true);
    // strip animation state so mid-animation clicks show the complete diagram
    clone.querySelectorAll('.node, .cluster').forEach(function(n) {
      n.style.opacity = '';
      n.style.transition = '';
      n.style.transform = '';
    });
    clone.querySelectorAll('.node rect, .node circle').forEach(function(s) {
      s.style.transform = '';
      s.style.transition = '';
      s.style.transformOrigin = '';
      s.style.transformBox = '';
    });
    clone.querySelectorAll('.edgePaths > path').forEach(function(p) {
      p.style.strokeDasharray = '';
      p.style.strokeDashoffset = '';
      p.style.transition = '';
    });
    clone.querySelectorAll('.edgeLabels > .edgeLabel').forEach(function(l) {
      l.style.opacity = '';
      l.style.transition = '';
    });
    // let the SVG fill the wrapper rather than its inline max-width
    clone.removeAttribute('style');
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.maxWidth = '100%';
    clone.style.maxHeight = '100%';

    wrap.appendChild(clone);
    overlay.appendChild(makeCloseBtn('Close diagram preview'));
    overlay.appendChild(wrap);
    mount();

    detach = attachViewer(overlay, wrap, true);
    requestAnimationFrame(() => { if (overlay) overlay.classList.add('open'); });
  }

  document.addEventListener('click', function(e) {
    var vid = e.target.closest('.prose video');
    if (vid) { openVideoLightbox(vid.src, vid.getAttribute('alt') || ''); return; }
    var merm = e.target.closest('.prose .mermaid');
    if (merm) {
      var svg = merm.querySelector('svg');
      if (svg) openSvgLightbox(svg);
      return;
    }
    var img = e.target.closest('.prose img');
    if (img) openLightbox(img.src, img.alt);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay) closeLightbox();
    // the close button is the overlay's only focusable element; keep focus in the modal
    if (e.key === 'Tab' && overlay) e.preventDefault();
  });
})();
