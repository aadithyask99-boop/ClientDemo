import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';
import { initBooking } from './booking';

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const data = JSON.parse($('#data')!.textContent || '{}');
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// smooth scroll on desktop pointers only
let lenis: Lenis | null = null;
if (fine && !reduce) {
  lenis = new Lenis({ lerp: 0.12 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href')!;
  if (id.length < 2) return;
  const t = $(id);
  if (!t) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(t, { offset: -10 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

const toast = $('[data-toast]')!;
let toastT = 0;
export function say(msg: string) {
  toast.textContent = msg; toast.classList.add('is-on');
  clearTimeout(toastT); toastT = window.setTimeout(() => toast.classList.remove('is-on'), 2800);
}

// ---------- hero: huge word, a beam that follows you, a chair you can turn ----------
function hero() {
  const root = $('[data-hero]')!;
  const stage = $('[data-stage]')!;
  const canvas = $<HTMLCanvasElement>('[data-chair]')!;
  const ctx = canvas.getContext('2d')!;
  const N = 73, TURN = 72; // frame 73 is frame 1 again, so the spin loops
  const base = (document.querySelector('.intro__fur') as HTMLImageElement).src.replace('hair.webp', 'seq/');
  const frames: (HTMLImageElement | null)[] = new Array(N).fill(null);
  const load = (i: number) => new Promise<void>((res) => {
    const im = new Image(); im.onload = () => { frames[i] = im; res(); }; im.onerror = () => res();
    im.src = `${base}c-${String(i + 1).padStart(3, '0')}.webp`;
  });
  let off = 0, shown = 0, vel = 0, dragging = false, lastX = 0, drawn = -1;
  const near = (i: number) => { for (let d = 0; d < TURN; d++) { const a = frames[(i - d + TURN) % TURN] || frames[(i + d) % TURN]; if (a) return a; } return null; };
  function paint(i: number) {
    const f = near(i);
    if (!f || i === drawn) return;
    drawn = i;
    if (canvas.width !== f.naturalWidth) { canvas.width = f.naturalWidth; canvas.height = f.naturalHeight; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(f, 0, 0);
  }
  load(0).then(() => { paint(0); (async () => { for (let i = 1; i < N; i++) await load(i); })(); });

  stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; vel = 0; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; off += dx * -0.14; vel = dx * -0.14; });
  const up = () => { dragging = false; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  // the beam of light follows the pointer across the hero
  let lx = 50, tx = 50, active = false;
  root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); tx = clamp(((e.clientX - r.left) / r.width) * 100, 12, 88); active = true; });
  root.addEventListener('pointerleave', () => { active = false; });

  const t0 = performance.now();
  gsap.ticker.add(() => {
    const t = (performance.now() - t0) / 1000;
    const p = clamp(scrollY / innerHeight, 0, 1);
    if (!dragging) { off += vel; vel *= 0.94; }
    const sway = reduce ? 0 : Math.sin(t * 0.5) * 1.6;
    const target = p * 40 + off + sway;
    shown += (target - shown) * 0.14;
    paint((((Math.round(shown)) % TURN) + TURN) % TURN);
    if (!active) tx = 50 + (reduce ? 0 : Math.sin(t * 0.35) * 14);
    lx += (tx - lx) * 0.08;
    root.style.setProperty('--lx', lx.toFixed(2) + '%');
  });

  // "next chair" is a real time: a quarter of an hour from now, rounded up to the next twenty minutes
  const d = new Date(Date.now() + 15 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 20) * 20, 0, 0);
  const h = d.getHours(), m = d.getMinutes();
  $('[data-next]')!.textContent = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ---------- intro: fur, a thin word, the line that parts it, then the word becomes the hero's wordmark ----------
function intro(done: () => void) {
  const el = $('[data-intro]')!;
  const word = $('[data-introword]', el)!;
  const ghost = $('[data-ghost]')!;
  const path = $<SVGPathElement>('.intro__line path', el)!;
  const len = path.getTotalLength();
  let finished = false;
  gsap.set(ghost, { opacity: 0 });
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

  const handoff = () => {
    if (finished) return; finished = true; tl.kill();
    const g = ghost.getBoundingClientRect(), w = word.getBoundingClientRect();
    const k = g.width / w.width;
    const dur = reduce ? 0.01 : 1.15;
    gsap.to(word, { x: (g.left + g.width / 2) - (w.left + w.width / 2), y: (g.top + g.height / 2) - (w.top + w.height / 2) + 6, scale: k, color: 'rgba(239,238,234,0.4)', textShadow: '0 0 0 rgba(0,0,0,0)', opacity: 1, duration: dur, ease: 'power3.inOut' });
    gsap.to($$('.intro__fur, .intro__line, .intro__tag, .intro__skip', el), { opacity: 0, duration: dur * 0.8, ease: 'power2.out' });
    gsap.to(el, { backgroundColor: 'rgba(10,10,10,1)', duration: dur * 0.9 });
    gsap.to(ghost, { opacity: 1, duration: 0.4, delay: dur * 0.85 });
    gsap.delayedCall(dur + 0.05, () => { el.remove(); done(); });
  };
  const tl = gsap.timeline({ onComplete: handoff });
  if (reduce) tl.set(word, { opacity: 1 }).to({}, { duration: 0.5 });
  else {
    tl.fromTo(word, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
      .to(path, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.8)
      .to({}, { duration: 0.5 });
  }
  $('[data-skip]', el)!.addEventListener('click', handoff);
}

// ---------- reveals ----------
function reveals() {
  $$('[data-reveal]').forEach((h) => {
    const spans = $$('.ln > span', h);
    if (reduce) { gsap.set(spans, { yPercent: 0, y: 0 }); return; }
    gsap.to(spans, { yPercent: 0, y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  // the statement lights up word by word as it scrolls past
  const st = $('[data-reveal-words]');
  if (st) {
    const tpl = document.createElement('div');
    Array.from(st.childNodes).forEach((n) => {
      const bold = n.nodeName === 'STRONG';
      const wrap = bold ? document.createElement('strong') : document.createElement('span');
      wrap.innerHTML = (n.textContent || '').split(' ').filter(Boolean).map((w) => `<span class="w">${w}</span>`).join(' ') + (bold ? '' : ' ');
      tpl.appendChild(wrap);
    });
    st.innerHTML = tpl.innerHTML;
    if (reduce) gsap.set($$('.w', st), { opacity: 1 });
    else gsap.to($$('.w', st), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '[data-why]', start: 'top 55%', end: 'center 35%', scrub: 0.6 } });
  }
  if (!reduce) {
    gsap.from('.cut', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.cuts__list', start: 'top 82%' } });
    gsap.from('.barber', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.crew__grid', start: 'top 85%' } });
    gsap.from('.plan', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.14, scrollTrigger: { trigger: '.club__plans', start: 'top 85%' } });
    gsap.from('.shelf__row li', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.shelf__row', start: 'top 85%' } });
    gsap.from('.gift__card', { x: -80, rotateY: 40, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.gift', start: 'top 70%' } });
    $$('.shop').forEach((sh) => gsap.fromTo($('.shop__img', sh), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: sh, start: 'top bottom', end: 'bottom top', scrub: true } }));
    // the wordmark drifts up slower than the page
    gsap.to('.hero__ghost', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
}
function heroTitle() {
  const spans = $$('.hero__title .ln > span');
  if (reduce) gsap.set(spans, { yPercent: 0, y: 0 });
  else {
    gsap.to(spans, { yPercent: 0, y: 0, duration: 1.2, ease: 'power4.out', stagger: 0.14 });
    gsap.from('.hero__stage', { opacity: 0, y: 60, duration: 1.4, ease: 'power3.out' });
    gsap.from(['.hero__status', '.hero__hint', '.hero__cta'], { opacity: 0, y: 12, duration: 0.9, stagger: 0.1, delay: 0.3 });
  }
}

// ---------- props: throw them around ----------
function props() {
  $$('[data-prop]').forEach((el, i) => {
    gsap.set(el, { rotation: [-8, 6, -4, 9][i % 4] });
    Draggable.create(el, {
      type: 'x,y', inertia: true, bounds: '[data-why]',
      onDrag() { gsap.to(el, { rotation: gsap.utils.clamp(-25, 25, this.deltaX * 2.2), duration: 0.3, overwrite: true }); },
      onThrowUpdate() { gsap.set(el, { rotation: gsap.utils.clamp(-40, 40, (this as any).getVelocity('x') / 60) }); },
      onThrowComplete() { gsap.to(el, { rotation: [-8, 6, -4, 9][i % 4], duration: 0.6, ease: 'elastic.out(1, 0.5)' }); },
    });
  });
}

// ---------- barbers: each mirror has a lamp ----------
function crew() {
  const chips = $$('[data-filter]');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { const on = x === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    const f = c.dataset.filter!;
    $$('.barber').forEach((b) => {
      const show = f === 'all' || b.dataset.shop === f;
      b.classList.toggle('is-off', !show);
      if (show && !reduce) gsap.fromTo(b, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    });
    ScrollTrigger.refresh();
  }));
  // touch: tap a mirror to switch its lamp on and see the back
  $$('.barber__ph').forEach((p) => p.addEventListener('click', () => p.closest('.barber')!.classList.toggle('is-lit')));
}

// ---------- gift card ----------
function gift() {
  const card = $('[data-card]')!;
  const amt = $('[data-amt]')!;
  $$('[data-amount]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-amount]').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    amt.textContent = '£' + b.dataset.amount;
    if (!reduce) gsap.fromTo(card, { rotateY: 0 }, { rotateY: 360, duration: 0.9, ease: 'power3.inOut', overwrite: false });
  }));
  $('[data-gift-send]')!.addEventListener('click', () => say('A concept: no card is sent and nothing is charged.'));
  if (!fine || reduce) return;
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
  const area = $('[data-gift]')!;
  area.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    ry(x * 40); rx(-y * 30);
    card.style.setProperty('--sx', (50 + x * 120) + '%'); card.style.setProperty('--sy', (50 + y * 120) + '%');
  });
}

// ---------- reviews ----------
function reviews() {
  const list = data.reviews as { q: string; by: string }[];
  const q = $('[data-q]')!, by = $('[data-by]')!, count = $('[data-count]')!, box = $('[data-quote]')!;
  let i = 0;
  const set = () => { q.textContent = list[i].q; by.textContent = list[i].by; count.textContent = `${i + 1} / ${list.length}`; };
  set();
  $('[data-next]', box)!.addEventListener('click', () => {
    i = (i + 1) % list.length;
    if (reduce) { set(); return; }
    gsap.to(box, { x: 30, opacity: 0, duration: 0.25, onComplete: () => { set(); gsap.fromTo(box, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }); } });
  });
  const score = $('[data-score]')!;
  if (!reduce) {
    const o = { v: 0 };
    gsap.to(o, { v: 4.9, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: '[data-reviews]', start: 'top 65%', once: true }, onUpdate: () => { score.textContent = o.v.toFixed(1); } });
    score.textContent = '0.0';
  }
}

// ---------- easter eggs ----------
function eggs() {
  // 1. type "fade": the screen goes through a skin fade, dark at the bottom to clear at the top
  let buf = '';
  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf !== 'fade') return;
    buf = '';
    const wipe = $('[data-fadewipe]')!;
    if (!$$('i', wipe).length) for (let k = 0; k < 10; k++) wipe.appendChild(document.createElement('i'));
    const items = $$('i', wipe);
    gsap.timeline()
      .fromTo(items, { opacity: 0 }, { opacity: (k: number) => 0.08 + (k / 9) * 0.92, duration: 0.5, stagger: { each: 0.04, from: 'end' } })
      .to(items, { opacity: 0, duration: 0.9, stagger: { each: 0.05, from: 'start' } }, '+=0.35');
    say('Number one on the sides. Skin on the bottom.');
  });
  // 2. the footer wordmark gets a pass with the clippers
  const word = $('[data-word]')!;
  const chars = $$('.ch', word);
  const clip = $('.foot__clip', word)!;
  let busy = false;
  const pass = () => {
    if (busy || reduce) return; busy = true;
    const w = word.clientWidth;
    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.set(clip, { opacity: 1, x: -clip.clientWidth })
      .to(clip, { x: w, duration: 1.6, ease: 'power1.inOut' }, 0)
      .to(chars, { opacity: 0.1, duration: 0.25, stagger: 1.2 / chars.length }, 0.1)
      .to(clip, { opacity: 0, duration: 0.2 }, 1.7)
      .to(chars, { opacity: 1, duration: 0.8, stagger: 0.05 }, 2.2);
  };
  word.addEventListener('pointerenter', pass); word.addEventListener('click', pass);
}

reveals(); props(); crew(); gift(); reviews(); eggs(); hero(); initBooking({ data, lenis, say, reduce });
intro(heroTitle);
ScrollTrigger.refresh();
