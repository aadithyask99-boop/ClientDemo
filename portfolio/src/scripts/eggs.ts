import { site } from '../data/site';
import { q, fine, markFound, reduced } from './util';
import { initEggCount } from './eggcount';

/* The small, quiet easter eggs. The bigger ones live in their own files (serp.ts) and are loaded only when found. */
export function initEggs() {
  // 1. For anyone who opens the console
  console.log('%cHi, I\'m %s.', 'font:600 22px/1.5 system-ui, sans-serif;color:#ff5a1f', site.short);
  console.log(
    '%cYou found the console. Try typing "seo" or "hello" anywhere on the page, holding Shift over the headline, right-clicking it, or scrolling past the bottom.\nOr just say hi: %s',
    'font:12px/1.7 ui-monospace, monospace',
    site.email || site.url,
  );

  // 2. The tab calls you back
  const title = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Come back, I optimised this for you' : title;
  });

  // 3. Type a word anywhere: "seo" opens a made-up search page, "hello" or "hire" the contact section
  let typed = '';
  const lazy = () => import('./eggs-more');
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed.endsWith('seo')) { typed = ''; void import('./serp').then((m) => m.openSerp()); }
    else if (typed.endsWith('hello') || typed.endsWith('hire')) { markFound(typed.endsWith('hello') ? 'hello' : 'hire'); typed = ''; void lazy().then((m) => m.hello()); }
  });

  const head = q('[data-hero-title]');
  const spinEvent = (on: boolean) => window.dispatchEvent(new CustomEvent('aadi:spin', { detail: on }));
  let spinning = false;
  const spin = (on: boolean) => { if (on === spinning) return; spinning = on; if (on) markFound('shift'); spinEvent(on); };

  // 6. Right-click the headline: a menu of jokes instead of the browser's. (On a phone a long press is the word spinner's, so no menu there.)
  head?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!fine) return;
    markFound('menu');
    void lazy().then((m) => m.headlineMenu(e.clientX, e.clientY));
  });

  if (fine) {
    // 5. Hold Shift with the pointer over the headline: the changing word spins through many more adjectives (hero.ts listens)
    let over = false;
    head?.addEventListener('pointerenter', () => { over = true; });
    head?.addEventListener('pointerleave', () => { over = false; spin(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Shift' && !e.repeat && over) spin(true); });
    window.addEventListener('keyup', (e) => { if (e.key === 'Shift') spin(false); });
    window.addEventListener('blur', () => spin(false));

    // 7. Keep scrolling when you are already at the bottom: a pixel rocket builds up, then carries you back to the top
    let pull = 0;
    let idle = 0;
    window.addEventListener('wheel', (e) => {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (!atBottom || e.deltaY <= 0) {
        if (pull) { pull = 0; void lazy().then((m) => m.rocketRelease()); }
        return;
      }
      pull += e.deltaY;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => { pull = 0; void lazy().then((m) => m.rocketRelease()); }, 700);
      void lazy().then((m) => { if (pull >= 900) { pull = 0; window.clearTimeout(idle); markFound('rocket'); m.rocketLaunch(); } else m.rocketPull(pull); });
    }, { passive: true });
  } else if (head) {
    // 5b. On a phone there is no Shift: press and hold the headline for a moment and the word spins for as long as you hold
    let hold = 0;
    head.addEventListener('pointerdown', () => {
      hold = window.setTimeout(() => { hold = 0; head.dataset.held = '1'; spin(true); }, 380);
    });
    const release = () => { window.clearTimeout(hold); hold = 0; spin(false); };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => head.addEventListener(ev, release));
  }

  // 8. "Remote worldwide": press it and the globe spins, and a bubble says what time it is somewhere else (I work in your hours)
  const globe = q('[data-globe]');
  if (globe) {
    const stops: [string, string][] = [['New York', 'America/New_York'], ['São Paulo', 'America/Sao_Paulo'], ['Lagos', 'Africa/Lagos'], ['Dubai', 'Asia/Dubai'], ['Mumbai', 'Asia/Kolkata'], ['Singapore', 'Asia/Singapore'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney'], ['Los Angeles', 'America/Los_Angeles']];
    let n = Math.floor(Math.random() * stops.length);
    globe.addEventListener('click', () => {
      markFound('globe');
      const [city, tz] = stops[n++ % stops.length];
      const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).format(new Date());
      const r = globe.getBoundingClientRect();
      void Promise.all([import('gsap'), import('./bubble')]).then(([{ gsap }, b]) => {
        gsap.fromTo(globe.querySelector('svg'), { rotation: 0 }, { rotation: 360, duration: 0.9, ease: 'power3.inOut', overwrite: true });
        b.bubble(`${city}: ${time}. Time zones are no problem.`, { x: r.right - 20, y: r.top - 2, side: 'above', ms: 3400 });
      });
    });
  }

  // 10. The counter in the footer
  initEggCount();

  // 11. A line under the name for people who are up late (by the visitor's own clock)
  const late = q('[data-late]');
  if (late) {
    const h = new Date().getHours();
    const text = h < 5 ? 'Still up? Same.' : h < 7 ? 'Early bird. Respect.' : h >= 23 ? 'Almost midnight. Same, honestly.' : '';
    if (text) {
      late.textContent = text;
      late.hidden = false;
      if (!reduced) void import('gsap').then(({ gsap }) => gsap.from(late, { opacity: 0, y: 6, duration: 0.8, delay: 1.2, ease: 'power2.out' }));
    }
  }

  // 12. Scroll very fast (a hard flick) and a bubble says so, and the cursor breaks into a sweat
  let ly = window.scrollY;
  let lt = performance.now();
  let streak = 0;
  let cool = 0;
  let quiet = 0;
  let ptr = { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
  window.addEventListener('pointermove', (e) => { ptr = { x: e.clientX, y: e.clientY }; }, { passive: true });
  window.addEventListener('aadi:scrollto', () => { quiet = performance.now() + 5000; }); // rides the page makes itself (anchors, the rocket) are not flicks
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const dt = now - lt;
    if (dt < 90) return;
    const v = (Math.abs(window.scrollY - ly) / dt) * 1000;
    ly = window.scrollY;
    lt = now;
    if (now < quiet || reduced) { streak = 0; return; }
    streak = v > 5500 ? streak + 1 : 0;
    if (streak >= 2 && now > cool) {
      cool = now + 25000;
      streak = 0;
      markFound('fast');
      window.dispatchEvent(new Event('aadi:sweat'));
      void import('./bubble').then((b) => b.bubble('Whoa, slow down.', { x: ptr.x, y: ptr.y - 10, side: 'above', ms: 2400 }));
    }
  }, { passive: true });

  // 9. A few seconds in, little bubbles start to say what can be tried (until it has been found)
  window.setTimeout(() => { void import('./hints').then((m) => m.initHints()); }, 5000);

  // 4. The same egg for phones, where there is no keyboard: click the hero pixel icon five times, quickly
  const icon = q('.hero__pixel');
  let taps: number[] = [];
  icon?.addEventListener('click', () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 2200), now];
    if (taps.length >= 5) {
      taps = [];
      void import('./serp').then((m) => m.openSerp());
    }
  });
}
