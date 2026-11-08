// ============================================================================
// SCI-FI SHOPS & INTERACTION MANAGER
// Handles all kiosk interactions: Safehouse/Stash, Armory, Med-Bay, Scrap Exchange
// ============================================================================

import { GameState, ITEMS, BACKPACK_TIERS, HOUSE_TIERS } from './gameState.js';
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
    this.modalArmory = document.getElementById('modal-armory');
    this.modalMedbay = document.getElementById('modal-medbay');
    this.modalScrap = document.getElementById('modal-scrap');
    this.activeStoreTab = 'all';

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

        // 2. Beli Amunisi
        if (target.dataset.action === 'buy-ammo') {
          const cost = ITEMS.PLASMA_AMMO.value;
          if (GameState.canAfford(cost)) {
            GameState.deductRp(cost);
            sound.playCoinSound();
            if (this.ui.player && this.ui.player.weapons) {
              const curWep = this.ui.player.weapons.getCurrentWeapon();
              curWep.reserveAmmo += ITEMS.PLASMA_AMMO.count;
            }
            alert(`Berhasil membeli amunisi! +${ITEMS.PLASMA_AMMO.count} Peluru Senapan.`);
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
      case 'general_store':
      case 'armory':
      case 'medbay':
      case 'scrap_exchange':
        this.openGeneralStoreModal();
        break;
      case 'airlock':
        if (this.ui && this.ui.callbacks && this.ui.callbacks.onSwitchZone) {
          this.ui.callbacks.onSwitchZone('sector_7');
        }
        break;
      case 'extraction':
        if (this.ui && this.ui.callbacks && this.ui.callbacks.onSwitchZone) {
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

    const backpackItems = GameState.backpack.map((itm, idx) => `
      <div class="inventory-row">
        <span>${itm.icon} ${itm.name}</span>
        <button data-action="to-stash" data-index="${idx}" class="btn-xfer" title="Simpan ke Peti Desa">➡️ Simpan</button>
      </div>
    `).join('') || '<p class="empty-hint">Ransel kosong.</p>';

    const stashItems = GameState.stash.map((itm, idx) => `
      <div class="inventory-row">
        <span>${itm.icon} ${itm.name}</span>
        <button data-action="to-backpack" data-index="${idx}" class="btn-xfer" title="Ambil ke Ransel">⬅️ Ambil</button>
      </div>
    `).join('') || '<p class="empty-hint">Peti Kayu Stash kosong.</p>';

    this.modalSafehouse.querySelector('.modal-body').innerHTML = `
      <div class="safehouse-header">
        <h3>🏠 ${curTier.name} (Tingkat ${GameState.houseLevel})</h3>
        <p>Barang di dalam Peti Kayu Stash 100% aman dan tidak akan hilang meskipun Anda gugur saat berburu di Hutan Terbengkalai.</p>
      </div>

      <div class="storage-columns">
        <div class="storage-col">
          <h4>🎒 TAS RANSEL PEMAIN (${GameState.backpack.length} / ${GameState.backpackMaxSlots})</h4>
          <div class="items-list">${backpackItems}</div>
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
          <strong>${GameState.formatRp(GameState.rp)}</strong>
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
      <div class="shop-section-heading">💥 Amunisi & Perlengkapan</div>
      <div class="shop-item-card">
        <div class="item-info">
          <h4>📦 Kotak Peluru Senapan Pemburu (24 Butir)</h4>
          <p>Amunisi standar untuk pistol pemburu dan senapan berburu hutan.</p>
          <span class="price-tag">${GameState.formatRp(ITEMS.PLASMA_AMMO.value)}</span>
        </div>
        <button data-action="buy-ammo" class="btn btn-primary btn-sm">BELI AMUNISI</button>
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

  closeAllModals() {
    if (this.modalSafehouse) this.modalSafehouse.classList.add('hidden');
    if (this.modalGeneralStore) this.modalGeneralStore.classList.add('hidden');
    if (this.modalArmory) this.modalArmory.classList.add('hidden');
    if (this.modalMedbay) this.modalMedbay.classList.add('hidden');
    if (this.modalScrap) this.modalScrap.classList.add('hidden');
    this.modalActive = false;
    if (this.ui && this.ui.player && !this.ui.player.isTouchMode) {
      this.ui.player.requestPointerLock();
    }
  }
}

