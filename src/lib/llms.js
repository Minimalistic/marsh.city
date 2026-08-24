// Shared source for the /llms.txt and /llms-full.txt endpoints (llmstxt.org):
// gathers every content collection in a deterministic order so both files
// stay in lockstep with the site on every build.
import { getCollection, getEntry } from 'astro:content';

const byDateDesc = (getDate) => (a, b) =>
  (getDate(b)?.valueOf() ?? 0) - (getDate(a)?.valueOf() ?? 0);

export const isoDate = (date) => date.toISOString().slice(0, 10);

export async function loadSiteContent() {
  const about = await getEntry('pages', 'about');
  const now = await getEntry('pages', 'now');

  const projects = (await getCollection('projects'))
    .sort(byDateDesc((e) => e.data.updated ?? e.data.started));

  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort(byDateDesc((e) => e.data.date));

  const playground = (await getCollection('playground'))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));

  // program overview first, then missions in story order — the series reads chronologically
  const art = (await getCollection('art')).sort((a, b) => {
    if (a.id === 'the-chronoscope-program') return -1;
    if (b.id === 'the-chronoscope-program') return 1;
    return a.id.localeCompare(b.id);
  });

  return { about, now, projects, posts, playground, art };
}
