// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// Values come from portfolio/.env (see .env.example). The shared demo deploy sets BASE_PATH=/portfolio (see scripts/stage.mjs).
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const site = (env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');

export default defineConfig({
  site,
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap()],
  // Lightning CSS (the default) can drop translate/rotate/scale longhands when a transform follows them in one rule. esbuild keeps them.
  vite: { build: { cssMinify: 'esbuild' } },
});
