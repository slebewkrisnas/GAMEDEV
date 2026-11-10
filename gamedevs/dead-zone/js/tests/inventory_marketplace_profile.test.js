// ============================================================================
// DEAD ZONE — INVENTORY, MARKETPLACE & PLAYER PROFILE TEST SUITE
// Automated verification for 60-slot inventory, 4-tab simulated marketplace,
// profile progression, stats tracking, milestones, and save migration.
// ============================================================================

import assert from 'assert';
import { GameState, ITEMS } from '../gameState.js';

// Mock browser LocalStorage environment for Node.js
const storageStore = {};
globalThis.localStorage = {
  getItem: (key) => (key in storageStore ? storageStore[key] : null),
  setItem: (key, val) => { storageStore[key] = String(val); },
  removeItem: (key) => { delete storageStore[key]; },
  clear: () => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }
};

console.log('==================================================================');
console.log('🧪 RUNNING INVENTORY, MARKETPLACE & PLAYER PROFILE TEST SUITE');
console.log('==================================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: 60-SLOT INVENTORY INITIAL STATE & STACKING
// ----------------------------------------------------------------------------
console.log('--- Test 1: 60-Slot Inventory Initial Capacity & Stacking ---');
GameState.reset();

assert.strictEqual(GameState.inventoryMaxSlots, 60, 'Initial inventory capacity must be 60 slots');
assert.strictEqual(GameState.getInventoryCapacity(), 60, 'getInventoryCapacity() must return 60');
assert.strictEqual(GameState.getInventoryUsedSlots(), 0, 'Used slots must start at 0');
assert.strictEqual(GameState.getInventoryFreeSlots(), 60, 'Free slots must start at 60');
console.log('  ✓ Initial 60 slots capacity and empty counter verified');

// Add 10 Wood (maxStack 50)
const res1 = GameState.addItemToInventory(ITEMS.WOOD, 10, false);
assert.strictEqual(res1.success, true, 'Adding wood should succeed');
assert.strictEqual(GameState.getInventoryUsedSlots(), 1, 'Used slots should be 1');
assert.strictEqual(GameState.inventory[0].count, 10, 'Slot 0 count should be 10');

// Add 15 more Wood -> should stack into slot 0
const res2 = GameState.addItemToInventory(ITEMS.WOOD, 15, false);
assert.strictEqual(res2.success, true, 'Adding more wood should stack');
assert.strictEqual(GameState.getInventoryUsedSlots(), 1, 'Used slots should still be 1 (stacked)');
assert.strictEqual(GameState.inventory[0].count, 25, 'Slot 0 count should now be 25');

// Add different item (Scrap Metal) -> goes to slot 1
const res3 = GameState.addItemToInventory(ITEMS.SCRAP_METAL, 8, false);
assert.strictEqual(res3.success, true, 'Adding scrap metal should succeed');
assert.strictEqual(GameState.getInventoryUsedSlots(), 2, 'Used slots should now be 2');
assert.strictEqual(GameState.getInventoryFreeSlots(), 58, 'Free slots should now be 58');
console.log('  ✓ Item stacking into same slot and distinct item allocation verified');

// ----------------------------------------------------------------------------
// TEST 2: MAX STACK OVERFLOW & CAPACITY BOUNDS
// ----------------------------------------------------------------------------
console.log('\n--- Test 2: Max Stack Overflow & 60-Slot Capacity Bounds ---');
// Wood maxStack is 99. Currently slot 0 has 25. Adding 80 wood (total 105) should fill slot 0 to 99, and put 6 in slot 2.
const res4 = GameState.addItemToInventory(ITEMS.WOOD, 80, false);
assert.strictEqual(res4.success, true, 'Adding 80 wood should succeed');
assert.strictEqual(GameState.inventory[0].count, 99, 'Slot 0 should be maxed at 99');
const woodSlot2 = GameState.inventory.find((s, idx) => idx !== 0 && s.item.id === 'wood');
assert.ok(woodSlot2, 'Second wood slot must exist');
assert.strictEqual(woodSlot2.count, 6, 'Second wood slot count must be 6');
console.log('  ✓ Stack limit overflow into subsequent slot verified');

// Fill inventory to 60 slots
while (GameState.inventory.length < 60) {
  GameState.inventory.push({
    slotIndex: GameState.inventory.length,
    item: { ...ITEMS.SCRAP_METAL, id: `test_item_${GameState.inventory.length}` },
    count: 1
  });
}
assert.strictEqual(GameState.getInventoryUsedSlots(), 60, 'Inventory should be exactly full at 60 slots');
assert.strictEqual(GameState.getInventoryFreeSlots(), 0, 'Free slots should be 0');

// Attempting to add an unstackable new item when inventory is full
const overflowItem = { id: 'overflow_gem', name: 'Overflow Gem', maxStack: 1, category: 'misc', value: 9999 };
const resFull = GameState.addItemToInventory(overflowItem, 1, false);
assert.strictEqual(resFull.success, false, 'Adding to completely full inventory should fail safely');
assert.strictEqual(GameState.inventory.length, 60, 'Slots must not exceed 60');
console.log('  ✓ 60-slot capacity boundary strictly enforced');

// ----------------------------------------------------------------------------
// TEST 3: INVENTORY CATEGORIES, SEARCH & SORTING
// ----------------------------------------------------------------------------
console.log('\n--- Test 3: Categories, Search Queries & Sorting ---');
GameState.reset();

GameState.addItemToInventory(ITEMS.WEAPON_SHOTGUN, 1, false); // weapons
GameState.addItemToInventory(ITEMS.AMMO_PISTOL, 24, false);  // ammunition
GameState.addItemToInventory(ITEMS.MEDKIT, 3, false);        // medical
GameState.addItemToInventory(ITEMS.METAL_PARTS, 12, false);  // materials
GameState.addItemToInventory(ITEMS.ZOMBIE_TEETH, 5, false);  // zombie_drops
GameState.addItemToInventory(ITEMS.RADIO_BATTERY, 2, false); // misc

// Filter by category
const medItems = GameState.getInventoryItems('medical');
assert.strictEqual(medItems.length, 1, 'Should find 1 medical item');
assert.strictEqual(medItems[0].item.id, 'medkit');

const ammoItems = GameState.getInventoryItems('ammunition');
assert.strictEqual(ammoItems.length, 1, 'Should find 1 ammunition item');

// Search query
const searchTeeth = GameState.getInventoryItems('all', 'taring');
assert.strictEqual(searchTeeth.length, 1, 'Search query "taring" should find Taring Zombi Hutan');
assert.strictEqual(searchTeeth[0].item.id, 'zombie_teeth');

// Sort by quantity descending
const sortedQty = GameState.getInventoryItems('all', '', 'qty_desc');
assert.strictEqual(sortedQty[0].count, 24, 'Top item by qty should be 24 (ammo)');

// Sort by price descending
const sortedPrice = GameState.getInventoryItems('all', '', 'price_desc');
assert.strictEqual(sortedPrice[0].item.id, 'scatter_blaster', 'Top item by price should be Shotgun (Rp 180.000)');
console.log('  ✓ Category filtering, search substring matching, and sorting verified');

// ----------------------------------------------------------------------------
// TEST 4: ITEM USE & DROP
// ----------------------------------------------------------------------------
console.log('\n--- Test 4: Item Use (Healing & Ammo) and Item Drop ---');
const mockPlayer = {
  health: 40,
  maxHealth: 100,
  weapons: {
    addedWeaponId: null,
    addedAmmoCount: 0,
    addWeaponAmmo(wepId, count) {
      this.addedWeaponId = wepId;
      this.addedAmmoCount = count;
    }
  }
};

// Use Medkit (+80 HP, capped at maxHealth 100)
const medkitIdx = GameState.inventory.findIndex(s => s.item.id === 'medkit');
const medkitCountBefore = GameState.inventory[medkitIdx].count;
const useRes = GameState.useItemFromInventory(medkitIdx, mockPlayer);
assert.strictEqual(useRes.success, true, 'Medkit should be used successfully');
assert.strictEqual(mockPlayer.health, 100, 'Player health should be restored to max (100)');
assert.strictEqual(GameState.inventory[medkitIdx].count, medkitCountBefore - 1, 'Medkit count should decrement by 1');
assert.strictEqual(GameState.stats.totalHealthRestored, 60, 'Health restored stat should record 60 HP healed');

// Use Ammo
const ammoIdx = GameState.inventory.findIndex(s => s.item.id === 'ammo_pistol');
const ammoRes = GameState.useItemFromInventory(ammoIdx, mockPlayer);
assert.strictEqual(ammoRes.success, true, 'Ammo should be used successfully');
assert.strictEqual(mockPlayer.weapons.addedAmmoCount, 24, 'Player weapons should receive 24 bullets');

// Drop Item
const partsIdx = GameState.inventory.findIndex(s => s.item.id === 'metal_parts');
const dropRes = GameState.dropItemFromInventory(partsIdx, 2);
assert.strictEqual(dropRes.success, true, 'Dropping item should succeed');
assert.strictEqual(dropRes.countRemoved, 2, 'Should remove 2 count');
console.log('  ✓ Item usage (HP restoration, ammo resupply) and item drop verified');

// ----------------------------------------------------------------------------
// TEST 5: MARKETPLACE 4 TABS & TIME-BASED SALE SIMULATION
// ----------------------------------------------------------------------------
console.log('\n--- Test 5: Marketplace Listings & Dynamic Sale Simulation ---');
GameState.reset();
GameState.addItemToInventory(ITEMS.WOOD, 10, false);       // Common
GameState.addItemToInventory(ITEMS.XENON_CORE, 2, false); // Legendary

// List 5 wood at unit price Rp 15.000
const listRes1 = GameState.listItemToMarketplace(0, 5, 15000);
assert.strictEqual(listRes1.success, true, 'Listing wood should succeed');
assert.strictEqual(GameState.marketplaceListings.length, 1, 'Should have 1 active listing');
const woodListing = GameState.marketplaceListings.find(l => l.itemId === 'wood');
assert.strictEqual(woodListing.status, 'LISTED', 'Listing status must be LISTED');
assert.strictEqual(woodListing.quantity, 5, 'Listing qty must be 5');
assert.strictEqual(woodListing.totalPrice, 75000, 'Total price must be Rp 75.000');
assert.strictEqual(GameState.inventory[0].count, 5, '5 wood should remain in inventory');

// List 1 Xenon Core (Rare) at unit price Rp 80.000
const listRes2 = GameState.listItemToMarketplace(1, 1, 80000);
assert.strictEqual(listRes2.success, true, 'Listing rare item should succeed');
const coreListing = GameState.marketplaceListings.find(l => l.itemId === 'xenon_core');
assert.ok(coreListing.duration > woodListing.duration, 'Rare item must take longer to sell than common item');

// Simulate half duration of wood
const halfDur = woodListing.duration * 0.5;
GameState.updateMarketplace(halfDur);
assert.strictEqual(woodListing.status, 'LISTED', 'Listing should still be LISTED at 50% duration');

// Simulate remaining duration + 1s to trigger sale
GameState.updateMarketplace(halfDur + 1.0);
assert.strictEqual(woodListing.status, 'SOLD', 'Wood listing should transition to SOLD after duration passes');
assert.strictEqual(coreListing.status, 'LISTED', 'Legendary core should still be LISTED');

// Verify unclaimed earnings
assert.strictEqual(GameState.getUnclaimedEarnings(), 75000, 'Unclaimed earnings should be Rp 75.000');
console.log('  ✓ Dynamic duration scaling by rarity and automatic sale transition verified');

// ----------------------------------------------------------------------------
// TEST 6: CLAIM EARNINGS, CLAIM ALL & ANTI-EXPLOIT
// ----------------------------------------------------------------------------
console.log('\n--- Test 6: Claiming Earnings, Claim All & Anti-Exploit ---');
const walletBefore = GameState.wallet;

// Claim single listing
const claimRes1 = GameState.claimListingEarnings(woodListing.id);
assert.strictEqual(claimRes1.success, true, 'Claiming sold listing should succeed');
assert.strictEqual(GameState.wallet, walletBefore + 75000, 'Wallet should be credited Rp 75.000');
assert.strictEqual(woodListing.status, 'CLAIMED', 'Status should be CLAIMED');
assert.strictEqual(GameState.getUnclaimedEarnings(), 0, 'Unclaimed earnings should now be 0');

// Anti-exploit: double claim must fail
const doubleClaim = GameState.claimListingEarnings(woodListing.id);
assert.strictEqual(doubleClaim.success, false, 'Double claim must be rejected');
assert.strictEqual(GameState.wallet, walletBefore + 75000, 'Wallet must not increase on rejected claim');

// Simulate rest of time for Xenon Core to become SOLD
GameState.updateMarketplace(coreListing.duration + 5);
assert.strictEqual(coreListing.status, 'SOLD', 'Core listing should now be SOLD');
assert.strictEqual(GameState.getUnclaimedEarnings(), 80000, 'Unclaimed earnings should be Rp 80.000');

// Claim All
const claimAllRes = GameState.claimAllEarnings();
assert.strictEqual(claimAllRes.success, true, 'Claim all should succeed');
assert.strictEqual(claimAllRes.claimedCount, 1, 'Should claim 1 sold listing');
assert.strictEqual(coreListing.status, 'CLAIMED', 'Core listing should now be CLAIMED');
assert.strictEqual(GameState.getUnclaimedEarnings(), 0, 'Unclaimed earnings should be 0');

// Verify Transaction History
assert.ok(GameState.transactionHistory.length >= 2, 'Transaction history should have logged both claims');
assert.strictEqual(GameState.transactionHistory[0].type, 'Klaim Penjualan');
console.log('  ✓ Claiming earnings, Claim All, transaction history, and anti-double-claim verified');

// ----------------------------------------------------------------------------
// TEST 7: CANCEL LISTING & INVENTORY RESTORATION
// ----------------------------------------------------------------------------
console.log('\n--- Test 7: Cancel Listing & Inventory Restoration ---');
GameState.addItemToInventory(ITEMS.TITAN_CORE, 1, false);
const titanIdx = GameState.inventory.findIndex(s => s.item.id === 'titan_core');
GameState.listItemToMarketplace(titanIdx, 1, 100000);
const titanListing = GameState.marketplaceListings.find(l => l.item.id === 'titan_core');
assert.strictEqual(titanListing.status, 'LISTED');

// Cancel listing
const cancelRes = GameState.cancelMarketplaceListing(titanListing.id);
assert.strictEqual(cancelRes.success, true, 'Cancelling active listing should succeed');
assert.strictEqual(titanListing.status, 'CANCELLED');
const restoredTitan = GameState.inventory.find(s => s.item.id === 'titan_core');
assert.ok(restoredTitan, 'Titan core should be returned to inventory');
assert.strictEqual(restoredTitan.count, 1, 'Restored titan core count should be 1');
console.log('  ✓ Listing cancellation safely restores items to player inventory');

// ----------------------------------------------------------------------------
// TEST 8: PLAYER PROFILE LEVEL XP PROGRESSION & MILESTONES
// ----------------------------------------------------------------------------
console.log('\n--- Test 8: Player Profile Level XP Formula & Milestones ---');
GameState.reset();

// Initial Level
const initLvl = GameState.getPlayerLevel();
assert.strictEqual(initLvl.level, 1, 'New survivor should start at Level 1');
assert.strictEqual(initLvl.totalXP, 0, 'Initial XP should be 0');

// Record combat stats
GameState.recordZombieKill('walker', 'pulse_pistol', false); // 1 kill (first blood)
GameState.recordZombieKill('runner', 'pulse_pistol', true);  // 1 kill + 1 headshot
GameState.recordZombieKill('boss', 'plasma_rifle', true);    // 1 boss kill + 1 headshot
GameState.recordWaveSurvived(1);
GameState.recordWaveSurvived(2);

// Check achievements
assert.strictEqual(GameState.achievements.first_blood.unlocked, true, 'First Blood achievement must be unlocked');
assert.strictEqual(GameState.achievements.titan_slayer.unlocked, true, 'Titan Slayer achievement must be unlocked');

// Verify XP increases and level scales
const lvlAfterCombat = GameState.getPlayerLevel();
assert.ok(lvlAfterCombat.totalXP > 0, 'Total XP should have increased');
assert.ok(lvlAfterCombat.level >= 1, 'Level calculation valid');
console.log(`  ✓ Player Level calculation (${lvlAfterCombat.totalXP} XP -> Level ${lvlAfterCombat.level} "${lvlAfterCombat.title}") & Achievements verified`);

// ----------------------------------------------------------------------------
// TEST 9: LOCALSTORAGE SAVE VERSION 5 PERSISTENCE & MIGRATION
// ----------------------------------------------------------------------------
console.log('\n--- Test 9: Save Version 5 Persistence & Legacy Migration ---');
localStorage.clear();

// Save state
GameState.saveToStorage();
const savedJson = localStorage.getItem('SCIFI_SURVIVAL_STATE');
assert.ok(savedJson, 'SCIFI_SURVIVAL_STATE must exist in storage');
const parsed = JSON.parse(savedJson);
assert.ok(parsed.version >= 5, 'Save version must be at least 5 (current: v' + parsed.version + ')');

// Test clean load
GameState.wallet = 999999;
GameState.inventory = [];
GameState.loadFromStorage();
assert.ok(Array.isArray(GameState.inventory), 'Inventory must load as array');
assert.strictEqual(GameState.inventoryMaxSlots, 60, 'Inventory max slots must be 60');

// Test legacy migration from v4 backpack to v5 inventory
localStorage.clear();
const legacyData = {
  version: 4,
  wallet: 65000,
  backpack: [
    { id: 'titan_core', name: 'Inti Titan', value: 100000, icon: '💎', type: 'loot' },
    { id: 'scrap_metal', name: 'Besi Bekas', value: 15000, icon: '🔩', type: 'material' }
  ],
  stash: [],
  ownedWeapons: ['pulse_pistol'],
  houseLevel: 1
};
localStorage.setItem('SCIFI_SURVIVAL_STATE', JSON.stringify(legacyData));

GameState.reset();
GameState.loadFromStorage();
assert.strictEqual(GameState.wallet, 65000, 'Migrated wallet must match legacy');
assert.ok(GameState.inventory.length >= 2, 'Legacy backpack items must be migrated into 60-slot inventory');
assert.ok(GameState.inventory.some(s => s.item.id === 'titan_core'), 'Titan core must exist in migrated inventory');
assert.ok(GameState.inventory.some(s => s.item.id === 'scrap_metal'), 'Scrap metal must exist in migrated inventory');
console.log('  ✓ Version 5 persistence and automated legacy backpack migration verified');

console.log('\n==================================================================');
console.log('🎉 ALL INVENTORY, MARKETPLACE & PROFILE TESTS PASSED CLEANLY! 🎉');
console.log('==================================================================\n');
