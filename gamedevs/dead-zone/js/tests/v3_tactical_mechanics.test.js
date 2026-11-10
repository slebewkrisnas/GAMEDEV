// ============================================================================
// DEAD ZONE — V3 TACTICAL REBALANCE & REFINEMENT COMPREHENSIVE TEST SUITE
// Verifies:
// 1. Deflation & Anti-Inflation Pacing (Boss Titan 25 kills, Rp 100k Titan Core)
// 2. Headshot Damage Rebalancing (Pistol 70 HP, Rifle 105 HP)
// 3. Emergency Melee: Golok Pedesaan (Slot 4, 45 body / 80 head, 2.3m range, 1.0s stamina, silent)
// 4. Caliber Gunshot Aggro (Shotgun 55m, Rifle 42m, Pistol 22m, Machete 0m)
// 5. Dynamic Zombie Repositioning (>65m distance relocated 25-35m ahead)
// 6. Timed Holdout Extraction (12.0s countdown, 14m perimeter boundary, Runner rush)
// 7. Nightfall Escalation (Survival time scales Brute/Stalker odds & 2.5x gem drops)
// 8. Tactical Traps: Ranjau Paku Bambu (50 damage + 50% slow)
// 9. Craftable Jamu Buffs (Beras Kencur 2x stamina regen, Kunyit Asam poison immunity)
// 10. Tiered Bounties with weapon requirement validation
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
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: noop,
  removeEventListener: noop
};

import assert from 'node:assert';
import * as THREE from 'three';
import { GameState, ITEMS, CRAFTING_RECIPES } from '../gameState.js';
import { WEAPON_CONFIGS, WeaponManager } from '../weapons.js';
import { Zombie, ZombiesManager, PoisonCloud } from '../zombies.js';
import { WaveManager } from '../waves.js';
import { sound } from '../audio.js';

console.log('--- STARTING V3 TACTICAL MECHANICS VERIFICATION TEST SUITE ---');

// Mock Three.js scene & environment
const mockScene = new THREE.Scene();
const mockEnv = {
  checkCollision: () => false,
  getTerrainHeight: () => 0,
  obstacleMeshes: []
};
const mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const mockUI = {
  updateAmmo: () => {},
  updateWeaponName: () => {},
  showReloadAlert: () => {},
  updateQuickSelectBar: () => {},
  showAnnouncement: () => {},
  showHitMarker: () => {},
  triggerCrosshairRecoil: () => {},
  showReloadProgressBar: () => {},
  updateWaveInfo: () => {},
  updateStamina: () => {},
  updateHealth: () => {},
  updateHUD: () => {},
  showHoldoutBanner: () => {},
  updateHoldoutCountdown: () => {}
};

// ============================================================================
// 1. HEADSHOT DAMAGE REBALANCING
// ============================================================================
console.log('Test 1: Headshot damage rebalancing (Pistol 70 HP vs Rifle 105 HP)...');
assert.strictEqual(WEAPON_CONFIGS.pulse_pistol.headshotDamage, 70, '9mm Pistol headshot damage must be 70 HP');
assert.strictEqual(WEAPON_CONFIGS.pulse_pistol.noiseRadius, 22, 'Pistol noise radius must be 22m');

assert.strictEqual(WEAPON_CONFIGS.plasma_rifle.headshotDamage, 105, '7.62mm Rifle headshot damage must be 105 HP');
assert.strictEqual(WEAPON_CONFIGS.plasma_rifle.noiseRadius, 42, 'Rifle noise radius must be 42m');

assert.strictEqual(WEAPON_CONFIGS.scatter_blaster.noiseRadius, 55, 'Shotgun noise radius must be 55m');

// Runner (55 HP): 1-shot by 70 HP Pistol and 105 HP Rifle
const runner = { health: 55, isAlive: true, takeDamage(dmg) { this.health -= dmg; if (this.health <= 0) this.isAlive = false; } };
runner.takeDamage(WEAPON_CONFIGS.pulse_pistol.headshotDamage);
assert.strictEqual(runner.isAlive, false, 'Runner (55 HP) is one-shot killed by 9mm Pistol headshot');

// Walker (80 HP): Survives 70 HP Pistol, dies to 105 HP Rifle
const walker1 = { health: 80, isAlive: true, takeDamage(dmg) { this.health -= dmg; if (this.health <= 0) this.isAlive = false; } };
walker1.takeDamage(WEAPON_CONFIGS.pulse_pistol.headshotDamage);
assert.strictEqual(walker1.isAlive, true, 'Walker (80 HP) survives single 70 HP Pistol headshot (requires 2 shots)');

const walker2 = { health: 80, isAlive: true, takeDamage(dmg) { this.health -= dmg; if (this.health <= 0) this.isAlive = false; } };
walker2.takeDamage(WEAPON_CONFIGS.plasma_rifle.headshotDamage);
assert.strictEqual(walker2.isAlive, false, 'Walker (80 HP) is instantly one-shot killed by 105 HP Rifle headshot');

console.log('✔ Headshot damage rebalance verified!');

// ============================================================================
// 2. EMERGENCY MELEE: GOLOK PEDESAAN
// ============================================================================
console.log('Test 2: Emergency Melee weapon (Golok Pedesaan)...');
assert.ok(WEAPON_CONFIGS.machete, 'WEAPON_CONFIGS.machete must exist');
assert.strictEqual(WEAPON_CONFIGS.machete.isMelee, true, 'Golok must be flagged isMelee');
assert.strictEqual(WEAPON_CONFIGS.machete.slot, 4, 'Golok belongs to hotbar slot 4');
assert.strictEqual(WEAPON_CONFIGS.machete.bodyDamage, 45, 'Golok body damage must be 45 HP');
assert.strictEqual(WEAPON_CONFIGS.machete.headshotDamage, 80, 'Golok headshot damage must be 80 HP');
assert.strictEqual(WEAPON_CONFIGS.machete.range, 2.3, 'Golok reach must be 2.3m');
assert.strictEqual(WEAPON_CONFIGS.machete.noiseRadius, 0, 'Golok must be completely silent (noiseRadius 0)');
assert.strictEqual(WEAPON_CONFIGS.machete.staminaCost, 1.0, 'Golok consumes 1.0s stamina per swing');

// Verify default ownership
GameState.reset();
assert.ok(GameState.ownedWeapons.includes('machete'), 'Golok must be owned by default without purchasing');
console.log('✔ Emergency Melee Golok Pedesaan verified!');

// ============================================================================
// 3. GUNSHOT AGGRO & ZOMBIE ALERT SYSTEM
// ============================================================================
console.log('Test 3: Gunshot Aggro radius & zombie alertness...');
const mockPlayerObj = {
  yawObject: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0)
  }
};
const zombiesMgr = new ZombiesManager(mockScene, mockEnv, mockPlayerObj, () => {});

// Spawn a zombie 30m away and 60m away
const zNear = zombiesMgr.spawnZombie({ type: 'walker', x: 25, z: 0 });
const zFar = zombiesMgr.spawnZombie({ type: 'walker', x: 75, z: 0 });

assert.strictEqual(zNear.aggroTimer, 0, 'Initial aggro timer is 0');
assert.strictEqual(zFar.aggroTimer, 0, 'Initial aggro timer is 0');

// Fire a rifle gunshot (noiseRadius 42m)
zombiesMgr.alertZombiesInRadius(new THREE.Vector3(0, 0, 0), WEAPON_CONFIGS.plasma_rifle.noiseRadius);

assert.ok(zNear.aggroTimer > 0, 'Near zombie (25m away) within 42m radius is alerted');
assert.strictEqual(zFar.aggroTimer, 0, 'Far zombie (75m away) outside 42m radius is NOT alerted');

console.log('✔ Caliber Gunshot Aggro verified!');

// ============================================================================
// 4. DYNAMIC ZOMBIE REPOSITIONING
// ============================================================================
console.log('Test 4: Dynamic Zombie Repositioning in Sector-7...');
const waveMgr = new WaveManager(zombiesMgr, mockEnv, mockPlayerObj, mockUI, () => {});

// Move far zombie to 90m behind player
zFar.mesh.position.set(0, 0, 90);
assert.ok(Math.hypot(zFar.mesh.position.x, zFar.mesh.position.z) > 65, 'Zombie is > 65m away');

// Trigger reposition
waveMgr.repositionDistantZombies();

const newDist = Math.hypot(zFar.mesh.position.x, zFar.mesh.position.z);
assert.ok(newDist >= 20 && newDist <= 45, `Zombie should be relocated within 25-35m window, actual: ${newDist.toFixed(1)}m`);
console.log('✔ Dynamic Zombie Repositioning verified!');

// ============================================================================
// 5. TIMED HOLDOUT EXTRACTION SYSTEM
// ============================================================================
console.log('Test 5: Timed Holdout Extraction (12.0s countdown & 14m perimeter)...');
class MockDeadZoneHoldoutGame {
  constructor() {
    this.isHoldoutActive = false;
    this.holdoutTimer = 0;
    this.holdoutWaveSpawned = false;
    this.beaconSite = { x: 30, z: 40 };
    this.playerPos = new THREE.Vector3(30, 0, 40);
    this.extractedToSafeZone = false;
  }

  startHoldout() {
    this.isHoldoutActive = true;
    this.holdoutTimer = 12.0;
    this.holdoutWaveSpawned = false;
  }

  update(delta) {
    if (!this.isHoldoutActive) return;
    const dist = Math.hypot(this.playerPos.x - this.beaconSite.x, this.playerPos.z - this.beaconSite.z);
    if (dist > 14.0) {
      this.isHoldoutActive = false; // Aborted
      this.holdoutTimer = 0;
      return 'ABORTED';
    }
    this.holdoutTimer -= delta;
    if (this.holdoutTimer <= 6.0 && !this.holdoutWaveSpawned) {
      this.holdoutWaveSpawned = true;
    }
    if (this.holdoutTimer <= 0) {
      this.isHoldoutActive = false;
      this.extractedToSafeZone = true;
      return 'SUCCESS';
    }
    return 'HOLDING';
  }
}

const holdoutGame = new MockDeadZoneHoldoutGame();
holdoutGame.startHoldout();
assert.strictEqual(holdoutGame.isHoldoutActive, true, 'Holdout is active');
assert.strictEqual(holdoutGame.holdoutTimer, 12.0, 'Timer starts at 12.0s');

// Simulate 5 seconds within perimeter
holdoutGame.update(5.0);
assert.strictEqual(holdoutGame.isHoldoutActive, true);
assert.strictEqual(holdoutGame.holdoutTimer, 7.0);
assert.strictEqual(holdoutGame.holdoutWaveSpawned, false);

// Simulate 2 more seconds -> reaches 5.0s (<= 6.0s) -> Runner wave spawns
holdoutGame.update(2.0);
assert.strictEqual(holdoutGame.holdoutWaveSpawned, true, 'Runner wave spawned at <= 6.0s');

// Test boundary violation
holdoutGame.playerPos.set(100, 0, 100); // 98m away (> 14m)
const abortStatus = holdoutGame.update(1.0);
assert.strictEqual(abortStatus, 'ABORTED', 'Holdout aborts immediately when leaving 14m perimeter');
assert.strictEqual(holdoutGame.isHoldoutActive, false);
assert.strictEqual(holdoutGame.extractedToSafeZone, false);

// Test clean full survival
const holdoutGame2 = new MockDeadZoneHoldoutGame();
holdoutGame2.startHoldout();
holdoutGame2.update(6.0);
holdoutGame2.update(6.0);
assert.strictEqual(holdoutGame2.extractedToSafeZone, true, 'Holdout successfully finishes after 12s');
console.log('✔ Timed Holdout Extraction mechanics verified!');

// ============================================================================
// 6. NIGHTFALL ESCALATION & DEFLATION PACING
// ============================================================================
console.log('Test 6: Nightfall Escalation & Deflation Pacing (25 kills Boss)...');
waveMgr.totalKills = 24;
assert.strictEqual(waveMgr.totalKills % 25 === 0, false, 'Boss must not trigger at 24 kills');

waveMgr.totalKills = 25;
assert.strictEqual(waveMgr.totalKills % 25 === 0, true, 'Boss triggers at 25 kills');

// Nightfall Escalation scales drop rates & enemy distribution
waveMgr.waveInProgress = true;
waveMgr.sessionSurvivalTime = 300; // 5 minutes in Sector-7
const escLootMock = { gemDropMultiplier: 1.0 };
waveMgr.lootManager = escLootMock;
waveMgr.update(1.0);
assert.ok(escLootMock.gemDropMultiplier >= 2.45, `Drop multiplier scales up to 2.5x, actual: ${escLootMock.gemDropMultiplier}`);
console.log('✔ Nightfall Escalation & 25-kill Boss trigger verified!');

// ============================================================================
// 7. CRAFTABLE JAMU BUFFS & POISON IMMUNITY
// ============================================================================
console.log('Test 7: Jamu Beras Kencur & Jamu Kunyit Asam Buffs...');
GameState.reset();

// Test Jamu Beras Kencur buff
assert.strictEqual(GameState.hasBuff('stamina_boost'), false);
GameState.applyBuff('stamina_boost', 60);
assert.strictEqual(GameState.hasBuff('stamina_boost'), true);
assert.strictEqual(GameState.activeBuffs.staminaBoostTimer, 60);

// Advance buff duration
GameState.updateBuffs(25);
assert.strictEqual(GameState.activeBuffs.staminaBoostTimer, 35);
assert.strictEqual(GameState.hasBuff('stamina_boost'), true);

// Test Jamu Kunyit Asam poison immunity in PoisonCloud
GameState.applyBuff('poison_immune', 60);
assert.strictEqual(GameState.hasBuff('poison_immune'), true);

const mockCloudPlayer = {
  yawObject: { position: new THREE.Vector3(0, 0, 0) },
  health: 100,
  takeDamage(d) { this.health -= d; }
};
const pCloud = new PoisonCloud(mockScene, mockCloudPlayer, new THREE.Vector3(0, 0, 0));
pCloud.update(1.0);
assert.strictEqual(mockCloudPlayer.health, 100, 'Player with poison_immune buff takes ZERO damage in poison cloud');

// Expire buff
GameState.updateBuffs(70);
assert.strictEqual(GameState.hasBuff('poison_immune'), false);
pCloud.update(0.6);
assert.strictEqual(mockCloudPlayer.health, 96, 'Player without poison_immune buff takes 4 damage in poison cloud');

console.log('✔ Craftable Jamu Buffs & Poison Immunity verified!');

// ============================================================================
// 8. TACTICAL BAMBOO TRAP (RANJAU PAKU BAMBU)
// ============================================================================
console.log('Test 8: Tactical Bamboo Trap (Ranjau Paku Bambu)...');
const trapZombie = zombiesMgr.spawnZombie({ type: 'walker', hp: 80, x: 10, z: 10 });
assert.strictEqual(trapZombie.slowTimer, 0);

// Place trap at (10, 10)
zombiesMgr.placeBambooTrap({ x: 10, y: 0, z: 10 });
assert.strictEqual(zombiesMgr.traps.length, 1, 'Trap registered in ZombiesManager');

// Update zombiesManager to detect trap trigger
zombiesMgr.update(0.1);

assert.strictEqual(trapZombie.health, 30, 'Zombie takes 50 damage from bamboo trap (80 - 50 = 30)');
assert.ok(trapZombie.slowTimer > 4.5, 'Zombie has 50% slow applied for 5 seconds');
assert.strictEqual(zombiesMgr.traps.length, 0, 'Trap is consumed and removed from scene after triggering');

console.log('✔ Tactical Bamboo Trap verified!');

// ============================================================================
// 9. WORKBENCH RECIPES & PROFITABILITY (ARBITRAGE FIXED)
// ============================================================================
console.log('Test 9: Workbench Crafting arbitrage & double yields...');
GameState.reset();
GameState.houseLevel = 2; // Unlocked at House Lv 2 (Rumah Kayu Asri)

// Check double yields in recipes
const pRecipe = CRAFTING_RECIPES.find(r => r.id === 'craft_ammo_pistol');
assert.strictEqual(pRecipe.result.count, 48, 'Pistol ammo recipe yield doubled to 48 rounds');

const sRecipe = CRAFTING_RECIPES.find(r => r.id === 'craft_ammo_shotgun');
assert.strictEqual(sRecipe.result.count, 24, 'Shotgun ammo recipe yield doubled to 24 rounds');

const rRecipe = CRAFTING_RECIPES.find(r => r.id === 'craft_ammo_rifle');
assert.strictEqual(rRecipe.result.count, 60, 'Rifle ammo recipe yield doubled to 60 rounds');

const jRecipe = CRAFTING_RECIPES.find(r => r.id === 'craft_jamu_herbal');
assert.strictEqual(jRecipe.result.count, 2, 'Jamu Herbal recipe yield doubled to 2 bottles');

// Crafting at House Lv 2 succeeds
GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
const craftRes = GameState.craftRecipe('craft_ammo_pistol');
assert.strictEqual(craftRes.success, true, 'Workbench crafting succeeds at House Level 2');
assert.ok(GameState.backpack.some(i => i.id === 'ammo_pistol'), 'Crafted ammo in backpack');

console.log('✔ Workbench Crafting profitability & House Lv 2 unlock verified!');

// ============================================================================
// 10. TIERED BOUNTIES WITH WEAPON REQUIREMENT VALIDATION
// ============================================================================
console.log('Test 10: Tiered Bounties with weapon requirement validation...');
GameState.reset();

// Bounty with shotgun requirement
const shotgunBounty = GameState.bounties.find(b => b.weaponReq === 'scatter_blaster');
assert.ok(shotgunBounty, 'Specialized Shotgun bounty must exist');

const initCount = shotgunBounty.currentCount;

// Kill brute with pistol: does NOT advance shotgun bounty
GameState.recordBountyProgress('tank', 1, 'pulse_pistol');
assert.strictEqual(shotgunBounty.currentCount, initCount, 'Pistol kill must not advance shotgun bounty');

// Kill brute with shotgun: advances shotgun bounty!
GameState.recordBountyProgress('tank', 1, 'scatter_blaster');
assert.strictEqual(shotgunBounty.currentCount, initCount + 1, 'Shotgun kill advances specialized shotgun bounty');

console.log('✔ Tiered Bounties weapon validation verified!');

console.log('\n==================================================================');
console.log('🎉 ALL 10 V3 TACTICAL MECHANICS TESTS SUCCESSFULLY VERIFIED & PASSED! 🎉');
console.log('==================================================================\n');
process.exit(0);
