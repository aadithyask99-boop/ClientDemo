import { gsap } from 'gsap';

(window as unknown as { __orra: boolean }).__orra = true;

const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const qa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Time of day: one variable, --night, takes the picture from dusk (lights off) to night (lights on) ---------- */
const modeBtns = qa<HTMLButtonElement>('[data-mode]');
function setMode(mode: 'dusk' | 'night') {
  root.dataset.mode = mode;
  modeBtns.forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  gsap.to(root, { '--night': mode === 'night' ? 1 : 0, duration: reduce ? 0.01 : 1.8, ease: 'power2.inOut', overwrite: true });
}
modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode as 'dusk' | 'night')));

/* ---------- Navigation: a pill follows the pointer along the links; a menu button on small screens ---------- */
const nav = q('[data-nav]')!;
const pill = q('[data-pill]')!;
const links = qa<HTMLAnchorElement>('.nav__link', nav);
const menuBtn = q('[data-menu]');
let active = links.find((l) => l.classList.contains('is-active')) || links[0];
function setActive(l: HTMLAnchorElement) {
  links.forEach((x) => { x.classList.remove('is-active'); x.removeAttribute('aria-current'); });
  l.classList.add('is-active');
  l.setAttribute('aria-current', 'page');
  active = l;
  movePill(l);
}
function movePill(to: HTMLElement) {
  pill.style.width = `${to.offsetWidth}px`;
  pill.style.transform = `translateX(${to.offsetLeft}px)`;
  links.forEach((l) => l.classList.toggle('is-under', l === to));
}
links.forEach((l) => {
  l.addEventListener('mouseenter', () => movePill(l));
  l.addEventListener('focus', () => movePill(l));
  l.addEventListener('click', () => {
    setActive(l);
    nav.classList.remove('is-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  });
});
nav.addEventListener('mouseleave', () => movePill(active));
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { nav.classList.remove('is-open'); menuBtn?.setAttribute('aria-expanded', 'false'); }
});
window.addEventListener('resize', () => movePill(active));
document.fonts?.ready.then(() => movePill(active));

/* ---------- Header: ink over the light sections, white over the picture and the dark ones; the current section lights its link ---------- */
const top = q('[data-top]')!;
const themed = qa('[data-theme]');
const spy = links.map((l) => ({ l, el: document.querySelector<HTMLElement>(l.getAttribute('href') || '') })).filter((x) => x.el) as { l: HTMLAnchorElement; el: HTMLElement }[];
let ticking = false;
function onScroll() {
  ticking = false;
  const y = 36;
  const under = themed.find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  top.classList.toggle('is-light', under?.dataset.theme === 'light');
  let cur = spy[0];
  for (const x of spy) if (x.el.getBoundingClientRect().top <= innerHeight * 0.4) cur = x;
  if (cur.l !== active && !nav.matches(':hover')) setActive(cur.l);
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- Below the hero: things ease in as they arrive ---------- */
const seen = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    seen.unobserve(e.target);
    if (e.target.matches('.figures')) countUp(e.target as HTMLElement);
  });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
qa('[data-reveal], [data-sketch], [data-tile]').forEach((el) => seen.observe(el));
function countUp(box: HTMLElement) {
  if (reduce) return;
  qa('[data-count]', box).forEach((c) => {
    const target = parseInt(c.dataset.count || '0', 10);
    const o = { v: 0 };
    c.textContent = '0';
    gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => { c.textContent = String(Math.round(o.v)); } });
  });
}

/* ---------- Principles: eight nodes round one idea; it changes by itself, or when you point at one ---------- */
const radial = q('[data-radial]');
if (radial) {
  const data: [string, string][] = JSON.parse(q('[data-principles]')?.textContent || '[]');
  const nodes = qa<HTMLButtonElement>('[data-node]', radial);
  const core = q('.radial__core', radial)!;
  const title = q('[data-core-title]', radial)!;
  const desc = q('[data-core-desc]', radial)!;
  let cur = 0;
  let timer: number | undefined;
  const show = (i: number) => {
    if (i === cur && nodes[i].classList.contains('is-on')) return;
    cur = i;
    nodes.forEach((n, k) => n.classList.toggle('is-on', k === i));
    core.classList.add('is-swap');
    window.setTimeout(() => { title.textContent = data[i][0]; desc.textContent = data[i][1]; core.classList.remove('is-swap'); }, reduce ? 0 : 280);
  };
  const play = () => { window.clearInterval(timer); if (!reduce) timer = window.setInterval(() => show((cur + 1) % nodes.length), 3200); };
  nodes.forEach((n, i) => {
    n.addEventListener('mouseenter', () => { window.clearInterval(timer); show(i); });
    n.addEventListener('focus', () => { window.clearInterval(timer); show(i); });
    n.addEventListener('click', () => { window.clearInterval(timer); show(i); });
    n.addEventListener('mouseleave', play);
  });
  nodes[0].classList.add('is-on');
  new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); else window.clearInterval(timer); }, { threshold: 0.3 }).observe(radial);
}

/* ---------- Glass cards tilt, and the button leans toward the pointer ---------- */
if (fine && !reduce) {
  qa('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 700 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 14);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 14);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
  const magnet = q('[data-magnet]');
  if (magnet) {
    const mx = gsap.quickTo(magnet, 'x', { duration: 0.5, ease: 'power3.out' });
    const my = gsap.quickTo(magnet, 'y', { duration: 0.5, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      const r = magnet.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < 120;
      mx(near ? dx * 0.28 : 0);
      my(near ? dy * 0.28 : 0);
    }, { passive: true });
  }
}

/* ---------- Intro: the scene settles out of a soft blur, the name rises letter by letter, then the interface follows ---------- */
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  const blurIn = (t: gsap.TweenTarget, blur: number, from: gsap.TweenVars, to: gsap.TweenVars, at: number) =>
    tl.fromTo(t, { opacity: 0, filter: `blur(${blur}px)`, ...from }, { opacity: 1, filter: 'blur(0px)', clearProps: 'filter', ...to }, at);

  blurIn(q('[data-backdrop]')!, 18, { scale: 1.06 }, { scale: 1, duration: 3 }, 0);
  qa('.letters:not(.letters--front) .l').forEach((el, i) => {
    tl.fromTo(el, { opacity: 0, yPercent: 16, filter: 'blur(22px)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px)', clearProps: 'filter', duration: 2.1 }, 0.6 + i * 0.14);
  });
  qa('.letters--front .l').forEach((el, i) => {
    tl.fromTo(el, { opacity: 0, yPercent: 16 }, { opacity: 1, yPercent: 0, duration: 2.1 }, 0.6 + i * 0.14);
  });
  qa('[data-ui]').forEach((el, i) => blurIn(el, 9, { y: 16 }, { y: 0, duration: 1.5 }, 1.7 + i * 0.12));
  qa('[data-count]').forEach((c) => {
    const target = parseInt(c.dataset.count || '0', 10);
    const o = { v: 0 };
    c.textContent = '0';
    tl.to(o, { v: target, duration: 2.2, ease: 'power2.out', onUpdate: () => { c.textContent = String(Math.round(o.v)); } }, 2.2);
  });
}

/* ---------- Start ---------- */
setMode('dusk');
gsap.set(root, { '--night': 0 });
movePill(active);

if (!reduce) {
  const imgs = qa<HTMLImageElement>('.plate');
  const ready = Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => undefined) : Promise.resolve())));
  Promise.race([ready, new Promise((r) => window.setTimeout(r, 2500))]).then(intro);
}
