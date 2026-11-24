// Quote sheet: opens from any [data-open-quote] (or a 'quote:open' event), closes on Esc, backdrop or Close.
// Focus moves in and returns, Tab stays inside, scroll is locked while open. Stays open on the confirmation.
import { getLenis } from './core';

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-sheet]');
  if (!root) return;
  const panel = root.querySelector<HTMLElement>('[data-panel]')!;
  const html = document.documentElement;
  let opener: HTMLElement | null = null;
  let isOpen = false;

  const focusables = () => [...panel.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hasAttribute('disabled') && !el.closest('[hidden]') && el.offsetParent !== null);

  function open(from?: HTMLElement | null) {
    if (isOpen) return;
    isOpen = true;
    opener = from || (document.activeElement as HTMLElement | null);
    root!.removeAttribute('inert');
    root!.classList.add('is-open');
    const sbw = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    if (sbw > 0) { document.body.style.paddingRight = `${sbw}px`; document.querySelector<HTMLElement>('[data-nav]')?.style.setProperty('padding-right', `${sbw}px`); }
    getLenis()?.stop();
    (panel.querySelector('.qs-chip') as HTMLElement | null)?.focus({ preventScroll: true });
    panel.scrollTop = 0;
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    root!.classList.remove('is-open');
    root!.setAttribute('inert', '');
    html.style.overflow = '';
    document.body.style.paddingRight = '';
    document.querySelector<HTMLElement>('[data-nav]')?.style.removeProperty('padding-right');
    getLenis()?.start();
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }

  document.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-quote]');
    if (t) { e.preventDefault(); open(t); }
  });
  window.addEventListener('quote:open', () => open());
  document.addEventListener('keydown', (e) => { if (isOpen && e.key === 'Escape' && !panel.contains(document.activeElement) && !root.querySelector('[data-menu]:not([hidden])')) close(); });
  root.querySelectorAll('[data-sheet-close]').forEach((el) => el.addEventListener('click', close));

  // Capture phase: if a chip menu is open, Esc closes that menu first and leaves the sheet alone
  root.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      if (root.querySelector('[data-menu]:not([hidden])')) return;
      e.preventDefault(); e.stopPropagation(); close();
    } else if (e.key === 'Tab') {
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || !panel.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !panel.contains(a))) { e.preventDefault(); first.focus(); }
    }
  }, true);
}
