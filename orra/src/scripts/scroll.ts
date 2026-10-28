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

/* People: the statement opens the section with a curve of photographs sweeping across beneath it. The curve rises into a ring round the founding
   year, which turns; then the ring slides aside and the figures light up one after another. */
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
  const tilts = [-8, 6, -4, 9, -6, 4];
  const s = { a: 0 };
  const radius = () => Math.min(innerHeight * 0.42, innerWidth * 0.3);
  const place = () => {
    const r = radius();
    photos.forEach((el, i) => {
      el.style.transform = `rotate(${s.a + (i * 360) / photos.length}deg) translateY(${-r}px) rotate(${tilts[i % tilts.length]}deg)`;
    });
  };
  place();
  window.addEventListener('resize', place);
  let on = -1;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root, start: 'top top', end: '+=560%', pin: true, scrub: true, anticipatePin: 1,
      onUpdate: (self) => {
        const k = self.progress < 0.66 ? -1 : Math.min(stats.length - 1, Math.floor(((self.progress - 0.66) / 0.34) * stats.length));
        if (k !== on) { on = k; stats.forEach((li, j) => li.classList.toggle('is-on', j === Math.max(0, k))); }
      },
    },
  });
  // the ring starts low, so only its top curve crosses the page under the statement; the statement itself is read word by word
  gsap.set(group, { y: () => innerHeight * 0.74 + radius() * 0.1, scale: 1.06 });
  tl.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.04, duration: 0.2 }, 0)
    .to(s, { a: 36, duration: 0.22, onUpdate: place }, 0)
    .to(s, { a: 96, duration: 0.3, onUpdate: place }, 0.22)
    .to(s, { a: 106, duration: 0.1, onUpdate: place }, 0.52)
    .to(s, { a: 196, duration: 0.38, onUpdate: place }, 0.62)
    .to(group, { y: 0, scale: 1, duration: 0.3, ease: 'power2.inOut' }, 0.22)
    .to(statement, { opacity: 0, y: -60, duration: 0.1 }, 0.24)
    .fromTo(core, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.16 }, 0.4)
    .to(core, { opacity: 0, duration: 0.1 }, 0.56)
    .to(group, { xPercent: -34, scale: 1.12, duration: 0.2, ease: 'power2.inOut' }, 0.58)
    .fromTo(statsBox, { opacity: 0, xPercent: 6 }, { opacity: 1, xPercent: 0, duration: 0.12 }, 0.66);
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
