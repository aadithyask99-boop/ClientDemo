import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, reduced } from './util';

/* Text that is built from pixels, after PRODUX: a front sweeps left to right through each word. On the front, blocks of the page's orange (and a few
   of the text's own colour) flash up; behind it the letters are simply there. The real text stays in the page the whole time (this only masks it),
   so search engines and screen readers read it normally; with no JavaScript or with reduced motion nothing is masked at all.
   It plays when the heading scrolls in and runs backwards if you scroll back above it. */
const ORANGE = '#ff5a1f';
const BAND = 0.3; // how wide the block front is, as a share of the word
const ROWS = 5;

interface Word {
  box: HTMLElement;
  text: HTMLElement;
  cv: HTMLCanvasElement;
  ink: string;
  noise: number[];
  state: { p: number };
}

export function pixelWords(el: HTMLElement, opts: { start?: string; stagger?: number; trigger?: Element } = {}) {
  if (reduced || !document.documentElement.classList.contains('js')) return;
  const words: Word[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if ((n.textContent ?? '').trim()) nodes.push(n as Text);

  nodes.forEach((node) => {
    const parts = (node.textContent ?? '').split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      if (!part.trim()) { frag.append(part); return; }
      const box = document.createElement('span');
      box.className = 'pw';
      const text = document.createElement('span');
      text.className = 'pw__t';
      text.textContent = part;
      const cv = document.createElement('canvas');
      cv.className = 'pw__cv';
      cv.setAttribute('aria-hidden', 'true');
      box.append(text, cv);
      frag.append(box);
      words.push({ box, text, cv, ink: '', noise: [], state: { p: 0 } });
    });
    node.replaceWith(frag);
  });
  if (!words.length) return;

  const draw = (w: Word) => {
    const p = w.state.p;
    const { text, cv } = w;
    const ctx = cv.getContext('2d')!;
    if (p <= 0) { text.style.clipPath = 'inset(-20% 100% -20% 0)'; ctx.clearRect(0, 0, cv.width, cv.height); return; }
    if (p >= 1) { text.style.clipPath = 'none'; ctx.clearRect(0, 0, cv.width, cv.height); return; }
    const W = w.box.offsetWidth;
    const H = w.box.offsetHeight;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (!w.ink) {
      w.ink = getComputedStyle(w.text).color;
      w.noise = Array.from({ length: 128 }, () => Math.random());
    }
    const front = p * (1 + BAND);
    text.style.clipPath = `inset(-20% ${(1 - clamp(front - BAND * 0.55)) * 100}% -20% 0)`;
    ctx.clearRect(0, 0, W, H);
    const cell = H / ROWS;
    const cols = Math.max(1, Math.ceil(W / cell));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < ROWS; r++) {
        const n = w.noise[(r * 11 + c * 7) % 128];
        const s = front - (c + 0.5) / cols - n * BAND * 0.5;
        if (s <= 0 || s >= BAND * 0.9) continue;
        if (n < 0.2) continue; // a few holes keep it ragged
        ctx.globalAlpha = s < BAND * 0.5 ? 1 : 1 - (s - BAND * 0.5) / (BAND * 0.4);
        ctx.fillStyle = w.noise[(r * 5 + c * 13) % 128] < 0.22 ? w.ink : ORANGE;
        ctx.fillRect(Math.floor(c * cell), Math.floor(r * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }
    ctx.globalAlpha = 1;
  };

  const step = opts.stagger ?? 0.08;
  words.forEach(draw);
  const tl = gsap.timeline({ paused: true });
  words.forEach((w, i) => tl.to(w.state, { p: 1, duration: 0.7, ease: 'power1.inOut', onUpdate: () => draw(w) }, i * step));
  ScrollTrigger.create({
    trigger: opts.trigger ?? el,
    start: opts.start ?? 'top 82%',
    onEnter: () => tl.timeScale(1).play(),
    onLeaveBack: () => tl.timeScale(1.6).reverse(),
  });
}
