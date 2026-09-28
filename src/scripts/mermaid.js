// mermaid — only loads the library if the page has mermaid blocks
(() => {
  // match both raw markdown (code.language-mermaid) and Shiki-highlighted (pre[data-language="mermaid"])
  const blocks = document.querySelectorAll('pre > code.language-mermaid, pre[data-language="mermaid"] > code');
  if (!blocks.length) return;
  blocks.forEach(code => {
    const pre = code.parentElement;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    pre.replaceWith(div);
  });
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  s.onload = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    window.mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      themeVariables: isDark
        ? { primaryColor: '#2d4a3e', primaryTextColor: '#e8e0d4', lineColor: '#5a7a6a' }
        : { primaryColor: '#e8e0d4', primaryTextColor: '#2c2c2c', lineColor: '#5a7a6a' }
    });
    window.mermaid.run().then(function() {
      // animated mermaid diagrams — opt-in via .mermaid-animated wrapper
      // truly sequential: node spawns → edge draws into void → edge
      // arrives → next node spawns at destination. Arrowhead markers
      // hidden until their edge finishes drawing.
      document.querySelectorAll('.mermaid-animated').forEach(function(wrapper) {
        var svg = wrapper.querySelector('.mermaid svg');
        if (!svg) return;
        var order = (wrapper.dataset.animateOrder || '').split(',').map(function(s) { return s.trim(); });
        if (!order.length || !order[0]) return;

        var edges = svg.querySelectorAll('.edgePaths > path[data-id]');
        var edgeLabels = svg.querySelectorAll('.edgeLabels > .edgeLabel');

        // hide all nodes, clusters, and edge labels
        svg.querySelectorAll('.node').forEach(function(n) { n.style.opacity = '0'; });
        svg.querySelectorAll('.cluster').forEach(function(c) { c.style.opacity = '0'; });
        edgeLabels.forEach(function(l) { l.style.opacity = '0'; });

        // prep edges: dash-hide the stroke, save and remove arrowhead markers
        edges.forEach(function(e) {
          var len = e.getTotalLength();
          e.style.strokeDasharray = len;
          e.style.strokeDashoffset = len;
          e._savedMarker = e.getAttribute('marker-end');
          e.removeAttribute('marker-end');
        });

        // build sequential step list: [{type:'node'|'cluster',el}, {type:'edges',items:[{el,label}]}]
        var steps = [];
        order.forEach(function(name) {
          var node = svg.querySelector('.node[id*="-flowchart-' + name + '-"]');
          if (node) {
            steps.push({ type: 'node', el: node });
          } else {
            // try matching a cluster (subgraph) by ID
            var cluster = svg.querySelector('.cluster[id*="' + name + '"]');
            if (cluster) steps.push({ type: 'cluster', el: cluster });
          }
          var nodeEdges = [];
          edges.forEach(function(edge, i) {
            var parts = (edge.getAttribute('data-id') || '').split('_');
            if (parts.length >= 3 && parts[1] === name) {
              nodeEdges.push({ el: edge, label: edgeLabels[i] || null });
            }
          });
          if (nodeEdges.length) steps.push({ type: 'edges', items: nodeEdges });
        });

        function runStep(i) {
          if (i >= steps.length) {
            // cleanup inline styles so lightbox clone looks right
            edges.forEach(function(e) {
              e.style.strokeDasharray = '';
              e.style.strokeDashoffset = '';
              e.style.transition = '';
            });
            return;
          }
          var step = steps[i];
          if (step.type === 'cluster') {
            step.el.style.transition = 'opacity 0.4s ease-out';
            step.el.style.opacity = '1';
            setTimeout(function() { runStep(i + 1); }, 350);
          } else if (step.type === 'node') {
            // preserve mermaid's translate positioning, layer scale on top
            var baseTransform = step.el.getAttribute('transform') || '';
            step.el.style.transformOrigin = 'center center';
            step.el.style.transition = 'opacity 0.35s ease-out';
            step.el.style.opacity = '1';
            // animate scale on the inner shape — skip polygons (diamonds)
            // because fill-box transforms distort their rotation
            var shape = step.el.querySelector('rect, circle');
            if (shape) {
              shape.style.transformOrigin = 'center center';
              shape.style.transformBox = 'fill-box';
              shape.style.transform = 'scale(1.18)';
              shape.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
              setTimeout(function() { shape.style.transform = 'scale(1)'; }, 50);
            }
            setTimeout(function() { runStep(i + 1); }, 450);
          } else if (step.type === 'edges') {
            step.items.forEach(function(e) {
              e.el.style.transition = 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
              e.el.style.strokeDashoffset = '0';
            });
            setTimeout(function() {
              // restore arrowheads and fade in labels
              step.items.forEach(function(e) {
                if (e.el._savedMarker) e.el.setAttribute('marker-end', e.el._savedMarker);
                if (e.label) {
                  e.label.style.transition = 'opacity 0.3s ease-out';
                  e.label.style.opacity = '1';
                }
              });
              runStep(i + 1);
            }, 650);
          }
        }

        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              wrapper.classList.add('mermaid--visible');
              observer.unobserve(wrapper);
              runStep(0);
            }
          });
        }, { threshold: 0.3 });
        observer.observe(wrapper);
      });
    });
  };
  document.head.appendChild(s);
})();
