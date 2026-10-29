import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa, clamp, reduced } from './util';
import { playEgg, type Egg } from './deck-eggs';

/* The hand of three cards.
   With a mouse: drag a card anywhere, let go and it drifts back (or, if you flick it hard, it flies off the walls, plays its scene, and returns).
   With touch or the keyboard: tap / press Enter or Space and it plays the same scene. The words in the heading above follow the card you are on. */
export function initDeck() {
  const stage = q('[data-deck]');
  if (!stage) return;
  const cards = qa('[data-card]', stage);
  const keys = qa('[data-k]');
  const tabs = qa('[data-tab]');
  const fx = document.documentElement.classList.contains('fx');
  const row = window.matchMedia('(max-width: 699px)').matches; // phones: a sideways row, no fan
  const fans = cards.map((c) => Number(c.dataset.fan ?? 0));
  const kinds = cards.map((c) => c.dataset.card as Egg);
  const home = (i: number) => (row ? 0 : fans[i]);
  if (!row) cards.forEach((c, i) => gsap.set(c, { rotation: fans[i], transformOrigin: '50% 115%' }));

  /* ----- the heading follows the card ----- */
  let active = -1;
  let touched = false;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    keys.forEach((k, j) => k.classList.toggle('is-on', j === i));
    tabs.forEach((t, j) => { t.classList.toggle('is-on', j === i); t.setAttribute('aria-pressed', String(j === i)); });
  };
  if (!reduced) {
    setActive(0);
    window.setInterval(() => { if (!touched && !document.hidden) setActive((active + 1) % keys.length); }, 2400);
  }

  const fire = (i: number) => {
    touched = true;
    setActive(i);
    playEgg(kinds[i], cards[i]);
  };

  let z = 10;
  /* a tab brings its card to the front with a little hop */
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    touched = true;
    setActive(i);
    if (row) {
      cards[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); // the row scrolls sideways; the card comes to the middle
      return;
    }
    cards[i].style.zIndex = String(++z);
    const y = gsap.getProperty(cards[i], 'y') as number;
    gsap.fromTo(cards[i], { y }, { y: y - 22, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', overwrite: 'auto' });
  }));
  const timers: number[] = [];
  const flying: boolean[] = [];

  function goHome(i: number, delay = 0) {
    window.clearTimeout(timers[i]);
    timers[i] = window.setTimeout(() => {
      flying[i] = false;
      gsap.to(cards[i], { x: 0, y: 0, rotation: home(i), duration: 0.9, ease: 'back.out(1.3)', onComplete: () => { cards[i].style.zIndex = ''; } });
    }, delay);
  }

  /* A flick: simple physics in the page's own animation clock. Speed bleeds off, the card bounces off the edges of the window and spins. */
  function fling(i: number, vx0: number, vy0: number) {
    const card = cards[i];
    let x = gsap.getProperty(card, 'x') as number;
    let y = gsap.getProperty(card, 'y') as number;
    let rot = gsap.getProperty(card, 'rotation') as number;
    let vx = clamp(vx0, -3200, 3200);
    let vy = clamp(vy0, -3200, 3200);
    let vr = clamp(vx * 0.04, -700, 700);
    let age = 0;
    flying[i] = true;
    const step = () => {
      const dt = Math.min(gsap.ticker.deltaRatio() / 60, 0.05);
      age += dt;
      const drag = Math.pow(0.1, dt); // about 90% of the speed gone each second
      vx *= drag; vy *= drag; vr *= drag;
      x += vx * dt; y += vy * dt; rot += vr * dt;
      gsap.set(card, { x, y, rotation: rot });
      const b = card.getBoundingClientRect();
      const pad = 8;
      if ((b.left < pad && vx < 0) || (b.right > window.innerWidth - pad && vx > 0)) vx = -vx * 0.6;
      if ((b.top < pad && vy < 0) || (b.bottom > window.innerHeight - pad && vy > 0)) vy = -vy * 0.6;
      if (!flying[i] || age > 2.2 || Math.hypot(vx, vy) < 70) {
        gsap.ticker.remove(step);
        if (flying[i]) goHome(i, 350);
      }
    };
    gsap.ticker.add(step);
  }

  cards.forEach((card, i) => {
    const inner = q('.card__in', card)!;
    card.addEventListener('pointerenter', () => { touched = true; setActive(i); });
    card.addEventListener('focus', () => { touched = true; setActive(i); });
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      fire(i);
    });
    if (!fx) {
      card.addEventListener('click', () => fire(i));
      return;
    }

    /* ----- mouse: drag, tilt, flick ----- */
    let id = -1;
    let sx = 0, sy = 0, ox = 0, oy = 0;
    let moved = false;
    let samples: { t: number; x: number; y: number }[] = [];

    card.addEventListener('pointermove', (e) => {
      if (e.pointerId === id) {
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) > 6) moved = true;
        if (moved) gsap.set(card, { x: ox + dx, y: oy + dy, rotation: home(i) + clamp(dx * 0.04, -14, 14) });
        const now = performance.now();
        samples.push({ t: now, x: e.clientX, y: e.clientY });
        samples = samples.filter((s) => now - s.t < 100);
        return;
      }
      // hovering: tilt toward the pointer
      const r = inner.getBoundingClientRect();
      gsap.to(inner, { rotationY: ((e.clientX - r.left) / r.width - 0.5) * 14, rotationX: -((e.clientY - r.top) / r.height - 0.5) * 14, transformPerspective: 800, duration: 0.4, overwrite: 'auto' });
    });
    card.addEventListener('pointerleave', () => gsap.to(inner, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' }));

    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      card.setPointerCapture(e.pointerId);
      id = e.pointerId;
      moved = false;
      sx = e.clientX; sy = e.clientY;
      ox = gsap.getProperty(card, 'x') as number;
      oy = gsap.getProperty(card, 'y') as number;
      flying[i] = false;
      window.clearTimeout(timers[i]);
      gsap.killTweensOf(card);
      card.classList.add('is-drag');
      card.style.zIndex = String(++z);
      gsap.to(inner, { rotationX: 0, rotationY: 0, duration: 0.2, overwrite: 'auto' });
      samples = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
    });

    const release = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      card.classList.remove('is-drag');
      if (!moved) {
        // a tap: a little hop, and the scene
        gsap.fromTo(card, { y: oy }, { y: oy - 18, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' });
        fire(i);
        return;
      }
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = first && last && last.t > first.t ? (last.t - first.t) / 1000 : 0;
      const vx = dt ? (last.x - first.x) / dt : 0;
      const vy = dt ? (last.y - first.y) / dt : 0;
      if (Math.hypot(vx, vy) > 1400) {
        fire(i);
        fling(i, vx, vy);
      } else goHome(i, 1800);
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);
  });

  /* ----- dealt face down, then turned over, when the section comes into view ----- */
  if (!reduced && !row) {
    const backs = qa('.back', stage);
    const inners = cards.map((c) => q('.card__in', c)!);
    const rears = cards.map((c) => q('.card__bk', c)!);
    const centre = stage.getBoundingClientRect().left + stage.clientWidth / 2;
    gsap.set(inners, { rotationY: 180, transformPerspective: 800 });
    gsap.set(rears, { rotationY: 0, transformPerspective: 800, visibility: 'visible' });
    const fx0 = backs.map((b) => gsap.getProperty(b, 'x') as number);
    gsap.set(cards, { opacity: 0 });
    gsap.set(backs, { opacity: 0, x: (i) => fx0[i] * 0.15, rotation: 0 });
    ScrollTrigger.create({
      trigger: stage,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        tl.to(backs, { opacity: 1, x: (i) => fx0[i], rotation: (i) => (i === 0 ? -21 : 21), duration: 0.9, ease: 'back.out(1.4)', stagger: 0.08 }, 0);
        cards.forEach((c, i) => {
          const dx = centre - (c.getBoundingClientRect().left + c.offsetWidth / 2);
          tl.fromTo(c, { x: dx, y: 90, rotation: 0, opacity: 0 }, { x: 0, y: 0, rotation: home(i), opacity: 1, duration: 0.8, ease: 'back.out(1.2)' }, 0.12 + i * 0.1);
          tl.to(inners[i], { rotationY: 0, duration: 0.8, ease: 'power3.inOut' }, 1.0 + i * 0.14);
          tl.to(rears[i], { rotationY: -180, duration: 0.8, ease: 'power3.inOut', onComplete: () => { gsap.set(rears[i], { visibility: 'hidden' }); } }, 1.0 + i * 0.14);
        });
      },
    });
  }

  /* ----- phones: the row scrolls sideways, so each card is turned over as it comes into view, and the heading follows the card that is in the middle ----- */
  if (row) {
    const inners = cards.map((c) => q('.card__in', c)!);
    const rears = cards.map((c) => q('.card__bk', c)!);
    if (!reduced) {
      gsap.set(inners, { rotationY: 180, transformPerspective: 800 });
      gsap.set(rears, { rotationY: 0, transformPerspective: 800, visibility: 'visible' });
    }
    const flipped: boolean[] = [];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const i = cards.indexOf(e.target as HTMLElement);
      if (e.intersectionRatio < 0.55) return; // the first report comes with any overlap at all: only a card that is mostly in view counts
      if (!flipped[i] && !reduced) {
        flipped[i] = true;
        gsap.timeline({ delay: 0.12 })
          .to(inners[i], { rotationY: 0, duration: 0.8, ease: 'power3.inOut' }, 0)
          .to(rears[i], { rotationY: -180, duration: 0.8, ease: 'power3.inOut', onComplete: () => { gsap.set(rears[i], { visibility: 'hidden' }); } }, 0);
      }
      touched = true;
      setActive(i);
    }), { threshold: [0.55, 0.8] }); // measured against the screen: sideways (the row clips its cards) and down the page
    cards.forEach((c) => io.observe(c));
  }
}
