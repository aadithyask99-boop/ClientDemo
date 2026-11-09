// @ts-nocheck
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initSections } from './sections';
import { initCursor } from './cursor';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

/* ---------- data from the DOM ---------- */
const picker = $$('.swatch');
const models = $$('#heroModels img');
const CW = {
  midnight: { name: 'Midnight', price: 398, ground: '#a9b8cc', word: '#d2dbe7', ink: '#0f1c33', dark: false },
  snowfield: { name: 'Snowfield', price: 398, ground: '#5d7391', word: '#7f93ad', ink: '#f1ede4', dark: true },
  pine: { name: 'Pine', price: 428, ground: '#bcc9c0', word: '#dbe4de', ink: '#10261f', dark: false },
  hearth: { name: 'Hearth', price: 428, ground: '#d8cdc0', word: '#ece4d8', ink: '#2a1015', dark: false },
};
const order = Object.keys(CW);
const state = { cw: 'midnight', size: 'M', busy: false };

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && !coarse) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lockScroll = (on) => {
  document.body.classList.toggle('is-locked', on);
  document.dispatchEvent(new Event('lockchange'));
  if (lenis) on ? lenis.stop() : lenis.start();
};
const scrollToEl = (el) => (lenis ? lenis.scrollTo(el, { offset: -10, duration: 1.4 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const el = id.length > 1 ? $(id) : null;
  if (id === '#top') { e.preventDefault(); lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0 }); closeMenu(); return; }
  if (el) { e.preventDefault(); scrollToEl(el); closeMenu(); }
}));

/* ---------- loader and intro ---------- */
const loader = $('#loader');
const heroTitle = $('#heroTitle');
function introHero() {
  gsap.from('.hero__title span', { yPercent: 105, duration: 1.1, ease: 'power4.out' });
  gsap.from(['.hero__crumb', '.sizes', '.add', '.rating', '.hero__note'], { y: 26, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.15 });
  gsap.from('.swatch', { x: 50, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', delay: 0.25 });
  gsap.from('#heroModels', { y: 70, opacity: 0, duration: 1.3, ease: 'power3.out' });
  gsap.from('#heroWord', { scale: 1.08, opacity: 0, duration: 1.6, ease: 'power3.out' });
}
function runLoader() {
  const num = $('#loaderNum');
  const pale = $('#loaderPale');
  const to = 2480;
  const o = { v: 0, p: 0 };
  lockScroll(true);
  const finish = () => { loader.remove(); lockScroll(false); ScrollTrigger.refresh(); };
  if (reduce) { finish(); return; }
  const tl = gsap.timeline({ onComplete: finish });
  tl.to(o, { v: to, duration: 2.1, ease: 'power2.inOut', onUpdate: () => (num.textContent = Math.round(o.v).toLocaleString('en-US')) })
    .to(pale, { opacity: 1, duration: 0.45, ease: 'power1.inOut' }, '>-0.05')
    .to('.loader__top, .loader__bot, .loader__mark', { color: '#2b3d58', duration: 0.45 }, '<')
    .to('.loader__mark', { opacity: 0.0, duration: 0.3 }, '>0.15')
    .add(() => introHero(), '>-0.1')
    .to(o, {
      p: 1, duration: 1.0, ease: 'power3.inOut',
      onUpdate: () => {
        const yL = 108 - 150 * o.p, yR = yL - 30;
        loader.style.clipPath = `polygon(0 0, 100% 0, 100% ${yR}%, 0 ${yL}%)`;
      },
    }, '<');
}
runLoader();

/* ---------- header theme ---------- */
const header = $('#header');
function heroHeader() { header.style.color = CW[state.cw].ink; header.classList.remove('is-light'); }
heroHeader();
const themed = $$('[data-theme]');
let lastTheme = '';
function themeTick() {
  if (menu.classList.contains('is-on')) return;
  const small = matchMedia('(max-width: 860px)').matches;
  let cur = null;
  for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) cur = s; }
  const t = cur ? cur.dataset.theme : 'hero';
  if (t === 'hero') {
    // on a phone the bar turns solid once you scroll, in the hero's own colour, so nothing slides under the logo
    const solid = small && scrollY > 70;
    heroHeader(); header.classList.toggle('is-solid', solid); header.style.backgroundColor = solid ? CW[state.cw].ground : '';
    lastTheme = 'hero'; return;
  }
  header.style.backgroundColor = '';
  if (t === lastTheme) return;
  lastTheme = t;
  header.style.color = '';
  header.classList.toggle('is-light', t.startsWith('dark'));
  header.classList.toggle('is-solid', t === 'light' || t === 'dark-solid' || small);
}
let tf = 0;
gsap.ticker.add(() => { if (++tf % 4 === 0) themeTick(); });

/* ---------- mobile menu ---------- */
const menu = $('#menu'), menuBtn = $('#menuBtn');
function closeMenu() { menu.classList.remove('is-on'); header.classList.remove('is-menu'); lastTheme = ''; menuBtn.setAttribute('aria-expanded', 'false'); if (!drawerOpen && !checkoutOpen) lockScroll(false); }
menuBtn.addEventListener('click', () => {
  const on = !menu.classList.contains('is-on');
  menu.classList.toggle('is-on', on); header.classList.toggle('is-menu', on); menuBtn.setAttribute('aria-expanded', String(on)); lockScroll(on);
  if (on) { header.style.color = '#f1ede4'; header.style.backgroundColor = ''; header.classList.remove('is-solid'); } else { lastTheme = ''; }
});

/* ---------- hero: colourways ---------- */
// two layers of fractal-noise mist, built once, so the swap clears like weather and not like a veil
function cloud(seed) {
  const W = 640, H = 360;
  const acc = new Float32Array(W * H);
  let rng = seed; const rand = () => (rng = (rng * 16807) % 2147483647) / 2147483647;
  for (const [gw, gh, amp] of [[6, 4, 0.5], [12, 7, 0.28], [24, 14, 0.14], [48, 27, 0.08]]) {
    const g = document.createElement('canvas'); g.width = gw; g.height = gh;
    const gx = g.getContext('2d'); const id = gx.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) { const v = rand() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    gx.putImageData(id, 0, 0);
    const t = document.createElement('canvas'); t.width = W; t.height = H;
    const tx = t.getContext('2d'); tx.imageSmoothingEnabled = true; tx.imageSmoothingQuality = 'high'; tx.drawImage(g, 0, 0, W, H);
    const d = tx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < W * H; i++) acc[i] += (d[i * 4] / 255) * amp;
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); const out = x.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(1, Math.max(0, (acc[i] - 0.34) / 0.22)), sm = a * a * (3 - 2 * a);
    out.data[i * 4] = 238; out.data[i * 4 + 1] = 244; out.data[i * 4 + 2] = 250; out.data[i * 4 + 3] = Math.round(sm * 252);
  }
  x.putImageData(out, 0, 0);
  return c.toDataURL('image/png');
}
let fogReady = false;
function ensureFog() {
  if (fogReady) return; fogReady = true;
  $('#fog').style.backgroundImage = `url(${cloud(48271)})`;
  $('#fog2').style.backgroundImage = `url(${cloud(69621)})`;
}
if ('requestIdleCallback' in window) requestIdleCallback(ensureFog, { timeout: 5000 }); else setTimeout(ensureFog, 3000);

const hero = $('.hero');
function applyCw(id) {
  const c = CW[id];
  hero.style.setProperty('--hg', c.ground); hero.style.setProperty('--hw', c.word); hero.style.setProperty('--hi', c.ink);
  hero.classList.toggle('is-dark', c.dark);
  models.forEach((m) => m.classList.toggle('is-on', m.dataset.id === id));
  picker.forEach((p) => { const on = p.dataset.id === id; p.classList.toggle('is-on', on); p.setAttribute('aria-pressed', on); });
  $('#heroPrice').textContent = money(c.price); $('#mbarPrice').textContent = money(c.price);
  $('#heroIdx').textContent = String(order.indexOf(id) + 1).padStart(2, '0');
  if (hero.getBoundingClientRect().bottom > 40) heroHeader();
}
function setCw(id, instant = false) {
  if (id === state.cw || state.busy) return;
  if (instant || reduce) { state.cw = id; applyCw(id); heroTitle.firstElementChild.textContent = CW[id].name; return; }
  state.busy = true; ensureFog();
  const f1 = $('#fog'), f2 = $('#fog2');
  gsap.set([f1, f2], { opacity: 0, scale: 1.2, xPercent: (i) => (i ? 7 : -7) });
  const swap = () => {
    state.cw = id; applyCw(id);
    const old = heroTitle.firstElementChild;
    const nu = old.cloneNode(false); nu.textContent = CW[id].name;
    heroTitle.append(nu);
    gsap.fromTo(old, { yPercent: 0 }, { yPercent: -105, duration: 0.32, ease: 'power3.in', onComplete: () => old.remove() });
    gsap.fromTo(nu, { yPercent: 105 }, { yPercent: 0, duration: 0.55, ease: 'power4.out', delay: 0.1 });
    gsap.fromTo('#heroModels', { y: 18, scale: 0.99 }, { y: 0, scale: 1, duration: 0.9, ease: 'power3.out' });
  };
  gsap.timeline({ onComplete: () => { state.busy = false; gsap.set([f1, f2], { opacity: 0 }); } })
    .to([f1, f2], { opacity: 1, scale: 1, xPercent: 0, duration: 0.22, ease: 'power2.out', stagger: 0.03 })
    .add(swap, '>-0.04')
    .to(f1, { opacity: 0, scale: 1.07, xPercent: -6, duration: 0.6, ease: 'power1.inOut' }, '>0.05')
    .to(f2, { opacity: 0, scale: 1.12, xPercent: 8, duration: 0.7, ease: 'power1.inOut' }, '<0.05');
}
picker.forEach((p) => p.addEventListener('click', () => setCw(p.dataset.id)));
$$('.size').forEach((s) => s.addEventListener('click', () => {
  state.size = s.dataset.size;
  $$('.size').forEach((x) => { x.classList.toggle('is-on', x === s); x.setAttribute('aria-pressed', x === s); });
}));

/* pointer drift on the hero */
if (!coarse && !reduce) {
  const mx = gsap.quickTo('#heroModels', 'x', { duration: 1.2, ease: 'power3' });
  const wx = gsap.quickTo('#heroWord', 'x', { duration: 1.6, ease: 'power3' });
  hero.addEventListener('pointermove', (e) => {
    const r = (e.clientX / innerWidth - 0.5) * 2;
    mx(-r * 14); wx(r * 22);
  });
}

/* ---------- hero: snow (and the melt egg) ---------- */
const cv = $('#snow'), ctx = cv.getContext('2d');
let W = 0, H = 0, flakes = [], snowOn = true, hold = null, warmth = 0;
function sizeSnow() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round((W * H) / (coarse ? 15000 : 8500));
  flakes = Array.from({ length: n }, () => mk(true));
}
function mk(any) { return { x: Math.random() * W, y: any ? Math.random() * H : -10, r: 0.8 + Math.random() * 2.6, v: 0.5 + Math.random() * 1.2, s: Math.random() * 6, a: 0.5 + Math.random() * 0.5 }; }
function tick() {
  ctx.clearRect(0, 0, W, H);
  warmth += ((hold ? 1 : 0) - warmth) * 0.06;
  for (const f of flakes) {
    f.y += f.v; f.s += 0.01; f.x += Math.sin(f.s) * 0.4 + 0.25;
    if (hold) {
      const dx = f.x - hold.x, dy = f.y - hold.y, d = Math.hypot(dx, dy);
      if (d < 210) { f.a -= 0.035; f.y -= f.v * 0.4; }
    } else if (f.a < 0.95) f.a = Math.min(0.95, f.a + 0.004);
    if (f.y > H + 10 || f.x > W + 10 || f.a <= 0) { Object.assign(f, mk(false)); if (hold) f.a = 0.9; }
    ctx.globalAlpha = Math.max(0, f.a);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const w = $('#warm');
  if (hold) w.style.background = `radial-gradient(circle 260px at ${hold.x}px ${hold.y}px, rgba(255,196,128,${0.42 * warmth}), rgba(255,196,128,0))`;
  w.style.opacity = warmth > 0.01 ? 1 : 0;
}
sizeSnow(); addEventListener('resize', sizeSnow);
gsap.ticker.add(() => { if (snowOn) tick(); });
new IntersectionObserver(([e]) => (snowOn = e.isIntersecting)).observe(hero);
if (reduce) snowOn = false;
const hs = (e) => { if (e.target.closest('button, a, .picker')) return; const r = hero.getBoundingClientRect(); hold = { x: e.clientX - r.left, y: e.clientY - r.top }; };
let holdT = 0;
hero.addEventListener('pointerdown', (e) => { clearTimeout(holdT); const ev = e; holdT = setTimeout(() => hs(ev), 450); });
hero.addEventListener('pointermove', (e) => { if (hold) hs(e); });
['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => hero.addEventListener(n, () => { clearTimeout(holdT); hold = null; }));

/* ---------- cart ---------- */
const cart = [];
const drawer = $('#drawer'), scrim = $('#scrim');
let drawerOpen = false, checkoutOpen = false;
const extras = JSON.parse($('#pairs').dataset.extras);
const bagBtn = $('#bagBtn');
function setOpen(el, on) { el.classList.toggle('is-on', on); el.setAttribute('aria-hidden', String(!on)); on ? el.removeAttribute('inert') : el.setAttribute('inert', ''); }
setOpen(drawer, false); setOpen($('#checkout'), false);
function openCart() { drawerOpen = true; setOpen(drawer, true); scrim.classList.add('is-on'); lockScroll(true); renderCart(); setTimeout(() => $('#closeCart').focus({ preventScroll: true }), 300); }
function closeCart() { drawerOpen = false; setOpen(drawer, false); scrim.classList.remove('is-on'); if (!checkoutOpen) lockScroll(false); bagBtn.focus({ preventScroll: true }); }
bagBtn.addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
const total = () => cart.reduce((s, i) => s + i.price * i.qty, 0);
function renderCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartN').textContent = `(${count})`;
  const bc = $('#bagCount'); bc.textContent = count; bc.classList.toggle('has', count > 0);
  const sub = total();
  $('#subtotal').textContent = money(sub);
  const left = 300 - sub;
  $('#shipTxt').textContent = left <= 0 ? 'Free express shipping unlocked' : `${money(left)} away from free express shipping`;
  $('#shipBar').style.width = Math.min(100, (sub / 300) * 100) + '%';
  const lines = $('#lines');
  lines.innerHTML = cart.length ? '' : '<p class="empty">Your bag is empty. Add a knit and it flies in.</p>';
  cart.forEach((it) => {
    const row = document.createElement('div'); row.className = 'cline';
    row.innerHTML = `<div class="t"><img src="${it.img}" alt="" style="object-position:center 12%"></div><div><h3>${it.name}</h3><p>${it.sub}</p><div class="qty"><button aria-label="Fewer">&minus;</button><span>${it.qty}</span><button aria-label="More">+</button></div></div><div class="pr">${money(it.price * it.qty)}<button class="rm">Remove</button></div>`;
    const [minus, plus] = $$('.qty button', row);
    minus.onclick = () => { it.qty--; if (it.qty <= 0) cart.splice(cart.indexOf(it), 1); renderCart(); };
    plus.onclick = () => { it.qty++; renderCart(); };
    $('.rm', row).onclick = () => { cart.splice(cart.indexOf(it), 1); renderCart(); };
    row.style.animation = it._new ? '' : 'none'; it._new = false;
    lines.append(row);
  });
  const pairs = $('#pairs'); pairs.innerHTML = '';
  extras.filter((e) => !cart.some((c) => c.key === 'x-' + e.id)).slice(0, 2).forEach((e) => {
    const row = document.createElement('div'); row.className = 'pair';
    row.innerHTML = `<div class="t"><img src="${e.img}" alt=""></div><div><b>${e.name}</b><span>${e.sub} &middot; ${money(e.price)}</span></div><button class="addbtn">Add</button>`;
    $('.addbtn', row).onclick = () => { add({ key: 'x-' + e.id, name: e.name, sub: e.sub, price: e.price, img: e.img }); };
    pairs.append(row);
  });
}
function add(item) {
  const hit = cart.find((c) => c.key === item.key);
  if (hit) hit.qty++; else cart.push({ ...item, qty: 1, _new: true });
  renderCart();
}
function bump() {
  const b = $('#bagCount'); b.classList.add('has');
  gsap.fromTo(bagBtn, { scale: 1 }, { scale: 1.22, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
}
function fly(fromRect, src, done) {
  if (reduce) { done(); return; }
  const f = document.createElement('div'); f.className = 'flyer'; f.innerHTML = `<img src="${src}" alt="">`;
  document.body.append(f);
  const to = bagBtn.getBoundingClientRect();
  const sx = fromRect.left + fromRect.width / 2 - 32, sy = fromRect.top + fromRect.height / 2 - 32;
  const tx = to.left + to.width / 2 - 32, ty = to.top + to.height / 2 - 32;
  gsap.set(f, { x: sx, y: sy, scale: 0.4, opacity: 0, rotate: -6 });
  const tl = gsap.timeline({ onComplete: () => { f.remove(); done(); } });
  tl.to(f, { scale: 1, opacity: 1, duration: 0.18, ease: 'power2.out' })
    .to(f, { x: tx, duration: 0.8, ease: 'power2.inOut' }, 0.1)
    .to(f, { y: ty, duration: 0.8, ease: 'power3.in' }, 0.1)
    .to(f, { scale: 0.32, rotate: 14, duration: 0.8, ease: 'power2.in' }, 0.1);
}
function addHero(from) {
  const c = CW[state.cw];
  const src = $(`.swatch[data-id="${state.cw}"] img`).src;
  fly(from, src, () => {
    add({ key: `stag-${state.cw}-${state.size}`, name: 'Stag cable quarter-zip', sub: `${c.name}, ${state.size}`, price: c.price, img: models.find((m) => m.dataset.id === state.cw).src });
    bump(); setTimeout(openCart, 160);
  });
}
$('#addBtn').addEventListener('click', () => {
  const r = $('#heroModels').getBoundingClientRect();
  addHero({ left: r.left + r.width * 0.5 - 32, top: Math.min(Math.max(r.top + r.height * 0.5, 80), innerHeight - 120), width: 64, height: 64 });
});
$('#mbar').addEventListener('click', () => addHero($('#mbar').getBoundingClientRect()));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const r = b.getBoundingClientRect(); const d = b.dataset;
  const src = d.img.startsWith('http') || d.img.startsWith('/') || d.img.startsWith('.') ? d.img : new URL(d.img, document.baseURI).href;
  const imgEl = b.closest('.card, .scard, .feature')?.querySelector('img');
  fly(r, imgEl ? imgEl.src : src, () => { add({ key: 'p-' + d.id + d.sub, name: d.name, sub: d.sub, price: Number(d.price), img: imgEl ? imgEl.src : src }); bump(); });
});

/* ---------- checkout ---------- */
const co = $('#checkout'), coLoad = $('#checkoutLoad');
$('#checkoutBtn').addEventListener('click', () => {
  if (!cart.length) return;
  coLoad.classList.add('is-on'); closeCartKeepLock();
  setTimeout(() => {
    checkoutOpen = true; renderSummary(); setOpen(co, true); co.scrollTop = 0;
    setTimeout(() => coLoad.classList.remove('is-on'), 260);
  }, 1300);
});
function closeCartKeepLock() { drawerOpen = false; setOpen(drawer, false); scrim.classList.remove('is-on'); }
function renderSummary() {
  const s = $('#sumLines'); s.innerHTML = '';
  cart.forEach((i) => { const l = document.createElement('div'); l.className = 'sline'; l.innerHTML = `<span>${i.name} &times; ${i.qty}<br><small style="opacity:.7">${i.sub}</small></span><span>${money(i.price * i.qty)}</span>`; s.append(l); });
  $('#sumTotal').textContent = money(total());
  $('#sumImg').src = cart[0].img; $('#summary').classList.remove('is-done');
}
function closeCheckout() { checkoutOpen = false; setOpen(co, false); lockScroll(false); }
$('#backBtn').addEventListener('click', closeCheckout);
$('#payBtn').addEventListener('click', () => $('#summary').classList.add('is-done'));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (checkoutOpen) closeCheckout(); else if (drawerOpen) closeCart(); else if (menu.classList.contains('is-on')) closeMenu(); }
});

/* ---------- easter egg: cocoa ---------- */
let typed = '';
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  typed = (typed + e.key.toLowerCase()).slice(-5);
  if (typed === 'cocoa') steam();
});
function steam() {
  const r = bagBtn.getBoundingClientRect();
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;z-index:150;left:${r.left + r.width / 2}px;top:${r.bottom + 6}px;pointer-events:none`;
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('i');
    s.style.cssText = `position:absolute;left:${(i - 3) * 9}px;top:0;width:18px;height:46px;border-radius:50%;background:radial-gradient(closest-side,rgba(241,237,228,.85),rgba(241,237,228,0));opacity:0`;
    t.append(s);
    gsap.fromTo(s, { y: 0, opacity: 0, scale: 0.5 }, { y: 70 + Math.random() * 40, opacity: 0.9, scale: 1.4, duration: 2.4, delay: i * 0.18, ease: 'sine.out', onComplete: () => gsap.to(s, { opacity: 0, duration: 0.8 }) });
  }
  const msg = document.createElement('div');
  msg.textContent = 'Hot cocoa on the house.';
  msg.style.cssText = `position:fixed;z-index:150;right:var(--gut);top:84px;background:#f1ede4;color:#0f1c33;font-weight:800;padding:12px 18px;border-radius:999px;box-shadow:0 14px 30px -10px rgba(0,0,0,.5)`;
  document.body.append(t, msg);
  gsap.from(msg, { y: -16, opacity: 0, duration: 0.5, ease: 'power3.out' });
  setTimeout(() => { t.remove(); gsap.to(msg, { opacity: 0, duration: 0.5, onComplete: () => msg.remove() }); }, 4200);
}

/* ---------- easter egg: the lodge window, and the drop ---------- */
const dropSec = $('#drop'), win = $('#dropWindow');
win.addEventListener('click', () => {
  const on = dropSec.classList.toggle('is-lit'); win.setAttribute('aria-pressed', on);
  $('#dropText').textContent = on ? 'The fire is lit.' : $('#dropText').dataset.t;
});
$('#dropText').dataset.t = $('#dropText').textContent;
$('#dropForm').addEventListener('submit', (e) => { e.preventDefault(); $('#dropText').textContent = 'You are on the list. We will write before the first snow.'; e.target.reset(); });
$('#footForm').addEventListener('submit', (e) => { e.preventDefault(); e.target.querySelector('button').textContent = 'Subscribed'; });
const cd = $('#countdown'), target = new Date(cd.dataset.to).getTime();
function cdTick() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
  const p = (n) => String(n).padStart(2, '0');
  $('#cdD').textContent = p(d); $('#cdH').textContent = p(h); $('#cdM').textContent = p(m); $('#cdS').textContent = p(s);
}
cdTick(); setInterval(cdTick, 1000);

/* ---------- shelf: drag to scroll ---------- */
const rail = $('#rail');
let down = false, sx = 0, sl = 0, moved = 0;
rail.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; });
addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; moved = Math.abs(dx); if (moved > 4) rail.classList.add('is-drag'); rail.scrollLeft = sl - dx; });
addEventListener('pointerup', () => { down = false; rail.classList.remove('is-drag'); });
rail.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
rail.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });

/* ---------- phone: the add-to-bag bar shows in the shop sections once the hero button has scrolled away ---------- */
{
  const bar = $('#mbar'), seen = new Set(); let addOut = false;
  const upd = () => bar.classList.toggle('is-on', matchMedia('(max-width: 860px)').matches && addOut && seen.size > 0 && !document.body.classList.contains('is-locked'));
  const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id))); upd(); }, { rootMargin: '0px 0px -12% 0px' });
  ['collection', 'proof', 'shelf'].forEach((id) => io.observe(document.getElementById(id)));
  new IntersectionObserver(([e]) => { addOut = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }).observe($('#addBtn'));
  document.addEventListener('lockchange', upd);
}
if (!reduce) {
  const mmz = gsap.matchMedia();
  mmz.add('(max-width: 860px)', () => {
    gsap.to('#heroModels', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.9), scrub: true } });
    gsap.to('#heroWord', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.9), scrub: true } });
  });
}

/* ---------- the collection slides up over the pinned hero ---------- */
if (!reduce) {
  const mmh = gsap.matchMedia();
  mmh.add('(min-width: 861px)', () => {
    const rig = $('#heroModels'), word = $('#heroWord'), info = $('.hero__info');
    ScrollTrigger.create({
      trigger: '#collection', start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        rig.style.translate = `0 ${(-p * 9).toFixed(2)}vh`; rig.style.scale = (1 + p * 0.07).toFixed(4);
        word.style.translate = `0 ${(-p * 6).toFixed(2)}vh`;
        info.style.translate = `0 ${(-p * 5).toFixed(2)}vh`;
      },
    });
    return () => { rig.style.translate = ''; rig.style.scale = ''; word.style.translate = ''; info.style.translate = ''; };
  });
}
initSections();
initCursor();

/* reveals (all sizes) */
if (!reduce) {
  $$('[data-reveal]').forEach((el) => gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: el.closest('#collection') ? 'top 130%' : 'top 88%' } }));
  ScrollTrigger.batch('.card, .feature', { start: 'top 125%', onEnter: (b) => gsap.from(b, { y: 70, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true }) });
  ScrollTrigger.batch('.pcard', { start: 'top 88%', onEnter: (b) => gsap.from(b, { y: 80, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', overwrite: true }) });
  ScrollTrigger.batch('.scard', { start: 'top 92%', onEnter: (b) => gsap.from(b, { x: 80, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true }) });
  ScrollTrigger.batch('.lb__fig', { start: 'top 94%', onEnter: (b) => gsap.from(b, { y: 56, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true }) });
  $$('.foot__top > *, .shelf__side').forEach((el) => gsap.from(el, { y: 44, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%' } }));
  $$('.lb__text > *').forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  gsap.from('.drop__in > *', { y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#drop', start: 'top 55%' } });
}
$$('[data-count]').forEach((b) => {
  const to = Number(b.dataset.count), dec = Number(b.dataset.dec || 0);
  const o = { v: 0 }; b.textContent = (0).toFixed(dec);
  const run = () => gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => (b.textContent = o.v.toFixed(dec)) });
  if (reduce) { b.textContent = to.toFixed(dec); return; }
  ScrollTrigger.create({ trigger: b, start: 'top 88%', once: true, onEnter: run });
});

addEventListener('load', () => ScrollTrigger.refresh());
