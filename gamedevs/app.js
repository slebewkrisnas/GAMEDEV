import * as THREE from 'three';
import { initNPCSystem, updateNPCSystem } from './npc_system.js?v=3';

// ==================== SCENE ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 120, 400);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ==================== LIGHTING ====================
scene.add(new THREE.AmbientLight(0xffffff, 0.75));

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(50, 80, 30);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.0005;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xfff0e6, 0.45);
fillLight.position.set(-30, 40, -40);
scene.add(fillLight);

scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4a8f3c, 0.65));

// ==================== BATAS MAP ====================
const WORLD_RADIUS = 60;

// ==================== GROUND ====================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x4a8f3c })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(200, 40, 0x2a5f1f, 0x2a5f1f);
grid.material.opacity = 0.15;
grid.material.transparent = true;
scene.add(grid);

// ==================== SPAWN POINT ====================
const SPAWN_DISTANCE = WORLD_RADIUS - 5;
const SPAWN_ANGLE = Math.PI / 2;
const SPAWN_POS = new THREE.Vector3(
  Math.cos(SPAWN_ANGLE) * SPAWN_DISTANCE,
  0,
  Math.sin(SPAWN_ANGLE) * SPAWN_DISTANCE
);

// ==================== UTIL ====================
function createRibbonGeometry(curve, width, segments, yOffset = 0) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const halfW = width / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const widthVariance = 1 + Math.sin(t * 20) * 0.08;
    const w = halfW * widthVariance;

    const left  = p.clone().addScaledVector(perp, w);
    const right = p.clone().addScaledVector(perp, -w);

    positions.push(left.x, yOffset, left.z);
    positions.push(right.x, yOffset, right.z);

    uvs.push(0, t * 6);
    uvs.push(1, t * 6);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createPath(curve, segments = 200) {
  const borderGeo = createRibbonGeometry(curve, 3.0, segments, 0.015);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x6a5638, roughness: 1.0 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.receiveShadow = true;
  scene.add(border);

  const mainGeo = createRibbonGeometry(curve, 2.4, segments, 0.025);
  const mainMat = new THREE.MeshStandardMaterial({ color: 0xb89870, roughness: 0.95 });
  const main = new THREE.Mesh(mainGeo, mainMat);
  main.receiveShadow = true;
  scene.add(main);

  const centerGeo = createRibbonGeometry(curve, 0.9, segments, 0.032);
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xc8a880, roughness: 0.95 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.receiveShadow = true;
  scene.add(center);
}

// ==================== JALAN UTAMA ====================
const pathPoints = [
  new THREE.Vector3(SPAWN_POS.x, 0.02, SPAWN_POS.z),
  new THREE.Vector3(SPAWN_POS.x + 8, 0.02, 42),
  new THREE.Vector3(SPAWN_POS.x - 6, 0.02, 28),
  new THREE.Vector3(0, 0.02, 16),
  new THREE.Vector3(0, 0.02, 5)
];
const pathCurve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
createPath(pathCurve, 200);

// ==================== JALAN CABANG KIRI (PERKEBUNAN) ====================
const branchLeftStart = pathCurve.getPoint(0.35);
const branchLeftPoints = [
  new THREE.Vector3(branchLeftStart.x, 0.02, branchLeftStart.z),
  new THREE.Vector3(-14, 0.02, branchLeftStart.z - 2),
  new THREE.Vector3(-20, 0.02, 22),
  new THREE.Vector3(-25, 0.02, 22)
];
const branchLeftCurve = new THREE.CatmullRomCurve3(branchLeftPoints, false, 'catmullrom', 0.5);
createPath(branchLeftCurve, 120);

// ==================== JALAN CABANG KANAN (KAMP) ====================
const branchRightStart = pathCurve.getPoint(0.62);
const branchRightPoints = [
  new THREE.Vector3(branchRightStart.x, 0.02, branchRightStart.z),
  new THREE.Vector3(14, 0.02, branchRightStart.z - 3),
  new THREE.Vector3(22, 0.02, -12),
  new THREE.Vector3(25, 0.02, -12)
];
const branchRightCurve = new THREE.CatmullRomCurve3(branchRightPoints, false, 'catmullrom', 0.5);
createPath(branchRightCurve, 120);

// ==================== ⭐ BARU: JALAN CABANG KANAN BAWAH (ARENA FIGHT) ⭐ ====================
const branchArenaStart = pathCurve.getPoint(0.32);
const branchArenaPoints = [
  new THREE.Vector3(branchArenaStart.x, 0.02, branchArenaStart.z),
  new THREE.Vector3(8, 0.02, 26),
  new THREE.Vector3(14, 0.02, 22),
  new THREE.Vector3(18, 0.02, 22)
];
const branchArenaCurve = new THREE.CatmullRomCurve3(branchArenaPoints, false, 'catmullrom', 0.5);
createPath(branchArenaCurve, 120);

// ==================== ⭐ JALUR UTAMA & KONEKSI RAPI KE DUA PATUNG ⭐ ====================

// 1. Plaza Bundaran Persimpangan Tengah (Central Plaza di z = 5)
// Menyatukan jalan dari spawn, jalan ke Patung Prisma, dan jalan ke Patung GameDev tanpa sambungan aneh
const junctionBorder = new THREE.Mesh(
  new THREE.CircleGeometry(3.6, 32),
  new THREE.MeshStandardMaterial({ color: 0x6a5638, roughness: 1.0 })
);
junctionBorder.rotation.x = -Math.PI / 2;
junctionBorder.position.set(0, 0.021, 5);
junctionBorder.receiveShadow = true;
scene.add(junctionBorder);

const junctionMain = new THREE.Mesh(
  new THREE.CircleGeometry(3.0, 32),
  new THREE.MeshStandardMaterial({ color: 0xb89870, roughness: 0.95 })
);
junctionMain.rotation.x = -Math.PI / 2;
junctionMain.position.set(0, 0.026, 5);
junctionMain.receiveShadow = true;
scene.add(junctionMain);

const junctionCenter = new THREE.Mesh(
  new THREE.CircleGeometry(1.2, 32),
  new THREE.MeshStandardMaterial({ color: 0xc8a880, roughness: 0.95 })
);
junctionCenter.rotation.x = -Math.PI / 2;
junctionCenter.position.set(0, 0.033, 5);
junctionCenter.receiveShadow = true;
scene.add(junctionCenter);

// 2. Pelataran Batu Melingkar untuk Patung GameDev 25 (di x = -14, z = 5)
const gamedevPlazaBorder = new THREE.Mesh(
  new THREE.RingGeometry(7.8, 9.8, 32),
  new THREE.MeshStandardMaterial({ color: 0x6a5638, roughness: 1.0, side: THREE.DoubleSide })
);
gamedevPlazaBorder.rotation.x = -Math.PI / 2;
gamedevPlazaBorder.position.set(-14, 0.021, 5);
gamedevPlazaBorder.receiveShadow = true;
scene.add(gamedevPlazaBorder);

const gamedevPlazaInner = new THREE.Mesh(
  new THREE.RingGeometry(8.0, 9.2, 32),
  new THREE.MeshStandardMaterial({ color: 0xb89870, roughness: 0.95, side: THREE.DoubleSide })
);
gamedevPlazaInner.rotation.x = -Math.PI / 2;
gamedevPlazaInner.position.set(-14, 0.025, 5);
gamedevPlazaInner.receiveShadow = true;
scene.add(gamedevPlazaInner);

// 3. Boulevard Lurus ke Patung Logo Universitas Prisma (Utara)
// Tersambung presisi ke pelataran patung Prisma di z = -14.6 (-35 + 20.4)
const roadToLogoPoints = [
  new THREE.Vector3(0, 0.02, 5),
  new THREE.Vector3(0, 0.02, -5),
  new THREE.Vector3(0, 0.02, -14.6)
];
const roadToLogoCurve = new THREE.CatmullRomCurve3(roadToLogoPoints, false, 'catmullrom', 0.5);
createPath(roadToLogoCurve, 60);

// 4. Jalan Penghubung ke Patung GameDev 25 (Barat / Kiri)
// Menghubungkan bundaran tengah langsung ke pelataran GameDev di x = -6.2
const roadToGameDevPoints = [
  new THREE.Vector3(0, 0.02, 5),
  new THREE.Vector3(-3.5, 0.02, 5),
  new THREE.Vector3(-6.2, 0.02, 5)
];
const roadToGameDevCurve = new THREE.CatmullRomCurve3(roadToGameDevPoints, false, 'catmullrom', 0.5);
createPath(roadToGameDevCurve, 40);

// 5. Jalur Santai Melengkung Menghubungkan Patung GameDev ke Patung Prisma
const walkwayGameDevToLogoPoints = [
  new THREE.Vector3(-10, 0.02, 1),
  new THREE.Vector3(-8, 0.02, -6),
  new THREE.Vector3(-4.5, 0.02, -15.2)
];
const walkwayGameDevToLogoCurve = new THREE.CatmullRomCurve3(walkwayGameDevToLogoPoints, false, 'catmullrom', 0.5);
createPath(walkwayGameDevToLogoCurve, 50);

// ==================== COLLISION SYSTEM (PAGAR) ====================
const collisionWalls = [];
const PLAYER_RADIUS = 0.5;
const WALL_THICKNESS = 0.3;

function addWallSegment(x1, z1, x2, z2) {
  collisionWalls.push({
    minX: Math.min(x1, x2) - WALL_THICKNESS / 2,
    maxX: Math.max(x1, x2) + WALL_THICKNESS / 2,
    minZ: Math.min(z1, z2) - WALL_THICKNESS / 2,
    maxZ: Math.max(z1, z2) + WALL_THICKNESS / 2
  });
}

function resolveWallCollisions(pos) {
  for (const wall of collisionWalls) {
    const minX = wall.minX - PLAYER_RADIUS;
    const maxX = wall.maxX + PLAYER_RADIUS;
    const minZ = wall.minZ - PLAYER_RADIUS;
    const maxZ = wall.maxZ + PLAYER_RADIUS;

    if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
      const distLeft   = pos.x - minX;
      const distRight  = maxX - pos.x;
      const distTop    = pos.z - minZ;
      const distBottom = maxZ - pos.z;

      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist === distLeft)       pos.x = minX;
      else if (minDist === distRight) pos.x = maxX;
      else if (minDist === distTop)   pos.z = minZ;
      else                            pos.z = maxZ;
    }
  }
}

// ==================== PERKEBUNAN ====================
const PLANT = { cx: -38, cz: 22, w: 26, d: 22, entranceZ: 22, entranceWidth: 4 };
const PLANT_X1 = PLANT.cx - PLANT.w / 2;
const PLANT_X2 = PLANT.cx + PLANT.w / 2;
const PLANT_Z1 = PLANT.cz - PLANT.d / 2;
const PLANT_Z2 = PLANT.cz + PLANT.d / 2;

const fencePostMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
const fenceRailMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.85 });

function createFencePost(x, z, height = 1.8) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, height, 8), fencePostMat);
  post.position.set(x, height / 2, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 8), fencePostMat);
  tip.position.set(x, height + 0.07, z);
  tip.castShadow = true;
  scene.add(tip);
}

function createFenceRail(x1, z1, x2, z2, y) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const angle = Math.atan2(dx, dz);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, len), fenceRailMat);
  rail.position.set(midX, y, midZ);
  rail.rotation.y = angle;
  rail.castShadow = true;
  rail.receiveShadow = true;
  scene.add(rail);
}

function createFenceLine(x1, z1, x2, z2, spacing = 1.8, addCollision = true) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const numPosts = Math.max(2, Math.floor(len / spacing) + 1);
  const posts = [];
  for (let i = 0; i < numPosts; i++) {
    const t = i / (numPosts - 1);
    const px = x1 + dx * t;
    const pz = z1 + dz * t;
    createFencePost(px, pz);
    posts.push({ x: px, z: pz });
  }
  for (let i = 0; i < posts.length - 1; i++) {
    createFenceRail(posts[i].x, posts[i].z, posts[i + 1].x, posts[i + 1].z, 1.2);
    createFenceRail(posts[i].x, posts[i].z, posts[i + 1].x, posts[i + 1].z, 0.6);
  }
  if (addCollision) addWallSegment(x1, z1, x2, z2);
}

createFenceLine(PLANT_X1, PLANT_Z1, PLANT_X2, PLANT_Z1);
createFenceLine(PLANT_X1, PLANT_Z2, PLANT_X2, PLANT_Z2);
createFenceLine(PLANT_X1, PLANT_Z1, PLANT_X1, PLANT_Z2);

const entranceHalf = PLANT.entranceWidth / 2;
const entranceZ1 = PLANT.entranceZ - entranceHalf;
const entranceZ2 = PLANT.entranceZ + entranceHalf;
createFenceLine(PLANT_X2, PLANT_Z1, PLANT_X2, entranceZ1);
createFenceLine(PLANT_X2, entranceZ2, PLANT_X2, PLANT_Z2);

function createGatePost(x, z) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.4, 8), fencePostMat);
  post.position.set(x, 1.2, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);
}
createGatePost(PLANT_X2, entranceZ1);
createGatePost(PLANT_X2, entranceZ2);

// ==================== ⭐ PAPAN NAMA FRUIT BLOCK BLAST (TINGGI) ⭐ ====================
function createFruitBlastSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#d4a870');
  grad.addColorStop(0.5, '#b8863f');
  grad.addColorStop(1, '#8a6438');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(90, 60, 30, 0.25)';
  ctx.lineWidth = 2;
  for (let y = 30; y < canvas.height; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(canvas.width * 0.33, y + 6, canvas.width * 0.66, y - 6, canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 88px "Baloo 2", Arial, sans-serif';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#3a1a08';
  ctx.strokeText('FRUIT BLOCK BLAST', canvas.width / 2, 125);
  const textGrad = ctx.createLinearGradient(0, 70, 0, 170);
  textGrad.addColorStop(0, '#fff7c2');
  textGrad.addColorStop(1, '#ffb020');
  ctx.fillStyle = textGrad;
  ctx.fillText('FRUIT BLOCK BLAST', canvas.width / 2, 125);

  const fruits = ['🍎', '🍌', '🍇', '🍊', '🍉', '🍓'];
  const spacing = canvas.width / (fruits.length + 1);
  ctx.font = '96px Arial, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  fruits.forEach((fruit, i) => {
    ctx.fillText(fruit, spacing * (i + 1), 288);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

const signTexture = createFruitBlastSignTexture();
const signFaceMat = new THREE.MeshStandardMaterial({
  map: signTexture,
  roughness: 0.75,
  metalness: 0.05
});
const signEdgeMat = new THREE.MeshStandardMaterial({
  color: 0x5a3a1a,
  roughness: 0.95
});

const signBoard = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 2.4, 6.4),
  [
    signFaceMat,
    signFaceMat,
    signEdgeMat,
    signEdgeMat,
    signEdgeMat,
    signEdgeMat
  ]
);
signBoard.position.set(PLANT_X2 + 0.15, 6.0, PLANT.entranceZ);
signBoard.castShadow = true;
signBoard.receiveShadow = true;
scene.add(signBoard);

const signPostMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
function createSignPost(x, z) {
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 7.4, 8),
    signPostMat
  );
  post.position.set(x, 3.7, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), signPostMat);
  cap.position.set(x, 7.4, z);
  cap.castShadow = true;
  scene.add(cap);
}
createSignPost(PLANT_X2 + 0.15, PLANT.entranceZ - 3.1);
createSignPost(PLANT_X2 + 0.15, PLANT.entranceZ + 3.1);

const ropeMat = new THREE.MeshStandardMaterial({ color: 0x3a2810, roughness: 0.95 });
function createSignRope(x, z) {
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6),
    ropeMat
  );
  rope.position.set(x, 7.05, z);
  scene.add(rope);
}
createSignRope(PLANT_X2 + 0.15, PLANT.entranceZ - 3.1);
createSignRope(PLANT_X2 + 0.15, PLANT.entranceZ + 3.1);

const signLight = new THREE.PointLight(0xffe0a0, 1.5, 16);
signLight.position.set(PLANT_X2 + 2.5, 8.0, PLANT.entranceZ);
scene.add(signLight);
// ==================== END PAPAN NAMA ====================

// ==================== ⭐⭐ PERKEBUNAN INDAH & CANTIK ⭐⭐ ====================

// ---- Tanah dasar ----
const soilMat = new THREE.MeshStandardMaterial({ color: 0x5a3d1f, roughness: 1.0 });
const soil = new THREE.Mesh(new THREE.PlaneGeometry(PLANT.w - 1, PLANT.d - 1), soilMat);
soil.rotation.x = -Math.PI / 2;
soil.position.set(PLANT.cx, 0.02, PLANT.cz);
soil.receiveShadow = true;
scene.add(soil);

// ---- Alur bajak (furrows) ----
const furrowMat = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 1.0 });
const furrowCount = 12;
for (let i = 0; i < furrowCount; i++) {
  const fz = PLANT_Z1 + 2 + i * ((PLANT.d - 4) / (furrowCount - 1));
  const furrow = new THREE.Mesh(new THREE.BoxGeometry(PLANT.w - 3, 0.04, 0.15), furrowMat);
  furrow.position.set(PLANT.cx, 0.045, fz);
  furrow.receiveShadow = true;
  scene.add(furrow);
}

// ---- Material tanaman ----
const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a6a2a, roughness: 0.9 });
const leafMatA = new THREE.MeshStandardMaterial({ color: 0x2e8b2e, roughness: 0.85 });
const leafMatB = new THREE.MeshStandardMaterial({ color: 0x3a9a3a, roughness: 0.85 });
const leafMatC = new THREE.MeshStandardMaterial({ color: 0x256625, roughness: 0.85 });
const leafMatD = new THREE.MeshStandardMaterial({ color: 0x5ab54a, roughness: 0.85 });
const leafMats = [leafMatA, leafMatB, leafMatC, leafMatD];

const tomatoMat   = new THREE.MeshStandardMaterial({ color: 0xe83a2a, roughness: 0.45, emissive: 0x3a0800, emissiveIntensity: 0.15 });
const cornMat     = new THREE.MeshStandardMaterial({ color: 0xffdd44, roughness: 0.5 });
const pumpkinMat  = new THREE.MeshStandardMaterial({ color: 0xff6a1a, roughness: 0.6 });
const sunflowerMat= new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5, emissive: 0x4a3a00, emissiveIntensity: 0.2 });
const lettuceMat  = new THREE.MeshStandardMaterial({ color: 0x66cc44, roughness: 0.85 });
const berryMat    = new THREE.MeshStandardMaterial({ color: 0xcc2266, roughness: 0.4, emissive: 0x3a0015, emissiveIntensity: 0.15 });

// ---- Factory tanaman (7 jenis) ----
function createPlant(type, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.18, z);
  g.rotation.y = Math.random() * Math.PI * 2;

  if (type === 'tomato') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 6), stemMat);
    stem.position.y = 0.35; stem.castShadow = true; g.add(stem);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), leafMats[i % leafMats.length]);
      const a = i * 1.3;
      leaf.position.set(Math.cos(a) * 0.12, 0.3 + i * 0.1, Math.sin(a) * 0.12);
      leaf.scale.set(1, 0.6, 1); leaf.castShadow = true; g.add(leaf);
    }
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), tomatoMat);
      const a = i * 2.1;
      t.position.set(Math.cos(a) * 0.14, 0.35 + i * 0.12, Math.sin(a) * 0.14);
      t.castShadow = true; g.add(t);
    }
  } else if (type === 'carrot') {
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 5), leafMatB);
      const a = (i / 4) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.05, 0.15, Math.sin(a) * 0.05);
      leaf.rotation.z = Math.cos(a) * 0.3;
      leaf.rotation.x = Math.sin(a) * 0.3;
      leaf.castShadow = true; g.add(leaf);
    }
  } else if (type === 'corn') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), stemMat);
    stem.position.y = 0.7; stem.castShadow = true; g.add(stem);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.12), leafMatB);
      const a = i * 1.0;
      leaf.position.set(Math.cos(a) * 0.2, 0.4 + i * 0.15, Math.sin(a) * 0.2);
      leaf.rotation.y = a; leaf.rotation.z = -0.3;
      leaf.castShadow = true; g.add(leaf);
    }
    const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8), cornMat);
    cob.position.set(0.08, 0.85, 0); cob.castShadow = true; g.add(cob);
  } else if (type === 'lettuce') {
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lettuceMat);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1);
      leaf.scale.set(1, 0.7, 1); leaf.castShadow = true; g.add(leaf);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lettuceMat);
    core.position.y = 0.15; core.castShadow = true; g.add(core);
  } else if (type === 'pumpkin') {
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), leafMatC);
      const a = i * 1.6;
      leaf.position.set(Math.cos(a) * 0.15, 0.15, Math.sin(a) * 0.15);
      leaf.scale.set(1, 0.35, 1); leaf.castShadow = true; g.add(leaf);
    }
    const pk = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), pumpkinMat);
    pk.position.y = 0.22; pk.scale.set(1, 0.85, 1); pk.castShadow = true; g.add(pk);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 6), stemMat);
    stem.position.y = 0.42; g.add(stem);
  } else if (type === 'sunflower') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 6), stemMat);
    stem.position.y = 0.8; stem.castShadow = true; g.add(stem);
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), leafMatB);
      const a = i * 1.6;
      leaf.position.set(Math.cos(a) * 0.15, 0.4 + i * 0.2, Math.sin(a) * 0.15);
      leaf.scale.set(1.5, 0.2, 1); leaf.castShadow = true; g.add(leaf);
    }
    const flower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), sunflowerMat);
    flower.rotation.x = Math.PI / 2;
    flower.position.set(0, 1.65, 0.05); flower.castShadow = true; g.add(flower);
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.9 }));
    center.position.set(0, 1.65, 0.08); g.add(center);
  } else if (type === 'berry') {
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), leafMatC);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12);
      leaf.scale.set(1, 0.7, 1); leaf.castShadow = true; g.add(leaf);
    }
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), berryMat);
      const a = i * 1.6;
      b.position.set(Math.cos(a) * 0.15, 0.3, Math.sin(a) * 0.15);
      b.castShadow = true; g.add(b);
    }
  }
  scene.add(g);
}

// ---- Bedengan & tanaman berbaris ----
const bedSoilMat = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 1.0 });
const rowCount = 6;
const rowsX = [];
const rowSpacing = (PLANT.w - 8) / (rowCount - 1);
for (let i = 0; i < rowCount; i++) rowsX.push(PLANT_X1 + 4 + i * rowSpacing);

const cropRowTypes = ['tomato', 'carrot', 'corn', 'lettuce', 'pumpkin', 'sunflower'];

rowsX.forEach((rx, ri) => {
  const bedLen = PLANT.d - 4;
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, bedLen), bedSoilMat);
  bed.position.set(rx, 0.1, PLANT.cz);
  bed.castShadow = true; bed.receiveShadow = true;
  scene.add(bed);

  const rowType = cropRowTypes[ri % cropRowTypes.length];
  const plantSpacing = 1.5;
  const plantsCount = Math.floor(bedLen / plantSpacing);
  for (let j = 0; j < plantsCount; j++) {
    if (Math.random() > 0.9) continue;
    const pz = PLANT.cz - bedLen / 2 + 0.8 + j * plantSpacing;
    createPlant(rowType, rx, pz);
  }
});

// ---- 🧑‍🌾 Orang-orangan sawah ----
function createScarecrow(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.85 });
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a030, roughness: 0.95, flatShading: true });
  const hatMat   = new THREE.MeshStandardMaterial({ color: 0x8b6b3a, roughness: 0.9 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8), woodMat);
  pole.position.y = 1.3; pole.castShadow = true; g.add(pole);
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), woodMat);
  cross.rotation.z = Math.PI / 2; cross.position.y = 1.9; cross.castShadow = true; g.add(cross);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), strawMat);
  head.position.y = 2.35; head.scale.set(1, 1.1, 1); head.castShadow = true; g.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
  e1.position.set(-0.08, 2.4, 0.22); g.add(e1);
  const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
  e2.position.set(0.08, 2.4, 0.22); g.add(e2);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), eyeMat);
  m.position.set(0, 2.28, 0.24); g.add(m);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 12), hatMat);
  brim.position.y = 2.55; brim.castShadow = true; g.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.25, 12), hatMat);
  crown.position.y = 2.68; crown.castShadow = true; g.add(crown);

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.35), clothMat);
  shirt.position.y = 1.75; shirt.castShadow = true; g.add(shirt);

  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const straw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.3, 4), strawMat);
      straw.position.set(side * (0.8 + i * 0.03), 1.9 + (i - 2) * 0.05, 0);
      straw.rotation.z = side * (Math.PI / 2 - 0.1 + (i - 2) * 0.05);
      straw.castShadow = true; g.add(straw);
    }
  }
  for (let i = 0; i < 6; i++) {
    const straw = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.4, 4), strawMat);
    straw.position.set((Math.random() - 0.5) * 0.3, 0.3, (Math.random() - 0.5) * 0.1);
    straw.rotation.x = Math.PI + (Math.random() - 0.5) * 0.3;
    straw.castShadow = true; g.add(straw);
  }
  scene.add(g);
}
createScarecrow(PLANT.cx, PLANT.cz);

// ---- 🌾 Tumpukan jerami ----
function createHaystack(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const hayMat = new THREE.MeshStandardMaterial({ color: 0xd4a030, roughness: 0.95, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0 * s, 1.1 * s, 0.5 * s, 12), hayMat);
  base.position.y = 0.25 * s; base.castShadow = true; base.receiveShadow = true; g.add(base);
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * s, 0.9 * s, 0.6 * s, 12), hayMat);
  mid.position.y = 0.8 * s; mid.castShadow = true; g.add(mid);
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.7 * s, 0.8 * s, 12), hayMat);
  top.position.y = 1.5 * s; top.castShadow = true; g.add(top);
  scene.add(g);
}
createHaystack(PLANT_X1 + 2.5, PLANT_Z1 + 2.5, 1);
createHaystack(PLANT_X1 + 2.5, PLANT_Z2 - 2.5, 1);
createHaystack(PLANT_X2 - 2.5, PLANT_Z2 - 2.5, 0.85);

// ---- 💧 Saluran irigasi ----
function createIrrigationChannel() {
  const channelMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1.0 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4aa8d8, roughness: 0.2, metalness: 0.3,
    emissive: 0x1a4a6a, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.85
  });
  const chZ = PLANT_Z1 + 1.2;
  const chX1 = PLANT_X1 + 1.5;
  const chX2 = PLANT_X2 - 1.5;
  const chLen = chX2 - chX1;
  const chCenterX = (chX1 + chX2) / 2;

  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(chLen, 0.25, 0.15), channelMat);
  wall1.position.set(chCenterX, 0.12, chZ - 0.4); wall1.receiveShadow = true; scene.add(wall1);
  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(chLen, 0.25, 0.15), channelMat);
  wall2.position.set(chCenterX, 0.12, chZ + 0.4); wall2.receiveShadow = true; scene.add(wall2);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(chLen, 0.7), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(chCenterX, 0.18, chZ);
  scene.add(water);
  return water;
}
const irrigationWater = createIrrigationChannel();

// ---- 🌸 Bunga-bunga cantik ----
const flowerColors = [0xff4466, 0xffcc00, 0xff88aa, 0xcc66ff, 0xffffff, 0xff8844];
function createFlowerCluster(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const count = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const petalMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.15 });
    const stemMatL = new THREE.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 0.9 });
    const fx = (Math.random() - 0.5) * 0.7;
    const fz = (Math.random() - 0.5) * 0.7;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.3, 5), stemMatL);
    stem.position.set(fx, 0.15, fz); stem.castShadow = true; g.add(stem);
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), petalMat);
    petal.position.set(fx, 0.32, fz); petal.scale.set(1, 0.7, 1); petal.castShadow = true; g.add(petal);
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xffee66, roughness: 0.5 }));
    center.position.set(fx, 0.34, fz); g.add(center);
  }
  scene.add(g);
}
for (let i = 0; i < 8; i++) {
  const t = (i + 0.5) / 8;
  createFlowerCluster(PLANT_X1 + 1, PLANT_Z1 + t * (PLANT.d - 2));
  createFlowerCluster(PLANT_X2 - 1, PLANT_Z1 + t * (PLANT.d - 2));
}
for (let i = 0; i < 6; i++) {
  const t = (i + 0.5) / 6;
  createFlowerCluster(PLANT_X1 + t * (PLANT.w - 2), PLANT_Z2 - 1);
}

// ---- 🐝 Sarang lebah ----
function createBeehive(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const hiveMat = new THREE.MeshStandardMaterial({ color: 0xdd9a3a, roughness: 0.8 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x8a5a1a, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.2 - i * 0.02, 12, 12), hiveMat);
    seg.position.y = i * 0.08; seg.scale.set(1, 0.5, 1); seg.castShadow = true; g.add(seg);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.02, 0.015, 6, 12), ringMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = i * 0.08 - 0.02; g.add(ring);
  }
  scene.add(g);
}
createBeehive(PLANT_X1 + 1.5, 1.5, PLANT.cz);

// ---- 🌳 Pepohonan buah variatif ----
function createFruitTreeBeautiful(x, z, fruitColor = 0xff8c1a) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 1.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 })
  );
  trunk.position.y = 0.9; trunk.castShadow = true; tree.add(trunk);

  const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2e8b2e, roughness: 0.9 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3aa83a, roughness: 0.9 });
  [{y:1.9,s:1.1},{y:2.3,s:0.9},{y:2.6,s:0.7}].forEach((l, i) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(l.s, 10, 10), i % 2 ? leafMat1 : leafMat2);
    leaf.position.y = l.y; leaf.scale.set(1, 0.9, 1); leaf.castShadow = true; tree.add(leaf);
  });
  const fruitMat = new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.55, emissive: fruitColor, emissiveIntensity: 0.1 });
  for (let i = 0; i < 8; i++) {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), fruitMat);
    const a = Math.random() * Math.PI * 2;
    const r = 0.8 + Math.random() * 0.5;
    fruit.position.set(Math.cos(a) * r, 1.9 + (Math.random() - 0.3) * 0.9, Math.sin(a) * r);
    fruit.castShadow = true; tree.add(fruit);
  }
  tree.position.set(x, 0, z);
  scene.add(tree);
}
createFruitTreeBeautiful(PLANT_X1 + 3.5, PLANT_Z1 + 4, 0xff8c1a);
createFruitTreeBeautiful(PLANT_X1 + 3.5, PLANT_Z2 - 4, 0xff3366);
createFruitTreeBeautiful(PLANT_X1 + 8.5, PLANT_Z1 + 4, 0xffcc00);
createFruitTreeBeautiful(PLANT_X2 - 4.5, PLANT_Z1 + 4, 0xcc66ff);

// ---- 🧺 Keranjang buah ----
function createFruitBasket(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const wickerMat = new THREE.MeshStandardMaterial({ color: 0xa07030, roughness: 0.95 });
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.3, 12), wickerMat);
  basket.position.y = 0.15; basket.castShadow = true; basket.receiveShadow = true; g.add(basket);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 12), wickerMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.3; g.add(rim);
  const colors = [0xff8c1a, 0xe83a2a, 0xffcc00, 0x66cc44];
  for (let i = 0; i < 6; i++) {
    const fm = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.5 });
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), fm);
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.15;
    f.position.set(Math.cos(a) * r, 0.32 + Math.random() * 0.06, Math.sin(a) * r);
    f.castShadow = true; g.add(f);
  }
  scene.add(g);
}
createFruitBasket(PLANT_X2 - 3.5, PLANT.cz + 5);
createFruitBasket(PLANT_X2 - 3.5, PLANT.cz - 5);

// ---- 🦋 Kupu-kupu beterbangan ----
const butterflies = [];
function createButterfly(x, z) {
  const g = new THREE.Group();
  const palette = [0xff66aa, 0xffcc44, 0x66ccff, 0xff8844, 0xcc66ff];
  const c = palette[Math.floor(Math.random() * palette.length)];
  const wingMat = new THREE.MeshStandardMaterial({
    color: c, roughness: 0.5, emissive: c, emissiveIntensity: 0.3,
    side: THREE.DoubleSide, transparent: true, opacity: 0.9
  });
  const wingGeo = new THREE.CircleGeometry(0.08, 8);
  const wL = new THREE.Mesh(wingGeo, wingMat); wL.position.x = -0.06;
  const wR = new THREE.Mesh(wingGeo, wingMat); wR.position.x = 0.06;
  g.add(wL); g.add(wR);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 4),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  body.rotation.z = Math.PI / 2; g.add(body);
  g.position.set(x, 0.8 + Math.random() * 0.5, z);
  scene.add(g);
  butterflies.push({
    mesh: g, wL, wR,
    baseX: x, baseZ: z,
    t: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.7,
    radius: 1.5 + Math.random() * 2,
    wingPhase: Math.random() * Math.PI * 2,
    height: 0.6 + Math.random() * 0.8
  });
}
for (let i = 0; i < 14; i++) {
  const bx = PLANT_X1 + 2 + Math.random() * (PLANT.w - 4);
  const bz = PLANT_Z1 + 2 + Math.random() * (PLANT.d - 4);
  createButterfly(bx, bz);
}

// ---- 🪧 Papan nama tanaman kayu ----
function createCropSign(x, z, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8b6b3a'; ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 248, 120);
  ctx.font = 'bold 44px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 6; ctx.strokeStyle = '#2a1508';
  ctx.strokeText(text, 128, 64);
  ctx.fillStyle = '#fff7c2'; ctx.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), mat);
  sign.position.set(x, 0.7, z); sign.rotation.y = Math.PI / 2; sign.castShadow = true;
  scene.add(sign);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 6), postMat);
  post.position.set(x, 0.45, z); post.castShadow = true; scene.add(post);
}
createCropSign(PLANT_X2 - 1.6, PLANT.cz + 6, 'SAYUR');
createCropSign(PLANT_X2 - 1.6, PLANT.cz + 2, 'BUAH');
createCropSign(PLANT_X2 - 1.6, PLANT.cz - 2, 'BUNGA');

// ==================== END PERKEBUNAN INDAH ====================

// ==================== ⭐ PORTAL DI AKHIR PERKEBUNAN ⭐ ====================
const PORTAL_POS = new THREE.Vector3(PLANT_X1 + 4, 0, PLANT.cz);
const portalGroup = new THREE.Group();
portalGroup.position.copy(PORTAL_POS);
portalGroup.rotation.y = Math.PI / 2;

const portalBaseMat = new THREE.MeshStandardMaterial({
  color: 0x1a2f52,
  roughness: 0.5,
  metalness: 0.4
});
const portalBase = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.7, 0.18, 24),
  portalBaseMat
);
portalBase.position.y = 0.25;
portalBase.castShadow = true;
portalBase.receiveShadow = true;
portalGroup.add(portalBase);

const portalRingMat = new THREE.MeshStandardMaterial({
  color: 0x4a7ab5,
  emissive: 0x2a5a95,
  emissiveIntensity: 0.8,
  roughness: 0.35,
  metalness: 0.7
});
const portalRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.7, 0.22, 16, 48),
  portalRingMat
);
portalRing.position.y = 2.4;
portalRing.castShadow = true;
portalGroup.add(portalRing);

const portalAccentMat = new THREE.MeshStandardMaterial({
  color: 0xff8c1a,
  emissive: 0xff8c1a,
  emissiveIntensity: 1.8,
  roughness: 0.3
});
const portalAccent = new THREE.Mesh(
  new THREE.TorusGeometry(1.7, 0.07, 12, 48),
  portalAccentMat
);
portalAccent.position.y = 2.4;
portalAccent.position.z = 0.12;
portalGroup.add(portalAccent);

const portalSurfaceMat = new THREE.MeshBasicMaterial({
  color: 0x66ccff,
  transparent: true,
  opacity: 0.55,
  side: THREE.DoubleSide
});
const portalSurface = new THREE.Mesh(
  new THREE.CircleGeometry(1.5, 32),
  portalSurfaceMat
);
portalSurface.position.y = 2.4;
portalGroup.add(portalSurface);

const portalParticles = [];
for (let i = 0; i < 24; i++) {
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x88ddff })
  );
  const angle = (i / 24) * Math.PI * 2;
  p.position.set(Math.cos(angle) * 2.1, 2.4, Math.sin(angle) * 0.4);
  portalGroup.add(p);
  portalParticles.push({ mesh: p, angle });
}

const portalLight = new THREE.PointLight(0x66ccff, 3, 15);
portalLight.position.set(0, 2.4, 0);
portalGroup.add(portalLight);

function createPortalText() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0a1a35';
  ctx.strokeText('PORTAL', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#66ccff';
  ctx.fillText('PORTAL', canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
const portalTextMat = new THREE.MeshBasicMaterial({
  map: createPortalText(),
  transparent: true,
  side: THREE.DoubleSide
});
const portalTextPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 0.6),
  portalTextMat
);
portalTextPlate.position.set(0, 4.4, 0);
portalGroup.add(portalTextPlate);

scene.add(portalGroup);

let portalTime = 0;
let portalCooldown = 0;

// ==================== KAMP TENTARA ====================
const CAMP = { cx: 42, cz: -12, w: 28, d: 24, entranceZ: -12, entranceWidth: 5 };
const CAMP_X1 = CAMP.cx - CAMP.w / 2;
const CAMP_X2 = CAMP.cx + CAMP.w / 2;
const CAMP_Z1 = CAMP.cz - CAMP.d / 2;
const CAMP_Z2 = CAMP.cz + CAMP.d / 2;

const campFencePostMat = new THREE.MeshStandardMaterial({ color: 0x3a4a1a, roughness: 0.9 });
const campFenceRailMat = new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.85 });

function createCampFencePost(x, z, height = 1.8) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, height, 8), campFencePostMat);
  post.position.set(x, height / 2, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 8), campFencePostMat);
  tip.position.set(x, height + 0.07, z);
  tip.castShadow = true;
  scene.add(tip);
}

function createCampFenceRail(x1, z1, x2, z2, y) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const angle = Math.atan2(dx, dz);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, len), campFenceRailMat);
  rail.position.set(midX, y, midZ);
  rail.rotation.y = angle;
  rail.castShadow = true;
  rail.receiveShadow = true;
  scene.add(rail);
}

function createCampFenceLine(x1, z1, x2, z2, spacing = 1.8, addCollision = true) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const numPosts = Math.max(2, Math.floor(len / spacing) + 1);
  const posts = [];
  for (let i = 0; i < numPosts; i++) {
    const t = i / (numPosts - 1);
    const px = x1 + dx * t;
    const pz = z1 + dz * t;
    createCampFencePost(px, pz);
    posts.push({ x: px, z: pz });
  }
  for (let i = 0; i < posts.length - 1; i++) {
    createCampFenceRail(posts[i].x, posts[i].z, posts[i + 1].x, posts[i + 1].z, 1.2);
    createCampFenceRail(posts[i].x, posts[i].z, posts[i + 1].x, posts[i + 1].z, 0.6);
  }
  if (addCollision) addWallSegment(x1, z1, x2, z2);
}

createCampFenceLine(CAMP_X1, CAMP_Z1, CAMP_X2, CAMP_Z1);
createCampFenceLine(CAMP_X1, CAMP_Z2, CAMP_X2, CAMP_Z2);
createCampFenceLine(CAMP_X2, CAMP_Z1, CAMP_X2, CAMP_Z2);

const campEntranceHalf = CAMP.entranceWidth / 2;
const campEntranceZ1 = CAMP.entranceZ - campEntranceHalf;
const campEntranceZ2 = CAMP.entranceZ + campEntranceHalf;

createCampFenceLine(CAMP_X1, CAMP_Z1, CAMP_X1, campEntranceZ1);
createCampFenceLine(CAMP_X1, campEntranceZ2, CAMP_X1, CAMP_Z2);

function createCampGatePost(x, z) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.6, 8), campFencePostMat);
  post.position.set(x, 1.3, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);
}
createCampGatePost(CAMP_X1, campEntranceZ1);
createCampGatePost(CAMP_X1, campEntranceZ2);

const campGroundMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1.0 });
const campGround = new THREE.Mesh(new THREE.PlaneGeometry(CAMP.w - 1, CAMP.d - 1), campGroundMat);
campGround.rotation.x = -Math.PI / 2;
campGround.position.set(CAMP.cx, 0.02, CAMP.cz);
campGround.receiveShadow = true;
scene.add(campGround);

function createTent(x, z, rotationY = 0, color = 0x4a5a3a) {
  const tent = new THREE.Group();
  const tentMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.85 });
  const bodyGeo = new THREE.CylinderGeometry(1.6, 1.6, 4, 3, 1);
  const body = new THREE.Mesh(bodyGeo, tentMat);
  body.rotation.z = Math.PI / 2;
  body.rotation.y = Math.PI / 2;
  body.position.y = 1.4;
  body.scale.set(1, 1, 0.85);
  body.castShadow = true;
  body.receiveShadow = true;
  tent.add(body);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a2010, roughness: 0.9 });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), doorMat);
  door.position.set(0, 0.9, 2.01);
  tent.add(door);
  tent.position.set(x, 0, z);
  tent.rotation.y = rotationY;
  scene.add(tent);
}

createTent(CAMP.cx - 8, CAMP_Z1 + 5, 0, 0x4a5a3a);
createTent(CAMP.cx, CAMP_Z1 + 5, 0, 0x3a4a2a);
createTent(CAMP.cx + 8, CAMP_Z1 + 5, 0, 0x4a5a3a);
createTent(CAMP.cx - 8, CAMP_Z2 - 5, Math.PI, 0x3a4a2a);
createTent(CAMP.cx, CAMP_Z2 - 5, Math.PI, 0x4a5a3a);
createTent(CAMP.cx + 8, CAMP_Z2 - 5, Math.PI, 0x3a4a2a);

const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x9a8a5a, roughness: 0.95, flatShading: true });

function createSandbagWall(x, z, length, rotationY = 0) {
  const group = new THREE.Group();
  const bagLen = 0.6;
  const bagCount = Math.floor(length / bagLen);
  for (let layer = 0; layer < 3; layer++) {
    const yOffset = 0.15 + layer * 0.25;
    const offsetX = layer * 0.15;
    for (let i = 0; i < bagCount; i++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(bagLen * 0.95, 0.25, 0.5), sandbagMat);
      bag.position.set(-length / 2 + bagLen / 2 + i * bagLen + offsetX, yOffset, (Math.random() - 0.5) * 0.05);
      bag.rotation.y = (Math.random() - 0.5) * 0.1;
      bag.castShadow = true;
      bag.receiveShadow = true;
      group.add(bag);
    }
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  scene.add(group);
}

createSandbagWall(CAMP_X1 + 3, CAMP_Z1 + 3, 4, 0);
createSandbagWall(CAMP_X2 - 3, CAMP_Z1 + 3, 4, Math.PI / 2);
createSandbagWall(CAMP_X1 + 3, CAMP_Z2 - 3, 4, 0);
createSandbagWall(CAMP_X2 - 3, CAMP_Z2 - 3, 4, Math.PI / 2);
createSandbagWall(CAMP.cx, CAMP.cz - 1.5, 3.5, 0);
createSandbagWall(CAMP.cx, CAMP.cz + 1.5, 3.5, 0);

function createFlagPole(x, z) {
  const poleGroup = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.5 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6, 8), poleMat);
  pole.position.y = 3;
  pole.castShadow = true;
  poleGroup.add(pole);
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.9, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), flagMat);
  flag.position.set(0.75, 5.2, 0);
  flag.castShadow = true;
  poleGroup.add(flag);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.9, side: THREE.DoubleSide });
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.15), stripeMat);
  stripe.position.set(0.75, 4.85, 0);
  poleGroup.add(stripe);
  poleGroup.position.set(x, 0, z);
  scene.add(poleGroup);
}

createFlagPole(CAMP.cx, CAMP.cz - 3);

function createCrate(x, z, rotationY = 0) {
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3a, roughness: 0.9 });
  const crateTrimMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat);
  crate.position.set(x, 0.4, z);
  crate.rotation.y = rotationY;
  crate.castShadow = true;
  crate.receiveShadow = true;
  scene.add(crate);
  const trim1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), crateTrimMat);
  trim1.position.set(x, 0.4, z);
  trim1.rotation.y = rotationY;
  scene.add(trim1);
  const trim2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.85), crateTrimMat);
  trim2.position.set(x, 0.4, z);
  trim2.rotation.y = rotationY;
  scene.add(trim2);
}

function createBarrel(x, z, rotationY = 0) {
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.6, metalness: 0.3 });
  const barrelRimMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.5, metalness: 0.4 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12), barrelMat);
  barrel.position.set(x, 0.45, z);
  barrel.rotation.y = rotationY;
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  scene.add(barrel);
  const rim1 = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 12), barrelRimMat);
  rim1.position.set(x, 0.85, z);
  scene.add(rim1);
  const rim2 = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 12), barrelRimMat);
  rim2.position.set(x, 0.08, z);
  scene.add(rim2);
  const rim3 = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 12), barrelRimMat);
  rim3.position.set(x, 0.45, z);
  scene.add(rim3);
}

createCrate(CAMP_X1 + 5, CAMP_Z1 + 8, 0.2);
createCrate(CAMP_X1 + 5.9, CAMP_Z1 + 8.2, -0.3);
createCrate(CAMP_X1 + 5.5, CAMP_Z1 + 8.9, 0.5);
createCrate(CAMP_X2 - 5, CAMP_Z1 + 8, 0.1);
createBarrel(CAMP_X2 - 6, CAMP_Z1 + 8, 0);
createBarrel(CAMP_X2 - 6.8, CAMP_Z1 + 8.2, 0);
createBarrel(CAMP_X1 + 5, CAMP_Z2 - 8, 0);
createBarrel(CAMP_X1 + 5, CAMP_Z2 - 7.2, 0);
createCrate(CAMP_X1 + 6, CAMP_Z2 - 8, -0.4);
createCrate(CAMP_X2 - 5, CAMP_Z2 - 8, 0.3);
createBarrel(CAMP_X2 - 6, CAMP_Z2 - 8, 0);

function createCampfire(x, z) {
  const fireGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.08), stoneMat);
    stone.position.set(Math.cos(angle) * 0.7, 0.15, Math.sin(angle) * 0.7);
    stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    stone.castShadow = true;
    stone.receiveShadow = true;
    fireGroup.add(stone);
  }
  const logMat = new THREE.MeshStandardMaterial({ color: 0x4a2c0a, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1, 6), logMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 5) * Math.PI;
    log.position.y = 0.15;
    log.castShadow = true;
    fireGroup.add(log);
  }
  const fireMat = new THREE.MeshStandardMaterial({
    color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 1.5,
    roughness: 0.4, transparent: true, opacity: 0.85
  });
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 6), fireMat);
  fire.position.y = 0.55;
  fireGroup.add(fire);
  const fireLight = new THREE.PointLight(0xff6600, 2, 8);
  fireLight.position.set(0, 0.7, 0);
  fireGroup.add(fireLight);
  fireGroup.position.set(x, 0, z);
  scene.add(fireGroup);
}

createCampfire(CAMP.cx - 10, CAMP.cz);
createCampfire(CAMP.cx + 10, CAMP.cz);

// ==================== ⭐ PORTAL DI KAMP TENTARA ⭐ ====================
const CAMP_PORTAL_POS = new THREE.Vector3(CAMP.cx - 6, 0, CAMP.cz);
const campPortalGroup = new THREE.Group();
campPortalGroup.position.copy(CAMP_PORTAL_POS);
campPortalGroup.rotation.y = Math.PI / 2;

// ---- Base ----
const campPortalBaseMat = new THREE.MeshStandardMaterial({
  color: 0x2a3a1a,
  roughness: 0.5,
  metalness: 0.4
});
const campPortalBase = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.7, 0.18, 24),
  campPortalBaseMat
);
campPortalBase.position.y = 0.25;
campPortalBase.castShadow = true;
campPortalBase.receiveShadow = true;
campPortalGroup.add(campPortalBase);

// ---- Ring ----
const campPortalRingMat = new THREE.MeshStandardMaterial({
  color: 0x6a8a4a,
  emissive: 0x3a5a2a,
  emissiveIntensity: 0.8,
  roughness: 0.35,
  metalness: 0.7
});
const campPortalRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.7, 0.22, 16, 48),
  campPortalRingMat
);
campPortalRing.position.y = 2.4;
campPortalRing.castShadow = true;
campPortalGroup.add(campPortalRing);

// ---- Accent ----
const campPortalAccentMat = new THREE.MeshStandardMaterial({
  color: 0xffcc00,
  emissive: 0xffcc00,
  emissiveIntensity: 1.8,
  roughness: 0.3
});
const campPortalAccent = new THREE.Mesh(
  new THREE.TorusGeometry(1.7, 0.07, 12, 48),
  campPortalAccentMat
);
campPortalAccent.position.y = 2.4;
campPortalAccent.position.z = 0.12;
campPortalGroup.add(campPortalAccent);

// ---- Surface ----
const campPortalSurfaceMat = new THREE.MeshBasicMaterial({
  color: 0xaaff66,
  transparent: true,
  opacity: 0.55,
  side: THREE.DoubleSide
});
const campPortalSurface = new THREE.Mesh(
  new THREE.CircleGeometry(1.5, 32),
  campPortalSurfaceMat
);
campPortalSurface.position.y = 2.4;
campPortalGroup.add(campPortalSurface);

// ---- Particles ----
const campPortalParticles = [];
for (let i = 0; i < 24; i++) {
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xccff88 })
  );
  const angle = (i / 24) * Math.PI * 2;
  p.position.set(Math.cos(angle) * 2.1, 2.4, Math.sin(angle) * 0.4);
  campPortalGroup.add(p);
  campPortalParticles.push({ mesh: p, angle });
}

// ---- Light ----
const campPortalLight = new THREE.PointLight(0xaaff66, 3, 15);
campPortalLight.position.set(0, 2.4, 0);
campPortalGroup.add(campPortalLight);

// ---- Text "DEAD ZONE" ----
function createCampPortalText() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0a1a05';
  ctx.strokeText('DEAD ZONE', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#aaff66';
  ctx.fillText('DEAD ZONE', canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
const campPortalTextMat = new THREE.MeshBasicMaterial({
  map: createCampPortalText(),
  transparent: true,
  side: THREE.DoubleSide
});
const campPortalTextPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 0.6),
  campPortalTextMat
);
campPortalTextPlate.position.set(0, 4.4, 0);
campPortalGroup.add(campPortalTextPlate);

scene.add(campPortalGroup);

let campPortalTime = 0;
let campPortalCooldown = 0;
// ==================== END PORTAL KAMP TENTARA ====================


// ==================== ⭐ BARU: ARENA FIGHT (TEMPAT BERTARUNG) ⭐ ====================
const ARENA = { cx: 30, cz: 22, w: 24, d: 24, entranceZ: 22, entranceWidth: 6 };
const ARENA_X1 = ARENA.cx - ARENA.w / 2;
const ARENA_X2 = ARENA.cx + ARENA.w / 2;
const ARENA_Z1 = ARENA.cz - ARENA.d / 2;
const ARENA_Z2 = ARENA.cz + ARENA.d / 2;

// Ground Arena (Berdebu / Batu Gelap)
const arenaGroundMat = new THREE.MeshStandardMaterial({ color: 0x4a4036, roughness: 1.0 });
const arenaGround = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.w - 1, ARENA.d - 1), arenaGroundMat);
arenaGround.rotation.x = -Math.PI / 2;
arenaGround.position.set(ARENA.cx, 0.025, ARENA.cz);
arenaGround.receiveShadow = true;
scene.add(arenaGround);

// Bercak Darah/Cat di lantai Arena
for (let i = 0; i < 5; i++) {
  const stain = new THREE.Mesh(
    new THREE.PlaneGeometry(2 + Math.random() * 2, 2 + Math.random() * 2), 
    new THREE.MeshBasicMaterial({ color: 0x881111, transparent: true, opacity: 0.6 })
  );
  stain.rotation.x = -Math.PI / 2;
  stain.position.set(ARENA.cx + (Math.random() - 0.5) * 10, 0.03, ARENA.cz + (Math.random() - 0.5) * 10);
  stain.rotation.z = Math.random() * Math.PI;
  scene.add(stain);
}

// Tembok Arena
function createArenaWall(x, z, width, depth, rotationY = 0) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.9, flatShading: true });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 3, depth), wallMat);
  wall.position.set(x, 1.5, z);
  wall.rotation.y = rotationY;
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);

  // Paku tajam di atas tembok
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.4 });
  const spikeCount = Math.floor(Math.max(width, depth) / 0.8);
  for(let i=0; i<spikeCount; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.8, 4), spikeMat);
      const offset = (i - spikeCount/2 + 0.5) * 0.8;
      if (width > depth) spike.position.set(x + offset, 3.4, z);
      else spike.position.set(x, 3.4, z + offset);
      scene.add(spike);
  }
}

// Dinding Atas
createArenaWall(ARENA.cx, ARENA_Z1, ARENA.w, 0.6);
addWallSegment(ARENA_X1, ARENA_Z1, ARENA_X2, ARENA_Z1);
// Dinding Bawah
createArenaWall(ARENA.cx, ARENA_Z2, ARENA.w, 0.6);
addWallSegment(ARENA_X1, ARENA_Z2, ARENA_X2, ARENA_Z2);
// Dinding Kanan (Tertutup penuh)
createArenaWall(ARENA_X2, ARENA.cz, 0.6, ARENA.d);
addWallSegment(ARENA_X2, ARENA_Z1, ARENA_X2, ARENA_Z2);

// Dinding Kiri (Pintu Masuk)
const arenaEntranceHalf = ARENA.entranceWidth / 2;
const arenaEntranceZ1 = ARENA.entranceZ - arenaEntranceHalf;
const arenaEntranceZ2 = ARENA.entranceZ + arenaEntranceHalf;

createArenaWall(ARENA_X1, (ARENA_Z1 + arenaEntranceZ1)/2, 0.6, arenaEntranceZ1 - ARENA_Z1);
addWallSegment(ARENA_X1, ARENA_Z1, ARENA_X1, arenaEntranceZ1);

createArenaWall(ARENA_X1, (ARENA_Z2 + arenaEntranceZ2)/2, 0.6, ARENA_Z2 - arenaEntranceZ2);
addWallSegment(ARENA_X1, arenaEntranceZ2, ARENA_X1, ARENA_Z2);

// Rak Senjata & Pedang
function createWeaponRack(x, z, rotY=0) {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({color: 0x3d2817, roughness: 0.9});
  const metalMat = new THREE.MeshStandardMaterial({color: 0x888888, metalness:0.8, roughness: 0.3});

  const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), woodMat);
  base.position.y = 0.05;
  g.add(base);

  const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.6), woodMat);
  side1.position.set(-0.95, 0.6, 0);
  g.add(side1);

  const side2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.6), woodMat);
  side2.position.set(0.95, 0.6, 0);
  g.add(side2);

  const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.2), woodMat);
  top.position.set(0, 1.2, 0);
  g.add(top);

  // Pedang
  for(let i=-0.6; i<=0.6; i+=0.4) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.15), metalMat);
      blade.position.set(i, 0.6, 0);
      g.add(blade);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), woodMat);
      handle.position.set(i, 1.1, 0);
      g.add(handle);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), metalMat);
      guard.position.set(i, 1.0, 0);
      g.add(guard);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}
createWeaponRack(ARENA.cx + 8, ARENA.cz + 8, -Math.PI/4);
createWeaponRack(ARENA.cx + 8, ARENA.cz - 8, Math.PI/4);

// Boneka Latihan (Target Dummy)
function createTargetDummy(x, z, rotY=0) {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({color: 0x5c4033, roughness: 0.9});
  const bodyMat = new THREE.MeshStandardMaterial({color: 0xcca870, roughness: 0.9});
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2, 8), woodMat);
  pole.position.y = 1;
  g.add(pole);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8), bodyMat);
  body.position.y = 1.2;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bodyMat);
  head.position.y = 1.8;
  g.add(head);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), woodMat);
  arm.position.y = 1.3;
  g.add(arm);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
}
createTargetDummy(ARENA.cx - 6, ARENA.cz - 6, Math.PI/4);
createTargetDummy(ARENA.cx - 6, ARENA.cz + 6, -Math.PI/4);

// Papan Nama BATTLE ARENA
function createArenaSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#550000';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 110px "Impact", Arial, sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ff0000';
  ctx.strokeText('BATTLE ARENA', canvas.width / 2, 192);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BATTLE ARENA', canvas.width / 2, 192);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const arenaSignMat = new THREE.MeshStandardMaterial({ map: createArenaSignTexture(), roughness: 0.75 });
const arenaSignEdgeMat = new THREE.MeshStandardMaterial({ color: 0x220000, roughness: 0.95 });

const arenaSignBoard = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 2.4, 6.4),
  [ arenaSignMat, arenaSignMat, arenaSignEdgeMat, arenaSignEdgeMat, arenaSignEdgeMat, arenaSignEdgeMat ]
);
arenaSignBoard.position.set(ARENA_X1 - 0.5, 6.0, ARENA.entranceZ);
arenaSignBoard.castShadow = true;
arenaSignBoard.receiveShadow = true;
scene.add(arenaSignBoard);

createSignPost(ARENA_X1 - 0.5, ARENA.entranceZ - 3.1);
createSignPost(ARENA_X1 - 0.5, ARENA.entranceZ + 3.1);
createSignRope(ARENA_X1 - 0.5, ARENA.entranceZ - 3.1);
createSignRope(ARENA_X1 - 0.5, ARENA.entranceZ + 3.1);

// ==================== ⭐ PORTAL DI BATTLE ARENA ⭐ ====================
const ARENA_PORTAL_POS = new THREE.Vector3(ARENA_X2 - 3.2, 0, ARENA.cz);
const arenaPortalGroup = new THREE.Group();
arenaPortalGroup.position.copy(ARENA_PORTAL_POS);
arenaPortalGroup.rotation.y = -Math.PI / 2;

const arenaPortalBaseMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.5, metalness: 0.4 });
const arenaPortalBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.18, 24), arenaPortalBaseMat);
arenaPortalBase.position.y = 0.25;
arenaPortalBase.castShadow = true;
arenaPortalGroup.add(arenaPortalBase);

const arenaPortalRingMat = new THREE.MeshStandardMaterial({
  color: 0xff3333, emissive: 0x990000, emissiveIntensity: 0.8, roughness: 0.35, metalness: 0.7
});
const arenaPortalRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.22, 16, 48), arenaPortalRingMat);
arenaPortalRing.position.y = 2.4;
arenaPortalGroup.add(arenaPortalRing);

const arenaPortalAccentMat = new THREE.MeshStandardMaterial({
  color: 0xffaa00, emissive: 0xff5500, emissiveIntensity: 1.8, roughness: 0.3
});
const arenaPortalAccent = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.07, 12, 48), arenaPortalAccentMat);
arenaPortalAccent.position.y = 2.4;
arenaPortalAccent.position.z = 0.12;
arenaPortalGroup.add(arenaPortalAccent);

const arenaPortalSurfaceMat = new THREE.MeshBasicMaterial({
  color: 0xff4444, transparent: true, opacity: 0.55, side: THREE.DoubleSide
});
const arenaPortalSurface = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), arenaPortalSurfaceMat);
arenaPortalSurface.position.y = 2.4;
arenaPortalGroup.add(arenaPortalSurface);

const arenaPortalParticles = [];
for (let i = 0; i < 24; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffaa44 }));
  const angle = (i / 24) * Math.PI * 2;
  p.position.set(Math.cos(angle) * 2.1, 2.4, Math.sin(angle) * 0.4);
  arenaPortalGroup.add(p);
  arenaPortalParticles.push({ mesh: p, angle });
}

const arenaPortalLight = new THREE.PointLight(0xff4444, 3, 15);
arenaPortalLight.position.set(0, 2.4, 0);
arenaPortalGroup.add(arenaPortalLight);

function createArenaPortalText() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 70px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#330000';
  ctx.strokeText('FIGHT', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#ff4444';
  ctx.fillText('FIGHT', canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
const arenaPortalTextMat = new THREE.MeshBasicMaterial({ map: createArenaPortalText(), transparent: true, side: THREE.DoubleSide });
const arenaPortalTextPlate = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), arenaPortalTextMat);
arenaPortalTextPlate.position.set(0, 4.4, 0);
arenaPortalGroup.add(arenaPortalTextPlate);

scene.add(arenaPortalGroup);

let arenaPortalTime = 0;
let arenaPortalCooldown = 0;
// ==================== END ARENA FIGHT ====================


// ==================== ⭐ PATUNG GAMEDEV 25 (SAMPING PERKEBUNAN) ⭐ ====================
const statue = new THREE.Group();
statue.position.set(-14, 0, 5);
statue.rotation.y = 0.27; // Sedikit menghadap ke arah jalan utama/respawn

const C_BLUE_DARK  = new THREE.MeshStandardMaterial({ color: 0x1a2f52, roughness: 0.7, flatShading: true });
const C_BLUE_MID   = new THREE.MeshStandardMaterial({ color: 0x2a4a7a, roughness: 0.7, flatShading: true });
const C_BLUE_LIGHT = new THREE.MeshStandardMaterial({ color: 0x4a7ab5, roughness: 0.6, flatShading: true });
const C_ORANGE     = new THREE.MeshStandardMaterial({ color: 0xff8c1a, roughness: 0.6, flatShading: true });
const C_ORANGE_D   = new THREE.MeshStandardMaterial({ color: 0xe07000, roughness: 0.6, flatShading: true });
const C_WHITE      = new THREE.MeshStandardMaterial({ color: 0xf2ede4, roughness: 0.7, flatShading: true });
const C_WHITE_D    = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.75, flatShading: true });
const C_NAVY       = new THREE.MeshStandardMaterial({ color: 0x0a1a35, roughness: 0.75, flatShading: true });

const baseBottom = new THREE.Mesh(
  new THREE.CylinderGeometry(3.2, 3.2, 0.6, 6),
  C_BLUE_DARK
);
baseBottom.position.y = 0.3;
baseBottom.castShadow = true;
baseBottom.receiveShadow = true;
statue.add(baseBottom);

const baseTop = new THREE.Mesh(
  new THREE.CylinderGeometry(2.6, 2.6, 0.35, 6),
  C_BLUE_MID
);
baseTop.position.y = 0.775;
baseTop.castShadow = true;
baseTop.receiveShadow = true;
statue.add(baseTop);

for (let i = 0; i < 6; i += 2) {
  const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.62, 0.1),
    C_ORANGE
  );
  accent.position.set(Math.cos(angle) * 3.18, 0.3, Math.sin(angle) * 3.18);
  accent.rotation.y = -angle + Math.PI / 2;
  accent.castShadow = true;
  statue.add(accent);
}

const monitorGroup = new THREE.Group();
monitorGroup.position.set(0, 1.4, -0.7);
monitorGroup.scale.set(1.7, 1.7, 1.7); // Di-besarkan 1.7x lipat agar menjulang megah di belakang controller

const monitorFrame = new THREE.Mesh(
  new THREE.BoxGeometry(2.8, 2.0, 0.25),
  C_BLUE_MID
);
monitorFrame.position.y = 1.0;
monitorFrame.castShadow = true;
monitorFrame.receiveShadow = true;
monitorGroup.add(monitorFrame);

const monitorBevel = new THREE.Mesh(
  new THREE.BoxGeometry(2.85, 2.05, 0.15),
  C_BLUE_DARK
);
monitorBevel.position.set(0, 1.0, -0.05);
monitorGroup.add(monitorBevel);

const screen = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 1.6, 0.05),
  C_NAVY
);
screen.position.set(0, 1.0, 0.13);
monitorGroup.add(screen);

// ==================== ⭐ ISI MONITOR SCREEN (SESUAI GAMBAR FOTO) ⭐ ====================
// Palet warna khusus isi layar monitor:
const C_SKIN = new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.6, flatShading: true });
const C_MOUNTAIN_MAIN = new THREE.MeshStandardMaterial({ color: 0x1d589f, roughness: 0.65, flatShading: true });
const C_MOUNTAIN_DARK = new THREE.MeshStandardMaterial({ color: 0x13386b, roughness: 0.7, flatShading: true });
const C_MOUNTAIN_CREST = new THREE.MeshStandardMaterial({ color: 0x1a4a85, roughness: 0.7, flatShading: true });
const C_PLAT_TOP = new THREE.MeshStandardMaterial({ color: 0xff7e1a, roughness: 0.55, flatShading: true });
const C_PLAT_SIDE = new THREE.MeshStandardMaterial({ color: 0xd95e09, roughness: 0.65, flatShading: true });
const C_CLOUD_FACET = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, flatShading: true });
const C_CHAR_BLUE = new THREE.MeshStandardMaterial({ color: 0x1d5bb0, roughness: 0.6, flatShading: true });

// 1. Pegunungan Low-Poly di Sebelah Kanan Layar (Background)
const mountainsGroup = new THREE.Group();
mountainsGroup.position.set(0, 0, 0.16);

// Puncak Utama (Piramida Biru Cerah)
const mainPeakGeo = new THREE.ConeGeometry(0.55, 1.1, 4);
const mainPeak = new THREE.Mesh(mainPeakGeo, C_MOUNTAIN_MAIN);
mainPeak.rotation.y = Math.PI / 4;
mainPeak.position.set(0.48, 0.65, 0.0);
mountainsGroup.add(mainPeak);

// Puncak Belakang Kanan (Biru Lebih Gelap)
const backPeakGeo = new THREE.ConeGeometry(0.5, 1.35, 4);
const backPeak = new THREE.Mesh(backPeakGeo, C_MOUNTAIN_DARK);
backPeak.rotation.y = Math.PI / 4;
backPeak.position.set(0.85, 0.75, -0.02);
mountainsGroup.add(backPeak);

// Puncak Depan Kiri (Crest Kecil di Sisi Tengah)
const frontPeakGeo = new THREE.ConeGeometry(0.38, 0.75, 4);
const frontPeak = new THREE.Mesh(frontPeakGeo, C_MOUNTAIN_CREST);
frontPeak.rotation.y = Math.PI / 4;
frontPeak.position.set(0.18, 0.45, 0.02);
mountainsGroup.add(frontPeak);

monitorGroup.add(mountainsGroup);

// 2. Awan Low-Poly Putih di Kanan Atas
const cloudGroup = new THREE.Group();
cloudGroup.position.set(0.45, 1.52, 0.18);

// Badan awan polygonal faceted
const cloudPuffCenter = new THREE.Mesh(new THREE.DodecahedronGeometry(0.20, 1), C_CLOUD_FACET);
cloudGroup.add(cloudPuffCenter);

const cloudPuffLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 1), C_CLOUD_FACET);
cloudPuffLeft.position.set(-0.16, -0.03, 0.01);
cloudGroup.add(cloudPuffLeft);

const cloudPuffRight = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), C_CLOUD_FACET);
cloudPuffRight.position.set(0.18, -0.02, 0.01);
cloudGroup.add(cloudPuffRight);

const cloudBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), C_CLOUD_FACET);
cloudBase.position.set(0.01, -0.09, 0);
cloudGroup.add(cloudBase);

monitorGroup.add(cloudGroup);

// 3. Dua Platform Oranye Melayang
// Platform 1 (Kiri Bawah - Tempat Melompat)
const plat1 = new THREE.Group();
plat1.position.set(-0.7, 0.52, 0.18);
const plat1Top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.13, 0.14), C_PLAT_TOP);
plat1Top.castShadow = true;
plat1.add(plat1Top);
const plat1Side = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.14), C_PLAT_SIDE);
plat1Side.position.set(0, -0.07, 0.01);
plat1.add(plat1Side);
monitorGroup.add(plat1);

// Platform 2 (Kanan Tengah - Tempat Mendarat, Lebih Tinggi)
const plat2 = new THREE.Group();
plat2.position.set(0.42, 0.90, 0.20);
const plat2Top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.13, 0.14), C_PLAT_TOP);
plat2Top.castShadow = true;
plat2.add(plat2Top);
const plat2Side = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.14), C_PLAT_SIDE);
plat2Side.position.set(0, -0.07, 0.01);
plat2.add(plat2Side);
monitorGroup.add(plat2);

// 4. Karakter Pelari / Pelompat (Pixel Runner / Jumper) - Proporsi Kompak & Detail Sesuai Gambar
const pixelChar = new THREE.Group();
// Posisi melompat di udara antara platform 1 dan 2
pixelChar.position.set(-0.24, 1.05, 0.22);
// Sudut pandang 3/4 isometrik (menghadap ke kanan dan sedikit serong ke kamera) sesuai foto
pixelChar.rotation.y = 0.38;

// Palet material detail karakter
const C_CHAR_SKIN = new THREE.MeshStandardMaterial({ color: 0xfdf6ed, roughness: 0.5, flatShading: true });
const C_CHAR_SHIRT = new THREE.MeshStandardMaterial({ color: 0xff731e, roughness: 0.55, flatShading: true });
const C_CHAR_CAP = new THREE.MeshStandardMaterial({ color: 0xff731e, roughness: 0.5, flatShading: true });
const C_CHAR_VISOR = new THREE.MeshStandardMaterial({ color: 0xeb6410, roughness: 0.55, flatShading: true });
const C_CHAR_PANTS = new THREE.MeshStandardMaterial({ color: 0x1b58a8, roughness: 0.6, flatShading: true });
const C_CHAR_WHITE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, flatShading: true });

// --- KEPALA & TOPI ---
// Kepala (Kubus Warna Kulit Cream)
const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), C_CHAR_SKIN);
pHead.position.set(0, 0.08, 0);
pHead.castShadow = true;
pixelChar.add(pHead);

// Leher kecil penghubung kepala dan badan
const pNeck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), C_CHAR_SKIN);
pNeck.position.set(0, -0.01, 0);
pixelChar.add(pNeck);

// Mahkota Topi Oranye (Cap Crown)
const pCapCrown = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.075, 0.148), C_CHAR_CAP);
pCapCrown.position.set(0, 0.165, 0);
pCapCrown.castShadow = true;
pixelChar.add(pCapCrown);

// Lidah Topi (Visor) Menjulur ke Kanan (Arah Lari)
const pCapVisor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.146), C_CHAR_VISOR);
pCapVisor.position.set(0.09, 0.142, 0);
pCapVisor.rotation.z = -0.12; // Miring sedikit ke bawah
pCapVisor.castShadow = true;
pixelChar.add(pCapVisor);

// --- BADAN (KAOS ORANYE) ---
// Badan utama berbentuk prisma terpancung (sedikit lebih lebar di bahu)
const pTorso = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.12), C_CHAR_SHIRT);
pTorso.position.set(0, -0.09, 0);
pTorso.castShadow = true;
pixelChar.add(pTorso);

// --- LENGAN KIRI (LENGAN BELAKANG) ---
// Membentuk pose siku tertekuk mengayun ke kiri atas (di belakang badan)
const armLGroup = new THREE.Group();
armLGroup.position.set(-0.08, -0.04, -0.04);

// Lengan atas mengarah ke kiri atas
const armLUpper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.05), C_CHAR_WHITE);
armLUpper.position.set(-0.04, 0.04, 0);
armLUpper.rotation.z = 0.65;
armLGroup.add(armLUpper);

// Lengan bawah & kepalan tangan putih mengarah ke bawah/depan
const armLLower = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.05), C_CHAR_WHITE);
armLLower.position.set(-0.08, -0.02, 0);
armLLower.rotation.z = -0.45;
armLGroup.add(armLLower);

// Kepalan tangan putih
const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), C_CHAR_WHITE);
fistL.position.set(-0.09, -0.07, 0);
fistL.castShadow = true;
armLGroup.add(fistL);

pixelChar.add(armLGroup);

// --- LENGAN KANAN (LENGAN DEPAN) ---
// Mengayun ke depan/kanan dengan siku tertekuk dan kepalan tangan terangkat ke depan
const armRGroup = new THREE.Group();
armRGroup.position.set(0.08, -0.04, 0.04);

// Lengan atas mengarah ke bawah/depan
const armRUpper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.05), C_CHAR_WHITE);
armRUpper.position.set(0.03, -0.04, 0);
armRUpper.rotation.z = -0.55;
armRGroup.add(armRUpper);

// Lengan bawah terangkat ke depan/atas
const armRLower = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.05), C_CHAR_WHITE);
armRLower.position.set(0.08, 0.0, 0);
armRLower.rotation.z = 0.75;
armRGroup.add(armRLower);

// Kepalan tangan putih di depan dada menjangkau ke kanan
const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.075), C_CHAR_WHITE);
fistR.position.set(0.12, 0.03, 0);
fistR.castShadow = true;
armRGroup.add(fistR);

pixelChar.add(armRGroup);

// --- PANGGUL / CELANA BIRU ---
const pPelvis = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.11), C_CHAR_PANTS);
pPelvis.position.set(0, -0.18, 0);
pPelvis.castShadow = true;
pixelChar.add(pPelvis);

// --- KAKI KIRI (KAKI BELAKANG - TERULUR KE BELAKANG) ---
const legLGroup = new THREE.Group();
legLGroup.position.set(-0.05, -0.21, -0.02);

// Paha kiri mengarah ke belakang bawah
const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), C_CHAR_PANTS);
thighL.position.set(-0.04, -0.04, 0);
thighL.rotation.z = 0.75;
legLGroup.add(thighL);

// Betis kiri terulur ke belakang bawah
const calfL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.055), C_CHAR_PANTS);
calfL.position.set(-0.09, -0.11, 0);
calfL.rotation.z = 0.65;
legLGroup.add(calfL);

// Sepatu sneaker putih bersudut (low-poly faceted)
const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.075), C_CHAR_WHITE);
shoeL.position.set(-0.13, -0.16, 0);
shoeL.rotation.z = 0.35;
shoeL.castShadow = true;
legLGroup.add(shoeL);

pixelChar.add(legLGroup);

// --- KAKI KANAN (KAKI DEPAN - MENGEKUK DALAM LANGKAH LARI) ---
const legRGroup = new THREE.Group();
legRGroup.position.set(0.05, -0.21, 0.02);

// Paha kanan mengarah ke depan bawah
const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.06), C_CHAR_PANTS);
thighR.position.set(0.04, -0.03, 0);
thighR.rotation.z = -0.75;
legRGroup.add(thighR);

// Lutut menekuk, betis mengarah ke bawah/belakang
const calfR = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.055), C_CHAR_PANTS);
calfR.position.set(0.07, -0.10, 0);
calfR.rotation.z = 0.40;
legRGroup.add(calfR);

// Sepatu sneaker putih depan
const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.075), C_CHAR_WHITE);
shoeR.position.set(0.07, -0.16, 0);
shoeR.rotation.z = 0.10;
shoeR.castShadow = true;
legRGroup.add(shoeR);

pixelChar.add(legRGroup);

monitorGroup.add(pixelChar);

const standNeck = new THREE.Mesh(
  new THREE.BoxGeometry(0.35, 0.65, 0.25),
  C_BLUE_DARK
);
standNeck.position.set(0, -0.22, -0.02);
standNeck.castShadow = true;
monitorGroup.add(standNeck);

const standBase = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 0.18, 0.75),
  C_BLUE_DARK
);
standBase.position.set(0, -0.55, 0);
standBase.castShadow = true;
monitorGroup.add(standBase);

statue.add(monitorGroup);

const gearGroup = new THREE.Group();
gearGroup.position.set(2.8, 2.7, -1.2);
gearGroup.scale.set(1.4, 1.4, 1.4);

const gearBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16),
  C_ORANGE
);
gearBody.rotation.x = Math.PI / 2;
gearBody.castShadow = true;
gearGroup.add(gearBody);

const gearHole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.28, 0.32, 16),
  C_BLUE_DARK
);
gearHole.rotation.x = Math.PI / 2;
gearGroup.add(gearHole);

const gearTeethCount = 10;
for (let i = 0; i < gearTeethCount; i++) {
  const angle = (i / gearTeethCount) * Math.PI * 2;
  const tooth = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.32, 0.28),
    C_ORANGE
  );
  tooth.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, 0);
  tooth.rotation.z = angle;
  tooth.castShadow = true;
  gearGroup.add(tooth);
}

statue.add(gearGroup);

const controllerGroup = new THREE.Group();
// ⭐ POSISI & ROTASI STICK: DIPUTAR KE BAWAH (~28°), DISORONG KE KIRI (-0.75), NATURAL ⭐
controllerGroup.position.set(-0.75, 1.18, 1.05);
controllerGroup.rotation.x = 0.48; // Diputar ke bawah (~28 derajat) agar rebah miring alami di meja altar
controllerGroup.rotation.y = 0.12; // Sedikit serong alami ke arah tengah
controllerGroup.scale.set(1.25, 1.25, 1.25);

// Penyangga Dock Display di bawah Controller
const ctrlStand = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 0.35, 0.5),
  C_BLUE_DARK
);
ctrlStand.position.set(0, -0.04, -0.12);
ctrlStand.castShadow = true;
controllerGroup.add(ctrlStand);

const ctrlBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.28, 1.0),
  C_WHITE
);
ctrlBody.position.y = 0.14;
ctrlBody.castShadow = true;
ctrlBody.receiveShadow = true;
controllerGroup.add(ctrlBody);

const gripL = new THREE.Mesh(
  new THREE.BoxGeometry(0.55, 0.38, 0.9),
  C_WHITE
);
gripL.position.set(-1.1, 0.05, 0.15);
gripL.rotation.z = 0.15;
gripL.castShadow = true;
controllerGroup.add(gripL);

const gripR = new THREE.Mesh(
  new THREE.BoxGeometry(0.55, 0.38, 0.9),
  C_WHITE
);
gripR.position.set(1.1, 0.05, 0.15);
gripR.rotation.z = -0.15;
gripR.castShadow = true;
controllerGroup.add(gripR);

const gripEndL = new THREE.Mesh(
  new THREE.SphereGeometry(0.28, 8, 8),
  C_WHITE_D
);
gripEndL.position.set(-1.15, -0.08, 0.5);
gripEndL.scale.set(1, 0.6, 1);
gripEndL.castShadow = true;
controllerGroup.add(gripEndL);

const gripEndR = new THREE.Mesh(
  new THREE.SphereGeometry(0.28, 8, 8),
  C_WHITE_D
);
gripEndR.position.set(1.15, -0.08, 0.5);
gripEndR.scale.set(1, 0.6, 1);
gripEndR.castShadow = true;
controllerGroup.add(gripEndR);

// D-Pad Navigasi (Sisi Kiri Atas)
const dpadH = new THREE.Mesh(
  new THREE.BoxGeometry(0.45, 0.08, 0.15),
  C_BLUE_MID
);
dpadH.position.set(-0.55, 0.30, -0.12);
dpadH.castShadow = true;
controllerGroup.add(dpadH);

const dpadV = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.08, 0.45),
  C_BLUE_MID
);
dpadV.position.set(-0.55, 0.30, -0.12);
dpadV.castShadow = true;
controllerGroup.add(dpadV);

// Tombol Aksi ABXY (Sisi Kanan Atas, Berlian Tradisional)
const actionButtons = [
  { x: 0.55, z: -0.24 }, // Tombol Y (Atas)
  { x: 0.67, z: -0.12 }, // Tombol B (Kanan)
  { x: 0.55, z: 0.00 },  // Tombol A (Bawah)
  { x: 0.43, z: -0.12 }  // Tombol X (Kiri)
];
actionButtons.forEach(pos => {
  const btn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12),
    C_ORANGE
  );
  btn.position.set(pos.x, 0.30, pos.z);
  btn.castShadow = true;
  controllerGroup.add(btn);
});

// Dual Analog Thumbsticks (Sisi Bawah Tengah, dekat Grip)
[-0.28, 0.28].forEach(stickX => {
  const stickBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.19, 0.06, 16),
    C_BLUE_DARK
  );
  stickBase.position.set(stickX, 0.28, 0.14);
  controllerGroup.add(stickBase);

  const stickPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12),
    C_NAVY
  );
  stickPost.position.set(stickX, 0.34, 0.14);
  controllerGroup.add(stickPost);

  const stickCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.13, 0.06, 16),
    C_ORANGE
  );
  stickCap.position.set(stickX, 0.40, 0.14);
  stickCap.castShadow = true;
  controllerGroup.add(stickCap);
});

// Tombol Start & Select di Tengah
const selectBtn = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 0.06, 0.08),
  C_BLUE_MID
);
selectBtn.position.set(-0.12, 0.30, -0.12);
controllerGroup.add(selectBtn);

const startBtn = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 0.06, 0.08),
  C_BLUE_MID
);
startBtn.position.set(0.12, 0.30, -0.12);
controllerGroup.add(startBtn);

statue.add(controllerGroup);

function createTextTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 150px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#0a1a35';
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#ff8c1a';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const textMat = new THREE.MeshBasicMaterial({
  map: createTextTexture('GAMEDEV 26'),
  transparent: true,
  side: THREE.DoubleSide
});

const textPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 0.8),
  textMat
);
textPlate.position.set(0, 0.35, 3.25);
statue.add(textPlate);

const textPlateBack = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 0.8),
  textMat.clone()
);
textPlateBack.rotation.y = Math.PI;
textPlateBack.position.set(0, 0.35, -3.25);
statue.add(textPlateBack);

const textPlateL = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 0.8),
  textMat.clone()
);
textPlateL.rotation.y = -Math.PI / 2;
textPlateL.position.set(-3.25, 0.35, 0);
statue.add(textPlateL);

const textPlateR = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 0.8),
  textMat.clone()
);
textPlateR.rotation.y = Math.PI / 2;
textPlateR.position.set(3.25, 0.35, 0);
statue.add(textPlateR);

const statueSpot = new THREE.PointLight(0xffcc88, 2.5, 30);
statueSpot.position.set(0, 12, 0);
statueSpot.castShadow = false;
statue.add(statueSpot);

statue.scale.set(2.5, 2.5, 2.5);

scene.add(statue);


// ==================== ⭐ PATUNG LOGO RESMI (BELAKANG PATUNG UTAMA) ⭐ ====================
const LOGO_DATA_URL = 'data:image/png;base64,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';
const logoTexLoader = new THREE.TextureLoader();
const logoTexture = logoTexLoader.load(LOGO_DATA_URL);
logoTexture.colorSpace = THREE.SRGBColorSpace;

const logoStatue = new THREE.Group();
logoStatue.position.set(0, 0, -35);

// Palet Material Patung Logo
const LOGO_MAT_GOLD_DARK  = new THREE.MeshStandardMaterial({ color: 0x9c6818, roughness: 0.45, metalness: 0.75, flatShading: true });
const LOGO_MAT_GOLD       = new THREE.MeshStandardMaterial({ color: 0xdf9c19, roughness: 0.35, metalness: 0.8, flatShading: true });
const LOGO_MAT_GOLD_LIGHT = new THREE.MeshStandardMaterial({ color: 0xffd66b, roughness: 0.25, metalness: 0.85, flatShading: true });
const LOGO_MAT_SLATE_DARK = new THREE.MeshStandardMaterial({ color: 0x161e29, roughness: 0.85, flatShading: true });
const LOGO_MAT_SLATE_MID  = new THREE.MeshStandardMaterial({ color: 0x273648, roughness: 0.8, flatShading: true });
const LOGO_MAT_SLATE_LIGHT= new THREE.MeshStandardMaterial({ color: 0x3d536c, roughness: 0.75, flatShading: true });

// 4 Material Kristal Penjaga Sesuai 4 Warna Utama Logo:
// Kuning (#fec439), Merah (#ef3f3b), Magenta (#c43c96), Biru (#005a8d)
const MAT_CRYSTAL_YELLOW  = new THREE.MeshStandardMaterial({ color: 0xfec439, emissive: 0xfec439, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.2, flatShading: true });
const MAT_CRYSTAL_RED     = new THREE.MeshStandardMaterial({ color: 0xef3f3b, emissive: 0xef3f3b, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.2, flatShading: true });
const MAT_CRYSTAL_MAGENTA = new THREE.MeshStandardMaterial({ color: 0xc43c96, emissive: 0xc43c96, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.2, flatShading: true });
const MAT_CRYSTAL_BLUE    = new THREE.MeshStandardMaterial({ color: 0x005a8d, emissive: 0x005a8d, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.2, flatShading: true });

// Podium Tingkat 1 (Bawah)
const logoBase1 = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.8, 0.6, 8), LOGO_MAT_SLATE_DARK);
logoBase1.position.y = 0.3;
logoBase1.castShadow = true;
logoBase1.receiveShadow = true;
logoStatue.add(logoBase1);

// Aksen emas di 8 sudut podium 1
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const accent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.15), LOGO_MAT_GOLD);
  accent.position.set(Math.cos(angle) * 5.6, 0.3, Math.sin(angle) * 5.6);
  accent.rotation.y = -angle + Math.PI / 2;
  accent.castShadow = true;
  logoStatue.add(accent);
}

// Podium Tingkat 2 (Tengah)
const logoBase2 = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.45, 8), LOGO_MAT_SLATE_MID);
logoBase2.position.y = 0.8;
logoBase2.castShadow = true;
logoBase2.receiveShadow = true;
logoStatue.add(logoBase2);

// Podium Tingkat 3 (Atas)
const logoBase3 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.5, 8), LOGO_MAT_SLATE_DARK);
logoBase3.position.y = 1.25;
logoBase3.castShadow = true;
logoBase3.receiveShadow = true;
logoStatue.add(logoBase3);

// Pilar Utama / Meja Altar
const logoAltar = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 1.1, 12), LOGO_MAT_SLATE_LIGHT);
logoAltar.position.y = 2.0;
logoAltar.castShadow = true;
logoAltar.receiveShadow = true;
logoStatue.add(logoAltar);

// Cincin emas di kaki dan leher altar
const altarRingBottom = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.1, 16), LOGO_MAT_GOLD);
altarRingBottom.position.y = 1.5;
altarRingBottom.castShadow = true;
logoStatue.add(altarRingBottom);

const altarRingTop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.12, 16), LOGO_MAT_GOLD_LIGHT);
altarRingTop.position.y = 2.55;
altarRingTop.castShadow = true;
logoStatue.add(altarRingTop);

// 4 Pilar Penjaga dengan Kristal 4 Warna Logo
const logoCrystals = [];
const crystalData = [
  { angle: Math.PI * 0.25, mat: MAT_CRYSTAL_YELLOW,  name: 'Yellow' },
  { angle: Math.PI * 0.75, mat: MAT_CRYSTAL_RED,     name: 'Red' },
  { angle: Math.PI * 1.25, mat: MAT_CRYSTAL_MAGENTA, name: 'Magenta' },
  { angle: Math.PI * 1.75, mat: MAT_CRYSTAL_BLUE,    name: 'Blue' }
];

crystalData.forEach(cd => {
  const pilarPost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 6), LOGO_MAT_SLATE_LIGHT);
  const px = Math.cos(cd.angle) * 4.3;
  const pz = Math.sin(cd.angle) * 4.3;
  pilarPost.position.set(px, 1.5, pz);
  pilarPost.castShadow = true;
  pilarPost.receiveShadow = true;
  logoStatue.add(pilarPost);

  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.18, 0.22, 8), LOGO_MAT_GOLD);
  bowl.position.set(px, 2.25, pz);
  bowl.castShadow = true;
  logoStatue.add(bowl);

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), cd.mat);
  crystal.position.set(px, 2.65, pz);
  crystal.castShadow = true;
  crystal.userData = { baseY: 2.65 };
  logoStatue.add(crystal);
  logoCrystals.push(crystal);

  const cLight = new THREE.PointLight(cd.mat.color, 1.8, 20);
  cLight.position.set(px, 2.8, pz);
  logoStatue.add(cLight);
});

// Sayap / Penopang Emas (Kiri & Kanan) yang menopang medali logo
function createWingBracket(side) {
  const wingGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.8, 0.4),
      LOGO_MAT_GOLD
    );
    const rx = side * (1.6 + t * 1.5);
    const ry = 2.7 + t * 2.2;
    rib.position.set(rx, ry, 0);
    rib.rotation.z = side * (-0.25 - t * 0.3);
    rib.castShadow = true;
    wingGroup.add(rib);
  }
  return wingGroup;
}
logoStatue.add(createWingBracket(1));
logoStatue.add(createWingBracket(-1));

// Medallion Utama (Pusat Patung)
const logoMedallionGroup = new THREE.Group();
logoMedallionGroup.position.set(0, 5.2, 0);

// Casing / Bingkai Medali
const medallionFrame = new THREE.Mesh(
  new THREE.CylinderGeometry(3.05, 3.05, 0.44, 48),
  LOGO_MAT_GOLD
);
medallionFrame.rotation.x = Math.PI / 2;
medallionFrame.castShadow = true;
medallionFrame.receiveShadow = true;
logoMedallionGroup.add(medallionFrame);

// Ring Bevel Luar & Dalam
const outerRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.05, 0.14, 16, 48),
  LOGO_MAT_GOLD_LIGHT
);
outerRing.castShadow = true;
logoMedallionGroup.add(outerRing);

const innerBevel = new THREE.Mesh(
  new THREE.TorusGeometry(2.65, 0.1, 16, 48),
  LOGO_MAT_GOLD_DARK
);
logoMedallionGroup.add(innerBevel);

// Inti Bercahaya (Shining Core di balik celah transparan logo)
const logoInnerGlow = new THREE.Mesh(
  new THREE.CylinderGeometry(2.55, 2.55, 0.18, 32),
  new THREE.MeshStandardMaterial({
    color: 0xfff9e6,
    emissive: 0xffeedd,
    emissiveIntensity: 0.65,
    roughness: 0.8
  })
);
logoInnerGlow.rotation.x = Math.PI / 2;
logoMedallionGroup.add(logoInnerGlow);

// Permukaan Logo Sisi Depan (Menghadap Selatan / Jalan Datang)
const logoFrontMat = new THREE.MeshStandardMaterial({
  map: logoTexture,
  transparent: true,
  alphaTest: 0.05,
  roughness: 0.35,
  metalness: 0.1,
  side: THREE.FrontSide
});
const logoFront = new THREE.Mesh(
  new THREE.PlaneGeometry(5.0, 5.0),
  logoFrontMat
);
logoFront.position.set(0, 0, 0.23);
logoFront.castShadow = true;
logoMedallionGroup.add(logoFront);

// Permukaan Logo Sisi Belakang (Menghadap Utara)
const logoBackMat = new THREE.MeshStandardMaterial({
  map: logoTexture,
  transparent: true,
  alphaTest: 0.05,
  roughness: 0.35,
  metalness: 0.1,
  side: THREE.FrontSide
});
const logoBack = new THREE.Mesh(
  new THREE.PlaneGeometry(5.0, 5.0),
  logoBackMat
);
logoBack.rotation.y = Math.PI;
logoBack.position.set(0, 0, -0.23);
logoBack.castShadow = true;
logoMedallionGroup.add(logoBack);

// Cincin Orbit Melingkar (Halo Miring yang berputar perlahan)
const logoOrbitRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.55, 0.06, 12, 48),
  LOGO_MAT_GOLD_LIGHT
);
logoOrbitRing.rotation.x = 0.35;
logoOrbitRing.rotation.y = 0.25;
logoMedallionGroup.add(logoOrbitRing);

logoStatue.add(logoMedallionGroup);

// Papan Plakat Nama Patung UNIVERSITAS PRISMA
function createLogoPlaqueTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background gradasi biru tua elegan Universitas Prisma
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#06101e');
  grad.addColorStop(0.5, '#0d223f');
  grad.addColorStop(1, '#06101e');
  ctx.fillStyle = grad;
  ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

  // Border emas ganda
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#df9c19';
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd66b';
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // Teks judul "UNIVERSITAS PRISMA"
  ctx.font = 'bold 84px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2 - 18);
  ctx.fillStyle = '#ffd66b';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 18);

  // Subtitle Motto
  ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('LEADERSHIP & INTEGRITY', canvas.width / 2, canvas.height / 2 + 52);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const plaqueMat = new THREE.MeshStandardMaterial({
  map: createLogoPlaqueTexture('UNIVERSITAS PRISMA'),
  roughness: 0.5,
  metalness: 0.3
});
const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), plaqueMat);
plaque.position.set(0, 1.85, 2.38);
plaque.rotation.x = -0.22;
plaque.castShadow = true;
logoStatue.add(plaque);

// Plakat belakang
const plaqueBack = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), plaqueMat.clone());
plaqueBack.position.set(0, 1.85, -2.38);
plaqueBack.rotation.y = Math.PI;
plaqueBack.rotation.x = 0.22;
plaqueBack.castShadow = true;
logoStatue.add(plaqueBack);

// Pencahayaan Patung
const logoStatueLight = new THREE.PointLight(0xfff5e6, 3.2, 70);
logoStatueLight.position.set(0, 9.5, 1.5);
logoStatueLight.castShadow = false;
logoStatue.add(logoStatueLight);

const logoGroundGlow = new THREE.PointLight(0xffd59e, 2.5, 35);
logoGroundGlow.position.set(0, 1.8, 3.2);
logoStatue.add(logoGroundGlow);

// Paving melingkar di sekeliling patung
const pavingGeo = new THREE.RingGeometry(5.8, 6.8, 32);
const pavingMat = new THREE.MeshStandardMaterial({ color: 0x6a5638, roughness: 0.95, side: THREE.DoubleSide });
const paving = new THREE.Mesh(pavingGeo, pavingMat);
paving.rotation.x = -Math.PI / 2;
paving.position.y = 0.022;
paving.receiveShadow = true;
logoStatue.add(paving);

// ⭐ SKALA 3 KALI LEBIH BESAR SESUAI PERMINTAAN ⭐
logoStatue.scale.set(3, 3, 3);

scene.add(logoStatue);

// ==================== DETAIL JALAN ====================
const pebbleMats = [
  new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.95, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x7a7a70, roughness: 0.95, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0xaa9a80, roughness: 0.95, flatShading: true })
];

function scatterDetailsAlongPath(curve, pebbleCount, grassCount) {
  for (let i = 0; i < pebbleCount; i++) {
    const t = Math.random();
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 1.3 + Math.random() * 0.8;
    const offset = perp.clone().multiplyScalar(side * dist);
    const pebble = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.12),
      pebbleMats[Math.floor(Math.random() * pebbleMats.length)]
    );
    pebble.position.set(p.x + offset.x, 0.08, p.z + offset.z);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    scene.add(pebble);
  }

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 0.9 });
  for (let i = 0; i < grassCount; i++) {
    const t = Math.random();
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 1.7 + Math.random() * 1.0;
    const offset = perp.clone().multiplyScalar(side * dist);
    const grassGroup = new THREE.Group();
    const bladeCount = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < bladeCount; j++) {
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.3 + Math.random() * 0.2, 4),
        grassMat
      );
      blade.position.set((Math.random() - 0.5) * 0.2, 0.15, (Math.random() - 0.5) * 0.2);
      blade.rotation.z = (Math.random() - 0.5) * 0.3;
      blade.rotation.x = (Math.random() - 0.5) * 0.3;
      blade.castShadow = true;
      grassGroup.add(blade);
    }
    grassGroup.position.set(p.x + offset.x, 0, p.z + offset.z);
    scene.add(grassGroup);
  }
}

scatterDetailsAlongPath(pathCurve, 60, 40);
scatterDetailsAlongPath(branchLeftCurve, 30, 20);
scatterDetailsAlongPath(branchRightCurve, 30, 20);
scatterDetailsAlongPath(branchArenaCurve, 30, 20); // Detail jalan arena
scatterDetailsAlongPath(roadToLogoCurve, 25, 15);
scatterDetailsAlongPath(roadToGameDevCurve, 15, 10);
scatterDetailsAlongPath(walkwayGameDevToLogoCurve, 20, 12);

// ==================== KARAKTER REALISTIS ====================
const player = new THREE.Group();

// Realistic Materials Palette
const M = {
  skin:         new THREE.MeshStandardMaterial({ color: 0xecd0be, roughness: 0.62, metalness: 0.02 }),
  skinLips:     new THREE.MeshStandardMaterial({ color: 0xc47a75, roughness: 0.55 }),
  eyeWhite:     new THREE.MeshStandardMaterial({ color: 0xf5f5fa, roughness: 0.15 }),
  eyeIris:      new THREE.MeshStandardMaterial({ color: 0x2e1e14, roughness: 0.2, emissive: 0x140b06, emissiveIntensity: 0.3 }),
  eyePupil:     new THREE.MeshBasicMaterial({ color: 0x050508 }),
  eyeShine:     new THREE.MeshBasicMaterial({ color: 0xffffff }),
  brow:         new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.85 }),
  hair:         new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.72, metalness: 0.08 }),
  hairHi:       new THREE.MeshStandardMaterial({ color: 0x382c24, roughness: 0.6 }),
  jacket:       new THREE.MeshStandardMaterial({ color: 0x1c2128, roughness: 0.78, metalness: 0.1 }),
  jacketTrim:   new THREE.MeshStandardMaterial({ color: 0x12161b, roughness: 0.85 }),
  shirt:        new THREE.MeshStandardMaterial({ color: 0xededed, roughness: 0.65 }),
  pants:        new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.82, metalness: 0.05 }),
  belt:         new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.45 }),
  metal:        new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.9, roughness: 0.2 }),
  watchStrap:   new THREE.MeshStandardMaterial({ color: 0x252528, roughness: 0.5 }),
  sneakerWhite: new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.35 }),
  sneakerDark:  new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.65 }),
  sneakerAccent:new THREE.MeshStandardMaterial({ color: 0xe64a2e, roughness: 0.5 })
};

// ==================== HEAD GROUP ====================
const headGroup = new THREE.Group();
headGroup.position.set(0, 1.54, 0);
player.add(headGroup);

// Cranium (Anatomical skull shape)
const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), M.skin);
cranium.scale.set(0.92, 1.12, 1.05);
cranium.position.set(0, 0.07, 0);
cranium.castShadow = true;
headGroup.add(cranium);

// Face & Jaw
const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.058, 0.12, 16), M.skin);
jaw.position.set(0, -0.015, 0.025);
jaw.scale.set(1.0, 1.0, 0.88);
headGroup.add(jaw);

// Defined Chin
const chin = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 14), M.skin);
chin.position.set(0, -0.075, 0.055);
chin.scale.set(1.0, 0.75, 0.9);
headGroup.add(chin);

// Cheekbones
[-1, 1].forEach(side => {
  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), M.skin);
  cheek.position.set(side * 0.065, 0.01, 0.04);
  cheek.scale.set(0.8, 1.2, 0.8);
  headGroup.add(cheek);
});

// Realistic Eyes Function
function createEye(side) {
  const eye = new THREE.Group();
  eye.position.set(side * 0.038, 0.045, 0.086);

  // Sclera
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), M.eyeWhite);
  sclera.scale.set(1.15, 0.75, 0.55);
  eye.add(sclera);

  // Iris
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 14), M.eyeIris);
  iris.scale.set(1.05, 0.95, 0.4);
  iris.position.set(0, 0, 0.007);
  eye.add(iris);

  // Pupil
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), M.eyePupil);
  pupil.position.set(0, 0, 0.011);
  eye.add(pupil);

  // Catchlight
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 8, 8), M.eyeShine);
  shine.position.set(-side * 0.003, 0.003, 0.013);
  eye.add(shine);

  // Upper eyelid crease
  const upperLid = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.006, 0.012), M.skin);
  upperLid.position.set(0, 0.013, 0.006);
  upperLid.rotation.z = side * -0.05;
  eye.add(upperLid);

  // Natural Eyebrow
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.014), M.brow);
  brow.position.set(0, 0.028, 0.004);
  brow.rotation.z = side * -0.12;
  brow.rotation.y = side * 0.08;
  eye.add(brow);

  return eye;
}
headGroup.add(createEye(-1));
headGroup.add(createEye(1));

// Natural Sculpted Nose
const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.045, 10), M.skin);
noseBridge.position.set(0, 0.02, 0.098);
noseBridge.rotation.x = 0.22;
headGroup.add(noseBridge);

const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), M.skin);
noseTip.position.set(0, -0.003, 0.108);
noseTip.scale.set(1.0, 0.85, 1.1);
headGroup.add(noseTip);

[-1, 1].forEach(side => {
  const alar = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), M.skin);
  alar.position.set(side * 0.013, -0.008, 0.098);
  headGroup.add(alar);
});

// Realistic Mouth & Lips
const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.01), M.skinLips);
upperLip.position.set(0, -0.032, 0.088);
headGroup.add(upperLip);

const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), M.skinLips);
lowerLip.position.set(0, -0.043, 0.085);
lowerLip.scale.set(1.4, 0.6, 0.8);
headGroup.add(lowerLip);

// Anatomical Ears
[-1, 1].forEach(side => {
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), M.skin);
  ear.position.set(side * 0.105, 0.025, -0.005);
  ear.scale.set(0.35, 1.15, 0.8);
  ear.rotation.y = side * 0.15;
  ear.rotation.z = side * -0.08;
  headGroup.add(ear);
});

// Realistic Modern Hair (Textured Crop & Tapered Sides)
const hairBase = new THREE.Mesh(
  new THREE.SphereGeometry(0.125, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58),
  M.hair
);
hairBase.position.set(0, 0.08, -0.012);
hairBase.scale.set(0.96, 1.12, 1.04);
headGroup.add(hairBase);

const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), M.hair);
hairTop.position.set(0, 0.15, 0.01);
hairTop.scale.set(0.95, 0.55, 1.05);
headGroup.add(hairTop);

// Layered Textured Fringe
const fringeLocks = [
  { x: -0.04, y: 0.12, z: 0.08, sx: 0.05, sy: 0.04, sz: 0.06, rz: 0.15 },
  { x: 0.01,  y: 0.13, z: 0.09, sx: 0.06, sy: 0.045, sz: 0.06, rz: -0.1 },
  { x: 0.05,  y: 0.11, z: 0.075, sx: 0.045, sy: 0.035, sz: 0.05, rz: -0.3 },
  { x: -0.07, y: 0.08, z: 0.055, sx: 0.035, sy: 0.05, sz: 0.05, rz: 0.2 },
  { x: 0.08,  y: 0.08, z: 0.055, sx: 0.035, sy: 0.05, sz: 0.05, rz: -0.2 }
];
fringeLocks.forEach(f => {
  const lock = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), M.hairHi);
  lock.position.set(f.x, f.y, f.z);
  lock.scale.set(f.sx / 0.04, f.sy / 0.04, f.sz / 0.04);
  lock.rotation.z = f.rz;
  headGroup.add(lock);
});

// Neck
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.11, 16), M.skin);
neck.position.set(0, 1.48, -0.005);
neck.rotation.x = 0.05;
neck.castShadow = true;
player.add(neck);

// ==================== TORSO & OUTFIT ====================
// Inner Shirt Collar & Chest
const shirtCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.08, 16), M.shirt);
shirtCollar.position.set(0, 1.44, 0.005);
player.add(shirtCollar);

const shirtChest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.04), M.shirt);
shirtChest.position.set(0, 1.25, 0.115);
player.add(shirtChest);

// Tailored Modern Jacket (Chest & Ribcage)
const jacketChest = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.165, 0.32, 20), M.jacket);
jacketChest.position.set(0, 1.30, 0);
jacketChest.scale.set(1.15, 1.0, 0.76);
jacketChest.castShadow = true;
player.add(jacketChest);

// Jacket Waist
const jacketWaist = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.155, 0.22, 20), M.jacket);
jacketWaist.position.set(0, 1.06, 0);
jacketWaist.scale.set(1.1, 1.0, 0.74);
jacketWaist.castShadow = true;
player.add(jacketWaist);

// Jacket Lapels
[-1, 1].forEach(side => {
  const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.025), M.jacketTrim);
  lapel.position.set(side * 0.08, 1.34, 0.11);
  lapel.rotation.z = side * -0.22;
  lapel.rotation.y = side * 0.12;
  player.add(lapel);
});

// Metallic Zipper line & Pull
const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.01), M.metal);
zipper.position.set(0, 1.12, 0.118);
player.add(zipper);

const zipperPull = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.035, 0.015), M.metal);
zipperPull.position.set(0, 1.25, 0.125);
player.add(zipperPull);

// Jacket Hem Ribbing
const jacketHem = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.05, 20), M.jacketTrim);
jacketHem.position.set(0, 0.94, 0);
jacketHem.scale.set(1.08, 1.0, 0.74);
player.add(jacketHem);

// Belt & Buckle
const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.045, 20), M.belt);
belt.position.set(0, 0.90, 0);
belt.scale.set(1.05, 1.0, 0.72);
player.add(belt);

const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.018), M.metal);
buckle.position.set(0, 0.90, 0.112);
player.add(buckle);

// Pelvis (Jeans / Pants)
const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.156, 0.148, 0.14, 20), M.pants);
pelvis.position.set(0, 0.82, 0);
pelvis.scale.set(1.05, 1.0, 0.72);
pelvis.castShadow = true;
player.add(pelvis);

// ==================== ARMS ====================
function makeArm(side) {
  const armGroup = new THREE.Group();
  armGroup.position.set(side * 0.225, 1.38, 0);

  // Shoulder / Deltoid
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), M.jacket);
  shoulder.scale.set(1.05, 1.1, 1.0);
  shoulder.castShadow = true;
  armGroup.add(shoulder);

  // Upper Arm
  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 8, 14), M.jacket);
  upperArm.position.set(0, -0.12, 0);
  upperArm.castShadow = true;
  armGroup.add(upperArm);

  // Elbow group (Pivot for lower arm)
  const lowerGroup = new THREE.Group();
  lowerGroup.position.set(0, -0.25, 0);
  armGroup.add(lowerGroup);

  // Forearm (Sleeve)
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.14, 8, 14), M.jacket);
  forearm.position.set(0, -0.09, 0);
  forearm.castShadow = true;
  lowerGroup.add(forearm);

  // Sleeve Cuff
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.035, 14), M.jacketTrim);
  cuff.position.set(0, -0.17, 0);
  lowerGroup.add(cuff);

  // Left Wristwatch Accessory
  if (side === -1) {
    const watchStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.02, 14), M.watchStrap);
    watchStrap.position.set(0, -0.19, 0);
    lowerGroup.add(watchStrap);

    const watchDial = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12), M.metal);
    watchDial.position.set(-0.035, -0.19, 0.01);
    watchDial.rotation.z = Math.PI / 2;
    lowerGroup.add(watchDial);
  }

  // Wrist (Skin)
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.03, 12), M.skin);
  wrist.position.set(0, -0.20, 0);
  lowerGroup.add(wrist);

  // Hand Base (Palm)
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.055, 0.022), M.skin);
  palm.position.set(side * 0.004, -0.24, 0.003);
  palm.castShadow = true;
  lowerGroup.add(palm);

  // Opposable Thumb
  const thumbBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.022, 6, 8), M.skin);
  thumbBase.position.set(side * -0.022, -0.23, 0.012);
  thumbBase.rotation.z = side * -0.4;
  thumbBase.rotation.x = 0.3;
  lowerGroup.add(thumbBase);

  // Realistic Curled Relaxed Fingers
  const fingerDefs = [
    { x: -0.016, l: 0.032 },
    { x: -0.005, l: 0.036 },
    { x:  0.006, l: 0.034 },
    { x:  0.016, l: 0.028 }
  ];
  fingerDefs.forEach(fd => {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, fd.l, 6, 8), M.skin);
    finger.position.set(side * fd.x, -0.265 - fd.l * 0.3, 0.004);
    finger.rotation.x = -0.25;
    lowerGroup.add(finger);
  });

  return { armGroup, lowerGroup };
}

const armLData = makeArm(-1);
const armRData = makeArm(1);
player.add(armLData.armGroup);
player.add(armRData.armGroup);

// ==================== LEGS ====================
function makeLeg(side) {
  const legGroup = new THREE.Group();
  legGroup.position.set(side * 0.108, 0.82, 0);

  // Hip / Thigh Top
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.076, 14, 14), M.pants);
  hip.castShadow = true;
  legGroup.add(hip);

  // Thigh (Slim fit pants)
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.22, 8, 14), M.pants);
  thigh.position.set(0, -0.16, 0.005);
  thigh.castShadow = true;
  legGroup.add(thigh);

  // Knee Group (Pivot for lower leg)
  const lowerGroup = new THREE.Group();
  lowerGroup.position.set(0, -0.32, 0);
  legGroup.add(lowerGroup);

  // Knee Joint
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), M.pants);
  knee.position.set(0, 0, 0.005);
  lowerGroup.add(knee);

  // Calf / Shin
  const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.22, 8, 14), M.pants);
  calf.position.set(0, -0.14, -0.002);
  calf.castShadow = true;
  lowerGroup.add(calf);

  // Ankle / Cuff
  const ankleCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.04, 14), M.pants);
  ankleCuff.position.set(0, -0.27, 0);
  lowerGroup.add(ankleCuff);

  // ==================== REALISTIC MODERN SNEAKERS ====================
  // Rubber Midsole & Outsole
  const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.026, 0.23), M.sneakerWhite);
  shoeSole.position.set(0, -0.315, 0.035);
  shoeSole.castShadow = true;
  lowerGroup.add(shoeSole);

  // Rubber Toe bumper
  const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 14, 12), M.sneakerWhite);
  toeCap.position.set(0, -0.308, 0.125);
  toeCap.scale.set(1.02, 0.45, 0.95);
  toeCap.castShadow = true;
  lowerGroup.add(toeCap);

  // Sneaker Upper (Dark Body)
  const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.18), M.sneakerDark);
  shoeUpper.position.set(0, -0.28, 0.015);
  shoeUpper.castShadow = true;
  lowerGroup.add(shoeUpper);

  // Sneaker Tongue
  const shoeTongue = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.08), M.sneakerDark);
  shoeTongue.position.set(0, -0.255, 0.04);
  shoeTongue.rotation.x = -0.35;
  lowerGroup.add(shoeTongue);

  // Sporty Contrast Stripe Accent
  [-1, 1].forEach(stSide => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.018, 0.11), M.sneakerAccent);
    stripe.position.set(stSide * 0.046, -0.285, 0.015);
    stripe.rotation.z = stSide * -0.15;
    lowerGroup.add(stripe);
  });

  // White Laces
  for (let l = 0; l < 3; l++) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.008, 0.015), M.sneakerWhite);
    lace.position.set(0, -0.265 + l * 0.014, 0.055 - l * 0.018);
    lace.rotation.x = -0.35;
    lowerGroup.add(lace);
  }

  return { legGroup, lowerGroup };
}

const legLData = makeLeg(-1);
const legRData = makeLeg(1);
player.add(legLData.legGroup);
player.add(legRData.legGroup);

const anim = {
  legL: legLData.legGroup,
  legR: legRData.legGroup,
  legLLow: legLData.lowerGroup,
  legRLow: legRData.lowerGroup,
  armL: armLData.armGroup,
  armR: armRData.armGroup,
  armLLow: armLData.lowerGroup,
  armRLow: armRData.lowerGroup,
  headGroup: headGroup
};

player.scale.set(1.28, 1.28, 1.28);
player.position.copy(SPAWN_POS);
player.rotation.y = Math.atan2(-player.position.x, -player.position.z);
scene.add(player);

// ==================== DINDING BATUAN ====================
const rockMats = [
  new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.95, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.9, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.95, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x606050, roughness: 0.95, flatShading: true })
];

function getRandomRockMat() {
  return rockMats[Math.floor(Math.random() * rockMats.length)];
}

function createBoundaryRock(x, z, scale = 1) {
  const rockGroup = new THREE.Group();
  const size = (2 + Math.random() * 1.5) * scale;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), getRandomRockMat());
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock.position.y = size * 0.75;
  rock.castShadow = true;
  rock.receiveShadow = true;
  rockGroup.add(rock);
  if (Math.random() > 0.4) {
    const size2 = (1.2 + Math.random() * 1) * scale;
    const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(size2, 0), getRandomRockMat());
    rock2.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock2.position.set((Math.random() - 0.5) * size * 1.5, size2 * 0.6, (Math.random() - 0.5) * size * 1.5);
    rock2.castShadow = true;
    rock2.receiveShadow = true;
    rockGroup.add(rock2);
  }
  const size3 = 0.8 * scale;
  const rock3 = new THREE.Mesh(new THREE.DodecahedronGeometry(size3, 0), getRandomRockMat());
  rock3.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock3.position.set((Math.random() - 0.5) * size * 1.2, size3 * 0.4, (Math.random() - 0.5) * size * 1.2);
  rock3.castShadow = true;
  rock3.receiveShadow = true;
  rockGroup.add(rock3);
  rockGroup.position.set(x, 0, z);
  scene.add(rockGroup);
}

const boundarySegments = 60;
for (let i = 0; i < boundarySegments; i++) {
  const angle = (i / boundarySegments) * Math.PI * 2;
  const radiusVar = WORLD_RADIUS + (Math.random() - 0.5) * 2;
  const x = Math.cos(angle) * radiusVar;
  const z = Math.sin(angle) * radiusVar;
  const scale = 1 + Math.random() * 0.6;
  const distToSpawn = Math.sqrt((x - SPAWN_POS.x) ** 2 + (z - SPAWN_POS.z) ** 2);
  if (distToSpawn < 4) continue;
  createBoundaryRock(x, z, scale);
}

// ==================== AWAN ====================
const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, transparent: true, opacity: 0.9, roughness: 1
});

for (let i = 0; i < 15; i++) {
  const cloud = new THREE.Group();
  for (let j = 0; j < 4; j++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8), cloudMat);
    puff.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6);
    cloud.add(puff);
  }
  cloud.position.set((Math.random() - 0.5) * 200, 30 + Math.random() * 10, (Math.random() - 0.5) * 200);
  scene.add(cloud);
}

// ==================== PORTAL TRANSITION OVERLAY ====================
const portalOverlay = document.createElement('div');
portalOverlay.style.cssText = `
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #66ccff 0%, #0a1a35 100%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease;
  z-index: 9999;
`;
document.body.appendChild(portalOverlay);

// ==================== KEYBOARD ====================
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Shift') keys.shift = true;
  if (e.code === 'Space' || e.key === ' ') {
    keys.space = true;
    e.preventDefault();
  }
});
document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === 'Shift') keys.shift = false;
  if (e.code === 'Space' || e.key === ' ') {
    keys.space = false;
  }
});

// ==================== MOUSE ====================
let yaw = 0;
let pitch = 0;
let pointerLocked = false;
window.setYaw = (y) => { yaw = y; };
window.setPitch = (p) => { pitch = p; };

// Cek jika kembali dari game portal
const urlParams = new URLSearchParams(window.location.search);
const fromGame = urlParams.get('from');

if (fromGame === 'camp' || fromGame === 'deadzone') {
  player.position.set(CAMP_PORTAL_POS.x - 2.5, 0, CAMP_PORTAL_POS.z);
  player.rotation.y = -Math.PI / 2;
  yaw = Math.PI / 2;
  campPortalCooldown = 3.5;
} else if (fromGame === 'kebun' || fromGame === 'farm' || fromGame === 'fruit') {
  player.position.set(PORTAL_POS.x + 2.5, 0, PORTAL_POS.z);
  player.rotation.y = Math.PI / 2;
  yaw = -Math.PI / 2;
  portalCooldown = 3.5;
} else if (fromGame === 'arena' || fromGame === 'fight') {
  player.position.set(ARENA_PORTAL_POS.x - 2.5, 0, ARENA_PORTAL_POS.z);
  player.rotation.y = -Math.PI / 2;
  yaw = Math.PI / 2;
  arenaPortalCooldown = 3.5;
}

const hintEl = document.getElementById('hint');
if (hintEl && fromGame) {
  if (fromGame === 'camp' || fromGame === 'deadzone') {
    hintEl.textContent = '💀 Kembali dari Dead Zone! Klik di layar untuk lanjut jalan';
  } else if (fromGame === 'arena' || fromGame === 'fight') {
    hintEl.textContent = '⚔️ Kembali dari Battle Arena! Klik di layar untuk lanjut jalan';
  } else {
    hintEl.textContent = '🍎 Kembali dari Fruit Block Blast! Klik di layar untuk lanjut jalan';
  }
}
const canvas = renderer.domElement;

// ==================== DEVICE MODE (LAPTOP vs HP) ====================
let currentDeviceMode = localStorage.getItem('game_device_mode') || 
  (('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'hp' : 'laptop');

const btnModeLaptop = document.getElementById('btnModeLaptop');
const btnModeHP = document.getElementById('btnModeHP');

function setDeviceMode(mode) {
  currentDeviceMode = mode;
  try { localStorage.setItem('game_device_mode', mode); } catch (e) {}
  if (mode === 'hp') {
    document.body.classList.add('mode-hp');
    btnModeHP?.classList.add('active');
    btnModeLaptop?.classList.remove('active');
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  } else {
    document.body.classList.remove('mode-hp');
    btnModeLaptop?.classList.add('active');
    btnModeHP?.classList.remove('active');
  }
}

if (btnModeLaptop && btnModeHP) {
  btnModeLaptop.addEventListener('click', (e) => {
    e.stopPropagation();
    setDeviceMode('laptop');
  });
  btnModeHP.addEventListener('click', (e) => {
    e.stopPropagation();
    setDeviceMode('hp');
  });
}
setDeviceMode(currentDeviceMode);

canvas.addEventListener('click', () => {
  if (currentDeviceMode === 'laptop' && !pointerLocked) {
    canvas.requestPointerLock();
  }
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
  if (pointerLocked) hintEl.classList.add('hidden');
  else if (currentDeviceMode === 'laptop') hintEl.classList.remove('hidden');
});

let isDragging = false;
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) isDragging = true;
});
document.addEventListener('mouseup', () => { isDragging = false; });
document.addEventListener('mousemove', (e) => {
  if (pointerLocked) {
    yaw -= e.movementX * 0.0025;
    pitch -= e.movementY * 0.0025;
  } else if (isDragging) {
    yaw -= e.movementX * 0.005;
    pitch -= e.movementY * 0.005;
  } else return;
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
});

// ==================== VIRTUAL JOYSTICK & MOBILE CONTROLS ====================
const joyState = { x: 0, y: 0 };
let mobileSprintActive = false;
let joyTouchId = null;
const joyContainer = document.getElementById('joystick-container');
const joyThumb = document.getElementById('joystick-thumb');

if (joyContainer && joyThumb) {
  const joyRadius = 42;

  function updateJoystickPos(clientX, clientY) {
    const rect = joyContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > joyRadius) {
      dx = (dx / dist) * joyRadius;
      dy = (dy / dist) * joyRadius;
    }

    joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joyState.x = dx / joyRadius;
    joyState.y = -dy / joyRadius;
  }

  function handleJoyStart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (joyTouchId === null) {
        joyTouchId = touch.identifier;
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  function handleJoyMove(e) {
    if (joyTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joyTouchId) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  function handleJoyEnd(e) {
    if (joyTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        joyTouchId = null;
        joyState.x = 0;
        joyState.y = 0;
        joyThumb.style.transform = 'translate(-50%, -50%)';
        break;
      }
    }
  }

  joyContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleJoyStart(e);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (joyTouchId !== null) {
      handleJoyMove(e);
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (joyTouchId !== null) {
      handleJoyEnd(e);
    }
  });
  window.addEventListener('touchcancel', (e) => {
    if (joyTouchId !== null) {
      handleJoyEnd(e);
    }
  });
}

// Mobile Buttons: Jump & Sprint
const btnMobileJump = document.getElementById('btn-mobile-jump');
const btnMobileSprint = document.getElementById('btn-mobile-sprint');

if (btnMobileJump) {
  const triggerJump = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isGrounded) {
      playerVelocityY = JUMP_FORCE;
      isGrounded = false;
    }
  };
  btnMobileJump.addEventListener('touchstart', triggerJump, { passive: false });
  btnMobileJump.addEventListener('mousedown', triggerJump);
}

if (btnMobileSprint) {
  const toggleSprint = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    mobileSprintActive = !mobileSprintActive;
    btnMobileSprint.classList.toggle('active', mobileSprintActive);
  };
  btnMobileSprint.addEventListener('touchstart', toggleSprint, { passive: false });
  btnMobileSprint.addEventListener('click', toggleSprint);
}

// Touch Look Zone (Sentuhan di area layar untuk lihat sekeliling)
const touchLookZone = document.getElementById('touch-look-zone');
let lookTouchId = null;
let lastLookX = 0, lastLookY = 0;

if (touchLookZone) {
  touchLookZone.addEventListener('touchstart', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (lookTouchId === null) {
        lookTouchId = touch.identifier;
        lastLookX = touch.clientX;
        lastLookY = touch.clientY;
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (lookTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId) {
        const dx = touch.clientX - lastLookX;
        const dy = touch.clientY - lastLookY;
        yaw -= dx * 0.0055;
        pitch -= dy * 0.0055;
        pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
        lastLookX = touch.clientX;
        lastLookY = touch.clientY;
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (lookTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId) {
        lookTouchId = null;
        break;
      }
    }
  });
  window.addEventListener('touchcancel', (e) => {
    if (lookTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId) {
        lookTouchId = null;
        break;
      }
    }
  });
}

// ==================== KAMERA AWAL ====================
{
  const camDist = 6;
  const camHeight = 2;
  camera.position.set(
    player.position.x + Math.sin(yaw) * camDist,
    camHeight,
    player.position.z + Math.cos(yaw) * camDist
  );
  const lookAt = player.position.clone();
  lookAt.y += 1.7;
  camera.lookAt(lookAt);
}

// ==================== INISIALISASI SISTEM NPC ====================
initNPCSystem(scene, THREE, { arena: ARENA });

// ==================== ANIMATION LOOP ====================
const clock = new THREE.Clock();
let walkTime = 0;
let idleTime = 0;

// ===== VARIABEL LOMPAT & GRAVITASI =====
let playerVelocityY = 0;
let isGrounded = true;
const GRAVITY = 28;
const JUMP_FORCE = 11;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const isSprinting = keys.shift || mobileSprintActive;
  const baseSpeed = isSprinting ? 12 : 6;
  const speed = baseSpeed * delta;

  // ===== SISTEM LOMPAT & GRAVITASI =====
  if ((keys.space || keys[' ']) && isGrounded) {
    playerVelocityY = JUMP_FORCE;
    isGrounded = false;
  }

  if (!isGrounded) {
    playerVelocityY -= GRAVITY * delta;
    player.position.y += playerVelocityY * delta;
    if (player.position.y <= 0) {
      player.position.y = 0;
      playerVelocityY = 0;
      isGrounded = true;
    }
  }

  // ===== ANIMASI PORTAL KEBUN =====
  portalTime += delta;
  portalRing.rotation.z = portalTime * 0.6;
  portalAccent.rotation.z = -portalTime * 1.2;
  portalSurface.material.opacity = 0.45 + Math.sin(portalTime * 3) * 0.2;
  portalLight.intensity = 2.5 + Math.sin(portalTime * 4) * 0.8;
  portalParticles.forEach((p, i) => {
    const a = p.angle + portalTime * 1.5;
    p.mesh.position.x = Math.cos(a) * 2.1;
    p.mesh.position.z = Math.sin(a) * 0.4;
    p.mesh.position.y = 2.4 + Math.sin(a * 2 + i) * 0.4;
  });

  // ===== ANIMASI PORTAL KAMP =====
  campPortalTime += delta;
  campPortalRing.rotation.z = campPortalTime * 0.6;
  campPortalAccent.rotation.z = -campPortalTime * 1.2;
  campPortalSurface.material.opacity = 0.45 + Math.sin(campPortalTime * 3) * 0.2;
  campPortalLight.intensity = 2.5 + Math.sin(campPortalTime * 4) * 0.8;
  campPortalParticles.forEach((p, i) => {
    const a = p.angle + campPortalTime * 1.5;
    p.mesh.position.x = Math.cos(a) * 2.1;
    p.mesh.position.z = Math.sin(a) * 0.4;
    p.mesh.position.y = 2.4 + Math.sin(a * 2 + i) * 0.4;
  });

  // ===== ANIMASI PORTAL ARENA =====
  arenaPortalTime += delta;
  arenaPortalRing.rotation.z = arenaPortalTime * 0.8;
  arenaPortalAccent.rotation.z = -arenaPortalTime * 1.5;
  arenaPortalSurface.material.opacity = 0.45 + Math.sin(arenaPortalTime * 4) * 0.2;
  arenaPortalLight.intensity = 2.5 + Math.sin(arenaPortalTime * 5) * 0.8;
  arenaPortalParticles.forEach((p, i) => {
    const a = p.angle + arenaPortalTime * 2.0;
    p.mesh.position.x = Math.cos(a) * 2.1;
    p.mesh.position.z = Math.sin(a) * 0.4;
    p.mesh.position.y = 2.4 + Math.sin(a * 2 + i) * 0.4;
  });

  // ===== ANIMASI PATUNG LOGO BELAKANG =====
  if (typeof logoMedallionGroup !== 'undefined' && logoMedallionGroup) {
    logoMedallionGroup.position.y = 5.2 + Math.sin(clock.getElapsedTime() * 1.5) * 0.12;
  }
  if (typeof logoOrbitRing !== 'undefined' && logoOrbitRing) {
    logoOrbitRing.rotation.z += delta * 0.35;
  }
  if (typeof logoCrystals !== 'undefined' && logoCrystals.length > 0) {
    const elapsed = clock.getElapsedTime();
    logoCrystals.forEach((c, idx) => {
      c.rotation.y += delta * (0.8 + idx * 0.25);
      c.position.y = c.userData.baseY + Math.sin(elapsed * 2.5 + idx * 1.5) * 0.08;
    });
  }
  if (typeof logoInnerGlow !== 'undefined' && logoInnerGlow) {
    logoInnerGlow.material.emissiveIntensity = 0.6 + Math.sin(clock.getElapsedTime() * 2.5) * 0.25;
  }

  // ===== ANIMASI KUPU-KUPU =====
  butterflies.forEach(bf => {
    bf.t += delta * bf.speed;
    bf.mesh.position.x = bf.baseX + Math.cos(bf.t) * bf.radius;
    bf.mesh.position.z = bf.baseZ + Math.sin(bf.t * 0.8) * bf.radius;
    bf.mesh.position.y = bf.height + Math.sin(bf.t * 3) * 0.15;
    bf.mesh.rotation.y = bf.t + Math.PI / 2;
    const wingAngle = Math.sin(bf.t * 12 + bf.wingPhase) * 0.7;
    bf.wL.rotation.y = -wingAngle;
    bf.wR.rotation.y = wingAngle;
  });

  // ===== ANIMASI AIR IRIGASI =====
  if (irrigationWater) {
    irrigationWater.material.opacity = 0.75 + Math.sin(performance.now() * 0.002) * 0.1;
    irrigationWater.material.emissiveIntensity = 0.15 + Math.sin(performance.now() * 0.003) * 0.08;
  }

  // ===== MASUK PORTAL KEBUN =====
  if (portalCooldown > 0) portalCooldown -= delta;
  const dpdx = player.position.x - PORTAL_POS.x;
  const dpdz = player.position.z - PORTAL_POS.z;
  const distPortal = Math.sqrt(dpdx * dpdx + dpdz * dpdz);
  if (distPortal < 1.4 && portalCooldown <= 0) {
    portalCooldown = 999;
    portalLight.intensity = 8;
    portalOverlay.style.background = 'radial-gradient(circle at center, #66ccff 0%, #0a1a35 100%)';
    portalOverlay.style.opacity = '1';
    setTimeout(() => {
      window.location.href = 'index.html'; // Tautan game kebun
    }, 850);
  }

  // ===== MASUK PORTAL KAMP =====
  if (campPortalCooldown > 0) campPortalCooldown -= delta;
  const dpcx = player.position.x - CAMP_PORTAL_POS.x;
  const dpcz = player.position.z - CAMP_PORTAL_POS.z;
  const distCampPortal = Math.sqrt(dpcx * dpcx + dpcz * dpcz);
  if (distCampPortal < 1.4 && campPortalCooldown <= 0) {
    campPortalCooldown = 999;
    campPortalLight.intensity = 8;
    portalOverlay.style.background = 'radial-gradient(circle at center, #aaff66 0%, #0a1a05 100%)';
    portalOverlay.style.opacity = '1';
    setTimeout(() => {
      window.location.href = 'dead-zone/index.html'; // Tautan game kamp
    }, 850);
  }


  // ===== MASUK PORTAL ARENA =====
  if (arenaPortalCooldown > 0) arenaPortalCooldown -= delta;
  const dpax = player.position.x - ARENA_PORTAL_POS.x;
  const dpaz = player.position.z - ARENA_PORTAL_POS.z;
  const distArenaPortal = Math.sqrt(dpax * dpax + dpaz * dpaz);
  if (distArenaPortal < 1.4 && arenaPortalCooldown <= 0) {
    arenaPortalCooldown = 999;
    arenaPortalLight.intensity = 8;
    portalOverlay.style.background = 'radial-gradient(circle at center, #ff4444 0%, #330000 100%)';
    portalOverlay.style.opacity = '1';
    setTimeout(() => {
      window.location.href = 'bakalae/index.html'; // <--- DIUBAH MENJADI BAKALAE
    }, 850);
  }

  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  let isMoving = false;
  const moveVec = new THREE.Vector3();

  if (keys['w'] || keys['arrowup']) { moveVec.add(forward); isMoving = true; }
  if (keys['s'] || keys['arrowdown']) { moveVec.sub(forward); isMoving = true; }
  if (keys['a'] || keys['arrowleft']) { moveVec.sub(right); isMoving = true; }
  if (keys['d'] || keys['arrowright']) { moveVec.add(right); isMoving = true; }

  // Input Analog Virtual Joystick (Layar Sentuh HP)
  if (joyState && (joyState.x !== 0 || joyState.y !== 0)) {
    moveVec.addScaledVector(forward, joyState.y);
    moveVec.addScaledVector(right, joyState.x);
    isMoving = true;
  }

  if (isMoving) {
    moveVec.normalize();
    player.position.addScaledVector(moveVec, speed);

    resolveWallCollisions(player.position);

    const playerRadius = 1.5;
    const distFromCenter = Math.sqrt(
      player.position.x * player.position.x + player.position.z * player.position.z
    );
    const maxRadius = WORLD_RADIUS - playerRadius;
    if (distFromCenter > maxRadius) {
      const angle = Math.atan2(player.position.z, player.position.x);
      player.position.x = Math.cos(angle) * maxRadius;
      player.position.z = Math.sin(angle) * maxRadius;
    }

    // Collision dengan patung GameDev di samping perkebunan (-14, 5)
    const statueRadius = 9.5;
    const dxStatue = player.position.x - (-14);
    const dzStatue = player.position.z - 5;
    const distToStatue = Math.sqrt(dxStatue * dxStatue + dzStatue * dzStatue);
    if (distToStatue < statueRadius) {
      const angle = Math.atan2(dzStatue, dxStatue);
      player.position.x = -14 + Math.cos(angle) * statueRadius;
      player.position.z = 5 + Math.sin(angle) * statueRadius;
    }

    // Collision dengan patung logo Universitas Prisma di belakang (0, -35) - Ukuran 3x
    const logoStatueRadius = 18.0;
    const dxLogo = player.position.x - 0;
    const dzLogo = player.position.z - (-35);
    const distToLogoStatue = Math.sqrt(dxLogo * dxLogo + dzLogo * dzLogo);
    if (distToLogoStatue < logoStatueRadius) {
      const angle = Math.atan2(dzLogo, dxLogo);
      player.position.x = Math.cos(angle) * logoStatueRadius;
      player.position.z = -35 + Math.sin(angle) * logoStatueRadius;
    }

    const targetAngle = Math.atan2(moveVec.x, moveVec.z);
    let diff = targetAngle - player.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * 0.2;

    walkTime += delta * (isSprinting ? 14 : 9);
    const swing = Math.sin(walkTime);

    anim.legL.rotation.x = swing * 0.75;
    anim.legR.rotation.x = -swing * 0.75;
    anim.legLLow.rotation.x = Math.max(0, -swing) * 0.9;
    anim.legRLow.rotation.x = Math.max(0, swing) * 0.9;

    anim.armL.rotation.x = -swing * 0.6;
    anim.armR.rotation.x = swing * 0.6;
    anim.armLLow.rotation.x = -0.4 - Math.abs(swing) * 0.3;
    anim.armRLow.rotation.x = -0.4 - Math.abs(swing) * 0.3;

    anim.armL.rotation.z = 0.08;
    anim.armR.rotation.z = -0.08;

    if (isGrounded) {
      const bob = Math.abs(Math.sin(walkTime)) * 0.07;
      player.position.y = bob;
    }

    anim.headGroup.rotation.z = swing * 0.04;
    anim.headGroup.rotation.y = Math.sin(walkTime * 0.5) * 0.07;
  } else {
    idleTime += delta;
    anim.legL.rotation.x *= 0.85;
    anim.legR.rotation.x *= 0.85;
    anim.armL.rotation.x *= 0.85;
    anim.armR.rotation.x *= 0.85;
    anim.legLLow.rotation.x *= 0.85;
    anim.legRLow.rotation.x *= 0.85;
    anim.armLLow.rotation.x += (-0.3 - anim.armLLow.rotation.x) * 0.15;
    anim.armRLow.rotation.x += (-0.3 - anim.armRLow.rotation.x) * 0.15;

    anim.armL.rotation.z = 0.08 + Math.sin(idleTime * 1.5) * 0.03;
    anim.armR.rotation.z = -0.08 - Math.sin(idleTime * 1.5) * 0.03;

    if (isGrounded) {
      const breath = Math.sin(idleTime * 1.6) * 0.02;
      player.position.y += (breath - player.position.y) * 0.1;
    }

    anim.headGroup.rotation.z = Math.sin(idleTime * 0.7) * 0.025;
    anim.headGroup.rotation.y = Math.sin(idleTime * 0.4) * 0.08;
  }

  // Pose di udara saat melompat
  if (!isGrounded) {
    anim.legL.rotation.x = -0.35;
    anim.legR.rotation.x = 0.45;
    anim.legLLow.rotation.x = 0.7;
    anim.legRLow.rotation.x = 0.25;
    anim.armL.rotation.x = 0.5;
    anim.armR.rotation.x = -0.5;
  }

  const camDist = 4.2;
  const camHeight = 1.7 + Math.sin(pitch) * 2.8;
  const horizontalDist = camDist * Math.cos(pitch);
  const camOffset = new THREE.Vector3(
    Math.sin(yaw) * horizontalDist,
    camHeight,
    Math.cos(yaw) * horizontalDist
  );

  const targetCamPos = player.position.clone().add(camOffset);
  targetCamPos.y = Math.max(0.6, targetCamPos.y);
  camera.position.lerp(targetCamPos, 0.18);

  const lookAt = player.position.clone();
  lookAt.y += 1.45 + Math.sin(-pitch) * 1.0;
  camera.lookAt(lookAt);

  // ===== UPDATE SISTEM NPC (3 WILAYAH) =====
  updateNPCSystem(delta, clock.getElapsedTime(), player);

  renderer.render(scene, camera);
}

window.player = player;
window.camera = camera;
window.scene = scene;
window.renderer = renderer;

animate();

// ==================== RESIZE ====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});