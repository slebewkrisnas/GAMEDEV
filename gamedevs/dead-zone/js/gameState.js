// gameState.js - Central State, Economy & Inventory Engine for Sci-Fi Survival
// Currency: Rupiah (Rp)

export const ITEMS = {
  SCRAP_METAL: {
    id: 'scrap_metal',
    name: 'Kayu & Besi Tempa',
    type: 'material',
    value: 15000,
    icon: '🪵',
    description: 'Bahan bangunan pedesaan, laku dijual atau dipakai renovasi rumah.'
  },
  POWER_CONVERTER: {
    id: 'power_converter',
    name: 'Komponen Mesin Desa',
    type: 'material',
    value: 40000,
    icon: '⚙️',
    description: 'Komponen mekanik penting untuk upgrade Rumah Juragan Desa (Lv 3).'
  },
  BIO_TISSUE: {
    id: 'bio_tissue',
    name: 'Daging Mutan Hutan',
    type: 'loot',
    value: 25000,
    icon: '🥩',
    description: 'Sampel biologis zombie hutan bernilai jual tinggi di pengepul desa.'
  },
  XENON_CORE: {
    id: 'xenon_core',
    name: 'Batu Permata Hutan',
    type: 'loot',
    value: 80000,
    icon: '💎',
    description: 'Batu permata berkilau langka dari monster elit hutan rimba, bernilai Rp 80.000.'
  },
  NANO_STIM: {
    id: 'nano_stim',
    name: 'Ramuan Jamu Herbal',
    type: 'consumable',
    value: 30000,
    icon: '🌿',
    description: 'Racikan tanaman herbal penambah +40 HP instan (tekan [Q] saat bertempur).'
  },
  PLASMA_AMMO: {
    id: 'plasma_ammo',
    name: 'Peluru Senapan Pemburu',
    type: 'ammo',
    value: 20000,
    count: 24,
    icon: '📦',
    description: 'Satu pack 24 butir amunisi kaliber pemburu.'
  }
};

export const BACKPACK_TIERS = [
  { level: 1, name: 'Tas Anyaman Bambu', slots: 6, cost: 0 },
  { level: 2, name: 'Ransel Kulit Pemburu', slots: 10, cost: 150000 },
  { level: 3, name: 'Tas Ekspedisi Hutan Rimba', slots: 16, cost: 400000 }
];

export const HOUSE_TIERS = [
  { level: 1, name: 'Gubuk Panggung Bambu', stashSlots: 16, costRp: 0, scrapReq: 0, powerConvReq: 0 },
  { level: 2, name: 'Rumah Kayu Asri', stashSlots: 32, costRp: 300000, scrapReq: 5, powerConvReq: 0 },
  { level: 3, name: 'Rumah Juragan Desa', stashSlots: 64, costRp: 750000, scrapReq: 0, powerConvReq: 3 }
];

class StateManager {
  constructor() {
    this.reset();
    this.loadFromStorage();
  }

  reset() {
    this.wallet = 50000; // Mulai dengan modal awal Rp 50.000
    this.backpack = [];
    this.stash = [];
    this.backpackTier = 1;
    this.backpackMaxSlots = 6;
    this.houseLevel = 1;
    this.stashMaxSlots = 16;
    this.activeZone = 'safe_zone'; // 'safe_zone' | 'sector_7'
    this.ownedWeapons = ['pulse_pistol'];
    this.currentWeaponIndex = 0;
  }

  // Format Rupiah standar Indonesia
  formatRp(amount) {
    if (typeof amount !== 'number') amount = 0;
    return 'Rp ' + amount.toLocaleString('id-ID');
  }

  addRp(amount) {
    if (amount > 0) {
      this.wallet += amount;
      this.saveToStorage();
    }
  }

  canAfford(cost) {
    return this.wallet >= cost;
  }

  deductRp(cost) {
    if (this.canAfford(cost)) {
      this.wallet -= cost;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Inventaris Ransel
  addItemToBackpack(item) {
    if (this.backpack.length >= this.backpackMaxSlots) {
      return false; // Tas Penuh
    }
    this.backpack.push({ ...item, uid: Date.now() + Math.random().toString(36).substr(2, 5) });
    this.saveToStorage();
    return true;
  }

  removeItemFromBackpack(index) {
    if (index >= 0 && index < this.backpack.length) {
      const removed = this.backpack.splice(index, 1)[0];
      this.saveToStorage();
      return removed;
    }
    return null;
  }

  // Peti Penyimpanan Rumah (Stash)
  addItemToStash(item) {
    if (this.stash.length >= this.stashMaxSlots) {
      return false; // Stash Penuh
    }
    this.stash.push({ ...item, uid: Date.now() + Math.random().toString(36).substr(2, 5) });
    this.saveToStorage();
    return true;
  }

  removeItemFromStash(index) {
    if (index >= 0 && index < this.stash.length) {
      const removed = this.stash.splice(index, 1)[0];
      this.saveToStorage();
      return removed;
    }
    return null;
  }

  // Transfer Antar Tas & Stash
  transferToStash(backpackIndex) {
    if (this.stash.length >= this.stashMaxSlots) return false;
    const item = this.removeItemFromBackpack(backpackIndex);
    if (!item) return false;
    return this.addItemToStash(item);
  }

  transferToBackpack(stashIndex) {
    if (this.backpack.length >= this.backpackMaxSlots) return false;
    const item = this.removeItemFromStash(stashIndex);
    if (!item) return false;
    return this.addItemToBackpack(item);
  }

  // Hitung jumlah item tertentu dalam inventaris
  countItem(itemId, inBackpack = true) {
    const list = inBackpack ? this.backpack : this.stash;
    return list.filter(item => item.id === itemId).length;
  }

  removeItemsById(itemId, count, inBackpack = true) {
    const list = inBackpack ? this.backpack : this.stash;
    let removedCount = 0;
    for (let i = list.length - 1; i >= 0 && removedCount < count; i--) {
      if (list[i].id === itemId) {
        list.splice(i, 1);
        removedCount++;
      }
    }
    this.saveToStorage();
    return removedCount;
  }

  // Upgrade Ransel (Backpack)
  upgradeBackpack() {
    if (this.backpackTier >= BACKPACK_TIERS.length) {
      return { success: false, message: 'Kapasitas ransel sudah maksimal.' };
    }
    const nextTier = BACKPACK_TIERS[this.backpackTier]; // tier index 1 for level 2, etc.
    if (!this.deductRp(nextTier.cost)) {
      return { success: false, message: `Saldo Rupiah tidak mencukupi (${this.formatRp(nextTier.cost)}).` };
    }
    this.backpackTier = nextTier.level;
    this.backpackMaxSlots = nextTier.slots;
    this.saveToStorage();
    return { success: true, message: `Ransel berhasil di-upgrade ke ${nextTier.name} (${nextTier.slots} slot)!` };
  }

  // Upgrade Rumah Pedesaan (Player Village House)
  upgradeHouse() {
    if (this.houseLevel >= HOUSE_TIERS.length) {
      return { success: false, message: 'Rumah desa sudah mencapai tingkat maksimal (Level 3 Rumah Juragan Desa).' };
    }
    const nextTier = HOUSE_TIERS[this.houseLevel]; // index 1 for level 2, etc.

    // Periksa bahan material (bisa dari tas atau stash)
    const scrapAvailable = this.countItem('scrap_metal', true) + this.countItem('scrap_metal', false);
    const powerConvAvailable = this.countItem('power_converter', true) + this.countItem('power_converter', false);

    if (scrapAvailable < nextTier.scrapReq) {
      return { success: false, message: `Kurang ${nextTier.scrapReq - scrapAvailable} Kayu & Besi Tempa untuk renovasi.` };
    }
    if (powerConvAvailable < nextTier.powerConvReq) {
      return { success: false, message: `Kurang ${nextTier.powerConvReq - powerConvAvailable} Komponen Mesin Desa untuk renovasi.` };
    }
    if (!this.canAfford(nextTier.costRp)) {
      return { success: false, message: `Saldo Rupiah tidak cukup (${this.formatRp(nextTier.costRp)}).` };
    }

    // Eksekusi potong dana & potong material
    this.deductRp(nextTier.costRp);

    let scrapToDeduct = nextTier.scrapReq;
    const scrapFromBackpack = this.removeItemsById('scrap_metal', scrapToDeduct, true);
    scrapToDeduct -= scrapFromBackpack;
    if (scrapToDeduct > 0) this.removeItemsById('scrap_metal', scrapToDeduct, false);

    let convToDeduct = nextTier.powerConvReq;
    const convFromBackpack = this.removeItemsById('power_converter', convToDeduct, true);
    convToDeduct -= convFromBackpack;
    if (convToDeduct > 0) this.removeItemsById('power_converter', convToDeduct, false);

    this.houseLevel = nextTier.level;
    this.stashMaxSlots = nextTier.stashSlots;
    this.saveToStorage();

    return {
      success: true,
      message: `Rumah desa ditingkatkan ke ${nextTier.name}! Kapasitas Peti Kayu Stash kini ${nextTier.stashSlots} slot.`
    };
  }

  // High-Stakes Death Penalty:
  // Semua item di tas ekspedisi HANGUS, item di Stash & Saldo Rupiah AMAN
  clearBackpackOnDeath() {
    const lostItems = [...this.backpack];
    this.backpack = [];
    this.saveToStorage();
    return lostItems;
  }

  // Persistensi Penyimpanan Browser
  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        wallet: this.wallet,
        backpack: this.backpack,
        stash: this.stash,
        backpackTier: this.backpackTier,
        backpackMaxSlots: this.backpackMaxSlots,
        houseLevel: this.houseLevel,
        stashMaxSlots: this.stashMaxSlots,
        ownedWeapons: this.ownedWeapons
      };
      localStorage.setItem('SCIFI_SURVIVAL_STATE', JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage:', e);
    }
  }

  loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('SCIFI_SURVIVAL_STATE');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.wallet === 'number') this.wallet = data.wallet;
        if (Array.isArray(data.backpack)) this.backpack = data.backpack;
        if (Array.isArray(data.stash)) this.stash = data.stash;
        if (data.backpackTier) this.backpackTier = data.backpackTier;
        if (data.backpackMaxSlots) this.backpackMaxSlots = data.backpackMaxSlots;
        if (data.houseLevel) this.houseLevel = data.houseLevel;
        if (data.stashMaxSlots) this.stashMaxSlots = data.stashMaxSlots;
        if (Array.isArray(data.ownedWeapons)) this.ownedWeapons = data.ownedWeapons;
      }
    } catch (e) {
      console.warn('Gagal memuat state dari localStorage:', e);
    }
  }
}

export const GameState = new StateManager();

