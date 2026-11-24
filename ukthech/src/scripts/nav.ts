// Nav: mega-menu on hover or focus (keyboard: arrows, Escape), light pills over paper sections, phone menu sheet.
import { desktop, getLenis, media, scrollToEl } from './core';

export default function init() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  const bar = nav.querySelector<HTMLElement>('[data-bar]')!;
  const mega = nav.querySelector<HTMLElement>('[data-mega]')!;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('.nav-link')];
  const lists = [...nav.querySelectorAll<HTMLElement>('.mega-list')];
  const imgs = [nav.querySelector<HTMLImageElement>('[data-a]')!, nav.querySelector<HTMLImageElement>('[data-b]')!];
  const menuBtn = nav.querySelector<HTMLButtonElement>('[data-menu-btn]')!;
  const msheet = nav.querySelector<HTMLElement>('[data-msheet]')!;
  let active = -1;
  let closeTimer = 0;
  let ptr = 'mouse';
  let shown = '';
  let front = 0;

  const openQuote = () => window.dispatchEvent(new CustomEvent('quote:open'));
  const imageFor = (i: number, j: number) => media(links[i].dataset.image + (j % 2 ? '-alt' : ''));

  // ---- Live preview: two stacked images that crossfade when the hovered item changes
  function preview(i: number, j: number) {
    const src = imageFor(i, j);
    if (src === shown) return;
    shown = src;
    const next = imgs[1 - front];
    const prev = imgs[front];
    let done = false;
    const show = () => { if (done || shown !== src) return; done = true; next.classList.add('is-on'); prev.classList.remove('is-on'); front = 1 - front; };
    next.onload = show;
    next.src = src;
    if (next.complete && next.naturalWidth) show();
  }
  let warmed = false;
  const warm = () => {
    if (warmed) return; warmed = true;
    links.forEach((_, i) => [0, 1].forEach((j) => { const im = new Image(); im.src = imageFor(i, j); }));
  };

  // ---- Mega-menu
  function open(i: number) {
    if (!desktop()) return;
    clearTimeout(closeTimer);
    warm();
    if (active === i) return;
    active = i;
    links.forEach((l, k) => { l.classList.toggle('is-open', k === i); l.setAttribute('aria-expanded', String(k === i)); });
    lists.forEach((l, k) => { l.hidden = k !== i; });
    lists[i].querySelectorAll('a').forEach((a) => a.classList.remove('is-active'));
    mega.classList.add('is-open');
    preview(i, 0);
  }
  function close() {
    clearTimeout(closeTimer);
    if (active < 0) return;
    active = -1;
    links.forEach((l) => { l.classList.remove('is-open'); l.setAttribute('aria-expanded', 'false'); });
    mega.classList.remove('is-open');
  }
  const closeSoon = () => { clearTimeout(closeTimer); closeTimer = window.setTimeout(close, 140); };

  document.addEventListener('pointerdown', (e) => { ptr = e.pointerType; }, true);
  links.forEach((l, i) => {
    l.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') open(i); });
    l.addEventListener('focus', () => open(i));
    l.addEventListener('click', (e) => {
      // On touch, the first tap opens the menu and the second follows the link
      if (ptr === 'touch' && desktop() && active !== i) { e.preventDefault(); open(i); return; }
      e.preventDefault(); close(); go(l.getAttribute('href') || '');
    });
    l.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); open(i); (lists[i].querySelector('a') as HTMLElement | null)?.focus(); }
      else if (e.key === 'Escape') { close(); }
    });
  });
  lists.forEach((list, i) => {
    const items = [...list.querySelectorAll<HTMLAnchorElement>('a')];
    items.forEach((a, j) => {
      const on = () => { items.forEach((x) => x.classList.toggle('is-active', x === a)); preview(i, j); };
      a.addEventListener('pointerenter', on);
      a.addEventListener('focus', on);
      a.addEventListener('click', (e) => { e.preventDefault(); close(); openQuote(); });
      a.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(j + 1) % items.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (j === 0) links[i].focus(); else items[j - 1].focus(); }
        else if (e.key === 'Escape' || e.key === 'ArrowLeft') { e.preventDefault(); links[i].focus(); if (e.key === 'Escape') close(); }
      });
    });
  });
  bar.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  bar.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') closeSoon(); });
  nav.querySelectorAll('.nav-logo, .nav-tel, .nav-cta').forEach((el) => el.addEventListener('pointerenter', () => close()));
  bar.addEventListener('focusout', (e) => { if (!bar.contains((e as FocusEvent).relatedTarget as Node)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (active >= 0) { const l = links[active]; close(); if (bar.contains(document.activeElement)) l.focus(); } if (menuOpen) setMenu(false); } });
  document.addEventListener('pointerdown', (e) => { if (active >= 0 && !bar.contains(e.target as Node)) close(); });

  // ---- Navigation targets: scroll to the section, or open the sheet if it is not on the page
  function go(href: string) {
    if (href === '#top') { getLenis() ? getLenis()!.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (href === '#quote' && !document.querySelector('#quote, [data-quote]')) return openQuote();
    const t = href.startsWith('#') && href.length > 1 ? document.querySelector(href) || (href === '#quote' ? document.querySelector('[data-quote]') : null) : null;
    if (t) scrollToEl(t); else openQuote();
  }
  nav.querySelector('.nav-logo')!.addEventListener('click', (e) => { e.preventDefault(); setMenu(false); go('#top'); });

  // ---- Phone menu: a full-screen list, no hover mega-menu
  let menuOpen = false;
  function setMenu(on: boolean) {
    if (on === menuOpen) return;
    menuOpen = on;
    nav.classList.toggle('is-menu', on);
    msheet.toggleAttribute('inert', !on);
    menuBtn.setAttribute('aria-expanded', String(on));
    menuBtn.textContent = on ? 'Close' : 'Menu';
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (on) getLenis()?.stop(); else getLenis()?.start();
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  msheet.querySelectorAll<HTMLAnchorElement>('.nav-sheet-list a').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); setMenu(false); requestAnimationFrame(() => go(a.getAttribute('href') || '')); });
  });
  window.addEventListener('quote:open', () => setMenu(false));
  matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); else close(); });

  // ---- Pills turn light while the nav sits over a paper section
  let io: IntersectionObserver | null = null;
  const lightEls = [...document.querySelectorAll<HTMLElement>('.stage--paper, [data-nav-light]')];
  function watch() {
    io?.disconnect();
    const over = new Set<Element>();
    const band = 63; // the nav's vertical extent
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) over.add(en.target); else over.delete(en.target); });
      nav.classList.toggle('is-light', over.size > 0);
    }, { rootMargin: `-20px 0px -${Math.max(0, innerHeight - band)}px 0px`, threshold: 0 });
    lightEls.forEach((el) => io!.observe(el));
  }
  watch();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(watch, 150); });
}
