---
title: Driftglass
description: Slow aerial scenes generated live - a nebula, cloud over open ocean, open water, a shoreline - with ambient sound to match.
---

After The Shallows I wanted to keep going in the same direction, but slower and quieter - something closer to meditative than playful. Driftglass is top-down aerial scenes that drift past on their own: a nebula, cumulus over open ocean, open water with gannets, and a shoreline where waves run up the sand and sandpipers work the water line.

Nothing here is a video or an image. Each scene is drawn in shaders from a seed, so every variation is new, and the sound is synthesized too - a drone, high-altitude wind, swell, and surf that breaks in time with the waves. Sound starts off; tap the speaker to turn it on. It's best full screen, left running.

<style>
.driftglass-frame { position:relative; width:100%; aspect-ratio:16/9; border-radius:var(--radius); overflow:hidden; background:#000; }
.driftglass-frame iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
/* the app's dock needs height; a 16:9 strip on a phone is mostly controls */
@media (max-width: 600px) { .driftglass-frame { aspect-ratio: 3/4; } }
</style>

<div class="driftglass-frame">
<iframe src="/driftglass/" title="Driftglass - procedural aerial scenes" allow="fullscreen; autoplay" loading="lazy"></iframe>
</div>

[Open Driftglass full screen](/driftglass/)
