// @ts-check
import { defineConfig } from 'astro/config';
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
});
