import { gsap } from 'gsap';
import { q, qa, reduced, fine, lockScroll, markFound } from './util';

/* The pricing sheet. Loaded the first time "Pricing" is pressed (menu or footer).
   - Two little clips from the Work section play inside it.
   - It rises over the bottom 80% of the screen; the page behind is dimmed and the top fifth stays showing. Escape, the Close button or a press on the dimmed
     part rolls it back down. The page does not scroll while it is open; the sheet scrolls inside.
   - Egg: press the big price and a stamp slams down on it, "£0 today, pay when you love it". Press again and it lifts. */
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
/* the clock: real time in my time zone, ticking only while the sheet is open */
const tz = q('[data-clock]')?.dataset.tz;
let fmt: Intl.DateTimeFormat;
try { fmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', timeZone: tz }); }
catch { fmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }); }
const hands = { h: q('[data-dial="h"]', root), m: q('[data-dial="m"]', root), s: q('[data-dial="s"]', root) };
const digital = q('[data-pricing-digital]', root);
let clock = 0;
const tickClock = () => {
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, +x.value]));
  const h = p.hour % 24;
  hands.h?.setAttribute('transform', `rotate(${(h % 12) * 30 + p.minute * 0.5})`);
  hands.m?.setAttribute('transform', `rotate(${p.minute * 6 + p.second * 0.1})`);
  hands.s?.setAttribute('transform', `rotate(${p.second * 6})`);
  if (digital) digital.textContent = `${String(h).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
};
const runClock = (on: boolean) => { window.clearInterval(clock); if (on) { tickClock(); clock = window.setInterval(tickClock, 1000); } };
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
  sheet.focus({ preventScroll: true });
}

export function close(after?: () => void) {
  if (root.hidden) return;
  document.removeEventListener('keydown', onKey);
  lockScroll(false);
  html.classList.remove('pr-open');
  const done = () => { root.hidden = true; playClips(false); runClock(false); after?.(); };
  if (reduced) done();
  else {
    gsap.to(sheet, { yPercent: 100, duration: 0.55, ease: 'power3.in', overwrite: true, onComplete: done });
    gsap.to(veil, { opacity: 0, duration: 0.5, overwrite: true });
  }
  if (!after) opener?.focus({ preventScroll: true });
}

qa('[data-pricing-close]', root).forEach((el) => el.addEventListener('click', () => close()));

// "Start with my homepage": roll the sheet away and take them to the contact section
q('[data-pricing-go]', root)?.addEventListener('click', () => {
  close(() => {
    const c = q('#connect');
    if (c) window.dispatchEvent(new CustomEvent('aadi:scrollto', { detail: { y: c.getBoundingClientRect().top + window.scrollY, duration: 1.8 } }));
  });
});

// the egg
const price = q('[data-pricing-price]', root);
const stamp = q('.pr__stamp', root);
if (price && stamp) {
  let down = false;
  price.addEventListener('click', () => {
    down = !down;
    price.classList.toggle('is-stamped', down);
    price.setAttribute('aria-pressed', String(down));
    if (!down) { gsap.to(stamp, { opacity: 0, scale: 1.4, duration: 0.25, overwrite: true }); return; }
    markFound('stamp');
    if (reduced) { gsap.set(stamp, { opacity: 1, scale: 1, rotation: -9 }); return; }
    gsap.fromTo(stamp, { opacity: 0, scale: 2.6, rotation: -22 }, { opacity: 1, scale: 1, rotation: -9, duration: 0.22, ease: 'power4.in', overwrite: true });
    // the thud: the whole card jolts as it lands
    gsap.fromTo(q('.pr__card', root), { y: 0 }, { y: 7, duration: 0.07, delay: 0.22, yoyo: true, repeat: 3, ease: 'power1.inOut', clearProps: 'transform' });
  });
}
