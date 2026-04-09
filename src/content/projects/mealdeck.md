---
title: MealDeck
description: Recipe intelligence and meal planning with dietary adaptation — now in private beta.
status: wip
url: https://mealdeck.net
tags: [node, sqlite, express, vanilla-js, claude-api]
started: 2025-01-01
updated: 2026-04-09
---

MealDeck is a recipe intelligence platform that goes beyond storing recipes. It understands ingredients, dietary constraints, and substitutions — so you can adapt what you cook to what you need.

## What it does

MealDeck ingests recipes and breaks them down into structured data: ingredients, quantities, steps, timing. From there, it can adapt recipes to dietary requirements — allergies, medical diets, ingredient availability — by finding appropriate substitutions and rewriting the affected steps so the recipe still makes sense.

The substitution engine doesn't guess. It uses a deterministic lookup for dietary classifications where accuracy matters, with AI-assisted rewriting only where flexibility helps — like adjusting cooking instructions when you swap one protein for another.

## How it's built

Node.js and Express on the backend, SQLite for all data persistence, vanilla JavaScript on the frontend. The Anthropic API handles recipe step rewriting during substitutions and natural language recipe import. No frameworks, no build step — the same stack I use across all my projects, chosen for speed and simplicity when building solo.

## Who it's for

Anyone who cooks regularly and deals with dietary constraints — whether that's managing a medical diet, cooking for a household with mixed needs, or just trying to use what's already in the fridge.
