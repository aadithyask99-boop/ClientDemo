// A gold embroidery thread stitches itself down the whole page, passing through every section's knot.
import { chime } from './audio';


export function initThread(reduce: boolean): () => void {
  const svg = document.getElementById('thread') as unknown as SVGSVGElement;
  const line = document.getElementById('thread-line') as unknown as SVGPathElement;
  const ghost = document.getElementById('thread-ghost') as unknown as SVGPathElement;
  const needle = document.getElementById('needle') as unknown as SVGGElement;

  let total = 0;
  let samples: { l: number; y: number }[] = [];

  type Pt = { x: number; y: number; knot: boolean };
  let sideCount = 0;
  const anchor = (el: HTMLElement): Pt => {
    const W = document.documentElement.clientWidth;
    const knot = el.querySelector<HTMLElement>('.knot');
    const r = (knot ?? el).getBoundingClientRect();
    if (knot) return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY, knot: true };
    // Sections without a knot: on wide screens the thread swings out to alternate margins so it never crosses text;
    // on phones it keeps to the left margin.
    // (left margin before the journey, right margin after it, so it only crosses the page at the journey spine)
    const x = W >= 900 ? (sideCount++ === 0 ? W * 0.1 : W * 0.92) : Math.max(30, W * 0.08);
    return { x, y: r.top + scrollY + Math.min(r.height * 0.1, 56), knot: false };
  };

  const build = () => {
    const W = document.documentElement.clientWidth;
    const H = document.body.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.height = `${H}px`;
    const wide = W >= 900;
    sideCount = 0;

    const pts: Pt[] = [];
    const cue = document.querySelector<HTMLElement>('.getting');
    if (cue) { const r = cue.getBoundingClientRect(); pts.push({ x: W / 2, y: r.bottom + scrollY + 6, knot: false }); }
    document.querySelectorAll<HTMLElement>('[data-knot]').forEach((el) => pts.push(anchor(el)));
    const finale = document.getElementById('finale');
    if (finale) pts.push({ x: wide ? W * 0.92 : Math.max(30, W * 0.08), y: finale.getBoundingClientRect().top + scrollY + 30, knot: false });
    const swans = document.getElementById('swans');
    if (swans) { const r = swans.getBoundingClientRect(); pts.push({ x: W / 2, y: r.top + scrollY + r.height * 0.55, knot: false }); }

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dy = b.y - a.y;
      // vertical tangents make an S between the points; a little sway keeps runs along one margin from looking ruled
      const sway = (a.knot && b.knot ? (wide ? 46 : 0) : wide ? 0 : 12) * (i % 2 ? 1 : -1);
      d += ` C ${a.x + sway} ${a.y + dy * 0.45}, ${b.x - sway} ${b.y - dy * 0.45}, ${b.x} ${b.y}`;
    }
    line.setAttribute('d', d);
    ghost.setAttribute('d', d);
    total = line.getTotalLength();
    line.style.strokeDasharray = `${total}`;
    samples = [];
    const n = 700;
    for (let i = 0; i <= n; i++) {
      const l = (total * i) / n;
      samples.push({ l, y: line.getPointAtLength(l).y });
    }
    update();
  };

  const lengthAtY = (y: number) => {
    if (y <= samples[0].y) return 0;
    if (y >= samples[samples.length - 1].y) return total;
    let lo = 0;
    let hi = samples.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].y < y) lo = mid; else hi = mid;
    }
    return samples[lo].l;
  };

  const update = () => {
    if (!total) return;
    const len = reduce ? total : lengthAtY(scrollY + innerHeight * 0.62);
    line.style.strokeDashoffset = `${total - len}`;
    if (reduce) { needle.style.display = 'none'; return; }
    const p = line.getPointAtLength(len);
    const q = line.getPointAtLength(Math.min(total, len + 3));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    needle.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`);
  };

  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  window.addEventListener('scroll', onScroll, { passive: true });
  let t = 0;
  const rebuild = () => { clearTimeout(t); t = window.setTimeout(build, 120); };
  window.addEventListener('resize', rebuild);
  new ResizeObserver(rebuild).observe(document.body);
  document.fonts?.ready.then(rebuild);
  window.addEventListener('load', rebuild);

  let step = 0;
  needle.addEventListener('click', () => chime(step++ % 8, 0.9));
  build();
  return build;
}
