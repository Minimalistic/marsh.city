// The page counter (src/scripts/count.js) sends only what /privacy/ says:
// the path and the referring site's hostname, only on marsh.city, never when
// the browser asks not to be tracked, and it never throws.
import test from 'node:test'
import assert from 'node:assert/strict'
import { countUrl, referringSite, sendCount, shouldCount, COUNT_HOST } from '../src/scripts/count.js'

function fakeWindow({ href = 'https://marsh.city/posts/hello/?utm_source=x#top', referrer = '', nav = {} } = {}) {
  const sent = []
  const url = new URL(href)
  const win = {
    location: { hostname: url.hostname, pathname: url.pathname },
    document: { referrer },
    navigator: { sendBeacon: (u) => { sent.push(u); return true }, ...nav },
  }
  return { win, sent }
}

test('sends one count with only the path: no query string, hash, title or screen size', () => {
  const { win, sent } = fakeWindow()
  assert.equal(sendCount(win), true)
  assert.equal(sent.length, 1)
  const url = new URL(sent[0])
  assert.equal(url.origin, COUNT_HOST)
  assert.equal(url.pathname, '/count')
  assert.deepEqual([...url.searchParams.keys()], ['p'])
  assert.equal(url.searchParams.get('p'), '/posts/hello/')
})

test('the referrer is cut down to the referring site', () => {
  const { win, sent } = fakeWindow({ referrer: 'https://www.linkedin.com/feed/update/urn:li:activity:123?trk=abc' })
  sendCount(win)
  const url = new URL(sent[0])
  assert.deepEqual([...url.searchParams.keys()].sort(), ['p', 'r'])
  assert.equal(url.searchParams.get('r'), 'https://www.linkedin.com')
})

test('internal clicks, direct visits and odd referrers send no referrer', () => {
  assert.equal(referringSite('https://marsh.city/projects/', 'marsh.city'), '')
  assert.equal(referringSite('', 'marsh.city'), '')
  assert.equal(referringSite('android-app://com.slack/', 'marsh.city'), '')
  assert.equal(referringSite('not a url', 'marsh.city'), '')
  assert.equal(new URL(countUrl({ pathname: '/', referrer: '', hostname: 'marsh.city' })).searchParams.has('r'), false)
})

test('nothing is sent off the marsh.city hostname', () => {
  for (const href of ['http://localhost:4321/', 'http://127.0.0.1:8080/about/', 'https://www.marsh.city/', 'https://minimalistic.github.io/marsh.city/']) {
    const { win, sent } = fakeWindow({ href })
    assert.equal(sendCount(win), false, href)
    assert.equal(sent.length, 0, href)
  }
})

test('Global Privacy Control and Do Not Track are honoured', () => {
  for (const nav of [{ globalPrivacyControl: true }, { doNotTrack: '1' }, { doNotTrack: 'yes' }]) {
    const { win, sent } = fakeWindow({ nav })
    assert.equal(sendCount(win), false, JSON.stringify(nav))
    assert.equal(sent.length, 0)
  }
  // Older Safari/Edge expose it on window instead of navigator.
  const { win, sent } = fakeWindow()
  win.doNotTrack = '1'
  assert.equal(sendCount(win), false)
  assert.equal(sent.length, 0)
  assert.equal(shouldCount({ hostname: 'marsh.city', globalPrivacyControl: false, doNotTrack: '0' }), true)
})

test('unhappy path: a blocked, missing or throwing sendBeacon never throws', (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  const blocked = fakeWindow({ nav: { sendBeacon: () => false } })
  assert.equal(sendCount(blocked.win), false)

  const missing = fakeWindow({ nav: { sendBeacon: undefined } })
  assert.equal(sendCount(missing.win), false)

  const throwing = fakeWindow({ nav: { sendBeacon: () => { throw new TypeError('Refused by CSP') } } })
  assert.doesNotThrow(() => sendCount(throwing.win))
  assert.equal(sendCount(throwing.win), false)
  assert.ok(warn.mock.calls.length >= 1, 'a failure is reported, not swallowed')
})

test('counting touches no cookies or storage', () => {
  const { win } = fakeWindow()
  const touched = []
  const trap = (name) => new Proxy({}, { get: () => { touched.push(name) } })
  win.document = new Proxy({ referrer: '' }, {
    get: (target, key) => { if (key === 'cookie') touched.push('cookie'); return target[key] },
  })
  win.localStorage = trap('localStorage')
  win.sessionStorage = trap('sessionStorage')
  sendCount(win)
  assert.deepEqual(touched, [])
})
