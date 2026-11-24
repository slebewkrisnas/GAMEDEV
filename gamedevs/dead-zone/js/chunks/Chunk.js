// ============================================================================
// CHUNK — INDEPENDENT MODULAR 3D WORLD SECTOR
// Represents a discrete spatial tile (cx, cz) containing its own:
// - Ground terrain slab
// - Procedural forest vegetation & boulders
// - Structures (cabins, highway, barriers, barrels, crates)
// - Analytical physics colliders (Box3)
// - Bullet occlusion obstacle meshes
// - Dynamic interactive points [E]
// ============================================================================

import * as THREE from 'three';
import { WorldConfig } from './WorldConfig.js';

export const CHUNK_STATE = {
  UNLOADED: 'unloaded',
  LOADING: 'loading',
  ACTIVE: 'active',
  UNLOADING: 'unloading'
};

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.key = `${cx}_${cz}`;
    this.state = CHUNK_STATE.UNLOADED;

    const size = WorldConfig.CHUNK_SIZE;
    this.centerX = cx * size;
    this.centerZ = cz * size;
    this.minX = this.centerX - size / 2;
    this.maxX = this.centerX + size / 2;
    this.minZ = this.centerZ - size / 2;
    this.maxZ = this.centerZ + size / 2;

    this.group = new THREE.Group();
    this.group.name = `Chunk_${this.key}`;

    this.colliders = [];
    this.interactables = [];
    this.obstacleMeshes = [];
    this.animatedObjects = [];
    this.lights = [];

    // Keys of resources acquired from ChunkResourceManager for safe disposal
    this.acquiredMaterials = [];
    this.acquiredGeometries = [];
    this.localGeometries = [];
  }

  contains(x, z) {
    return x >= this.minX && x < this.maxX && z >= this.minZ && z < this.maxZ;
  }

  distanceTo(x, z) {
    return Math.hypot(this.centerX - x, this.centerZ - z);
  }

  build(resourceManager, stateStore) {
    if (this.state === CHUNK_STATE.ACTIVE) return;
    this.state = CHUNK_STATE.LOADING;

    const size = WorldConfig.CHUNK_SIZE;

    // 1. Seamless Ground Slab for this Chunk
    const groundGeo = new THREE.PlaneGeometry(size, size);
    this.localGeometries.push(groundGeo);
    const groundMat = resourceManager.getGroundMaterial();
    this.acquiredMaterials.push('ground_forest');

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(this.centerX, 0, this.centerZ);
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // 2. Highway Intersection (Highway runs along X in [-3.5, 3.5], Z in [-90, 45])
    if (this.minX <= 3.5 && this.maxX >= -3.5) {
      const roadMinZ = Math.max(this.minZ, -90);
      const roadMaxZ = Math.min(this.maxZ, 45);
      if (roadMinZ < roadMaxZ) {
        const roadLength = roadMaxZ - roadMinZ;
        const roadCenterZ = (roadMinZ + roadMaxZ) / 2;
        const roadGeo = new THREE.PlaneGeometry(7.0, roadLength);
        this.localGeometries.push(roadGeo);
        const roadMat = resourceManager.getRoadMaterial();
        this.acquiredMaterials.push('road_asphalt');

        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.position.set(0, 0.015, roadCenterZ);
        roadMesh.receiveShadow = true;
        this.group.add(roadMesh);
      }
    }

    // 3. Burning Oil Barrels in this Chunk
    WorldConfig.BURNING_BARRELS.forEach((bPos, idx) => {
      if (this.contains(bPos.x, bPos.z)) {
        const barrelMat = resourceManager.getBarrelMaterial();
        this.acquiredMaterials.push('oil_barrel');
        const flameMat = resourceManager.getFlameMaterial();
        this.acquiredMaterials.push('fire_flame');

        const barrelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12);
        this.localGeometries.push(barrelGeo);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(bPos.x, 0.48, bPos.z);
        barrel.castShadow = true;
        this.group.add(barrel);

        const flameGeo = new THREE.ConeGeometry(0.25, 0.55, 8);
        this.localGeometries.push(flameGeo);
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(bPos.x, 1.15, bPos.z);
        this.group.add(flame);

        const fireLight = new THREE.PointLight(0xff6600, 2.2, 16);
        fireLight.position.set(bPos.x, 1.35, bPos.z);
        this.group.add(fireLight);
        this.lights.push(fireLight);

        this.animatedObjects.push({
          type: 'fire_flicker',
          light: fireLight,
          mesh: flame,
          baseIntensity: 2.2,
          idx: idx + this.cx * 5
        });

        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(bPos.x, 0.5, bPos.z),
          new THREE.Vector3(0.8, 1.0, 0.8)
        ));
      }
    });

    // 4. Concrete Jersey Barriers in this Chunk
    WorldConfig.BARRIERS.forEach(bar => {
      if (this.contains(bar.x, bar.z)) {
        const barrierMat = resourceManager.getBarrierMaterial();
        this.acquiredMaterials.push('jersey_barrier');
        const barrierGeo = new THREE.BoxGeometry(2.4, 0.9, 0.5);
        this.localGeometries.push(barrierGeo);

        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(bar.x, 0.45, bar.z);
        barrier.rotation.y = bar.rot;
        barrier.castShadow = true;
        this.group.add(barrier);

        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(bar.x, 0.45, bar.z),
          new THREE.Vector3(2.4, 0.9, 0.8)
        ));
      }
    });

    // 5. Toxic Waste Drums & Biohazard Pools
    WorldConfig.TOXIC_BARRELS.forEach(tPos => {
      if (this.contains(tPos.x, tPos.z)) {
        const toxicMat = resourceManager.getToxicMaterial();
        this.acquiredMaterials.push('toxic_drum');
        const toxicGlowMat = resourceManager.getToxicGlowMaterial();
        this.acquiredMaterials.push('toxic_glow');

        const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.0, 12);
        this.localGeometries.push(drumGeo);
        const drum = new THREE.Mesh(drumGeo, toxicMat);
        drum.position.set(tPos.x, 0.5, tPos.z);
        drum.castShadow = true;
        this.group.add(drum);

        const spillGeo = new THREE.CircleGeometry(1.4, 16);
        this.localGeometries.push(spillGeo);
        const spill = new THREE.Mesh(spillGeo, toxicGlowMat);
        spill.rotation.x = -Math.PI / 2;
        spill.position.set(tPos.x + 0.3, 0.02, tPos.z + 0.3);
        this.group.add(spill);

        const toxicLight = new THREE.PointLight(0x22c55e, 1.5, 9);
        toxicLight.position.set(tPos.x, 0.8, tPos.z);
        this.group.add(toxicLight);
        this.lights.push(toxicLight);

        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tPos.x, 0.5, tPos.z),
          new THREE.Vector3(0.9, 1.0, 0.9)
        ));
      }
    });

    // 6. Abandoned Cabins in this Chunk
    WorldConfig.CABIN_SITES.forEach(cabin => {
      if (this.contains(cabin.x, cabin.z)) {
        this.buildCabin(cabin, resourceManager, stateStore);
      }
    });

    // 7. Wilderness Loot Caches in this Chunk
    WorldConfig.WILDERNESS_CACHES.forEach(cache => {
      if (this.contains(cache.x, cache.z)) {
        this.buildWildernessCache(cache, resourceManager, stateStore);
      }
    });

    // 8. Deterministic Forest Vegetation (Trees & Boulders)
    this.buildProceduralVegetation(resourceManager);

    this.state = CHUNK_STATE.ACTIVE;
  }

  // --------------------------------------------------------------------------
  // CABIN BUILDER
  // --------------------------------------------------------------------------
  buildCabin(cabin, resourceManager, stateStore) {
    const { x, z, name, crateId } = cabin;
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(x, 0, z);

    const woodMat = resourceManager.getCabinWoodMaterial();
    this.acquiredMaterials.push('cabin_wood');
    const roofMat = resourceManager.getCabinRoofMaterial();
    this.acquiredMaterials.push('cabin_roof');

    // 1. Back Wall
    const backGeo = new THREE.BoxGeometry(8.0, 3.8, 0.4);
    this.localGeometries.push(backGeo);
    const backWall = new THREE.Mesh(backGeo, woodMat);
    backWall.position.set(0, 1.9, -3.5);
    cabinGroup.add(backWall);

    // 2. Left Wall
    const sideGeo = new THREE.BoxGeometry(0.4, 3.8, 7.0);
    this.localGeometries.push(sideGeo);
    const leftWall = new THREE.Mesh(sideGeo, woodMat);
    leftWall.position.set(-3.8, 1.9, 0);
    cabinGroup.add(leftWall);

    // 3. Right Wall
    const rightWall = new THREE.Mesh(sideGeo, woodMat);
    rightWall.position.set(3.8, 1.9, 0);
    cabinGroup.add(rightWall);

    // 4. Front Wall with Doorway
    const frontSideGeo = new THREE.BoxGeometry(2.7, 3.8, 0.4);
    this.localGeometries.push(frontSideGeo);
    const frontLeft = new THREE.Mesh(frontSideGeo, woodMat);
    frontLeft.position.set(-2.65, 1.9, 3.5);
    cabinGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(frontSideGeo, woodMat);
    frontRight.position.set(2.65, 1.9, 3.5);
    cabinGroup.add(frontRight);

    this.obstacleMeshes.push(backWall, leftWall, rightWall, frontLeft, frontRight);

    // Lintel
    const lintelGeo = new THREE.BoxGeometry(2.6, 1.0, 0.4);
    this.localGeometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, woodMat);
    lintel.position.set(0, 3.3, 3.5);
    cabinGroup.add(lintel);

    // Interior Floor
    const floorGeo = new THREE.BoxGeometry(7.8, 0.25, 6.8);
    this.localGeometries.push(floorGeo);
    const cabinFloor = new THREE.Mesh(floorGeo, woodMat);
    cabinFloor.position.set(0, 0.12, 0);
    cabinGroup.add(cabinFloor);

    // Slanted Gable Roof
    const roofPanelGeo = new THREE.BoxGeometry(4.8, 0.25, 7.8);
    this.localGeometries.push(roofPanelGeo);
    const roofLeft = new THREE.Mesh(roofPanelGeo, roofMat);
    roofLeft.position.set(-2.0, 4.3, 0);
    roofLeft.rotation.z = Math.PI * 0.12;
    cabinGroup.add(roofLeft);

    const roofRight = new THREE.Mesh(roofPanelGeo, roofMat);
    roofRight.position.set(2.0, 4.3, 0);
    roofRight.rotation.z = -Math.PI * 0.12;
    cabinGroup.add(roofRight);

    // Front Porch & Posts
    const porchFloorGeo = new THREE.BoxGeometry(4.0, 0.2, 2.5);
    this.localGeometries.push(porchFloorGeo);
    const porchFloor = new THREE.Mesh(porchFloorGeo, woodMat);
    porchFloor.position.set(0, 0.1, 4.75);
    cabinGroup.add(porchFloor);

    const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 3.2, 6);
    this.localGeometries.push(postGeo);
    const postMat = resourceManager.getPineBarkMaterial();
    this.acquiredMaterials.push('pine_bark');
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-1.8, 1.6, 5.8);
    cabinGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(1.8, 1.6, 5.8);
    cabinGroup.add(postR);

    // Furniture: Table & Chair
    const tableGeo = new THREE.BoxGeometry(1.8, 0.85, 1.0);
    this.localGeometries.push(tableGeo);
    const table = new THREE.Mesh(tableGeo, postMat);
    table.position.set(-2.0, 0.45, -1.8);
    cabinGroup.add(table);

    const chairGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    this.localGeometries.push(chairGeo);
    const chair = new THREE.Mesh(chairGeo, postMat);
    chair.position.set(-1.2, 0.28, -0.8);
    chair.rotation.set(0.4, 0.6, 1.2);
    cabinGroup.add(chair);

    // Warm Interior Lantern
    const lantern = new THREE.PointLight(0xff9933, 0.85, 12);
    lantern.position.set(0, 2.4, 0);
    cabinGroup.add(lantern);
    this.lights.push(lantern);

    // Persistent Loot Crate
    const isLooted = stateStore && stateStore.isLooted(crateId);
    const crateGeo = new THREE.BoxGeometry(1.8, 1.2, 1.4);
    this.localGeometries.push(crateGeo);
    const crateMat = resourceManager.getCrateMaterial();
    this.acquiredMaterials.push('loot_crate');
    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(2.0, 0.6, -1.8);
    cabinGroup.add(crateMesh);

    // Indicator light: Green if loot is available, dim grey/red if already looted
    const indGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    this.localGeometries.push(indGeo);
    const indMat = new THREE.MeshBasicMaterial({
      color: isLooted ? 0x475569 : 0x10b981
    });
    const ind = new THREE.Mesh(indGeo, indMat);
    ind.position.set(2.0, 0.9, -1.08);
    cabinGroup.add(ind);

    this.group.add(cabinGroup);

    // Analytical Colliders for Cabin Walls & Furniture
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1.9, z - 3.5),
      new THREE.Vector3(8.0, 3.8, 0.4)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 3.8, 1.9, z),
      new THREE.Vector3(0.4, 3.8, 7.0)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 3.8, 1.9, z),
      new THREE.Vector3(0.4, 3.8, 7.0)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 2.65, 1.9, z + 3.5),
      new THREE.Vector3(2.7, 3.8, 0.4)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 2.65, 1.9, z + 3.5),
      new THREE.Vector3(2.7, 3.8, 0.4)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 2.0, 0.45, z - 1.8),
      new THREE.Vector3(1.8, 0.85, 1.0)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 2.0, 0.6, z - 1.8),
      new THREE.Vector3(1.8, 1.2, 1.4)
    ));

    // Register Interactable [E]
    this.interactables.push({
      id: crateId,
      type: 'loot_crate',
      position: new THREE.Vector3(x + 2.0, 0.6, z - 1.8),
      radius: 3.2,
      label: isLooted ? `Peti Kosong (${name})` : `Peti Jarahan (${name}) [E]`
    });
  }

  // --------------------------------------------------------------------------
  // WILDERNESS CACHE BUILDER
  // --------------------------------------------------------------------------
  buildWildernessCache(cache, resourceManager, stateStore) {
    const { id, x, z, label, type } = cache;
    const isLooted = stateStore && stateStore.isLooted(id);
    const cacheGroup = new THREE.Group();
    cacheGroup.position.set(x, 0, z);

    const crateMat = resourceManager.getCrateMaterial();
    this.acquiredMaterials.push('loot_crate');

    const boxGeo = new THREE.BoxGeometry(2.4, 1.4, 1.8);
    this.localGeometries.push(boxGeo);
    const box = new THREE.Mesh(boxGeo, crateMat);
    box.position.y = 0.7;
    cacheGroup.add(box);

    const lightGeo = new THREE.BoxGeometry(0.5, 0.25, 0.1);
    this.localGeometries.push(lightGeo);
    const panelMat = new THREE.MeshBasicMaterial({ color: isLooted ? 0x475569 : 0x10b981 });
    const light = new THREE.Mesh(lightGeo, panelMat);
    light.position.set(0, 1.0, 0.95);
    cacheGroup.add(light);

    if (type === 'truck') {
      const truckBodyGeo = new THREE.BoxGeometry(4.0, 2.5, 7.0);
      this.localGeometries.push(truckBodyGeo);
      const truckMat = new THREE.MeshStandardMaterial({ color: 0x223028, metalness: 0.7, roughness: 0.6 });
      const truck = new THREE.Mesh(truckBodyGeo, truckMat);
      truck.position.set(-3.5, 1.25, 0);
      truck.rotation.z = 0.25;
      cacheGroup.add(truck);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x - 3.5, 1.25, z),
        new THREE.Vector3(4.0, 2.5, 7.0)
      ));
    } else if (type === 'monolith') {
      const monoGeo = new THREE.BoxGeometry(1.6, 6.0, 1.6);
      this.localGeometries.push(monoGeo);
      const monoMat = new THREE.MeshStandardMaterial({ color: 0x18241b, roughness: 0.95 });
      const mono = new THREE.Mesh(monoGeo, monoMat);
      mono.position.set(2.5, 3.0, 0);
      cacheGroup.add(mono);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x + 2.5, 3.0, z),
        new THREE.Vector3(1.6, 6.0, 1.6)
      ));
    }

    this.group.add(cacheGroup);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 0.7, z),
      new THREE.Vector3(2.4, 1.4, 1.8)
    ));

    this.interactables.push({
      id,
      type: 'loot_crate',
      position: new THREE.Vector3(x, 0.7, z),
      radius: 3.2,
      label: isLooted ? `Peti Kosong [E]` : label
    });
  }

  // --------------------------------------------------------------------------
  // DETERMINISTIC PROCEDURAL VEGETATION PER CHUNK
  // --------------------------------------------------------------------------
  buildProceduralVegetation(resourceManager) {
    // Deterministic PRNG seed unique to this chunk
    let seed = Math.abs((this.cx * 73856093) ^ (this.cz * 19349663) ^ 54321) % 2147483647;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const clearings = [
      ...WorldConfig.CABIN_SITES.map(c => ({ x: c.x, z: c.z, r: 12 })),
      { x: 0, z: -80, r: 10 }, // Spawn area clearing
      { x: 0, z: -92, r: 14 }  // Evacuation pad clearing
    ];

    const pineBarkMat = resourceManager.getPineBarkMaterial();
    this.acquiredMaterials.push('pine_bark');
    const pineFoliageMat1 = resourceManager.getPineFoliageMaterial(1);
    this.acquiredMaterials.push('pine_foliage_1');
    const pineFoliageMat2 = resourceManager.getPineFoliageMaterial(2);
    this.acquiredMaterials.push('pine_foliage_2');
    const oakBarkMat = resourceManager.getOakBarkMaterial();
    this.acquiredMaterials.push('oak_bark');
    const oakFoliageMat = resourceManager.getOakFoliageMaterial();
    this.acquiredMaterials.push('oak_foliage');
    const deadWoodMat = resourceManager.getDeadWoodMaterial();
    this.acquiredMaterials.push('dead_wood');
    const rockMat = resourceManager.getRockMaterial();
    this.acquiredMaterials.push('rock_boulder');

    // Generate ~6-10 items per chunk
    const count = 6 + Math.floor(rnd() * 5);
    const margin = 2.5;

    for (let i = 0; i < count; i++) {
      const tx = this.minX + margin + rnd() * (WorldConfig.CHUNK_SIZE - margin * 2);
      const tz = this.minZ + margin + rnd() * (WorldConfig.CHUNK_SIZE - margin * 2);

      // Skip highway corridor (X between -4.5 and 4.5 and Z between -92 and 47)
      if (Math.abs(tx) < 4.5 && tz >= -92 && tz <= 47) continue;

      // Skip clearings
      let inClearing = false;
      for (const clr of clearings) {
        if (Math.hypot(tx - clr.x, tz - clr.z) < clr.r) {
          inClearing = true;
          break;
        }
      }
      if (inClearing) continue;

      const treeType = rnd();
      const scale = 0.85 + rnd() * 0.45;

      if (treeType < 0.55) {
        // Pine Tree
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.48 * scale, 10 * scale, 7);
        this.localGeometries.push(trunkGeo);
        const trunk = new THREE.Mesh(trunkGeo, pineBarkMat);
        trunk.position.y = 5 * scale;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const fMat = (i % 2 === 0) ? pineFoliageMat1 : pineFoliageMat2;
        const c1Geo = new THREE.ConeGeometry(3.6 * scale, 4.5 * scale, 6);
        const c2Geo = new THREE.ConeGeometry(2.7 * scale, 4.0 * scale, 6);
        const c3Geo = new THREE.ConeGeometry(1.8 * scale, 3.5 * scale, 6);
        this.localGeometries.push(c1Geo, c2Geo, c3Geo);

        const c1 = new THREE.Mesh(c1Geo, fMat);
        c1.position.y = 5.8 * scale;
        c1.castShadow = true;
        treeGroup.add(c1);

        const c2 = new THREE.Mesh(c2Geo, fMat);
        c2.position.y = 8.2 * scale;
        c2.castShadow = true;
        treeGroup.add(c2);

        const c3 = new THREE.Mesh(c3Geo, fMat);
        c3.position.y = 10.5 * scale;
        c3.castShadow = true;
        treeGroup.add(c3);

        this.group.add(treeGroup);
        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 5 * scale, tz),
          new THREE.Vector3(0.9 * scale, 10 * scale, 0.9 * scale)
        ));
      } else if (treeType < 0.80) {
        // Broadleaf Oak
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunkGeo = new THREE.CylinderGeometry(0.42 * scale, 0.6 * scale, 7 * scale, 8);
        this.localGeometries.push(trunkGeo);
        const trunk = new THREE.Mesh(trunkGeo, oakBarkMat);
        trunk.position.y = 3.5 * scale;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const fGeo = new THREE.DodecahedronGeometry(2.6 * scale);
        this.localGeometries.push(fGeo);
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

        this.group.add(treeGroup);
        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 3.5 * scale, tz),
          new THREE.Vector3(1.1 * scale, 7 * scale, 1.1 * scale)
        ));
      } else if (treeType < 0.92) {
        // Dead Horror Tree
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.45 * scale, 8 * scale, 6);
        this.localGeometries.push(trunkGeo);
        const trunk = new THREE.Mesh(trunkGeo, deadWoodMat);
        trunk.position.y = 4 * scale;
        trunk.rotation.z = (rnd() - 0.5) * 0.25;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const bGeo = new THREE.CylinderGeometry(0.1, 0.18, 3.5 * scale, 5);
        this.localGeometries.push(bGeo);
        const b1 = new THREE.Mesh(bGeo, deadWoodMat);
        b1.position.set(0.9 * scale, 5.8 * scale, 0);
        b1.rotation.z = -0.7;
        treeGroup.add(b1);

        const b2 = new THREE.Mesh(bGeo, deadWoodMat);
        b2.position.set(-0.8 * scale, 6.5 * scale, 0.4 * scale);
        b2.rotation.z = 0.8;
        b2.rotation.x = -0.4;
        treeGroup.add(b2);

        this.group.add(treeGroup);
        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 4 * scale, tz),
          new THREE.Vector3(0.8 * scale, 8 * scale, 0.8 * scale)
        ));
      } else {
        // Mossy Boulder
        const rockGeo = new THREE.DodecahedronGeometry(1.5 * scale);
        this.localGeometries.push(rockGeo);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(tx, 0.9 * scale, tz);
        rock.scale.set(1.0, 0.65, 1.3);
        rock.rotation.set(rnd() * 2, rnd() * 2, rnd() * 2);
        rock.castShadow = true;
        this.group.add(rock);

        this.colliders.push(new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(tx, 0.9 * scale, tz),
          new THREE.Vector3(2.5 * scale, 1.5 * scale, 2.5 * scale)
        ));
      }
    }
  }

  // --------------------------------------------------------------------------
  // DISPOSE & RESOURCE UNLOADING
  // --------------------------------------------------------------------------
  dispose(resourceManager) {
    this.state = CHUNK_STATE.UNLOADING;

    // 1. Remove all children from this chunk's Three.js Group
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }

    // 2. Dispose chunk-specific unshared geometries
    for (const geo of this.localGeometries) {
      if (geo && typeof geo.dispose === 'function') {
        geo.dispose();
      }
    }
    this.localGeometries = [];

    // 3. Release reference-counted shared materials
    if (resourceManager) {
      for (const matKey of this.acquiredMaterials) {
        resourceManager.releaseMaterial(matKey);
      }
    }
    this.acquiredMaterials = [];

    // 4. Clear runtime registries
    this.colliders = [];
    this.interactables = [];
    this.obstacleMeshes = [];
    this.animatedObjects = [];
    this.lights = [];

    this.state = CHUNK_STATE.UNLOADED;
  }
}
