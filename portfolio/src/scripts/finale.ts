import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa, reduced } from './util';
import { initPixel } from './pixel';
import { pixelWords } from './pixelreveal';

/* The last stretch of the page: pixel-built headings, the rotating words under "Start your next website today", the swapping arrow, the stack of
   project tiles in the footer and the little pixel icon next to "Crafted by". All of it is set up after the first screen has painted. */
export function initFinale() {
  const js = document.documentElement.classList.contains('js');

  /* ----- headings built from pixels ----- */
  ['.about__title', '.next__title', '.connect__title'].forEach((s) => {
    const el = q(s);
    if (el) pixelWords(el, { start: 'top 85%', stagger: s === '.next__title' ? 0.12 : 0.07 });
  });

  /* ----- two slots that roll through words, each at its own pace ----- */
  qa('[data-slot]').forEach((slot, k) => {
    const words = qa('.slot__w', slot);
    let i = 0;
    if (reduced || words.length < 2) return;
    gsap.set(words.slice(1), { yPercent: 110 });
    window.setInterval(() => {
      if (document.hidden) return;
      const out = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      gsap.fromTo(next, { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 0.55, ease: 'power3.out', overwrite: true });
      gsap.to(out, { yPercent: -110, duration: 0.55, ease: 'power3.out', overwrite: true, onComplete: () => { gsap.set(out, { opacity: 0 }); } });
      words.forEach((w) => w.classList.toggle('is-on', w === next));
      next.removeAttribute('aria-hidden');
      out.setAttribute('aria-hidden', 'true');
    }, 2100 + k * 700);
  });

  /* ----- the call to action: the arrow and the last word swap places ----- */
  const cta = q('.next__cta');
  const word = q('.next__word');
  if (cta && word) {
    const measure = () => cta.style.setProperty('--w', `${word.offsetWidth}px`);
    measure();
    window.addEventListener('resize', measure, { passive: true });
    document.fonts?.ready.then(measure);
  }

  /* ----- the stack of Work clips: rotated cards, press to throw the top one to the back ----- */
  const stack = q('[data-thumbs]');
  const tiles = stack ? qa('.thumb', stack) : [];
  if (stack && tiles.length && js) {
    const n = tiles.length;
    const phone = window.matchMedia('(max-width: 699px)').matches;
    const spread = phone ? 0.62 : 1;
    const side = (k: number) => (k % 2 ? 1 : -1);
    const pose = (k: number) => ({ x: side(k) * k * 16 * spread, y: k * -7, rotation: k === 0 ? -2 : side(k) * (3 + k * 2.6), scale: 1 - k * 0.04, zIndex: n - k, opacity: k > 4 ? 0 : 1 });
    let order = tiles.slice();
    let inView = false;
    let lastPress = 0;
    let busy = false;

    // borrow the pictures and clips from the Work section (same order as the projects)
    const items = qa('[data-wi]');
    const media = () => tiles.forEach((t, i) => {
      const src = items[i];
      const poster = src && q<HTMLImageElement>('.wi__poster', src);
      const clip = src && q<HTMLVideoElement>('video', src);
      if (!poster || !clip) return;
      const img = document.createElement('img');
      img.className = 'thumb__img';
      img.alt = '';
      img.decoding = 'async';
      img.src = poster.getAttribute('src') || poster.dataset.src || '';
      const v = document.createElement('video');
      v.className = 'thumb__vid';
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'none';
      v.setAttribute('aria-hidden', 'true');
      v.dataset.src = phone && clip.dataset.videoM ? clip.dataset.videoM : clip.dataset.video || '';
      t.prepend(v);
      t.prepend(img);
    });
    const play = () => order.forEach((t, k) => {
      const v = q<HTMLVideoElement>('.thumb__vid', t);
      if (!v) return;
      if (k === 0 && inView && !reduced) {
        if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
        void v.play().catch(() => {});
        v.classList.add('is-on');
      } else {
        v.pause();
        v.classList.remove('is-on');
      }
    });

    const advance = () => {
      if (busy) return;
      busy = true;
      const front = order.shift()!;
      order.push(front);
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (reduced) { order.forEach((t, k) => gsap.set(t, pose(k))); busy = false; play(); return; }
      // the front card is thrown out sideways, tucks in behind the others, and the rest step forward
      gsap.to(front, { x: dir * (phone ? 150 : 300), y: -30, rotation: dir * 16, duration: 0.42, ease: 'power2.in', onComplete: () => {
        gsap.set(front, { zIndex: 0 });
        gsap.to(front, { ...pose(n - 1), duration: 0.55, ease: 'power3.out', onComplete: () => { busy = false; } });
      } });
      order.slice(0, -1).forEach((t, k) => gsap.to(t, { ...pose(k), duration: 0.6, ease: 'power3.inOut', overwrite: true }));
      play();
    };

    order.forEach((t, k) => gsap.set(t, reduced ? pose(k) : { x: 0, y: 70, rotation: 0, scale: 0.6, opacity: 0, zIndex: n - k }));
    ScrollTrigger.create({
      trigger: stack,
      start: 'top 130%',
      once: true,
      onEnter: () => {
        media();
        if (reduced) return;
        ScrollTrigger.create({
          trigger: stack,
          start: 'top 92%',
          once: true,
          onEnter: () => order.forEach((t, k) => gsap.to(t, { ...pose(k), duration: 0.9, ease: 'back.out(1.3)', delay: k * 0.08, overwrite: true })),
        });
      },
    });
    new IntersectionObserver((es) => { inView = es[0].isIntersecting; play(); }, { threshold: 0.35 }).observe(stack);

    const press = () => { lastPress = performance.now(); advance(); };
    stack.addEventListener('click', press);
    stack.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(); } });
    // left alone, it keeps turning on its own, round after round
    window.setInterval(() => { if (inView && !document.hidden && performance.now() - lastPress > 6000) advance(); }, 4200);
  }

  /* ----- the contact form: there is no server, so sending opens the visitor's email app with everything filled in ----- */
  const form = q<HTMLFormElement>('[data-contact-form]');
  if (form) {
    const note = q('[data-form-note]', form);
    const area = q<HTMLTextAreaElement>('textarea', form);
    const grow = () => { if (area) { area.style.height = 'auto'; area.style.height = `${area.scrollHeight}px`; } };
    area?.addEventListener('input', grow);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const bad = qa<HTMLInputElement>('[required]', form).find((f) => !f.checkValidity());
      if (bad) { bad.focus(); if (note) note.textContent = 'Please fill in the fields marked with a star.'; return; }
      const val = (k: string) => String(d.get(k) ?? '').trim();
      const body = [`Name: ${val('name')}`, ...(val('company') ? [`Company: ${val('company')}`] : []), `Email: ${val('email')}`, '', val('message')].join('\n');
      window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(`Website enquiry from ${val('name')}`)}&body=${encodeURIComponent(body)}`;
      if (note) note.textContent = 'Thank you. Your email app should open with your message ready to send.';
    });
  }

  /* ----- the pixel icon beside "Crafted by" changes shape every few seconds ----- */
  const mini = q('.pixel--mini');
  if (mini) {
    const p = initPixel(mini);
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? p.start(2600) : p.stop()))).observe(mini);
  }
}
