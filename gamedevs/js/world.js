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
  // 1. Tabrakan Dinding Kotak & Fasilitas Internal
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

  // 2. Tabrakan Pagar Keliling Dunia (Perimeter Boundary Clamp - Anti Tembus & Anti Bug)
  // Radius pagar dunia adalah WORLD_RADIUS (60m).
  // Dengan tebal pilar/pagar ~0.5m dan radius player = 0.5m, batas aman terjauh
  // yang bisa dicapai pusat player adalah R_max = WORLD_RADIUS - 0.75m (59.25m).
  const distFromCenter = Math.hypot(pos.x, pos.z);
  const maxSafeRadius = WORLD_RADIUS - 0.75;
  if (distFromCenter > maxSafeRadius) {
    const clampRatio = maxSafeRadius / distFromCenter;
    pos.x *= clampRatio;
    pos.z *= clampRatio;
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

// ==================== PAGAR MEWAH PEMBATAS DUNIA (ESTATE PERIMETER FENCE) ====================
export function createBoundaryFence(scene) {
  const fenceGroup = new THREE.Group();
  fenceGroup.name = 'boundaryFenceGroup';

  // Material Mewah & Realistis
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d271d, // Kayu Jati Tua Berkelas
    roughness: 0.72,
    metalness: 0.08
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x546e7a, // Batu Andesit Kokoh
    roughness: 0.85,
    flatShading: true
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x212124, // Besi Tempa Hitam Antik
    roughness: 0.5,
    metalness: 0.8
  });
  const lanternGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.35,
    metalness: 0.75
  });
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfff9db,
    emissive: 0xffb703,
    emissiveIntensity: 1.4,
    roughness: 0.2
  });

  const numSegments = 96;
  const radius = WORLD_RADIUS; // 60 meter

  // Geometri yang dapat digunakan kembali secara efisien
  const pedestalGeo = new THREE.BoxGeometry(0.52, 0.55, 0.52);
  const postBodyGeo = new THREE.BoxGeometry(0.34, 2.1, 0.34);
  const postCapGeo = new THREE.ConeGeometry(0.32, 0.35, 4);

  const topRailGeo = new THREE.BoxGeometry(0.12, 0.12, 1);
  const midRailGeo = new THREE.BoxGeometry(0.10, 0.10, 1);
  const bottomRailGeo = new THREE.BoxGeometry(0.14, 0.14, 1);

  const picketBodyGeo = new THREE.BoxGeometry(0.085, 1.75, 0.085);
  const picketTipGeo = new THREE.ConeGeometry(0.08, 0.24, 4);

  const lanternArmGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6);
  const lanternCapGeo = new THREE.ConeGeometry(0.24, 0.18, 6);
  const lanternGlassGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.32, 6);

  for (let i = 0; i < numSegments; i++) {
    const theta1 = (i / numSegments) * Math.PI * 2;
    const theta2 = ((i + 1) / numSegments) * Math.PI * 2;

    const x1 = Math.cos(theta1) * radius;
    const z1 = Math.sin(theta1) * radius;
    const x2 = Math.cos(theta2) * radius;
    const z2 = Math.sin(theta2) * radius;

    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const panelWidth = Math.hypot(x2 - x1, z2 - z1);
    const panelAngle = Math.atan2(x2 - x1, z2 - z1);

    // 1. Tiang Pilar Utama pada Titik (x1, z1)
    const postGroup = new THREE.Group();
    postGroup.position.set(x1, 0, z1);

    // Pondasi Batu Andesit
    const pedestal = new THREE.Mesh(pedestalGeo, stoneMat);
    pedestal.position.y = 0.275;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    postGroup.add(pedestal);

    // Badan Tiang Kayu Jati
    const postBody = new THREE.Mesh(postBodyGeo, woodMat);
    postBody.position.y = 1.35;
    postBody.castShadow = true;
    postBody.receiveShadow = true;
    postGroup.add(postBody);

    // Mahkota Piramida Besi Tempa
    const postCap = new THREE.Mesh(postCapGeo, ironMat);
    postCap.rotation.y = Math.PI / 4;
    postCap.position.y = 2.52;
    postCap.castShadow = true;
    postGroup.add(postCap);

    // Lentera Antik di setiap 6 pilar (Total 16 lentera estetik di sekeliling batas dunia)
    if (i % 6 === 0) {
      const lanternGroup = new THREE.Group();
      lanternGroup.position.y = 2.45;

      const arm = new THREE.Mesh(lanternArmGeo, ironMat);
      arm.rotation.z = Math.PI / 6;
      arm.position.set(0.15, 0.2, 0);
      lanternGroup.add(arm);

      const lampTop = new THREE.Mesh(lanternCapGeo, lanternGoldMat);
      lampTop.position.set(0.28, 0.45, 0);
      lampTop.castShadow = true;
      lanternGroup.add(lampTop);

      const lampGlass = new THREE.Mesh(lanternGlassGeo, lanternGlassMat);
      lampGlass.position.set(0.28, 0.25, 0);
      lanternGroup.add(lampGlass);

      const light = new THREE.PointLight(0xffb74d, 1.2, 12, 1.5);
      light.position.set(0.28, 0.25, 0);
      lanternGroup.add(light);

      postGroup.add(lanternGroup);
    }

    fenceGroup.add(postGroup);

    // 2. Panel Pagar (Palang Rel & Jeruji Tegak Runcing)
    const panelGroup = new THREE.Group();
    panelGroup.position.set(midX, 0, midZ);
    panelGroup.rotation.y = panelAngle;

    // Palang Rel Atas
    const topRail = new THREE.Mesh(topRailGeo, woodMat);
    topRail.scale.z = panelWidth;
    topRail.position.y = 2.05;
    topRail.castShadow = true;
    topRail.receiveShadow = true;
    panelGroup.add(topRail);

    // Palang Rel Tengah
    const midRail = new THREE.Mesh(midRailGeo, woodMat);
    midRail.scale.z = panelWidth;
    midRail.position.y = 1.15;
    midRail.castShadow = true;
    midRail.receiveShadow = true;
    panelGroup.add(midRail);

    // Palang Rel Bawah
    const bottomRail = new THREE.Mesh(bottomRailGeo, woodMat);
    bottomRail.scale.z = panelWidth;
    bottomRail.position.y = 0.32;
    bottomRail.castShadow = true;
    bottomRail.receiveShadow = true;
    panelGroup.add(bottomRail);

    // Jeruji Vertikal (7 Jeruji per panel dengan ujung tombak lancip)
    const numPickets = 7;
    for (let p = 1; p <= numPickets; p++) {
      const offsetZ = ((p / (numPickets + 1)) - 0.5) * panelWidth;

      const picketBody = new THREE.Mesh(picketBodyGeo, woodMat);
      picketBody.position.set(0, 1.15, offsetZ);
      picketBody.castShadow = true;
      picketBody.receiveShadow = true;
      panelGroup.add(picketBody);

      const picketTip = new THREE.Mesh(picketTipGeo, ironMat);
      picketTip.rotation.y = Math.PI / 4;
      picketTip.position.set(0, 2.13, offsetZ);
      picketTip.castShadow = true;
      panelGroup.add(picketTip);
    }

    // Aksen Silang Klasik (X-Brace) di antara rel tengah dan bawah
    const braceLen = Math.hypot(panelWidth / 2, 0.83);
    const braceAng = Math.atan2(0.83, panelWidth / 2);
    const braceGeo = new THREE.BoxGeometry(0.04, 0.08, braceLen);

    const brace1 = new THREE.Mesh(braceGeo, woodMat);
    brace1.position.set(0.03, 0.73, -panelWidth / 4);
    brace1.rotation.x = braceAng;
    panelGroup.add(brace1);

    const brace2 = new THREE.Mesh(braceGeo, woodMat);
    brace2.position.set(0.03, 0.73, -panelWidth / 4);
    brace2.rotation.x = -braceAng;
    panelGroup.add(brace2);

    const brace3 = new THREE.Mesh(braceGeo, woodMat);
    brace3.position.set(0.03, 0.73, panelWidth / 4);
    brace3.rotation.x = braceAng;
    panelGroup.add(brace3);

    const brace4 = new THREE.Mesh(braceGeo, woodMat);
    brace4.position.set(0.03, 0.73, panelWidth / 4);
    brace4.rotation.x = -braceAng;
    panelGroup.add(brace4);

    fenceGroup.add(panelGroup);

    // Daftarkan ke sistem tabrakan kotak juga untuk redundansi proteksi
    addWallSegment(x1, z1, x2, z2);
  }

  scene.add(fenceGroup);
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

  // 10. Pagar Mewah Pembatas Lingkar Dunia (Estate Perimeter Fence - Bebas Bug & Anti Tembus)
  createBoundaryFence(scene);

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
