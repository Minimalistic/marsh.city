import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['idea', 'wip', 'shipped', 'archived']).default('wip'),
    repo: z.string().url().optional(),
    url: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    started: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),     // root-relative path used as the social-share card
    imageAlt: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z.string().optional(),     // root-relative path used as the social-share card
    imageAlt: z.string().optional(),
  }),
});

const playground = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/playground' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
  }),
});

const art = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/art' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    codename: z.string().optional(),
    nickname: z.string().optional(),
    tool: z.string().optional(),
    target: z.string().optional(),
    started: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    cover: z.string().optional(),
    promptLabel: z.string().default('prompt'),
    promptFramework: z.string().optional(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      slug: z.string().optional(),
      caption: z.string().optional(),
      narrative: z.string().optional(),
      subject: z.string().optional(),
      environment: z.string().optional(),
      composition: z.string().optional(),
      lighting: z.string().optional(),
      palette: z.string().optional(),
      aspect: z.string().optional(),
      mood: z.string().optional(),
      prompt: z.string().optional(),
    })).default([]),
  }),
});

export const collections = { projects, posts, playground, art };
