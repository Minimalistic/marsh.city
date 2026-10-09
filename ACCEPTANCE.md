# marsh.city smoke test in CI

Status: approved

Intent: do 3 in CI. A broken page on marsh.city (resume included) fails the deploy instead of reaching the public.

## Done when
- [test] A page linking to an internal path or asset that isn't in the build fails `npm run test:smoke` and names the page and the bad link.
- [test] A page that throws a JS error, logs a console error, or gets a failed or 4xx/5xx same-origin request fails the test.
- [test] The current site passes: all pages, no errors.
- [smoke] In GitHub Actions, a failing smoke test stops the deploy job; a passing one deploys as before.
- [test] Inside the Claude Code sandbox the browser check is reported as skipped with a reason, never hangs, and the link check still runs.

## Out of scope
- Visual or layout regression checks (screenshots, diffs).
- Checking external links or third-party hosts (CDN Mermaid, fonts).
- Any change to site content, layout or design tokens.
- The pre-existing smol-toml advisory (separate dependency PR).
