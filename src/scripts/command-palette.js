// command palette (⌘K / Ctrl+K)
(() => {
  const ITEMS = JSON.parse(document.getElementById('cmdk-items')?.textContent || '[]');
  const root = document.getElementById('cmdk');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-results');
  const triggers = document.querySelectorAll('.cmdk-trigger');
  if (!root || !input || !list) return;

  let filtered = ITEMS.slice(0, 30);
  let selected = 0;
  let lastFocused = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // simple scoring: exact substring (best), word-start match, then subsequence
  function score(query, item) {
    const q = query.toLowerCase();
    const title = item.title.toLowerCase();
    const hint = (item.hint || '').toLowerCase();
    const hay = title + ' ' + hint;
    if (title.startsWith(q)) return -1000 + title.length;
    const titleIdx = title.indexOf(q);
    if (titleIdx >= 0) return -500 + titleIdx;
    const hayIdx = hay.indexOf(q);
    if (hayIdx >= 0) return hayIdx;
    // subsequence match over title+hint
    let qi = 0;
    for (let i = 0; i < hay.length && qi < q.length; i++) {
      if (hay[i] === q[qi]) qi++;
    }
    return qi === q.length ? 1000 + hay.length : Infinity;
  }

  function filter(q) {
    if (!q) return ITEMS.slice(0, 30);
    const scored = ITEMS
      .map((it) => ({ it, s: score(q, it) }))
      .filter((x) => x.s !== Infinity)
      .sort((a, b) => a.s - b.s)
      .slice(0, 30);
    return scored.map((x) => x.it);
  }

  function render() {
    if (!filtered.length) {
      list.innerHTML = '<li class="cmdk-empty" role="presentation">No matches</li>';
      input.removeAttribute('aria-activedescendant');
      return;
    }
    list.innerHTML = filtered.map((it, i) => `
      <li class="cmdk-result" role="option" id="cmdk-opt-${i}"
          aria-selected="${i === selected}" data-idx="${i}">
        <span class="cmdk-result-type">${it.type}</span>
        <span class="cmdk-result-title">${escapeHtml(it.title)}</span>
        <span class="cmdk-result-hint">${escapeHtml(it.hint || '')}</span>
      </li>
    `).join('');
    // screen readers announce the highlighted option while typing, not only on arrow keys
    input.setAttribute('aria-activedescendant', `cmdk-opt-${selected}`);
  }

  function select(i) {
    selected = Math.max(0, Math.min(i, filtered.length - 1));
    const items = list.querySelectorAll('.cmdk-result');
    items.forEach((el, idx) => el.setAttribute('aria-selected', idx === selected ? 'true' : 'false'));
    input.setAttribute('aria-activedescendant', `cmdk-opt-${selected}`);
    const el = items[selected];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    lastFocused = document.activeElement;
    root.hidden = false;
    input.value = '';
    filtered = ITEMS.slice(0, 30);
    selected = 0;
    render();
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 0);
  }
  function close() {
    root.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function go(i) {
    const it = filtered[i];
    if (it) window.location.href = it.url;
  }

  input.addEventListener('input', () => {
    filtered = filter(input.value.trim());
    selected = 0;
    render();
  });

  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.cmdk-result');
    if (!li) return;
    const idx = Number(li.dataset.idx);
    if (idx !== selected) select(idx);
  });
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.cmdk-result');
    if (!li) return;
    go(Number(li.dataset.idx));
  });

  root.querySelector('[data-cmdk-close]').addEventListener('click', close);
  triggers.forEach(t => t.addEventListener('click', open));

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      root.hidden ? open() : close();
      return;
    }
    if (root.hidden) return;
    switch (e.key) {
      case 'Escape': e.preventDefault(); close(); break;
      // the input is the dialog's only focusable element; keep focus in the modal
      case 'Tab': e.preventDefault(); break;
      case 'ArrowDown': e.preventDefault(); select(selected + 1); break;
      case 'ArrowUp': e.preventDefault(); select(selected - 1); break;
      case 'Home': e.preventDefault(); select(0); break;
      case 'End': e.preventDefault(); select(filtered.length - 1); break;
      case 'Enter': e.preventDefault(); go(selected); break;
    }
  });
})();
