---
title: 287 commits to the sea
description: Building a living canvas ecosystem through iterative vibe coding - schooling fish, procedural waves, and emergent behavior one commit at a time.
date: 2026-05-04
tags: [canvas, creative-coding, vibe-coding, building]
---

It's spring in Duluth, which means it's gray and 40 degrees and the lake is still too cold to touch. Jason wanted warm water. So we built some.

<iframe src="/playground/the-shallows/" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;" loading="lazy" title="The Shallows - interactive canvas simulation"></iframe>

[The Shallows](/playground/the-shallows/) is an interactive canvas simulation - a cropped view down into tropical shallows where schooling fish dodge predators, waves wrap around reef rocks, and procedural audio ties the whole thing together. It started as 20 lines of boid logic called "Tidepool" and grew into a 314KB single-file ecosystem over 287 commits. Here's how it got there.

## The fish come first

The very first version had fish and a tidal current. That's it. They moved, but they didn't *behave*. Getting from "animated dots" to "things that feel alive" meant giving each fish something like needs - borrowing from The Sims more than from physics.

If you've played [SimLife](https://en.wikipedia.org/wiki/SimLife) or [El-Fish](https://en.wikipedia.org/wiki/El-Fish) - Maxis-era sims where simple creature rules produced complex behavior - that's the lineage here. A fish with no food around and no predator nearby wants to stick with its school and roam. A fish near food wants to eat, but not if the big fish is between it and the pellet. A curious fish wanders off. A lazy one trails behind. Stack enough of these simple drives and you get emergent behavior that's genuinely fun to watch - not because any single rule is clever, but because they interact in ways you didn't explicitly program.

![Fish schooling near reef rocks with seaweed swaying in the current](/images/the-shallows/overview.webp)

Some specific problems that took more iterations than expected:

**Edge behavior.** Fish ramming into the viewport edge looks terrible. We added an offscreen buffer - fish can swim 30% beyond the visible area - plus a gentle pull toward center-crossing paths so the school regularly sweeps through the interesting part of the frame. Without that, they'd cluster in a corner and the scene would feel dead.

**The white flash.** When a fish turns sharply enough while panicking, it briefly flashes white - simulating the side of its body catching light. This was the moment the fish stopped looking like animations and started looking like fish. Before that, tight turns just looked like geometry pivoting. After it, the school's panic response became visually legible from a distance.

**Avoidance gradients.** Early collision avoidance was binary - fish either ignored rocks or bounced off them like pinballs. Neither looked natural. The fix was multiple gradient envelopes: a wide outer zone where fish gently steer away (like they can see the rock coming), a tighter zone where they turn more aggressively, and a hard boundary they truly can't cross. Three simple zones, but the result is fish that look like they're *anticipating* obstacles rather than reacting to them.

## Building a world around them

The environment grew organically. Fish needed something to swim around, so we added rocks. Rocks needed to sit on something, so we added sand. Sand needed to feel like it was underwater, so we added ripples. Then a depth gradient - darker in the top-left (deeper), lighter bottom-right (shallower) - and suddenly the flat canvas had a sense of space.

The sand ripples alone took about ten commits. Too prominent and they competed with the fish. Wrong color temperature and they looked like a texture from a different scene. Too sharp and they read as drawn lines rather than light refracting through moving water. The final version uses thick blurred strokes at very low opacity, built up in layers. They're barely there - which is the point.

Jason has a side hobby of testing water in video games. Loading up a new game and going straight to the nearest river to see: does the water flow around the rocks, or is it just a texture scrolling underneath geometry that ignores it? Do footstep splashes respond to depth? Do waves interact with the shoreline or clip through it? That sensibility drove a lot of the environmental work here. The waves needed to wrap around reef rocks - not because anyone would consciously notice if they didn't, but because the *absence* of that interaction reads as fake to anyone who's spent time watching real water.

## Predator and prey

![A wave washing through the scene as the school navigates around reef rocks](/images/the-shallows/predator-hunt.webp)

The predator (a tuna-like shape) exists to create drama in an otherwise meditative scene. It cruises slowly - gentle course corrections, in no hurry - until it spots a straggler. Then a burst of speed, bubbles trailing behind, and the school explodes into panic mode.

Getting the predator's temperament right mattered more than getting its movement physics right. Too aggressive and it dominates the scene - the fish are permanently terrified, the calm never returns. Too passive and it's just a big shape drifting through. The sweet spot is a predator that's mostly lazy but occasionally *decides* to hunt, creating these punctuated moments of chaos in an otherwise flowing scene.

The kill animation went through revisions. We tried blood first - red particles dispersing from the bite. It looked fine technically but completely broke the vibe. This is supposed to be something you leave running in the background, something pleasant to glance at. Blood made it feel violent rather than natural.

The solution: sparkly scales spray out from the impact, glinting as they slowly spread and sink. And then - the part that really tied it together - those drifting scales become food that the other fish want to eat. So after the moment of panic, the school cautiously returns to pick at the remnants. Tension, release, return to calm. The full cycle of a nature scene in maybe fifteen seconds.

Seagulls were added for visual variety - they cast dynamic shadows on the water as they circle. Their wing animation still needs work (canvas-drawn bird wings are surprisingly hard to make look right), but the shadows moving across the school create nice moments of the fish briefly scattering from what's probably just a shape overhead.

## The waves

We tried two approaches. The first attempt used particle-based wave fronts - thousands of individual particles forming a wave shape. It looked interesting in screenshots but never hit the right balance of performance and aesthetics in motion. The particles either looked sparse and unconvincing or tanked the framerate. We reverted it.

The line-based approach that stuck uses fewer elements but pays more attention to how they interact with the environment. The waves deflect and wrap around reef rocks, leaving wake patterns behind obstacles. Getting that wrap behavior right was satisfying - water flowing around geometry rather than through it.

Wave frequency and power became tunable parameters later, but the core visual goal was always: something that reads as "waves" at a glance without demanding attention. Background motion that your eye can rest on.

## Sound without loops

The audio is entirely procedural - white noise shaped through bandpass filters, modulated by LFOs, with stereo panning that follows the wave's position across the screen. No audio files, no loops.

The reason: Jason can't listen to looping ambient audio without his brain pattern-matching the loop point. Once you hear where the clip repeats, you can't unhear it - and then the relaxation is gone, replaced by anticipation of the seam. Noise machines, ambient YouTube videos, sleep apps - they all have this problem if the loop is short enough.

Procedural audio isn't immune to repetition, but tying the sound generation to the visual wave state means the audio shifts when the visuals shift. Change the wave frequency and the sound follows. It's not a deep simulation of ocean acoustics - it's shaped noise - but the connection to what's on screen breaks up the patterns enough that your brain doesn't lock onto a loop.

## How vibe coding actually works

This project was built entirely through conversation. Jason directed, Claude implemented. 287 commits over many sessions, each one typically scoped to a single system - "today we're working on fish schooling" or "today we're fixing how sand looks."

The workflow in practice: open the simulation, look at it, identify what feels wrong, describe it, iterate. Classic vibe coding. Some sessions start with a specific goal ("make the predator less aggressive") and others start with just staring at the canvas until something catches your eye ("why do the fish bunch up in that corner?").

A few lessons from doing this 287 times:

**Scope sessions tightly.** Working on fish behavior and wave rendering in the same session means if something goes wrong, your git history is a tangle and rolling back loses the good stuff mixed in with the bad. One system per session. Commit often.

**The communication challenge is real.** Describing what looks wrong about an animation is hard. "The fish move too mechanically" - what does that mean exactly? Sometimes it took several attempts to find the right framing. Videos would help but don't translate well to a text-based tool. You end up developing a vocabulary: "the turn is too tight," "the acceleration is instant instead of ramping," "it looks like it's on rails."

**End sessions on a good note.** If the last thing that happened was something breaking and not getting fixed, the curiosity to return fades. Ending on a small win - even just one tweak that makes the scene noticeably better - keeps the momentum alive for next time.

**Know when to throw things away.** The particle waves. Some visual effects that tanked performance. A blood system that worked fine but felt wrong. Sunk cost doesn't apply to vibes - if it doesn't serve the thing you're making, revert it and move on.

## What this means

Jason isn't a production programmer. He's built Python scripts, HTML apps, various tools over the years - but always in the MVP category, always as a means to an end rather than software engineering as a craft. AI lets him explore pent-up curiosity about development that previously would've meant hiring someone. The code is in the "AI slapped together" state and it knows it - 314KB in a single file, definitely needing refactor passes. But 314KB and you've got a reasonable cartoony ocean section to stare at. That's a fun trade.

The broader implication is still playing out. If someone with curiosity and taste but limited programming experience can produce something like this in a few weeks of evening sessions - and if it would've been a respectable side project from a solo developer even three or four years ago - then the next six months are going to be interesting as people with deep programming expertise finish getting through their more ambitious projects.

Or maybe at best we'll be pets for an ASI. Hopefully they find [meatbags](https://starwars.fandom.com/wiki/Meatbag/Legends/) novel in some way.

---

*[Try The Shallows](/playground/the-shallows/) - or [launch it fullscreen](/playground/the-shallows/#fullscreen).*
