// The STAR presenter's practice-run report: durations, pace flags, revisits, report text.
// Plain functions, no browser.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRows, reportText, wordCount, expectedSeconds, clock } from '../public/talks/star-2026/practice.js'

const entry = (at, slide, step, words, label = `S${slide}`) => ({ at, slide, step, steps: 2, label, words })

test('word counts and expected times at 150 words a minute', () => {
  assert.equal(wordCount('  one two\nthree  '), 3)
  assert.equal(wordCount(''), 0)
  assert.equal(expectedSeconds(150), 60)
  assert.equal(expectedSeconds(25), 10)
  assert.equal(clock(75), '1:15')
  assert.equal(clock(-3), '0:00')
})

test('each step lasts until the next change, the last until the run ends', () => {
  const rows = buildRows([entry(0, 1, 0, 25), entry(10_000, 1, 1, 25), entry(22_000, 2, 0, 25)], 30_000)
  assert.deepEqual(rows.map(r => r.seconds), [10, 12, 8])
})

test('flags steps far off the pace, but not small misses on short steps', () => {
  const rows = buildRows([
    entry(0, 1, 0, 50),        // expected 20 s, spent 40 s: long
    entry(40_000, 1, 1, 50),   // expected 20 s, spent 6 s: short
    entry(46_000, 1, 2, 5),    // expected 2 s, spent 5 s: off, but by under 4 s
    entry(51_000, 2, 0, 50),   // expected 20 s, spent 21 s: fine
  ], 72_000)
  assert.deepEqual(rows.map(r => r.flag), ['long', 'short', '', ''])
})

test('going back marks the repeat as a revisit, not a pace problem', () => {
  const rows = buildRows([entry(0, 1, 0, 50), entry(1_000, 1, 1, 50), entry(2_000, 1, 0, 50)], 3_000)
  assert.equal(rows[2].revisit, true)
  assert.equal(rows[2].flag, '')
  assert.match(reportText({ rows, endAt: 3_000, startedAt: new Date(0), audioFile: null }), /went back/)
})

test('report names the audio file, or says there is none', () => {
  const rows = buildRows([entry(0, 1, 0, 25, 'Title')], 10_000)
  const withAudio = reportText({ rows, endAt: 10_000, startedAt: new Date(0), audioFile: 'star-practice-x.webm' })
  assert.match(withAudio, /Audio: star-practice-x\.webm/)
  assert.match(withAudio, /0:00 \| 0:10 \| 0:10 \| 25 \| 1\.0\/2 \| Title \| $/m)
  assert.match(reportText({ rows, endAt: 10_000, startedAt: new Date(0), audioFile: null }), /Audio: none\./)
})

test('unhappy path: a run with no entries still makes a report', () => {
  const text = reportText({ rows: buildRows([], 5_000), endAt: 5_000, startedAt: new Date(0), audioFile: null })
  assert.match(text, /Total 0:05/)
})
