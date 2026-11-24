// Order arrives: the page's only pinned scene (desktop). Three beats, scrubbed:
// 1 the parcel arrives and the light settles, 2 the flaps hinge open (thickness, cast shadows, shading follow the angle) and the pack rises out,
// 3 the pack lifts over and settles at the front, the band and the tag drop on.
// Phones and reduced motion keep the final state (the markup) and the three steps as stacked blocks.
// The pose maths (camera 25 degrees above, light from the left) is the same as in Order.astro, which renders the final pose.
import { gsap, ScrollTrigger, reduced } from './core';

type P = [number, number];
type V = [number, number, number];

const RAD = Math.PI / 180, sE = Math.sin(16 * RAD), cE = Math.cos(16 * RAD);
const proj = (w: V): P => [w[0], -(w[1] * sE + w[2] * cE)];
const grd = (p: P): V => [p[0], -p[1] / sE, 0];
const crs = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dt = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V): V => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
const rotv = (v: V, a: V, r: number): V => { const c = Math.cos(r), s = Math.sin(r), x = crs(a, v), d = dt(a, v) * (1 - c); return [v[0] * c + x[0] * s + a[0] * d, v[1] * c + x[1] * s + a[1] * d, v[2] * c + x[2] * s + a[2] * d]; };
const CAM: V = [0, -cE, sE];
const SUN = unit([-0.9, 0.25, 1]);
const LX = 0.9, LY = -0.25, TH = 9;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mstr = (m: number[]) => `matrix(${m.map((x) => +x.toFixed(4)).join(",")})`;
const mix3 = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);
const rgb = (c: number[]) => `rgb(${c.map((x) => Math.round(x)).join(',')})`;
const SHADED = [138, 101, 64], LIT = [201, 162, 115];
const EDGE_S = [150, 114, 72], EDGE_L = [238, 218, 176];
const OUT_BASE = [209, 172, 130], IN_BASE = [128, 86, 48];
const HB = 316, ZI = -40;

interface Flap { h0: P; h1: P; f0: P; f1: P; a: V; sg: number; w0: V; dl: P }
const mkFlap = (h0: P, h1: P, f0: P, f1: P): Flap => {
  // the side edge of a flap is perpendicular to its hinge in the world; dl corrects the photographed (perspective) edge back to that ideal
  const a = unit(grd([h1[0] - h0[0], h1[1] - h0[1]])), bw = grd([f0[0] - h0[0], f0[1] - h0[1]]);
  let pp: V = [-a[1], a[0], 0]; if (dt(pp, bw) < 0) pp = [-pp[0], -pp[1], 0];
  const L = Math.hypot(bw[0], bw[1]), w0: V = [pp[0] * L, pp[1] * L, 0], pw = proj(w0);
  return { h0, h1, f0, f1, a, w0, dl: [f0[0] - h0[0] - pw[0], f0[1] - h0[1] - pw[1]], sg: crs(a, w0)[2] < 0 ? -1 : 1 };
};

function pose(F: Flap, th: number) {
  const r = F.sg * th * RAD;
  const vr = rotv(F.w0, F.a, r), nr = rotv([0, 0, 1], F.a, r);
  const [ox, oy] = F.h0;
  const bx = F.h1[0] - ox, by = F.h1[1] - oy, vx = F.f0[0] - ox, vy = F.f0[1] - oy;
  const pv = proj(vr), cs = Math.cos(th * RAD), e2: P = [pv[0] + F.dl[0] * cs, pv[1] + F.dl[1] * cs], det = bx * vy - vx * by;
  const a = (bx * vy - e2[0] * by) / det, c = (-bx * vx + e2[0] * bx) / det, b = (by * vy - e2[1] * by) / det, d = (-by * vx + e2[1] * bx) / det;
  const e = ox - (a * ox + c * oy), f = oy - (b * ox + d * oy);
  const tv = proj([-nr[0] * TH, -nr[1] * TH, -nr[2] * TH]);
  const q0: P = [a * F.f0[0] + c * F.f0[1] + e, b * F.f0[0] + d * F.f0[1] + f];
  const q1: P = [a * F.f1[0] + c * F.f1[1] + e, b * F.f1[0] + d * F.f1[1] + f];
  const visOut = dt(nr, CAM) > 0;
  const kOut = Math.max(0, dt(nr, SUN)), kIn = Math.max(0, -dt(nr, SUN));
  const tone = (k: number, baseC: number[]) => {
    const t = mix3(SHADED, LIT, clamp(0.3 + 0.85 * k));
    const lt = (t[0] + t[1] + t[2]) / 3, lb = (baseC[0] + baseC[1] + baseC[2]) / 3;
    return lt < lb ? { fill: 'rgb(34,20,9)', op: clamp(1 - lt / lb, 0, 0.9) } : { fill: 'rgb(255,234,196)', op: clamp((lt - lb) / (255 - lb), 0, 0.9) };
  };
  let ef = crs(nr, F.a); if (dt(ef, vr) < 0) ef = [-ef[0], -ef[1], -ef[2]];
  const edge = (k: number) => rgb(mix3(EDGE_S, EDGE_L, clamp(0.35 + 0.95 * k)));
  return {
    outer: [a, b, c, d, e, f], inner: [a, b, c, d, e + tv[0], f + tv[1]], visOut,
    shOut: tone(kOut, OUT_BASE), shIn: tone(kIn, IN_BASE),
    free: { m: [q1[0] - q0[0], q1[1] - q0[1], tv[0], tv[1], q0[0], q0[1]], vis: dt(ef, CAM) > 0.02, fill: edge(Math.max(0, dt(ef, SUN))) },
    sl: { m: [q0[0] - ox, q0[1] - oy, tv[0], tv[1], ox, oy], vis: -dt(F.a, CAM) > 0.02, fill: edge(Math.max(0, -dt(F.a, SUN))) },
    sr: { m: [q1[0] - F.h1[0], q1[1] - F.h1[1], tv[0], tv[1], F.h1[0], F.h1[1]], vis: dt(F.a, CAM) > 0.02, fill: edge(Math.max(0, dt(F.a, SUN))) },
  };
}
function shadow(F: Flap, th: number, zp: number) {
  const r = F.sg * th * RAD, vr = rotv(F.w0, F.a, r), o = grd(F.h0);
  const q0 = proj([o[0] - LX * zp, o[1] - LY * zp, zp]);
  const e2 = proj([vr[0] + LX * vr[2], vr[1] + LY * vr[2], 0]);
  return [F.h1[0] - F.h0[0], F.h1[1] - F.h0[1], e2[0], e2[1], q0[0], q0[1]];
}
const rotAbout = (deg: number, cx: number, cy: number) => {
  const r = deg * RAD, c = Math.cos(r), s = Math.sin(r);
  return [c, s, -s, c, cx - (c * cx - s * cy), cy - (s * cx + c * cy)];
};

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-order]');
  if (!root) return;
  const geo = JSON.parse(root.dataset.geo || '{}') as { A: P; B: P; C: P; D: P; PC: P; back: P[]; front: P[]; lenU: number; lenV: number; FINAL: { back: number; front: number } };
  if (reduced) return; // the markup is the finished state

  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const qa = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];
  const mm = gsap.matchMedia();

  mm.add('(max-width: 899px)', () => {
    // Phones: finished scene, the three steps stacked, each easing in once as it arrives
    const steps = qa('[data-step]');
    steps.forEach((el) => {
      gsap.from(el, { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    return () => gsap.set(steps, { clearProps: 'all' });
  });

  mm.add('(min-width: 900px)', () => {
    const { A, B, C, D, PC, lenU, lenV, FINAL } = geo;
    const back = mkFlap(geo.back[0], geo.back[1], geo.back[3], geo.back[2]);
    const front = mkFlap(geo.front[0], geo.front[1], geo.front[3], geo.front[2]);
    const flapsEl = { back: q('[data-flap="back"]'), front: q('[data-flap="front"]') };
    const parts = (el: Element) => ({
      sl: el.querySelector<SVGGElement>('[data-fp="sl"]')!, sr: el.querySelector<SVGGElement>('[data-fp="sr"]')!, ed: el.querySelector<SVGGElement>('[data-fp="ed"]')!,
      inn: el.querySelector<SVGGElement>('[data-fp="in"]')!, out: el.querySelector<SVGGElement>('[data-fp="out"]')!,
      ins: el.querySelector<SVGPolygonElement>('[data-fp="ins"]')!, outs: el.querySelector<SVGPolygonElement>('[data-fp="outs"]')!,
    });
    const pEl = { back: parts(flapsEl.back), front: parts(flapsEl.front) };
    const gsdBack = q<SVGGElement>('[data-fl-gsd="back"]'), gsdFront = q<SVGGElement>('[data-fl-gsd="front"]');
    const isd = q<SVGGElement>('[data-fl-isd]'), wsd = q<SVGGElement>('[data-fl-wsd]');
    const state = { back: 0, front: 0 };
    root.querySelectorAll('[data-fp]').forEach((n) => n.removeAttribute('display'));

    const setM = (el: Element, m: number[]) => { (el as SVGElement).style.transform = mstr(m); };
    const strip = (el: SVGGElement, s: { m: number[]; vis: boolean; fill: string }, op: number) => {
      setM(el, s.m);
      el.style.display = s.vis && op > 0.01 ? '' : 'none';
      el.style.opacity = String(op);
      (el.firstElementChild as SVGElement).setAttribute('fill', s.fill);
    };
    const paintFlap = (key: 'back' | 'front') => {
      const F = key === 'back' ? back : front, th = state[key], p = pose(F, th), e = pEl[key];
      const op = clamp((th - 3) / 9);
      strip(e.sl, p.sl, op); strip(e.sr, p.sr, op); strip(e.ed, p.free, op);
      setM(e.inn, p.inner); e.inn.style.display = p.visOut ? 'none' : '';
      setM(e.out, p.outer); e.out.style.display = p.visOut ? '' : 'none';
      e.ins.setAttribute('fill', p.shIn.fill); e.ins.setAttribute('fill-opacity', p.shIn.op.toFixed(3));
      e.outs.setAttribute('fill', p.shOut.fill); e.outs.setAttribute('fill-opacity', p.shOut.op.toFixed(3));
      return p;
    };
    const paint = () => {
      paintFlap('back');
      const pf = paintFlap('front');
      setM(gsdBack, shadow(back, state.back, -HB)); gsdBack.style.opacity = String(clamp((state.back - 5) / 30));
      setM(gsdFront, shadow(front, state.front, -HB)); gsdFront.style.opacity = String(clamp((state.front - 5) / 30) * (1 - clamp((state.front - 120) / 50)));
      setM(isd, shadow(back, state.back, ZI)); isd.style.opacity = String(clamp((state.back - 10) / 40) * (1 - clamp((state.back - 100) / 8) * 0.0));
      const o = pf.outer;
      setM(wsd, [o[0], o[1], o[2], o[3], o[4] + 10, o[5] + 12]); wsd.style.opacity = String(clamp((state.front - 190) / 55));
    };

    const photo = q('[data-o-photo]');
    const pack = q<SVGGElement>('[data-pack]');
    const pkSvg = q<SVGSVGElement>('[data-pk-svg]');
    const clip = q<SVGGElement>('[data-pk-clip]');
    const pkFar = q<SVGGElement>('[data-pk-sd="far"]'), pkNear = q<SVGGElement>('[data-pk-sd="near"]');
    const pkShade = q('[data-pk-shade]');
    const sheets = qa<SVGGElement>('[data-o-sheet]');
    const rotEls = qa<SVGGElement>('[data-sh-rot]');
    const sdEls = qa<SVGRectElement>('[data-sh-sd]');
    const shEls = qa<SVGRectElement>('[data-sh-shade]');
    const band = q('[data-band]'), bandSd = q('[data-band-sd]'), bandWrap = q('[data-band-wrap]');
    const tag = q('[data-tag]'), tagSd = q('[data-tag-sd]'), tagStr = q('[data-tag-str]'), tagBody = q('[data-tag-body]');
    const steps = qa('[data-step]');
    const sTitles = qa('[data-s-title]');
    const sLines = qa('[data-s-line]');
    const light = q('[data-o-light]');
    const ground = q('[data-o-ground]'), contact = q('[data-o-contact]');
    const note = q('[data-o-note]');
    const title = q('[data-o-title]');
    const panel = q('[data-o-panel]');
    const cavShadow = q('[data-cav-shadow]');
    const inEls = {
      back: q('[data-in="back"]'), right: q('[data-in="right"]'), floor: q('[data-in="floor"]'), depth: q('[data-in="depth"]'),
      left: q('[data-in="left"]'), rim: q('[data-in="rim"]'), flutes: q('[data-in="rimflutes"]'),
    };
    const origin = `${PC[0]} ${PC[1]}`;

    // Sheet rotations are driven through small state objects so each sheet turns about its own centre
    const r0 = rotEls.map((el) => +(el.dataset.r0 || 0));
    const rs = r0.map((r) => ({ r }));
    const paintRots = () => rotEls.forEach((el, i) => setM(el, rotAbout(rs[i].r, lenU / 2, lenV / 2)));

    // Pack poses (pack coordinates are the finished pose; x, y are offsets from it)
    const cx = (A[0] + B[0] + C[0] + D[0]) / 4, cy = (A[1] + B[1] + C[1] + D[1]) / 4;
    const inBox = { x: cx - PC[0], y: cy + 30 - PC[1], scale: 1 };
    const lifted = { x: cx - PC[0] + 6, y: 96 - PC[1], scale: 1.04 };
    const fan = [{ r: -7, x: -15, y: 3 }, { r: -2.5, x: -5, y: -6 }, { r: 2.5, x: 6, y: -15 }, { r: 6.5, x: 15, y: -24 }];

    // Start poses
    gsap.set(photo, { scale: 1.14, opacity: 0.6, yPercent: 2 });
    state.back = 0; state.front = 0; paint(); paintRots();
    gsap.set(pack, { svgOrigin: origin, ...inBox, opacity: 0 });
    gsap.set([pkFar, pkNear], { opacity: 0 });
    gsap.set(pkFar, { x: 26, y: -46 });
    pkSvg.style.zIndex = '2';
    gsap.set(pkShade, { opacity: 0.55 });
    gsap.set(cavShadow, { opacity: 0 });
    gsap.set(Object.values(inEls), { opacity: 0 });
    gsap.set(sheets, { x: 0, y: 0 });
    gsap.set(sdEls, { opacity: 0 });
    gsap.set(shEls, { opacity: 0.4 });
    gsap.set(band, { y: -64, opacity: 0 });
    gsap.set(bandSd, { opacity: 0 });
    gsap.set(bandWrap, { opacity: 0 });
    gsap.set(tag, { y: -54, x: 34, opacity: 0, svgOrigin: `${PC[0] + 40} ${PC[1] - 30}`, rotation: 14 });
    gsap.set(tagSd, { opacity: 0 });
    gsap.set(tagStr, { opacity: 0 });
    gsap.set(tagBody, { opacity: 1 });
    gsap.set(steps, { opacity: 0, y: 30 });
    gsap.set(sTitles, { y: 18 });
    gsap.set(sLines, { y: 28 });
    gsap.set(title, { opacity: 0, y: 34 });
    gsap.set(panel, { scale: 0.965, transformOrigin: '50% 100%' });
    gsap.set(note, { opacity: 0 });
    gsap.set(light, { opacity: 1 });
    gsap.set([ground, contact], { opacity: 0 });
    clip.setAttribute('clip-path', 'url(#o-inbox)');

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: q('[data-o-pin]'), start: 'top top', end: '+=260%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });

    // Beat 1: the parcel arrives and the light settles (0 to 22)
    tl.to(title, { opacity: 1, y: 0, duration: 7, ease: 'power2.out' }, 0)
      .to(panel, { scale: 1, duration: 12, ease: 'power2.out' }, 0)
      .to(photo, { opacity: 1, duration: 8 }, 0)
      .to(photo, { scale: 1, yPercent: 0, duration: 18, ease: 'power3.out' }, 0)
      .to(light, { opacity: 0, duration: 16, ease: 'power1.out' }, 2)
      .to([ground, contact], { opacity: 1, duration: 12, stagger: 3 }, 6);
    steps.forEach((st, i) => {
      const at = 5 + i * 4;
      tl.to(st, { opacity: i === 0 ? 1 : 0.42, y: 0, duration: 7, ease: 'power2.out' }, at)
        .to(sTitles[i], { y: 0, duration: 8, ease: 'power2.out' }, at)
        .to(sLines[i], { y: 0, duration: 9, ease: 'power2.out' }, at + 1.5);
    });

    // Beat 2: the flaps hinge open, the light enters, the pack rises out (24 to 68)
    tl.to(steps[0], { opacity: 0.42, duration: 4 }, 26)
      .to(steps[1], { opacity: 1, duration: 4 }, 28)
      .to(state, { back: FINAL.back, duration: 22, ease: 'power2.inOut', onUpdate: paint }, 28)
      .to(state, { front: FINAL.front, duration: 25, ease: 'power2.inOut', onUpdate: paint }, 30);
    const inOrder = [inEls.back, inEls.right, inEls.floor, inEls.left, inEls.depth, inEls.rim, inEls.flutes];
    inOrder.forEach((el, i) => tl.to(el, { opacity: 1, duration: 5 }, 27 + i * 1.5));
    tl.to(pack, { opacity: 1, duration: 4 }, 42)
      .to(cavShadow, { opacity: 0.8, duration: 5 }, 42)
      .to(shEls, { opacity: 0.55, duration: 8, stagger: 1 }, 44)
      .to(pkShade, { opacity: 0, duration: 14, ease: 'power1.inOut' }, 50)
      .to(pack, { ...lifted, duration: 15, ease: 'power2.inOut' }, 52)
      .to(cavShadow, { opacity: 0, duration: 10 }, 52);
    sheets.forEach((s, i) => {
      tl.to(s, { x: fan[i].x, y: fan[i].y, duration: 14, ease: 'power2.inOut' }, 53)
        .to(rs[i], { r: r0[i] + fan[i].r, duration: 14, ease: 'power2.inOut', onUpdate: paintRots }, 53)
        .to(sdEls[i], { opacity: 1, x: 3 + i * 1.5, y: 4 + i * 2.5, duration: 12, ease: 'power2.inOut' }, 54)
        .to(shEls[i], { opacity: 0.95, duration: 12 }, 54);
    });

    // Beat 3: the pack settles at the front with its band and tag (68 to 100)
    tl.to(steps[1], { opacity: 0.42, duration: 4 }, 68)
      .to(steps[2], { opacity: 1, duration: 4 }, 70)
      .to(pack, { x: 0, y: 0, scale: 1, duration: 22, ease: 'power2.inOut' }, 68)
      .to(pkFar, { opacity: 1, x: 0, y: 0, duration: 18, ease: 'power2.out' }, 76)
      .to(pkNear, { opacity: 1, duration: 10, ease: 'power2.in' }, 84);
    sheets.forEach((s, i) => {
      tl.to(s, { x: 0, y: 0, duration: 14, ease: 'power2.inOut' }, 78)
        .to(rs[i], { r: r0[i], duration: 14, ease: 'power2.inOut', onUpdate: paintRots }, 78)
        .to(sdEls[i], { x: 0, y: 0, opacity: 1, duration: 12, ease: 'power2.inOut' }, 80)
        .to(shEls[i], { opacity: 0.5 + i * 0.1, duration: 12 }, 80);
    });
    tl.to(band, { y: 0, opacity: 1, duration: 7, ease: 'power3.out' }, 90)
      .to(bandSd, { opacity: 1, duration: 6 }, 93)
      .to(bandWrap, { opacity: 1, duration: 4 }, 95)
      .to(tag, { y: 0, x: 0, rotation: 0, opacity: 1, duration: 8, ease: 'power3.out' }, 92)
      .to(tagSd, { opacity: 1, duration: 6 }, 96)
      .to(tagStr, { opacity: 1, duration: 4 }, 97)
      .to(note, { opacity: 1, duration: 6 }, 92)
      .to({}, { duration: 2 }, 98);

    // The pack sits behind the front rim until it has lifted clear, then it passes in front of the folded flap
    tl.eventCallback('onUpdate', () => {
      const p = tl.progress() * 100;
      const want = p < 66 ? 'url(#o-inbox)' : '';
      const has = clip.getAttribute('clip-path') || '';
      if (want && has !== want) clip.setAttribute('clip-path', want);
      if (!want && has) clip.removeAttribute('clip-path');
      pkSvg.style.zIndex = p < 66 ? '2' : '4';
    });

    return () => {
      // Back to the finished pose when the breakpoint changes
      state.back = FINAL.back; state.front = FINAL.front; paint();
      rs.forEach((o, i) => { o.r = r0[i]; }); paintRots();
      clip.removeAttribute('clip-path'); pkSvg.style.zIndex = '';
      gsap.set([photo, pack, pkFar, pkNear, pkShade, cavShadow, band, bandSd, bandWrap, tag, tagSd, tagStr, tagBody, steps, sTitles, sLines, title, panel, note, light, ground, contact, ...sheets, ...sdEls, ...shEls, ...Object.values(inEls)], { clearProps: 'all' });
    };
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
