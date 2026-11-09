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
const art = document.body.dataset.art || '';
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

// "next chair" is a real time: a quarter of an hour from now, rounded up to the next twenty minutes
function nextChair() {
  const d = new Date(Date.now() + 15 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 20) * 20, 0, 0);
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ---------- hero: a chair you can turn between two huge words ----------
function hero() {
  const stage = $('[data-stage]')!;
  const canvas = $<HTMLCanvasElement>('[data-chair]')!;
  const ctx = canvas.getContext('2d')!;
  const N = 73, TURN = 72; // frame 73 is frame 1 again, so the spin loops
  const base = art + 'seq/';
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

  const t0 = performance.now();
  gsap.ticker.add(() => {
    const t = (performance.now() - t0) / 1000;
    const p = clamp(scrollY / innerHeight, 0, 1);
    if (!dragging) { off += vel; vel *= 0.94; }
    const sway = reduce ? 0 : Math.sin(t * 0.5) * 1.6;
    shown += (p * 40 + off + sway - shown) * 0.14;
    paint((((Math.round(shown)) % TURN) + TURN) % TURN);
  });

  const nc = nextChair();
  $('[data-next]')!.textContent = nc;
  $('[data-free]')!.textContent = nc;
}

// hide the real hero until the intro hands over to it
function heroEnter() {
  const w = $$('[data-w1], [data-w2]');
  const type = $('[data-type]')!;
  const full = type.textContent || '';
  const lines = $$('.hero__t1, .hero__t2');
  if (reduce) { gsap.set(w, { opacity: 1 }); return; }
  type.textContent = '';
  gsap.set(w, { opacity: 1 });
  const tl = gsap.timeline();
  tl.from(lines, { yPercent: 100, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.1 }, 0)
    .from('.hero__stage', { y: 90, opacity: 0, duration: 1.4, ease: 'power3.out' }, 0.1)
    .from(['.hero__cone', '.hero__pool'], { opacity: 0, duration: 1.6 }, 0.2)
    .from(['.hero__status', '.hero__copy'], { opacity: 0, y: 16, duration: 0.9, stagger: 0.12 }, 0.5);
  const o = { n: 0 };
  tl.to(o, { n: full.length, duration: 0.5, ease: 'none', onUpdate: () => { type.textContent = full.slice(0, Math.round(o.n)); } }, 0.9);
}

// ---------- intro: fur and a curved line, then two words fly to where the hero keeps them ----------
function intro() {
  const el = $('[data-intro]')!;
  const iw1 = $('[data-iw1]', el)!, iw2 = $('[data-iw2]', el)!;
  const w1 = $('[data-w1]')!, w2 = $('[data-w2]')!;
  const path = $<SVGPathElement>('.intro__line path', el)!;
  const len = path.getTotalLength();
  let finished = false;
  gsap.set([w1, w2], { opacity: 0 });
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  // start "side" in the middle of the screen
  const r = iw1.getBoundingClientRect();
  const cx = innerWidth / 2 - (r.left + r.width / 2), cy = innerHeight / 2 - (r.top + r.height / 2);

  const finish = () => {
    if (finished) return; finished = true; tl.kill();
    gsap.killTweensOf([iw1, iw2]);
    const quick = reduce ? 0.01 : 0.5;
    gsap.set([iw1, iw2], { x: 0, y: 0, opacity: 1 });
    heroEnter();
    gsap.to(el, { opacity: 0, duration: quick, delay: 0.1, onComplete: () => el.remove() });
  };
  const tl = gsap.timeline({ onComplete: finish });
  if (reduce) { tl.to({}, { duration: 0.4 }); }
  else {
    tl.set(iw1, { x: cx, y: cy, scale: 0.8 })
      .to(iw1, { opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.2)
      .to(path, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.8)
      .to($$('.intro__fur, .intro__line, .intro__tag', el), { opacity: 0, duration: 0.8, ease: 'power2.out' }, 2.4)
      .to(iw1, { x: 0, y: 0, scale: 1, duration: 1.2, ease: 'power3.inOut' }, 2.4)
      .fromTo(iw2, { x: innerWidth * 0.3, y: innerHeight * 0.3, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 1.2, ease: 'power3.inOut' }, 2.5)
      .to({}, { duration: 0.35 });
  }
  $('[data-skip]', el)!.addEventListener('click', finish);
}

// ---------- reveals ----------
function reveals() {
  $$('[data-reveal]').forEach((h) => {
    const spans = $$('.ln > span', h);
    if (reduce) { gsap.set(spans, { yPercent: 0, y: 0 }); return; }
    gsap.to(spans, { yPercent: 0, y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, scrollTrigger: { trigger: h, start: 'top 88%' } });
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
    else gsap.to($$('.w', st), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '[data-why]', start: 'top 60%', end: 'center 40%', scrub: 0.6 } });
  }
  // "before you sit" lights up as it arrives
  ScrollTrigger.create({ trigger: '.book__title', start: 'top 75%', onEnter: () => $('.book__title')!.classList.add('is-lit') });
  if (!reduce) {
    gsap.from('.cuts__list li', { y: 36, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '.cuts__list', start: 'top 85%' } });
    gsap.from('.mirrors__row .mirror', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.mirrors__row', start: 'top 88%' } });
    gsap.from('.shelf__row li', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.shelf__row', start: 'top 88%' } });
    gsap.from('.gift__card', { x: -80, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.gift', start: 'top 70%' } });
    gsap.to('.hero__w1', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
}

// ---------- the guard menu: hover a cut and its tool comes to the cursor ----------
function guardMenu() {
  const list = $('[data-cuts]')!;
  const tool = $<HTMLImageElement>('[data-toolpop]')!;
  const src: Record<string, string> = { clippers: 'prop-clippers', comb: 'shelf-comb', scissors: 'tool-scissors', razor: 'tool-razor', brush: 'tool-brush' };
  const rows = $$('.cut', list);
  const moveX = gsap.quickTo(tool, 'x', { duration: 0.55, ease: 'power3' });
  const moveY = gsap.quickTo(tool, 'y', { duration: 0.55, ease: 'power3' });
  const place = (e: PointerEvent) => {
    const r = list.getBoundingClientRect();
    const w = tool.offsetWidth || 160;
    moveX(clamp(e.clientX - r.left + 36, 0, r.width - w));
    moveY(e.clientY - r.top - w * 0.55);
  };
  let shownTool = '';
  rows.forEach((row) => {
    const on = (e: PointerEvent | FocusEvent) => {
      list.classList.add('is-hover'); rows.forEach((x) => x.classList.toggle('is-active', x === row));
      if (!fine || reduce) return;
      const t = row.dataset.tool || 'clippers';
      if (t !== shownTool) { tool.src = `${art}${src[t]}.webp`; shownTool = t; }
      if ('clientX' in e) place(e as PointerEvent);
      gsap.fromTo(tool, { opacity: 0, scale: 0.7, rotation: gsap.utils.random(-22, -6) }, { opacity: 1, scale: 1, rotation: gsap.utils.random(-14, 14), duration: 0.5, ease: 'back.out(1.7)', overwrite: 'auto' });
    };
    row.addEventListener('pointerenter', on as EventListener);
    row.addEventListener('focus', on as EventListener);
  });
  if (fine) list.addEventListener('pointermove', place as EventListener);
  const off = () => { list.classList.remove('is-hover'); rows.forEach((x) => x.classList.remove('is-active')); gsap.to(tool, { opacity: 0, scale: 0.8, duration: 0.3, overwrite: 'auto' }); };
  list.addEventListener('pointerleave', off);
  list.addEventListener('focusout', (e) => { if (!list.contains((e as FocusEvent).relatedTarget as Node)) off(); });
}

// ---------- why: drag to spin, click a tool for a promise ----------
function props() {
  const list = data.props as { big: string; small: string }[];
  const pill = $('[data-pill]')!, big = $('[data-pill-big]')!, small = $('[data-pill-small]')!;
  const tilt = [-8, 6, -4, 9];
  const show = (i: number) => {
    big.textContent = list[i].big.replace('-', '−'); small.textContent = list[i].small;
    if (!reduce) gsap.fromTo(pill, { y: 14, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
  };
  show(0);
  $$('[data-prop]').forEach((el) => {
    const i = Number(el.dataset.prop);
    gsap.set(el, { rotation: tilt[i % 4] });
    Draggable.create(el, {
      type: 'x,y', inertia: true, throwResistance: 3500, bounds: '[data-why]',
      onClick() { show(i); if (!reduce) gsap.to(el, { rotation: '+=360', duration: 0.9, ease: 'power3.inOut' }); },
      onDrag() { gsap.to(el, { rotation: gsap.utils.clamp(-30, 30, this.deltaX * 3), duration: 0.3, overwrite: true }); },
      onThrowUpdate() { gsap.set(el, { rotation: gsap.utils.clamp(-40, 40, InertiaPlugin.getVelocity(el, 'x') / 50) }); },
      onThrowComplete() { gsap.to(el, { rotation: tilt[i % 4], duration: 0.7, ease: 'elastic.out(1, 0.5)' }); },
    });
  });
}

// ---------- four mirrors ----------
function mirrors() {
  const items = $$('[data-mirror]');
  const pick = (m: HTMLElement) => items.forEach((x) => x.classList.toggle('is-on', x === m));
  items.forEach((m) => {
    if (fine) m.addEventListener('pointerenter', () => pick(m));
    m.addEventListener('click', () => pick(m));
    m.addEventListener('focus', () => pick(m));
    m.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(m); } });
  });
}

// ---------- the book ----------
function book() {
  const chips = $$('[data-filter]');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { const on = x === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    const f = c.dataset.filter!;
    $$('.cutcard').forEach((b) => {
      const show = f === 'all' || b.dataset.who === f;
      b.classList.toggle('is-off', !show);
      if (show && !reduce) gsap.fromTo(b, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    });
    ScrollTrigger.refresh();
  }));
  // touch: tap a portrait to see the back
  $$('.cutcard__ph').forEach((p) => p.addEventListener('click', () => p.closest('.cutcard')!.classList.toggle('is-lit')));
  if (!reduce) gsap.from('.cutcard', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.book__grid', start: 'top 88%' } });
}

// ---------- the club: three cards fan up, the saving counts ----------
function club() {
  if (reduce) return;
  gsap.from('.plan', { y: 170, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, scrollTrigger: { trigger: '[data-fan]', start: 'top 85%' } });
  $$('[data-save]').forEach((el) => {
    const v = Number(el.dataset.save); const o = { n: 0 };
    gsap.to(o, { n: v, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '[data-fan]', start: 'top 75%', once: true }, onUpdate: () => { el.textContent = '£' + String(Math.round(o.n)).padStart(2, '0'); } });
    el.textContent = '£00';
  });
}

// ---------- the shelf ----------
function shelf() {
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => say(`${b.dataset.add} added. A concept: nothing is sold.`)));
}

// ---------- gift card ----------
function gift() {
  const card = $('[data-card]')!;
  const amt = $('[data-amt]')!;
  $$('[data-amount]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-amount]').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    amt.textContent = '£' + b.dataset.amount;
  }));
  $('[data-gift-send]')!.addEventListener('click', () => say('A concept: no card is sent and nothing is charged.'));
  if (!fine || reduce) return;
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
  const area = $('[data-gift]')!;
  area.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    ry(-16 + x * 40); rx(5 - y * 30);
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

// ---------- find the chair: a street map and a walking route ----------
function visit() {
  type Shop = { id: string; name: string; street: string; area: string; phone: string; tube: string; walk: number; rot: number; walkins: string; week: string[][] };
  const list = data.shops as Shop[];
  const root = $('[data-visit]')!;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const full: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  const fmt = (t: string) => { const h = +t.slice(0, 2); return `${h % 12 || 12}${t.slice(3) === '00' ? '' : ':' + t.slice(3)} ${h >= 12 ? 'PM' : 'AM'}`; };
  const roads = $('[data-roads]', root)!, route = $<SVGPathElement>('[data-route]', root)!;
  const stn = $<SVGCircleElement>('[data-stn]', root)!, stnL = $<SVGTextElement>('[data-stn-lbl]', root)!;
  const pin = $<SVGCircleElement>('[data-pin]', root)!, pinL = $<SVGTextElement>('[data-pin-lbl]', root)!;
  const NS = 'http://www.w3.org/2000/svg';
  const C = { x: 300, y: 230 };
  const rotate = (x: number, y: number, deg: number) => { const a = deg * Math.PI / 180, dx = x - C.x, dy = y - C.y; return [C.x + dx * Math.cos(a) - dy * Math.sin(a), C.y + dx * Math.sin(a) + dy * Math.cos(a)]; };

  function drawMap(s: Shop, animate: boolean) {
    roads.innerHTML = '';
    roads.setAttribute('transform', `rotate(${s.rot} ${C.x} ${C.y})`);
    const add = (x: number, y: number, w: number, h: number, fill = '#1c1c1f') => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', String(x)); r.setAttribute('y', String(y)); r.setAttribute('width', String(w)); r.setAttribute('height', String(h)); r.setAttribute('rx', '3'); r.setAttribute('fill', fill); roads.appendChild(r); };
    [-40, 70, 160, 250, 330, 420, 520].forEach((y, i) => add(-300, y, 1200, i === 2 ? 26 : 14));
    [-80, 60, 190, 310, 440, 560, 700].forEach((x, i) => add(x, -300, i === 3 ? 26 : 14, 1100));
    const a = rotate(130, 340, s.rot), m1 = rotate(317, 340, s.rot), m2 = rotate(317, 160, s.rot), b = rotate(440, 160, s.rot);
    route.setAttribute('d', `M${a[0]} ${a[1]} L${m1[0]} ${m1[1]} L${m2[0]} ${m2[1]} L${b[0]} ${b[1]}`);
    stn.setAttribute('cx', String(a[0])); stn.setAttribute('cy', String(a[1]));
    stnL.setAttribute('x', String(a[0] - 4)); stnL.setAttribute('y', String(a[1] + 34)); stnL.textContent = s.tube;
    pin.setAttribute('cx', String(b[0])); pin.setAttribute('cy', String(b[1]));
    pinL.setAttribute('x', String(b[0] + 30)); pinL.setAttribute('y', String(b[1] + 4));
    const len = route.getTotalLength();
    route.style.strokeDasharray = String(len);
    if (animate && !reduce) { gsap.fromTo(route, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }); gsap.fromTo(pin, { scale: 0.4, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, delay: 0.9, ease: 'back.out(2)' }); }
    else route.style.strokeDashoffset = '0';
    $('[data-s-walk]', root)!.textContent = `${s.walk} min walk from ${s.tube}`;
  }

  function render(s: Shop, animate: boolean) {
    $('[data-s-street]', root)!.textContent = s.street; $('[data-s-area]', root)!.textContent = s.area;
    const ph = $<HTMLAnchorElement>('[data-s-phone]', root)!; ph.textContent = s.phone; ph.href = 'tel:' + s.phone.replace(/\s/g, '');
    const today = days[new Date().getDay()];
    // group days that share the same hours, like a printed door sign
    const groups: { days: string[]; open: string; close: string }[] = [];
    s.week.forEach((r) => { const g = groups[groups.length - 1]; if (g && g.open === r[1] && g.close === r[2]) g.days.push(r[0]); else groups.push({ days: [r[0]], open: r[1], close: r[2] }); });
    $('[data-s-hours]', root)!.innerHTML = groups.map((g) => {
      const label = g.days.length > 1 ? `${g.days[0]} – ${g.days[g.days.length - 1]}` : full[g.days[0]];
      const isToday = g.days.includes(today);
      return `<div class="${isToday ? 'is-today' : ''}"><dt>${label}${isToday ? ' · today' : ''}</dt><dd>${fmt(g.open)} – ${fmt(g.close)}</dd></div>`;
    }).join('');
    $('[data-s-walkins]', root)!.textContent = s.walkins;
    drawMap(s, animate);
  }
  let current = list[0];
  render(current, false);
  $('[data-s-book]', root)!.addEventListener('click', () => document.dispatchEvent(new CustomEvent('book', { detail: 'shop:' + current.id })));
  const tabs = $$('[data-shop-tab]', root);
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    current = list.find((x) => x.id === t.dataset.shopTab)!;
    render(current, true);
  }));
  // draw the route the first time the map comes into view
  if (!reduce) ScrollTrigger.create({ trigger: '.visit__mapwrap', start: 'top 80%', once: true, onEnter: () => { const len = route.getTotalLength(); gsap.fromTo(route, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }); } });
}

// ---------- easter egg: type "fade" and the screen goes through a skin fade ----------
function eggs() {
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
}

reveals(); guardMenu(); props(); mirrors(); book(); club(); shelf(); gift(); reviews(); visit(); eggs(); hero();
initBooking({ data, lenis, say, reduce, art });
intro();
ScrollTrigger.refresh();
