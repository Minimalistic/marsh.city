// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeImageSize from './plugins/rehype-image-size.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://marsh.city',
  integrations: [mdx(), sitemap()],
  // Astro 7 collapses whitespace between inline elements JSX-style by default;
  // keep the HTML rules the site was written against.
  compressHTML: true,
  // off so dev-server screenshots don't bake the toolbar into captured images
  devToolbar: { enabled: false },
  vite: {
    // allow any host header during local dev so the site is reachable
    // from LAN/Tailscale (jasons-mac-mini.local, 192.168.x.x, 100.x.x.x)
    server: { allowedHosts: true },
    // Vite 8's default CSS minifier (Lightning CSS, no targets set) collapses
    // `backdrop-filter` + `-webkit-backdrop-filter` into the prefixed one only,
    // which Chrome and Firefox ignore, so the frosted glass lost its blur there.
    // esbuild keeps both declarations as written.
    build: { cssMinify: 'esbuild' },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    // Astro 7 defaults to its own Sätteri processor, which has no rehype hook;
    // the explicit unified() pipeline keeps the image-size plugin working.
    processor: unified({ rehypePlugins: [rehypeImageSize] }),
  },
});
