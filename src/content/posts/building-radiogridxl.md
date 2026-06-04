---
title: Building a radio app for people who don't want an app
description: Internet radio built for older adults and people with disabilities — accessibility-first, single-file, deployed at a nonprofit.
date: 2026-04-09
tags: [accessibility, vanilla-js, building]
image: /images/radiogridxl/grid-dark.webp
imageAlt: RadioGridXL — two large station buttons filling a dark screen
---

I built RadioGridXL for the people mainstream music apps tend to leave behind - older adults and people with disabilities. Big buttons, no account, no ads. Pick a station and listen.

![RadioGridXL default view - two large station buttons filling the screen](/images/radiogridxl/grid-dark.webp)

It's a single HTML file. No dependencies, no build step, no backend. Open the file in a browser and it works. That constraint shaped everything that followed, because it meant I could deploy it anywhere - and the people I was building for don't have IT support standing by.

## Who it's for

I'm the Director of Technology at a nonprofit that serves older adults and people with disabilities, so the problem was right in front of me from the start: mainstream apps assume a level of technical comfort many clients don't have. Spotify is overwhelming if you just want to hear jazz. Even a basic podcast app has too many screens, too many options, too much text.

That's the problem RadioGridXL was built to solve. A profile system brands and pre-configures the app for each deployment - the version running at Lighthouse Center has curated stations, a locked-down settings panel behind a technician PIN, and large touch targets sized for users who may have limited dexterity or vision.

It's in use with older adults there now. The feedback has been simple and telling: people use it. They don't ask for help with it.

## Designing accessibility-first

The accessibility features weren't added after the fact. They shaped the architecture.

![High-contrast monochrome theme for maximum readability](/images/radiogridxl/grid-mono.webp)

**Screen readers drove the HTML structure.** Every interactive element has an ARIA role and label. Live regions announce playback changes. Focus management traps keyboard navigation inside overlays. For some users, this is the only way they experience the app.

**Voice feedback changed the interaction model.** Optional text-to-speech announces "Now playing Jazz FM" or "Paused" through the Web Speech API. Audio chimes give non-visual confirmation of actions. These features exist because I watched someone try to use a music app without being able to see the screen.

**The sizing algorithm came from real constraints.** The app measures the viewport and calculates button sizes dynamically - no breakpoints. One station fills the screen. Eight stations arrange into a grid. This matters because the deployment targets range from old Android tablets to modern iPads, and the interface needs to work across all of them without configuration.

![The same interface on a phone - buttons stack vertically to fill the narrow viewport](/images/radiogridxl/grid-mobile.webp)

## The single-file bet

Keeping everything in one HTML file sounds like a limitation, but it eliminated an entire class of deployment problems. There's no server to maintain, no dependency to update, no CDN to go down. The app can run from a local file, a Docker container, or a USB drive. For a kiosk deployment in a nonprofit with limited IT resources, that reliability matters more than architectural elegance.

The tradeoff is real: around 4,600 lines in one file is not how anyone would recommend writing software. But I've never had a dependency conflict take it down, never needed a security patch for someone else's package, and anyone can understand the whole thing by reading one file.

## What's next

When I first wrote this, the open question was Service Worker caching for environments with unreliable internet. That one's done - RadioGridXL grew into a PWA. It installs to the home screen, keeps audio controls on the lock screen, auto-resumes after a dropped connection, and caches its app shell so a flaky network doesn't leave you staring at a blank page. Settings backup and restore came along with it, plus per-stream loudness leveling so stations don't jump in volume.

The piece still missing is a web-based editor for the profile system, so other organizations can create branded deployments without touching code. That's the next real one.

If you want to try it, there's a [live demo on this site](/radio/). Five taps on the logo opens the settings - the default PIN is empty, just hit enter.
