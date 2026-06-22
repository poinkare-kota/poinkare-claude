"use strict";
/* =====================================================================
   IKEBUKURO STORIES — 池袋オープンワールド (iPhoneブラウザ対応)
   Pure Canvas / no dependencies. 疑似3Dトップダウン.
   ===================================================================== */

/* ---------- ユーティリティ ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angLerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/* ---------- キャンバス ---------- */
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR);
  cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

/* =====================================================================
   池袋ワールド定義
   座標系: ワールドピクセル. 北が上(-y).
   ===================================================================== */
const WORLD = { w: 5200, h: 5200 };

// 道路セグメント(描画＆車線). type: 'main'(広い), 'sub'(細い)
const roads = [];
function road(x, y, w, h, name, type) { roads.push({ x, y, w, h, name: name || '', type: type || 'sub' }); }

// 縦の大動脈(明治通り) 東側
road(3050, 0, 120, WORLD.h, '明治通り', 'main');
// 縦(駅前西口通り)
road(1750, 0, 100, WORLD.h, '西口通り', 'main');
// 横(グリーン大通り) 駅東口→サンシャイン方面
road(0, 2520, WORLD.w, 130, 'グリーン大通り', 'main');
// 横(サンシャイン60通り)
road(2300, 1650, WORLD.w - 2300, 90, 'サンシャイン60通り', 'sub');
// 駅前ロータリー横
road(1300, 2520, 1300, 130, '', 'main');

// グリッド副道路
for (let gx = 400; gx < WORLD.w; gx += 620) {
  if (Math.abs(gx - 1750) < 200 || Math.abs(gx - 3050) < 200) continue;
  road(gx, 0, 56, WORLD.h, '', 'sub');
}
for (let gy = 420; gy < WORLD.h; gy += 560) {
  if (Math.abs(gy - 2520) < 200 || Math.abs(gy - 1650) < 160) continue;
  road(0, gy, WORLD.w, 50, '', 'sub');
}

// 建物ブロック. h=高さ(疑似3D), roof=屋上色, kind
const buildings = [];
function bld(x, y, w, h, height, col, label, kind) {
  buildings.push({ x, y, w, h, height: height || 60, col: col || '#3a3f55', label: label || '', kind: kind || 'office', lit: Math.random() });
}

/* --- ランドマーク --- */
// 池袋駅 (中央, 大きな駅舎 + 線路)
bld(1900, 2380, 1080, 380, 28, '#4a4e63', '池袋駅', 'station');
// JR線路 (駅から南北)
const rails = { x: 2330, y: 0, w: 210, h: WORLD.h };

// サンシャイン60 / サンシャインシティ (北東) — 超高層
bld(3900, 900, 460, 460, 230, '#5b6178', 'サンシャイン60', 'tower');
bld(3760, 1420, 760, 520, 90, '#474c63', 'サンシャインシティ', 'mall');
// 乙女ロード (サンシャイン西側)
bld(3560, 1420, 150, 520, 40, '#6b4a6b', '乙女ロード', 'shop');

// 西口公園 (IWGP) — 公園ポリゴン
const parks = [
  { x: 1180, y: 2050, w: 520, h: 420, name: '西口公園 (IWGP)' },
  { x: 4350, y: 2750, w: 500, h: 360, name: '東池袋中央公園' },
];
// 東京芸術劇場 (西口公園隣)
bld(1180, 1820, 520, 200, 70, '#6a6f88', '東京芸術劇場', 'civic');
// 東武百貨店 (西口)
bld(1320, 2790, 380, 460, 80, '#7a5230', '東武百貨店', 'mall');
// 西武百貨店 (東口)
bld(3050, 2790, 360, 440, 80, '#1f5f4a', '西武百貨店', 'mall');
// PARCO
bld(3050, 2300, 220, 180, 72, '#b03a5b', 'PARCO', 'mall');
// ビックカメラ
bld(3460, 2300, 230, 180, 60, '#c23a3a', 'ビックカメラ', 'shop');
// 自由に配置する一般ビル
const blockColors = ['#3a3f55', '#414661', '#363b50', '#454a64', '#3d4258', '#4b4258', '#3a4a4f'];
const shopNames = ['居酒屋', 'ラーメン', 'ネカフェ', 'カラオケ', 'ドンキ', '牛丼', 'コンビニ', 'パチンコ', '雑居ビル', 'ホテル', 'BAR', '喫茶'];
function fillBlocks() {
  for (let gx = 200; gx < WORLD.w - 300; gx += 620) {
    for (let gy = 220; gy < WORLD.h - 300; gy += 560) {
      // 道路・既存ランドマーク・公園を避ける
      const cells = [
        [gx + 70, gy + 60, 220, 200],
        [gx + 320, gy + 60, 220, 200],
        [gx + 70, gy + 290, 220, 200],
        [gx + 320, gy + 290, 220, 200],
      ];
      for (const c of cells) {
        const r = { x: c[0], y: c[1], w: c[2], h: c[3] };
        if (overlapsAny(r, roads, 30) || overlapsAny(r, buildings, 10) ||
          overlapsAny(r, parks, 10) || rectHit(r, rails)) continue;
        if (Math.random() < 0.12) continue; // 空き地
        const kind = Math.random() < 0.45 ? 'shop' : 'office';
        const height = kind === 'shop' ? rand(22, 50) : rand(45, 130);
        const col = blockColors[randi(0, blockColors.length - 1)];
        const label = Math.random() < 0.35 ? shopNames[randi(0, shopNames.length - 1)] : '';
        bld(r.x, r.y, r.w, r.h, height, col, label, kind);
      }
    }
  }
}
function rectHit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function overlapsAny(r, arr, pad) {
  pad = pad || 0;
  for (const o of arr) {
    if (r.x < o.x + o.w + pad && r.x + r.w + pad > o.x && r.y < o.y + o.h + pad && r.y + r.h + pad > o.y) return true;
  }
  return false;
}
fillBlocks();

// 衝突対象(建物 + 駅 + 線路)
const solids = buildings.concat([{ x: rails.x, y: rails.y, w: rails.w, h: rails.h }]);

// 街灯位置(道路沿い)
const lamps = [];
for (const r of roads) {
  if (r.type !== 'main') continue;
  if (r.w > r.h) { for (let x = r.x + 80; x < r.x + r.w; x += 260) { lamps.push({ x, y: r.y - 12 }); lamps.push({ x, y: r.y + r.h + 12 }); } }
  else { for (let y = r.y + 80; y < r.y + r.h; y += 260) { lamps.push({ x: r.x - 12, y }); lamps.push({ x: r.x + r.w + 12, y }); } }
}

/* =====================================================================
   入力 (タッチスティック + ボタン + キーボード)
   ===================================================================== */
const input = { mx: 0, my: 0, mag: 0, a: false, b: false, aEdge: false };
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === ' ') input.aEdge = true; });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const stickBase = document.getElementById('stick-base');
const stickKnob = document.getElementById('stick-knob');
const stickZone = document.getElementById('stick-zone');
let stickId = null, stickCx = 0, stickCy = 0;
const STICK_R = 60;
function stickStart(id, x, y) {
  stickId = id; stickCx = x; stickCy = y;
  stickBase.style.display = 'block';
  stickBase.style.left = (x - 65) + 'px';
  stickBase.style.top = (y - 65) + 'px';
  stickBase.style.bottom = 'auto';
  stickKnob.style.left = '35px'; stickKnob.style.top = '35px';
}
function stickMove(x, y) {
  let dx = x - stickCx, dy = y - stickCy;
  const d = Math.hypot(dx, dy);
  if (d > STICK_R) { dx = dx / d * STICK_R; dy = dy / d * STICK_R; }
  stickKnob.style.left = (35 + dx) + 'px';
  stickKnob.style.top = (35 + dy) + 'px';
  input.mx = dx / STICK_R; input.my = dy / STICK_R;
  input.mag = clamp(Math.hypot(input.mx, input.my), 0, 1);
}
function stickEnd() {
  stickId = null; input.mx = input.my = input.mag = 0;
  stickBase.style.display = 'none';
}
stickZone.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  if (stickId === null) stickStart(t.identifier, t.clientX, t.clientY);
}, { passive: false });
stickZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === stickId) stickMove(t.clientX, t.clientY);
}, { passive: false });
stickZone.addEventListener('touchend', e => {
  for (const t of e.changedTouches) if (t.identifier === stickId) stickEnd();
}, { passive: false });
stickZone.addEventListener('touchcancel', stickEnd, { passive: false });

function bindBtn(id, on, off) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); if (off) off(); }, { passive: false });
  el.addEventListener('mousedown', e => { e.preventDefault(); on(); });
  el.addEventListener('mouseup', e => { e.preventDefault(); if (off) off(); });
}
bindBtn('btnA', () => { input.a = true; input.aEdge = true; }, () => { input.a = false; });
bindBtn('btnB', () => { input.b = true; }, () => { input.b = false; });
bindBtn('btnC', () => togglePause(), null);

// マウスドラッグでもスティック(PCデバッグ)
let mouseStick = false;
stickZone.addEventListener('mousedown', e => { mouseStick = true; stickStart('m', e.clientX, e.clientY); });
addEventListener('mousemove', e => { if (mouseStick) stickMove(e.clientX, e.clientY); });
addEventListener('mouseup', () => { if (mouseStick) { mouseStick = false; stickEnd(); } });

function readKeyboard() {
  let kx = 0, ky = 0;
  if (keys['arrowleft'] || keys['a']) kx -= 1;
  if (keys['arrowright'] || keys['d']) kx += 1;
  if (keys['arrowup'] || keys['w']) ky -= 1;
  if (keys['arrowdown'] || keys['s']) ky += 1;
  if (kx || ky) {
    const m = Math.hypot(kx, ky) || 1;
    input.mx = kx / m; input.my = ky / m; input.mag = 1;
  }
  input.b = input.b || keys['shift'];
  if (keys['e']) { input.a = true; input.aEdge = true; }
}

/* =====================================================================
   エンティティ
   ===================================================================== */
// 色パレット(キャラ服)
const skinTones = ['#f2c9a0', '#e8b48c', '#d49a6a', '#c9875a', '#a86b43'];
const hairCols = ['#1a1a1a', '#2a1a10', '#3a2a18', '#5a3a20', '#8a5a30', '#caa050', '#b03a3a', '#3a5ab0', '#888'];
const clothCols = ['#2a3b5c', '#5c2a3b', '#2a5c3b', '#444', '#6a5acd', '#c0392b', '#16a085', '#e67e22', '#2c3e50', '#8e44ad'];

function makePed(x, y) {
  return {
    x, y, ang: rand(0, Math.PI * 2),
    skin: skinTones[randi(0, skinTones.length - 1)],
    hair: hairCols[randi(0, hairCols.length - 1)],
    top: clothCols[randi(0, clothCols.length - 1)],
    bottom: ['#2c3e50', '#34495e', '#222', '#5d4037', '#37474f'][randi(0, 4)],
    speed: rand(28, 52), phase: rand(0, 10), state: 'walk',
    target: null, scared: 0, dead: false, hp: 30, scale: rand(0.92, 1.12),
  };
}
function makeCar(x, y, ang) {
  const palette = ['#c0392b', '#2c3e50', '#ecf0f1', '#27ae60', '#2980b9', '#f1c40f', '#7f8c8d', '#111', '#e67e22', '#8e44ad'];
  return {
    x, y, ang: ang || 0, vx: 0, vy: 0, speed: 0,
    w: rand(34, 40), len: rand(66, 82),
    col: palette[randi(0, palette.length - 1)],
    maxSpeed: rand(190, 240), driver: null, ai: true, aiTarget: null,
    hp: 100, type: Math.random() < 0.18 ? (Math.random() < 0.5 ? 'taxi' : 'truck') : 'car',
    laneTimer: rand(2, 6),
  };
}

// 警察車両
function makeCop(x, y) {
  const c = makeCar(x, y, 0);
  c.type = 'police'; c.col = '#202830'; c.maxSpeed = 250; c.ai = false; c.cop = true;
  c.officer = true; c.w = 38; c.len = 80;
  return c;
}

/* プレイヤー */
const player = {
  x: 1700, y: 2300, ang: -Math.PI / 2, // 西口あたりからスタート
  speed: 0, vx: 0, vy: 0,
  hp: 100, maxHp: 100, cash: 0,
  inCar: null, phase: 0, scale: 1.05,
  skin: '#e8b48c', hair: '#1a1a1a', top: '#1f2a44', bottom: '#222',
  punchT: 0, dashCool: 0,
};

const peds = [];
const cars = [];
const cops = [];
const bullets = [];
const fx = []; // エフェクト(火花/血/煙)

function spawnInitial() {
  for (let i = 0; i < 90; i++) {
    let x, y, ok = false, tries = 0;
    while (!ok && tries++ < 20) {
      x = rand(200, WORLD.w - 200); y = rand(200, WORLD.h - 200);
      ok = !pointInSolids(x, y) && !pointInRoadMain(x, y);
    }
    peds.push(makePed(x, y));
  }
  for (let i = 0; i < 38; i++) spawnCarOnRoad();
}
function spawnCarOnRoad() {
  const r = roads[randi(0, roads.length - 1)];
  let x, y, ang;
  if (r.w > r.h) { x = rand(r.x, r.x + r.w); y = r.y + r.h / 2; ang = Math.random() < 0.5 ? 0 : Math.PI; }
  else { x = r.x + r.w / 2; y = rand(r.y, r.y + r.h); ang = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2; }
  const c = makeCar(x, y, ang); cars.push(c); return c;
}

function pointInSolids(x, y) {
  for (const s of solids) if (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) return true;
  return false;
}
function pointInRoadMain(x, y) {
  for (const r of roads) if (r.type === 'main' && x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
  return false;
}
function onRoad(x, y) {
  for (const r of roads) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
  return false;
}

/* 衝突: 円(半径rad)が建物に重ならないよう押し戻し */
function collideSolids(o, rad) {
  for (const s of solids) {
    const cx = clamp(o.x, s.x, s.x + s.w);
    const cy = clamp(o.y, s.y, s.y + s.h);
    const dx = o.x - cx, dy = o.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < rad * rad) {
      const d = Math.sqrt(d2) || 0.001;
      const push = rad - d;
      o.x += dx / d * push; o.y += dy / d * push;
      if (o.vx !== undefined) { o.vx *= 0.3; o.vy *= 0.3; }
      return true;
    }
  }
  // ワールド境界
  o.x = clamp(o.x, 20, WORLD.w - 20);
  o.y = clamp(o.y, 20, WORLD.h - 20);
  return false;
}

/* =====================================================================
   手配度 / 警察システム
   ===================================================================== */
let wanted = 0;        // 0..5
let wantedDecay = 0;   // クールダウン
function addWanted(n) {
  wanted = clamp(wanted + n, 0, 5);
  wantedDecay = 18; // 秒
  updateWantedUI();
}
function updateWantedUI() {
  const el = document.getElementById('wanted');
  let s = '';
  for (let i = 0; i < 5; i++) s += `<span class="star ${i < wanted ? '' : 'off'}">★</span>`;
  el.innerHTML = s;
}

/* =====================================================================
   時間 / 昼夜
   ===================================================================== */
let timeOfDay = 7.5; // 時間(0-24)
function dayNight() {
  // 0=真昼, 1=真夜中 の暗さ
  const t = timeOfDay;
  let dark;
  if (t < 5) dark = 1;
  else if (t < 7) dark = lerp(1, 0.15, (t - 5) / 2);
  else if (t < 17) dark = 0.05;
  else if (t < 19) dark = lerp(0.05, 0.85, (t - 17) / 2);
  else if (t < 20) dark = lerp(0.85, 1, (t - 19));
  else dark = 1;
  return clamp(dark, 0, 1);
}

/* =====================================================================
   ミッション
   ===================================================================== */
const missions = [
  { title: '到達せよ', desc: 'サンシャイン60前へ向かえ', tx: 4100, ty: 1120, reward: 5000, kind: 'goto' },
  { title: '配達', desc: '東武百貨店へ荷物を届けろ', tx: 1500, ty: 3000, reward: 4000, kind: 'goto' },
  { title: 'カーチェイス', desc: '車で西口公園(IWGP)へ逃げ込め', tx: 1440, ty: 2260, reward: 6000, kind: 'gotocar' },
  { title: '夜の街', desc: '乙女ロードを目指せ', tx: 3630, ty: 1680, reward: 4500, kind: 'goto' },
];
let curMission = 0, missionActive = false;
function startMission(i) {
  curMission = i % missions.length; missionActive = true;
  const m = missions[curMission];
  showMission();
  toast(`📍 新ミッション: ${m.title}`);
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
  const px = player.inCar ? player.inCar.x : player.x;
  const py = player.inCar ? player.inCar.y : player.y;
  const near = dist2(px, py, m.tx, m.ty) < 90 * 90;
  const needCar = m.kind === 'gotocar';
  if (near && (!needCar || player.inCar)) {
    player.cash += m.reward;
    toast(`✅ ミッション達成! +¥${m.reward.toLocaleString()}`);
    missionActive = false;
    setTimeout(() => startMission(curMission + 1), 2600);
    showMission();
  }
}

/* =====================================================================
   トースト
   ===================================================================== */
const toastEl = document.getElementById('toast');
function toast(msg) {
  const d = document.createElement('div');
  d.className = 'toast-item'; d.textContent = msg;
  toastEl.appendChild(d);
  setTimeout(() => d.remove(), 3100);
}

/* =====================================================================
   カメラ
   ===================================================================== */
const cam = { x: player.x, y: player.y, zoom: 1 };
function updateCamera(dt) {
  const tx = player.inCar ? player.inCar.x : player.x;
  const ty = player.inCar ? player.inCar.y : player.y;
  // 進行方向を少し先読み
  let lookX = 0, lookY = 0;
  if (player.inCar) {
    const sp = player.inCar.speed;
    lookX = Math.cos(player.inCar.ang) * sp * 0.45;
    lookY = Math.sin(player.inCar.ang) * sp * 0.45;
  }
  cam.x = lerp(cam.x, tx + lookX, 1 - Math.pow(0.001, dt));
  cam.y = lerp(cam.y, ty + lookY, 1 - Math.pow(0.001, dt));
  const targetZoom = player.inCar ? clamp(1.15 - player.inCar.speed / 900, 0.78, 1.05) : 1.18;
  cam.zoom = lerp(cam.zoom, targetZoom * (Math.min(VW, VH) / 720 + 0.45), 0.05);
  cam.zoom = clamp(cam.zoom, 0.55, 1.8);
}
function w2s(wx, wy) { return [(wx - cam.x) * cam.zoom + VW / 2, (wy - cam.y) * cam.zoom + VH / 2]; }

/* =====================================================================
   更新ロジック
   ===================================================================== */
let paused = false, started = false;
let shakeT = 0, shakeAmp = 0;
function shake(a) { shakeT = 0.35; shakeAmp = a; }

function update(dt) {
  if (paused || !started) return;
  readKeyboard();
  timeOfDay += dt * 0.06; if (timeOfDay >= 24) timeOfDay -= 24;

  if (player.inCar) updateDriving(dt); else updateOnFoot(dt);
  updateCars(dt);
  updatePeds(dt);
  updateCops(dt);
  updateBullets(dt);
  updateFx(dt);

  // 手配度減衰
  if (wantedDecay > 0) wantedDecay -= dt;
  else if (wanted > 0) { wanted = Math.max(0, wanted - dt * 0.12); if (Math.random() < 0.01) updateWantedUI(); }

  // 警察スポーン
  manageCops(dt);

  checkMission();
  if (shakeT > 0) shakeT -= dt;
  input.aEdge = false;

  // HP表示
  if (player.hp <= 0) respawn();
  updateHUD();
}

function updateOnFoot(dt) {
  const sp = 95 * (input.b ? 1.8 : 1) * input.mag;
  if (input.mag > 0.08) {
    player.ang = Math.atan2(input.my, input.mx);
    player.x += input.mx * sp * dt;
    player.y += input.my * sp * dt;
    player.phase += dt * (input.b ? 14 : 9) * input.mag;
    player.speed = sp;
  } else player.speed = lerp(player.speed, 0, 0.3);
  collideSolids(player, 12);

  // Aボタン: 近くの車に乗る / なければパンチ
  if (input.aEdge) {
    let best = null, bd = 70 * 70;
    for (const c of cars.concat(cops)) {
      const d = dist2(player.x, player.y, c.x, c.y);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) enterCar(best);
    else doPunch();
  }
  if (player.punchT > 0) player.punchT -= dt;
}

function doPunch() {
  player.punchT = 0.25;
  const hx = player.x + Math.cos(player.ang) * 26;
  const hy = player.y + Math.sin(player.ang) * 26;
  for (const p of peds) {
    if (p.dead) continue;
    if (dist2(hx, hy, p.x, p.y) < 26 * 26) {
      p.hp -= 20; p.scared = 6;
      p.x += Math.cos(player.ang) * 22; p.y += Math.sin(player.ang) * 22;
      spawnFx(p.x, p.y, '#c0392b', 6);
      if (p.hp <= 0) { p.dead = true; addWanted(1); toast('💢 通報された! 手配度上昇'); player.cash += randi(50, 400); }
      else addWanted(0.5);
      shake(6);
    }
  }
}

function enterCar(c) {
  player.inCar = c; c.driver = player; c.ai = false;
  if (c.cop) { addWanted(2); toast('🚓 パトカーを奪った! 手配度+2'); }
  else toast('🚗 車に乗り込んだ');
}
function exitCar() {
  const c = player.inCar;
  player.x = c.x + Math.cos(c.ang + Math.PI / 2) * 40;
  player.y = c.y + Math.sin(c.ang + Math.PI / 2) * 40;
  c.driver = null; c.ai = true; c.aiTarget = null;
  player.inCar = null;
  collideSolids(player, 12);
}

function updateDriving(dt) {
  const c = player.inCar;
  // 入力: my(前後), mx(左右ステア)
  const throttle = -input.my; // スティック上=前進
  const steer = input.mx;
  const accel = (input.b ? 360 : 260);
  c.speed += throttle * accel * dt;
  c.speed *= (1 - 1.6 * dt); // 抵抗
  c.speed = clamp(c.speed, -c.maxSpeed * 0.5, c.maxSpeed);
  // ステアは速度に依存
  const steerAmt = steer * 2.6 * dt * clamp(Math.abs(c.speed) / 80, 0, 1);
  c.ang += steerAmt * Math.sign(c.speed);
  c.x += Math.cos(c.ang) * c.speed * dt;
  c.y += Math.sin(c.ang) * c.speed * dt;
  const before = { x: c.x, y: c.y };
  if (collideSolids(c, c.len * 0.42)) {
    c.speed *= 0.4; if (Math.abs(c.speed) > 60) { shake(8); spawnFx(c.x, c.y, '#ffcf4a', 4); }
  }
  // 歩行者轢く
  for (const p of peds) {
    if (p.dead) continue;
    if (dist2(c.x, c.y, p.x, p.y) < (c.len * 0.5) ** 2 && Math.abs(c.speed) > 40) {
      p.dead = true; spawnFx(p.x, p.y, '#c0392b', 12); addWanted(1.2);
      player.cash += randi(20, 200); shake(7); toast('🩸 轢いてしまった! 手配度上昇');
    }
  }
  // 車同士の軽い衝突
  for (const o of cars) {
    if (o === c) continue;
    if (dist2(c.x, c.y, o.x, o.y) < (c.len * 0.5 + o.len * 0.5) ** 2) {
      const dx = c.x - o.x, dy = c.y - o.y, d = Math.hypot(dx, dy) || 1;
      o.x -= dx / d * 6; o.y -= dy / d * 6; c.speed *= 0.85;
      if (Math.abs(c.speed) > 120) { shake(5); spawnFx((c.x + o.x) / 2, (c.y + o.y) / 2, '#ffcf4a', 5); }
    }
  }
  // Aボタンで降車
  if (input.aEdge) exitCar();
}

function updateCars(dt) {
  for (const c of cars) {
    if (c.driver) continue; // プレイヤー操作中
    // 簡易AI: 道路に沿って前進、たまに曲がる
    c.laneTimer -= dt;
    c.speed = lerp(c.speed, 90, 0.04);
    // 前方に障害物(建物)があれば減速/方向転換
    const ahead = 50;
    const fx2 = c.x + Math.cos(c.ang) * ahead;
    const fy2 = c.y + Math.sin(c.ang) * ahead;
    if (pointInSolids(fx2, fy2) || !nearRoad(fx2, fy2, 90)) {
      c.ang += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2 * dt * 2.4;
      c.speed *= 0.96;
    }
    if (c.laneTimer < 0) {
      c.laneTimer = rand(3, 8);
      if (Math.random() < 0.3) c.ang += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
    }
    c.x += Math.cos(c.ang) * c.speed * dt;
    c.y += Math.sin(c.ang) * c.speed * dt;
    collideSolids(c, c.len * 0.42);
    // 画面遠方ならリサイクル
    if (dist2(c.x, c.y, cam.x, cam.y) > 2600 * 2600) {
      const nc = spawnCarOnRoad();
      Object.assign(c, nc); cars.pop(); // spawnは末尾追加→popで戻す
    }
  }
}
function nearRoad(x, y, pad) {
  for (const r of roads) if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return true;
  return false;
}

function updatePeds(dt) {
  for (const p of peds) {
    if (p.dead) continue;
    if (p.scared > 0) { p.scared -= dt; }
    const targetX = player.inCar ? player.inCar.x : player.x;
    const targetY = player.inCar ? player.inCar.y : player.y;
    const near = dist2(p.x, p.y, targetX, targetY) < 130 * 130;
    let sp = p.speed;
    if ((p.scared > 0 || (wanted >= 2 && near)) ) {
      // 逃げる
      p.ang = Math.atan2(p.y - targetY, p.x - targetX);
      sp = p.speed * 2.4;
    } else {
      // ふらつき歩行
      if (Math.random() < 0.012) p.ang += rand(-0.8, 0.8);
    }
    const nx = p.x + Math.cos(p.ang) * sp * dt;
    const ny = p.y + Math.sin(p.ang) * sp * dt;
    if (!pointInSolids(nx, ny)) { p.x = nx; p.y = ny; p.phase += dt * 8; }
    else p.ang += Math.PI / 2;
    p.x = clamp(p.x, 20, WORLD.w - 20); p.y = clamp(p.y, 20, WORLD.h - 20);
    // 遠方リサイクル
    if (dist2(p.x, p.y, cam.x, cam.y) > 2200 * 2200) {
      const a = rand(0, Math.PI * 2), r = rand(900, 1400);
      let nx2 = cam.x + Math.cos(a) * r, ny2 = cam.y + Math.sin(a) * r;
      nx2 = clamp(nx2, 100, WORLD.w - 100); ny2 = clamp(ny2, 100, WORLD.h - 100);
      if (!pointInSolids(nx2, ny2)) { p.x = nx2; p.y = ny2; p.scared = 0; }
    }
  }
}

/* 警察AI */
function manageCops(dt) {
  const desired = Math.floor(wanted);
  // 必要数に満たなければスポーン
  if (cops.length < desired && Math.random() < 0.6 * dt + 0.01) {
    const a = rand(0, Math.PI * 2), r = rand(900, 1300);
    let x = cam.x + Math.cos(a) * r, y = cam.y + Math.sin(a) * r;
    x = clamp(x, 100, WORLD.w - 100); y = clamp(y, 100, WORLD.h - 100);
    cops.push(makeCop(x, y));
  }
  while (cops.length > desired + 1 && wanted < 1) cops.pop();
}
function updateCops(dt) {
  const tx = player.inCar ? player.inCar.x : player.x;
  const ty = player.inCar ? player.inCar.y : player.y;
  for (const c of cops) {
    if (c.driver) continue; // プレイヤーが奪ったパトカーはAI制御しない
    const dirA = Math.atan2(ty - c.y, tx - c.x);
    c.ang = angLerp(c.ang, dirA, 0.06);
    c.speed = lerp(c.speed, c.maxSpeed * 0.8, 0.03);
    c.x += Math.cos(c.ang) * c.speed * dt;
    c.y += Math.sin(c.ang) * c.speed * dt;
    collideSolids(c, c.len * 0.42);
    const d2 = dist2(c.x, c.y, tx, ty);
    // 接触で攻撃
    if (d2 < 70 * 70) {
      player.hp -= 14 * dt * 4;
      if (Math.random() < 0.02) spawnFx(player.inCar ? player.inCar.x : player.x, player.inCar ? player.inCar.y : player.y, '#ff5050', 4);
      // 体当たり
      if (player.inCar) { const c2 = player.inCar; c2.speed *= 0.9; shake(4); }
    }
    // 発砲(手配度3以上)
    if (wanted >= 3 && d2 < 360 * 360 && Math.random() < 0.4 * dt) {
      bullets.push({ x: c.x, y: c.y, ang: dirA + rand(-0.1, 0.1), spd: 620, life: 1.2, from: 'cop' });
    }
  }
  // 手配度0でパトカー撤収
  if (wanted < 0.5 && cops.length) { if (Math.random() < dt) cops.pop(); }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += Math.cos(b.ang) * b.spd * dt;
    b.y += Math.sin(b.ang) * b.spd * dt;
    b.life -= dt;
    const px = player.inCar ? player.inCar.x : player.x;
    const py = player.inCar ? player.inCar.y : player.y;
    if (b.from === 'cop' && dist2(b.x, b.y, px, py) < 18 * 18) {
      player.hp -= 8; spawnFx(b.x, b.y, '#ff5050', 5); b.life = 0; shake(4);
    }
    if (b.life <= 0 || pointInSolids(b.x, b.y)) bullets.splice(i, 1);
  }
}

function spawnFx(x, y, col, n) {
  for (let i = 0; i < n; i++) {
    fx.push({ x, y, vx: rand(-80, 80), vy: rand(-80, 80), life: rand(0.3, 0.7), col, r: rand(2, 5) });
  }
}
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; f.life -= dt;
    if (f.life <= 0) fx.splice(i, 1);
  }
}

function respawn() {
  toast('💀 病院に運ばれた…');
  player.hp = player.maxHp; player.cash = Math.max(0, Math.floor(player.cash * 0.8));
  wanted = 0; updateWantedUI(); cops.length = 0;
  if (player.inCar) { player.inCar.driver = null; player.inCar.ai = true; player.inCar = null; }
  // 西口公園付近へ
  player.x = 1450; player.y = 2260; player.hp = player.maxHp;
}

/* =====================================================================
   描画
   ===================================================================== */
function draw() {
  ctx.save();
  // 画面シェイク
  if (shakeT > 0) ctx.translate(rand(-1, 1) * shakeAmp, rand(-1, 1) * shakeAmp);

  const dark = dayNight();
  // 地面ベース
  ctx.fillStyle = '#15161f';
  ctx.fillRect(0, 0, VW, VH);

  drawGround();
  drawRoads();
  drawParks();
  drawRails();
  // 影→建物→エンティティの順
  drawBuildingShadows();
  // エンティティ(地面レベル)
  drawFx();
  drawPeds();
  drawCars();
  drawCops();
  drawBullets();
  drawPlayer();
  // 建物は最後に立体描画(高さ表現でキャラの手前に被さらないよう、近いものを上に)
  drawBuildings();

  // 夜の暗幕 + ライト
  if (dark > 0.1) drawNightLayer(dark);

  drawLandmarkLabels();
  drawMissionMarker();

  ctx.restore();
  drawMinimap();
}

function visible(wx, wy, margin) {
  const [sx, sy] = w2s(wx, wy);
  margin = margin || 200;
  return sx > -margin && sx < VW + margin && sy > -margin && sy < VH + margin;
}

function drawGround() {
  // 舗装/区画感: 暗いベース + 微妙な格子
  const z = cam.zoom;
  ctx.fillStyle = '#1b1d28';
  const [ox, oy] = w2s(0, 0);
  // ブロックの地面(歩道色)
  ctx.fillStyle = '#23252f';
  ctx.fillRect(0, 0, VW, VH);
}

function drawRoads() {
  for (const r of roads) {
    if (!visible(r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * cam.zoom + 200)) continue;
    const [sx, sy] = w2s(r.x, r.y);
    const w = r.w * cam.zoom, h = r.h * cam.zoom;
    ctx.fillStyle = '#33353f';
    ctx.fillRect(sx, sy, w, h);
    // センターライン
    ctx.strokeStyle = 'rgba(240,220,120,.55)';
    ctx.lineWidth = Math.max(1, 2 * cam.zoom);
    ctx.setLineDash([14 * cam.zoom, 12 * cam.zoom]);
    ctx.beginPath();
    if (r.w > r.h) { ctx.moveTo(sx, sy + h / 2); ctx.lineTo(sx + w, sy + h / 2); }
    else { ctx.moveTo(sx + w / 2, sy); ctx.lineTo(sx + w / 2, sy + h); }
    ctx.stroke();
    ctx.setLineDash([]);
    // 歩道縁石
    ctx.strokeStyle = 'rgba(200,200,210,.18)';
    ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
    ctx.strokeRect(sx, sy, w, h);
  }
}

function drawRails() {
  const [sx, sy] = w2s(rails.x, rails.y);
  const w = rails.w * cam.zoom, h = rails.h * cam.zoom;
  ctx.fillStyle = '#2a2c34';
  ctx.fillRect(sx, sy, w, h);
  // レール線
  ctx.strokeStyle = 'rgba(180,180,190,.3)';
  ctx.lineWidth = Math.max(1, 2 * cam.zoom);
  for (let i = 1; i <= 4; i++) {
    const x = sx + w * (i / 5);
    ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + h); ctx.stroke();
  }
  // 枕木
  ctx.strokeStyle = 'rgba(120,90,60,.25)';
  for (let y = sy; y < sy + h; y += 16 * cam.zoom) {
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + w, y); ctx.stroke();
  }
}

function drawParks() {
  for (const p of parks) {
    if (!visible(p.x + p.w / 2, p.y + p.h / 2, 400)) continue;
    const [sx, sy] = w2s(p.x, p.y);
    const w = p.w * cam.zoom, h = p.h * cam.zoom;
    ctx.fillStyle = '#2e5a32';
    ctx.fillRect(sx, sy, w, h);
    // 芝模様
    ctx.fillStyle = 'rgba(40,100,45,.5)';
    for (let i = 0; i < 6; i++) ctx.fillRect(sx + rand(0, w), sy + rand(0, h), 30 * cam.zoom, 18 * cam.zoom);
    // 木
    const tn = Math.floor((p.w * p.h) / 18000);
    let seed = (p.x * 13 + p.y) % 1000;
    const r2 = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < tn; i++) {
      const tx = sx + r2() * w, ty = sy + r2() * h;
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(tx + 3, ty + 3, 10 * cam.zoom, 8 * cam.zoom, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2f7a36';
      ctx.beginPath(); ctx.arc(tx, ty, 11 * cam.zoom, 0, 7); ctx.fill();
      ctx.fillStyle = '#3c9a44';
      ctx.beginPath(); ctx.arc(tx - 2 * cam.zoom, ty - 2 * cam.zoom, 6 * cam.zoom, 0, 7); ctx.fill();
    }
    // 噴水(西口公園)
    if (p.name.includes('IWGP')) {
      const fcx = sx + w / 2, fcy = sy + h / 2;
      ctx.fillStyle = '#4a6a8a';
      ctx.beginPath(); ctx.arc(fcx, fcy, 34 * cam.zoom, 0, 7); ctx.fill();
      ctx.fillStyle = '#7fb3d6';
      ctx.beginPath(); ctx.arc(fcx, fcy, 24 * cam.zoom, 0, 7); ctx.fill();
    }
  }
}

function drawBuildingShadows() {
  const dark = dayNight();
  const shx = lerp(10, 3, dark), shy = lerp(14, 4, dark);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  for (const b of buildings) {
    if (!visible(b.x + b.w / 2, b.y + b.h / 2, b.height * cam.zoom + 300)) continue;
    const [sx, sy] = w2s(b.x, b.y);
    const w = b.w * cam.zoom, h = b.h * cam.zoom;
    const ox = (shx + b.height * 0.12) * cam.zoom, oy = (shy + b.height * 0.14) * cam.zoom;
    ctx.fillRect(sx + ox, sy + oy, w, h);
  }
}

// 疑似3D: 建物を高さ方向にオフセットした上面+側面で描く
function drawBuildings() {
  // カメラから遠い順=上(北)から描画して重なりを自然に
  const list = buildings.filter(b => visible(b.x + b.w / 2, b.y + b.h / 2, b.height * cam.zoom + 400));
  list.sort((a, b) => (a.y + a.h) - (b.y + b.h));
  const dark = dayNight();
  for (const b of list) {
    const [sx, sy] = w2s(b.x, b.y);
    const w = b.w * cam.zoom, h = b.h * cam.zoom;
    // 高さ: 上方向(画面上)に押し上げて立体
    const ext = b.height * cam.zoom * 0.55;
    // 側面(下側=手前)
    const sideCol = shade(b.col, 0.6);
    ctx.fillStyle = sideCol;
    ctx.beginPath();
    ctx.moveTo(sx, sy + h);
    ctx.lineTo(sx + w, sy + h);
    ctx.lineTo(sx + w, sy + h - ext);
    ctx.lineTo(sx, sy + h - ext);
    ctx.closePath(); ctx.fill();
    // 右側面
    ctx.fillStyle = shade(b.col, 0.72);
    ctx.beginPath();
    ctx.moveTo(sx + w, sy);
    ctx.lineTo(sx + w + ext * 0.4, sy - ext * 0.4);
    ctx.lineTo(sx + w + ext * 0.4, sy + h - ext - ext * 0.4);
    ctx.lineTo(sx + w, sy + h - ext);
    ctx.closePath(); ctx.fill();
    // 屋上面(本体)
    const top = { x: sx + ext * 0.0, y: sy - ext * 0.0 };
    ctx.fillStyle = shade(b.col, 1);
    ctx.fillRect(sx, sy - ext, w, h);
    // 屋上ディテール
    ctx.fillStyle = shade(b.col, 1.15);
    ctx.fillRect(sx + w * 0.1, sy - ext + h * 0.1, w * 0.3, h * 0.2);
    if (b.kind === 'tower' || b.kind === 'office') {
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.fillRect(sx + w * 0.6, sy - ext + h * 0.6, w * 0.25, h * 0.25);
    }
    // 窓(夜は点灯)
    drawWindows(b, sx, sy - ext, w, h, dark);
    // 屋上輪郭
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy - ext, w, h);
  }
}

function drawWindows(b, sx, sy, w, h, dark) {
  if (cam.zoom < 0.6) return;
  const cols = Math.max(2, Math.floor(b.w / 34));
  const rows = Math.max(2, Math.floor(b.h / 34));
  const cw = w / cols, ch = h / rows;
  let seed = Math.floor(b.x * 7 + b.y * 3);
  const r2 = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const wx = sx + i * cw + cw * 0.22;
      const wy = sy + j * ch + ch * 0.22;
      const ww = cw * 0.56, wh = ch * 0.56;
      const lit = r2() < (dark * 0.7 + 0.05);
      if (dark > 0.3 && lit) {
        ctx.fillStyle = b.kind === 'shop' ? 'rgba(255,210,120,.9)' : 'rgba(255,230,170,.82)';
      } else {
        ctx.fillStyle = dark > 0.3 ? 'rgba(20,24,34,.6)' : 'rgba(150,170,200,.35)';
      }
      ctx.fillRect(wx, wy, ww, wh);
    }
  }
}

function shade(hex, f) {
  const c = hexToRgb(hex);
  return `rgb(${clamp(c.r * f, 0, 255) | 0},${clamp(c.g * f, 0, 255) | 0},${clamp(c.b * f, 0, 255) | 0})`;
}
const _hexCache = {};
function hexToRgb(hex) {
  if (_hexCache[hex]) return _hexCache[hex];
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const v = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  _hexCache[hex] = v; return v;
}

/* ---------- キャラ描画(疑似リアル: 体パーツ+影+歩行) ---------- */
function drawHuman(o, isPlayer) {
  const [sx, sy] = w2s(o.x, o.y);
  const z = cam.zoom * (o.scale || 1);
  if (sx < -60 || sx > VW + 60 || sy < -60 || sy > VH + 60) return;
  ctx.save();
  ctx.translate(sx, sy);
  // 影
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(2 * z, 4 * z, 12 * z, 7 * z, 0, 0, 7); ctx.fill();
  ctx.rotate(o.ang + Math.PI / 2); // 体の向き
  const walk = Math.sin(o.phase) * (o.speed > 1 || o.scared > 0 ? 1 : 0.15);
  // 脚
  ctx.strokeStyle = o.bottom; ctx.lineCap = 'round';
  ctx.lineWidth = 4.4 * z;
  ctx.beginPath(); ctx.moveTo(-3 * z, 2 * z); ctx.lineTo(-3 * z + walk * 5 * z, 12 * z); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3 * z, 2 * z); ctx.lineTo(3 * z - walk * 5 * z, 12 * z); ctx.stroke();
  // 胴体(肩→腰の台形感)
  ctx.fillStyle = o.top;
  roundRectPath(-6.5 * z, -8 * z, 13 * z, 14 * z, 4 * z); ctx.fill();
  // 胴の陰影
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  roundRectPath(0, -8 * z, 6.5 * z, 14 * z, 3 * z); ctx.fill();
  // 腕
  ctx.strokeStyle = o.top; ctx.lineWidth = 3.8 * z;
  const armSwing = walk * 4 * z;
  const punch = isPlayer && o.punchT > 0 ? 10 * z : 0;
  ctx.beginPath(); ctx.moveTo(-6.5 * z, -5 * z); ctx.lineTo(-9 * z, 4 * z + armSwing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6.5 * z, -5 * z); ctx.lineTo(9 * z + punch * 0.3, 4 * z - armSwing - punch); ctx.stroke();
  // 手
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(-9 * z, 4 * z + armSwing, 2.4 * z, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(9 * z + punch * 0.3, 4 * z - armSwing - punch, 2.6 * z, 0, 7); ctx.fill();
  // 頭(首→頭部)
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(0, -10 * z, 6.2 * z, 0, 7); ctx.fill();
  // 顔の陰
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath(); ctx.arc(2 * z, -10 * z, 6.2 * z, -0.6, 1.4); ctx.fill();
  // 髪
  ctx.fillStyle = o.hair;
  ctx.beginPath(); ctx.arc(0, -11 * z, 6.4 * z, Math.PI * 0.92, Math.PI * 2.08); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -12.5 * z, 6.4 * z, 4 * z, 0, 0, 7); ctx.fill();
  ctx.restore();
}
function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPeds() {
  for (const p of peds) { if (!p.dead) drawHuman(p, false); else drawCorpse(p); }
}
function drawCorpse(p) {
  const [sx, sy] = w2s(p.x, p.y);
  if (sx < -40 || sx > VW + 40 || sy < -40 || sy > VH + 40) return;
  const z = cam.zoom;
  ctx.fillStyle = 'rgba(120,20,20,.4)';
  ctx.beginPath(); ctx.ellipse(sx, sy, 16 * z, 10 * z, 0, 0, 7); ctx.fill();
  ctx.fillStyle = p.top;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.ang);
  roundRectPath(-7 * z, -5 * z, 14 * z, 10 * z, 4 * z); ctx.fill();
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(8 * z, 0, 5 * z, 0, 7); ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  if (player.inCar) return;
  drawHuman(player, true);
  // プレイヤー目印(三角)
  const [sx, sy] = w2s(player.x, player.y);
  ctx.fillStyle = 'rgba(34,211,238,.9)';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 30 * cam.zoom);
  ctx.lineTo(sx - 6, sy - 38 * cam.zoom);
  ctx.lineTo(sx + 6, sy - 38 * cam.zoom);
  ctx.closePath(); ctx.fill();
}

function drawCar(c, isCop) {
  const [sx, sy] = w2s(c.x, c.y);
  const z = cam.zoom;
  if (sx < -120 || sx > VW + 120 || sy < -120 || sy > VH + 120) return;
  ctx.save();
  ctx.translate(sx, sy);
  // 影
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.save(); ctx.translate(3 * z, 4 * z); ctx.rotate(c.ang);
  roundRectPath(-c.len / 2 * z, -c.w / 2 * z, c.len * z, c.w * z, 6 * z); ctx.fill();
  ctx.restore();
  ctx.rotate(c.ang);
  const L = c.len * z, W = c.w * z;
  // 車体
  const grad = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  grad.addColorStop(0, shade(c.col, 1.25));
  grad.addColorStop(0.5, c.col);
  grad.addColorStop(1, shade(c.col, 0.7));
  ctx.fillStyle = grad;
  roundRectPath(-L / 2, -W / 2, L, W, 7 * z); ctx.fill();
  // ウィンドウ/キャビン
  ctx.fillStyle = 'rgba(20,30,45,.85)';
  roundRectPath(-L * 0.05, -W * 0.4, L * 0.42, W * 0.8, 4 * z); ctx.fill();
  // フロントガラス
  ctx.fillStyle = 'rgba(120,160,200,.5)';
  roundRectPath(L * 0.18, -W * 0.34, L * 0.12, W * 0.68, 3 * z); ctx.fill();
  // ボンネットライン
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.2 * z;
  ctx.beginPath(); ctx.moveTo(L * 0.36, -W / 2); ctx.lineTo(L * 0.36, W / 2); ctx.stroke();
  // ヘッドライト
  const dark = dayNight();
  ctx.fillStyle = dark > 0.3 ? '#fffceb' : '#ddd';
  ctx.beginPath(); ctx.arc(L / 2 - 3 * z, -W * 0.32, 2.4 * z, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(L / 2 - 3 * z, W * 0.32, 2.4 * z, 0, 7); ctx.fill();
  // テールライト
  ctx.fillStyle = '#b22';
  ctx.fillRect(-L / 2, -W * 0.4, 2.5 * z, W * 0.18);
  ctx.fillRect(-L / 2, W * 0.22, 2.5 * z, W * 0.18);
  // タクシー
  if (c.type === 'taxi') { ctx.fillStyle = '#111'; ctx.fillRect(-L * 0.05, -W / 2 - 3 * z, L * 0.2, 4 * z); }
  // パトカー(回転灯)
  if (isCop) {
    const t = (performance.now() / 200) % 2;
    ctx.fillStyle = t < 1 ? '#ff2a2a' : '#2a6aff';
    roundRectPath(-L * 0.05, -W * 0.28, L * 0.16, W * 0.56, 2 * z); ctx.fill();
    // 白帯
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(-L / 2, -W / 2 + 2 * z, L, 3 * z);
    ctx.fillRect(-L / 2, W / 2 - 5 * z, L, 3 * z);
  }
  ctx.restore();
  // ヘッドライトの光(夜): 前方に広がる光のコーン
  const nd = dayNight();
  if (nd > 0.35) {
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(c.ang);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,250,210,${0.1 * nd})`;
    ctx.beginPath();
    ctx.moveTo(L / 2, -W * 0.4);
    ctx.lineTo(L / 2 + 150 * z, -W * 1.6);
    ctx.lineTo(L / 2 + 150 * z, W * 1.6);
    ctx.lineTo(L / 2, W * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
function drawCars() { for (const c of cars) drawCar(c, false); }
function drawCops() { for (const c of cops) drawCar(c, true); }

function drawBullets() {
  ctx.fillStyle = '#ffe27a';
  for (const b of bullets) {
    const [sx, sy] = w2s(b.x, b.y);
    ctx.beginPath(); ctx.arc(sx, sy, 2.4 * cam.zoom, 0, 7); ctx.fill();
  }
}
function drawFx() {
  for (const f of fx) {
    const [sx, sy] = w2s(f.x, f.y);
    ctx.globalAlpha = clamp(f.life * 2, 0, 1);
    ctx.fillStyle = f.col;
    ctx.beginPath(); ctx.arc(sx, sy, f.r * cam.zoom, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* 夜レイヤー: 暗幕 + 街灯/ネオン/ヘッドライトの光 */
function drawNightLayer(dark) {
  // 暗幕(青み)
  ctx.fillStyle = `rgba(8,10,30,${dark * 0.62})`;
  ctx.fillRect(0, 0, VW, VH);
  // 光を加算合成
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // 街灯
  for (const l of lamps) {
    if (!visible(l.x, l.y, 200)) continue;
    const [sx, sy] = w2s(l.x, l.y);
    const r = 80 * cam.zoom;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(255,225,150,${0.5 * dark})`);
    g.addColorStop(1, 'rgba(255,225,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
  }
  // ヘッドライト円光
  for (const c of cars.concat(cops, player.inCar ? [player.inCar] : [])) {
    const hx = c.x + Math.cos(c.ang) * c.len * 0.5;
    const hy = c.y + Math.sin(c.ang) * c.len * 0.5;
    if (!visible(hx, hy, 200)) continue;
    const [sx, sy] = w2s(hx, hy);
    const r = 130 * cam.zoom;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(255,250,210,${0.4 * dark})`);
    g.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
  }
  ctx.restore();
  // ネオン看板(歓楽街の建物上)
  drawNeon(dark);
}

const neonColors = ['#ff2e6e', '#22d3ee', '#ffcf4a', '#a855f7', '#10e0a0'];
function drawNeon(dark) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const b of buildings) {
    if (b.kind !== 'shop' && b.kind !== 'mall') continue;
    if (!visible(b.x + b.w / 2, b.y, 200)) continue;
    const ext = b.height * cam.zoom * 0.55;
    const [sx, sy] = w2s(b.x, b.y);
    const w = b.w * cam.zoom;
    let seed = Math.floor(b.x + b.y);
    const col = neonColors[seed % neonColors.length];
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400 + seed);
    ctx.globalAlpha = (0.4 + pulse * 0.4) * dark;
    ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 14 * cam.zoom;
    ctx.fillRect(sx + w * 0.15, sy - ext - 4 * cam.zoom, w * 0.7, 4 * cam.zoom);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawLandmarkLabels() {
  if (cam.zoom < 0.5) return;
  ctx.textAlign = 'center';
  for (const b of buildings) {
    if (!b.label) continue;
    if (!visible(b.x + b.w / 2, b.y + b.h / 2, 200)) continue;
    const big = b.kind === 'tower' || b.kind === 'mall' || b.kind === 'station' || b.kind === 'civic';
    if (!big && cam.zoom < 0.85) continue;
    const [sx, sy] = w2s(b.x + b.w / 2, b.y + b.h / 2);
    const ext = b.height * cam.zoom * 0.55;
    ctx.font = `${big ? 800 : 600} ${(big ? 14 : 10) * clamp(cam.zoom, 0.7, 1.3)}px -apple-system, sans-serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)';
    ctx.strokeText(b.label, sx, sy - ext);
    ctx.fillStyle = big ? '#ffe9a8' : '#dfe3f0';
    ctx.fillText(b.label, sx, sy - ext);
  }
  for (const p of parks) {
    if (!visible(p.x + p.w / 2, p.y, 200)) continue;
    const [sx, sy] = w2s(p.x + p.w / 2, p.y + 20);
    ctx.font = `800 ${13 * clamp(cam.zoom, 0.7, 1.3)}px -apple-system, sans-serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)';
    ctx.strokeText(p.name, sx, sy); ctx.fillStyle = '#c8f0c0'; ctx.fillText(p.name, sx, sy);
  }
}

function drawMissionMarker() {
  if (!missionActive) return;
  const m = missions[curMission];
  const [sx, sy] = w2s(m.tx, m.ty);
  const t = (performance.now() / 500) % 2;
  // 地面リング
  ctx.strokeStyle = 'rgba(34,211,238,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(sx, sy, (24 + Math.abs(Math.sin(performance.now() / 400)) * 10) * cam.zoom, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(34,211,238,.18)';
  ctx.beginPath(); ctx.arc(sx, sy, 24 * cam.zoom, 0, 7); ctx.fill();
  // 画面外なら矢印
  const onScreen = sx > 0 && sx < VW && sy > 0 && sy < VH;
  if (!onScreen) {
    const ex = clamp(sx, 40, VW - 40), ey = clamp(sy, 70, VH - 120);
    const a = Math.atan2(sy - VH / 2, sx - VW / 2);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

/* ---------- ミニマップ ---------- */
const mm = document.getElementById('minimap');
const mmx = mm.getContext('2d');
const MM_SIZE = 150, MM_SCALE = 0.028;
function drawMinimap() {
  mmx.save();
  mmx.clearRect(0, 0, MM_SIZE, MM_SIZE);
  // 円クリップ
  mmx.beginPath(); mmx.arc(MM_SIZE / 2, MM_SIZE / 2, MM_SIZE / 2, 0, 7); mmx.clip();
  mmx.fillStyle = '#1a1c28'; mmx.fillRect(0, 0, MM_SIZE, MM_SIZE);
  const px = player.inCar ? player.inCar.x : player.x;
  const py = player.inCar ? player.inCar.y : player.y;
  const toMM = (x, y) => [MM_SIZE / 2 + (x - px) * MM_SCALE, MM_SIZE / 2 + (y - py) * MM_SCALE];
  // 道路
  mmx.fillStyle = '#3a3d4a';
  for (const r of roads) {
    const [sx, sy] = toMM(r.x, r.y);
    mmx.fillRect(sx, sy, Math.max(1, r.w * MM_SCALE), Math.max(1, r.h * MM_SCALE));
  }
  // 公園
  mmx.fillStyle = '#2e5a32';
  for (const p of parks) { const [sx, sy] = toMM(p.x, p.y); mmx.fillRect(sx, sy, p.w * MM_SCALE, p.h * MM_SCALE); }
  // ランドマーク点
  mmx.fillStyle = '#888c9c';
  for (const b of buildings) { if (b.kind === 'tower' || b.kind === 'mall' || b.kind === 'station') { const [sx, sy] = toMM(b.x, b.y); mmx.fillRect(sx, sy, b.w * MM_SCALE, b.h * MM_SCALE); } }
  // ミッション
  if (missionActive) {
    const m = missions[curMission]; const [sx, sy] = toMM(m.tx, m.ty);
    mmx.fillStyle = '#22d3ee'; mmx.beginPath(); mmx.arc(sx, sy, 4, 0, 7); mmx.fill();
  }
  // 警察
  mmx.fillStyle = '#ff3b3b';
  for (const c of cops) { const [sx, sy] = toMM(c.x, c.y); mmx.beginPath(); mmx.arc(sx, sy, 3, 0, 7); mmx.fill(); }
  // プレイヤー(中央, 向き)
  mmx.save(); mmx.translate(MM_SIZE / 2, MM_SIZE / 2);
  mmx.rotate((player.inCar ? player.inCar.ang : player.ang) + Math.PI / 2);
  mmx.fillStyle = '#22d3ee';
  mmx.beginPath(); mmx.moveTo(0, -6); mmx.lineTo(-4, 5); mmx.lineTo(4, 5); mmx.closePath(); mmx.fill();
  mmx.restore();
  mmx.restore();
  // 北マーカー
  mmx.fillStyle = 'rgba(255,255,255,.6)'; mmx.font = '9px sans-serif'; mmx.textAlign = 'center';
  mmx.fillText('N', MM_SIZE / 2, 11);
}

/* ---------- HUD ---------- */
const clockEl = document.getElementById('clock');
const cashEl = document.getElementById('cash');
const healthBar = document.getElementById('health-bar');
const locEl = document.getElementById('locationName');
function updateHUD() {
  const hh = Math.floor(timeOfDay), mm2 = Math.floor((timeOfDay % 1) * 60);
  clockEl.textContent = `${String(hh).padStart(2, '0')}:${String(mm2).padStart(2, '0')}`;
  cashEl.textContent = '¥ ' + player.cash.toLocaleString();
  healthBar.style.width = clamp(player.hp / player.maxHp * 100, 0, 100) + '%';
  // 現在地名
  locEl.textContent = currentArea();
}
function currentArea() {
  const px = player.inCar ? player.inCar.x : player.x;
  const py = player.inCar ? player.inCar.y : player.y;
  let best = '池袋', bd = Infinity;
  const places = [
    ['池袋駅 西口', 1750, 2560], ['池袋駅 東口', 2900, 2560], ['西口公園 (IWGP)', 1440, 2260],
    ['サンシャインシティ', 4100, 1680], ['サンシャイン60', 4130, 1130], ['乙女ロード', 3630, 1680],
    ['東池袋', 4000, 2200], ['東武百貨店前', 1500, 3020], ['西武百貨店前', 3230, 3010],
    ['明治通り', 3110, 1500], ['グリーン大通り', 2700, 2585],
  ];
  for (const [n, x, y] of places) { const d = dist2(px, py, x, y); if (d < bd) { bd = d; best = n; } }
  return best;
}

/* =====================================================================
   ゲームループ
   ===================================================================== */
let last = 0;
function loop(ts) {
  const dt = Math.min(0.04, (ts - last) / 1000 || 0);
  last = ts;
  update(dt);
  updateCamera(dt);
  if (started) draw();
  requestAnimationFrame(loop);
}

/* =====================================================================
   制御: 開始 / ポーズ
   ===================================================================== */
function togglePause() {
  if (!started) return;
  paused = !paused;
  const ps = document.getElementById('pauseScreen');
  if (paused) {
    ps.classList.remove('hidden');
    document.getElementById('pauseStats').innerHTML =
      `所持金: <b style="color:var(--gold)">¥${player.cash.toLocaleString()}</b><br>` +
      `現在地: ${currentArea()}<br>手配度: ${'★'.repeat(Math.floor(wanted)) || 'なし'}<br>` +
      `時刻: ${clockEl.textContent}`;
  } else ps.classList.add('hidden');
}
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', () => location.reload());

function startGame() {
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('controls').classList.remove('hidden');
  started = true; paused = false;
  spawnInitial();
  updateWantedUI();
  startMission(0);
  // フルスクリーン試行(iOSは制限あり)
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  toast('🌆 ようこそ池袋へ。Aボタンで車に乗ろう');
}
document.getElementById('startBtn').addEventListener('click', startGame);

requestAnimationFrame(loop);
