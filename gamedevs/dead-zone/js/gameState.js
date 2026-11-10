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
  TITAN_CORE: {
    id: 'titan_core',
    name: 'Inti Titan Raksasa',
    type: 'loot',
    value: 200000,
    icon: '👑',
    description: 'Inti energi titan langka dari Boss Titan Sector-7, bernilai jual Rp 200.000 di Toko Desa.'
  },
  NANO_STIM: {
    id: 'nano_stim',
    name: 'Ramuan Jamu Herbal',
    type: 'consumable',
    value: 30000,
    icon: '🌿',
    description: 'Racikan tanaman herbal penambah +40 HP instan (tekan [Q] saat bertempur).'
  },
  AMMO_PISTOL: {
    id: 'ammo_pistol',
    name: 'Amunisi 9mm Pistol (24 btr)',
    type: 'ammo',
    value: 15000,
    count: 24,
    weaponId: 'pulse_pistol',
    icon: '🔫',
    description: 'Satu kotak 24 butir peluru 9mm untuk Tactical Pistol.'
  },
  AMMO_SHOTGUN: {
    id: 'ammo_shotgun',
    name: 'Amunisi 12-Gauge (12 btr)',
    type: 'ammo',
    value: 25000,
    count: 12,
    weaponId: 'scatter_blaster',
    icon: '💥',
    description: 'Satu kotak 12 butir peluru buckshot untuk Scatter Shotgun.'
  },
  AMMO_RIFLE: {
    id: 'ammo_rifle',
    name: 'Amunisi 7.62mm Rifle (30 btr)',
    type: 'ammo',
    value: 35000,
    count: 30,
    weaponId: 'plasma_rifle',
    icon: '⚡',
    description: 'Satu kotak 30 butir amunisi rifle kaliber 7.62mm.'
  },
  PLASMA_AMMO: {
    id: 'plasma_ammo',
    name: 'Amunisi 7.62mm Rifle (30 btr)',
    type: 'ammo',
    value: 35000,
    count: 30,
    weaponId: 'plasma_rifle',
    icon: '📦',
    description: 'Satu kotak 30 butir amunisi rifle kaliber 7.62mm.'
  }
};

export const CRAFTING_RECIPES = [
  {
    id: 'craft_ammo_pistol',
    name: 'Rakit Amunisi 9mm Pistol',
    result: { id: 'ammo_pistol', count: 24 },
    req: [{ id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 1 }],
    desc: 'Ubah 1 Kayu & Besi Tempa menjadi 24 butir peluru 9mm.'
  },
  {
    id: 'craft_ammo_shotgun',
    name: 'Rakit Amunisi 12-Gauge Shotgun',
    result: { id: 'ammo_shotgun', count: 12 },
    req: [{ id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 2 }],
    desc: 'Ubah 2 Kayu & Besi Tempa menjadi 12 butir buckshot shotgun.'
  },
  {
    id: 'craft_ammo_rifle',
    name: 'Rakit Amunisi 7.62mm Rifle',
    result: { id: 'ammo_rifle', count: 30 },
    req: [
      { id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 2 },
      { id: 'bio_tissue', name: 'Daging Mutan Hutan', count: 1 }
    ],
    desc: 'Kombinasikan 2 Besi Tempa & 1 Daging Mutan menjadi 30 butir peluru rifle.'
  },
  {
    id: 'craft_jamu_herbal',
    name: 'Racik Ramuan Jamu Herbal (+40 HP)',
    result: { id: 'nano_stim', count: 1 },
    req: [
      { id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 1 },
      { id: 'bio_tissue', name: 'Daging Mutan Hutan', count: 1 }
    ],
    desc: 'Tumbuk 1 Daging Mutan & 1 Kayu/Akar Herbal menjadi 1 botol Jamu Herbal.'
  }
];

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
    this.securePouch = []; // 2 Slot Kantong Aman (House Lv 3 Perk)
    this.securePouchMaxSlots = 2; // Maksimal 2 slot saat Lv 3 aktif
    this.backpackTier = 1;
    this.backpackMaxSlots = 6;
    this.houseLevel = 1;
    this.stashMaxSlots = 16;
    this.activeZone = 'safe_zone'; // 'safe_zone' | 'sector_7'
    this.ownedWeapons = ['pulse_pistol'];
    this.currentWeaponIndex = 0;

    // Kontrak Buruan Harian / Berkala di Alun-Alun Desa
    this.bounties = [
      {
        id: 'bounty_brutes',
        title: 'Basmi 5 Zombi Brute',
        desc: 'Musnahkan 5 mutan Brute berbadan kekar di Sector-7.',
        targetType: 'tank',
        targetCount: 5,
        currentCount: 0,
        rewardRp: 75000,
        completed: false,
        claimed: false
      },
      {
        id: 'bounty_runners',
        title: 'Buruan Kilat: 10 Runner',
        desc: 'Tumbangkan 10 zombie pelari gesit yang mengancam perbatasan.',
        targetType: 'runner',
        targetCount: 10,
        currentCount: 0,
        rewardRp: 50000,
        completed: false,
        claimed: false
      },
      {
        id: 'bounty_crates',
        title: 'Penjarahan 3 Peti Kargo',
        desc: 'Buka dan ambil perbekalan dari 3 peti kargo pondok hutan.',
        targetType: 'crate',
        targetCount: 3,
        currentCount: 0,
        rewardRp: 60000,
        completed: false,
        claimed: false
      }
    ];
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

  // =========================================================================
  // KANTONG AMAN (SECURE POUCH) — HOUSE LEVEL 3 PERK
  // Maksimal 2 slot. Barang di sini KEBAL HANGUS saat mati di Sector-7!
  // =========================================================================
  addToSecurePouch(item) {
    if (this.houseLevel < 3) return { success: false, message: 'Kantong Aman terbuka di Rumah Juragan Desa (Level 3).' };
    if (this.securePouch.length >= 2) return { success: false, message: 'Kantong Aman penuh (Maksimal 2 slot).' };
    this.securePouch.push({ ...item, uid: Date.now() + Math.random().toString(36).substr(2, 5) });
    this.saveToStorage();
    return { success: true, message: 'Barang berhasil disimpan di Kantong Aman!' };
  }

  removeItemFromSecurePouch(index) {
    if (index >= 0 && index < this.securePouch.length) {
      const removed = this.securePouch.splice(index, 1)[0];
      this.saveToStorage();
      return removed;
    }
    return null;
  }

  transferToSecurePouch(backpackIndex) {
    if (this.houseLevel < 3) return { success: false, message: 'Kantong Aman memerlukan Rumah Level 3.' };
    if (this.securePouch.length >= 2) return { success: false, message: 'Kantong Aman penuh (maks 2 slot).' };
    const item = this.removeItemFromBackpack(backpackIndex);
    if (!item) return { success: false, message: 'Barang tidak ditemukan.' };
    this.securePouch.push(item);
    this.saveToStorage();
    return { success: true, message: 'Barang dipindahkan ke Kantong Aman (Kebal Gugur).' };
  }

  transferFromSecurePouch(pouchIndex) {
    if (this.backpack.length >= this.backpackMaxSlots) return { success: false, message: 'Ransel sudah penuh!' };
    const item = this.removeItemFromSecurePouch(pouchIndex);
    if (!item) return { success: false, message: 'Barang tidak ditemukan.' };
    this.backpack.push(item);
    this.saveToStorage();
    return { success: true, message: 'Barang dipindahkan kembali ke Ransel.' };
  }

  // =========================================================================
  // MEJA PERAKIT AMUNISI & JAMU (WORKBENCH CRAFTING) — HOUSE LEVEL 3 PERK
  // =========================================================================
  craftRecipe(recipeId) {
    if (this.houseLevel < 3) {
      return { success: false, message: 'Meja Perakit hanya tersedia di Rumah Juragan Desa (Level 3).' };
    }
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { success: false, message: 'Resep perakitan tidak valid.' };

    // Periksa bahan
    for (const req of recipe.req) {
      const available = this.countItem(req.id, true) + this.countItem(req.id, false);
      if (available < req.count) {
        return { success: false, message: `Bahan tidak cukup! Membutuhkan ${req.count}x ${req.name} (Tersedia: ${available}).` };
      }
    }

    // Konsumsi bahan
    for (const req of recipe.req) {
      let remaining = req.count;
      const takenFromBackpack = this.removeItemsById(req.id, remaining, true);
      remaining -= takenFromBackpack;
      if (remaining > 0) {
        this.removeItemsById(req.id, remaining, false);
      }
    }

    // Buat hasil
    const targetItemMeta = Object.values(ITEMS).find(it => it.id === recipe.result.id);
    if (!targetItemMeta) return { success: false, message: 'Item hasil tidak dikenal.' };

    // Masukkan ke ransel jika muat, atau ke stash
    let placed = false;
    if (this.backpack.length < this.backpackMaxSlots) {
      this.addItemToBackpack(targetItemMeta);
      placed = true;
    } else if (this.stash.length < this.stashMaxSlots) {
      this.addItemToStash(targetItemMeta);
      placed = true;
    }

    this.saveToStorage();
    return {
      success: true,
      message: `Berhasil merakit: ${recipe.name}! (${placed ? 'Disimpan ke inventaris' : 'Inventaris penuh, barang tertahan'}).`
    };
  }

  // =========================================================================
  // PAPAN KONTRAK BURUAN DESA (BOUNTY HUNTING CONTRACTS)
  // =========================================================================
  recordBountyProgress(type, count = 1) {
    let anyCompleted = false;
    for (const b of this.bounties) {
      if (!b.completed && b.targetType === type) {
        b.currentCount = Math.min(b.targetCount, b.currentCount + count);
        if (b.currentCount >= b.targetCount) {
          b.completed = true;
          anyCompleted = true;
        }
      }
    }
    if (anyCompleted || count > 0) {
      this.saveToStorage();
    }
    return anyCompleted;
  }

  claimBounty(bountyId) {
    const bounty = this.bounties.find(b => b.id === bountyId);
    if (!bounty) return { success: false, message: 'Kontrak tidak ditemukan.' };
    if (!bounty.completed) return { success: false, message: 'Target buruan belum selesai!' };
    if (bounty.claimed) return { success: false, message: 'Hadiah kontrak ini sudah dicairkan.' };

    bounty.claimed = true;
    this.addRp(bounty.rewardRp);
    this.saveToStorage();
    return {
      success: true,
      rewardRp: bounty.rewardRp,
      message: `Hadiah Kontrak Dicairkan! +${this.formatRp(bounty.rewardRp)} masuk ke dompet.`
    };
  }

  // High-Stakes Death Penalty:
  // Semua item di tas ekspedisi HANGUS, item di Stash & KANTONG AMAN & Saldo Rupiah AMAN
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
        securePouch: this.securePouch,
        bounties: this.bounties,
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
        if (Array.isArray(data.securePouch)) this.securePouch = data.securePouch;
        if (Array.isArray(data.bounties)) {
          // Merge progress with defaults
          data.bounties.forEach(savedB => {
            const match = this.bounties.find(b => b.id === savedB.id);
            if (match) {
              match.currentCount = savedB.currentCount || 0;
              match.completed = !!savedB.completed;
              match.claimed = !!savedB.claimed;
            }
          });
        }
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

