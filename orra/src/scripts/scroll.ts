import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/* The full, scroll-driven page for big screens with a mouse. Phones and touch screens never run this. */
const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const qa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function seeded(n: number) {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);

  /* Eased scrolling, tied to the animation clock so pinned parts stay in step */
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = a?.getAttribute('href');
    if (!a || !id || id === '#') return;
    const el = id === '#top' ? null : document.querySelector<HTMLElement>(id);
    if (id !== '#top' && !el) return;
    e.preventDefault();
    lenis.scrollTo(el ?? 0, { duration: 1.7, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  });

  curtain();
  sketches();
  tiles();
  statements();
  principles();
  ring();
  orbit();

  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* The hero stays put, steps back and darkens, and the page slides up over it */
function curtain() {
  const card = q('[data-card]');
  const paper = q('.paper');
  const scene = q('[data-scene]');
  if (!card || !paper || !scene) return;
  const shade = document.createElement('div');
  shade.className = 'shade';
  card.appendChild(shade);
  // the picture is enlarged a little so a blur never shows the edges of the hero
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: paper, start: 'top bottom', end: 'top 12%', scrub: true } })
    .fromTo(scene, { filter: 'blur(0px)', scale: 1, yPercent: 0 }, { filter: 'blur(7px)', scale: 1.07, yPercent: 3 }, 0)
    .to(shade, { opacity: 0.5 }, 0);
}

/* Pinned sketch: ink appears in scattered patches that grow together, then the drawing slowly pushes in and the text rises over it */
function sketches() {
  qa('[data-process]').forEach((sec, idx) => {
    const stage = q('[data-pstage]', sec)!;
    const fig = q('[data-psketch]', sec)!;
    const img = q<HTMLImageElement>('img', fig)!;
    const title = q('[data-ptitle]', sec)!;
    const text = q('[data-ptext]', sec)!;
    const W = 1500;
    const H = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    fig.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    const mask = document.createElement('canvas');
    mask.width = 750;
    mask.height = 500;
    const mctx = mask.getContext('2d')!;

    const rnd = seeded(idx * 97 + 13);
    const seeds: { x: number; y: number; d: number }[] = [];
    const cols = 14;
    const rows = 10;
    for (let gx = 0; gx < cols; gx++) for (let gy = 0; gy < rows; gy++) {
      seeds.push({ x: ((gx + 0.5 + (rnd() - 0.5) * 0.9) / cols) * 750, y: ((gy + 0.5 + (rnd() - 0.5) * 0.9) / rows) * 500, d: rnd() * 0.55 });
    }
    const maxR = 112;
    let shown = -1;
    let ready = false;
    const render = (p: number) => {
      if (!ready || Math.abs(p - shown) < 0.002) return;
      shown = p;
      mctx.clearRect(0, 0, 750, 500);
      for (const s of seeds) {
        const t = clamp((p - s.d) / 0.42);
        if (t <= 0) continue;
        const r = (0.12 + (1 - Math.pow(1 - t, 2.2)) * 0.88) * maxR;
        const g = mctx.createRadialGradient(s.x, s.y, r * 0.5, s.x, s.y, r);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        mctx.fillStyle = g;
        mctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0, W, H);
    };
    img.loading = 'eager';
    (img.decode ? img.decode() : Promise.resolve()).catch(() => undefined).then(() => { ready = true; shown = -1; render(state.p); });

    const state = { p: 0 };
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: '+=270%', pin: stage, scrub: true, anticipatePin: 1 } })
      .to(title, { yPercent: -70, opacity: 0, duration: 0.34 }, 0)
      .to(state, { p: 1, duration: 0.62, onUpdate: () => render(state.p) }, 0.04)
      .fromTo(fig, { scale: 1, xPercent: 0, yPercent: 0 }, { scale: 1.36, xPercent: -3, yPercent: -5, duration: 0.7 }, 0.3)
      .fromTo(text, { yPercent: 135, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3 }, 0.68);
  });
}

/* Residences drift at different speeds */
function tiles() {
  const speeds = [-45, 85, -25, 110, -55, 90, -30, 70];
  qa('[data-tile]').forEach((t, i) => {
    const v = speeds[i % speeds.length];
    gsap.fromTo(t, { y: -v * 0.6 }, { y: v * 0.6, ease: 'none', scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* Principles: pinned. It opens on a plain white page with a centred heading and thin lines radiating out; as you scroll the page turns to night,
   the heading changes, the ring turns, and each node takes its turn at the centre. */
function principles() {
  const sec = q('[data-radial-sec]');
  const stage = q('[data-rstage]');
  const radial = q('[data-radial]');
  if (!sec || !stage || !radial) return;
  const data: [string, string][] = JSON.parse(q('[data-principles]')?.textContent || '[]');
  const nodes = qa<HTMLButtonElement>('[data-node]', radial);
  const core = q('.radial__core', radial)!;
  const title = q('[data-core-title]', radial)!;
  const desc = q('[data-core-desc]', radial)!;
  sec.dataset.theme = 'light';
  const steps: [string, string][] = [['Quiet & Bold<br>Essential', ''], ...data.map(([t, d]) => [t, d] as [string, string])];
  title.innerHTML = steps[0][0];
  desc.textContent = '';
  let cur = 0;
  const show = (i: number) => {
    if (i === cur) return;
    cur = i;
    nodes.forEach((n, k) => n.classList.toggle('is-on', k === i - 1));
    core.classList.add('is-swap');
    window.setTimeout(() => { title.innerHTML = steps[i][0]; desc.textContent = steps[i][1]; core.classList.remove('is-swap'); }, 240);
  };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec, start: 'top top', end: '+=620%', pin: stage, scrub: true, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        sec.dataset.theme = p > 0.2 ? 'dark' : 'light';
        const k = p < 0.2 ? 0 : 1 + Math.min(nodes.length - 1, Math.floor(clamp((p - 0.2) / 0.8) * nodes.length));
        show(k);
      },
    },
  });
  nodes.forEach((n, i) => n.addEventListener('click', () => {
    const st = tl.scrollTrigger!;
    lenisJump(st.start + (st.end - st.start) * (0.2 + ((i + 0.5) / nodes.length) * 0.8));
  }));
  tl.fromTo(radial, { scale: 0.86, opacity: 0.2 }, { scale: 1, opacity: 1, duration: 0.14 }, 0)
    .fromTo(sec, { '--rbg': '#eceff1', '--rfg': '#131c26' }, { '--rbg': '#0b1622', '--rfg': '#ffffff', duration: 0.1 }, 0.16)
    .fromTo(sec, { '--rot': '0deg' }, { '--rot': '165deg', duration: 1 }, 0);
}

function lenisJump(y: number) {
  window.scrollTo({ top: y, behavior: 'smooth' });
}

/* People, as in the reference: the statement opens the section with a wide curved band of large photographs beneath it. Scrolling on, the statement
   leaves, the band bunches up, the photographs shrink and drop into a ring of small ones that rises with the founding year. The ring then holds still
   while you read; finally it slides into a half circle at the left and turns only as you scroll, while the figures step through at the right. */
function ring() {
  const root = q('[data-ring]');
  if (!root) return;
  const group = q('[data-ring-group]', root)!;
  const photos = qa<HTMLImageElement>('[data-ring-photos] img', root);
  const core = q('[data-ring-core]', root)!;
  const statsBox = q('[data-ring-stats]', root)!;
  const stats = qa('li', statsBox);
  const statement = q('[data-ring-statement]', root)!;
  splitWords(statement);
  const words = qa('.w', statement);
  const N = photos.length;
  const jit = photos.map((_, i) => ((i * 53) % 9) - 4);
  // everything the scroll drives lives in this one object
  const st = { shift: 0, morph: 0, rise: 0, side: 0, rot: 0 };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const ease = (t: number) => t * t * (3 - 2 * t);
  const place = () => {
    const W = innerWidth;
    const H = innerHeight;
    const pw = W * 0.15;
    const ph = pw * 1.25;
    const cx = lerp(W * 0.5, -W * 0.1, ease(st.side));
    const cy = lerp(H * 1.22, H * 0.5, ease(st.rise));
    const R = lerp(H * 0.4, H * 0.62, ease(st.side));
    photos.forEach((el, i) => {
      // band: photographs along a curve that rises to the right
      const sx = -W * 0.04 + i * W * 0.19 - st.shift * W;
      const k = Math.max(0, sx) / W;
      const by = H * 0.8 - H * 0.62 * k * k + (sx < 0 ? H * 0.2 * (sx / W) * (sx / W) : 0);
      const slope = sx > 0 ? -1.24 * H * (sx / (W * W)) : 0.4 * H * (sx / (W * W));
      const bAng = (Math.atan(slope) * 180) / Math.PI + jit[i] * 0.9;
      // ring: small photographs round a circle
      const th = (i / N) * Math.PI * 2 + st.rot - Math.PI / 2;
      const rx = cx + Math.cos(th) * R;
      const ry = cy + Math.sin(th) * R;
      let rAng = (th * 180) / Math.PI + 90 + jit[i];
      rAng -= 360 * Math.round((rAng - bAng) / 360);
      const m = ease(clamp((st.morph * 1.5 - (i / N) * 0.5) / 1));
      const x = lerp(sx, rx, m);
      const y = lerp(by, ry, m);
      const a = lerp(bAng, rAng, m);
      const sc = lerp(1, 0.4, m);
      el.style.transform = `translate(${x - pw / 2}px, ${y - ph / 2}px) rotate(${a}deg) scale(${sc})`;
    });
    core.style.transform = `translate(-50%, calc(-50% + ${cy - H * 0.5}px))`;
  };
  place();
  window.addEventListener('resize', place);
  let on = -1;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root, start: 'top top', end: '+=600%', pin: true, scrub: true, anticipatePin: 1,
      onUpdate: (self) => {
        const k = self.progress < 0.7 ? -1 : Math.min(stats.length - 1, Math.floor(((self.progress - 0.7) / 0.3) * stats.length));
        if (k !== on) { on = k; stats.forEach((li, j) => li.classList.toggle('is-on', j === Math.max(0, k))); }
      },
    },
  });
  gsap.set(core, { xPercent: 0, yPercent: 0 });
  // 0 to 0.28: the statement is read, and the band drifts along
  tl.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.03, duration: 0.18 }, 0)
    .to(st, { shift: 0.3, duration: 0.3, onUpdate: place }, 0)
    // 0.3 to 0.34: the statement scrolls away
    .to(statement, { opacity: 0, yPercent: -90, duration: 0.07 }, 0.29)
    // 0.3 to 0.54: the band bunches and drops into the ring, which rises with the year
    .to(st, { morph: 1, duration: 0.24, onUpdate: place }, 0.3)
    .to(st, { rise: 1, duration: 0.24, onUpdate: place }, 0.3)
    .fromTo(core, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.42)
    // 0.54 to 0.66: nothing moves; the year is read
    // 0.66 to 0.76: the ring slides into a half circle at the left and the figures arrive
    .to(core, { opacity: 0, duration: 0.06 }, 0.64)
    .to(st, { side: 1, duration: 0.12, onUpdate: place }, 0.66)
    .fromTo(statsBox, { opacity: 0, xPercent: 6 }, { opacity: 1, xPercent: 0, duration: 0.08 }, 0.68)
    // 0.76 to 1: it turns only as the figures step through
    .to(st, { rot: -0.9, duration: 0.24, onUpdate: place }, 0.76);
}

function splitWords(el: HTMLElement) {
  const text = el.textContent || '';
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
}

/* Big statements are read word by word as you scroll */
function statements() {
  qa('.statement .big, .about .lede').forEach((el) => {
    el.removeAttribute('data-reveal');
    el.classList.add('sw');
    el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none';
    splitWords(el);
    gsap.fromTo(qa('.w', el), { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true } });
  });
}

/* Partners: the names ride a ring round the heading */
function orbit() {
  const root = q('[data-orbit]');
  if (!root) return;
  const dots = qa('.logo-dot', q('[data-orbit-ring]', root)!);
  const s = { a: 0 };
  const place = () => {
    const rx = innerWidth * 0.4;
    const ry = innerHeight * 0.36;
    dots.forEach((el, i) => {
      const th = (i / dots.length) * Math.PI * 2 + s.a - Math.PI / 2;
      el.style.transform = `translate(${Math.cos(th) * rx}px, ${Math.sin(th) * ry}px)`;
    });
  };
  place();
  window.addEventListener('resize', place);
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: '+=380%', pin: true, scrub: true, anticipatePin: 1 } })
    .to(s, { a: Math.PI * 1.6, duration: 1, onUpdate: place }, 0);
}
