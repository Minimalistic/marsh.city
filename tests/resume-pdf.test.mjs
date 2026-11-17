// The resume page's Download link hands out one PDF that ships with the
// site (public/Jason-Marsh-Resume.pdf, written by `npm run resume:site`).
// These check that the link and file are there, that the PDF is two pages
// and tagged for screen readers, and that it was regenerated after the last
// resume change. Plain file reads, no browser.
// The link check needs `npm run build` first; `npm test` does both.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_PDF, SITE_PDF_FINGERPRINT, SITE_PDF_INPUTS, resumePdfFingerprint } from '../src/lib/resume-pdf-inputs.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PDF_URL = `/${basename(SITE_PDF)}`
// Chrome writes the catalog, info and page objects uncompressed, so the
// markers below can be read straight from the bytes.
const pdf = readFileSync(join(ROOT, SITE_PDF)).toString('latin1')

test('the resume page links to the PDF and the built site has it', () => {
  const html = readFileSync(join(DIST, 'resume', 'index.html'), 'utf8')
  const link = html.match(/<a class="resume-download"[^>]*>/)?.[0] ?? ''
  assert.match(link, new RegExp(`href="${PDF_URL}"`), 'download link missing or pointing elsewhere')
  assert.match(link, /\sdownload\b/)
  assert.ok(existsSync(join(DIST, basename(SITE_PDF))), `${PDF_URL} missing from dist/`)
})

test('the PDF is two pages', () => {
  assert.equal((pdf.match(/\/Type \/Page\b(?!s)/g) || []).length, 2)
})

test('the PDF is tagged, with a language, a title and the name as its top heading', () => {
  assert.match(pdf, /\/StructTreeRoot /, 'no structure tree: screen readers get untagged text')
  assert.match(pdf, /\/MarkInfo <<[^>]*\/Marked true/)
  assert.match(pdf, /\/Lang \(en\)/)
  // "Resume" as UTF-16BE hex, the way Chrome writes a title with a dash in it
  assert.match(pdf, /\/Title <FEFF0052006500730075006D0065/)
  assert.equal((pdf.match(/\/S \/H1\b/g) || []).length, 1, 'expected exactly one H1 (the name)')
})

test('the PDF was regenerated after the last resume change', () => {
  const recorded = readFileSync(join(ROOT, SITE_PDF_FINGERPRINT), 'utf8').trim()
  assert.equal(recorded, resumePdfFingerprint(ROOT),
    `the resume changed since ${SITE_PDF} was made: run \`npm run resume:site\` and commit the PDF and ${SITE_PDF_FINGERPRINT}`)
})

// Proves the staleness check can fail: touching any one input moves the fingerprint.
test('unhappy path: a change to any input changes the fingerprint', () => {
  const current = resumePdfFingerprint(ROOT)
  for (const changed of SITE_PDF_INPUTS) {
    const read = (path) => {
      const bytes = readFileSync(join(ROOT, path))
      return path === changed ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes
    }
    assert.notEqual(resumePdfFingerprint(ROOT, read), current, `${changed} is not covered`)
  }
})
