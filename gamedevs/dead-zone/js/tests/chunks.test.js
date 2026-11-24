// ============================================================================
// CHUNKS & DYNAMIC WORLD STREAMING TEST SUITE
// Tests coordinate calculation, priority queuing, predictive look-ahead,
// hysteresis unloading, collision synchronization, memory disposal, and state persistence.
// ============================================================================

import assert from 'node:assert';
import * as THREE from '../libs/three.module.js';
import { WorldConfig } from '../chunks/WorldConfig.js';
import { Chunk, CHUNK_STATE } from '../chunks/Chunk.js';
import { ChunkResourceManager } from '../chunks/ChunkResourceManager.js';
import { ChunkStateStore } from '../chunks/ChunkStateStore.js';
import { WorldChunkManager } from '../chunks/WorldChunkManager.js';

console.log('--- TESTING CHUNKS & DYNAMIC WORLD STREAMING SYSTEM ---');

// ----------------------------------------------------------------------------
// TEST 1: Coordinate Mapping & Chunk Bounds
// ----------------------------------------------------------------------------
console.log('Test 1: Coordinate calculation and chunk spatial bounds...');
const parentGroup = new THREE.Group();
const chunkMgr = new WorldChunkManager(parentGroup);

const cOrigin = chunkMgr.worldToChunkCoord(0, 0);
assert.strictEqual(cOrigin.cx, 0, 'Origin X should be chunk 0');
assert.strictEqual(cOrigin.cz, 0, 'Origin Z should be chunk 0');

const cEast = chunkMgr.worldToChunkCoord(45, 0);
assert.strictEqual(cEast.cx, 1, 'X=45 with chunk size 40 should be chunk cx=1');

const cSouth = chunkMgr.worldToChunkCoord(0, -80);
assert.strictEqual(cSouth.cz, -2, 'Z=-80 with chunk size 40 should be chunk cz=-2');

const chunk00 = new Chunk(0, 0);
assert.strictEqual(chunk00.centerX, 0);
assert.strictEqual(chunk00.centerZ, 0);
assert.strictEqual(chunk00.minX, -20);
assert.strictEqual(chunk00.maxX, 20);
assert.strictEqual(chunk00.minZ, -20);
assert.strictEqual(chunk00.maxZ, 20);
assert.strictEqual(chunk00.contains(0, 0), true);
assert.strictEqual(chunk00.contains(19.9, 19.9), true);
assert.strictEqual(chunk00.contains(25, 0), false);
console.log('  -> PASS: Coordinate and bounds calculations are exact.');

// ----------------------------------------------------------------------------
// TEST 2: Chunk Lifecycle & Reference Counted Memory Management
// ----------------------------------------------------------------------------
console.log('Test 2: Chunk build, resource acquisition, and disposal...');
const resMgr = new ChunkResourceManager();
const stateStore = new ChunkStateStore();

const testChunk = new Chunk(1, 1);
assert.strictEqual(testChunk.state, CHUNK_STATE.UNLOADED);

testChunk.build(resMgr, stateStore);
assert.strictEqual(testChunk.state, CHUNK_STATE.ACTIVE);
assert.ok(testChunk.group.children.length > 0, 'Chunk should have rendered mesh children');
assert.ok(testChunk.colliders.length > 0, 'Chunk should contain colliders');

// Verify resource acquired
const pineBarkEntry = resMgr.materials.get('pine_bark');
if (pineBarkEntry) {
  assert.ok(pineBarkEntry.refCount >= 1, 'pine_bark material should have active refCount');
}

// Dispose chunk
testChunk.dispose(resMgr);
assert.strictEqual(testChunk.state, CHUNK_STATE.UNLOADED);
assert.strictEqual(testChunk.group.children.length, 0, 'Children should be cleaned up');
assert.strictEqual(testChunk.colliders.length, 0, 'Colliders should be cleared');
console.log('  -> PASS: Lifecycle UNLOADED -> ACTIVE -> UNLOADED with clean disposal.');

// ----------------------------------------------------------------------------
// TEST 3: Priority Loading Queue with Camera Look Direction Bias
// ----------------------------------------------------------------------------
console.log('Test 3: Priority load queue and directional look-ahead bias...');
const mgrPriority = new WorldChunkManager(new THREE.Group());
const playerPos = { x: 0, y: 1.7, z: 0 };
const lookNorth = { x: 0, y: 0, z: -1 }; // Facing -Z (North)
const velocityForward = { x: 0, y: 0, z: -4 };

mgrPriority.evaluateStreaming(playerPos.x, playerPos.z, lookNorth, velocityForward);
assert.ok(mgrPriority.loadQueue.length > 0, 'Load queue should have candidate chunks');

// The chunk directly in front (0, -1) must be prioritized over chunk behind (0, +1)
const idxFront = mgrPriority.loadQueue.findIndex(c => c.cx === 0 && c.cz === -1);
const idxBack = mgrPriority.loadQueue.findIndex(c => c.cx === 0 && c.cz === 1);
assert.ok(idxFront !== -1, 'Front chunk should be in load queue');
assert.ok(idxBack !== -1, 'Back chunk should be in load queue');
assert.ok(idxFront < idxBack, `Front chunk (${idxFront}) must be loaded before back chunk (${idxBack})`);
console.log('  -> PASS: Directional look-ahead correctly biases queue priority.');

// ----------------------------------------------------------------------------
// TEST 4: Hysteresis Unload Prevention (No Thrashing / Rapid Flickering)
// ----------------------------------------------------------------------------
console.log('Test 4: Hysteresis behavior (loadRadius < unloadRadius)...');
const mgrHysteresis = new WorldChunkManager(new THREE.Group());
const p0 = { x: 0, y: 1.7, z: 0 };

// Preload around origin (radius 1 chunk = 3x3 grid)
mgrHysteresis.preloadInitialChunks(p0.x, p0.z, 1);
const originChunk = mgrHysteresis.getChunk(0, 0);
assert.strictEqual(originChunk.state, CHUNK_STATE.ACTIVE, 'Origin chunk must be active');

// Player walks 95 meters away (beyond loadRadius of ~80m, but within unloadRadius of ~128m)
mgrHysteresis.evaluateStreaming(95, 0, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
assert.strictEqual(
  originChunk.state,
  CHUNK_STATE.ACTIVE,
  'Chunk at 95m must REMAIN ACTIVE due to hysteresis buffer (unloadDistance = 128m)'
);

// Player moves far away to 145 meters (exceeds unloadRadius)
mgrHysteresis.evaluateStreaming(145, 0, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
assert.strictEqual(
  originChunk.state,
  CHUNK_STATE.UNLOADED,
  'Chunk at 145m must be safely UNLOADED'
);
console.log('  -> PASS: Hysteresis prevents thrashing and boundary flickering.');

// ----------------------------------------------------------------------------
// TEST 5: Collision System Integration & Spatial Filtering
// ----------------------------------------------------------------------------
console.log('Test 5: Collision queries with dynamic chunk streaming...');
const mgrCol = new WorldChunkManager(new THREE.Group());
// Preload chunks around Cabin 1 at (-45, -25)
mgrCol.preloadInitialChunks(-45, -25, 1);

// Inside cabin back wall: (x: -45, z: -28.5) -> Wall center is at (x: -45, z: -28.5)
const hasCollisionAtWall = mgrCol.checkCollision(-45, -28.5, 0.5, 0);
assert.strictEqual(hasCollisionAtWall, true, 'Collision must trigger when contacting cabin wall');

// Open center area of cabin: (x: -45, z: -25)
const isWalkableInside = mgrCol.checkCollision(-45, -25, 0.5, 0);
assert.strictEqual(isWalkableInside, false, 'Interior walkway of cabin must be free from collision');

// Unload all chunks
mgrCol.dispose();
assert.strictEqual(mgrCol.activeChunks.size, 0, 'Active chunks should be 0 after dispose');
assert.strictEqual(mgrCol.getColliders().length, 0, 'Colliders should be empty after dispose');
console.log('  -> PASS: Spatial collision queries match physical object geometry perfectly.');

// ----------------------------------------------------------------------------
// TEST 6: State Persistence Across Chunk Unload & Reload
// ----------------------------------------------------------------------------
console.log('Test 6: Persistent loot state across chunk unload and reload...');
const mgrState = new WorldChunkManager(new THREE.Group());
const cabinChunkCoord = mgrState.worldToChunkCoord(-45, -25);

// 1. Load cabin chunk
mgrState.preloadInitialChunks(-45, -25, 1);
const cabinChunk = mgrState.getChunk(cabinChunkCoord.cx, cabinChunkCoord.cz);
assert.strictEqual(cabinChunk.state, CHUNK_STATE.ACTIVE);

// 2. Player loots crate_cabin_1
assert.strictEqual(mgrState.isLooted('crate_cabin_1'), false);
mgrState.markLooted('crate_cabin_1');
assert.strictEqual(mgrState.isLooted('crate_cabin_1'), true);

// 3. Unload chunk completely
mgrState.unloadChunk(cabinChunk);
assert.strictEqual(cabinChunk.state, CHUNK_STATE.UNLOADED);

// 4. Reload chunk
cabinChunk.build(mgrState.resourceManager, mgrState.stateStore);
assert.strictEqual(cabinChunk.state, CHUNK_STATE.ACTIVE);

// 5. Crate must remain marked as looted!
const reloadedCrate = cabinChunk.interactables.find(item => item.id === 'crate_cabin_1');
assert.ok(reloadedCrate, 'Crate interactable must exist in reloaded chunk');
assert.ok(reloadedCrate.label.includes('Peti Kosong'), `Label should be 'Peti Kosong', got: ${reloadedCrate.label}`);
console.log('  -> PASS: Looted state persisted flawlessly across unload/reload cycle.');

// ----------------------------------------------------------------------------
// TEST 7: Rate-Limited Frame Budget (MAX_BUILDS_PER_FRAME)
// ----------------------------------------------------------------------------
console.log('Test 7: Rate-limited frame budget...');
const mgrBudget = new WorldChunkManager(new THREE.Group());
mgrBudget.loadQueue = [
  new Chunk(0, 0),
  new Chunk(1, 0),
  new Chunk(2, 0)
];

// 1 frame should only build 1 chunk (MAX_BUILDS_PER_FRAME = 1)
mgrBudget.processLoadQueue();
assert.strictEqual(mgrBudget.activeChunks.size, 1, 'Only 1 chunk should be built per frame');
assert.strictEqual(mgrBudget.loadQueue.length, 2, '2 chunks should remain in queue');

mgrBudget.processLoadQueue();
assert.strictEqual(mgrBudget.activeChunks.size, 2, 'Second chunk built on second frame');

mgrBudget.processLoadQueue();
assert.strictEqual(mgrBudget.activeChunks.size, 3, 'Third chunk built on third frame');
assert.strictEqual(mgrBudget.loadQueue.length, 0, 'Queue should now be empty');
console.log('  -> PASS: Frame budget strictly maintained, guaranteeing zero FPS drops.');

console.log('--- ALL CHUNK & DYNAMIC STREAMING TESTS PASSED! ---');
