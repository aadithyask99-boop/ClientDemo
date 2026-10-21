import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import './player';
import './eq';
import './gallery';
import './sections';

(window as any).__djeska = true;

gsap.registerPlugin(SplitText);
// Keep timelines in real time even when frames are slow or the tab is throttled, so the intro can never crawl
gsap.ticker.lagSmoothing(0);

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Wrap each wordmark line so it can slide up from a mask */
document.querySelectorAll<HTMLElement>('[data-line]').forEach((l) => {
  if (l.querySelector('.line-in')) return;
  l.innerHTML = `<span class="line-in">${l.textContent}</span>`;
});

/* Hero wordmark: letters rise one by one, and a grid of black blocks clears off the photo */
const heroChars: HTMLElement[] = [];
let blocks: HTMLElement | null = null;
if (!reduce) {
  document.querySelectorAll<HTMLElement>('.hero .line-in').forEach((l) => {
    const s = SplitText.create(l, { type: 'chars', charsClass: 'char', tag: 'span' });
    heroChars.push(...(s.chars as HTMLElement[]));
  });
  gsap.set(heroChars, { yPercent: 118 });
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    blocks = document.createElement('div');
    blocks.className = 'hero__blocks';
    blocks.setAttribute('aria-hidden', 'true');
    const size = Math.max(70, Math.round(innerWidth / 16));
    const cols = Math.ceil(innerWidth / size);
    const rows = Math.ceil(Math.max(hero.clientHeight, innerHeight) / size);
    blocks.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    blocks.style.gridTemplateRows = `repeat(${rows}, ${size}px)`;
    for (let i = 0; i < cols * rows; i++) blocks.appendChild(document.createElement('i'));
    hero.appendChild(blocks);
  }
}

/* Fit each wordmark to its container width. Desktop: one line. Phone: each word on its own line. */
function fit() {
  const stacked = matchMedia('(max-width: 700px)').matches;
  document.querySelectorAll<HTMLElement>('[data-fit]').forEach((h) => {
    const lines = [...h.querySelectorAll<HTMLElement>('[data-line]')];
    h.style.fontSize = '100px';
    const avail = h.clientWidth;
    if (stacked) {
      const widest = Math.max(...lines.map((l) => l.scrollWidth));
      h.style.fontSize = `${(100 * avail) / widest}px`;
    } else {
      const total = lines.reduce((s, l) => s + l.scrollWidth, 0);
      h.style.fontSize = `${(100 * avail) / (total + 28)}px`;
    }
  });
}
document.fonts.ready.then(fit);
addEventListener('resize', fit);
fit();

function revealHero() {
  if (reduce) return;
  // Safety net: whatever happens to the animation, the hero is clear and readable after a few seconds
  window.setTimeout(() => {
    blocks?.remove();
    gsap.set(heroChars, { yPercent: 0 });
    gsap.set('.hero__strap span, .header', { opacity: 1, y: 0 });
  }, 4200);
  if (blocks) {
    const cells = blocks.querySelectorAll('i');
    gsap.to(cells, {
      opacity: 0,
      duration: 0.01,
      stagger: { amount: 1.3, from: 'random' },
      ease: 'none',
      onComplete: () => blocks?.remove(),
    });
  }
  gsap.to(heroChars, { yPercent: 0, duration: 1.25, ease: 'power4.out', stagger: 0.07, delay: 0.45 });
  gsap.fromTo('.hero__strap span', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 1.3 });
  gsap.fromTo('.hero__photo', { scale: 1.1 }, { scale: 1, duration: 2.6, ease: 'power3.out' });
  gsap.fromTo('.header', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.2 });
}

/* Gate */
// The gate markup is always in the page. Only treat it as present when it is actually showing.
const gateEl = document.querySelector<HTMLElement>('[data-gate]');
const gate = root.classList.contains('gated') ? gateEl : null;
if (!gate) gateEl?.remove();
function leaveGate(withSound: boolean) {
  try { sessionStorage.setItem('djeska-gate', '1'); } catch (e) {}
  document.dispatchEvent(new CustomEvent('djeska:enter', { detail: { sound: withSound } }));
  if (!gate) return;
  const finish = () => {
    gate.remove();
    root.classList.remove('gated');
    revealHero();
  };
  const stage = gate.querySelector('[data-stage]');
  const sleeve = gate.querySelector('[data-sleeve]');
  const vinyl = gate.querySelector<HTMLElement>('[data-vinyl]');
  const btn = gate.querySelector('[data-open]');
  if (vinyl) vinyl.style.transition = 'none';
  gsap.set('.hero__strap span', { opacity: 0 });
  gsap.set('.header', { opacity: 0 });
  const tl = gsap.timeline({ onComplete: finish });
  tl.to(btn, { opacity: 0, duration: 0.3 }, 0)
    .to(vinyl, { xPercent: 42, rotation: 300, duration: 1.3, ease: 'power3.inOut' }, 0)
    .to(sleeve, { xPercent: -42, duration: 1.3, ease: 'power3.inOut' }, 0)
    .to(stage, { x: 0, duration: 1.3, ease: 'power3.inOut' }, 0)
    .to(stage, { scale: 6, opacity: 0, filter: 'blur(14px)', duration: 0.9, ease: 'power2.in' }, 1.0)
    .to(gate, { opacity: 0, duration: 0.5 }, 1.5);
}
gate?.querySelector('[data-open]')?.addEventListener('click', () => leaveGate(true));

// No gate (returning visitor, reduced motion, no JS): show the hero straight away
if (!gate) revealHero();
else gate.querySelector<HTMLElement>('[data-open]')?.focus();

/* Nav: glide highlight */
const nav = document.querySelector<HTMLElement>('[data-nav]');
const glide = document.querySelector<HTMLElement>('[data-glide]');
if (nav && glide && fine) {
  const move = (a: HTMLElement | null) => {
    if (!a) { glide.style.opacity = '0'; return; }
    glide.style.opacity = '1';
    glide.style.width = `${a.offsetWidth}px`;
    glide.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  nav.querySelectorAll<HTMLElement>('a').forEach((a) => a.addEventListener('mouseenter', () => move(a)));
  nav.addEventListener('mouseleave', () => move(nav.querySelector('a[aria-current]')));
}

/* Magnetic pills, desktop only */
if (fine && !reduce) {
  document.querySelectorAll<HTMLElement>('[data-magnet]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
      gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' }));
  });
}
