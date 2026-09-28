---
title: Driftglass
description: Slow aerial scenes, generated live, with ambient sound.
---

A slower, quieter follow-up to The Shallows. Four scenes: a nebula, clouds over the ocean, open water, and a shoreline. Everything is generated as it plays, sound included.

It opens on the shoreline. Try the other three from the dock at the bottom - each has its own look and sound.

Sound starts off; tap the speaker to turn it on.

<style>
.driftglass-frame { position:relative; width:100%; aspect-ratio:16/9; border-radius:var(--radius); overflow:hidden; background:#000; }
.driftglass-frame iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
/* click-to-start: the app runs a heavy shader, so it only loads when asked */
.driftglass-start { position:absolute; inset:0; width:100%; height:100%; border:0; padding:0; cursor:pointer; color:#fff;
  background:#000 url(/images/driftglass/shoreline.webp) center/cover no-repeat;
  display:grid; place-items:center; font:inherit; }
.driftglass-start span { display:inline-flex; align-items:center; gap:.6em; padding:.7em 1.3em; border-radius:999px;
  background:rgba(0,0,0,.55); font-size:1.05rem; transition:background .2s; }
.driftglass-start:hover span, .driftglass-start:focus-visible span { background:rgba(0,0,0,.75); }
.driftglass-start:focus-visible { outline:3px solid var(--leaf, #fff); outline-offset:-6px; }
/* the app's dock needs height; a 16:9 strip on a phone is mostly controls */
@media (max-width: 600px) { .driftglass-frame { aspect-ratio: 3/4; } }
</style>

<div class="driftglass-frame">
<button type="button" class="driftglass-start"><span><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>Start Driftglass</span></button>
</div>

<script>
document.querySelector('.driftglass-start')?.addEventListener('click', (e) => {
  const iframe = document.createElement('iframe');
  iframe.src = '/driftglass/';
  iframe.title = 'Driftglass - procedural aerial scenes';
  iframe.allow = 'fullscreen; autoplay';
  e.currentTarget.replaceWith(iframe);
  iframe.focus();
});
</script>

[Open Driftglass full screen](/driftglass/)
