// ============================================================================
// SCI-FI SHOPS & INTERACTION MANAGER
// Handles all kiosk interactions: Safehouse/Stash, Armory, Med-Bay, Scrap Exchange
// ============================================================================

import { GameState, ITEMS, BACKPACK_TIERS, HOUSE_TIERS, CRAFTING_RECIPES } from './gameState.js';
import { sound } from './audio.js';

export class ShopManager {
  constructor(uiManager) {
    this.ui = uiManager;
    this.currentInteractable = null;
    this.modalActive = false;

    // Elements
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptLabel = document.getElementById('prompt-label');

    this.modalSafehouse = document.getElementById('modal-safehouse');
    this.modalGeneralStore = document.getElementById('modal-general-store');
    this.modalBounty = document.getElementById('modal-bounty');
    this.modalWorkbench = document.getElementById('modal-workbench');
    this.modalArmory = document.getElementById('modal-armory');
    this.modalMedbay = document.getElementById('modal-medbay');
    this.modalScrap = document.getElementById('modal-scrap');
    this.modalPlayerShop = document.getElementById('modal-player-shop');
    this.modalInventory = document.getElementById('modal-inventory');
    this.modalMarketplace = document.getElementById('modal-marketplace');
    this.modalProfile = document.getElementById('modal-profile');
    this.activeStoreTab = 'all';
    this.activePlayerShopTab = 'sell'; // 'sell' | 'showcase'

    // Inventory & Marketplace UI State
    this.selectedInvSlot = null;
    this.invCategory = 'all';
    this.invSearchQuery = '';
    this.invSortBy = 'name_asc';
    this.activeMarketTab = 'sell'; // 'sell' | 'listings' | 'sold' | 'wallet'
    this.selectedMarketSellSlot = null;
    this.marketSellQty = 1;
    this.marketSellPrice = null;

    this.bindEvents();
  }

  bindEvents() {
    // Tombol close modal
    document.querySelectorAll('.btn-close-shop').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Delegasi klik Toko Serba Ada Terpadu (General Store)
    if (this.modalGeneralStore) {
      this.modalGeneralStore.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        // 1. Pergantian Tab Menu Toko
        if (target.dataset.storeTab) {
          this.activeStoreTab = target.dataset.storeTab;
          this.renderGeneralStoreModal();
          return;
        }

        // 2. Beli Amunisi Berdasarkan Kaliber (Pistol, Shotgun, Rifle)
        if (target.dataset.action === 'buy-ammo-cal') {
          const calKey = target.dataset.cal.toUpperCase();
          const itemMeta = ITEMS[calKey] || ITEMS.AMMO_PISTOL;
          const cost = itemMeta.value;
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            sound.playCoinSound();
            if (this.ui.player && this.ui.player.weapons) {
              this.ui.player.weapons.addWeaponAmmo(itemMeta.weaponId, itemMeta.count);
            }
            alert(`Berhasil membeli amunisi! +${itemMeta.count} Peluru (${itemMeta.name}).`);
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
        else if (target.dataset.action === 'buy-ammo') {
          const cost = ITEMS.PLASMA_AMMO.value;
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            sound.playCoinSound();
            if (this.ui.player && this.ui.player.weapons) {
              this.ui.player.weapons.addWeaponAmmo('plasma_rifle', ITEMS.PLASMA_AMMO.count);
            }
            alert(`Berhasil membeli amunisi! +${ITEMS.PLASMA_AMMO.count} Peluru Rifle.`);
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
        // 3. Upgrade Kapasitas Tas Ransel
        else if (target.dataset.action === 'upgrade-bag') {
          const res = GameState.upgradeBackpack();
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          }
        }
        // 4. Beli Senjata Baru
        else if (target.dataset.action === 'buy-weapon') {
          const wepId = target.dataset.weapon;
          const cost = parseInt(target.dataset.cost, 10);
          if (GameState.ownedWeapons.includes(wepId)) {
            alert('Senjata ini sudah Anda miliki!');
            return;
          }
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            GameState.ownedWeapons.push(wepId);
            GameState.saveToStorage();
            sound.playCoinSound();
            alert(`Berhasil membeli senjata ${target.dataset.name}!`);
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
        // 5. Beli Jamu Herbal (Nano-Stim)
        else if (target.dataset.action === 'buy-stim') {
          let cost = ITEMS.NANO_STIM.value;
          if (GameState.houseLevel >= 2) cost = Math.floor(cost * 0.9);

          if (GameState.backpack.length >= GameState.backpackMaxSlots) {
            alert('Tas Ransel penuh! Simpan barang di Peti Kayu Stash terlebih dahulu.');
            return;
          }
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            GameState.addItemToBackpack({ ...ITEMS.NANO_STIM });
            sound.playCoinSound();
            alert(`Berhasil membeli Ramuan Jamu Herbal (${GameState.formatRp(cost)})!`);
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
        // 6. Pemulihan Vitalitas Penuh (Quick Heal)
        else if (target.dataset.action === 'quick-heal') {
          const cost = 15000;
          if (this.ui.player && this.ui.player.health >= this.ui.player.maxHealth) {
            alert('Kondisi vital Anda sudah 100% prima!');
            return;
          }
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            if (this.ui.player) this.ui.player.health = this.ui.player.maxHealth;
            sound.playStimSound();
            alert('Kondisi vital dipulihkan penuh 100% oleh Tabib Desa!');
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
        // 7. Jual Semua Hasil Buruan (Sell All)
        else if (target.dataset.action === 'sell-all') {
          let totalEarned = 0;
          let soldCount = 0;
          for (let i = GameState.backpack.length - 1; i >= 0; i--) {
            const itm = GameState.backpack[i];
            if (itm.type === 'loot' || itm.type === 'material') {
              totalEarned += itm.value;
              soldCount++;
              GameState.backpack.splice(i, 1);
            }
          }
          if (soldCount > 0) {
            GameState.addRp(totalEarned);
            sound.playCoinSound();
            alert(`Berhasil menjual ${soldCount} barang jarahan seharga ${GameState.formatRp(totalEarned)}!`);
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          } else {
            alert('Tidak ada barang jarahan (loot/material) di dalam ransel Anda.');
          }
        }
        // 8. Jual Satu Item Tertentu
        else if (target.dataset.action === 'sell-item') {
          const idx = parseInt(target.dataset.index, 10);
          const itm = GameState.backpack[idx];
          if (itm) {
            GameState.addRp(itm.value);
            GameState.backpack.splice(idx, 1);
            GameState.saveToStorage();
            sound.playCoinSound();
            this.renderGeneralStoreModal();
            this.ui.updateHUD();
          }
        }
      });
    }

    // Delegasi klik modal Safehouse (Transfer / Upgrade)
    if (this.modalSafehouse) {
      this.modalSafehouse.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.action === 'to-stash') {
          const idx = parseInt(target.dataset.index, 10);
          if (GameState.transferToStash(idx)) {
            sound.playCoinSound();
            this.renderSafehouseModal();
            this.ui.updateHUD();
          } else {
            alert('Peti Stash penuh!');
          }
        } else if (target.dataset.action === 'to-backpack') {
          const idx = parseInt(target.dataset.index, 10);
          if (GameState.transferToBackpack(idx)) {
            sound.playCoinSound();
            this.renderSafehouseModal();
            this.ui.updateHUD();
          } else {
            alert('Tas Ransel penuh!');
          }
        } else if (target.dataset.action === 'upgrade-house') {
          const res = GameState.upgradeHouse();
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderSafehouseModal();
            this.ui.updateHUD();
          }
        } else if (target.dataset.action === 'to-pouch') {
          const idx = parseInt(target.dataset.index, 10);
          const res = GameState.transferToSecurePouch(idx);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderSafehouseModal();
            this.ui.updateHUD();
          }
        } else if (target.dataset.action === 'from-pouch') {
          const idx = parseInt(target.dataset.index, 10);
          const res = GameState.transferFromSecurePouch(idx);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderSafehouseModal();
            this.ui.updateHUD();
          }
        }
      });
    }

    // Delegasi klik Papan Kontrak Buruan (Bounty Board)
    if (this.modalBounty) {
      this.modalBounty.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        if (target.dataset.action === 'claim-bounty') {
          const id = target.dataset.bountyId;
          const res = GameState.claimBounty(id);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderBountyModal();
            this.ui.updateHUD();
          }
        }
      });
    }

    // Delegasi klik Meja Perakit (Workbench Crafting)
    if (this.modalWorkbench) {
      this.modalWorkbench.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        if (target.dataset.action === 'craft-recipe') {
          const recipeId = target.dataset.recipe;
          const res = GameState.craftRecipe(recipeId);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderWorkbenchModal();
            this.ui.updateHUD();
          }
        }
      });
    }

    // Delegasi klik modal Armory (Beli Amunisi, Tas, Senjata)
    if (this.modalArmory) {
      this.modalArmory.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.action === 'buy-ammo') {
          const cost = ITEMS.PLASMA_AMMO.value;
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            sound.playCoinSound();
            if (this.ui.player && this.ui.player.weapons) {
              const curWep = this.ui.player.weapons.getCurrentWeapon();
              curWep.reserveAmmo += ITEMS.PLASMA_AMMO.count;
            }
            alert(`Berhasil membeli amunisi! +${ITEMS.PLASMA_AMMO.count} Peluru Plasma.`);
            this.renderArmoryModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        } else if (target.dataset.action === 'upgrade-bag') {
          const res = GameState.upgradeBackpack();
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderArmoryModal();
            this.ui.updateHUD();
          }
        } else if (target.dataset.action === 'buy-weapon') {
          const wepId = target.dataset.weapon;
          const cost = parseInt(target.dataset.cost, 10);
          if (GameState.ownedWeapons.includes(wepId)) {
            alert('Senjata ini sudah Anda miliki!');
            return;
          }
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            GameState.ownedWeapons.push(wepId);
            GameState.saveToStorage();
            sound.playCoinSound();
            alert(`Berhasil membeli senjata ${target.dataset.name}!`);
            this.renderArmoryModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
      });
    }

    // Delegasi klik modal Med-Bay
    if (this.modalMedbay) {
      this.modalMedbay.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.action === 'buy-stim') {
          let cost = ITEMS.NANO_STIM.value;
          // Diskon 10% jika Safehouse level 2 atau lebih
          if (GameState.houseLevel >= 2) cost = Math.floor(cost * 0.9);

          if (GameState.backpack.length >= GameState.backpackMaxSlots) {
            alert('Tas Ransel penuh! Simpan barang di Safehouse terlebih dahulu.');
            return;
          }
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            GameState.addItemToBackpack({ ...ITEMS.NANO_STIM });
            sound.playCoinSound();
            alert(`Berhasil membeli Nano-Stim Potion (${GameState.formatRp(cost)})!`);
            this.renderMedbayModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        } else if (target.dataset.action === 'quick-heal') {
          const cost = 15000;
          if (this.ui.player.health >= this.ui.player.maxHealth) {
            alert('Kondisi vital Anda sudah 100% prima!');
            return;
          }
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            this.ui.player.health = this.ui.player.maxHealth;
            sound.playStimSound();
            alert('Kondisi vital dipulihkan penuh 100%!');
            this.renderMedbayModal();
            this.ui.updateHUD();
          } else {
            alert(`Saldo Rupiah tidak mencukupi (${GameState.formatRp(cost)}).`);
          }
        }
      });
    }

    // Delegasi klik modal Scrap Exchange (Jual Hasil Jarahan)
    if (this.modalScrap) {
      this.modalScrap.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.action === 'sell-all') {
          let totalEarned = 0;
          let soldCount = 0;
          for (let i = GameState.backpack.length - 1; i >= 0; i--) {
            const itm = GameState.backpack[i];
            if (itm.type === 'loot' || itm.type === 'material') {
              totalEarned += itm.value;
              soldCount++;
              GameState.backpack.splice(i, 1);
            }
          }
          if (soldCount > 0) {
            GameState.addRp(totalEarned);
            sound.playCoinSound();
            alert(`Berhasil menjual ${soldCount} barang jarahan seharga ${GameState.formatRp(totalEarned)}!`);
            this.renderScrapModal();
            this.ui.updateHUD();
          } else {
            alert('Tidak ada barang jarahan (loot/material) di dalam ransel Anda.');
          }
        } else if (target.dataset.action === 'sell-item') {
          const idx = parseInt(target.dataset.index, 10);
          const itm = GameState.backpack[idx];
          if (itm) {
            GameState.addRp(itm.value);
            GameState.backpack.splice(idx, 1);
            GameState.saveToStorage();
            sound.playCoinSound();
            this.renderScrapModal();
            this.ui.updateHUD();
          }
        }
      });
    }

    // Delegasi klik Modal Lapak Dagang Pribadi Pemain
    if (this.modalPlayerShop) {
      this.modalPlayerShop.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        // 1. Pergantian Tab Lapak
        if (target.dataset.action === 'tab-player-shop') {
          this.activePlayerShopTab = target.dataset.tab;
          this.renderPlayerShopModal();
          return;
        }

        // 2. Jual 1 Item dari Ransel
        if (target.dataset.action === 'sell-item') {
          const idx = parseInt(target.dataset.index, 10);
          const res = GameState.sellItemFromBackpack(idx);
          if (res.success) {
            sound.playCoinSound();
            alert(`Berhasil menjual ${res.itemName} seharga ${GameState.formatRp(res.earnedRp)}!`);
            this.renderPlayerShopModal();
            this.ui.updateHUD();
          } else {
            alert(res.message);
          }
        }
        // 3. Jual Seluruh Jarahan / Rongsokan
        else if (target.dataset.action === 'sell-all-scrap') {
          const res = GameState.sellAllScrap();
          if (res.success) {
            sound.playCoinSound();
            alert(`Berhasil menjual ${res.count} barang jarahan sekaligus senilai ${GameState.formatRp(res.totalEarned)}!`);
            this.renderPlayerShopModal();
            this.ui.updateHUD();
          } else {
            alert(res.message);
          }
        }
        // 4. Pajang Item dari Ransel ke Etalase Toko
        else if (target.dataset.action === 'stock-from-backpack') {
          const idx = parseInt(target.dataset.index, 10);
          const res = GameState.stockItemToStall(idx);
          if (res.success) {
            sound.playCoinSound();
            alert(res.message);
            this.renderPlayerShopModal();
            this.ui.updateHUD();
          } else {
            alert(res.message);
          }
        }
        // 5. Tarik Item dari Etalase kembali ke Ransel
        else if (target.dataset.action === 'unstock-slot') {
          const slot = parseInt(target.dataset.slot, 10);
          const res = GameState.unstockItemFromStall(slot);
          if (res.success) {
            sound.playCoinSound();
            alert(res.message);
            this.renderPlayerShopModal();
            this.ui.updateHUD();
          } else {
            alert(res.message);
          }
        }
        // 6. Ambil Uang Tunai dari Kotak Kasir Toko
        else if (target.dataset.action === 'collect-cash') {
          const res = GameState.collectRegisterCash();
          if (res.success) {
            sound.playCoinSound();
            alert(res.message);
            this.renderPlayerShopModal();
            this.ui.updateHUD();
          } else {
            alert(res.message);
          }
        }
      });
    }

    // --- HUD & MOBILE ACTION BUTTONS ---
    const btnHudInv = document.getElementById('btn-hud-inventory');
    const btnMobInv = document.getElementById('btn-mobile-inventory');
    if (btnHudInv) btnHudInv.addEventListener('click', () => this.toggleInventoryModal());
    if (btnMobInv) btnMobInv.addEventListener('click', () => this.toggleInventoryModal());

    const btnHudMarket = document.getElementById('btn-hud-marketplace');
    const btnMobMarket = document.getElementById('btn-mobile-marketplace');
    if (btnHudMarket) btnHudMarket.addEventListener('click', () => this.toggleMarketplaceModal());
    if (btnMobMarket) btnMobMarket.addEventListener('click', () => this.toggleMarketplaceModal());

    const btnHudProf = document.getElementById('btn-hud-profile');
    const btnMobProf = document.getElementById('btn-mobile-profile');
    if (btnHudProf) btnHudProf.addEventListener('click', () => this.toggleProfileModal());
    if (btnMobProf) btnMobProf.addEventListener('click', () => this.toggleProfileModal());

    // --- INVENTORY MODAL CONTROLS & EVENTS ---
    const searchInput = document.getElementById('inv-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.invSearchQuery = e.target.value.trim();
        this.renderInventoryModal();
      });
    }

    const sortSelect = document.getElementById('inv-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.invSortBy = e.target.value;
        this.renderInventoryModal();
      });
    }

    const catPills = document.getElementById('inv-cat-pills');
    if (catPills) {
      catPills.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-cat]');
        if (!btn) return;
        this.invCategory = btn.dataset.cat;
        catPills.querySelectorAll('.inv-cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderInventoryModal();
      });
    }

    if (this.modalInventory) {
      this.modalInventory.addEventListener('click', (e) => {
        const slotEl = e.target.closest('[data-inv-slot]');
        if (slotEl) {
          const sIdx = parseInt(slotEl.dataset.invSlot, 10);
          this.selectedInvSlot = sIdx;
          this.renderInventoryModal();
          return;
        }

        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.action === 'use-inv-item') {
          const sIdx = parseInt(target.dataset.slot, 10);
          const res = GameState.useItemFromInventory(sIdx, this.ui ? this.ui.player : null);
          alert(res.message);
          if (res.success) {
            this.renderInventoryModal();
            if (this.ui) this.ui.updateHUD();
          }
        } else if (target.dataset.action === 'sell-to-market-direct') {
          const sIdx = parseInt(target.dataset.slot, 10);
          this.selectedMarketSellSlot = sIdx;
          this.marketSellQty = 1;
          this.marketSellPrice = null;
          this.openMarketplaceModal('sell');
        } else if (target.dataset.action === 'drop-inv-item') {
          const sIdx = parseInt(target.dataset.slot, 10);
          if (confirm('Yakin ingin membuang barang ini dari inventaris?')) {
            GameState.dropItemFromInventory(sIdx, 1);
            this.selectedInvSlot = null;
            this.renderInventoryModal();
          }
        }
      });
    }

    // --- MARKETPLACE MODAL CONTROLS & EVENTS ---
    if (this.modalMarketplace) {
      this.modalMarketplace.addEventListener('input', (e) => {
        if (e.target.id === 'market-qty-input') {
          this.marketSellQty = Math.max(1, parseInt(e.target.value, 10) || 1);
          this.updateMarketplaceCalc();
        } else if (e.target.id === 'market-unit-price-input') {
          this.marketSellPrice = Math.max(100, parseInt(e.target.value, 10) || 100);
          this.updateMarketplaceCalc();
        }
      });

      this.modalMarketplace.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        // Tab Navigation
        if (target.dataset.marketTab) {
          this.activeMarketTab = target.dataset.marketTab;
          this.renderMarketplaceModal();
          return;
        }

        // Select item in sell tab
        const sellRow = e.target.closest('[data-action="select-market-sell-item"]');
        if (sellRow) {
          this.selectedMarketSellSlot = parseInt(sellRow.dataset.slot, 10);
          this.marketSellQty = 1;
          this.marketSellPrice = null;
          this.renderMarketplaceModal();
          return;
        }

        // Qty controls
        if (target.dataset.action === 'qty-minus') {
          this.marketSellQty = Math.max(1, (this.marketSellQty || 1) - 1);
          const inp = document.getElementById('market-qty-input');
          if (inp) inp.value = this.marketSellQty;
          this.updateMarketplaceCalc();
        } else if (target.dataset.action === 'qty-plus') {
          const inv = GameState.inventory || [];
          const maxQ = (this.selectedMarketSellSlot !== null && inv[this.selectedMarketSellSlot]) ? inv[this.selectedMarketSellSlot].count : 99;
          this.marketSellQty = Math.min(maxQ, (this.marketSellQty || 1) + 1);
          const inp = document.getElementById('market-qty-input');
          if (inp) inp.value = this.marketSellQty;
          this.updateMarketplaceCalc();
        } else if (target.dataset.action === 'qty-max') {
          const inv = GameState.inventory || [];
          const maxQ = (this.selectedMarketSellSlot !== null && inv[this.selectedMarketSellSlot]) ? inv[this.selectedMarketSellSlot].count : 1;
          this.marketSellQty = maxQ;
          const inp = document.getElementById('market-qty-input');
          if (inp) inp.value = this.marketSellQty;
          this.updateMarketplaceCalc();
        }
        // Submit listing
        else if (target.dataset.action === 'submit-marketplace-listing') {
          if (this.selectedMarketSellSlot === null) return;
          const qty = this.marketSellQty || 1;
          const price = this.marketSellPrice;
          const res = GameState.listItemToMarketplace(this.selectedMarketSellSlot, qty, price);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.selectedMarketSellSlot = null;
            this.marketSellQty = 1;
            this.marketSellPrice = null;
            this.activeMarketTab = 'listings';
            this.renderMarketplaceModal();
            this.ui.updateHUD();
          }
        }
        // Cancel listing
        else if (target.dataset.action === 'cancel-listing') {
          const lid = target.dataset.listingId;
          const res = GameState.cancelMarketplaceListing(lid);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderMarketplaceModal();
            this.ui.updateHUD();
          }
        }
        // Claim single listing earnings
        else if (target.dataset.action === 'claim-listing') {
          const lid = target.dataset.listingId;
          const res = GameState.claimListingEarnings(lid);
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderMarketplaceModal();
            this.ui.updateHUD();
          }
        }
        // Claim all earnings
        else if (target.dataset.action === 'claim-all-earnings') {
          const res = GameState.claimAllEarnings();
          alert(res.message);
          if (res.success) {
            sound.playCoinSound();
            this.renderMarketplaceModal();
            this.ui.updateHUD();
          }
        }
      });
    }
  }

  // Cek interaksi dari jarak dekat
  checkProximity(playerPos, interactables) {
    if (this.modalActive) return;

    let nearest = null;
    let minDist = Infinity;

    for (const item of interactables) {
      const dist = playerPos.distanceTo(item.position);
      if (dist <= item.radius && dist < minDist) {
        minDist = dist;
        nearest = item;
      }
    }

    this.currentInteractable = nearest;

    if (nearest && this.promptEl) {
      this.promptEl.classList.remove('hidden');
      this.promptLabel.textContent = nearest.label;
    } else if (this.promptEl) {
      this.promptEl.classList.add('hidden');
    }
  }

  // Dipanggil saat tombol [E] ditekan
  interact() {
    if (!this.currentInteractable) return;

    const target = this.currentInteractable;

    switch (target.type) {
      case 'stash':
      case 'house':
        this.openSafehouseModal();
        break;
      case 'bounty':
        this.openBountyModal();
        break;
      case 'workbench':
        if (GameState.houseLevel < 2) {
          alert('🔒 Meja Perakit Amunisi & Jamu Terkunci!\nHanya pemilik Rumah Kayu Asri (Level 2) ke atas yang dapat menggunakan fasilitas ini.\nSilakan upgrade rumah Anda di Papan Depan Rumah terlebih dahulu.');
        } else {
          this.openWorkbenchModal();
        }
        break;
      case 'general_store':
      case 'armory':
      case 'medbay':
      case 'scrap_exchange':
        this.openGeneralStoreModal();
        break;
      case 'player_shop':
        this.openPlayerShopModal();
        break;
      case 'airlock':
        if (this.ui && this.ui.callbacks && this.ui.callbacks.onSwitchZone) {
          this.ui.callbacks.onSwitchZone('sector_7');
        }
        break;
      case 'extraction':
        if (this.ui && this.ui.callbacks && this.ui.callbacks.onStartExtraction) {
          this.ui.callbacks.onStartExtraction();
        } else if (this.ui && this.ui.callbacks && this.ui.callbacks.onSwitchZone) {
          this.ui.callbacks.onSwitchZone('safe_zone');
        }
        break;
      case 'loot_crate':
        if (this.ui && this.ui.callbacks && this.ui.callbacks.onLootCrate) {
          this.ui.callbacks.onLootCrate(target.id);
        }
        break;
      default:
        console.log('Interaksi tidak dikenal:', target);
    }
  }

  // --------------------------------------------------------------------------
  // MODAL RENDERING
  // --------------------------------------------------------------------------
  openSafehouseModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderSafehouseModal();
    this.modalSafehouse.classList.remove('hidden');
  }

  renderSafehouseModal() {
    const curTier = HOUSE_TIERS[GameState.houseLevel - 1];
    const nextTier = HOUSE_TIERS[GameState.houseLevel];

    let upgradeHtml = '';
    if (nextTier) {
      const scrapCount = GameState.countItem('scrap_metal', true) + GameState.countItem('scrap_metal', false);
      const convCount = GameState.countItem('power_converter', true) + GameState.countItem('power_converter', false);

      upgradeHtml = `
        <div class="upgrade-card">
          <h4>Renovasi ke: ${nextTier.name}</h4>
          <p>Kapasitas Peti Stash: <strong>${nextTier.stashSlots} Slot</strong></p>
          <div class="cost-reqs">
            <span>Biaya: <strong>${GameState.formatRp(nextTier.costRp)}</strong></span>
            ${nextTier.scrapReq > 0 ? `<span>Kayu & Besi Tempa: <strong>${scrapCount}/${nextTier.scrapReq}</strong></span>` : ''}
            ${nextTier.powerConvReq > 0 ? `<span>Komponen Mesin Desa: <strong>${convCount}/${nextTier.powerConvReq}</strong></span>` : ''}
          </div>
          <button data-action="upgrade-house" class="btn btn-primary btn-sm">RENOVASI RUMAH DESA</button>
        </div>
      `;
    } else {
      upgradeHtml = `<div class="upgrade-card"><p>🏆 Rumah pedesaan Anda telah mencapai tingkat termegah (${curTier.name})!</p></div>`;
    }

    const isLv3 = (GameState.houseLevel >= 3);
    const backpackItems = GameState.backpack.map((itm, idx) => `
      <div class="inventory-row">
        <span>${itm.icon} ${itm.name}</span>
        <div style="display: flex; gap: 4px;">
          <button data-action="to-stash" data-index="${idx}" class="btn-xfer" title="Simpan ke Peti Desa">➡️ Peti</button>
          ${isLv3 && GameState.securePouch.length < 2 ? `<button data-action="to-pouch" data-index="${idx}" class="btn-pouch" title="Amankan ke Kantong">🛡️ Kantong</button>` : ''}
        </div>
      </div>
    `).join('') || '<p class="empty-hint">Ransel kosong.</p>';

    const stashItems = GameState.stash.map((itm, idx) => `
      <div class="inventory-row">
        <span>${itm.icon} ${itm.name}</span>
        <button data-action="to-backpack" data-index="${idx}" class="btn-xfer" title="Ambil ke Ransel">⬅️ Ambil</button>
      </div>
    `).join('') || '<p class="empty-hint">Peti Kayu Stash kosong.</p>';

    let securePouchHtml = '';
    if (isLv3) {
      const pouchItems = GameState.securePouch.map((itm, idx) => `
        <div class="inventory-row">
          <span>🛡️ ${itm.icon} <strong>${itm.name}</strong></span>
          <button data-action="from-pouch" data-index="${idx}" class="btn-xfer" title="Kembalikan ke Ransel">⬅️ Ke Ransel</button>
        </div>
      `).join('') || '<p class="empty-hint" style="color:#6ee7b7;">Kantong Aman kosong (Maksimal 2 slot aman).</p>';

      securePouchHtml = `
        <div class="secure-pouch-box">
          <div class="secure-pouch-title">🛡️ KANTONG AMAN PEMBURU (${GameState.securePouch.length} / 2 Slot)</div>
          <div class="secure-pouch-desc">Keistimewaan Rumah Juragan (Lv 3): Barang di dalam kantong ini 100% KEBAL HANGUS saat gugur di Sector-7!</div>
          <div class="items-list">${pouchItems}</div>
        </div>
      `;
    }

    this.modalSafehouse.querySelector('.modal-body').innerHTML = `
      <div class="safehouse-header">
        <h3>🏠 ${curTier.name} (Tingkat ${GameState.houseLevel})</h3>
        <p>Barang di dalam Peti Kayu Stash dan Kantong Aman 100% tidak akan hilang meskipun Anda gugur saat berburu di Hutan Sector-7.</p>
      </div>

      <div class="storage-columns">
        <div class="storage-col">
          <h4>🎒 TAS RANSEL PEMAIN (${GameState.backpack.length} / ${GameState.backpackMaxSlots})</h4>
          <div class="items-list">${backpackItems}</div>
          ${securePouchHtml}
        </div>
        <div class="storage-col">
          <h4>📦 PETI KAYU STASH DESA (${GameState.stash.length} / ${GameState.stashMaxSlots})</h4>
          <div class="items-list">${stashItems}</div>
        </div>
      </div>

      <div class="house-upgrade-section">
        ${upgradeHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // TOKO SERBA ADA TERPADU (GENERAL STORE - BELI SEMUA + JUAL HASIL BURUAN)
  // --------------------------------------------------------------------------
  openGeneralStoreModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderGeneralStoreModal();
    if (this.modalGeneralStore) this.modalGeneralStore.classList.remove('hidden');
  }

  renderGeneralStoreModal() {
    if (!this.modalGeneralStore) return;

    const modalBody = this.modalGeneralStore.querySelector('.modal-body');
    if (!modalBody) return;

    const curTab = this.activeStoreTab || 'all';

    // 1. Info Baris Status Pemain (Saldo, Kapasitas Ransel, HP)
    const statsHtml = `
      <div class="store-stats-bar">
        <div class="store-stat-pill balance">
          <span>💰 Saldo Uang:</span>
          <strong>${GameState.formatRp(GameState.wallet)}</strong>
        </div>
        <div class="store-stat-pill">
          <span>🎒 Kapasitas Ransel:</span>
          <strong>${GameState.backpack.length} / ${GameState.backpackMaxSlots} Slot</strong>
        </div>
        <div class="store-stat-pill">
          <span>❤️ Vitalitas:</span>
          <strong>${Math.round(this.ui?.player?.health || 100)} / ${Math.round(this.ui?.player?.maxHealth || 100)} HP</strong>
        </div>
      </div>
    `;

    // 2. Bar Tombol Pilihan Tab
    const tabsHtml = `
      <div class="shop-tabs">
        <button class="shop-tab-btn ${curTab === 'all' ? 'active' : ''}" data-store-tab="all">
          🛒 SEMUA BARANG
        </button>
        <button class="shop-tab-btn ${curTab === 'weapons' ? 'active' : ''}" data-store-tab="weapons">
          ⚔️ SENJATA & AMUNISI
        </button>
        <button class="shop-tab-btn ${curTab === 'medical' ? 'active' : ''}" data-store-tab="medical">
          🌿 JAMU & MEDIS
        </button>
        <button class="shop-tab-btn ${curTab === 'sell' ? 'active' : ''}" data-store-tab="sell">
          💰 JUAL HASIL BURUAN
        </button>
      </div>
    `;

    // 3. Konten Bagian Senjata & Amunisi
    const nextBag = BACKPACK_TIERS[GameState.backpackTier];
    const bagUpgradeCard = nextBag ? `
      <div class="shop-item-card">
        <div class="item-info">
          <h4>🎒 Upgrade Ransel: ${nextBag.name}</h4>
          <p>Tingkatkan kapasitas tas menjadi <strong>${nextBag.slots} Slot</strong></p>
          <span class="price-tag">${GameState.formatRp(nextBag.cost)}</span>
        </div>
        <button data-action="upgrade-bag" class="btn btn-primary btn-sm">BELI UPGRADE</button>
      </div>
    ` : `<div class="shop-item-card"><p>🎒 Ransel Anda sudah kapasitas maksimal (${GameState.backpackMaxSlots} Slot).</p></div>`;

    const weaponsSectionHtml = `
      <div class="shop-section-heading">💥 Pasokan Amunisi per Kaliber</div>
      <div class="shop-item-card">
        <div class="item-info">
          <h4>🔫 Amunisi 9mm Pistol (24 Butir)</h4>
          <p>Peluru standar 9mm berkecepatan tinggi untuk Tactical Pistol.</p>
          <span class="price-tag">${GameState.formatRp(ITEMS.AMMO_PISTOL.value)}</span>
        </div>
        <button data-action="buy-ammo-cal" data-cal="ammo_pistol" class="btn btn-primary btn-sm">BELI 9MM</button>
      </div>

      <div class="shop-item-card">
        <div class="item-info">
          <h4>💥 Amunisi 12-Gauge Shotgun (12 Butir)</h4>
          <p>Peluru buckshot berdaya ledak rapat untuk Scatter Shotgun.</p>
          <span class="price-tag">${GameState.formatRp(ITEMS.AMMO_SHOTGUN.value)}</span>
        </div>
        <button data-action="buy-ammo-cal" data-cal="ammo_shotgun" class="btn btn-primary btn-sm">BELI 12-GAUGE</button>
      </div>

      <div class="shop-item-card">
        <div class="item-info">
          <h4>⚡ Amunisi 7.62mm Rifle (30 Butir)</h4>
          <p>Peluru taktis kaliber 7.62mm bertenaga penuh untuk Senapan Taktis.</p>
          <span class="price-tag">${GameState.formatRp(ITEMS.AMMO_RIFLE.value)}</span>
        </div>
        <button data-action="buy-ammo-cal" data-cal="ammo_rifle" class="btn btn-primary btn-sm">BELI 7.62MM</button>
      </div>

      ${bagUpgradeCard}

      <div class="shop-section-heading">⚔️ Senjata Berburu Hutan Rimba</div>
      <div class="shop-item-card">
        <div class="item-info">
          <h4>💥 Senapan Berburu Kaliber Ganda (Scatter Shotgun)</h4>
          <p>Tembakan menyebar berdaya rusak masif untuk jarak dekat menghadang zombie hutan.</p>
          <span class="price-tag">${GameState.formatRp(250000)}</span>
        </div>
        <button data-action="buy-weapon" data-weapon="scatter_blaster" data-cost="250000" data-name="Scatter Shotgun" class="btn btn-primary btn-sm" ${GameState.ownedWeapons.includes('scatter_blaster') ? 'disabled' : ''}>
          ${GameState.ownedWeapons.includes('scatter_blaster') ? 'SUDAH DIMILIKI' : 'BELI SENJATA'}
        </button>
      </div>

      <div class="shop-item-card">
        <div class="item-info">
          <h4>🔫 Senapan Otomatis Hutan Rimba (Rifle Otomatis)</h4>
          <p>Senapan tembak cepat presisi tinggi untuk menembus kawanan zombie ganas.</p>
          <span class="price-tag">${GameState.formatRp(500000)}</span>
        </div>
        <button data-action="buy-weapon" data-weapon="plasma_rifle" data-cost="500000" data-name="Rifle Otomatis" class="btn btn-primary btn-sm" ${GameState.ownedWeapons.includes('plasma_rifle') ? 'disabled' : ''}>
          ${GameState.ownedWeapons.includes('plasma_rifle') ? 'SUDAH DIMILIKI' : 'BELI SENJATA'}
        </button>
      </div>
    `;

    // 4. Konten Bagian Obat & Jamu
    let stimCost = ITEMS.NANO_STIM.value;
    let stimDiscount = '';
    if (GameState.houseLevel >= 2) {
      stimCost = Math.floor(stimCost * 0.9);
      stimDiscount = '<span class="discount-badge">DISKON 10% (Warga Rumah Lv 2)</span>';
    }

    const medicalSectionHtml = `
      <div class="shop-section-heading">🌿 Jamu Tradisional & Perawatan Vitalitas</div>
      <div class="shop-item-card">
        <div class="item-info">
          <h4>🌿 Ramuan Jamu Herbal ${stimDiscount}</h4>
          <p>Racikan daun herbal hutan penambah +40 HP instan saat darurat (Tekan [Q]).</p>
          <span class="price-tag">${GameState.formatRp(stimCost)}</span>
        </div>
        <button data-action="buy-stim" class="btn btn-primary btn-sm">BELI RAMUAN JAMU</button>
      </div>

      <div class="shop-item-card">
        <div class="item-info">
          <h4>🍵 Perawatan Tabib & Pemulihan Stamina Total</h4>
          <p>Segarkan tubuh dan pulihkan HP Anda hingga 100% penuh seketika.</p>
          <span class="price-tag">Rp 15.000</span>
        </div>
        <button data-action="quick-heal" class="btn btn-primary btn-sm">PULIHKAN SEHAT BUGAR</button>
      </div>
    `;

    // 5. Konten Bagian Jual Hasil Buruan
    let totalLootVal = 0;
    let lootItemsHtml = '';
    GameState.backpack.forEach((itm, idx) => {
      if (itm.type === 'loot' || itm.type === 'material') {
        totalLootVal += itm.value;
        lootItemsHtml += `
          <div class="inventory-row">
            <span>${itm.icon} <strong>${itm.name}</strong></span>
            <span class="price-tag">${GameState.formatRp(itm.value)}</span>
            <button data-action="sell-item" data-index="${idx}" class="btn-xfer" title="Jual barang ini">💰 Jual</button>
          </div>
        `;
      }
    });

    const sellSectionHtml = `
      <div class="shop-sell-all-box">
        <div>
          <h4 style="margin: 0 0 4px 0; color: #fbbf24;">💰 Jual Hasil Buruan & Material</h4>
          <p>Tukarkan daging zombie, taring mutasi, kulit tebal, dan komponen rongsokan dengan Rupiah.</p>
        </div>
        <button data-action="sell-all" class="btn-sell-all" ${totalLootVal === 0 ? 'disabled' : ''}>
          JUAL SEMUA (${GameState.formatRp(totalLootVal)})
        </button>
      </div>
      <div class="shop-section-heading">📦 Barang Jarahan di Tas Ransel Anda</div>
      <div class="items-list">
        ${lootItemsHtml || '<p class="empty-hint">Tidak ada barang jarahan (loot/material) di dalam ransel Anda. Pergilah berburu di Hutan Terbengkalai untuk mendapatkan drop monster!</p>'}
      </div>
    `;

    let contentHtml = '';
    if (curTab === 'all') {
      contentHtml = `
        ${weaponsSectionHtml}
        ${medicalSectionHtml}
        <div class="shop-section-heading">💰 Jual Cepat Hasil Buruan</div>
        ${sellSectionHtml}
      `;
    } else if (curTab === 'weapons') {
      contentHtml = weaponsSectionHtml;
    } else if (curTab === 'medical') {
      contentHtml = medicalSectionHtml;
    } else if (curTab === 'sell') {
      contentHtml = sellSectionHtml;
    }

    modalBody.innerHTML = `
      ${statsHtml}
      ${tabsHtml}
      <div class="store-content-scroll" style="max-height: 400px; overflow-y: auto; padding-right: 4px;">
        ${contentHtml}
      </div>
    `;
  }

  openArmoryModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderArmoryModal();
    this.modalArmory.classList.remove('hidden');
  }

  renderArmoryModal() {
    const nextBag = BACKPACK_TIERS[GameState.backpackTier];
    const bagUpgradeHtml = nextBag ? `
      <div class="shop-item-card">
        <div class="item-info">
          <h4>🎒 Upgrade Ransel: ${nextBag.name}</h4>
          <p>Tingkatkan kapasitas tas menjadi <strong>${nextBag.slots} Slot</strong></p>
          <span class="price-tag">${GameState.formatRp(nextBag.cost)}</span>
        </div>
        <button data-action="upgrade-bag" class="btn btn-primary btn-sm">BELI UPGRADE</button>
      </div>
    ` : `<div class="shop-item-card"><p>🎒 Ransel Anda sudah kapasitas maksimal (${GameState.backpackMaxSlots} Slot).</p></div>`;

    this.modalArmory.querySelector('.modal-body').innerHTML = `
      <div class="shop-item-card">
        <div class="item-info">
          <h4>📦 Kotak Peluru Senapan Pemburu (24 Butir)</h4>
          <p>Amunisi standar untuk pistol pemburu dan senapan berburu hutan.</p>
          <span class="price-tag">${GameState.formatRp(ITEMS.PLASMA_AMMO.value)}</span>
        </div>
        <button data-action="buy-ammo" class="btn btn-primary btn-sm">BELI AMUNISI</button>
      </div>

      ${bagUpgradeHtml}

      <div class="shop-item-card">
        <div class="item-info">
          <h4>💥 Senapan Berburu Kaliber Ganda (Scatter Shotgun)</h4>
          <p>Tembakan menyebar berdaya rusak masif untuk jarak dekat menghadang zombie hutan.</p>
          <span class="price-tag">${GameState.formatRp(250000)}</span>
        </div>
        <button data-action="buy-weapon" data-weapon="scatter_blaster" data-cost="250000" data-name="Scatter Shotgun" class="btn btn-primary btn-sm" ${GameState.ownedWeapons.includes('scatter_blaster') ? 'disabled' : ''}>
          ${GameState.ownedWeapons.includes('scatter_blaster') ? 'SUDAH DIMILIKI' : 'TEMPA SENJATA'}
        </button>
      </div>

      <div class="shop-item-card">
        <div class="item-info">
          <h4>🔫 Senapan Otomatis Hutan Rimba (Rifle Otomatis)</h4>
          <p>Senapan tembak cepat presisi tinggi untuk menembus kawanan zombie ganas.</p>
          <span class="price-tag">${GameState.formatRp(500000)}</span>
        </div>
        <button data-action="buy-weapon" data-weapon="plasma_rifle" data-cost="500000" data-name="Rifle Otomatis" class="btn btn-primary btn-sm" ${GameState.ownedWeapons.includes('plasma_rifle') ? 'disabled' : ''}>
          ${GameState.ownedWeapons.includes('plasma_rifle') ? 'SUDAH DIMILIKI' : 'TEMPA SENJATA'}
        </button>
      </div>
    `;
  }

  openMedbayModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderMedbayModal();
    this.modalMedbay.classList.remove('hidden');
  }

  renderMedbayModal() {
    let stimCost = ITEMS.NANO_STIM.value;
    let discountNotice = '';
    if (GameState.houseLevel >= 2) {
      stimCost = Math.floor(stimCost * 0.9);
      discountNotice = '<span class="discount-badge">DISKON 10% (Warga Rumah Lv 2)</span>';
    }

    this.modalMedbay.querySelector('.modal-body').innerHTML = `
      <div class="shop-item-card">
        <div class="item-info">
          <h4>🌿 Ramuan Jamu Herbal ${discountNotice}</h4>
          <p>Racikan daun herbal hutan penambah +40 HP instan saat darurat (Tekan [Q]).</p>
          <span class="price-tag">${GameState.formatRp(stimCost)}</span>
        </div>
        <button data-action="buy-stim" class="btn btn-primary btn-sm">BELI RAMUAN JAMU</button>
      </div>

      <div class="shop-item-card">
        <div class="item-info">
          <h4>🍵 Perawatan Tabib & Pemulihan Stamina Total</h4>
          <p>Segarkan tubuh dan pulihkan HP Anda hingga 100% penuh seketika.</p>
          <span class="price-tag">Rp 15.000</span>
        </div>
        <button data-action="quick-heal" class="btn btn-primary btn-sm">PULIHKAN SEHAT BUGAR</button>
      </div>
    `;
  }

  openScrapModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderScrapModal();
    this.modalScrap.classList.remove('hidden');
  }

  renderScrapModal() {
    let lootItemsHtml = '';
    let totalLootVal = 0;

    GameState.backpack.forEach((itm, idx) => {
      if (itm.type === 'loot' || itm.type === 'material') {
        totalLootVal += itm.value;
        lootItemsHtml += `
          <div class="inventory-row">
            <span>${itm.icon} <strong>${itm.name}</strong></span>
            <span class="price-tag">${GameState.formatRp(itm.value)}</span>
            <button data-action="sell-item" data-index="${idx}" class="btn-xfer">Jual</button>
          </div>
        `;
      }
    });

    if (!lootItemsHtml) {
      lootItemsHtml = '<p class="empty-hint">Tidak ada hasil buruan (daging/material) di ransel Anda. Masuki Hutan Terbengkalai untuk berburu zombie!</p>';
    }

    this.modalScrap.querySelector('.modal-body').innerHTML = `
      <div class="scrap-header">
        <p>Jual hasil buruan zombie hutan dan material temuan Anda untuk ditukar dengan uang tunai Rupiah (Rp).</p>
        <button data-action="sell-all" class="btn btn-primary" ${totalLootVal === 0 ? 'disabled' : ''}>
          💰 JUAL SEMUA HASIL BURUAN (${GameState.formatRp(totalLootVal)})
        </button>
      </div>
      <div class="items-list">
        ${lootItemsHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // PAPAN KONTRAK BURUAN ALUN-ALUN DESA (BOUNTY HUNTING BOARD)
  // --------------------------------------------------------------------------
  openBountyModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderBountyModal();
    if (this.modalBounty) this.modalBounty.classList.remove('hidden');
  }

  renderBountyModal() {
    if (!this.modalBounty) return;
    const body = this.modalBounty.querySelector('.modal-body');
    if (!body) return;

    const cardsHtml = GameState.bounties.map(b => {
      const pct = Math.min(100, Math.round((b.currentCount / b.targetCount) * 100));
      let actionBtn = '';
      if (b.claimed) {
        actionBtn = `<button class="btn btn-sm" disabled style="background:#334155; color:#94a3b8; border:none;">SELESAI & DICAIRKAN</button>`;
      } else if (b.completed) {
        actionBtn = `<button data-action="claim-bounty" data-bounty-id="${b.id}" class="btn btn-primary btn-sm" style="background:#10b981; border-color:#059669; animation: pulse 1.5s infinite;">KLAIM HADIAH</button>`;
      } else {
        actionBtn = `<button class="btn btn-sm" disabled style="background:#1e293b; color:#64748b; border:1px solid rgba(255,255,255,0.1);">BURUAN BERJALAN</button>`;
      }

      return `
        <div class="bounty-card">
          <div class="bounty-info">
            <h4>${b.title}</h4>
            <p>${b.desc}</p>
            <div style="font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 10px;">
              <span>Progress: <strong>${b.currentCount} / ${b.targetCount}</strong> (${pct}%)</span>
              <div class="bounty-progress-wrap">
                <div class="bounty-progress-bar" style="width: ${pct}%;"></div>
              </div>
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            <div class="bounty-reward">+${GameState.formatRp(b.rewardRp)}</div>
            ${actionBtn}
          </div>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div style="margin-bottom: 16px;">
        <p style="color: #cbd5e1; font-size: 13px; margin: 0 0 10px 0;">
          Daftar target buruan resmi Kepala Desa Asri untuk para pemburu Sector-7. Selesaikan target eliminasi zombie dan penjarahan peti pondok untuk mendapatkan imbalan Rupiah ekstra.
        </p>
      </div>
      <div>
        ${cardsHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // MEJA PERAKIT AMUNISI & JAMU (WORKBENCH CRAFTING) — HOUSE LV 3
  // --------------------------------------------------------------------------
  openWorkbenchModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderWorkbenchModal();
    if (this.modalWorkbench) this.modalWorkbench.classList.remove('hidden');
  }

  renderWorkbenchModal() {
    if (!this.modalWorkbench) return;
    const body = this.modalWorkbench.querySelector('.modal-body');
    if (!body) return;

    const recipesHtml = CRAFTING_RECIPES.map(recipe => {
      let canCraft = true;
      const reqTags = recipe.req.map(req => {
        const available = GameState.countItem(req.id, true) + GameState.countItem(req.id, false);
        const hasEnough = available >= req.count;
        if (!hasEnough) canCraft = false;
        return `
          <span class="craft-req-tag ${hasEnough ? 'ready' : 'missing'}">
            ${req.name}: ${available}/${req.count}
          </span>
        `;
      }).join(' ');

      return `
        <div class="craft-card">
          <div class="craft-info">
            <h4>🔨 ${recipe.name}</h4>
            <p>${recipe.desc}</p>
            <div class="craft-reqs">
              ${reqTags}
            </div>
          </div>
          <button data-action="craft-recipe" data-recipe="${recipe.id}" class="btn btn-primary btn-sm" ${!canCraft ? 'disabled style="opacity:0.5;"' : ''}>
            RAKIT BARANG
          </button>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div style="margin-bottom: 16px;">
        <p style="color: #cbd5e1; font-size: 13px; margin: 0 0 10px 0;">
          Meja perakit perkakas di teras Rumah Juragan Desa (Level 3). Gunakan material Kayu, Besi Tempa, dan Daging Mutan yang dikumpulkan dari Sector-7 untuk merakit amunisi dan meramu Jamu Herbal mandiri tanpa biaya Rupiah.
        </p>
      </div>
      <div>
        ${recipesHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // MODAL LAPAK DAGANG PRIBADI PEMAIN (KIOS JUALAN DESA)
  // --------------------------------------------------------------------------
  openPlayerShopModal() {
    this.closeAllModals();
    this.modalActive = true;
    if (document.exitPointerLock) document.exitPointerLock();
    this.renderPlayerShopModal();
    if (this.modalPlayerShop) this.modalPlayerShop.classList.remove('hidden');
  }

  renderPlayerShopModal() {
    if (!this.modalPlayerShop) return;
    const body = this.modalPlayerShop.querySelector('.shop-modal-body');
    if (!body) return;

    const walletFmt = GameState.formatRp(GameState.wallet);
    const registerFmt = GameState.formatRp(GameState.playerShopRegister || 0);
    const isSellTab = (this.activePlayerShopTab === 'sell');

    // Tab Navigasi & Status Bar
    const tabsHtml = `
      <div class="player-shop-tabs">
        <button class="btn-shop-tab ${isSellTab ? 'active' : ''}" data-action="tab-player-shop" data-tab="sell">📦 JUAL BARANG (Ransel)</button>
        <button class="btn-shop-tab ${!isSellTab ? 'active' : ''}" data-action="tab-player-shop" data-tab="showcase">🪟 ETALASE & KASIR TOKO</button>
      </div>
      <div class="player-shop-status-bar">
        <span>Saldo Dompet: <strong style="color:#34d399;">${walletFmt}</strong></span>
        <span>Uang di Kotak Kasir: <strong style="color:#fbbf24;">${registerFmt}</strong></span>
      </div>
    `;

    let contentHtml = '';

    if (isSellTab) {
      // 1. Tombol Cepat Jual Seluruh Rongsokan / Jarahan
      const quickSellBtn = `
        <div class="quick-sell-bar">
          <div>
            <div style="font-weight: bold; color: #f59e0b;">⚡ Jual Seluruh Jarahan Sekaligus</div>
            <div style="font-size: 13px; color: #cbd5e1;">Menjual semua Kayu & Besi, Daging Mutan, Permata & Inti Titan di ransel secara instan.</div>
          </div>
          <button data-action="sell-all-scrap" class="btn btn-warning btn-sm" style="font-weight: bold;">JUAL SEMUA JARAHAN</button>
        </div>
      `;

      // 2. Daftar seluruh item di Ransel yang bisa dijual
      let itemsListHtml = '';
      if (!GameState.backpack || GameState.backpack.length === 0) {
        itemsListHtml = '<p class="empty-hint" style="padding: 24px 0; text-align: center; color: #94a3b8;">Ransel Anda kosong. Masuk ke Sector-7 untuk mengumpulkan jarahan berharga!</p>';
      } else {
        itemsListHtml = GameState.backpack.map((itm, idx) => {
          const val = itm.value || 10000;
          return `
            <div class="inventory-row" style="align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.04); margin-bottom: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">${itm.icon || '📦'}</span>
                <div>
                  <div style="font-weight: 600; color: #f1f5f9;">${itm.name}</div>
                  <div style="font-size: 12px; color: #94a3b8;">${itm.description || 'Barang inventaris'}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: bold; color: #34d399; font-family: 'Rajdhani', sans-serif; font-size: 17px;">${GameState.formatRp(val)}</span>
                <button data-action="sell-item" data-index="${idx}" class="btn-xfer" style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #86efac; font-weight: bold;" title="Jual item ini ke lapak">JUAL</button>
                <button data-action="stock-from-backpack" data-index="${idx}" class="btn-pouch" style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fde68a;" title="Pajang di etalase lapak untuk NPC pembeli">PAJANG</button>
              </div>
            </div>
          `;
        }).join('');
      }

      contentHtml = `
        ${quickSellBtn}
        <div style="margin-top: 14px;">
          <h4 style="margin: 0 0 10px 0; color: #e2e8f0; font-family: 'Cinzel', serif;">Isi Ransel Anda (${GameState.backpack.length} / ${GameState.backpackMaxSlots} Slot)</h4>
          <div class="items-list" style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
            ${itemsListHtml}
          </div>
        </div>
      `;
    } else {
      // TAB 2: ETALASE & KASIR TOKO
      if (!Array.isArray(GameState.playerShopStall)) GameState.playerShopStall = [null, null, null, null];

      const stallCardsHtml = GameState.playerShopStall.map((slotItem, sIdx) => {
        if (slotItem) {
          const retailVal = Math.round((slotItem.value || 15000) * 1.25);
          return `
            <div class="stall-slot-card filled">
              <div class="stall-slot-badge">Etalase #${sIdx + 1}</div>
              <div style="font-size: 32px; margin: 4px 0;">${slotItem.icon || '📦'}</div>
              <div style="font-weight: bold; color: #f8fafc; font-size: 14px; text-align: center;">${slotItem.name}</div>
              <div style="color: #fbbf24; font-weight: bold; font-family: 'Rajdhani', sans-serif; font-size: 16px; margin: 4px 0;">${GameState.formatRp(retailVal)} (+25%)</div>
              <button data-action="unstock-slot" data-slot="${sIdx}" class="btn-xfer" style="font-size: 12px; padding: 4px 10px;">⬅️ Tarik ke Tas</button>
            </div>
          `;
        } else {
          return `
            <div class="stall-slot-card empty">
              <div class="stall-slot-badge">Etalase #${sIdx + 1}</div>
              <div style="font-size: 28px; opacity: 0.35; margin: 6px 0;">🪟</div>
              <div style="color: #94a3b8; font-size: 13px;">Kosong</div>
              <div style="color: #64748b; font-size: 11px; margin-top: 4px;">Pajang barang dari Tab Ransel</div>
            </div>
          `;
        }
      }).join('');

      const cashAmount = GameState.playerShopRegister || 0;
      const collectDisabled = cashAmount <= 0 ? 'disabled style="opacity: 0.5;"' : '';

      contentHtml = `
        <div style="margin-bottom: 14px;">
          <h4 style="margin: 0 0 8px 0; color: #fcd34d; font-family: 'Cinzel', serif;">4 Slot Etalase Dagang Pribadi (Margin Laba +25%)</h4>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">Barang yang dipajang di etalase akan dibeli oleh NPC warga desa (Mang Ujang, Bu Siti, Kang Dimas) yang datang bolak-balik ke kios.</p>
          <div class="stall-grid">
            ${stallCardsHtml}
          </div>
        </div>

        <div class="cash-register-box">
          <div>
            <div style="font-weight: bold; color: #fbbf24; font-size: 16px;">💰 Kotak Kasir Toko Pemain</div>
            <div style="font-size: 13px; color: #cbd5e1; margin-top: 2px;">Total pendapatan penjualan dari NPC pembeli yang berkunjung.</div>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 26px; font-weight: bold; color: #34d399; font-family: 'Rajdhani', sans-serif;">${GameState.formatRp(cashAmount)}</div>
            <button data-action="collect-cash" class="btn btn-primary" ${collectDisabled} style="font-weight: bold;">AMBIL UANG</button>
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      ${tabsHtml}
      ${contentHtml}
    `;
  }

  updateMarketplaceCalc() {
    const inv = GameState.inventory || [];
    if (this.selectedMarketSellSlot === null || !inv[this.selectedMarketSellSlot]) return;
    const slot = inv[this.selectedMarketSellSlot];
    const unitPrice = (this.marketSellPrice !== null) ? this.marketSellPrice : (slot.item.value || 10000);
    const qty = Math.max(1, Math.min(this.marketSellQty || 1, slot.count));
    const totalCalc = document.getElementById('market-total-calc');
    if (totalCalc) {
      totalCalc.textContent = GameState.formatRp(unitPrice * qty);
    }
  }

  // --- INVENTORY MODAL CONTROLLER ---
  openInventoryModal() {
    this.closeAllModals();
    if (!this.modalInventory) return;
    this.modalActive = true;
    this.modalInventory.classList.remove('hidden');
    if (this.ui && this.ui.player && !this.ui.player.isTouchMode) {
      if (document.exitPointerLock) document.exitPointerLock();
    }
    this.renderInventoryModal();
  }

  toggleInventoryModal() {
    if (this.modalInventory && !this.modalInventory.classList.contains('hidden')) {
      this.closeAllModals();
    } else {
      this.openInventoryModal();
    }
  }

  renderInventoryModal() {
    if (!this.modalInventory) return;

    const used = GameState.getInventoryUsedSlots();
    const cap = GameState.getInventoryCapacity();
    const free = GameState.getInventoryFreeSlots();
    const pct = Math.min(100, Math.round((used / cap) * 100));

    const capLabel = document.getElementById('inv-capacity-label');
    const freeLabel = document.getElementById('inv-free-label');
    const fillEl = document.getElementById('inv-capacity-fill');

    if (capLabel) capLabel.textContent = `${used} / ${cap} Slot Terpakai`;
    if (freeLabel) freeLabel.textContent = `${free} Slot Kosong`;
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
      if (pct >= 85) fillEl.classList.add('danger');
      else fillEl.classList.remove('danger');
    }

    const filteredItems = GameState.getInventoryItems(this.invCategory, this.invSearchQuery, this.invSortBy);

    const gridEl = document.getElementById('inv-grid-slots');
    if (gridEl) {
      let slotsHtml = '';
      for (let i = 0; i < cap; i++) {
        const slotData = filteredItems.find(s => s.slotIndex === i);
        if (slotData && slotData.item) {
          const itm = slotData.item;
          const rarity = itm.rarity || 'common';
          const isSelected = (this.selectedInvSlot === i) ? 'selected' : '';
          slotsHtml += `
            <div class="inv-slot rarity-${rarity} ${isSelected}" data-inv-slot="${i}" title="${itm.name} (${slotData.count}x)">
              <span class="inv-slot-idx">${i + 1}</span>
              <span class="inv-slot-icon">${itm.icon || '📦'}</span>
              <span class="inv-slot-count">x${slotData.count}</span>
            </div>
          `;
        } else {
          const actualSlot = (Array.isArray(GameState.inventory) && i < GameState.inventory.length) ? GameState.inventory[i] : null;
          if (actualSlot && actualSlot.item) {
            slotsHtml += `
              <div class="inv-slot" style="opacity: 0.25;" data-inv-slot="${i}" title="${actualSlot.item.name} (terfilter)">
                <span class="inv-slot-idx">${i + 1}</span>
                <span class="inv-slot-icon">${actualSlot.item.icon || '📦'}</span>
              </div>
            `;
          } else {
            slotsHtml += `
              <div class="inv-slot empty" data-inv-slot="${i}" title="Slot Kosong">
                <span class="inv-slot-idx">${i + 1}</span>
              </div>
            `;
          }
        }
      }
      gridEl.innerHTML = slotsHtml;
    }

    const detailEl = document.getElementById('inv-detail-panel');
    if (detailEl) {
      const selectedData = (this.selectedInvSlot !== null && Array.isArray(GameState.inventory) && this.selectedInvSlot < GameState.inventory.length)
        ? GameState.inventory[this.selectedInvSlot]
        : null;

      if (!selectedData || !selectedData.item) {
        detailEl.innerHTML = `
          <div class="inv-detail-empty">
            <div style="font-size: 40px; opacity: 0.35;">🎒</div>
            <div style="font-weight: 600; color: #94a3b8;">Pilih salah satu item di inventaris</div>
            <div style="font-size: 11px; color: #64748b;">Klik pada slot berisi barang untuk melihat detail spesifikasi, khasiat medis, amunisi, atau menjualnya ke pasar.</div>
          </div>
        `;
      } else {
        const itm = selectedData.item;
        const count = selectedData.count;
        const unitVal = itm.value || 0;
        const totalVal = unitVal * count;
        const rarity = itm.rarity || 'common';

        let rarityBadgeColor = '#94a3b8';
        if (rarity === 'uncommon') rarityBadgeColor = '#22c55e';
        else if (rarity === 'rare') rarityBadgeColor = '#3b82f6';
        else if (rarity === 'epic') rarityBadgeColor = '#a855f7';
        else if (rarity === 'legendary') rarityBadgeColor = '#eab308';

        const isUsable = (itm.category === 'medical' || itm.category === 'ammunition' || itm.category === 'weapons' || itm.id === 'bamboo_trap' || itm.type === 'consumable');

        detailEl.innerHTML = `
          <div class="inv-detail-icon-wrap">
            <span>${itm.icon || '📦'}</span>
          </div>
          <div class="inv-detail-title">${itm.name}</div>
          <div class="inv-detail-badges">
            <span class="inv-badge-pill" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">${(itm.category || 'misc').toUpperCase()}</span>
            <span class="inv-badge-pill" style="background: ${rarityBadgeColor}22; color: ${rarityBadgeColor}; border: 1px solid ${rarityBadgeColor};">${rarity.toUpperCase()}</span>
          </div>
          <div class="inv-detail-desc">${itm.description || 'Barang survival dari ekspedisi hutan Sector-7.'}</div>
          <div class="inv-detail-stats">
            <div class="inv-detail-stat-row">
              <span>Jumlah Dimiliki:</span>
              <strong>${count} / ${itm.maxStack || 99}</strong>
            </div>
            <div class="inv-detail-stat-row">
              <span>Harga Acuan Pasar:</span>
              <strong style="color: #34d399;">${GameState.formatRp(unitVal)}</strong>
            </div>
            <div class="inv-detail-stat-row">
              <span>Total Estimasi Nilai:</span>
              <strong style="color: #38bdf8;">${GameState.formatRp(totalVal)}</strong>
            </div>
            ${itm.heal ? `<div class="inv-detail-stat-row"><span>Efek Pemulihan:</span><strong style="color: #22c55e;">+${itm.heal} HP Vitalitas</strong></div>` : ''}
            ${itm.buffType ? `<div class="inv-detail-stat-row"><span>Efek Khusus:</span><strong style="color: #fbbf24;">${itm.buffType === 'stamina_boost' ? 'Stamina Boost +30%' : 'Kebal Racun Stalker'}</strong></div>` : ''}
          </div>
          <div class="inv-detail-actions">
            ${isUsable ? `<button class="btn-inv-use" data-action="use-inv-item" data-slot="${this.selectedInvSlot}">⚡ GUNAKAN BARANG</button>` : ''}
            <button class="btn-inv-sell" data-action="sell-to-market-direct" data-slot="${this.selectedInvSlot}">🏪 JUAL KE PASAR DESA</button>
            <button class="btn-inv-drop" data-action="drop-inv-item" data-slot="${this.selectedInvSlot}">🗑️ BUANG DARI INVENTARIS</button>
          </div>
        `;
      }
    }
  }

  // --- MARKETPLACE MODAL CONTROLLER ---
  openMarketplaceModal(initialTab = 'sell') {
    this.closeAllModals();
    if (!this.modalMarketplace) return;
    this.modalActive = true;
    this.activeMarketTab = initialTab;
    this.modalMarketplace.classList.remove('hidden');
    if (this.ui && this.ui.player && !this.ui.player.isTouchMode) {
      if (document.exitPointerLock) document.exitPointerLock();
    }
    this.renderMarketplaceModal();
  }

  toggleMarketplaceModal() {
    if (this.modalMarketplace && !this.modalMarketplace.classList.contains('hidden')) {
      this.closeAllModals();
    } else {
      this.openMarketplaceModal();
    }
  }

  renderMarketplaceModal() {
    if (!this.modalMarketplace) return;

    const walletBadge = document.getElementById('market-wallet-badge');
    if (walletBadge) {
      walletBadge.innerHTML = `💳 ${GameState.formatRp(GameState.wallet)}`;
    }

    document.querySelectorAll('[data-market-tab]').forEach(btn => {
      if (btn.dataset.marketTab === this.activeMarketTab) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const contentEl = document.getElementById('market-tab-content');
    if (!contentEl) return;

    if (this.activeMarketTab === 'sell') {
      const invItems = Array.isArray(GameState.inventory) ? GameState.inventory : [];
      let itemsListHtml = '';

      if (invItems.length === 0) {
        itemsListHtml = '<p style="color: #94a3b8; text-align: center; padding: 30px;">Inventaris Anda kosong. Kumpulkan jarahan dari Sector-7 untuk dijual di pasar!</p>';
      } else {
        itemsListHtml = invItems.map((slot, idx) => {
          const itm = slot.item;
          const isSelected = (this.selectedMarketSellSlot === idx) ? 'selected' : '';
          return `
            <div class="market-sell-row ${isSelected}" data-action="select-market-sell-item" data-slot="${idx}">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${itm.icon || '📦'}</span>
                <div>
                  <div style="font-weight: 700; color: #f8fafc; font-size: 14px;">${itm.name}</div>
                  <div style="font-size: 11px; color: #94a3b8;">Stok di tas: <strong style="color: #f1f5f9;">${slot.count}x</strong> &bull; ${(itm.category || 'misc').toUpperCase()}</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: bold; color: #34d399;">${GameState.formatRp(itm.value || 0)}</div>
                <span style="font-size: 10px; color: #38bdf8;">Harga Acuan</span>
              </div>
            </div>
          `;
        }).join('');
      }

      let formHtml = '';
      if (this.selectedMarketSellSlot !== null && this.selectedMarketSellSlot < invItems.length) {
        const slot = invItems[this.selectedMarketSellSlot];
        const itm = slot.item;
        const maxQty = slot.count;
        const currentQty = Math.max(1, Math.min(this.marketSellQty || 1, maxQty));
        this.marketSellQty = currentQty;
        const basePrice = itm.value || 10000;
        const unitPrice = (this.marketSellPrice !== null) ? this.marketSellPrice : basePrice;
        this.marketSellPrice = unitPrice;
        const totalEst = unitPrice * currentQty;

        formHtml = `
          <div class="market-form-card">
            <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
              <span style="font-size: 32px;">${itm.icon || '📦'}</span>
              <div>
                <div style="font-weight: bold; color: #f8fafc; font-size: 15px;">${itm.name}</div>
                <div style="font-size: 11px; color: #fbbf24;">Tersedia di Tas: ${maxQty} unit</div>
              </div>
            </div>

            <div>
              <label style="font-size: 12px; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 6px;">Kuantitas yang Dijual:</label>
              <div class="market-counter-row">
                <button class="market-qty-btn" data-action="qty-minus">-</button>
                <input type="number" id="market-qty-input" class="market-qty-input" value="${currentQty}" min="1" max="${maxQty}">
                <button class="market-qty-btn" data-action="qty-plus">+</button>
                <button class="btn btn-secondary" data-action="qty-max" style="padding: 6px 12px; font-size: 12px; font-weight: bold;">MAX</button>
              </div>
            </div>

            <div>
              <label style="font-size: 12px; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 6px;">Harga Jual Satuan (Rp):</label>
              <input type="number" id="market-unit-price-input" class="market-qty-input" style="text-align: left; padding: 0 12px;" value="${unitPrice}" min="100">
              <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 4px;">Harga standar acuan: ${GameState.formatRp(basePrice)}</span>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #cbd5e1;">Total Pendapatan:</span>
              <span style="font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: bold; color: #34d399;" id="market-total-calc">${GameState.formatRp(totalEst)}</span>
            </div>

            <button class="btn btn-primary" data-action="submit-marketplace-listing" style="font-weight: bold; padding: 10px; margin-top: 4px;">
              🚀 PASANG DI PASAR DESA
            </button>
          </div>
        `;
      } else {
        formHtml = `
          <div class="market-form-card" style="align-items: center; justify-content: center; min-height: 280px; text-align: center; color: #64748b;">
            <div style="font-size: 42px; opacity: 0.35;">🏷️</div>
            <div style="font-weight: 600; color: #94a3b8; margin-top: 8px;">Pilih Barang untuk Dijual</div>
            <div style="font-size: 11px; margin-top: 4px;">Klik salah satu barang di daftar inventaris sebelah kiri untuk menentukan kuantitas dan harga jual.</div>
          </div>
        `;
      }

      contentEl.innerHTML = `
        <div class="market-sell-layout">
          <div>
            <h4 class="market-section-title">Barang di Ransel yang Siap Dijual</h4>
            <div class="market-item-selector">${itemsListHtml}</div>
          </div>
          <div>
            <h4 class="market-section-title">Formulir Penjualan Pasar</h4>
            ${formHtml}
          </div>
        </div>
      `;
    } else if (this.activeMarketTab === 'listings') {
      const activeListings = (Array.isArray(GameState.marketplaceListings) ? GameState.marketplaceListings : []).filter(l => l.status === 'LISTED');

      if (activeListings.length === 0) {
        contentEl.innerHTML = `
          <div style="text-align: center; padding: 48px 20px; color: #94a3b8;">
            <div style="font-size: 48px; opacity: 0.35;">📋</div>
            <h4 style="font-family: 'Cinzel', serif; color: #f8fafc; margin: 12px 0 6px 0;">Tidak Ada Barang yang Sedang Dijual</h4>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">Pasang barang jarahan dari tab "JUAL BARANG" untuk mulai menghasilkan keuntungan!</p>
            <button class="btn btn-primary" data-market-tab="sell">Mulai Pasang Barang</button>
          </div>
        `;
      } else {
        const cardsHtml = activeListings.map(l => {
          const pct = Math.min(100, Math.round((l.timeElapsed / l.duration) * 100));
          const secRem = Math.max(0, Math.ceil(l.duration - l.timeElapsed));
          return `
            <div class="listing-card listed">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 30px;">${l.item.icon || '📦'}</span>
                  <div>
                    <div style="font-weight: 700; color: #f8fafc; font-size: 15px;">${l.item.name}</div>
                    <div style="font-size: 11px; color: #38bdf8;">Kuantitas: <strong style="color: #ffffff;">${l.quantity} unit</strong></div>
                  </div>
                </div>
                <span class="inv-badge-pill" style="background: rgba(56,189,248,0.18); color: #38bdf8; border: 1px solid #38bdf8;">SEDANG DIJUAL</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 13px; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px;">
                <span>Harga Satuan: <strong>${GameState.formatRp(l.unitPrice)}</strong></span>
                <span style="color: #34d399; font-weight: bold;">Total: ${GameState.formatRp(l.totalPrice)}</span>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">
                  <span>Minat Pembeli: ${pct}%</span>
                  <span>Estimasi Transaksi: ~${secRem}s</span>
                </div>
                <div class="listing-progress-track">
                  <div class="listing-progress-fill" style="width: ${pct}%;"></div>
                </div>
              </div>

              <button class="btn-inv-drop" data-action="cancel-listing" data-listing-id="${l.id}" style="margin-top: 4px; padding: 6px 10px;">
                ✖️ Batalkan Penjualan (Kembalikan ke Tas)
              </button>
            </div>
          `;
        }).join('');

        contentEl.innerHTML = `
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <h4 class="market-section-title" style="margin: 0;">Daftar Barang Dagangan Anda yang Sedang Aktif (${activeListings.length} Barang)</h4>
            <span style="font-size: 12px; color: #94a3b8;">Item otomatis dibeli secara periodik oleh warga desa</span>
          </div>
          <div class="market-listings-grid">${cardsHtml}</div>
        `;
      }
    } else if (this.activeMarketTab === 'sold') {
      const soldListings = (Array.isArray(GameState.marketplaceListings) ? GameState.marketplaceListings : []).filter(l => l.status === 'SOLD' || l.status === 'CLAIMED');

      if (soldListings.length === 0) {
        contentEl.innerHTML = `
          <div style="text-align: center; padding: 48px 20px; color: #94a3b8;">
            <div style="font-size: 48px; opacity: 0.35;">🏷️</div>
            <h4 style="font-family: 'Cinzel', serif; color: #f8fafc; margin: 12px 0 6px 0;">Belum Ada Barang yang Terjual</h4>
            <p style="font-size: 13px; color: #64748b;">Barang yang Anda pasang di pasar akan muncul di sini setelah pembeli membelinya.</p>
          </div>
        `;
      } else {
        const cardsHtml = soldListings.map(l => {
          const isClaimed = (l.status === 'CLAIMED');
          return `
            <div class="listing-card ${isClaimed ? '' : 'sold'}">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 30px;">${l.item.icon || '📦'}</span>
                  <div>
                    <div style="font-weight: 700; color: #f8fafc; font-size: 15px;">${l.item.name}</div>
                    <div style="font-size: 11px; color: #94a3b8;">Terjual: <strong style="color: #ffffff;">${l.quantity} unit</strong></div>
                  </div>
                </div>
                ${isClaimed
                  ? `<span class="inv-badge-pill" style="background: rgba(148,163,184,0.18); color: #94a3b8; border: 1px solid #64748b;">✅ SUDAH DIKLAIM</span>`
                  : `<span class="inv-badge-pill" style="background: rgba(34,197,94,0.22); color: #86efac; border: 1px solid #22c55e;">💰 HASIL SIAP KLAIM</span>`
                }
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 14px; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px;">
                <span>Total Hasil Penjualan:</span>
                <span style="color: #34d399; font-weight: bold; font-family: 'Rajdhani', sans-serif; font-size: 17px;">${GameState.formatRp(l.totalPrice)}</span>
              </div>

              ${!isClaimed
                ? `<button class="btn btn-primary" data-action="claim-listing" data-listing-id="${l.id}" style="font-weight: bold; padding: 8px;">
                    💵 KLAIM PENDAPATAN (${GameState.formatRp(l.totalPrice)})
                   </button>`
                : `<div style="font-size: 11px; color: #64748b; text-align: center;">Uang telah masuk ke dompet Anda</div>`
              }
            </div>
          `;
        }).join('');

        contentEl.innerHTML = `
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <h4 class="market-section-title" style="margin: 0;">Riwayat Barang Terjual (${soldListings.length} Transaksi)</h4>
          </div>
          <div class="market-listings-grid">${cardsHtml}</div>
        `;
      }
    } else if (this.activeMarketTab === 'wallet') {
      const unclaimed = GameState.getUnclaimedEarnings();
      const totalEarned = GameState.stats.totalMoneyEarned || 0;
      const history = Array.isArray(GameState.transactionHistory) ? GameState.transactionHistory : [];

      const txRowsHtml = (history.length === 0)
        ? `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Belum ada catatan riwayat transaksi keuangan.</td></tr>`
        : history.slice(0, 30).map(tx => {
            const dateStr = new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const amountColor = tx.amount >= 0 ? '#34d399' : '#ef4444';
            const sign = tx.amount >= 0 ? '+' : '';
            return `
              <tr>
                <td>${dateStr}</td>
                <td><strong style="color: #e2e8f0;">${tx.type}</strong></td>
                <td>${tx.detail || '-'}</td>
                <td style="font-family: 'Rajdhani', sans-serif; font-weight: bold; color: ${amountColor};">${sign}${GameState.formatRp(Math.abs(tx.amount))}</td>
                <td><span class="inv-badge-pill" style="background: rgba(34,197,94,0.15); color: #86efac;">${tx.status || 'BERHASIL'}</span></td>
              </tr>
            `;
          }).join('');

      contentEl.innerHTML = `
        <div class="wallet-cards-grid">
          <div class="wallet-metric-card">
            <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">💳 SALDO DOMPET AKTIF</span>
            <div class="wallet-metric-val">${GameState.formatRp(GameState.wallet)}</div>
            <span style="font-size: 11px; color: #64748b;">Dapat dibelanjakan di toko serba ada & upgrade rumah</span>
          </div>
          <div class="wallet-metric-card" style="border-color: rgba(34,197,94,0.4);">
            <span style="font-size: 12px; color: #86efac; font-weight: 600;">💰 PENDAPATAN BELUM DIKLAIM</span>
            <div class="wallet-metric-val green">${GameState.formatRp(unclaimed)}</div>
            <span style="font-size: 11px; color: #64748b;">Dari hasil penjualan barang di pasar desa</span>
          </div>
          <div class="wallet-metric-card">
            <span style="font-size: 12px; color: #fbbf24; font-weight: 600;">📈 TOTAL AKUMULASI PENDAPATAN</span>
            <div class="wallet-metric-val amber">${GameState.formatRp(totalEarned)}</div>
            <span style="font-size: 11px; color: #64748b;">Total omset penjualan sepanjang permainan</span>
          </div>
        </div>

        <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" data-action="claim-all-earnings" ${unclaimed <= 0 ? 'disabled style="opacity: 0.5;"' : ''} style="font-weight: bold; font-size: 14px; padding: 10px 20px;">
            💰 KLAIM SEMUA HASIL (CLAIM ALL ${GameState.formatRp(unclaimed)})
          </button>
        </div>

        <div>
          <h4 class="market-section-title">Riwayat Catatan Transaksi Keuangan</h4>
          <div style="max-height: 240px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;">
            <table class="tx-history-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Jenis Transaksi</th>
                  <th>Deskripsi Barang</th>
                  <th>Nominal Rupiah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${txRowsHtml}</tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  // --- PROFILE MODAL CONTROLLER ---
  openProfileModal() {
    this.closeAllModals();
    if (!this.modalProfile) return;
    this.modalActive = true;
    this.modalProfile.classList.remove('hidden');
    if (this.ui && this.ui.player && !this.ui.player.isTouchMode) {
      if (document.exitPointerLock) document.exitPointerLock();
    }
    this.renderProfileModal();
  }

  toggleProfileModal() {
    if (this.modalProfile && !this.modalProfile.classList.contains('hidden')) {
      this.closeAllModals();
    } else {
      this.openProfileModal();
    }
  }

  renderProfileModal() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    const lvlData = GameState.getPlayerLevel();
    const stats = GameState.stats || {};
    const zStats = GameState.zombieStats || {};
    const profile = GameState.playerProfile || { name: 'Survivor #07', avatar: '🪖' };

    const achs = GameState.achievements || {};
    const achCardsHtml = Object.values(achs).map(a => {
      const isUnlocked = a.unlocked;
      let currentVal = 0;
      if (a.id === 'first_blood' || a.id === 'zombie_hunter' || a.id === 'zombie_slayer') currentVal = zStats.total || 0;
      else if (a.id === 'headshot_master') currentVal = zStats.headshots || 0;
      else if (a.id === 'titan_slayer') currentVal = zStats.boss || 0;
      else if (a.id === 'survivor') currentVal = zStats.wavesSurvived || 0;
      else if (a.id === 'merchant') currentVal = stats.totalItemsSold || 0;
      else if (a.id === 'rich_survivor') currentVal = stats.totalMoneyEarned || 0;
      else if (a.id === 'collector') currentVal = stats.totalItemsCollected || 0;
      else if (a.id === 'medicine_man') currentVal = stats.totalHealthRestored || 0;

      const pct = Math.min(100, Math.round((currentVal / a.target) * 100));

      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}">
          <div class="achievement-icon">${a.icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: ${isUnlocked ? '#fbbf24' : '#f8fafc'}; font-size: 13px;">${a.title}</span>
              <span style="font-size: 10px; font-weight: bold; color: ${isUnlocked ? '#34d399' : '#94a3b8'};">
                ${isUnlocked ? 'TERCAPAI ✅' : `${currentVal} / ${a.target}`}
              </span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin: 2px 0 4px 0;">${a.desc}</div>
            <div class="achievement-progress-track">
              <div class="achievement-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="profile-hero">
        <div class="profile-avatar-box">${profile.avatar || '🪖'}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-family: 'Cinzel', serif; color: #f8fafc; font-size: 20px;">${profile.name}</h3>
              <span style="font-size: 12px; color: #94a3b8;">Status: Korps Survivor Hutan Sector-7</span>
            </div>
            <span class="inv-badge-pill" style="background: rgba(56,189,248,0.2); color: #38bdf8; border: 1px solid #38bdf8; font-size: 12px; padding: 4px 10px;">
              LEVEL ${lvlData.level} &bull; ${lvlData.title}
            </span>
          </div>

          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #cbd5e1;">
              <span>Progress XP Level Berikutnya:</span>
              <span><strong>${lvlData.xpInLevel}</strong> / ${lvlData.xpNeededForNext} XP (${lvlData.progressPercent}%)</span>
            </div>
            <div class="profile-xp-track">
              <div class="profile-xp-fill" style="width: ${lvlData.progressPercent}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-sections-grid">
        <div class="profile-stat-box">
          <h4 class="profile-stat-title">⚔️ Eliminasi Zombi Mutan</h4>
          <div class="stat-metric-row"><span>Total Zombi Dibasmi:</span><span>${zStats.total || 0}</span></div>
          <div class="stat-metric-row"><span>Normal (Walker):</span><span>${zStats.walker || 0}</span></div>
          <div class="stat-metric-row"><span>Fast (Runner):</span><span>${zStats.runner || 0}</span></div>
          <div class="stat-metric-row"><span>Tank (Brute):</span><span>${zStats.tank || 0}</span></div>
          <div class="stat-metric-row"><span>Toxic Stalker:</span><span>${zStats.stalker || 0}</span></div>
          <div class="stat-metric-row"><span>Colossal Titan Boss:</span><span style="color: #fbbf24;">${zStats.boss || 0}</span></div>
          <div class="stat-metric-row"><span>Tembakan Headshot:</span><span style="color: #ef4444;">${zStats.headshots || 0}</span></div>
          <div class="stat-metric-row"><span>Kill Streak Tertinggi:</span><span style="color: #38bdf8;">${zStats.highestKillStreak || 0}</span></div>
        </div>

        <div class="profile-stat-box">
          <h4 class="profile-stat-title">💰 Statistik Ekonomi & Pasar</h4>
          <div class="stat-metric-row"><span>Saldo Dompet:</span><span style="color: #34d399;">${GameState.formatRp(GameState.wallet)}</span></div>
          <div class="stat-metric-row"><span>Total Pendapatan:</span><span>${GameState.formatRp(stats.totalMoneyEarned || 0)}</span></div>
          <div class="stat-metric-row"><span>Total Pengeluaran:</span><span>${GameState.formatRp(stats.totalMoneySpent || 0)}</span></div>
          <div class="stat-metric-row"><span>Transaksi Penjualan:</span><span>${stats.totalSalesCount || 0}x</span></div>
          <div class="stat-metric-row"><span>Total Item Terjual:</span><span>${stats.totalItemsSold || 0} unit</span></div>
          <div class="stat-metric-row"><span>Hasil Diklaim:</span><span style="color: #38bdf8;">${GameState.formatRp(stats.totalClaimedEarnings || 0)}</span></div>
          <div class="stat-metric-row"><span>Hasil Tertunda:</span><span style="color: #fbbf24;">${GameState.formatRp(GameState.getUnclaimedEarnings())}</span></div>
        </div>

        <div class="profile-stat-box">
          <h4 class="profile-stat-title">🛡️ Catatan Ketahanan Hidup</h4>
          <div class="stat-metric-row"><span>Total Waktu Bermain:</span><span>${GameState.formatTime(stats.totalPlaytimeSec || 0)}</span></div>
          <div class="stat-metric-row"><span>Jumlah Kematian:</span><span>${stats.totalDeaths || 0}</span></div>
          <div class="stat-metric-row"><span>Survival Terlama:</span><span>${GameState.formatTime(stats.longestSurvivalSec || 0)}</span></div>
          <div class="stat-metric-row"><span>Gelombang Bertahan:</span><span>${zStats.wavesSurvived || 0} Waves</span></div>
          <div class="stat-metric-row"><span>Vitalitas Dipulihkan:</span><span style="color: #22c55e;">+${stats.totalHealthRestored || 0} HP</span></div>
          <div class="stat-metric-row"><span>Peluru Ditembakkan:</span><span>${stats.totalShotsFired || 0}</span></div>
          <div class="stat-metric-row"><span>Amunisi Diambil:</span><span>${stats.totalAmmoCollected || 0}</span></div>
          <div class="stat-metric-row"><span>Jarahan Dikumpulkan:</span><span>${stats.totalItemsCollected || 0} Item</span></div>
        </div>
      </div>

      <div>
        <h4 class="profile-stat-title" style="margin-bottom: 10px;">🏆 Pencapaian & Rekor Survivor (10 Milestones)</h4>
        <div class="achievements-grid">${achCardsHtml}</div>
      </div>
    `;
  }

  closeAllModals() {
    if (this.modalSafehouse) this.modalSafehouse.classList.add('hidden');
    if (this.modalGeneralStore) this.modalGeneralStore.classList.add('hidden');
    if (this.modalBounty) this.modalBounty.classList.add('hidden');
    if (this.modalWorkbench) this.modalWorkbench.classList.add('hidden');
    if (this.modalArmory) this.modalArmory.classList.add('hidden');
    if (this.modalMedbay) this.modalMedbay.classList.add('hidden');
    if (this.modalScrap) this.modalScrap.classList.add('hidden');
    if (this.modalPlayerShop) this.modalPlayerShop.classList.add('hidden');
    if (this.modalInventory) this.modalInventory.classList.add('hidden');
    if (this.modalMarketplace) this.modalMarketplace.classList.add('hidden');
    if (this.modalProfile) this.modalProfile.classList.add('hidden');
    this.modalActive = false;
    if (this.ui && this.ui.player && !this.ui.player.isTouchMode) {
      this.ui.player.requestPointerLock();
    }
  }
}

