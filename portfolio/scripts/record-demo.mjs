// Records the short looping clip for a Work project: loads a site, scrolls through it, and writes <slug>.mp4 and <slug>.webp (the poster)
// into public/work/. Needs Playwright and ffmpeg on the machine (neither is a dependency of the site).
//
//   node scripts/record-demo.mjs <slug> <url> [scrollPixels=3400]
//   node scripts/record-demo.mjs doves-uk https://example.com/doves-uk/
//
// Sites with a loader or an "enter" gate get 5.5 seconds to finish and a click on any "click to open" text. Heavy 3D sites can drift the recorder's
// clock; if a clip starts in the wrong place, open the raw .webm that this script leaves in /tmp and pick the trim time by eye.
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const [slug, url, scroll = '3400'] = process.argv.slice(2);
if (!slug || !url) { console.error('usage: node scripts/record-demo.mjs <slug> <url> [scrollPixels]'); process.exit(1); }
const out = resolve(import.meta.dirname, '../public/work');
const raw = `/tmp/record-${slug}`;
mkdirSync(raw, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: raw, size: { width: 1280, height: 800 } } });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(5500);
const gate = page.locator('text=/click to open/i').first();
if (await gate.count()) { await gate.click().catch(() => {}); await page.waitForTimeout(2600); }
await page.mouse.move(640, 400);
const start = (Date.now() - t0) / 1000;
await page.waitForTimeout(1300);
const total = Math.min(Number(scroll), Math.max(0, (await page.evaluate(() => document.documentElement.scrollHeight)) - 800));
const steps = 110;
for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, total / steps); await page.waitForTimeout(50); }
await page.waitForTimeout(900);
await ctx.close();
await browser.close();

const webm = readdirSync(raw).find((n) => n.endsWith('.webm'));
renameSync(`${raw}/${webm}`, `${raw}/${slug}.webm`);
const ff = (args) => spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
ff(['-ss', String(start), '-t', '9', '-i', `${raw}/${slug}.webm`, '-vf', 'fps=24,scale=720:-2:flags=lanczos', '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', `${out}/${slug}.mp4`]);
ff(['-ss', '0.4', '-i', `${out}/${slug}.mp4`, '-frames:v', '1', '-vf', 'scale=960:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '72', `${out}/${slug}.webp`]);
console.log(`Wrote public/work/${slug}.mp4 and ${slug}.webp (raw recording kept in ${raw})`);
