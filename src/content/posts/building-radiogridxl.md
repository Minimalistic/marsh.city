---
title: Building a radio app for people who don't want an app
description: How a side project became an accessibility tool deployed to older adults at a nonprofit.
date: 2026-04-09
tags: [accessibility, vanilla-js, building]
---

I built RadioGridXL because I wanted a simple way to listen to internet radio streams. Big buttons, no account, no ads, no algorithmic recommendations. Just pick a station and listen.

It started as a single HTML file — and stayed that way. No dependencies, no build step, no backend. Open the file in a browser and it works. That constraint turned out to be the most important design decision I made, because it meant I could deploy it anywhere.

## From side project to real deployment

I'm the Director of Technology at a nonprofit that serves older adults and people with disabilities. A recurring problem I see: mainstream apps assume a level of technical comfort that many of our clients don't have. Spotify is overwhelming. Even a basic podcast app has too many screens, too many options, too much text.

When I realized RadioGridXL could solve that problem, I built a profile system — a way to brand and pre-configure the app for different deployments. The version our clients use has curated stations, a locked-down settings panel behind a technician PIN, and large touch targets sized for users who may have limited dexterity or vision.

It's now deployed to older adults through our organization. The feedback has been simple and telling: people use it. They don't ask for help with it. That's the highest compliment an interface can get.

## What I learned about accessibility-first design

The accessibility features weren't added after the fact. They shaped the architecture:

**Screen readers drove the HTML structure.** Every interactive element has an ARIA role and label. Live regions announce playback changes. Focus management traps keyboard navigation inside overlays. This isn't decoration — it's how some of our users experience the app.

**Voice feedback changed the interaction model.** Optional text-to-speech announces "Now playing Jazz FM" or "Paused" through the Web Speech API. Audio chimes give non-visual confirmation of actions. These features exist because I watched someone try to use a music app without being able to see the screen.

**The sizing algorithm came from real constraints.** The app measures the viewport and calculates button sizes dynamically — no breakpoints. One station fills the screen. Eight stations arrange into a grid. This matters because our deployment targets range from old Android tablets to modern iPads, and the interface needs to work on all of them without configuration.

## The single-file bet

Keeping everything in one HTML file sounds like a limitation, but it eliminated an entire class of deployment problems. There's no server to maintain, no dependency to update, no CDN to go down. The app can run from a local file, a Docker container, or a USB drive. For a kiosk deployment in a nonprofit with limited IT resources — which is to say, me — that reliability matters more than architectural elegance.

The tradeoff is real: 3,800 lines in one file is not how you'd teach someone to write code. But the result is an app that has never gone down because of a dependency conflict, has never needed a security patch for a transitive package, and can be fully understood by reading one file.

## What's next

I'm working on better stream discovery and considering whether offline caching (via Service Worker) makes sense for environments with unreliable internet. The profile system also needs a web-based editor so other organizations can create their own branded deployments without touching code.

If you want to try it, there's a [live demo on this site](/radio.html). Five taps on the logo opens the settings — the default PIN is empty, just hit enter.
