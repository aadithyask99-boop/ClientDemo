import { gsap } from 'gsap';
import { reduced } from './util';

/* The three small scenes a card plays when it is flicked (or tapped). Each one is about the thing on the card. */
export type Egg = 'dev' | 'seo' | 'marketing';

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function playEgg(kind: Egg, from?: Element | null) {
  if (kind === 'seo') void import('./serp').then((m) => m.openSerp());
  else if (kind === 'dev') void terminal();
  else leads(from);
}

/* Website Development: a build log types itself out */
async function terminal() {
  if (document.querySelector('.tty')) return;
  const el = document.createElement('div');
  el.className = 'egg tty';
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: reduced ? 0 : 0.35, ease: 'power3.out' });

  const lines: [string, string][] = [
    ['$ npm run build', ''],
    ['✓ built', 'ok'],
    ['$ npm run deploy', ''],
    ['✓ shipped. no console errors.', 'ok'],
  ];
  const caret = document.createElement('span');
  caret.className = 'tty__caret';
  for (const [text, cls] of lines) {
    const row = document.createElement('div');
    const txt = document.createElement('span');
    if (cls) row.className = cls;
    row.append(txt, caret);
    el.append(row);
    if (cls || reduced) {
      txt.textContent = text; // results appear at once, commands are typed
      await wait(reduced ? 0 : 280);
    } else {
      for (const ch of text) {
        txt.textContent += ch;
        await wait(32);
      }
      await wait(240);
    }
  }
  await wait(1500);
  gsap.to(el, { opacity: 0, y: 20, duration: reduced ? 0 : 0.3, onComplete: () => el.remove() });
}

/* Marketing: enquiries pop out of the card one after another, then a running total */
function leads(from?: Element | null) {
  const r = from?.getBoundingClientRect();
  const box = { left: r?.left ?? window.innerWidth / 2, top: r?.top ?? window.innerHeight / 2, w: r?.width ?? 0, h: r?.height ?? 0 };
  const names = ['New enquiry', 'Newsletter sign-up', 'Quote requested', 'Call booked', 'Brief received'];
  const pop = (text: string, cls = '') => {
    const el = document.createElement('div');
    el.className = `egg lead ${cls}`.trim();
    el.setAttribute('aria-hidden', 'true');
    el.textContent = text;
    el.style.left = `${box.left + box.w * gsap.utils.random(0.05, 0.75)}px`;
    el.style.top = `${box.top + box.h * gsap.utils.random(0, 0.5)}px`;
    document.body.append(el);
    gsap.fromTo(el, { scale: 0.4, opacity: 0, y: 12 }, { scale: 1, opacity: 1, y: 0, duration: reduced ? 0 : 0.35, ease: 'back.out(2.4)' });
    gsap.to(el, { y: -90, opacity: 0, duration: reduced ? 0 : 0.9, delay: 1.1, ease: 'power2.in', onComplete: () => el.remove() });
  };
  names.forEach((t, i) => gsap.delayedCall(reduced ? 0 : i * 0.32, () => pop(t)));
  gsap.delayedCall(reduced ? 0 : names.length * 0.32, () => pop(`${names.length} new leads`, 'lead--count'));
}
