// Proves smoke.test.mjs actually fails on a broken site: runs it against
// small fixture sites in tests/fixtures/ and checks the failure names the
// problem. Without this, a smoke test that silently passes everything would
// look the same as a healthy site.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SANDBOXED = Boolean(process.env.SANDBOX_RUNTIME)

function runSmokeAgainst(fixture) {
  const env = { ...process.env, SMOKE_DIST: join(HERE, 'fixtures', fixture) }
  delete env.NODE_TEST_CONTEXT // run as a fresh test process, not a subtest of this one
  return spawnSync(process.execPath, ['--test', join(HERE, 'smoke.test.mjs')], { env, encoding: 'utf8' })
}

test('a broken internal link fails and names the page and the link', () => {
  const result = runSmokeAgainst('broken-link')
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /\/posts\/a\/ -> \/missing-page\//)
})

test('a JS error, a console error and a same-origin 404 each fail by name', { skip: SANDBOXED && 'Claude Code sandbox blocks local ports; CI runs it' }, () => {
  const result = runSmokeAgainst('runtime-errors')
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /JS error: fixture-boom/)
  assert.match(result.stdout, /console: fixture-console/)
  assert.match(result.stdout, /404 http:\/\/127\.0\.0\.1:\d+\/fixture-missing\.png/)
})
