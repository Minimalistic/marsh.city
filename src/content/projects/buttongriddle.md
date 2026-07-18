---
title: ButtonGriddle
description: Visual participation support for tablets - customizable choice boards where tapping a photo button speaks it aloud, with a Yes / No / Not sure check screen. Offline-first, everything stays on the device.
status: wip
url: https://marsh.city/buttongriddle/
tags: [vanilla-js, pwa, indexeddb, assistive-tech]
started: 2026-07-16
updated: 2026-07-18
image: /images/buttongriddle/meals-board.webp
imageAlt: ButtonGriddle Meals board - a 4x2 grid of colored choice buttons with a Check button
---

ButtonGriddle turns a tablet into a set of choice boards - one per context (meals, activities, clothing) - where each button is a photo and a phrase. Tap a button and the tablet speaks it aloud. A Yes / No / Not sure check screen helps staff confirm understanding in the moment.

![The Meals board - a grid of colored choice buttons; tapping one speaks it aloud](/images/buttongriddle/meals-board.webp)

It supports communication, but it isn't an AAC or speech-generating app. The goal is easier participation: fewer spoken directions to process, clearer choices, less guessing on both sides. Whoever supports the person - an OT, SLP, teacher, or family member - builds the boards in a passcode-protected edit mode: photos of the person's actual items, custom phrases, drag-to-arrange grids. Day to day, staff just present choices.

![The Yes / No / Not sure check screen - three large buttons staff use to confirm understanding](/images/buttongriddle/check-screen.webp)

Boards are organized by context, so the tablet opens to a simple list - staff pick the situation, the person picks the choice.

![The board list - Meals, Drinks & Snacks, Activities, and Comfort context boards](/images/buttongriddle/board-list.webp)

## How it's built

Vanilla JavaScript PWA - no framework, no build step, no server, no dependencies. All storage is IndexedDB on the device, including photos; nothing is collected and there's no account. Works fully offline after install. Currently in hands-on field testing with real clients.

[Product page and install instructions →](/buttongriddle/)
