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

// ---------- hero: the chair turns, the lamp follows the pointer ----------
function hero() {
  const root = $('[data-hero]')!;
  const stage = $('[data-stage]')!;
  const canvas = $<HTMLCanvasElement>('[data-chair]')!;
  const ctx = canvas.getContext('2d')!;
  const N = 73;
  const base = (document.querySelector('.intro__hair') as HTMLImageElement).src.replace('hair.webp', 'seq/');
  const frames: (HTMLImageElement | null)[] = new Array(N).fill(null);
  const load = (i: number) => new Promise<void>((res) => {
    const im = new Image(); im.onload = () => { frames[i] = im; res(); }; im.onerror = () => res();
    im.src = `${base}c-${String(i + 1).padStart(3, '0')}.webp`;
  });
  let off = 0, shown = 0, vel = 0, dragging = false, lastX = 0, drawn = -1;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const near = (i: number) => { for (let d = 0; d < N; d++) { const a = frames[i - d] || frames[i + d]; if (a) return a; } return null; };
  function paint(i: number) {
    const f = near(i);
    if (!f || i === drawn) return;
    drawn = i; ctx.drawImage(f, 0, 0, canvas.width, canvas.height);
  }
  load(0).then(() => { paint(0); const rest = Array.from({ length: N - 1 }, (_, k) => k + 1); (async () => { for (const i of rest) await load(i); })(); });

  stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; vel = 0; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; off += dx * -0.1; vel = dx * -0.1; });
  const up = () => { dragging = false; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  // the lamp
  let lx = 50, ly = 22, tx = 50, ty = 22;
  root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width) * 100; ty = ((e.clientY - r.top) / r.height) * 100; });
  root.addEventListener('pointerleave', () => { tx = 50; ty = 22; });

  let t0 = performance.now();
  gsap.ticker.add(() => {
    const t = (performance.now() - t0) / 1000;
    const p = clamp(scrollY / innerHeight, 0, 1);
    if (!dragging) { off += vel; vel *= 0.94; }
    off = clamp(off, -p * 40 - 0, N - 1);
    const sway = reduce ? 0 : Math.sin(t * 0.5) * 1.6;
    const target = clamp(p * 36 + off + sway, 0, N - 1);
    if (off < 0 && !dragging) off += (0 - off) * 0.05;
    shown += (target - shown) * 0.14;
    paint(Math.round(shown));
    lx += (tx - lx) * 0.1; ly += (ty - ly) * 0.1;
    root.style.setProperty('--lx', lx.toFixed(2) + '%'); root.style.setProperty('--ly', ly.toFixed(2) + '%');
  });
}

// ---------- intro ----------
function intro(done: () => void) {
  const el = $('[data-intro]')!;
  const word = $('.intro__word', el)!;
  const slash = $('.intro__slash', el)!;
  let finished = false;
  const end = () => {
    if (finished) return; finished = true; tl.kill();
    gsap.to(el, { yPercent: -100, duration: reduce ? 0.01 : 0.9, ease: 'power3.inOut', onComplete: () => { el.remove(); done(); } });
  };
  const tl = gsap.timeline({ onComplete: end });
  if (reduce) { tl.set(word, { opacity: 1, y: 0 }).to({}, { duration: 0.6 }); }
  else {
    tl.to(slash, { x: '170vw', duration: 1.5, ease: 'power2.inOut' }, 0.2)
      .to(word, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.7)
      .to({}, { duration: 0.7 });
  }
  $('[data-skip]', el)!.addEventListener('click', end);
}

// ---------- reveals ----------
function reveals() {
  $$('[data-reveal]').forEach((h) => {
    const spans = $$('.ln > span', h);
    if (reduce) { gsap.set(spans, { yPercent: 0 }); return; }
    gsap.to(spans, { yPercent: 0, y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  // the statement lights up word by word as it scrolls past
  const st = $('[data-reveal-words]');
  if (st) {
    st.innerHTML = (st.textContent || '').split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
    if (reduce) gsap.set($$('.w', st), { opacity: 1 });
    else gsap.to($$('.w', st), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '[data-why]', start: 'top 55%', end: 'center 35%', scrub: 0.6 } });
  }
  if (!reduce) {
    gsap.from('.cut', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.cuts__list', start: 'top 82%' } });
    gsap.from('.barber', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.crew__grid', start: 'top 85%' } });
    gsap.from('.plan', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.14, scrollTrigger: { trigger: '.club__plans', start: 'top 85%' } });
    // each shop photograph drifts slower than its frame
    $$('.shop').forEach((sh) => gsap.fromTo($('.shop__img', sh), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: sh, start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.gift__card', { y: 80, rotateY: -35, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.gift', start: 'top 70%' } });
    // the ghost wordmark drifts up slower than the page
    gsap.to('.hero__ghost', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
}
function heroTitle() {
  const spans = $$('.hero__title .ln > span');
  if (reduce) gsap.set(spans, { yPercent: 0 });
  else gsap.to(spans, { yPercent: 0, y: 0, duration: 1.2, ease: 'power4.out', stagger: 0.14 });
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

// ---------- barbers ----------
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
  // touch: tap the portrait to see the back
  $$('.barber__ph').forEach((p) => p.addEventListener('click', () => p.closest('.barber')!.classList.toggle('is-flip')));
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
  $('[data-next]')!.addEventListener('click', () => {
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
    const bars = $$('i', $('[data-fadewipe]')!);
    if (!bars.length) { const w = $('[data-fadewipe]')!; for (let k = 0; k < 10; k++) w.appendChild(document.createElement('i')); }
    const items = $$('i', $('[data-fadewipe]')!);
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
