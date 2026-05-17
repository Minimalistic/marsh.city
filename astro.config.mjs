// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeImageSize from './plugins/rehype-image-size.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://marsh.city',
  integrations: [mdx(), sitemap()],
  vite: {
    // allow any host header during local dev so the site is reachable
    // from LAN/Tailscale (jasons-mac-mini.local, 192.168.x.x, 100.x.x.x)
    server: { allowedHosts: true },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    rehypePlugins: [rehypeImageSize],
  },
});
