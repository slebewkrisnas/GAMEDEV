// ============================================================================
// DEAD ZONE — COMPREHENSIVE INVENTORY REBUILD V6 TEST SUITE
// Verifies Full Inventory Architecture, Equipment Slots, Weapon State Machine,
// Ammo Synchronization, Split/Merge/Move/Drop, Stash, and V6 Persistence.
// ============================================================================

import assert from 'assert';
import {
  GameState,
  ITEM_DEFINITIONS,
  getItemDefinition,
  createItemInstance,
  wrapSlotInstance
} from '../gameState.js';
import { WEAPON_CONFIGS, WeaponManager } from '../weapons.js';

// Setup Mock Browser Environment
const storageStore = {};
global.localStorage = {
  getItem: (key) => storageStore[key] || null,
  setItem: (key, val) => { storageStore[key] = String(val); },
  removeItem: (key) => { delete storageStore[key]; },
  clear: () => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }
};

global.document = {
  pointerLockElement: null,
  exitPointerLock: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {}
};

console.log('==================================================================');
console.log('🧪 RUNNING DEAD ZONE V6 INVENTORY REBUILD VERIFICATION SUITE');
console.log('==================================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: MASTER ITEM ARCHITECTURE & INSTANCE FACTORY
// ----------------------------------------------------------------------------
console.log('--- Test 1: Item Definitions & Instance Creation Factory ---');
GameState.reset();

// Verify ITEM_DEFINITIONS integrity
assert.ok(Object.keys(ITEM_DEFINITIONS).length >= 20, 'ITEM_DEFINITIONS must contain all master items');
const rifleDef = getItemDefinition('plasma_rifle');
assert.ok(rifleDef, 'Plasma rifle definition must exist');
assert.strictEqual(rifleDef.type, 'weapon', 'Rifle must have type weapon');
assert.strictEqual(rifleDef.equipSlot, 'primary', 'Rifle must target primary equipSlot');
assert.strictEqual(rifleDef.maxStack, 1, 'Weapons must have maxStack 1');

// Verify createItemInstance
const inst1 = createItemInstance('pulse_pistol', 1, { ammoInMag: 12 });
assert.ok(inst1.instanceId && inst1.instanceId.startsWith('inst_'), 'Item instance must have unique instanceId');
assert.strictEqual(inst1.itemId, 'pulse_pistol');
assert.strictEqual(inst1.quantity, 1);
assert.strictEqual(inst1.customData.ammoInMag, 12);
assert.strictEqual(inst1.durability, 100);

// Verify wrapSlotInstance
const wrapped1 = wrapSlotInstance(inst1, 0);
assert.strictEqual(wrapped1.slotIndex, 0);
assert.strictEqual(wrapped1.itemId, 'pulse_pistol');
assert.strictEqual(wrapped1.count, 1);
assert.ok(wrapped1.item && wrapped1.item.id === 'pulse_pistol', 'Wrapped slot must have backward-compatible .item reference');
console.log('  ✓ Item definitions, factory instances, and slot wrappers verified');

// ----------------------------------------------------------------------------
// TEST 2: 60-SLOT UNIFIED CONTAINER, STACKING & OVERFLOW
// ----------------------------------------------------------------------------
console.log('\n--- Test 2: 60-Slot Container Stacking, Overflow & Capacity Bounds ---');
GameState.reset();
assert.strictEqual(GameState.inventoryMaxSlots, 60, 'Inventory max slots must be 60');
assert.strictEqual(GameState.getInventoryUsedSlots(), 0, 'Used slots must start at 0');
assert.strictEqual(GameState.getInventoryFreeSlots(), 60, 'Free slots must start at 60');

// Add 50 wood (wood maxStack is 99)
const addWoodRes = GameState.addItemToInventory('wood', 50, false);
assert.strictEqual(addWoodRes.success, true);
assert.strictEqual(GameState.getInventoryUsedSlots(), 1);
assert.strictEqual(GameState.inventory[0].quantity, 50);

// Add 70 more wood -> Slot 0 becomes 99, 21 overflows into Slot 1
const addOverflowRes = GameState.addItemToInventory('wood', 70, false);
assert.strictEqual(addOverflowRes.success, true);
assert.strictEqual(GameState.getInventoryUsedSlots(), 2);
assert.strictEqual(GameState.inventory[0].quantity, 99, 'Slot 0 must cap at 99');
assert.strictEqual(GameState.inventory[1].quantity, 21, 'Slot 1 must contain overflow 21');
console.log('  ✓ Stacking and overflow to next slot verified');

// Fill all 60 slots
while (GameState.inventory.length < 60) {
  GameState.inventory.push(wrapSlotInstance(createItemInstance('scrap_metal', 1), GameState.inventory.length));
}
assert.strictEqual(GameState.getInventoryUsedSlots(), 60, 'Container should be completely full');
assert.strictEqual(GameState.getInventoryFreeSlots(), 0, 'Free slots must be 0');

// Adding new unstackable item to completely full inventory must safely fail
const fullFailRes = GameState.addItemToInventory('pulse_pistol', 1, false);
assert.strictEqual(fullFailRes.success, false, 'Adding to full container must fail');
assert.strictEqual(GameState.getInventoryUsedSlots(), 60, 'Used slots must remain 60');
console.log('  ✓ Strict 60-slot bounds and overflow rejection verified');

// ----------------------------------------------------------------------------
// TEST 3: STACK SPLITTING, MERGING & MOVING
// ----------------------------------------------------------------------------
console.log('\n--- Test 3: Stack Splitting, Slot Merging & Moving ---');
GameState.reset();
// Slot 0: 30 pistol ammo (maxStack 120)
GameState.addItemToInventory('ammo_pistol', 30, false);
assert.strictEqual(GameState.inventory[0].quantity, 30);

// Split 10 ammo from slot 0
const splitRes = GameState.splitStack(0, 10);
assert.strictEqual(splitRes.success, true, 'Split must succeed');
assert.strictEqual(GameState.inventory[0].quantity, 20, 'Slot 0 must now have 20');
assert.strictEqual(GameState.inventory[1].quantity, 10, 'Slot 1 must now have 10');
assert.strictEqual(GameState.getInventoryUsedSlots(), 2);

// Rejection of invalid split counts
const splitInvalid1 = GameState.splitStack(0, 0);
assert.strictEqual(splitInvalid1.success, false, 'Split of 0 must fail');
const splitInvalid2 = GameState.splitStack(0, 20);
assert.strictEqual(splitInvalid2.success, false, 'Split of total count must fail');

// Merge slot 1 back into slot 0
const mergeRes = GameState.mergeSlots(1, 0);
assert.strictEqual(mergeRes.success, true, 'Merge must succeed');
assert.strictEqual(mergeRes.action, 'merged');
assert.strictEqual(GameState.inventory[0].quantity, 30, 'Slot 0 should now be merged back to 30');
assert.strictEqual(GameState.getInventoryUsedSlots(), 1, 'Only 1 slot should remain used');

// Move slot 0 to an empty slot 5
// First add dummy items to slots 1, 2, 3, 4, 5
while (GameState.inventory.length < 6) {
  GameState.inventory.push(null);
}
const moveRes = GameState.moveItem(0, 5);
assert.strictEqual(moveRes.success, true, 'Move must succeed');
assert.strictEqual(GameState.inventory[0], null, 'Slot 0 should now be null');
assert.strictEqual(GameState.inventory[5].itemId, 'ammo_pistol', 'Slot 5 should have ammo');
assert.strictEqual(GameState.inventory[5].slotIndex, 5);
console.log('  ✓ Stack splitting, merging, and moving verified');

// ----------------------------------------------------------------------------
// TEST 4: EQUIPMENT CONTAINER (5 SLOTS) & ATOMIC SWAP
// ----------------------------------------------------------------------------
console.log('\n--- Test 4: Equipment Slots (Primary, Secondary, Melee, Throwable, Armor) ---');
GameState.reset();
assert.ok(GameState.equipment, 'GameState.equipment must exist');
assert.strictEqual(typeof GameState.equipment, 'object');
assert.ok('primary' in GameState.equipment);
assert.ok('secondary' in GameState.equipment);
assert.ok('melee' in GameState.equipment);
assert.ok('throwable' in GameState.equipment);
assert.ok('armor' in GameState.equipment);

// Add a plasma rifle to inventory slot 0
GameState.addItemToInventory('plasma_rifle', 1, false);
assert.strictEqual(GameState.inventory[0].itemId, 'plasma_rifle');
assert.strictEqual(GameState.equipment.primary, null);

// Equip rifle into primary slot
const equipRes1 = GameState.equipItem(0);
assert.strictEqual(equipRes1.success, true, 'Equip rifle must succeed');
assert.strictEqual(equipRes1.slot, 'primary');
assert.ok(GameState.equipment.primary, 'Primary slot must now have rifle');
assert.strictEqual(GameState.equipment.primary.itemId, 'plasma_rifle');
assert.strictEqual(GameState.getInventoryUsedSlots(), 0, 'Inventory slot should now be vacated');

// Unequip primary rifle back to inventory
const unequipRes1 = GameState.unequipItem('primary');
assert.strictEqual(unequipRes1.success, true, 'Unequip must succeed');
assert.strictEqual(GameState.equipment.primary, null, 'Primary slot must now be null');
assert.strictEqual(GameState.getInventoryUsedSlots(), 1, 'Inventory should receive unequipped rifle');
assert.strictEqual(GameState.inventory[0].itemId, 'plasma_rifle');

// Atomic Swap Test:
// Equip primary rifle, then add shotgun to inventory and equip shotgun -> rifle swaps back to inventory
GameState.equipItem(0);
assert.ok(GameState.equipment.primary && GameState.equipment.primary.itemId === 'plasma_rifle');
GameState.addItemToInventory('scatter_blaster', 1, false);
const swapEquipRes = GameState.equipItem(0);
assert.strictEqual(swapEquipRes.success, true, 'Equipping shotgun into occupied primary slot must succeed');
assert.strictEqual(GameState.equipment.primary.itemId, 'scatter_blaster', 'Primary slot should now hold shotgun');
assert.strictEqual(GameState.inventory[0].itemId, 'plasma_rifle', 'Inventory slot 0 should now hold swapped rifle');
console.log('  ✓ 5 Equipment slots, atomic equip, swap, and unequip verified');

// ----------------------------------------------------------------------------
// TEST 5: FULL INVENTORY UNEQUIP REJECTION
// ----------------------------------------------------------------------------
console.log('\n--- Test 5: Full Inventory Unequip Rejection ---');
// Fill entire inventory to 60 slots while shotgun is equipped
while (GameState.inventory.length < 60) {
  GameState.inventory.push(wrapSlotInstance(createItemInstance('scrap_metal', 1), GameState.inventory.length));
}
assert.strictEqual(GameState.getInventoryUsedSlots(), 60);

// Unequip must safely fail because there are 0 free slots
const unequipFullFail = GameState.unequipItem('primary');
assert.strictEqual(unequipFullFail.success, false, 'Unequip into full inventory must fail');
assert.ok(GameState.equipment.primary, 'Primary weapon must remain equipped');
assert.strictEqual(GameState.equipment.primary.itemId, 'scatter_blaster');
console.log('  ✓ Full inventory unequip protection verified');

// ----------------------------------------------------------------------------
// TEST 6: WEAPON STATE MACHINE & INVENTORY AMMO SYNCHRONIZATION
// ----------------------------------------------------------------------------
console.log('\n--- Test 6: Weapon State Machine & Inventory Ammo Sync ---');
GameState.reset();

// Setup mock Three.js camera & parent group
const mockCamera = { position: { x: 0, y: 1.7, z: 0 } };
const mockParentGroup = {
  add: () => {},
  remove: () => {},
  position: { copy: () => {}, set: () => {} }
};
const mockUiManager = {
  showReloadAlert: () => {},
  showReloadProgressBar: () => {},
  updateReloadProgress: () => {},
  updateAmmo: () => {},
  updateQuickSelectBar: () => {},
  updateWeaponName: () => {},
  showAnnouncement: () => {},
  triggerCrosshairRecoil: () => {},
  showHitMarker: () => {}
};

const wm = new WeaponManager(mockCamera, mockParentGroup, null, mockUiManager, null, null);
assert.strictEqual(wm.switchState, 'IDLE', 'Initial switchState must be IDLE');

// Test switch initiation
wm.switchWeapon('machete');
assert.strictEqual(wm.switchState, 'SWITCHING_OUT', 'Weapon switch must enter SWITCHING_OUT');
assert.strictEqual(wm.pendingWeaponId, 'machete');

// Advance delta 0.20s (duration is 0.18s) to transition to SWITCHING_IN
wm.update(0.20);
assert.strictEqual(wm.switchState, 'SWITCHING_IN', 'Switch must transition to SWITCHING_IN');
assert.strictEqual(wm.currentWeaponId, 'machete', 'Active weapon must now be machete');

// Advance delta 0.20s to complete switch to IDLE
wm.update(0.20);
assert.strictEqual(wm.switchState, 'IDLE', 'Switch must complete to IDLE');

// Inventory Ammo Synchronization during Reload:
// Equip Pistol with 0 bullets in mag
wm.switchWeapon('pulse_pistol');
wm.update(0.20); // SWITCHING_OUT -> SWITCHING_IN
wm.update(0.20); // SWITCHING_IN -> IDLE
assert.strictEqual(wm.switchState, 'IDLE', 'Switch to pistol must complete to IDLE');
wm.ammoInMag = 0;

// Add 24 pistol bullets to inventory
GameState.addItemToInventory('ammo_pistol', 24, false);
const resAmmoBefore = wm.getReserveAmmo('pulse_pistol');
assert.strictEqual(resAmmoBefore, 24, 'Reserve ammo must calculate 24 bullets from inventory');

// Reload weapon
wm.reload();
assert.strictEqual(wm.isReloading, true, 'Reload must be active');
wm.update(wm.reloadDuration + 0.1);
assert.strictEqual(wm.isReloading, false, 'Reload must complete');
assert.strictEqual(wm.ammoInMag, 12, 'Pistol mag must be filled to 12');
assert.strictEqual(wm.getReserveAmmo('pulse_pistol'), 12, 'Inventory should have 12 bullets remaining (24 - 12)');

// Active equipment instance customData must reflect ammo in mag
const curEquippedPistol = GameState.equipment.secondary;
if (curEquippedPistol) {
  assert.strictEqual(curEquippedPistol.customData.ammoInMag, 12, 'Equipped item instance must sync ammoInMag');
}
console.log('  ✓ Weapon switching state machine and inventory ammo sync verified');

// ----------------------------------------------------------------------------
// TEST 7: STORAGE & WAREHOUSE (SAFEHOUSE STASH)
// ----------------------------------------------------------------------------
console.log('\n--- Test 7: Stash Deposit, Withdraw, Deposit All, Withdraw All ---');
GameState.reset();

// Add items to inventory
GameState.addItemToInventory('scrap_metal', 20, false);
GameState.addItemToInventory('titan_core', 2, false);
assert.strictEqual(GameState.getInventoryUsedSlots(), 2);
assert.strictEqual(GameState.stash.length, 0);

// Deposit 10 scrap metal to stash
const depRes = GameState.depositToStash(0, 10);
assert.strictEqual(depRes.success, true, 'Deposit to stash must succeed');
assert.strictEqual(GameState.inventory[0].quantity, 10, '10 scrap metal must remain in inventory');
assert.strictEqual(GameState.stash.length, 1, 'Stash must now have 1 slot');
assert.strictEqual(GameState.stash[0].quantity, 10, 'Stash slot must hold 10 scrap metal');

// Withdraw 5 scrap metal back to inventory
const withRes = GameState.withdrawFromStash(0, 5);
assert.strictEqual(withRes.success, true, 'Withdraw from stash must succeed');
assert.strictEqual(GameState.stash[0].quantity, 5, 'Stash should have 5 remaining');
assert.strictEqual(GameState.inventory[0].quantity, 15, 'Inventory should now have 15 scrap metal (10 + 5)');

// Deposit All to Stash
const depAllRes = GameState.depositAllToStash();
assert.strictEqual(depAllRes.success, true, 'Deposit all must succeed');
assert.strictEqual(GameState.getInventoryUsedSlots(), 0, 'Inventory should now be empty');
assert.ok(GameState.stash.length >= 2, 'Stash should hold deposited items');

// Withdraw All from Stash
const withAllRes = GameState.withdrawAllFromStash();
assert.strictEqual(withAllRes.success, true, 'Withdraw all must succeed');
assert.strictEqual(GameState.stash.length, 0, 'Stash should now be empty');
assert.ok(GameState.getInventoryUsedSlots() >= 2, 'Inventory should receive all withdrawn items');
console.log('  ✓ Safehouse stash deposit and withdraw operations verified');

// ----------------------------------------------------------------------------
// TEST 8: SCHEMA VERSION 6 PERSISTENCE & FULL LOADOUT RESTORATION
// ----------------------------------------------------------------------------
console.log('\n--- Test 8: Schema Version 6 Persistence & Migration ---');
localStorage.clear();
GameState.reset();

// Setup detailed state
GameState.addItemToInventory('wood', 42, false);
GameState.addItemToInventory('titan_core', 1, false);
GameState.equipment.primary = wrapSlotInstance(createItemInstance('plasma_rifle', 1, { ammoInMag: 28 }), -1);
GameState.equipment.secondary = wrapSlotInstance(createItemInstance('pulse_pistol', 1, { ammoInMag: 9 }), -1);
GameState.activeEquipSlot = 'primary';
GameState.wallet = 750000;

// Save to storage
GameState.saveToStorage();
const savedRaw = localStorage.getItem('SCIFI_SURVIVAL_STATE');
assert.ok(savedRaw, 'Save state must exist in storage');
const parsedSave = JSON.parse(savedRaw);
assert.strictEqual(parsedSave.version, 6, 'Save schema version must be 6');
assert.ok(parsedSave.equipment, 'Saved state must contain equipment object');
assert.strictEqual(parsedSave.equipment.primary.itemId, 'plasma_rifle');
assert.strictEqual(parsedSave.equipment.primary.customData.ammoInMag, 28);
assert.strictEqual(parsedSave.activeEquipSlot, 'primary');

// Reset and load
GameState.reset();
GameState.loadFromStorage();
assert.strictEqual(GameState.wallet, 750000, 'Wallet must be restored');
assert.strictEqual(GameState.activeEquipSlot, 'primary', 'Active equipment slot must be restored');
assert.ok(GameState.equipment.primary, 'Primary weapon must be restored');
assert.strictEqual(GameState.equipment.primary.itemId, 'plasma_rifle');
assert.strictEqual(GameState.equipment.primary.customData.ammoInMag, 28, 'Mag ammo must be restored');
assert.strictEqual(GameState.getInventoryUsedSlots(), 2, '2 inventory items must be restored');
assert.strictEqual(GameState.inventory[0].quantity, 42, '42 wood must be restored');
console.log('  ✓ Version 6 persistence and exact loadout restoration verified');

// ----------------------------------------------------------------------------
// TEST 9: SEAMLESS BACKWARD-COMPATIBLE MIGRATION FROM V1-V5
// ----------------------------------------------------------------------------
console.log('\n--- Test 9: Seamless Backward Migration from V1-V5 ---');
localStorage.clear();
const legacyV4Save = {
  version: 4,
  wallet: 150000,
  backpack: [
    { id: 'titan_core', name: 'Inti Titan', value: 100000, type: 'loot', icon: '👑' },
    { id: 'wood', name: 'Kayu Rimba', value: 10000, type: 'material', icon: '🪵', count: 15 }
  ],
  stash: [
    { id: 'scrap_metal', name: 'Besi Bekas', value: 15000, type: 'material', count: 20 }
  ],
  ownedWeapons: ['pulse_pistol', 'plasma_rifle'],
  houseLevel: 2
};
localStorage.setItem('SCIFI_SURVIVAL_STATE', JSON.stringify(legacyV4Save));

GameState.reset();
GameState.loadFromStorage();
assert.strictEqual(GameState.wallet, 150000, 'Migrated wallet must match');
assert.strictEqual(GameState.getInventoryUsedSlots(), 2, 'Legacy backpack items must populate 60-slot inventory');
assert.ok(GameState.equipment.secondary, 'Default pistol must be equipped in secondary');
assert.ok(GameState.equipment.primary, 'Owned plasma rifle must be auto-equipped in primary');
assert.strictEqual(GameState.stash.length, 1, 'Stash must be migrated');
assert.strictEqual(GameState.stash[0].quantity, 20, 'Stash count must match');
console.log('  ✓ Seamless legacy migration from earlier schema versions verified');

console.log('\n==================================================================');
console.log('🎉 ALL 9 V6 INVENTORY REBUILD TESTS PASSED WITH 100% SUCCESS! 🎉');
console.log('==================================================================\n');
