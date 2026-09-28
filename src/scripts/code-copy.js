// code block copy buttons
(() => {
  document.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    if (pre.querySelector('.code-copy')) return;
    const btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.textContent = 'copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(code.textContent || '');
      btn.textContent = 'copied';
      btn.setAttribute('aria-label', 'Code copied to clipboard');
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'copy';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.classList.remove('copied');
      }, 1500);
    });
    pre.appendChild(btn);
  });
})();
