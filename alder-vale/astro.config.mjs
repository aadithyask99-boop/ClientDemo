// @ts-check
import { defineConfig } from 'astro/config';

// The shared demo deploy sets BASE_PATH=/alder-vale (see scripts/stage.mjs)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
});
