import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, clamp, reduced } from './util';

/* The picture is driven by the scroll, both ways. In the middle of the screen it is sharp; as it moves toward the top or bottom edge it breaks into
   bigger and bigger pixels, and it puts itself back together when you scroll back. Works for a photo or for the pixel-art stand-in. */
export async function initPortrait() {
  const fig = q('[data-portrait]');
  if (!fig || reduced || !document.documentElement.classList.contains('js')) return;
  const cv = q<HTMLCanvasElement>('.portrait__cv', fig)!;
  const img = q<HTMLImageElement>('.portrait__img', fig);
  const svg = q<SVGSVGElement>('.portrait__face', fig);

  const src = await source(img, svg);
  if (!src) return; // anything goes wrong: the finished picture simply stays
  gsap.registerPlugin(ScrollTrigger);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(2, Math.round(fig.clientWidth * dpr));
  const H = Math.max(2, Math.round(fig.clientHeight * dpr));
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  const full = document.createElement('canvas');
  full.width = W;
  full.height = H;
  const f = full.getContext('2d')!;
  f.imageSmoothingEnabled = !svg; // the pixel-art stand-in stays crisp
  const k = Math.max(W / src.w, H / src.h);
  f.drawImage(src.el, (W - src.w * k) / 2, (H - src.h * k) / 2, src.w * k, src.h * k);
  const small = document.createElement('canvas');
  const s = small.getContext('2d')!;

  const maxBlock = fig.clientWidth / 9; // coarsest: about nine blocks across
  let target = 1;
  let level = 1;
  let shown = -1;

  const render = () => {
    if (Math.abs(level - shown) < 0.003) return;
    shown = level;
    if (level < 0.02) { cv.style.visibility = 'hidden'; return; }
    const block = Math.max(1, 1 + Math.pow(level, 1.15) * (maxBlock - 1)) * dpr;
    const bw = Math.max(2, Math.round(W / block));
    const bh = Math.max(2, Math.round(H / block));
    small.width = bw;
    small.height = bh;
    s.imageSmoothingEnabled = true; // averaging down gives each block its average colour
    s.drawImage(full, 0, 0, bw, bh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, bw, bh, 0, 0, W, H);
    cv.style.visibility = 'visible';
  };

  // 0 at the centre of the screen, 1 at the edges; the picture stays fully sharp across the middle band, then breaks up toward the edges
  ScrollTrigger.create({
    trigger: fig,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const d = Math.abs(self.progress - 0.5) * 2;
      const t = clamp((d - 0.3) / 0.6);
      target = t * t * (3 - 2 * t);
    },
  });
  gsap.ticker.add(() => {
    level += (target - level) * 0.14; // eases, so it never snaps
    render();
  });
  render();
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
