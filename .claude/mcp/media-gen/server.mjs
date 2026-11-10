#!/usr/bin/env node
// media-gen: a small MCP server (stdio, no dependencies) for image and video generation through OpenRouter.
// Same backend, defaults and spend ledger as .claude/skills/design-craft/scripts/gen-media.mjs, exposed as tools.
//
// Tools: list_models, generate_image, generate_video, check_video, spend_report.
// Video is asynchronous: generate_video submits a job and returns a job id; check_video polls it and, once it is
// complete, downloads the mp4. Job state is kept in a file so it survives a server restart.
//
// Key: OPENROUTER_API_KEY in the environment or the git-ignored .env at the repo root. In cloud sessions the
// openrouter.ai network secret adds the header, so with no key found requests are sent without Authorization.
// Env: IMAGE_MODEL, VIDEO_MODEL, BUDGET_USD (spend cap per server process, default 2), MEDIA_OUT_DIR (default <repo>/generated).
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';

// Node's built-in fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1. In cloud sessions the proxy is what injects the
// openrouter.ai key, so without this every call is a 401. Re-launch once with the flag set (stdio is passed straight through).
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const child = spawn(process.execPath, ['--disable-warning=UNDICI-EHPA', fileURLToPath(import.meta.url)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  child.on('exit', (code) => process.exit(code ?? 0));
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => child.kill(s));
  await new Promise(() => {});
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const envFile = resolve(repo, '.env');
if (existsSync(envFile)) for (const l of readFileSync(envFile, 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
}

const KEY = process.env.OPENROUTER_API_KEY;
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'bytedance-seed/seedream-5-0-flash';
const VIDEO_MODEL = process.env.VIDEO_MODEL || 'bytedance/seedance-1-5-pro';
const BUDGET = Number(process.env.BUDGET_USD || 2);
const OUT = resolve(process.env.MEDIA_OUT_DIR || resolve(repo, 'generated'));
const LEDGER = resolve(repo, '.claude/skills/design-craft/spend-ledger.jsonl');
const JOBS_FILE = resolve(OUT, '.video-jobs.json');
const API = 'https://openrouter.ai/api/v1';
const H = { ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}), 'Content-Type': 'application/json' };

let spent = 0; // dollars spent by this server process
const ledger = (type, model, name, cost) => {
  try { mkdirSync(dirname(LEDGER), { recursive: true }); appendFileSync(LEDGER, JSON.stringify({ date: new Date().toISOString().slice(0, 10), type, model, name, cost, via: 'media-gen-mcp' }) + '\n'); } catch {}
};
const path = (p) => (isAbsolute(p) ? p : resolve(repo, p));
const dataUri = (p) => `data:image/${/\.png$/i.test(p) ? 'png' : /\.webp$/i.test(p) ? 'webp' : 'jpeg'};base64,${readFileSync(path(p)).toString('base64')}`;
const safe = (n) => String(n).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
const outFile = (dir, name, ext) => { const d = dir ? path(dir) : OUT; mkdirSync(d, { recursive: true }); return resolve(d, `${safe(name)}.${ext}`); };
const authFail = (r) => { if (r.status === 401 || r.status === 403) throw new Error(`HTTP ${r.status}: OpenRouter did not accept the request. Check OPENROUTER_API_KEY or the openrouter.ai network secret in the environment settings.`); };
const overBudget = () => spent >= BUDGET && `Budget of $${BUDGET} reached ($${spent.toFixed(3)} spent by this server). Raise BUDGET_USD and restart to continue.`;
const loadJobs = () => { try { return JSON.parse(readFileSync(JOBS_FILE, 'utf8')); } catch { return {}; } };
const saveJobs = (j) => { mkdirSync(OUT, { recursive: true }); writeFileSync(JOBS_FILE, JSON.stringify(j, null, 2)); };

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const fail = (t) => ({ isError: true, content: [{ type: 'text', text: t }] });

async function listModels({ kind = 'video' }) {
  if (kind === 'video') {
    const d = await (await fetch(`${API}/videos/models`)).json();
    const rows = (d.data || d).map((m) => `${m.id}  ${m.name || ''}  ${m.pricing_skus ? JSON.stringify(m.pricing_skus) : ''}`.trim());
    return text(`Default video model: ${VIDEO_MODEL}\n${rows.join('\n')}`);
  }
  const d = await (await fetch(`${API}/models?output_modalities=image`)).json();
  const rows = (d.data || []).map((m) => `${m.id}  ${m.name || ''}  prompt $${m.pricing?.prompt ?? '?'}  image $${m.pricing?.image ?? '?'}`);
  return text(`Default image model: ${IMAGE_MODEL}\n${rows.join('\n')}`);
}

async function generateImage(a) {
  const stop = overBudget(); if (stop) return fail(stop);
  if (!a.prompt) return fail('prompt is required');
  const model = a.model || IMAGE_MODEL;
  const content = [{ type: 'text', text: a.prompt }, ...(a.refs || []).map((p) => ({ type: 'image_url', image_url: { url: dataUri(p) } }))];
  const body = { model, modalities: ['image'], messages: [{ role: 'user', content }] };
  if (a.aspect) body.image_config = { aspect_ratio: a.aspect };
  const r = await fetch(`${API}/chat/completions`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  authFail(r);
  const d = await r.json();
  const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) return fail(`No image returned: ${JSON.stringify(d.error || d).slice(0, 400)}`);
  const name = a.name || `image-${Date.now()}`;
  const file = outFile(a.out_dir, name, 'png');
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(file, buf);
  const cost = Number(d.usage?.cost || 0);
  spent += cost; ledger('image', model, name, cost);
  const out = [{ type: 'text', text: `Saved ${file}\nmodel ${model}, cost $${cost}, session total $${spent.toFixed(3)} of $${BUDGET}` }];
  if (a.return_image !== false && buf.length < 4_000_000) out.push({ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' });
  return { content: out };
}

async function generateVideo(a) {
  const stop = overBudget(); if (stop) return fail(stop);
  if (!a.prompt) return fail('prompt is required');
  const model = a.model || VIDEO_MODEL;
  const frames = [];
  if (a.first) frames.push({ type: 'image_url', image_url: { url: dataUri(a.first) }, frame_type: 'first_frame' });
  if (a.last) frames.push({ type: 'image_url', image_url: { url: dataUri(a.last) }, frame_type: 'last_frame' });
  const body = { model, prompt: a.prompt, resolution: a.resolution || '720p', duration: a.duration || 6, ...(typeof a.audio === 'boolean' ? { generate_audio: a.audio } : { generate_audio: false }), ...(a.aspect ? { aspect_ratio: a.aspect } : {}), ...(frames.length ? { frame_images: frames } : {}) };
  const r = await fetch(`${API}/videos`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  authFail(r);
  const s = await r.json();
  if (!r.ok || !s.polling_url) return fail(`Submit failed: ${JSON.stringify(s).slice(0, 400)}`);
  const id = s.id || s.polling_url;
  const name = a.name || `video-${Date.now()}`;
  const jobs = loadJobs();
  jobs[id] = { id, name, model, polling_url: s.polling_url, out_dir: a.out_dir || null, submitted: new Date().toISOString(), status: 'pending' };
  saveJobs(jobs);
  return text(`Submitted video job.\njob_id: ${id}\nmodel ${model}, ${body.resolution}, ${body.duration}s, audio ${body.generate_audio}\nCall check_video with this job_id in about a minute. Clips usually take 1 to 5 minutes. Cost is charged when it completes.`);
}

async function checkVideo({ job_id }) {
  const jobs = loadJobs();
  const job = jobs[job_id];
  if (!job) return fail(`Unknown job_id. Known jobs: ${Object.keys(jobs).join(', ') || 'none'}`);
  if (job.status === 'completed') return text(`Already done: ${job.file}\ncost $${job.cost}`);
  const r = await fetch(job.polling_url, { headers: H });
  authFail(r);
  const p = await r.json();
  if (p.status === 'failed') { job.status = 'failed'; saveJobs(jobs); return fail(`Job failed: ${JSON.stringify(p).slice(0, 400)}`); }
  if (p.status !== 'completed') return text(`Status: ${p.status || 'pending'}. Check again shortly.`);
  const url = (p.unsigned_urls || p.urls || [])[0];
  if (!url) return fail(`Completed but no URL: ${JSON.stringify(p).slice(0, 400)}`);
  const v = await fetch(url, { headers: KEY ? { Authorization: `Bearer ${KEY}` } : {} });
  if (!v.ok) return fail(`Download failed: HTTP ${v.status}`);
  const file = outFile(job.out_dir, job.name, 'mp4');
  writeFileSync(file, Buffer.from(await v.arrayBuffer()));
  const cost = Number(p.usage?.cost || 0);
  spent += cost; ledger('video', job.model, job.name, cost);
  Object.assign(job, { status: 'completed', file, cost });
  saveJobs(jobs);
  return text(`Saved ${file}\nmodel ${job.model}, cost $${cost}, session total $${spent.toFixed(3)} of $${BUDGET}`);
}

function spendReport() {
  let rows = [];
  try { rows = readFileSync(LEDGER, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch {}
  const total = rows.reduce((t, r) => t + Number(r.cost ?? r.usd ?? 0), 0);
  const tail = rows.slice(-10).map((r) => `${r.date || r.ts} ${r.type || ''} ${r.model || ''} ${r.name || r.what || ''} $${r.cost ?? r.usd ?? 0}`.replace(/\s+/g, ' ')).join('\n');
  return text(`This server: $${spent.toFixed(3)} of $${BUDGET}\nLedger (all runs, ${rows.length} entries): $${total.toFixed(3)}\nLast 10:\n${tail || '(none)'}`);
}

const str = (description) => ({ type: 'string', description });
const TOOLS = [
  { name: 'list_models', description: 'List available video or image models on OpenRouter with prices. Free, needs no key.', inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['video', 'image'], description: 'Default video.' } } }, run: listModels },
  { name: 'generate_image', description: `Generate an image (text-to-image, or edit/compose from reference images). Saves a PNG and returns it. Default model ${IMAGE_MODEL}.`, inputSchema: { type: 'object', required: ['prompt'], properties: { prompt: str('What to draw.'), name: str('File name without extension.'), model: str('OpenRouter image model id; defaults to IMAGE_MODEL.'), aspect: str('Aspect ratio, e.g. 16:9, 3:4, 1:1.'), refs: { type: 'array', items: { type: 'string' }, description: 'Paths to reference images (repo-relative or absolute).' }, out_dir: str('Output folder; default <repo>/generated.'), return_image: { type: 'boolean', description: 'Return the image inline too. Default true.' } } }, run: generateImage },
  { name: 'generate_video', description: `Submit a video generation job (text-to-video, or image-to-video with first/last frame). Returns a job_id; poll with check_video. Default model ${VIDEO_MODEL}, 720p, 6 s, no audio.`, inputSchema: { type: 'object', required: ['prompt'], properties: { prompt: str('Motion and scene description.'), name: str('File name without extension.'), model: str('OpenRouter video model id, e.g. google/veo-3.1-fast. See list_models.'), first: str('Path to first-frame image.'), last: str('Path to last-frame image.'), duration: { type: 'number', description: 'Seconds. Default 6.' }, resolution: str('480p, 720p or 1080p. Default 720p.'), aspect: str('16:9 or 9:16 etc.'), audio: { type: 'boolean', description: 'Generate audio. Default false.' }, out_dir: str('Output folder; default <repo>/generated.') } }, run: generateVideo },
  { name: 'check_video', description: 'Check a video job. When it is complete, downloads the mp4 and returns its path and cost.', inputSchema: { type: 'object', required: ['job_id'], properties: { job_id: str('The job_id returned by generate_video.') } }, run: checkVideo },
  { name: 'spend_report', description: 'Show spend for this server session and the shared ledger.', inputSchema: { type: 'object', properties: {} }, run: spendReport },
];

const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
const rl = createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return send({ id: null, error: { code: -32700, message: 'Parse error' } }); }
  const { id, method, params } = msg;
  if (id === undefined) return; // notification, e.g. notifications/initialized
  try {
    if (method === 'initialize') return send({ id, result: { protocolVersion: params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'media-gen', version: '1.0.0' } } });
    if (method === 'ping') return send({ id, result: {} });
    if (method === 'tools/list') return send({ id, result: { tools: TOOLS.map(({ run, ...t }) => t) } });
    if (method === 'tools/call') {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return send({ id, error: { code: -32602, message: `Unknown tool ${params?.name}` } });
      try { return send({ id, result: await tool.run(params.arguments || {}) }); }
      catch (e) { return send({ id, result: fail(`${tool.name} failed: ${e.message}`) }); }
    }
    send({ id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (e) { send({ id, error: { code: -32603, message: e.message } }); }
});
