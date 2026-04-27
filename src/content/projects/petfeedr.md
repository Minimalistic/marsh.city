---
title: PetFeedr
description: Raspberry Pi automated pet feeder with a PWA web interface, smart scheduling with randomization, and one-command deployment.
status: wip
repo: https://github.com/Minimalistic/PetFeedr
tags: [python, raspberry-pi, iot, flask, pwa]
started: 2025-06-01
updated: 2026-03-22
---

I have two cats who believe they're starving at all times. Commercial smart feeders exist, but the ones I looked at either required a cloud account, had flimsy dispensing mechanisms, or cost more than the Raspberry Pi I already had sitting in a drawer.

PetFeedr dispenses food on a configurable schedule throughout the day, controlled through a web interface that works on any device. Set up feeding times with portion sizes — small, medium, or large — and it handles the rest.

## What it does

An optional randomization mode shifts each feeding by up to 30 minutes daily so the cats don't learn to expect food at the exact same time (they were starting to stage protests at the feeder five minutes early).

The web interface shows a visual timeline of today's schedule, a 14-day activity log, and weekly stats with portion tracking. There's a manual feed button for on-demand use. The whole thing installs as a PWA, so it feels like a native app on my phone.

## How it's built

Python and Flask on a Raspberry Pi, driving a NEMA 17 stepper motor through a DRV8825 driver. The motor runs at 1/16 microstepping for quiet operation, with an anti-jam agitation cycle that reverses slightly before each dispense. Portion control is calibrated to step count — 100 steps per quarter cup.

The scheduling engine runs as a systemd service that auto-restarts on failure. A deploy script handles SSH-based updates with automatic backups. The whole thing runs headless on the local network.

A simulation mode auto-detects missing GPIO and mocks it, so the web interface works on any machine during development. I built most of the UI on my laptop without the Pi connected.

## What's next

I want to add a weight sensor under the bowl to track actual consumption — right now I know how much was dispensed but not how much was eaten. That data would catch early signs of appetite changes, which matters for pet health.
