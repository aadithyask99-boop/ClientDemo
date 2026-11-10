// flow-mcp: an MCP server (Streamable HTTP, stateless) that generates images in Google Flow through a signed-in cloud browser.
// Runs on Cloudflare's free Browser Rendering; the Google login is stored encrypted in KV (see browser.js, signin.js).
// Auth: the secret in the URL path (/mcp/<MCP_SECRET>, for claude.ai connectors, which cannot send headers) or
// "Authorization: Bearer <MCP_SECRET>" on /mcp. Secret: MCP_SECRET. Var: FLOW_PROJECT_ID (optional, pins one Flow project).
import { withFlow, sessionInfo } from './browser.js';
import { sleep } from './util.js';
import { handleSignin } from './signin.js';
import { openProject, generateImages, signedIn, SignedOut } from './flow.js';

const TOOLS = [
  {
    name: 'flow_generate_image',
    description: "Generate images with Google Flow (Nano Banana) using the owner's signed-in Flow account. Images are free against the Flow plan. Takes 30 to 120 seconds. Returns the full-size image(s). If it reports Google is signed out, call flow_signin_link. Free plan: about 10 minutes of browser time a day, so roughly 6 images a day.",
    inputSchema: { type: 'object', required: ['prompt'], properties: {
      prompt: { type: 'string', description: 'What to generate. Be specific about subject, style, lighting and background.' },
      aspect: { type: 'string', enum: ['16:9', '4:3', '1:1', '3:4', '9:16'], description: 'Default 1:1.' },
      count: { type: 'integer', minimum: 1, maximum: 4, description: 'Number of images, default 1.' } } },
  },
  { name: 'flow_status', description: 'Check that the Flow login is still valid. Takes about 20 seconds.', inputSchema: { type: 'object', properties: {} } },
  { name: 'flow_signin_link', description: 'Use only when Google is signed out. Returns the private page where the owner signs in to Google inside the Flow browser. Give them the link and ask them to follow its two buttons.', inputSchema: { type: 'object', properties: {} } },
];

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const err = (t) => ({ isError: true, content: [{ type: 'text', text: t }] });

const signedOutMsg = 'Google is signed out in the Flow browser. Call flow_signin_link and give the owner the link.';

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
    } catch (e) { return err(e instanceof SignedOut || e.signedOut ? signedOutMsg : /429|limit/i.test(e.message) ? 'Cloudflare free browser time for today is used up (resets at 00:00 UTC). Try again tomorrow.' : `flow_generate_image failed: ${e.message}`); }
  }
  if (name === 'flow_status') {
    try {
      return await withFlow(env, async (page) => {
        await page.goto('https://flow.google.com/'); await sleep(2500);
        return (await signedIn(page)) ? text(`Signed in to Google Flow. Session saved ${(await sessionInfo(env))?.saved}.`) : err(signedOutMsg);
      });
    } catch (e) { return e.signedOut ? err(signedOutMsg) : err(`flow_status failed: ${e.message}`); }
  }
  if (name === 'flow_signin_link') return text(`Give the owner this private link (anyone with it can use the sign-in page, so keep it private). They press Start browser, sign in to Google until Flow's dashboard shows, then press Finish & save login:\n${env.PUBLIC_URL}/signin/${env.MCP_SECRET}`);
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
  async fetch(req, baseEnv) {
    const url = new URL(req.url);
    // Inside the site: the sign-in link uses the site's own address, and any other path is served by the site's static assets.
    const env = Object.assign(Object.create(baseEnv), { PUBLIC_URL: baseEnv.PUBLIC_URL || url.origin });
    if (url.pathname === '/health') return new Response('ok');
    if (!/^\/(signin|mcp)(\/|$)/.test(url.pathname) && baseEnv.ASSETS) return baseEnv.ASSETS.fetch(req);
    const si = url.pathname.match(/^\/signin\/([^/]+)(\/.*)?$/);
    if (si && env.MCP_SECRET) {
      if (!safeEqual(si[1], env.MCP_SECRET)) return new Response('Not found', { status: 404 });
      return handleSignin(req, env, si[2] || '');
    }
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
