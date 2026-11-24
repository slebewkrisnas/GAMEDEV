// ============================================================================
// DEAD ZONE — SHOOTING PERFORMANCE & ZERO-ALLOCATION TEST SUITE
// Verifies all 4 root-cause performance fixes for gun combat:
// 1. PointLight shader stability (modulating intensity, visible stays true)
// 2. Pre-cached audio noise buffers (zero runtime allocations in hot loops)
// 3. Cached zombie hitboxes array on ZombiesManager
// 4. Two-phase raycasting early exit
// ============================================================================

const noop = () => {};
const ctxProxy = new Proxy({
  width: 512,
  height: 512,
  measureText: () => ({ width: 50 })
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
    if (tag === 'img') {
      return {
        addEventListener: noop,
        removeEventListener: noop,
        src: ''
      };
    }
    return {
      style: {},
      classList: { add: noop, remove: noop, toggle: noop },
      appendChild: noop
    };
  },
  createElementNS: (ns, tag) => {
    return global.document.createElement(tag);
  },
  getElementById: () => ({
    style: {},
    classList: { add: noop, remove: noop, toggle: noop },
    textContent: '',
    appendChild: noop
  }),
  pointerLockElement: {},
  addEventListener: noop,
  removeEventListener: noop
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  addEventListener: noop,
  removeEventListener: noop
};

import assert from 'assert';
import * as THREE from 'three';
import { sound } from '../audio.js';
import { ZombiesManager } from '../zombies.js';
import { WeaponManager, WEAPON_CONFIGS } from '../weapons.js';

console.log('--- STARTING SHOOTING PERFORMANCE VERIFICATION ---');

// ----------------------------------------------------------------------------
// TEST 1: Audio Noise Buffer Pre-caching (Zero-Allocation on Firing)
// ----------------------------------------------------------------------------
console.log('Test 1: Web Audio noise buffer caching...');
class MockAudioContext {
  constructor() {
    this.sampleRate = 48000;
    this.currentTime = 0;
    this.state = 'running';
    this.createBufferCount = 0;
  }
  createBuffer(channels, size, sampleRate) {
    this.createBufferCount++;
    return {
      getChannelData: () => new Float32Array(size)
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createBiquadFilter() {
    return {
      type: '',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      Q: { setValueAtTime: () => {} },
      connect: () => {}
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      connect: () => {}
    };
  }
  createOscillator() {
    return {
      type: '',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  resume() { return Promise.resolve(); }
}

sound.ctx = new MockAudioContext();
sound.masterGain = sound.ctx.createGain();
sound.sfxGain = sound.ctx.createGain();
sound.zombieGain = sound.ctx.createGain();
sound.ambientGain = sound.ctx.createGain();

// First shot generates noise buffer for pistol
sound.playPistolShot();
const initialBuffers = sound.ctx.createBufferCount;
assert.strictEqual(initialBuffers, 1, 'First pistol shot creates 1 cached noise buffer');

// Subsequent 50 shots MUST NOT create any new AudioBuffers!
for (let i = 0; i < 50; i++) {
  sound.playPistolShot();
}
assert.strictEqual(sound.ctx.createBufferCount, initialBuffers, 'Subsequent 50 pistol shots reused cached buffer (0 allocations)!');

// Test rifle caching
sound.playRifleShot();
const rifleBuffers = sound.ctx.createBufferCount;
assert.strictEqual(rifleBuffers, initialBuffers + 1, 'First rifle shot creates 1 cached buffer');
for (let i = 0; i < 50; i++) {
  sound.playRifleShot();
}
assert.strictEqual(sound.ctx.createBufferCount, rifleBuffers, 'Subsequent 50 rifle shots reused cached buffer (0 allocations)!');

// Test shotgun caching
sound.playShotgunShot();
const shotgunBuffers = sound.ctx.createBufferCount;
assert.strictEqual(shotgunBuffers, rifleBuffers + 1, 'First shotgun shot creates 1 cached buffer');
for (let i = 0; i < 50; i++) {
  sound.playShotgunShot();
}
assert.strictEqual(sound.ctx.createBufferCount, shotgunBuffers, 'Subsequent 50 shotgun shots reused cached buffer (0 allocations)!');
console.log('  -> PASS: Audio noise buffer caching completely eliminates memory allocation in hot loop.');

// ----------------------------------------------------------------------------
// TEST 2: Zombie Groan Throttling
// ----------------------------------------------------------------------------
console.log('Test 2: Zombie groan audio storm throttling...');
let oscCount = 0;
const origCreateOsc = sound.ctx.createOscillator;
sound.ctx.createOscillator = function() {
  oscCount++;
  return origCreateOsc.call(sound.ctx);
};

sound._lastZombieGroanTime = 0;
sound.ctx.currentTime = 10.0;
sound.playZombieGroan();
assert.strictEqual(oscCount, 1, 'First zombie groan plays');

// 10 zombies alerting at the same second
for (let i = 0; i < 10; i++) {
  sound.playZombieGroan();
}
assert.strictEqual(oscCount, 1, 'Subsequent zombie groans within 1.2s were throttled to prevent audio storm!');
console.log('  -> PASS: Zombie horde groans are properly throttled.');

// ----------------------------------------------------------------------------
// TEST 3: ZombiesManager Hitbox Caching
// ----------------------------------------------------------------------------
console.log('Test 3: ZombiesManager hitbox cache dirty tracking...');
const scene = new THREE.Scene();
const zm = new ZombiesManager(scene, null, null, null);
zm.zombies = [
  { isAlive: true, hitboxes: [new THREE.Mesh(), new THREE.Mesh()] },
  { isAlive: true, hitboxes: [new THREE.Mesh()] }
];
zm.hitboxesDirty = true;

const hb1 = zm.getActiveHitboxes();
assert.strictEqual(hb1.length, 3, 'Found 3 hitboxes');

// Calling getActiveHitboxes again without state change must return exact same array reference
const hb2 = zm.getActiveHitboxes();
assert.strictEqual(hb1, hb2, 'Returned cached array reference without creating new array');

// When a zombie dies, dirty flag invalidates cache
zm.zombies[0].isAlive = false;
zm.hitboxesDirty = true;
const hb3 = zm.getActiveHitboxes();
assert.strictEqual(hb3.length, 1, 'Updated hitboxes after dirty invalidation');
console.log('  -> PASS: Zombie hitboxes are efficiently cached.');

// ----------------------------------------------------------------------------
// TEST 4: WeaponManager PointLight Shader Stability
// ----------------------------------------------------------------------------
console.log('Test 4: PointLight shader stability (modulating intensity, visible=true)...');
const camera = new THREE.PerspectiveCamera();
const parentGroup = new THREE.Group();
const mockUI = {
  triggerCrosshairRecoil: noop,
  updateAmmo: noop,
  updateQuickSelectBar: noop,
  showAnnouncement: noop,
  showReloadAlert: noop
};
const wm = new WeaponManager(camera, parentGroup, zm, mockUI, null);

// PointLight must be visible=true with intensity 0 by default
assert.strictEqual(wm.muzzleLight.visible, true, 'muzzleLight.visible is permanently true');
assert.strictEqual(wm.muzzleLight.intensity, 0, 'muzzleLight.intensity is 0 by default');

// Flash triggers intensity=2.0
wm.showMuzzleFlash();
assert.strictEqual(wm.muzzleLight.visible, true, 'muzzleLight.visible remains true');
assert.strictEqual(wm.muzzleLight.intensity, 2.0, 'muzzleLight.intensity is boosted to 2.0 on flash');

// Timer expiry resets intensity=0 without touching visible
wm.update(0.06); // delta > 0.05s
assert.strictEqual(wm.muzzleLight.visible, true, 'muzzleLight.visible remains true after timer expires');
assert.strictEqual(wm.muzzleLight.intensity, 0, 'muzzleLight.intensity returns to 0');
console.log('  -> PASS: PointLight keeps visible=true, preventing WebGL shader recompilation stalls.');

// ----------------------------------------------------------------------------
// TEST 5: Fast Two-Phase Raycast Early Exit
// ----------------------------------------------------------------------------
console.log('Test 5: Two-Phase Raycast early exit...');
let obstacleRaycastTested = false;
const fakeObstacle = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial());
fakeObstacle.raycast = function() {
  obstacleRaycastTested = true;
};

// Player shoots with no zombies in sight
wm.performRaycast(0, 0, 50, 100, [], [fakeObstacle]);
assert.strictEqual(obstacleRaycastTested, false, 'Obstacles are NOT raycasted when no zombies are in trajectory!');
console.log('  -> PASS: Two-phase raycast avoids heavy environment obstacle traversal on missed shots.');

wm.destroy();
console.log('==================================================================');
console.log('🎉 ALL SHOOTING PERFORMANCE OPTIMIZATION TESTS PASSED CLEANLY! 🎉');
console.log('==================================================================');
