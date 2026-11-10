// gameState.js - Central State, Economy & Inventory Engine for Sci-Fi Survival
// Currency: Rupiah (Rp)

export const ITEMS = {
  SCRAP_METAL: {
    id: 'scrap_metal',
    name: 'Kayu & Besi Tempa',
    type: 'material',
    category: 'materials',
    rarity: 'common',
    value: 15000,
    maxStack: 99,
    icon: '🪵',
    description: 'Bahan bangunan pedesaan, laku dijual atau dipakai renovasi rumah.'
  },
  POWER_CONVERTER: {
    id: 'power_converter',
    name: 'Komponen Mesin Desa',
    type: 'material',
    category: 'materials',
    rarity: 'uncommon',
    value: 40000,
    maxStack: 50,
    icon: '⚙️',
    description: 'Komponen mekanik penting untuk upgrade Rumah Juragan Desa (Lv 3).'
  },
  BIO_TISSUE: {
    id: 'bio_tissue',
    name: 'Daging Mutan Hutan',
    type: 'loot',
    category: 'zombie_drops',
    rarity: 'common',
    value: 25000,
    maxStack: 99,
    icon: '🥩',
    description: 'Sampel biologis zombie hutan bernilai jual tinggi di pengepul desa.'
  },
  XENON_CORE: {
    id: 'xenon_core',
    name: 'Batu Permata Hutan',
    type: 'loot',
    category: 'zombie_drops',
    rarity: 'rare',
    value: 80000,
    maxStack: 30,
    icon: '💎',
    description: 'Batu permata berkilau langka dari monster elit hutan rimba, bernilai Rp 80.000.'
  },
  TITAN_CORE: {
    id: 'titan_core',
    name: 'Inti Titan Raksasa',
    type: 'loot',
    category: 'zombie_drops',
    rarity: 'legendary',
    value: 100000, // Rebalanced: Rp 100.000 agar rifle Rp 500.000 tetap prestisius
    maxStack: 10,
    icon: '👑',
    description: 'Inti energi titan langka dari Boss Titan Sector-7, bernilai jual Rp 100.000 di Toko Desa.'
  },
  NANO_STIM: {
    id: 'nano_stim',
    name: 'Ramuan Jamu Herbal (+40 HP)',
    type: 'consumable',
    category: 'medical',
    rarity: 'common',
    value: 30000,
    heal: 40,
    maxStack: 20,
    icon: '🌿',
    description: 'Racikan tanaman herbal penambah +40 HP instan (tekan [Q] saat bertempur).'
  },
  MEDKIT: {
    id: 'medkit',
    name: 'Militer Medkit (+80 HP)',
    type: 'consumable',
    category: 'medical',
    rarity: 'rare',
    value: 50000,
    heal: 80,
    maxStack: 10,
    icon: '🧰',
    description: 'Kotak P3K medis militer pemulih 80 HP darah vital.'
  },
  BANDAGE: {
    id: 'bandage',
    name: 'Perban Darurat (+20 HP)',
    type: 'consumable',
    category: 'medical',
    rarity: 'common',
    value: 12000,
    heal: 20,
    maxStack: 30,
    icon: '🩹',
    description: 'Perban steril antiseptik pemulih 20 HP darah seketika.'
  },
  JAMU_KENCUR: {
    id: 'jamu_kencur',
    name: 'Jamu Beras Kencur (Stamina 2x)',
    type: 'consumable',
    category: 'medical',
    rarity: 'uncommon',
    value: 45000,
    buffType: 'stamina_boost',
    duration: 60,
    maxStack: 20,
    icon: '🌾',
    description: 'Racikan beras kencur tradisional mempercepat regenerasi stamina 2x lipat selama 60 detik.'
  },
  JAMU_KUNYIT: {
    id: 'jamu_kunyit',
    name: 'Jamu Kunyit Asam (Kebal Racun)',
    type: 'consumable',
    category: 'medical',
    rarity: 'uncommon',
    value: 50000,
    buffType: 'poison_immune',
    duration: 60,
    maxStack: 20,
    icon: '🫚',
    description: 'Ramuan kunyit asam alami memberikan kekebalan total terhadap gas beracun selama 60 detik.'
  },
  BAMBOO_TRAP: {
    id: 'bamboo_trap',
    name: 'Ranjau Paku Bambu',
    type: 'trap',
    category: 'materials',
    rarity: 'uncommon',
    value: 20000,
    maxStack: 20,
    icon: '🎋',
    description: 'Ranjau paku runcing bambu desa. Memberikan 50 damage dan memperlambat musuh 50% selama 5 detik.'
  },
  METAL_PARTS: {
    id: 'metal_parts',
    name: 'Baut & Komponen Logam',
    type: 'material',
    category: 'materials',
    rarity: 'common',
    value: 20000,
    maxStack: 99,
    icon: '🔩',
    description: 'Komponen logam presisi dan baut tempa tahan karat.'
  },
  WOOD: {
    id: 'wood',
    name: 'Kayu Rimba',
    type: 'material',
    category: 'materials',
    rarity: 'common',
    value: 10000,
    maxStack: 99,
    icon: '🪵',
    description: 'Kayu gelondongan rimba bahan kerajinan dan perangkap.'
  },
  CLOTH: {
    id: 'cloth',
    name: 'Kain Serat Tekstil',
    type: 'material',
    category: 'materials',
    rarity: 'common',
    value: 8000,
    maxStack: 99,
    icon: '🧵',
    description: 'Serat kain tahan air untuk meracik perban dan tas.'
  },
  ZOMBIE_TEETH: {
    id: 'zombie_teeth',
    name: 'Taring Zombi Hutan',
    type: 'loot',
    category: 'zombie_drops',
    rarity: 'common',
    value: 18000,
    maxStack: 99,
    icon: '🦷',
    description: 'Taring runcing zombi hutan buruan bernilai jual tinggi.'
  },
  ZOMBIE_CLAW: {
    id: 'zombie_claw',
    name: 'Cakar Mutan Beracun',
    type: 'loot',
    category: 'zombie_drops',
    rarity: 'uncommon',
    value: 35000,
    maxStack: 50,
    icon: '🦅',
    description: 'Cakar cadas mutan berbahaya buruan para kolektor.'
  },
  RADIO_BATTERY: {
    id: 'radio_battery',
    name: 'Baterai Komunikasi',
    type: 'misc',
    category: 'misc',
    rarity: 'uncommon',
    value: 22000,
    maxStack: 30,
    icon: '🔋',
    description: 'Baterai lithium berkapasitas tinggi untuk perangkat radio darurat.'
  },
  RATION_PACK: {
    id: 'ration_pack',
    name: 'Ransum Makanan Darurat',
    type: 'misc',
    category: 'misc',
    rarity: 'common',
    value: 15000,
    heal: 15,
    maxStack: 30,
    icon: '🥫',
    description: 'Makanan kaleng berenergi tinggi pemulih 15 HP stamina.'
  },
  AMMO_PISTOL: {
    id: 'ammo_pistol',
    name: 'Amunisi 9mm Pistol (24 btr)',
    type: 'ammo',
    category: 'ammunition',
    rarity: 'common',
    value: 15000,
    count: 24,
    maxStack: 999,
    weaponId: 'pulse_pistol',
    icon: '🔫',
    description: 'Satu kotak 24 butir peluru 9mm untuk Tactical Pistol.'
  },
  AMMO_SHOTGUN: {
    id: 'ammo_shotgun',
    name: 'Amunisi 12-Gauge (12 btr)',
    type: 'ammo',
    category: 'ammunition',
    rarity: 'uncommon',
    value: 25000,
    count: 12,
    maxStack: 999,
    weaponId: 'scatter_blaster',
    icon: '💥',
    description: 'Satu kotak 12 butir peluru buckshot untuk Scatter Shotgun.'
  },
  AMMO_RIFLE: {
    id: 'ammo_rifle',
    name: 'Amunisi 7.62mm Rifle (30 btr)',
    type: 'ammo',
    category: 'ammunition',
    rarity: 'rare',
    value: 35000,
    count: 30,
    maxStack: 999,
    weaponId: 'plasma_rifle',
    icon: '⚡',
    description: 'Satu kotak 30 butir amunisi rifle kaliber 7.62mm.'
  },
  PLASMA_AMMO: {
    id: 'plasma_ammo',
    name: 'Amunisi 7.62mm Rifle (30 btr)',
    type: 'ammo',
    category: 'ammunition',
    rarity: 'rare',
    value: 35000,
    count: 30,
    maxStack: 999,
    weaponId: 'plasma_rifle',
    icon: '📦',
    description: 'Satu kotak 30 butir amunisi rifle kaliber 7.62mm.'
  },
  WEAPON_PISTOL: {
    id: 'pulse_pistol',
    name: 'Tactical Pistol 9mm',
    type: 'weapon',
    category: 'weapons',
    rarity: 'common',
    value: 50000,
    icon: '🔫',
    maxStack: 1,
    description: 'Pistol semi-otomatis 9mm bawaan pemburu.'
  },
  WEAPON_SHOTGUN: {
    id: 'scatter_blaster',
    name: 'Scatter Shotgun 12-Gauge',
    type: 'weapon',
    category: 'weapons',
    rarity: 'uncommon',
    value: 250000,
    icon: '💥',
    maxStack: 1,
    description: 'Shotgun aksi pompa 12-gauge dengan sebaran mematikan.'
  },
  WEAPON_RIFLE: {
    id: 'plasma_rifle',
    name: 'Senapan Taktis 7.62mm',
    type: 'weapon',
    category: 'weapons',
    rarity: 'rare',
    value: 500000,
    icon: '⚡',
    maxStack: 1,
    description: 'Senapan serbu militer otomatis berakurasi tinggi.'
  },
  WEAPON_MACHETE: {
    id: 'machete',
    name: 'Golok Pedesaan',
    type: 'weapon',
    category: 'weapons',
    rarity: 'common',
    value: 35000,
    icon: '🗡️',
    maxStack: 1,
    description: 'Bilah baja tempa tajam untuk tebasan senyap tanpa suara.'
  }
};

export const CRAFTING_RECIPES = [
  {
    id: 'craft_ammo_pistol',
    name: 'Rakit 2x Kotak Amunisi 9mm (48 butir)',
    result: { id: 'ammo_pistol', count: 48 },
    itemsYield: 2,
    req: [{ id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 1 }],
    minHouseLevel: 2,
    desc: 'Ubah 1 Kayu & Besi Tempa menjadi 2 kotak (48 butir) peluru 9mm. Untung besar dibanding beli di Toko!'
  },
  {
    id: 'craft_ammo_shotgun',
    name: 'Rakit 2x Kotak Amunisi 12-Gauge (24 butir)',
    result: { id: 'ammo_shotgun', count: 24 },
    itemsYield: 2,
    req: [{ id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 2 }],
    minHouseLevel: 2,
    desc: 'Ubah 2 Kayu & Besi Tempa menjadi 2 kotak (24 butir) buckshot shotgun.'
  },
  {
    id: 'craft_ammo_rifle',
    name: 'Rakit 2x Kotak Amunisi 7.62mm (60 butir)',
    result: { id: 'ammo_rifle', count: 60 },
    itemsYield: 2,
    req: [
      { id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 2 },
      { id: 'bio_tissue', name: 'Daging Mutan Hutan', count: 1 }
    ],
    minHouseLevel: 2,
    desc: 'Padukan 2 Besi Tempa & 1 Daging Mutan menjadi 2 kotak (60 butir) peluru rifle.'
  },
  {
    id: 'craft_jamu_herbal',
    name: 'Racik 2x Botol Jamu Herbal (+40 HP)',
    result: { id: 'nano_stim', count: 2 },
    itemsYield: 2,
    req: [
      { id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 1 },
      { id: 'bio_tissue', name: 'Daging Mutan Hutan', count: 1 }
    ],
    minHouseLevel: 2,
    desc: 'Tumbuk 1 Daging Mutan & 1 Kayu Herbal menjadi 2 botol Jamu Herbal siap minum.'
  },
  {
    id: 'craft_jamu_kencur',
    name: 'Racik Jamu Beras Kencur (Stamina 2x - 60s)',
    result: { id: 'jamu_kencur', count: 1 },
    itemsYield: 1,
    req: [
      { id: 'bio_tissue', name: 'Daging Mutan Hutan', count: 2 },
      { id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 1 }
    ],
    minHouseLevel: 2,
    desc: 'Ekstrak kencur dan nutrisi mutan mempercepat regenerasi stamina 2x lipat selama 60 detik.'
  },
  {
    id: 'craft_jamu_kunyit',
    name: 'Racik Jamu Kunyit Asam (Kebal Racun - 60s)',
    result: { id: 'jamu_kunyit', count: 1 },
    itemsYield: 1,
    req: [
      { id: 'bio_tissue', name: 'Daging Mutan Hutan', count: 2 },
      { id: 'power_converter', name: 'Komponen Mesin Desa', count: 1 }
    ],
    minHouseLevel: 3,
    desc: 'Resep Elit Rumah Lv 3: Fermentasi kunyit asam memberikan imunitas mutlak dari kabut racun selama 60s.'
  },
  {
    id: 'craft_bamboo_trap',
    name: 'Rakit 2x Ranjau Paku Bambu (Slow 50%)',
    result: { id: 'bamboo_trap', count: 2 },
    itemsYield: 2,
    req: [
      { id: 'scrap_metal', name: 'Kayu & Besi Tempa', count: 2 }
    ],
    minHouseLevel: 2,
    desc: 'Rakit 2 perangkap paku bambu tajam. Pasang di tanah untuk melukai dan memperlambat musuh 50%.'
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
    this.ownedWeapons = ['pulse_pistol', 'machete'];
    this.currentWeaponIndex = 0;

    // Lapak Dagang Pribadi Pemain (Player Market Stall & Showcase)
    this.playerShopStall = [null, null, null, null]; // 4 slot etalase toko
    this.playerShopRegister = 0; // Kasir uang hasil penjualan NPC pembeli

    // Status Buff Ramuan Tradisional Aktif (dalam detik)
    this.activeBuffs = {
      staminaBoostTimer: 0, // Jamu Beras Kencur: 2x Stamina Regen
      poisonImmuneTimer: 0  // Jamu Kunyit Asam: Kebal Racun
    };

    // Kontrak Buruan Berjenjang di Alun-Alun Desa (Variasi Misi & Taktik Khusus)
    this.bounties = [
      {
        id: 'bounty_brutes',
        tier: 'PEMULA',
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
        tier: 'PEMULA',
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
        tier: 'PENJELAJAH',
        title: 'Penjarahan 3 Peti Kargo',
        desc: 'Buka dan ambil perbekalan dari 3 peti kargo pondok hutan.',
        targetType: 'crate',
        targetCount: 3,
        currentCount: 0,
        rewardRp: 60000,
        completed: false,
        claimed: false
      },
      {
        id: 'bounty_shotgun_brute',
        tier: 'TAKTIK KHUSUS',
        title: 'Taktik Kasar: 4 Brute (Shotgun)',
        desc: 'Tumbangkan 4 Zombi Brute menggunakan tembakan Scatter Shotgun jarak dekat.',
        targetType: 'tank',
        weaponReq: 'scatter_blaster',
        targetCount: 4,
        currentCount: 0,
        rewardRp: 95000,
        completed: false,
        claimed: false
      },
      {
        id: 'bounty_titan_slayer',
        tier: 'LEGENDARIS',
        title: 'Ekstraksi Inti Titan Raksasa',
        desc: 'Robohkan Boss Titan di Sector-7 dan bawa pulang Inti Titan ke Desa Asri.',
        targetType: 'titan_core',
        targetCount: 1,
        currentCount: 0,
        rewardRp: 120000,
        completed: false,
        claimed: false
      }
    ];

    // =========================================================================
    // 60-SLOT PLAYER INVENTORY (STACKABLE ITEMS & CATEGORIES)
    // =========================================================================
    this.inventoryMaxSlots = 60; // 60 slot kapasitas awal
    this.inventory = [];         // Array slot inventaris stackable

    // =========================================================================
    // SISTEM MARKETPLACE & PENJUALAN SIMULASI REALISTIS
    // =========================================================================
    this.marketplaceListings = []; // Daftar barang yang sedang/telah dipasarkan
    this.transactionHistory = [];  // Riwayat transaksi tercatat

    // =========================================================================
    // PROFIL PEMAIN, STATISTIK REAL-TIME & ACHIEVEMENTS
    // =========================================================================
    this.playerProfile = {
      name: 'Survivor #07',
      avatar: '🪖',
      createdAt: Date.now()
    };

    this.stats = {
      totalPlaytimeSec: 0,
      totalDeaths: 0,
      longestSurvivalSec: 0,
      highestWave: 1,
      totalDamageDealt: 0,
      totalShotsFired: 0,
      totalHeadshots: 0,
      totalAmmoUsed: 0,
      totalAmmoCollected: 0,
      totalHealthRestored: 0,
      totalItemsCollected: 0,
      totalItemsSold: 0,
      totalItemsListed: 0,
      totalSalesCount: 0,
      totalMoneyEarned: 0,
      totalMoneySpent: 0,
      totalClaimedEarnings: 0
    };

    this.zombieStats = {
      total: 0,
      walker: 0,
      runner: 0,
      tank: 0,
      stalker: 0,
      boss: 0,
      headshots: 0,
      currentKillStreak: 0,
      highestKillStreak: 0,
      wavesSurvived: 0
    };

    this.achievements = {
      first_blood: { id: 'first_blood', title: 'First Blood', desc: 'Membunuh zombie mutan pertama di Sector-7.', icon: '🩸', target: 1, unlocked: false, unlockedAt: null },
      zombie_hunter: { id: 'zombie_hunter', title: 'Zombie Hunter', desc: 'Membasmi 100 zombie mutan.', icon: '🎯', target: 100, unlocked: false, unlockedAt: null },
      zombie_slayer: { id: 'zombie_slayer', title: 'Apocalypse Slayer', desc: 'Membasmi 250 zombie mutan.', icon: '☠️', target: 250, unlocked: false, unlockedAt: null },
      headshot_master: { id: 'headshot_master', title: 'Deadly Marksman', desc: 'Melakukan 50 tembakan headshot presisi.', icon: '🎖️', target: 50, unlocked: false, unlockedAt: null },
      titan_slayer: { id: 'titan_slayer', title: 'Titan\'s Downfall', desc: 'Mengalahkan Colossal Titan Boss di Sector-7.', icon: '👑', target: 1, unlocked: false, unlockedAt: null },
      survivor: { id: 'survivor', title: 'Seasoned Survivor', desc: 'Bertahan hidup dan menyelesaikan 10 gelombang / wave.', icon: '🛡️', target: 10, unlocked: false, unlockedAt: null },
      merchant: { id: 'merchant', title: 'Village Merchant', desc: 'Menjual 50 barang di marketplace desa.', icon: '🏪', target: 50, unlocked: false, unlockedAt: null },
      rich_survivor: { id: 'rich_survivor', title: 'Wealthy Scavenger', desc: 'Mengumpulkan total pendapatan Rp 500.000.', icon: '💰', target: 500000, unlocked: false, unlockedAt: null },
      collector: { id: 'collector', title: 'Master Scavenger', desc: 'Mengumpulkan total 100 barang jarahan.', icon: '🎒', target: 100, unlocked: false, unlockedAt: null },
      medicine_man: { id: 'medicine_man', title: 'Field Medic', desc: 'Memulihkan total 500 HP darah vital.', icon: '💉', target: 500, unlocked: false, unlockedAt: null }
    };
  }

  // Pengelolaan Buff Ramuan Tradisional
  applyBuff(buffType, duration = 60) {
    if (!this.activeBuffs) this.activeBuffs = { staminaBoostTimer: 0, poisonImmuneTimer: 0 };
    if (buffType === 'stamina_boost') {
      this.activeBuffs.staminaBoostTimer = Math.max(this.activeBuffs.staminaBoostTimer || 0, duration);
    } else if (buffType === 'poison_immune') {
      this.activeBuffs.poisonImmuneTimer = Math.max(this.activeBuffs.poisonImmuneTimer || 0, duration);
    }
  }

  updateBuffs(delta) {
    if (!this.activeBuffs) return;
    if (this.activeBuffs.staminaBoostTimer > 0) {
      this.activeBuffs.staminaBoostTimer = Math.max(0, this.activeBuffs.staminaBoostTimer - delta);
    }
    if (this.activeBuffs.poisonImmuneTimer > 0) {
      this.activeBuffs.poisonImmuneTimer = Math.max(0, this.activeBuffs.poisonImmuneTimer - delta);
    }
  }

  hasBuff(buffType) {
    if (!this.activeBuffs) return false;
    if (buffType === 'stamina_boost') return (this.activeBuffs.staminaBoostTimer || 0) > 0;
    if (buffType === 'poison_immune') return (this.activeBuffs.poisonImmuneTimer || 0) > 0;
    return false;
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
    // Sinkronisasi otomatis ke inventaris 60-slot stackable
    this.addItemToInventory(item, item.count || item.quantity || 1, false);
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
  // LAPAK DAGANG PRIBADI PEMAIN (PLAYER MARKET STALL & NPC SALES)
  // =========================================================================
  sellItemFromBackpack(backpackIndex) {
    if (backpackIndex < 0 || backpackIndex >= this.backpack.length) {
      return { success: false, message: 'Barang tidak ditemukan di ransel.' };
    }
    const item = this.backpack.splice(backpackIndex, 1)[0];
    const price = item.value || 10000;
    this.wallet += price;
    this.saveToStorage();
    return { success: true, earnedRp: price, itemName: item.name, icon: item.icon };
  }

  sellAllScrap() {
    const scrapIds = ['scrap_metal', 'power_converter', 'bio_tissue', 'xenon_core', 'titan_core'];
    const kept = [];
    let soldCount = 0;
    let totalEarned = 0;

    for (const itm of this.backpack) {
      if (scrapIds.includes(itm.id)) {
        soldCount++;
        totalEarned += (itm.value || 0);
      } else {
        kept.push(itm);
      }
    }

    if (soldCount === 0) {
      return { success: false, message: 'Tidak ada material jarahan/rongsokan di ransel untuk dijual.' };
    }

    this.backpack = kept;
    this.wallet += totalEarned;
    this.saveToStorage();
    return { success: true, count: soldCount, totalEarned };
  }

  stockItemToStall(backpackIndex, targetSlot = -1) {
    if (!Array.isArray(this.playerShopStall)) this.playerShopStall = [null, null, null, null];
    if (backpackIndex < 0 || backpackIndex >= this.backpack.length) {
      return { success: false, message: 'Barang tidak ditemukan di ransel.' };
    }

    let slot = targetSlot;
    if (slot < 0 || slot >= 4 || this.playerShopStall[slot] !== null) {
      slot = this.playerShopStall.findIndex(s => s === null);
    }

    if (slot === -1) {
      return { success: false, message: 'Seluruh 4 etalase lapak sudah penuh!' };
    }

    const item = this.backpack.splice(backpackIndex, 1)[0];
    this.playerShopStall[slot] = item;
    this.saveToStorage();
    return { success: true, slot, item, message: `Berhasil memajang ${item.name} di etalase lapak!` };
  }

  unstockItemFromStall(slotIndex) {
    if (!Array.isArray(this.playerShopStall)) this.playerShopStall = [null, null, null, null];
    if (slotIndex < 0 || slotIndex >= 4 || !this.playerShopStall[slotIndex]) {
      return { success: false, message: 'Etalase kosong.' };
    }
    if (this.backpack.length >= this.backpackMaxSlots) {
      return { success: false, message: 'Ransel Anda sudah penuh!' };
    }
    const item = this.playerShopStall[slotIndex];
    this.playerShopStall[slotIndex] = null;
    this.backpack.push(item);
    this.saveToStorage();
    return { success: true, item, message: `Mengambil ${item.name} dari etalase kembali ke ransel.` };
  }

  collectRegisterCash() {
    const amount = this.playerShopRegister || 0;
    if (amount <= 0) {
      return { success: false, message: 'Kotak kasir lapak masih kosong.' };
    }
    this.wallet += amount;
    this.playerShopRegister = 0;
    this.saveToStorage();
    return { success: true, collected: amount, message: `Berhasil mengambil ${this.formatRp(amount)} dari kasir toko!` };
  }

  npcPurchaseFromStall(buyerName = 'Warga Desa') {
    if (!Array.isArray(this.playerShopStall)) this.playerShopStall = [null, null, null, null];
    const filledIndices = [];
    this.playerShopStall.forEach((item, idx) => {
      if (item !== null) filledIndices.push(idx);
    });

    if (filledIndices.length > 0) {
      const chosenIdx = filledIndices[Math.floor(Math.random() * filledIndices.length)];
      const item = this.playerShopStall[chosenIdx];
      // Harga jual di etalase mendapat margin laba +25%
      const price = Math.round((item.value || 15000) * 1.25);
      this.playerShopStall[chosenIdx] = null;
      this.playerShopRegister = (this.playerShopRegister || 0) + price;
      this.saveToStorage();
      return {
        type: 'item',
        itemName: item.name,
        icon: item.icon,
        price,
        buyerName
      };
    } else {
      // Jika etalase kosong, NPC berbelanja perbekalan suvenir desa
      const tipAmount = 2500 + Math.floor(Math.random() * 2500); // Rp 2.500 - Rp 5.000
      this.playerShopRegister = (this.playerShopRegister || 0) + tipAmount;
      this.saveToStorage();
      return {
        type: 'tip',
        itemName: 'Perbekalan Pedesaan',
        icon: '🧺',
        price: tipAmount,
        buyerName
      };
    }
  }

  // =========================================================================
  // MEJA PERAKIT AMUNISI & JAMU (WORKBENCH CRAFTING) — MULAI DARI RUMAH LV 2
  // =========================================================================
  craftRecipe(recipeId) {
    if (this.houseLevel < 2) {
      return { success: false, message: 'Meja Perakit tersedia mulai dari Rumah Kayu Asri (Level 2).' };
    }
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { success: false, message: 'Resep perakitan tidak valid.' };

    if (recipe.minHouseLevel && this.houseLevel < recipe.minHouseLevel) {
      return { success: false, message: `Resep elit ini memerlukan renovasi Rumah Juragan Desa (Level ${recipe.minHouseLevel}).` };
    }

    // Periksa kecukupan bahan di ransel dan stash
    for (const req of recipe.req) {
      const available = this.countItem(req.id, true) + this.countItem(req.id, false);
      if (available < req.count) {
        return { success: false, message: `Bahan tidak cukup! Membutuhkan ${req.count}x ${req.name} (Tersedia: ${available}).` };
      }
    }

    // Konsumsi bahan dari ransel terlebih dahulu, lalu stash
    for (const req of recipe.req) {
      let remaining = req.count;
      const takenFromBackpack = this.removeItemsById(req.id, remaining, true);
      remaining -= takenFromBackpack;
      if (remaining > 0) {
        this.removeItemsById(req.id, remaining, false);
      }
    }

    // Buat hasil (Mendukung Multi-Yield 2x Lipat Untung)
    const targetItemMeta = Object.values(ITEMS).find(it => it.id === recipe.result.id);
    if (!targetItemMeta) return { success: false, message: 'Item hasil tidak dikenal.' };

    const yields = recipe.itemsYield || 1;
    let placedCount = 0;
    for (let y = 0; y < yields; y++) {
      if (this.backpack.length < this.backpackMaxSlots) {
        this.addItemToBackpack({ ...targetItemMeta });
        placedCount++;
      } else if (this.stash.length < this.stashMaxSlots) {
        this.addItemToStash({ ...targetItemMeta });
        placedCount++;
      }
    }

    this.saveToStorage();
    return {
      success: true,
      message: `Berhasil merakit: ${recipe.name}! (${placedCount}x disimpan ke inventaris).`
    };
  }

  // =========================================================================
  // PAPAN KONTRAK BURUAN DESA (BOUNTY HUNTING CONTRACTS BERJENJANG)
  // =========================================================================
  recordBountyProgress(type, count = 1, weaponId = null) {
    let anyCompleted = false;
    for (const b of this.bounties) {
      if (!b.completed && b.targetType === type) {
        // Jika ada syarat senjata tertentu (misal: harus pakai shotgun)
        if (b.weaponReq && weaponId && b.weaponReq !== weaponId) {
          continue;
        }
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
    this.recordPlayerDeath();
    this.saveToStorage();
    return lostItems;
  }

  // =========================================================================
  // MODUL 1: MANAJEMEN INVENTARIS 60 SLOT & STACKABLE ITEMS
  // =========================================================================

  normalizeItem(item) {
    if (!item) return null;
    const base = Object.values(ITEMS).find(i => i.id === item.id) || {};
    return {
      id: item.id || base.id,
      name: item.name || base.name || 'Barang Misterius',
      icon: item.icon || base.icon || '📦',
      type: item.type || base.type || 'misc',
      category: item.category || base.category || (base.type === 'material' ? 'materials' : (base.type === 'loot' ? 'zombie_drops' : (base.type === 'ammo' ? 'ammunition' : (base.type === 'consumable' ? 'medical' : (base.type === 'weapon' ? 'weapons' : 'misc'))))),
      rarity: item.rarity || base.rarity || 'common',
      value: typeof item.value === 'number' ? item.value : (base.value || 10000),
      description: item.description || base.description || '',
      heal: item.heal || base.heal || 0,
      buffType: item.buffType || base.buffType || null,
      duration: item.duration || base.duration || 0,
      weaponId: item.weaponId || base.weaponId || null,
      maxStack: item.maxStack || base.maxStack || (base.type === 'weapon' ? 1 : (base.type === 'ammo' ? 999 : 99))
    };
  }

  addItemToInventory(rawItem, count = 1, save = true) {
    const item = this.normalizeItem(rawItem);
    if (!item || count <= 0) return { success: false, message: 'Item tidak valid.' };
    if (!Array.isArray(this.inventory)) this.inventory = [];

    let remaining = count;
    const maxStack = item.maxStack || 99;

    // 1. Prioritas stack ke slot yang memiliki ID sama dan belum mencapai maxStack
    for (const slot of this.inventory) {
      if (slot.item.id === item.id && slot.count < maxStack) {
        const space = maxStack - slot.count;
        const take = Math.min(remaining, space);
        slot.count += take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }

    // 2. Jika masih bersisa, tempatkan di slot baru selama kapasitas inventaris mencukupi
    while (remaining > 0) {
      if (this.inventory.length >= this.inventoryMaxSlots) {
        if (save) this.saveToStorage();
        return {
          success: remaining < count,
          countAdded: count - remaining,
          message: `Inventaris penuh (${this.inventory.length}/${this.inventoryMaxSlots} Slot Terpakai)!`
        };
      }
      const take = Math.min(remaining, maxStack);
      this.inventory.push({
        slotIndex: this.inventory.length,
        item: { ...item },
        count: take
      });
      remaining -= take;
    }

    this.recordItemCollected(count);
    if (save) this.saveToStorage();
    return {
      success: true,
      countAdded: count,
      message: `Berhasil menyimpan ${count}x ${item.name} ke inventaris!`
    };
  }

  removeItemFromInventory(slotIndex, count = 1, save = true) {
    if (!Array.isArray(this.inventory)) this.inventory = [];
    if (slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, message: 'Slot inventaris tidak ditemukan.' };
    }
    const slot = this.inventory[slotIndex];
    const take = Math.min(count, slot.count);
    slot.count -= take;
    const itemCopy = { ...slot.item };

    if (slot.count <= 0) {
      this.inventory.splice(slotIndex, 1);
      this.inventory.forEach((s, idx) => { s.slotIndex = idx; });
    }

    if (save) this.saveToStorage();
    return { success: true, item: itemCopy, countRemoved: take };
  }

  useItemFromInventory(slotIndex, player = null) {
    if (!Array.isArray(this.inventory)) return { success: false, message: 'Inventaris kosong.' };
    if (slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, message: 'Slot tidak valid.' };
    }
    const slot = this.inventory[slotIndex];
    const item = slot.item;

    // A. Kategori Medis & Obat-Obatan
    if (item.category === 'medical' || item.type === 'consumable') {
      if (item.heal && item.heal > 0) {
        if (player && player.health >= player.maxHealth) {
          return { success: false, message: 'Kondisi vital sudah 100% prima (HP penuh)!' };
        }
        let healed = item.heal;
        if (player) {
          const oldHp = player.health;
          player.health = Math.min(player.maxHealth, player.health + item.heal);
          healed = player.health - oldHp;
        }
        this.recordHealthRestored(healed);
        this.removeItemFromInventory(slotIndex, 1, true);
        if (typeof sound !== 'undefined' && typeof sound.playHerbalGulp === 'function') sound.playHerbalGulp();
        return { success: true, message: `Menggunakan ${item.name}! Vitalitas pulih +${healed} HP.` };
      }

      if (item.buffType) {
        this.applyBuff(item.buffType, item.duration || 60);
        this.removeItemFromInventory(slotIndex, 1, true);
        if (typeof sound !== 'undefined' && typeof sound.playHerbalGulp === 'function') sound.playHerbalGulp();
        return { success: true, message: `Mengonsumsi ${item.name}! Efek ramuan aktif selama ${item.duration || 60} detik.` };
      }
    }

    // B. Kategori Amunisi
    if (item.category === 'ammunition' || item.type === 'ammo') {
      const ammoCount = item.count || 24;
      if (player && player.weapons) {
        player.weapons.addWeaponAmmo(item.weaponId || 'pulse_pistol', ammoCount);
      }
      this.recordAmmoCollected(ammoCount);
      this.removeItemFromInventory(slotIndex, 1, true);
      if (typeof sound !== 'undefined' && typeof sound.playAmmoResupply === 'function') sound.playAmmoResupply();
      return { success: true, message: `Mengisi amunisi ${item.name} (+${ammoCount} butir peluru)!` };
    }

    // C. Kategori Senjata
    if (item.category === 'weapons' || item.type === 'weapon') {
      if (player && player.weapons) {
        player.weapons.switchWeapon(item.id);
        return { success: true, message: `Menyiapkan senjata ${item.name}!` };
      }
    }

    // D. Ranjau Bambu
    if (item.id === 'bamboo_trap') {
      if (player && typeof player.deployBambooTrap === 'function') {
        player.deployBambooTrap();
        this.removeItemFromInventory(slotIndex, 1, true);
        return { success: true, message: 'Ranjau Paku Bambu berhasil dipasang di tanah!' };
      }
    }

    return { success: false, message: 'Barang ini tidak dapat digunakan secara langsung.' };
  }

  dropItemFromInventory(slotIndex, count = 1) {
    return this.removeItemFromInventory(slotIndex, count, true);
  }

  getInventoryUsedSlots() {
    return Array.isArray(this.inventory) ? this.inventory.length : 0;
  }

  getInventoryCapacity() {
    return this.inventoryMaxSlots || 60;
  }

  getInventoryFreeSlots() {
    return Math.max(0, this.getInventoryCapacity() - this.getInventoryUsedSlots());
  }

  getInventoryItems(category = 'all', searchQuery = '', sortBy = 'name') {
    if (!Array.isArray(this.inventory)) return [];
    let items = this.inventory.map((slot, idx) => ({ ...slot, originalSlot: idx }));

    if (category && category !== 'all') {
      items = items.filter(s => s.item.category === category);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(s =>
        s.item.name.toLowerCase().includes(q) ||
        (s.item.description && s.item.description.toLowerCase().includes(q))
      );
    }

    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    items.sort((a, b) => {
      if (sortBy === 'name' || sortBy === 'name_asc') return a.item.name.localeCompare(b.item.name);
      if (sortBy === 'name_desc') return b.item.name.localeCompare(a.item.name);
      if (sortBy === 'count' || sortBy === 'qty_desc') return b.count - a.count;
      if (sortBy === 'qty_asc') return a.count - b.count;
      if (sortBy === 'price' || sortBy === 'price_desc') return (b.item.value || 0) - (a.item.value || 0);
      if (sortBy === 'price_asc') return (a.item.value || 0) - (b.item.value || 0);
      if (sortBy === 'rarity' || sortBy === 'rarity_desc') return (rarityOrder[b.item.rarity] || 0) - (rarityOrder[a.item.rarity] || 0);
      return 0;
    });

    return items;
  }

  // =========================================================================
  // MODUL 2: SISTEM MARKETPLACE, LISTING PENJUALAN & TRANSAKSI
  // =========================================================================

  listItemToMarketplace(inventoryIndex, quantityToSell, unitPrice = null) {
    if (!Array.isArray(this.inventory)) return { success: false, message: 'Inventaris kosong.' };
    if (inventoryIndex < 0 || inventoryIndex >= this.inventory.length) {
      return { success: false, message: 'Slot inventaris tidak valid.' };
    }
    const slot = this.inventory[inventoryIndex];
    if (quantityToSell <= 0 || quantityToSell > slot.count) {
      return { success: false, message: `Jumlah jual tidak valid (Maksimal ${slot.count}).` };
    }

    const item = slot.item;
    const pricePerUnit = (unitPrice !== null && unitPrice > 0) ? Math.round(unitPrice) : (item.value || 10000);
    const totalPrice = pricePerUnit * quantityToSell;

    // Kalkulasi durasi penjualan simulasi realistis berdasarkan kelangkaan & harga
    const rarityTimes = { common: 18, uncommon: 35, rare: 70, epic: 110, legendary: 160 };
    const baseTime = rarityTimes[item.rarity] || 25;
    const priceRatio = pricePerUnit / (item.value || pricePerUnit);
    const competitiveness = Math.pow(Math.max(0.5, priceRatio), 1.25);
    const jitter = 0.9 + Math.random() * 0.2;
    const sellTimeRequired = Math.max(6, Math.round(baseTime * competitiveness * jitter));

    // Kurangi item dari inventaris pemain
    this.removeItemFromInventory(inventoryIndex, quantityToSell, false);

    const listing = {
      id: 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      item: { ...item },
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon || '📦',
      category: item.category || 'misc',
      rarity: item.rarity || 'common',
      quantity: quantityToSell,
      unitPrice: pricePerUnit,
      totalPrice,
      listedAt: Date.now(),
      duration: sellTimeRequired,
      timeElapsed: 0,
      durationSec: 0,
      sellTimeRequired,
      status: 'LISTED',
      soldAt: null,
      claimedAt: null
    };

    if (!Array.isArray(this.marketplaceListings)) this.marketplaceListings = [];
    this.marketplaceListings.unshift(listing);

    this.stats.totalItemsListed = (this.stats.totalItemsListed || 0) + quantityToSell;
    this.saveToStorage();

    return {
      success: true,
      listing,
      message: `Berhasil mendaftarkan ${quantityToSell}x ${item.name} ke Marketplace seharga ${this.formatRp(totalPrice)}!`
    };
  }

  cancelMarketplaceListing(listingId) {
    if (!Array.isArray(this.marketplaceListings)) return { success: false, message: 'Listing tidak ditemukan.' };
    const listing = this.marketplaceListings.find(l => l.id === listingId);
    if (!listing) return { success: false, message: 'Listing tidak ditemukan.' };
    if (listing.status !== 'LISTED') return { success: false, message: 'Hanya listing berstatus LISTED yang dapat dibatalkan.' };

    const itemMeta = Object.values(ITEMS).find(i => i.id === listing.itemId) || {
      id: listing.itemId,
      name: listing.itemName,
      icon: listing.itemIcon,
      category: listing.category,
      rarity: listing.rarity,
      value: listing.unitPrice
    };

    const addRes = this.addItemToInventory(itemMeta, listing.quantity, false);
    if (!addRes.success) {
      return { success: false, message: 'Inventaris Anda penuh! Sediakan ruang kosong sebelum membatalkan listing.' };
    }

    listing.status = 'CANCELLED';
    this.saveToStorage();
    return {
      success: true,
      message: `Listing dibatalkan. ${listing.quantity}x ${listing.itemName} dikembalikan ke inventaris!`
    };
  }

  updateMarketplace(delta) {
    if (!Array.isArray(this.marketplaceListings)) return [];
    const newlySold = [];

    for (const listing of this.marketplaceListings) {
      if (listing.status === 'LISTED') {
        listing.durationSec += delta;
        listing.timeElapsed = listing.durationSec;
        const required = listing.duration || listing.sellTimeRequired || 20;
        if (listing.durationSec >= required) {
          listing.status = 'SOLD';
          listing.soldAt = Date.now();
          newlySold.push(listing);
        }
      }
    }

    if (newlySold.length > 0) {
      this.saveToStorage();
      if (typeof this.onItemSoldCallback === 'function') {
        newlySold.forEach(l => this.onItemSoldCallback(l));
      }
    }
    return newlySold;
  }

  getUnclaimedEarnings() {
    if (!Array.isArray(this.marketplaceListings)) return 0;
    return this.marketplaceListings
      .filter(l => l.status === 'SOLD')
      .reduce((sum, l) => sum + (l.totalPrice || 0), 0);
  }

  claimListingEarnings(listingId) {
    if (!Array.isArray(this.marketplaceListings)) return { success: false, message: 'Tidak ada data listing.' };
    const listing = this.marketplaceListings.find(l => l.id === listingId);
    if (!listing) return { success: false, message: 'Listing tidak ditemukan.' };
    if (listing.status === 'CLAIMED') return { success: false, message: 'Hasil penjualan ini sudah pernah diklaim sebelumnya.' };
    if (listing.status !== 'SOLD') return { success: false, message: 'Barang ini belum berhasil terjual di pasar.' };

    const amount = listing.totalPrice;
    listing.status = 'CLAIMED';
    listing.claimedAt = Date.now();

    this.wallet += amount;
    this.stats.totalClaimedEarnings = (this.stats.totalClaimedEarnings || 0) + amount;
    this.stats.totalMoneyEarned = (this.stats.totalMoneyEarned || 0) + amount;
    this.stats.totalSalesCount = (this.stats.totalSalesCount || 0) + 1;
    this.stats.totalItemsSold = (this.stats.totalItemsSold || 0) + listing.quantity;

    if (!Array.isArray(this.transactionHistory)) this.transactionHistory = [];
    this.transactionHistory.unshift({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'Klaim Penjualan',
      desc: `${listing.itemName} x${listing.quantity}`,
      detail: `${listing.itemName} x${listing.quantity}`,
      amount,
      date: Date.now(),
      timestamp: Date.now(),
      status: 'Berhasil'
    });

    this.checkAchievements();
    this.saveToStorage();

    return {
      success: true,
      claimedAmount: amount,
      listing,
      message: `Berhasil mengklaim +${this.formatRp(amount)} dari penjualan ${listing.itemName} ke dompet!`
    };
  }

  claimAllEarnings() {
    if (!Array.isArray(this.marketplaceListings)) return { success: false, message: 'Tidak ada data listing.' };
    const soldListings = this.marketplaceListings.filter(l => l.status === 'SOLD');
    if (soldListings.length === 0) {
      return { success: false, message: 'Tidak ada saldo hasil penjualan yang belum diklaim.' };
    }

    let totalAmount = 0;
    let totalItems = 0;
    const now = Date.now();

    if (!Array.isArray(this.transactionHistory)) this.transactionHistory = [];

    for (const listing of soldListings) {
      listing.status = 'CLAIMED';
      listing.claimedAt = now;
      totalAmount += listing.totalPrice;
      totalItems += listing.quantity;

      this.transactionHistory.unshift({
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type: 'Klaim Penjualan',
        desc: `${listing.itemName} x${listing.quantity}`,
        detail: `${listing.itemName} x${listing.quantity}`,
        amount: listing.totalPrice,
        date: now,
        timestamp: now,
        status: 'Berhasil'
      });
    }

    this.wallet += totalAmount;
    this.stats.totalClaimedEarnings = (this.stats.totalClaimedEarnings || 0) + totalAmount;
    this.stats.totalMoneyEarned = (this.stats.totalMoneyEarned || 0) + totalAmount;
    this.stats.totalSalesCount = (this.stats.totalSalesCount || 0) + soldListings.length;
    this.stats.totalItemsSold = (this.stats.totalItemsSold || 0) + totalItems;

    this.checkAchievements();
    this.saveToStorage();

    return {
      success: true,
      totalClaimed: totalAmount,
      count: soldListings.length,
      claimedCount: soldListings.length,
      message: `Berhasil mengklaim total +${this.formatRp(totalAmount)} dari ${soldListings.length} penjualan ke dompet!`
    };
  }

  // =========================================================================
  // MODUL 3: STATISTIK PEMAIN, PROFIL & ACHIEVEMENTS
  // =========================================================================

  recordZombieKill(type, weaponId = null, wasHeadshot = false) {
    if (!this.zombieStats) {
      this.zombieStats = { total: 0, walker: 0, runner: 0, tank: 0, stalker: 0, boss: 0, headshots: 0, currentKillStreak: 0, highestKillStreak: 0, wavesSurvived: 0 };
    }
    this.zombieStats.total++;

    const t = (type || 'walker').toLowerCase();
    if (t === 'runner') this.zombieStats.runner++;
    else if (t === 'tank' || t === 'brute') this.zombieStats.tank++;
    else if (t === 'stalker') this.zombieStats.stalker++;
    else if (t === 'boss') this.zombieStats.boss++;
    else this.zombieStats.walker++;

    if (wasHeadshot) {
      this.zombieStats.headshots = (this.zombieStats.headshots || 0) + 1;
      this.stats.totalHeadshots = (this.stats.totalHeadshots || 0) + 1;
    }

    this.zombieStats.currentKillStreak = (this.zombieStats.currentKillStreak || 0) + 1;
    if (this.zombieStats.currentKillStreak > (this.zombieStats.highestKillStreak || 0)) {
      this.zombieStats.highestKillStreak = this.zombieStats.currentKillStreak;
    }

    this.checkAchievements();
  }

  recordDamageDealt(damage) {
    this.stats.totalDamageDealt = (this.stats.totalDamageDealt || 0) + damage;
  }

  recordShotsFired(count = 1) {
    this.stats.totalShotsFired = (this.stats.totalShotsFired || 0) + count;
  }

  recordHeadshot() {
    this.stats.totalHeadshots = (this.stats.totalHeadshots || 0) + 1;
    if (this.zombieStats) this.zombieStats.headshots = (this.zombieStats.headshots || 0) + 1;
    this.checkAchievements();
  }

  recordAmmoUsed(count = 1) {
    this.stats.totalAmmoUsed = (this.stats.totalAmmoUsed || 0) + count;
  }

  recordAmmoCollected(count = 1) {
    this.stats.totalAmmoCollected = (this.stats.totalAmmoCollected || 0) + count;
  }

  recordHealthRestored(amount) {
    this.stats.totalHealthRestored = (this.stats.totalHealthRestored || 0) + amount;
    this.checkAchievements();
  }

  recordItemCollected(count = 1) {
    this.stats.totalItemsCollected = (this.stats.totalItemsCollected || 0) + count;
    this.checkAchievements();
  }

  recordPlayerDeath() {
    this.stats.totalDeaths = (this.stats.totalDeaths || 0) + 1;
    if (this.zombieStats) this.zombieStats.currentKillStreak = 0;
  }

  recordWaveSurvived(waveNumber) {
    if (!this.zombieStats) this.zombieStats = { wavesSurvived: 0 };
    this.zombieStats.wavesSurvived = (this.zombieStats.wavesSurvived || 0) + 1;
    this.stats.highestWave = Math.max(this.stats.highestWave || 1, waveNumber);
    this.checkAchievements();
  }

  updatePlaytime(delta) {
    this.stats.totalPlaytimeSec = (this.stats.totalPlaytimeSec || 0) + delta;
  }

  getPlayerLevel() {
    const kills = this.zombieStats ? (this.zombieStats.total || 0) : 0;
    const hs = this.zombieStats ? (this.zombieStats.headshots || 0) : 0;
    const loot = this.stats ? (this.stats.totalItemsCollected || 0) : 0;
    const waves = this.zombieStats ? (this.zombieStats.wavesSurvived || 0) : 0;
    const earned = this.stats ? (this.stats.totalClaimedEarnings || 0) : 0;

    const totalXP = (kills * 20) + (hs * 15) + (loot * 10) + (waves * 80) + Math.floor(earned / 1000);
    const level = Math.max(1, Math.floor(Math.sqrt(totalXP / 80)) + 1);

    const baseLevelXP = Math.pow(level - 1, 2) * 80;
    const nextLevelXP = Math.pow(level, 2) * 80;
    const xpIntoLevel = Math.max(0, totalXP - baseLevelXP);
    const xpNeeded = Math.max(1, nextLevelXP - baseLevelXP);
    const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));

    let title = 'Rookie Scavenger';
    if (level >= 20) title = 'Titan Master';
    else if (level >= 12) title = 'Elite Slayer';
    else if (level >= 8) title = 'Apocalypse Stalker';
    else if (level >= 5) title = 'Sector Veteran';
    else if (level >= 3) title = 'Forest Hunter';

    return {
      level,
      title,
      totalXP,
      xpIntoLevel,
      xpInLevel: xpIntoLevel,
      xpNeeded,
      xpNeededForNext: xpNeeded,
      progressPercent
    };
  }

  checkAchievements() {
    if (!this.achievements) return [];
    const unlockedNow = [];

    const checks = [
      { id: 'first_blood', cond: (this.zombieStats && this.zombieStats.total >= 1) },
      { id: 'zombie_hunter', cond: (this.zombieStats && this.zombieStats.total >= 100) },
      { id: 'zombie_slayer', cond: (this.zombieStats && this.zombieStats.total >= 250) },
      { id: 'headshot_master', cond: (this.zombieStats && (this.zombieStats.headshots || 0) >= 50) },
      { id: 'titan_slayer', cond: (this.zombieStats && (this.zombieStats.boss || 0) >= 1) },
      { id: 'survivor', cond: (this.zombieStats && (this.zombieStats.wavesSurvived || 0) >= 10) || ((this.stats.highestWave || 1) >= 10) },
      { id: 'merchant', cond: ((this.stats.totalItemsSold || 0) >= 50) },
      { id: 'rich_survivor', cond: ((this.stats.totalMoneyEarned || 0) >= 500000) },
      { id: 'collector', cond: ((this.stats.totalItemsCollected || 0) >= 100) },
      { id: 'medicine_man', cond: ((this.stats.totalHealthRestored || 0) >= 500) }
    ];

    checks.forEach(c => {
      const a = this.achievements[c.id];
      if (a && !a.unlocked && c.cond) {
        a.unlocked = true;
        a.unlockedAt = Date.now();
        unlockedNow.push(a);
      }
    });

    if (unlockedNow.length > 0) {
      this.saveToStorage();
      if (typeof this.onAchievementUnlockedCallback === 'function') {
        unlockedNow.forEach(a => this.onAchievementUnlockedCallback(a));
      }
    }
    return unlockedNow;
  }

  // =========================================================================
  // PERSISTENSI PENYIMPANAN BROWSER & DATA MIGRATION ENGINE
  // =========================================================================
  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        version: 5,
        saveVersion: 5,
        wallet: this.wallet,
        backpack: this.backpack,
        stash: this.stash,
        securePouch: this.securePouch,
        bounties: this.bounties,
        backpackTier: this.backpackTier,
        backpackMaxSlots: this.backpackMaxSlots,
        houseLevel: this.houseLevel,
        stashMaxSlots: this.stashMaxSlots,
        ownedWeapons: this.ownedWeapons,
        playerShopStall: this.playerShopStall,
        playerShopRegister: this.playerShopRegister,

        // Data Inventaris 60 Slot, Marketplace & Profil
        inventory: this.inventory,
        inventoryMaxSlots: this.inventoryMaxSlots,
        marketplaceListings: this.marketplaceListings,
        transactionHistory: this.transactionHistory,
        playerProfile: this.playerProfile,
        stats: this.stats,
        zombieStats: this.zombieStats,
        achievements: this.achievements
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
        if (Array.isArray(data.playerShopStall)) this.playerShopStall = data.playerShopStall;
        if (typeof data.playerShopRegister === 'number') this.playerShopRegister = data.playerShopRegister;

        // Load & Migrasi Inventaris 60 Slot
        if (typeof data.inventoryMaxSlots === 'number') this.inventoryMaxSlots = data.inventoryMaxSlots;
        if (Array.isArray(data.inventory) && data.inventory.length > 0) {
          this.inventory = data.inventory;
        } else if (Array.isArray(data.backpack) && data.backpack.length > 0) {
          // Migrasi aman dari backpack lama
          this.inventory = [];
          data.backpack.forEach(itm => this.addItemToInventory(itm, itm.count || itm.quantity || 1, false));
        }

        if (Array.isArray(data.marketplaceListings)) this.marketplaceListings = data.marketplaceListings;
        if (Array.isArray(data.transactionHistory)) this.transactionHistory = data.transactionHistory;
        if (data.playerProfile && typeof data.playerProfile === 'object') {
          this.playerProfile = { ...this.playerProfile, ...data.playerProfile };
        }
        if (data.stats && typeof data.stats === 'object') {
          this.stats = { ...this.stats, ...data.stats };
        }
        if (data.zombieStats && typeof data.zombieStats === 'object') {
          this.zombieStats = { ...this.zombieStats, ...data.zombieStats };
        }
        if (data.achievements && typeof data.achievements === 'object') {
          Object.keys(data.achievements).forEach(k => {
            if (this.achievements[k]) {
              this.achievements[k].unlocked = !!data.achievements[k].unlocked;
              this.achievements[k].unlockedAt = data.achievements[k].unlockedAt || null;
            }
          });
        }
      }
    } catch (e) {
      console.warn('Gagal memuat state dari localStorage:', e);
    }
  }
}

export const GameState = new StateManager();

