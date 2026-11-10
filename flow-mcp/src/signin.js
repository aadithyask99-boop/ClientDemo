// A tiny remote-browser page so the owner can sign in to Google inside Cloudflare's browser from their own browser.
// Frames are screenshots, input is forwarded as clicks and keystrokes. On "Finish" the Worker saves the session cookies
// (encrypted) to KV itself; they are never shown or returned.
import { puppeteer, VIEWPORT, saveSession, allCookies, sessionInfo } from './browser.js';

const SIGNIN_URL = 'https://accounts.google.com/v3/signin/identifier?continue=https://flow.google.com/&flowName=GlifWebSignIn&flowEntry=ServiceLogin';
const SID_KEY = 'signin-session';
const json = (o, status = 200) => Response.json(o, { status, headers: { 'Cache-Control': 'no-store' } });

async function current(env) {
  const sid = await env.FLOW_STATE.get(SID_KEY);
  if (!sid) return null;
  try { const browser = await puppeteer.connect(env.BROWSER, sid); const [page] = await browser.pages(); return { browser, page, sid }; }
  catch { await env.FLOW_STATE.delete(SID_KEY); return null; }
}

export async function handleSignin(req, env, rest) {
  if (req.method === 'GET' && rest === '') return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });

  if (rest === '/start' && req.method === 'POST') {
    let cur = await current(env);
    if (!cur) {
      const browser = await puppeteer.launch(env.BROWSER, { keep_alive: 600000 });
      const page = await browser.newPage();
      await page.setViewport(VIEWPORT);
      await page.goto(SIGNIN_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await env.FLOW_STATE.put(SID_KEY, browser.sessionId(), { expirationTtl: 600 });
      cur = { browser };
    }
    cur.browser.disconnect();
    return json({ ok: true, viewport: VIEWPORT, saved: await sessionInfo(env) });
  }

  const cur = await current(env);
  if (!cur) return json({ ok: false, error: 'no sign-in browser; press Start' }, 409);
  const { browser, page } = cur;
  try {
    if (rest === '/frame') {
      const img = await page.screenshot({ type: 'jpeg', quality: 55 });
      return new Response(img, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Page-Url': encodeURIComponent(page.url().slice(0, 200)) } });
    }
    if (rest === '/input' && req.method === 'POST') {
      const a = await req.json();
      if (a.type === 'click') await page.mouse.click(Number(a.x), Number(a.y));
      else if (a.type === 'text') await page.keyboard.sendCharacter(String(a.text).slice(0, 500));
      else if (a.type === 'key') await page.keyboard.press(String(a.key));
      else if (a.type === 'scroll') await page.mouse.wheel({ deltaY: Number(a.dy) || 0 });
      return json({ ok: true });
    }
    if (rest === '/finish' && req.method === 'POST') {
      const cookies = await allCookies(page);
      const hasLogin = cookies.some((c) => /^(__Secure-)?[13]?PSID$|^SID$/.test(c.name) && /google\.com$/.test(c.domain));
      if (!hasLogin) return json({ ok: false, error: 'No Google login found yet. Finish signing in, then try again.' }, 409);
      await saveSession(env, cookies);
      await browser.close();
      await env.FLOW_STATE.delete(SID_KEY);
      return json({ ok: true, saved: await sessionInfo(env) });
    }
    return json({ ok: false, error: 'not found' }, 404);
  } finally { try { if (rest !== '/finish') browser.disconnect(); } catch {} }
}

const HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flow sign-in</title>
<style>body{margin:0;background:#111;color:#ddd;font:14px system-ui}header{padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#1b1b1b}
button{background:#2d6cdf;color:#fff;border:0;border-radius:6px;padding:8px 14px;font:inherit;cursor:pointer}button.alt{background:#444}#st{flex:1;min-width:200px;color:#9aa}
#wrap{padding:10px}img{max-width:100%;border:1px solid #333;cursor:pointer;display:block;background:#000;min-height:200px;outline:none}input{background:#222;color:#fff;border:1px solid #444;border-radius:6px;padding:7px;width:220px}</style></head><body>
<header><button id="start">1. Start browser</button><span>click the screen, then type. Paste here:</span><input id="paste" placeholder="paste text, press Enter to send"><button class="alt" id="scr">Scroll down</button><button id="fin">2. Finish &amp; save login</button><span id="st">idle</span></header>
<div id="wrap"><img id="v" tabindex="0" alt="browser"></div>
<script>
const $=id=>document.getElementById(id),v=$('v'),st=$('st');let vp={width:1440,height:860},run=false,busy=false;
const post=(p,b)=>fetch(location.pathname.replace(/\\/$/,'')+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(r=>r.json());
async function loop(){while(run){try{const r=await fetch(location.pathname.replace(/\\/$/,'')+'/frame?'+Date.now());if(r.ok){const u=decodeURIComponent(r.headers.get('X-Page-Url')||'');v.src=URL.createObjectURL(await r.blob());st.textContent=u.replace(/^https?:\\/\\//,'').slice(0,60)}else{st.textContent='browser ended; press Start';run=false}}catch(e){st.textContent='error '+e.message}await new Promise(r=>setTimeout(r,700))}}
$('start').onclick=async()=>{st.textContent='starting (10-20 s)...';const r=await post('/start');if(r.ok){vp=r.viewport;run=true;loop()}else st.textContent=r.error||'failed'};
v.onclick=async e=>{const b=v.getBoundingClientRect();v.focus();await post('/input',{type:'click',x:(e.clientX-b.left)*v.naturalWidth/b.width,y:(e.clientY-b.top)*v.naturalHeight/b.height})};
const special=new Set(['Enter','Backspace','Tab','Escape','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']);
v.onkeydown=async e=>{if(e.ctrlKey||e.metaKey)return;if(special.has(e.key)){e.preventDefault();await post('/input',{type:'key',key:e.key})}else if(e.key.length===1){e.preventDefault();await post('/input',{type:'text',text:e.key})}};
$('paste').onkeydown=async e=>{if(e.key==='Enter'){const t=e.target.value;e.target.value='';await post('/input',{type:'text',text:t})}};
$('scr').onclick=()=>post('/input',{type:'scroll',dy:500});
$('fin').onclick=async()=>{st.textContent='saving...';const r=await post('/finish');if(r.ok){run=false;st.textContent='saved. You can close this page.'}else st.textContent=r.error||'failed'};
</script></body></html>`;
