# marsh.city

Source for [marsh.city](https://marsh.city), Jason Marsh's personal site: projects, posts, a playground of small experiments, art series and a resume.

## How it's built

- [Astro](https://astro.build) generates static HTML from Markdown content collections.
- The frontend is vanilla JavaScript and one stylesheet, `src/styles/global.css`.
- GitHub Actions builds the site, runs the smoke tests and deploys to GitHub Pages on every push to `main`.

The [colophon](https://marsh.city/oak/) covers how the content gets written, and the [privacy page](https://marsh.city/privacy/) says what the site counts.

## Layout

```text
src/
  content/     one Markdown file per project, post, playground item, art series and guide
  pages/       routes, mostly generated from the collections
  layouts/     Base.astro and Post.astro
  scripts/     browser scripts: theme, command palette, lightbox, the night sky
  styles/      global.css holds the design tokens
public/        static assets, plus standalone apps served as-is (radio, dungeon, driftglass, particul8, buttongriddle)
plugins/       build-time image work: placeholders, thumbnails, sizes
scripts/       maintenance scripts run by hand
tests/         node:test smoke tests against the built site
```

Some apps under `public/` are built in their own repos and synced in.

## Commands

Needs Node 22.12 or newer.

| Command | What it does |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm test` | Build, then run the smoke tests |
