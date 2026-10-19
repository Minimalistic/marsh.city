// "View background": hides the page (nav, content, footer text) so the
// scene behind it can be looked at on its own. The page keeps its height,
// so scrolling still pans the foliage. A small bar offers the way back and
// the site sound; Esc also leaves. Per page view, never saved.
(() => {
  const toggle = document.querySelector('.scene-toggle');
  const bar = document.querySelector('.scene-bar');
  if (!toggle || !bar) return;
  const back = bar.querySelector('.scene-back');
  const sound = bar.querySelector('.scene-sound');
  const soundLabel = bar.querySelector('.scene-sound-label');
  const menuBtn = document.querySelector('.nav-menu-btn');
  const menuSound = document.querySelector('.sound-toggle');
  // inert keeps the hidden page out of tab order and the accessibility tree
  const hidden = [document.querySelector('.layout'), document.querySelector('.site-foot-inner')].filter(Boolean);
  const root = document.documentElement;

  function enter() {
    root.classList.add('is-viewing-scene');
    hidden.forEach((el) => { el.inert = true; });
    bar.hidden = false;
    back.focus({ preventScroll: true });
  }
  function leave() {
    root.classList.remove('is-viewing-scene');
    hidden.forEach((el) => { el.inert = false; });
    bar.hidden = true;
    menuBtn?.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', enter);
  back.addEventListener('click', leave);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !bar.hidden) leave();
  });

  // The bar's sound button drives the menu's toggle, so there's one setting
  // and one audio engine; clicking it synchronously keeps the user gesture
  // iOS needs to unlock audio.
  if (!menuSound) { sound.remove(); return; }
  sound.addEventListener('click', () => menuSound.click());
  function mirrorSound() {
    sound.setAttribute('aria-pressed', menuSound.getAttribute('aria-pressed'));
    soundLabel.textContent = menuSound.querySelector('.sound-label')?.textContent ?? '';
  }
  mirrorSound();
  new MutationObserver(mirrorSound).observe(menuSound, {
    attributes: true, attributeFilter: ['aria-pressed'], subtree: true, characterData: true, childList: true,
  });
})();
