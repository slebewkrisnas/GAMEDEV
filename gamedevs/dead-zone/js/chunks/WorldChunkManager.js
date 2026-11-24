// ============================================================================
// WORLD CHUNK MANAGER — DYNAMIC WORLD STREAMING ORCHESTRATOR
// Coordinates chunk life-cycles, prioritized asynchronous streaming,
// predictive preloading, hysteresis unloading, collision spatial indexing,
// and zero-leak resource disposal.
// ============================================================================

import * as THREE from 'three';
import { WorldConfig } from './WorldConfig.js';
import { Chunk, CHUNK_STATE } from './Chunk.js';
import { ChunkResourceManager } from './ChunkResourceManager.js';
import { ChunkStateStore } from './ChunkStateStore.js';

export class WorldChunkManager {
  constructor(parentSceneOrGroup) {
    this.parentGroup = parentSceneOrGroup;

    this.resourceManager = new ChunkResourceManager();
    this.stateStore = new ChunkStateStore();

    // Registry of all instantiated chunks: key 'cx_cz' -> Chunk
    this.chunks = new Map();

    // Currently loaded and actively rendered chunks
    this.activeChunks = new Set();

    // Priority queue of chunks waiting to be built
    this.loadQueue = [];

    // Current player chunk coordinates
    this.playerChunkX = 0;
    this.playerChunkZ = 0;

    // Scan timer throttle (updates grid queries every 80ms)
    this.scanCooldown = 0;
    this.scanInterval = 0.08;

    // Fast-lookup caches
    this.cachedColliders = [];
    this.cachedInteractables = [];
    this.cachedObstacles = [];
    this.cacheDirty = true;
  }

  // --------------------------------------------------------------------------
  // COORDINATE UTILITIES
  // --------------------------------------------------------------------------
  worldToChunkCoord(x, z) {
    const size = WorldConfig.CHUNK_SIZE;
    return {
      cx: Math.floor((x + size / 2) / size),
      cz: Math.floor((z + size / 2) / size)
    };
  }

  getChunk(cx, cz) {
    const key = `${cx}_${cz}`;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  // --------------------------------------------------------------------------
  // MAIN UPDATE LOOP (Invoked each frame)
  // --------------------------------------------------------------------------
  update(playerPos, playerLookDir = null, playerVelocity = null, delta = 0.016) {
    if (!playerPos) return;

    const px = playerPos.x;
    const pz = playerPos.z;

    this.scanCooldown -= delta;
    if (this.scanCooldown <= 0) {
      this.scanCooldown = this.scanInterval;
      this.evaluateStreaming(px, pz, playerLookDir, playerVelocity);
    }

    // Process rate-limited building from load queue (max 1 chunk per frame)
    this.processLoadQueue();

    // Animate active chunk effects (fire flickering, etc.)
    this.updateActiveAnimations(delta);
  }

  // --------------------------------------------------------------------------
  // EVALUATE STREAMING (Queueing & Hysteresis Unloading)
  // --------------------------------------------------------------------------
  evaluateStreaming(px, pz, lookDir, velocity) {
    const currentCoord = this.worldToChunkCoord(px, pz);
    this.playerChunkX = currentCoord.cx;
    this.playerChunkZ = currentCoord.cz;

    const loadRadius = WorldConfig.LOAD_RADIUS_CHUNKS;
    const unloadDist = WorldConfig.UNLOAD_RADIUS_CHUNKS * WorldConfig.CHUNK_SIZE;

    // Compute player velocity direction and look direction
    let dirX = 0;
    let dirZ = -1;
    if (lookDir) {
      if (typeof lookDir.x === 'number' && typeof lookDir.z === 'number') {
        const len = Math.hypot(lookDir.x, lookDir.z) || 1;
        dirX = lookDir.x / len;
        dirZ = lookDir.z / len;
      }
    }

    // Add velocity prediction bias
    let predX = px;
    let predZ = pz;
    if (velocity && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1)) {
      predX += velocity.x * 1.5;
      predZ += velocity.z * 1.5;
    }

    // 1. Identify chunks that should be loaded
    const neededChunks = [];
    const minChunkX = Math.floor((WorldConfig.BOUNDS.minX + WorldConfig.CHUNK_SIZE / 2) / WorldConfig.CHUNK_SIZE);
    const maxChunkX = Math.floor((WorldConfig.BOUNDS.maxX + WorldConfig.CHUNK_SIZE / 2) / WorldConfig.CHUNK_SIZE);
    const minChunkZ = Math.floor((WorldConfig.BOUNDS.minZ + WorldConfig.CHUNK_SIZE / 2) / WorldConfig.CHUNK_SIZE);
    const maxChunkZ = Math.floor((WorldConfig.BOUNDS.maxZ + WorldConfig.CHUNK_SIZE / 2) / WorldConfig.CHUNK_SIZE);

    for (let dx = -loadRadius; dx <= loadRadius; dx++) {
      for (let dz = -loadRadius; dz <= loadRadius; dz++) {
        const cx = this.playerChunkX + dx;
        const cz = this.playerChunkZ + dz;

        // Keep within world bounds
        if (cx < minChunkX - 1 || cx > maxChunkX + 1 || cz < minChunkZ - 1 || cz > maxChunkZ + 1) {
          continue;
        }

        const chunk = this.getChunk(cx, cz);
        if (chunk.state === CHUNK_STATE.UNLOADED) {
          // Calculate priority score: lower score = loaded earlier
          const distToPlayer = Math.hypot(chunk.centerX - px, chunk.centerZ - pz);
          const distToPred = Math.hypot(chunk.centerX - predX, chunk.centerZ - predZ);

          // Dot product with look direction
          const toChunkX = chunk.centerX - px;
          const toChunkZ = chunk.centerZ - pz;
          const toLen = Math.hypot(toChunkX, toChunkZ) || 1;
          const dot = (toChunkX / toLen) * dirX + (toChunkZ / toLen) * dirZ;

          // Chunks in front receive significant priority boost
          const lookBonus = dot > 0 ? (dot * 25.0) : 0;
          const score = (distToPlayer * 0.6 + distToPred * 0.4) - lookBonus;

          neededChunks.push({ chunk, score });
        }
      }
    }

    // Sort queue by priority score (ascending)
    neededChunks.sort((a, b) => a.score - b.score);
    this.loadQueue = neededChunks.map(item => item.chunk);

    // 2. Hysteresis Unloading: Unload chunks that exceed unload distance
    for (const chunk of this.activeChunks) {
      const dist = Math.hypot(chunk.centerX - px, chunk.centerZ - pz);
      if (dist > unloadDist) {
        this.unloadChunk(chunk);
      }
    }
  }

  // --------------------------------------------------------------------------
  // RATE-LIMITED CHUNK LOADER
  // --------------------------------------------------------------------------
  processLoadQueue() {
    if (this.loadQueue.length === 0) return;

    let buildsThisFrame = 0;
    while (this.loadQueue.length > 0 && buildsThisFrame < WorldConfig.MAX_BUILDS_PER_FRAME) {
      const chunk = this.loadQueue.shift();
      if (chunk.state === CHUNK_STATE.UNLOADED) {
        chunk.build(this.resourceManager, this.stateStore);
        if (this.parentGroup && chunk.group) {
          this.parentGroup.add(chunk.group);
        }
        this.activeChunks.add(chunk);
        this.cacheDirty = true;
        buildsThisFrame++;
      }
    }
  }

  // --------------------------------------------------------------------------
  // CHUNK UNLOADER
  // --------------------------------------------------------------------------
  unloadChunk(chunk) {
    if (!chunk || chunk.state !== CHUNK_STATE.ACTIVE) return;

    if (this.parentGroup && chunk.group) {
      this.parentGroup.remove(chunk.group);
    }
    chunk.dispose(this.resourceManager);
    this.activeChunks.delete(chunk);
    this.cacheDirty = true;
  }

  // --------------------------------------------------------------------------
  // IMMEDIATE SYNCHRONOUS PRE-WARM (For Spawn / Zone Entry)
  // --------------------------------------------------------------------------
  preloadInitialChunks(x, z, radiusChunks = 2) {
    const center = this.worldToChunkCoord(x, z);
    for (let dx = -radiusChunks; dx <= radiusChunks; dx++) {
      for (let dz = -radiusChunks; dz <= radiusChunks; dz++) {
        const cx = center.cx + dx;
        const cz = center.cz + dz;
        const chunk = this.getChunk(cx, cz);
        if (chunk.state === CHUNK_STATE.UNLOADED) {
          chunk.build(this.resourceManager, this.stateStore);
          if (this.parentGroup && chunk.group) {
            this.parentGroup.add(chunk.group);
          }
          this.activeChunks.add(chunk);
        }
      }
    }
    this.rebuildCaches();
  }

  // --------------------------------------------------------------------------
  // CACHE REBUILDER FOR FAST SPATIAL LOOKUPS
  // --------------------------------------------------------------------------
  rebuildCaches() {
    this.cachedColliders = [];
    this.cachedInteractables = [];
    this.cachedObstacles = [];

    for (const chunk of this.activeChunks) {
      for (let i = 0; i < chunk.colliders.length; i++) {
        this.cachedColliders.push(chunk.colliders[i]);
      }
      for (let i = 0; i < chunk.interactables.length; i++) {
        this.cachedInteractables.push(chunk.interactables[i]);
      }
      for (let i = 0; i < chunk.obstacleMeshes.length; i++) {
        this.cachedObstacles.push(chunk.obstacleMeshes[i]);
      }
    }
    this.cacheDirty = false;
  }

  getColliders() {
    if (this.cacheDirty) this.rebuildCaches();
    return this.cachedColliders;
  }

  getInteractables() {
    if (this.cacheDirty) this.rebuildCaches();
    return this.cachedInteractables;
  }

  getObstacleMeshes() {
    if (this.cacheDirty) this.rebuildCaches();
    return this.cachedObstacles;
  }

  // --------------------------------------------------------------------------
  // SPATIAL FAST COLLISION TEST
  // --------------------------------------------------------------------------
  checkCollision(x, z, radius = 0.5, feetY = 0) {
    if (this.cacheDirty) this.rebuildCaches();

    const minX = x - radius;
    const maxX = x + radius;
    const minZ = z - radius;
    const maxZ = z + radius;

    const colliders = this.cachedColliders;
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

  // --------------------------------------------------------------------------
  // ANIMATION EFFECTS FOR ACTIVE CHUNKS
  // --------------------------------------------------------------------------
  updateActiveAnimations(delta) {
    const time = performance.now() * 0.001;
    for (const chunk of this.activeChunks) {
      for (const anim of chunk.animatedObjects) {
        if (anim.type === 'fire_flicker') {
          const flicker = Math.sin(time * 16 + anim.idx * 2) * 0.35 + Math.cos(time * 27) * 0.15;
          anim.light.intensity = anim.baseIntensity + flicker;
          anim.mesh.scale.set(1.0 + flicker * 0.12, 1.0 + flicker * 0.2, 1.0 + flicker * 0.12);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // PERSISTENCE HELPERS
  // --------------------------------------------------------------------------
  markLooted(crateId) {
    this.stateStore.markLooted(crateId);
    // Refresh label in active chunks if currently rendered
    for (const chunk of this.activeChunks) {
      for (const item of chunk.interactables) {
        if (item.id === crateId) {
          item.label = 'Peti Kosong [E]';
        }
      }
    }
  }

  isLooted(crateId) {
    return this.stateStore.isLooted(crateId);
  }

  // --------------------------------------------------------------------------
  // CLEANUP ON DISPOSE
  // --------------------------------------------------------------------------
  dispose() {
    for (const chunk of this.activeChunks) {
      if (this.parentGroup && chunk.group) {
        this.parentGroup.remove(chunk.group);
      }
      chunk.dispose(this.resourceManager);
    }
    this.activeChunks.clear();
    this.chunks.clear();
    this.loadQueue = [];
    this.cachedColliders = [];
    this.cachedInteractables = [];
    this.cachedObstacles = [];
    this.cacheDirty = false;
    this.resourceManager.disposeAll();
  }
}
