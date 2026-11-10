// flow-mcp: an MCP server (Streamable HTTP, stateless) that generates images in Google Flow through a signed-in cloud browser.
// Auth: the secret in the URL path (/mcp/<MCP_SECRET>, for claude.ai connectors, which cannot send headers) or
// "Authorization: Bearer <MCP_SECRET>" on /mcp. Secrets: BROWSER_USE_API_KEY, MCP_SECRET. Vars: FLOW_PROFILE_ID, FLOW_PROJECT_ID.
import { startBrowser, stopBrowser } from './browseruse.js';
import { Page, sleep } from './cdp.js';
import { openProject, generateImages, signedIn, SignedOut } from './flow.js';

const SIGNIN = 'https://accounts.google.com/v3/signin/identifier?continue=https://flow.google.com/&flowName=GlifWebSignIn&flowEntry=ServiceLogin';

const TOOLS = [
  {
    name: 'flow_generate_image',
    description: "Generate images with Google Flow (Nano Banana) using the owner's signed-in Flow account. Images are free against the Flow plan. Takes 30 to 120 seconds. Returns the full-size image(s). If it reports Google is signed out, call flow_signin_start.",
    inputSchema: { type: 'object', required: ['prompt'], properties: {
      prompt: { type: 'string', description: 'What to generate. Be specific about subject, style, lighting and background.' },
      aspect: { type: 'string', enum: ['16:9', '4:3', '1:1', '3:4', '9:16'], description: 'Default 1:1.' },
      count: { type: 'integer', minimum: 1, maximum: 4, description: 'Number of images, default 1.' } } },
  },
  { name: 'flow_status', description: 'Check that the Flow login is still valid. Takes about 15 seconds.', inputSchema: { type: 'object', properties: {} } },
  { name: 'flow_signin_start', description: 'Use only when Google is signed out. Starts a browser on the Google sign-in page and returns a live-view link for the owner to sign in. Always follow with flow_signin_finish.', inputSchema: { type: 'object', properties: {} } },
  { name: 'flow_signin_finish', description: 'After the owner has signed in via the live view, stop that browser so the login is saved to the profile.', inputSchema: { type: 'object', required: ['browser_id'], properties: { browser_id: { type: 'string' } } } },
];

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const err = (t) => ({ isError: true, content: [{ type: 'text', text: t }] });

// Run fn(page) in a fresh profile browser and always stop the browser afterwards.
async function withFlow(env, fn) {
  const b = await startBrowser(env, 10);
  let page;
  try {
    await sleep(3000);
    page = await Page.attach(b.cdpUrl);
    return await fn(page);
  } finally { page?.close(); await stopBrowser(env, b.id); }
}

const signedOutMsg = 'Google is signed out in the flow-google profile. Call flow_signin_start, have the owner sign in through the link it returns, then call flow_signin_finish.';

async function callTool(name, a, env) {
  if (name === 'flow_generate_image') {
    if (!a.prompt) return err('prompt is required');
    try {
      return await withFlow(env, async (page) => {
        await openProject(page, env);
        const r = await generateImages(page, { prompt: a.prompt, aspect: a.aspect, count: a.count });
        if (!r.images.length) return err(`Flow produced no image. Its last message: ${r.agent}`);
        return { content: [{ type: 'text', text: `Generated ${r.images.length} image(s) with Google Flow.` }, ...r.images.map((i) => ({ type: 'image', data: i.b64, mimeType: i.type || 'image/jpeg' }))] };
      });
    } catch (e) { return err(e instanceof SignedOut ? signedOutMsg : `flow_generate_image failed: ${e.message}`); }
  }
  if (name === 'flow_status') {
    try {
      return await withFlow(env, async (page) => {
        await page.goto('https://flow.google.com/'); await sleep(2500);
        return (await signedIn(page)) ? text('Signed in to Google Flow.') : err(signedOutMsg);
      });
    } catch (e) { return err(`flow_status failed: ${e.message}`); }
  }
  if (name === 'flow_signin_start') {
    const b = await startBrowser(env, 30);
    try { await sleep(3000); const p = await Page.attach(b.cdpUrl); await p.goto(SIGNIN); p.close(); } catch {}
    return text(`Sign-in browser started. Give the owner this link (it controls the browser, so keep it private) and ask them to sign in to Google until Flow's dashboard shows:\n${b.liveUrl}\n\nThen call flow_signin_finish with browser_id ${b.id}. The browser expires in 30 minutes.`);
  }
  if (name === 'flow_signin_finish') {
    if (!a.browser_id) return err('browser_id is required');
    await stopBrowser(env, a.browser_id);
    return text('Browser stopped and the login saved to the profile. Run flow_status to confirm.');
  }
  return err(`Unknown tool ${name}`);
}

async function rpc(msg, env) {
  const { id, method, params } = msg;
  if (id === undefined) return null; // notification
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  switch (method) {
    case 'initialize': return ok({ protocolVersion: params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'flow-mcp', version: '1.0.0' } });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS });
    case 'tools/call': return ok(await callTool(params?.name, params?.arguments || {}, env));
    default: return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

const safeEqual = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok');
    const m = url.pathname.match(/^\/mcp(?:\/(.+))?$/);
    if (!m || !env.MCP_SECRET) return new Response('Not found', { status: 404 });
    const given = m[1] || (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!safeEqual(given, env.MCP_SECRET)) return new Response('Not found', { status: 404 });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    let body;
    try { body = await req.json(); } catch { return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 }); }
    const batch = Array.isArray(body);
    const out = (await Promise.all((batch ? body : [body]).map((x) => rpc(x, env)))).filter(Boolean);
    if (!out.length) return new Response(null, { status: 202 });
    return Response.json(batch ? out : out[0]);
  },
};
