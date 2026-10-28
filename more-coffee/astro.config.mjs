// @ts-check
import { defineConfig } from 'astro/config';

// The shared demo deploy sets BASE_PATH=/more-coffee (see scripts/stage.mjs)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
  // Lightning CSS (the default) drops translate/rotate/scale longhands when a transform follows them in one rule,
  // which breaks the jelly hover. esbuild keeps them.
  vite: { build: { cssMinify: 'esbuild' } },
});
