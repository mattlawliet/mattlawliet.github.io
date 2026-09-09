// Renders the Minecraft models behind the project grid and the detail pages.
//
// One WebGL context for the whole page: every tile is a scissored viewport onto its own
// small scene, so fourteen items cost one canvas and one render loop rather than
// fourteen of each.
//
// Models come from assets/, flattened ahead of time so nothing here resolves a parent
// chain or a texture variable at runtime. Three shapes arrive:
//   - block models, whose elements are boxes with per-face UVs
//   - item sprites, extruded per opaque pixel the way Minecraft builds a generated item
//   - Blockbench .bbmodel files, read directly for the 3D art project

import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';

const FACES = ['east', 'west', 'up', 'down', 'south', 'north']; // BoxGeometry order
const ASSETS = '/assets';   // pages are served from /p/<id>/ too, so never relative
const texLoader = new THREE.TextureLoader();
const texCache = new Map();

function loadTex(file) {
  if (!texCache.has(file)) {
    const t = texLoader.load(file.startsWith('data:') ? file : `${ASSETS}/textures/${file}`);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(file, t);
  }
  return texCache.get(file);
}

const mat = (file) => file.startsWith('#')
  ? new THREE.MeshLambertMaterial({ color: file, side: THREE.DoubleSide })
  : new THREE.MeshLambertMaterial({
      map: loadTex(file), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide,
    });

// ── block models: elements are boxes in 0..16 space with per-face uv ──
function buildBlockModel(data) {
  const res = data.resolution ?? { width: 16, height: 16 };
  const g = new THREE.Group();
  const mats = new Map();
  const getMat = (k) => {
    if (!mats.has(k)) mats.set(k, mat(data.textures[k]));
    return mats.get(k);
  };
  for (const el of data.elements) {
    const [fx, fy, fz] = el.from, [tx, ty, tz] = el.to;
    const w = Math.max(tx - fx, .001), h = Math.max(ty - fy, .001), d = Math.max(tz - fz, .001);
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv;
    const faceMats = FACES.map((face) => {
      const f = el.faces[face];
      if (!f) return new THREE.MeshBasicMaterial({ visible: false });
      return getMat(f.texture);
    });
    FACES.forEach((face, i) => {
      const f = el.faces[face];
      if (!f) { for (let k = 0; k < 4; k++) uv.setXY(i * 4 + k, 0, 0); return; }
      let [x1, y1, x2, y2] = f.uv;
      let c = [[x1, y1], [x2, y1], [x1, y2], [x2, y2]];       // tl tr bl br
      for (let r = 0; r < ((f.rotation || 0) / 90) % 4; r++)  // face uv rotation
        c = [c[2], c[0], c[3], c[1]];
      c.forEach(([x, y], k) => uv.setXY(i * 4 + k, x / res.width, 1 - y / res.height));
    });
    uv.needsUpdate = true;
    const mesh = new THREE.Mesh(geo, faceMats);
    mesh.position.set((fx + tx) / 2 - 8, (fy + ty) / 2 - 8, (fz + tz) / 2 - 8);
    if (el.rotation) {
      // vanilla: {origin, axis, angle}. bbmodel: rotation is [x,y,z] degrees + origin.
      const origin = el.origin ?? el.rotation.origin ?? [8, 8, 8];
      const pivot = new THREE.Group();
      pivot.position.set(origin[0] - 8, origin[1] - 8, origin[2] - 8);
      mesh.position.sub(pivot.position);
      if (Array.isArray(el.rotation))
        pivot.rotation.set(...el.rotation.map((d) => (d * Math.PI) / 180));
      else pivot.rotation[el.rotation.axis] = (el.rotation.angle * Math.PI) / 180;
      pivot.add(mesh);
      g.add(pivot);
    } else g.add(mesh);
  }
  return g;
}

// ── sprites: extrude the png per opaque pixel, the way MC builds a generated item ──
async function buildSprite(file) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej;
    i.src = `${ASSETS}/textures/${file}`;
  });
  const W = img.width, H = Math.min(img.height, img.width); // animated sheets: first frame
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, img.width, img.height).data;
  const at = (x, y) => px[(y * img.width + x) * 4 + 3] > 32;

  const pos = [], norm = [], uvs = [], idx = [];
  const D = 1; // one pixel deep, like a real item
  const push = (quad, n, u) => {
    const base = pos.length / 3;
    quad.forEach((v) => { pos.push(...v); norm.push(...n); });
    u.forEach((v) => uvs.push(...v));
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const scale = 16 / W; // normalise any sprite size into the 16-unit block space
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!at(x, y)) continue;
    const X = (x - W / 2) * scale, Y = ((H - 1 - y) - H / 2) * scale, S = scale, Z = D / 2;
    const u0 = x / img.width, u1 = (x + 1) / img.width;
    const v0 = 1 - y / img.height, v1 = 1 - (y + 1) / img.height;
    const UV = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    // front / back always; sides only where the neighbour is transparent
    push([[X, Y, Z], [X + S, Y, Z], [X + S, Y + S, Z], [X, Y + S, Z]], [0, 0, 1], UV);
    push([[X + S, Y, -Z], [X, Y, -Z], [X, Y + S, -Z], [X + S, Y + S, -Z]], [0, 0, -1], UV);
    if (x === 0 || !at(x - 1, y))
      push([[X, Y, -Z], [X, Y, Z], [X, Y + S, Z], [X, Y + S, -Z]], [-1, 0, 0], UV);
    if (x === W - 1 || !at(x + 1, y))
      push([[X + S, Y, Z], [X + S, Y, -Z], [X + S, Y + S, -Z], [X + S, Y + S, Z]], [1, 0, 0], UV);
    if (y === 0 || !at(x, y - 1))
      push([[X, Y + S, Z], [X + S, Y + S, Z], [X + S, Y + S, -Z], [X, Y + S, -Z]], [0, 1, 0], UV);
    if (y === H - 1 || !at(x, y + 1))
      push([[X, Y, -Z], [X + S, Y, -Z], [X + S, Y, Z], [X, Y, Z]], [0, -1, 0], UV);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat(file)));
  return g;
}

async function loadBBModel(file) {
  const d = await fetch(file.startsWith('/') ? file : `/${file}`).then((r) => r.json());
  const src = d.textures?.[0]?.source;
  return {
    kind: 'model',
    resolution: d.resolution ?? { width: 16, height: 16 },
    textures: { 0: src },
    elements: (d.elements ?? [])
      .filter((el) => (!el.type || el.type === 'cube') && el.export !== false)
      .map((el) => ({
        from: el.from, to: el.to, origin: el.origin, rotation: el.rotation,
        faces: Object.fromEntries(Object.entries(el.faces ?? {})
          .filter(([, f]) => f.texture != null)
          .map(([k, f]) => [k, { uv: f.uv, texture: String(f.texture), rotation: f.rotation ?? 0 }])),
      })),
  };
}

// A ring of models, one per file, that rotates the chosen one to the front.
export async function loadCarousel(entries) {
  const files = entries.map(e => typeof e === 'string' ? e : e.file);
  const yaws = entries.map(e => ((typeof e === 'string' ? 0 : e.yaw ?? 0) * Math.PI) / 180);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 8, 6);
  const rim = new THREE.DirectionalLight(0xc4aaff, 0.7); rim.position.set(-5, 2, -4);
  scene.add(key, rim);

  const holder = new THREE.Group();
  const R = files.length > 1 ? 17 : 0;
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    const g = buildBlockModel(await loadBBModel(files[i]));
    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    g.position.sub(box.getCenter(new THREE.Vector3()));
    const fit = new THREE.Group();
    fit.scale.setScalar(15 / Math.max(size.x, size.y, size.z, 0.001));
    // Blockbench models put their front on north, same as vanilla block models,
    // so they all need turning to face the camera; yaw is a per-model correction.
    fit.rotation.y = Math.PI + yaws[i];
    fit.add(g);
    const slot = new THREE.Group();
    slot.add(fit);   // slots are placed by the render loop, so the ellipse can animate
    holder.add(slot);
    parts.push(slot);
  }
  scene.add(holder);
  // frame on the front model, not the whole ring, so it fills a wide box properly
  return { scene, holder, parts, sprite: false, yaw: 0, carousel: true,
           count: files.length, rx: R * 2.2, rz: R, dist: R + 54 };
}

export async function loadItem(id) {
  const data = id === 'models'
    ? await loadBBModel('models/rimuru_mask.bbmodel')
    : await fetch(`${ASSETS}/models/${id}.json`).then((r) => r.json());
  const g = data.kind === 'sprite' ? await buildSprite(data.texture) : buildBlockModel(data);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 8, 6);
  const rim = new THREE.DirectionalLight(0xc4aaff, 0.7); rim.position.set(-5, 2, -4);
  scene.add(key, rim);
  // models arrive in whatever space they were authored in (vanilla 0..16, bbmodel anything)
  const box = new THREE.Box3().setFromObject(g);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  g.position.sub(centre);
  const fit = new THREE.Group();
  // wide composites would shrink to nothing if fitted by their longest side
  const span = data.fit === 'height' ? size.y : Math.max(size.x, size.y, size.z);
  fit.scale.setScalar((data.zoom ?? 1) * 16 / Math.max(span, 0.001));
  fit.add(g);
  const holder = new THREE.Group();
  holder.add(fit);
  scene.add(holder);
  const sprite = data.kind === 'sprite';
  const yaw = data.yaw ?? (sprite ? 0 : Math.PI + 0.62);
  // start at rest in the right pose; otherwise the loop eases in from 0 and every
  // model visibly swings into place on load
  holder.rotation.y = yaw;
  return { scene, holder, sprite, yaw };
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearAlpha(0);
  renderer.autoClear = false;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const views = [];
  const resize = () => renderer.setSize(innerWidth, innerHeight, false);
  resize();
  addEventListener('resize', resize);

  let raf = 0;
  const start = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - start) / 1000;
    renderer.setScissorTest(true);
    renderer.clear();
    // the detail view owns the canvas while it is open; grid items never draw over it
    const detailOpen = document.body.classList.contains('detail-open');
    for (const v of views) {
      if (!v.visible) continue;
      if (detailOpen ? v.mode === 'item' : v.mode === 'detail') continue;
      const r = v.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
      const bottom = innerHeight - r.bottom;
      renderer.setViewport(r.left, bottom, r.width, r.height);
      renderer.setScissor(r.left, bottom, r.width, r.height);
      camera.aspect = r.width / r.height;
      // frame the item: sprites are flat so they can sit closer
      camera.position.set(0, 0, v.item.dist ?? (v.item.sprite ? 46 : 40));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      const h = v.item.holder;
      const bob = Math.sin(t * 1.5 + v.phase);
      if (v.item.carousel) {
        const n = v.item.count, step = (2 * Math.PI) / n;
        // ease in index space, taking the short way round the ring
        let d = v.index - v.spin;
        while (d > n / 2) d -= n;
        while (d < -n / 2) d += n;
        v.spin += d * 0.12;
        v.item.parts.forEach((p, i) => {
          const a = (i - v.spin) * step;
          p.position.set(Math.sin(a) * v.item.rx,
                         Math.sin(t * 1.2 + i * 2) * 0.7,
                         Math.cos(a) * v.item.rz);
          p.rotation.y = a;
        });
        h.rotation.x = -0.16;
      } else if (v.mode === 'compass') {
        h.rotation.set(0, 0, v.angle);        // flat to camera; the needle does the work
        h.position.y = bob * 0.25;
      } else {
        // blocks sit in the inventory pose so two faces always read; sprites face front
        const yaw = v.item.yaw;
        const tilt = v.item.tilt ?? (v.item.sprite || v.item.yaw === 0 ? 0 : -0.28);
        // idle drifts barely at all; hover hands rotation over to the pointer
        const ty = yaw + (v.hot ? v.px * 0.5 : Math.sin(t * 0.45 + v.phase) * 0.14);
        const tx = tilt + (v.hot ? v.py * 0.22 : Math.sin(t * 0.6 + v.phase) * 0.06);
        h.rotation.y += (ty - h.rotation.y) * 0.14;
        h.rotation.x += (tx - h.rotation.x) * 0.14;
        h.position.y = bob * 0.55;
      }
      h.scale.setScalar((v.hot ? 1.08 : 1) * (v.scale ?? 1));
      renderer.clearDepth();
      renderer.render(v.item.scene, camera);
    }
    renderer.setScissorTest(false);
  }
  raf = requestAnimationFrame(frame);

  const find = (el) => views.find((x) => x.el === el);
  // grid items can be switched off as a group; models finish loading at unpredictable
  // times, so this is a stage-level flag rather than a pass over existing views
  let itemsOn = true;
  return {
    add: (el, item, opts = {}) => views.push({
      el, item, scale: opts.scale ?? 1, mode: opts.mode ?? 'item',
      phase: Math.random() * 6.28, hot: false, px: 0, py: 0, angle: 0, index: 0, spin: 0,
      visible: opts.mode === 'compass' ? false : opts.mode === 'item' ? itemsOn : true,
    }),
    show: (el, on) => { const v = find(el); if (v) v.visible = on; },
    index: (el, i, snap) => {
      const v = find(el);
      if (!v) return;
      v.index = i;
      if (snap) v.spin = i;
    },
    showAll: (on) => { itemsOn = on; views.forEach((v) => { if (v.mode === 'item') v.visible = on; }); },
    remove: (el) => { const i = views.findIndex((x) => x.el === el); if (i > -1) views.splice(i, 1); },
    hot: (el, on) => { const v = find(el); if (v) { v.hot = on; if (!on) v.px = v.py = 0; } },
    point: (el, nx, ny) => { const v = find(el); if (v) { v.px = nx; v.py = ny; } },
    aim: (el, angle) => { const v = find(el); if (v) v.angle = angle; },
    clear: () => views.splice(0, views.length),
    stop: () => cancelAnimationFrame(raf),
  };
}
