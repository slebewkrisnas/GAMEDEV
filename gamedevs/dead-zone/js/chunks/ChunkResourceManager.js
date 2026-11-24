// ============================================================================
// CHUNK RESOURCE MANAGER — SHARED THREE.JS RESOURCE POOL & LIFECYCLE
// Implements reference counting and material/geometry reuse to ensure:
// 1. Zero redundant memory allocations
// 2. Safe .dispose() calls when resources reach 0 refcount
// 3. Absolute protection against GPU VRAM / RAM memory leaks
// ============================================================================

import * as THREE from 'three';

export class ChunkResourceManager {
  constructor() {
    this.materials = new Map(); // key -> { resource: Material, refCount: number }
    this.geometries = new Map(); // key -> { resource: BufferGeometry, refCount: number }
    this.textures = new Map(); // key -> Texture
  }

  // --------------------------------------------------------------------------
  // TEXTURE FACTORY & REUSE
  // --------------------------------------------------------------------------
  getForestFloorTexture() {
    if (this.textures.has('forest_floor')) {
      return this.textures.get('forest_floor');
    }

    if (typeof document === 'undefined' || !document.createElement) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#141d13';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const roll = Math.random();
      if (roll < 0.45) {
        ctx.fillStyle = `rgb(${Math.floor(25 + Math.random() * 25)}, ${Math.floor(45 + Math.random() * 35)}, ${Math.floor(20 + Math.random() * 20)})`;
      } else if (roll < 0.75) {
        ctx.fillStyle = `rgb(${Math.floor(45 + Math.random() * 30)}, ${Math.floor(30 + Math.random() * 20)}, ${Math.floor(15 + Math.random() * 15)})`;
      } else {
        ctx.fillStyle = `rgb(${Math.floor(15 + Math.random() * 20)}, ${Math.floor(20 + Math.random() * 15)}, ${Math.floor(15 + Math.random() * 10)})`;
      }
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Scaled for 40m chunk
    this.textures.set('forest_floor', texture);
    return texture;
  }

  getWoodPlankTexture() {
    if (this.textures.has('wood_plank')) {
      return this.textures.get('wood_plank');
    }

    if (typeof document === 'undefined' || !document.createElement) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#2b1d14';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 32;
    for (let y = 0; y < 512; y += plankHeight) {
      ctx.fillStyle = (y / plankHeight) % 2 === 0 ? '#38261b' : '#2e1f16';
      ctx.fillRect(0, y, 512, plankHeight - 2);

      ctx.fillStyle = '#140c07';
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);

      ctx.strokeStyle = '#1e140d';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        const gy = y + 4 + Math.random() * 20;
        ctx.moveTo(0, gy);
        ctx.lineTo(512, gy + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }

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
    this.textures.set('wood_plank', texture);
    return texture;
  }

  // --------------------------------------------------------------------------
  // REFERENCE COUNTED MATERIAL POOL
  // --------------------------------------------------------------------------
  acquireMaterial(key, factoryFn) {
    let entry = this.materials.get(key);
    if (!entry) {
      const mat = factoryFn();
      entry = { resource: mat, refCount: 0 };
      this.materials.set(key, entry);
    }
    entry.refCount++;
    return entry.resource;
  }

  releaseMaterial(key) {
    const entry = this.materials.get(key);
    if (!entry) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      if (entry.resource && typeof entry.resource.dispose === 'function') {
        entry.resource.dispose();
      }
      this.materials.delete(key);
    }
  }

  // --------------------------------------------------------------------------
  // REFERENCE COUNTED GEOMETRY POOL
  // --------------------------------------------------------------------------
  acquireGeometry(key, factoryFn) {
    let entry = this.geometries.get(key);
    if (!entry) {
      const geo = factoryFn();
      entry = { resource: geo, refCount: 0 };
      this.geometries.set(key, entry);
    }
    entry.refCount++;
    return entry.resource;
  }

  releaseGeometry(key) {
    const entry = this.geometries.get(key);
    if (!entry) return;
    entry.refCount--;
    if (entry.refCount <= 0) {
      if (entry.resource && typeof entry.resource.dispose === 'function') {
        entry.resource.dispose();
      }
      this.geometries.delete(key);
    }
  }

  // --------------------------------------------------------------------------
  // PRE-CONFIGURED STANDARD MATERIALS
  // --------------------------------------------------------------------------
  getGroundMaterial() {
    return this.acquireMaterial('ground_forest', () => {
      const tex = this.getForestFloorTexture();
      return new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : 0x141d13,
        roughness: 0.92,
        metalness: 0.04
      });
    });
  }

  getRoadMaterial() {
    return this.acquireMaterial('road_asphalt', () => {
      return new THREE.MeshStandardMaterial({
        color: 0x181e19,
        roughness: 0.95,
        metalness: 0.05
      });
    });
  }

  getPineBarkMaterial() {
    return this.acquireMaterial('pine_bark', () => new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.92 }));
  }

  getPineFoliageMaterial(variant = 1) {
    const key = `pine_foliage_${variant}`;
    const color = variant === 1 ? 0x142b1a : 0x1b3823;
    return this.acquireMaterial(key, () => new THREE.MeshStandardMaterial({ color, roughness: 0.88 }));
  }

  getOakBarkMaterial() {
    return this.acquireMaterial('oak_bark', () => new THREE.MeshStandardMaterial({ color: 0x2b1e15, roughness: 0.95 }));
  }

  getOakFoliageMaterial() {
    return this.acquireMaterial('oak_foliage', () => new THREE.MeshStandardMaterial({ color: 0x1e3620, roughness: 0.85 }));
  }

  getDeadWoodMaterial() {
    return this.acquireMaterial('dead_wood', () => new THREE.MeshStandardMaterial({ color: 0x1f1913, roughness: 0.98 }));
  }

  getRockMaterial() {
    return this.acquireMaterial('rock_boulder', () => new THREE.MeshStandardMaterial({ color: 0x222e23, roughness: 0.92, metalness: 0.05 }));
  }

  getCabinWoodMaterial() {
    return this.acquireMaterial('cabin_wood', () => {
      const tex = this.getWoodPlankTexture();
      return new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : 0x2b1d14,
        roughness: 0.88,
        metalness: 0.05
      });
    });
  }

  getCabinRoofMaterial() {
    return this.acquireMaterial('cabin_roof', () => new THREE.MeshStandardMaterial({
      color: 0x1f2e21,
      roughness: 0.9,
      metalness: 0.05
    }));
  }

  getBarrierMaterial() {
    return this.acquireMaterial('jersey_barrier', () => new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
  }

  getBarrelMaterial() {
    return this.acquireMaterial('oil_barrel', () => new THREE.MeshStandardMaterial({ color: 0x2e1a12, roughness: 0.7, metalness: 0.4 }));
  }

  getFlameMaterial() {
    return this.acquireMaterial('fire_flame', () => new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 2.8,
      roughness: 0.2
    }));
  }

  getToxicMaterial() {
    return this.acquireMaterial('toxic_drum', () => new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.5, metalness: 0.6 }));
  }

  getToxicGlowMaterial() {
    return this.acquireMaterial('toxic_glow', () => new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 1.8,
      roughness: 0.2
    }));
  }

  getCrateMaterial() {
    return this.acquireMaterial('loot_crate', () => new THREE.MeshStandardMaterial({
      color: 0x3b4554,
      metalness: 0.6,
      roughness: 0.4
    }));
  }

  // --------------------------------------------------------------------------
  // CLEANUP EVERYTHING ON SHUTDOWN
  // --------------------------------------------------------------------------
  disposeAll() {
    for (const [key, entry] of this.materials.entries()) {
      if (entry.resource && typeof entry.resource.dispose === 'function') {
        entry.resource.dispose();
      }
    }
    this.materials.clear();

    for (const [key, entry] of this.geometries.entries()) {
      if (entry.resource && typeof entry.resource.dispose === 'function') {
        entry.resource.dispose();
      }
    }
    this.geometries.clear();

    for (const [key, tex] of this.textures.entries()) {
      if (tex && typeof tex.dispose === 'function') {
        tex.dispose();
      }
    }
    this.textures.clear();
  }
}
