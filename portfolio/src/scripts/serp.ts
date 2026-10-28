import { site } from '../data/site';
import { lockScroll, reduced } from './util';

/* Easter egg: type "seo" anywhere. A search results page opens with a made-up query and this site at number eight,
   then it climbs to number one. Every rival is invented (and lives on the reserved .example domain). */
const RIVALS: [string, string][] = [
  ['Template Mill: 4,000 themes, zero personality', 'template-mill.example'],
  ['Cheap Best SEO Web Design Near Me Best | Keyword Stuffers Ltd', 'keyword-stuffers.example'],
  ['Flash-Only Studio: now loads in 14 seconds', 'flash-only.example'],
  ['Mega Plugin Pack: 63 plugins, one very slow site', 'plugin-pack.example'],
  ['Stock Photo Agency: "handshake over laptop" x900', 'stock-photos.example'],
  ['Lorem Ipsum Digital: we will write this later', 'lorem-digital.example'],
  ['Another Agency Website With A Carousel', 'carousel-agency.example'],
];

let open = false;

function item(title: string, url: string, me: boolean, desc = '') {
  const li = document.createElement('li');
  li.className = `serp__item${me ? ' is-me' : ''}`;
  const u = document.createElement('span');
  u.className = 'serp__url';
  u.textContent = url;
  const t = document.createElement('span');
  t.className = 'serp__title';
  t.textContent = title;
  const d = document.createElement('span');
  d.className = 'serp__desc';
  d.textContent = desc;
  li.append(u, t, d);
  if (me) {
    const b = document.createElement('span');
    b.className = 'serp__badge';
    b.textContent = '#1';
    li.append(b);
  }
  return li;
}

export async function openSerp() {
  if (open) return;
  open = true;
  const [{ gsap }, { Flip }] = await Promise.all([import('gsap'), import('gsap/Flip')]);
  gsap.registerPlugin(Flip);
  const prevFocus = document.activeElement as HTMLElement | null;

  const overlay = document.createElement('div');
  overlay.className = 'serp';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Easter egg: a search results page');
  overlay.tabIndex = -1;
  overlay.innerHTML = `
    <div class="serp__card">
      <div class="serp__bar">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6"/><path d="m13 13 5 5"/></svg>
        <span>cool seo-friendly websites</span>
      </div>
      <ol class="serp__list"></ol>
      <p class="serp__note"></p>
    </div>`;
  const card = overlay.querySelector<HTMLElement>('.serp__card')!;
  const list = overlay.querySelector<HTMLElement>('.serp__list')!;
  const note = overlay.querySelector<HTMLElement>('.serp__note')!;
  RIVALS.forEach(([t, u]) => list.append(item(t, u, false)));
  const me = item(`${site.owner} · ${site.role}`, new URL(site.url).host, true, 'Cool, SEO-friendly websites: design, development, SEO and marketing in one place.');
  list.append(me);
  note.textContent = 'Position 8. Not bad for a page nobody has optimised yet...';

  document.body.append(overlay);
  lockScroll(true);
  overlay.focus();
  const dur = reduced ? 0 : 1;
  gsap.to(overlay, { opacity: 1, duration: 0.3 * dur });
  gsap.from(card, { y: 24, scale: 0.97, duration: 0.5 * dur, ease: 'power3.out' });

  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    gsap.killTweensOf([overlay, card, me]);
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.25 * dur,
      onComplete: () => {
        overlay.remove();
        document.querySelectorAll('.serp__bit').forEach((b) => b.remove());
        lockScroll(false);
        open = false;
        prevFocus?.focus?.();
      },
    });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') e.preventDefault(); // nothing inside to tab to
  };
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // the climb
  gsap.delayedCall(1.1 * dur, () => {
    const items = [...list.children];
    const state = Flip.getState(items);
    list.prepend(me);
    Flip.from(state, { duration: 1.5 * dur, ease: 'power3.inOut', onComplete: celebrate });
  });

  function celebrate() {
    const badge = me.querySelector<HTMLElement>('.serp__badge')!;
    gsap.to(badge, { opacity: 1, scale: 1, duration: 0.5 * dur, ease: 'back.out(3)' });
    note.textContent = 'Rankings are earned, not typed. This is how I build for them. (Esc to close)';
    if (reduced) return;
    const r = badge.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const bit = document.createElement('i');
      bit.className = 'serp__bit';
      bit.style.left = `${r.left + r.width / 2}px`;
      bit.style.top = `${r.top + r.height / 2}px`;
      document.body.append(bit);
      gsap.to(bit, {
        x: gsap.utils.random(-170, 170),
        y: gsap.utils.random(-150, 90),
        scale: gsap.utils.random(0.5, 1.6),
        opacity: 0,
        duration: gsap.utils.random(0.8, 1.4),
        ease: 'power2.out',
        onComplete: () => bit.remove(),
      });
    }
  }
}
