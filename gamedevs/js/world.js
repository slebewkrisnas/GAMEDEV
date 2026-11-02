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

// ==================== UTIL JALAN ====================
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

function createPath(scene, curve, segments = 200) {
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

// ==================== MATERIAL & DETAIL JALAN ====================
const pebbleMats = [
  new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.95, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x7a7a70, roughness: 0.95, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0xaa9a80, roughness: 0.95, flatShading: true })
];

function scatterDetailsAlongPath(scene, curve, pebbleCount, grassCount) {
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

  // 1. Jalan Utama dari Spawn ke Central Plaza (z = 5)
  const pathPoints = [
    new THREE.Vector3(SPAWN_POS.x, 0.02, SPAWN_POS.z),
    new THREE.Vector3(SPAWN_POS.x + 8, 0.02, 42),
    new THREE.Vector3(SPAWN_POS.x - 6, 0.02, 28),
    new THREE.Vector3(0, 0.02, 16),
    new THREE.Vector3(0, 0.02, 5)
  ];
  const pathCurve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
  createPath(scene, pathCurve, 200);

  // 2. Cabang Kiri (Perkebunan)
  const branchLeftStart = pathCurve.getPoint(0.35);
  const branchLeftPoints = [
    new THREE.Vector3(branchLeftStart.x, 0.02, branchLeftStart.z),
    new THREE.Vector3(-14, 0.02, branchLeftStart.z - 2),
    new THREE.Vector3(-20, 0.02, 22),
    new THREE.Vector3(-25, 0.02, 22)
  ];
  const branchLeftCurve = new THREE.CatmullRomCurve3(branchLeftPoints, false, 'catmullrom', 0.5);
  createPath(scene, branchLeftCurve, 120);

  // 3. Cabang Kanan (Kamp Tentara)
  const branchRightStart = pathCurve.getPoint(0.62);
  const branchRightPoints = [
    new THREE.Vector3(branchRightStart.x, 0.02, branchRightStart.z),
    new THREE.Vector3(14, 0.02, branchRightStart.z - 3),
    new THREE.Vector3(22, 0.02, -12),
    new THREE.Vector3(25, 0.02, -12)
  ];
  const branchRightCurve = new THREE.CatmullRomCurve3(branchRightPoints, false, 'catmullrom', 0.5);
  createPath(scene, branchRightCurve, 120);

  // 4. Cabang Kanan Bawah (Battle Arena)
  const branchArenaStart = pathCurve.getPoint(0.32);
  const branchArenaPoints = [
    new THREE.Vector3(branchArenaStart.x, 0.02, branchArenaStart.z),
    new THREE.Vector3(8, 0.02, 26),
    new THREE.Vector3(14, 0.02, 22),
    new THREE.Vector3(18, 0.02, 22)
  ];
  const branchArenaCurve = new THREE.CatmullRomCurve3(branchArenaPoints, false, 'catmullrom', 0.5);
  createPath(scene, branchArenaCurve, 120);

  // 5. Central Plaza Junction di (0, 0.02, 5)
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

  // 6. Pelataran Batu Melingkar untuk Patung GameDev 25 (-14, 5)
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

  // 7. Boulevard ke Patung Logo
  const roadToLogoPoints = [
    new THREE.Vector3(0, 0.02, 5),
    new THREE.Vector3(0, 0.02, -5),
    new THREE.Vector3(0, 0.02, -14.6)
  ];
  const roadToLogoCurve = new THREE.CatmullRomCurve3(roadToLogoPoints, false, 'catmullrom', 0.5);
  createPath(scene, roadToLogoCurve, 60);

  // 8. Penghubung ke Patung GameDev
  const roadToGameDevPoints = [
    new THREE.Vector3(0, 0.02, 5),
    new THREE.Vector3(-3.5, 0.02, 5),
    new THREE.Vector3(-6.2, 0.02, 5)
  ];
  const roadToGameDevCurve = new THREE.CatmullRomCurve3(roadToGameDevPoints, false, 'catmullrom', 0.5);
  createPath(scene, roadToGameDevCurve, 40);

  // 9. Walkway GameDev ke Logo
  const walkwayGameDevToLogoPoints = [
    new THREE.Vector3(-10, 0.02, 1),
    new THREE.Vector3(-8, 0.02, -6),
    new THREE.Vector3(-4.5, 0.02, -15.2)
  ];
  const walkwayGameDevToLogoCurve = new THREE.CatmullRomCurve3(walkwayGameDevToLogoPoints, false, 'catmullrom', 0.5);
  createPath(scene, walkwayGameDevToLogoCurve, 50);

  // Scatter detail kerikil & rumput di sepanjang jalan
  scatterDetailsAlongPath(scene, pathCurve, 60, 40);
  scatterDetailsAlongPath(scene, branchLeftCurve, 30, 20);
  scatterDetailsAlongPath(scene, branchRightCurve, 30, 20);
  scatterDetailsAlongPath(scene, branchArenaCurve, 30, 20);
  scatterDetailsAlongPath(scene, roadToLogoCurve, 25, 15);
  scatterDetailsAlongPath(scene, roadToGameDevCurve, 15, 10);
  scatterDetailsAlongPath(scene, walkwayGameDevToLogoCurve, 20, 12);

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
