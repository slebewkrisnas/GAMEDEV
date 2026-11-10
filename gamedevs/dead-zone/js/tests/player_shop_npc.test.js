// ============================================================================
// DEAD ZONE — PLAYER SHOP & VILLAGE NPC CUSTOMERS TEST SUITE
// Verifies:
// 1. Lapak Dagang Initial State & LocalStorage Persistence (4 etalase slots & register balance)
// 2. Direct Selling ("Bisa jual apa saja" from backpack: scrap, materials, titan core, etc.)
// 3. Bulk Scrap Selling (sellAllScrap)
// 4. Etalase Showcase Stocking & Unstocking
// 5. NPC Customer Shopping & +25% Markup Calculation
// 6. Cash Register Collection to Player Wallet
// 7. VillageNPC & VillageNPCManager State Machine & Waypoint Navigation
// 8. VillageArchitect Player Shop Model Collider & Interactable Registration
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
      src: '',
      style: {}
    };
  },
  createElementNS: (ns, tag) => global.document.createElement(tag),
  getElementById: () => null,
  querySelectorAll: () => [],
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
global.fetch = async () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(0),
  text: async () => '',
  json: async () => ({})
});
const storageData = {};
global.localStorage = {
  getItem: (key) => storageData[key] || null,
  setItem: (key, val) => { storageData[key] = String(val); },
  removeItem: (key) => { delete storageData[key]; },
  clear: () => { Object.keys(storageData).forEach(k => delete storageData[k]); }
};

import * as THREE from 'three';
import { FBXLoader } from '../libs/FBXLoader.js';
import { GameState } from '../gameState.js';
import { VillageNPC, VillageNPCManager } from '../village_npc.js';
import { VillageArchitect } from '../village_architect.js';

// Mock FBXLoader.load in test environment
FBXLoader.prototype.load = function(url, onLoad) {
  const dummyGroup = new THREE.Group();
  if (onLoad) setTimeout(() => onLoad(dummyGroup), 10);
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING DEAD ZONE PLAYER SHOP & NPC TEST SUITE');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Initial State & Storage Persistence
  // --------------------------------------------------------------------------
  console.log('--- Test 1: Lapak Dagang Initial State & LocalStorage Persistence ---');
  global.localStorage.clear();
  GameState.reset();

  assert(Array.isArray(GameState.playerShopStall), 'playerShopStall is initialized as an array');
  assert(GameState.playerShopStall.length === 4, 'playerShopStall has 4 showcase slots');
  assert(GameState.playerShopStall.every(s => s === null), 'all 4 stall slots start empty (null)');
  assert(GameState.playerShopRegister === 0, 'playerShopRegister starts at Rp 0');

  // Stock an item into slot 0 and add some cash to register, then save
  GameState.playerShopStall[0] = { id: 'titan_core', name: 'Inti Titan Raksasa', value: 100000, type: 'loot' };
  GameState.playerShopRegister = 125000;
  GameState.saveToStorage();

  // Reset in memory and reload
  GameState.playerShopStall = [null, null, null, null];
  GameState.playerShopRegister = 0;
  GameState.loadFromStorage();

  assert(GameState.playerShopStall[0] !== null, 'playerShopStall slot 0 reloaded from storage');
  assert(GameState.playerShopStall[0].name === 'Inti Titan Raksasa', 'reloaded slot 0 matches saved item');
  assert(GameState.playerShopRegister === 125000, 'reloaded playerShopRegister matches saved balance (Rp 125.000)');

  // --------------------------------------------------------------------------
  // TEST 2: Direct Selling ("Bisa Jual Apa Saja" from Backpack)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: Direct Item Selling from Backpack ---');
  GameState.reset();
  GameState.wallet = 0;
  GameState.backpack = [
    { id: 'titan_core', name: 'Inti Titan Raksasa', value: 100000, type: 'loot' },
    { id: 'scrap_metal', name: 'Kayu & Besi Tempa', value: 15000, type: 'material' },
    { id: 'nano_stim', name: 'Ramuan Jamu Herbal', value: 30000, type: 'consumable' }
  ];

  // Sell 1 item (Titan Core)
  const sellResult = GameState.sellItemFromBackpack(0);
  assert(sellResult.success === true, 'sellItemFromBackpack succeeds for valid index');
  assert(sellResult.earnedRp === 100000, 'earnedRp is Rp 100.000 for Titan Core');
  assert(GameState.wallet === 100000, 'player wallet credited with Rp 100.000');
  assert(GameState.backpack.length === 2, 'backpack reduced from 3 to 2 items');
  assert(GameState.backpack[0].id === 'scrap_metal', 'first item is now scrap_metal');

  // Invalid index check
  const invalidSell = GameState.sellItemFromBackpack(99);
  assert(invalidSell.success === false, 'sellItemFromBackpack safely rejects out of range index');

  // --------------------------------------------------------------------------
  // TEST 3: Bulk Scrap Selling (sellAllScrap)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 3: Bulk Scrap Selling (sellAllScrap) ---');
  GameState.reset();
  GameState.wallet = 50000;
  GameState.backpack = [
    { id: 'scrap_metal', name: 'Kayu & Besi Tempa', value: 15000, type: 'material' },
    { id: 'power_converter', name: 'Komponen Mesin Desa', value: 40000, type: 'material' },
    { id: 'nano_stim', name: 'Ramuan Jamu Herbal', value: 30000, type: 'consumable' }
  ];

  const bulkResult = GameState.sellAllScrap();
  assert(bulkResult.success === true, 'sellAllScrap succeeds when scrap items exist');
  assert(bulkResult.count === 2, 'sold 2 scrap items');
  assert(bulkResult.totalEarned === 55000, 'sellAllScrap earned Rp 55.000 (15.000 + 40.000)');
  assert(GameState.wallet === 105000, 'wallet increased to Rp 105.000');
  assert(GameState.backpack.length === 1, 'only non-scrap item remains in backpack');
  assert(GameState.backpack[0].id === 'nano_stim', 'remaining item is nano_stim');

  const emptyBulk = GameState.sellAllScrap();
  assert(emptyBulk.success === false, 'sellAllScrap returns false when no scrap items present');

  // --------------------------------------------------------------------------
  // TEST 4: Stocking & Unstocking Etalase
  // --------------------------------------------------------------------------
  console.log('\n--- Test 4: Stocking & Unstocking Etalase Slots ---');
  GameState.reset();
  GameState.backpack = [
    { id: 'scrap_metal', name: 'Kayu & Besi Tempa', value: 15000, type: 'material' },
    { id: 'titan_core', name: 'Inti Titan Raksasa', value: 100000, type: 'loot' }
  ];

  // Stock Kayu & Besi to slot 1
  const stockRes = GameState.stockItemToStall(0, 1);
  assert(stockRes.success === true, 'stockItemToStall succeeds for valid slot and item');
  assert(stockRes.slot === 1, 'item placed in slot 1');
  assert(GameState.playerShopStall[1].name === 'Kayu & Besi Tempa', 'slot 1 holds Kayu & Besi Tempa');
  assert(GameState.backpack.length === 1, 'backpack reduced to 1 item');
  assert(GameState.backpack[0].id === 'titan_core', 'backpack remaining item is titan_core');

  // Auto-slot selection (pass -1 as targetSlot)
  const autoStock = GameState.stockItemToStall(0, -1);
  assert(autoStock.success === true, 'auto-stock selects first available empty slot');
  assert(autoStock.slot === 0, 'auto-stock used slot 0');
  assert(GameState.playerShopStall[0].name === 'Inti Titan Raksasa', 'slot 0 holds titan_core');
  assert(GameState.backpack.length === 0, 'backpack is now empty');

  // Unstock from slot 1 back to backpack
  const unstockRes = GameState.unstockItemFromStall(1);
  assert(unstockRes.success === true, 'unstockItemFromStall succeeds');
  assert(GameState.playerShopStall[1] === null, 'slot 1 is now cleared (null)');
  assert(GameState.backpack.length === 1, 'backpack received unstocked item');
  assert(GameState.backpack[0].name === 'Kayu & Besi Tempa', 'backpack has Kayu & Besi Tempa');

  // --------------------------------------------------------------------------
  // TEST 5: NPC Customer Transactions with +25% Markup & Empty Tip
  // --------------------------------------------------------------------------
  console.log('\n--- Test 5: NPC Customer Purchases (+25% Markup & Empty Tips) ---');
  GameState.reset();
  GameState.playerShopRegister = 0;
  // Stock slot 2 with item value 80.000 -> 25% markup = 100.000
  GameState.playerShopStall[2] = { id: 'xenon_core', name: 'Batu Permata Hutan', value: 80000 };

  const purchaseRes = GameState.npcPurchaseFromStall('Mang Ujang');
  assert(purchaseRes.type === 'item', 'NPC successfully bought an item from etalase');
  assert(purchaseRes.itemName === 'Batu Permata Hutan', 'bought the item from slot 2');
  assert(purchaseRes.price === 100000, 'sale price applied +25% markup (80.000 * 1.25 = 100.000)');
  assert(GameState.playerShopRegister === 100000, 'cash register holds Rp 100.000');
  assert(GameState.playerShopStall[2] === null, 'slot 2 cleared after sale');

  // When all slots empty, NPC leaves a tip
  const tipRes = GameState.npcPurchaseFromStall('Bu Siti');
  assert(tipRes.type === 'tip', 'empty stall returns tip transaction');
  assert(tipRes.price >= 2500 && tipRes.price <= 5000, 'NPC leaves Rp 2.500 - Rp 5.000 souvenir tip');
  assert(GameState.playerShopRegister > 100000, 'register balance updated with tip');

  // --------------------------------------------------------------------------
  // TEST 6: Cash Register Collection
  // --------------------------------------------------------------------------
  console.log('\n--- Test 6: Collect Cash Register Balance to Player Wallet ---');
  GameState.wallet = 20000;
  GameState.playerShopRegister = 105000;

  const collectRes = GameState.collectRegisterCash();
  assert(collectRes.success === true, 'collectRegisterCash succeeds with positive balance');
  assert(collectRes.collected === 105000, 'collected exact Rp 105.000');
  assert(GameState.playerShopRegister === 0, 'register balance emptied to 0');
  assert(GameState.wallet === 125000, 'wallet updated to Rp 125.000 (20.000 + 105.000)');

  const collectEmpty = GameState.collectRegisterCash();
  assert(collectEmpty.success === false, 'collectRegisterCash returns false when register is Rp 0');

  // --------------------------------------------------------------------------
  // TEST 7: VillageNPC & VillageNPCManager State Machine & Navigation
  // --------------------------------------------------------------------------
  console.log('\n--- Test 7: VillageNPC & VillageNPCManager ---');
  const mockScene = new THREE.Group();
  const npcManager = new VillageNPCManager(mockScene);

  assert(npcManager.npcs.length === 3, 'VillageNPCManager spawned 3 village NPCs');
  const names = npcManager.npcs.map(n => n.name);
  assert(names.includes('Mang Ujang'), 'Mang Ujang exists in NPC roster');
  assert(names.includes('Bu Siti'), 'Bu Siti exists in NPC roster');
  assert(names.includes('Kang Dimas'), 'Kang Dimas exists in NPC roster');

  const testNPC = npcManager.npcs[0];
  assert(testNPC.group instanceof THREE.Group, 'NPC has a Three.js Group representation');
  assert(testNPC.speechSprite instanceof THREE.Sprite, 'NPC has a dynamic speech bubble sprite');

  // Test state transition: Force to WALKING_TO_STALL and update towards stall
  testNPC.state = 'WALKING_TO_STALL';
  testNPC.setWaypoints([{ x: 13.6, z: 0.2 }]);
  testNPC.group.position.set(13.6, 0, 0.2); // already at waypoint destination
  testNPC.update(0.1); // delta step
  assert(testNPC.state === 'BROWSING', 'NPC entered BROWSING state upon reaching stall coordinate');

  // Advance browsing timer to trigger purchase (threshold is <= 2.5s)
  testNPC.stateTimer = 2.4;
  testNPC.update(0.1);
  assert(testNPC.hasPurchased === true, 'NPC executed purchase transaction during browsing');

  // Finish browsing timer to transition to WALKING_AWAY
  testNPC.stateTimer = 0;
  testNPC.update(0.1);
  assert(testNPC.state === 'WALKING_AWAY', 'NPC entered WALKING_AWAY state after browsing completed');

  // --------------------------------------------------------------------------
  // TEST 8: VillageArchitect Model Collider & Interactable Registration
  // --------------------------------------------------------------------------
  console.log('\n--- Test 8: VillageArchitect Player Shop Placement & Colliders ---');
  const mockEnv = {
    safeZoneGroup: new THREE.Group(),
    safeZoneColliders: [],
    safeZoneInteractables: [],
    safeZoneLights: new THREE.Group()
  };
  const arch = new VillageArchitect(mockEnv);

  arch.loadPlayerShopModel(18, 0);

  // Verify interactable was registered
  const stallInteractable = mockEnv.safeZoneInteractables.find(item => item.type === 'player_shop');
  assert(stallInteractable !== undefined, 'player_shop interactable registered in environment');
  assert(stallInteractable.position.x === 18 - 4.2, 'interactable positioned at counter front (x = 13.8)');
  assert(stallInteractable.radius === 4.8, 'interactable has interaction radius 4.8m');

  // Verify box collider was registered
  assert(mockEnv.safeZoneColliders.length > 0, 'boxCollider registered for player shop stall building');
  const shopCollider = mockEnv.safeZoneColliders[mockEnv.safeZoneColliders.length - 1];
  assert(shopCollider.min.x === 18 - 5.2 && shopCollider.max.x === 18 + 5.2, 'shop collider width matches building footprint (~10.4m)');
  assert(shopCollider.min.z === -5.5 && shopCollider.max.z === 5.5, 'shop collider depth matches building footprint (~11m)');

  console.log('\n======================================================');
  console.log(`✅ ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY!`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER TERMINATED WITH ERROR:', err);
  process.exit(1);
});
