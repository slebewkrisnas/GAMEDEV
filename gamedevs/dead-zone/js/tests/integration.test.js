import assert from 'node:assert';
import { GameState, ITEMS } from '../gameState.js';

console.log('--- STARTING SCI-FI SURVIVAL & ECONOMIC INTEGRATION TEST ---');

// 1. Reset state
GameState.reset();
assert.strictEqual(GameState.wallet, 50000, 'Initial balance is Rp 50.000');
assert.strictEqual(GameState.backpackMaxSlots, 6, 'Initial backpack is 6 slots');
assert.strictEqual(GameState.stashMaxSlots, 16, 'Initial stash is 16 slots');

// 2. Buy Nano-Stim at Med-Bay
const stimCost = ITEMS.NANO_STIM.value; // Rp 30.000
assert.strictEqual(stimCost, 30000, 'Nano-Stim cost is Rp 30.000');
assert.ok(GameState.canAfford(stimCost), 'Player can afford Nano-Stim');
GameState.deductRp(stimCost);
GameState.addItemToBackpack({ ...ITEMS.NANO_STIM });
assert.strictEqual(GameState.wallet, 20000, 'Wallet is Rp 20.000 after purchase');
assert.strictEqual(GameState.backpack.length, 1, 'Backpack has 1 item');

// 3. Store Nano-Stim into Safehouse Stash (Safe storage)
const stashed = GameState.transferToStash(0);
assert.ok(stashed, 'Transfer to Safehouse Stash should succeed');
assert.strictEqual(GameState.backpack.length, 0, 'Backpack is now empty');
assert.strictEqual(GameState.stash.length, 1, 'Stash has the Nano-Stim');

// 4. Sector-7 Expedition: Looting
GameState.addItemToBackpack({ ...ITEMS.SCRAP_METAL });
GameState.addItemToBackpack({ ...ITEMS.POWER_CONVERTER });
GameState.addItemToBackpack({ ...ITEMS.BIO_TISSUE });
assert.strictEqual(GameState.backpack.length, 3, 'Expedition backpack carries 3 unextracted items');

// 5. High-Stakes Death in Sector-7!
const lostLoot = GameState.clearBackpackOnDeath();
assert.strictEqual(lostLoot.length, 3, '3 unextracted items were lost');
assert.strictEqual(GameState.backpack.length, 0, 'Backpack is emptied on death');
assert.strictEqual(GameState.stash.length, 1, 'Safehouse Stash item MUST be preserved!');
assert.strictEqual(GameState.wallet, 20000, 'Wallet balance is preserved!');

// 6. Second Expedition & Successful Extraction
GameState.addItemToBackpack({ ...ITEMS.BIO_TISSUE }); // Rp 25.000
GameState.addItemToBackpack({ ...ITEMS.BIO_TISSUE }); // Rp 25.000
GameState.addItemToBackpack({ ...ITEMS.XENON_CORE });  // Rp 80.000
assert.strictEqual(GameState.backpack.length, 3, 'Looted 3 valuable items');

// 7. Scrap Exchange: Quick Sell All Loot
let earned = 0;
for (let i = GameState.backpack.length - 1; i >= 0; i--) {
  const item = GameState.backpack[i];
  if (item.type === 'loot' || item.type === 'material') {
    earned += item.value;
    GameState.backpack.splice(i, 1);
  }
}
assert.strictEqual(earned, 130000, 'Earned Rp 130.000 from sale');
GameState.addRp(earned);
assert.strictEqual(GameState.wallet, 150000, 'Total wallet is now Rp 150.000');
assert.strictEqual(GameState.backpack.length, 0, 'Backpack emptied after selling');

// 8. Armory: Upgrade Backpack to Tactical Rig (Rp 150.000)
const bagUp = GameState.upgradeBackpack();
assert.ok(bagUp.success, 'Backpack upgrade succeeded');
assert.strictEqual(GameState.backpackMaxSlots, 10, 'Backpack capacity expanded to 10 slots');
assert.strictEqual(GameState.wallet, 0, 'Wallet is Rp 0 after upgrade');

// 9. Format verification
assert.strictEqual(GameState.formatRp(GameState.wallet), 'Rp 0');
assert.strictEqual(GameState.formatRp(1500000), 'Rp 1.500.000');

console.log('--- ALL INTEGRATION & ECONOMY FLOW TESTS PASSED! ---');

