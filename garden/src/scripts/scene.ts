// The finale landscape: the sky turns to sunset as you scroll in, and the chapel, oak and bench answer to a touch.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bell, chime } from './audio';
import { hearts, toast } from './eggs';
import type { Atmosphere } from './atmosphere';

const BIRD = '<svg viewBox="0 0 28 12" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M1 8Q7 0 14 7Q21 0 27 8"/></svg>';

export function initScene(reduce: boolean, atmo: Atmosphere): void {
  const root = document.documentElement;
  const fin = document.getElementById('finale')!;
  const scene = document.getElementById('scene')!;
  const birds = document.getElementById('birds')!;

  // ---- sunset as you arrive ----
  if (reduce) {
    fin.style.setProperty('--dusk', '1');
  } else {
    const st = { v: 0 };
    gsap.to(st, {
      v: 1, ease: 'none',
      scrollTrigger: { trigger: fin, start: 'top 85%', end: 'top 15%', scrub: 0.6 },
      onUpdate: () => { fin.style.setProperty('--dusk', st.v.toFixed(3)); root.classList.toggle('dusk', st.v > 0.6); },
    });
  }

  // ---- birds ----
  const bird = (host: HTMLElement, x: number, y: number, dx: number, dy: number, dur: number, size = 26) => {
    const b = document.createElement('div');
    b.className = 'bird';
    b.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size * 0.43}px`;
    b.innerHTML = BIRD;
    host.appendChild(b);
    gsap.to(b.firstElementChild, { scaleY: 0.35, duration: 0.18 + Math.random() * 0.1, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 100%' });
    gsap.to(b, { x: dx, y: dy, duration: dur, ease: 'power1.in', onComplete: () => b.remove() });
    gsap.fromTo(b, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
  };
  const flock = (fromX: number, fromY: number) => {
    if (reduce) return;
    const r = scene.getBoundingClientRect();
    for (let i = 0; i < 5; i++) bird(birds, fromX - r.left + (Math.random() - 0.5) * 24, fromY - r.top + (Math.random() - 0.5) * 16, 140 + Math.random() * 320, -(180 + Math.random() * 260), 2.4 + Math.random() * 1.6, 18 + Math.random() * 12);
  };
  const ambient = () => {
    const r = scene.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0 && !reduce) {
      const y = r.height * (0.1 + Math.random() * 0.25);
      for (let i = 0; i < 3; i++) bird(birds, -40 - i * 36, y + i * 14, r.width + 120, y - 60 + Math.random() * 40, 15 + i, 22);
    }
    setTimeout(ambient, 14000 + Math.random() * 8000);
  };
  setTimeout(ambient, 3500);

  // ---- props ----
  const say = (el: HTMLElement) => toast(el.dataset.say || '', 4600);
  const church = document.getElementById('church')!;
  church.addEventListener('click', () => {
    bell(3);
    const r = church.getBoundingClientRect();
    flock(r.left + r.width * 0.34, r.top + r.height * 0.06);
    gsap.fromTo(church.firstElementChild, { rotation: -1.4, transformOrigin: '34% 100%' }, { rotation: 0, duration: 2.4, ease: 'elastic.out(1, 0.25)' });
    gsap.fromTo(church.querySelector('.glow'), { scale: 1.8 }, { scale: 1, duration: 2.4, ease: 'power2.out' });
    say(church);
  });

  const tree = document.getElementById('tree')!;
  tree.addEventListener('click', () => {
    const r = tree.getBoundingClientRect();
    gsap.fromTo(tree, { rotation: -3.2, transformOrigin: '50% 100%' }, { rotation: 0, duration: 2.2, ease: 'elastic.out(1, 0.22)' });
    atmo.spawn(r.left + r.width / 2, r.top + r.height * 0.28, 18);
    atmo.gust(0.8);
    chime(4, 0.8);
    say(tree);
  });

  const bench = document.getElementById('bench')!;
  bench.addEventListener('click', () => {
    const r = bench.getBoundingClientRect();
    hearts(r.left + r.width / 2, r.top + r.height * 0.3, 8);
    chime(1, 0.8);
    say(bench);
  });
}
