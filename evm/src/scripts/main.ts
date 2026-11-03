import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const doc = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
const wide = () => matchMedia('(min-width: 861px)').matches;
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// ---------- Header, menu ----------
const header = $('.header');
const rail = $('.rail');
const themeEls = $$('[data-theme]').filter((e) => e !== header);
const syncTheme = () => {
  const hit = themeEls.find((e) => { const r = e.getBoundingClientRect(); return r.top <= 30 && r.bottom > 30; });
  header.dataset.theme = hit?.dataset.theme ?? 'dark';
  header.classList.toggle('is-scrolled', scrollY > innerHeight * 0.6);
  rail.dataset.theme = header.dataset.theme;
  const max = document.documentElement.scrollHeight - innerHeight;
  rail.style.setProperty('--rp', (max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0).toFixed(4));
};
const menu = $('#menu');
const menuBtn = $<HTMLButtonElement>('.header__menu');
const mLinks = $$<HTMLAnchorElement>('.menu__links a');
let lenis: Lenis | null = null;
const setMenu = (open: boolean) => {
  menu.classList.toggle('is-open', open);
  header.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mLinks.forEach((a) => (a.tabIndex = open ? 0 : -1));
  if (open) lenis?.stop(); else lenis?.start();
  if (!lenis) document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
mLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));

// ---------- Marques roller: logic shared by scroll and pointer ----------
const rItems = $$('.roller__list li');
const rNotes = $$('.roller__note span');
let rActive = 0;
const setMarque = (i: number) => {
  if (i === rActive) return;
  rActive = i;
  rItems.forEach((n, k) => n.classList.toggle('is-active', k === i));
  rNotes.forEach((n, k) => n.classList.toggle('is-active', k === i));
};
rItems.forEach((li, i) => {
  li.addEventListener('pointerenter', () => canHover && setMarque(i));
  li.addEventListener('focus', () => setMarque(i));
  li.addEventListener('click', () => setMarque(i));
});

// ---------- Who leads it: the row nearest the middle is black and its portrait shows; hover or focus picks one ----------
const whoRows = $$('.who__row');
const whoImgs = $$('.who__tile img');
let whoActive = 0;
const setWho = (i: number) => {
  if (i === whoActive) return;
  whoActive = i;
  whoRows.forEach((r, k) => r.classList.toggle('is-active', k === i));
  whoImgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
  if (!reduce) gsap.fromTo(whoImgs[i], { clipPath: 'inset(0 0 0 100%)', xPercent: 18 }, { clipPath: 'inset(0 0 0 0%)', xPercent: 0, duration: 0.9, ease: 'expo.out', overwrite: true });
};
whoRows.forEach((r, i) => {
  r.addEventListener('pointerenter', () => canHover && setWho(i));
  r.addEventListener('focus', () => setWho(i));
  r.addEventListener('click', () => setWho(i));
});

// ---------- The group on the map: the row nearest the middle lights its places on the outline of Kerala ----------
const gRows = $$('.group__row');
const gNodes = $$('.group__node');
let gActive = -1;
const gCar = $('.group__car') as unknown as SVGGElement;
const gPath: number[][] = JSON.parse($('.group__map').dataset.car ?? '[]');
let gCarAt: number[] | null = null;
let gCarAng: number | null = null;
let gActiveFirst = true;
const setGroup = (i: number) => {
  if (i === gActive) return;
  gActive = i;
  const on = (gRows[i].dataset.places ?? '').split(' ');
  gRows.forEach((r, k) => r.classList.toggle('is-active', k === i));
  gNodes.forEach((n) => n.classList.toggle('is-on', on.includes(n.getAttribute('data-place') ?? '')));
  const to = gPath[i];
  if (to) {
    const from = gCarAt;
    const ang = from && (from[0] !== to[0] || from[1] !== to[1]) ? (Math.atan2(to[0] - from[0], -(to[1] - from[1])) * 180) / Math.PI : (gCarAng ?? 180);
    gCarAng = ang; gCarAt = to;
    if (reduce || gActiveFirst) gsap.set(gCar, { x: to[0], y: to[1], rotation: ang, svgOrigin: '0 0' });
    else gsap.to(gCar, { x: to[0], y: to[1], rotation: ang, svgOrigin: '0 0', duration: 1.2, ease: 'expo.inOut', overwrite: true });
    gActiveFirst = false;
  }
};
gRows.forEach((r, i) => {
  r.addEventListener('pointerenter', () => canHover && setGroup(i));
  r.addEventListener('focus', () => setGroup(i));
  r.addEventListener('click', () => setGroup(i));
});
setGroup(0);

// ---------- Frame sequences (the Porsche turning in the studio, the road climbing to Munnar), drawn on a canvas as you scroll ----------
const base = (document.querySelector('img.studio__img') as HTMLImageElement).src.replace(/\/seq\/.*$/, '');
const makeSeq = (sec: HTMLElement, urls: string[], blend: boolean) => {
  const cv = $<HTMLCanvasElement>('canvas', sec);
  const ctx = cv.getContext('2d')!;
  const imgs = urls.map(() => new Image());
  let loaded = false;
  const load = () => { if (loaded) return; loaded = true; imgs.forEach((im, i) => { im.decoding = 'async'; im.src = urls[i]; im.onload = () => render(last); }); };
  let last = 0;
  const size = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr); };
  const draw = (im: HTMLImageElement, a: number) => {
    if (!im.complete || !im.naturalWidth) return;
    const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.globalAlpha = a; ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
  };
  const render = (p: number) => {
    last = p;
    const f = Math.min(1, Math.max(0, p)) * (imgs.length - 1);
    const i = Math.min(imgs.length - 1, Math.floor(f)), t = f - i;
    ctx.globalAlpha = 1; ctx.clearRect(0, 0, cv.width, cv.height);
    draw(imgs[i], 1);
    const k = Math.min(1, Math.max(0, (t - 0.38) / 0.24)); // hold each angle, dissolve briefly between them
    if (blend && k > 0 && imgs[i + 1]) draw(imgs[i + 1], k * k * (3 - 2 * k));
    else if (!blend && t > 0.5 && imgs[i + 1]) draw(imgs[i + 1], 1);
  };
  size();
  return { load, render, size };
};

// ---------- Hero film ----------
const film = $('.hero__film');
const video = $<HTMLVideoElement>('.hero__video');
const playFilm = () => {
  video.play().catch(() => {});
  video.addEventListener('timeupdate', () => { if (video.duration - video.currentTime < 0.7) film.dataset.fade = '1'; });
  video.addEventListener('ended', () => { video.currentTime = 0; delete film.dataset.fade; video.play().catch(() => {}); });
};

// ---------- Typed text (intro, headline, links) ----------
const prep = (el: HTMLElement) => {
  const full = el.textContent ?? '';
  el.textContent = '';
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = full;
  const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
  el.append(sr, vis);
  return { full, vis };
};
const typer = (el: HTMLElement) => {
  const { full, vis } = prep(el);
  const o = { n: 0 };
  return (dur: number) => gsap.to(o, { n: full.length, duration: dur, ease: 'none', onUpdate: () => { vis.textContent = full.slice(0, Math.round(o.n)); } });
};

// ---------- Split text into lines or words ----------
const originals = new Map<HTMLElement, string>();
const splitWords = (el: HTMLElement) => {
  const text = originals.get(el) ?? el.textContent ?? '';
  originals.set(el, text);
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const words = text.split(/\s+/).map((t, i, all) => {
    const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true'); w.textContent = t;
    el.append(w);
    if (i < all.length - 1) el.append(' ');
    return w;
  });
  return words;
};
const splitLines = (el: HTMLElement) => {
  const words = splitWords(el);
  const lines: HTMLElement[][] = [];
  let top = -1;
  words.forEach((w) => {
    const t = Math.round(w.offsetTop);
    if (t !== top) { lines.push([]); top = t; }
    lines[lines.length - 1].push(w);
  });
  el.textContent = '';
  return lines.map((ws) => {
    const ln = document.createElement('span'); ln.className = 'ln'; ln.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span'); inner.className = 'ln__in';
    ws.forEach((w, i) => { inner.append(w); if (i < ws.length - 1) inner.append(' '); });
    ln.append(inner); el.append(ln);
    return inner;
  });
};
const splitChars = (el: HTMLElement) => {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  return [...text].map((ch) => {
    const c = document.createElement('span'); c.className = 'w'; c.setAttribute('aria-hidden', 'true'); c.textContent = ch === ' ' ? '\u00a0' : ch;
    el.append(c); return c;
  });
};

// ---------- Reduced motion: static page ----------
if (reduce) {
  doc.classList.add('ready');
  addEventListener('scroll', syncTheme, { passive: true });
  syncTheme();
} else {
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1.05 });
  lenis.on('scroll', () => { ScrollTrigger.update(); syncTheme(); });
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  doc.classList.add('lenis');
  lenis.stop();
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const el = id === '#top' ? null : document.querySelector<HTMLElement>(id);
      if (id !== '#top' && !el) return;
      e.preventDefault();
      lenis!.scrollTo(el ?? 0, { duration: 1.4 });
    });
  });

  // ---------- Intro timeline, timed from the reference frames ----------
  const intro = $('.intro');
  const t1 = typer($('.intro__tag--1')), t2 = typer($('.intro__tag--2'));
  const slices = $$('.intro__slice');
  const lines = $$('.hero__title .line').map(typer);
  const sub = typer($('.hero__sub'));
  const cta = typer($('.hero__cta'));
  const tl = gsap.timeline({ delay: 0.3 });
  tl.add(t1(0.55), 0.3);
  tl.fromTo(slices, { yPercent: 100, x: () => gsap.utils.random(-50, 50) }, { yPercent: 0, x: 0, duration: 0.75, ease: 'power4.out', stagger: 0.07 }, 0.9);
  tl.add(t2(0.7), 1.2);
  tl.to(slices, { yPercent: 118, duration: 0.9, ease: 'expo.inOut' }, 3.2);
  tl.to('.intro__tag', { top: 24, duration: 0.9, ease: 'expo.inOut' }, 3.2);
  tl.to(intro, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.9, ease: 'power2.inOut' }, 3.2);
  tl.add(playFilm, 3.2);
  tl.add(() => { intro.classList.add('is-done'); doc.classList.add('ready'); lenis!.start(); syncTheme(); }, 4.2);
  tl.add(lines[0](0.7), 4.35);
  tl.add(lines[1](0.8), 4.8);
  tl.add(sub(1.1), 4.7);
  tl.add(cta(0.4), 5.8);

  // ---------- Scroll motion ----------
  const build = () => {
    // Statements: lines rise from a mask when they enter, and every word lights up as you read down.
    $$('[data-lines]').forEach((el) => {
      const inner = splitLines(el);
      el.classList.add('is-split');
      gsap.fromTo(inner, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
      gsap.fromTo($$('.w', el), { opacity: 0.2 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 40%', scrub: true } });
    });
    // Labels and links fade up.
    $$('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    // Quote: every word lights up as you scroll through it.
    $$('[data-words]').forEach((el) => {
      const words = splitWords(el);
      el.classList.add('is-split');
      gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
    // Photographs: an inset opens and the picture settles as you pass.
    $$('.photo').forEach((sec) => {
      const img = sec.querySelector('img')!;
      gsap.fromTo(sec, { clipPath: 'inset(10% 7% 10% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top 95%', end: 'top 25%', scrub: true } });
      gsap.fromTo(img, { scale: 1.16, yPercent: -5 }, { scale: 1, yPercent: 5, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Who leads it: the row crossing the middle of the screen becomes the active one (desktop widths).
    whoRows.forEach((row, i) => {
      ScrollTrigger.create({ trigger: row, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive && wide()) setWho(i); } });
    });
    // The group: the outline of Kerala draws as the section arrives; the row crossing the middle lights its places.
    gsap.fromTo('.group__outline', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.group', start: 'top 85%', end: 'top 10%', scrub: true } });
    gRows.forEach((row, i) => {
      ScrollTrigger.create({ trigger: row, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive && wide()) setGroup(i); } });
    });
    // Marques: the row crossing the middle of the screen becomes the active one.
    rItems.forEach((li, i) => {
      ScrollTrigger.create({ trigger: li, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) setMarque(i); } });
    });
    // Numbers count up.
    $$('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const o = { n: 0 };
      el.textContent = '0';
      gsap.to(o, { n: to, duration: 1.8, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.n).toLocaleString('en-US'); }, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    // The studio: the Porsche turns as you scroll through the pinned scene.
    const studio = $('.studio');
    const turn = makeSeq(studio, Array.from({ length: Number(studio.dataset.frames) }, (_, i) => `${base}/seq/turn/${i}.webp`), true);
    turn.load();
    ScrollTrigger.create({ trigger: studio, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { if (wide()) turn.render(self.progress); } });
    ScrollTrigger.create({ trigger: studio, start: 'top bottom', end: 'bottom top', onRefresh: () => { turn.size(); turn.render(0); } });
    // The climb: the road to Munnar plays as you scroll; the height counts up with it.
    const climb = $('.climb');
    const cseq = makeSeq(climb, Array.from({ length: Number(climb.dataset.frames) }, (_, i) => `${base}/seq/climb/${String(i).padStart(3, '0')}.webp`), false);
    const alt = $('[data-alt]');
    const top = Number(climb.dataset.top);
    ScrollTrigger.create({ trigger: climb, start: 'top bottom+=800', once: true, onEnter: () => cseq.load() });
    ScrollTrigger.create({ trigger: climb, start: 'top bottom', end: 'bottom top', onRefresh: () => { cseq.size(); cseq.render(0); } });
    ScrollTrigger.create({ trigger: climb, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { if (!wide()) return; cseq.render(self.progress); alt.textContent = Math.round(self.progress * top).toLocaleString('en-US'); } });
    gsap.fromTo('.climb__year, .climb__text', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: climb, start: 'top 60%', end: 'top 10%', scrub: true } });
    // The night stop: the sign slides past.
    gsap.fromTo('.night__sign', { xPercent: 18 }, { xPercent: -18, ease: 'none', scrollTrigger: { trigger: '.night', start: 'top bottom', end: 'bottom top', scrub: true } });
    // Kilometre stones: pinned; the row of stones passes as the road moves under them.
    if (wide()) {
      const kmEl = $('.km'), track = $('.km__track'), road = $('.km__road');
      const travel = () => Math.max(0, track.scrollWidth - innerWidth + 2 * parseFloat(getComputedStyle(kmEl).paddingLeft || '0') + 80);
      ScrollTrigger.create({ trigger: kmEl, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true, onUpdate: (self) => {
        const x = -self.progress * travel();
        track.style.transform = `translate3d(${x}px,0,0)`;
        road.style.backgroundPositionX = `${x}px`;
      } });
    }
    // Hero: the headline, line and link lift away and the film drifts as you leave it.
    gsap.to('.hero__title, .hero__sub, .hero__cta', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });
    gsap.to('.hero__film', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    // Marques and next links: each name builds letter by letter as it rises into view.
    [...$$('.roller__list li span'), ...$$('.footer__go a span'), ...$$('.who__name'), ...$$('.group__name')].forEach((el) => {
      const chars = splitChars(el);
      gsap.fromTo(chars, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 62%', scrub: true } });
    });
    // Rows, figures and footer details drift into place with the scroll.
    $$('.who__row, .group__row').forEach((el) => {
      gsap.fromTo(el, { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 72%', scrub: true } });
    });
    gsap.fromTo('.footer__links a, .footer__top .label, .footer__biz > *, .footer__legal', { yPercent: 60, opacity: 0.1 }, { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'top 25%', scrub: true } });
    // Footer wordmark rises into its frame.
    gsap.fromTo('.footer__mark', { yPercent: 105 }, { yPercent: 7, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.footer__markwrap', start: 'top 92%', once: true } });
  };

  const start = () => { build(); ScrollTrigger.refresh(); };
  (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(start) ?? start();
  let lastW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 40) location.reload(); });
}
syncTheme();
