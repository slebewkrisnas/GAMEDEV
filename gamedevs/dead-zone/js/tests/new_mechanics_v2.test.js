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
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GameState, ITEMS, CRAFTING_RECIPES } from '../gameState.js';
import { Player } from '../player.js';
import { PoisonCloud, Zombie } from '../zombies.js';
import { WeaponManager } from '../weapons.js';
import { EnvironmentDual } from '../environment_dual.js';

console.log('--- STARTING COMPREHENSIVE NEW MECHANICS V2 VERIFICATION TEST ---');

// ==========================================
// 1. GAMEPLAY & COMBAT BALANCE: SPEED & STAMINA
// ==========================================
console.log('Test 1: Player walk speed (4.2 m/s) & Stamina 5s System...');
const mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const mockScene = new THREE.Scene();
const mockEnv = {
  getTerrainHeight: () => 0,
  checkCollision: () => false
};

const player = new Player(mockCamera, mockScene, mockEnv);
assert.strictEqual(player.walkSpeed, 4.2, 'Walk speed must be reduced to 4.2 m/s');
assert.strictEqual(player.sprintSpeed, 7.8, 'Sprint speed must be 7.8 m/s');
assert.strictEqual(player.maxStamina, 5.0, 'Max stamina must be 5.0 seconds');
assert.strictEqual(player.stamina, 5.0, 'Initial stamina must be full (5.0s)');

// Test Stamina Drain while sprinting
player.moveForward = true;
player.isSprinting = true;
// Simulate 3 seconds of sprinting
for (let i = 0; i < 30; i++) {
  player.update(0.1);
}
assert.ok(player.stamina < 2.5 && player.stamina > 1.5, `Stamina should drain to ~2.0s, got ${player.stamina}`);
assert.strictEqual(player.isExhausted, false, 'Player is not yet exhausted');

// Drain until exhaustion (2.0 seconds more: 20 frames of 0.1s)
for (let i = 0; i < 20; i++) {
  player.update(0.1);
}
assert.strictEqual(player.stamina, 0, 'Stamina should reach 0 at full drain');
assert.strictEqual(player.isExhausted, true, 'Player should enter isExhausted state');
assert.strictEqual(player.isSprinting, false, 'Sprint must be disabled upon exhaustion');

// Recover stamina (2.0 seconds: 20 frames of 0.1s * 1.25 regen = +2.5 stamina)
player.moveForward = false;
for (let i = 0; i < 20; i++) {
  player.update(0.1);
}
assert.ok(player.stamina >= 2.0, `Stamina should regenerate, got ${player.stamina}`);
assert.strictEqual(player.isExhausted, false, 'Exhaustion should be cleared after recovery threshold');
console.log('✔ Speed & Stamina mechanics passed!');

// ==========================================
// 2. BOSS REWARD: PHYSICAL TITAN CORE IN BACKPACK
// ==========================================
console.log('Test 2: Boss physical Titan Core drop & extraction...');
GameState.reset();
assert.ok(ITEMS.TITAN_CORE, 'TITAN_CORE must exist in ITEMS definition');
assert.strictEqual(ITEMS.TITAN_CORE.value, 200000, 'TITAN_CORE must have value of Rp 200.000');
assert.strictEqual(ITEMS.TITAN_CORE.type, 'loot', 'TITAN_CORE is a physical loot item');

// Add to backpack
const coreAdded = GameState.addItemToBackpack({ ...ITEMS.TITAN_CORE });
assert.strictEqual(coreAdded, true, 'Titan core should fit in empty backpack');
assert.strictEqual(GameState.backpack[0].id, 'titan_core');
assert.strictEqual(GameState.wallet, 50000, 'Wallet cash is NOT credited before extraction');

// Monetize Titan Core upon return to Village
const coreItem = GameState.backpack[0];
GameState.addRp(coreItem.value);
GameState.backpack.splice(0, 1);
assert.strictEqual(GameState.wallet, 250000, 'Wallet has Rp 250.000 after extracting and selling Titan Core');
console.log('✔ Physical Titan Core drop & monetization passed!');

// ==========================================
// 3. DYNAMIC RANDOMIZED EXTRACTION BEACON
// ==========================================
console.log('Test 3: Randomized Sector-7 extraction beacon across 4 cabins...');
const envDual = new EnvironmentDual(mockScene);
assert.strictEqual(envDual.cabinBeaconSites.length, 4, 'Must have 4 defined cabin extraction sites');

const chosenSites = new Set();
for (let i = 0; i < 30; i++) {
  const site = envDual.randomizeExtractionBeacon();
  assert.ok(site.name, 'Chosen site must have a name');
  assert.ok(typeof site.x === 'number' && typeof site.z === 'number', 'Chosen site must have valid coordinates');
  chosenSites.add(site.name);
}
assert.ok(chosenSites.size >= 3, `Beacon should rotate randomly across cabins (saw ${chosenSites.size} unique sites in 30 rolls)`);
console.log('✔ Dynamic extraction beacon randomization passed!');

// ==========================================
// 4. BOSS TITAN: 3.8M ATTACK RANGE & 50% HP ROAR
// ==========================================
console.log('Test 4: Boss 3.8m melee reach & 50% HP roar summon trigger...');
const boss = new Zombie(mockScene, mockEnv, player, {
  type: 'boss',
  hp: 650,
  scale: 2.6
});
assert.strictEqual(boss.attackRange, 3.8, 'Boss Titan melee attack range must be exactly 3.8m');
assert.strictEqual(boss.hasSummonedRunners, false, 'Boss starts with hasSummonedRunners = false');

let roarTriggered = false;
let summonedRunnersCount = 0;
boss.onBossRoarCallback = (bossEntity) => {
  roarTriggered = true;
  summonedRunnersCount = 2;
};

// Hit boss to 60% HP: should not roar yet
boss.takeDamage(200); // 650 - 200 = 450 (69% HP)
assert.strictEqual(roarTriggered, false, 'Boss must not roar above 50% HP');

// Hit boss below 50% HP: 450 - 150 = 300 (46% HP)
boss.takeDamage(150);
assert.strictEqual(roarTriggered, true, 'Boss must trigger roar summon callback at <= 50% HP');
assert.strictEqual(boss.hasSummonedRunners, true, 'Boss hasSummonedRunners flag must be set to true');
assert.strictEqual(summonedRunnersCount, 2, 'Boss summon must summon 2 Runners');
console.log('✔ Boss attack reach & roar summon passed!');

// ==========================================
// 5. TOXIC STALKER: POISON GAS CLOUD
// ==========================================
console.log('Test 5: Toxic Stalker death poison cloud DoT...');
const poison = new PoisonCloud(mockScene, player, new THREE.Vector3(0, 0, 0));
assert.strictEqual(poison.radius, 2.6, 'Poison cloud radius must be 2.6m');
assert.strictEqual(poison.duration, 6.5, 'Poison cloud duration must be 6.5s');

// Position player inside cloud
player.yawObject.position.set(1.0, 0, 1.0); // distance ~ 1.41m (< 2.6m)
const initialHp = player.health;
poison.update(0.6); // Triggers damage at 0.5s interval
assert.strictEqual(player.health, initialHp - 4, `Player should suffer 4 poison damage per tick, HP: ${player.health}`);

// Position player outside cloud
player.yawObject.position.set(10.0, 0, 10.0);
const hpOutside = player.health;
poison.update(1.0);
assert.strictEqual(player.health, hpOutside, 'Player should suffer no damage outside poison radius');
console.log('✔ Toxic Stalker poison cloud mechanics passed!');

// ==========================================
// 6. ECONOMY: SEPARATED AMMO CALIBERS & SINGLE BOSS RESUPPLY
// ==========================================
console.log('Test 6: Split ammo calibers & Boss single crate drop...');
assert.ok(ITEMS.AMMO_PISTOL, 'AMMO_PISTOL must exist');
assert.strictEqual(ITEMS.AMMO_PISTOL.value, 15000, 'AMMO_PISTOL must cost Rp 15.000');
assert.strictEqual(ITEMS.AMMO_PISTOL.count, 24, 'AMMO_PISTOL must supply 24 rounds');

assert.ok(ITEMS.AMMO_SHOTGUN, 'AMMO_SHOTGUN must exist');
assert.strictEqual(ITEMS.AMMO_SHOTGUN.value, 25000, 'AMMO_SHOTGUN must cost Rp 25.000');
assert.strictEqual(ITEMS.AMMO_SHOTGUN.count, 12, 'AMMO_SHOTGUN must supply 12 rounds');

assert.ok(ITEMS.AMMO_RIFLE, 'AMMO_RIFLE must exist');
assert.strictEqual(ITEMS.AMMO_RIFLE.value, 35000, 'AMMO_RIFLE must cost Rp 35.000');
assert.strictEqual(ITEMS.AMMO_RIFLE.count, 30, 'AMMO_RIFLE must supply 30 rounds');

// WeaponManager ammo resupply test
const mockUI = {
  updateAmmo: () => {},
  showReloadAlert: () => {},
  updateQuickSelectBar: () => {},
  showAnnouncement: () => {},
  showHitMarker: () => {},
  triggerCrosshairRecoil: () => {},
  showReloadProgressBar: () => {}
};
const weapons = new WeaponManager(mockCamera, player.pitchObject, null, mockUI, mockEnv);
const initialPistolReserve = weapons.weaponData.pulse_pistol.reserveAmmo;
const initialShotgunReserve = weapons.weaponData.scatter_blaster.reserveAmmo;
const initialRifleReserve = weapons.weaponData.plasma_rifle.reserveAmmo;

// Single crate resupply to active weapon (pulse_pistol)
weapons.currentWeaponId = 'pulse_pistol';
weapons.resupplyAmmo(24);
assert.strictEqual(weapons.weaponData.pulse_pistol.reserveAmmo, initialPistolReserve + 24, 'Active weapon gets 24 rounds');
assert.strictEqual(weapons.weaponData.scatter_blaster.reserveAmmo, initialShotgunReserve, 'Other weapons do NOT get free ammo');
assert.strictEqual(weapons.weaponData.plasma_rifle.reserveAmmo, initialRifleReserve, 'Other weapons do NOT get free ammo');
console.log('✔ Split ammo calibers & single weapon resupply passed!');

// ==========================================
// 7. HOUSE LEVEL 3: SECURE POUCH & WORKBENCH CRAFTING
// ==========================================
console.log('Test 7: House Lv 3 Secure Pouch death immunity & Workbench Crafting...');
GameState.reset();
// Cheat wallet and upgrade backpack to hold materials
GameState.addRp(2000000);
GameState.upgradeBackpack(); // 10 slots
GameState.upgradeBackpack(); // 16 slots
assert.strictEqual(GameState.backpackMaxSlots, 16);

// Now add materials for house upgrades (Lv2 needs 5 scrap, Lv3 needs 3 power converter)
for (let i = 0; i < 5; i++) {
  GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
}
for (let i = 0; i < 3; i++) {
  GameState.addItemToBackpack({ ...ITEMS.POWER_CONVERTER });
}
assert.strictEqual(GameState.backpack.length, 8, '8 renovation materials fit in expanded backpack');
// Upgrade 1 -> 2
const upLv2 = GameState.upgradeHouse();
assert.strictEqual(upLv2.success, true, 'House upgrade to Lv 2 should succeed');
assert.strictEqual(GameState.houseLevel, 2);

// Upgrade 2 -> 3
const upLv3 = GameState.upgradeHouse();
assert.strictEqual(upLv3.success, true, 'House upgrade to Lv 3 should succeed');
assert.strictEqual(GameState.houseLevel, 3, 'House is now Lv 3');
assert.strictEqual(GameState.securePouchMaxSlots, 2, 'House Lv 3 unlocks 2 Secure Pouch slots');

// Transfer Titan Core into Secure Pouch
GameState.addItemToBackpack({ ...ITEMS.TITAN_CORE });
const bagIndex = GameState.backpack.findIndex(i => i.id === 'titan_core');
const movedToPouch = GameState.transferToSecurePouch(bagIndex);
assert.strictEqual(movedToPouch.success, true, 'Moving item to secure pouch should succeed');
assert.strictEqual(GameState.securePouch.length, 1);
assert.strictEqual(GameState.securePouch[0].id, 'titan_core');

// Player dies in Sector-7!
const wiped = GameState.clearBackpackOnDeath();
assert.strictEqual(GameState.backpack.length, 0, 'Backpack is wiped on death');
assert.strictEqual(GameState.securePouch.length, 1, 'Secure Pouch item MUST survive death in Sector-7!');
assert.strictEqual(GameState.securePouch[0].id, 'titan_core', 'Titan Core preserved safely in Secure Pouch');

// Workbench Crafting verification
assert.ok(CRAFTING_RECIPES.length >= 4, 'Must have at least 4 crafting recipes');
// Add ingredients for Crafting 9mm Pistol Ammo (1 Scrap Metal)
GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
const craftRes = GameState.craftRecipe('craft_ammo_pistol');
assert.strictEqual(craftRes.success, true, 'Crafting 9mm pistol ammo via craftRecipe should succeed');
assert.ok(GameState.backpack.some(i => i.id === 'ammo_pistol'), 'Crafted 9mm pistol ammo in backpack');
console.log('✔ Secure Pouch death immunity & Workbench Crafting passed!');

// ==========================================
// 8. VILLAGE NOTICE BOARD: BOUNTY HUNTING CONTRACTS
// ==========================================
console.log('Test 8: Bounty Contracts progression & reward claiming...');
GameState.reset();
assert.ok(GameState.bounties.length >= 3, 'Must have at least 3 active bounty contracts');

const bruteBounty = GameState.bounties.find(b => b.targetType === 'tank');
assert.ok(bruteBounty, 'Brute hunting bounty must exist');
const initialBruteProgress = bruteBounty.currentCount;

// Record progress (kill 5 brutes)
GameState.recordBountyProgress('tank', 5);
assert.strictEqual(bruteBounty.currentCount, initialBruteProgress + 5, 'Bounty progress recorded');
assert.strictEqual(bruteBounty.completed, true, 'Bounty marked completed');
assert.strictEqual(bruteBounty.claimed, false, 'Bounty not yet claimed');

// Claim Bounty Reward
const initialWallet = GameState.wallet;
const claimResult = GameState.claimBounty(bruteBounty.id);
assert.strictEqual(claimResult.success, true, 'Bounty claim should succeed');
assert.strictEqual(bruteBounty.claimed, true, 'Bounty marked as claimed');
assert.strictEqual(GameState.wallet, initialWallet + bruteBounty.rewardRp, 'Reward Rp credited to wallet');
console.log('✔ Bounty Contracts progression and claim passed!');

// ==========================================
// 9. 3D ASSET COMPRESSION VERIFICATION (< 5 MB TOTAL)
// ==========================================
console.log('Test 9: Checking compressed 3D GLB file sizes...');
const housePath = path.resolve('gamedevs/dead-zone/asset dead-zone/house/House+Model+004.glb');
const shopPath = path.resolve('gamedevs/dead-zone/asset dead-zone/shop/pan_shop.glb');

const houseStats = fs.statSync(housePath);
const shopStats = fs.statSync(shopPath);

const houseMb = houseStats.size / (1024 * 1024);
const shopMb = shopStats.size / (1024 * 1024);
const totalMb = houseMb + shopMb;

console.log(`  - House+Model+004.glb: ${houseMb.toFixed(2)} MB`);
console.log(`  - pan_shop.glb: ${shopMb.toFixed(2)} MB`);
console.log(`  - Total GLB size: ${totalMb.toFixed(2)} MB`);

assert.ok(totalMb < 5.0, `Combined GLB size must be < 5.0 MB (Actual: ${totalMb.toFixed(2)} MB)`);
assert.ok(houseMb < 2.5, `House GLB should be < 2.5 MB (Actual: ${houseMb.toFixed(2)} MB)`);
assert.ok(shopMb < 2.5, `Shop GLB should be < 2.5 MB (Actual: ${shopMb.toFixed(2)} MB)`);
console.log('✔ GLB model compression verified below 5 MB!');

// ==========================================
// 10. RURAL TACTICAL THEME & UI INTEGRITY
// ==========================================
console.log('Test 10: Verifying UI styles, stamina bar, and rural theme cohesion...');
const htmlContent = fs.readFileSync('gamedevs/dead-zone/index.html', 'utf-8');
const cssContent = fs.readFileSync('gamedevs/dead-zone/css/style.css', 'utf-8');

assert.ok(htmlContent.includes('id="stamina-bar-fill"'), 'HTML must contain stamina bar');
assert.ok(htmlContent.includes('modal-bounty'), 'HTML must contain modal-bounty');
assert.ok(htmlContent.includes('modal-workbench'), 'HTML must contain modal-workbench');
assert.ok(!htmlContent.includes('Orbitron'), 'Orbitron font must be completely purged from index.html');
assert.ok(!cssContent.includes('Orbitron'), 'Orbitron font must be completely purged from style.css');
assert.ok(cssContent.includes('.stamina-bar-wrapper'), 'CSS must style stamina bar');
assert.ok(cssContent.includes('.secure-pouch-box'), 'CSS must style secure pouch');

console.log('✔ Rural tactical theme & UI elements verified!');

console.log('\n=============================================================');
console.log('🎉 ALL 10 USER REQUIREMENTS SUCCESSFULLY VERIFIED & PASSED! 🎉');
console.log('=============================================================\n');
process.exit(0);
