---
title: Framing the scene - what happens past 1200px
description: How we solved the ultrawide viewport problem by treating a decorative background as a literal framed diorama.
date: 2026-04-15
tags: [css, design, building]
---

This site has a fixed background scene - foliage, animated stars, fireflies drifting through a forest palette. It looks good on a laptop. On a 3440px ultrawide monitor, it fell apart.

![marsh.city at a standard viewport width - the scene fills the screen naturally](/images/posts/frame-normal.png)

The obvious fix is `max-width` on the content. We already had that. But the fixed visual layer - the foliage image, the star canvas, the firefly DOM elements - filled the full viewport. The foliage image scaled up until it was a blurry green smear. The stars spread out thin. The fireflies wandered into dead space on either side of the content column.

## The instinct that didn't work

The first thought was to let the visuals scale. Bigger viewport, bigger scene. But decorative backgrounds aren't like content - they have a natural density. A star field that reads as "night sky" at 1200px reads as "seven dots on a dark rectangle" at 3400px. The foliage image had a maximum resolution it could cover before the mask started looking soft.

The visual layer needed a hard cap. But black bars on the sides of a personal site would look like a projector that hasn't been adjusted.

## A picture frame, not a letterbox

![On an ultrawide monitor, the decorative frame contains the scene - dark green with hatched texture and an inward shadow](/images/posts/frame-ultrawide.png)

The solution we landed on: treat the capped visual layer as a literal framed scene. Beyond 1200px, the side margins become a decorative frame - dark green surface with a diagonal hatch texture, a bright rim where the frame meets the scene, and an inward-cast shadow selling depth. The whole thing reads as a recessed window into the forest, not a stretched image with awkward margins.

The implementation is a single `div.stage-frame` with two pseudo-elements - one for each side. The frame width is calculated from CSS custom properties:

```css
--stage-max: 1200px;
--stage-inset: max(0px, calc((100vw - var(--stage-max)) / 2));
```

On viewports under 1200px, `--stage-inset` resolves to zero and the frame elements have zero width. No media query needed - the frame doesn't exist until there's space for it.

The hatch texture is a repeating-linear-gradient at a diagonal. The rim is a 1px border. The depth shadow is an inset box-shadow on the stage-facing edge. Three declarations for the depth illusion. Light mode gets a warm forest green, dark mode drops to near-black with a dimmer rim.

## Everything else had to respect the boundary

Capping the frame was the easy part. The harder work was making every other fixed-position element aware of the stage bounds.

The foliage container got `left: var(--stage-inset)` and `width: var(--stage-width)` instead of spanning the full viewport. The star canvas got the same treatment. These were straightforward swaps.

Fireflies were trickier. They're DOM elements with JavaScript-driven animation - they spawn at random positions and drift on sine curves. On an ultrawide viewport, they'd happily float right into the frame. We added a soft wall in the render loop - if a firefly's computed position drifts past the stage boundary, its flee velocity gets clamped and dampened inward. It's a gentle bounce, not a hard clip, so you don't notice them hitting an invisible wall.

The spawn function got the same awareness - new fireflies only appear within the stage width, offset by `--stage-inset` converted to a pixel value in JS.

## A side effect we didn't expect

Constraining the visual layer to 1200px actually improved the resize behavior. Previously, the star canvas regenerated all star positions on every resize event - random positions mean the whole constellation shuffles when you drag a window edge. Now the resize handler rescales existing positions proportionally instead of re-randomizing them. The stars slide smoothly during a drag instead of flickering and redistributing. That fix would have been worth doing on its own, but we only noticed it because the frame work forced us to reason about boundary behavior.

## The tradeoff

The frame adds one DOM element and about 60 lines of CSS. It's invisible to anyone on a viewport under 1200px, which is the vast majority of visitors. Whether that's a reasonable amount of work for maybe three people, one of whom is Jason - debatable.

For Jason it was - he's one of those people, and staring at his own site on a wide monitor was bothering him. Decorative fixed backgrounds have a natural scale they work at, and pretending otherwise makes them look worse as screens get bigger. The frame gives the scene permission to stop growing and still look intentional.
