import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { loadKit, makeLock, makeOrb, makeStage } from './objects';

type Kind = 'lock' | 'orb';

interface Live {
  host: HTMLElement;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  subject: Object3D;
  kind: Kind;
  visible: boolean;
}

/** Mounts the two glass objects (padlock and orb). Resolves quietly if WebGL is not available. */
export async function mountGlass(reduce: boolean) {
  const hosts = [...document.querySelectorAll<HTMLElement>('[data-glass]')];
  if (!hosts.length) return;

  const k = await loadKit();
  const { THREE } = k;

  const live: Live[] = [];

  for (const host of hosts) {
    const kind = host.dataset.glass as Kind;
    let stage: ReturnType<typeof makeStage>;
    try {
      stage = makeStage(k, host);
    } catch {
      continue; // keep the static fallback
    }
    const { renderer, scene } = stage;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 7.4);

    const subject = kind === 'lock' ? makeLock(k) : makeOrb(k);
    if (kind === 'lock') subject.scale.setScalar(0.92);
    scene.add(subject);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    new ResizeObserver(resize).observe(host);

    const item: Live = { host, renderer, scene, camera, subject, kind, visible: true };
    new IntersectionObserver(([e]) => { item.visible = e.isIntersecting; }).observe(host);
    live.push(item);
    renderer.render(scene, camera);
    host.classList.add('is-live');
  }

  if (!live.length || reduce) return;

  const start = performance.now();
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    for (const l of live) {
      if (!l.visible) continue;
      if (l.kind === 'lock') {
        l.subject.rotation.y = Math.sin(t * 0.7) * 0.5;
        l.subject.rotation.x = Math.sin(t * 0.5) * 0.08;
      } else {
        l.subject.rotation.y = t * 0.45;
        l.subject.rotation.x = Math.sin(t * 0.4) * 0.2;
      }
      l.renderer.render(l.scene, l.camera);
    }
  };
  let raf = 0;
  const loop = () => { tick(); raf = requestAnimationFrame(loop); };
  loop();
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) loop();
  });
}
