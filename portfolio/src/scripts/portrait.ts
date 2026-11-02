import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, q, reduced } from './util';

/* "Every detail, one designer": the picture is resolved by the scroll, both ways. As it enters from the bottom it is a few huge blocks; each bit of scroll
   makes the blocks smaller until the real picture is there (about a third of the way up the screen). Scroll back and it breaks down into blocks again.
   A few blocks flash orange while it is changing. Progress is the scroll position, so it reverses exactly. Works for a photo or for the illustrated
   stand-in (a smooth drawing on purpose: a pixel-art picture is already pixels, so there would be nothing to resolve). Without JS, with reduced motion, or on any failure, the finished
   picture simply sits there. */
const LEVELS = [3, 4, 6, 8, 12, 18, 28, 44]; // blocks across, coarse to fine; after the last one comes the real picture

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
  let full: HTMLCanvasElement;
  const small = document.createElement('canvas');
  const noise = Array.from({ length: 4096 }, () => Math.random());

  const measure = () => {
    W = Math.max(8, Math.round(fig.clientWidth * dpr));
    H = Math.max(8, Math.round(fig.clientHeight * dpr));
    cv.width = W;
    cv.height = H;
    full = document.createElement('canvas');
    full.width = W;
    full.height = H;
    const f = full.getContext('2d')!;
    f.imageSmoothingEnabled = true;
    const k = Math.max(W / src.w, H / src.h);
    f.drawImage(src.el, (W - src.w * k) / 2, (H - src.h * k) / 2, src.w * k, src.h * k);
  };
  try {
    measure();
  } catch {
    return; // the finished picture simply stays
  }

  const ctx = cv.getContext('2d')!;
  fig.classList.add('is-fx');
  let level = 0; // eased progress 0..1
  let target = 0;
  let shown = -1; // which step is on screen

  const render = () => {
    const step = Math.min(LEVELS.length, Math.floor(level * (LEVELS.length + 0.999)));
    if (step === shown) return;
    shown = step;
    if (step >= LEVELS.length) {
      // finished: the real picture takes over
      fig.classList.add('is-done');
      cv.style.visibility = 'hidden';
      return;
    }
    fig.classList.remove('is-done');
    cv.style.visibility = 'visible';
    const cols = LEVELS[step];
    const rows = Math.max(1, Math.round((cols * H) / W));
    small.width = cols;
    small.height = rows;
    const s = small.getContext('2d')!;
    s.imageSmoothingEnabled = true; // averaging down gives each block its average colour
    s.drawImage(full, 0, 0, cols, rows);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(small, 0, 0, cols, rows, 0, 0, W, H);
    // a few blocks flash orange, fewer as the picture gets finer
    const share = 0.07 * (1 - step / LEVELS.length);
    ctx.fillStyle = '#ff5a1f';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (noise[(r * 53 + c * 17 + step * 331) % 4096] < share) ctx.fillRect(Math.floor((c * W) / cols), Math.floor((r * H) / rows), Math.ceil(W / cols), Math.ceil(H / rows));
      }
    }
  };

  // Progress comes from ScrollTrigger (the same machinery that drives the Site Chemistry scene): 0 as the top edge of the picture climbs past 95% of the
  // screen, 1 once it is about a fifth of the way down (72% of a screen of travel). Scrolling back runs it the other way.
  gsap.registerPlugin(ScrollTrigger);
  const st = ScrollTrigger.create({
    trigger: fig,
    start: () => `top ${window.innerHeight * 0.95}px`,
    end: () => `top ${window.innerHeight * 0.23}px`,
    invalidateOnRefresh: true,
    onUpdate: (self) => { target = self.progress; },
    onRefresh: (self) => { target = self.progress; },
  });
  target = st.progress;
  level = target;
  render();
  window.addEventListener('resize', () => { measure(); shown = -1; }, { passive: true });
  gsap.ticker.add(() => {
    level += (target - level) * 0.2;
    if (Math.abs(target - level) < 0.001) level = target;
    render();
  });
}

/* load events rather than decode(): decode() rejects for some SVG images in some browsers, which would silently switch the effect off */
function loaded(im: HTMLImageElement) {
  return new Promise<void>((resolve) => {
    if (im.complete) return resolve();
    im.addEventListener('load', () => resolve(), { once: true });
    im.addEventListener('error', () => resolve(), { once: true });
    window.setTimeout(resolve, 4000);
  });
}

async function source(img: HTMLImageElement | null, svg: SVGSVGElement | null): Promise<{ el: CanvasImageSource; w: number; h: number } | null> {
  try {
    if (img) {
      img.loading = 'eager';
      await loaded(img);
      return img.naturalWidth ? { el: img, w: img.naturalWidth, h: img.naturalHeight } : null;
    }
    if (svg) {
      const vb = svg.viewBox.baseVal;
      const w = 800;
      const h = Math.round((800 * vb.height) / vb.width);
      // the serializer already writes the xmlns attribute for an inline svg; writing it twice is invalid XML, which Firefox and Safari refuse to load as an image
      // (Chromium forgives it), and the effect then silently never started. Size is moderate for the same reason: very large SVG images fail on some browsers.
      let xml = new XMLSerializer().serializeToString(svg).replace(/^<svg\b/, `<svg width="${w}" height="${h}"`);
      if (!/^<svg[^>]*\sxmlns=/.test(xml)) xml = xml.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
      const im = new Image();
      im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      await loaded(im);
      return im.naturalWidth ? { el: im, w, h } : null;
    }
  } catch {
    /* fall through */
  }
  return null;
}
