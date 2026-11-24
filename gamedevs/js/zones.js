// ============================================================================
// 3D WALKING GAME - ZONES & PORTAL ROUTING (ZOMBIE SURVIVOR OUTPOST)
// ============================================================================

import * as THREE from 'three';
import {
  ZOMBIE_PORTAL_POS,
  getOutpostPortalLight,
  updateZombieOutpostWorld
} from './zombie_outpost_world.js';

// ==================== KOORDINAT WAYPOINTS & ZONA ====================
// Portal Dimensi Anomali Menuju Dead Zone
export const CAMP_PORTAL_POS = ZOMBIE_PORTAL_POS; // (19.6, 0, -4.8)
export const PORTAL_POS = CAMP_PORTAL_POS;

// Watchtower Pos Pengintai (Utara)
export const ARENA_PORTAL_POS = new THREE.Vector3(2.3, 0, -9.6);

// Gerbang Utama Barikade (Selatan)
export const KIOSK_POS = new THREE.Vector3(7.2, 0, 10.1);

// Pusat Api Unggun Penyintas (Barat)
export const CAMPFIRE_POS = new THREE.Vector3(-7.2, 0, 0.4);

// Lampu & Efek Portal
export let portalLight = null;
export let campPortalLight = null;
export let arenaPortalLight = null;

export function createZones(scene) {
  campPortalLight = getOutpostPortalLight();
  portalLight = campPortalLight;

  console.log('[Zones] Zombie Survivor Outpost Zones Initialized.');
}

export function updateZones(delta, elapsed) {
  // Update animasi dunia (api unggun berkedip, lampu sorot menara, portal denyut, NPC)
  updateZombieOutpostWorld(delta, elapsed);

  if (!campPortalLight) {
    campPortalLight = getOutpostPortalLight();
    portalLight = campPortalLight;
  }
}
