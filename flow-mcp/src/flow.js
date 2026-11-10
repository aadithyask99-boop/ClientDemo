// Drives Google Flow's image agent in a signed-in cloud browser. Selectors are text-based because Flow's class names change.
import { sleep } from './util.js';

const FLOW = 'https://flow.google.com/';
const baseOf = `(u) => u.replace(/=s\\d+(-rw)?$/, '')`;

// All image base URLs currently on the page (size suffix removed, so thumbnails and originals compare equal).
const IMAGES = `(() => { const b = ${baseOf}; return [...new Set([...document.querySelectorAll('img')].filter(i => i.naturalWidth > 100 && /\\/asb\\//.test(i.currentSrc || i.src)).map(i => b(i.currentSrc || i.src)))]; })()`;

export async function signedIn(page) {
  // The logged-out visitor is sent to /about, whose "Create with Google Flow" button must not count; only the dashboard has "New project".
  return page.eval(`(() => location.host === 'flow.google.com' && !location.pathname.startsWith('/about') && /New project/i.test(document.body.innerText))()`);
}

async function dismissDialogs(page) {
  for (let i = 0; i < 4; i++) {
    const pos = await page.eval(`(() => { const b = [...document.querySelectorAll('button')].find(e => /^(get started|got it|dismiss|skip|close)$/i.test(e.textContent.trim())); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    if (!pos) return;
    await page.click(pos[0], pos[1]); await sleep(1200);
  }
}

// Open the working project: FLOW_PROJECT_ID, else the one remembered in KV, else create a new project and remember it.
export async function openProject(page, env) {
  const known = env.FLOW_PROJECT_ID || (await env.FLOW_STATE.get('flow-project'));
  const onProject = async () => /flow\.google\.com\/project\//.test(await page.eval('location.href'));
  if (known) {
    await page.goto(`${FLOW}project/${known}`);
    await sleep(2500);
  }
  if (!known || !(await onProject())) {
    await page.goto(FLOW);
    await sleep(2000);
    if (!(await signedIn(page))) throw new SignedOut();
    const pos = await page.waitFor(() => page.eval(`(() => { const b = [...document.querySelectorAll('button,a,div[role=button]')].find(e => /new project/i.test(e.textContent) && e.textContent.length < 30); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`), 15000, 'New project button');
    await page.click(pos[0], pos[1]);
    await page.waitFor(() => page.eval(`/\\/project\\//.test(location.pathname)`), 20000, 'project page');
    await sleep(2500);
  }
  if (!(await onProject())) throw new SignedOut();
  await dismissDialogs(page);
  const id = await page.eval(`location.pathname.split('/project/')[1]`);
  if (id && id !== known) await env.FLOW_STATE.put('flow-project', id);
  return id;
}

export class SignedOut extends Error {
  constructor() { super('Google is signed out in the flow-google browser profile.'); this.signedOut = true; }
}

const ASPECTS = new Set(['16:9', '4:3', '1:1', '3:4', '9:16']);

export async function generateImages(page, { prompt, aspect = '1:1', count = 1 }) {
  if (!ASPECTS.has(aspect)) throw new Error(`aspect must be one of ${[...ASPECTS].join(', ')}`);
  count = Math.min(Math.max(1, count | 0), 4);
  const before = new Set(await page.eval(IMAGES));

  // Focus the chat prompt box by finding its placeholder text, then type into it.
  const box = await page.waitFor(() => page.eval(`(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let best = null;
    while (w.nextNode()) { const e = w.currentNode; const ph = e.getAttribute('placeholder') || (e.children.length === 0 ? e.textContent.trim() : '');
      if (/what do you want to create/i.test(ph)) { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0) best = [r.x + Math.min(r.width / 2, 120), r.y + r.height / 2]; } }
    return best; })()`), 15000, 'prompt box');
  await page.click(box[0], box[1]); await sleep(500);
  await page.type(`Generate ${count} image${count > 1 ? 's' : ''}, no questions, aspect ratio ${aspect}: ${prompt}`);
  await sleep(600);
  const send = await page.eval(`(() => { const b = [...document.querySelectorAll('button')].filter(e => e.textContent.trim() === 'arrow_forward').pop(); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  if (!send) throw new Error('send button not found');
  await page.click(send[0], send[1]);

  // Wait for new images to appear and the agent to stop working (its stop button disappears).
  let stable = 0, fresh = [];
  const end = Date.now() + 150000;
  while (Date.now() < end) {
    await sleep(2500);
    const now = await page.eval(IMAGES);
    fresh = now.filter((u) => !before.has(u));
    const working = await page.eval(`[...document.querySelectorAll('button')].some(e => e.textContent.trim() === 'stop')`);
    stable = !working && fresh.length ? stable + 1 : 0;
    if (stable >= 2) break;
    // If the agent stopped without producing anything it is probably asking a question: stop waiting.
    if (!working && !fresh.length && Date.now() > end - 120000 + 30000) break;
  }
  const said = await page.eval(`(() => { const t = document.body.innerText; const i = t.lastIndexOf('Show thinking'); return (i >= 0 ? t.slice(i) : t.slice(-600)).replace(/\\s+/g, ' ').slice(0, 500); })()`);
  if (!fresh.length) return { images: [], agent: said };

  const images = [];
  for (const base of fresh.slice(0, count)) {
    const out = await page.eval(`(async () => { const r = await fetch(${JSON.stringify(base)} + '=s0', { credentials: 'include' }); const b = await r.blob(); const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let k = 0; k < u.length; k += 0x8000) s += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000)); return JSON.stringify({ type: b.type, bytes: u.length, b64: btoa(s) }); })()`);
    images.push(JSON.parse(out));
  }
  return { images, agent: said };
}
