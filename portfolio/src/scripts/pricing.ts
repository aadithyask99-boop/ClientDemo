import { gsap } from 'gsap';
import { q, qa, reduced, fine, lockScroll } from './util';
import { initPixel } from './pixel';

/* The pricing sheet. Loaded the first time "Pricing" is pressed (menu or footer).
   - Two little clips from the Work section play inside it.
   - It rises over the bottom 80% of the screen; the page behind is dimmed and the top fifth stays showing. Escape, the Close button or a press on the dimmed
     part rolls it back down. The page does not scroll while it is open; the sheet scrolls inside.
   - The clock in the sheet is the header's clock again: drag the hands, and sound can be turned on and off. */
const root = q('[data-pricing]')!;
const sheet = q('.pr__sheet', root)!;
const veil = q('.pr__veil', root)!;
const html = document.documentElement;
let opener: HTMLElement | null = null;

/* the two little clips are borrowed from the Work section (same pictures, same files, nothing downloaded twice); they play only while the sheet is open */
const clips = qa('[data-pricing-clip]', root).map((slot) => {
  const work = qa('[data-wi]')[Number(slot.dataset.pricingClip)];
  const poster = work && q<HTMLImageElement>('.wi__poster', work);
  const src = work && q<HTMLVideoElement>('video', work);
  if (!poster || !src) return null;
  const img = document.createElement('img');
  img.alt = '';
  img.src = poster.getAttribute('src') || poster.dataset.src || '';
  const v = document.createElement('video');
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'none';
  v.dataset.src = (!fine && src.dataset.videoM) || src.dataset.video || '';
  slot.append(img, v);
  return v;
}).filter((v): v is HTMLVideoElement => !!v);
/* the clock: the same working clock as the header's panel (drag the hands, sound on or off), mounted the first time the sheet opens */
const clockEl = q('[data-pricing-clock]', root);
let clock: { start(): void; stop(): void } | null = null;
const runClock = (on: boolean) => {
  if (!clockEl) return;
  if (!clock) {
    if (!on) return;
    void import('./clock-panel').then((m) => { clock = m.mountClock(clockEl); if (!root.hidden) clock.start(); });
    return;
  }
  if (on) clock.start(); else clock.stop();
};

/* the little icon beside the headline: a page being designed, the home page, the tick of approval; it changes shape while the sheet is open */
const iconEl = q('.pr__icon', root);
const icon = iconEl ? initPixel(iconEl, ['window', 'house', 'check']) : null;

/* the rolling line under the description: what each of the five pages does */
const rollWords = qa('.pr__roll-w', root);
let rollAt = 0;
let rollTimer = 0;
if (rollWords.length > 1 && !reduced) gsap.set(rollWords.slice(1), { yPercent: 110 });
const roll = () => {
  const out = rollWords[rollAt];
  rollAt = (rollAt + 1) % rollWords.length;
  const next = rollWords[rollAt];
  gsap.fromTo(next, { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 0.55, ease: 'power3.out', overwrite: true });
  gsap.to(out, { yPercent: -110, duration: 0.55, ease: 'power3.out', overwrite: true, onComplete: () => { gsap.set(out, { opacity: 0 }); } });
};
const runDecor = (on: boolean) => {
  window.clearInterval(rollTimer);
  icon?.stop();
  if (on && !reduced) {
    icon?.start(2800);
    if (rollWords.length > 1) rollTimer = window.setInterval(roll, 2300);
  }
};

const playClips = (on: boolean) => clips.forEach((v) => {
  if (!on || reduced) { v.pause(); return; }
  if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
  void v.play().catch(() => {});
});

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { close(); return; }
  if (e.key !== 'Tab') return;
  const f = qa<HTMLElement>('button, a[href]', sheet).filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function open(from?: HTMLElement | null) {
  if (!root.hidden) return;
  opener = from ?? (document.activeElement as HTMLElement | null);
  root.hidden = false;
  html.classList.add('pr-open');
  lockScroll(true);
  sheet.scrollTop = 0;
  const parts = qa('[data-pr-in]', sheet);
  if (reduced) { gsap.set([veil, sheet, ...parts], { clearProps: 'all' }); }
  else {
    gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.5, overwrite: true });
    gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.85, ease: 'power4.out', overwrite: true });
    gsap.fromTo(parts, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.09, delay: 0.3, overwrite: true });
  }
  document.addEventListener('keydown', onKey);
  playClips(true);
  runClock(true);
  runDecor(true);
  sheet.focus({ preventScroll: true });
}

export function close(after?: () => void) {
  if (root.hidden) return;
  document.removeEventListener('keydown', onKey);
  lockScroll(false);
  html.classList.remove('pr-open');
  const done = () => { root.hidden = true; playClips(false); runClock(false); runDecor(false); after?.(); };
  if (reduced) done();
  else {
    gsap.to(sheet, { yPercent: 100, duration: 0.55, ease: 'power3.in', overwrite: true, onComplete: done });
    gsap.to(veil, { opacity: 0, duration: 0.5, overwrite: true });
  }
  if (!after) opener?.focus({ preventScroll: true });
}

qa('[data-pricing-close]', root).forEach((el) => el.addEventListener('click', () => close()));
