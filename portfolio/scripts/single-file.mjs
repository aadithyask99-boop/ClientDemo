// Turns the built site into ONE self-contained HTML file: CSS, JavaScript, fonts and the Work preview images all inlined.
// Useful anywhere a page has to travel as a single file (an email, a preview viewer, a chat).
//
//   npm run build:single                      -> dist-single/index.html
//   node scripts/single-file.mjs out.html     -> out.html
//
// The output has no <html>, <head> or <body> of its own, only a <title>, a <style>, the page and one <script>, because some hosts wrap
// the file in their own document. Only latin font subsets are kept. Everything else is the real site: same markup, same scripts.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { build } from 'esbuild';
import { loadEnv } from 'vite';

const root = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] ?? join(root, 'dist-single/index.html'));

// 1. a normal build at the site root
const run = spawnSync('npx', ['astro', 'build'], { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, BASE_PATH: '/' } });
if (run.status !== 0) process.exit(run.status ?? 1);

const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
let body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;
const mimeOf = (f) => ({ webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif', svg: 'image/svg+xml', mp4: 'video/mp4' })[f.split('.').pop()] ?? 'application/octet-stream';

// 2. CSS: linked and inline, with the latin font faces embedded and the other scripts dropped
let css = '';
for (const m of head.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) css += readFileSync(join(dist, m[1].replace(/^\//, '')), 'utf8');
for (const m of head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += m[1];
css = css.replace(/@font-face\{[^}]*\}/g, (face) => {
  const url = face.match(/url\(([^)]+)\)/)?.[1];
  if (!url || !/-latin-wght-normal/.test(url)) return '';
  return face.replace(/url\([^)]+\)/, `url(${dataUri(join(dist, url.replace(/^\//, '')), 'font/woff2')})`);
});

// 3. the small inline script from the <head> (it adds the js / fx classes before anything paints)
const headScripts = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');

// 4. images and the Work videos (and a portrait, if there is one) become data URIs
body = body.replace(/(data-src|data-video-m|data-video|src)="\/([^"]+\.(?:webp|png|jpe?g|avif|svg|mp4))"/g, (whole, attr, path) => {
  const file = join(dist, path);
  return existsSync(file) ? `${attr}="${dataUri(file, mimeOf(path))}"` : whole;
});
// the no-JavaScript image copies are not needed in a single file that already carries its pictures
body = body.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
// drop the module script, the analytics beacon and any other external script
body = body.replace(/<script[^>]*\bsrc="[^"]*"[^>]*><\/script>/g, '');

// 5. JavaScript: the real entry point, bundled to one IIFE (dynamic imports included). PUBLIC_* settings from .env are baked in.
const env = loadEnv(process.env.NODE_ENV ?? 'production', root, 'PUBLIC_');
const bundle = await build({
  entryPoints: [join(root, 'src/scripts/main.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  define: { 'import.meta.env': JSON.stringify({ ...env, BASE_URL: '/', MODE: 'production', DEV: false, PROD: true }) },
  logLevel: 'error',
});
const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const title = (head.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Portfolio').split('·')[0].trim();
const file = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${css}</style>
<script>${headScripts}</script>
${body.trim()}
<script>${js}</script>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, file);
console.log(`Wrote ${out} (${(file.length / 1024).toFixed(0)} KB)`);
