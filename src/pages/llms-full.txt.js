// llms-full.txt — the whole site's Markdown flattened into one file so an AI
// tool can ingest everything in a single request instead of crawling pages.
// Built from the same collections as llms.txt; regenerated on every build.
import { loadSiteContent, isoDate } from '../lib/llms.js';

export async function GET(context) {
  const url = (path) => new URL(path, context.site).href;
  const { about, now, projects, posts, playground, art } = await loadSiteContent();

  // one flattened page: title, canonical URL, one-line pitch, metadata, then the raw Markdown body
  const page = (header, path, description, metaLines, body) => [
    `# ${header}`,
    url(path),
    ...(description ? ['', `> ${description}`] : []),
    ...(metaLines.length ? ['', ...metaLines] : []),
    '',
    body.trim(),
  ].join('\n');

  const sections = [
    [
      '# marsh.city — full site content',
      '',
      `Generated at build time from the site's Markdown source. Curated index: ${url('/llms.txt')}`,
    ].join('\n'),

    page('About', '/about/', about.data.description, [], about.body),
    page('Now', '/now/', now.data.description, [`Updated: ${now.data.updated}`], now.body),
  ];

  for (const p of projects) {
    const meta = [`Status: ${p.data.status}${p.data.tags.length ? ` | Tags: ${p.data.tags.join(', ')}` : ''}`];
    if (p.data.repo) meta.push(`Repo: ${p.data.repo}`);
    if (p.data.url) meta.push(`Live: ${p.data.url}`);
    sections.push(page(`Project: ${p.data.title}`, `/projects/${p.id}/`, p.data.description, meta, p.body));
  }

  for (const p of posts) {
    const meta = [`Published: ${isoDate(p.data.date)}${p.data.tags.length ? ` | Tags: ${p.data.tags.join(', ')}` : ''}`];
    sections.push(page(`Post: ${p.data.title}`, `/posts/${p.id}/`, p.data.description, meta, p.body));
  }

  for (const a of art) {
    const meta = a.data.tool ? [`Tool: ${a.data.tool}`] : [];
    let body = a.body ?? '';
    if (a.data.images.length) {
      body += '\n\nImages:\n' + a.data.images
        .map((img) => {
          const note = img.narrative ?? img.caption;
          return `- ${img.alt}${note ? ` — ${note}` : ''}`;
        })
        .join('\n');
    }
    sections.push(page(`Art: ${a.data.title}`, `/art/${a.id}/`, a.data.description, meta, body));
  }

  // playground pieces are interactive canvas sims — their Markdown bodies are
  // implementation code, so index them here instead of dumping the source
  sections.push([
    '# Playground',
    '',
    ...playground.map((p) =>
      `- [${p.data.title}](${url(`/playground/${p.id}/`)}): ${p.data.description} (interactive)`),
  ].join('\n'));

  return new Response(sections.join('\n\n---\n\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
