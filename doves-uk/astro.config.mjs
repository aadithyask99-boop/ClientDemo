// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.doveslife.co.uk',
  // Served from the root in production. The demo deploy sets BASE_PATH=/doves-uk
  base: process.env.BASE_PATH || '/',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
