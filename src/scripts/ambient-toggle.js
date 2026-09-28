// ambient sound: opt-in, off by default. The toggle lives here; the
// synth engine (/ambient.js) is only fetched once someone turns it on.
// The AudioContext is created synchronously inside the user gesture,
// before the async import, because iOS Safari only unlocks audio there.
const AMBIENT_URL = '/ambient.js';
(() => {
  const btn = document.querySelector('.sound-toggle');
  if (!btn) return;
  const label = btn.querySelector('.sound-label');
  let wanted = false;
  try { wanted = localStorage.getItem('ambient') === 'on'; } catch {}
  let ctx = null;
  let engine = null;

  function updateUI() {
    btn.setAttribute('aria-pressed', String(wanted));
    if (label) label.textContent = wanted ? 'on' : 'off';
  }
  updateUI();

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
    }
    ctx.resume().catch(() => {});
    return true;
  }

  async function start() {
    if (!unlock()) return;
    try {
      if (!engine) {
        // served as-is from public/; keep the bundler from trying to inline it
        const mod = await import(/* @vite-ignore */ AMBIENT_URL);
        engine = mod.createAmbient(ctx);
      }
      if (wanted) engine.start(window.__isDark());
    } catch (err) {
      console.error('[ambient] failed to start:', err);
    }
  }

  btn.addEventListener('click', () => {
    wanted = !wanted;
    try { localStorage.setItem('ambient', wanted ? 'on' : 'off'); } catch {}
    updateUI();
    if (wanted) start();
    else if (engine) engine.stop();
  });

  // Browsers block audio until a gesture, so a saved "on" resumes on
  // the first tap/key of each page load (with a slow fade-in).
  if (wanted) {
    const kick = () => {
      ['pointerdown', 'keydown'].forEach(t => removeEventListener(t, kick, true));
      if (wanted && !engine) start();
    };
    ['pointerdown', 'keydown'].forEach(t => addEventListener(t, kick, true));
  }

  window.addEventListener('marsh:theme', () => {
    if (engine && wanted) engine.setNight(window.__isDark());
  });

  // stop burning CPU (and playing to an empty room) in background tabs
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !wanted) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });
})();
