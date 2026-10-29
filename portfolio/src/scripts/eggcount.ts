import { q, EGGS, foundCount } from './util';

/* The egg counter: a little "[ 3 / 13 eggs ]" in the footer once the first egg is found, and a quick "Egg 3 of 13" note at the moment of each find.
   Finding all of them opens the contact section. The progress is kept in the browser, so a returning visitor carries on where they were. */
export function initEggCount() {
  const el = q('[data-egg-count]');
  const total = EGGS.length;
  const paint = (n: number, bump = false) => {
    if (!el) return;
    el.hidden = n === 0;
    el.textContent = n >= total ? `[ ${total} / ${total} eggs. All of them. ]` : `[ ${n} / ${total} eggs ]`;
    if (bump) void import('gsap').then(({ gsap }) => gsap.fromTo(el, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }));
  };
  paint(foundCount());

  window.addEventListener('aadi:egg', (e) => {
    const { count } = (e as CustomEvent<{ id: string; count: number }>).detail;
    paint(count, true);
    void Promise.all([import('gsap'), import('./bubble')]).then(([{ gsap }, b]) => {
      const done = count >= total;
      const msg = done ? 'You found them all. Let&rsquo;s talk.' : `Egg found! <b>${count}</b> of ${total}`;
      b.bubble(msg, { x: 64, y: window.innerHeight - 22, side: 'above', ms: done ? 4200 : 2400, html: true });
      if (done) {
        gsap.delayedCall(1.2, () => { const t = q('#connect'); if (t) window.dispatchEvent(new CustomEvent('aadi:scrollto', { detail: { y: t.getBoundingClientRect().top + window.scrollY, duration: 2 } })); });
      }
    });
  });
}
