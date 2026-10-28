import { gsap } from 'gsap';
import { clamp, q, reduced } from './util';

/* "Every detail, one designer": the picture is built by the scroll, and taken apart again when you scroll back up.
   A front sweeps down the picture. Ahead of it there is nothing; on it, blocks flash orange (a few dark) as they arrive; just behind it they settle
   into flat blocks of the picture's average colour; behind that, the real picture. Progress is the scroll position, so it reverses exactly.
   Works for a photo or for the pixel-art stand-in. Without JS, with reduced motion, or if anything fails, the finished picture simply sits there. */
const COLS = 16;
const JITTER = 0.12; // how ragged the front is
const EDGE = 0.05; // orange band
const MOSAIC = 0.16; // flat-colour band behind it
const FULL = 1 + JITTER + MOSAIC;

export async function initPortrait() {
  const fig = q('[data-portrait]');
  if (!fig || reduced || !document.documentElement.classList.contains('js')) return;
  const cv = q<HTMLCanvasElement>('.portrait__cv', fig)!;
  const img = q<HTMLImageElement>('.portrait__img', fig);
  const svg = q<SVGSVGElement>('.portrait__face', fig);

  const src = await source(img, svg);
  if (!src) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0;
  let H = 0;
  let cell = 0;
  let rows = 0;
  let jit: number[] = [];
  let tone: number[] = [];
  let avg: string[] = [];
  let full: HTMLCanvasElement;

  const measure = () => {
    W = Math.max(COLS, Math.round(fig.clientWidth * dpr));
    H = Math.max(2, Math.round(fig.clientHeight * dpr));
    cv.width = W;
    cv.height = H;
    cell = W / COLS;
    rows = Math.ceil(H / cell);
    full = document.createElement('canvas');
    full.width = W;
    full.height = H;
    const f = full.getContext('2d')!;
    f.imageSmoothingEnabled = !svg; // the pixel-art stand-in stays crisp
    const k = Math.max(W / src.w, H / src.h);
    f.drawImage(src.el, (W - src.w * k) / 2, (H - src.h * k) / 2, src.w * k, src.h * k);
    // one average colour per block
    const small = document.createElement('canvas');
    small.width = COLS;
    small.height = rows;
    const s = small.getContext('2d')!;
    s.imageSmoothingEnabled = true;
    s.drawImage(full, 0, 0, COLS, rows);
    const d = s.getImageData(0, 0, COLS, rows).data;
    avg = [];
    for (let i = 0; i < COLS * rows; i++) avg.push(`rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]})`);
  };
  measure();
  // a fixed random pattern, so scrolling back and forth always gives the same picture
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  jit = Array.from({ length: COLS * 64 }, () => rnd() * JITTER);
  tone = Array.from({ length: COLS * 64 }, () => rnd());

  const ctx = cv.getContext('2d')!;
  fig.classList.add('is-fx');
  let level = 0; // eased progress 0..1
  let target = 0;
  let shown = -1;

  const render = () => {
    if (Math.abs(level - shown) < 0.0015 && level !== 1 && level !== 0) return;
    if (level === shown) return;
    shown = level;
    if (level >= 0.9995) {
      // finished: the real picture takes over
      fig.classList.add('is-done');
      cv.style.visibility = 'hidden';
      return;
    }
    fig.classList.remove('is-done');
    cv.style.visibility = 'visible';
    ctx.clearRect(0, 0, W, H);
    const front = level * FULL;
    for (let r = 0; r < rows; r++) {
      const y = r / rows;
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const s = front - y - jit[i];
        if (s < 0) continue;
        const x = Math.floor(c * cell);
        const yy = Math.floor(r * cell);
        const w = Math.ceil(cell) + 1;
        if (s < EDGE) {
          ctx.fillStyle = tone[i] < 0.18 ? '#2b2b2b' : '#ff5a1f';
          ctx.fillRect(x, yy, w, w);
        } else if (s < MOSAIC) {
          ctx.fillStyle = avg[i];
          ctx.fillRect(x, yy, w, w);
        } else {
          ctx.drawImage(full, x, yy, w, w, x, yy, w, w);
        }
      }
    }
  };

  // scroll position decides: starts as the top edge climbs past 92% of the screen, finishes after 70% of a screen of travel
  const progress = () => clamp((window.innerHeight * 0.92 - fig.getBoundingClientRect().top) / (window.innerHeight * 0.7));
  target = progress();
  level = target;
  render();
  window.addEventListener('scroll', () => { target = progress(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); shown = -1; target = progress(); }, { passive: true });
  gsap.ticker.add(() => {
    level += (target - level) * 0.16; // eases, so it never snaps
    if (Math.abs(target - level) < 0.0008) level = target;
    render();
  });
}

async function source(img: HTMLImageElement | null, svg: SVGSVGElement | null): Promise<{ el: CanvasImageSource; w: number; h: number } | null> {
  try {
    if (img) {
      img.loading = 'eager';
      await img.decode();
      return { el: img, w: img.naturalWidth, h: img.naturalHeight };
    }
    if (svg) {
      const vb = svg.viewBox.baseVal;
      const xml = new XMLSerializer().serializeToString(svg).replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${vb.width * 40}" height="${vb.height * 40}"`);
      const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
      const im = new Image();
      im.src = url;
      await im.decode();
      URL.revokeObjectURL(url);
      return { el: im, w: vb.width * 40, h: vb.height * 40 };
    }
  } catch {
    /* fall through */
  }
  return null;
}
