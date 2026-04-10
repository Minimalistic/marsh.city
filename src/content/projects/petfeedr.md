---
title: PetFeedr
description: Raspberry Pi automated pet feeder with a PWA web interface, smart scheduling with randomization, and one-command deployment.
status: shipped
repo: https://github.com/Minimalistic/PetFeedr
tags: [python, raspberry-pi, iot, flask, pwa]
started: 2025-06-01
updated: 2026-03-22
---

PetFeedr is an automated pet feeder powered by a Raspberry Pi. It dispenses food on a configurable schedule throughout the day, controlled through a polished web interface that works on any device.

## What it does

Set up feeding times with portion sizes — small, medium, or large — and PetFeedr handles the rest. An optional randomization mode shifts each feeding by up to 30 minutes daily so your pet doesn't learn to expect food at the exact same time.

The web interface shows a visual timeline of today's schedule, a 14-day activity log, and weekly stats with portion tracking. There's a manual feed button for on-demand use. The whole thing installs as a PWA, so it feels like a native app on your phone.

## How it's built

Python and Flask on a Raspberry Pi, driving a NEMA 17 stepper motor through a DRV8825 driver. The motor runs at 1/16 microstepping for quiet operation, with an anti-jam agitation cycle that reverses slightly before each dispense. Portion control is calibrated to step count — 100 steps per quarter cup.

The scheduling engine runs as a systemd service that auto-restarts on failure. A deploy script handles SSH-based updates with automatic backups. The whole thing runs headless on the local network.

A simulation mode lets you develop and test without hardware — it auto-detects missing GPIO and mocks it, so the web interface works on any machine.

## Who it's for

Pet owners who want reliable automated feeding with more control than a gravity feeder and less cost than a commercial smart feeder. Also a solid Raspberry Pi project if you like building things.
