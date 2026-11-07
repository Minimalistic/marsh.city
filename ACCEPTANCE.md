# Privacy-first page counts

Status: draft

Intent: Anonymous page counts across marsh.city and one host RadioGridXL can send its "Who's this radio for?" answer to, with no cookies, no personal IDs and no stored IP addresses, plus a plain-language note saying what's counted.

## Done when
- [test] Every page built from the site layout sends one count per load to https://marshcity.goatcounter.com carrying only the page path and the referring site's hostname (never the full referrer URL): no query string, hash, title or screen size. No script loads from GoatCounter or any other third party.
- [test] Unhappy path: nothing is sent off the marsh.city hostname (localhost, CI, previews) or when the browser sends Global Privacy Control or Do Not Track, and a blocked or failed count throws nothing and changes nothing on the page.
- [test] Counting sets no cookies and writes nothing to browser storage; the smoke run sends no counting request and its existing console/request checks still pass.
- [smoke] /privacy/ says in plain language what's counted (which page, when, referring site, country, browser and OS name), what isn't (cookies, IDs, IP addresses, anything done inside the apps, what anyone listens to), who counts it (GoatCounter, linked), and what the RadioGridXL question sends. It's linked from the footer and the colophon.
- [test] The privacy page names every outside host the site's own code sends to. If the code gains a new one (a script src, fetch or sendBeacon target) the page doesn't name, the test fails.
- [smoke] A test request in the RadioGridXL shape (`/count?e=true&p=radio-who-for/<answer>/<version>`, sent with sendBeacon) shows up as an event in the GoatCounter dashboard.
- [manual] Jason creates the GoatCounter site, turns off screen-size collection, and sees a real phone visit arrive.

## Out of scope
- Counting the apps under public/ (radio, dungeon, Tavela, ButtonGriddle and the rest), listening, accounts, cookie banners, guide step tracking.
- Any edit to the RadioGridXL repo.
- Self-hosting, DNS records, or any server or Caddy change.
