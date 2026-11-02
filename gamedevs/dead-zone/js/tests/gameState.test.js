import assert from 'node:assert';
import { GameState, ITEMS } from '../gameState.js';

console.log('--- RUNNING GAMESTATE TESTS ---');

// Test 1: Initial State & Currency Format
GameState.reset();
assert.strictEqual(GameState.wallet, 50000, 'Initial wallet should be Rp 50.000');
assert.strictEqual(GameState.backpackMaxSlots, 6, 'Initial backpack slots should be 6');
assert.strictEqual(GameState.stashMaxSlots, 16, 'Initial stash slots should be 16');
assert.strictEqual(GameState.houseLevel, 1, 'Initial house level should be 1');
assert.strictEqual(GameState.formatRp(150000), 'Rp 150.000', 'Formatting should match Rp standard');
assert.strictEqual(GameState.formatRp(0), 'Rp 0', 'Formatting zero should be Rp 0');

// Test 2: Backpack Capacity & Item Adding
assert.strictEqual(GameState.backpack.length, 0, 'Backpack starts empty');
for (let i = 0; i < 6; i++) {
  const added = GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
  assert.strictEqual(added, true, `Item ${i + 1} should fit in backpack`);
}
assert.strictEqual(GameState.backpack.length, 6, 'Backpack should have 6 items');
const overflow = GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
assert.strictEqual(overflow, false, 'Backpack should reject 7th item when capacity is 6');

// Test 3: Transfer to Stash & Capacity Limit
const transferSuccess = GameState.transferToStash(0);
assert.strictEqual(transferSuccess, true, 'Transfer to stash should succeed');
assert.strictEqual(GameState.backpack.length, 5, 'Backpack should now have 5 items');
assert.strictEqual(GameState.stash.length, 1, 'Stash should have 1 item');

const transferBack = GameState.transferToBackpack(0);
assert.strictEqual(transferBack, true, 'Transfer back to backpack should succeed');
assert.strictEqual(GameState.backpack.length, 6, 'Backpack should be 6 again');
assert.strictEqual(GameState.stash.length, 0, 'Stash should be empty');

// Test 4: Upgrades (Tas & Rumah)
// Backpack upgrade 1: Rp 150.000 (we currently have 50.000 -> need more)
assert.strictEqual(GameState.upgradeBackpack().success, false, 'Should fail without enough Rp');
GameState.addRp(100000); // Total Rp 150.000
const up1 = GameState.upgradeBackpack();
assert.strictEqual(up1.success, true, 'Upgrade 1 should succeed');
assert.strictEqual(GameState.backpackMaxSlots, 10, 'Backpack capacity should now be 10');
assert.strictEqual(GameState.wallet, 0, 'Wallet should be 0 after deduction');

// House upgrade 2: Rp 300.000 + 5 Scrap Metal
GameState.addRp(300000);
// We have 6 scrap metals in backpack
const houseUp = GameState.upgradeHouse();
assert.strictEqual(houseUp.success, true, 'House upgrade should succeed');
assert.strictEqual(GameState.houseLevel, 2, 'House level should be 2');
assert.strictEqual(GameState.stashMaxSlots, 32, 'Stash max slots should now be 32');

// Test 5: High-Stakes Death Penalty
// Player has items in backpack and items in stash
GameState.addItemToStash({ ...ITEMS.POWER_CONVERTER });
assert.strictEqual(GameState.stash.length, 1, 'Stash has 1 item');
const lostItems = GameState.clearBackpackOnDeath();
assert.ok(lostItems.length > 0, 'Lost items should be returned');
assert.strictEqual(GameState.backpack.length, 0, 'Backpack MUST be completely emptied on death');
assert.strictEqual(GameState.stash.length, 1, 'Stash items MUST remain safe on death');
assert.strictEqual(GameState.wallet, 0, 'Wallet balance is preserved on death');

console.log('--- ALL GAMESTATE TESTS PASSED SUCCESSFULLY! ---');

