// foliage "elevator descending" — image is pinned to viewport bottom,
// pans sky → forest floor as user scrolls through the page. The pan
// itself is a CSS scroll-driven animation (global.css, .foliage-layer);
// this script only covers what CSS can't.
(() => {
  const frame = document.querySelector('.site-foot-foliage');
  if (!frame) return;
  const layers = frame.querySelectorAll('.foliage-layer');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssDriven = CSS.supports('animation-timeline: scroll()');

  // a page too short to scroll has no scroll timeline; show the floor
  function markUnscrollable() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    frame.classList.toggle('is-unscrollable', max <= 0 && !reduceMotion);
  }
  markUnscrollable();
  window.addEventListener('resize', markUnscrollable);
  window.addEventListener('load', markUnscrollable);
  if (reduceMotion || cssDriven) return;

  // Fallback for browsers without scroll-driven animations. Writes a
  // transform on each layer only (never :root, which would restyle the
  // whole document every frame). The ::after darken stays at 0 here.
  // Mirrors the keyframes: each layer pans from --layer-start to its
  // pinned end (--end-canvas row at --end-band of the band) over
  // [--layer-range-start, 90%] of the scroll.
  const PAN_END = 0.9;
  let spans = [];
  function measure() {
    spans = [...layers].map((l) => {
      const cs = getComputedStyle(l);
      const frameH = l.parentElement.getBoundingClientRect().height;
      const endBand = parseFloat(cs.getPropertyValue('--end-band')) || 1;
      const endCanvas = parseFloat(cs.getPropertyValue('--end-canvas')) || 1;
      const startVh = parseFloat(cs.getPropertyValue('--layer-start')) || 0;
      const rangeStart = (parseFloat(cs.getPropertyValue('--layer-range-start')) || 0) / 100;
      // the box covers only the painted rows; recover the full canvas height
      const contentTop = parseFloat(cs.getPropertyValue('--content-top')) || 0;
      const contentBottom = parseFloat(cs.getPropertyValue('--content-bottom')) || 1;
      const fullH = l.getBoundingClientRect().height / (contentBottom - contentTop);
      return {
        from: startVh * window.innerHeight / 100,
        to: frameH * endBand - fullH * endCanvas,
        rangeStart,
      };
    });
  }
  let ticking = false;
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const raw = max > 0 ? window.scrollY / max : 1;
    layers.forEach((l, i) => {
      const { from, to, rangeStart } = spans[i];
      const t = Math.max(0, Math.min(1, (raw - rangeStart) / (PAN_END - rangeStart)));
      l.style.transform = `translate(-50%, ${(from + (to - from) * t).toFixed(1)}px)`;
    });
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  measure();
  update();
})();
