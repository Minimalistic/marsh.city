// The resume prints on two pages, in Chrome and in Safari.
// Safari prints web pages about 7% larger than Chrome does (WebKit lays the
// page out at 1.25x the paper width and shrinks it to fit, where Chrome maps
// 96 CSS px to the inch), so a resume that fits in Chrome can spill a line
// or two onto a third page in Safari. Chromium printing at SAFARI_SCALE lands
// within a point of a real WebKit print, so CI can check both without Safari.
// Needs `npm run build` first; `npm test` does both.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }
const MAX_PAGES = 2
const SAFARI_SCALE = 1.0667
// Same reason as smoke.test.mjs: the Claude Code sandbox forbids local ports.
const SANDBOXED = Boolean(process.env.SANDBOX_RUNTIME)
const skip = SANDBOXED && 'Claude Code sandbox blocks local ports; rerun unsandboxed (CI runs it)'

let server, origin, browser

before(async () => {
  if (SANDBOXED) return
  server = createServer((req, res) => {
    const path = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    const file = path.startsWith(DIST) && [path, join(path, 'index.html')].find((p) => existsSync(p) && statSync(p).isFile())
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  server?.close()
})

// Chrome writes one uncompressed "/Type /Page" object per page.
function pageCount(pdf) {
  return (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) || []).length
}

async function printedPages(scale, extraCss) {
  const page = await browser.newPage()
  // Web fonts are aborted so the run is deterministic and a font outage can't
  // fail it. Body text prints in Helvetica either way; only headings fall back.
  await page.route((url) => !url.href.startsWith(origin), (route) => route.abort())
  await page.goto(`${origin}/resume/`, { waitUntil: 'load' })
  if (extraCss) await page.addStyleTag({ content: extraCss })
  const pdf = await page.pdf({ scale, preferCSSPageSize: true })
  await page.close()
  return pageCount(pdf)
}

test(`resume prints on ${MAX_PAGES} pages in Chrome`, { skip }, async () => {
  assert.equal(await printedPages(1), MAX_PAGES)
})

test(`resume prints on ${MAX_PAGES} pages at Safari's print size`, { skip }, async () => {
  const pages = await printedPages(SAFARI_SCALE)
  assert.equal(pages, MAX_PAGES, `${pages} pages at Safari's scale: shorten the resume or tighten the print styles in src/styles/resume.css`)
})

// Proves the count can fail: a resume that is too long must come out over the limit.
test('an overlong resume is counted as more than two pages', { skip }, async () => {
  const pages = await printedPages(SAFARI_SCALE, '@media print { .resume-entry li { font-size: 12pt !important; } }')
  assert.ok(pages > MAX_PAGES, `expected more than ${MAX_PAGES} pages, got ${pages}`)
})
