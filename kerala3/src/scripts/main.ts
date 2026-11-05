import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { site } from '../data/site';
import { pookalam, boat, kingfisher, shower } from './eggs';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const pinned = root.classList.contains('pin');
const hero = root.dataset.hero || '1';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

addEventListener('hashchange', () => location.reload());

/* ---------- smooth scroll ---------- */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y: number) => (lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y }));

/* ---------- header: tone follows what is under it, hides on scroll down, mega menu ---------- */
const topEl = $('#top');
const toneAt = (x: number, y: number) => {
  const el = document.elementsFromPoint(x, y).find((e) => !e.closest('.top, .egg-layer, .review'));
  const t = el?.closest('[data-tone]') as HTMLElement | null;
  return t?.dataset.tone === 'light' ? 'light' : 'dark';
};
let lastY = 0, tick = 0;
gsap.ticker.add(() => {
  const y = scrollY;
  if (++tick % 5 === 0) topEl.dataset.on = toneAt(innerWidth / 2, 40);
  if (Math.abs(y - lastY) > 4) { topEl.classList.toggle('hide', y > lastY && y > 300); lastY = y; }
  topEl.classList.toggle('solid', y > innerHeight * 0.8);
});
topEl.dataset.on = 'dark';
const mega = $('#mega');
const trig = $('.has-mega');
let megaT = 0;
const megaOpen = (v: boolean) => { clearTimeout(megaT); megaT = window.setTimeout(() => mega.classList.toggle('open', v), v ? 0 : 160); };
trig?.addEventListener('mouseenter', () => megaOpen(true));
topEl.addEventListener('mouseleave', () => megaOpen(false));
mega.addEventListener('mouseenter', () => megaOpen(true));

/* ---------- text reveal: split into words, rise and clear ---------- */
function splitWords(el: HTMLElement) {
  const nodes = Array.from(el.childNodes);
  el.textContent = '';
  const words: HTMLElement[] = [];
  nodes.forEach((n) => {
    const italic = n.nodeType === 1 && (n as HTMLElement).tagName === 'I';
    const txt = (n.textContent || '').trim();
    txt.split(/\s+/).filter(Boolean).forEach((w) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em';
      const inner = document.createElement(italic ? 'i' : 'span');
      inner.style.display = 'inline-block';
      inner.textContent = w;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      el.appendChild(document.createTextNode(' '));
      words.push(inner);
    });
  });
  return words;
}
if (!reduced) {
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115, opacity: 0 });
    gsap.to(words, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-fade]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 30, filter: 'blur(8px)', duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

/* ---------- weather over photographs: soft rain, mist, dust. Draws only while on screen ---------- */
type Kind = 'rain' | 'mist' | 'dust';
function weather(canvas: HTMLCanvasElement, kind: () => Kind, visible: () => boolean) {
  if (reduced) { canvas.style.display = 'none'; return; }
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let w = 0, h = 0;
  const size = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
  const sc = sprite.getContext('2d')!; const g = sc.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); sc.fillStyle = g; sc.fillRect(0, 0, 256, 256);
  const drops = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), l: 0.5 + Math.random(), v: 0.8 + Math.random() * 0.8 }));
  const puffs = Array.from({ length: 9 }, (_, i) => ({ x: Math.random(), y: 0.15 + Math.random() * 0.75, s: 0.5 + Math.random() * 0.6, v: 0.01 + Math.random() * 0.02, a: 0.18 + Math.random() * 0.2, i }));
  const motes = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.4, v: 0.004 + Math.random() * 0.01, p: Math.random() * 6 }));
  let last = performance.now();
  gsap.ticker.add(() => {
    if (!visible()) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, w, h);
    const k = kind();
    if (k === 'rain') {
      ctx.strokeStyle = 'rgba(235,245,240,.34)'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (const d of drops) {
        d.y += dt * d.v * 1.4; d.x -= dt * 0.05; if (d.y > 1.05) { d.y = -0.1; d.x = Math.random() * 1.1; }
        const x = d.x * w, y = d.y * h; ctx.moveTo(x, y); ctx.lineTo(x - 5 * d.l, y + 26 * d.l);
      }
      ctx.stroke();
    } else if (k === 'mist') {
      for (const p of puffs) {
        p.x += dt * p.v; if (p.x > 1.4) p.x = -0.4;
        const s = Math.max(w, h) * p.s; ctx.globalAlpha = p.a; ctx.drawImage(sprite, p.x * w - s / 2, p.y * h - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (const m of motes) {
        m.y -= dt * m.v; m.p += dt; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
        ctx.globalAlpha = 0.25 + 0.3 * Math.sin(m.p * 1.6) ** 2; ctx.beginPath(); ctx.arc((m.x + Math.sin(m.p * 0.5) * 0.01) * w, m.y * h, m.r, 0, 6.3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  });
}
const onScreen = (el: HTMLElement) => { let v = true; new IntersectionObserver((e) => (v = e[0].isIntersecting), { threshold: 0 }).observe(el); return () => v; };

/* ---------- HERO ---------- */
const heroEl = $('#hero');
const heroVisible = onScreen(heroEl);
if (!reduced) {
  gsap.set('.line-in', { yPercent: 112 });
  gsap.set('.hero-sub', { opacity: 0, y: 16 });
  gsap.to('.line-in', { yPercent: 0, duration: 1.6, ease: 'power3.out', stagger: 0.16, delay: 0.3 });
  gsap.to('.hero-sub', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 1.1 });
}

// shared cursor parallax for foliage layers
const fol = $$('.f, .L').filter((e) => e.offsetParent !== null || true);
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
const depthOf = (e: HTMLElement) => parseFloat(e.dataset.depth || e.dataset.z || '1');
const scrollDrive = { p: 0 };
if (!reduced) {
  gsap.ticker.add(() => {
    mouse.sx += (mouse.x - mouse.sx) * 0.06; mouse.sy += (mouse.y - mouse.sy) * 0.06;
    if (!heroVisible()) return;
    const sel = hero === '1' ? '.fol .f' : hero === '3' ? '.layers .L' : '';
    if (!sel) return;
    $$(sel).forEach((e) => {
      const d = depthOf(e);
      if (hero === '1') gsap.set(e, { x: -mouse.sx * 46 * d, y: -mouse.sy * 28 * d + scrollY * 0.12 * d, rotation: mouse.sx * 2.2 * d });
      else { const s = 1 + scrollDrive.p * d * 1.5; gsap.set(e, { x: -mouse.sx * 34 * d, y: -mouse.sy * 20 * d, scale: s, opacity: clamp(1.4 - scrollDrive.p * (0.6 + d * 0.5), 0, 1) }); }
    });
  });
}

if (hero === '1') {
  const seasons = $$<HTMLImageElement>('.season');
  let si = 0;
  const kindNow = () => site.hero.seasons[si].weather as Kind;
  weather($('#weather') as HTMLCanvasElement, kindNow, heroVisible);
  if (!reduced) {
    setInterval(() => {
      if (!heroVisible()) return;
      seasons[si].classList.remove('on');
      si = (si + 1) % seasons.length;
      seasons[si].classList.add('on');
    }, 6800);
    gsap.to('.s1 .season', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
  }
}

if (hero === '4') initScenes();
function initScenes() {
  const base = import.meta.env.BASE_URL;
  const data = site.scenes as any[];
  const n = data.length;
  const layers = $$('.scn');
  const stage = $('.s4');
  const cs = $('#cs'), head = $('.cs-head'), titleEl = $('#h4-title'), mlEl = $('#cs-ml'), pEl = $('#cs-p'), lineEl = $('#h4-line'), zoom = $('.zoomblur');
  const endEl = $('#cs-end'), soundBtn = $('#cs-sound');
  const bar = $$('.cs-meta, .cs-nav, .cs-cta, .cs-sound, .cs-c, .cs-scroll', cs);
  const segmenter = new Intl.Segmenter('ml', { granularity: 'grapheme' });
  const graphemes = (t: string) => Array.from(segmenter.segment(t), (x) => x.segment);
  const ML = Array.from('കഖഗഘചജടഠഡതദധനപഫബഭമയരലവശഷസഹളഴറ');
  const LAT = Array.from('ABCDEFGHIKLNORSTUY');
  const rnd = (a: string[]) => a[Math.floor(Math.random() * a.length)];
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const visible = onScreen(heroEl);
  const whenVisible = async () => { while (!visible() || document.hidden) await sleep(300); };
  const phone = innerWidth <= 820;
  const dbg = location.search.includes('debug');

  // live local time, as in the reference
  const clock = $('#cs-time');
  const tick = () => { clock.textContent = '[ ' + new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + ' ]'; };
  tick(); setInterval(tick, 20000);

  // ---- the title: two lines of single-letter spans, changed in place; its size fits so it never reaches the top bar
  const fit = (lines: string[]) => {
    const p = document.createElement('div');
    p.className = 'cs-title'; p.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0';
    lines.forEach((l) => { const s = document.createElement('span'); s.style.display = 'inline-block'; s.textContent = l; p.appendChild(s); p.appendChild(document.createElement('br')); });
    cs.appendChild(p);
    const w = Math.max(...Array.from(p.querySelectorAll('span')).map((s) => s.getBoundingClientRect().width));
    p.remove();
    return Math.min(1, (innerWidth * 0.43) / w);
  };
  const applyFit = (lines: string[]) => { titleEl.style.fontSize = `calc(8.6vw * ${fit(lines).toFixed(3)})`; };
  const build = (lines: string[][]) => { titleEl.innerHTML = lines.map((ln) => `<span class="ln">${ln.map((c) => `<span class="g">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`).join(''); };
  const glyphs = () => $$('.g', titleEl);
  const setLine = (t: string) => { lineEl.innerHTML = t.split(' ').map((w) => `<span class="w">${w}</span>`).join(' '); };
  const revealLine = () => { $$('.w', lineEl).forEach((w, i) => setTimeout(() => w.classList.add('on'), 250 + i * 170)); };
  applyFit(data[0].title);
  let target = data[0].title.map((t: string) => graphemes(t));
  build(target);
  lineEl.style.opacity = '0';

  // ---- text that adapts: every element is checked against the picture behind it (contrast of white and of dark ink
  //      against every sampled pixel), takes the better one, and gets a soft halo in the opposite tone when it still struggles
  const PW = 112, PH = Math.max(40, Math.round(112 * innerHeight / innerWidth));
  const probe = document.createElement('canvas'); probe.width = PW; probe.height = PH;
  const pctx = probe.getContext('2d', { willReadFrequently: true })!;
  const lin = new Float32Array(256).map((_, i) => { const s = i / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  const inkEls = $$('.cs-title, .cs-ml, .cs-meta, .cs-nav, .cs-cta, .cs-sound, .cs-p, .cs-line, .cs-c, .cs-scroll', cs);
  const big = new Set(['cs-title', 'cs-line', 'cs-ml']);
  const was = new Map<HTMLElement, boolean>(); // true: dark ink
  const vids = layers.map((l) => l.querySelector('video') as HTMLVideoElement | null);
  const topMedia = () => {
    const lay = layers.find((l) => l.classList.contains('next')) || layers.find((l) => l.classList.contains('on')) || layers[0];
    const v = lay.querySelector('video') as HTMLVideoElement | null;
    return v && v.readyState >= 2 && v.classList.contains('live') ? v : (lay.querySelector('img') as HTMLImageElement);
  };
  const sample = () => {
    const m = topMedia() as any;
    const mw = m.videoWidth || m.naturalWidth, mh = m.videoHeight || m.naturalHeight;
    if (!mw) return;
    const s = Math.max(PW / mw, PH / mh);
    try { pctx.drawImage(m, (PW - mw * s) / 2, (PH - mh * s) / 2, mw * s, mh * s); } catch { return; }
    const d = pctx.getImageData(0, 0, PW, PH).data;
    inkEls.forEach((el) => {
      if (getComputedStyle(el).display === 'none') return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const x0 = Math.max(0, Math.floor((r.left / innerWidth) * PW)), x1 = Math.min(PW, Math.ceil((r.right / innerWidth) * PW));
      const y0 = Math.max(0, Math.floor((r.top / innerHeight) * PH)), y1 = Math.min(PH, Math.ceil((r.bottom / innerHeight) * PH));
      if (x1 <= x0 || y1 <= y0) return;
      const need = Array.from(el.classList).some((c) => big.has(c)) ? 3 : 4.5;
      let pw = 0, pd = 0, cnt = 0, sumL = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const k = (y * PW + x) * 4;
        const L = 0.2126 * lin[d[k]] + 0.7152 * lin[d[k + 1]] + 0.0722 * lin[d[k + 2]];
        if (1.05 / (L + 0.05) >= need) pw++;
        if ((L + 0.05) / 0.058 >= need) pd++;
        sumL += L; cnt++;
      }
      const fw = pw / cnt, fd = pd / cnt, meanL = sumL / cnt;
      const prev = was.get(el);
      // white is the cinematic default; dark ink only where the picture is genuinely light and dark clears almost every pixel
      let dark = prev ? (fd >= 0.9 && fd > fw) : (meanL > 0.42 && fd >= 0.9 && fd > fw + 0.2);
      was.set(el, dark);
      const fail = 1 - (dark ? fd : fw);
      el.style.setProperty('--ink', dark ? '#17110d' : '#ffffff');
      el.style.setProperty('--shade', (dark ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + Math.min(0.78, 0.2 + fail * 0.7).toFixed(2) + ')');
      el.style.setProperty('--sb', Math.round(14 + fail * 30) + 'px');
    });
  };
  sample(); setInterval(() => { if (visible()) sample(); }, 260);
  if (reduced) { document.documentElement.classList.remove('intro'); pEl.style.opacity = '1'; soundBtn.style.display = 'none'; return; }

  // ---- sound: ambient beds per scene, music, a swell on each cut, a voice line per scene. Everything is driven by the scene engine.
  const sound = (() => {
    let ctx: AudioContext | null = null;
    let master: GainNode, bedBus: GainNode, musicBus: GainNode, voiceBus: GainNode, analyser: AnalyserNode;
    const cache: Record<string, Promise<AudioBuffer>> = {};
    let want = false, running = false, curBed: { stop: (f: number) => void } | null = null, musicStarted = false, voiceSrc: AudioBufferSourceNode | null = null;
    let scene = 0, bedScene = -1;
    const store = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} } };
    const get = (name: string) => cache[name] || (cache[name] = fetch(`${base}audio/${name}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx!.decodeAudioData(b)));
    const curve = (up: boolean) => { const a = new Float32Array(48); for (let i = 0; i < 48; i++) { const t = i / 47; a[i] = up ? Math.sin(t * Math.PI / 2) : Math.cos(t * Math.PI / 2); } return a; };
    const UP = curve(true), DOWN = curve(false);
    // a loop that overlaps itself with an equal-power crossfade, so the seam cannot be heard
    const loop = (name: string, bus: AudioNode, level: number, fadeIn: number) => {
      const out = ctx!.createGain(); out.gain.value = 0; out.connect(bus);
      out.gain.setValueAtTime(0, ctx!.currentTime); out.gain.linearRampToValueAtTime(level, ctx!.currentTime + fadeIn);
      let timer = 0, stopped = false;
      const spawn = async (when: number) => {
        const buf = await get(name); if (stopped) return;
        const xf = Math.min(2.0, buf.duration * 0.12), t = Math.max(when, ctx!.currentTime + 0.05);
        const s = ctx!.createBufferSource(), g = ctx!.createGain(); s.buffer = buf; s.connect(g); g.connect(out);
        g.gain.setValueAtTime(0, t); g.gain.setValueCurveAtTime(UP, t, xf);
        g.gain.setValueAtTime(1, t + buf.duration - xf); g.gain.setValueCurveAtTime(DOWN, t + buf.duration - xf, xf);
        s.start(t); s.stop(t + buf.duration + 0.05);
        const next = t + buf.duration - xf;
        timer = window.setTimeout(() => spawn(next), Math.max(50, (next - ctx!.currentTime - 1.2) * 1000));
      };
      spawn(ctx!.currentTime);
      return { stop: (f: number) => { stopped = true; clearTimeout(timer); out.gain.cancelScheduledValues(ctx!.currentTime); out.gain.setValueAtTime(out.gain.value, ctx!.currentTime); out.gain.linearRampToValueAtTime(0, ctx!.currentTime + f); setTimeout(() => out.disconnect(), f * 1000 + 300); } };
    };
    const once = async (name: string, level: number, bus: AudioNode, delay = 0) => {
      const buf = await get(name); if (!ctx) return null;
      const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; g.gain.value = level; s.connect(g); g.connect(bus); s.start(ctx.currentTime + delay); return s;
    };
    const duck = (on: boolean) => {
      if (!ctx) return; const t = ctx.currentTime;
      bedBus.gain.cancelScheduledValues(t); bedBus.gain.setTargetAtTime(on ? 0.42 : 1, t, on ? 0.25 : 0.7);
      musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(on ? 0.5 : 1, t, on ? 0.25 : 0.7);
    };
    const start = () => {
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0;
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.3;
        analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
        master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
        bedBus = ctx.createGain(); musicBus = ctx.createGain(); voiceBus = ctx.createGain();
        bedBus.connect(master); musicBus.connect(master); voiceBus.connect(master);
      }
      ctx.resume();
      running = true;
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, 0.35);
      if (!musicStarted) { musicStarted = true; loop('music', musicBus, 0.7, 4); }
      if (!curBed || bedScene !== scene) { const old = curBed; curBed = loop('bed-' + (scene + 1), bedBus, 0.9, old ? 1.5 : 2.5); bedScene = scene; if (old) old.stop(1.5); }
    };
    const stop = () => { if (!ctx) return; running = false; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.25); if (voiceSrc) { try { voiceSrc.stop(ctx.currentTime + 0.6); } catch {} } };
    return {
      get on() { return want; },
      set(v: boolean) { want = v; store.set('k3sound', v ? '1' : '0'); v ? start() : stop(); },
      remembered() { return store.get('k3sound') === '1'; },
      resumeIfWanted() { if (want && !running) start(); },
      // called by the scene engine
      cutTo(i: number, fade: number) {
        scene = i; if (!ctx || !running) return;
        once('swell', 0.55, bedBus);
        const old = curBed; curBed = loop('bed-' + (i + 1), bedBus, 0.9, fade); bedScene = i; if (old) old.stop(fade);
      },
      voice(i: number, delay = 0) {
        if (!ctx || !running) return;
        get('voice-' + (i + 1)).then((buf) => {
          if (!ctx || !running) return;
          if (voiceSrc) { try { voiceSrc.stop(); } catch {} }
          const s = ctx.createBufferSource(); s.buffer = buf; s.connect(voiceBus);
          const t0 = ctx.currentTime + delay; s.start(t0); voiceSrc = s;
          setTimeout(() => duck(true), delay * 1000);
          setTimeout(() => duck(false), (delay + buf.duration) * 1000 + 300);
        });
      },
      endMusic(up: boolean) { if (ctx && running) musicBus.gain.setTargetAtTime(up ? 1.5 : 1, ctx.currentTime, 0.8); },
      hush(v: boolean) { if (!ctx || !want) return; if (v) stop(); else if (!running) start(); },
      level() { if (!analyser) return 0; const a = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(a); let s = 0; for (const x of a) { const v = (x - 128) / 128; s += v * v; } return Math.sqrt(s / a.length); },
      get running() { return running; },
    };
  })();
  const paintSound = () => { soundBtn.textContent = sound.on ? 'SOUND ON' : 'SOUND OFF'; soundBtn.setAttribute('aria-pressed', String(sound.on)); };
  soundBtn.addEventListener('click', (e) => { e.stopPropagation(); sound.set(!sound.on); paintSound(); });
  // browsers only allow sound after a touch: if the visitor chose sound before, the next touch anywhere brings it back
  if (sound.remembered()) { soundBtn.textContent = 'SOUND OFF'; addEventListener('pointerdown', () => { if (!sound.on) { sound.set(true); paintSound(); } }, { once: true }); }
  setInterval(() => { sound.hush(!visible() || document.hidden); }, 500);
  if (dbg) (window as any).__k3 = { sound, state: () => ({ cur, moving }) };

  // ---- video: the first two load at once, the rest as they come up; only the visible one plays
  const loadVideo = (i: number) => {
    const v = vids[i];
    if (!v || phone || v.src) return;
    v.src = v.dataset.src!; v.load();
    v.addEventListener('playing', () => v.classList.add('live'), { once: true });
  };
  let cur = 0, moving = false;
  const play = (i: number) => { loadVideo(i); loadVideo((i + 1) % n); const v = vids[i]; if (v) { v.currentTime = 0; v.play().catch(() => {}); } };
  const settle = (keep: number) => vids.forEach((v, k) => { if (v && k !== keep) v.pause(); });
  play(0); loadVideo(1);
  setInterval(() => { const v = vids[cur]; if (!v) return; if (!visible()) v.pause(); else if (v.paused && v.classList.contains('live')) v.play().catch(() => {}); }, 600);

  // ---- single letters glitch to a Malayalam letter for a blink (as in the reference)
  const flip = (el: HTMLElement, ms = 90 + Math.random() * 90) => { if (el.dataset.f) return; const keep = el.textContent; el.dataset.f = '1'; el.textContent = rnd(ML); setTimeout(() => { el.textContent = keep; delete el.dataset.f; }, ms); };
  setInterval(() => {
    if (!visible() || titleEl.dataset.busy) return;
    const sp = glyphs().filter((s) => s.textContent && s.textContent.trim());
    if (!sp.length) return;
    flip(sp[Math.floor(Math.random() * sp.length)]);
    if (Math.random() < 0.25) flip(sp[Math.floor(Math.random() * sp.length)]);
  }, 1100);

  // ---- at a cut the whole title scrambles and resolves into the next one
  const scramble = (to: string[], dur = 1100) => new Promise<void>((done) => {
    applyFit(to);
    target = to.map((t) => graphemes(t));
    build(target.map((ln) => ln.map((c) => (c === ' ' ? ' ' : '·'))));
    const sp = glyphs(); const flat = target.flat();
    const start = performance.now();
    const at = flat.map((_, i) => (i / flat.length) * dur * 0.7 + Math.random() * dur * 0.3);
    titleEl.dataset.busy = '1';
    const id = setInterval(() => {
      const t = performance.now() - start;
      sp.forEach((el, i) => {
        const c = flat[i]; if (c === ' ') return;
        const v = t >= at[i] ? c : rnd(Math.random() < 0.55 ? ML : LAT);
        if (el.textContent !== v) el.textContent = v;
      });
      if (t >= dur) { clearInterval(id); delete titleEl.dataset.busy; done(); }
    }, 46);
  });

  // ---- entrance: from black, the fire; the title appears in the middle, holds, then glides to the corner while the blur clears
  document.documentElement.classList.remove('intro');
  gsap.set(stage, { opacity: 0 }); gsap.set(cs, { opacity: 1 });
  titleEl.style.opacity = '0'; mlEl.style.opacity = '0'; pEl.style.opacity = '0'; gsap.set(bar, { opacity: 0 });
  const hb = head.getBoundingClientRect();
  const S0 = 1.7, L = innerWidth * 0.011, T = innerHeight * 0.042;
  const dx = innerWidth / 2 - L - (hb.width * S0) / 2, dy = innerHeight / 2 - T - (hb.height * S0) / 2;
  gsap.set(head, { x: dx, y: dy, scale: S0 });
  gsap.to(stage, { opacity: 1, duration: 1.8, ease: 'power2.in' });
  gsap.fromTo(zoom, { opacity: 1, scale: 1.12 }, { opacity: 0, scale: 1, duration: 5.2, ease: 'power2.out', delay: 1.2 });
  gsap.fromTo(layers[0].querySelectorAll('img, video'), { scale: 1.28 }, { scale: 1, duration: 6.4, ease: 'power2.out', delay: 0.6 });
  gsap.to(head, { x: 0, y: 0, scale: 1, duration: 3.4, ease: 'power3.inOut', delay: 3.0 });
  gsap.to(mlEl, { opacity: 1, duration: 0.9, delay: 5.6 });
  gsap.to(mlEl, { opacity: 0, duration: 1.0, delay: 8.2 });
  gsap.to(bar, { opacity: 1, duration: 1.2, stagger: 0.14, delay: 4.4 });
  gsap.to(pEl, { opacity: 1, duration: 1.4, delay: 6.0 });
  (async () => {
    await sleep(1500);
    titleEl.style.opacity = '1';
    await scramble(data[0].title, 1300);
  })();
  setTimeout(() => sound.voice(0, 0), 3400); // the first line is spoken as the title glides to its corner
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!titleEl.dataset.busy) applyFit(data[cur].title); });

  // ---- the cut: a slanted panel carrying the next place slides in (transforms only, so it stays smooth)
  const wipe = (from: number, to: number, dur = 1.9) => new Promise<void>((done) => {
    const next = layers[to], outgoing = layers[from];
    const Wd = innerWidth;
    next.classList.add('next');
    gsap.set(next, { x: -Wd * 1.2, skewX: -14 });
    gsap.fromTo(next.querySelectorAll('img, video'), { scale: 1.2 }, { scale: 1, duration: dur * 1.6, ease: 'power3.out' });
    gsap.to(outgoing, { x: Wd * 0.06, duration: dur, ease: 'power2.inOut' });
    gsap.to(next, { x: 0, skewX: 0, duration: dur, ease: 'power3.inOut', onComplete: () => {
      outgoing.classList.remove('on'); gsap.set(outgoing, { clearProps: 'transform' });
      next.classList.remove('next'); next.classList.add('on'); gsap.set(next, { clearProps: 'transform' });
      done();
    } });
  });

  // ---- skipping: a click or tap, or the arrow keys, goes straight to the next place
  let skip: (() => void) | null = null;
  const nap = (ms: number) => new Promise<void>((r) => { const t = setTimeout(r, ms); skip = () => { clearTimeout(t); r(); }; });
  heroEl.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a, button')) return; if (!moving && skip) skip(); });
  addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' && visible() && !moving && skip) skip(); });

  // ---- the end card: after the last place the film ends on the logo and an invitation, then starts again
  const endCard = async () => {
    cs.dataset.end = '1';
    gsap.to([pEl, lineEl, head], { opacity: 0, duration: 0.8 });
    gsap.set(endEl, { opacity: 0 }); endEl.classList.add('on'); endEl.setAttribute('aria-hidden', 'false');
    gsap.to(endEl, { opacity: 1, duration: 1.6, ease: 'power2.inOut' });
    gsap.fromTo(endEl.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, stagger: 0.22, ease: 'power3.out', delay: 0.5 });
    sound.voice(6, 1.2); sound.endMusic(true);
    sample();
    await nap(8500);
    gsap.to(endEl, { opacity: 0, duration: 1.2 });
    await sleep(1200); endEl.classList.remove('on'); endEl.setAttribute('aria-hidden', 'true');
    gsap.to([lineEl], { opacity: 0, duration: 0 }); gsap.to(head, { opacity: 1, duration: 0.8 });
    delete cs.dataset.end; sound.endMusic(false);
  };

  (async () => {
    await sleep(9800);
    for (;;) {
      await whenVisible();
      const next = (cur + 1) % n;
      moving = true;
      play(next);
      gsap.to(pEl, { opacity: 0, duration: 0.6 });
      gsap.to(lineEl, { opacity: 0, duration: 0.5 });
      sound.cutTo(next, 1.9);
      const w = wipe(cur, next, 1.9);
      await sleep(420);
      await scramble(data[next].title, 1100);
      setLine(data[next].line || ''); lineEl.style.opacity = '1'; revealLine();
      sound.voice(next, 0.7);
      await w;
      settle(next);
      cur = next;
      sample();
      moving = false;
      await nap(7600);
      if (cur === n - 1) { moving = true; await endCard(); moving = false; }
    }
  })();

  // ---- the cursor: the footage drifts a little, and letters near the pointer flip to Malayalam
  if (!phone) {
    const qx = gsap.quickTo(stage, 'x', { duration: 1.4, ease: 'power3.out' });
    const qy = gsap.quickTo(stage, 'y', { duration: 1.4, ease: 'power3.out' });
    gsap.set(stage, { scale: 1.03 });
    let last = 0;
    heroEl.addEventListener('pointermove', (e) => {
      qx(-(e.clientX / innerWidth - 0.5) * 22); qy(-(e.clientY / innerHeight - 0.5) * 12);
      const now = performance.now(); if (now - last < 70 || titleEl.dataset.busy) return; last = now;
      glyphs().forEach((g) => { const r = g.getBoundingClientRect(); if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.height * 0.55 && g.textContent!.trim()) flip(g, 130); });
    });
  }

  // ---- scrolling hands the hero over to the page
  gsap.to(cs, { opacity: 0, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: '55% top', scrub: true } });
  gsap.to(stage, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
}

if (hero === '2') initGlass();
function initGlass() {
  const c = $('#glass') as HTMLCanvasElement;
  const sharp = $('.glass-sharp') as HTMLImageElement;
  if (reduced) { c.style.display = 'none'; return; }
  const ctx = c.getContext('2d')!;
  const mask = document.createElement('canvas'); const mctx = mask.getContext('2d')!;
  const blur = document.createElement('canvas'); const bctx = blur.getContext('2d')!;
  const brush = document.createElement('canvas'); brush.width = brush.height = 128;
  const bg = brush.getContext('2d')!; const gr = bg.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); bg.fillStyle = gr; bg.fillRect(0, 0, 128, 128);
  let w = 0, h = 0;
  const build = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = c.clientWidth; h = c.clientHeight;
    c.width = mask.width = blur.width = Math.round(w * dpr); c.height = mask.height = blur.height = Math.round(h * dpr);
    const iw = sharp.naturalWidth || 1600, ih = sharp.naturalHeight || 900;
    const sc = Math.max(c.width / iw, c.height / ih), dw = iw * sc, dh = ih * sc;
    // blur by shrinking and enlarging, works in every browser
    const tiny = document.createElement('canvas'); tiny.width = Math.max(8, Math.round(c.width / 16)); tiny.height = Math.max(8, Math.round(c.height / 16));
    tiny.getContext('2d')!.drawImage(sharp, (tiny.width - dw / 16) / 2, (tiny.height - dh / 16) / 2, dw / 16, dh / 16);
    bctx.imageSmoothingQuality = 'high'; bctx.drawImage(tiny, 0, 0, c.width, c.height);
    bctx.fillStyle = 'rgba(214,226,220,.22)'; bctx.fillRect(0, 0, c.width, c.height);
  };
  if (sharp.complete) build(); else sharp.addEventListener('load', build);
  addEventListener('resize', build);
  type S = { x: number; y: number; r: number; t: number; life: number };
  const stamps: S[] = [];
  const add = (x: number, y: number, r: number, life = 5200) => { stamps.push({ x, y, r, t: performance.now(), life }); if (stamps.length > 420) stamps.shift(); };
  let lp: { x: number; y: number } | null = null;
  c.addEventListener('pointermove', (e) => {
    const b = c.getBoundingClientRect(); const x = e.clientX - b.left, y = e.clientY - b.top;
    if (lp) { const n = Math.ceil(Math.hypot(x - lp.x, y - lp.y) / 14); for (let i = 1; i <= n; i++) add(lp.x + ((x - lp.x) * i) / n, lp.y + ((y - lp.y) * i) / n, 115, 7000); } else add(x, y, 115, 7000);
    lp = { x, y };
  });
  c.addEventListener('pointerleave', () => (lp = null));
  // rain runs down the glass and leaves thin clear trails
  const runs: { x: number; y: number; v: number }[] = [];
  setInterval(() => { if (document.hidden || runs.length > 9) return; runs.push({ x: Math.random() * w, y: -10, v: 70 + Math.random() * 110 }); }, 700);
  // opening: wipe a window in the middle so the first view shows the place
  setTimeout(() => { for (let i = 0; i < 34; i++) add(w * 0.28 + i * (w * 0.016), h * 0.5 + Math.sin(i / 3) * 50, 190, 7500); }, 900);
  let last = performance.now();
  gsap.ticker.add(() => {
    if (!heroVisible() || !blur.width) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const r of runs) { r.y += r.v * dt; r.x += Math.sin(r.y / 40) * 0.4; add(r.x, r.y, 17, 3600); }
    for (let i = runs.length - 1; i >= 0; i--) if (runs[i].y > h + 20) runs.splice(i, 1);
    const k = c.width / w;
    mctx.clearRect(0, 0, mask.width, mask.height);
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i], age = now - s.t; if (age > s.life) { stamps.splice(i, 1); continue; }
      mctx.globalAlpha = (1 - age / s.life) ** 1.4; const d = s.r * 2 * k;
      mctx.drawImage(brush, s.x * k - d / 2, s.y * k - d / 2, d, d);
    }
    mctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(blur, 0, 0);
    ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = 'source-over';
  });
}

if (hero === '3' && pinned && !reduced) {
  ScrollTrigger.create({
    trigger: heroEl, start: 'top top', end: '+=120%', pin: true, scrub: true,
    onUpdate: (self) => { scrollDrive.p = self.progress; },
  });
  gsap.to('.leaf-photo', { scale: 1.3, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: '+=120%', scrub: true } });
  gsap.to('.hero-copy', { opacity: 0, y: -50, ease: 'none', scrollTrigger: { trigger: heroEl, start: '10% top', end: '+=60%', scrub: true } });
}

/* ---------- STATEMENT ---------- */
if (!reduced) {
  gsap.fromTo('.st-a', { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.st-b', { yPercent: 14 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.st-photos img', { opacity: 0, scale: 0.94, duration: 1.4, ease: 'power3.out', stagger: 0.18, scrollTrigger: { trigger: '.st-photos', start: 'top 80%' } });
}

/* ---------- FAN (pinned) ---------- */
const places = $$('.place');
if (pinned && !reduced) {
  const n = places.length, bgs = $$('.fan-bg img'), names = $$('.fan-names span'), tabs = $$('.fan-tabs button'), sub = $('#fan-sub');
  const dist = () => innerHeight * 0.6 * (n - 1);
  const st = ScrollTrigger.create({ trigger: '.fan-pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true });
  let cur = 0, act = -1;
  const layout = (p: number) => {
    const vw = innerWidth;
    places.forEach((el, i) => {
      const d = i - p, a = Math.abs(d);
      gsap.set(el, { xPercent: -50, yPercent: -50, x: d * vw * 0.085, y: a * 14, rotation: d * 7, scale: 1 - Math.min(a, 3) * 0.075, opacity: clamp(1.5 - a * 0.42, 0, 1), zIndex: 50 - Math.round(a * 10), rotationY: d * -4 });
    });
    const k = clamp(Math.round(p), 0, n - 1);
    if (k !== act) {
      act = k;
      bgs.forEach((b, i) => b.classList.toggle('on', i === k));
      tabs.forEach((b, i) => b.classList.toggle('on', i === k));
      names.forEach((s, i) => gsap.to(s, { opacity: i === k ? 1 : 0, yPercent: i === k ? -50 : i < k ? -140 : 40, duration: 0.7, ease: 'power3.out', overwrite: true }));
      gsap.fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, onStart: () => (sub.textContent = `${site.places[k].line} ${site.places[k].months}.`) });
    }
  };
  names.forEach((s, i) => gsap.set(s, { yPercent: i === 0 ? -50 : 40, opacity: i === 0 ? 1 : 0 }));
  gsap.ticker.add(() => { const t = st.progress * (n - 1); cur += (t - cur) * 0.12; layout(cur); });
  tabs.forEach((b, i) => b.addEventListener('click', () => scrollToY(st.start + (st.end - st.start) * (i / (n - 1)))));
} else if (!reduced) {
  gsap.from('.place', { opacity: 0, y: 50, duration: 1.2, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.fan-cards', start: 'top 80%' } });
}

/* ---------- MONTHS (pinned, one month at a time) ---------- */
const seasonsEl = $$('.m-season');
if (pinned && !reduced) {
  const monthsEls = $$('.m-month'), idx = $$('.m-index li');
  const steps = monthsEls.length;
  const stM = ScrollTrigger.create({ trigger: '.m-pin', start: 'top top', end: () => `+=${innerHeight * 0.48 * steps}`, pin: true, scrub: true, invalidateOnRefresh: true });
  let cs = -1, cm = -1;
  const kindFor = (si: number): Kind => site.seasons[si].weather as Kind;
  let kindNow: Kind = 'rain';
  weather($('#m-weather') as HTMLCanvasElement, () => kindNow, onScreen($('.m-pin')));
  gsap.set(monthsEls.filter((m) => !m.classList.contains('on')), { opacity: 0, yPercent: 24 });
  gsap.ticker.add(() => {
    const m = clamp(Math.floor(stM.progress * steps), 0, steps - 1), s = Math.floor(m / 2);
    if (m === cm) return;
    cm = m;
    if (s !== cs) {
      const prev = cs; cs = s; kindNow = kindFor(s);
      seasonsEl.forEach((el, i) => { if (i === s) { el.classList.add('on'); gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out' }); gsap.fromTo($('.m-photo', el), { scale: 1.12 }, { scale: 1.02, duration: 3.2, ease: 'power2.out' }); } else if (i === prev) gsap.to(el, { opacity: 0, duration: 1.1, onComplete: () => el.classList.remove('on') }); else el.classList.remove('on'); });
    }
    monthsEls.forEach((el, i) => {
      if (i === m) { el.classList.add('on'); gsap.fromTo(el, { opacity: 0, yPercent: 24 }, { opacity: 1, yPercent: 0, duration: 1, ease: 'power3.out', overwrite: true }); }
      else if (el.classList.contains('on')) { gsap.to(el, { opacity: 0, yPercent: -18, duration: 0.55, ease: 'power2.in', overwrite: true, onComplete: () => el.classList.remove('on') }); }
    });
    idx.forEach((li, i) => li.classList.toggle('on', i === m));
  });
  idx.forEach((li, i) => li.addEventListener('click', () => scrollToY(stM.start + ((stM.end - stM.start) * (i + 0.5)) / steps)));
  // egg: hold on the monsoon photograph for two seconds
  let hold = 0;
  const mp = $('.m-pin');
  mp.addEventListener('pointerdown', () => { if (cs === 0) hold = window.setTimeout(() => shower(mp), 2000); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => mp.addEventListener(t, () => clearTimeout(hold)));
} else if (!reduced) {
  seasonsEl.forEach((el) => gsap.fromTo($('.m-photo', el), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  const mp = $('.m-pin'); let hold = 0;
  seasonsEl[0].addEventListener('pointerdown', () => (hold = window.setTimeout(() => shower(seasonsEl[0]), 2000)));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => seasonsEl[0].addEventListener(t, () => clearTimeout(hold)));
  void mp;
}

/* ---------- HEART (pinned, headline slides sideways) ---------- */
if (pinned && !reduced) {
  const title = $('#heart-title');
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.heart-pin', start: 'top top', end: () => `+=${innerHeight * 1.8}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  tl.fromTo(title, { x: () => innerWidth * 0.04 }, { x: () => -(title.scrollWidth - innerWidth * 0.82), ease: 'none', duration: 1 }, 0);
  const dist = [155, 235, 330];
  $$('.dl').forEach((el, l) => tl.fromTo(el, { x: 0 }, { x: () => -innerWidth * (dist[l] / 100), ease: 'none', duration: 1 }, 0));
  $$('.dl img').forEach((im, i) => tl.fromTo(im, { yPercent: 8 + (i % 3) * 5, rotation: i % 2 ? 2.5 : -2.5 }, { yPercent: -10 - (i % 3) * 6, rotation: i % 2 ? -1.5 : 1.5, ease: 'none', duration: 1 }, 0));
  tl.fromTo('.fa', { x: -60, y: 40 }, { x: 40, y: -20, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.fb', { x: 60, y: -20 }, { x: -50, y: 30, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.fc', { y: 70 }, { y: -20, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.heart-text', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.55);
}

/* ---------- WATER (frame grows to full bleed) ---------- */
if (pinned && !reduced) {
  weather($('#mist') as HTMLCanvasElement, () => 'mist', onScreen($('.water-pin')));
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.water-pin', start: 'top top', end: () => `+=${innerHeight * 1.2}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  tl.fromTo('.water-frame', { clipPath: 'inset(15vh 14vw 15vh 14vw)' }, { clipPath: 'inset(0vh 0vw 0vh 0vw)', ease: 'none', duration: 0.6 }, 0);
  tl.fromTo('.water-frame img', { scale: 1.2 }, { scale: 1, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.water-copy h2', { opacity: 0, y: 70 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.4);
  tl.fromTo('.water-copy p', { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.6);
} else if (!reduced) {
  gsap.from('.water-frame img', { scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.water-frame', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- STORIES, TRIPS, STAYS ---------- */
if (!reduced) {
  $$('.story').forEach((f, i) => {
    gsap.from(f, { opacity: 0, y: 90, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 90%' } });
    gsap.fromTo($('img', f), { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    void i;
  });
  gsap.from('.tile', { opacity: 0, y: 70, duration: 1.2, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.mosaic', start: 'top 82%' } });
  gsap.fromTo('.away img', { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.away', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.away-copy', { opacity: 0, y: 40, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.away', start: 'top 70%' } });
  gsap.fromTo('.cta-sea', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.cta-copy p, .cta-copy .btn', { opacity: 0, y: 30, duration: 1, stagger: 0.12, scrollTrigger: { trigger: '.cta-copy', start: 'top 75%' } });
}
// centred carousel: the nearest slide to the middle grows
const car = $('#car'); const slides = $$('.slide');
if (car) {
  const upd = () => {
    const cx = car.getBoundingClientRect().left + car.clientWidth / 2;
    slides.forEach((s) => { const r = s.getBoundingClientRect(); const d = Math.min(1, Math.abs(r.left + r.width / 2 - cx) / (r.width * 1.1)); s.style.setProperty('--s', String(1 - d * 0.2)); s.style.setProperty('--o', String(1 - d * 0.35)); });
  };
  car.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd);
  requestAnimationFrame(() => { car.scrollLeft = (car.scrollWidth - car.clientWidth) / 2; upd(); });
  // drag to scroll with a mouse
  let down = false, sx = 0, sl = 0;
  car.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = car.scrollLeft; car.style.scrollSnapType = 'none'; });
  addEventListener('pointerup', () => { if (!down) return; down = false; car.style.scrollSnapType = ''; });
  addEventListener('pointermove', (e) => { if (down) car.scrollLeft = sl - (e.clientX - sx); });
}

/* ---------- FOOTER word, and easter eggs ---------- */
const word = $('#bigword');
{
  const t = word.textContent || '';
  word.textContent = '';
  const chars = [...t].map((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; word.appendChild(s); return s; });
  if (!reduced) {
    gsap.set(chars, { yPercent: 110 });
    gsap.to(chars, { yPercent: 0, duration: 1.4, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: word, start: 'top 92%' } });
  }
}
word.addEventListener('click', () => boat(word));

let typed = '';
addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
  typed = (typed + e.key.toLowerCase()).slice(-4);
  if (typed === 'onam') pookalam(innerWidth / 2, innerHeight / 2);
});
{ // touch: long-press the hero headline
  let t = 0; const h = $(hero === '4' ? '#h4-title' : '#hero-title');
  h.addEventListener('pointerdown', (e) => (t = window.setTimeout(() => pookalam(e.clientX, e.clientY), 700)));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => h.addEventListener(ev, () => clearTimeout(t)));
}
{ // idle for 20 s: a kingfisher lands
  let idle = 0; const arm = () => { clearTimeout(idle); idle = window.setTimeout(kingfisher, 20000); };
  ['pointermove', 'keydown', 'scroll', 'pointerdown'].forEach((e) => addEventListener(e, arm, { passive: true })); arm();
}

addEventListener('load', () => ScrollTrigger.refresh());
