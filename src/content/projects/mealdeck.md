---
title: MealDeck
description: Meal planning with smart grocery grouping, hands-free cook mode, and AI recipe adaptation — in private beta at mealdeck.net.
status: wip
url: https://mealdeck.net
tags: [node, sqlite, express, vanilla-js, claude-api]
started: 2025-01-01
updated: 2026-04-09
---

MealDeck started as Jason seeing what he could get AI to do, and kept growing from there. We built a meal planning app for discovering and sharing recipes, planning meals, and generating grocery lists - currently in use with friends and family.

![MealDeck landing page showing the recipe mosaic and waitlist call-to-action](/images/mealdeck/landing.webp)

## What it does

**Meal planning** that groups recipes with overlapping ingredients so grocery runs are smaller and less goes to waste. Plan a week of meals and the shopping list builds itself around shared ingredients.

![MealDeck weekly meal plan view with month headers, holiday tags, and shopping list access](/images/mealdeck/meal-plan.webp)

**Cook mode** with voice control - hands-free, step-by-step instructions. Say "next" or "back" to navigate, "ingredients" to check the list.

![MealDeck recipe detail showing ingredients, cook mode button, and serving adjustment](/images/mealdeck/recipe-detail.webp)

**AI recipe adaptation** modifies recipes for dietary needs, ingredient swaps, or serving size changes. The Anthropic API adjusts both the ingredient list and the instructions.

**Sharing** - find and share recipes with friends and family, explore what other people are cooking.

![MealDeck recipe collection with featured carousel and new additions](/images/mealdeck/recipes.webp)

## How it's built

Node.js and Express, SQLite, vanilla JavaScript on the frontend. The Anthropic API powers recipe adaptation and natural language recipe import. No frameworks, no build step.

## Updates

### 2026-04-26
In active use with friends and family.
