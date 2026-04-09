---
title: marsh.city
description: This very website — a cozy forest home for projects, writing, and experiments.
status: wip
repo: https://github.com/Minimalistic/marsh.city
url: https://marsh.city
tags: [astro, web, personal]
started: 2026-04-08
updated: 2026-04-08
---

The site you're reading right now. Built with [Astro](https://astro.build), deployed via GitHub Pages, designed to feel like a quiet reading nook in a forest of monstera leaves.

## How it works

```mermaid
flowchart LR
  idea(Idea) --> claude(Claude Code) --> draft(Draft) --> review("Review & Revise") --> push(git push) --> actions(GitHub Actions) --> live(marsh.city)

  style idea fill:#2d5016,color:#fff,stroke:none
  style claude fill:#2d5016,color:#fff,stroke:none
  style draft fill:#5c4a35,color:#fff,stroke:none
  style review fill:#5c4a35,color:#fff,stroke:none
  style push fill:#5c4a35,color:#fff,stroke:none
  style actions fill:#5c4a35,color:#fff,stroke:none
  style live fill:#7ba05b,color:#fff,stroke:none
```

Adding content is a conversation, not a CMS. I describe what I want, Claude writes the Markdown, and a push to `main` deploys in under a minute.

## Stack

- **Astro** — static site generator with content collections
- **GitHub Pages** — free hosting on a custom domain
- **Mermaid** — diagrams as code, rendered client-side
- **GoDaddy DNS** — pointing `marsh.city` at GitHub Pages, Apple Mail via iCloud untouched
