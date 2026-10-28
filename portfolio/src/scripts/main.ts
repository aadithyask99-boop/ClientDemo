import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa, reduced, fine } from './util';
import { initPixel } from './pixel';
import { initScroll } from './scroll';
import { initHero, initCredits, initFace } from './hero';
import { initCursor } from './cursor';
import { initRing } from './ring';
import { initEggs } from './eggs';
import { initChem } from './chem';
import { initDeck } from './deck';
import { initPortrait } from './portrait';
import { initWork } from './work';
import { initFinale } from './finale';

(window as unknown as { __aadi: boolean }).__aadi = true;
const root = document.documentElement;
const js = root.classList.contains('js');

/* ---------- Live clock in the header ---------- */
function initClock() {
  const el = q('[data-clock]');
  if (!el) return;
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: el.dataset.tz });
  } catch {
    fmt = new Intl.DateTimeFormat('en-GB', opts); // a mistyped timezone in .env falls back to the visitor's own
  }
  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  window.setInterval(tick, 5000);
}

/* ---------- Header: folds its location label once the page moves; the clock opens the local-time panel (loaded on first use) ---------- */
function initHeader() {
  const hdr = q('[data-header]');
  const fold = () => hdr?.classList.toggle('is-scrolled', window.scrollY > 4);
  fold();
  window.addEventListener('scroll', fold, { passive: true });
  const btn = q('[data-open-clock]');
  btn?.addEventListener('click', () => { void import('./clock-panel').then((m) => m.open(btn)); });
}

/* A line of small text rolls up and out, and its replacement rolls in from below */
function roll(el: HTMLElement, text: string, after?: () => void, wait = 0) {
  if (reduced) { el.textContent = text; if (after) window.setTimeout(after, wait); return; }
  let inner = q('.roll', el);
  if (!inner) {
    inner = document.createElement('span');
    inner.className = 'roll';
    inner.textContent = el.textContent;
    el.textContent = '';
    el.append(inner);
  }
  const t = inner;
  gsap.to(t, { yPercent: -110, duration: 0.25, ease: 'power2.in', overwrite: true, onComplete: () => {
    t.textContent = text;
    gsap.fromTo(t, { yPercent: 110 }, { yPercent: 0, duration: 0.35, ease: 'power3.out', onComplete: () => { if (after) window.setTimeout(after, wait); } });
  } });
}

/* ---------- Click to copy ---------- */
function initCopy() {
  qa<HTMLButtonElement>('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const value = b.dataset.copy ?? '';
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const hint = q('[data-copy-hint]', b);
      if (hint) roll(hint, 'Copied', () => roll(hint, 'Click to copy'), 1800);
    });
  });
}

/* ---------- Go ---------- */
const [prePixelEl, heroPixelEl] = [q('.pre__pixel'), q('.hero__pixel')];
const prePixel = prePixelEl ? initPixel(prePixelEl) : null;
const heroPixel = heroPixelEl ? initPixel(heroPixelEl) : null;

/* Only what the first screen needs is set up straight away. Everything below the fold waits until the headline has painted, so that none of it
   competes with the page's largest paint (the longest word of the headline) on a slow phone. */
initScroll();
initCursor();
initClock();
initHeader();
initCopy();
const hero = initHero(heroPixel);
initCredits(heroPixel);

let belowFold = false;
function setUpBelowFold() {
  if (belowFold) return;
  belowFold = true;
  initChem(); // the pinned scene; created before the others so its scroll distance is counted
  initRing();
  initDeck();
  void initPortrait();
  initWork(hero);
  initEggs();
  initFace();
  ScrollTrigger.refresh();
  // the closing sections are far down the page: set them up well after the headline has painted
  window.setTimeout(() => { initFinale(); ScrollTrigger.refresh(); }, 3200);
}
// ...at the latest 3 seconds after load, in case the intro never runs; sooner if the person starts scrolling
window.setTimeout(setUpBelowFold, 3000);
window.addEventListener('scroll', setUpBelowFold, { once: true, passive: true });

async function intro() {
  const pre = q('[data-pre]');
  if (!js || reduced || !pre) {
    pre?.remove();
    setUpBelowFold();
    return;
  }
  prePixel?.start(520);
  const fonts = Promise.race([document.fonts.ready, new Promise((r) => window.setTimeout(r, 2500))]);
  // a short minimum so the loader reads as a moment, not a flash. Kept brief: the headline is the page's largest paint.
  await Promise.all([fonts, new Promise((r) => window.setTimeout(r, fine ? 450 : 150))]);
  prePixel?.stop();
  gsap.to(pre, { yPercent: -100, duration: 0.8, ease: 'power4.inOut', onComplete: () => pre.remove() });
  gsap.delayedCall(fine ? 0.3 : 0.12, () => { hero.play(fine ? 1 : 1.7); heroPixel?.start(); });
  // the key word lands about 1.5s into the sequence; set the rest up just after it
  gsap.delayedCall(fine ? 2.1 : 1.4, setUpBelowFold);
}
void intro();
