// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://evmgroup.co.in',
  // Served from the root in production. The demo deploy sets BASE_PATH=/evm
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
});
