// Yes / No / Not sure check screen: a full-screen, three-option confirmation
// used after a choice or whenever staff want to verify understanding. Not a
// dialog — it IS the screen while open, nothing else competes for attention.

const CLOSE_AFTER_MS = 1400; // long enough to hear the word and see the flash

export function initCheck({ elements, speakOption }) {
  const { screen, closeBtn, options } = elements;
  let closeTimer = null;
  let answered = false;

  const close = () => {
    clearTimeout(closeTimer);
    closeTimer = null;
    answered = false;
    screen.hidden = true;
    for (const option of options) option.classList.remove('chosen', 'dimmed');
  };

  closeBtn.addEventListener('click', close);

  for (const option of options) {
    option.addEventListener('click', () => {
      if (answered) return; // first answer wins; the rest is settle time
      answered = true;
      speakOption(option.dataset.speak);
      option.classList.add('chosen');
      for (const other of options) {
        if (other !== option) other.classList.add('dimmed');
      }
      closeTimer = setTimeout(close, CLOSE_AFTER_MS);
    });
  }

  return {
    open() {
      answered = false;
      screen.hidden = false;
    },
    close,
  };
}
