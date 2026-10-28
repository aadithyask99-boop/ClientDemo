import { gsap } from 'gsap';
import { q, qa, clamp, reduced, fine } from './util';
import type { Pixel } from './pixel';

const root = document.documentElement;

/* ---------------------------------------------------------------------------------------------
   The headline. Words appear one at a time and the line re-centres around the ones that are there,
   like the reference. Only transforms move: every word stays in its final place in the layout, and a word
   that is not shown yet is simply offset so the visible ones stay centred. That keeps Cumulative Layout Shift at zero.

   Story: "Hi, I'm Aadi and I make [cool] websites." > [cool] fades out, [SEO-friendly] fades in > [cool,] comes back beside it.
--------------------------------------------------------------------------------------------- */
export function initHero() {
  const title = q('[data-hero-title]');
  if (!title) return { play() {} };
  const words = qa('[data-wd]', title);
  const cool = words.find((w) => w.dataset.wd === 'cool')!;
  const seo = words.find((w) => w.dataset.wd === 'seo')!;
  const comma = q('[data-comma]', cool)!;
  const wordsToBuild = words.filter((w) => w !== seo);
  let visible = new Set<HTMLElement>(words);
  let tl: gsap.core.Timeline | null = null;

  /* Centre the visible words of every row (rows come from the real, wrapped layout, so phones work too) */
  function layout(show: Set<HTMLElement>, dur: number, ease = 'power3.out', entering: HTMLElement[] = []) {
    const gap = parseFloat(getComputedStyle(title!).columnGap) || 0;
    const width = title!.clientWidth;
    const rows = new Map<number, HTMLElement[]>();
    words.forEach((w) => {
      const k = Math.round(w.offsetTop / 4);
      if (!rows.has(k)) rows.set(k, []);
      rows.get(k)!.push(w);
    });
    rows.forEach((row) => {
      const vis = row.filter((w) => show.has(w));
      const total = vis.reduce((sum, w) => sum + w.offsetWidth, 0) + gap * Math.max(0, vis.length - 1);
      let left = (width - total) / 2;
      vis.forEach((w) => {
        const x = left - w.offsetLeft;
        left += w.offsetWidth + gap;
        if (dur === 0 || entering.includes(w)) gsap.set(w, { x });
        else gsap.to(w, { x, duration: dur, ease, overwrite: 'auto' });
      });
    });
  }

  /** speed > 1 plays the sequence faster (used on touch devices, where the first paint matters most) */
  function play(speed = 1) {
    if (reduced || !root.classList.contains('js')) return;
    tl?.kill();
    gsap.set(words, { opacity: 0, scale: 0.35, x: 0, y: 0, filter: 'blur(0px)' });
    gsap.set(comma, { opacity: 0 });
    visible = new Set();

    const step = 0.085;
    tl = gsap.timeline();
    tl.timeScale(speed);
    // 1. the sentence builds: "Hi, I'm Aadi and I make cool websites."
    wordsToBuild.forEach((w, i) => {
      const t = i * step;
      tl!.call(() => { visible.add(w); layout(visible, 0.55, 'power3.out', [w]); }, [], t);
      tl!.to(w, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, t);
    });

    // 2. "cool" gives way to "SEO-friendly"
    let t = wordsToBuild.length * step + 0.6;
    tl.call(() => { visible.delete(cool); visible.add(seo); layout(visible, 0.8, 'power3.inOut', [seo]); }, [], t);
    tl.to(cool, { opacity: 0, y: '-0.3em', scale: 0.92, filter: 'blur(8px)', duration: 0.4, ease: 'power2.in' }, t);
    tl.fromTo(seo, { opacity: 0, y: '0.3em', scale: 0.92, filter: 'blur(8px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, t + 0.12);

    // 3. and then both live together: "cool, SEO-friendly websites."
    t += 1.9;
    tl.call(() => { visible.add(cool); layout(visible, 0.9, 'power3.inOut', [cool]); }, [], t);
    tl.fromTo(cool, { opacity: 0, y: '0.3em', scale: 0.92, filter: 'blur(8px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, t + 0.4);
    tl.to(comma, { opacity: 1, duration: 0.5 }, t + 0.9);
    tl.set(words, { filter: 'none' });
  }

  // Keep the centring right if the window changes size
  let rz = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(rz);
    rz = window.setTimeout(() => { if (!tl || !tl.isActive()) layout(visible, 0); }, 120);
  });

  // Click the headline to watch it build again
  title.addEventListener('click', () => play());

  return { play };
}

/* ---------------------------------------------------------------------------------------------
   The name line. Hover it: a face pops up and follows the pointer, the pixel icon bursts, and the
   letters under the cursor come alive as it passes. To use a real portrait, put an <img> inside [data-mm-av].
--------------------------------------------------------------------------------------------- */
export function initCredits(pixel: Pixel | null) {
  const mm = q('[data-mm]');
  const av = q('[data-mm-av]');
  const text = q('[data-mm-text]');
  if (!mm || !av || !text || !fine || reduced) return;

  const str = text.textContent ?? '';
  text.setAttribute('aria-label', str);
  text.textContent = '';
  const chars = [...str].map((c) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = c;
    text.appendChild(s);
    return s;
  });

  const ax = gsap.quickTo(av, 'x', { duration: 0.35, ease: 'power3' });
  const ay = gsap.quickTo(av, 'y', { duration: 0.35, ease: 'power3' });
  let last = 0;
  let raf = 0;
  let px = 0;
  let py = 0;

  function paint() {
    raf = 0;
    const rects = chars.map((c) => c.getBoundingClientRect());
    rects.forEach((r, i) => {
      const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      const p = clamp(1 - d / 70);
      chars[i].style.setProperty('--p', (p * p).toFixed(3));
    });
  }

  mm.addEventListener('pointerenter', (e) => {
    const r = mm.getBoundingClientRect();
    gsap.set(av, { x: e.clientX - r.left, y: e.clientY - r.top });
    gsap.fromTo(av, { scale: 0, rotate: -14, opacity: 1 }, { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.6)', overwrite: true });
    const now = performance.now();
    if (now - last > 1500) { pixel?.burst(); last = now; }
  });
  mm.addEventListener('pointermove', (e) => {
    const r = mm.getBoundingClientRect();
    ax(e.clientX - r.left);
    ay(e.clientY - r.top);
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  });
  mm.addEventListener('pointerleave', () => {
    gsap.to(av, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in', overwrite: true });
    chars.forEach((c) => c.style.setProperty('--p', '0'));
  });
}

/* With a photo in public/portrait.jpg, the little face that follows the cursor is that photo reduced to a 22 x 22 grid of pixels. */
export function initFace() {
  const cv = q<HTMLCanvasElement>('[data-face-src]');
  if (!cv) return;
  const img = new Image();
  img.src = cv.dataset.faceSrc ?? '';
  img.decode().then(() => {
    const n = 22;
    const off = document.createElement('canvas');
    off.width = n;
    off.height = n;
    // a square from the upper middle of the photo, where the face usually is
    const side = Math.min(img.naturalWidth, img.naturalHeight * 0.82);
    off.getContext('2d')!.drawImage(img, (img.naturalWidth - side) / 2, img.naturalHeight * 0.04, side, side, 0, 0, n, n);
    const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    c.drawImage(off, 0, 0, n, n, 0, 0, cv.width, cv.height);
  }).catch(() => undefined);
}
