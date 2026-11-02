import { gsap } from 'gsap';
import { site } from '../data/site';
import { lockScroll, reduced, markFound } from './util';

/* The Search Engine Optimisation card's scene: a little pixel spider crawls down a mini checklist of the unglamorous things that decide whether a site can be
   found, ticks each one off, and a score ring counts up to 100. It is an illustration of the work, not a live audit. Loaded only when the card is flicked or tapped. */
const CHECKS: [string, string][] = [
  ['Page title', 'Says what the page is, in a line'],
  ['Meta description', 'A reason to click, not a keyword list'],
  ['Structured data', 'So search engines know who and what'],
  ['Image alt text', 'Every picture described'],
  ['Speed', 'Biggest paint under 2.5 seconds'],
];
// two poses of a 7 x 7 spider, swapped while it walks
const SPIDER = [
  ['#.....#', '.#...#.', '..###..', '.#####.', '..###..', '.#...#.', '#.....#'],
  ['.#...#.', '#.#.#.#', '..###..', '.#####.', '..###..', '#.#.#.#', '.#...#.'],
];

let open = false;

export function openCrawler() {
  if (open) return;
  open = true;
  markFound('crawler');
  const prevFocus = document.activeElement as HTMLElement | null;
  const overlay = document.createElement('div');
  overlay.className = 'crawl';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'A small animation: a crawler checks a site for the things search engines look at');
  overlay.tabIndex = -1;
  const host = (() => { try { const h = new URL(site.url).host; return /^(localhost|127\.)/.test(h) ? 'your-website.example' : h; } catch { return 'your-website.example'; } })();
  overlay.innerHTML = `
    <div class="crawl__card">
      <p class="crawl__bar"><span class="tag-b">Crawling</span><span>${host}</span></p>
      <div class="crawl__body">
        <div class="crawl__track"><span class="crawl__spider" aria-hidden="true"></span></div>
        <ul class="crawl__list">${CHECKS.map(([t, d]) => `<li class="crawl__row"><span class="crawl__t">${t}</span><span class="crawl__d">${d}</span><span class="crawl__s" aria-hidden="true">·</span></li>`).join('')}</ul>
      </div>
      <div class="crawl__score">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="crawl__ring-bg" cx="60" cy="60" r="52"/><circle class="crawl__ring" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"/></svg>
        <span class="crawl__num" aria-live="polite">0</span>
      </div>
      <p class="crawl__note">Checking the boring parts, so nobody has to ask.</p>
    </div>`;
  const spider = overlay.querySelector<HTMLElement>('.crawl__spider')!;
  const rows = [...overlay.querySelectorAll<HTMLElement>('.crawl__row')];
  const ring = overlay.querySelector<SVGCircleElement>('.crawl__ring')!;
  const num = overlay.querySelector<HTMLElement>('.crawl__num')!;
  const note = overlay.querySelector<HTMLElement>('.crawl__note')!;
  const score = overlay.querySelector<HTMLElement>('.crawl__score')!;
  const card = overlay.querySelector<HTMLElement>('.crawl__card')!;

  // the spider is a 7 x 7 grid of squares, redrawn for each pose
  const cells = Array.from({ length: 49 }, () => { const i = document.createElement('i'); spider.append(i); return i; });
  const pose = (n: number) => SPIDER[n].forEach((row, y) => [...row].forEach((c, x) => { cells[y * 7 + x].style.opacity = c === '#' ? '1' : '0'; }));
  pose(0);
  const R = 2 * Math.PI * 52;
  ring.style.strokeDasharray = String(R);
  ring.style.strokeDashoffset = String(R);

  document.body.append(overlay);
  lockScroll(true);
  overlay.focus();
  const dur = reduced ? 0 : 1;
  gsap.to(overlay, { opacity: 1, duration: 0.3 * dur });
  gsap.from(card, { y: 24, scale: 0.97, duration: 0.5 * dur, ease: 'power3.out' });

  let legs = 0;
  const walk = window.setInterval(() => pose((legs = 1 - legs)), 130);
  const tl = gsap.timeline({ delay: 0.5 * dur, onComplete: () => window.clearInterval(walk) });
  rows.forEach((row, i) => {
    const y = () => row.offsetTop + row.offsetHeight / 2 - spider.offsetHeight / 2;
    tl.to(spider, { y, duration: 0.55 * dur, ease: 'power2.inOut' })
      .add(() => { row.classList.add('is-on'); })
      .add(() => { const s = row.querySelector<HTMLElement>('.crawl__s')!; s.textContent = '✓'; row.classList.add('is-ok'); gsap.fromTo(s, { scale: 0.3 }, { scale: 1, duration: 0.3 * dur, ease: 'back.out(3)' }); }, `+=${0.45 * dur}`);
  });
  tl.to(spider, { x: 140, opacity: 0, duration: 0.5 * dur, ease: 'power2.in' }, '+=0.15')
    .to(score, { opacity: 1, duration: 0.3 * dur }, '<')
    .to({ n: 0 }, { n: 100, duration: 1.4 * dur, ease: 'power2.out', onUpdate() { const n = Math.round((this.targets()[0] as { n: number }).n); num.textContent = String(n); ring.style.strokeDashoffset = String(R * (1 - n / 100)); } })
    .add(() => { note.textContent = 'Boring stuff, checked. It is the part most sites skip. (Esc to close)'; });

  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    window.clearInterval(walk);
    tl.kill();
    gsap.to(overlay, { opacity: 0, duration: 0.25 * dur, onComplete: () => { overlay.remove(); lockScroll(false); open = false; prevFocus?.focus?.(); } });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') e.preventDefault();
  };
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  if (reduced) { rows.forEach((r) => { r.classList.add('is-on', 'is-ok'); r.querySelector('.crawl__s')!.textContent = '✓'; }); num.textContent = '100'; ring.style.strokeDashoffset = '0'; score.style.opacity = '1'; }
}
