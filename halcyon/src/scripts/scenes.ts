import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { loadKit, makeStage, type Kit } from './objects';

interface Live {
  host: HTMLElement;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  visible: boolean;
  update: (t: number) => void;
  /** Frames per second to render at. Slow-drifting scenes do not need 60. */
  fps?: number;
  last?: number;
}

const live: Live[] = [];
let raf = 0;

const loop = (now: number) => {
  let any = false;
  for (const l of live) {
    if (!l.visible) continue;
    any = true;
    if (l.fps && now - (l.last ?? 0) < 1000 / l.fps - 2) continue;
    l.last = now;
    l.update(now / 1000);
    l.renderer.render(l.scene, l.camera);
  }
  raf = any ? requestAnimationFrame(loop) : 0;
};
const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };

function register(l: Live) {
  live.push(l);
  new IntersectionObserver(([e]) => { l.visible = e.isIntersecting; if (l.visible) wake(); }, { rootMargin: '80px' }).observe(l.host);
  const fit = () => {
    const w = l.host.clientWidth || 1;
    const h = l.host.clientHeight || 1;
    l.renderer.setSize(w, h, false);
    l.camera.aspect = w / h;
    l.camera.updateProjectionMatrix();
  };
  fit();
  new ResizeObserver(fit).observe(l.host);
  l.renderer.render(l.scene, l.camera);
  wake();
}

/** Where a point at normalised screen position (nx, ny) lies on the z = 0 plane for this camera */
function onPlane(cam: PerspectiveCamera, nx: number, ny: number) {
  const halfH = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
  return { x: nx * halfH * cam.aspect, y: ny * halfH, halfH };
}

function letterTexture(k: Kit, ch: string, fg: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = fg;
  g.font = '700 190px "Outfit Variable", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ch, 128, 142);
  const tex = new k.THREE.CanvasTexture(c);
  tex.colorSpace = k.THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The firm's name on loose 3D keycaps along the bottom of the footer, hopping when the pointer comes near */
async function keycaps(k: Kit, host: HTMLElement, reduce: boolean) {
  const { THREE } = k;
  const { renderer, scene } = makeStage(k, host);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
  camera.position.set(0, 8, 14);
  camera.lookAt(0, 0, 0);

  const letters = [...'HALCYON'];
  // Navy, white and kingfisher orange, alternating
  const palette = [
    { cap: 0x0f1c33, ink: '#e9f1fa' },
    { cap: 0xf1f5f9, ink: '#16233a' },
    { cap: 0xff6b3d, ink: '#fff4ec' },
    { cap: 0xf1f5f9, ink: '#16233a' },
    { cap: 0xff6b3d, ink: '#fff4ec' },
    { cap: 0x0f1c33, ink: '#e9f1fa' },
    { cap: 0xf1f5f9, ink: '#16233a' },
  ];
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(8,18,40,.5)');
    r.addColorStop(1, 'rgba(8,18,40,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  const caps = letters.map((ch, i) => {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(
      new k.RoundedBoxGeometry(1.5, 0.85, 1.5, 6, 0.22),
      new THREE.MeshPhysicalMaterial({ color: palette[i].cap, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3, envMapIntensity: 1.1 }),
    );
    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 1.05),
      new THREE.MeshBasicMaterial({ map: letterTexture(k, ch, palette[i].ink), transparent: true, toneMapped: false }),
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.432;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.05;
    grp.add(shadow, body, top);
    // Each key rests at its own angle, as if tipped out of a box
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const rnd = (n: number) => ((seed * (n + 1)) % 1 + 1) % 1;
    grp.rotation.set((rnd(1) - 0.5) * 0.3, (rnd(2) - 0.5) * 0.9, (rnd(3) - 0.5) * 0.5);
    grp.userData = { base: grp.rotation.clone(), lift: 0 };
    scene.add(grp);
    return grp;
  });

  let ptr: { x: number; y: number } | null = null;
  const contact = host.closest('[data-contact]') ?? host;
  contact.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    ptr = { x: ((e as PointerEvent).clientX - r.left) / r.width, y: ((e as PointerEvent).clientY - r.top) / r.height };
  });
  contact.addEventListener('pointerleave', () => { ptr = null; });

  const layout = () => {
    const narrow = camera.aspect < 1.2;
    caps.forEach((c, i) => {
      const nx = -0.8 + (i * 1.6) / (letters.length - 1);
      const p = onPlane(camera, nx, narrow ? -0.3 : -0.28);
      const size = Math.min(p.halfH * 0.62, (p.halfH * camera.aspect * 2) / (letters.length * 1.5));
      c.position.x = p.x;
      c.userData.y0 = p.y + (i % 2 ? 0.3 : -0.1) * size;
      c.scale.setScalar(size / 1.5);
      c.position.z = (i % 3) * 0.6 - 0.6;
    });
  };

  register({
    host, renderer, scene, camera, visible: false,
    update: (t) => {
      layout();
      caps.forEach((c, i) => {
        const ud = c.userData as { base: { x: number; y: number; z: number }; lift: number; y0: number };
        // Is the pointer near this key? Compare in screen space.
        let near = 0;
        if (ptr && !reduce) {
          const v = c.position.clone().project(camera);
          const sx = (v.x * 0.5 + 0.5);
          const sy = 1 - (v.y * 0.5 + 0.5);
          near = Math.max(0, 1 - Math.hypot((sx - ptr.x) * camera.aspect, sy - ptr.y) / 0.16);
        }
        ud.lift += (near - ud.lift) * 0.12;
        const bob = reduce ? 0 : Math.sin(t * 1.1 + i * 1.3) * 0.04;
        c.position.y = ud.y0 + (ud.lift * 0.55 + bob) * c.scale.x;
        c.rotation.x = ud.base.x + ud.lift * 0.5;
        c.rotation.y = ud.base.y + Math.sin(t * 9 + i) * 0.06 * ud.lift;
        c.rotation.z = ud.base.z;
      });
    },
  });
}

/**
 * Builds each 3D scene once, whichever comes first: it nears the viewport, or warm() reaches it. warm() is
 * called when the page is idle, one scene at a time, so shaders compile then and not in the middle of a scroll.
 */
export function mountScenes(reduce: boolean) {
  const targets: [string, (k: Kit, host: HTMLElement, reduce: boolean) => Promise<void>][] = [
    ['[data-keys]', keycaps],
  ];
  const jobs: (() => Promise<void>)[] = [];
  for (const [sel, build] of targets) {
    const host = document.querySelector<HTMLElement>(sel);
    if (!host) continue;
    let started: Promise<void> | undefined;
    const run = () => (started ??= (async () => { try { await build(await loadKit(), host, reduce); } catch { /* the page works without it */ } })());
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); void run(); } }, { rootMargin: '700px' }).observe(host);
    jobs.push(run);
  }
  return {
    async warm() {
      for (const run of jobs) {
        await new Promise((r) => setTimeout(r, 1200));
        await run();
      }
    },
  };
}
