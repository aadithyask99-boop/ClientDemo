import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

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

  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js');

  const live: Live[] = [];

  for (const host of hosts) {
    const kind = host.dataset.glass as Kind;
    let renderer: WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      continue; // keep the static fallback
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 7.4);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 4, 5);
    scene.add(key);

    const subject = new THREE.Group();
    if (kind === 'lock') {
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xbfdcf5,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.72,
        envMapIntensity: 1.7,
        iridescence: 0.5,
        iridescenceIOR: 1.35,
      });
      const body = new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.7, 0.95, 6, 0.36), glass);
      body.position.y = -0.55;
      const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.17, 24, 48, Math.PI), glass);
      shackle.position.y = 0.25;
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.45, 24), glass);
      legL.position.set(-0.62, 0.03, 0);
      const legR = legL.clone();
      legR.position.x = 0.62;
      const keyhole = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.34, 8, 16),
        new THREE.MeshPhysicalMaterial({ color: 0x103a78, roughness: 0.25, clearcoat: 1 }),
      );
      keyhole.position.set(0, -0.55, 0.5);
      subject.add(body, shackle, legL, legR, keyhole);
      subject.scale.setScalar(0.92);
    } else {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 64, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0x0b55f2,
          emissive: 0x0829c8,
          emissiveIntensity: 0.35,
          roughness: 0.18,
          metalness: 0.15,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          envMapIntensity: 0.85,
        }),
      );
      subject.add(orb);
    }
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
