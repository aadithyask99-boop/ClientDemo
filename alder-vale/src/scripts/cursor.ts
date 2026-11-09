// @ts-nocheck
// A knitting-needle pointer with an oxblood bead, and a ring that opens over things you can use.
import gsap from 'gsap';

export function initCursor() {
  const ok = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!ok) return;
  const root = document.documentElement;
  const needle = document.createElement('div'); needle.className = 'cur-n'; needle.setAttribute('aria-hidden', 'true');
  needle.innerHTML = '<svg viewBox="0 0 40 40" width="40" height="40"><line x1="3" y1="3" x2="31" y2="31" stroke="#0f1c33" stroke-width="5.2" stroke-linecap="round"/><circle cx="34" cy="34" r="5" fill="#0f1c33"/><line x1="3" y1="3" x2="31" y2="31" stroke="#f1ede4" stroke-width="2.4" stroke-linecap="round"/><circle cx="34" cy="34" r="3.4" fill="#8c2433"/></svg>';
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
    set('is-link', link && !text); set('has-label', !!text); label.textContent = text;
    needle.classList.toggle('is-hidden', hide || !!text); ring.classList.toggle('is-hidden', hide);
  });

  gsap.ticker.add(() => {
    needle.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  });
}
