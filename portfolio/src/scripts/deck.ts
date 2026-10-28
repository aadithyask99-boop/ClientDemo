import { gsap } from 'gsap';
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
}
