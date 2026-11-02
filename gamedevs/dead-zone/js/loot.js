// ============================================================================
// SCI-FI LOOT & EXTRACTION SYSTEM
// Handles dropped loot items in 3D world, cargo crate looting, and pickup checks
// ============================================================================

import * as THREE from 'three';
import { GameState, ITEMS } from './gameState.js';
import { sound } from './audio.js';

export class LootManager {
  constructor(scene, environment = null) {
    this.scene = scene;
    this.environment = environment;
    this.drops = []; // Active world item pickups
    this.lootGroup = new THREE.Group();
    this.scene.add(this.lootGroup);

    this.lootedCrates = new Set();
    this.noticeCooldown = 0;
  }

  // Spawn a 3D glowing drop at the mutant's demise position
  spawnDrop(position, isBoss = false) {
    if (isBoss) {
      // Boss drops 4 guaranteed high-value items scattered in a ring
      const bossDrops = [
        { ...ITEMS.XENON_CORE },
        { ...ITEMS.POWER_CONVERTER },
        { ...ITEMS.BIO_TISSUE },
        { ...ITEMS.XENON_CORE }
      ];

      bossDrops.forEach((item, idx) => {
        const angle = (idx / bossDrops.length) * Math.PI * 2;
        const radius = 2.0;
        const dropX = position.x + Math.cos(angle) * radius;
        const dropZ = position.z + Math.sin(angle) * radius;
        this._createDropMesh(dropX, dropZ, item);
      });
      return;
    }

    // Regular zombie: 75% chance to drop loot
    if (Math.random() > 0.75) return;

    const roll = Math.random();
    let itemData;

    if (roll < 0.25) {
      itemData = { ...ITEMS.XENON_CORE };
    } else if (roll < 0.75) {
      itemData = { ...ITEMS.BIO_TISSUE };
    } else {
      itemData = { ...ITEMS.SCRAP_METAL };
    }

    this._createDropMesh(position.x, position.z, itemData);
  }

  _createDropMesh(x, z, itemData) {
    const groundY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(x, z)
      : 0;
    const spawnY = groundY + 0.65;

    let color = 0x00e5ff;
    if (itemData.id === 'xenon_core') color = 0x00e5ff;
    else if (itemData.id === 'bio_tissue') color = 0xa855f7;
    else if (itemData.id === 'power_converter') color = 0x38bdf8;
    else color = 0xf59e0b;

    // Create 3D spinning glowing pickup mesh
    const geo = new THREE.OctahedronGeometry(0.38, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, spawnY, z);

    this.lootGroup.add(mesh);

    this.drops.push({
      itemData,
      mesh,
      spawnY: spawnY,
      rotSpeed: 2.5
    });
  }

  // Handle looting a Cargo Container [E]
  lootCrate(crateId, uiManager) {
    if (this.lootedCrates.has(crateId)) {
      if (uiManager) uiManager.showAnnouncement('KONTAINER KOSONG', 'Kontainer ini sudah dijarah.', 1.5);
      return;
    }

    if (GameState.backpack.length >= GameState.backpackMaxSlots) {
      if (uiManager) uiManager.showAnnouncement('TAS PENUH!', 'Kapasitas ransel penuh! Simpan di Safehouse.', 2.0);
      return;
    }

    // Determine container contents (Scrap Metal 65%, Power Converter 35%)
    const isPowerConverter = Math.random() < 0.35;
    const item = isPowerConverter ? { ...ITEMS.POWER_CONVERTER } : { ...ITEMS.SCRAP_METAL };

    GameState.addItemToBackpack(item);
    this.lootedCrates.add(crateId);
    sound.playLootSound();

    if (uiManager) {
      uiManager.showAnnouncement('JARAHAN DIDAPAT!', `${item.icon} ${item.name} (${GameState.formatRp(item.value)})`, 2.5);
      uiManager.updateHUD();
    }
  }

  // Update loop for rotating drops and proximity auto-pickup
  update(delta, playerPos, uiManager) {
    if (this.noticeCooldown > 0) {
      this.noticeCooldown -= delta;
    }

    const time = performance.now() * 0.001;

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      // Animate rotation & bobbing
      drop.mesh.rotation.y += drop.rotSpeed * delta;
      drop.mesh.position.y = drop.spawnY + Math.sin(time * 3.0) * 0.15;

      // Distance check to player
      const dist = playerPos.distanceTo(drop.mesh.position);
      if (dist < 1.8) {
        if (GameState.backpack.length < GameState.backpackMaxSlots) {
          GameState.addItemToBackpack(drop.itemData);
          sound.playLootSound();

          if (uiManager) {
            uiManager.showAnnouncement(
              'BURUAN DIAMBIL!',
              `+1 ${drop.itemData.icon} ${drop.itemData.name} (${GameState.formatRp(drop.itemData.value)})`,
              1.8
            );
            uiManager.updateHUD();
          }

          // Remove pickup mesh from 3D world
          this.lootGroup.remove(drop.mesh);
          drop.mesh.geometry.dispose();
          drop.mesh.material.dispose();
          this.drops.splice(i, 1);
        } else if (this.noticeCooldown <= 0) {
          if (uiManager) {
            uiManager.showAnnouncement('TAS RANSEL PENUH!', 'Tidak dapat mengambil hasil buruan.', 1.5);
          }
          this.noticeCooldown = 2.0;
        }
      }
    }
  }

  // Clear all drops when switching zones
  clearDrops() {
    for (const drop of this.drops) {
      this.lootGroup.remove(drop.mesh);
      drop.mesh.geometry.dispose();
      drop.mesh.material.dispose();
    }
    this.drops = [];
  }
}

