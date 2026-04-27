---
title: RadioGridXL
description: A zero-dependency, single-file radio streaming app with WCAG AA accessibility — deployed to older adults at a nonprofit.
status: shipped
repo: https://github.com/Minimalistic/RadioGridXL
url: https://marsh.city/radio.html
tags: [vanilla-js, accessibility, html5, pwa, kiosk]
started: 2026-03-01
updated: 2026-04-09
---

Jason wanted a simple way to listen to internet radio — big buttons, no account, no ads. We built it as a single HTML file with no dependencies, no build step, and no backend. Then it turned into a real deployment at the nonprofit where he directs technology, in the hands of older adults who just want to listen to music without navigating a complicated interface.

[Try the live demo](/radio.html)

## What it does

Big buttons, one per station. Tap to play, tap again to pause. That's the whole interaction model. Behind that simplicity is a lot of careful engineering:

**Adaptive layout** — the app measures available viewport space and calculates button sizing dynamically. One station fills the screen. Eight stations arrange into a responsive grid. It handles portrait, landscape, phone, tablet, and desktop without a single media query breakpoint.

**Hands-free playback** — Wake Lock keeps the screen on while audio plays. Auto-retry handles dropped connections with up to four attempts before showing an error. A sleep timer can shut off playback after 15 minutes to 4 hours.

**Technician settings** — a hidden PIN-protected panel (five taps on the logo) lets a technician configure stations, themes, volume caps, and accessibility options without exposing complexity to the end user. Lockout escalates after failed PIN attempts.

**Stream browser** — search the Radio Browser API by name, country, or genre. Preview a station before adding it. Pick an emoji icon and color theme per station.

## Accessibility

The app was designed for older adults and people with disabilities from the start — accessibility shaped the architecture, not the other way around:

- WCAG AA verified contrast across all eight color palettes plus high-contrast monochrome modes
- Full screen reader support — ARIA roles, labels, and live regions throughout
- Optional text-to-speech that announces playback actions via the Web Speech API
- Audio chimes on play/pause using Web Audio API oscillators
- Haptic feedback on mobile devices
- Keyboard navigation with focus trapping in overlays
- An "Ultra" size mode that scales with viewport dimensions for low vision users
- Simple and Advanced transport modes to control cognitive load

## How it's built

One HTML file. ~3,800 lines of vanilla HTML, CSS, and JavaScript. Zero external dependencies — no frameworks, no CDN links, no package manager. Copy the file to a device, open it in a browser, it works.

A profile system supports branded variants — a build script swaps in custom station lists, logos, and PINs for different deployments. The Lighthouse Center deployment runs as a Docker container. There's also an Android APK build path using Gradle.

## Updates

### 2026-04-26
Shipped and deployed. Next areas to explore: better stream discovery, offline caching via Service Worker for unreliable networks, and a web-based profile editor so other organizations can create branded deployments without touching code.
