// Order arrives: the page's only pinned scene (desktop). Three beats, scrubbed:
// 1 the parcel arrives and settles, 2 the flaps hinge open and the pack of sheets rises out, 3 the pack lifts over and settles at the front.
// Phones and reduced motion keep the final state and the three steps as stacked blocks.
import { gsap, ScrollTrigger, reduced } from './core';

type P = [number, number];

// p' = o + M (p - o) where M keeps the hinge vector u and turns the cross vector v by theta about the hinge (3/4 view, vertical foreshortened by k)
function hinge(o: P, u: P, v: P, theta: number, k = 0.95) {
  const r = (theta * Math.PI) / 180;
  const lv = Math.hypot(v[0], v[1]);
  const vp: P = [Math.cos(r) * v[0], Math.cos(r) * v[1] - Math.sin(r) * lv * k];
  const det = u[0] * v[1] - v[0] * u[1];
  const r0: P = [v[1] / det, -v[0] / det];
  const r1: P = [-u[1] / det, u[0] / det];
  const a = u[0] * r0[0] + vp[0] * r1[0];
  const c = u[0] * r0[1] + vp[0] * r1[1];
  const b = u[1] * r0[0] + vp[1] * r1[0];
  const d = u[1] * r0[1] + vp[1] * r1[1];
  const e = o[0] - (a * o[0] + c * o[1]);
  const f = o[1] - (b * o[0] + d * o[1]);
  const flipped = (u[0] * vp[1] - vp[0] * u[1]) * det < 0;
  return { m: `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${e.toFixed(2)} ${f.toFixed(2)})`, flipped };
}

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-order]');
  if (!root) return;
  const geo = JSON.parse(root.dataset.geo || '{}') as { A: P; B: P; C: P; D: P; PC: P };
  if (reduced) return; // the markup is the finished state

  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];
  const mm = gsap.matchMedia();

  mm.add('(max-width: 899px)', () => {
    gsap.set(qa('[data-step]'), { clearProps: 'all' });
    qa('[data-step]').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  });

  mm.add('(min-width: 900px)', () => {
    const { A, B, C, D, PC } = geo;
    const sub = (p: P, q2: P): P => [p[0] - q2[0], p[1] - q2[1]];
    const backEl = q('[data-flap="back"]');
    const frontEl = q('[data-flap="front"]');
    const flaps = [
      { el: backEl, o: A, u: sub(B, A), v: sub(D, A), to: 104 },
      { el: frontEl, o: D, u: sub(C, D), v: sub(A, D), to: 270 },
    ];
    const state = { back: 0, front: 0 };
    const setFlap = (i: number, theta: number) => {
      const fl = flaps[i];
      const h = hinge(fl.o, fl.u, fl.v, theta);
      const inner = fl.el.querySelector<SVGGElement>('.o-in')!;
      const outer = fl.el.querySelector<SVGGElement>('.o-out')!;
      fl.el.setAttribute('transform', h.m);
      inner.style.display = h.flipped ? 'inline' : 'none';
      outer.style.display = h.flipped ? 'none' : 'inline';
    };
    const paintFlaps = () => { setFlap(0, state.back); setFlap(1, state.front); };

    const photo = q('[data-o-photo]');
    const pack = q<SVGGElement>('[data-pack]');
    const clip = q<SVGGElement>('[data-pk-clip]');
    const pkShadow = q<SVGGElement>('[data-pk-shadow]');
    const sheets = qa<SVGGElement>('[data-o-sheet]');
    const rots = qa<SVGGElement>('[data-rot]');
    const band = q<SVGGElement>('[data-band]');
    const tag = q<SVGGElement>('[data-tag]');
    const steps = qa('[data-step]');
    const lights = qa('[data-o-light]');
    const ground = q('[data-o-ground]');
    const note = q('[data-o-note]');
    const title = q('[data-o-title]');
    const panel = q('[data-o-panel]');
    const sTitles = qa('[data-s-title]');
    const sLines = qa('[data-s-line]');
    const cavShadow = q('[data-cav-shadow]');
    const origin = `${PC[0]} ${PC[1]}`;

    // Pack poses (pack coordinates are the finished pose; x, y are offsets from it)
    const cx = (A[0] + B[0] + C[0] + D[0]) / 4, cy = (A[1] + B[1] + C[1] + D[1]) / 4;
    const inBox = { x: cx - PC[0], y: cy + 30 - PC[1], scale: 0.92 };
    const lifted = { x: cx - PC[0] + 4, y: 92 - PC[1], scale: 0.97 };
    const fan = [{ r: -7, x: -16, y: 0 }, { r: -2.5, x: -5, y: -8 }, { r: 2.5, x: 6, y: -16 }, { r: 7, x: 17, y: -24 }];

    // Start poses
    gsap.set(photo, { yPercent: 62, scale: 0.84, opacity: 0, transformOrigin: '50% 60%', rotation: 3 });
    state.back = 0; state.front = 0; paintFlaps();
    gsap.set([backEl, frontEl], { opacity: 1 });
    gsap.set(pack, { svgOrigin: origin, ...inBox, opacity: 0 });
    gsap.set(pkShadow, { svgOrigin: origin, opacity: 0 });
    gsap.set(cavShadow, { opacity: 0 });
    sheets.forEach((s) => gsap.set(s, { x: 0, y: 0 }));
    rots.forEach((r) => gsap.set(r, { transformOrigin: '195px 100px', rotation: 0 }));
    gsap.set(band, { y: -70, opacity: 0 });
    gsap.set(tag, { y: -50, x: 30, opacity: 0, rotation: 0 });
    gsap.set(steps, { opacity: 0, y: 36 });
    gsap.set(sTitles, { y: 26 });
    gsap.set(sLines, { y: 44 });
    gsap.set(title, { opacity: 0, y: 34 });
    gsap.set(panel, { scale: 0.965, transformOrigin: '50% 100%' });
    gsap.set(note, { opacity: 0 });
    gsap.set(lights, { x: -60, opacity: 0 });
    gsap.set(ground, { opacity: 0 });
    clip.setAttribute('clip-path', 'url(#o-inbox)');

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: q('[data-o-pin]'), start: 'top top', end: '+=260%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });

    // Beat 1: the parcel arrives and settles (0 to 20)
    tl.to(title, { opacity: 1, y: 0, duration: 7, ease: 'power2.out' }, 0).to(panel, { scale: 1, duration: 12, ease: 'power2.out' }, 0);
    steps.forEach((st, i) => { const at = [9, 28, 70][i]; tl.to(sTitles[i], { y: 0, duration: 8, ease: 'power2.out' }, at).to(sLines[i], { y: 0, duration: 9, ease: 'power2.out' }, at + 1.5); });
    tl.to(photo, { yPercent: 0, scale: 1, rotation: 0, duration: 16, ease: 'power3.out' }, 0)
      .to(photo, { opacity: 1, duration: 5 }, 0)
      .to(ground, { opacity: 1, duration: 12 }, 4)
      .to(lights, { opacity: (i) => [1, 0.8, 0.6][i], x: 0, duration: 20, stagger: 2 }, 0)
      .to(steps[0], { opacity: 1, y: 0, duration: 7, ease: 'power2.out' }, 9);

    // Beat 2: the flaps hinge open and the pack rises out (24 to 66)
    tl.to(steps[0], { opacity: 0.32, duration: 4 }, 26)
      .to(steps[1], { opacity: 1, y: 0, duration: 7, ease: 'power2.out' }, 28)
      .to(state, { back: flaps[0].to, duration: 22, ease: 'power2.inOut', onUpdate: paintFlaps }, 28)
      .to(state, { front: flaps[1].to, duration: 24, ease: 'power2.inOut', onUpdate: paintFlaps }, 30)
      .to(pack, { opacity: 1, duration: 3 }, 40)
      .to(cavShadow, { opacity: 0.85, duration: 6 }, 40)
      .to(cavShadow, { opacity: 0.35, duration: 14 }, 52)
      .to([backEl, frontEl], { opacity: 0, duration: 7 }, 56)
      .to(pack, { ...lifted, duration: 14, ease: 'power2.inOut' }, 52);
    sheets.forEach((s, i) => {
      tl.to(s, { x: fan[i].x, y: fan[i].y, duration: 14, ease: 'power2.inOut' }, 52);
      tl.to(rots[i], { rotation: fan[i].r, duration: 14, ease: 'power2.inOut' }, 52);
    });

    // Beat 3: the pack settles at the front with its band and tag (68 to 100)
    tl.to(steps[1], { opacity: 0.32, duration: 4 }, 68)
      .to(steps[2], { opacity: 1, y: 0, duration: 7, ease: 'power2.out' }, 70)
      .to(pack, { x: 0, y: 0, scale: 1, duration: 22, ease: 'power2.inOut' }, 68)
      .to(cavShadow, { opacity: 0, duration: 8 }, 68)
      .to(pkShadow, { opacity: 1, duration: 8 }, 84);
    sheets.forEach((s, i) => {
      tl.to(s, { x: 0, y: 0, duration: 14, ease: 'power2.inOut' }, 78);
      tl.to(rots[i], { rotation: 0, duration: 14, ease: 'power2.inOut' }, 78);
    });
    tl.to(band, { y: 0, opacity: 1, duration: 7, ease: 'power3.out' }, 90)
      .to(tag, { y: 0, x: 0, opacity: 1, duration: 8, ease: 'power3.out' }, 92)
      .to(note, { opacity: 1, duration: 6 }, 92)
      .to({}, { duration: 2 }, 98);

    // Pack clip: behind the front rim until the pack has lifted clear, then free
    tl.eventCallback('onUpdate', () => {
      const p = tl.progress() * 100;
      const want = p < 64 ? 'url(#o-inbox)' : '';
      const has = clip.getAttribute('clip-path') || '';
      if (want && has !== want) clip.setAttribute('clip-path', want);
      if (!want && has) clip.removeAttribute('clip-path');
    });

    return () => {
      // Back to the finished pose when the breakpoint changes
      state.back = 0; state.front = 0;
      flaps.forEach((fl) => { fl.el.removeAttribute('transform'); fl.el.style.opacity = '0'; });
      clip.removeAttribute('clip-path');
      gsap.set([photo, pack, pkShadow, cavShadow, band, tag, steps, sTitles, sLines, title, panel, note, lights, ground, ...sheets, ...rots], { clearProps: 'all' });
    };
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
