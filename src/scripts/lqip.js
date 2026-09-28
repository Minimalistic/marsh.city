// progressive image loading — LQIP blur-up
// build generates /_lqip/map.json with {src: tinyDataURI} entries
(() => {
  document.addEventListener('DOMContentLoaded', function() {
    var imgs = document.querySelectorAll('.prose img');
    if (!imgs.length) return;

    fetch('/_lqip/map.json').then(function(r) { return r.json(); }).then(function(map) {
      imgs.forEach(function(img) {
        var lqip = map[img.getAttribute('src')];
        if (!lqip) return;

        img.style.backgroundImage = 'url(' + lqip + ')';
        img.classList.add('has-lqip');

        // wrap image and add dancing dots overlay
        var wrap = document.createElement('span');
        wrap.className = 'lqip-wrap';
        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);

        var dots = document.createElement('span');
        dots.className = 'lqip-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        wrap.appendChild(dots);

        function onLoaded() {
          img.classList.add('img-loaded');
          img.style.backgroundImage = 'none';
          dots.remove();
        }
        if (img.complete && img.naturalWidth) onLoaded();
        else img.addEventListener('load', onLoaded);
      });
    }).catch(function() {
      // no LQIP map — just do simple fade-in
      imgs.forEach(function(img) {
        if (img.complete && img.naturalWidth) img.classList.add('img-loaded');
        else img.addEventListener('load', function() { img.classList.add('img-loaded'); });
      });
    });
  });
})();
