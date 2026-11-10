// The session's own Chromium (Playwright is preinstalled in cloud sessions), launched with its defaults.
import { createRequire } from 'node:module';
import { sleep } from './util.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

export const VIEWPORT = { width: 1440, height: 860 };

export async function launch({ storageState } = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, storageState, locale: 'en-US' });
  const page = await context.newPage();
  return { browser, context, page };
}

// Adapter with the small interface the Flow driver uses.
export class PW {
  constructor(page) { this.p = page; }
  eval(expr) { return this.p.evaluate(expr); }
  async goto(url) { await this.p.goto(url, { waitUntil: 'load', timeout: 30000 }); }
  click(x, y) { return this.p.mouse.click(x, y); }
  type(text) { return this.p.keyboard.insertText(text); }
  async waitFor(fn, timeoutMs, what = 'condition', every = 700) {
    const end = Date.now() + timeoutMs;
    for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error(`timed out waiting for ${what}`); await sleep(every); }
  }
}
