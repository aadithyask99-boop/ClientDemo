import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { initQuiz } from './quiz';
import { initReviews } from './reviews';
import { initRequest } from './request';
import { initVisit } from './visit';
import { initNotes } from './notes';
import { initResults } from './results';
import { initTreatments } from './treatments';
import { flags, initPanel } from './flags';
import { initCursor } from './cursor';

gsap.registerPlugin(SplitText);
(window as unknown as { __ileife: boolean }).__ileife = true;

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Headline splitting: lines rise out of a mask ---------- */
const lineMap = new WeakMap<Element, Element[]>();
const played = new WeakSet<Element>();

function setupSplits() {
  const els = document.querySelectorAll<HTMLElement>('[data-split]');
  els.forEach((el) => {
    if (reduce) {
      el.classList.add('ready');
      return;
    }
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      maskClass: 'mask',
      autoSplit: true,
      onSplit(self) {
        lineMap.set(el, self.lines);
        gsap.set(self.lines, { yPercent: played.has(el) ? 0 : 115 });
        el.classList.add('ready');
      },
    });
  });
}

function revealSplit(el: HTMLElement) {
  if (played.has(el)) return;
  played.add(el);
  const lines = lineMap.get(el);
  if (!lines) return;
  gsap.to(lines, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.12 });
}

/* ---------- Scroll reveals: blur to clarity ---------- */
function setupReveals() {
  const targets = document.querySelectorAll<HTMLElement>('.clr, .clr-img, [data-split]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (el.hasAttribute('data-split')) revealSplit(el);
        else el.classList.add('is-in');
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  targets.forEach((t) => io.observe(t));
}

/* ---------- Tone: the page colour follows the section at the middle of the viewport ---------- */
function setupTone() {
  const sections = document.querySelectorAll<HTMLElement>('[data-tone-section]');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) root.dataset.tone = (e.target as HTMLElement).dataset.toneSection ?? 'cream';
      });
    },
    { rootMargin: '-48% 0px -51% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- Header gets a backing once the page has scrolled ---------- */
function setupHeader() {
  const nav = document.querySelector<HTMLElement>('.nav');
  if (!nav) return;
  const on = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', on, { passive: true });
  on();
}

/* ---------- Back to top ---------- */
function setupToTop() {
  const btn = document.querySelector<HTMLButtonElement>('[data-totop]');
  const bar = btn?.querySelector<SVGCircleElement>('[data-bar]');
  if (!btn || !bar) return;
  const C = 138.2;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.strokeDashoffset = String(C * (1 - p));
    btn.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
}

/* ---------- Nav: a soft highlight slides to the link under the pointer ---------- */
function setupNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const hl = nav?.querySelector<HTMLElement>('.nav__hl');
  if (!nav || !hl) return;
  const move = (a: HTMLElement) => {
    const n = nav.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    hl.style.width = `${r.width}px`;
    hl.style.transform = `translateX(${r.left - n.left}px)`;
    hl.classList.add('on');
  };
  nav.querySelectorAll<HTMLElement>('a').forEach((a) => {
    a.addEventListener('pointerenter', () => move(a));
    a.addEventListener('focus', () => move(a));
  });
  nav.addEventListener('pointerleave', () => hl.classList.remove('on'));
}

/* ---------- Preloader: logo eases in, the page sharpens from a blur ---------- */
function runPreloader(done: () => void) {
  const pre = document.querySelector<HTMLElement>('[data-preloader]');
  if (!pre || !root.classList.contains('preloading')) {
    pre?.remove();
    done();
    return;
  }
  const MIN = 2900;
  const MAX = 6500;
  const t0 = performance.now();
  let loaded = document.readyState === 'complete';
  if (!loaded) window.addEventListener('load', () => (loaded = true), { once: true });
  const fontsReady = 'fonts' in document ? document.fonts.ready.then(() => true) : Promise.resolve(true);
  let fonts = false;
  void fontsReady.then(() => (fonts = true));

  // A timer, not requestAnimationFrame, so a throttled or background tab still lifts the screen
  const timer = window.setInterval(() => {
    const t = performance.now() - t0;
    if ((t >= MIN && loaded && fonts) || t >= MAX) {
      window.clearInterval(timer);
      lift();
    }
  }, 120);

  const lift = () => {
    window.setTimeout(() => {
      pre.classList.add('out');
      root.classList.add('preloader-out');
      root.classList.remove('preloading');
      window.setTimeout(done, 700);
      window.setTimeout(() => {
        root.classList.remove('preloader-out');
        pre.remove();
      }, 2200);
    }, 250);
  };
}

/* ---------- Go ---------- */
setupSplits();
setupTone();
setupNav();
setupHeader();
setupToTop();
initTreatments();
initQuiz();
initReviews();
initRequest();
initVisit();
initNotes();
initResults();
initCursor();
initPanel();
void flags;

runPreloader(() => {
  setupReveals();
});
