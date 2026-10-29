import { q, eggList, foundCount } from './util';

/* The egg counter. A speech bubble appears the moment you reach the footer ("Eggs found: 3 of 12"), and a quick "Egg 3 of 12" note at each find. Finding all of
   them opens the contact section. The count is what can be found on the device in hand (a phone has no keyboard, wheel or hover), and it is kept in the browser,
   so a returning visitor carries on where they were. */
export function initEggCount() {
  const total = () => eggList().length;

  window.addEventListener('aadi:egg', (e) => {
    const { count } = (e as CustomEvent<{ id: string; count: number }>).detail;
    void Promise.all([import('gsap'), import('./bubble')]).then(([{ gsap }, b]) => {
      const done = count >= total();
      const msg = done ? 'You found them all. Let&rsquo;s talk.' : `Egg found! <b>${count}</b> of ${total()}`;
      b.bubble(msg, { x: 64, y: window.innerHeight - 22, side: 'above', ms: done ? 4200 : 2400, html: true });
      if (done) {
        gsap.delayedCall(1.2, () => { const t = q('#connect'); if (t) window.dispatchEvent(new CustomEvent('aadi:scrollto', { detail: { y: t.getBoundingClientRect().top + window.scrollY, duration: 2 } })); });
      }
    });
  });

  // reaching the footer: say how many eggs there are and how many have been found (once each time you arrive after being away)
  const foot = q('.connect__foot');
  if (foot) {
    let shown = false;
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) { shown = false; return; }
      if (shown) return;
      shown = true;
      const n = foundCount();
      const msg = n === 0 ? `<b>${total()}</b> eggs are hidden on this page. Go poking.` : n >= total() ? `All <b>${total()}</b> eggs found. Thank you for looking.` : `Eggs found: <b>${n}</b> of ${total()}. Keep poking.`;
      void import('./bubble').then((b) => {
        // over the empty space between the project tiles and the sitemap, so no link is covered
        const r = (q('.sitemap') ?? foot).getBoundingClientRect();
        b.bubble(msg, { x: window.innerWidth * 0.62, y: Math.max(60, r.top - 10), side: 'above', ms: 4200, html: true });
      });
    }), { threshold: 1 }).observe(foot);
  }
}
