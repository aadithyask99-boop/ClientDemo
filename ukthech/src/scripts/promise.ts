// Promise: the desk lamp warms as the pointer or a dragged file nears the in-tray (or the lamp). A chosen file keeps it lit.
// Parallax: the photograph drifts with scroll and the pointer. Everything here is light and position; the drop zone is a real file input.
import { gsap, ScrollTrigger, reduced, finePointer, desktop } from './core';

// Positions in the 1376 x 768 photograph, as fractions of its width (y is converted with the aspect ratio)
const TRAY = { x: 0.334, y: 0.8 };
const LAMP = { x: 0.778, y: 0.27 };
const ASPECT = 768 / 1376;

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-promise]');
  if (!root) return;
  const wrap = root.querySelector<HTMLElement>('[data-p-wrap]')!;
  const input = root.querySelector<HTMLInputElement>('[data-p-file]')!;
  const after = root.querySelector<HTMLElement>('[data-p-after]')!;
  const nameEl = root.querySelector<HTMLElement>('[data-p-name]')!;
  const scene = root.querySelector<HTMLElement>('[data-p-scene]')!;

  let hasFile = false;
  const lit = { v: 0 };
  const paintLit = () => root.style.setProperty('--lit', lit.v.toFixed(3));
  const setLit = (target: number, dur = 0.9) => {
    const t = hasFile ? 1 : target;
    if (reduced) { lit.v = t; paintLit(); return; }
    gsap.to(lit, { v: t, duration: dur, ease: 'power2.out', overwrite: true, onUpdate: paintLit });
  };

  const prox = (clientX: number, clientY: number) => {
    const r = wrap.getBoundingClientRect();
    const px = (clientX - r.left) / r.width;
    const py = ((clientY - r.top) / r.width); // in widths, so distances are isotropic
    const dTray = Math.hypot(px - TRAY.x, py - TRAY.y * ASPECT);
    const dLamp = Math.hypot(px - LAMP.x, py - LAMP.y * ASPECT);
    const a = Math.max(0, 1 - dTray / 0.32);
    const b = Math.max(0, 1 - dLamp / 0.2) * 0.75;
    return { v: Math.max(a, b), px, py };
  };

  // Pointer: light follows closeness, photograph shifts a little
  const xTo = reduced ? null : gsap.quickTo(wrap, 'x', { duration: 1.2, ease: 'power3.out' });
  if (finePointer) {
    root.addEventListener('pointermove', (e) => {
      const p = prox(e.clientX, e.clientY);
      setLit(p.v, 0.7);
      if (xTo) xTo((0.5 - (e.clientX / innerWidth)) * 44);
    });
    root.addEventListener('pointerleave', () => { setLit(0, 1.2); xTo?.(0); });
  }

  // Dragging a file anywhere near: light up, show the label, and accept a drop that misses the tray
  let dragDepth = 0;
  const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  window.addEventListener('dragenter', (e) => { if (hasFiles(e)) { dragDepth++; root.classList.add('is-drag'); } });
  window.addEventListener('dragleave', (e) => { if (hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; root.classList.remove('is-drag'); setLit(0, 1); } });
  window.addEventListener('dragover', (e) => {
    if (!hasFiles(e)) return;
    const r = root.getBoundingClientRect();
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) { e.preventDefault(); setLit(Math.max(0.55, prox(e.clientX, e.clientY).v), 0.4); }
  });
  window.addEventListener('drop', (e) => {
    dragDepth = 0; root.classList.remove('is-drag');
    if (!hasFiles(e)) return;
    const r = root.getBoundingClientRect();
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside && e.target !== input) {
      e.preventDefault();
      const f = e.dataTransfer!.files[0];
      if (f) { const dt = new DataTransfer(); dt.items.add(f); input.files = dt.files; chosen(); }
    }
  });

  const chosen = () => {
    const f = input.files && input.files[0];
    if (!f) return;
    hasFile = true;
    root.classList.add('has-file');
    after.hidden = false;
    nameEl.textContent = f.name;
    setLit(1, 1.1);
  };
  input.addEventListener('change', chosen);
  // Tapping or clicking the tray warms the lamp straight away, even before a file is picked
  input.addEventListener('click', () => setLit(1, 0.5));
  input.addEventListener('focus', () => { if (!hasFile) setLit(0.6, 0.6); });
  input.addEventListener('blur', () => { if (!hasFile) setLit(0, 1); });

  // Scroll parallax (desktop): the photograph drifts up a touch as the section passes
  if (!reduced && desktop()) {
    gsap.fromTo(wrap, { y: 6 }, { y: -22, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 1 } });
  }
  // Phones: a gentle light pulse the first time the desk is seen, so the tray reads as live
  if (!reduced && !finePointer) {
    ScrollTrigger.create({ trigger: scene, start: 'top 60%', once: true, onEnter: () => {
      if (hasFile) return;
      gsap.to(lit, { v: 0.5, duration: 1.2, ease: 'power2.out', onUpdate: paintLit });
      gsap.to(lit, { v: 0, duration: 1.8, ease: 'power2.inOut', delay: 1.8, onUpdate: paintLit });
    } });
  }
}
