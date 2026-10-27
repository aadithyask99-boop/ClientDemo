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

/** The firm's name on loose 3D keycaps. They fall from the top of the footer, tumble, bounce and settle, then hop when the pointer nears. */
let dropKeys: (() => void) | undefined;
let dropWanted = false;

async function keycaps(k: Kit, host: HTMLElement, reduce: boolean) {
  const { THREE } = k;
  const { renderer, scene } = makeStage(k, host);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 6.5, 15);
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
    r.addColorStop(0, 'rgba(8,18,40,.55)');
    r.addColorStop(1, 'rgba(8,18,40,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  type Key = {
    grp: import('three').Group;
    shadow: import('three').Mesh;
    x: number; y: number; vx: number; vy: number;
    av: import('three').Vector3;
    rest: import('three').Euler;
    start: number; started: boolean; settled: boolean; cool: number; wob: number;
  };
  const rnd = (i: number, n: number) => { const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };

  const keys: Key[] = letters.map((ch, i) => {
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
    grp.add(body, top);
    scene.add(grp);
    // The shadow stays on the floor and weakens as its key rises
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    return {
      grp, shadow, x: 0, y: 99, vx: 0, vy: 0, av: new THREE.Vector3(),
      rest: new THREE.Euler((rnd(i, 1) - 0.5) * 0.35, (rnd(i, 2) - 0.5) * 0.9, (rnd(i, 3) - 0.5) * 0.5),
      start: 0, started: false, settled: false, cool: 0, wob: 0,
    };
  });

  // Where the key row sits, from the camera, so it fits at any screen shape
  const ray = new THREE.Vector3();
  let floorY = 0;
  let spawnY = 0;
  let size = 1;
  let rowX: number[] = [];
  let minX = -10;
  let maxX = 10;
  let g = 20;
  const layout = () => {
    // Work on the plane z = 0: find the world y of a screen row by intersecting the view ray with it
    const planeY = (ny: number) => {
      ray.set(0, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      return camera.position.y + ray.y * (-camera.position.z / ray.z);
    };
    const planeX = (nx: number, ny: number) => {
      ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      return camera.position.x + ray.x * (-camera.position.z / ray.z);
    };
    const rowNy = camera.aspect < 1 ? -0.5 : -0.66;
    floorY = planeY(rowNy);
    spawnY = planeY(1.7);
    const left = planeX(-0.74, rowNy);
    const right = planeX(0.74, rowNy);
    const gap = (right - left) / (letters.length - 1);
    rowX = letters.map((_, i) => left + gap * i);
    minX = planeX(-0.9, rowNy);
    maxX = planeX(0.9, rowNy);
    size = Math.min(gap * 0.82, (spawnY - floorY) * 0.34);
    g = (spawnY - floorY) * 1.5; // a fall from the top takes just over a second
    keys.forEach((kk) => { kk.grp.scale.setScalar(size / 1.5); kk.shadow.scale.setScalar(size * 1.9); });
  };

  const restY = () => floorY + 0.425 * (size / 1.5);
  const resetAbove = () => keys.forEach((kk, i) => { kk.x = rowX[i]; kk.y = spawnY * 1.4; kk.vy = kk.vx = 0; kk.started = kk.settled = false; });
  const landNow = () => keys.forEach((kk, i) => { kk.x = rowX[i]; kk.y = restY(); kk.started = kk.settled = true; kk.grp.rotation.copy(kk.rest); });

  let dropAt = -1;
  dropKeys = () => {
    if (dropAt >= 0) return;
    dropAt = performance.now() / 1000;
    keys.forEach((kk, i) => {
      kk.x = rowX[i] + (rnd(i, 4) - 0.5) * size * 0.4;
      kk.y = spawnY * 1.15 + rnd(i, 5) * size;
      kk.vy = 0;
      kk.vx = (rowX[i] - kk.x) * 0.5;
      kk.start = dropAt + i * 0.09 + rnd(i, 6) * 0.08;
      kk.av.set((rnd(i, 7) - 0.5) * 9, (rnd(i, 8) - 0.5) * 5, (rnd(i, 9) - 0.5) * 9);
    });
  };

  let ptr: { x: number; y: number } | null = null;
  const contact = host.closest('[data-contact]') ?? host;
  contact.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    ptr = { x: ((e as PointerEvent).clientX - r.left) / r.width, y: ((e as PointerEvent).clientY - r.top) / r.height };
  });
  contact.addEventListener('pointerleave', () => { ptr = null; });

  let lastT = 0;
  const v = new THREE.Vector3();
  register({
    host, renderer, scene, camera, visible: false,
    update: (t) => {
      const dt = Math.min(0.05, lastT ? t - lastT : 0.016);
      lastT = t;
      layout();
      if (dropAt < 0 && !reduce) resetAbove();
      const floor = restY();
      const now = performance.now() / 1000;

      keys.forEach((kk, i) => {
        if (!kk.started && dropAt >= 0 && now >= kk.start) kk.started = true;
        if (kk.started && !kk.settled) {
          // Falling, tumbling, bouncing
          kk.vy -= g * dt;
          kk.y += kk.vy * dt;
          kk.x += kk.vx * dt;
          if (kk.x < minX) { kk.x = minX; kk.vx = Math.abs(kk.vx) * 0.5; }
          if (kk.x > maxX) { kk.x = maxX; kk.vx = -Math.abs(kk.vx) * 0.5; }
          kk.grp.rotation.x += kk.av.x * dt;
          kk.grp.rotation.y += kk.av.y * dt;
          kk.grp.rotation.z += kk.av.z * dt;
          if (kk.y <= floor) {
            kk.y = floor;
            if (kk.vy < -(spawnY - floorY) * 0.32) {
              kk.vy = -kk.vy * 0.36;
              kk.vx += (rnd(i, now * 7) - 0.5) * size * 0.8;
              kk.av.multiplyScalar(0.5);
            } else {
              kk.vy = 0;
              kk.settled = true;
            }
          }
        } else if (kk.settled) {
          // Resting: ease into a small random tilt, then bob a little
          const e = 1 - Math.exp(-10 * dt);
          const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
          kk.grp.rotation.x += wrap(kk.rest.x - kk.grp.rotation.x) * e;
          kk.grp.rotation.y += wrap(kk.rest.y - kk.grp.rotation.y) * e;
          kk.grp.rotation.z += wrap(kk.rest.z + Math.sin(now * 20) * kk.wob - kk.grp.rotation.z) * e;
          kk.wob *= Math.exp(-4.5 * dt);
          // Slide with friction, so a struck key carries on a little and can strike the next one
          kk.vx *= Math.exp(-5 * dt);
          kk.x += kk.vx * dt;
          if (kk.x < minX) { kk.x = minX; kk.vx = Math.abs(kk.vx) * 0.4; }
          if (kk.x > maxX) { kk.x = maxX; kk.vx = -Math.abs(kk.vx) * 0.4; }
          kk.cool -= dt;
          if (ptr && !reduce && kk.cool <= 0) {
            v.set(kk.x, kk.y, 0).project(camera);
            const sx = v.x * 0.5 + 0.5;
            const sy = 1 - (v.y * 0.5 + 0.5);
            const near = 1 - Math.hypot((sx - ptr.x) * camera.aspect, sy - ptr.y) / 0.15;
            if (near > 0) {
              // Flicked: it hops, spins and slides away from the pointer
              kk.settled = false;
              kk.cool = 0.6;
              kk.vy = (spawnY - floorY) * (0.42 + near * 0.3);
              kk.vx = Math.sign(sx - ptr.x || 1) * size * (0.8 + near);
              kk.av.set((rnd(i, now) - 0.5) * 8, (rnd(i, now + 1) - 0.5) * 6, (rnd(i, now + 2) - 0.5) * 8);
            }
          }
        }
        kk.grp.position.set(kk.x, kk.y, 0);

        // Shadow on the floor, fainter and wider the higher the key is
        const h = Math.max(0, (kk.y - floor) / (spawnY - floorY));
        kk.shadow.position.set(kk.x, floorY + 0.02, 0);
        (kk.shadow.material as import('three').MeshBasicMaterial).opacity = kk.started || reduce ? Math.max(0, 1 - h * 3.2) : 0;
      });

      // Keys are solid. When one hits another it hands over its momentum, and the one it hits does the same to
      // its neighbour: a ripple runs along the row, each key wobbling as the knock reaches it.
      const rad = size * 0.55;
      for (let a = 0; a < keys.length; a++) {
        for (let b = a + 1; b < keys.length; b++) {
          const A = keys[a], B = keys[b];
          if (!A.started || !B.started) continue;
          const dx = B.x - A.x, dy = B.y - A.y;
          const d = Math.hypot(dx, dy);
          const min = rad * 2 * 0.96;
          if (d >= min || d < 1e-5) continue;
          const nx = dx / d, ny = dy / d;
          const push = (min - d) / 2;
          A.x -= nx * push; A.y -= ny * push;
          B.x += nx * push; B.y += ny * push;
          const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rv < 0) {
            const j = (-(1 + 0.6) * rv) / 2;
            A.vx -= j * nx; A.vy -= j * ny;
            B.vx += j * nx; B.vy += j * ny;
            const hit = Math.abs(rv);
            if (hit > size * 0.2) {
              // Both keys feel it: they wobble, and a resting one is woken so it slides on into the next
              [A, B].forEach((k2, n2) => {
                k2.wob = Math.min(0.5, k2.wob + hit * 0.35 / size);
                k2.cool = Math.max(k2.cool, 0.25);
                if (k2.settled && hit > size * 0.45) { k2.settled = false; k2.av.set(0, (n2 ? 1 : -1) * hit * 0.5, (n2 ? -1 : 1) * hit * 0.7); }
              });
            }
          }
        }
      }
      keys.forEach((kk) => { if (kk.y < floor) { kk.y = floor; if (kk.vy < 0) kk.vy = 0; } });
    },
  });
  // The keys are built when the page is idle, so a drop asked for earlier happens now
  layout();
  if (reduce) landNow();
  else if (dropWanted) dropKeys();
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
    /** Let the keys fall. Safe to call before the scene exists; it happens as soon as it is built. */
    drop() { dropWanted = true; dropKeys?.(); },
    async warm() {
      for (const run of jobs) {
        await new Promise((r) => setTimeout(r, 1200));
        await run();
      }
    },
  };
}
