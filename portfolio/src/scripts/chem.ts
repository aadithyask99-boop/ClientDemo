import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa } from './util';

/* Site Chemistry, scrubbed by the scroll while the screen stays pinned. It tells the story in the order a client would ask the questions:
     0.05-0.65  four ideas, one at a time: the title in the ring gives way, then each circle appears with its name, its words and a caption underneath
     0.66-0.72  where all four meet, the orange core and the word it stands for: ENQUIRIES
     0.72-0.84  the view zooms into that core and the rest steps back
     0.84-0.92  the orange fills the screen and ENQUIRIES stands on it, held
     0.92-1.00  on the next scroll it gives way to what it means: the verdict
   Without .fx, below 900px wide, or with reduced motion, none of this runs and the finished diagram is just shown. */
const ORDER = ['design', 'build', 'seo', 'marketing'];
const CAPTIONS = [...ORDER, 'all']; // the fifth caption is the one that goes with the core

export function initChem() {
  const root = document.documentElement;
  if (!root.classList.contains('fx') || !window.matchMedia('(min-width: 900px)').matches) return;
  const sec = q('.chem');
  const pin = q('[data-chem-pin]');
  const copy = q('[data-chem-copy]');
  const list = q('[data-chem-list]');
  const ring = q('[data-ring]');
  const venn = q('[data-venn]');
  const body = q('[data-venn-body]');
  const core = q('[data-vcore]');
  const mid = q('[data-vm]');
  const verdict = q('[data-chem-verdict]');
  const items = CAPTIONS.map((id) => q(`[data-ci="${id}"]`)!);
  const circles = ORDER.map((id) => q(`[data-vc="${id}"]`)!);
  const labels = ORDER.map((id) => q(`[data-vl="${id}"]`)!);
  const arcs = ORDER.map((id) => q(`[data-va="${id}"]`)!);
  if (!sec || !pin || !copy || !list || !ring || !venn || !body || !core || !mid || !verdict || [...items, ...circles, ...labels, ...arcs].some((e) => !e)) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(circles, { opacity: 0, scale: 0.86 });
  gsap.set([...labels, ...arcs, core, mid], { opacity: 0 });
  gsap.set(ring, { transformOrigin: '50% 50%', scale: 1 });
  gsap.set(body, { transformOrigin: '50% 50%', scale: 1, rotation: 0 }); // the diagram is symmetric about its centre, so this is the centre of the scene
  gsap.set(verdict, { opacity: 0 });

  // which line of the list is lit, and which header colour reads on the screen at this point
  const mark = (p: number) => {
    const idx = p < 0.05 ? -1 : p >= 0.66 ? 4 : Math.min(3, Math.floor((p - 0.05) / 0.15));
    items.forEach((li, i) => li.classList.toggle('is-on', i === idx)); // one caption at a time
    root.dataset.world = p > 0.82 ? 'light' : 'dark'; // ink on the orange, cream on the black
  };

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: '+=620%', pin, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1, onUpdate: (self) => mark(self.progress) },
  });
  tl.to(copy, { opacity: 0, scale: 0.92, duration: 0.05 }, 0.04); // the title in the ring steps aside for the first circle
  ORDER.forEach((_, i) => {
    const s = 0.05 + i * 0.15;
    tl.to(circles[i], { opacity: 1, scale: 1, duration: 0.08, ease: 'power2.out' }, s)
      .to(labels[i], { opacity: 1, duration: 0.06 }, s + 0.04)
      .to(arcs[i], { opacity: 1, duration: 0.07 }, s + 0.06);
  });
  tl.to(core, { opacity: 1, duration: 0.06 }, 0.66)
    .to(mid, { opacity: 1, duration: 0.05 }, 0.7)
    .to(body, { scale: 18, duration: 0.14, ease: 'power2.in' }, 0.72)
    // the dotted ring zooms with the diagram (same centre, same pace), so it sweeps past the edges of the screen instead of just fading
    .to(ring, { scale: 18, duration: 0.14, ease: 'power2.in' }, 0.72)
    .to(ring, { opacity: 0, duration: 0.05 }, 0.79)
    .to(list, { opacity: 0, duration: 0.04 }, 0.72)
    // the orange takes the whole screen and ENQUIRIES stands on it, upright, on its own...
    .to(sec, { backgroundColor: '#ff5a1f', duration: 0.05 }, 0.8)
    .to([...circles, ...labels, ...arcs], { opacity: 0, duration: 0.05 }, 0.81)
    // ...and is held there. Only on the next scroll does it give way to the verdict.
    .to(mid, { opacity: 0, duration: 0.04 }, 0.91)
    .to(verdict, { opacity: 1, duration: 0.06 }, 0.94)
    // The scrub maps the timeline's whole length onto the scroll distance, so it must end at exactly 1: this empty tween holds the verdict on screen
    // to the end, and keeps every position above equal to the share of the scroll it takes.
    .to({}, { duration: 0.0 }, 1);
}
