// Scrubbed reveals and drifts for the quieter parts of the page, so no section sits still.
// Animates wrappers (li, headline words), never links or buttons, so CSS hover transforms keep working.
import { gsap, reduced, desktop } from './core';

// Split a text node tree of an element into word spans (keeps the existing span structure, e.g. the dimmed second line)
function splitWords(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = (n.textContent || '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const w = document.createElement('span');
          w.textContent = t; w.style.display = 'inline-block'; w.dataset.rw = '';
          frag.appendChild(w); out.push(w);
        });
        n.parentNode!.replaceChild(frag, n);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(root);
  return out;
}

export default function init() {
  if (reduced) return;
  const rise = (sel: string, y: number, start = 'top 97%', end = 'top 68%') => {
    gsap.utils.toArray<HTMLElement>(sel).forEach((el) => {
      gsap.fromTo(el, { y, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: 0.5 } });
    });
  };

  // Promise headline: every word rises in turn as the line comes into view
  const line = document.querySelector<HTMLElement>('.p-line');
  if (line) {
    const label = line.textContent || '';
    line.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim());
    const words = splitWords(line);
    words.forEach((w) => w.setAttribute('aria-hidden', 'true'));
    gsap.fromTo(words, { y: 56, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: line, start: 'top 104%', end: 'top 76%', scrub: 0.4 } });
  }

  rise('.foot-list li', 36);
  rise('.foot-mail', 30);
  rise('.foot-ph', 20);
  const person = document.querySelector<HTMLElement>('.foot-person');
  if (person) {
    const words = splitWords(person);
    gsap.fromTo(words, { y: 34, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', stagger: 0.15, scrollTrigger: { trigger: person, start: 'top 98%', end: 'top 72%', scrub: 0.5 } });
  }

  // Quote sentence: its parts fade in one after another as the stage arrives (opacity only, so the chips keep their press effect)
  const parts = gsap.utils.toArray<HTMLElement>('[data-quote] .qs-sentence > *');
  if (parts.length) gsap.fromTo(parts, { opacity: 0.12 }, { opacity: 1, ease: 'none', stagger: 0.25, scrollTrigger: { trigger: '[data-quote]', start: 'top 80%', end: 'top 25%', scrub: 0.6 } });

  if (!desktop()) return;

  // Hero: as you scroll out, each piece drifts at its own speed (thumbnails, lead line, scene word, button)
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    const drift = (sel: string, y: number, extra: gsap.TweenVars = {}) => gsap.utils.toArray<HTMLElement>(sel, hero).forEach((el, i) => gsap.to(el, { y: y - i * 6, ease: 'none', ...extra, scrollTrigger: st }));
    drift('.hero-thumbs > *', 46, { opacity: 0.25 });
    drift('.hero-lead', -38);
    drift('.hero-words', -84);
    drift('.hero-toast', -26);
  }
}
