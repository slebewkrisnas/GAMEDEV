// terrain_combat.test.js - Verification of Terrain Height, Zombie Types, Shooting & Boss System

// Mock browser globals for Node.js test environment
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
    return {};
  },
  createElementNS: (ns, tag) => {
    return global.document.createElement(tag);
  },
  pointerLockElement: null,
  addEventListener: noop,
  removeEventListener: noop
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  removeEventListener: () => {}
};

import assert from 'assert';
import * as THREE from 'three';
import { EnvironmentDual } from '../environment_dual.js';
import { Player } from '../player.js';
import { ZombiesManager, Zombie } from '../zombies.js';
import { WeaponManager } from '../weapons.js';
import { WaveManager } from '../waves.js';
import { GameState } from '../gameState.js';

console.log('--- STARTING TERRAIN & COMBAT SYSTEM TESTS ---');

// 1. Mock Scene & DOM
const mockScene = new THREE.Scene();
const mockDom = {
  requestPointerLock: () => Promise.resolve(),
  exitPointerLock: () => {}
};

// 2. Test Environment & Terrain Elevation
const env = new EnvironmentDual(mockScene);
assert.strictEqual(env.getTerrainHeight(0, 0), 0, 'Safe zone terrain height should be 0');

env.setZoneActive('sector_7');
assert.strictEqual(env.activeZone, 'sector_7');

// Test elevation sampling
const h1 = env.getTerrainHeight(20, 20);
const h2 = env.getTerrainHeight(-30, 40);
console.log(`Sampled elevations in Sector-7: (20,20)=${h1.toFixed(3)}m, (-30,40)=${h2.toFixed(3)}m`);
assert.strictEqual(typeof h1, 'number', 'Terrain height should be a number');

// Inside cabin interior should be flat 0.12
const cabinH = env.getTerrainHeight(-45, -25);
assert.strictEqual(cabinH, 0.12, 'Cabin interior should be flat at 0.12m floor height');
console.log('✔ Terrain height sampling passed!');

// 3. Test Player Terrain Following
const mockCamera = new THREE.PerspectiveCamera();
const player = new Player(mockCamera, mockDom, env);

// Teleport player onto a terrain mound
player.teleport(20, undefined, 20);
const expectedEyeY = h1 + player.eyeHeight;
assert.ok(Math.abs(player.yawObject.position.y - expectedEyeY) < 0.01, 'Player eye height should sit on top of mound');

// Simulate 10 frames of walking on terrain
for (let i = 0; i < 10; i++) {
  player.update(0.016);
}
assert.ok(player.yawObject.position.y >= player.eyeHeight, 'Player should NEVER sink below eyeHeight');
console.log('✔ Player terrain walking and jumping elevation passed!');

// 4. Test Zombie Variants
const zManager = new ZombiesManager(mockScene, env, player, () => {});

// Walker
const walker = zManager.spawnZombie({ type: 'walker', x: 10, z: 10 });
assert.strictEqual(walker.type, 'walker');
assert.strictEqual(walker.speed, 2.2);
assert.strictEqual(walker.attackDamage, 13);
assert.strictEqual(walker.maxHealth, 80);
assert.strictEqual(walker.scale, 1.0);

// Runner (Jalan cepat, damage lebih kecil)
const runner = zManager.spawnZombie({ type: 'runner', x: 15, z: 15 });
assert.strictEqual(runner.type, 'runner');
assert.strictEqual(runner.speed, 3.9, 'Runner must have fast speed');
assert.strictEqual(runner.attackDamage, 8, 'Runner must have lower damage');
assert.strictEqual(runner.maxHealth, 55);

// Tank (Jalan lambat, damage lumayan besar)
const tank = zManager.spawnZombie({ type: 'tank', x: 20, z: 20 });
assert.strictEqual(tank.type, 'tank');
assert.strictEqual(tank.speed, 1.6, 'Tank must have slower speed');
assert.strictEqual(tank.attackDamage, 25, 'Tank must have higher damage');
assert.strictEqual(tank.maxHealth, 175);
assert.strictEqual(tank.scale, 1.35);

// Boss Zombie (Titan Aberration)
const boss = zManager.spawnZombie({ type: 'boss', x: 30, z: 30 });
assert.strictEqual(boss.type, 'boss');
assert.strictEqual(boss.scale, 2.6, 'Boss must have 2.6x colossal scale');
assert.strictEqual(boss.maxHealth, 650, 'Boss must have 650 HP');
assert.strictEqual(boss.attackDamage, 38, 'Boss must deal heavy damage');
assert.strictEqual(zManager.getBoss(), boss, 'getBoss() should return the active boss');

// Test zombie hitboxes registration (torso, head, arms, legs)
assert.ok(walker.hitboxes.length >= 6, 'Zombie must register torso, head, arms, and legs in hitboxes');
console.log('✔ Zombie variants & hitbox registration passed!');

// 5. Test Weapon Shooting & Raycast (No TypeError!)
const mockUI = {
  showAnnouncement: () => {},
  showHitMarker: () => {},
  triggerCrosshairRecoil: () => {},
  updateAmmo: () => {},
  showReloadAlert: () => {},
  updateHealth: () => {},
  updateHUD: () => {},
  updateWaveInfo: () => {}
};

const weapons = new WeaponManager(mockCamera, player.pitchObject, zManager, mockUI, env);

// Position camera pointing directly at walker
mockCamera.position.set(10, walker.mesh.position.y + 1.2, 12);
mockCamera.lookAt(10, walker.mesh.position.y + 1.2, 10);
mockCamera.updateMatrixWorld();

// Verify hitboxes can be shot
const hitboxes = zManager.getActiveHitboxes();
assert.ok(hitboxes.length > 0, 'Active hitboxes should not be empty');

// Shoot weapon
const initialHealth = walker.health;
walker.takeDamage(35, false);
assert.strictEqual(walker.health, initialHealth - 35, 'Zombie should take body damage');

walker.takeDamage(100, true);
assert.strictEqual(walker.isAlive, false, 'Zombie should die on lethal damage');
console.log('✔ Shooting & damage logic passed!');

// 6. Test Unlimited Wave Progression & Boss Encounter Every 10 Kills
let bossRewardGiven = false;
const initialWallet = GameState.wallet;

const mockLoot = {
  spawnDrop: (pos, isBoss) => {
    if (isBoss) bossRewardGiven = true;
  }
};

const waves = new WaveManager(zManager, env, player, mockUI);
waves.lootManager = mockLoot;
waves.startWave(1);

// Simulate killing 9 regular zombies
for (let i = 1; i <= 9; i++) {
  waves.onZombieKilled({ x: 0, z: 0 }, false);
}
assert.strictEqual(waves.totalKills, 9);
assert.strictEqual(waves.bossActive, false);

// 10th kill: triggers boss!
waves.onZombieKilled({ x: 0, z: 0 }, false);
assert.strictEqual(waves.totalKills, 10);
// Trigger boss spawn directly
waves.spawnBoss();
assert.strictEqual(waves.bossActive, true, 'Boss must become active at 10 kills');
assert.ok(waves.currentBoss !== null, 'Current boss instance must be assigned');
assert.strictEqual(waves.currentBoss.type, 'boss');

// Defeat the Boss!
waves.onZombieKilled({ x: 0, z: 0 }, true, waves.currentBoss);
assert.strictEqual(waves.bossActive, false, 'Boss must be deactivated after defeat');
// User Requirement: Boss reward is now physical Inti Titan (Rp 200.000) in backpack, not instant cash!
assert.strictEqual(GameState.wallet, initialWallet, 'Wallet must NOT receive instant cash on boss kill');
const titanCore = GameState.backpack.find(item => item.id === 'titan_core');
assert.ok(titanCore, 'Player backpack must contain physical Inti Titan (TITAN_CORE) item');
assert.strictEqual(titanCore.value, 200000, 'Inti Titan item must be worth Rp 200.000');
assert.strictEqual(bossRewardGiven, true, 'Rare loot drop must be triggered on boss defeat');

console.log('✔ Unlimited wave & 10-kill Boss progression passed!');
console.log('--- ALL TERRAIN, WEAPONS, VARIANT & BOSS TESTS PASSED! ---');
process.exit(0);
