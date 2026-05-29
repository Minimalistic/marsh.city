---
title: marsh.city
description: A personal site where adding content is a conversation, not a CMS.
status: shipped
repo: https://github.com/Minimalistic/marsh.city
url: https://marsh.city
tags: [astro, markdown, github-actions, pwa]
started: 2026-03-01
updated: 2026-04-30
---

I needed a central place to point people - a resume that stays current, project pages that show what I'm actually building, and posts when something's worth writing about. The problem with most personal sites is maintenance. They launch polished and rot within months because updating them feels like work on top of work.

I solved that by making the whole site conversational. I describe a change to Claude Code in the terminal, it edits the Markdown, git push, GitHub Actions deploys. There's no CMS login, no admin panel, no template wrangling. Adding a project page takes about as long as describing the project out loud.

## How it works

The site is built with Astro - static generation from Markdown content collections. Each project, post, and playground item is a single `.md` file with frontmatter. The build produces plain HTML and deploys to GitHub Pages on every push to `main`.

Content lives in `src/content/` organized by type. When I finish a work session on any project, I talk through what happened with Claude Code in the terminal and update the relevant pages in the same conversation. The site stays current because updating it has almost zero friction.

## Design

The visual language is built around a monstera/forest palette - cream and deep greens in light mode, dark canopy tones at night. Lora for headings, Inter for body text. Dark mode gets a starfield with occasional shooting stars and fireflies that drift and scatter from the cursor.

Mermaid diagrams render client-side when a page needs them. Images open in a lightbox with pinch-to-zoom. A command palette (Cmd+K) lets you jump to any page instantly. All of it runs without a build step on the frontend - vanilla JS, no framework.

## The workflow

The site doubles as a journal. At the start of each session, Claude Code checks recent GitHub activity across my projects, surfaces what's changed, and offers to update project pages or draft posts based on the conversation. It's less "content management" and more "ongoing documentation that happens naturally."

This means the site reflects what I'm actually working on at any given time, not what I remembered to write up six months later.
