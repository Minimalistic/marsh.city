// nav hamburger menu: toggles the panel that nests theme + search.
// click-outside + Escape close it; clicking an item inside also closes.
(() => {
  const wrapper = document.querySelector('.nav-menu');
  const btn = document.querySelector('.nav-menu-btn');
  const panel = document.getElementById('nav-menu-panel');
  if (!wrapper || !btn || !panel) return;

  function open() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden ? open() : close();
  });

  panel.addEventListener('click', (e) => {
    if (e.target.closest('.theme-toggle, .sound-toggle, .cmdk-trigger')) close();
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !wrapper.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      close();
      btn.focus();
    }
  });
})();
