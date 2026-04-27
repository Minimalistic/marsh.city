---
title: MealDeck
description: Meal planning with smart grocery grouping, hands-free cook mode, and AI recipe adaptation — in private beta at mealdeck.net.
status: wip
url: https://mealdeck.net
tags: [node, sqlite, express, vanilla-js, claude-api]
started: 2025-01-01
updated: 2026-04-09
---

I cook most nights and I was tired of the weekly cycle: decide what to make, realize I'm missing three ingredients, go to the store, come home with things I already had. MealDeck is the app I wanted — meal planning that actually thinks about the shopping.

## What it does

**Week-to-week meal planning** that looks at what you're already buying. MealDeck groups recipes with overlapping ingredients so grocery runs are smaller and less goes to waste. Plan a week of meals and the shopping list builds itself around shared ingredients.

**Cook mode** turns your device into a hands-free kitchen companion. Step-by-step instructions, one page at a time, controlled entirely by voice — say "next" or "back" to navigate, "ingredients" to check the list. I built this after one too many attempts to tap a phone screen with raw-chicken hands.

**AI recipe adaptation** modifies recipes for dietary needs, ingredient swaps, or serving size changes. Tell it what you need and it adjusts intelligently — not just the ingredient list, but the instructions too.

## How it's built

Node.js and Express on the backend, SQLite for all data, vanilla JavaScript on the frontend. The Anthropic API powers recipe adaptation and natural language recipe import. No frameworks, no build step — the same stack behind most of my projects, chosen for speed and simplicity when building solo.

## What's next

I'm working on better pantry tracking — knowing what's already in the kitchen makes the shopping list smarter. The other missing piece is scaling: cook mode handles one recipe at a time, but real weeknight cooking means juggling two or three things with overlapping timers.
