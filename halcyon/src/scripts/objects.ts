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

export function makeKey(k: Kit, color = 0xcfe8f7): T.Group {
  const { THREE } = k;
  const g = new THREE.Group();
  const m = glass(k, color, 0.8);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 28, 56), m);
  ring.position.x = -1.1;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.3, 24), m);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 0.45;
  const t1 = new THREE.Mesh(new k.RoundedBoxGeometry(0.3, 0.62, 0.3, 4, 0.08), m);
  t1.position.set(1.05, -0.38, 0);
  const t2 = new THREE.Mesh(new k.RoundedBoxGeometry(0.3, 0.46, 0.3, 4, 0.08), m);
  t2.position.set(1.4, -0.3, 0);
  g.add(ring, shaft, t1, t2);
  return g;
}

export function makeShield(k: Kit, color = 0xb7d7f4): T.Group {
  const { THREE } = k;
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, 1.35);
  s.lineTo(1.0, 1.02);
  s.lineTo(1.0, 0.1);
  s.quadraticCurveTo(1.0, -0.85, 0, -1.45);
  s.quadraticCurveTo(-1.0, -0.85, -1.0, 0.1);
  s.lineTo(-1.0, 1.02);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 6, curveSegments: 24 });
  geo.center();
  g.add(new THREE.Mesh(geo, glass(k, color, 0.78)));
  return g;
}
