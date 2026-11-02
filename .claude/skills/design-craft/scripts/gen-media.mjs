// Shared image and video generation through OpenRouter, with a hard dollar cap and a spend ledger.
//
//   node gen-media.mjs jobs.json [--out generated] [--budget 2] [--dry]
//
// jobs.json: an array. Image: { "type":"image", "name":"hero-a", "prompt":"...", "refs":["a.png"], "aspect":"3:4" }
//            Video: { "type":"video", "name":"intro", "prompt":"...", "first":"a.jpg", "last":"b.jpg", "duration":6, "resolution":"720p", "aspect":"16:9", "audio":false }
//
// Key: OPENROUTER_API_KEY from the environment, else from a git-ignored .env at the repo root. Never paste it into chat.
// Defaults (change by env or .env): IMAGE_MODEL=bytedance-seed/seedream-5-0-flash, VIDEO_MODEL=bytedance/seedance-1-5-pro, BUDGET_USD=2.
// Jobs run one at a time and stop as soon as the run's spend reaches the budget, so the most it can overshoot is one job.
// --dry prints the plan and touches nothing. Every call is appended to spend-ledger.jsonl (no secrets) next to the skill.
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../..');
const envFile = resolve(repo, '.env');
if (existsSync(envFile)) for (const l of readFileSync(envFile, 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
}
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const dry = args.includes('--dry');
const jobsFile = args.find((a) => !a.startsWith('--') && a !== opt('out') && a !== opt('budget'));
if (!jobsFile) { console.error('usage: node gen-media.mjs jobs.json [--out generated] [--budget 2] [--dry]'); process.exit(1); }

const KEY = process.env.OPENROUTER_API_KEY;
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'bytedance-seed/seedream-5-0-flash';
const VIDEO_MODEL = process.env.VIDEO_MODEL || 'bytedance/seedance-1-5-pro';
const BUDGET = Number(opt('budget', process.env.BUDGET_USD || 2));
const OUT = resolve(opt('out', 'generated'));
const ledger = resolve(here, '../spend-ledger.jsonl');
const jobs = JSON.parse(readFileSync(jobsFile, 'utf8'));

console.log(`Plan: ${jobs.length} job(s), image model ${IMAGE_MODEL}, video model ${VIDEO_MODEL}, budget $${BUDGET}, out ${OUT}`);
for (const j of jobs) console.log(`  - ${j.type || 'image'} ${j.name}`);
if (dry) { console.log('Dry run: nothing sent.'); process.exit(0); }
if (!KEY) {
  console.error('OPENROUTER_API_KEY is missing. Add it as an environment variable in the cloud environment settings, or in a git-ignored .env at the repo root. Do not paste it into chat.');
  process.exit(1);
}

const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const dataUri = (p) => `data:image/${/\.png$/i.test(p) ? 'png' : 'jpeg'};base64,${readFileSync(p).toString('base64')}`;
const log = (type, model, name, cost) => appendFileSync(ledger, JSON.stringify({ date: new Date().toISOString().slice(0, 10), type, model, name, cost }) + '\n');

async function image(j) {
  const content = [{ type: 'text', text: j.prompt }, ...(j.refs || []).map((p) => ({ type: 'image_url', image_url: { url: dataUri(p) } }))];
  const body = { model: IMAGE_MODEL, modalities: ['image'], messages: [{ role: 'user', content }] };
  if (j.aspect) body.image_config = { aspect_ratio: j.aspect };
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: H, body: JSON.stringify(body) });
  const d = await r.json();
  const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error(JSON.stringify(d.error || d).slice(0, 300));
  const file = resolve(OUT, `${j.name}.png`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  const cost = Number(d.usage?.cost || 0);
  log('image', IMAGE_MODEL, j.name, cost);
  console.log(`ok image ${j.name} $${cost} -> ${file}`);
  return cost;
}

async function video(j) {
  const frames = [];
  if (j.first) frames.push({ type: 'image_url', image_url: { url: dataUri(j.first) }, frame_type: 'first_frame' });
  if (j.last) frames.push({ type: 'image_url', image_url: { url: dataUri(j.last) }, frame_type: 'last_frame' });
  const body = { model: VIDEO_MODEL, prompt: j.prompt, resolution: j.resolution || '720p', duration: j.duration || 6, ...(typeof j.audio === 'boolean' ? { generate_audio: j.audio } : {}), ...(j.aspect ? { aspect_ratio: j.aspect } : {}), ...(frames.length ? { frame_images: frames } : {}) };
  const r = await fetch('https://openrouter.ai/api/v1/videos', { method: 'POST', headers: H, body: JSON.stringify(body) });
  const s = await r.json();
  if (!r.ok || !s.polling_url) throw new Error(JSON.stringify(s).slice(0, 300));
  for (let i = 0; i < 90; i++) {
    await new Promise((t) => setTimeout(t, 8000));
    const p = await (await fetch(s.polling_url, { headers: H })).json();
    if (p.status === 'failed') throw new Error(JSON.stringify(p).slice(0, 300));
    if (p.status === 'completed') {
      const url = (p.unsigned_urls || p.urls || [])[0];
      const v = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
      const file = resolve(OUT, `${j.name}.mp4`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(await v.arrayBuffer()));
      const cost = Number(p.usage?.cost || 0);
      log('video', VIDEO_MODEL, j.name, cost);
      console.log(`ok video ${j.name} $${cost} -> ${file}`);
      return cost;
    }
  }
  throw new Error('video timed out');
}

let spent = 0;
for (const j of jobs) {
  if (spent >= BUDGET) { console.error(`Budget $${BUDGET} reached ($${spent.toFixed(3)} spent). Stopping before: ${j.name}`); break; }
  try { spent += j.type === 'video' ? await video(j) : await image(j); }
  catch (e) { console.error(`FAIL ${j.name}: ${e.message}`); }
}
console.log(`Run total: $${spent.toFixed(3)} of $${BUDGET}`);
