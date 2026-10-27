import type * as T from 'three';
import type { RoundedBoxGeometry as RoundedBox } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** The three.js modules the glass objects need, loaded once and shared */
export interface Kit {
  THREE: typeof T;
  RoundedBoxGeometry: typeof RoundedBox;
  RoomEnvironment: new () => T.Scene;
}

let kit: Promise<Kit> | undefined;
export function loadKit(): Promise<Kit> {
  kit ??= (async () => {
    const [THREE, env, box] = await Promise.all([
      import('three'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
      import('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
    ]);
    return { THREE, RoundedBoxGeometry: box.RoundedBoxGeometry, RoomEnvironment: env.RoomEnvironment as unknown as Kit['RoomEnvironment'] };
  })();
  return kit;
}

/** A renderer with the soft studio lighting every object here is tuned for */
export function makeStage(k: Kit, host: HTMLElement) {
  const { THREE } = k;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new k.RoomEnvironment() as unknown as T.Scene, 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  return { renderer, scene };
}

const glass = (k: Kit, color: number, opacity = 0.74) =>
  new k.THREE.MeshPhysicalMaterial({ color, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, transparent: true, opacity, envMapIntensity: 1.7 });

export function makeLock(k: Kit, color = 0xbfdcf5): T.Group {
  const { THREE } = k;
  const g = new THREE.Group();
  const m = glass(k, color);
  const body = new THREE.Mesh(new k.RoundedBoxGeometry(2.1, 1.7, 0.95, 6, 0.36), m);
  body.position.y = -0.55;
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.17, 24, 48, Math.PI), m);
  shackle.position.y = 0.25;
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.45, 24), m);
  legL.position.set(-0.62, 0.03, 0);
  const legR = legL.clone();
  legR.position.x = 0.62;
  const hole = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 8, 16), new THREE.MeshPhysicalMaterial({ color: 0x103a78, roughness: 0.25, clearcoat: 1 }));
  hole.position.set(0, -0.55, 0.5);
  g.add(body, shackle, legL, legR, hole);
  return g;
}

export function makeOrb(k: Kit): T.Group {
  const { THREE } = k;
  const g = new THREE.Group();
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 64, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x0b55f2, emissive: 0x0829c8, emissiveIntensity: 0.35, roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.85 }),
  ));
  return g;
}
