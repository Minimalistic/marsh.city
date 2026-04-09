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
flowchart TD
  subgraph conversation [" ✦ Conversation "]
    direction LR
    idea["💡 Idea"]
    claude["🤖 Claude Code"]
    idea --> claude
  end

  subgraph pipeline [" ⚙ Pipeline "]
    direction LR
    md["📄 Markdown"]
    git["📦 git push"]
    actions["🔧 GitHub Actions"]
    md --> git --> actions
  end

  subgraph deploy [" 🌿 Live "]
    site["marsh.city"]
  end

  conversation --> pipeline --> deploy
```

Adding content is a conversation, not a CMS. I describe what I want, Claude writes the Markdown, and a push to `main` deploys in under a minute.

## Stack

- **Astro** — static site generator with content collections
- **GitHub Pages** — free hosting on a custom domain
- **Mermaid** — diagrams as code, rendered client-side
- **GoDaddy DNS** — pointing `marsh.city` at GitHub Pages, Apple Mail via iCloud untouched
