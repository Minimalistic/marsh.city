// starfield — rendered only in dark mode. The draw loop parks once the
// theme is light and the crossfade has finished, and restarts on
// 'marsh:theme', so light mode costs no frames at all.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'starfield';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }  // null under canvas limits; don't take the rest of the bundle down

  let W = 0, H = 0, DPR = 1;
  const stars = [];
  const isMobile = window.innerWidth <= 820;
  const STAR_COUNT = isMobile ? 40 : 90;
  const shooters = [];
  let shooterTimer = 0;
  // Safari crashes when canvas pixel count exceeds ~16M px
  const MAX_CANVAS_DIM = 4096;

  let resizeTimer = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const prevW = W, prevH = H;
    W = canvas.clientWidth || 1;
    H = canvas.clientHeight || 1;
    canvas.width = Math.min(W * DPR, MAX_CANVAS_DIM);
    canvas.height = Math.min(H * DPR, MAX_CANVAS_DIM);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (stars.length === 0) {
      // first run — seed fresh
      for (let i = 0; i < STAR_COUNT; i++) {
        // y^0.6 weights density toward the top of the sky
        stars.push({
          x: Math.random() * W,
          y: Math.pow(Math.random(), 0.6) * H,
          r: Math.random() * 0.85 + 0.22,
          base: 0.35 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0005 + Math.random() * 0.0011,
          tint: Math.random() < 0.18 ? '#cfd9ff'
              : Math.random() < 0.18 ? '#ffe4be'
              : '#ffffff',
        });
      }
    } else if (prevW > 0 && prevH > 0) {
      // rescale existing stars so they don't rerandomize on resize —
      // avoids the "flicker + redistribute" feel while dragging window edges
      const sx = W / prevW;
      const sy = H / prevH;
      for (const s of stars) {
        s.x *= sx;
        s.y *= sy;
      }
    }
  }

  function scheduleShooter() {
    // rare: 18-55 seconds between shooting stars
    shooterTimer = 18000 + Math.random() * 37000;
  }

  function emitShooter() {
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft
      ? -40 + Math.random() * W * 0.35
      : W * 0.65 + Math.random() * W * 0.35;
    const startY = Math.random() * H * 0.35;
    // shallow diagonal, angled away from origin side
    const angle = fromLeft
      ? (Math.PI * 0.10) + Math.random() * 0.12   // down-right
      : (Math.PI * 0.78) + Math.random() * 0.12;  // down-left
    const speed = 7 + Math.random() * 4;
    shooters.push({
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 55 + Math.random() * 35,
    });
  }

  let lastTs = performance.now();
  let running = false;
  function start() {
    if (running) return;
    running = true;
    lastTs = performance.now();
    requestAnimationFrame(frame);
  }
  function frame(now) {
    const dt = now - lastTs;
    lastTs = now;

    // crossfade with theme (0 in light, 1 in dark, tweens in between)
    const mix = window.__themeMix ?? 0;
    canvas.style.opacity = mix.toFixed(3);
    if (mix < 0.01) {
      ctx.clearRect(0, 0, W, H);
      // park only when heading to light: a fade into dark starts at 0 too
      if (!window.__isDark()) { canvas.style.opacity = '0'; running = false; return; }
      requestAnimationFrame(frame);
      return;
    }

    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const tw = reduce
        ? s.base
        : s.base * (0.78 + 0.22 * Math.sin(now * s.speed + s.phase));
      ctx.globalAlpha = tw;
      ctx.fillStyle = s.tint;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 0.7) {
        ctx.globalAlpha = tw * 0.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (!reduce) {
      shooterTimer -= dt;
      if (shooterTimer <= 0) {
        emitShooter();
        scheduleShooter();
      }
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const sh = shooters[i];
      sh.life++;
      sh.x += sh.vx;
      sh.y += sh.vy;
      const t = sh.life / sh.maxLife;
      const alpha = t < 0.15 ? (t / 0.15) : (1 - (t - 0.15) / 0.85);
      const vmag = Math.hypot(sh.vx, sh.vy) || 1;
      const tailLen = 70;
      const tx = sh.x - (sh.vx / vmag) * tailLen;
      const ty = sh.y - (sh.vy / vmag) * tailLen;
      const grad = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
      grad.addColorStop(0, `rgba(255, 246, 220, ${Math.max(0, alpha)})`);
      grad.addColorStop(1, 'rgba(255, 246, 220, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 1.5, 0, Math.PI * 2);
      ctx.fill();

      if (sh.life >= sh.maxLife || sh.x < -100 || sh.x > W + 100 || sh.y > H + 100) {
        shooters.splice(i, 1);
      }
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  resize();
  scheduleShooter();
  canvas.style.opacity = '0';
  if (window.__isDark()) start();
  window.addEventListener('marsh:theme', () => { if (window.__isDark()) start(); });
})();
