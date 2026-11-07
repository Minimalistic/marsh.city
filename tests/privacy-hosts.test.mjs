// /privacy/ must name every outside host the site's own code sends to. If a
// script, image or frame from a new host lands on a site page, or a site script
// gains a new https:// target, this fails until the page names it (or the
// host goes). That's how the Cloudflare beacon slipped in unnoticed in April.
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
  const note = (hosts, file) => { for (const h of hosts) if (!OWN.has(h) && !found.has(h)) found.set(h, file) }
  for (const file of files(DIST, (n) => n.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8')
    if (html.includes('class="site-foot"')) note(hostsLoadedBy(html), file) // built from the site layout
  }
  const scripts = [
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
