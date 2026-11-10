// gameState.js - Central State, Economy & Inventory Engine for Sci-Fi Survival
// Currency: Rupiah (Rp)

// ============================================================================
// DEAD ZONE — MASTER ITEM DATA ARCHITECTURE (V6 UNIFIED INVENTORY ENGINE)
// Single Source of Truth for Definitions, Instances, Containers & Equipment
// ============================================================================

export const ITEM_DEFINITIONS = {
  scrap_metal: {
    itemId: 'scrap_metal',
    id: 'scrap_metal',
    name: 'Kayu & Besi Tempa',
    type: 'material',
    category: 'materials',
    subCategory: 'building',
    rarity: 'common',
    maxStack: 99,
    stackable: true,
    weight: 0.2,
    sellable: true,
    sellPrice: 15000,
    value: 15000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🪵',
    description: 'Bahan bangunan pedesaan, laku dijual atau dipakai renovasi rumah.'
  },
  power_converter: {
    itemId: 'power_converter',
    id: 'power_converter',
    name: 'Komponen Mesin Desa',
    type: 'material',
    category: 'materials',
    subCategory: 'building',
    rarity: 'uncommon',
    maxStack: 50,
    stackable: true,
    weight: 0.5,
    sellable: true,
    sellPrice: 40000,
    value: 40000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '⚙️',
    description: 'Komponen mekanik penting untuk upgrade Rumah Juragan Desa (Lv 3).'
  },
  bio_tissue: {
    itemId: 'bio_tissue',
    id: 'bio_tissue',
    name: 'Daging Mutan Hutan',
    type: 'loot',
    category: 'zombie_drops',
    subCategory: 'monster_part',
    rarity: 'common',
    maxStack: 99,
    stackable: true,
    weight: 0.25,
    sellable: true,
    sellPrice: 25000,
    value: 25000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🥩',
    description: 'Sampel biologis zombie hutan bernilai jual tinggi di pengepul desa.'
  },
  xenon_core: {
    itemId: 'xenon_core',
    id: 'xenon_core',
    name: 'Batu Permata Hutan',
    type: 'loot',
    category: 'zombie_drops',
    subCategory: 'gem',
    rarity: 'rare',
    maxStack: 30,
    stackable: true,
    weight: 0.1,
    sellable: true,
    sellPrice: 80000,
    value: 80000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '💎',
    description: 'Batu permata berkilau langka dari monster elit hutan rimba, bernilai Rp 80.000.'
  },
  titan_core: {
    itemId: 'titan_core',
    id: 'titan_core',
    name: 'Inti Titan Raksasa',
    type: 'loot',
    category: 'zombie_drops',
    subCategory: 'monster_core',
    rarity: 'legendary',
    maxStack: 10,
    stackable: true,
    weight: 0.8,
    sellable: true,
    sellPrice: 100000,
    value: 100000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '👑',
    description: 'Inti energi titan langka dari Boss Titan Sector-7, bernilai jual Rp 100.000 di Toko Desa.'
  },
  nano_stim: {
    itemId: 'nano_stim',
    id: 'nano_stim',
    name: 'Ramuan Jamu Herbal (+40 HP)',
    type: 'consumable',
    category: 'medical',
    subCategory: 'healing',
    rarity: 'common',
    maxStack: 20,
    stackable: true,
    weight: 0.15,
    sellable: true,
    sellPrice: 30000,
    value: 30000,
    usable: true,
    heal: 40,
    equippable: false,
    droppable: true,
    icon: '🌿',
    description: 'Racikan tanaman herbal penambah +40 HP instan (tekan [Q] saat bertempur).'
  },
  medkit: {
    itemId: 'medkit',
    id: 'medkit',
    name: 'Militer Medkit (+80 HP)',
    type: 'consumable',
    category: 'medical',
    subCategory: 'healing',
    rarity: 'rare',
    maxStack: 10,
    stackable: true,
    weight: 0.4,
    sellable: true,
    sellPrice: 50000,
    value: 50000,
    usable: true,
    heal: 80,
    equippable: false,
    droppable: true,
    icon: '🧰',
    description: 'Kotak P3K medis militer pemulih 80 HP darah vital.'
  },
  bandage: {
    itemId: 'bandage',
    id: 'bandage',
    name: 'Perban Darurat (+20 HP)',
    type: 'consumable',
    category: 'medical',
    subCategory: 'healing',
    rarity: 'common',
    maxStack: 30,
    stackable: true,
    weight: 0.05,
    sellable: true,
    sellPrice: 12000,
    value: 12000,
    usable: true,
    heal: 20,
    equippable: false,
    droppable: true,
    icon: '🩹',
    description: 'Perban steril antiseptik pemulih 20 HP darah seketika.'
  },
  jamu_kencur: {
    itemId: 'jamu_kencur',
    id: 'jamu_kencur',
    name: 'Jamu Beras Kencur (Stamina 2x)',
    type: 'consumable',
    category: 'medical',
    subCategory: 'buff',
    rarity: 'uncommon',
    maxStack: 20,
    stackable: true,
    weight: 0.2,
    sellable: true,
    sellPrice: 45000,
    value: 45000,
    usable: true,
    buffType: 'stamina_boost',
    duration: 60,
    equippable: false,
    droppable: true,
    icon: '🌾',
    description: 'Racikan beras kencur tradisional mempercepat regenerasi stamina 2x lipat selama 60 detik.'
  },
  jamu_kunyit: {
    itemId: 'jamu_kunyit',
    id: 'jamu_kunyit',
    name: 'Jamu Kunyit Asam (Kebal Racun)',
    type: 'consumable',
    category: 'medical',
    subCategory: 'buff',
    rarity: 'uncommon',
    maxStack: 20,
    stackable: true,
    weight: 0.2,
    sellable: true,
    sellPrice: 50000,
    value: 50000,
    usable: true,
    buffType: 'poison_immune',
    duration: 60,
    equippable: false,
    droppable: true,
    icon: '🫚',
    description: 'Ramuan kunyit asam alami memberikan kekebalan total terhadap gas beracun selama 60 detik.'
  },
  bamboo_trap: {
    itemId: 'bamboo_trap',
    id: 'bamboo_trap',
    name: 'Ranjau Paku Bambu',
    type: 'trap',
    category: 'materials',
    subCategory: 'trap',
    rarity: 'uncommon',
    maxStack: 20,
    stackable: true,
    weight: 0.35,
    sellable: true,
    sellPrice: 20000,
    value: 20000,
    usable: true,
    equippable: true,
    equipSlot: 'throwable',
    droppable: true,
    icon: '🎋',
    stats: { damage: 50, slowPct: 50, slowDuration: 5 },
    description: 'Ranjau paku runcing bambu desa. Memberikan 50 damage dan memperlambat musuh 50% selama 5 detik.'
  },
  metal_parts: {
    itemId: 'metal_parts',
    id: 'metal_parts',
    name: 'Baut & Komponen Logam',
    type: 'material',
    category: 'materials',
    subCategory: 'crafting',
    rarity: 'common',
    maxStack: 99,
    stackable: true,
    weight: 0.15,
    sellable: true,
    sellPrice: 20000,
    value: 20000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🔩',
    description: 'Komponen logam presisi dan baut tempa tahan karat.'
  },
  wood: {
    itemId: 'wood',
    id: 'wood',
    name: 'Kayu Rimba',
    type: 'material',
    category: 'materials',
    subCategory: 'crafting',
    rarity: 'common',
    maxStack: 99,
    stackable: true,
    weight: 0.4,
    sellable: true,
    sellPrice: 10000,
    value: 10000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🪵',
    description: 'Kayu gelondongan rimba bahan kerajinan dan perangkap.'
  },
  cloth: {
    itemId: 'cloth',
    id: 'cloth',
    name: 'Kain Serat Tekstil',
    type: 'material',
    category: 'materials',
    subCategory: 'crafting',
    rarity: 'common',
    maxStack: 99,
    stackable: true,
    weight: 0.05,
    sellable: true,
    sellPrice: 8000,
    value: 8000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🧵',
    description: 'Serat kain tahan air untuk meracik perban dan tas.'
  },
  zombie_teeth: {
    itemId: 'zombie_teeth',
    id: 'zombie_teeth',
    name: 'Taring Zombi Hutan',
    type: 'loot',
    category: 'zombie_drops',
    subCategory: 'monster_part',
    rarity: 'common',
    maxStack: 99,
    stackable: true,
    weight: 0.05,
    sellable: true,
    sellPrice: 18000,
    value: 18000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🦷',
    description: 'Taring runcing zombi hutan buruan bernilai jual tinggi.'
  },
  zombie_claw: {
    itemId: 'zombie_claw',
    id: 'zombie_claw',
    name: 'Cakar Mutan Beracun',
    type: 'loot',
    category: 'zombie_drops',
    subCategory: 'monster_part',
    rarity: 'uncommon',
    maxStack: 50,
    stackable: true,
    weight: 0.1,
    sellable: true,
    sellPrice: 35000,
    value: 35000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🦅',
    description: 'Cakar cadas mutan berbahaya buruan para kolektor.'
  },
  radio_battery: {
    itemId: 'radio_battery',
    id: 'radio_battery',
    name: 'Baterai Komunikasi',
    type: 'misc',
    category: 'misc',
    subCategory: 'electronic',
    rarity: 'uncommon',
    maxStack: 30,
    stackable: true,
    weight: 0.3,
    sellable: true,
    sellPrice: 22000,
    value: 22000,
    usable: false,
    equippable: false,
    droppable: true,
    icon: '🔋',
    description: 'Baterai lithium berkapasitas tinggi untuk perangkat radio darurat.'
  },
  ration_pack: {
    itemId: 'ration_pack',
    id: 'ration_pack',
    name: 'Ransum Makanan Darurat',
    type: 'misc',
    category: 'misc',
    subCategory: 'food',
    rarity: 'common',
    maxStack: 30,
    stackable: true,
    weight: 0.25,
    sellable: true,
    sellPrice: 15000,
    value: 15000,
    usable: true,
    heal: 15,
    equippable: false,
    droppable: true,
    icon: '🥫',
    description: 'Makanan kaleng berenergi tinggi pemulih 15 HP stamina.'
  },
  ammo_pistol: {
    itemId: 'ammo_pistol',
    id: 'ammo_pistol',
    name: 'Amunisi 9mm Pistol (24 btr)',
    type: 'ammo',
    category: 'ammunition',
    subCategory: 'ammo_9mm',
    rarity: 'common',
    maxStack: 999,
    stackable: true,
    weight: 0.015,
    sellable: true,
    sellPrice: 15000,
    value: 15000,
    count: 24,
    weaponId: 'pulse_pistol',
    usable: true,
    equippable: false,
    droppable: true,
    icon: '🔫',
    description: 'Satu kotak 24 butir peluru 9mm untuk Tactical Pistol.'
  },
  ammo_shotgun: {
    itemId: 'ammo_shotgun',
    id: 'ammo_shotgun',
    name: 'Amunisi 12-Gauge (12 btr)',
    type: 'ammo',
    category: 'ammunition',
    subCategory: 'ammo_12g',
    rarity: 'uncommon',
    maxStack: 999,
    stackable: true,
    weight: 0.04,
    sellable: true,
    sellPrice: 25000,
    value: 25000,
    count: 12,
    weaponId: 'scatter_blaster',
    usable: true,
    equippable: false,
    droppable: true,
    icon: '💥',
    description: 'Satu kotak 12 butir peluru buckshot untuk Scatter Shotgun.'
  },
  ammo_rifle: {
    itemId: 'ammo_rifle',
    id: 'ammo_rifle',
    name: 'Amunisi 7.62mm Rifle (30 btr)',
    type: 'ammo',
    category: 'ammunition',
    subCategory: 'ammo_762',
    rarity: 'rare',
    maxStack: 999,
    stackable: true,
    weight: 0.025,
    sellable: true,
    sellPrice: 35000,
    value: 35000,
    count: 30,
    weaponId: 'plasma_rifle',
    usable: true,
    equippable: false,
    droppable: true,
    icon: '⚡',
    description: 'Satu kotak 30 butir amunisi rifle kaliber 7.62mm.'
  },
  plasma_ammo: {
    itemId: 'plasma_ammo',
    id: 'plasma_ammo',
    name: 'Amunisi 7.62mm Rifle (30 btr)',
    type: 'ammo',
    category: 'ammunition',
    subCategory: 'ammo_762',
    rarity: 'rare',
    maxStack: 999,
    stackable: true,
    weight: 0.025,
    sellable: true,
    sellPrice: 35000,
    value: 35000,
    count: 30,
    weaponId: 'plasma_rifle',
    usable: true,
    equippable: false,
    droppable: true,
    icon: '📦',
    description: 'Satu kotak 30 butir amunisi rifle kaliber 7.62mm.'
  },
  pulse_pistol: {
    itemId: 'pulse_pistol',
    id: 'pulse_pistol',
    name: 'Tactical Pistol 9mm',
    type: 'weapon',
    category: 'weapons',
    subCategory: 'pistol',
    rarity: 'common',
    maxStack: 1,
    stackable: false,
    weight: 1.1,
    sellable: true,
    sellPrice: 50000,
    value: 50000,
    usable: false,
    equippable: true,
    equipSlot: 'secondary',
    weaponId: 'pulse_pistol',
    ammoType: 'ammo_pistol',
    droppable: true,
    icon: '🔫',
    stats: {
      damage: 35,
      headshotDamage: 70,
      fireRate: 0.22,
      magCapacity: 12,
      reloadTime: 1.3,
      noiseRadius: 22,
      range: 45,
      isAutomatic: false
    },
    description: 'Pistol semi-otomatis 9mm bawaan pemburu.'
  },
  scatter_blaster: {
    itemId: 'scatter_blaster',
    id: 'scatter_blaster',
    name: 'Scatter Shotgun 12-Gauge',
    type: 'weapon',
    category: 'weapons',
    subCategory: 'shotgun',
    rarity: 'uncommon',
    maxStack: 1,
    stackable: false,
    weight: 3.2,
    sellable: true,
    sellPrice: 250000,
    value: 250000,
    usable: false,
    equippable: true,
    equipSlot: 'primary',
    weaponId: 'scatter_blaster',
    ammoType: 'ammo_shotgun',
    droppable: true,
    icon: '💥',
    stats: {
      damage: 144,
      headshotDamage: 312,
      fireRate: 0.70,
      magCapacity: 6,
      reloadTime: 2.0,
      noiseRadius: 55,
      range: 25,
      isAutomatic: false,
      pellets: 6
    },
    description: 'Shotgun aksi pompa 12-gauge dengan sebaran mematikan.'
  },
  plasma_rifle: {
    itemId: 'plasma_rifle',
    id: 'plasma_rifle',
    name: 'Senapan Taktis 7.62mm',
    type: 'weapon',
    category: 'weapons',
    subCategory: 'rifle',
    rarity: 'rare',
    maxStack: 1,
    stackable: false,
    weight: 3.6,
    sellable: true,
    sellPrice: 500000,
    value: 500000,
    usable: false,
    equippable: true,
    equipSlot: 'primary',
    weaponId: 'plasma_rifle',
    ammoType: 'ammo_rifle',
    droppable: true,
    icon: '⚡',
    stats: {
      damage: 28,
      headshotDamage: 105,
      fireRate: 0.11,
      magCapacity: 30,
      reloadTime: 1.8,
      noiseRadius: 42,
      range: 60,
      isAutomatic: true
    },
    description: 'Senapan serbu militer otomatis berakurasi tinggi.'
  },
  machete: {
    itemId: 'machete',
    id: 'machete',
    name: 'Golok Pedesaan',
    type: 'weapon',
    category: 'weapons',
    subCategory: 'melee',
    rarity: 'common',
    maxStack: 1,
    stackable: false,
    weight: 0.9,
    sellable: true,
    sellPrice: 35000,
    value: 35000,
    usable: false,
    equippable: true,
    equipSlot: 'melee',
    weaponId: 'machete',
    ammoType: null,
    droppable: true,
    icon: '🗡️',
    stats: {
      damage: 45,
      headshotDamage: 80,
      fireRate: 0.55,
      magCapacity: 1,
      reloadTime: 0,
      noiseRadius: 0,
      range: 2.3,
      staminaCost: 1.0,
      isMelee: true
    },
    description: 'Bilah baja tempa tajam untuk tebasan senyap tanpa suara.'
  }
};

// Aliases for backward compatibility with existing tests & systems
export const ITEMS = {
  SCRAP_METAL: ITEM_DEFINITIONS.scrap_metal,
  POWER_CONVERTER: ITEM_DEFINITIONS.power_converter,
  BIO_TISSUE: ITEM_DEFINITIONS.bio_tissue,
  XENON_CORE: ITEM_DEFINITIONS.xenon_core,
  TITAN_CORE: ITEM_DEFINITIONS.titan_core,
  NANO_STIM: ITEM_DEFINITIONS.nano_stim,
  MEDKIT: ITEM_DEFINITIONS.medkit,
  BANDAGE: ITEM_DEFINITIONS.bandage,
  JAMU_KENCUR: ITEM_DEFINITIONS.jamu_kencur,
  JAMU_KUNYIT: ITEM_DEFINITIONS.jamu_kunyit,
  BAMBOO_TRAP: ITEM_DEFINITIONS.bamboo_trap,
  METAL_PARTS: ITEM_DEFINITIONS.metal_parts,
  WOOD: ITEM_DEFINITIONS.wood,
  CLOTH: ITEM_DEFINITIONS.cloth,
  ZOMBIE_TEETH: ITEM_DEFINITIONS.zombie_teeth,
  ZOMBIE_CLAW: ITEM_DEFINITIONS.zombie_claw,
  RADIO_BATTERY: ITEM_DEFINITIONS.radio_battery,
  RATION_PACK: ITEM_DEFINITIONS.ration_pack,
  AMMO_PISTOL: ITEM_DEFINITIONS.ammo_pistol,
  AMMO_SHOTGUN: ITEM_DEFINITIONS.ammo_shotgun,
  AMMO_RIFLE: ITEM_DEFINITIONS.ammo_rifle,
  PLASMA_AMMO: ITEM_DEFINITIONS.plasma_ammo,
  WEAPON_PISTOL: ITEM_DEFINITIONS.pulse_pistol,
  WEAPON_SHOTGUN: ITEM_DEFINITIONS.scatter_blaster,
  WEAPON_RIFLE: ITEM_DEFINITIONS.plasma_rifle,
  WEAPON_MACHETE: ITEM_DEFINITIONS.machete
};

export function getItemDefinition(rawIdOrItem) {
  if (!rawIdOrItem) return null;
  if (typeof rawIdOrItem === 'object') {
    if (rawIdOrItem.itemId && ITEM_DEFINITIONS[rawIdOrItem.itemId]) return ITEM_DEFINITIONS[rawIdOrItem.itemId];
    if (rawIdOrItem.id && ITEM_DEFINITIONS[rawIdOrItem.id]) return ITEM_DEFINITIONS[rawIdOrItem.id];
    return rawIdOrItem;
  }
  if (ITEM_DEFINITIONS[rawIdOrItem]) return ITEM_DEFINITIONS[rawIdOrItem];
  const found = Object.values(ITEM_DEFINITIONS).find(d => d.itemId === rawIdOrItem || d.id === rawIdOrItem);
  return found || null;
}

export function createItemInstance(rawIdOrItem, quantity = 1, customData = {}) {
  const def = getItemDefinition(rawIdOrItem);
  if (!def) return null;
  const actualId = def.itemId || def.id;

  const defaultCustom = {};
  if (def.category === 'weapons' || def.type === 'weapon') {
    defaultCustom.ammoInMag = (customData && typeof customData.ammoInMag === 'number')
      ? customData.ammoInMag
      : (def.stats ? def.stats.magCapacity : (def.magCapacity || 1));
    defaultCustom.durability = (customData && typeof customData.durability === 'number')
      ? customData.durability
      : 100;
  }

  const instId = 'inst_' + actualId + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

  return {
    instanceId: instId,
    itemId: actualId,
    quantity: Math.max(1, quantity),
    durability: (customData && typeof customData.durability === 'number') ? customData.durability : 100,
    customData: { ...defaultCustom, ...customData }
  };
}

export function wrapSlotInstance(instance, slotIndex = 0) {
  if (!instance) return null;
  const def = getItemDefinition(instance.itemId);
  return {
    slotIndex,
    instanceId: instance.instanceId,
    itemId: instance.itemId,
    quantity: instance.quantity,
    count: instance.quantity, // backward compatibility
    durability: instance.durability || 100,
    customData: instance.customData || {},
    item: def || {} // backward compatibility
  };
}

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
    // 60-SLOT UNIFIED INVENTORY & EQUIPMENT CONTAINER ARCHITECTURE (V6)
    // =========================================================================
    this.inventoryMaxSlots = 60; // 60 slot kapasitas awal
    this.inventory = [];         // Array slot inventaris terindeks (panjang <= 60)

    // Equipment Slots: Primary, Secondary, Melee, Throwable, Armor
    this.equipment = {
      primary: null,
      secondary: wrapSlotInstance(createItemInstance('pulse_pistol', 1, { ammoInMag: 12 }), -1),
      melee: wrapSlotInstance(createItemInstance('machete', 1), -1),
      throwable: null,
      armor: null
    };
    this.activeEquipSlot = 'secondary';

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
    // Clear unequipped inventory items that are not protected by secure pouch
    const secureIds = this.securePouch.map(p => p.id || p.itemId);
    if (Array.isArray(this.inventory)) {
      for (let i = 0; i < this.inventory.length; i++) {
        const slot = this.inventory[i];
        if (slot && !secureIds.includes(slot.itemId)) {
          this.inventory[i] = null;
        }
      }
    }
    this.recordPlayerDeath();
    this.saveToStorage();
    return lostItems;
  }

  // =========================================================================
  // MODUL 1: MANAJEMEN INVENTARIS 60 SLOT & STACKABLE ITEMS (V6 REBUILD)
  // =========================================================================

  normalizeItem(item) {
    if (!item) return null;
    const def = getItemDefinition(item.id || item.itemId || item);
    if (def) return { ...def };
    return {
      itemId: item.id || item.itemId || 'unknown',
      id: item.id || item.itemId || 'unknown',
      name: item.name || 'Barang Misterius',
      icon: item.icon || '📦',
      type: item.type || 'misc',
      category: item.category || 'misc',
      rarity: item.rarity || 'common',
      value: typeof item.value === 'number' ? item.value : 10000,
      sellPrice: typeof item.sellPrice === 'number' ? item.sellPrice : 10000,
      description: item.description || '',
      maxStack: item.maxStack || 99,
      stackable: item.maxStack ? item.maxStack > 1 : true,
      weight: item.weight || 0.1,
      sellable: item.sellable !== undefined ? item.sellable : true,
      usable: !!item.usable,
      equippable: !!item.equippable,
      equipSlot: item.equipSlot || null,
      droppable: item.droppable !== undefined ? item.droppable : true,
      heal: item.heal || 0,
      buffType: item.buffType || null,
      duration: item.duration || 0,
      weaponId: item.weaponId || null
    };
  }

  addItemToInventory(rawItem, count = 1, save = true) {
    if (!rawItem || count <= 0) return { success: false, countAdded: 0, remaining: count, message: 'Item tidak valid.' };
    const def = getItemDefinition(rawItem);
    if (!def) return { success: false, countAdded: 0, remaining: count, message: 'Item definition tidak ditemukan.' };

    if (!Array.isArray(this.inventory)) {
      this.inventory = [];
    }

    let remaining = count;
    const maxStack = def.maxStack || (def.stackable ? 99 : 1);

    // 1. Prioritas stack ke slot yang memiliki itemId sama dan belum mencapai maxStack
    if (def.stackable) {
      for (let i = 0; i < this.inventory.length; i++) {
        const slot = this.inventory[i];
        if (slot) {
          const slotId = slot.itemId || (slot.item ? slot.item.id : slot.id);
          const currentQty = slot.quantity || slot.count || 0;
          if (slotId === def.itemId && currentQty < maxStack) {
            const space = maxStack - currentQty;
            const take = Math.min(remaining, space);
            slot.quantity = currentQty + take;
            slot.count = slot.quantity;
            remaining -= take;
            if (remaining <= 0) break;
          }
        }
      }
    }

    // 2. Tempatkan di slot null/kosong pertama atau push jika length < inventoryMaxSlots
    while (remaining > 0) {
      const usedCount = this.getInventoryUsedSlots();
      if (usedCount >= this.inventoryMaxSlots) {
        if (save) this.saveToStorage();
        return {
          success: remaining < count,
          countAdded: count - remaining,
          remaining,
          message: `Inventaris penuh (${usedCount}/${this.inventoryMaxSlots} Slot Terpakai)!`
        };
      }

      const take = Math.min(remaining, maxStack);
      const instance = createItemInstance(def.itemId, take, rawItem.customData || {});

      // Cari lubang null di antara slot
      let targetIdx = this.inventory.findIndex(s => s === null || s === undefined);
      if (targetIdx !== -1) {
        this.inventory[targetIdx] = wrapSlotInstance(instance, targetIdx);
      } else if (this.inventory.length < this.inventoryMaxSlots) {
        targetIdx = this.inventory.length;
        this.inventory.push(wrapSlotInstance(instance, targetIdx));
      } else {
        if (save) this.saveToStorage();
        return {
          success: remaining < count,
          countAdded: count - remaining,
          remaining,
          message: `Inventaris penuh (${usedCount}/${this.inventoryMaxSlots} Slot Terpakai)!`
        };
      }
      remaining -= take;
    }

    this.recordItemCollected(count - remaining);
    if (save) this.saveToStorage();
    return {
      success: true,
      countAdded: count - remaining,
      remaining: 0,
      message: `Berhasil menyimpan ${count}x ${def.name} ke inventaris!`
    };
  }

  removeItemFromInventory(slotIndex, count = 1, save = true) {
    if (!Array.isArray(this.inventory) || slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, message: 'Slot inventaris tidak ditemukan.' };
    }
    const slot = this.inventory[slotIndex];
    if (!slot) return { success: false, message: 'Slot kosong.' };

    const take = Math.min(count, slot.quantity);
    slot.quantity -= take;
    slot.count = slot.quantity;
    const itemCopy = { ...(slot.item || getItemDefinition(slot.itemId)) };

    if (slot.quantity <= 0) {
      this.inventory[slotIndex] = null;
    }

    if (save) this.saveToStorage();
    return { success: true, item: itemCopy, countRemoved: take };
  }

  splitStack(slotIndex, count) {
    if (!Array.isArray(this.inventory) || slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, message: 'Slot tidak valid.' };
    }
    const slot = this.inventory[slotIndex];
    if (!slot || slot.quantity <= 1) {
      return { success: false, message: 'Item tidak dapat dibagi (jumlah <= 1).' };
    }
    if (count <= 0 || count >= slot.quantity) {
      return { success: false, message: `Jumlah pembagian tidak valid (1 s/d ${slot.quantity - 1}).` };
    }

    let emptyIdx = this.inventory.findIndex(s => s === null || s === undefined);
    if (emptyIdx === -1) {
      if (this.inventory.length < this.inventoryMaxSlots) {
        emptyIdx = this.inventory.length;
      } else {
        return { success: false, message: 'Tidak ada slot kosong untuk membagi tumpukan!' };
      }
    }

    slot.quantity -= count;
    slot.count = slot.quantity;

    const newInstance = createItemInstance(slot.itemId || (slot.item ? slot.item.id : slot.id), count, slot.customData);
    const wrapped = wrapSlotInstance(newInstance, emptyIdx);
    if (emptyIdx < this.inventory.length) {
      this.inventory[emptyIdx] = wrapped;
    } else {
      this.inventory.push(wrapped);
    }

    this.saveToStorage();
    return {
      success: true,
      fromSlot: slotIndex,
      toSlot: emptyIdx,
      count,
      message: `Berhasil membagi ${count}x item ke slot #${emptyIdx + 1}.`
    };
  }

  mergeSlots(fromSlotIndex, toSlotIndex) {
    if (fromSlotIndex === toSlotIndex) return { success: false, message: 'Slot sama.' };
    if (!Array.isArray(this.inventory)) return { success: false, message: 'Inventaris tidak valid.' };
    if (fromSlotIndex < 0 || fromSlotIndex >= this.inventory.length || toSlotIndex < 0 || toSlotIndex >= this.inventory.length) {
      return { success: false, message: 'Indeks slot di luar batas.' };
    }

    const fromSlot = this.inventory[fromSlotIndex];
    if (!fromSlot) return { success: false, message: 'Slot asal kosong.' };

    const toSlot = this.inventory[toSlotIndex];

    // Case 1: Target slot is empty -> Move
    if (!toSlot) {
      this.inventory[toSlotIndex] = fromSlot;
      this.inventory[toSlotIndex].slotIndex = toSlotIndex;
      this.inventory[fromSlotIndex] = null;
      this.saveToStorage();
      return { success: true, action: 'moved' };
    }

    // Case 2: Target slot has same item and is stackable -> Merge
    const def = getItemDefinition(fromSlot.itemId);
    if (fromSlot.itemId === toSlot.itemId && def && def.stackable) {
      const space = (def.maxStack || 99) - toSlot.quantity;
      if (space > 0) {
        const take = Math.min(fromSlot.quantity, space);
        toSlot.quantity += take;
        toSlot.count = toSlot.quantity;
        fromSlot.quantity -= take;
        fromSlot.count = fromSlot.quantity;
        if (fromSlot.quantity <= 0) {
          this.inventory[fromSlotIndex] = null;
        }
        this.saveToStorage();
        return { success: true, action: 'merged', transferred: take };
      }
    }

    // Case 3: Different item or stack full -> Swap
    const temp = this.inventory[fromSlotIndex];
    this.inventory[fromSlotIndex] = this.inventory[toSlotIndex];
    this.inventory[toSlotIndex] = temp;
    this.inventory[fromSlotIndex].slotIndex = fromSlotIndex;
    this.inventory[toSlotIndex].slotIndex = toSlotIndex;
    this.saveToStorage();
    return { success: true, action: 'swapped' };
  }

  moveItem(fromSlotIndex, toSlotIndex) {
    return this.mergeSlots(fromSlotIndex, toSlotIndex);
  }

  dropItem(slotIndex, count = 1, playerPosition = null, lootManager = null) {
    if (!Array.isArray(this.inventory) || slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, message: 'Slot tidak valid.' };
    }
    const slot = this.inventory[slotIndex];
    if (!slot) return { success: false, message: 'Slot kosong.' };

    const take = Math.min(count, slot.quantity);
    const def = getItemDefinition(slot.itemId);

    if (lootManager && playerPosition) {
      lootManager.spawnSpecificDrop(playerPosition, {
        id: slot.itemId,
        itemId: slot.itemId,
        ...def,
        count: take,
        quantity: take,
        customData: slot.customData
      });
    }

    this.removeItemFromInventory(slotIndex, take, true);
    return {
      success: true,
      countRemoved: take,
      droppedCount: take,
      item: def,
      message: `Membuang ${take}x ${def ? def.name : 'item'} ke dunia.`
    };
  }

  dropItemFromInventory(slotIndex, count = 1) {
    return this.dropItem(slotIndex, count);
  }

  useItemFromInventory(slotIndex, player = null) {
    if (!Array.isArray(this.inventory)) return { success: false, message: 'Inventaris kosong.' };
    if (slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, message: 'Slot tidak valid.' };
    }
    const slot = this.inventory[slotIndex];
    if (!slot) return { success: false, message: 'Slot kosong.' };
    const item = slot.item || getItemDefinition(slot.itemId);

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

    // C. Kategori Senjata (Equip to active slot)
    if (item.category === 'weapons' || item.type === 'weapon') {
      const equipRes = this.equipItem(slotIndex);
      if (equipRes.success && player && player.weapons && item.weaponId) {
        player.weapons.switchWeapon(item.weaponId);
      }
      return equipRes;
    }

    // D. Ranjau Bambu
    if (item.id === 'bamboo_trap' || item.itemId === 'bamboo_trap') {
      if (player && typeof player.deployBambooTrap === 'function') {
        player.deployBambooTrap();
        this.removeItemFromInventory(slotIndex, 1, true);
        return { success: true, message: 'Ranjau Paku Bambu berhasil dipasang di tanah!' };
      }
    }

    return { success: false, message: 'Barang ini tidak dapat digunakan secara langsung.' };
  }

  // =========================================================================
  // MODUL EQUIPMENT CONTAINER & SLOT MANAGEMENT
  // =========================================================================

  equipItem(slotIndex, targetSlot = null) {
    if (!Array.isArray(this.inventory) || slotIndex < 0 || slotIndex >= this.inventory.length || !this.inventory[slotIndex]) {
      return { success: false, message: 'Slot inventaris tidak valid atau kosong.' };
    }
    const slotData = this.inventory[slotIndex];
    const def = getItemDefinition(slotData.itemId);
    if (!def || !def.equippable) {
      return { success: false, message: 'Barang ini bukan perlengkapan yang bisa dipasang.' };
    }

    let slotToUse = targetSlot || def.equipSlot;
    if (!slotToUse) {
      if (def.category === 'weapons') {
        if (def.subCategory === 'melee') slotToUse = 'melee';
        else if (def.subCategory === 'pistol') slotToUse = 'secondary';
        else slotToUse = 'primary';
      } else if (def.type === 'trap') {
        slotToUse = 'throwable';
      }
    }

    if (!['primary', 'secondary', 'melee', 'throwable', 'armor'].includes(slotToUse)) {
      return { success: false, message: 'Slot perlengkapan tidak valid.' };
    }

    if (slotToUse === 'melee' && def.subCategory !== 'melee') {
      return { success: false, message: 'Slot Melee hanya untuk senjata jarak dekat.' };
    }
    if (slotToUse === 'throwable' && def.equipSlot !== 'throwable' && def.type !== 'trap') {
      return { success: false, message: 'Slot Throwable hanya untuk jebakan / lemparan.' };
    }

    const oldEquipped = this.equipment[slotToUse];
    const newEquipped = {
      instanceId: slotData.instanceId,
      itemId: slotData.itemId,
      quantity: 1,
      durability: slotData.durability || 100,
      customData: { ...(slotData.customData || {}) }
    };

    if (slotData.quantity > 1) {
      slotData.quantity -= 1;
      slotData.count = slotData.quantity;
      if (oldEquipped) {
        const emptyIdx = this.inventory.findIndex(s => s === null);
        if (emptyIdx === -1) {
          return { success: false, message: 'Inventaris penuh, tidak dapat menukar perlengkapan.' };
        }
        this.inventory[emptyIdx] = wrapSlotInstance(oldEquipped, emptyIdx);
      }
    } else {
      if (oldEquipped) {
        this.inventory[slotIndex] = wrapSlotInstance(oldEquipped, slotIndex);
      } else {
        this.inventory[slotIndex] = null;
      }
    }

    this.equipment[slotToUse] = wrapSlotInstance(newEquipped, -1);
    if (def.weaponId && !this.ownedWeapons.includes(def.weaponId)) {
      this.ownedWeapons.push(def.weaponId);
    }

    this.saveToStorage();
    return {
      success: true,
      slot: slotToUse,
      equipped: this.equipment[slotToUse],
      unequipped: oldEquipped,
      message: `Berhasil memasang ${def.name} di slot ${slotToUse.toUpperCase()}!`
    };
  }

  unequipItem(equipSlot) {
    if (!['primary', 'secondary', 'melee', 'throwable', 'armor'].includes(equipSlot)) {
      return { success: false, message: 'Slot tidak valid.' };
    }
    const equipped = this.equipment[equipSlot];
    if (!equipped) {
      return { success: false, message: 'Slot perlengkapan kosong.' };
    }

    const emptyIdx = this.inventory.findIndex(s => s === null);
    if (emptyIdx === -1) {
      return { success: false, message: 'Inventaris penuh! Kosongkan slot sebelum melepas perlengkapan.' };
    }

    this.inventory[emptyIdx] = wrapSlotInstance(equipped, emptyIdx);
    this.equipment[equipSlot] = null;

    if (this.activeEquipSlot === equipSlot) {
      if (this.equipment.secondary) this.activeEquipSlot = 'secondary';
      else if (this.equipment.melee) this.activeEquipSlot = 'melee';
      else if (this.equipment.primary) this.activeEquipSlot = 'primary';
      else this.activeEquipSlot = null;
    }

    this.saveToStorage();
    return {
      success: true,
      unequipped: equipped,
      message: `Berhasil melepas ${equipped.item ? equipped.item.name : 'perlengkapan'} ke inventaris.`
    };
  }

  getEquippedItem(slotName) {
    return this.equipment ? this.equipment[slotName] : null;
  }

  getActiveEquippedWeapon() {
    if (!this.equipment || !this.activeEquipSlot) return null;
    return this.equipment[this.activeEquipSlot];
  }

  getInventoryUsedSlots() {
    if (!Array.isArray(this.inventory)) return 0;
    return this.inventory.filter(s => s !== null && s !== undefined).length;
  }

  getInventoryCapacity() {
    return this.inventoryMaxSlots || 60;
  }

  getInventoryFreeSlots() {
    return Math.max(0, this.getInventoryCapacity() - this.getInventoryUsedSlots());
  }

  getInventoryItems(category = 'all', searchQuery = '', sortBy = 'name_asc') {
    if (!Array.isArray(this.inventory)) return [];
    let items = [];
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      if (slot !== null && slot !== undefined) {
        items.push({ ...slot, originalSlot: i, slotIndex: i });
      }
    }

    if (category && category !== 'all') {
      items = items.filter(s => {
        const itm = s.item || getItemDefinition(s.itemId);
        if (!itm) return false;
        if (category === 'consumables') return itm.category === 'medical' || itm.usable;
        if (category === 'loot') return itm.category === 'zombie_drops' || itm.type === 'loot';
        return itm.category === category || itm.type === category;
      });
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(s => {
        const itm = s.item || getItemDefinition(s.itemId);
        return itm && (
          (itm.name && itm.name.toLowerCase().includes(q)) ||
          (itm.description && itm.description.toLowerCase().includes(q))
        );
      });
    }

    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    items.sort((a, b) => {
      const itmA = a.item || getItemDefinition(a.itemId) || {};
      const itmB = b.item || getItemDefinition(b.itemId) || {};
      if (sortBy === 'name' || sortBy === 'name_asc') return (itmA.name || '').localeCompare(itmB.name || '');
      if (sortBy === 'name_desc') return (itmB.name || '').localeCompare(itmA.name || '');
      if (sortBy === 'count' || sortBy === 'qty_desc') return (b.quantity || b.count || 0) - (a.quantity || a.count || 0);
      if (sortBy === 'qty_asc') return (a.quantity || a.count || 0) - (b.quantity || b.count || 0);
      if (sortBy === 'price' || sortBy === 'price_desc' || sortBy === 'value_desc') return (itmB.value || itmB.sellPrice || 0) - (itmA.value || itmA.sellPrice || 0);
      if (sortBy === 'price_asc' || sortBy === 'value_asc') return (itmA.value || itmA.sellPrice || 0) - (itmB.value || itmB.sellPrice || 0);
      if (sortBy === 'rarity' || sortBy === 'rarity_desc') return (rarityOrder[itmB.rarity] || 0) - (rarityOrder[itmA.rarity] || 0);
      if (sortBy === 'weight_desc') return (itmB.weight || 0) - (itmA.weight || 0);
      if (sortBy === 'weight_asc') return (itmA.weight || 0) - (itmB.weight || 0);
      return a.slotIndex - b.slotIndex;
    });

    return items;
  }

  // =========================================================================
  // MODUL STORAGE / WAREHOUSE (PETI STASH SAFEHOUSE DESA)
  // =========================================================================

  depositToStash(invSlotIndex, count = null) {
    if (!Array.isArray(this.inventory) || invSlotIndex < 0 || invSlotIndex >= this.inventory.length || !this.inventory[invSlotIndex]) {
      return { success: false, message: 'Slot inventaris tidak valid.' };
    }
    const slot = this.inventory[invSlotIndex];
    const def = getItemDefinition(slot.itemId);
    const take = Math.min(count || slot.quantity, slot.quantity);

    if (!Array.isArray(this.stash)) this.stash = [];

    if (def && def.stackable) {
      for (const stSlot of this.stash) {
        if (stSlot && stSlot.itemId === slot.itemId && (stSlot.quantity || stSlot.count) < (def.maxStack || 99)) {
          const space = (def.maxStack || 99) - (stSlot.quantity || stSlot.count);
          const add = Math.min(take, space);
          stSlot.quantity = (stSlot.quantity || stSlot.count) + add;
          stSlot.count = stSlot.quantity;
          this.removeItemFromInventory(invSlotIndex, add, false);
          this.saveToStorage();
          return { success: true, count: add, message: `Menyimpan ${add}x ${def.name} ke Stash.` };
        }
      }
    }

    if (this.stash.length >= this.stashMaxSlots) {
      return { success: false, message: 'Peti Stash sudah penuh!' };
    }

    this.removeItemFromInventory(invSlotIndex, take, false);
    const newInst = createItemInstance(slot.itemId, take, slot.customData);
    this.stash.push(wrapSlotInstance(newInst, this.stash.length));
    this.saveToStorage();
    return { success: true, count: take, message: `Menyimpan ${take}x ${def.name} ke Stash.` };
  }

  withdrawFromStash(stashIndex, count = null) {
    if (!Array.isArray(this.stash) || stashIndex < 0 || stashIndex >= this.stash.length || !this.stash[stashIndex]) {
      return { success: false, message: 'Slot Stash tidak valid.' };
    }
    const stSlot = this.stash[stashIndex];
    const def = getItemDefinition(stSlot.itemId || stSlot.id);
    const take = Math.min(count || stSlot.quantity || stSlot.count || 1, stSlot.quantity || stSlot.count || 1);

    const addRes = this.addItemToInventory(stSlot.itemId || stSlot.id, take, false);
    if (!addRes.success || addRes.countAdded === 0) {
      return { success: false, message: 'Inventaris penuh!' };
    }

    const currentQty = (stSlot.quantity || stSlot.count || 1) - addRes.countAdded;
    stSlot.quantity = currentQty;
    stSlot.count = currentQty;
    if (stSlot.quantity <= 0) {
      this.stash.splice(stashIndex, 1);
    }
    this.saveToStorage();
    return { success: true, count: addRes.countAdded, message: `Mengambil ${addRes.countAdded}x ${def.name} dari Stash.` };
  }

  depositAllToStash() {
    let depositedCount = 0;
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i]) {
        const res = this.depositToStash(i, this.inventory[i].quantity);
        if (res.success) depositedCount++;
        else break;
      }
    }
    return { success: depositedCount > 0, count: depositedCount };
  }

  withdrawAllFromStash() {
    let withdrawnCount = 0;
    while (this.stash.length > 0) {
      const res = this.withdrawFromStash(0, this.stash[0].quantity || this.stash[0].count);
      if (res.success) withdrawnCount++;
      else break;
    }
    return { success: withdrawnCount > 0, count: withdrawnCount };
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
  // PERSISTENSI PENYIMPANAN BROWSER & DATA MIGRATION ENGINE (V6 UNIFIED)
  // =========================================================================
  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        version: 6,
        saveVersion: 6,
        wallet: this.wallet,
        backpack: this.backpack,
        stash: Array.isArray(this.stash) ? this.stash.map((s, idx) => s ? {
          slotIndex: idx,
          instanceId: s.instanceId,
          itemId: s.itemId,
          quantity: s.quantity || s.count || 1,
          durability: s.durability || 100,
          customData: s.customData || {}
        } : null) : [],
        securePouch: this.securePouch,
        bounties: this.bounties,
        backpackTier: this.backpackTier,
        backpackMaxSlots: this.backpackMaxSlots,
        houseLevel: this.houseLevel,
        stashMaxSlots: this.stashMaxSlots,
        ownedWeapons: this.ownedWeapons,
        playerShopStall: this.playerShopStall,
        playerShopRegister: this.playerShopRegister,

        // Data Inventaris 60 Slot & Equipment Container
        inventory: Array.isArray(this.inventory) ? this.inventory.map((slot, idx) => slot ? {
          slotIndex: idx,
          instanceId: slot.instanceId,
          itemId: slot.itemId,
          quantity: slot.quantity || slot.count || 1,
          durability: slot.durability || 100,
          customData: slot.customData || {}
        } : null) : [],
        inventoryMaxSlots: this.inventoryMaxSlots,
        equipment: {
          primary: this.equipment && this.equipment.primary ? {
            instanceId: this.equipment.primary.instanceId,
            itemId: this.equipment.primary.itemId,
            quantity: this.equipment.primary.quantity || 1,
            durability: this.equipment.primary.durability || 100,
            customData: this.equipment.primary.customData || {}
          } : null,
          secondary: this.equipment && this.equipment.secondary ? {
            instanceId: this.equipment.secondary.instanceId,
            itemId: this.equipment.secondary.itemId,
            quantity: this.equipment.secondary.quantity || 1,
            durability: this.equipment.secondary.durability || 100,
            customData: this.equipment.secondary.customData || {}
          } : null,
          melee: this.equipment && this.equipment.melee ? {
            instanceId: this.equipment.melee.instanceId,
            itemId: this.equipment.melee.itemId,
            quantity: this.equipment.melee.quantity || 1,
            durability: this.equipment.melee.durability || 100,
            customData: this.equipment.melee.customData || {}
          } : null,
          throwable: this.equipment && this.equipment.throwable ? {
            instanceId: this.equipment.throwable.instanceId,
            itemId: this.equipment.throwable.itemId,
            quantity: this.equipment.throwable.quantity || 1,
            durability: this.equipment.throwable.durability || 100,
            customData: this.equipment.throwable.customData || {}
          } : null,
          armor: this.equipment && this.equipment.armor ? {
            instanceId: this.equipment.armor.instanceId,
            itemId: this.equipment.armor.itemId,
            quantity: this.equipment.armor.quantity || 1,
            durability: this.equipment.armor.durability || 100,
            customData: this.equipment.armor.customData || {}
          } : null
        },
        activeEquipSlot: this.activeEquipSlot,

        // Marketplace, Profil & Statistik
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

        // Inisialisasi Stash Container
        if (Array.isArray(data.stash)) {
          this.stash = data.stash.map((s, idx) => {
            if (!s) return null;
            const inst = createItemInstance(s.itemId || s.id, s.quantity || s.count || 1, s.customData);
            return wrapSlotInstance(inst, idx);
          }).filter(Boolean);
        }

        // Inisialisasi & Migrasi 60-Slot Inventaris
        if (typeof data.inventoryMaxSlots === 'number') this.inventoryMaxSlots = data.inventoryMaxSlots;
        this.inventory = [];

        if (Array.isArray(data.inventory) && data.inventory.length > 0) {
          data.inventory.forEach((s, idx) => {
            if (s && this.inventory.length < this.inventoryMaxSlots) {
              const itemId = s.itemId || (s.item ? s.item.id : s.id);
              if (itemId) {
                const inst = createItemInstance(itemId, s.quantity || s.count || 1, s.customData);
                this.inventory.push(wrapSlotInstance(inst, this.inventory.length));
              }
            }
          });
        } else if (Array.isArray(data.backpack) && data.backpack.length > 0) {
          data.backpack.forEach(itm => this.addItemToInventory(itm, itm.count || itm.quantity || 1, false));
        }

        // Inisialisasi & Pemulihan Equipment Slots
        if (data.equipment && typeof data.equipment === 'object') {
          ['primary', 'secondary', 'melee', 'throwable', 'armor'].forEach(slot => {
            if (data.equipment[slot]) {
              const eq = data.equipment[slot];
              const inst = createItemInstance(eq.itemId || eq.id, eq.quantity || eq.count || 1, eq.customData);
              this.equipment[slot] = wrapSlotInstance(inst, -1);
            } else {
              this.equipment[slot] = null;
            }
          });
        } else {
          // Default loadout jika data baru / migrasi V1-V5
          this.equipment.secondary = wrapSlotInstance(createItemInstance('pulse_pistol', 1, { ammoInMag: 12 }), -1);
          this.equipment.melee = wrapSlotInstance(createItemInstance('machete', 1), -1);
          if (this.ownedWeapons.includes('plasma_rifle')) {
            this.equipment.primary = wrapSlotInstance(createItemInstance('plasma_rifle', 1, { ammoInMag: 30 }), -1);
          } else if (this.ownedWeapons.includes('scatter_blaster')) {
            this.equipment.primary = wrapSlotInstance(createItemInstance('scatter_blaster', 1, { ammoInMag: 6 }), -1);
          }
        }
        if (data.activeEquipSlot) this.activeEquipSlot = data.activeEquipSlot;

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

