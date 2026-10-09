// Smoke test over the built site (dist/), run in CI between build and deploy.
//   1. Every internal link, image, script and stylesheet in every page points
//      at a file that exists in dist/. Plain file checks, no browser.
//   2. Every page loads in Chromium with no JS errors, no console errors and
//      no failed same-origin requests. External hosts (CDN Mermaid, fonts)
//      are blocked during the check: their outages shouldn't block a deploy.
// Needs `npm run build` first; `npm test` does both.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, dirname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// SMOKE_DIST lets smoke-fixtures.test.mjs point this at a deliberately broken site.
const DIST = process.env.SMOKE_DIST ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
  '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json',
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(path)
    return entry.name.endsWith('.html') ? [path] : []
  })
}

// URL path for a built page: dist/posts/x/index.html -> /posts/x/
function urlPathFor(file) {
  const rel = relative(DIST, file).split(sep).join('/')
  return '/' + rel.replace(/(^|\/)index\.html$/, '$1')
}

// GitHub Pages resolution: exact file, then dir/index.html, then path.html.
export function resolveInDist(urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0])
  const base = join(DIST, clean)
  if (!base.startsWith(DIST)) return null
  for (const candidate of [base, join(base, 'index.html'), `${base}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i

export function internalRefs(html) {
  const refs = new Set()
  for (const [, , value] of html.matchAll(/\s(href|src)=["']([^"']+)["']/g)) refs.add(value)
  for (const [, value] of html.matchAll(/\ssrcset=["']([^"']+)["']/g)) {
    for (const candidate of value.split(',')) refs.add(candidate.trim().split(/\s+/)[0])
  }
  return [...refs].filter((ref) => ref && !EXTERNAL.test(ref))
}

const pages = existsSync(DIST) ? htmlFiles(DIST) : []
// Claude Code's macOS sandbox sets SANDBOX_RUNTIME and forbids binding a
// local port, so the browser check skips there (and says so). The link check
// still runs. CI and unsandboxed runs are unaffected.
const SANDBOXED = Boolean(process.env.SANDBOX_RUNTIME)

test('dist/ exists and has pages (run `npm run build` first)', () => {
  assert.ok(pages.length > 0, `no HTML in ${DIST}`)
})

test('every internal link and asset resolves', () => {
  const broken = []
  for (const file of pages) {
    const pageUrl = new URL(urlPathFor(file), 'http://site.test')
    for (const ref of internalRefs(readFileSync(file, 'utf8'))) {
      const target = new URL(ref.replaceAll('&amp;', '&'), pageUrl)
      if (!resolveInDist(target.pathname)) broken.push(`${pageUrl.pathname} -> ${ref}`)
    }
  }
  assert.deepEqual(broken, [], `broken internal refs:\n${broken.join('\n')}`)
})

let server, origin, browser

before(async () => {
  if (!pages.length || SANDBOXED) return
  server = createServer((req, res) => {
    const file = resolveInDist(new URL(req.url, 'http://x').pathname)
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  // Reject on listen errors (EPERM, EADDRINUSE); otherwise the test hangs.
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  server?.close()
})

const browserSkip = SANDBOXED && 'Claude Code sandbox blocks local ports; rerun unsandboxed (CI runs it)'

test('every page loads without JS errors or failed same-origin requests', { skip: browserSkip }, async () => {
  const problems = []
  const sameOrigin = (url) => url.startsWith(origin)
  for (const file of pages) {
    const path = urlPathFor(file)
    const page = await browser.newPage()
    // Third-party hosts are aborted, not fetched: a CDN or font outage can't
    // hang `load` and block a deploy, and the run is deterministic.
    await page.route((url) => !sameOrigin(url.href), (route) => route.abort())
    page.on('pageerror', (err) => problems.push(`${path}: JS error: ${err.message}`))
    page.on('console', (msg) => {
      const source = msg.location().url
      if (msg.type() === 'error' && (!source || sameOrigin(source))) problems.push(`${path}: console: ${msg.text()}`)
    })
    page.on('requestfailed', (req) => {
      if (sameOrigin(req.url())) problems.push(`${path}: failed: ${req.url()}`)
    })
    page.on('response', (res) => {
      if (sameOrigin(res.url()) && res.status() >= 400) problems.push(`${path}: ${res.status()} ${res.url()}`)
    })
    await page.goto(origin + path, { waitUntil: 'load' })
    // Catch errors from requests and scripts that finish after `load`.
    await page.waitForLoadState('networkidle')
    await page.close()
  }
  assert.deepEqual(problems, [], problems.join('\n'))
})
