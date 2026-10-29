// Records the looping preview clip for a Work project at a true 60 frames per second, and writes <slug>.mp4 and <slug>.webp (the poster) into public/work/.
//
//   node scripts/record-demo.mjs <slug> <url> [options]
//   node scripts/record-demo.mjs doves-uk https://example.com/doves-uk/ --length 18 --start 6 --scroll 4200
//
//   --length   seconds in the clip, loader included (default 18; the brief is 15 to 20)
//   --start    seconds of the clip given to the site's own loader / intro before the scroll begins (default 6)
//   --scroll   pixels to scroll through the page (default 4200, capped at the page's height)
//   --gate     text on an "enter" button to click once the loader is done (default: none)
//   --fps      frames per second (default 60)
//
// Why it is not a screen recording: a recorder can only keep up with what the machine can draw in real time (about 15 to 25 frames a second here, fewer for
// 3D sites), so the result stutters whatever the setting. Instead the browser's clock is paused and stepped by 1/60 s, one rendered frame at a time
// (Emulation.setVirtualTimePolicy + HeadlessExperimental.beginFrame), so every frame is drawn in full however long it takes and motion is exactly 60 fps.
// The page's own loader runs from the first frame, because the clip starts at navigation. Scrolling is a smooth ease sent as mouse-wheel input.
// Needs Playwright (set PLAYWRIGHT_DIR if it is not importable) and ffmpeg on the machine; neither is a dependency of the site.
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const pw = await import('playwright').catch(() => import(`${process.env.PLAYWRIGHT_DIR ?? '/opt/node-tools/node_modules/playwright'}/index.js`));
const chromium = pw.chromium ?? pw.default.chromium;

const args = process.argv.slice(2);
const [slug, url] = args;
const opt = (name, d) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : d; };
if (!slug || !url) { console.error('usage: node scripts/record-demo.mjs <slug> <url> [--length 18] [--start 6] [--scroll 4200] [--gate "click to open"] [--fps 60]'); process.exit(1); }
const length = Number(opt('length', 18));
const startAt = Number(opt('start', 6));
const scrollPx = Number(opt('scroll', 4200));
const gate = opt('gate', '');
const fps = Number(opt('fps', 60));

const out = resolve(import.meta.dirname, '../public/work');
const raw = `/tmp/record-${slug}`;
rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });

const W = 1280;
const H = 800;
const browser = await chromium.launch({
  args: ['--enable-begin-frame-control', '--run-all-compositor-stages-before-draw', '--disable-new-content-rendering-timeout', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging', '--deterministic-mode'],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('HeadlessExperimental.enable');
await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
page.goto(url, { waitUntil: 'commit' }).catch(() => {});

const dt = 1000 / fps;
const total = Math.round(length * fps);
let frame = 0;
const budget = (policy) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { cdp.off('Emulation.virtualTimeBudgetExpired', done); reject(new Error('stalled')); }, 10000);
  const done = () => { clearTimeout(timer); resolve(); };
  cdp.once('Emulation.virtualTimeBudgetExpired', done);
  cdp.send('Emulation.setVirtualTimePolicy', { policy, budget: dt });
});
let phase = 'start';
let seen = -1;
setInterval(() => { if (frame === seen) console.error(`\nno progress at frame ${frame} (${phase})`); seen = frame; }, 20000).unref();
const step = async () => {
  phase = 'clock';
  // normally the clock waits for the page's network requests; if one never finishes (a hung request), carry on without waiting for it
  await budget('pauseIfNetworkFetchesPending').catch(() => budget('advance'));
  phase = 'draw';
  const r = await cdp.send('HeadlessExperimental.beginFrame', { interval: dt, screenshot: { format: 'jpeg', quality: 88 } });
  if (r.screenshotData) writeFileSync(`${raw}/${String(frame).padStart(5, '0')}.jpg`, Buffer.from(r.screenshotData, 'base64'));
  frame++;
};
const evaluate = async (expression) => (await cdp.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
// Input events are only answered when a later frame is produced (the compositor is under our control), so they are sent and not awaited, and the next steps flush them
const input = (ev) => cdp.send('Input.dispatchMouseEvent', ev);
const withFrame = async (...events) => { events.forEach((ev) => input(ev).catch(() => {})); await step(); }; // not awaited: the reply can only come with a later frame
const wheel = (deltaY) => withFrame({ type: 'mouseWheel', x: W / 2, y: H / 2, deltaX: 0, deltaY });
const click = async (x, y) => {
  await withFrame({ type: 'mouseMoved', x, y });
  await withFrame({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await withFrame({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};

// 1. the loader and the intro, from the very first frame
const startFrame = Math.round(startAt * fps);
for (let i = 0; i < startFrame; i++) await step();
if (gate) {
  const pos = await evaluate(`(() => { const el = [...document.querySelectorAll('button, a, div, span')].filter((e) => e.children.length < 3 && new RegExp(${JSON.stringify(gate)}, 'i').test(e.textContent || '')).pop(); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (pos) { await click(pos.x, pos.y); for (let i = 0; i < Math.round(2.4 * fps); i++) await step(); }
}
await withFrame({ type: 'mouseMoved', x: W / 2, y: H / 2 });

// 2. a beat on the finished first screen, then one smooth scroll (ease in and out) sent as wheel input, then a beat at the end
const room = Math.max(0, (await evaluate('document.documentElement.scrollHeight')) - H);
const distance = Math.min(scrollPx, room);
const hold = Math.round(0.8 * fps);
const scrollFrames = Math.max(1, total - frame - hold - Math.round(0.8 * fps));
const posterFrame = frame + Math.round(0.3 * fps); // the first screen once the intro is done: the picture shown before the clip plays
for (let i = 0; i < hold; i++) await step();
const ease = (t) => t * t * t * (t * (6 * t - 15) + 10); // smootherstep
for (let i = 0; i < scrollFrames; i++) {
  await wheel(distance * (ease((i + 1) / scrollFrames) - ease(i / scrollFrames))); // also steps one frame
  if (frame % 120 === 0) process.stdout.write(`\r${slug}: ${frame}/${total} frames`);
}
while (frame < total) await step();
await browser.close();
console.log(`\r${slug}: ${frame} frames captured`);

// 3. encode: 60 fps, 720 px wide, no audio; the poster is a frame from the finished first screen
const ff = (a) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
ff(['-framerate', String(fps), '-i', `${raw}/%05d.jpg`, '-vf', 'scale=720:-2:flags=lanczos', '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(fps), '-g', String(fps * 2), '-movflags', '+faststart', '-an', `${out}/${slug}.mp4`]);
ff(['-i', `${raw}/${String(Math.min(posterFrame, frame - 1)).padStart(5, '0')}.jpg`, '-vf', 'scale=960:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '72', `${out}/${slug}.webp`]);
console.log(`Wrote public/work/${slug}.mp4 and ${slug}.webp (frames kept in ${raw}: ${readdirSync(raw).length} files)`);
