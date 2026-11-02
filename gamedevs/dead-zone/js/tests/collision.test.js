import assert from 'node:assert';
import * as THREE from '../libs/three.module.js';

// Test analytical colliders
const safeZoneColliders = [];

// 1. Walls
const wallDefs = [
  { x: 0, z: -48, w: 96, d: 2 },
  { x: 0, z: 48, w: 96, d: 2 },
  { x: -48, z: 0, w: 2, d: 96 },
  { x: 48, z: 0, w: 2, d: 96 }
];
wallDefs.forEach(def => {
  safeZoneColliders.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(def.x, 4, def.z),
    new THREE.Vector3(def.w, 8, def.d)
  ));
});

// 2. Safehouse (0, -15)
safeZoneColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(0, 3, -15),
  new THREE.Vector3(12, 6, 10)
));

// 3. Armory (-18, 0)
safeZoneColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(-18, 2.25, 0),
  new THREE.Vector3(6, 4.5, 5)
));

// 4. Medbay (18, 0)
safeZoneColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(18, 2.25, 0),
  new THREE.Vector3(6, 4.5, 5)
));

// 5. Scrap (-12, 16)
safeZoneColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(-12, 2, 16),
  new THREE.Vector3(5, 4, 4)
));

function checkCollision(x, z, radius = 0.5, feetY = 0) {
  const minX = x - radius;
  const maxX = x + radius;
  const minZ = z - radius;
  const maxZ = z + radius;

  for (let i = 0; i < safeZoneColliders.length; i++) {
    const box = safeZoneColliders[i];
    if (feetY >= box.max.y - 0.1) continue;
    if (maxX > box.min.x && minX < box.max.x && maxZ > box.min.z && minZ < box.max.z) {
      return true;
    }
  }
  return false;
}

console.log('--- TESTING COLLISION SYSTEM ---');
// At player spawn (0, -6): must be FALSE (no collision, player can walk freely!)
assert.strictEqual(checkCollision(0, -6), false, 'Spawn point (0, -6) must NOT collide');
// Walking around plaza
assert.strictEqual(checkCollision(0, 0), false, 'Center plaza (0, 0) must NOT collide');
assert.strictEqual(checkCollision(5, 5), false, '(5, 5) must NOT collide');
assert.strictEqual(checkCollision(-5, -5), false, '(-5, -5) must NOT collide');

// Hitting the Hab Pod wall at (0, -11): must collide
assert.strictEqual(checkCollision(0, -11), true, 'Directly into Hab Pod front wall must collide');
// Hitting the Armory wall at (-16, 0): must collide
assert.strictEqual(checkCollision(-16, 0), true, 'Into Armory wall must collide');
// Hitting the Medbay wall at (16, 0): must collide
assert.strictEqual(checkCollision(16, 0), true, 'Into Medbay wall must collide');

// -----------------------------------------------------------------------------
// CABIN COLLIDER TEST (Pondok Terbengkalai: Pintu Terbuka & Dinding Solid)
// -----------------------------------------------------------------------------
const cabinColliders = [];
const cx = -45, cz = -25;
// Back wall
cabinColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(cx, 1.9, cz - 3.5),
  new THREE.Vector3(8.0, 3.8, 0.4)
));
// Left wall
cabinColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(cx - 3.8, 1.9, cz),
  new THREE.Vector3(0.4, 3.8, 7.0)
));
// Right wall
cabinColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(cx + 3.8, 1.9, cz),
  new THREE.Vector3(0.4, 3.8, 7.0)
));
// Front wall left
cabinColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(cx - 2.65, 1.9, cz + 3.5),
  new THREE.Vector3(2.7, 3.8, 0.4)
));
// Front wall right
cabinColliders.push(new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(cx + 2.65, 1.9, cz + 3.5),
  new THREE.Vector3(2.7, 3.8, 0.4)
));

function checkCabinCollision(x, z, radius = 0.5) {
  const minX = x - radius;
  const maxX = x + radius;
  const minZ = z - radius;
  const maxZ = z + radius;

  for (let i = 0; i < cabinColliders.length; i++) {
    const box = cabinColliders[i];
    if (maxX > box.min.x && minX < box.max.x && maxZ > box.min.z && minZ < box.max.z) {
      return true;
    }
  }
  return false;
}

// 1. Through open doorway: MUST NOT COLLIDE (Player can walk in!)
assert.strictEqual(checkCabinCollision(cx, cz + 3.5), false, 'Doorway opening must allow player entry');
// 2. Inside cabin: MUST NOT COLLIDE (Walkable interior!)
assert.strictEqual(checkCabinCollision(cx, cz), false, 'Inside cabin floor must be walkable');
// 3. Hitting back wall: MUST COLLIDE
assert.strictEqual(checkCabinCollision(cx, cz - 3.5), true, 'Back wall must collide');
// 4. Hitting left wall: MUST COLLIDE
assert.strictEqual(checkCabinCollision(cx - 3.8, cz), true, 'Left wall must collide');
// 5. Hitting right wall: MUST COLLIDE
assert.strictEqual(checkCabinCollision(cx + 3.8, cz), true, 'Right wall must collide');

console.log('--- ALL COLLISION TESTS PASSED! ---');

