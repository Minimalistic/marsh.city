# marsh.city — house style for Claude

This is Jason Marsh's personal site. The whole premise: **adding content is a conversation, not a CMS.** Jason talks to Claude, Claude edits Markdown, git push, GitHub Actions deploys, done.

## Stack

- Astro (static site generator) with content collections
- Markdown + MDX for all content
- Client-side Mermaid for diagrams (loaded on demand from CDN)
- GitHub Pages hosting on `marsh.city` (custom domain via GoDaddy DNS)
- GitHub Actions deploys on push to `main`

## Repo layout

```
src/
  content/
    projects/    # one .md per project
    posts/       # one .md per blog post
    playground/  # one .md per goofy experiment
  pages/         # routes (mostly auto-generated from collections)
  layouts/       # Base.astro, Post.astro
  styles/        # global.css holds all design tokens
public/
  CNAME          # marsh.city — DO NOT remove
```

## Content conventions

**Adding a project**: create `src/content/projects/<slug>.md` with frontmatter:
```yaml
title: ...
description: one-line pitch
status: idea | wip | shipped | archived
repo: https://github.com/...   # optional
url: https://...               # optional
tags: [tag1, tag2]
started: YYYY-MM-DD
updated: YYYY-MM-DD             # bump when meaningfully edited
```

**Adding a post**: `src/content/posts/<slug>.md` with `title`, `date`, optional `description`, `tags`, `draft`.

**Adding a playground item**: `src/content/playground/<slug>.md` with `title`, `description`, optional `url` (external playable link).

## Diagrams: Mermaid is the house style

When a piece of content benefits from a diagram — architecture, flow, timeline, state machine, sequence — **reach for Mermaid first.** It's rendered client-side and styled to match the monstera palette. Just write a fenced code block:

````
```mermaid
flowchart LR
  A --> B
```
````

Use diagrams when they meaningfully convey information. Don't shoehorn them in.

## Design tokens (monstera vibe)

Cream/forest palette in `src/styles/global.css`. Light + dark mode via `prefers-color-scheme`. Fonts: Fraunces (serif headings), Inter (body), JetBrains Mono (code).

**Do not change layout, navigation, design tokens, or component structure without explicitly asking Jason.** Freely add/edit content.

## DNS — DO NOT TOUCH WITHOUT WARNING

DNS is on GoDaddy. Apple Mail uses MX/TXT records on this domain (iCloud Mail). Web traffic uses A/CNAME records pointing at GitHub Pages. **Never suggest DNS changes without explicitly flagging that MX/TXT records must be left alone.**

## Workflow Jason expects

1. Jason: "add a project for X" / "write a post about Y"
2. Claude: creates the file, commits, pushes
3. GitHub Actions deploys in ~60s

Keep responses brief. Jason knows what he asked for.
