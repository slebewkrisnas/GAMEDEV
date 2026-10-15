// ============================================================================
// DEAD ZONE — CITY ENVIRONMENT & COLLISION SYSTEM
// Creates an atmospheric abandoned ruined city with buildings, cars, lights,
// and manages all collision bounding boxes for player and AI.
// ============================================================================

import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Array of THREE.Box3 bounding boxes for collision
    this.obstacleMeshes = []; // Meshes for bullet raycast occlusion
    this.streetLights = []; // Street light sources for flickering effect
    this.arenaSize = 80; // Arena is 80x80 (-40 to +40)
    this.arenaBounds = {
      minX: -38,
      maxX: 38,
      minZ: -38,
      maxZ: 38
    };

    this.init();
  }

  init() {
    this.createGround();
    this.createPerimeterWalls();
    this.createBuildings();
    this.createAbandonedVehicles();
    this.createStreetFurniture();
    this.createStreetLights();
  }

  // Procedural asphalt texture with road markings
  createGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark gritty asphalt base
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, 512, 512);

    // Procedural asphalt noise & cracks
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(15 + Math.random() * 25);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Road markings (worn yellow and white lines)
    ctx.strokeStyle = 'rgba(180, 160, 40, 0.4)';
    ctx.lineWidth = 8;
    ctx.setLineDash([24, 20]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);

    const groundGeo = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // Tall concrete boundary walls to keep player & zombies enclosed
  createPerimeterWalls() {
    const wallHeight = 8;
    const wallThick = 2;
    const size = this.arenaSize;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1f2428,
      roughness: 0.95,
      metalness: 0.1
    });

    const wallsData = [
      // North Wall
      { x: 0, z: -size / 2, w: size, d: wallThick },
      // South Wall
      { x: 0, z: size / 2, w: size, d: wallThick },
      // East Wall
      { x: size / 2, z: 0, w: wallThick, d: size },
      // West Wall
      { x: -size / 2, z: 0, w: wallThick, d: size }
    ];

    wallsData.forEach(w => {
      const geo = new THREE.BoxGeometry(w.w, wallHeight, w.d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(w.x, wallHeight / 2, w.z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      mesh.userData = { isObstacle: true };
      this.scene.add(mesh);
      this.obstacleMeshes.push(mesh);

      // Register collision box
      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
    });
  }

  // Generates abandoned city buildings with window patterns
  createBuildings() {
    // Generate procedural window texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Concrete background
    ctx.fillStyle = '#22252a';
    ctx.fillRect(0, 0, 256, 256);

    // Dark/broken windows grid
    const cols = 4;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 16 + c * 58;
        const y = 16 + r * 58;
        // Randomly lit or shattered dark window
        const isDim = Math.random() > 0.85;
        ctx.fillStyle = isDim ? 'rgba(240, 180, 80, 0.25)' : '#0d1014';
        ctx.fillRect(x, y, 42, 42);
        ctx.strokeStyle = '#111317';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 42, 42);
      }
    }

    const buildingTex = new THREE.CanvasTexture(canvas);
    buildingTex.wrapS = THREE.RepeatWrapping;
    buildingTex.wrapT = THREE.RepeatWrapping;

    const buildingMat = new THREE.MeshStandardMaterial({
      map: buildingTex,
      roughness: 0.85,
      metalness: 0.15
    });

    // Preset positions for city block layout leaving clear streets and plaza
    const buildingsConfig = [
      // Northwest block
      { x: -22, z: -22, w: 14, h: 22, d: 14 },
      // Northeast block
      { x: 22, z: -22, w: 14, h: 26, d: 14 },
      // Southwest block
      { x: -22, z: 22, w: 14, h: 18, d: 14 },
      // Southeast block
      { x: 22, z: 22, w: 14, h: 24, d: 14 },
      // Far North building
      { x: 0, z: -32, w: 16, h: 16, d: 8 },
      // Far South building
      { x: 0, z: 32, w: 16, h: 20, d: 8 },
      // Far West warehouse
      { x: -32, z: 0, w: 8, h: 14, d: 16 },
      // Far East office
      { x: 32, z: 0, w: 8, h: 18, d: 16 }
    ];

    buildingsConfig.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      // Adjust texture repeat to match proportions
      const mat = buildingMat.clone();
      mat.map = buildingTex.clone();
      mat.map.repeat.set(b.w / 4, b.h / 4);
      mat.map.needsUpdate = true;

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { isObstacle: true };
      this.scene.add(mesh);
      this.obstacleMeshes.push(mesh);

      // Register collider
      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
    });
  }

  // Abandoned rusted vehicles scattered on roads
  createAbandonedVehicles() {
    const cars = [
      { x: -8, z: -10, rot: 0.35, color: 0x3d434d },
      { x: 12, z: 8, rot: -0.6, color: 0x5a2d2d },
      { x: -14, z: 6, rot: 1.2, color: 0x2d443b },
      { x: 8, z: -16, rot: 2.1, color: 0x4a4332 }
    ];

    cars.forEach(car => {
      const carGroup = new THREE.Group();

      // Body chassis
      const bodyGeo = new THREE.BoxGeometry(2.2, 0.9, 4.4);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: car.color,
        roughness: 0.7,
        metalness: 0.4
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / windshield
      const cabinGeo = new THREE.BoxGeometry(1.8, 0.75, 2.2);
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x11161b,
        roughness: 0.3,
        metalness: 0.8
      });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.45, -0.3);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      wheelGeo.rotateZ(Math.PI / 2);

      const wheelPositions = [
        [-1.1, 0.4, 1.3],
        [1.1, 0.4, 1.3],
        [-1.1, 0.4, -1.3],
        [1.1, 0.4, -1.3]
      ];

      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
      });

      carGroup.position.set(car.x, 0, car.z);
      carGroup.rotation.y = car.rot;
      this.scene.add(carGroup);

      body.userData = { isObstacle: true };
      cabin.userData = { isObstacle: true };
      this.obstacleMeshes.push(body, cabin);

      // Register bounding box
      const box = new THREE.Box3().setFromObject(carGroup);
      this.colliders.push(box);
    });
  }

  // Concrete barricades and dumpsters
  createStreetFurniture() {
    const barricadeMat = new THREE.MeshStandardMaterial({
      color: 0x555860,
      roughness: 0.9
    });

    const barricades = [
      { x: -5, z: 2, rot: 0.2 },
      { x: 5, z: -2, rot: -0.4 },
      { x: -2, z: -8, rot: 1.57 },
      { x: 3, z: 10, rot: 1.3 }
    ];

    barricades.forEach(b => {
      const geo = new THREE.BoxGeometry(2.4, 0.9, 0.6);
      const mesh = new THREE.Mesh(geo, barricadeMat);
      mesh.position.set(b.x, 0.45, b.z);
      mesh.rotation.y = b.rot;
      mesh.castShadow = true;
      mesh.userData = { isObstacle: true };
      this.scene.add(mesh);
      this.obstacleMeshes.push(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
    });
  }

  // Street lamps with powerful illumination across roads and intersections
  createStreetLights() {
    const lampPositions = [
      { x: -12, z: -12 },
      { x: 12, z: -12 },
      { x: -12, z: 12 },
      { x: 12, z: 12 },
      { x: -22, z: 0 },
      { x: 22, z: 0 },
      { x: 0, z: -22 },
      { x: 0, z: 22 }
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333b45, roughness: 0.8 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });

    lampPositions.forEach((pos, idx) => {
      const lampGroup = new THREE.Group();

      // Vertical pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 3;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Horizontal arm
      const armGeo = new THREE.BoxGeometry(0.1, 0.1, 1.2);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(0, 5.9, 0.5);
      lampGroup.add(arm);

      // Lamp bulb
      const bulbGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, 5.75, 1.0);
      lampGroup.add(bulb);

      // Light source (high intensity warm streetlight)
      const light = new THREE.PointLight(0xfffae0, 3.2, 30, 1.3);
      light.position.set(0, 5.6, 1.0);
      light.castShadow = true;
      light.shadow.bias = -0.002;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      lampGroup.add(light);

      lampGroup.position.set(pos.x, 0, pos.z);
      this.scene.add(lampGroup);

      // Keep track for flickering
      this.streetLights.push({
        light: light,
        baseIntensity: 3.2,
        nextFlicker: Math.random() * 4 + 2,
        bulbMat: bulbMat
      });
    });
  }

  // Update street light flicker effect
  update(delta) {
    this.streetLights.forEach(sl => {
      sl.nextFlicker -= delta;
      if (sl.nextFlicker <= 0) {
        // Quick flicker
        const flicker = Math.random() > 0.4 ? 1.0 : (Math.random() * 0.3);
        sl.light.intensity = sl.baseIntensity * flicker;
        sl.nextFlicker = Math.random() * 4 + 0.5;
      }
    });
  }

  // Check if a point (x, z) with given radius and feet height collides with any building, vehicle, or boundary
  checkCollision(x, z, radius = 0.5, feetY = 0) {
    // 1. Arena boundary check
    if (
      x - radius < this.arenaBounds.minX ||
      x + radius > this.arenaBounds.maxX ||
      z - radius < this.arenaBounds.minZ ||
      z + radius > this.arenaBounds.maxZ
    ) {
      return true;
    }

    // 2. Obstacle box collision check
    const minX = x - radius;
    const maxX = x + radius;
    const minZ = z - radius;
    const maxZ = z + radius;

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i];

      // If player's feet are higher than the top of the obstacle, allow clearing it
      if (feetY >= box.max.y - 0.1) {
        continue;
      }

      // AABB overlap check on X and Z planes
      if (
        maxX > box.min.x &&
        minX < box.max.x &&
        maxZ > box.min.z &&
        minZ < box.max.z
      ) {
        return true;
      }
    }

    return false;
  }
}
