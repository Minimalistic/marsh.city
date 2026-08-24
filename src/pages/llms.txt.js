// llms.txt (https://llmstxt.org) — a curated index of the site for AI tools,
// regenerated from the content collections on every build. Endpoint route:
// Astro serves this file as /llms.txt, same pattern as rss.xml.js.
import { loadSiteContent, isoDate } from '../lib/llms.js';

export async function GET(context) {
  const url = (path) => new URL(path, context.site).href;
  const line = (title, path, note) => `- [${title}](${url(path)}): ${note}`;
  const { projects, posts, playground, art } = await loadSiteContent();

  const lines = [
    '# marsh.city',
    '',
    '> The personal site of Jason Marsh — Director of Technology at an assistive technology & older adult services nonprofit in Duluth, Minnesota. Projects, writing, generative art, and browser experiments, built by orchestrating AI from the terminal.',
    '',
    `All content is written in Markdown and rendered by Astro. The full text of every page is available in one file at ${url('/llms-full.txt')}.`,
    '',
    '## Pages',
    '',
    line('About', '/about/', 'who I am, what I build, and how I build it'),
    line('Now', '/now/', "what I'm focused on right now"),
    line('Resume', '/resume/', 'experience and skills in detail'),
    line('Colophon', '/oak/', 'how this site is built'),
    '',
    '## Projects',
    '',
    ...projects.map((p) =>
      line(p.data.title, `/projects/${p.id}/`, `${p.data.description} (${p.data.status})`)),
    '',
    '## Writing',
    '',
    ...posts.map((p) =>
      line(p.data.title, `/posts/${p.id}/`, p.data.description
        ? `${p.data.description} (${isoDate(p.data.date)})`
        : isoDate(p.data.date))),
    '',
    '## Art',
    '',
    ...art.map((a) => line(a.data.title, `/art/${a.id}/`, a.data.description)),
    '',
    '## Playground',
    '',
    ...playground.map((p) =>
      line(p.data.title, `/playground/${p.id}/`, `${p.data.description} (interactive)`)),
  ];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
