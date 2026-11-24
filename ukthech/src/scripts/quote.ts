// Quote centrepiece: five studio stills float round the sentence, each on its own sine drift, and also move with the scroll
// and with the pointer on fine pointers. Contact shadows breathe with the drift; dust motes sit at their own depths.
import { gsap, ScrollTrigger, reduced, finePointer } from './core';

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-quote]');
  if (!root || reduced) return;
  const stage = root.querySelector<HTMLElement>('.qt-stage')!;
  const objs = [...root.querySelectorAll<HTMLElement>('[data-qo]')];
  const motes = [...root.querySelectorAll<HTMLElement>('[data-mote]')];
  const mobile = matchMedia('(max-width: 899px)').matches;
  const r = (a: number, b: number) => a + Math.random() * (b - a);

  // Drift: each still gets its own amplitude, period and a start phase
  objs.forEach((o, i) => {
    const img = o.querySelector<HTMLElement>('[data-qo-img]')!;
    const shadow = o.querySelector<HTMLElement>('[data-shadow]')!;
    const rot = parseFloat(o.dataset.rot || '0');
    const dur = r(5.5, 8.5);
    const phase = (i * 0.37) % 1;
    gsap.to(img, { y: r(-16, -26) * (mobile ? 0.6 : 1), x: r(-8, 8), rotation: rot + r(-1.8, 1.8), duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress(phase);
    gsap.to(shadow, { scaleX: 0.86, opacity: 0.12, duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress(phase);
  });
  motes.forEach((m, i) => {
    gsap.to(m, { y: r(-22, 22), x: r(-14, 14), duration: r(4, 9), ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress((i * 0.23) % 1);
  });

  // Scroll: the stage is sticky for the last 30vh only, so the stills travel against the page as the section passes
  objs.forEach((o) => {
    const s = parseFloat(o.dataset.speed || '1');
    gsap.fromTo(o.querySelector('[data-qo-s]'), { yPercent: 16 * s }, {
      yPercent: -16 * s, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    });
  });
  motes.forEach((m) => {
    const d = parseFloat(m.dataset.depth || '1');
    gsap.fromTo(m, { marginTop: 90 * d }, {
      marginTop: -90 * d, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    });
  });

  // Pointer: closer things move further
  if (finePointer) {
    const qs = objs.map((o) => ({ d: parseFloat(o.dataset.depth || '1'), x: gsap.quickTo(o, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(o, 'y', { duration: 1.1, ease: 'power3.out' }) }));
    const ms = motes.map((m) => ({ d: parseFloat(m.dataset.depth || '1'), x: gsap.quickTo(m, 'xPercent', { duration: 1.4, ease: 'power3.out' }), y: gsap.quickTo(m, 'yPercent', { duration: 1.4, ease: 'power3.out' }) }));
    stage.addEventListener('pointermove', (e) => {
      const b = stage.getBoundingClientRect();
      const nx = (e.clientX - b.left) / b.width - 0.5;
      const ny = (e.clientY - b.top) / b.height - 0.5;
      qs.forEach((q) => { q.x(-nx * 56 * q.d); q.y(-ny * 40 * q.d); });
      ms.forEach((q) => { q.x(nx * 260 * q.d); q.y(ny * 260 * q.d); });
    });
  }
  ScrollTrigger.refresh();
}
