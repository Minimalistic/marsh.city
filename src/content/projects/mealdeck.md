---
title: MealDeck
description: Meal planning with smart grocery grouping, hands-free cook mode, and AI recipe adaptation — in private beta at mealdeck.net.
status: wip
url: https://mealdeck.net
tags: [node, sqlite, express, vanilla-js, claude-api]
started: 2025-01-01
updated: 2026-04-09
---

MealDeck started as Jason exploring what he could build with AI, and grew into something genuinely useful. We built a meal planning app for discovering and sharing recipes, planning meals, and generating smart grocery lists — currently in use with friends and family.

## What it does

**Meal planning** that groups recipes with overlapping ingredients so grocery runs are smaller and less goes to waste. Plan a week of meals and the shopping list builds itself around shared ingredients.

**Cook mode** with voice control — hands-free, step-by-step instructions. Say "next" or "back" to navigate, "ingredients" to check the list.

**AI recipe adaptation** modifies recipes for dietary needs, ingredient swaps, or serving size changes. The Anthropic API adjusts both the ingredient list and the instructions.

**Sharing** — find and share recipes with friends and family, explore what other people are cooking.

## How it's built

Node.js and Express, SQLite, vanilla JavaScript on the frontend. The Anthropic API powers recipe adaptation and natural language recipe import. No frameworks, no build step.

## Updates

### 2026-04-26
In active use with friends and family. Continuing to test and explore ways to improve it further.
