---
title: ButtonGriddle
description: Visual participation support for tablets - customizable choice boards where tapping a photo button speaks it aloud, with a Yes / No / Not sure check screen. Offline-first, everything stays on the device.
status: wip
url: https://marsh.city/buttongriddle/
tags: [vanilla-js, pwa, indexeddb, assistive-tech]
started: 2026-07-16
updated: 2026-07-18
---

ButtonGriddle turns a tablet into a set of choice boards - one per context (meals, activities, clothing) - where each button is a photo and a phrase. Tap a button and the tablet speaks it aloud. A Yes / No / Not sure check screen helps staff confirm understanding in the moment.

It supports communication, but it isn't an AAC or speech-generating app. The goal is easier participation: fewer spoken directions to process, clearer choices, less guessing on both sides. Whoever supports the person - an OT, SLP, teacher, or family member - builds the boards in a passcode-protected edit mode: photos of the person's actual items, custom phrases, drag-to-arrange grids. Day to day, staff just present choices.

## How it's built

Vanilla JavaScript PWA - no framework, no build step, no server, no dependencies. All storage is IndexedDB on the device, including photos; nothing is collected and there's no account. Works fully offline after install. Currently in hands-on field testing with real clients.

[Product page and install instructions →](/buttongriddle/)
