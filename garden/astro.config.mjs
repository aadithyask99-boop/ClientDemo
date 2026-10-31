// @ts-check
import { defineConfig } from 'astro/config';

// The shared demo deploy sets BASE_PATH=/garden (see scripts/stage.mjs)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  outDir: process.env.OUT_DIR || './dist',
  build: { inlineStylesheets: 'auto' },
  // PROFILE=1 gives an unminified build (to read profiler output); the normal build is untouched
  vite: process.env.PROFILE ? { build: { minify: false } } : {},
});
