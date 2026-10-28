import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, clamp, reduced } from './util';

/* The portrait assembles itself out of pixels as it scrolls into view: a grid of cells appears in a diagonal wave with some noise,
   each one first as a block of orange and then as its real piece of the picture. Works for a photo or for the stand-in monogram. */
export async function initPortrait() {
  const fig = q('[data-portrait]');
  if (!fig || reduced || !document.documentElement.classList.contains('js')) return;
  const cv = q<HTMLCanvasElement>('.portrait__cv', fig)!;
  const img = q<HTMLImageElement>('.portrait__img', fig);
  const svg = q<SVGSVGElement>('.portrait__mono', fig);

  const src = await source(img, svg);
  if (!src) return; // anything goes wrong: leave the finished picture showing
  gsap.registerPlugin(ScrollTrigger);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(2, Math.round(fig.clientWidth * dpr));
  const H = Math.max(2, Math.round(fig.clientHeight * dpr));
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const o = off.getContext('2d')!;
  o.imageSmoothingEnabled = !svg; // the monogram stays crisp
  const k = Math.max(W / src.w, H / src.h);
  o.drawImage(src.el, (W - src.w * k) / 2, (H - src.h * k) / 2, src.w * k, src.h * k);

  const cols = 22;
  const rows = Math.max(1, Math.round((cols * H) / W));
  const cw = W / cols;
  const ch = H / rows;
  const t = Array.from({ length: cols * rows }, (_, n) => {
    const x = n % cols;
    const y = Math.floor(n / cols);
    return clamp(((x / cols) * 0.5 + (y / rows) * 0.5) * 0.55 + Math.random() * 0.45);
  });
  const accent = '#ff5a1f';

  const render = (p: number) => {
    ctx.clearRect(0, 0, W, H);
    for (let n = 0; n < t.length; n++) {
      const qv = (p - t[n]) / 0.3;
      if (qv <= 0) continue;
      const x = (n % cols) * cw;
      const y = Math.floor(n / cols) * ch;
      if (qv < 1) {
        ctx.fillStyle = accent;
        ctx.fillRect(x, y, cw + 1, ch + 1);
      } else ctx.drawImage(off, x, y, cw + 1, ch + 1, x, y, cw + 1, ch + 1);
    }
  };

  fig.setAttribute('data-armed', ''); // hides the finished picture, shows the canvas
  render(0);
  ScrollTrigger.create({
    trigger: fig,
    start: 'top 78%',
    once: true,
    onEnter: () => {
      const s = { p: 0 };
      gsap.to(s, { p: 1.3, duration: 1.9, ease: 'power1.inOut', onUpdate: () => render(s.p), onComplete: () => fig.removeAttribute('data-armed') });
    },
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
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      const im = new Image();
      im.src = url;
      await im.decode();
      URL.revokeObjectURL(url);
      // an SVG has no natural pixel size, so rasterise at its viewBox ratio
      const vb = svg.viewBox.baseVal;
      return { el: im, w: vb.width * 60, h: vb.height * 60 };
    }
  } catch {
    /* fall through */
  }
  return null;
}
