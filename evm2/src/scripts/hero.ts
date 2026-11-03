// The night drive: a procedural three.js road. The camera is the car, the road bends ahead,
// the pointer steers the view, scroll adds speed. Loaded after first paint.
import * as THREE from 'three';

type Opts = { lite: boolean; getProgress: () => number };

function glow(size = 128, stops: [number, string][]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function ridge(w: number, h: number, base: number, amp: number, seed: number, color: string) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) {
    const y =
      base -
      amp * (0.55 * Math.sin(x * 0.004 + seed) + 0.3 * Math.sin(x * 0.011 + seed * 2.3) + 0.15 * Math.sin(x * 0.031 + seed * 5));
    g.lineTo(x, y);
  }
  g.lineTo(w, h);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function startHero(canvas: HTMLCanvasElement, opts: Opts) {
  const { lite } = opts;
  const BG = 0x07110f;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.75));
  renderer.setClearColor(BG);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, lite ? 0.05 : 0.042);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220);
  camera.position.set(0, 1.25, 0);

  const bendOf = (z: number, curve: number) => curve * z * z * 0.00085;

  // Sky glow and far hills (flat colours, no fog)
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 120),
    new THREE.MeshBasicMaterial({
      map: (() => {
        const c = document.createElement('canvas');
        c.width = 8;
        c.height = 256;
        const g = c.getContext('2d')!;
        const gr = g.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, '#050c0b');
        gr.addColorStop(0.62, '#0b1f1a');
        gr.addColorStop(0.9, '#3b2a1c');
        gr.addColorStop(1, '#5a3a20');
        g.fillStyle = gr;
        g.fillRect(0, 0, 8, 256);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })(),
      fog: false,
      depthWrite: false,
    }),
  );
  sky.position.set(0, 38, -170);
  scene.add(sky);

  const hills: THREE.Mesh[] = [];
  [
    { z: -160, y: 14, col: '#0b211b', base: 150, amp: 70, seed: 1.2 },
    { z: -130, y: 10, col: '#081813', base: 160, amp: 60, seed: 4.1 },
  ].forEach((h) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(380, 60),
      new THREE.MeshBasicMaterial({ map: ridge(1024, 256, h.base, h.amp, h.seed, h.col), transparent: true, fog: false, depthWrite: false }),
    );
    m.position.set(0, h.y, h.z);
    scene.add(m);
    hills.push(m);
  });

  // City lights on the horizon
  const cityN = lite ? 70 : 150;
  const cityGeo = new THREE.BufferGeometry();
  const cp = new Float32Array(cityN * 3);
  for (let i = 0; i < cityN; i++) {
    cp[i * 3] = (Math.random() - 0.5) * 150;
    cp[i * 3 + 1] = 1.2 + Math.random() * 3.2;
    cp[i * 3 + 2] = -128;
  }
  cityGeo.setAttribute('position', new THREE.BufferAttribute(cp, 3));
  const city = new THREE.Points(
    cityGeo,
    new THREE.PointsMaterial({ size: 1.6, color: 0xffd9a0, map: glow(32, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]), transparent: true, opacity: 0.85, fog: false, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  scene.add(city);

  // Road
  const roadU = { uDist: { value: 0 }, uCurve: { value: 0 }, uFog: { value: scene.fog.density } };
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 170, 1, 120),
    new THREE.ShaderMaterial({
      uniforms: roadU,
      vertexShader: `
        uniform float uCurve; uniform float uDist;
        varying vec3 vW; varying float vD;
        void main(){
          vec3 p = position; // z runs from +85 to -85 after rotateX
          float z = p.z - 85.0;
          p.z = z;
          p.x += uCurve * z * z * 0.00085;
          vW = vec3(p.x, 0.0, z); vD = -z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform float uDist; uniform float uFog;
        varying vec3 vW; varying float vD;
        void main(){
          float x = vW.x; float z = vW.z;
          vec3 col = vec3(0.03, 0.05, 0.047);
          float edge = smoothstep(0.07, 0.0, abs(abs(x) - 3.85));
          float dash = step(0.5, fract((z + uDist) / 5.0)) * smoothstep(0.1, 0.0, abs(x));
          col = mix(col, vec3(0.62, 0.6, 0.52), edge * 0.32);
          col = mix(col, vec3(0.84, 0.07, 0.11), dash);
          // headlamp pools
          float pool = exp(-pow(vD / 13.0, 1.5)) * (0.5 + 0.5 * exp(-pow((abs(x) - 0.9) / 2.6, 2.0)));
          col += vec3(1.0, 0.8, 0.5) * pool * 0.17;
          float f = 1.0 - exp(-pow(vD * uFog, 2.0));
          col = mix(col, vec3(0.027, 0.067, 0.059), f);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  road.geometry.rotateX(-Math.PI / 2);
  road.frustumCulled = false;
  scene.add(road);

  // Roadside posts with red reflectors
  const POSTS = lite ? 22 : 34;
  const postGeo = new THREE.BoxGeometry(0.09, 1.0, 0.09);
  const posts = new THREE.InstancedMesh(postGeo, new THREE.MeshBasicMaterial({ color: 0x1a2a26 }), POSTS * 2);
  const reflGeo = new THREE.BoxGeometry(0.14, 0.2, 0.05);
  const refl = new THREE.InstancedMesh(reflGeo, new THREE.MeshBasicMaterial({ color: 0xd6111c }), POSTS * 2);
  scene.add(posts, refl);
  const SPACING = 5;
  const m4 = new THREE.Matrix4();

  // Fireflies and dust in the beams
  const dustN = lite ? 140 : 380;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dp[i * 3] = (Math.random() - 0.5) * 16;
    dp[i * 3 + 1] = Math.random() * 4;
    dp[i * 3 + 2] = -Math.random() * 60;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ size: 0.16, color: 0xffe2b0, map: glow(32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  scene.add(dust);

  // Beams
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe0a8, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  [-0.75, 0.75].forEach((x) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 26, 28, 1, true), beamMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(x, 0.75, -13.4);
    scene.add(cone);
  });
  const flare = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow(128, [[0, 'rgba(255,225,170,0.9)'], [0.3, 'rgba(255,200,120,0.25)'], [1, 'rgba(255,200,120,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
  );
  flare.scale.set(9, 5, 1);
  flare.position.set(0, 0.5, -52);
  scene.add(flare);

  // Loop
  let dist = 0;
  let speed = 5;
  let lastP = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let t0 = last;
  const onMove = (e: PointerEvent) => {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 70 : 58;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
  io.observe(canvas);

  function frame(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const p = opts.getProgress();
    const vel = Math.abs(p - lastP) / Math.max(dt, 0.001);
    lastP = p;
    const target = 5 + Math.min(70, vel * 160) + p * 22;
    speed += (target - speed) * Math.min(1, dt * 3);
    dist += speed * dt;
    px += (tx - px) * Math.min(1, dt * 2.5);
    py += (ty - py) * Math.min(1, dt * 2.5);

    const curve = Math.sin(dist * 0.021) * 1.15 + Math.sin(dist * 0.0071) * 0.7;
    roadU.uDist.value = dist;
    roadU.uCurve.value = curve;
    camera.rotation.set(-0.045 - py * 0.05, -px * 0.2 - curve * 0.012, -px * 0.02);
    camera.position.x = px * 0.5;
    camera.position.y = 1.25 + Math.sin((now - t0) * 0.0021) * 0.012 * Math.min(1, speed / 20);

    for (let i = 0; i < POSTS; i++) {
      const z = -(((i * SPACING - dist) % (POSTS * SPACING)) + POSTS * SPACING) % (POSTS * SPACING);
      [-1, 1].forEach((s, k) => {
        const x = s * 4.7 + bendOf(z, curve);
        m4.makeTranslation(x, 0.5, z);
        posts.setMatrixAt(i * 2 + k, m4);
        m4.makeTranslation(x - s * 0.02, 0.9, z + 0.0);
        refl.setMatrixAt(i * 2 + k, m4);
      });
    }
    posts.instanceMatrix.needsUpdate = true;
    refl.instanceMatrix.needsUpdate = true;

    const arr = dustGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < dustN; i++) {
      arr[i * 3 + 2] += speed * dt * 0.9;
      arr[i * 3 + 1] += Math.sin(now * 0.001 + i) * 0.002;
      if (arr[i * 3 + 2] > 1) {
        arr[i * 3 + 2] = -60;
        arr[i * 3] = (Math.random() - 0.5) * 16;
        arr[i * 3 + 1] = Math.random() * 4;
      }
    }
    dustGeo.attributes.position.needsUpdate = true;
    flare.position.x = bendOf(-52, curve);
    hills.forEach((h, i) => (h.position.x = -curve * (6 + i * 4) - px * (3 + i * 2)));
    city.position.x = -px * 5 - curve * 8;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return true;
}
