// Sentence strip: a dumb queue of tapped buttons. No grammar, no prediction.

const queue = [];

export function initStrip({ elements, speakAll }) {
  const { bar, chips, speakBtn, backBtn, clearBtn } = elements;

  const render = () => {
    chips.textContent = '';
    for (const [index, item] of queue.entries()) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.setAttribute('aria-label', `Remove ${item.label} from sentence`);
      if (item.imageURL) {
        const img = document.createElement('img');
        img.src = item.imageURL;
        img.alt = '';
        chip.appendChild(img);
      }
      chip.appendChild(document.createTextNode(item.label));
      chip.addEventListener('click', () => {
        queue.splice(index, 1);
        render();
      });
      chips.appendChild(chip);
    }
    chips.scrollLeft = chips.scrollWidth;
  };

  speakBtn.addEventListener('click', () => {
    if (queue.length) speakAll(queue.map((item) => item.spokenText).join(' '));
  });
  backBtn.addEventListener('click', () => { queue.pop(); render(); });
  clearBtn.addEventListener('click', () => { queue.length = 0; render(); });

  return {
    add(button, imageURL) {
      queue.push({
        label: button.label,
        spokenText: button.spokenText || button.label,
        imageURL,
      });
      render();
    },
    setVisible(visible) {
      bar.hidden = !visible;
      if (!visible) { queue.length = 0; render(); }
    },
  };
}
