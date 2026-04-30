// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeImageSize from './plugins/rehype-image-size.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://marsh.city',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    rehypePlugins: [rehypeImageSize],
  },
});
