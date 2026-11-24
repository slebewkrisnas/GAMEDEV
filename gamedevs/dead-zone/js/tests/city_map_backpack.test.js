// ============================================================================
// CITY MAP, PERIMETER WALLS, NIGHT ATMOSPHERE, & BACKPACK 32-SLOT TEST SUITE
// Verifies:
// 1. Player backpack capacity upgraded to 32 base slots (tiers: 32 -> 48 -> 64).
// 2. Map bounds updated to 300m x 300m (X: [-150, 150], Z: [-150, 150]).
// 3. Perimeter concrete barrier walls at +/-150 with working Box3 colliders.
// 4. Center Radio Tower (Extraction Beacon) at (0, 0) with active extraction trigger.
// 5. Dark apocalyptic nighttime atmosphere (background 0x060910 & night fog).
// 6. Random edge spawn for player entering Sector-7 (North, South, East, West edges).
// 7. Zombie wave spawn distribution across the 300x300m urban layout.
// ============================================================================

// Mock browser globals for Node.js test environment
const noop = () => {};
const ctxProxy = new Proxy({
  width: 512,
  height: 512,
  measureText: () => ({ width: 50 }),
  fillRect: noop,
  clearRect: noop,
  beginPath: noop,
  arc: noop,
  fill: noop,
  stroke: noop
}, {
  get: (target, prop) => {
    if (prop in target) return target[prop];
    return noop;
  },
  set: () => true
});

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 512,
        height: 512,
        getContext: () => ctxProxy
      };
    }
    return {
      addEventListener: noop,
      removeEventListener: noop,
      src: ''
    };
  },
  createElementNS: (ns, tag) => global.document.createElement(tag),
  pointerLockElement: null,
  addEventListener: noop,
  removeEventListener: noop
};
global.window = undefined;
process.on('unhandledRejection', () => {});

import assert from 'node:assert';
import * as THREE from '../libs/three.module.js';
import { GameState, ITEMS, BACKPACK_TIERS } from '../gameState.js';
import { EnvironmentDual } from '../environment_dual.js';
import { WaveManager } from '../waves.js';

// Setup Mock Environment for Three.js headless Node.js
const mockScene = new THREE.Scene();
const mockPlayer = {
  position: new THREE.Vector3(0, 1.7, 0),
  yaw: 0,
  teleport(x, y, z) {
    this.position.set(x, y, z);
  }
};

console.log('--- RUNNING CITY MAP & BACKPACK TEST SUITE ---');

// ----------------------------------------------------------------------------
// TEST 1: Backpack Capacity Upgraded to 32 Slots
// ----------------------------------------------------------------------------
console.log('Test 1: Verifying backpack base capacity 32 slots & upgrade tiers...');
GameState.reset();
assert.strictEqual(GameState.backpackMaxSlots, 32, 'Initial backpack capacity must be 32 slots');
assert.strictEqual(BACKPACK_TIERS[0].slots, 32, 'Tier 1 must have 32 slots');
assert.strictEqual(BACKPACK_TIERS[1].slots, 48, 'Tier 2 must have 48 slots');
assert.strictEqual(BACKPACK_TIERS[2].slots, 64, 'Tier 3 must have 64 slots');

// Fill 32 items
for (let i = 0; i < 32; i++) {
  const added = GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
  assert.strictEqual(added, true, `Item #${i + 1} should fit in 32-slot backpack`);
}
assert.strictEqual(GameState.backpack.length, 32, 'Backpack should hold 32 items');

// 33rd item must overflow
const overflow = GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
assert.strictEqual(overflow, false, '33rd item must be rejected when capacity is 32');

// Upgrade to Tier 2
GameState.addRp(200000);
const upRes = GameState.upgradeBackpack();
assert.strictEqual(upRes.success, true, 'Upgrade to Tier 2 should succeed');
assert.strictEqual(GameState.backpackMaxSlots, 48, 'Tier 2 backpack should expand to 48 slots');
console.log('  -> PASS: Backpack capacity is 32 base slots and upgrades to 48/64.');

// ----------------------------------------------------------------------------
// TEST 2: Sector-7 City Map Bounds (300m x 300m)
// ----------------------------------------------------------------------------
console.log('Test 2: Verifying Sector-7 300m x 300m boundaries...');
const env = new EnvironmentDual(mockScene);
assert.strictEqual(env.sector7Bounds.minX, -150);
assert.strictEqual(env.sector7Bounds.maxX, 150);
assert.strictEqual(env.sector7Bounds.minZ, -150);
assert.strictEqual(env.sector7Bounds.maxZ, 150);

env.setZoneActive('sector_7', mockPlayer);
assert.strictEqual(env.arenaBounds.minX, -150);
assert.strictEqual(env.arenaBounds.maxX, 150);
console.log('  -> PASS: Sector-7 arena bounds are [-150, 150] in X and Z (300m x 300m).');

// ----------------------------------------------------------------------------
// TEST 3: Perimeter Concrete Walls at +/- 150m
// ----------------------------------------------------------------------------
console.log('Test 3: Verifying 4 perimeter walls and collision barriers...');
assert.ok(env.sector7PerimeterColliders.length >= 4, 'Should have at least 4 perimeter barrier colliders');

// Check out of bounds collision
assert.strictEqual(env.checkCollision(151, 0, 0.5), true, 'Position outside East boundary (X=151) must collide');
assert.strictEqual(env.checkCollision(-151, 0, 0.5), true, 'Position outside West boundary (X=-151) must collide');
assert.strictEqual(env.checkCollision(0, 151, 0.5), true, 'Position outside South boundary (Z=151) must collide');
assert.strictEqual(env.checkCollision(0, -151, 0.5), true, 'Position outside North boundary (Z=-151) must collide');

// Inside open center plaza (0, 10) must not collide
assert.strictEqual(env.checkCollision(0, 10, 0.5), false, 'Open street (0, 10) must be walkable');
console.log('  -> PASS: 4 perimeter walls protect the 300x300m city borders.');

// ----------------------------------------------------------------------------
// TEST 4: Radio Tower (Extraction Beacon) at Center (0, 0)
// ----------------------------------------------------------------------------
console.log('Test 4: Verifying extraction Radio Tower is at center (0, 0)...');
assert.ok(env.extractionGroup, 'Extraction group must exist');
assert.strictEqual(env.extractionGroup.position.x, 0, 'Radio Tower X must be 0');
assert.strictEqual(env.extractionGroup.position.z, 0, 'Radio Tower Z must be 0');

assert.ok(env.extractionCollider, 'Extraction collider must exist');
assert.strictEqual(env.extractionCollider.min.x, -2, 'Collider centered around X=0');
assert.strictEqual(env.extractionCollider.max.x, 2, 'Collider centered around X=0');
assert.strictEqual(env.extractionCollider.min.z, -2, 'Collider centered around Z=0');
assert.strictEqual(env.extractionCollider.max.z, 2, 'Collider centered around Z=0');

assert.ok(env.extractionInteractable, 'Extraction interactable must exist');
assert.strictEqual(env.extractionInteractable.type, 'extraction');
assert.strictEqual(env.extractionInteractable.position.x, 0);
assert.strictEqual(env.extractionInteractable.position.z, 0);

// Even after calling randomizeExtractionBeacon(), the tower remains at (0, 0)
const randSite = env.randomizeExtractionBeacon();
assert.strictEqual(randSite.x, 0);
assert.strictEqual(randSite.z, 0);
assert.strictEqual(env.extractionGroup.position.x, 0);
assert.strictEqual(env.extractionGroup.position.z, 0);
console.log('  -> PASS: Radio Tower is permanently positioned at center (0, 0).');

// ----------------------------------------------------------------------------
// TEST 5: Night Atmosphere in Sector-7
// ----------------------------------------------------------------------------
console.log('Test 5: Verifying dark night atmosphere and fog...');
env.setZoneActive('sector_7', mockPlayer);
assert.strictEqual(mockScene.background.getHex(), 0x060910, 'Background color must match dark night sky');
assert.ok(mockScene.fog, 'Fog must be active in Sector-7');
assert.strictEqual(mockScene.fog.color.getHex(), 0x080d18, 'Fog color must match dark atmospheric night');
console.log('  -> PASS: Dark nighttime sky and fog are active in Sector-7.');

// ----------------------------------------------------------------------------
// TEST 6: Random Edge Spawn
// ----------------------------------------------------------------------------
console.log('Test 6: Verifying random edge spawn when entering Sector-7...');
const edgesSeen = new Set();
for (let i = 0; i < 50; i++) {
  env.setZoneActive('sector_7', mockPlayer);
  const px = mockPlayer.position.x;
  const pz = mockPlayer.position.z;

  // Player must be positioned along one of the perimeter edges (|X| == 135 or |Z| == 135)
  const isNorth = Math.abs(pz - (-135)) < 1.0;
  const isSouth = Math.abs(pz - 135) < 1.0;
  const isWest = Math.abs(px - (-135)) < 1.0;
  const isEast = Math.abs(px - 135) < 1.0;

  assert.ok(isNorth || isSouth || isWest || isEast, `Spawn (${px}, ${pz}) must be on a perimeter edge`);

  if (isNorth) edgesSeen.add('North');
  if (isSouth) edgesSeen.add('South');
  if (isWest) edgesSeen.add('West');
  if (isEast) edgesSeen.add('East');
}
assert.strictEqual(edgesSeen.size, 4, 'Random spawn must cover all 4 perimeter edges (North, South, East, West)');
console.log('  -> PASS: Player spawns randomly along all 4 perimeter edges of the map.');

// ----------------------------------------------------------------------------
// TEST 7: Zombie Wave Spawn Distribution Across 300x300m Layout
// ----------------------------------------------------------------------------
console.log('Test 7: Verifying zombie wave spawn distribution in 300x300m city...');
const waveMgr = new WaveManager(null, env, mockPlayer, { showAnnouncement() {} }, null);
assert.ok(waveMgr.spawnPoints.length >= 15, 'Should have multiple urban spawn points');

for (const sp of waveMgr.spawnPoints) {
  assert.ok(sp.x >= -145 && sp.x <= 145, `Spawn X (${sp.x}) must be within city bounds`);
  assert.ok(sp.z >= -145 && sp.z <= 145, `Spawn Z (${sp.z}) must be within city bounds`);
}
console.log('  -> PASS: Zombie spawns are distributed across the 300x300m city layout.');

console.log('\n======================================================');
console.log('🎉 ALL CITY MAP & BACKPACK TESTS PASSED 100%! 🎉');
console.log('======================================================');
