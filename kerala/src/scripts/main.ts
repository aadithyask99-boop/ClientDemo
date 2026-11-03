import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { blobClip, inkCurtain } from './ink';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

if (reduce) {
  // Static, readable page: no pins, no smooth scroll, no ink.
  document.documentElement.classList.remove('js');
} else {
  init();
}

/** Wrap every word in a masked span so it can rise into place. Keeps nested spans (the gold word). */
function splitWords(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (n.textContent || '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'sw2';
          const i = document.createElement('span');
          i.className = 'si';
          i.textContent = part;
          w.appendChild(i);
          frag.appendChild(w);
          out.push(i);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  el.classList.add('is-split');
  return out;
}

function init() {
  /* ---------- Smooth scroll (desktop pointers only) ---------- */
  let lenis: Lenis | null = null;
  if (fine) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
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
      if (lenis) lenis.scrollTo(t as number | HTMLElement, { duration: 1.8 });
      else if (t === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      else (t as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }),
  );

  /* ---------- The cursor is the lamp flame ---------- */
  const flame = $('.flame');
  if (flame && fine) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    gsap.ticker.add(() => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      flame.style.transform = `translate(${x}px, ${y}px)`;
    });
    $$('a, button').forEach((a) => {
      a.addEventListener('pointerenter', () => flame.classList.add('big'));
      a.addEventListener('pointerleave', () => flame.classList.remove('big'));
    });
  }

  /* ---------- Header tone follows the ground under it ---------- */
  let toneFrame = 0;
  gsap.ticker.add(() => {
    if (++toneFrame % 6) return;
    const el = document.elementsFromPoint(innerWidth / 2, 46).find((e) => !e.closest('.bar') && e.closest('[data-tone]'));
    const tone = el?.closest('.arts.is-on') ? 'dark' : el?.closest<HTMLElement>('[data-tone]')?.dataset.tone;
    if (tone && document.body.dataset.tone !== tone) document.body.dataset.tone = tone;
  });

  /* ---------- Lamp light that follows the pointer (or drifts on touch) ---------- */
  const lampOf = (section: HTMLElement, el: HTMLElement) => {
    const set = (x: number, y: number) => { el.style.setProperty('--lx', x + 'px'); el.style.setProperty('--ly', y + 'px'); };
    if (fine) {
      section.addEventListener('pointermove', (e) => {
        const r = section.getBoundingClientRect();
        set(e.clientX - r.left, e.clientY - r.top);
      });
    } else {
      gsap.ticker.add((t) => {
        const r = section.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        set(r.width * (0.5 + 0.28 * Math.sin(t * 0.45)), Math.min(r.height, innerHeight) * (0.5 + 0.18 * Math.cos(t * 0.33)) + Math.max(0, -r.top));
      });
    }
  };

  /* ---------- 1. Hero: ink lifts to reveal the face ---------- */
  const hero = $('.hero')!;
  const heroImg = $<HTMLImageElement>('.hero-img')!;
  const heroLamp = $('.hero-lamp')!;
  lampOf(hero, heroLamp);
  const words = $$('.hi');
  const intro = gsap.timeline({ paused: true });
  gsap.set(words, { yPercent: 115, opacity: 1 });
  intro
    .to(heroImg, { scale: 1, duration: 4.5, ease: 'power2.out' }, 0)
    .to(words, { yPercent: 0, duration: 1.5, stagger: 0.16, ease: 'power4.out' }, 1.1)
    .fromTo('.hero-sub, .cue', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out' }, 2.1);
  gsap.set(heroImg, { scale: 1.14 });
  const canvas = $<HTMLCanvasElement>('.hero-ink')!;
  const begin = () => {
    heroImg.style.opacity = '1';
    inkCurtain(canvas, () => heroLamp.classList.add('on'));
    intro.play();
  };
  heroImg.decode().then(begin, begin);

  gsap.to(heroImg, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { opacity: 0, y: -60, ease: 'none', scrollTrigger: { trigger: hero, start: '30% top', end: '80% top', scrub: true } });

  /* ---------- 2. Statement: words light up, section pinned ---------- */
  const sws = $$('.sw');
  gsap.timeline({ scrollTrigger: { trigger: '.statement', start: 'top top', end: '+=150%', pin: true, scrub: 0.6 } })
    .to(sws, { opacity: 1, stagger: 0.12, ease: 'none', duration: 0.12 });

  /* ---------- 3. The arts: hover wipes a photograph in with ink ---------- */
  const arts = $('.arts')!;
  const artEls = $$('.art');
  const artImgs = $$<HTMLImageElement>('.art-img');
  const artsBg = $('.arts-bg')!;
  const caption = $('.arts-caption')!;
  let activeArt = -1, z = 1;
  gsap.set(artsBg, { autoAlpha: 0 });
  const showArt = (i: number, x: number, y: number) => {
    if (i === activeArt) return;
    activeArt = i;
    arts.classList.add('is-on');
    gsap.to(artsBg, { autoAlpha: 1, duration: 0.4 });
    artEls.forEach((el, k) => el.classList.toggle('on', k === i));
    caption.textContent = artEls[i].dataset.line || '';
    const img = artImgs[i];
    img.style.visibility = 'visible';
    img.style.zIndex = String(++z);
    const maxR = Math.hypot(innerWidth, innerHeight) * 0.82;
    const o = { r: 0 }, seed = Math.random() * 20;
    img.style.clipPath = blobClip(x, y, 0.1, seed);
    gsap.to(o, { r: maxR, duration: 1.3, ease: 'power3.out', onUpdate: () => (img.style.clipPath = blobClip(x, y, o.r, seed)), onComplete: () => (img.style.clipPath = 'none') });
  };
  const hideArts = () => {
    activeArt = -1;
    arts.classList.remove('is-on');
    artEls.forEach((el) => el.classList.remove('on'));
    gsap.to(artsBg, { autoAlpha: 0, duration: 0.5 });
  };
  if (fine) {
    artEls.forEach((el, i) => el.addEventListener('pointerenter', (e) => showArt(i, (e as PointerEvent).clientX, (e as PointerEvent).clientY)));
    $('.arts-list')!.addEventListener('pointerleave', hideArts);
    artEls.forEach((el, i) => {
      el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); showArt(i, r.left + r.width / 2, r.top + r.height / 2); });
      el.addEventListener('blur', hideArts);
    });
  } else {
    artEls.forEach((el, i) =>
      ScrollTrigger.create({ trigger: el, start: 'center 58%', end: 'center 42%', onToggle: (s) => s.isActive && showArt(i, innerWidth / 2, innerHeight / 2) }),
    );
    ScrollTrigger.create({ trigger: '.arts-list', start: 'top 70%', end: 'bottom 30%', onLeave: hideArts, onLeaveBack: hideArts });
  }
  const artTitle = $('.arts-title')!;
  const artTitleWords = splitWords(artTitle);
  gsap.from(artTitleWords, { yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: artTitle, start: 'top 85%' } });
  gsap.from('.arts-list li', { yPercent: 40, opacity: 0, duration: 1.2, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.arts-list', start: 'top 80%' } });

  /* ---------- 4. The painting of a face: pinned, ink wipes between stages ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', () => {
    const steps = $$('.step');
    const imgs = $$('.face-img');
    const frame = $('.faces-imgs')!;
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const maxR = Math.hypot(fw, fh) * 0.8;
    const centres: [number, number][] = [[0.5, 0.75], [0.3, 0.35], [0.7, 0.55], [0.5, 0.2]];
    const seeds = [3, 7, 11, 15];
    gsap.set(steps.slice(1), { autoAlpha: 0 });
    imgs.forEach((im, i) => { if (i) im.style.clipPath = blobClip(fw * centres[i][0], fh * centres[i][1], 0.1, seeds[i]); });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.faces-pin', start: 'top top', end: '+=360%', pin: true, scrub: 0.7 } });
    tl.to({}, { duration: 0.6 }); // hold on the first lamp
    for (let i = 1; i < steps.length; i++) {
      const t = tl.duration();
      const o = { r: 0 };
      tl.to(steps[i - 1], { autoAlpha: 0, y: -60, duration: 0.45, ease: 'power2.in' }, t)
        .to(o, { r: maxR, duration: 1, ease: 'none', onUpdate: () => { imgs[i].style.clipPath = blobClip(fw * centres[i][0], fh * centres[i][1], o.r, seeds[i]); } }, t)
        .fromTo(steps[i], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, t + 0.5)
        .to({}, { duration: 0.8 });
    }
    return () => { imgs.forEach((im) => (im.style.clipPath = '')); gsap.set(steps, { clearProps: 'all' }); };
  });
  mm.add('(max-width: 820px)', () => {
    $$('.step').forEach((s) => {
      const im = $('.step-img', s)!;
      gsap.from([$('.step-head', s), $('.step-text', s)], { y: 40, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 75%' } });
      const o = { r: 0 };
      ScrollTrigger.create({
        trigger: im, start: 'top 85%', once: true,
        onEnter: () => gsap.to(o, { r: Math.hypot(im.clientWidth, im.clientHeight) * 0.8, duration: 1.4, ease: 'power3.out', onUpdate: () => (im.style.clipPath = blobClip(im.clientWidth / 2, im.clientHeight * 0.6, o.r, 5)), onComplete: () => (im.style.clipPath = 'none') }),
      });
      im.style.clipPath = blobClip(0, 0, 0.1, 5);
    });
  });

  /* ---------- 5. Pooram night ---------- */
  const poHero = $('.pooram-hero')!;
  lampOf(poHero, $('.pooram-lamp')!);
  ScrollTrigger.create({ trigger: poHero, start: 'top 60%', end: 'bottom 40%', onToggle: (s) => $('.pooram-lamp')!.classList.toggle('on', s.isActive) });
  gsap.fromTo('.pooram-img', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: poHero, start: 'top bottom', end: 'bottom top', scrub: true } });
  const poTitle = splitWords($('.pooram-title')!);
  gsap.from(poTitle, { yPercent: 115, duration: 1.5, stagger: 0.1, ease: 'power4.out', scrollTrigger: { trigger: '.pooram-title', start: 'top 88%' } });
  gsap.from('.pooram-lead', { y: 30, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.pooram-lead', start: 'top 92%' } });
  const fig = $('.pooram-fig img')!;
  const figO = { r: 0 };
  fig.style.clipPath = blobClip(0, 0, 0.1, 9);
  ScrollTrigger.create({
    trigger: fig, start: 'top 82%', once: true,
    onEnter: () => gsap.to(figO, { r: Math.hypot(fig.clientWidth, fig.clientHeight) * 0.85, duration: 1.8, ease: 'power3.out', onUpdate: () => (fig.style.clipPath = blobClip(fig.clientWidth * 0.5, fig.clientHeight * 0.55, figO.r, 9)), onComplete: () => (fig.style.clipPath = 'none') }),
  });
  gsap.fromTo('.pooram-fig', { y: 80 }, { y: -60, ease: 'none', scrollTrigger: { trigger: '.pooram-lower', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- 6. Houses: the roof rises, the photograph drifts ---------- */
  const hTitle = $('.houses-title')!;
  gsap.from(splitWords(hTitle), { yPercent: 115, duration: 1.4, stagger: 0.08, ease: 'power4.out', scrollTrigger: { trigger: hTitle, start: 'top 85%' } });
  $$('.house').forEach((h, i) => {
    const gable = $('.gable', h)!;
    gsap.fromTo(gable, { clipPath: 'polygon(50% 100%, 100% 100%, 100% 100%, 0% 100%, 0% 100%)' }, { clipPath: 'polygon(50% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)', duration: 1.8, ease: 'power3.inOut', scrollTrigger: { trigger: h, start: 'top 85%' } });
    gsap.from($('figcaption', h), { y: 30, opacity: 0, duration: 1.1, delay: 0.5, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    gsap.fromTo($('img', gable), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (fine) gsap.fromTo(h, { y: 40 * (i + 1) }, { y: -40 * (i + 1), ease: 'none', scrollTrigger: { trigger: '.houses-row', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- 7. Kasavu: the gold border is woven as you scroll ---------- */
  gsap.fromTo('.weave-top i', { scaleX: 0 }, { scaleX: 1, stagger: 0.18, ease: 'none', scrollTrigger: { trigger: '.kasavu', start: 'top 85%', end: 'top 25%', scrub: 0.6 } });
  gsap.fromTo('.weave-bottom i', { scaleX: 0 }, { scaleX: 1, stagger: 0.18, ease: 'none', scrollTrigger: { trigger: '.weave-bottom', start: 'top 100%', end: 'top 55%', scrub: 0.6 } });
  const kTitle = $('.kasavu-title')!;
  gsap.from(splitWords(kTitle), { yPercent: 115, duration: 1.5, stagger: 0.12, ease: 'power4.out', scrollTrigger: { trigger: kTitle, start: 'top 85%' } });
  gsap.from('.kasavu-text', { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.kasavu-text', start: 'top 92%' } });

  /* ---------- 8. Dawn ---------- */
  gsap.fromTo('.dawn-img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.dawn', start: 'top bottom', end: 'bottom top', scrub: true } });
  const dTitle = $('.dawn-title')!;
  gsap.from(splitWords(dTitle), { yPercent: 115, duration: 1.5, stagger: 0.07, ease: 'power4.out', scrollTrigger: { trigger: dTitle, start: 'top 85%' } });

  /* ---------- 9. Footer ---------- */
  const fTitle = $('.foot-title')!;
  gsap.from(splitWords(fTitle), { yPercent: 115, duration: 1.4, stagger: 0.07, ease: 'power4.out', scrollTrigger: { trigger: fTitle, start: 'top 90%' } });
  gsap.fromTo('.foot-mark span', { yPercent: 55 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot-mark', start: 'top 100%', end: 'bottom 92%', scrub: true } });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
