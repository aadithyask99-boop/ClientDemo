// @ts-nocheck
// A knitting-needle pointer with an oxblood bead, and a ring that opens over things you can use.
import gsap from 'gsap';
import stagRaw from '../../public/stag.svg?raw';

export function initCursor() {
  const ok = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!ok) return;
  const root = document.documentElement;
  const needle = document.createElement('div'); needle.className = 'cur-n'; needle.setAttribute('aria-hidden', 'true');
  const vb = /viewBox="([^"]+)"/.exec(stagRaw)[1], sd = /d="([^"]+)"/.exec(stagRaw)[1];
  needle.innerHTML = `<svg class="cur-arrow" viewBox="0 0 24 32" width="24" height="32"><path d="M3 2.5 L3 24.5 L8.4 19.6 L12.2 28.2 L15.8 26.6 L12 18.2 L19.2 18.2 Z" fill="#0f1c33" stroke="#f1ede4" stroke-width="1.8" stroke-linejoin="round"/></svg><svg class="cur-stag" viewBox="${vb}" width="26" height="42"><path d="${sd}" fill="#8c2433" stroke="#f1ede4" stroke-width="22" stroke-linejoin="round" paint-order="stroke" fill-rule="evenodd"/></svg>`;
  const ring = document.createElement('div'); ring.className = 'cur-r'; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cur-r__t"></span>';
  document.body.append(ring, needle);
  root.classList.add('has-cursor');

  const label = ring.firstChild;
  let x = -100, y = -100, rx = -100, ry = -100, shown = false;
  const SEL = 'a, button, [role="button"], .swatch, .size, .close, .stile, .card .tile, .feature, .scard, .pcard, .rail, input, label, .qa';
  const set = (cls, on) => ring.classList.toggle(cls, on);

  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; needle.classList.add('is-on'); ring.classList.add('is-on'); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { shown = false; needle.classList.remove('is-on'); ring.classList.remove('is-on'); });
  document.addEventListener('pointerenter', () => { shown = true; needle.classList.add('is-on'); ring.classList.add('is-on'); });
  addEventListener('pointerdown', () => { needle.classList.add('is-down'); ring.classList.add('is-down'); });
  addEventListener('pointerup', () => { needle.classList.remove('is-down'); ring.classList.remove('is-down'); });

  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest ? e.target.closest(SEL) : null;
    let text = '', link = !!t, hide = false;
    if (t) {
      if (t.matches('input, textarea')) { hide = true; link = false; }
      else if (t.closest('[data-add]') || t.matches('[data-add]')) text = 'Add';
      else if (t.closest('.rail, .scard')) text = 'Drag';
      else if (t.closest('.card .tile, .feature')) text = 'View';
    }
    set('is-link', link && !text); set('has-label', !!text); label.textContent = text; needle.classList.toggle('is-link', link && !text);
    needle.classList.toggle('is-hidden', hide || !!text); ring.classList.toggle('is-hidden', hide);
  });

  gsap.ticker.add(() => {
    needle.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  });
}
