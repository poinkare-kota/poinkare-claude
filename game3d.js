import * as THREE from 'three';

/* =====================================================================
   IKEBUKURO 3D — 一人称オープンワールド (Three.js / iPhoneブラウザ対応)
   ===================================================================== */

/* ---------- ユーティリティ ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const TAU = Math.PI * 2;

/* ---------- レンダラ / シーン ---------- */
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fb8d8);
scene.fog = new THREE.Fog(0x9fb8d8, 260, 1900);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.5, 4000);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- ライト ---------- */
const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x39414f, 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 900;
const SH = 320;
sun.shadow.camera.left = -SH; sun.shadow.camera.right = SH;
sun.shadow.camera.top = SH; sun.shadow.camera.bottom = -SH;
sun.shadow.bias = -0.0006;
scene.add(sun);
scene.add(sun.target);
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);
// プレイヤー周囲のネオン感を出すフィルライト(夜に強くなる)
const cityGlow = new THREE.PointLight(0xff5fa2, 0.0, 280, 1.6);
scene.add(cityGlow);

/* =====================================================================
   池袋ワールド定義 (2D座標で構築 → x:X, y:Z にマッピング)
   ===================================================================== */
const WORLD = { w: 5200, h: 5200 };
const HSCALE = 2.7; // 建物高さの誇張

const roads2 = [];
const road = (x, y, w, h, name, type) => roads2.push({ x, y, w, h, name: name || '', type: type || 'sub' });
road(3050, 0, 130, WORLD.h, '明治通り', 'main');
road(1750, 0, 110, WORLD.h, '西口通り', 'main');
road(0, 2520, WORLD.w, 140, 'グリーン大通り', 'main');
road(2300, 1650, WORLD.w - 2300, 96, 'サンシャイン60通り', 'sub');
road(1300, 2520, 1300, 140, '', 'main');
for (let gx = 400; gx < WORLD.w; gx += 640) {
  if (Math.abs(gx - 1750) < 220 || Math.abs(gx - 3050) < 220) continue;
  road(gx, 0, 60, WORLD.h, '', 'sub');
}
for (let gy = 420; gy < WORLD.h; gy += 580) {
  if (Math.abs(gy - 2520) < 220 || Math.abs(gy - 1650) < 170) continue;
  road(0, gy, WORLD.w, 54, '', 'sub');
}

const blds2 = [];
const bld = (x, y, w, h, height, col, label, kind) =>
  blds2.push({ x, y, w, h, height, col: col || 0x6b7088, label: label || '', kind: kind || 'office' });

const rails = { x: 2330, y: 0, w: 210, h: WORLD.h };
bld(1900, 2380, 1080, 380, 34, 0x70758c, '池袋駅', 'station');
bld(3900, 900, 460, 460, 250, 0x8a90a8, 'サンシャイン60', 'tower');
bld(3760, 1420, 760, 520, 110, 0x6f7590, 'サンシャインシティ', 'mall');
bld(3560, 1420, 150, 520, 52, 0x8a5a8a, '乙女ロード', 'shop');
bld(1180, 1820, 520, 200, 84, 0x8590a0, '東京芸術劇場', 'civic');
bld(1320, 2790, 380, 460, 96, 0xb07a40, '東武百貨店', 'mall');
bld(3050, 2790, 360, 440, 96, 0x2f7a5e, '西武百貨店', 'mall');
bld(3050, 2300, 220, 180, 86, 0xc05070, 'PARCO', 'mall');
bld(3460, 2300, 230, 180, 72, 0xc84a4a, 'ビックカメラ', 'shop');

const parks2 = [
  { x: 1180, y: 2050, w: 520, h: 420, name: '西口公園 (IWGP)', fountain: true },
  { x: 4350, y: 2750, w: 500, h: 360, name: '東池袋中央公園' },
];

const blockColors = [0x6a7090, 0x747a98, 0x636986, 0x7a8098, 0x6d7390, 0x808698, 0x6a7a7f];
const shopNames = ['居酒屋', 'ラーメン', 'ネカフェ', 'カラオケ', 'ドンキ', '牛丼', 'コンビニ', 'パチンコ', '雑居ビル', 'ホテル', 'BAR', '喫茶'];

function rectHit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function overlapsAny(r, arr, pad) {
  pad = pad || 0;
  for (const o of arr) if (r.x < o.x + o.w + pad && r.x + r.w + pad > o.x && r.y < o.y + o.h + pad && r.y + r.h + pad > o.y) return true;
  return false;
}
(function fillBlocks() {
  for (let gx = 200; gx < WORLD.w - 300; gx += 640) {
    for (let gy = 220; gy < WORLD.h - 300; gy += 580) {
      const cells = [[gx + 70, gy + 60, 230, 210], [gx + 330, gy + 60, 230, 210], [gx + 70, gy + 300, 230, 210], [gx + 330, gy + 300, 230, 210]];
      for (const c of cells) {
        const r = { x: c[0], y: c[1], w: c[2], h: c[3] };
        if (overlapsAny(r, roads2, 26) || overlapsAny(r, blds2, 12) || overlapsAny(r, parks2, 12) || rectHit(r, rails)) continue;
        if (Math.random() < 0.12) continue;
        const kind = Math.random() < 0.45 ? 'shop' : 'office';
        const height = kind === 'shop' ? rand(20, 46) : rand(44, 135);
        const col = blockColors[randi(0, blockColors.length - 1)];
        const label = Math.random() < 0.22 ? shopNames[randi(0, shopNames.length - 1)] : '';
        bld(r.x, r.y, r.w, r.h, height, col, label, kind);
      }
    }
  }
})();

/* ---------- 衝突ボックス (XZ平面 AABB) ---------- */
const colliders = []; // {minX,maxX,minZ,maxZ}
function addCollider(x, y, w, h) { colliders.push({ minX: x, maxX: x + w, minZ: y, maxZ: y + h }); }
for (const b of blds2) addCollider(b.x, b.y, b.w, b.h);
addCollider(rails.x, rails.y, rails.w, rails.h);

/* =====================================================================
   テクスチャ生成 (建物ファサード / 窓)
   ===================================================================== */
function makeFacade(baseHex, accentHex) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const base = '#' + baseHex.toString(16).padStart(6, '0');
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  // 微妙なグラデーションで質感
  const grd = g.createLinearGradient(0, 0, 0, S);
  grd.addColorStop(0, 'rgba(255,255,255,.08)'); grd.addColorStop(1, 'rgba(0,0,0,.12)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  // 窓格子
  const cols = 6, rows = 8, pad = 6;
  const cw = S / cols, ch = S / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    g.fillStyle = 'rgba(20,26,38,.85)';
    g.fillRect(i * cw + pad, j * ch + pad, cw - pad * 2, ch - pad * 2);
    g.fillStyle = 'rgba(150,180,210,.18)';
    g.fillRect(i * cw + pad, j * ch + pad, cw - pad * 2, (ch - pad * 2) * 0.45);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // 夜の点灯マップ
  const e = document.createElement('canvas'); e.width = e.height = S;
  const eg = e.getContext('2d'); eg.fillStyle = '#000'; eg.fillRect(0, 0, S, S);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (Math.random() < 0.5) {
      eg.fillStyle = Math.random() < 0.5 ? '#ffd98a' : '#bcd2ff';
      eg.fillRect(i * cw + pad, j * ch + pad, cw - pad * 2, ch - pad * 2);
    }
  }
  const etex = new THREE.CanvasTexture(e);
  etex.wrapS = etex.wrapT = THREE.RepeatWrapping;
  return { map: tex, emissiveMap: etex };
}

const facadeMats = [];
for (const hx of [0x6a7090, 0x747a98, 0x808698, 0x6d7390, 0x6a7a7f, 0x7a8098]) {
  const { map, emissiveMap } = makeFacade(hx);
  const m = new THREE.MeshStandardMaterial({
    map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.0,
    roughness: 0.82, metalness: 0.05,
  });
  facadeMats.push(m);
}
function facadeFor(b) {
  if (b.kind === 'tower') return facadeMats[2];
  if (b.kind === 'mall' || b.kind === 'civic' || b.kind === 'station') return facadeMats[5];
  return facadeMats[Math.abs(Math.floor(b.x + b.y)) % facadeMats.length];
}

/* ---------- 地面・道路 ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD.w * 1.4, WORLD.h * 1.4),
  new THREE.MeshStandardMaterial({ color: 0x3c4150, roughness: 0.95, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(WORLD.w / 2, 0, WORLD.h / 2);
ground.receiveShadow = true;
scene.add(ground);

const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x26282f, roughness: 0.9, metalness: 0.0 });
const lineMat = new THREE.MeshBasicMaterial({ color: 0xd9c24a });
const roadGroup = new THREE.Group(); scene.add(roadGroup);
for (const r of roads2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), asphaltMat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(r.x + r.w / 2, 0.15, r.y + r.h / 2);
  m.receiveShadow = true;
  roadGroup.add(m);
  if (r.type === 'main') {
    // センターライン (破線)
    const along = r.w > r.h ? r.w : r.h;
    const n = Math.floor(along / 90);
    for (let i = 0; i < n; i++) {
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(r.w > r.h ? 36 : 3, r.w > r.h ? 3 : 36), lineMat);
      seg.rotation.x = -Math.PI / 2;
      const t = (i + 0.5) / n;
      seg.position.set(
        r.w > r.h ? r.x + t * r.w : r.x + r.w / 2,
        0.2,
        r.w > r.h ? r.y + r.h / 2 : r.y + t * r.h
      );
      roadGroup.add(seg);
    }
  }
}
// 線路
const railMesh = new THREE.Mesh(new THREE.PlaneGeometry(rails.w, rails.h),
  new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 1 }));
railMesh.rotation.x = -Math.PI / 2;
railMesh.position.set(rails.x + rails.w / 2, 0.12, rails.y + rails.h / 2);
scene.add(railMesh);

/* ---------- 公園 ---------- */
const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f6a37, roughness: 1 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x357a3c, roughness: 1 });
const treeGeo = new THREE.ConeGeometry(11, 30, 7);
const trunkGeo = new THREE.CylinderGeometry(2, 2.6, 12, 6);
for (const p of parks2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), grassMat);
  m.rotation.x = -Math.PI / 2; m.position.set(p.x + p.w / 2, 0.2, p.y + p.h / 2);
  m.receiveShadow = true; scene.add(m);
  const tn = Math.floor((p.w * p.h) / 14000);
  for (let i = 0; i < tn; i++) {
    const tx = p.x + rand(20, p.w - 20), tz = p.y + rand(20, p.h - 20);
    const tr = new THREE.Mesh(trunkGeo, trunkMat); tr.position.set(tx, 6, tz); tr.castShadow = true; scene.add(tr);
    const lv = new THREE.Mesh(treeGeo, leafMat); lv.position.set(tx, 26, tz); lv.castShadow = true; scene.add(lv);
  }
  if (p.fountain) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(34, 38, 4, 24),
      new THREE.MeshStandardMaterial({ color: 0x7d8794, roughness: 0.8 }));
    base.position.set(p.x + p.w / 2, 2, p.y + p.h / 2); scene.add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 2, 24),
      new THREE.MeshStandardMaterial({ color: 0x4f8fc0, roughness: 0.2, metalness: 0.3 }));
    water.position.set(p.x + p.w / 2, 4, p.y + p.h / 2); scene.add(water);
  }
}

/* ---------- 建物メッシュ ---------- */
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const labelSprites = [];
for (const b of blds2) {
  const h = b.height * HSCALE;
  const mat = (b.kind === 'station') ? new THREE.MeshStandardMaterial({ color: b.col, roughness: 0.7, metalness: 0.1 }) : facadeFor(b);
  const m = new THREE.Mesh(boxGeo, mat);
  m.scale.set(b.w, h, b.h);
  m.position.set(b.x + b.w / 2, h / 2, b.y + b.h / 2);
  m.castShadow = true; m.receiveShadow = true;
  // テクスチャの繰り返しはマテリアル共有のため近似(ビル毎の極端な伸びは許容)
  scene.add(m);
  // 屋上(濃色キャップ)
  const cap = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x3a3f4e, roughness: 0.9 }));
  cap.scale.set(b.w * 0.98, 4, b.h * 0.98); cap.position.set(b.x + b.w / 2, h + 2, b.y + b.h / 2);
  scene.add(cap);
  if (b.label) makeLabel(b.label, b.x + b.w / 2, h + 26, b.y + b.h / 2, b.kind);
}

function makeLabel(text, x, y, z, kind) {
  const big = kind === 'tower' || kind === 'mall' || kind === 'station' || kind === 'civic';
  const S = 256, c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.font = '700 64px -apple-system, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(text, 256, 64);
  g.fillStyle = big ? '#ffe9a8' : '#e6ebf5'; g.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.position.set(x, y, z); sp.scale.set(big ? 180 : 110, big ? 45 : 28, 1);
  scene.add(sp); labelSprites.push(sp);
}

/* ---------- 街灯 ---------- */
const lampMat = new THREE.MeshStandardMaterial({ color: 0x44484f, roughness: 0.7, metalness: 0.4 });
const lampBulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffe1a0, emissiveIntensity: 0.0, roughness: 1 });
const poleGeo = new THREE.CylinderGeometry(1.1, 1.4, 60, 6);
const bulbGeo = new THREE.SphereGeometry(3.4, 8, 8);
const lampBulbs = [];
for (const r of roads2) {
  if (r.type !== 'main') continue;
  const horiz = r.w > r.h;
  const along = horiz ? r.w : r.h;
  for (let d = 120; d < along; d += 340) {
    for (const side of [-1, 1]) {
      const px = horiz ? r.x + d : r.x + r.w / 2 + side * (r.w / 2 + 14);
      const pz = horiz ? r.y + r.h / 2 + side * (r.h / 2 + 14) : r.y + d;
      const pole = new THREE.Mesh(poleGeo, lampMat); pole.position.set(px, 30, pz); scene.add(pole);
      const bulb = new THREE.Mesh(bulbGeo, lampBulbMat.clone()); bulb.position.set(px, 60, pz);
      scene.add(bulb); lampBulbs.push(bulb);
    }
  }
}

/* ---------- ネオン看板 (歓楽街) ---------- */
const neonColors = [0xff2e6e, 0x22d3ee, 0xffcf4a, 0xa855f7, 0x10e0a0];
const neonMeshes = [];
for (const b of blds2) {
  if (b.kind !== 'shop' && b.kind !== 'mall') continue;
  const h = b.height * HSCALE;
  const col = neonColors[Math.abs(Math.floor(b.x + b.y)) % neonColors.length];
  const sign = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.7, 10, 2.5),
    new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.0, roughness: 0.5 }));
  // 道路側(南)に向けて配置
  sign.position.set(b.x + b.w / 2, h * 0.62, b.y + b.h + 2);
  scene.add(sign); neonMeshes.push(sign);
}

/* =====================================================================
   入力 (タッチ: 左スティック移動 / 右ドラッグ視点 / ボタン)
   ===================================================================== */
const input = { mx: 0, my: 0, mag: 0, run: false, fire: false, fireEdge: false, action: false, actionEdge: false };
const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e') input.actionEdge = true;
  if (e.key === 'Escape') togglePause();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

/* スティック */
const stickBase = document.getElementById('stick-base');
const stickKnob = document.getElementById('stick-knob');
const stickZone = document.getElementById('stick-zone');
let stickId = null, stickCx = 0, stickCy = 0; const STICK_R = 58;
function stickStart(id, x, y) {
  stickId = id; stickCx = x; stickCy = y;
  stickBase.style.display = 'block'; stickBase.style.left = (x - 65) + 'px'; stickBase.style.top = (y - 65) + 'px'; stickBase.style.bottom = 'auto';
  stickKnob.style.left = '35px'; stickKnob.style.top = '35px';
}
function stickMove(x, y) {
  let dx = x - stickCx, dy = y - stickCy; const d = Math.hypot(dx, dy);
  if (d > STICK_R) { dx = dx / d * STICK_R; dy = dy / d * STICK_R; }
  stickKnob.style.left = (35 + dx) + 'px'; stickKnob.style.top = (35 + dy) + 'px';
  input.mx = dx / STICK_R; input.my = dy / STICK_R; input.mag = clamp(Math.hypot(input.mx, input.my), 0, 1);
}
function stickEnd() { stickId = null; input.mx = input.my = input.mag = 0; stickBase.style.display = 'none'; }
stickZone.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; if (stickId === null) stickStart(t.identifier, t.clientX, t.clientY); }, { passive: false });
stickZone.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === stickId) stickMove(t.clientX, t.clientY); }, { passive: false });
stickZone.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === stickId) stickEnd(); }, { passive: false });
stickZone.addEventListener('touchcancel', stickEnd, { passive: false });

/* 視点ドラッグ */
let yaw = Math.PI, pitch = 0;
const LOOK_SENS = 0.0042;
const lookZone = document.getElementById('look-zone');
let lookId = null, lookX = 0, lookY = 0;
lookZone.addEventListener('touchstart', e => { e.preventDefault(); if (lookId === null) { const t = e.changedTouches[0]; lookId = t.identifier; lookX = t.clientX; lookY = t.clientY; } }, { passive: false });
lookZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === lookId) {
    yaw -= (t.clientX - lookX) * LOOK_SENS;
    pitch -= (t.clientY - lookY) * LOOK_SENS;
    pitch = clamp(pitch, -1.3, 1.3);
    lookX = t.clientX; lookY = t.clientY;
  }
}, { passive: false });
lookZone.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; }, { passive: false });
lookZone.addEventListener('touchcancel', () => { lookId = null; }, { passive: false });

/* デスクトップ: ポインタロック + マウス視点 */
let pointerLocked = false;
canvas.addEventListener('click', () => { if (started && !paused && !player.inCar) canvas.requestPointerLock?.(); fireWeaponTry(); });
document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', e => {
  if (!pointerLocked) return;
  yaw -= e.movementX * 0.0024; pitch -= e.movementY * 0.0024; pitch = clamp(pitch, -1.3, 1.3);
});

/* ボタン */
function bindBtn(id, on, off) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); off && off(); }, { passive: false });
  el.addEventListener('mousedown', e => { e.preventDefault(); on(); });
  el.addEventListener('mouseup', e => { e.preventDefault(); off && off(); });
}
bindBtn('btnFire', () => { input.fire = true; input.fireEdge = true; }, () => { input.fire = false; });
bindBtn('btnA', () => { input.action = true; input.actionEdge = true; }, () => { input.action = false; });
bindBtn('btnB', () => { input.run = true; }, () => { input.run = false; });
bindBtn('btnC', () => togglePause(), null);

function readKeyboard() {
  let kx = 0, ky = 0;
  if (keys['a'] || keys['arrowleft']) kx -= 1;
  if (keys['d'] || keys['arrowright']) kx += 1;
  if (keys['w'] || keys['arrowup']) ky -= 1;
  if (keys['s'] || keys['arrowdown']) ky += 1;
  if (kx || ky) { const m = Math.hypot(kx, ky) || 1; input.mx = kx / m; input.my = ky / m; input.mag = 1; }
  if (keys['shift']) input.run = true;
}

/* =====================================================================
   プレイヤー / 武器ビューモデル
   ===================================================================== */
const player = {
  pos: new THREE.Vector3(1700, 0, 2300),
  hp: 100, maxHp: 100, cash: 0, inCar: null, bob: 0, fireCD: 0, dashLeft: 0,
};
const EYE = 26;

// 武器(ピストル)ビューモデル — カメラに追従
const weapon = new THREE.Group();
const gunMat = new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.5, metalness: 0.6 });
const gunBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 5.5), gunMat); gunBody.position.set(0, 0, -1);
const gunBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 3), gunMat); gunBarrel.position.set(0, 0.4, -4);
const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1.6), gunMat); gunGrip.position.set(0, -1.6, 0.6); gunGrip.rotation.x = 0.25;
const handMat = new THREE.MeshStandardMaterial({ color: 0xe8b48c, roughness: 0.8 });
const hand = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 2.2), handMat); hand.position.set(0, -1.4, 1.2);
weapon.add(gunBody, gunBarrel, gunGrip, hand);
const muzzle = new THREE.Mesh(new THREE.SphereGeometry(1.3, 6, 6),
  new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0 }));
muzzle.position.set(0, 0.4, -6); weapon.add(muzzle);
weapon.position.set(3.4, -3.2, -6.5); weapon.scale.set(1.1, 1.1, 1.1);
camera.add(weapon);
scene.add(camera);

/* =====================================================================
   群衆 (歩行者) — 簡易ヒューマノイド
   ===================================================================== */
const skinTones = [0xf2c9a0, 0xe8b48c, 0xd49a6a, 0xc9875a, 0xa86b43];
const hairCols = [0x1a1a1a, 0x2a1a10, 0x3a2a18, 0x5a3a20, 0xcaa050, 0xb03a3a, 0x888888];
const clothCols = [0x2a3b5c, 0x5c2a3b, 0x2a5c3b, 0x444444, 0x6a5acd, 0xc0392b, 0x16a085, 0xe67e22, 0x2c3e50, 0x8e44ad];

const legGeo = new THREE.BoxGeometry(2.4, 9, 2.6);
const armGeo = new THREE.BoxGeometry(1.8, 8, 1.8);
const torsoGeo = new THREE.BoxGeometry(6.2, 9, 3.6);
const headGeo = new THREE.BoxGeometry(4.2, 4.4, 4.2);
const hairGeo = new THREE.BoxGeometry(4.6, 2.2, 4.6);

function makePed(x, z, cop) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: skinTones[randi(0, skinTones.length - 1)], roughness: 0.9 });
  const top = new THREE.MeshStandardMaterial({ color: cop ? 0x1c2740 : clothCols[randi(0, clothCols.length - 1)], roughness: 0.85 });
  const bottom = new THREE.MeshStandardMaterial({ color: cop ? 0x12161f : [0x2c3e50, 0x222222, 0x37474f, 0x5d4037][randi(0, 3)], roughness: 0.9 });
  const torso = new THREE.Mesh(torsoGeo, top); torso.position.y = 16.5; torso.castShadow = true;
  const head = new THREE.Mesh(headGeo, skin); head.position.y = 23.5; head.castShadow = true;
  const hair = new THREE.Mesh(hairGeo, new THREE.MeshStandardMaterial({ color: cop ? 0x223 : hairCols[randi(0, hairCols.length - 1)], roughness: 1 }));
  hair.position.y = 25.4;
  const legL = new THREE.Mesh(legGeo, bottom); legL.position.set(-1.6, 8.5, 0);
  const legR = new THREE.Mesh(legGeo, bottom); legR.position.set(1.6, 8.5, 0);
  const armL = new THREE.Mesh(armGeo, top); armL.position.set(-4, 16.5, 0);
  const armR = new THREE.Mesh(armGeo, top); armR.position.set(4, 16.5, 0);
  legL.castShadow = legR.castShadow = true;
  g.add(torso, head, hair, legL, legR, armL, armR);
  g.position.set(x, 0, z);
  g.traverse(o => { if (o.isMesh) o.userData.ped = g; });
  scene.add(g);
  return {
    g, legL, legR, armL, armR, head,
    ang: rand(0, TAU), speed: rand(22, 40), phase: rand(0, 10), scared: 0, dead: false, hp: cop ? 70 : 30,
    cop: !!cop, fireCD: rand(0.5, 2),
  };
}

const peds = [];
const PED_COUNT = 34;
function spawnPedNear(near) {
  let x, z, ok = false, tries = 0;
  while (!ok && tries++ < 24) {
    if (near) { const a = rand(0, TAU), r = rand(220, 620); x = player.pos.x + Math.cos(a) * r; z = player.pos.z + Math.sin(a) * r; }
    else { x = rand(200, WORLD.w - 200); z = rand(200, WORLD.h - 200); }
    x = clamp(x, 60, WORLD.w - 60); z = clamp(z, 60, WORLD.h - 60);
    ok = !inCollider(x, z, 10);
  }
  return makePed(x, z, false);
}

/* =====================================================================
   車両
   ===================================================================== */
const carPalette = [0xc0392b, 0x2c3e50, 0xecf0f1, 0x27ae60, 0x2980b9, 0xf1c40f, 0x7f8c8d, 0x111111, 0xe67e22, 0x8e44ad];
const wheelGeo = new THREE.CylinderGeometry(4.5, 4.5, 3, 12); wheelGeo.rotateZ(Math.PI / 2);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.8 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x10151f, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.85 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xfff7e0, emissive: 0xfff0c0, emissiveIntensity: 0.4 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff2020, emissiveIntensity: 0.5 });

function makeCarMesh(color, police) {
  const g = new THREE.Group();
  const len = rand(60, 74), w = rand(28, 32), bodyCol = police ? 0x14171d : color;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.35, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, 11, len), bodyMat); body.position.y = 9; body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 9, len * 0.5), glassMat); cabin.position.set(0, 16, -len * 0.02);
  g.add(body, cabin);
  const wy = 4.5, wx = w / 2, wz = len * 0.32;
  for (const [sx, sz] of [[-wx, wz], [wx, wz], [-wx, -wz], [wx, -wz]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat); wheel.position.set(sx, wy, sz); g.add(wheel);
  }
  for (const sx of [-w * 0.32, w * 0.32]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 1.5), headMat); hl.position.set(sx, 9, len / 2); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 1.5), tailMat); tl.position.set(sx, 9, -len / 2); g.add(tl);
  }
  let bar = null;
  if (police) {
    // 白帯
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 4, len * 0.7), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
    stripe.position.set(0, 7, 0); g.add(stripe);
    bar = new THREE.Group();
    const rb = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 3, 5), new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 1.4 }));
    rb.position.set(-w * 0.22, 21.5, 0);
    const bb = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 3, 5), new THREE.MeshStandardMaterial({ color: 0x2040ff, emissive: 0x2040ff, emissiveIntensity: 1.4 }));
    bb.position.set(w * 0.22, 21.5, 0);
    bar.add(rb, bb); g.add(bar);
  }
  scene.add(g);
  return { g, bar, len, w };
}

function makeCar(x, z, ang, police) {
  const mesh = makeCarMesh(carPalette[randi(0, carPalette.length - 1)], police);
  mesh.g.position.set(x, 0, z); mesh.g.rotation.y = ang;
  return {
    ...mesh, x, z, ang, speed: 0, maxSpeed: police ? 360 : rand(220, 300),
    ai: !police, police: !!police, laneT: rand(2, 6), driver: null,
  };
}
const cars = [];
function spawnCarOnRoad() {
  const r = roads2[randi(0, roads2.length - 1)];
  let x, z, ang;
  if (r.w > r.h) { x = rand(r.x, r.x + r.w); z = r.y + r.h / 2; ang = Math.random() < 0.5 ? 0 : Math.PI; }
  else { x = r.x + r.w / 2; z = rand(r.y, r.y + r.h); ang = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2; }
  const c = makeCar(x, z, ang, false); cars.push(c); return c;
}

/* ---------- 衝突判定 ---------- */
function inCollider(x, z, rad) {
  for (const c of colliders) if (x > c.minX - rad && x < c.maxX + rad && z > c.minZ - rad && z < c.maxZ + rad) return true;
  return false;
}
function resolveCollision(pos, rad) {
  for (const c of colliders) {
    const cx = clamp(pos.x, c.minX, c.maxX), cz = clamp(pos.z, c.minZ, c.maxZ);
    const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < rad * rad) {
      const d = Math.sqrt(d2) || 0.0001, push = rad - d;
      pos.x += dx / d * push; pos.z += dz / d * push;
    }
  }
  pos.x = clamp(pos.x, 30, WORLD.w - 30); pos.z = clamp(pos.z, 30, WORLD.h - 30);
}
function nearRoad(x, z, pad) {
  for (const r of roads2) if (x > r.x - pad && x < r.x + r.w + pad && z > r.y - pad && z < r.y + r.h + pad) return true;
  return false;
}

/* =====================================================================
   手配度 / 時間 / ミッション / トースト  (2D版から踏襲)
   ===================================================================== */
let wanted = 0, wantedDecay = 0;
function addWanted(n) { wanted = clamp(wanted + n, 0, 5); wantedDecay = 18; updateWantedUI(); }
function updateWantedUI() {
  let s = ''; for (let i = 0; i < 5; i++) s += `<span class="star ${i < wanted ? '' : 'off'}">★</span>`;
  document.getElementById('wanted').innerHTML = s;
}
let timeOfDay = 7.5;
function nightFactor() {
  const t = timeOfDay; let d;
  if (t < 5) d = 1; else if (t < 7) d = lerp(1, 0.1, (t - 5) / 2);
  else if (t < 17) d = 0.04; else if (t < 19) d = lerp(0.04, 0.85, (t - 17) / 2);
  else if (t < 20) d = lerp(0.85, 1, t - 19); else d = 1;
  return clamp(d, 0, 1);
}

const missions = [
  { title: '到達せよ', desc: 'サンシャイン60前へ向かえ', tx: 4100, tz: 1120, reward: 5000 },
  { title: '配達', desc: '東武百貨店へ向かえ', tx: 1510, tz: 3020, reward: 4000 },
  { title: '潜伏', desc: '西口公園(IWGP)へ逃げ込め', tx: 1440, tz: 2260, reward: 6000 },
  { title: '夜の街', desc: '乙女ロードを目指せ', tx: 3630, tz: 1680, reward: 4500 },
];
let curMission = 0, missionActive = false;
let missionBeam;
function startMission(i) {
  curMission = i % missions.length; missionActive = true;
  const m = missions[curMission];
  if (!missionBeam) {
    missionBeam = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 400, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
    scene.add(missionBeam);
  }
  missionBeam.position.set(m.tx, 200, m.tz); missionBeam.visible = true;
  showMission(); toast(`📍 新ミッション: ${m.title}`);
}
function showMission() {
  const box = document.getElementById('missionBox');
  if (!missionActive) { box.classList.add('hidden'); return; }
  const m = missions[curMission];
  box.classList.remove('hidden');
  box.innerHTML = `<div class="mtitle">MISSION</div>${m.desc}<br><span style="color:var(--gold)">報酬 ¥${m.reward.toLocaleString()}</span>`;
}
function checkMission() {
  if (!missionActive) return;
  const m = missions[curMission];
  const px = player.inCar ? player.inCar.x : player.pos.x, pz = player.inCar ? player.inCar.z : player.pos.z;
  if ((px - m.tx) ** 2 + (pz - m.tz) ** 2 < 120 * 120) {
    player.cash += m.reward; toast(`✅ ミッション達成! +¥${m.reward.toLocaleString()}`);
    missionActive = false; missionBeam.visible = false;
    setTimeout(() => startMission(curMission + 1), 2600); showMission();
  }
}

const toastEl = document.getElementById('toast');
function toast(msg) { const d = document.createElement('div'); d.className = 'toast-item'; d.textContent = msg; toastEl.appendChild(d); setTimeout(() => d.remove(), 3100); }

/* =====================================================================
   射撃 / エフェクト
   ===================================================================== */
const raycaster = new THREE.Raycaster();
raycaster.far = 600;
const tracers = []; // {line, life}
const flashes = []; // {mesh, life}
let audioCtx = null;
function gunSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(180, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.12);
    g.gain.setValueAtTime(0.18, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.13);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.14);
  } catch (e) {}
}

function fireWeaponTry() {
  if (!started || paused || player.inCar) return;
  if (player.fireCD > 0) return;
  player.fireCD = 0.22;
  gunSound();
  // マズルフラッシュ
  muzzle.material.opacity = 1; setTimeout(() => { muzzle.material.opacity = 0; }, 60);
  weapon.position.z = -5.6; // リコイル
  // レイキャスト
  const origin = camera.getWorldPosition(new THREE.Vector3());
  const dir = camera.getWorldDirection(new THREE.Vector3());
  raycaster.set(origin, dir);
  const targets = [];
  for (const p of peds) if (!p.dead) targets.push(p.g);
  const hits = raycaster.intersectObjects(targets, true);
  let hitPoint = origin.clone().add(dir.clone().multiplyScalar(600));
  if (hits.length) {
    hitPoint = hits[0].point;
    let root = hits[0].object; while (root && !root.userData.ped) root = root.parent;
    const ped = peds.find(p => p.g === (root && root.userData.ped));
    if (ped && !ped.dead) {
      ped.hp -= 34; spawnFlash(hitPoint, 0xff3b3b);
      if (ped.hp <= 0) {
        ped.dead = true; ped.g.rotation.z = Math.PI / 2; ped.g.position.y = 3;
        player.cash += randi(50, 400);
        addWanted(ped.cop ? 2 : 1); toast(ped.cop ? '🚓 警官を撃った! 手配度急上昇' : '💢 通報された! 手配度上昇');
      } else { ped.scared = 6; addWanted(0.5); }
    }
  }
  spawnTracer(muzzle.getWorldPosition(new THREE.Vector3()), hitPoint);
}

function spawnTracer(a, b) {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.9 }));
  scene.add(line); tracers.push({ line, life: 0.08 });
}
function spawnFlash(pos, color) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
  m.position.copy(pos); scene.add(m); flashes.push({ mesh: m, life: 0.35 });
}

/* =====================================================================
   更新ロジック
   ===================================================================== */
let started = false, paused = false;
const fwd = new THREE.Vector3(), right = new THREE.Vector3();

function update(dt) {
  if (!started || paused) return;
  readKeyboard();
  timeOfDay += dt * 0.06; if (timeOfDay >= 24) timeOfDay -= 24;

  if (player.inCar) updateDriving(dt); else updateOnFoot(dt);

  if (input.fire || input.fireEdge) fireWeaponTry();
  if (player.fireCD > 0) player.fireCD -= dt;
  weapon.position.z = lerp(weapon.position.z, -6.5, 0.2); // リコイル戻し

  updatePeds(dt);
  updateCars(dt);
  updateTracers(dt);

  if (wantedDecay > 0) wantedDecay -= dt;
  else if (wanted > 0) { wanted = Math.max(0, wanted - dt * 0.1); if (Math.random() < 0.02) updateWantedUI(); }
  manageCops(dt);

  applyDayNight();
  checkMission();
  if (player.hp <= 0) respawn();

  input.fireEdge = false; input.actionEdge = false;
  updateHUD();
}

function updateOnFoot(dt) {
  // カメラ向き
  const e = new THREE.Euler(pitch, yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(e);
  // 移動(視線水平基準)
  fwd.set(Math.sin(yaw), 0, Math.cos(yaw));   // 前方(-Z基準: yaw=PIで+Z)
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  const run = input.run;
  const sp = (run ? 132 : 64) * input.mag;
  if (input.mag > 0.05) {
    // my<0 で前進(スティック上)。fwd は -my 方向
    player.pos.addScaledVector(fwd, -input.my * sp * dt);
    player.pos.addScaledVector(right, input.mx * sp * dt);
    player.bob += dt * (run ? 14 : 9) * input.mag;
  }
  resolveCollision(player.pos, 9);
  // 頭の揺れ(歩行)
  const bobY = Math.sin(player.bob) * (input.mag > 0.05 ? (run ? 1.4 : 0.9) : 0);
  camera.position.set(player.pos.x, EYE + bobY, player.pos.z);
  weapon.position.x = 3.4 + Math.sin(player.bob) * 0.3;
  weapon.position.y = -3.2 + Math.cos(player.bob * 2) * 0.2;

  // 乗車
  if (input.actionEdge) {
    let best = null, bd = 60 * 60;
    for (const c of cars) { const d = (c.x - player.pos.x) ** 2 + (c.z - player.pos.z) ** 2; if (d < bd) { bd = d; best = c; } }
    if (best) enterCar(best);
  }
}

function enterCar(c) {
  player.inCar = c; c.driver = player; c.ai = false;
  weapon.visible = false;
  toast(c.police ? '🚓 パトカーを奪った!' : '🚗 車に乗り込んだ');
  if (c.police) addWanted(2);
  // ポインタロック解除(運転は固定視点)
  if (document.pointerLockElement) document.exitPointerLock?.();
}
function exitCar() {
  const c = player.inCar;
  player.pos.set(c.x + Math.cos(c.ang) * 0 + Math.sin(c.ang) * 40, 0, c.z - Math.sin(c.ang) * 0 + Math.cos(c.ang) * 40);
  resolveCollision(player.pos, 9);
  c.driver = null; c.ai = true; player.inCar = null; weapon.visible = true;
}

function updateDriving(dt) {
  const c = player.inCar;
  const throttle = -input.my + (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
  const steer = input.mx + (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
  const accel = input.run ? 420 : 300;
  c.speed += clamp(throttle, -1, 1) * accel * dt;
  c.speed *= (1 - 1.5 * dt);
  c.speed = clamp(c.speed, -c.maxSpeed * 0.45, c.maxSpeed);
  c.ang -= clamp(steer, -1, 1) * 1.9 * dt * clamp(Math.abs(c.speed) / 70, 0, 1) * Math.sign(c.speed || 1);
  const nx = c.x + Math.sin(c.ang) * c.speed * dt;
  const nz = c.z + Math.cos(c.ang) * c.speed * dt;
  const probe = new THREE.Vector3(nx, 0, nz);
  resolveCollision(probe, c.len * 0.45);
  c.x = probe.x; c.z = probe.z;
  c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.ang;
  // 歩行者を轢く
  for (const p of peds) {
    if (p.dead) continue;
    if ((p.g.position.x - c.x) ** 2 + (p.g.position.z - c.z) ** 2 < (c.len * 0.5) ** 2 && Math.abs(c.speed) > 40) {
      p.dead = true; p.g.rotation.z = Math.PI / 2; p.g.position.y = 3;
      addWanted(1.2); player.cash += randi(20, 200); toast('🩸 轢いてしまった!');
    }
  }
  // カメラ: コックピット視点
  const camPos = new THREE.Vector3(c.x - Math.sin(c.ang) * 6, 22, c.z - Math.cos(c.ang) * 6);
  camera.position.copy(camPos);
  const look = new THREE.Vector3(c.x + Math.sin(c.ang) * 60, 16, c.z + Math.cos(c.ang) * 60);
  camera.lookAt(look);
  // 同期: yaw を車に合わせ降車後に自然に
  yaw = c.ang + Math.PI; pitch = 0;

  if (input.actionEdge) exitCar();
}

function updatePeds(dt) {
  const tx = player.inCar ? player.inCar.x : player.pos.x, tz = player.inCar ? player.inCar.z : player.pos.z;
  for (const p of peds) {
    if (p.dead) { continue; }
    const dx = tx - p.g.position.x, dz = tz - p.g.position.z, dist = Math.hypot(dx, dz);
    if (p.cop) {
      // 警官: 追跡 + 発砲
      p.ang = Math.atan2(dx, dz);
      const sp = 70;
      if (dist > 36) { p.g.position.x += Math.sin(p.ang) * sp * dt; p.g.position.z += Math.cos(p.ang) * sp * dt; }
      p.fireCD -= dt;
      if (dist < 320 && p.fireCD <= 0) {
        p.fireCD = rand(1.1, 2.2);
        if (Math.random() < 0.7) { damagePlayer(rand(5, 12)); spawnTracer(p.head.getWorldPosition(new THREE.Vector3()), camera.getWorldPosition(new THREE.Vector3())); }
      }
      if (dist < 30) damagePlayer(18 * dt);
    } else {
      if (p.scared > 0) p.scared -= dt;
      if (p.scared > 0 || (wanted >= 2 && dist < 150)) { p.ang = Math.atan2(-dx, -dz); var sp = p.speed * 2.3; }
      else { if (Math.random() < 0.01) p.ang += rand(-0.8, 0.8); var sp = p.speed; }
      const nx = p.g.position.x + Math.sin(p.ang) * sp * dt, nz = p.g.position.z + Math.cos(p.ang) * sp * dt;
      if (!inCollider(nx, nz, 8)) { p.g.position.x = nx; p.g.position.z = nz; } else p.ang += Math.PI / 2;
    }
    p.g.position.x = clamp(p.g.position.x, 30, WORLD.w - 30); p.g.position.z = clamp(p.g.position.z, 30, WORLD.h - 30);
    p.g.rotation.y = p.ang;
    // 歩行アニメ
    p.phase += dt * 9;
    const sw = Math.sin(p.phase) * 0.7;
    p.legL.rotation.x = sw; p.legR.rotation.x = -sw;
    p.armL.rotation.x = -sw; p.armR.rotation.x = sw;
    // 遠方リサイクル(警官以外)
    if (!p.cop && ((p.g.position.x - tx) ** 2 + (p.g.position.z - tz) ** 2 > 900 * 900)) {
      const a = rand(0, TAU), r = rand(400, 700);
      let nx = clamp(tx + Math.cos(a) * r, 60, WORLD.w - 60), nz = clamp(tz + Math.sin(a) * r, 60, WORLD.h - 60);
      if (!inCollider(nx, nz, 10)) { p.g.position.set(nx, 0, nz); p.scared = 0; }
    }
  }
}

function updateCars(dt) {
  for (const c of cars) {
    if (c.driver) continue;
    c.laneT -= dt; c.speed = lerp(c.speed, 78, 0.04);
    const fx = c.x + Math.sin(c.ang) * 50, fz = c.z + Math.cos(c.ang) * 50;
    if (inCollider(fx, fz, 6) || !nearRoad(fx, fz, 90)) { c.ang += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2 * dt * 2.2; c.speed *= 0.96; }
    if (c.laneT < 0) { c.laneT = rand(3, 8); if (Math.random() < 0.3) c.ang += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2; }
    c.x += Math.sin(c.ang) * c.speed * dt; c.z += Math.cos(c.ang) * c.speed * dt;
    const probe = new THREE.Vector3(c.x, 0, c.z); resolveCollision(probe, c.len * 0.45); c.x = probe.x; c.z = probe.z;
    c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.ang;
    // 遠方リサイクル
    if ((c.x - player.pos.x) ** 2 + (c.z - player.pos.z) ** 2 > 1300 * 1300) {
      const r = roads2[randi(0, roads2.length - 1)];
      if (r.w > r.h) { c.x = clamp(player.pos.x + rand(-700, 700), r.x, r.x + r.w); c.z = r.y + r.h / 2; c.ang = Math.random() < .5 ? 0 : Math.PI; }
      else { c.x = r.x + r.w / 2; c.z = clamp(player.pos.z + rand(-700, 700), r.y, r.y + r.h); c.ang = Math.random() < .5 ? Math.PI / 2 : -Math.PI / 2; }
    }
  }
}

/* 警官スポーン管理 */
function manageCops(dt) {
  const want = Math.floor(wanted);
  const copCount = peds.filter(p => p.cop && !p.dead).length;
  if (copCount < want && Math.random() < 0.5 * dt + 0.02) {
    const a = rand(0, TAU), r = rand(260, 480);
    let x = clamp(player.pos.x + Math.cos(a) * r, 60, WORLD.w - 60), z = clamp(player.pos.z + Math.sin(a) * r, 60, WORLD.h - 60);
    if (!inCollider(x, z, 10)) peds.push(makePed(x, z, true));
  }
  if (wanted < 0.5) {
    for (const p of peds) if (p.cop && !p.dead && Math.random() < dt * 0.6) { scene.remove(p.g); p.dead = true; }
  }
}

let damageFlashT = 0;
function damagePlayer(n) {
  player.hp -= n; damageFlashT = 0.18;
  document.getElementById('damageFlash').classList.add('on');
}

function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].life -= dt; if (tracers[i].life <= 0) { scene.remove(tracers[i].line); tracers[i].line.geometry.dispose(); tracers.splice(i, 1); } }
  for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.life -= dt; f.mesh.material.opacity = clamp(f.life * 3, 0, 1); f.mesh.scale.multiplyScalar(1 + dt * 4); if (f.life <= 0) { scene.remove(f.mesh); flashes.splice(i, 1); } }
  if (damageFlashT > 0) { damageFlashT -= dt; if (damageFlashT <= 0) document.getElementById('damageFlash').classList.remove('on'); }
}

function respawn() {
  toast('💀 病院に運ばれた…');
  player.hp = player.maxHp; player.cash = Math.max(0, Math.floor(player.cash * 0.8));
  wanted = 0; updateWantedUI();
  for (const p of peds) if (p.cop && !p.dead) { scene.remove(p.g); p.dead = true; }
  if (player.inCar) { player.inCar.driver = null; player.inCar.ai = true; player.inCar = null; weapon.visible = true; }
  player.pos.set(1450, 0, 2260);
}

/* =====================================================================
   昼夜サイクル適用
   ===================================================================== */
const dayTop = new THREE.Color(0x9fb8d8), nightTop = new THREE.Color(0x0a0e1e);
const _c = new THREE.Color();
function applyDayNight() {
  const n = nightFactor();           // 0=昼, 1=夜
  // 太陽位置(時間で東→西、夜は地平線下)
  const dayPhase = clamp((timeOfDay - 5) / 14, 0, 1); // 5時=日の出, 19時=日没
  const elev = Math.sin(dayPhase * Math.PI);          // 0..1..0
  const az = lerp(-1, 1, dayPhase);
  sun.position.set(player.pos.x + az * 400, 60 + elev * 600, player.pos.z - 200 + elev * 100);
  sun.target.position.set(player.pos.x, 0, player.pos.z);
  sun.intensity = lerp(2.4, 0.0, n);
  sun.color.setHSL(0.09, 0.5, lerp(0.62, 0.4, 1 - elev));
  hemi.intensity = lerp(1.05, 0.18, n);
  ambient.intensity = lerp(0.28, 0.12, n);
  // 空・霧の色
  _c.copy(dayTop).lerp(nightTop, n);
  scene.background = _c; scene.fog.color.copy(_c);
  scene.fog.far = lerp(2100, 1500, n);
  // 窓・ネオン・街灯の点灯
  const emi = lerp(0.0, 1.5, clamp((n - 0.25) / 0.6, 0, 1));
  for (const m of facadeMats) m.emissiveIntensity = emi;
  const neonOn = clamp((n - 0.2) / 0.5, 0, 1);
  for (const s of neonMeshes) s.material.emissiveIntensity = neonOn * (0.6 + 0.4 * Math.sin(performance.now() / 400 + s.position.x));
  for (const b of lampBulbs) b.material.emissiveIntensity = n;
  cityGlow.position.set(player.pos.x, 40, player.pos.z);
  cityGlow.intensity = n * 1.2;
  // パトランプ点滅
  const blink = (performance.now() / 180) % 2 < 1;
  for (const c of cars) if (c.bar) { c.bar.children[0].material.emissiveIntensity = blink ? 2 : 0.2; c.bar.children[1].material.emissiveIntensity = blink ? 0.2 : 2; }
}

/* ---------- 影カメラをプレイヤー追従 ---------- */
function updateShadowCam() {
  sun.shadow.camera.updateProjectionMatrix();
}

/* =====================================================================
   ミニマップ (2D)
   ===================================================================== */
const mm = document.getElementById('minimap'), mmx = mm.getContext('2d');
const MM = 150, MM_SCALE = 0.026;
function drawMinimap() {
  mmx.save(); mmx.clearRect(0, 0, MM, MM);
  mmx.beginPath(); mmx.arc(MM / 2, MM / 2, MM / 2, 0, TAU); mmx.clip();
  mmx.fillStyle = '#1a1c28'; mmx.fillRect(0, 0, MM, MM);
  const px = player.inCar ? player.inCar.x : player.pos.x, pz = player.inCar ? player.inCar.z : player.pos.z;
  const to = (x, z) => [MM / 2 + (x - px) * MM_SCALE, MM / 2 + (z - pz) * MM_SCALE];
  mmx.fillStyle = '#3a3d4a';
  for (const r of roads2) { const [sx, sy] = to(r.x, r.y); mmx.fillRect(sx, sy, Math.max(1, r.w * MM_SCALE), Math.max(1, r.h * MM_SCALE)); }
  mmx.fillStyle = '#2e5a32';
  for (const p of parks2) { const [sx, sy] = to(p.x, p.y); mmx.fillRect(sx, sy, p.w * MM_SCALE, p.h * MM_SCALE); }
  mmx.fillStyle = '#888c9c';
  for (const b of blds2) if (b.kind === 'tower' || b.kind === 'mall' || b.kind === 'station') { const [sx, sy] = to(b.x, b.y); mmx.fillRect(sx, sy, b.w * MM_SCALE, b.h * MM_SCALE); }
  if (missionActive) { const m = missions[curMission]; const [sx, sy] = to(m.tx, m.tz); mmx.fillStyle = '#22d3ee'; mmx.beginPath(); mmx.arc(sx, sy, 4, 0, TAU); mmx.fill(); }
  mmx.fillStyle = '#ff3b3b';
  for (const p of peds) if (p.cop && !p.dead) { const [sx, sy] = to(p.g.position.x, p.g.position.z); mmx.beginPath(); mmx.arc(sx, sy, 3, 0, TAU); mmx.fill(); }
  // プレイヤー
  mmx.save(); mmx.translate(MM / 2, MM / 2); mmx.rotate(-yaw + Math.PI);
  mmx.fillStyle = '#22d3ee'; mmx.beginPath(); mmx.moveTo(0, -6); mmx.lineTo(-4, 5); mmx.lineTo(4, 5); mmx.closePath(); mmx.fill(); mmx.restore();
  mmx.restore();
  mmx.fillStyle = 'rgba(255,255,255,.6)'; mmx.font = '9px sans-serif'; mmx.textAlign = 'center'; mmx.fillText('N', MM / 2, 11);
}

/* ---------- HUD ---------- */
const clockEl = document.getElementById('clock'), cashEl = document.getElementById('cash');
const healthBar = document.getElementById('health-bar'), locEl = document.getElementById('locationName');
const places = [
  ['池袋駅 西口', 1750, 2560], ['池袋駅 東口', 2900, 2560], ['西口公園 (IWGP)', 1440, 2260],
  ['サンシャインシティ', 4100, 1680], ['サンシャイン60', 4130, 1130], ['乙女ロード', 3630, 1680],
  ['東池袋', 4000, 2200], ['東武百貨店前', 1500, 3020], ['西武百貨店前', 3230, 3010],
  ['明治通り', 3110, 1500], ['グリーン大通り', 2700, 2585],
];
function currentArea() {
  const px = player.inCar ? player.inCar.x : player.pos.x, pz = player.inCar ? player.inCar.z : player.pos.z;
  let best = '池袋', bd = Infinity;
  for (const [n, x, z] of places) { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < bd) { bd = d; best = n; } }
  return best;
}
function updateHUD() {
  const hh = Math.floor(timeOfDay), mm2 = Math.floor((timeOfDay % 1) * 60);
  clockEl.textContent = `${String(hh).padStart(2, '0')}:${String(mm2).padStart(2, '0')}`;
  cashEl.textContent = '¥ ' + player.cash.toLocaleString();
  healthBar.style.width = clamp(player.hp / player.maxHp * 100, 0, 100) + '%';
  locEl.textContent = currentArea();
  drawMinimap();
}

/* =====================================================================
   ループ
   ===================================================================== */
let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt);
  if (started) renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

/* =====================================================================
   開始 / ポーズ
   ===================================================================== */
function togglePause() {
  if (!started) return;
  paused = !paused;
  const ps = document.getElementById('pauseScreen');
  if (paused) {
    ps.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.getElementById('pauseStats').innerHTML =
      `所持金: <b style="color:var(--gold)">¥${player.cash.toLocaleString()}</b><br>現在地: ${currentArea()}<br>` +
      `手配度: ${'★'.repeat(Math.floor(wanted)) || 'なし'}<br>時刻: ${clockEl.textContent}`;
  } else ps.classList.add('hidden');
}
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', () => location.reload());

function startGame() {
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('controls').classList.remove('hidden');
  started = true; paused = false;
  // 初期スポーン
  for (let i = 0; i < PED_COUNT; i++) peds.push(spawnPedNear(false));
  for (let i = 0; i < 22; i++) spawnCarOnRoad();
  updateWantedUI(); startMission(0);
  camera.position.set(player.pos.x, EYE, player.pos.z);
  try { gunSound(); } catch (e) {}
  const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  toast('🌆 ようこそ池袋へ。右ドラッグで見回し、Aで乗車');
}
document.getElementById('startBtn').addEventListener('click', startGame);

loop();
