// /privacy/ must name every outside host the site's own code sends to. If a
// script, image or frame from a new host lands on a site page, or a site script
// gains a new https:// target (src/scripts, top-level public/*.js, Astro's
// bundles, inline page/MDX scripts), this fails until the page names it (or the
// host goes). A host assembled from pieces at runtime would still slip by. That's how the Cloudflare beacon slipped in unnoticed in April.
// Apps under public/ (radio, dungeon, Tavela...) aren't site pages and aren't scanned.
// Needs `npm run build` first; `npm test` does both.
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(root, 'dist')
const OWN = new Set(['marsh.city', 'www.marsh.city'])
// XML namespace identifiers look like URLs but are never fetched.
const NOT_FETCHED = new Set(['www.w3.org'])

// Bodies of executable inline <script>s (page and MDX scripts, is:inline).
// JSON-LD and JSON data blocks are skipped: they hold links, not requests.
export function inlineScripts(html) {
  return [...html.matchAll(/<script\b(?![^>]*\stype=["'](?:application\/(?:ld\+)?json|importmap)["'])[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1])
}

// Elements that make the browser fetch something on load. Plain <a href> links don't.
const LOADS = /<(script|img|iframe|source|video|audio|embed)\b[^>]*?\ssrc=["'](https?:)?\/\/([^/"']+)|<link\b(?=[^>]*\srel=["'](?:stylesheet|preload|modulepreload|preconnect|icon|manifest)["'])[^>]*?\shref=["'](https?:)?\/\/([^/"']+)/gi
export function hostsLoadedBy(html) {
  const hosts = new Set()
  for (const m of html.matchAll(LOADS)) hosts.add((m[3] ?? m[5]).toLowerCase())
  return hosts
}

// Every https:// host written into a site script. Site scripts hold no plain
// links, so any host there is something the script fetches or loads.
export function hostsInScript(source) {
  return new Set([...source.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => m[1].toLowerCase()))
}

function files(dir, keep) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && keep(e.name))
    .map((e) => join(e.parentPath, e.name))
}

function outsideHosts() {
  const found = new Map() // host -> first file it showed up in
  const note = (hosts, file) => { for (const h of hosts) if (!OWN.has(h) && !NOT_FETCHED.has(h) && !found.has(h)) found.set(h, file) }
  for (const file of files(DIST, (n) => n.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8')
    if (!html.includes('class="site-foot"')) continue // only pages built from the site layout
    note(hostsLoadedBy(html), file)
    for (const body of inlineScripts(html)) note(hostsInScript(body), file)
  }
  const scripts = [
    // Astro's bundles of the site's own scripts (page and component <script>s included).
    ...files(join(DIST, '_astro'), (n) => n.endsWith('.js')),
    ...files(join(root, 'src', 'scripts'), (n) => n.endsWith('.js')),
    ...readdirSync(join(root, 'public')).filter((n) => n.endsWith('.js')).map((n) => join(root, 'public', n)),
  ]
  for (const file of scripts) note(hostsInScript(readFileSync(file, 'utf8')), file)
  return found
}

const built = existsSync(join(DIST, 'privacy', 'index.html'))

test('the privacy page names every outside host the site sends to', { skip: !built && 'run `npm run build` first' }, () => {
  const privacy = readFileSync(join(DIST, 'privacy', 'index.html'), 'utf8')
  const found = outsideHosts()
  assert.ok(found.has('marshcity.goatcounter.com'), 'the scan should see the page counter')
  const unnamed = [...found].filter(([host]) => !privacy.includes(host)).map(([host, file]) => `${host} (${file.replace(root + '/', '')})`)
  assert.deepEqual(unnamed, [], `name these on /privacy/ or remove them:\n${unnamed.join('\n')}`)
})

test('unhappy path: an unnamed third-party script is caught, plain links are not', () => {
  const html = `
    <a href="https://www.linkedin.com/in/x">linkedin</a>
    <script defer src='https://static.cloudflareinsights.com/beacon.min.js'></script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
    <link rel="canonical" href="https://marsh.city/">
    <img src="//images.example.net/a.png" alt="">`
  assert.deepEqual([...hostsLoadedBy(html)].sort(), ['fonts.googleapis.com', 'images.example.net', 'static.cloudflareinsights.com'])
  assert.deepEqual([...hostsInScript("s.src = 'https://cdn.jsdelivr.net/npm/x@1.0.0/x.js'")], ['cdn.jsdelivr.net'])
})

test('unhappy path: a fetch in an inline page script is caught, JSON-LD links are not', () => {
  const html = `
    <script type="application/ld+json">{"sameAs":["https://github.com/x"]}</script>
    <script>fetch('https://api.newtracker.io/hit')</script>
    <script type="module">import('https://esm.example.dev/a.js')</script>`
  const hosts = inlineScripts(html).flatMap((body) => [...hostsInScript(body)])
  assert.deepEqual(hosts.sort(), ['api.newtracker.io', 'esm.example.dev'])
})
