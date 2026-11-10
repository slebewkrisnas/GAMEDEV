import * as THREE from 'three';

// ==================== KONFIGURASI DUNIA ====================
export const WORLD_RADIUS = 60;
export const MAP_SIZE = 200;
export const SPAWN_DISTANCE = WORLD_RADIUS - 5;
export const SPAWN_ANGLE = Math.PI / 2;
export const SPAWN_POS = new THREE.Vector3(
  Math.cos(SPAWN_ANGLE) * SPAWN_DISTANCE,
  0,
  Math.sin(SPAWN_ANGLE) * SPAWN_DISTANCE
);

// ==================== COLLISION SYSTEM ====================
export const collisionWalls = [];
export const PLAYER_RADIUS = 0.5;
export const WALL_THICKNESS = 0.3;

export function addWallSegment(x1, z1, x2, z2) {
  collisionWalls.push({
    minX: Math.min(x1, x2) - WALL_THICKNESS / 2,
    maxX: Math.max(x1, x2) + WALL_THICKNESS / 2,
    minZ: Math.min(z1, z2) - WALL_THICKNESS / 2,
    maxZ: Math.max(z1, z2) + WALL_THICKNESS / 2
  });
}

export function resolveWallCollisions(pos) {
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

// ==================== UTIL JALAN RAPI & BERSIH ====================
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

    // Lebar jalan lurus, rata, dan rapi tanpa lekukan bergelombang
    const w = halfW;

    const left  = p.clone().addScaledVector(perp, w);
    const right = p.clone().addScaledVector(perp, -w);

    positions.push(left.x, yOffset, left.z);
    positions.push(right.x, yOffset, right.z);

    uvs.push(0, t * 12);
    uvs.push(1, t * 12);
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

function createPath(scene, curve, segments = 200) {
  // 1. Tepi Jalan / Curb Batu Rapih (Border)
  const curbGeo = createRibbonGeometry(curve, 3.2, segments, 0.02);
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x3d352c,
    roughness: 0.95,
    metalness: 0.05
  });
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.receiveShadow = true;
  scene.add(curb);

  // 2. Jalur Utama Paving / Cobblestone Mewah
  const mainGeo = createRibbonGeometry(curve, 2.7, segments, 0.028);
  const mainMat = new THREE.MeshStandardMaterial({
    color: 0xba9b72,
    roughness: 0.88,
    metalness: 0.05
  });
  const main = new THREE.Mesh(mainGeo, mainMat);
  main.receiveShadow = true;
  scene.add(main);

  // 3. Garis Aksen Tengah Marmer Halus
  const centerGeo = createRibbonGeometry(curve, 0.45, segments, 0.034);
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xd9c5a0,
    roughness: 0.82
  });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.receiveShadow = true;
  scene.add(center);
}

// ==================== LENTERA JALAN ESTETIK & RAPI ====================
function scatterDetailsAlongPath(scene, curve, lanternCount = 8) {
  const lanternPostMat = new THREE.MeshStandardMaterial({ color: 0x3e352b, roughness: 0.9 });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff0aa,
    emissive: 0xffb800,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });

  for (let i = 0; i < lanternCount; i++) {
    const t = (i + 0.5) / lanternCount;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Pasang lentera batu rapi di kedua sisi jalan (bukan di tengah jalan)
    [-2.1, 2.1].forEach(side => {
      const g = new THREE.Group();
      g.position.set(p.x + perp.x * side, 0, p.z + perp.z * side);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.4, 8), lanternPostMat);
      base.position.y = 0.2;
      base.castShadow = true;
      g.add(base);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 8), lanternPostMat);
      pillar.position.y = 0.95;
      pillar.castShadow = true;
      g.add(pillar);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), lanternGlowMat);
      lamp.position.y = 1.65;
      g.add(lamp);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.22, 8), lanternPostMat);
      cap.position.y = 1.85;
      g.add(cap);

      scene.add(g);
    });
  }

  const grassCount = Math.floor(lanternCount * 2);
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

// ==================== DINDING BATUAN PEMBATAS ====================
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

function createBoundaryRock(scene, x, z, scale = 1) {
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

// ==================== FUNGSI UTAMA PEMBANGUNAN DUNIA ====================
export function createWorld(scene) {
  // Ground
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

  // 1. Boulevard Utama (North - South): Dari Spawn (0, 52) melalui Central Plaza (0, 5) hingga Monumen Logo (0, -15)
  const pathPoints = [
    new THREE.Vector3(0, 0.02, 52),
    new THREE.Vector3(0, 0.02, 38),
    new THREE.Vector3(0, 0.02, 22),
    new THREE.Vector3(0, 0.02, 5),
    new THREE.Vector3(0, 0.02, -5),
    new THREE.Vector3(0, 0.02, -15)
  ];
  const pathCurve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.1);
  createPath(scene, pathCurve, 240);

  // 2. Avenue Barat (Taman Asri & Paviliun Air Mancur) - Lurus Sempurna di Z = 22
  const branchLeftPoints = [
    new THREE.Vector3(0, 0.02, 22),
    new THREE.Vector3(-12, 0.02, 22),
    new THREE.Vector3(-26, 0.02, 22)
  ];
  const branchLeftCurve = new THREE.CatmullRomCurve3(branchLeftPoints, false, 'catmullrom', 0.1);
  createPath(scene, branchLeftCurve, 120);

  // 3. Avenue Timur Utara (Battle Arena Zero) - Lurus Sempurna di Z = 22
  const branchArenaPoints = [
    new THREE.Vector3(0, 0.02, 22),
    new THREE.Vector3(12, 0.02, 22),
    new THREE.Vector3(24, 0.02, 22)
  ];
  const branchArenaCurve = new THREE.CatmullRomCurve3(branchArenaPoints, false, 'catmullrom', 0.1);
  createPath(scene, branchArenaCurve, 120);

  // 4. Avenue Timur Selatan (Kamp Militer Dead Zone) - Koridor Rapih ke Kamp
  const branchCampPoints = [
    new THREE.Vector3(0, 0.02, 5),
    new THREE.Vector3(12, 0.02, -3),
    new THREE.Vector3(26, 0.02, -12)
  ];
  const branchCampCurve = new THREE.CatmullRomCurve3(branchCampPoints, false, 'catmullrom', 0.2);
  createPath(scene, branchCampCurve, 120);

  // 5. Central Plaza Junction di (0, 0.02, 5)
  const junctionBorder = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 36),
    new THREE.MeshStandardMaterial({ color: 0x3d352c, roughness: 0.95 })
  );
  junctionBorder.rotation.x = -Math.PI / 2;
  junctionBorder.position.set(0, 0.021, 5);
  junctionBorder.receiveShadow = true;
  scene.add(junctionBorder);

  const junctionMain = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 36),
    new THREE.MeshStandardMaterial({ color: 0xba9b72, roughness: 0.88, metalness: 0.05 })
  );
  junctionMain.rotation.x = -Math.PI / 2;
  junctionMain.position.set(0, 0.027, 5);
  junctionMain.receiveShadow = true;
  scene.add(junctionMain);

  const junctionCenter = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 36),
    new THREE.MeshStandardMaterial({ color: 0xd9c5a0, roughness: 0.82 })
  );
  junctionCenter.rotation.x = -Math.PI / 2;
  junctionCenter.position.set(0, 0.033, 5);
  junctionCenter.receiveShadow = true;
  scene.add(junctionCenter);

  // Pasang lentera jalan estetik & seragam di sepanjang tepi jalan
  scatterDetailsAlongPath(scene, pathCurve, 8);
  scatterDetailsAlongPath(scene, branchLeftCurve, 4);
  scatterDetailsAlongPath(scene, branchArenaCurve, 4);
  scatterDetailsAlongPath(scene, branchCampCurve, 4);

  // 10. Batuan Pembatas Lingkar Dunia
  const boundarySegments = 60;
  for (let i = 0; i < boundarySegments; i++) {
    const angle = (i / boundarySegments) * Math.PI * 2;
    const radiusVar = WORLD_RADIUS + (Math.random() - 0.5) * 2;
    const x = Math.cos(angle) * radiusVar;
    const z = Math.sin(angle) * radiusVar;
    const scale = 1 + Math.random() * 0.6;
    const distToSpawn = Math.sqrt((x - SPAWN_POS.x) ** 2 + (z - SPAWN_POS.z) ** 2);
    if (distToSpawn < 4) continue;
    createBoundaryRock(scene, x, z, scale);
  }

  // 11. Awan di Langit
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
}
