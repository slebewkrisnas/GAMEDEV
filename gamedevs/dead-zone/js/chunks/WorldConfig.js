// ============================================================================
// WORLD CONFIG — DYNAMIC CHUNK STREAMING SYSTEM
// Centralized configuration for chunk dimensions, loading radii, hysteresis,
// rate limits, and Sector-7 wasteland feature coordinates.
// ============================================================================

export const WorldConfig = {
  // Grid Dimensions
  CHUNK_SIZE: 40,               // 40 meters per chunk
  LOAD_RADIUS_CHUNKS: 2,        // 2 chunks radius (approx 80-90m around player)
  UNLOAD_RADIUS_CHUNKS: 3.2,    // 3.2 chunks radius (approx 128m) — creates solid hysteresis buffer

  // Performance & Concurrency Controls
  MAX_BUILDS_PER_FRAME: 1,      // Build max 1 chunk per frame to guarantee 60 FPS without frame drops
  UPDATE_INTERVAL: 0.1,         // Update grid scanning every 100ms (10 times/sec) to save CPU cycles
  PREDICTION_DISTANCE: 25.0,    // Meters ahead to bias loading towards player movement direction
  LOOK_AHEAD_BIAS: 1.6,         // Priority multiplier for chunks in front of player camera

  // World Bounds for Sector-7
  BOUNDS: {
    minX: -130,
    maxX: 130,
    minZ: -130,
    maxZ: 130
  },

  // Permanent Feature Locations in Sector-7
  CABIN_SITES: [
    { x: -45, z: -25, name: 'Pondok Penjaga Hutan', crateId: 'crate_cabin_1' },
    { x: 55, z: -15, name: 'Lab Riset Biologis', crateId: 'crate_cabin_2' },
    { x: -35, z: 50, name: 'Gudang Pemburu Terbengkalai', crateId: 'crate_cabin_3' },
    { x: 45, z: 65, name: 'Pos Pantau Reruntuhan', crateId: 'crate_cabin_4' }
  ],

  WILDERNESS_CACHES: [
    { id: 'crate_wreck_1', x: 0, z: 20, label: 'Kargo Truk Terguling [E]', type: 'truck' },
    { id: 'crate_shrine_1', x: -70, z: 25, label: 'Peti Altar Berlumut [E]', type: 'monolith' },
    { id: 'crate_camp_1', x: 25, z: -45, label: 'Peti Perkemahan Terbengkalai [E]', type: 'tent' },
    { id: 'crate_lookout_1', x: -65, z: -60, label: 'Peti Sisa Perbekalan Hutan [E]', type: 'timber' }
  ],

  BURNING_BARRELS: [
    { x: -3.0, z: -65 },
    { x: 3.2, z: -35 },
    { x: -3.4, z: -5 },
    { x: 3.0, z: 25 }
  ],

  BARRIERS: [
    { x: -1.6, z: -70, rot: 0.2 },
    { x: 2.2, z: -46, rot: -0.15 },
    { x: -2.0, z: -16, rot: 0.25 },
    { x: 1.8, z: 14, rot: -0.2 }
  ],

  TOXIC_BARRELS: [
    { x: -18, z: -42 },
    { x: 22, z: -28 },
    { x: -22, z: 20 },
    { x: 24, z: 45 }
  ]
};
