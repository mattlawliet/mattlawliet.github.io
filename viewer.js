// Minimal Blockbench (.bbmodel) viewer.
//
// A bbmodel is a list of axis-aligned boxes with per-face texture coordinates,
// which maps almost directly onto BoxGeometry — so this reads the file itself
// rather than pulling in a converter. Two UV modes exist and both are used by
// these models: per-face `uv` rectangles, and `box_uv`, where one offset
// implies the standard six-face Minecraft layout.

import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';

const FACES = ['east', 'west', 'up', 'down', 'south', 'north']; // BoxGeometry order

// Standard box-UV layout: [x, y, w, h] in texture pixels, given depth/width/height.
function boxUV([ox, oy], [dx, dy, dz]) {
  return {
    east: [ox, oy + dz, dz, dy],
    north: [ox + dz, oy + dz, dx, dy],
    west: [ox + dz + dx, oy + dz, dz, dy],
    south: [ox + dz + dx + dz, oy + dz, dx, dy],
    up: [ox + dz, oy, dx, dz],
    down: [ox + dz + dx, oy, dx, dz],
  };
}

function applyUV(geo, rects, res) {
  const uv = geo.attributes.uv;
  FACES.forEach((face, i) => {
    const r = rects[face];
    if (!r) {
      // No face defined: collapse it so nothing stretches across the atlas.
      for (let k = 0; k < 4; k++) uv.setXY(i * 4 + k, 0, 0);
      return;
    }
    const [x1, y1, x2, y2] = r;
    const u1 = x1 / res.width;
    const u2 = x2 / res.width;
    const v1 = 1 - y1 / res.height;
    const v2 = 1 - y2 / res.height;
    uv.setXY(i * 4 + 0, u1, v1);
    uv.setXY(i * 4 + 1, u2, v1);
    uv.setXY(i * 4 + 2, u1, v2);
    uv.setXY(i * 4 + 3, u2, v2);
  });
  uv.needsUpdate = true;
}

export function buildModel(data, texture) {
  const res = data.resolution ?? { width: 16, height: 16 };
  const root = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });

  for (const el of data.elements ?? []) {
    if (el.type && el.type !== 'cube') continue;
    if (el.export === false) continue;
    const [fx, fy, fz] = el.from;
    const [tx, ty, tz] = el.to;
    const inf = el.inflate ?? 0;
    // Blockbench uses zero-thickness cubes as flat planes — gills, fins, arms.
    // They are most of some models, so give them a sliver of depth instead of
    // dropping them; BoxGeometry cannot take a zero dimension.
    const size = [tx - fx + inf * 2, ty - fy + inf * 2, tz - fz + inf * 2].map((s) =>
      Math.abs(s) < 1e-4 ? 1e-3 : s
    );

    const geo = new THREE.BoxGeometry(...size);

    let rects;
    if (el.box_uv) {
      const layout = boxUV(el.uv_offset ?? [0, 0], [tx - fx, ty - fy, tz - fz]);
      rects = {};
      for (const [f, [x, y, w, h]] of Object.entries(layout)) rects[f] = [x, y, x + w, y + h];
    } else {
      rects = {};
      for (const [f, def] of Object.entries(el.faces ?? {})) {
        if (def && def.uv && def.texture !== null) rects[f] = def.uv;
      }
    }
    applyUV(geo, rects, res);

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
      (fx + tx) / 2 - inf / 2 + inf / 2,
      (fy + ty) / 2,
      (fz + tz) / 2
    );

    if (el.rotation && el.origin) {
      // Blockbench rotates around an explicit origin; wrap in a pivot so the
      // box keeps its own local transform.
      const pivot = new THREE.Group();
      pivot.position.set(...el.origin);
      mesh.position.sub(new THREE.Vector3(...el.origin));
      pivot.add(mesh);
      const [rx, ry, rz] = Array.isArray(el.rotation)
        ? el.rotation
        : [el.rotation.x ?? 0, el.rotation.y ?? 0, el.rotation.z ?? 0];
      pivot.rotation.set(
        THREE.MathUtils.degToRad(rx),
        THREE.MathUtils.degToRad(ry),
        THREE.MathUtils.degToRad(rz)
      );
      root.add(pivot);
    } else {
      root.add(mesh);
    }
  }
  return root;
}

export async function mount(canvas, url) {
  const data = await fetch(url).then((r) => r.json());
  const src = data.textures?.[0]?.source;
  if (!src) throw new Error('model has no embedded texture');

  const texture = await new THREE.TextureLoader().loadAsync(src);
  texture.magFilter = THREE.NearestFilter; // keep the pixels crisp
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const model = buildModel(data, texture);

  // Centre on the model's own bounds, then frame it.
  const box = new THREE.Box3().setFromObject(model);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2 || 8;
  model.position.sub(centre);

  const pivot = new THREE.Group();
  pivot.add(model);
  scene.add(pivot);
  scene.add(new THREE.AmbientLight(0xffffff, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(1, 1.4, 1);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
  camera.position.set(0, radius * 0.25, radius * 2.9);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Drag to turn it; let go and it drifts again.
  let dragging = false;
  let last = 0;
  let idle = true;
  let vy = 0;
  pivot.rotation.y = -0.6;
  pivot.rotation.x = 0.18;

  const down = (e) => {
    dragging = true;
    idle = false;
    last = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!dragging) return;
    vy = (e.clientX - last) * 0.01;
    pivot.rotation.y += vy;
    last = e.clientX;
  };
  const up = () => {
    dragging = false;
    setTimeout(() => (idle = true), 1800);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf;
  const tick = () => {
    if (!dragging) {
      if (idle && !slow) pivot.rotation.y += 0.004;
      else if (Math.abs(vy) > 0.0002) {
        pivot.rotation.y += vy;
        vy *= 0.94;
      }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    renderer.dispose();
    texture.dispose();
  };
}
