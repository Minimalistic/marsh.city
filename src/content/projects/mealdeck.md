---
title: MealDeck
description: Meal planning with smart grocery grouping, hands-free cook mode, and AI recipe adaptation — in private beta at mealdeck.net.
status: wip
url: https://mealdeck.net
tags: [node, sqlite, express, vanilla-js, claude-api]
started: 2025-01-01
updated: 2026-04-09
---

MealDeck is a meal planning app built around how people actually cook — not just what they cook. It handles the planning, the shopping, and the cooking itself.

## What it does

**Week-to-week meal planning** that looks at what you're already buying. MealDeck groups recipes with overlapping ingredients so your grocery runs are smaller and less goes to waste. Plan a week of meals and the shopping list builds itself around shared ingredients.

**Cook mode** turns your device into a hands-free kitchen companion. Step-by-step instructions, one page at a time, controlled entirely by voice — say "next" or "back" to navigate, "ingredients" to check the list. No touching your phone with raw-chicken hands.

**AI recipe adaptation** lets you modify recipes for dietary needs, ingredient swaps, or serving size changes. Tell it what you need and it adjusts the recipe intelligently — not just the ingredient list, but the instructions too.

## How it's built

Node.js and Express on the backend, SQLite for all data persistence, vanilla JavaScript on the frontend. The Anthropic API powers recipe adaptation and natural language recipe import. No frameworks, no build step — the same stack behind many of my projects, chosen for speed and simplicity when building solo.

## Who it's for

Anyone who cooks regularly and wants to spend less time planning and more time cooking — especially if you're feeding a household, managing a budget, or dealing with dietary constraints.
