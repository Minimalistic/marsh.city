// theme toggle: cycle light → dark → auto, persist choice.
// window.__themeMix (0=light, 1=dark) is a smoothly-tweened value that
// starfield + fireflies multiply their opacity by — gives a crossfade
// when the user clicks the toggle instead of a hard snap.
(() => {
  const root = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  const label = btn && btn.querySelector('.theme-label');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const TRANSITION_MS = 700;
  const CYCLE = ['light', 'dark', 'auto'];

  window.__isDark = () => root.dataset.theme === 'dark';
  window.__themeMix = window.__isDark() ? 1 : 0;

  function updateUI() {
    if (!btn) return;
    const pref = root.dataset.themePref || 'auto';
    btn.classList.toggle('is-night', window.__isDark());
    btn.classList.toggle('is-auto', pref === 'auto');
    if (label) label.textContent = pref;
  }
  updateUI();

  let tweenId = 0;
  function tweenMix(target) {
    const myId = ++tweenId;
    const start = window.__themeMix;
    const t0 = performance.now();
    function step(now) {
      if (myId !== tweenId) return;
      const p = Math.min(1, (now - t0) / TRANSITION_MS);
      const e = p * p * (3 - 2 * p); // smoothstep
      window.__themeMix = start + (target - start) * e;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setTheme(next, animate) {
    root.dataset.theme = next;
    updateUI();
    if (animate) {
      root.classList.add('theme-animating');
      setTimeout(() => root.classList.remove('theme-animating'), TRANSITION_MS + 100);
      tweenMix(next === 'dark' ? 1 : 0);
    } else {
      window.__themeMix = next === 'dark' ? 1 : 0;
    }
    // the starfield and firefly loops park in light mode; this wakes them
    window.dispatchEvent(new Event('marsh:theme'));
  }

  // system preference changes only affect auto mode
  mq.addEventListener('change', () => {
    if (root.dataset.themePref === 'auto') {
      setTheme(mq.matches ? 'dark' : 'light', true);
    }
  });

  if (btn) btn.addEventListener('click', () => {
    const current = root.dataset.themePref || 'auto';
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    root.dataset.themePref = next;
    try { localStorage.setItem('theme', next); } catch {}
    const resolved = next === 'auto'
      ? (mq.matches ? 'dark' : 'light')
      : next;
    setTheme(resolved, true);
  });
})();
