import * as THREE from 'three';
import { addWallSegment } from './world.js';

// ==================== ZONES & LANDMARKS ====================
export const PLANT = { cx: -38, cz: 22, w: 26, d: 22, entranceZ: 22, entranceWidth: 4 };
export const PLANT_X1 = PLANT.cx - PLANT.w / 2;
export const PLANT_X2 = PLANT.cx + PLANT.w / 2;
export const PLANT_Z1 = PLANT.cz - PLANT.d / 2;
export const PLANT_Z2 = PLANT.cz + PLANT.d / 2;
export const PORTAL_POS = new THREE.Vector3(PLANT_X1 + 4, 0, PLANT.cz);

export const CAMP = { cx: 42, cz: -12, w: 28, d: 24, entranceZ: -12, entranceWidth: 5 };
export const CAMP_X1 = CAMP.cx - CAMP.w / 2;
export const CAMP_X2 = CAMP.cx + CAMP.w / 2;
export const CAMP_Z1 = CAMP.cz - CAMP.d / 2;
export const CAMP_Z2 = CAMP.cz + CAMP.d / 2;
export const CAMP_PORTAL_POS = new THREE.Vector3(CAMP.cx - 6, 0, CAMP.cz);

export const ARENA = { cx: 30, cz: 22, w: 24, d: 24, entranceZ: 22, entranceWidth: 5 };
export const ARENA_X1 = ARENA.cx - ARENA.w / 2;
export const ARENA_X2 = ARENA.cx + ARENA.w / 2;
export const ARENA_Z1 = ARENA.cz - ARENA.d / 2;
export const ARENA_Z2 = ARENA.cz + ARENA.d / 2;
export const ARENA_PORTAL_POS = new THREE.Vector3(ARENA.cx, 0, ARENA_Z1 + 4);

export const KIOSK_POS = new THREE.Vector3(3.2, 0, 4.5);

export let portalLight = null;
export let campPortalLight = null;
export let arenaPortalLight = null;

export let portalSurface = null;
export let campPortalSurface = null;
export let arenaPortalSurface = null;

export let campPortalRing = null;
export let campPortalAccent = null;
export let arenaPortalRing = null;
export let arenaPortalAccent = null;

export const portalParticles = [];
export const campPortalParticles = [];
export const arenaPortalParticles = [];

export let kioskGroup = null;

export function createZones(scene) {
// ==================== PERKEBUNAN ====================
// const PLANT = { cx: -38, cz: 22, w: 26, d: 22, entranceZ: 22, entranceWidth: 4 };
// const PLANT_X1 = PLANT.cx - PLANT.w / 2;
// const PLANT_X2 = PLANT.cx + PLANT.w / 2;
// const PLANT_Z1 = PLANT.cz - PLANT.d / 2;
// const PLANT_Z2 = PLANT.cz + PLANT.d / 2;

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

// ==================== ⭐ PAPAN NAMA TAMAN ASRI & PERKEBUNAN ⭐ ====================
function createGardenSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#2d6a4f');
  grad.addColorStop(0.5, '#1b4332');
  grad.addColorStop(1, '#081c15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  for (let y = 30; y < canvas.height; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(canvas.width * 0.33, y + 6, canvas.width * 0.66, y - 6, canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#d8f3dc';
  ctx.lineWidth = 14;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  ctx.strokeStyle = '#74c69d';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 80px "Baloo 2", Arial, sans-serif';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#081c15';
  ctx.strokeText('TAMAN ASRI & KEBUN', canvas.width / 2, 125);
  const textGrad = ctx.createLinearGradient(0, 70, 0, 170);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(1, '#95d5b2');
  ctx.fillStyle = textGrad;
  ctx.fillText('TAMAN ASRI & KEBUN', canvas.width / 2, 125);

  const botanicals = ['🌸', '🌻', '🍎', '🌿', '🍇', '🌷'];
  const spacing = canvas.width / (botanicals.length + 1);
  ctx.font = '96px Arial, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  botanicals.forEach((item, i) => {
    ctx.fillText(item, spacing * (i + 1), 288);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

const signTexture = createGardenSignTexture();
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

// ==================== ⭐ PAVILIUN AIR MANCUR & TAMAN BUNGA ⭐ ====================
// Menggantikan portal lama dengan paviliun air mancur asri untuk bersantai
const portalGroup = new THREE.Group();
portalGroup.position.copy(PORTAL_POS);
portalGroup.rotation.y = Math.PI / 2;

const fountainBasinMat = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,
  roughness: 0.4,
  metalness: 0.1
});
const fountainBasin = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.8, 0.5, 32),
  fountainBasinMat
);
fountainBasin.position.y = 0.25;
fountainBasin.castShadow = true;
fountainBasin.receiveShadow = true;
portalGroup.add(fountainBasin);

const fountainPillar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35, 0.5, 1.8, 16),
  fountainBasinMat
);
fountainPillar.position.y = 1.2;
fountainPillar.castShadow = true;
portalGroup.add(fountainPillar);

const fountainUpperTier = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 0.4, 0.35, 24),
  fountainBasinMat
);
fountainUpperTier.position.y = 1.9;
fountainUpperTier.castShadow = true;
portalGroup.add(fountainUpperTier);

const fountainWaterMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  roughness: 0.1,
  metalness: 0.2,
  transparent: true,
  opacity: 0.8
});
const fountainWater = new THREE.Mesh(
  new THREE.CylinderGeometry(2.2, 2.2, 0.1, 32),
  fountainWaterMat
);
fountainWater.position.y = 0.48;
portalGroup.add(fountainWater);

// Kolam air atas
const upperWater = new THREE.Mesh(
  new THREE.CylinderGeometry(1.05, 1.05, 0.1, 24),
  fountainWaterMat
);
upperWater.position.y = 2.0;
portalGroup.add(upperWater);

// Pancuran kristal & lentera taman
const fountainSpout = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.28),
  new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x06b6d4, emissiveIntensity: 1.2, roughness: 0.2 })
);
fountainSpout.position.y = 2.4;
portalGroup.add(fountainSpout);

portalSurface = fountainWater; // Kompatibilitas animasi loop

portalLight = new THREE.PointLight(0x38bdf8, 2.2, 14);
portalLight.position.set(0, 2.4, 0);
portalGroup.add(portalLight);

// 4 Bangku Taman Kayu di sekeliling Paviliun
const benchMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
for (let b = 0; b < 4; b++) {
  const angle = (b / 4) * Math.PI * 2 + Math.PI / 4;
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.45), benchMat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  bench.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.06), benchMat);
  back.position.set(0, 0.72, -0.2);
  back.castShadow = true;
  bench.add(back);
  bench.position.set(Math.cos(angle) * 4.2, 0, Math.sin(angle) * 4.2);
  bench.rotation.y = -angle + Math.PI / 2;
  portalGroup.add(bench);
}

scene.add(portalGroup);

let portalTime = 0;
let portalCooldown = 0;

// ==================== KAMP TENTARA ====================
// const CAMP = { cx: 42, cz: -12, w: 28, d: 24, entranceZ: -12, entranceWidth: 5 };
// const CAMP_X1 = CAMP.cx - CAMP.w / 2;
// const CAMP_X2 = CAMP.cx + CAMP.w / 2;
// const CAMP_Z1 = CAMP.cz - CAMP.d / 2;
// const CAMP_Z2 = CAMP.cz + CAMP.d / 2;

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
// const CAMP_PORTAL_POS = new THREE.Vector3(CAMP.cx - 6, 0, CAMP.cz);
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
campPortalRing = new THREE.Mesh(
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
campPortalAccent = new THREE.Mesh(
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
campPortalSurface = new THREE.Mesh(
  new THREE.CircleGeometry(1.5, 32),
  campPortalSurfaceMat
);
campPortalSurface.position.y = 2.4;
campPortalGroup.add(campPortalSurface);

// ---- Particles ----
// campPortalParticles exported
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
campPortalLight = new THREE.PointLight(0xaaff66, 3, 15);
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
// const ARENA = { cx: 30, cz: 22, w: 24, d: 24, entranceZ: 22, entranceWidth: 6 };
// const ARENA_X1 = ARENA.cx - ARENA.w / 2;
// const ARENA_X2 = ARENA.cx + ARENA.w / 2;
// const ARENA_Z1 = ARENA.cz - ARENA.d / 2;
// const ARENA_Z2 = ARENA.cz + ARENA.d / 2;

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
// const ARENA_PORTAL_POS = new THREE.Vector3(ARENA_X2 - 3.2, 0, ARENA.cz);
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
arenaPortalRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.22, 16, 48), arenaPortalRingMat);
arenaPortalRing.position.y = 2.4;
arenaPortalGroup.add(arenaPortalRing);

const arenaPortalAccentMat = new THREE.MeshStandardMaterial({
  color: 0xffaa00, emissive: 0xff5500, emissiveIntensity: 1.8, roughness: 0.3
});
arenaPortalAccent = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.07, 12, 48), arenaPortalAccentMat);
arenaPortalAccent.position.y = 2.4;
arenaPortalAccent.position.z = 0.12;
arenaPortalGroup.add(arenaPortalAccent);

const arenaPortalSurfaceMat = new THREE.MeshBasicMaterial({
  color: 0xff4444, transparent: true, opacity: 0.55, side: THREE.DoubleSide
});
arenaPortalSurface = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), arenaPortalSurfaceMat);
arenaPortalSurface.position.y = 2.4;
arenaPortalGroup.add(arenaPortalSurface);

// arenaPortalParticles exported
for (let i = 0; i < 24; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffaa44 }));
  const angle = (i / 24) * Math.PI * 2;
  p.position.set(Math.cos(angle) * 2.1, 2.4, Math.sin(angle) * 0.4);
  arenaPortalGroup.add(p);
  arenaPortalParticles.push({ mesh: p, angle });
}

arenaPortalLight = new THREE.PointLight(0xff4444, 3, 15);
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


// ==================== 🏆 PLAZA PRESTASI (HALL OF TROPHIES) ====================
const trophyPedestals = [];

function createTrophyPedestal(id, title, desc, icon, pos, unlocked, colorHex, accentHex) {
  const group = new THREE.Group();
  group.position.copy(pos);

  // Hexagonal Base Pillar
  const pillarMat = new THREE.MeshStandardMaterial({
    color: unlocked ? 0x1e293b : 0x0f172a,
    roughness: 0.5,
    metalness: 0.6
  });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 1.2, 6), pillarMat);
  pillar.position.y = 0.6;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  group.add(pillar);

  // Golden Trim Ring
  const trimMat = new THREE.MeshStandardMaterial({
    color: unlocked ? colorHex : 0x475569,
    emissive: unlocked ? colorHex : 0x1e293b,
    emissiveIntensity: unlocked ? 1.2 : 0.2,
    metalness: 0.8,
    roughness: 0.2
  });
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.08, 12, 24), trimMat);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 1.2;
  group.add(trim);

  // Floating Trophy Object
  const trophyGroup = new THREE.Group();
  trophyGroup.position.y = 1.85;

  let trophyMesh;
  if (id === 'fruit') {
    const appleMat = new THREE.MeshStandardMaterial({
      color: unlocked ? 0xfacc15 : 0x64748b,
      emissive: unlocked ? 0xf59e0b : 0x334155,
      emissiveIntensity: unlocked ? 1.4 : 0.1,
      roughness: 0.3,
      metalness: 0.7,
      transparent: !unlocked,
      opacity: unlocked ? 1.0 : 0.45
    });
    trophyMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38), appleMat);
    trophyGroup.add(trophyMesh);
  } else if (id === 'deadzone') {
    const skullMat = new THREE.MeshStandardMaterial({
      color: unlocked ? 0xef4444 : 0x64748b,
      emissive: unlocked ? 0xb91c1c : 0x334155,
      emissiveIntensity: unlocked ? 1.5 : 0.1,
      roughness: 0.4,
      metalness: 0.8,
      transparent: !unlocked,
      opacity: unlocked ? 1.0 : 0.45
    });
    trophyMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), skullMat);
    trophyGroup.add(trophyMesh);
  } else {
    const starMat = new THREE.MeshStandardMaterial({
      color: unlocked ? 0x38bdf8 : 0x64748b,
      emissive: unlocked ? 0x0284c7 : 0x334155,
      emissiveIntensity: unlocked ? 1.6 : 0.1,
      roughness: 0.3,
      metalness: 0.9,
      transparent: !unlocked,
      opacity: unlocked ? 1.0 : 0.45
    });
    trophyMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.40), starMat);
    trophyGroup.add(trophyMesh);
  }

  // Halo Orbit Ring
  const haloMat = new THREE.MeshBasicMaterial({
    color: unlocked ? accentHex : 0x334155,
    transparent: true,
    opacity: unlocked ? 0.85 : 0.25,
    side: THREE.DoubleSide
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.62, 32), haloMat);
  halo.rotation.x = Math.PI / 2;
  trophyGroup.add(halo);

  if (unlocked) {
    const light = new THREE.PointLight(colorHex, 2.0, 6);
    light.position.y = 1.9;
    group.add(light);
  }

  group.add(trophyGroup);
  scene.add(group);

  trophyPedestals.push({
    id,
    title,
    desc,
    icon,
    pos,
    unlocked,
    group,
    trophyGroup,
    halo
  });
}

// Inisialisasi Tiga Piala Prestasi berdasarkan data lokal
const hasFruitTrophy = localStorage.getItem('gamedev_meta_fruit_cleared') === '1' || parseInt(localStorage.getItem('gamedev_meta_fruit_score') || 0) >= 200;
const hasDeadZoneTrophy = localStorage.getItem('gamedev_meta_deadzone_cleared') === '1';
const hasArenaTrophy = localStorage.getItem('gamedev_meta_arena_champion') === '1';

createTrophyPedestal(
  'fruit',
  'Piala Kebun Kristal',
  'Telah menjelajahi seluruh area Kebun Bunga & Paviliun Air Mancur!',
  '🌸',
  new THREE.Vector3(-7.5, 0, 2.5),
  true,
  0x10b981,
  0x34d399
);

createTrophyPedestal(
  'deadzone',
  'Lencana Penyintas Dead Zone',
  'Berhasil bertahan dari 3 gelombang zombie di Dead Zone!',
  '💀',
  new THREE.Vector3(-11.0, 0, 2.5),
  hasDeadZoneTrophy,
  0xef4444,
  0xf97316
);

createTrophyPedestal(
  'arena',
  'Sabuk Juara Arena Zero',
  'Berhasil mengalahkan robot tempur Vorax dalam duel maut!',
  '⚔️',
  new THREE.Vector3(-9.2, 0, 0.5),
  hasArenaTrophy,
  0x38bdf8,
  0x6366f1
);

// ==================== 🏛️ PAPAN PRESTASI KIOSK (CENTRAL PLAZA) ====================
kioskGroup = new THREE.Group();
kioskGroup.position.set(3.2, 0, 4.5);

const kioskBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 0.85, 1.0, 8),
  new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
);
kioskBase.position.y = 0.5;
kioskBase.castShadow = true;
kioskGroup.add(kioskBase);

const kioskScreen = new THREE.Mesh(
  new THREE.BoxGeometry(1.0, 0.65, 0.08),
  new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 0.9 })
);
kioskScreen.position.set(0, 1.25, 0);
kioskScreen.rotation.x = -Math.PI / 6;
kioskGroup.add(kioskScreen);

const kioskLight = new THREE.PointLight(0x38bdf8, 1.8, 6);
kioskLight.position.set(0, 1.6, 0);
kioskGroup.add(kioskLight);
scene.add(kioskGroup);

let isNearKiosk = false;
const kioskModal = document.getElementById('kioskModal');
const kioskBody = document.getElementById('kioskBody');
const btnKioskClose = document.getElementById('btnKioskClose');
const btnKioskOk = document.getElementById('btnKioskOk');





}

let portalTime = 0;
let campPortalTime = 0;
let arenaPortalTime = 0;

export function updateZones(delta, elapsedTime) {
  portalTime += delta;
  if (portalSurface && portalLight) {
    portalSurface.material.opacity = 0.45 + Math.sin(portalTime * 3) * 0.2;
    portalLight.intensity = 2.5 + Math.sin(portalTime * 4) * 0.8;
    portalParticles.forEach((p, i) => {
      const a = p.angle + portalTime * 1.5;
      p.mesh.position.x = Math.cos(a) * 2.1;
      p.mesh.position.z = Math.sin(a) * 0.4;
      p.mesh.position.y = 2.4 + Math.sin(a * 2 + i) * 0.4;
    });
  }

  campPortalTime += delta;
  if (campPortalRing && campPortalAccent && campPortalSurface && campPortalLight) {
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
  }

  arenaPortalTime += delta;
  if (arenaPortalRing && arenaPortalAccent && arenaPortalSurface && arenaPortalLight) {
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
  }

  
}
