import { gsap } from 'gsap';
import { q, qa, clamp, reduced, fine, lockScroll } from './util';
import type { Pixel } from './pixel';

const root = document.documentElement;

/* ---------------------------------------------------------------------------------------------
   The headline. Words appear one at a time and the line re-centres around the ones that are there,
   like the reference. Only transforms move: every word stays in its final place in the layout, and a word
   that is not shown yet is simply offset so the visible ones stay centred. That keeps Cumulative Layout Shift at zero.

   Story: "Hi, I'm Aadi and I make [cool] websites." > [cool] fades out, [SEO-friendly] fades in > [cool,] comes back beside it.
--------------------------------------------------------------------------------------------- */
export function initHero(pixel: Pixel | null = null) {
  const title = q('[data-hero-title]');
  if (!title) return { play() {}, show() {}, hide() {} };
  const words = qa('[data-wd]', title);
  const cool = words.find((w) => w.dataset.wd === 'cool')!;
  const seo = words.find((w) => w.dataset.wd === 'seo')!;
  const comma = q('[data-comma]', cool)!;
  const rot = q('[data-rot]', cool)!;
  const wordsToBuild = words.filter((w) => w !== cool); // the sentence is built without "cool"; it joins in afterwards
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

  /* Once the sentence is built, "cool" keeps changing: it rolls out, the next word rolls in, and the line re-centres around the new width. Every word is
     moved by transform only. The width change is compensated in the same frame (before it paints), so nothing visibly shifts and layout shift stays 0.
     A word that would make the line wrap differently is skipped. Phones get the shorter words. */
  const list = window.matchMedia('(max-width: 699px)').matches
    ? ['cool', 'sexy', 'slick', 'bold', 'epic']
    : ['cool', 'amazing', 'sexy', 'stunning', 'slick', 'bold', 'brilliant'];
  let ri = 0;
  let loop = 0;
  const rowCount = () => new Set(words.map((w) => Math.round(w.offsetTop / 4))).size;
  function swapTo(text: string, dur = 0.7) {
    const before = new Map(words.map((w) => [w, w.getBoundingClientRect().left]));
    const prev = rot.textContent ?? '';
    const rows = rowCount();
    rot.textContent = text;
    if (rowCount() !== rows) { rot.textContent = prev; return false; }
    words.forEach((w) => {
      const d = before.get(w)! - w.getBoundingClientRect().left;
      if (d) gsap.set(w, { x: (gsap.getProperty(w, 'x') as number) + d });
    });
    layout(visible, dur, 'power3.inOut');
    return true;
  }
  function tick() {
    const r = title!.getBoundingClientRect();
    if (document.hidden || !visible.has(cool) || tl?.isActive() || r.bottom < 0 || r.top > window.innerHeight) return;
    gsap.to(rot, {
      opacity: 0, y: '-0.25em', filter: 'blur(6px)', duration: 0.3, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        if (swapTo(list[(ri + 1) % list.length])) ri = (ri + 1) % list.length;
        gsap.fromTo(rot, { opacity: 0, y: '0.25em', filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', onComplete: () => { gsap.set(rot, { clearProps: 'filter,transform' }); } });
      },
    });
  }
  const startLoop = () => { window.clearInterval(loop); loop = window.setInterval(tick, 2600); };
  const stopLoop = () => { window.clearInterval(loop); loop = 0; };
  const resetWord = () => { gsap.killTweensOf(rot); gsap.set(rot, { clearProps: 'all' }); rot.textContent = list[0]; ri = 0; };

  /* Hold Shift, anywhere on the page (scripts/eggs.ts sends aadi:spin): the word spins through many more adjectives, fast, and settles back
     on "cool" when Shift is let go. */
  const SPIN = ['amazing', 'sexy', 'stunning', 'slick', 'bold', 'brilliant', 'epic', 'dreamy', 'fierce', 'gorgeous', 'fresh', 'clean', 'smooth', 'sharp', 'punchy', 'lush', 'electric', 'unreal', 'fabulous', 'mega', 'flawless', 'tasty'];
  let spin = 0;
  window.addEventListener('aadi:spin', (e) => {
    const on = (e as CustomEvent<boolean>).detail;
    const r = title!.getBoundingClientRect();
    if (on && !spin && visible.has(cool) && !reduced && r.bottom > 0 && r.top < window.innerHeight) { // only while the headline is on screen
      stopLoop();
      gsap.killTweensOf(rot);
      gsap.set(rot, { clearProps: 'all' });
      let k = Math.floor(Math.random() * SPIN.length);
      spin = window.setInterval(() => { swapTo(SPIN[k++ % SPIN.length], 0); }, 170); // no easing while spinning: words never slide across each other
    } else if (!on && spin) {
      window.clearInterval(spin);
      spin = 0;
      swapTo('cool', 0.5);
      ri = 0;
      startLoop();
    }
  });

  const rest = () => [q('.hero__mid'), q('.hero__foot')].filter(Boolean) as HTMLElement[];

  /* Total width of the widest row when `show` is visible: how big the headline can be made in the loader without leaving the screen */
  function widestRow(show: Set<HTMLElement>) {
    const gap = parseFloat(getComputedStyle(title!).columnGap) || 0;
    const rows = new Map<number, number>();
    words.filter((w) => show.has(w)).forEach((w) => { const k = Math.round(w.offsetTop / 4); rows.set(k, (rows.get(k) ?? -gap) + w.offsetWidth + gap); });
    return Math.max(...rows.values(), 1);
  }

  /** speed > 1 plays the sequence faster (used on touch devices, where the first paint matters most).
      With `intro`, this is the page's loader: the headline is built big, in the middle of the screen, over the empty page; it holds a moment, then zooms
      and settles into its place in the hero (the rest of the hero fades in as it lands) and "cool" joins the sentence. `onLanded` is called as it settles. */
  function play(speed = 1, intro = false, onLanded?: () => void) {
    if (reduced || !root.classList.contains('js')) { onLanded?.(); return; }
    tl?.kill();
    stopLoop();
    resetWord();
    gsap.set(words, { opacity: 0, scale: 0.35, x: 0, y: 0, filter: 'blur(0px)' });
    gsap.set(seo, { scale: 0.9 }); // the longest word is the page's largest paint: it must first appear nearly full size, or the paint is measured small
    gsap.set(comma, { opacity: 0 });
    visible = new Set();
    const hdr = q('[data-header]');
    const pre = q('[data-pre]');

    if (intro) {
      root.classList.add('intro'); // lifts the hero over the loader (global.css)
      lockScroll(true); // the page holds still until the headline has landed (no overflow toggle: that re-lays-out the whole page)
      const final = new Set(words.filter((w) => w !== cool));
      const r = title!.getBoundingClientRect();
      const big = Math.max(1, Math.min(1.5, (window.innerWidth - 40) / widestRow(final)));
      gsap.set(title!, { scale: big, y: window.innerHeight / 2 - (r.top + r.height / 2), transformOrigin: '50% 50%' });
      gsap.set(rest(), { opacity: 0 });
      if (hdr) gsap.set(hdr, { opacity: 0 });
      if (pre) {
        gsap.to(pre.firstElementChild, { opacity: 0, duration: 0.3 });
        gsap.delayedCall(0.4, () => pre.remove());
      }
    }

    const step = 0.085;
    tl = gsap.timeline();
    tl.timeScale(speed);
    // 1. the sentence builds: "Hi, I'm Aadi and I make SEO-friendly websites."
    wordsToBuild.forEach((w, i) => {
      const t = i * step;
      tl!.call(() => { visible.add(w); layout(visible, 0.55, 'power3.out', [w]); }, [], t);
      tl!.to(w, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, t);
    });
    let t = wordsToBuild.length * step + 0.35;

    // 2. (loader only) a beat to read it, then it zooms into place and the rest of the hero arrives
    if (intro) {
      t += 0.55;
      tl.to(title!, { scale: 1, y: 0, duration: 1.15, ease: 'expo.inOut' }, t);
      tl.to(rest(), { opacity: 1, duration: 0.7, ease: 'power2.out' }, t + 0.8);
      if (hdr) tl.to(hdr, { opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'opacity' }, t + 0.9);
      tl.call(() => { root.classList.remove('intro'); lockScroll(false); gsap.set(title!, { clearProps: 'transform' }); onLanded?.(); }, [], t + 1.2);
      t += 1.15;
    } else {
      t += 0.35;
      tl.call(() => onLanded?.(), [], t);
    }

    // 3. "cool" joins: "cool, SEO-friendly websites."
    tl.call(() => { visible.add(cool); layout(visible, 0.9, 'power3.inOut', [cool]); }, [], t);
    tl.fromTo(cool, { opacity: 0, y: '0.3em', scale: 0.92, filter: 'blur(8px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, t + 0.4);
    tl.to(comma, { opacity: 1, duration: 0.5 }, t + 0.9);
    tl.set(words, { filter: 'none' });
    tl.call(startLoop, [], t + 2.2);
  }

  /* The work section takes the page over: the headline leaves as the first project becomes active, and builds itself again when you scroll back */
  function hide() {
    if (reduced || !root.classList.contains('js')) return;
    tl?.kill();
    stopLoop();
    gsap.to(words, { opacity: 0, y: -14, duration: 0.25, stagger: 0.015, overwrite: true });
    gsap.to(rest(), { opacity: 0, duration: 0.25, overwrite: true });
  }
  function show() {
    if (reduced || !root.classList.contains('js')) return;
    tl?.kill();
    resetWord();
    visible = new Set(words);
    gsap.set(words, { opacity: 0, scale: 0.35, y: 0, filter: 'none' });
    gsap.set(comma, { opacity: 1 });
    layout(visible, 0);
    gsap.to(words, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)', stagger: 0.04, overwrite: true });
    gsap.to(rest(), { opacity: 1, duration: 0.4, overwrite: true });
    pixel?.burst();
    startLoop();
  }

  // Keep the centring right if the window changes size
  let rz = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(rz);
    rz = window.setTimeout(() => { if (!tl || !tl.isActive()) layout(visible, 0); }, 120);
  });

  // Click the headline to watch it build again
  title.addEventListener('click', () => {
    if (title.dataset.held) { delete title.dataset.held; return; } // a press-and-hold (the word spinner on a phone) is not a click
    play();
  });

  return { play, show, hide };
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

  /* The face is moved by its own small animation loop: it eases toward the pointer every frame and leans with the pointer's sideways speed.
     (The pop-in only animates scale and opacity, so the two never fight.) Runs only while the pointer is over the name. */
  let last = 0;
  let raf = 0;
  let px = 0;
  let py = 0;
  let fx = 0;
  let fy = 0;
  let tilt = 0;
  let hover = false;
  let loop = 0;

  const follow = () => {
    const r = mm.getBoundingClientRect();
    const tx = px - r.left;
    const tr = text.getBoundingClientRect();
    const ty = tr.top + tr.height / 2 - r.top; // only the sideways position follows the pointer: the face rides along the top of the words
    const dx = (tx - fx) * 0.2;
    fx += dx;
    fy += (ty - fy) * 0.2;
    tilt += (clamp(dx * 1.1, -16, 16) - tilt) * 0.2;
    gsap.set(av, { x: fx, y: fy, rotate: tilt });
    loop = hover ? requestAnimationFrame(follow) : 0;
  };

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
    px = e.clientX;
    py = e.clientY;
    const tr = text.getBoundingClientRect();
    fx = px - r.left;
    fy = tr.top + tr.height / 2 - r.top;
    tilt = 0;
    hover = true;
    gsap.set(av, { x: fx, y: fy, rotate: 0 });
    gsap.fromTo(av, { scale: 0, opacity: 1 }, { scale: 1, duration: 0.45, ease: 'back.out(2.6)', overwrite: 'auto' });
    if (!loop) loop = requestAnimationFrame(follow);
    const now = performance.now();
    if (now - last > 1500) { pixel?.burst(); last = now; }
  });
  mm.addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  });
  mm.addEventListener('pointerleave', () => {
    hover = false;
    gsap.to(av, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
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
