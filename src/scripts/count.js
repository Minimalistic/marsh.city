// Page counter: one anonymous GoatCounter hit per page load, carrying only the
// page path and the referring site's hostname. Hand-rolled instead of loading
// GoatCounter's count.js, so no third-party code runs on the marsh.city origin
// that radio, Tavela and ButtonGriddle share. What this sends is what /privacy/
// says; tests/count.test.mjs and tests/privacy-hosts.test.mjs hold both to it.

export const COUNT_HOST = 'https://marshcity.goatcounter.com'
const SITE_HOSTNAME = 'marsh.city'

// Off the real site (localhost, CI, previews) nothing is sent, and a browser
// asking not to be tracked (Global Privacy Control or Do Not Track) isn't counted.
export function shouldCount({ hostname, globalPrivacyControl, doNotTrack }) {
  if (hostname !== SITE_HOSTNAME) return false
  if (globalPrivacyControl === true) return false
  if (doNotTrack === '1' || doNotTrack === 'yes') return false
  return true
}

// The referring site as https://<hostname>, never its path or query.
// Empty for direct visits, internal clicks and anything that isn't http(s).
export function referringSite(referrer, ownHostname) {
  let url
  try {
    url = new URL(referrer)
  } catch {
    return ''
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
  if (url.hostname === ownHostname) return ''
  return `https://${url.hostname}`
}

export function countUrl({ pathname, referrer, hostname }) {
  const params = new URLSearchParams({ p: pathname })
  const site = referringSite(referrer, hostname)
  if (site) params.set('r', site)
  return `${COUNT_HOST}/count?${params}`
}

// sendBeacon: fire-and-forget, sends no cookies to marsh.city, survives the
// page unloading, and a blocked or offline send just returns false.
export function sendCount(win) {
  try {
    const { location, navigator: nav, document: doc } = win
    const asked = {
      hostname: location.hostname,
      globalPrivacyControl: nav.globalPrivacyControl,
      doNotTrack: nav.doNotTrack ?? win.doNotTrack,
    }
    if (!shouldCount(asked)) return false
    if (typeof nav.sendBeacon !== 'function') return false
    return nav.sendBeacon(countUrl({ pathname: location.pathname, referrer: doc.referrer, hostname: location.hostname }))
  } catch (err) {
    // A count is never worth breaking the page over; say why and move on.
    console.warn('[count] page count not sent:', err)
    return false
  }
}

if (typeof window !== 'undefined') sendCount(window)
