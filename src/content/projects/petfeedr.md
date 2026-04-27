---
title: PetFeedr
description: Raspberry Pi automated pet feeder with a PWA web interface, smart scheduling with randomization, and one-command deployment.
status: wip
repo: https://github.com/Minimalistic/PetFeedr
tags: [python, raspberry-pi, iot, flask, pwa]
started: 2025-06-01
updated: 2026-03-22
---

Jason has two ragdoll cats — Frida and Charlie — and the store-bought feeder wasn't cutting it. It ran on four D batteries that needed constant replacing, had a small hopper that ran out too quickly, was lightweight enough that the cats knocked it over (spilling food everywhere because the lid didn't lock), and programming it meant fighting a tiny LCD with terrible button ergonomics.

PetFeedr replaced all of that. It's a Raspberry Pi-powered feeder with a web interface, and it's been running for about two years now.

## What it does

Configurable feeding schedule with portion sizes — small, medium, or large. An optional randomization mode shifts each feeding by up to 30 minutes daily so the cats don't learn the exact schedule.

The web interface shows a visual timeline of today's schedule, a 14-day activity log, and weekly stats with portion tracking. There's a manual feed button for on-demand use. The whole thing installs as a PWA.

## How it's built

Python and Flask on a Raspberry Pi, driving a NEMA 17 stepper motor through a DRV8825 driver. The motor runs at 1/16 microstepping for quiet operation, with an anti-jam agitation cycle that reverses slightly before each dispense. Portion control is calibrated to step count — 100 steps per quarter cup.

The scheduling engine runs as a systemd service that auto-restarts on failure. A deploy script handles SSH-based updates with automatic backups. Runs headless on the local network.

A simulation mode auto-detects missing GPIO and mocks it, so the web interface works on any machine during development.

## Updates

### 2026-04-26
V1 has been running reliably for about two years. Jason is exploring a v2 focused on simplifying the design, reducing cost, and improving the aesthetics.
