// Builds a site folder into a bundle that the Artifact tool can publish, so every job ends with a link the owner can open.
//
//   node bundle-preview.mjs <site-folder> [--out captures/<site>/preview] [--title "Orra homepage concept"]
//
// Output folder: page.html (title + head + body, no <html>), assets/ (the built _astro files), every other built file at its own
// path, files.json (the map to pass as `files` to the Artifact tool: published path -> source path under the output folder) and
// files-update.json (the same, plus null for files the previous bundle had and this one does not, so stale hashed files are removed).
//
// Publish with the Artifact tool: file_path = <out>/page.html, root = <out>, files = contents of files-update.json
// (first publish: files.json). Pass the same `url` when updating. Limits: 255 files and 64 MB per publish, 16 MB per file;
// the script warns when a bundle is over, and a larger site must go up over several publishes to the same url.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const positional = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) i++; else positional.push(args[i]); }
const site = positional[0];
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
if (!site) { console.error('usage: node bundle-preview.mjs <site-folder> [--out dir] [--title text]'); process.exit(1); }
const siteDir = resolve(site);
const out = resolve(opt('out', join('captures', site.replace(/\/$/, '').split('/').pop(), 'preview')));

// 1. build with a relative base so every URL can be rewritten to a relative path
const run = spawnSync('npx', ['astro', 'build'], { cwd: siteDir, stdio: 'inherit', shell: true, env: { ...process.env, BASE_PATH: './' } });
if (run.status !== 0) { console.error('Build failed.'); process.exit(run.status ?? 1); }
const dist = join(siteDir, 'dist');

// 2. remember the previous bundle's file list, then start clean
let previous = {};
if (existsSync(join(out, 'files.json'))) { try { previous = JSON.parse(readFileSync(join(out, 'files.json'), 'utf8')); } catch {} }
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 3. copy every built file except the page itself; the folder name _astro becomes assets
const skip = new Set(['index.html', '404.html', 'robots.txt']);
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
for (const f of walk(dist)) {
  let rel = relative(dist, f);
  if (skip.has(rel) || /^sitemap.*\.xml$/.test(rel)) continue;
  rel = rel.replace(/^_astro\//, 'assets/');
  const dest = join(out, rel);
  mkdirSync(join(dest, '..'), { recursive: true });
  if (/\.css$/.test(rel)) {
    let css = readFileSync(f, 'utf8');
    css = css.replace(/url\((['"]?)\/\.\//g, 'url($1../').replace(/url\((['"]?)\/_astro\//g, 'url($1./');
    writeFileSync(dest, css);
  } else cpSync(f, dest);
}

// 3b. a stylesheet resolves url() against its own folder (assets/), so a path that points at a public file such as ./img/x.webp must go up one level
for (const f of walk(join(out, 'assets'))) {
  if (!/\.css$/.test(f)) continue;
  let css = readFileSync(f, 'utf8');
  css = css.replace(/url\((['"]?)\.\/([^)'"]+)\1\)/g, (m, q, path) => (existsSync(join(out, 'assets', path.split('?')[0])) ? m : `url(${q}../${path}${q})`));
  writeFileSync(f, css);
}

// 4. the page: title, head and body without the document wrapper, with every URL made relative
let html = readFileSync(join(dist, 'index.html'), 'utf8').replace(/\/\.\//g, '').replace(/_astro\//g, 'assets/');
const pageTitle = opt('title', (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || site);
const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ''])[1].replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>|<title>[\s\S]*?<\/title>|<link rel="icon"[^>]*>|<link rel="preload"[^>]*>/g, '');
const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, ''])[1];
writeFileSync(join(out, 'page.html'), `<title>${pageTitle}</title>\n${head}\n${body}`);

// 4b. a url() inside an inline style (for example --house: url(img/house.webp)) is resolved against the stylesheet that uses it, not the page,
// so such a file must exist both at its own path and under assets/
{
  const pageText = readFileSync(join(out, 'page.html'), 'utf8');
  for (const m of pageText.matchAll(/url\((['"]?)(?!data:|https?:|\/|#)([^)'"]+)\1\)/g)) {
    const rel = m[2].split('?')[0];
    const src = join(out, rel), dest = join(out, 'assets', rel);
    if (existsSync(src) && !existsSync(dest)) { mkdirSync(join(dest, '..'), { recursive: true }); cpSync(src, dest); }
  }
}

// 5. the files maps
const files = {};
let total = 0, big = [];
for (const f of walk(out)) {
  const rel = relative(out, f);
  if (rel === 'page.html' || rel.startsWith('files')) continue;
  files[rel] = rel;
  const sz = statSync(f).size; total += sz; if (sz > 16 * 1024 * 1024) big.push(rel);
}
const update = { ...files };
for (const k of Object.keys(previous)) if (!(k in files)) update[k] = null;
writeFileSync(join(out, 'files.json'), JSON.stringify(files, null, 1));
writeFileSync(join(out, 'files-update.json'), JSON.stringify(update, null, 1));

// 6. warnings for things that break after rewriting
const stray = [];
for (const f of walk(out)) if (/\.(js|css|html)$/.test(f)) { const t = readFileSync(f, 'utf8'); if (/["'(]\/(\.\/|_astro\/)/.test(t)) stray.push(relative(out, f)); }
const n = Object.keys(files).length;
console.log(`\nBundle: ${out}\n  ${n} files + page.html, ${(total / 1048576).toFixed(1)} MB`);
if (n > 254) console.log(`  WARNING: ${n} files is over the 255 per publish. Publish the page with the first 250, then publish the rest to the same url.`);
if (total > 64 * 1048576) console.log('  WARNING: over 64 MB per publish. Split over several publishes to the same url, or shrink the media.');
if (big.length) console.log(`  WARNING: over 16 MB each: ${big.join(', ')}`);
if (stray.length) console.log(`  WARNING: absolute paths remain in: ${stray.join(', ')} (check these load in the preview)`);
console.log(`\nPublish: Artifact tool, file_path=${join(out, 'page.html')}, root=${out}, files=<contents of files-update.json>`);
