import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const phone = matchMedia('(max-width: 820px)').matches;

if (reduce) {
  // Static, readable page: no pins, no smooth scroll, no WebGL.
  document.documentElement.classList.remove('js');
} else {
  init();
}

function init() {
  /* Smooth scroll (desktop pointers only) */
  let lenis: Lenis | null = null;
  if (fine) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t as number | HTMLElement, { duration: 1.6 });
      else if (t === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      else (t as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }),
  );

  /* Nav tone: dark or paper under the header */
  $$('[data-tone]').forEach((s) => {
    if (s === document.body) return;
    ScrollTrigger.create({
      trigger: s,
      start: 'top 60px',
      end: 'bottom 60px',
      onToggle: (self) => {
        if (self.isActive) document.body.dataset.tone = s.dataset.tone!;
      },
    });
  });

  /* The road rail: fill, headlamp and the kilometre readout */
  const fill = $('.rail-fill')!;
  const lamp = $('.rail-lamp')!;
  const kmEl = $('.rail-km')!;
  const placeEl = $('.rail-place')!;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      fill.style.transform = `scaleY(${self.progress})`;
      lamp.style.top = `${self.progress * 100}%`;
    },
  });
  const kmState = { v: 0 };
  const setStop = (km: number, place: string) => {
    placeEl.textContent = place;
    gsap.to(kmState, {
      v: km,
      duration: 1.5,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => (kmEl.textContent = String(Math.round(kmState.v)).padStart(3, '0')),
    });
  };
  $$('[data-km]').forEach((s) =>
    ScrollTrigger.create({
      trigger: s,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => self.isActive && setStop(+s.dataset.km!, s.dataset.place!),
    }),
  );

  /* HERO */
  const hero = $('.hero')!;
  const stage = $('.hero-stage')!;
  const canvas = $<HTMLCanvasElement>('.hero-canvas')!;
  const title = $('.hero-title')!;
  const sub = $('.hero-sub')!;
  const cue = $('.hero-cue')!;
  let hp = 0;
  const spans = $$('.hero-title .line > span');
  const heroChars = spans.flatMap((el) => {
    const t = el.textContent || '';
    el.setAttribute('aria-label', t);
    el.innerHTML = t
      .split(' ')
      .map((w) => `<span class="wd" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`)
      .join(' ');
    return $$('.ch', el);
  });
  gsap.set(spans, { visibility: 'visible' });
  gsap.set(heroChars, { yPercent: 110 });
  gsap.fromTo(sub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, delay: 1.1, ease: 'power3.out' });
  gsap.fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.7 });
  gsap.to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.035, delay: 0.5, ease: 'expo.out' });
  ScrollTrigger.create({
    trigger: $('.hero-track')!,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      hp = self.progress;
      const out = clamp((hp - 0.25) / 0.5);
      title.style.transform = `translate3d(0, ${-out * 14}vh, 0)`;
      title.style.opacity = String(1 - out);
      heroChars.forEach((c, i) => gsap.set(c, { y: -out * (8 + (i % 6) * 16) }));
      sub.style.opacity = String(1 - clamp(hp / 0.25));
      cue.style.opacity = String(1 - clamp(hp / 0.15));
      stage.style.setProperty('--fade', String(clamp((hp - 0.82) / 0.18)));
    },
  });
  const boot = async () => {
    if (!matchMedia('(min-width: 1px)').matches) return;
    if (phone && (navigator.hardwareConcurrency || 4) < 4) return;
    try {
      const { startHero } = await import('./hero');
      const ok = startHero(canvas, { lite: phone, getProgress: () => hp });
      if (ok) {
        canvas.classList.add('on');
        stage.classList.add('gl');
        setTimeout(() => canvas.classList.add('live'), 1600);
      }
    } catch (e) {
      console.warn('hero scene unavailable', e);
    }
  };
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(boot, { timeout: 1200 });
  else setTimeout(boot, 300);

  /* ORIGIN: the photo opens as the words light up */
  const words = $('[data-words]')!;
  const parts = (words.textContent || '').trim().split(/\s+/);
  words.setAttribute('aria-label', parts.join(' '));
  words.innerHTML = parts.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  const wEls = $$('.w', words);
  const oPhoto = $('.origin-photo')!;
  const oImg = $('.origin-photo img')!;
  const from = phone ? { t: 30, r: 0, b: 12, l: 20 } : { t: 14, r: 0, b: 14, l: 58 };
  ScrollTrigger.create({
    trigger: $('.origin-track')!,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      const o = ease(clamp(p / 0.7));
      oPhoto.style.clipPath = `inset(${mix(from.t, 0, o)}% 0% ${mix(from.b, 0, o)}% ${mix(from.l, 0, o)}%)`;
      oImg.style.transform = `scale(${mix(1.12, 1, p)})`;
      const count = clamp((p - 0.08) / 0.7) * (wEls.length + 1);
      wEls.forEach((w, i) => (w.style.opacity = String(0.16 + 0.84 * clamp(count - i))));
    },
  });

  /* MARQUES: mileposts */
  const rows = $$('.mq');
  const signs = $$('.mq-sign img');
  const setRow = (row: HTMLElement) => {
    rows.forEach((r) => r.classList.toggle('on', r === row));
    signs.forEach((s) => s.classList.toggle('on', s.dataset.for === row.dataset.logo));
  };
  setRow(rows[0]);
  rows.forEach((r) => {
    r.addEventListener('pointerenter', () => setRow(r));
    r.addEventListener('focus', () => setRow(r));
    r.tabIndex = 0;
    ScrollTrigger.create({
      trigger: r,
      start: 'top 52%',
      end: 'bottom 52%',
      onToggle: (self) => self.isActive && !fine && setRow(r),
    });
  });
  gsap.from(rows, { y: 70, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.marques-list', start: 'top 80%', once: true } });
  gsap.from(['.marques-head', '.marques-link'], { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.marques-head', start: 'top 88%', once: true } });

  /* MILESTONES: the years roll like an odometer */
  const mTrack = $('.miles-track')!;
  const mLines = $$('.miles-line');
  const mTicks = $$('.miles-tick');
  const mFill = $('.miles-fill')!;
  const cols = $$('.miles-years .dig-col');
  const years = ['1952', ...mLines.map((l) => l.dataset.year!)];
  const n = mLines.length;
  mTrack.style.setProperty('--n', String(n));
  mTicks.forEach((t, i) => {
    t.style.left = `${(i / (n - 1)) * 100}%`;
    if (i === n - 1) t.style.transform = 'translateX(-100%)';
    else if (i > 0) t.style.transform = 'translateX(-50%)';
  });
  const shown = ['0', '0', '0', '0'];
  const rollTo = (year: string, instant = false) => {
    cols.forEach((c, i) => {
      if (shown[i] === year[i] && !instant) return;
      shown[i] = year[i];
      gsap.to(c, { yPercent: -10 * +year[i], duration: instant ? 0 : 1.15 + i * 0.1, ease: 'power3.inOut', overwrite: true });
    });
  };
  rollTo('1952', true);
  let mIdx = -2;
  const ridgeM = $('.miles-ridge')!;
  const roadBase = document.querySelector<SVGPathElement>('.miles-road .base')!;
  const roadProg = document.querySelector<SVGPathElement>('.miles-road .prog')!;
  const roadLen = roadBase.getTotalLength();
  roadProg.style.strokeDasharray = String(roadLen);
  roadProg.style.strokeDashoffset = String(roadLen);
  const nodes = Array.from(document.querySelectorAll<SVGCircleElement>('.miles-road .node'));
  const car = document.querySelector<SVGCircleElement>('.miles-road .car')!;
  const halo = document.querySelector<SVGCircleElement>('.miles-road .halo')!;
  const nodeAt = (i: number) => 0.12 + (i / (n - 1)) * 0.88;
  nodes.forEach((nd, i) => {
    const pt = roadBase.getPointAtLength(roadLen * nodeAt(i));
    nd.setAttribute('cx', String(pt.x));
    nd.setAttribute('cy', String(pt.y));
  });
  const moveCar = (f: number) => {
    const pt = roadBase.getPointAtLength(roadLen * f);
    [car, halo].forEach((c) => {
      c.setAttribute('cx', String(pt.x));
      c.setAttribute('cy', String(pt.y));
    });
    roadProg.style.strokeDashoffset = String(roadLen * (1 - f));
  };
  moveCar(0);
  ScrollTrigger.create({
    trigger: mTrack,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      const idx = p < 0.04 ? -1 : Math.min(n - 1, Math.floor(clamp((p - 0.04) / 0.94) * n));
      if (idx !== mIdx) {
        mIdx = idx;
        rollTo(years[idx + 1]);
        mLines.forEach((l, i) => l.classList.toggle('on', i === idx));
        mTicks.forEach((t, i) => t.classList.toggle('on', i <= idx));
      }
      const q = clamp((p - 0.04) / 0.94);
      mFill.style.transform = `scaleX(${q})`;
      const f = mix(0, nodeAt(n - 1), ease(q) * 0.35 + q * 0.65);
      moveCar(f);
      nodes.forEach((nd, i) => nd.classList.toggle('on', f >= nodeAt(i) - 0.005));
      ridgeM.style.transform = `translate3d(0, ${-p * 8}%, 0)`;
    },
  });

  /* THE GROUP: the climb, one business at a time */
  const gTrack = $('.group-track')!;
  const gStage = $('.group-stage')!;
  const items = $$('.g-item');
  const steps = $$('.g-steps i');
  const gn = items.length;
  gTrack.style.setProperty('--n', String(gn));
  const sun = $('.g-sun')!;
  const gPhoto = $('.g-photo')!;
  const hills = [$('.gh1')!, $('.gh2')!, $('.gh3')!];
  const spansG = items.map((it) => $('.g-name > span', it)!);
  const charsG = spansG.map((sp) => {
    const t = sp.textContent || '';
    sp.setAttribute('aria-label', t);
    sp.innerHTML = t
      .split(' ')
      .map((w) => `<span class="wd" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`)
      .join(' ');
    return $$('.ch', sp);
  });
  gsap.set(charsG.flat(), { yPercent: 110 });
  let gIdx = -1;
  const showItem = (i: number) => {
    if (i === gIdx) return;
    const prev = gIdx;
    gIdx = i;
    items.forEach((it, k) => it.classList.toggle('on', k === i));
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    if (prev >= 0) {
      gsap.to(charsG[prev], { yPercent: i > prev ? -110 : 110, duration: 0.55, stagger: 0.015, ease: 'power3.in', overwrite: true });
      gsap.to($$('.g-place, .g-text', items[prev]), { opacity: 0, duration: 0.3, overwrite: true });
    }
    if (i >= 0) {
      gsap.fromTo(charsG[i], { yPercent: i >= prev ? 110 : -110 }, { yPercent: 0, duration: 1.1, stagger: 0.03, delay: prev >= 0 ? 0.4 : 0, ease: 'expo.out', overwrite: true });
      gsap.fromTo($$('.g-place, .g-text', items[i]), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, delay: prev >= 0 ? 0.55 : 0.2, stagger: 0.1, ease: 'power3.out', overwrite: true });
    }
  };
  ScrollTrigger.create({ trigger: gTrack, start: 'top 75%', onEnter: () => gIdx < 0 && showItem(0) });
  const c0 = [12, 32, 28];
  const c1 = [30, 78, 44];
  ScrollTrigger.create({
    trigger: gTrack,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;
      showItem(Math.min(gn - 1, Math.floor(p * gn * 0.9999)));
      const c = c0.map((v, k) => Math.round(mix(v, c1[k], clamp(p / 0.8)))).join(',');
      gStage.style.background = `rgb(${c})`;
      const sp = clamp(p / 0.85);
      sun.style.top = `${mix(60, 16, ease(sp))}%`;
      sun.style.transform = `scale(${mix(0.8, 1.2, sp)})`;
      hills.forEach((h, k) => (h.style.transform = `translate3d(${-p * (2 + k * 3)}%, ${p * (6 + k * 8)}%, 0)`));
      const pp = ease(clamp((p - 0.76) / 0.22));
      const sr = sun.getBoundingClientRect();
      const st = gStage.getBoundingClientRect();
      const cx = ((sr.left + sr.width / 2 - st.left) / st.width) * 100;
      const cy = ((sr.top + sr.height / 2 - st.top) / st.height) * 100;
      sun.style.opacity = String(1 - pp * 0.9);
      hills.forEach((h) => (h.style.opacity = String(1 - pp * 0.55)));
      gPhoto.style.clipPath = `circle(${pp * 150}% at ${cx}% ${cy}%)`;
    },
  });

  /* PEOPLE */
  const pps = $$('.pp');
  pps.forEach((r) => {
    const on = () => pps.forEach((x) => x.classList.toggle('on', x === r));
    r.addEventListener('pointerenter', on);
    r.addEventListener('focus', on);
    ScrollTrigger.create({ trigger: r, start: 'top 52%', end: 'bottom 52%', onToggle: (s) => s.isActive && !fine && on() });
  });
  gsap.from(pps, { y: 60, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.people-list', start: 'top 82%', once: true } });
  gsap.from(['.people-head', '.people-link'], { y: 24, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.people-head', start: 'top 90%', once: true } });

  /* ODOMETER */
  $$('.od-num').forEach((el) => {
    const full = el.textContent || '';
    const val = el.dataset.value || '';
    el.setAttribute('aria-label', full);
    el.textContent = '';
    const add = (t: string) => {
      if (!t) return;
      const s = document.createElement('span');
      s.className = 'od-fix';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = t.replace(/ /g, ' ');
      el.append(s);
    };
    add(el.dataset.prefix || '');
    const colsHere: { col: HTMLElement; d: number }[] = [];
    [...val].forEach((ch) => {
      if (/\d/.test(ch)) {
        const dig = document.createElement('span');
        dig.className = 'dig';
        dig.setAttribute('aria-hidden', 'true');
        const col = document.createElement('span');
        col.className = 'dig-col';
        col.innerHTML = Array.from({ length: 10 }, (_, i) => `<b>${i}</b>`).join('');
        dig.append(col);
        el.append(dig);
        colsHere.push({ col, d: +ch });
      } else add(ch);
    });
    add(el.dataset.suffix || '');
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        colsHere.forEach(({ col, d }, i) =>
          gsap.to(col, { yPercent: -10 * d, duration: 2.1 + i * 0.25, ease: 'power4.out', delay: 0.1 }),
        ),
    });
  });
  gsap.from(['.odo-head', '.od-text'], { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.odo', start: 'top 70%', once: true } });

  /* ARRIVAL: the mark sweeps in under the headlamps */
  gsap.from(['.arrive-quote', '.arrive-line'], { y: 30, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.arrive', start: 'top 70%', once: true } });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.arrive-mark', start: 'top 88%', once: true } });
  tl.to('.am-svg', { clipPath: 'inset(0 0% 0 0)', duration: 2.2, ease: 'power3.inOut' }, 0)
    .fromTo('.am-l', { opacity: 0, x: '-4vw' }, { opacity: 1, x: '78vw', duration: 2.2, ease: 'power3.inOut' }, 0)
    .to('.am-l', { opacity: 0, duration: 0.8 }, 1.8);
  gsap.from(['.arrive-cols > *', '.arrive-note'], { y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.arrive-cols', start: 'top 92%', once: true } });

  /* Hairlines draw in; big type slides to its place as you scroll */
  $$('.mq, .pp, .od').forEach((r) =>
    gsap.fromTo(r, { '--h': 0 }, { '--h': 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 90%', once: true } }),
  );
  const slide = (sel: string, x: number, end = 'top 55%') =>
    $$(sel).forEach((el) =>
      gsap.fromTo(el, { x }, { x: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end, scrub: 0.6 } }),
    );
  slide('.od-num', -80);
  slide('.od-text', 60);
  slide('.mq-i', -20);
  slide('.pp-r', 60);
  slide('.arrive-quote', -40, 'top 40%');
  slide('.arrive-cols > *', 40, 'top 70%');
  $$('.od-text, .arrive-note').forEach((el) =>
    gsap.fromTo(el, { opacity: 0.25 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 65%', scrub: true } }),
  );
  gsap.to('.mq-sign', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.marques', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  gsap.fromTo('.pp-img img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.people', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  slide('.people-head', -40);
  gsap.fromTo('.od-head', { x: 40 }, { x: 0, ease: 'none', scrollTrigger: { trigger: '.odo', start: 'top bottom', end: 'top 30%', scrub: 0.5 } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  if ('fonts' in document) (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
}
