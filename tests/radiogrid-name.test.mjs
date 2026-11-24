// RadioGrid was called RadioGridXL until v7.24.0 (2026-11-14). The pages that
// describe the app as it is today use the new name; older writing keeps the
// name it had; and every address installed radios and old links use still
// resolves, since GitHub Pages can't redirect. Runs over the built site.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const page = (path) => readFileSync(join(DIST, path, 'index.html'), 'utf-8')
const text = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
const skip = !existsSync(join(DIST, 'index.html')) && 'run `npm run build` first'

test('the project page calls the app RadioGrid, with an Updates entry for the rename', { skip }, () => {
  const html = page('projects/radiogridxl')
  assert.match(html, /<h1[^>]*>\s*RadioGrid\s*</)
  assert.match(html, /<title>RadioGrid\b/)
  assert.match(html, /Released v7\.24\.0: the app is now called RadioGrid/)
  // Above the Updates, the page describes the app today; the one mention
  // left there is the built file's name in the pipeline diagram.
  const today = text(html.split(/id="updates"/)[0])
  assert.deepEqual(today.match(/RadioGridXL(?!\.html)/g), null)
})

test('the Now page, résumé and homepage showcase say RadioGrid', { skip }, () => {
  assert.match(page('now'), /href="\/projects\/radiogridxl\/"[^>]*>RadioGrid</)
  assert.match(text(page('resume')), /RadioGrid\b/)
  assert.doesNotMatch(text(page('resume')), /RadioGridXL/)
  const card = page('').match(/<a class="showcase-card" href="\/projects\/radiogridxl\/"[\s\S]*?<\/a>/)
  assert.ok(card, 'the homepage still shows the radio')
  assert.match(card[0], /class="showcase-title"[^>]*>RadioGrid</)
})

test('the old /radio.html forwarding page uses the new name', { skip }, () => {
  const stub = readFileSync(join(DIST, 'radio.html'), 'utf-8')
  assert.match(stub, /<title>RadioGrid moved<\/title>/)
  assert.doesNotMatch(stub, /RadioGridXL/)
})

test('older writing keeps the name it had — unhappy path', { skip }, () => {
  assert.match(page('posts/building-radiogridxl'), /RadioGridXL/)
  const updates = page('projects/radiogridxl').split(/id="updates"/)[1]
  assert.match(updates, /Released v7\.23\.0/, 'earlier entries stay')
})

test('every address already out there still resolves', { skip }, () => {
  for (const path of ['radio', 'radio/feedback', 'projects/radiogridxl', 'projects/radiogridxl/guide', 'embed/guides/radiogridxl']) {
    assert.ok(existsSync(join(DIST, path, 'index.html')), `/${path}/`)
  }
})
