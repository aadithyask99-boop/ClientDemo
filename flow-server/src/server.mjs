// flow-server: MCP server (Streamable HTTP, stateless; or --stdio) that generates images in Google Flow by driving a
// real, already signed-in Chrome over CDP. Chrome keeps the Google login in its own profile on disk, so nothing is exported.
import http from 'node:http';
import { createInterface } from 'node:readline';
import { chromium } from 'playwright-core';
import { openProject, generateImages, signedIn, SignedOut } from './flow.mjs';

const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';
const SECRET = process.env.MCP_SECRET || '';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://YOUR-SERVER';
const PORT = Number(process.env.PORT || 8787);
const VIEWPORT = { width: 1440, height: 860 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Adapter with the small interface the Flow driver uses.
class PW {
  constructor(p) { this.p = p; }
  eval(expr) { return this.p.evaluate(expr); }
  async goto(url) { await this.p.goto(url, { waitUntil: 'load', timeout: 30000 }); }
  click(x, y) { return this.p.mouse.click(x, y); }
  type(text) { return this.p.keyboard.insertText(text); }
  async waitFor(fn, timeoutMs, what = 'condition', every = 700) {
    const end = Date.now() + timeoutMs;
    for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error(`timed out waiting for ${what}`); await sleep(every); }
  }
}

// One Flow job at a time: they share one Chrome and one Flow project.
let tail = Promise.resolve();
const queue = (fn) => { const run = tail.then(fn, fn); tail = run.catch(() => {}); return run; };

function withFlow(fn) {
  return queue(async () => {
    const browser = await chromium.connectOverCDP(CDP_URL);
    try {
      const context = browser.contexts()[0] || (await browser.newContext());
      const page = await context.newPage();
      await page.setViewportSize(VIEWPORT).catch(() => {});
      try { return await fn(new PW(page)); } finally { await page.close().catch(() => {}); }
    } finally { await browser.close().catch(() => {}); }
  });
}

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const err = (t) => ({ isError: true, content: [{ type: 'text', text: t }] });
const signedOutMsg = () => `Google is signed out in the Flow browser. Ask the owner to open ${PUBLIC_URL}/browser/ , sign in to Google in that window and open flow.google.com, then retry.`;
let last = null; // most recent result, so a client that timed out can still fetch it

const TOOLS = [
  { name: 'flow_generate_image', description: "Generate images with Google Flow (Nano Banana) in the owner's signed-in Flow account. Free against their Flow plan. Takes 30 to 120 seconds. Returns full-size images. If the client times out, call flow_last_result.",
    inputSchema: { type: 'object', required: ['prompt'], properties: {
      prompt: { type: 'string', description: 'What to generate: subject, style, lighting, background.' },
      aspect: { type: 'string', enum: ['16:9', '4:3', '1:1', '3:4', '9:16'], description: 'Default 1:1.' },
      count: { type: 'integer', minimum: 1, maximum: 4, description: 'Number of images, default 1.' } } } },
  { name: 'flow_last_result', description: 'Return the images from the most recent flow_generate_image call (use if the previous call timed out).', inputSchema: { type: 'object', properties: {} } },
  { name: 'flow_status', description: 'Check that Google Flow is signed in. About 10 seconds.', inputSchema: { type: 'object', properties: {} } },
];

const imageContent = (r) => ({ content: [{ type: 'text', text: `Generated ${r.images.length} image(s) with Google Flow.` }, ...r.images.map((i) => ({ type: 'image', data: i.b64, mimeType: i.type || 'image/jpeg' }))] });

async function callTool(name, a) {
  try {
    if (name === 'flow_generate_image') {
      if (!a.prompt) return err('prompt is required');
      const r = await withFlow(async (page) => { await openProject(page); return generateImages(page, { prompt: a.prompt, aspect: a.aspect, count: a.count }); });
      if (!r.images.length) return err(`Flow produced no image. Its last message: ${r.agent}`);
      last = r; return imageContent(r);
    }
    if (name === 'flow_last_result') return last ? imageContent(last) : err('No result yet.');
    if (name === 'flow_status') return await withFlow(async (page) => { await page.goto('https://flow.google.com/'); await sleep(2500); return (await signedIn(page)) ? text('Signed in to Google Flow.') : err(signedOutMsg()); });
  } catch (e) {
    if (e instanceof SignedOut) return err(signedOutMsg());
    if (/ECONNREFUSED|connectOverCDP/.test(e.message)) return err('The Flow Chrome is not reachable. Check that the flow-chromium container is running on the server.');
    return err(`${name} failed: ${e.message}`);
  }
  return err(`Unknown tool ${name}`);
}

async function rpc(msg) {
  const { id, method, params } = msg;
  if (id === undefined) return null;
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  switch (method) {
    case 'initialize': return ok({ protocolVersion: params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'flow-server', version: '1.0.0' } });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS });
    case 'tools/call': return ok(await callTool(params?.name, params?.arguments || {}));
    default: return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

const safeEqual = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

if (process.argv.includes('--stdio')) {
  createInterface({ input: process.stdin }).on('line', async (line) => {
    if (!line.trim()) return;
    let m; try { m = JSON.parse(line); } catch { return; }
    const out = await rpc(m); if (out) process.stdout.write(JSON.stringify(out) + '\n');
  });
} else {
  if (SECRET.length < 16) { console.error('MCP_SECRET must be set (16+ characters)'); process.exit(1); }
  http.createServer(async (req, res) => {
    const send = (code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') return send(200, 'ok', 'text/plain');
    const m = url.pathname.match(/^\/mcp(?:\/(.+))?$/);
    if (!m) return send(404, 'Not found', 'text/plain');
    const given = m[1] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!safeEqual(given, SECRET)) return send(404, 'Not found', 'text/plain');
    if (req.method !== 'POST') return send(405, 'Method not allowed', 'text/plain');
    let raw = ''; for await (const c of req) { raw += c; if (raw.length > 5e6) return send(413, 'Too large', 'text/plain'); }
    let body; try { body = JSON.parse(raw); } catch { return send(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
    const batch = Array.isArray(body);
    const out = (await Promise.all((batch ? body : [body]).map(rpc))).filter(Boolean);
    if (!out.length) { res.writeHead(202); return res.end(); }
    send(200, batch ? out : out[0]);
  }).listen(PORT, '0.0.0.0', () => console.log(`flow-server MCP on :${PORT}`));
}
