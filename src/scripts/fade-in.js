// staggered scroll fade-in for cards, sections, hero
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll(
    '.section-header, .article-header, .prose > h2, .prose > blockquote'
  );
  targets.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // stagger siblings
        const parent = entry.target.parentElement;
        const siblings = [...parent.querySelectorAll(':scope > .fade-in:not(.visible)')];
        const idx = siblings.indexOf(entry.target);
        const delay = Math.max(0, idx) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();
