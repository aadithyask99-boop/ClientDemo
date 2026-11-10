// Cloudflare Browser Rendering (free headless Chromium) with the Google login kept in KV, encrypted with a key derived from MCP_SECRET.
// The Worker saves and restores the session itself; the cookies never leave the Worker.
import puppeteer from '@cloudflare/puppeteer';
import { sleep } from './util.js';

const VIEWPORT = { width: 1440, height: 860 };
const KEY = 'google-session';

async function aesKey(env) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.MCP_SECRET), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('flow-mcp'), info: new TextEncoder().encode('kv-cookies') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const b64 = (u8) => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function saveSession(env, cookies) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), new TextEncoder().encode(JSON.stringify(cookies))));
  await env.FLOW_STATE.put(KEY, JSON.stringify({ iv: b64(iv), ct: b64(ct), saved: new Date().toISOString(), n: cookies.length }));
}
export async function loadSession(env) {
  const raw = await env.FLOW_STATE.get(KEY);
  if (!raw) return null;
  const { iv, ct } = JSON.parse(raw);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aesKey(env), unb64(ct))));
}
export async function sessionInfo(env) {
  const raw = await env.FLOW_STATE.get(KEY);
  return raw ? (({ saved, n }) => ({ saved, n }))(JSON.parse(raw)) : null;
}

export async function allCookies(page) {
  const c = await page.createCDPSession();
  const { cookies } = await c.send('Network.getAllCookies');
  return cookies;
}
async function restoreCookies(page, cookies) {
  const c = await page.createCDPSession();
  await c.send('Network.setCookies', { cookies: cookies.map(({ size, session, ...k }) => k) });
}

// Adapter so flow.js can drive a puppeteer page.
export class PPage {
  constructor(p) { this.p = p; }
  eval(expr) { return this.p.evaluate(expr); }
  async goto(url) { await this.p.goto(url, { waitUntil: 'load', timeout: 30000 }); }
  click(x, y) { return this.p.mouse.click(x, y); }
  type(text) { return this.p.keyboard.sendCharacter(text); }
  async waitFor(fn, timeoutMs, what = 'condition', every = 700) {
    const end = Date.now() + timeoutMs;
    for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error(`timed out waiting for ${what}`); await sleep(every); }
  }
}

// Run fn(PPage) in a fresh browser holding the saved Google login; save refreshed cookies afterwards.
export async function withFlow(env, fn) {
  const saved = await loadSession(env);
  if (!saved) { const e = new Error('No Google session saved.'); e.signedOut = true; throw e; }
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await restoreCookies(page, saved);
    const out = await fn(new PPage(page), page);
    try { await saveSession(env, await allCookies(page)); } catch {}
    return out;
  } finally { await browser.close().catch(() => {}); }
}
export { puppeteer, VIEWPORT };
