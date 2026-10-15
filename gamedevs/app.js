import * as THREE from 'three';

// ==================== SCENE ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ==================== LIGHTING ====================
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

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

scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4a8f3c, 0.6));

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
  new THREE.Vector3(SPAWN_POS.x + 10, 0.02, SPAWN_POS.z - 12),
  new THREE.Vector3(SPAWN_POS.x - 10, 0.02, SPAWN_POS.z - 28),
  new THREE.Vector3(SPAWN_POS.x + 8, 0.02, SPAWN_POS.z - 42),
  new THREE.Vector3(0, 0.02, 0)
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
const branchArenaStart = pathCurve.getPoint(0.15); // Bercabang lebih awal dari kamp
const branchArenaPoints = [
  new THREE.Vector3(branchArenaStart.x, 0.02, branchArenaStart.z),
  new THREE.Vector3(20, 0.02, branchArenaStart.z - 2),
  new THREE.Vector3(35, 0.02, 35),
  new THREE.Vector3(40, 0.02, 35)
];
const branchArenaCurve = new THREE.CatmullRomCurve3(branchArenaPoints, false, 'catmullrom', 0.5);
createPath(branchArenaCurve, 120);

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
const ARENA = { cx: 45, cz: 35, w: 24, d: 24, entranceZ: 35, entranceWidth: 6 };
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
const ARENA_PORTAL_POS = new THREE.Vector3(ARENA.cx, 0, ARENA.cz);
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


// ==================== ⭐ PATUNG GAMEDEV 25 (TENGAH) ⭐ ====================
const statue = new THREE.Group();
statue.position.set(0, 0, 0);

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
monitorGroup.position.set(0, 0.95, -0.6);

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

function makeTriangle(w, h, mat) {
  const shape = new THREE.Shape();
  shape.moveTo(-w/2, 0);
  shape.lineTo(w/2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  return new THREE.Mesh(geo, mat);
}

const mountain1 = makeTriangle(1.0, 1.1, C_BLUE_LIGHT);
mountain1.position.set(0.3, 0.25, 0.16);
monitorGroup.add(mountain1);

const mountain2 = makeTriangle(0.7, 0.8, C_BLUE_MID);
mountain2.position.set(-0.4, 0.25, 0.17);
monitorGroup.add(mountain2);

const cloudGroup = new THREE.Group();
cloudGroup.position.set(0.75, 1.5, 0.17);
const cloudBlock1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.05), C_WHITE);
cloudGroup.add(cloudBlock1);
const cloudBlock2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.05), C_WHITE);
cloudBlock2.position.set(-0.15, 0.06, 0);
cloudGroup.add(cloudBlock2);
const cloudBlock3 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.05), C_WHITE);
cloudBlock3.position.set(0.18, 0.06, 0);
cloudGroup.add(cloudBlock3);
const cloudBlock4 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.05), C_WHITE);
cloudBlock4.position.set(0, -0.1, 0);
cloudGroup.add(cloudBlock4);
monitorGroup.add(cloudGroup);

const plat1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.06), C_ORANGE);
plat1.position.set(0.6, 0.5, 0.17);
monitorGroup.add(plat1);

const plat2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.06), C_ORANGE);
plat2.position.set(-0.6, 0.85, 0.17);
monitorGroup.add(plat2);

const pixelChar = new THREE.Group();
pixelChar.position.set(-0.55, 0.97, 0.2);

const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.06), C_WHITE);
pixelChar.add(pHead);

const pHat = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.07), C_ORANGE);
pHat.position.y = 0.1;
pixelChar.add(pHat);
const pHatTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.07), C_ORANGE_D);
pHatTop.position.y = 0.16;
pixelChar.add(pHatTop);

const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.06), C_BLUE_LIGHT);
pBody.position.y = -0.14;
pixelChar.add(pBody);

const pArmL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), C_WHITE);
pArmL.position.set(-0.1, -0.1, 0);
pixelChar.add(pArmL);
const pArmR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), C_WHITE);
pArmR.position.set(0.1, -0.1, 0);
pixelChar.add(pArmR);

const pLegL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), C_BLUE_DARK);
pLegL.position.set(-0.04, -0.27, 0);
pixelChar.add(pLegL);
const pLegR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), C_BLUE_DARK);
pLegR.position.set(0.04, -0.27, 0);
pixelChar.add(pLegR);

const pShoeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.06), C_WHITE);
pShoeL.position.set(-0.04, -0.33, 0.01);
pixelChar.add(pShoeL);
const pShoeR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.06), C_WHITE);
pShoeR.position.set(0.04, -0.33, 0.01);
pixelChar.add(pShoeR);

monitorGroup.add(pixelChar);

const standNeck = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.5, 0.25),
  C_BLUE_DARK
);
standNeck.position.set(0, -0.15, -0.02);
standNeck.castShadow = true;
monitorGroup.add(standNeck);

const standBase = new THREE.Mesh(
  new THREE.BoxGeometry(1.0, 0.15, 0.7),
  C_BLUE_DARK
);
standBase.position.set(0, -0.45, 0);
standBase.castShadow = true;
monitorGroup.add(standBase);

statue.add(monitorGroup);

const gearGroup = new THREE.Group();
gearGroup.position.set(2.0, 1.6, -1.3);

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
controllerGroup.position.set(0, 0.95, 1.2);

const ctrlBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.3, 1.0),
  C_WHITE
);
ctrlBody.position.y = 0.15;
ctrlBody.castShadow = true;
ctrlBody.receiveShadow = true;
controllerGroup.add(ctrlBody);

const gripL = new THREE.Mesh(
  new THREE.BoxGeometry(0.55, 0.4, 0.9),
  C_WHITE
);
gripL.position.set(-1.1, 0.05, 0.15);
gripL.rotation.z = 0.15;
gripL.castShadow = true;
controllerGroup.add(gripL);

const gripR = new THREE.Mesh(
  new THREE.BoxGeometry(0.55, 0.4, 0.9),
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

const dpadH = new THREE.Mesh(
  new THREE.BoxGeometry(0.45, 0.08, 0.15),
  C_BLUE_MID
);
dpadH.position.set(-0.6, 0.32, 0.05);
dpadH.castShadow = true;
controllerGroup.add(dpadH);

const dpadV = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.08, 0.45),
  C_BLUE_MID
);
dpadV.position.set(-0.6, 0.32, 0.05);
dpadV.castShadow = true;
controllerGroup.add(dpadV);

const actionButtons = [
  { x: 0.6, z: 0.35 },
  { x: 0.85, z: 0.15 },
  { x: 0.6, z: -0.05 },
  { x: 0.35, z: 0.15 }
];
actionButtons.forEach(pos => {
  const btn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12),
    C_ORANGE
  );
  btn.position.set(pos.x, 0.32, pos.z);
  btn.castShadow = true;
  controllerGroup.add(btn);
});

const startBtn = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.06, 0.08),
  C_BLUE_MID
);
startBtn.position.set(-0.1, 0.32, 0.05);
controllerGroup.add(startBtn);

const selectBtn = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.06, 0.08),
  C_BLUE_MID
);
selectBtn.position.set(-0.1, 0.32, 0.05);
controllerGroup.add(selectBtn);

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

// ==================== KARAKTER ====================
const player = new THREE.Group();

const M = {
  skin:      new THREE.MeshStandardMaterial({ color: 0xffdcb8, roughness: 0.6 }),
  hair:      new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.75 }),
  hairHi:    new THREE.MeshStandardMaterial({ color: 0x3a2f26, roughness: 0.65 }),
  suit:      new THREE.MeshStandardMaterial({ color: 0x14141e, roughness: 0.65 }),
  suitLight: new THREE.MeshStandardMaterial({ color: 0x1e1e2a, roughness: 0.6 }),
  lapel:     new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.55 }),
  shirt:     new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4 }),
  tie:       new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.55 }),
  button:    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.6 }),
  shoe:      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.25, metalness: 0.4 }),
  shoeShine: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.15, metalness: 0.5 }),
  eyeWhite:  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 }),
  eyeIris:   new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.25, emissive: 0x0a0503, emissiveIntensity: 0.3 }),
  eyePupil:  new THREE.MeshBasicMaterial({ color: 0x050505 }),
  eyeShine:  new THREE.MeshBasicMaterial({ color: 0xffffff }),
  mouth:     new THREE.MeshStandardMaterial({ color: 0x8b4a4a, roughness: 0.7 }),
  brow:      new THREE.MeshStandardMaterial({ color: 0x0f0c08, roughness: 0.9 })
};

const headGroup = new THREE.Group();
headGroup.position.y = 2.2;
player.add(headGroup);

const skull = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), M.skin);
skull.scale.set(0.95, 1, 0.92);
skull.castShadow = true;
headGroup.add(skull);

const chin = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), M.skin);
chin.position.set(0, -0.22, 0.05);
chin.scale.set(1, 0.7, 1);
headGroup.add(chin);

const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.43, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), M.hair);
hairBack.position.set(0, 0.05, -0.06);
hairBack.scale.set(1.02, 1.05, 1.02);
hairBack.castShadow = true;
headGroup.add(hairBack);

const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.42), M.hair);
topCap.position.set(0, 0.06, -0.02);
topCap.scale.set(0.98, 1.02, 1.0);
topCap.castShadow = true;
headGroup.add(topCap);

const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.28), M.hair);
sideHairL.position.set(-0.38, 0.1, -0.05);
sideHairL.castShadow = true;
headGroup.add(sideHairL);

const sideHairR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.28), M.hair);
sideHairR.position.set(0.38, 0.1, -0.05);
sideHairR.castShadow = true;
headGroup.add(sideHairR);

const napeHair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.06), M.hair);
napeHair.position.set(0, -0.15, -0.35);
napeHair.castShadow = true;
headGroup.add(napeHair);

const sweepBang = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), M.hair);
sweepBang.position.set(-0.06, 0.32, 0.22);
sweepBang.scale.set(1.5, 0.35, 0.8);
sweepBang.rotation.z = -0.3;
sweepBang.rotation.x = 0.15;
sweepBang.castShadow = true;
headGroup.add(sweepBang);

const sweepTip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), M.hairHi);
sweepTip.position.set(0.2, 0.28, 0.26);
sweepTip.scale.set(0.8, 0.5, 0.7);
sweepTip.rotation.z = -0.5;
sweepTip.castShadow = true;
headGroup.add(sweepTip);

const sideBang = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), M.hair);
sideBang.position.set(-0.26, 0.28, 0.26);
sideBang.scale.set(0.7, 0.5, 0.6);
sideBang.rotation.z = 0.4;
sideBang.castShadow = true;
headGroup.add(sideBang);

const hairHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), M.hairHi);
hairHighlight.position.set(-0.05, 0.42, 0.02);
hairHighlight.scale.set(1.4, 0.12, 0.9);
headGroup.add(hairHighlight);

const earGeo = new THREE.SphereGeometry(0.09, 10, 10);
const earL = new THREE.Mesh(earGeo, M.skin);
earL.position.set(-0.4, -0.02, 0);
earL.scale.set(0.5, 1.1, 0.85);
earL.castShadow = true;
headGroup.add(earL);

const earR = new THREE.Mesh(earGeo, M.skin);
earR.position.set(0.4, -0.02, 0);
earR.scale.set(0.5, 1.1, 0.85);
earR.castShadow = true;
headGroup.add(earR);

function createEye(x) {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(x, 0.02, 0.32);
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), M.eyeWhite);
  sclera.scale.set(1.1, 0.85, 0.4);
  eyeGroup.add(sclera);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), M.eyeIris);
  iris.scale.set(1.05, 0.9, 0.4);
  iris.position.set(0, 0, 0.03);
  eyeGroup.add(iris);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), M.eyePupil);
  pupil.scale.set(1, 1, 0.4);
  pupil.position.set(0, 0, 0.055);
  eyeGroup.add(pupil);
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), M.eyeShine);
  shine.position.set(-0.028, 0.025, 0.07);
  eyeGroup.add(shine);
  return eyeGroup;
}

headGroup.add(createEye(-0.14));
headGroup.add(createEye(0.14));

const lidGeo = new THREE.BoxGeometry(0.2, 0.02, 0.03);
const lidL = new THREE.Mesh(lidGeo, M.brow);
lidL.position.set(-0.14, 0.11, 0.36);
headGroup.add(lidL);
const lidR = new THREE.Mesh(lidGeo, M.brow);
lidR.position.set(0.14, 0.11, 0.36);
headGroup.add(lidR);

const browGeo = new THREE.BoxGeometry(0.16, 0.038, 0.04);
const browL = new THREE.Mesh(browGeo, M.brow);
browL.position.set(-0.14, 0.19, 0.34);
browL.rotation.z = 0.1;
headGroup.add(browL);
const browR = new THREE.Mesh(browGeo, M.brow);
browR.position.set(0.14, 0.19, 0.34);
browR.rotation.z = -0.1;
headGroup.add(browR);

const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), M.skin);
nose.position.set(0, -0.05, 0.38);
nose.rotation.x = Math.PI / 2;
headGroup.add(nose);

const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.02), M.mouth);
mouth.position.set(0.01, -0.15, 0.36);
mouth.rotation.z = -0.05;
headGroup.add(mouth);

const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.15, 12), M.skin);
neck.position.y = 1.83;
neck.castShadow = true;
player.add(neck);

const shirtCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.1, 16), M.shirt);
shirtCollar.position.y = 1.75;
shirtCollar.castShadow = true;
player.add(shirtCollar);

const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.55, 20), M.suit);
chest.position.y = 1.42;
chest.castShadow = true;
player.add(chest);

const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.4, 20), M.suit);
belly.position.y = 0.98;
belly.castShadow = true;
player.add(belly);

const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.05), M.lapel);
lapelL.position.set(-0.11, 1.45, 0.34);
lapelL.rotation.z = 0.28;
lapelL.castShadow = true;
player.add(lapelL);

const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.05), M.lapel);
lapelR.position.set(0.11, 1.45, 0.34);
lapelR.rotation.z = -0.28;
lapelR.castShadow = true;
player.add(lapelR);

const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.04), M.shirt);
shirtV.position.set(0, 1.5, 0.33);
player.add(shirtV);

const shirtButton = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), M.button);
shirtButton.position.set(0, 1.72, 0.36);
player.add(shirtButton);

const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), M.tie);
tieKnot.position.set(0, 1.68, 0.37);
player.add(tieKnot);

const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.03), M.tie);
tieBody.position.set(0, 1.44, 0.37);
player.add(tieBody);

const tieTip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), M.tie);
tieTip.position.set(0, 1.16, 0.37);
tieTip.rotation.x = Math.PI;
tieTip.rotation.y = Math.PI / 4;
player.add(tieTip);

const button1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), M.button);
button1.position.set(0.12, 1.15, 0.35);
player.add(button1);

const button2 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), M.button);
button2.position.set(0.12, 0.95, 0.34);
player.add(button2);

const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), M.suitLight);
pocket.position.set(-0.24, 1.4, 0.34);
player.add(pocket);

const pocketLowL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), M.suitLight);
pocketLowL.position.set(-0.32, 1.0, 0.32);
player.add(pocketLowL);

const pocketLowR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), M.suitLight);
pocketLowR.position.set(0.32, 1.0, 0.32);
player.add(pocketLowR);

const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.09, 20), M.shoe);
belt.position.y = 0.76;
belt.castShadow = true;
player.add(belt);

const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.05), M.button);
buckle.position.set(0, 0.76, 0.35);
player.add(buckle);

function makeArm(side) {
  const armGroup = new THREE.Group();
  armGroup.position.set(side * 0.44, 1.65, 0);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), M.suit);
  shoulder.castShadow = true;
  armGroup.add(shoulder);
  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 8, 12), M.suit);
  upperArm.position.y = -0.25;
  upperArm.castShadow = true;
  armGroup.add(upperArm);
  const cuff1 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), M.button);
  cuff1.position.set(side * -0.08, -0.42, 0.06);
  armGroup.add(cuff1);
  const cuff2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), M.button);
  cuff2.position.set(side * -0.08, -0.38, 0.07);
  armGroup.add(cuff2);
  const lowerGroup = new THREE.Group();
  lowerGroup.position.y = -0.5;
  armGroup.add(lowerGroup);
  const shirtCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.06, 14), M.shirt);
  shirtCuff.position.y = -0.02;
  lowerGroup.add(shirtCuff);
  const lowerArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 8, 12), M.skin);
  lowerArm.position.y = -0.22;
  lowerArm.castShadow = true;
  lowerGroup.add(lowerArm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), M.skin);
  hand.position.y = -0.44;
  hand.scale.set(1, 0.95, 0.7);
  hand.castShadow = true;
  lowerGroup.add(hand);
  return { armGroup, lowerGroup };
}

const armLData = makeArm(-1);
const armRData = makeArm(1);
player.add(armLData.armGroup);
player.add(armRData.armGroup);

function makeLeg(side) {
  const legGroup = new THREE.Group();
  legGroup.position.set(side * 0.17, 0.75, 0);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), M.suit);
  hip.castShadow = true;
  legGroup.add(hip);
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.32, 8, 12), M.suit);
  thigh.position.y = -0.24;
  thigh.castShadow = true;
  legGroup.add(thigh);
  const lowerGroup = new THREE.Group();
  lowerGroup.position.y = -0.48;
  legGroup.add(lowerGroup);
  const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.28, 8, 12), M.suit);
  calf.position.y = -0.2;
  calf.castShadow = true;
  lowerGroup.add(calf);
  const crease = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.02), M.suitLight);
  crease.position.set(0, -0.2, 0.12);
  lowerGroup.add(crease);
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.42), M.shoe);
  shoe.position.set(0, -0.47, 0.07);
  shoe.castShadow = true;
  lowerGroup.add(shoe);
  const shoeToe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), M.shoeShine);
  shoeToe.position.set(0, -0.5, 0.26);
  shoeToe.scale.set(1.05, 0.55, 1);
  shoeToe.castShadow = true;
  lowerGroup.add(shoeToe);
  const shoeVamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.15), M.shoe);
  shoeVamp.position.set(0, -0.42, -0.02);
  shoeVamp.castShadow = true;
  lowerGroup.add(shoeVamp);
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.46), M.shoe);
  sole.position.set(0, -0.55, 0.07);
  lowerGroup.add(sole);
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), M.shoeShine);
  shine.position.set(-0.05, -0.44, 0.28);
  shine.scale.set(1.5, 0.4, 1);
  lowerGroup.add(shine);
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
});
document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === 'Shift') keys.shift = false;
});

// ==================== MOUSE ====================
let yaw = SPAWN_ANGLE + Math.PI;
let pitch = 0;
let pointerLocked = false;

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

canvas.addEventListener('click', () => {
  if (!pointerLocked) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
  if (pointerLocked) hintEl.classList.add('hidden');
  else hintEl.classList.remove('hidden');
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

// ==================== TOUCH ====================
let touchX = 0, touchY = 0, touchActive = false;
canvas.addEventListener('touchstart', (e) => {
  touchActive = true;
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
  hintEl.classList.add('hidden');
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
  if (!touchActive) return;
  const dx = e.touches[0].clientX - touchX;
  const dy = e.touches[0].clientY - touchY;
  yaw -= dx * 0.006;
  pitch -= dy * 0.006;
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchend', () => { touchActive = false; });

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

// ==================== ANIMATION LOOP ====================
const clock = new THREE.Clock();
let walkTime = 0;
let idleTime = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const baseSpeed = keys.shift ? 12 : 6;
  const speed = baseSpeed * delta;

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

    const statueRadius = 9.5;
    const distToStatue = Math.sqrt(
      player.position.x * player.position.x + player.position.z * player.position.z
    );
    if (distToStatue < statueRadius) {
      const angle = Math.atan2(player.position.z, player.position.x);
      player.position.x = Math.cos(angle) * statueRadius;
      player.position.z = Math.sin(angle) * statueRadius;
    }

    const targetAngle = Math.atan2(moveVec.x, moveVec.z);
    let diff = targetAngle - player.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * 0.2;

    walkTime += delta * (keys.shift ? 14 : 9);
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

    const bob = Math.abs(Math.sin(walkTime)) * 0.07;
    player.position.y = bob;

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

    const breath = Math.sin(idleTime * 1.6) * 0.02;
    player.position.y += (breath - player.position.y) * 0.1;

    anim.headGroup.rotation.z = Math.sin(idleTime * 0.7) * 0.025;
    anim.headGroup.rotation.y = Math.sin(idleTime * 0.4) * 0.08;
  }

  const camDist = 6;
  const camHeight = 2 + Math.sin(pitch) * 4;
  const horizontalDist = camDist * Math.cos(pitch);
  const camOffset = new THREE.Vector3(
    Math.sin(yaw) * horizontalDist,
    camHeight,
    Math.cos(yaw) * horizontalDist
  );

  const targetCamPos = player.position.clone().add(camOffset);
  targetCamPos.y = Math.max(0.8, targetCamPos.y);
  camera.position.lerp(targetCamPos, 0.18);

  const lookAt = player.position.clone();
  lookAt.y += 1.7 + Math.sin(-pitch) * 1.5;
  camera.lookAt(lookAt);

  renderer.render(scene, camera);
}

animate();

// ==================== RESIZE ====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});