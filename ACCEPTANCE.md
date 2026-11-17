# Resume PDF download

Status: shipped

Intent: The resume page hands every visitor the same accessible, two-page PDF, instead of leaving each browser to print its own.

## Done when
- [test] The resume page's download control is a link to a PDF file that ships with the site, and the file exists in the built site.
- [test] The shipped PDF is two pages and tagged (structure tree present, document language and title set).
- [test] Unhappy path: if the resume data, renderer or print styles change without the PDF being regenerated, the test fails and names the command that regenerates it.
- [test] A screen reader reading the PDF's tags gets the name as the top-level heading; the print header is no longer hidden from assistive technology.
- [smoke] Printing the page from the browser (Cmd+P) still produces the two-page print layout.

## Out of scope
- Per-job resume variants (they stay in the private job-search repo).
- Generating the PDF in CI.
- Changes to resume wording or section order.
- Role titles as headings, or header cells in the education table.
