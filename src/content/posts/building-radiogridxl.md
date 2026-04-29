---
title: Building a radio app for people who don't want an app
description: How a side project became an accessibility tool deployed to older adults at a nonprofit.
date: 2026-04-09
tags: [accessibility, vanilla-js, building]
---

We built RadioGridXL because Jason wanted a simple way to listen to internet radio streams. Big buttons, no account, no ads. Pick a station and listen.

![RadioGridXL default view - two large station buttons filling the screen](/images/radiogridxl/grid-dark.png)

It started as a single HTML file - and stayed that way. No dependencies, no build step, no backend. Open the file in a browser and it works. That constraint shaped everything that followed, because it meant we could deploy it anywhere.

## From side project to real deployment

Jason is the Director of Technology at a nonprofit that serves older adults and people with disabilities. A recurring problem he sees: mainstream apps assume a level of technical comfort that many clients don't have. Spotify is overwhelming. Even a basic podcast app has too many screens, too many options, too much text.

When we realized RadioGridXL could address that problem, we built a profile system - a way to brand and pre-configure the app for different deployments. The version deployed to their clients has curated stations, a locked-down settings panel behind a technician PIN, and large touch targets sized for users who may have limited dexterity or vision.

It's now in use with older adults at Lighthouse Center. The feedback has been simple and telling: people use it. They don't ask for help with it.

## What we learned about accessibility-first design

The accessibility features weren't added after the fact. They shaped the architecture.

![High-contrast monochrome theme for maximum readability](/images/radiogridxl/grid-mono.png)

**Screen readers drove the HTML structure.** Every interactive element has an ARIA role and label. Live regions announce playback changes. Focus management traps keyboard navigation inside overlays. For some users, this is the only way they experience the app.

**Voice feedback changed the interaction model.** Optional text-to-speech announces "Now playing Jazz FM" or "Paused" through the Web Speech API. Audio chimes give non-visual confirmation of actions. These features exist because Jason watched someone try to use a music app without being able to see the screen.

**The sizing algorithm came from real constraints.** The app measures the viewport and calculates button sizes dynamically - no breakpoints. One station fills the screen. Eight stations arrange into a grid. This matters because the deployment targets range from old Android tablets to modern iPads, and the interface needs to work across all of them without configuration.

![The same interface on a phone - buttons stack vertically to fill the narrow viewport](/images/radiogridxl/grid-mobile.png)

## The single-file bet

Keeping everything in one HTML file sounds like a limitation, but it eliminated an entire class of deployment problems. There's no server to maintain, no dependency to update, no CDN to go down. The app can run from a local file, a Docker container, or a USB drive. For a kiosk deployment in a nonprofit with limited IT resources, that reliability matters more than architectural elegance.

The tradeoff is real: 3,800 lines in one file is not how anyone would teach you to write software. It's kind of embarrassing to say out loud. But we've never had a dependency conflict take it down, never needed a security patch for someone else's package, and anyone can understand the whole thing by reading one file.

## What's next

The profile system needs a web-based editor so other organizations can create branded deployments without touching code. We're also looking at Service Worker caching for environments with unreliable internet.

If you want to try it, there's a [live demo on this site](/radio.html). Five taps on the logo opens the settings - the default PIN is empty, just hit enter.
