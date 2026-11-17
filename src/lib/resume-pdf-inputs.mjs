// What the site's downloadable resume PDF is built from, and a fingerprint
// of it. `npm run resume:site` stores the fingerprint next to the PDF it
// writes; tests/resume-pdf.test.mjs recomputes it, so a resume edit that
// wasn't followed by a regenerate fails the build instead of shipping a
// stale PDF. (The PDF itself can't be compared: Chrome stamps each one with
// its creation time.)

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE_PDF = 'public/Jason-Marsh-Resume.pdf';
export const SITE_PDF_FINGERPRINT = 'src/data/resume-pdf.sha256';

// global.css is left out on purpose: it changes for reasons that have
// nothing to do with the resume, and the print rules live in resume.css.
export const SITE_PDF_INPUTS = [
  'src/data/resume.json',
  'src/lib/resume-html.mjs',
  'src/styles/resume.css',
  'public/qr.svg',
];

/** sha256 over every input. `read` is swappable so a test can change one. */
export function resumePdfFingerprint(root, read = (path) => readFileSync(join(root, path))) {
  const hash = createHash('sha256');
  for (const path of SITE_PDF_INPUTS) {
    hash.update(path).update('\0').update(read(path)).update('\0');
  }
  return hash.digest('hex');
}
