import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa } from './util';

/* Site Chemistry, scrubbed by the scroll while the screen stays pinned.
     0.02-0.16  the orange core at the centre of the ring grows until it floods the screen; ring and title step back
     0.16-0.58  the view pulls back and the four circles come into sight around the core
     0.52-0.70  circle names, the words along each circle, and the line in the middle arrive
     0.70-0.84  the finished diagram holds so it can be read
     0.84-1.00  it softens away as the service cards come up
   Without .fx (touch, reduced motion, no JS) none of this runs and the finished diagram is just shown. */
export function initChem() {
  if (!document.documentElement.classList.contains('fx')) return;
  const sec = q('.chem');
  const pin = q('[data-chem-pin]');
  const ring = q('[data-ring]');
  const copy = q('[data-chem-copy]');
  const venn = q<SVGSVGElement>('[data-venn]');
  const body = q('[data-venn-body]');
  const mid = q('[data-vm]');
  if (!sec || !pin || !ring || !copy || !venn || !body || !mid) return;
  const circles = qa('[data-vc]');
  const labels = qa('[data-vl]');
  const arcs = qa('[data-va]');

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(venn, { opacity: 0 });
  // the diagram is symmetric about the middle of its viewBox, so GSAP's default origin (the group's own centre) is the centre of the scene
  gsap.set(body, { transformOrigin: '50% 50%', scale: 0.25, rotation: 0 });
  gsap.set([...circles, ...arcs, mid], { opacity: 0 });
  gsap.set(labels, { opacity: 0, y: 10 });

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: '+=440%', pin, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1 },
    })
    .to(venn, { opacity: 1, duration: 0.02 }, 0.02)
    .to(body, { scale: 8, rotation: -10, duration: 0.14, ease: 'power2.in' }, 0.02)
    .to(ring, { opacity: 0, scale: 1.25, duration: 0.1 }, 0.03)
    .to(copy, { opacity: 0, y: -24, duration: 0.08 }, 0.02)
    .to(body, { scale: 1, rotation: 0, duration: 0.42, ease: 'power3.inOut' }, 0.16)
    .to(circles, { opacity: 1, duration: 0.14, stagger: 0.04 }, 0.38)
    .to(labels, { opacity: 1, y: 0, duration: 0.1, stagger: 0.04 }, 0.52)
    .to(arcs, { opacity: 1, duration: 0.12, stagger: 0.04 }, 0.56)
    .to(mid, { opacity: 1, duration: 0.08 }, 0.68)
    .to(venn, { opacity: 0, scale: 0.94, filter: 'blur(10px)', duration: 0.16, ease: 'power2.in' }, 0.84);
}
