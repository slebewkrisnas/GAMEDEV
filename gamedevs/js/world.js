// ============================================================================
// 3D WALKING GAME - WORLD & COLLISION MODULE (ZOMBIE SURVIVOR OUTPOST)
// ============================================================================

import * as THREE from 'three';
import {
  createZombieOutpostWorld,
  updateZombieOutpostWorld,
  resolveOutpostCollisions,
  ZOMBIE_PORTAL_POS,
  ZOMBIE_SPAWN_POS
} from './zombie_outpost_world.js';

// ==================== KONFIGURASI DUNIA ====================
export const WORLD_RADIUS = 40;
export const MAP_SIZE = 80;
export const SPAWN_POS = ZOMBIE_SPAWN_POS; // (-4.0, 0, 1.5) dekat api unggun kamp

// ==================== COLLISION SYSTEM ====================
export const collisionWalls = [];
export const PLAYER_RADIUS = 0.45;
export const WALL_THICKNESS = 0.3;

export function addWallSegment(x1, z1, x2, z2) {
  collisionWalls.push({
    minX: Math.min(x1, x2) - WALL_THICKNESS / 2,
    maxX: Math.max(x1, x2) + WALL_THICKNESS / 2,
    minZ: Math.min(z1, z2) - WALL_THICKNESS / 2,
    maxZ: Math.max(z1, z2) + WALL_THICKNESS / 2
  });
}

export function resolveWallCollisions(pos, prevPos = null) {
  // 1. Collision System Outpost (Continuous Segments, OBB & Circle Colliders untuk Dinding Palisade, Tenda, Drum, Mobil, dsb)
  resolveOutpostCollisions(pos, prevPos);

  // 2. Tabrakan Dinding Kotak Tambahan jika ada
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

  // 3. Batas Map Luar (Clamp 40m)
  const maxSafe = 38.5;
  if (pos.x < -maxSafe) pos.x = -maxSafe;
  if (pos.x > maxSafe)  pos.x = maxSafe;
  if (pos.z < -maxSafe) pos.z = -maxSafe;
  if (pos.z > maxSafe)  pos.z = maxSafe;
}

// ==================== BANGUN DUNIA ZOMBIE OUTPOST ====================
export function createWorld(scene) {
  return createZombieOutpostWorld(scene);
}
