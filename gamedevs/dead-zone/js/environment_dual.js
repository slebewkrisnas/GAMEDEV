// ============================================================================
// SCI-FI DUAL-ZONE ENVIRONMENT ENGINE
// Zone 1: "Neo-Haven" (Safe Zone) — High-tech colony under an energy dome
// Zone 2: "Sector-7" (Danger Zone) — Alien desert wasteland with glowing crystals
// ============================================================================

import * as THREE from 'three';
import { VillageArchitect } from './village_architect.js';

export class EnvironmentDual {
  constructor(scene) {
    this.scene = scene;
    this.activeZone = 'safe_zone'; // 'safe_zone' | 'sector_7'

    this.safeZoneGroup = new THREE.Group();
    this.sector7Group = new THREE.Group();

    this.safeZoneColliders = [];
    this.sector7Colliders = [];

    this.safeZoneInteractables = [];
    this.sector7Interactables = [];

    // Obstacle meshes for bullet raycast occlusion & line-of-sight
    this.obstacleMeshes = [];

    // Abandoned cabin footprints in Sector-7
    this.cabinSites = [
      { x: -45, z: -25 },
      { x: 55, z: -15 },
      { x: -35, z: 50 },
      { x: 45, z: 65 }
    ];

    // Lighting groups
    this.safeZoneLights = new THREE.Group();
    this.sector7Lights = new THREE.Group();

    // Animated objects (crystals, beacons, dome)
    this.animatedObjects = [];

    this.safeZoneBounds = {
      minX: -45,
      maxX: 45,
      minZ: -45,
      maxZ: 45
    };

    // Expanded Map 2: 230m x 230m dense forest
    this.sector7Bounds = {
      minX: -115,
      maxX: 115,
      minZ: -115,
      maxZ: 115
    };

    this.init();
  }

  get arenaBounds() {
    return this.activeZone === 'safe_zone' ? this.safeZoneBounds : this.sector7Bounds;
  }

  init() {
    this.scene.add(this.safeZoneGroup);
    this.scene.add(this.sector7Group);
    this.scene.add(this.safeZoneLights);
    this.scene.add(this.sector7Lights);

    this.buildSafeZone();
    this.buildSector7();

    // Default to Safe Zone initially
    this.setZoneActive('safe_zone');
  }

  // Menunggu seluruh aset 3D di lingkungan safe zone / desa siap
  async whenReady() {
    if (this.villageArchitect && typeof this.villageArchitect.whenLoaded === 'function') {
      await this.villageArchitect.whenLoaded();
    }
  }

  // --------------------------------------------------------------------------
  // PROCEDURAL TEXTURE GENERATORS
  // --------------------------------------------------------------------------
  createVillageGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich meadow green base
    ctx.fillStyle = '#3a752b';
    ctx.fillRect(0, 0, 512, 512);

    // Grass blades & clover variance
    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const roll = Math.random();
      if (roll < 0.6) {
        ctx.fillStyle = `rgb(${Math.floor(50 + Math.random() * 30)}, ${Math.floor(115 + Math.random() * 35)}, ${Math.floor(35 + Math.random() * 25)})`;
      } else {
        ctx.fillStyle = `rgb(${Math.floor(35 + Math.random() * 20)}, ${Math.floor(85 + Math.random() * 25)}, ${Math.floor(25 + Math.random() * 15)})`;
      }
      ctx.fillRect(x, y, 2 + Math.random() * 2, 3 + Math.random() * 3);
    }

    // Tiny wild yellow buttercups & white daisies
    for (let f = 0; f < 300; f++) {
      const fx = Math.random() * 512;
      const fy = Math.random() * 512;
      ctx.fillStyle = Math.random() < 0.5 ? '#facc15' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }

  createClayTileRoofTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Terracotta roof tile base
    ctx.fillStyle = '#8a3727';
    ctx.fillRect(0, 0, 512, 512);

    // Overlapping tile rows
    const rowHeight = 32;
    for (let y = 0; y < 512; y += rowHeight) {
      ctx.fillStyle = (y / rowHeight) % 2 === 0 ? '#983f2e' : '#7d3122';
      ctx.fillRect(0, y, 512, rowHeight - 2);

      // Tile shadow
      ctx.fillStyle = '#4a1b12';
      ctx.fillRect(0, y + rowHeight - 2, 512, 2);

      // Vertical tile gaps
      const tileWidth = 48;
      const xOffset = ((y / rowHeight) % 2) * (tileWidth / 2);
      for (let x = xOffset; x < 512; x += tileWidth) {
        ctx.fillStyle = '#4a1b12';
        ctx.fillRect(x, y, 2, rowHeight);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  createCobblestoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Earthy mortar base
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 0, 512, 512);

    // Rounded riverstone cobblestones
    const stoneSize = 32;
    for (let y = 4; y < 512; y += stoneSize) {
      const rowShift = ((y / stoneSize) % 2) * (stoneSize / 2);
      for (let x = 4; x < 512; x += stoneSize) {
        const sx = x + rowShift;
        const shade = Math.floor(90 + Math.random() * 45);
        ctx.fillStyle = `rgb(${shade}, ${shade - 6}, ${shade - 12})`;
        ctx.beginPath();
        ctx.roundRect(sx + 2, y + 2, stoneSize - 6, stoneSize - 6, 8);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  createForestFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep moist dark forest loam
    ctx.fillStyle = '#141d13';
    ctx.fillRect(0, 0, 512, 512);

    // Moss patches and dark soil clumps
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const roll = Math.random();
      if (roll < 0.45) {
        // Dark moss green
        ctx.fillStyle = `rgb(${Math.floor(25 + Math.random() * 25)}, ${Math.floor(45 + Math.random() * 35)}, ${Math.floor(20 + Math.random() * 20)})`;
      } else if (roll < 0.75) {
        // Pine needle & decayed leaves brown
        ctx.fillStyle = `rgb(${Math.floor(45 + Math.random() * 30)}, ${Math.floor(30 + Math.random() * 20)}, ${Math.floor(15 + Math.random() * 15)})`;
      } else {
        // Mud & dark rock specks
        ctx.fillStyle = `rgb(${Math.floor(15 + Math.random() * 20)}, ${Math.floor(20 + Math.random() * 15)}, ${Math.floor(15 + Math.random() * 10)})`;
      }
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    return texture;
  }

  createWoodPlankTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Weathered dark timber base
    ctx.fillStyle = '#2b1d14';
    ctx.fillRect(0, 0, 512, 512);

    // Horizontal plank slats
    const plankHeight = 32;
    for (let y = 0; y < 512; y += plankHeight) {
      ctx.fillStyle = (y / plankHeight) % 2 === 0 ? '#38261b' : '#2e1f16';
      ctx.fillRect(0, y, 512, plankHeight - 2);

      // Plank seam shadow
      ctx.fillStyle = '#140c07';
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);

      // Wood grain scratches
      ctx.strokeStyle = '#1e140d';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        const gy = y + 4 + Math.random() * 20;
        ctx.moveTo(0, gy);
        ctx.lineTo(512, gy + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }

      // Old rusted iron nails
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(24, y + 15, 3, 0, Math.PI * 2);
      ctx.arc(488, y + 15, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  // --------------------------------------------------------------------------
  // MAP 1: DESA SUKAMAJU / DESA RIMBA ASRI (SAFE ZONE)
  // Peaceful countryside village with rustic houses, cobblestone paths,
  // wooden fences, village well, blacksmith, herbalist, and trade stalls.
  // --------------------------------------------------------------------------
  buildSafeZone() {
    // 1. Lush Countryside Meadow Ground
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.createVillageGrassTexture(),
      roughness: 0.9,
      metalness: 0.02
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.safeZoneGroup.add(floor);

    // 2. Cobblestone Pathways connecting House, Well, Shops, and Gate
    this.createVillagePaths();

    // 3. Rustic Wooden Boundary Fence
    this.createVillageFences(this.safeZoneGroup, this.safeZoneColliders);

    // 4. Bangun Seluruh Bangunan & Alun-Alun Sesuai 6 Gambar Referensi
    this.villageArchitect = VillageArchitect.build(this);

    // 5. Nuansa Malam Pedesaan: Cahaya Bulan Sejuk & Lentera Hangat
    const amb = new THREE.AmbientLight(0x1a263d, 0.9);
    const moon = new THREE.DirectionalLight(0x8ba6e8, 1.25);
    moon.position.set(-35, 65, -30);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.left = -50;
    moon.shadow.camera.right = 50;
    moon.shadow.camera.top = 50;
    moon.shadow.camera.bottom = -50;
    this.safeZoneLights.add(amb);
    this.safeZoneLights.add(moon);

    // Lentera Teras Rumah Utama (Cahaya Hangat Amber)
    const houseLantern = new THREE.PointLight(0xf59e0b, 2.4, 18);
    houseLantern.position.set(0, 3.8, -14);
    this.safeZoneLights.add(houseLantern);

    // Lentera Kios Toko Pedesaan (Cahaya Emas Hangat)
    const shopLantern = new THREE.PointLight(0xfbbf24, 2.5, 18);
    shopLantern.position.set(-16, 3.5, 0);
    this.safeZoneLights.add(shopLantern);

    // Lentera Sumur Alun-Alun Desa
    const wellLantern = new THREE.PointLight(0xf59e0b, 2.0, 16);
    wellLantern.position.set(0, 3.2, 0);
    this.safeZoneLights.add(wellLantern);

    // 4 Lampu Jalan Batu di sepanjang jalan utama
    [-8, 8, 18, 28].forEach(pz => {
      const pathLantern = new THREE.PointLight(0xfbbf24, 1.5, 12);
      pathLantern.position.set(3.2, 2.2, pz);
      this.safeZoneLights.add(pathLantern);
    });

    // Taburan Bintang di Langit Malam
    this.createNightSkyStars(this.safeZoneGroup);
  }

  // ⭐ Sistem Bintang Langit Malam (Starfield)
  createNightSkyStars(group) {
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 450; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 160 + Math.random() * 20;
      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 12; // Di atas cakrawala
      const z = r * sinPhi * Math.sin(theta);
      starPos.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 1.6,
      transparent: true,
      opacity: 0.85
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    group.add(starPoints);
  }

  // 🛤️ Cobblestone Walkways connecting the village (House, Shop, Well, and Forest Gate)
  createVillagePaths() {
    const stoneMat = new THREE.MeshStandardMaterial({
      map: this.createCobblestoneTexture(),
      roughness: 0.85,
      metalness: 0.05
    });

    // Main North-South Path: From House (z: -18) through Well (z: 0) to Forest Gate (z: 36)
    const nsGeo = new THREE.PlaneGeometry(5.0, 58);
    const nsPath = new THREE.Mesh(nsGeo, stoneMat);
    nsPath.rotation.x = -Math.PI / 2;
    nsPath.position.set(0, 0.02, 9);
    nsPath.receiveShadow = true;
    this.safeZoneGroup.add(nsPath);

    // West Path: From Shop (x: -18) to Central Plaza (x: 0)
    const westGeo = new THREE.PlaneGeometry(20, 4.5);
    const westPath = new THREE.Mesh(westGeo, stoneMat);
    westPath.rotation.x = -Math.PI / 2;
    westPath.position.set(-10, 0.03, 0);
    westPath.receiveShadow = true;
    this.safeZoneGroup.add(westPath);

    // Circular Plaza around Village Well at (0, 0)
    const ringGeo = new THREE.RingGeometry(2.0, 7.5, 24);
    const ringPath = new THREE.Mesh(ringGeo, stoneMat);
    ringPath.rotation.x = -Math.PI / 2;
    ringPath.position.set(0, 0.04, 0);
    ringPath.receiveShadow = true;
    this.safeZoneGroup.add(ringPath);
  }

  // 🪵 Rustic Wooden Village Fences
  createVillageFences(group, colliders) {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a3220, // Rustic cedar brown
      roughness: 0.9,
      metalness: 0.05
    });

    const halfSize = 48;
    const fenceHeight = 1.8;

    const fenceDefs = [
      { x: 0, z: -halfSize, w: halfSize * 2, d: 0.8 },
      { x: 0, z: halfSize, w: halfSize * 2, d: 0.8 },
      { x: -halfSize, z: 0, w: 0.8, d: halfSize * 2 },
      { x: halfSize, z: 0, w: 0.8, d: halfSize * 2 }
    ];

    fenceDefs.forEach(def => {
      // Horizontal Rails
      const railGeo = new THREE.BoxGeometry(def.w, 0.25, def.d);
      const railTop = new THREE.Mesh(railGeo, woodMat);
      railTop.position.set(def.x, 1.4, def.z);
      group.add(railTop);

      const railBottom = new THREE.Mesh(railGeo, woodMat);
      railBottom.position.set(def.x, 0.7, def.z);
      group.add(railBottom);

      // Vertical Posts every 6 meters
      const isHorizontal = def.w > def.d;
      const count = Math.floor((isHorizontal ? def.w : def.d) / 6);
      for (let i = 0; i <= count; i++) {
        const offset = -((isHorizontal ? def.w : def.d) / 2) + i * 6;
        const postGeo = new THREE.CylinderGeometry(0.18, 0.22, fenceHeight, 6);
        const post = new THREE.Mesh(postGeo, woodMat);
        if (isHorizontal) {
          post.position.set(def.x + offset, fenceHeight / 2, def.z);
        } else {
          post.position.set(def.x, fenceHeight / 2, def.z + offset);
        }
        group.add(post);
      }

      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(def.x, fenceHeight / 2, def.z),
        new THREE.Vector3(def.w, fenceHeight, def.d)
      ));
    });
  }

  // --------------------------------------------------------------------------
  // TERRAIN ELEVATION / HEIGHTMAP SAMPLER (ROCK-SOLID LEVEL COLLISION)
  // Menjamin pemain, zombie, dan jarahan SELALU berdiri kokoh di atas tanah
  // 100% bebas bug melayang atau tenggelam ke tanah!
  // --------------------------------------------------------------------------
  getTerrainHeight(x, z) {
    if (this.activeZone !== 'sector_7') return 0;

    // Di dalam pondok terbengkalai: elevasi lantai pondok yang rata (0.12)
    for (let i = 0; i < this.cabinSites.length; i++) {
      const c = this.cabinSites[i];
      if (Math.abs(x - c.x) <= 4.2 && Math.abs(z - c.z) <= 3.8) {
        return 0.12;
      }
    }

    // Seluruh arena tempur di Sector-7 berada di Y = 0 (Tanah Padat & Stabil)
    return 0;
  }

  // --------------------------------------------------------------------------
  // MAP 2 REBUILT: BLACKWOOD WASTELAND (DANGER ZONE SECTOR-7)
  // Arena 260m x 260m atmosferik dengan jalan raya hancur, barikade tempur,
  // drum minyak menyala, tong limbah beracun, pondok terbengkalai, dan vegetasi seram.
  // --------------------------------------------------------------------------
  buildSector7() {
    // 1. Lantai Hutan/Wasteland Padat Rata Y = 0 (260m x 260m)
    const groundGeo = new THREE.PlaneGeometry(260, 260);
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.createForestFloorTexture(),
      roughness: 0.92,
      metalness: 0.04
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.sector7Group.add(ground);

    // 2. Tebing Perimeter & Dinding Pengaman Zona
    this.createForestPerimeter(this.sector7Group, this.sector7Colliders);

    // 3. Jalan Raya Hancur, Konvoi Militer, Barikade & Drum Api Menyala
    this.createCentralHighwayAndConvoy(this.sector7Group, this.sector7Colliders);

    // 4. 4 Pondok Terbengkalai / Bunker Riset dengan Peti Jarahan
    this.createAbandonedCabin(this.sector7Group, this.sector7Colliders, this.sector7Interactables,
      -45, -25, 0, 'Pondok Penjaga Hutan', 'crate_cabin_1');

    this.createAbandonedCabin(this.sector7Group, this.sector7Colliders, this.sector7Interactables,
      55, -15, 0, 'Lab Riset Biologis', 'crate_cabin_2');

    this.createAbandonedCabin(this.sector7Group, this.sector7Colliders, this.sector7Interactables,
      -35, 50, 0, 'Gudang Pemburu Terbengkalai', 'crate_cabin_3');

    this.createAbandonedCabin(this.sector7Group, this.sector7Colliders, this.sector7Interactables,
      45, 65, 0, 'Pos Pantau Reruntuhan', 'crate_cabin_4');

    // 5. Peti Jarahan Tambahan di Alam Liar
    this.createWildernessLootCaches(this.sector7Group, this.sector7Colliders, this.sector7Interactables);

    // 6. Vegetasi Hutan Seram & Bebatuan Raksasa
    this.createForestVegetation(this.sector7Group, this.sector7Colliders);

    // 7. Extraction Helipad & Suar Evakuasi Darurat (Posisi dinamis acak di dekat salah satu dari 4 pondok)
    this.cabinBeaconSites = [
      { x: -33, z: -19, name: 'Pondok Penjaga Hutan' },
      { x: 43, z: -7, name: 'Lab Riset Biologis' },
      { x: -25, z: 40, name: 'Gudang Pemburu Terbengkalai' },
      { x: 35, z: 57, name: 'Pos Pantau Reruntuhan' }
    ];
    this.currentBeaconSite = this.cabinBeaconSites[0];
    this.createExtractionBeacon(this.currentBeaconSite.x, this.currentBeaconSite.z);

    // 8. Pencahayaan Malam Hari Dramatis Sector-7
    const amb = new THREE.AmbientLight(0x0f1c16, 1.2);
    const moon = new THREE.DirectionalLight(0x7ea494, 1.5);
    moon.position.set(-50, 75, -40);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.left = -110;
    moon.shadow.camera.right = 110;
    moon.shadow.camera.top = 110;
    moon.shadow.camera.bottom = -110;
    this.sector7Lights.add(amb);
    this.sector7Lights.add(moon);
  }

  // 🛣️ Jalan Raya Hancur, Barikade Tempur, & Drum Api Menyala
  createCentralHighwayAndConvoy(group, colliders) {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x181e19,
      roughness: 0.95,
      metalness: 0.05
    });

    // Jalan aspal retak memanjang dari z = -90 hingga z = 45 (lebar 7m)
    const roadGeo = new THREE.PlaneGeometry(7.0, 135);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.015, -22);
    road.receiveShadow = true;
    group.add(road);

    // Drum Minyak Menyala (Memberi Pencahayaan Api Dinamis & Efek Horor)
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2e1a12, roughness: 0.7, metalness: 0.4 });
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 2.8,
      roughness: 0.2
    });

    const barrelPositions = [
      { x: -3.0, z: -65 },
      { x: 3.2, z: -35 },
      { x: -3.4, z: -5 },
      { x: 3.0, z: 25 }
    ];

    barrelPositions.forEach((pos, idx) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12), barrelMat);
      barrel.position.set(pos.x, 0.48, pos.z);
      barrel.castShadow = true;
      group.add(barrel);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.55, 8), flameMat);
      flame.position.set(pos.x, 1.15, pos.z);
      group.add(flame);

      const fireLight = new THREE.PointLight(0xff6600, 2.2, 16);
      fireLight.position.set(pos.x, 1.35, pos.z);
      this.sector7Lights.add(fireLight);

      this.animatedObjects.push({
        type: 'fire_flicker',
        light: fireLight,
        mesh: flame,
        baseIntensity: 2.2,
        idx
      });

      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(pos.x, 0.5, pos.z),
        new THREE.Vector3(0.8, 1.0, 0.8)
      ));
    });

    // Barikade Beton (Jersey Barriers) untuk Perlindungan Taktis
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const barrierPositions = [
      { x: -1.6, z: -70, rot: 0.2 },
      { x: 2.2, z: -46, rot: -0.15 },
      { x: -2.0, z: -16, rot: 0.25 },
      { x: 1.8, z: 14, rot: -0.2 }
    ];

    barrierPositions.forEach(b => {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.5), barrierMat);
      barrier.position.set(b.x, 0.45, b.z);
      barrier.rotation.y = b.rot;
      barrier.castShadow = true;
      group.add(barrier);

      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(b.x, 0.45, b.z),
        new THREE.Vector3(2.4, 0.9, 0.8)
      ));
    });

    // Tong Limbah Beracun (Radioactive Biohazard Sludge)
    const toxicMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.5, metalness: 0.6 });
    const toxicGlowMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 1.8,
      roughness: 0.2
    });

    const toxicPositions = [
      { x: -18, z: -42 },
      { x: 22, z: -28 },
      { x: -22, z: 20 },
      { x: 24, z: 45 }
    ];

    toxicPositions.forEach(t => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 12), toxicMat);
      drum.position.set(t.x, 0.5, t.z);
      drum.castShadow = true;
      group.add(drum);

      const spill = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), toxicGlowMat);
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(t.x + 0.3, 0.02, t.z + 0.3);
      group.add(spill);

      const toxicLight = new THREE.PointLight(0x22c55e, 1.5, 9);
      toxicLight.position.set(t.x, 0.8, t.z);
      this.sector7Lights.add(toxicLight);

      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(t.x, 0.5, t.z),
        new THREE.Vector3(0.9, 1.0, 0.9)
      ));
    });
  }

  // 🌲 Forest Perimeter Rock Cliffs
  createForestPerimeter(group, colliders) {
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x1c241d,
      roughness: 0.95,
      metalness: 0.05
    });

    const cliffs = [
      { x: -125, z: 0, w: 14, d: 265, h: 20 },
      { x: 125, z: 0, w: 14, d: 265, h: 20 },
      { x: 0, z: -125, w: 265, d: 14, h: 20 },
      { x: 0, z: 125, w: 265, d: 14, h: 20 }
    ];

    cliffs.forEach(c => {
      const geo = new THREE.BoxGeometry(c.w, c.h, c.d);
      const mesh = new THREE.Mesh(geo, cliffMat);
      mesh.position.set(c.x, c.h / 2, c.z);
      group.add(mesh);
      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(c.x, c.h / 2, c.z),
        new THREE.Vector3(c.w, c.h, c.d)
      ));
    });
  }

  // 🏚️ Modular Abandoned Cabin with Walkable Interior & Loot Crate
  createAbandonedCabin(group, colliders, interactables, x, z, rotY, name, crateId) {
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(x, 0, z);

    const woodMat = new THREE.MeshStandardMaterial({
      map: this.createWoodPlankTexture(),
      roughness: 0.88,
      metalness: 0.05
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1f2e21, // Mossy weathered slate/shingles
      roughness: 0.9,
      metalness: 0.05
    });

    // Dimensions: 8m wide (X), 7m deep (Z), 3.8m tall (Y)
    // 1. Back Wall (Z = -3.5)
    const backGeo = new THREE.BoxGeometry(8.0, 3.8, 0.4);
    const backWall = new THREE.Mesh(backGeo, woodMat);
    backWall.position.set(0, 1.9, -3.5);
    cabinGroup.add(backWall);

    // 2. Left Wall (X = -3.8)
    const sideGeo = new THREE.BoxGeometry(0.4, 3.8, 7.0);
    const leftWall = new THREE.Mesh(sideGeo, woodMat);
    leftWall.position.set(-3.8, 1.9, 0);
    cabinGroup.add(leftWall);

    // 3. Right Wall (X = +3.8)
    const rightWall = new THREE.Mesh(sideGeo, woodMat);
    rightWall.position.set(3.8, 1.9, 0);
    cabinGroup.add(rightWall);

    // 4. Front Wall with Open Doorway (2.6m wide doorway opening in center)
    // Front Left Section
    const frontSideGeo = new THREE.BoxGeometry(2.7, 3.8, 0.4);
    const frontLeft = new THREE.Mesh(frontSideGeo, woodMat);
    frontLeft.position.set(-2.65, 1.9, 3.5);
    cabinGroup.add(frontLeft);

    // Front Right Section
    const frontRight = new THREE.Mesh(frontSideGeo, woodMat);
    frontRight.position.set(2.65, 1.9, 3.5);
    cabinGroup.add(frontRight);
    this.obstacleMeshes.push(backWall, leftWall, rightWall, frontLeft, frontRight);

    // Door Lintel (Top lintel above the 2.8m high door opening)
    const lintelGeo = new THREE.BoxGeometry(2.6, 1.0, 0.4);
    const lintel = new THREE.Mesh(lintelGeo, woodMat);
    lintel.position.set(0, 3.3, 3.5);
    cabinGroup.add(lintel);

    // 5. Floor Inside Cabin
    const floorGeo = new THREE.BoxGeometry(7.8, 0.25, 6.8);
    const cabinFloor = new THREE.Mesh(floorGeo, woodMat);
    cabinFloor.position.set(0, 0.12, 0);
    cabinGroup.add(cabinFloor);

    // 6. Slanted Gable Roof
    const roofPanelGeo = new THREE.BoxGeometry(4.8, 0.25, 7.8);
    const roofLeft = new THREE.Mesh(roofPanelGeo, roofMat);
    roofLeft.position.set(-2.0, 4.3, 0);
    roofLeft.rotation.z = Math.PI * 0.12;
    cabinGroup.add(roofLeft);

    const roofRight = new THREE.Mesh(roofPanelGeo, roofMat);
    roofRight.position.set(2.0, 4.3, 0);
    roofRight.rotation.z = -Math.PI * 0.12;
    cabinGroup.add(roofRight);

    // 7. Front Porch with Weathered Timber Posts
    const porchFloorGeo = new THREE.BoxGeometry(4.0, 0.2, 2.5);
    const porchFloor = new THREE.Mesh(porchFloorGeo, woodMat);
    porchFloor.position.set(0, 0.1, 4.75);
    cabinGroup.add(porchFloor);

    const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 3.2, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x24180f, roughness: 0.9 });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-1.8, 1.6, 5.8);
    cabinGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(1.8, 1.6, 5.8);
    cabinGroup.add(postR);

    // 8. Interior Furniture: Dilapidated Table & Overturned Chair
    const tableGeo = new THREE.BoxGeometry(1.8, 0.85, 1.0);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x24180e, roughness: 0.9 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(-2.0, 0.45, -1.8);
    cabinGroup.add(table);

    // Overturned chair on floor
    const chairGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const chair = new THREE.Mesh(chairGeo, tableMat);
    chair.position.set(-1.2, 0.28, -0.8);
    chair.rotation.set(0.4, 0.6, 1.2);
    cabinGroup.add(chair);

    // Ambient interior lantern (flickering warm glow)
    const lantern = new THREE.PointLight(0xff9933, 0.85, 12);
    lantern.position.set(0, 2.4, 0);
    cabinGroup.add(lantern);

    // 9. Loot Crate placed inside the cabin corner
    const crateGeo = new THREE.BoxGeometry(1.8, 1.2, 1.4);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x3b4554,
      metalness: 0.6,
      roughness: 0.4
    });
    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(2.0, 0.6, -1.8);
    cabinGroup.add(crateMesh);

    // Glowing green indicator light on crate
    const indGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const indMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ind = new THREE.Mesh(indGeo, indMat);
    ind.position.set(2.0, 0.9, -1.08);
    cabinGroup.add(ind);

    group.add(cabinGroup);

    // Register Analytical Wall Colliders (Door opening between -1.3 and +1.3 is free!)
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1.9, z - 3.5),
      new THREE.Vector3(8.0, 3.8, 0.4)
    ));
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 3.8, 1.9, z),
      new THREE.Vector3(0.4, 3.8, 7.0)
    ));
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 3.8, 1.9, z),
      new THREE.Vector3(0.4, 3.8, 7.0)
    ));
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 2.65, 1.9, z + 3.5),
      new THREE.Vector3(2.7, 3.8, 0.4)
    ));
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 2.65, 1.9, z + 3.5),
      new THREE.Vector3(2.7, 3.8, 0.4)
    ));
    // Table collider
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 2.0, 0.45, z - 1.8),
      new THREE.Vector3(1.8, 0.85, 1.0)
    ));
    // Crate collider
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 2.0, 0.6, z - 1.8),
      new THREE.Vector3(1.8, 1.2, 1.4)
    ));

    // Register Interactable Loot Crate
    interactables.push({
      id: crateId,
      type: 'loot_crate',
      position: new THREE.Vector3(x + 2.0, 0.6, z - 1.8),
      radius: 3.2,
      label: `Peti Jarahan (${name}) [E]`
    });
  }

  // 📦 Wilderness Caches (Wreckage, Shrines, Campsites)
  createWildernessLootCaches(group, colliders, interactables) {
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.6
    });
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    const caches = [
      { id: 'crate_wreck_1', x: 0, z: 20, label: 'Kargo Truk Terguling [E]', type: 'truck' },
      { id: 'crate_shrine_1', x: -70, z: 25, label: 'Peti Altar Berlumut [E]', type: 'monolith' },
      { id: 'crate_camp_1', x: 25, z: -45, label: 'Peti Perkemahan Terbengkalai [E]', type: 'tent' },
      { id: 'crate_lookout_1', x: -65, z: -60, label: 'Peti Sisa Perbekalan Hutan [E]', type: 'timber' }
    ];

    caches.forEach(c => {
      const cacheGroup = new THREE.Group();
      cacheGroup.position.set(c.x, 0, c.z);

      // Crate
      const boxGeo = new THREE.BoxGeometry(2.4, 1.4, 1.8);
      const box = new THREE.Mesh(boxGeo, crateMat);
      box.position.y = 0.7;
      cacheGroup.add(box);

      // Light
      const lightGeo = new THREE.BoxGeometry(0.5, 0.25, 0.1);
      const light = new THREE.Mesh(lightGeo, panelMat);
      light.position.set(0, 1.0, 0.95);
      cacheGroup.add(light);

      // Environmental scenery prop next to crate
      if (c.type === 'truck') {
        const truckBodyGeo = new THREE.BoxGeometry(4.0, 2.5, 7.0);
        const truckMat = new THREE.MeshStandardMaterial({ color: 0x223028, metalness: 0.7, roughness: 0.6 });
        const truck = new THREE.Mesh(truckBodyGeo, truckMat);
        truck.position.set(-3.5, 1.25, 0);
        truck.rotation.z = 0.25; // Tilted on side
        cacheGroup.add(truck);
        colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(c.x - 3.5, 1.25, c.z),
          new THREE.Vector3(4.0, 2.5, 7.0)
        ));
      } else if (c.type === 'monolith') {
        const monoGeo = new THREE.BoxGeometry(1.6, 6.0, 1.6);
        const monoMat = new THREE.MeshStandardMaterial({ color: 0x18241b, roughness: 0.95 });
        const mono = new THREE.Mesh(monoGeo, monoMat);
        mono.position.set(2.5, 3.0, 0);
        cacheGroup.add(mono);
        colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(c.x + 2.5, 3.0, c.z),
          new THREE.Vector3(1.6, 6.0, 1.6)
        ));
      }

      group.add(cacheGroup);
      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(c.x, 0.7, c.z),
        new THREE.Vector3(2.4, 1.4, 1.8)
      ));

      interactables.push({
        id: c.id,
        type: 'loot_crate',
        position: new THREE.Vector3(c.x, 0.7, c.z),
        radius: 3.2,
        label: c.label
      });
    });
  }

  // 🌲 Procedural Forest Vegetation System
  createForestVegetation(group, colliders) {
    const pineBarkMat = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.92 });
    const pineFoliageMat1 = new THREE.MeshStandardMaterial({ color: 0x142b1a, roughness: 0.88 });
    const pineFoliageMat2 = new THREE.MeshStandardMaterial({ color: 0x1b3823, roughness: 0.88 });

    const oakBarkMat = new THREE.MeshStandardMaterial({ color: 0x2b1e15, roughness: 0.95 });
    const oakFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1e3620, roughness: 0.85 });

    const deadWoodMat = new THREE.MeshStandardMaterial({ color: 0x1f1913, roughness: 0.98 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x222e23, roughness: 0.92, metalness: 0.05 });

    // Seeded pseudo-random placement across [-105, 105]
    const cabinClearings = [
      { x: -45, z: -25, r: 12 },
      { x: 55, z: -15, r: 12 },
      { x: -35, z: 50, r: 12 },
      { x: 45, z: 65, r: 12 },
      { x: 0, z: -92, r: 15 }, // Extraction Pad clearing
      { x: 0, z: -80, r: 10 }  // Player Spawn clearing
    ];

    let seed = 12345;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const treeCount = 120;
    for (let i = 0; i < treeCount; i++) {
      const tx = (rnd() - 0.5) * 210;
      const tz = (rnd() - 0.5) * 210;

      // Check if inside any clearing
      let inClearing = false;
      for (const clr of cabinClearings) {
        if (Math.hypot(tx - clr.x, tz - clr.z) < clr.r) {
          inClearing = true;
          break;
        }
      }
      if (inClearing) continue;

      const treeType = rnd();
      const scale = 0.85 + rnd() * 0.45;

      if (treeType < 0.55) {
        // --- 1. TALL PINE TREE ---
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.48 * scale, 10 * scale, 7);
        const trunk = new THREE.Mesh(trunkGeo, pineBarkMat);
        trunk.position.y = 5 * scale;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // 3 Tiers of Pine Needle Cones
        const fMat = i % 2 === 0 ? pineFoliageMat1 : pineFoliageMat2;
        const c1 = new THREE.Mesh(new THREE.ConeGeometry(3.6 * scale, 4.5 * scale, 6), fMat);
        c1.position.y = 5.8 * scale;
        c1.castShadow = true;
        treeGroup.add(c1);

        const c2 = new THREE.Mesh(new THREE.ConeGeometry(2.7 * scale, 4.0 * scale, 6), fMat);
        c2.position.y = 8.2 * scale;
        c2.castShadow = true;
        treeGroup.add(c2);

        const c3 = new THREE.Mesh(new THREE.ConeGeometry(1.8 * scale, 3.5 * scale, 6), fMat);
        c3.position.y = 10.5 * scale;
        c3.castShadow = true;
        treeGroup.add(c3);

        group.add(treeGroup);
        colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 5 * scale, tz),
          new THREE.Vector3(0.9 * scale, 10 * scale, 0.9 * scale)
        ));
      } else if (treeType < 0.80) {
        // --- 2. BROADLEAF OVERGROWN OAK ---
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunkGeo = new THREE.CylinderGeometry(0.42 * scale, 0.6 * scale, 7 * scale, 8);
        const trunk = new THREE.Mesh(trunkGeo, oakBarkMat);
        trunk.position.y = 3.5 * scale;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Clustered canopy foliage
        const fGeo = new THREE.DodecahedronGeometry(2.6 * scale);
        const f1 = new THREE.Mesh(fGeo, oakFoliageMat);
        f1.position.set(0, 7.2 * scale, 0);
        f1.castShadow = true;
        treeGroup.add(f1);

        const f2 = new THREE.Mesh(fGeo, oakFoliageMat);
        f2.position.set(1.2 * scale, 6.2 * scale, 0.8 * scale);
        f2.scale.set(0.75, 0.75, 0.75);
        treeGroup.add(f2);

        const f3 = new THREE.Mesh(fGeo, oakFoliageMat);
        f3.position.set(-1.1 * scale, 6.5 * scale, -0.6 * scale);
        f3.scale.set(0.8, 0.8, 0.8);
        treeGroup.add(f3);

        group.add(treeGroup);
        colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 3.5 * scale, tz),
          new THREE.Vector3(1.1 * scale, 7 * scale, 1.1 * scale)
        ));
      } else if (treeType < 0.92) {
        // --- 3. DEAD HORROR TREE ---
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.45 * scale, 8 * scale, 6);
        const trunk = new THREE.Mesh(trunkGeo, deadWoodMat);
        trunk.position.y = 4 * scale;
        trunk.rotation.z = (rnd() - 0.5) * 0.25;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Crooked branches
        const bGeo = new THREE.CylinderGeometry(0.1, 0.18, 3.5 * scale, 5);
        const b1 = new THREE.Mesh(bGeo, deadWoodMat);
        b1.position.set(0.9 * scale, 5.8 * scale, 0);
        b1.rotation.z = -0.7;
        treeGroup.add(b1);

        const b2 = new THREE.Mesh(bGeo, deadWoodMat);
        b2.position.set(-0.8 * scale, 6.5 * scale, 0.4 * scale);
        b2.rotation.z = 0.8;
        b2.rotation.x = -0.4;
        treeGroup.add(b2);

        group.add(treeGroup);
        colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 4 * scale, tz),
          new THREE.Vector3(0.8 * scale, 8 * scale, 0.8 * scale)
        ));
      } else {
        // --- 4. MOSSY BOULDER ---
        const rockGeo = new THREE.DodecahedronGeometry(1.5 * scale);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(tx, 0.9 * scale, tz);
        rock.scale.set(1.0, 0.65, 1.3);
        rock.rotation.set(rnd() * 2, rnd() * 2, rnd() * 2);
        rock.castShadow = true;
        group.add(rock);

        colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 0.9 * scale, tz),
          new THREE.Vector3(2.5 * scale, 1.5 * scale, 2.5 * scale)
        ));
      }
    }
  }

  // 🛸 Extraction Beacon (Menara Suar Evakuasi Darurat)
  createExtractionBeacon(x, z) {
    this.extractionGroup = new THREE.Group();
    this.extractionGroup.position.set(x, 0, z);

    // Concrete Pad
    const padGeo = new THREE.CylinderGeometry(5.0, 5.5, 0.6, 16);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.3;
    this.extractionGroup.add(pad);

    // Tower Base
    const baseGeo = new THREE.CylinderGeometry(1.6, 2.4, 3, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.8;
    this.extractionGroup.add(base);

    // Antenna Mast
    const poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 14, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 9;
    this.extractionGroup.add(pole);

    // Sky Beam (Laser vertikal menembus langit malam hutan)
    const beamGeo = new THREE.CylinderGeometry(0.8, 1.8, 100, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 50;
    this.extractionGroup.add(beam);
    this.animatedObjects.push({ mesh: beam, type: 'beam_pulse', speed: 3.0 });

    // Glowing Cyan Extraction Pad Ring
    const ringGeo = new THREE.RingGeometry(3.6, 4.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.62;
    this.extractionGroup.add(ring);

    this.sector7Group.add(this.extractionGroup);

    this.extractionCollider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1.5, z),
      new THREE.Vector3(4, 3, 4)
    );
    this.sector7Colliders.push(this.extractionCollider);

    this.extractionInteractable = {
      id: 'extraction_beacon',
      type: 'extraction',
      position: new THREE.Vector3(x, 1, z),
      radius: 4.8,
      label: `Suar Evakuasi [E] (${this.currentBeaconSite?.name || 'Pondok Hutan'})`
    };
    this.sector7Interactables.push(this.extractionInteractable);
  }

  // Pindahkan posisi beacon evakuasi secara acak ke salah satu dari 4 pondok hutan
  randomizeExtractionBeacon() {
    if (!this.cabinBeaconSites || !this.extractionGroup) return null;
    const site = this.cabinBeaconSites[Math.floor(Math.random() * this.cabinBeaconSites.length)];
    this.currentBeaconSite = site;

    this.extractionGroup.position.set(site.x, 0, site.z);
    if (this.extractionCollider) {
      this.extractionCollider.setFromCenterAndSize(
        new THREE.Vector3(site.x, 1.5, site.z),
        new THREE.Vector3(4, 3, 4)
      );
    }
    if (this.extractionInteractable) {
      this.extractionInteractable.position.set(site.x, 1, site.z);
      this.extractionInteractable.label = `Suar Evakuasi [E] (${site.name})`;
    }
    console.log(`📡 [SECTOR-7] Suar Evakuasi dipindahkan ke: ${site.name} (${site.x}, ${site.z})`);
    return site;
  }

  // --------------------------------------------------------------------------
  // ZONE SWITCHER
  // --------------------------------------------------------------------------
  setZoneActive(zoneName, player = null) {
    this.activeZone = zoneName;

    if (zoneName === 'safe_zone') {
      this.safeZoneGroup.visible = true;
      this.safeZoneLights.visible = true;

      this.sector7Group.visible = false;
      this.sector7Lights.visible = false;

      // Nuansa Malam Pedesaan (Desa Asri Safe Zone Malam Hari)
      this.scene.background = new THREE.Color(0x060b17); // Langit malam biru gelap pekat
      this.scene.fog = new THREE.FogExp2(0x081326, 0.010); // Kabut malam lembut pedesaan

      if (player) {
        player.teleport(0, 1.7, -6); // Spawn with clear view in front of Hab Pod
      }
    } else {
      // sector_7
      this.safeZoneGroup.visible = false;
      this.safeZoneLights.visible = false;

      this.sector7Group.visible = true;
      this.sector7Lights.visible = true;

      // Pindahkan Suar Evakuasi secara acak agar pemain menjelajahi pondok hutan
      const chosenSite = this.randomizeExtractionBeacon();

      // Eerie Dark Overgrown Forest atmosphere (Wasteland Malam)
      this.scene.background = new THREE.Color(0x040907);
      this.scene.fog = new THREE.FogExp2(0x050e0a, 0.014);

      if (player) {
        player.teleport(0, 1.7, -80); // Masuk dari selatan hutan
      }
    }
  }

  getColliders() {
    return this.activeZone === 'safe_zone' ? this.safeZoneColliders : this.sector7Colliders;
  }

  // Check collision against active zone's colliders
  checkCollision(x, z, radius = 0.5, feetY = 0) {
    if (
      x - radius < this.arenaBounds.minX ||
      x + radius > this.arenaBounds.maxX ||
      z - radius < this.arenaBounds.minZ ||
      z + radius > this.arenaBounds.maxZ
    ) {
      return true;
    }

    const colliders = this.getColliders();
    const minX = x - radius;
    const maxX = x + radius;
    const minZ = z - radius;
    const maxZ = z + radius;

    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (feetY >= box.max.y - 0.1) continue;

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

  getInteractables() {
    return this.activeZone === 'safe_zone' ? this.safeZoneInteractables : this.sector7Interactables;
  }

  update(delta) {
    // Animate crystals, dome, vortex, extraction beam, and burning barrels
    const time = performance.now() * 0.001;
    for (const anim of this.animatedObjects) {
      if (anim.type === 'dome_spin') {
        anim.mesh.rotation.y += anim.speed;
      } else if (anim.type === 'crystal_float') {
        anim.mesh.rotation.y += anim.speed;
        anim.mesh.position.y = anim.baseY + Math.sin(time * 2.0) * 0.25;
      } else if (anim.type === 'vortex_pulse') {
        anim.mesh.material.opacity = 0.5 + Math.sin(time * anim.speed) * 0.25;
      } else if (anim.type === 'beam_pulse') {
        anim.mesh.material.opacity = 0.35 + Math.sin(time * anim.speed) * 0.15;
      } else if (anim.type === 'fire_flicker') {
        const flicker = Math.sin(time * 16 + anim.idx * 2) * 0.35 + Math.cos(time * 27) * 0.15;
        anim.light.intensity = anim.baseIntensity + flicker;
        anim.mesh.scale.set(1.0 + flicker * 0.12, 1.0 + flicker * 0.2, 1.0 + flicker * 0.12);
      }
    }
  }
}
