// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.doveslife.co.uk',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
