// Minimal Chrome DevTools Protocol client that works in Cloudflare Workers and in Node 22.
// Workers cannot call `new WebSocket()` as a client, so they open one with fetch + Upgrade; Node uses the global WebSocket.

async function openSocket(wssUrl) {
  if (typeof WebSocketPair !== 'undefined') {
    const res = await fetch(wssUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:'), { headers: { Upgrade: 'websocket' } });
    const ws = res.webSocket;
    if (!ws) throw new Error(`CDP websocket upgrade failed (HTTP ${res.status})`);
    ws.accept();
    return ws;
  }
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(wssUrl);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', () => reject(new Error('CDP websocket error')));
  });
}

export class Page {
  constructor(ws) {
    this.ws = ws; this.n = 0; this.pending = new Map();
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data));
      const p = this.pending.get(m.id);
      if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
    });
    ws.addEventListener('close', () => { for (const p of this.pending.values()) p.reject(new Error('CDP socket closed')); this.pending.clear(); });
  }
  static async attach(cdpUrl) {
    const tabs = await (await fetch(`${cdpUrl}/json/list`)).json();
    const tab = tabs.find((t) => t.type === 'page');
    if (!tab) throw new Error('no page target in browser');
    return new Page(await openSocket(tab.webSocketDebuggerUrl));
  }
  send(method, params = {}) {
    const id = ++this.n;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`page error: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  }
  async goto(url) {
    await this.send('Page.navigate', { url });
    await this.waitFor(() => this.eval('document.readyState === "complete"'), 30000, 'page load');
  }
  async click(x, y) {
    for (const type of ['mousePressed', 'mouseReleased']) await this.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  async type(text) { await this.send('Input.insertText', { text }); }
  async waitFor(fn, timeoutMs, what = 'condition', every = 700) {
    const end = Date.now() + timeoutMs;
    for (;;) {
      const v = await fn();
      if (v) return v;
      if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
      await sleep(every);
    }
  }
  close() { try { this.ws.close(); } catch {} }
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
