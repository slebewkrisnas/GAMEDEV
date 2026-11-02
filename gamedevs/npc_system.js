import * as THREE from 'three';

/* ============================================================
   SISTEM NPC AKTIF TIGA WILAYAH (WORLD GAME)
   1. PERKEBUNAN — 2 Petani (Penyiram & Pencangkul)
   2. KAMP TENTARA — 2 Tentara (Latihan Menembak & Membidik)
   3. ARENA BAKALAE — 2 Petarung (1 vs 1 Melee Combat & Knockdown)
   ============================================================ */

export const NPC_DATA = {
  farmer1: {
    name: 'Pak Joko',
    role: 'Petani Penyiram',
    avatar: '👨‍🌾',
    dialogues: [
      'Halo penjelajah! Buah apel, jeruk, dan lemon di kebun ini siap dipanen.',
      'Kalau kamu suka teka-teki santai dan kombo buah manis, masuki portal biru di sana menuju game Fruit Block Blast!',
      'Tanaman di sini tumbuh subur karena tanahnya selalu kita siram tiap pagi.'
    ]
  },
  farmer2: {
    name: 'Mang Asep',
    role: 'Petani Pencangkul',
    avatar: '🌾',
    dialogues: [
      'Hoo... membajak tanah butuh tenaga ekstra! Tapi hasilnya bikin puas saat panen raya tiba.',
      'Hati-hati kalau kamu jalan ke timur. Di sana ada Kamp Tentara yang menjaga perbatasan dari serangan zombie!',
      'Kalau capek jalan-jalan, nikmati saja pemandangan kebun dan kupu-kupu yang beterbangan.'
    ]
  },
  soldier1: {
    name: 'Sersan Baja',
    role: 'Instruktur Menembak',
    avatar: '🎖️',
    dialogues: [
      'Siap gerak! Kamp militer ini adalah garis pertahanan terakhir sebelum zona terlarang.',
      'Portal hijau di belakangku mengarah ke Dead Zone! Di sana zombie menyerang dalam 3 gelombang ganas.',
      'Tips dari saya: Selalu bidik bagian kepala zombie untuk menghasilkan damage tembakan kritis!'
    ]
  },
  soldier2: {
    name: 'Kapten Ray',
    role: 'Penembak Taktis',
    avatar: '🪖',
    dialogues: [
      'Disiplin adalah segalanya! Jangan panik saat peluru pistol 9mm milikmu habis di tengah pertempuran.',
      'Cari ruang gerak aman, lalu segera reload senjatamu sebelum gerombolan zombie mendekat.',
      'Pastikan staminamu fit sebelum melangkah menembus portal Dead Zone!'
    ]
  },
  fighter1: {
    name: 'Kenji',
    role: 'Petarung Tinju Merah',
    avatar: '🥊',
    dialogues: [
      'Hiaaat! Kecepatan pukulan dan refleks menghindar adalah penentu kemenangan dalam duel!',
      'Di Battle Arena Zero, lawanmu adalah robot tempur Vorax. Gunakan Dodge dan Block saat dia menyerang!',
      'Jangan menyerang membabi buta, atur ritme dan tunggu celah saat musuh lengah!'
    ]
  },
  fighter2: {
    name: 'Riku',
    role: 'Petarung Tendangan Biru',
    avatar: '🥋',
    dialogues: [
      'Latihan tanding di ring ini menempa ketahanan fisik dan mental!',
      'Saat bilah energimu penuh, lepaskan jurus pamungkas Skill untuk membalikkan keadaan dalam sekejap!',
      'Waktu duel hanya 90 detik di Arena Zero, manfaatkan tiap detik dengan serangan beruntun!'
    ]
  }
};

// Fungsi Dialog Reaktif Dinamis (Mengecek Kemenangan / Trofi Pemain)
function getNPCDialogues(meta) {
  let list = [...meta.dialogues];
  try {
    const hasFruit = localStorage.getItem('gamedev_meta_fruit_cleared') === '1' || parseInt(localStorage.getItem('gamedev_meta_fruit_score') || 0) >= 200;
    const hasDeadZone = localStorage.getItem('gamedev_meta_deadzone_cleared') === '1';
    const hasArena = localStorage.getItem('gamedev_meta_arena_champion') === '1';

    if (meta.name === 'Pak Joko' && hasFruit) {
      list.unshift('🍎 Luar biasa penjelajah! Kamu berhasil memanen banyak buah di Fruit Block Blast! Piala Kebun bersinar megah di Plaza!');
    } else if (meta.name === 'Mang Asep' && hasFruit) {
      list.unshift('Wah, panen rayamu sukses besar di Kebun Buah! Tanah ini subur berkat kerja kerasmu!');
    } else if (meta.name === 'Sersan Baja' && hasDeadZone) {
      list.unshift('🎖️ Hormat senjata! Kamu berhasil membabat 3 gelombang zombie di Dead Zone! Lencana Penyintas kini terpajang gagah di Plaza!');
    } else if (meta.name === 'Kapten Ray' && hasDeadZone) {
      list.unshift('Akurasi dan ketenanganmu saat reload sangat disiplin, prajurit! Dead Zone sekarang aman terkendali!');
    } else if (meta.name === 'Kenji' && hasArena) {
      list.unshift('🥊 Hebaaat! Kamu benar-benar menumbangkan robot tempur Vorax! Sabuk Juara Arena Zero layak jadi milikmu di Plaza!');
    } else if (meta.name === 'Riku' && hasArena) {
      list.unshift('Refleks menghindar dan tendanganmu sangat tajam! Vorax tidak berkutik melawannmu di Arena!');
    }
  } catch (e) {}
  return list;
}

// Audio SFX Synthesizer untuk Aksi NPC
let npcAudioCtx = null;
function getAudioCtx() {
  if (!npcAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
    npcAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return npcAudioCtx;
}

function playNPCSound(type, pos, playerPos) {
  try {
    const ctx = getAudioCtx();
    if (!ctx || ctx.state === 'suspended') return;
    
    // Hitung jarak ke pemain untuk volume spatial
    let dist = 15;
    if (playerPos) {
      const dx = pos.x - playerPos.x;
      const dz = pos.z - playerPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);
    }
    if (dist > 45) return; // Terlalu jauh, tidak usah dimainkan

    const maxDist = 40;
    const volumeFactor = Math.max(0.01, 1 - dist / maxDist);
    const now = ctx.currentTime;

    if (type === 'gunshot') {
      // Tembakan senapan: noise burst + low thump
      const bufSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 * volumeFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'punch') {
      // Pukulan tinju: thud tebal
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.3 * volumeFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'water') {
      // Suara siram air: gemercik halus
      const bufSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(1.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08 * volumeFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    }
  } catch (e) {}
}

// ==================== PALET MATERIAL NPC ====================
const NPC_MATS = {
  skinFarmer1:  new THREE.MeshStandardMaterial({ color: 0xe0b694, roughness: 0.65 }),
  skinFarmer2:  new THREE.MeshStandardMaterial({ color: 0xd9aa82, roughness: 0.68 }),
  skinSoldier1: new THREE.MeshStandardMaterial({ color: 0xe8c4a4, roughness: 0.6 }),
  skinSoldier2: new THREE.MeshStandardMaterial({ color: 0xd4a580, roughness: 0.62 }),
  skinFighter1: new THREE.MeshStandardMaterial({ color: 0xebc19e, roughness: 0.55 }),
  skinFighter2: new THREE.MeshStandardMaterial({ color: 0xdba784, roughness: 0.55 }),

  // Mata & Rambut
  eyeWhite: new THREE.MeshStandardMaterial({ color: 0xf5f5fa, roughness: 0.2 }),
  eyeDark:  new THREE.MeshBasicMaterial({ color: 0x111111 }),
  hairDark: new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.75 }),
  hairBrown:new THREE.MeshStandardMaterial({ color: 0x362419, roughness: 0.72 }),
  hairGray: new THREE.MeshStandardMaterial({ color: 0x6e6e6e, roughness: 0.8 }),

  // Petani
  strawHat: new THREE.MeshStandardMaterial({ color: 0xd9b362, roughness: 0.85 }),
  farmerCloth1: new THREE.MeshStandardMaterial({ color: 0x2e5b88, roughness: 0.8 }), // denim biru
  farmerShirt1: new THREE.MeshStandardMaterial({ color: 0x487a4c, roughness: 0.85 }), // kemeja hijau
  farmerCloth2: new THREE.MeshStandardMaterial({ color: 0x5a422e, roughness: 0.85 }), // celana cokelat
  farmerVest2:  new THREE.MeshStandardMaterial({ color: 0x8a623a, roughness: 0.8 }), // rompi tani
  boots:        new THREE.MeshStandardMaterial({ color: 0x2d1e12, roughness: 0.6 }),
  hoeWood:      new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }),
  hoeIron:      new THREE.MeshStandardMaterial({ color: 0x777782, metalness: 0.85, roughness: 0.35 }),
  waterCan:     new THREE.MeshStandardMaterial({ color: 0x487d72, metalness: 0.6, roughness: 0.4 }),
  waterDrop:    new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.8 }),

  // Tentara
  soldierCamo1: new THREE.MeshStandardMaterial({ color: 0x38452e, roughness: 0.82 }), // camo hijau
  soldierVest1: new THREE.MeshStandardMaterial({ color: 0x242e1d, roughness: 0.75 }),
  soldierHelmet:new THREE.MeshStandardMaterial({ color: 0x2d3a24, roughness: 0.7 }),
  soldierCamo2: new THREE.MeshStandardMaterial({ color: 0x4c503b, roughness: 0.82 }), // camo khaki
  soldierBeret: new THREE.MeshStandardMaterial({ color: 0x6a1c1c, roughness: 0.85 }), // baret merah
  rifleBody:    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 }),
  rifleGrip:    new THREE.MeshStandardMaterial({ color: 0x2e2418, roughness: 0.7 }),
  flashMat:     new THREE.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.9 }),
  laserBeam:    new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.85 }),

  // Petarung
  fightShortsRed:  new THREE.MeshStandardMaterial({ color: 0xb81818, roughness: 0.7 }),
  fightShortsBlue: new THREE.MeshStandardMaterial({ color: 0x1d4a9e, roughness: 0.7 }),
  wrapRed:         new THREE.MeshStandardMaterial({ color: 0xd92626, roughness: 0.75 }),
  wrapBlue:        new THREE.MeshStandardMaterial({ color: 0x2962d9, roughness: 0.75 }),
  hitSparkMat:     new THREE.MeshBasicMaterial({ color: 0xffe666, transparent: true, opacity: 0.95 })
};

// ==================== GENERATOR MODEL KARAKTER NPC ====================
function createNPCModel(type) {
  const root = new THREE.Group();
  root.scale.set(1.22, 1.22, 1.22); // Skala proporsional 1.22x

  let skinMat = NPC_MATS.skinFarmer1;
  let hairMat = NPC_MATS.hairDark;

  if (type === 'farmer1') { skinMat = NPC_MATS.skinFarmer1; hairMat = NPC_MATS.hairGray; }
  else if (type === 'farmer2') { skinMat = NPC_MATS.skinFarmer2; hairMat = NPC_MATS.hairBrown; }
  else if (type === 'soldier1') { skinMat = NPC_MATS.skinSoldier1; hairMat = NPC_MATS.hairDark; }
  else if (type === 'soldier2') { skinMat = NPC_MATS.skinSoldier2; hairMat = NPC_MATS.hairDark; }
  else if (type === 'fighter1') { skinMat = NPC_MATS.skinFighter1; hairMat = NPC_MATS.hairDark; }
  else if (type === 'fighter2') { skinMat = NPC_MATS.skinFighter2; hairMat = NPC_MATS.hairBrown; }

  // 1. KEPALA & WAJAH
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.54, 0);
  root.add(headGroup);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 18), skinMat);
  skull.scale.set(0.92, 1.12, 1.05);
  skull.position.set(0, 0.07, 0);
  skull.castShadow = true;
  headGroup.add(skull);

  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.058, 0.12, 14), skinMat);
  jaw.position.set(0, -0.015, 0.025);
  jaw.scale.set(1.0, 1.0, 0.88);
  headGroup.add(jaw);

  // Mata
  [-1, 1].forEach(side => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), NPC_MATS.eyeWhite);
    eye.scale.set(1.1, 0.7, 0.5);
    eye.position.set(side * 0.038, 0.045, 0.086);
    headGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), NPC_MATS.eyeDark);
    pupil.position.set(side * 0.038, 0.045, 0.093);
    headGroup.add(pupil);
  });

  // Hidung & Mulut
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 6), skinMat);
  nose.position.set(0, 0.01, 0.105);
  nose.rotation.x = Math.PI / 2;
  headGroup.add(nose);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.01), skinMat);
  mouth.position.set(0, -0.035, 0.088);
  headGroup.add(mouth);

  // Telinga
  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), skinMat);
    ear.position.set(side * 0.105, 0.025, -0.005);
    ear.scale.set(0.35, 1.15, 0.8);
    headGroup.add(ear);
  });

  // Aksesoris Kepala Spesifik
  if (type === 'farmer1' || type === 'farmer2') {
    // Topi Jerami Petani
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.14, 0.01);
    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.16, 16), NPC_MATS.strawHat);
    hatGroup.add(hatCone);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 20), NPC_MATS.strawHat);
    hatBrim.position.y = -0.06;
    hatGroup.add(hatBrim);
    headGroup.add(hatGroup);
  } else if (type === 'soldier1') {
    // Helm Taktis Tentara
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 18), NPC_MATS.soldierHelmet);
    helmet.position.set(0, 0.09, -0.005);
    helmet.scale.set(0.96, 1.05, 1.05);
    headGroup.add(helmet);
  } else if (type === 'soldier2') {
    // Baret Militer
    const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16), NPC_MATS.soldierBeret);
    beret.position.set(0.02, 0.14, -0.01);
    beret.rotation.z = -0.25;
    headGroup.add(beret);
  } else {
    // Rambut Petarung
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 16), hairMat);
    hair.position.set(0, 0.09, -0.01);
    headGroup.add(hair);
  }

  // Leher
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.11, 14), skinMat);
  neck.position.set(0, 1.48, -0.005);
  neck.castShadow = true;
  root.add(neck);

  // 2. BADAN / TORSO
  const torsoGroup = new THREE.Group();
  root.add(torsoGroup);

  let torsoTopMat = NPC_MATS.farmerShirt1;
  let torsoBotMat = NPC_MATS.farmerCloth1;
  let legMat = NPC_MATS.farmerCloth1;

  if (type === 'farmer2') {
    torsoTopMat = NPC_MATS.farmerVest2;
    torsoBotMat = NPC_MATS.farmerCloth2;
    legMat = NPC_MATS.farmerCloth2;
  } else if (type === 'soldier1') {
    torsoTopMat = NPC_MATS.soldierVest1;
    torsoBotMat = NPC_MATS.soldierCamo1;
    legMat = NPC_MATS.soldierCamo1;
  } else if (type === 'soldier2') {
    torsoTopMat = NPC_MATS.soldierCamo2;
    torsoBotMat = NPC_MATS.soldierCamo2;
    legMat = NPC_MATS.soldierCamo2;
  } else if (type === 'fighter1') {
    torsoTopMat = skinMat; // Telanjang dada petarung
    torsoBotMat = NPC_MATS.fightShortsRed;
    legMat = skinMat;
  } else if (type === 'fighter2') {
    torsoTopMat = skinMat;
    torsoBotMat = NPC_MATS.fightShortsBlue;
    legMat = skinMat;
  }

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.32, 16), torsoTopMat);
  chest.position.set(0, 1.30, 0);
  chest.scale.set(1.15, 1.0, 0.76);
  chest.castShadow = true;
  torsoGroup.add(chest);

  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.24, 16), torsoBotMat);
  waist.position.set(0, 1.05, 0);
  waist.scale.set(1.1, 1.0, 0.74);
  waist.castShadow = true;
  torsoGroup.add(waist);

  // 3. TANGAN & LENGAN
  function makeArm(side) {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.22, 1.38, 0);

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), torsoTopMat);
    shoulder.castShadow = true;
    armGroup.add(shoulder);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.16, 8, 10), torsoTopMat);
    upperArm.position.set(0, -0.12, 0);
    upperArm.castShadow = true;
    armGroup.add(upperArm);

    const lowerGroup = new THREE.Group();
    lowerGroup.position.set(0, -0.25, 0);
    armGroup.add(lowerGroup);

    // Lengan bawah (kulit jika petarung/petani gulung lengan)
    const isBareForearm = (type.includes('farmer') || type.includes('fighter'));
    const foreMat = isBareForearm ? skinMat : torsoTopMat;

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.14, 8, 10), foreMat);
    forearm.position.set(0, -0.09, 0);
    forearm.castShadow = true;
    lowerGroup.add(forearm);

    // Tangan (Sarung tinju / telapak)
    let handMat = skinMat;
    if (type === 'fighter1') handMat = NPC_MATS.wrapRed;
    else if (type === 'fighter2') handMat = NPC_MATS.wrapBlue;

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.052, 0.03), handMat);
    hand.position.set(0, -0.21, 0.005);
    hand.castShadow = true;
    lowerGroup.add(hand);

    return { armGroup, lowerGroup, hand };
  }

  const armL = makeArm(-1);
  const armR = makeArm(1);
  root.add(armL.armGroup);
  root.add(armR.armGroup);

  // 4. KAKI
  function makeLeg(side) {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.105, 0.82, 0);

    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), legMat);
    legGroup.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 8, 10), legMat);
    thigh.position.set(0, -0.16, 0.005);
    thigh.castShadow = true;
    legGroup.add(thigh);

    const lowerGroup = new THREE.Group();
    lowerGroup.position.set(0, -0.32, 0);
    legGroup.add(lowerGroup);

    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 8, 10), legMat);
    calf.position.set(0, -0.14, -0.002);
    calf.castShadow = true;
    lowerGroup.add(calf);

    // Sepatu / Kaki
    let shoeMat = NPC_MATS.boots;
    if (type.includes('fighter')) shoeMat = (type === 'fighter1') ? NPC_MATS.wrapRed : NPC_MATS.wrapBlue;

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.05, 0.18), shoeMat);
    shoe.position.set(0, -0.28, 0.02);
    shoe.castShadow = true;
    lowerGroup.add(shoe);

    return { legGroup, lowerGroup };
  }

  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  root.add(legL.legGroup);
  root.add(legR.legGroup);

  // 5. PERALATAN / WEAPON ATTACHMENT
  let toolMesh = null;
  let flashMesh = null;
  let waterEmitter = null;
  let sparkMesh = null;

  if (type === 'farmer1') {
    // Alat Penyiram Tanaman (Watering Can) di tangan kanan
    const canGroup = new THREE.Group();
    const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.16, 12), NPC_MATS.waterCan);
    canGroup.add(canBody);

    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.22, 8), NPC_MATS.waterCan);
    spout.position.set(0, 0.05, 0.14);
    spout.rotation.x = 0.65;
    canGroup.add(spout);

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 12, Math.PI), NPC_MATS.waterCan);
    handle.position.set(0, 0.08, -0.02);
    handle.rotation.x = Math.PI / 2;
    canGroup.add(handle);

    // Partikel tetesan air
    const drops = [];
    for (let d = 0; d < 8; d++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), NPC_MATS.waterDrop);
      drop.visible = false;
      canGroup.add(drop);
      drops.push(drop);
    }
    waterEmitter = { drops, time: 0 };

    canGroup.position.set(0, -0.26, 0.08);
    armR.lowerGroup.add(canGroup);
    toolMesh = canGroup;
  } else if (type === 'farmer2') {
    // Cangkul Tani (Hoe) di tangan
    const hoeGroup = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.95, 8), NPC_MATS.hoeWood);
    handle.position.y = 0.2;
    hoeGroup.add(handle);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.015), NPC_MATS.hoeIron);
    blade.position.set(0, -0.26, 0.06);
    blade.rotation.x = 0.8;
    hoeGroup.add(blade);

    hoeGroup.position.set(0, -0.22, 0.05);
    armR.lowerGroup.add(hoeGroup);
    toolMesh = hoeGroup;
  } else if (type === 'soldier1' || type === 'soldier2') {
    // Senapan Serbu Militer (Assault Rifle)
    const rifleGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.08, 0.55), NPC_MATS.rifleBody);
    rifleGroup.add(body);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), NPC_MATS.rifleBody);
    barrel.position.set(0, 0.015, 0.38);
    barrel.rotation.x = Math.PI / 2;
    rifleGroup.add(barrel);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.06), NPC_MATS.rifleBody);
    mag.position.set(0, -0.08, 0.1);
    mag.rotation.x = 0.25;
    rifleGroup.add(mag);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.18), NPC_MATS.rifleGrip);
    stock.position.set(0, -0.02, -0.32);
    rifleGroup.add(stock);

    // Muzzle flash
    flashMesh = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), NPC_MATS.flashMat);
    flashMesh.position.set(0, 0.015, 0.56);
    flashMesh.rotation.x = Math.PI / 2;
    flashMesh.visible = false;
    rifleGroup.add(flashMesh);

    rifleGroup.position.set(0.08, -0.22, 0.15);
    rifleGroup.rotation.y = -0.15;
    armR.lowerGroup.add(rifleGroup);
    toolMesh = rifleGroup;
  } else if (type === 'fighter1' || type === 'fighter2') {
    // Spark benturan pukulan tinju
    sparkMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), NPC_MATS.hitSparkMat);
    sparkMesh.visible = false;
    root.add(sparkMesh);
  }

  return {
    root,
    anim: {
      legL: legL.legGroup,
      legR: legR.legGroup,
      legLLow: legL.lowerGroup,
      legRLow: legR.lowerGroup,
      armL: armL.armGroup,
      armR: armR.armGroup,
      armLLow: armL.lowerGroup,
      armRLow: armR.lowerGroup,
      headGroup,
      torsoGroup
    },
    toolMesh,
    flashMesh,
    waterEmitter,
    sparkMesh
  };
}

// ==================== KELOMPOK 1: NPC PERKEBUNAN ====================
class FarmerNPC {
  constructor(modelType, waypoints, scene) {
    this.modelType = modelType;
    this.waypoints = waypoints;
    this.wpIndex = 0;
    this.model = createNPCModel(modelType);
    this.root = this.model.root;
    this.anim = this.model.anim;
    this.tool = this.model.toolMesh;
    this.waterEmitter = this.model.waterEmitter;

    // State machine
    this.state = 'WALK'; // WALK, WORK, REST
    this.stateTimer = 0;
    this.walkCycle = 0;
    this.workSubState = 0; // 0: inspect, 1: action (water/hoe), 2: pause

    this.speed = 1.6;
    const startPos = waypoints[0];
    this.root.position.copy(startPos);
    this.root.userData = { isNPC: true, role: this.modelType, npc: this };
    this.meta = NPC_DATA[modelType] || { name: 'Petani', role: 'Perkebunan', avatar: '👨‍🌾', dialogues: ['Halo penjelajah!'] };
    this.talkTimer = 0;
    this.dialogueIndex = -1;
    scene.add(this.root);
  }

  talkTo(playerPos) {
    this.talkTimer = 5.0;
    const currentDialogues = getNPCDialogues(this.meta);
    this.dialogueIndex = (this.dialogueIndex + 1) % currentDialogues.length;
    if (playerPos) {
      const dx = playerPos.x - this.root.position.x;
      const dz = playerPos.z - this.root.position.z;
      this.root.rotation.y = Math.atan2(dx, dz);
    }
    return {
      name: this.meta.name,
      role: this.meta.role,
      avatar: this.meta.avatar,
      text: currentDialogues[this.dialogueIndex]
    };
  }

  update(delta, elapsed, playerPos) {
    this.stateTimer += delta;

    if (this.talkTimer > 0) {
      this.talkTimer -= delta;
      if (playerPos) {
        const dx = playerPos.x - this.root.position.x;
        const dz = playerPos.z - this.root.position.z;
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.root.rotation.y += diff * 0.15;
      }
      return;
    }

    if (this.state === 'WALK') {
      const target = this.waypoints[this.wpIndex];
      const dx = target.x - this.root.position.x;
      const dz = target.z - this.root.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.35) {
        // Tiba di tanaman/alur kerja
        this.state = 'WORK';
        this.stateTimer = 0;
        this.workSubState = 0;
        this.resetLimbs();
      } else {
        // Berjalan menuju waypoint
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.root.rotation.y += diff * 0.15;

        const moveStep = Math.min(dist, this.speed * delta);
        this.root.position.x += Math.sin(this.root.rotation.y) * moveStep;
        this.root.position.z += Math.cos(this.root.rotation.y) * moveStep;

        // Animasi jalan
        this.walkCycle += delta * 7;
        const sw = Math.sin(this.walkCycle);
        this.anim.legL.rotation.x = sw * 0.6;
        this.anim.legR.rotation.x = -sw * 0.6;
        this.anim.legLLow.rotation.x = Math.max(0, -sw) * 0.7;
        this.anim.legRLow.rotation.x = Math.max(0, sw) * 0.7;

        this.anim.armL.rotation.x = -sw * 0.45;
        this.anim.armR.rotation.x = sw * 0.3; // Tangan pemegang alat lebih stabil
        this.anim.armLLow.rotation.x = -0.3;
        this.anim.armRLow.rotation.x = -0.5;
        this.anim.headGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.05;
      }
    } else if (this.state === 'WORK') {
      // Aktivitas bertani sesuai peran
      if (this.modelType === 'farmer1') {
        // Petani 1: Periksa tanaman -> Menyiram dengan gembor -> Berdiri puas
        if (this.workSubState === 0) {
          // Membungkuk memeriksa tanaman
          this.anim.torsoGroup.rotation.x = 0.35;
          this.anim.headGroup.rotation.x = 0.3;
          this.anim.armL.rotation.x = 0.2;
          this.anim.armR.rotation.x = 0.1;
          if (this.stateTimer > 2.0) {
            this.workSubState = 1;
            this.stateTimer = 0;
          }
        } else if (this.workSubState === 1) {
          // Menyiram tanaman (angkat gembor & miringkan)
          this.anim.torsoGroup.rotation.x = 0.2;
          this.anim.headGroup.rotation.x = 0.2;
          this.anim.armR.rotation.x = -0.7;
          this.anim.armRLow.rotation.x = -0.8;
          if (this.tool) this.tool.rotation.x = 0.5;

          // Animasi partikel air
          if (this.waterEmitter) {
            this.waterEmitter.time += delta;
            this.waterEmitter.drops.forEach((drop, idx) => {
              drop.visible = true;
              const t = (this.waterEmitter.time * 3 + idx * 0.2) % 1;
              drop.position.set((Math.random() - 0.5) * 0.06, 0.05 - t * 0.45, 0.2 + t * 0.3);
            });
            if (Math.random() < 0.1) playNPCSound('water', this.root.position, playerPos);
          }

          if (this.stateTimer > 3.5) {
            this.workSubState = 2;
            this.stateTimer = 0;
            if (this.waterEmitter) this.waterEmitter.drops.forEach(d => d.visible = false);
            if (this.tool) this.tool.rotation.x = 0;
          }
        } else if (this.workSubState === 2) {
          // Berdiri tegak, sejenak melihat hasil siraman
          this.anim.torsoGroup.rotation.x = 0;
          this.anim.headGroup.rotation.x = -0.05;
          this.anim.armR.rotation.x = -0.2;
          this.anim.armRLow.rotation.x = -0.3;
          if (this.stateTimer > 2.0) {
            this.state = 'REST';
            this.stateTimer = 0;
          }
        }
      } else {
        // Petani 2: Mencangkul tanah (3-4 kali ayunan) -> Cek tanah
        if (this.workSubState === 0) {
          // Siklus mencangkul
          const swingSpeed = 3.5;
          const cycle = (this.stateTimer * swingSpeed) % Math.PI;
          const swingPhase = Math.sin(cycle);

          // Angkat cangkul ke atas lalu hantam ke bawah
          this.anim.torsoGroup.rotation.x = 0.15 + swingPhase * 0.25;
          this.anim.headGroup.rotation.x = 0.2 + swingPhase * 0.15;
          this.anim.armL.rotation.x = -0.6 - swingPhase * 0.8;
          this.anim.armR.rotation.x = -0.7 - swingPhase * 0.9;
          this.anim.armLLow.rotation.x = -0.5 - swingPhase * 0.4;
          this.anim.armRLow.rotation.x = -0.5 - swingPhase * 0.4;

          if (this.stateTimer > 4.5) {
            this.workSubState = 1;
            this.stateTimer = 0;
          }
        } else if (this.workSubState === 1) {
          // Istirahat bertopang cangkul & melihat ladang
          this.anim.torsoGroup.rotation.x = 0.05;
          this.anim.headGroup.rotation.x = -0.1;
          this.anim.armL.rotation.x = -0.3;
          this.anim.armR.rotation.x = -0.3;
          this.anim.armLLow.rotation.x = -0.4;
          this.anim.armRLow.rotation.x = -0.4;
          if (this.stateTimer > 2.2) {
            this.state = 'REST';
            this.stateTimer = 0;
          }
        }
      }
    } else if (this.state === 'REST') {
      // Istirahat sejenak, regangkan badan, lalu ke tanaman berikutnya
      this.resetLimbs();
      this.anim.headGroup.rotation.y = Math.sin(this.stateTimer * 1.5) * 0.2;
      if (this.stateTimer > 2.0) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        this.state = 'WALK';
        this.stateTimer = 0;
      }
    }
  }

  resetLimbs() {
    this.anim.legL.rotation.set(0, 0, 0);
    this.anim.legR.rotation.set(0, 0, 0);
    this.anim.legLLow.rotation.set(0, 0, 0);
    this.anim.legRLow.rotation.set(0, 0, 0);
    this.anim.armL.rotation.set(0, 0, 0);
    this.anim.armR.rotation.set(0, 0, 0);
    this.anim.armLLow.rotation.set(-0.3, 0, 0);
    this.anim.armRLow.rotation.set(-0.3, 0, 0);
    this.anim.torsoGroup.rotation.set(0, 0, 0);
    this.anim.headGroup.rotation.set(0, 0, 0);
  }
}

// ==================== KELOMPOK 2: NPC KAMP TENTARA ====================
class SoldierNPC {
  constructor(modelType, shootingLane, targetPos, scene) {
    this.modelType = modelType;
    this.shootingLane = shootingLane;
    this.laneIndex = 0;
    this.targetPos = targetPos;
    this.model = createNPCModel(modelType);
    this.root = this.model.root;
    this.anim = this.model.anim;
    this.rifle = this.model.toolMesh;
    this.flash = this.model.flashMesh;

    // Laser proyektil tracer visual
    this.tracer = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 6, 6), NPC_MATS.laserBeam);
    this.tracer.rotation.x = Math.PI / 2;
    this.tracer.visible = false;
    scene.add(this.tracer);

    // State machine
    this.state = 'MOVE'; // MOVE, AIM, SHOOT, RELOAD, PAUSE
    this.stateTimer = 0;
    this.shotsRemaining = (modelType === 'soldier1') ? 4 : 2;
    this.recoilTimer = 0;
    this.walkCycle = 0;

    this.root.position.copy(shootingLane[0]);
    this.root.userData = { isNPC: true, role: this.modelType, npc: this };
    this.meta = NPC_DATA[modelType] || { name: 'Tentara', role: 'Kamp Militer', avatar: '🎖️', dialogues: ['Siap siaga prajurit!'] };
    this.talkTimer = 0;
    this.dialogueIndex = -1;
    scene.add(this.root);
  }

  talkTo(playerPos) {
    this.talkTimer = 5.0;
    const currentDialogues = getNPCDialogues(this.meta);
    this.dialogueIndex = (this.dialogueIndex + 1) % currentDialogues.length;
    if (playerPos) {
      const dx = playerPos.x - this.root.position.x;
      const dz = playerPos.z - this.root.position.z;
      this.root.rotation.y = Math.atan2(dx, dz);
    }
    // Lower rifle slightly when talking
    this.anim.armR.rotation.set(-0.25, 0, 0);
    this.anim.armL.rotation.set(-0.35, 0, 0);
    return {
      name: this.meta.name,
      role: this.meta.role,
      avatar: this.meta.avatar,
      text: currentDialogues[this.dialogueIndex]
    };
  }

  update(delta, elapsed, playerPos) {
    this.stateTimer += delta;

    if (this.talkTimer > 0) {
      this.talkTimer -= delta;
      if (playerPos) {
        const dx = playerPos.x - this.root.position.x;
        const dz = playerPos.z - this.root.position.z;
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.root.rotation.y += diff * 0.15;
      }
      return;
    }

    if (this.state === 'MOVE') {
      const targetLane = this.shootingLane[this.laneIndex];
      const dx = targetLane.x - this.root.position.x;
      const dz = targetLane.z - this.root.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.2) {
        this.state = 'AIM';
        this.stateTimer = 0;
        this.resetPose();
      } else {
        const moveStep = Math.min(dist, 1.8 * delta);
        this.root.position.x += (dx / dist) * moveStep;
        this.root.position.z += (dz / dist) * moveStep;

        // Hadap arah gerak
        this.root.rotation.y = Math.atan2(dx, dz);

        // Animasi jalan taktis
        this.walkCycle += delta * 8;
        const sw = Math.sin(this.walkCycle);
        this.anim.legL.rotation.x = sw * 0.55;
        this.anim.legR.rotation.x = -sw * 0.55;
        this.anim.legLLow.rotation.x = Math.max(0, -sw) * 0.6;
        this.anim.legRLow.rotation.x = Math.max(0, sw) * 0.6;
        // Senjata didekap di dada
        this.anim.armR.rotation.set(-0.6, 0.2, 0);
        this.anim.armL.rotation.set(-0.5, -0.3, 0);
      }
    } else if (this.state === 'AIM') {
      // Hadap target latihan
      const dx = this.targetPos.x - this.root.position.x;
      const dz = this.targetPos.z - this.root.position.z;
      this.root.rotation.y = Math.atan2(dx, dz);

      // Kunci pose membidik (two-handed rifle aim)
      this.anim.armR.rotation.set(-1.3, -0.25, 0.1);
      this.anim.armRLow.rotation.set(-0.8, 0, 0);
      this.anim.armL.rotation.set(-1.15, 0.35, -0.15);
      this.anim.armLLow.rotation.set(-1.1, 0, 0);
      this.anim.headGroup.rotation.set(0.05, -0.08, 0);

      // Tentara 2 sesekali berlutut / crouching
      if (this.modelType === 'soldier2' && this.laneIndex === 1) {
        this.anim.legL.rotation.x = -0.9;
        this.anim.legR.rotation.x = 0.8;
        this.anim.legLLow.rotation.x = 1.3;
        this.root.position.y = -0.22;
      } else {
        this.root.position.y = 0;
      }

      if (this.stateTimer > ((this.modelType === 'soldier1') ? 1.4 : 2.0)) {
        this.state = 'SHOOT';
        this.stateTimer = 0;
      }
    } else if (this.state === 'SHOOT') {
      // Menembak burst dengan jeda
      const shotInterval = (this.modelType === 'soldier1') ? 0.35 : 0.7;

      if (this.stateTimer > shotInterval) {
        this.stateTimer = 0;
        this.shotsRemaining--;

        // Muzzle flash visual
        if (this.flash) {
          this.flash.visible = true;
          setTimeout(() => { if (this.flash) this.flash.visible = false; }, 60);
        }

        // Efek hentakan senjata (Recoil)
        this.anim.armR.rotation.x = -1.45;
        this.anim.torsoGroup.rotation.x = -0.08;
        setTimeout(() => {
          this.anim.armR.rotation.x = -1.3;
          this.anim.torsoGroup.rotation.x = 0;
        }, 90);

        // Suara tembakan
        playNPCSound('gunshot', this.root.position, playerPos);

        // Proyektil peluru garis kuning
        if (this.tracer) {
          const midX = (this.root.position.x + this.targetPos.x) / 2;
          const midZ = (this.root.position.z + this.targetPos.z) / 2;
          this.tracer.position.set(midX, 1.3, midZ);
          this.tracer.lookAt(this.targetPos.x, 1.3, this.targetPos.z);
          this.tracer.visible = true;
          setTimeout(() => { if (this.tracer) this.tracer.visible = false; }, 70);
        }

        if (this.shotsRemaining <= 0) {
          this.state = 'RELOAD';
          this.stateTimer = 0;
        }
      }
    } else if (this.state === 'RELOAD') {
      // Turunkan senjata dan ganti magasen
      this.anim.armR.rotation.set(-0.7, 0, 0);
      this.anim.armRLow.rotation.set(-0.6, 0, 0);
      this.anim.armL.rotation.set(-0.3 + Math.sin(this.stateTimer * 4) * 0.4, 0, 0);
      this.anim.headGroup.rotation.set(0.2, 0, 0); // Lihat ke magasen

      if (this.stateTimer > 2.5) {
        this.state = 'PAUSE';
        this.stateTimer = 0;
      }
    } else if (this.state === 'PAUSE') {
      // Jeda taktis, lalu berpindah posisi
      this.resetPose();
      if (this.stateTimer > 1.8) {
        this.laneIndex = (this.laneIndex + 1) % this.shootingLane.length;
        this.shotsRemaining = (this.modelType === 'soldier1') ? 4 : 2;
        this.state = 'MOVE';
        this.stateTimer = 0;
      }
    }
  }

  resetPose() {
    this.root.position.y = 0;
    this.anim.legL.rotation.set(0, 0, 0);
    this.anim.legR.rotation.set(0, 0, 0);
    this.anim.legLLow.rotation.set(0, 0, 0);
    this.anim.legRLow.rotation.set(0, 0, 0);
    this.anim.armL.rotation.set(-0.4, 0, 0);
    this.anim.armR.rotation.set(-0.4, 0, 0);
    this.anim.torsoGroup.rotation.set(0, 0, 0);
    this.anim.headGroup.rotation.set(0, 0, 0);
  }
}

// ==================== KELOMPOK 3: NPC ARENA BAKALAE ====================
class FighterNPC {
  constructor(modelType, ringCenter, initialOffset, scene) {
    this.modelType = modelType;
    this.ringCenter = ringCenter;
    this.model = createNPCModel(modelType);
    this.root = this.model.root;
    this.anim = this.model.anim;
    this.spark = this.model.sparkMesh;

    // Stat & FSM
    this.hp = 100;
    this.maxHp = 100;
    this.state = 'IDLE'; // IDLE, APPROACH, ATTACK, DEFEND, HIT, KNOCKDOWN, REPOSITION
    this.stateTimer = 0;
    this.attackCooldown = (modelType === 'fighter1') ? 1.1 : 1.5;
    this.opponent = null; // Diisi setelah kedua petarung diinstansiasi
    this.bounceTime = 0;
    this.attackArm = 1; // 1: kanan, -1: kiri

    this.initialOffset = initialOffset;
    this.root.position.set(ringCenter.x + initialOffset.x, 0.14, ringCenter.z + initialOffset.z);
    this.root.userData = { isNPC: true, role: this.modelType, npc: this };
    this.meta = NPC_DATA[modelType] || { name: 'Petarung', role: 'Arena Ring', avatar: '🥊', dialogues: ['Ayo bertarung sportif!'] };
    this.talkTimer = 0;
    this.dialogueIndex = -1;
    scene.add(this.root);
  }

  talkTo(playerPos) {
    this.talkTimer = 5.0;
    const currentDialogues = getNPCDialogues(this.meta);
    this.dialogueIndex = (this.dialogueIndex + 1) % currentDialogues.length;
    if (playerPos) {
      const dx = playerPos.x - this.root.position.x;
      const dz = playerPos.z - this.root.position.z;
      this.root.rotation.y = Math.atan2(dx, dz);
    }
    return {
      name: this.meta.name,
      role: this.meta.role,
      avatar: this.meta.avatar,
      text: currentDialogues[this.dialogueIndex]
    };
  }

  setOpponent(opp) {
    this.opponent = opp;
  }

  resetToCorner() {
    this.hp = this.maxHp;
    const offset = (this.modelType === 'fighter1') ? -1.1 : 1.1;
    this.root.position.set(this.ringCenter.x + offset, 0.14, this.ringCenter.z);
    this.root.rotation.set(0, (this.modelType === 'fighter1' ? Math.PI / 2 : -Math.PI / 2), 0);
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.bounceTime = 0;
    this.anim.torsoGroup.rotation.set(0, 0, 0);
    this.anim.headGroup.rotation.set(0, 0, 0);
    this.anim.armL.rotation.set(-1.2, 0.3, 0);
    this.anim.armR.rotation.set(-1.2, -0.3, 0);
    this.anim.legL.rotation.set(0, 0, 0);
    this.anim.legR.rotation.set(0, 0, 0);
  }

  takeHit(damage, playerPos) {
    if (this.state === 'KNOCKDOWN') return;
    this.hp -= damage;
    this.state = 'HIT';
    this.stateTimer = 0;

    // Efek percikan benturan
    if (this.spark) {
      this.spark.position.set(0, 1.35, 0.15);
      this.spark.visible = true;
      setTimeout(() => { if (this.spark) this.spark.visible = false; }, 100);
    }
    playNPCSound('punch', this.root.position, playerPos);

    if (this.hp <= 0) {
      this.state = 'KNOCKDOWN';
      this.stateTimer = 0;
    }
  }

  update(delta, elapsed, playerPos) {
    if (!this.opponent) return;
    this.stateTimer += delta;

    if (this.talkTimer > 0) {
      this.talkTimer -= delta;
      if (playerPos) {
        const dx = playerPos.x - this.root.position.x;
        const dz = playerPos.z - this.root.position.z;
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.root.rotation.y += diff * 0.15;
      }
      return;
    }

    // Safety check NaN
    if (isNaN(this.root.position.x) || isNaN(this.root.position.y) || isNaN(this.root.position.z)) {
      this.resetToCorner();
      return;
    }

    const dx = this.opponent.root.position.x - this.root.position.x;
    const dz = this.opponent.root.position.z - this.root.position.z;
    const rawDist = Math.sqrt(dx * dx + dz * dz);
    const dist = Math.max(0.1, rawDist);
    const dirX = dx / dist;
    const dirZ = dz / dist;

    // Selalu hadap lawan jika sedang bertarung
    if (this.state !== 'KNOCKDOWN' && this.state !== 'CELEBRATE') {
      this.root.rotation.y = Math.atan2(dx, dz);
    }

    // Batas ring ketat (radius tali 2.4, batas pergerakan 1.7)
    const drcX = this.root.position.x - this.ringCenter.x;
    const drcZ = this.root.position.z - this.ringCenter.z;
    const distFromCenter = Math.sqrt(drcX * drcX + drcZ * drcZ);
    if (distFromCenter > 1.7) {
      const norm = distFromCenter || 1;
      this.root.position.x = this.ringCenter.x + (drcX / norm) * 1.68;
      this.root.position.z = this.ringCenter.z + (drcZ / norm) * 1.68;
    }

    // Jika lawan sedang KNOCKDOWN dan kita masih berdiri: selebrasi kemenangan
    if (this.opponent.state === 'KNOCKDOWN' && this.state !== 'KNOCKDOWN') {
      this.state = 'CELEBRATE';
      this.anim.armL.rotation.set(-2.4, 0.4, 0);
      this.anim.armR.rotation.set(-2.4, -0.4, 0);
      this.anim.headGroup.rotation.x = -0.3;
      this.bounceTime += delta * 4;
      this.root.position.y = 0.14 + Math.abs(Math.sin(this.bounceTime)) * 0.08;
      return;
    }

    if (this.state === 'CELEBRATE') {
      if (this.opponent.state !== 'KNOCKDOWN') {
        this.resetToCorner();
      }
      return;
    }

    if (this.state === 'IDLE') {
      // Bouncing combat stance (loncat-loncat kecil khas tinju)
      this.bounceTime += delta * 6;
      const b = Math.sin(this.bounceTime) * 0.035;
      this.root.position.y = 0.14 + Math.max(0, b);

      // Kuda-kuda tangan menjaga muka (High Guard)
      this.anim.armL.rotation.set(-1.3 + b, 0.35, -0.2);
      this.anim.armLLow.rotation.set(-1.5, 0, 0);
      this.anim.armR.rotation.set(-1.2 - b, -0.35, 0.2);
      this.anim.armRLow.rotation.set(-1.4, 0, 0);
      this.anim.torsoGroup.rotation.y = (this.modelType === 'fighter1') ? 0.2 : -0.2;

      if (dist > 1.6) {
        this.state = 'APPROACH';
        this.stateTimer = 0;
      } else if (this.stateTimer > this.attackCooldown) {
        // Peluang menyerang atau bertahan
        if (Math.random() < 0.75) {
          this.state = 'ATTACK';
          this.attackArm = (Math.random() > 0.5) ? 1 : -1;
        } else {
          this.state = 'DEFEND';
        }
        this.stateTimer = 0;
      }
    } else if (this.state === 'APPROACH') {
      this.root.position.y = 0.14;
      if (dist <= 1.45) {
        this.state = 'IDLE';
        this.stateTimer = 0;
      } else {
        const step = Math.min(dist - 1.25, 2.0 * delta);
        this.root.position.x += dirX * step;
        this.root.position.z += dirZ * step;

        this.bounceTime += delta * 9;
        const sw = Math.sin(this.bounceTime);
        this.anim.legL.rotation.x = sw * 0.45;
        this.anim.legR.rotation.x = -sw * 0.45;
      }
    } else if (this.state === 'ATTACK') {
      this.root.position.y = 0.14;
      // Pukulan tinju cepat (0.35 detik durasi pukulan)
      const attackDuration = 0.38;
      const progress = this.stateTimer / attackDuration;

      if (progress < 0.5) {
        // Melayangkan pukulan ke depan
        const punchExt = Math.sin(progress * Math.PI) * 1.5;
        if (this.attackArm === 1) {
          this.anim.armR.rotation.set(-1.55, -0.1, 0);
          this.anim.armRLow.rotation.set(-0.2 - punchExt * 0.5, 0, 0);
          this.anim.torsoGroup.rotation.y = 0.35;
        } else {
          this.anim.armL.rotation.set(-1.55, 0.1, 0);
          this.anim.armLLow.rotation.set(-0.2 - punchExt * 0.5, 0, 0);
          this.anim.torsoGroup.rotation.y = -0.35;
        }
      } else {
        // Menarik kembali ke posisi siap
        this.anim.armR.rotation.set(-1.2, -0.3, 0);
        this.anim.armL.rotation.set(-1.2, 0.3, 0);
      }

      // Hitbox timing di puncak serangan
      if (this.stateTimer >= 0.18 && !this.hasDealtDamage) {
        this.hasDealtDamage = true;
        if (dist < 1.6) {
          const dmg = (this.opponent.state === 'DEFEND') ? 8 : 22;
          this.opponent.takeHit(dmg, playerPos);
        }
      }

      if (this.stateTimer >= attackDuration) {
        this.hasDealtDamage = false;
        this.state = 'REPOSITION';
        this.stateTimer = 0;
      }
    } else if (this.state === 'DEFEND') {
      this.root.position.y = 0.14;
      this.anim.armL.rotation.set(-1.6, 0.1, 0);
      this.anim.armLLow.rotation.set(-1.6, 0, 0);
      this.anim.armR.rotation.set(-1.6, -0.1, 0);
      this.anim.armRLow.rotation.set(-1.6, 0, 0);
      this.anim.headGroup.rotation.x = 0.2;

      const backStep = 0.6 * delta;
      this.root.position.x -= dirX * backStep;
      this.root.position.z -= dirZ * backStep;

      if (this.stateTimer > 1.0) {
        this.state = 'IDLE';
        this.stateTimer = 0;
      }
    } else if (this.state === 'HIT') {
      this.root.position.y = 0.14;
      this.anim.headGroup.rotation.x = -0.35;
      this.anim.headGroup.rotation.y = (this.attackArm === 1 ? -0.25 : 0.25);
      this.anim.torsoGroup.rotation.x = -0.2;
      this.anim.armL.rotation.x = -0.5;
      this.anim.armR.rotation.x = -0.5;

      const recoilStep = 1.0 * delta;
      this.root.position.x -= dirX * recoilStep;
      this.root.position.z -= dirZ * recoilStep;

      if (this.stateTimer > 0.32) {
        this.state = 'IDLE';
        this.stateTimer = 0;
      }
    } else if (this.state === 'REPOSITION') {
      this.root.position.y = 0.14;
      const perpX = -dirZ;
      const perpZ = dirX;
      const sideDir = (this.modelType === 'fighter1') ? 1 : -1;

      this.root.position.x += perpX * sideDir * 1.0 * delta;
      this.root.position.z += perpZ * sideDir * 1.0 * delta;

      if (this.stateTimer > 1.0) {
        this.state = 'IDLE';
        this.stateTimer = 0;
      }
    } else if (this.state === 'KNOCKDOWN') {
      if (this.stateTimer < 0.6) {
        const fallT = this.stateTimer / 0.6;
        this.root.rotation.x = fallT * (-Math.PI / 2);
        this.root.position.y = 0.14;
      } else if (this.stateTimer < 3.2) {
        this.root.rotation.x = -Math.PI / 2;
        this.root.position.y = 0.14;
      } else {
        this.resetToCorner();
        if (this.opponent) {
          this.opponent.resetToCorner();
        }
      }
    }
  }
}

// ==================== MANAGER SISTEM NPC UTAMA ====================
class NPCSystemManager {
  constructor() {
    this.npcs = [];
    this.targets = [];
    this.initialized = false;
  }

  init(scene, THREE, options = {}) {
    if (this.initialized) return;
    this.initialized = true;

    // 1. DUA NPC PERKEBUNAN (cx: -38, cz: 22, w: 26, d: 22)
    // Waypoints Petani 1 (Penyiram tanaman di lajur tomat, wortel, jagung)
    const farmer1Waypoints = [
      new THREE.Vector3(-33, 0, 16),
      new THREE.Vector3(-38, 0, 16),
      new THREE.Vector3(-43, 0, 19),
      new THREE.Vector3(-40, 0, 25),
      new THREE.Vector3(-34, 0, 28)
    ];
    const farmer1 = new FarmerNPC('farmer1', farmer1Waypoints, scene);
    this.npcs.push(farmer1);

    // Waypoints Petani 2 (Pencangkul tanah di alur bajak & pemanen)
    const farmer2Waypoints = [
      new THREE.Vector3(-43, 0, 27),
      new THREE.Vector3(-37, 0, 28),
      new THREE.Vector3(-32, 0, 22),
      new THREE.Vector3(-36, 0, 18),
      new THREE.Vector3(-42, 0, 15)
    ];
    const farmer2 = new FarmerNPC('farmer2', farmer2Waypoints, scene);
    this.npcs.push(farmer2);

    // 2. DUA NPC KAMP TENTARA (cx: 42, cz: -12, w: 28, d: 24)
    // Buat 2 target sasaran tembak kayu di ujung area kamp
    const target1Pos = new THREE.Vector3(53, 0, -14.5);
    const target2Pos = new THREE.Vector3(53, 0, -9.5);
    this.createShootingTarget(scene, THREE, target1Pos);
    this.createShootingTarget(scene, THREE, target2Pos);

    // Jalur latihan Tentara 1 (Sersan berdiri di sandbag lane 1)
    const soldier1Lanes = [
      new THREE.Vector3(34, 0, -14.5),
      new THREE.Vector3(36.5, 0, -14.5),
      new THREE.Vector3(35, 0, -13)
    ];
    const soldier1 = new SoldierNPC('soldier1', soldier1Lanes, target1Pos, scene);
    this.npcs.push(soldier1);

    // Jalur latihan Tentara 2 (Prajurit membidik & crouching di lane 2)
    const soldier2Lanes = [
      new THREE.Vector3(34, 0, -9.5),
      new THREE.Vector3(36.5, 0, -9.5),
      new THREE.Vector3(35, 0, -11)
    ];
    const soldier2 = new SoldierNPC('soldier2', soldier2Lanes, target2Pos, scene);
    this.npcs.push(soldier2);

    // 3. DUA NPC ARENA BAKALAE (Tepat di tengah arena)
    const arenaPos = (options && options.arena) ? options.arena : { cx: 30, cz: 22 };
    const ringCenter = new THREE.Vector3(arenaPos.cx, 0, arenaPos.cz);
    this.createSparringRing(scene, THREE, ringCenter);

    const fighter1 = new FighterNPC('fighter1', ringCenter, new THREE.Vector3(-1.1, 0, 0), scene);
    const fighter2 = new FighterNPC('fighter2', ringCenter, new THREE.Vector3(1.1, 0, 0), scene);

    fighter1.setOpponent(fighter2);
    fighter2.setOpponent(fighter1);

    this.npcs.push(fighter1);
    this.npcs.push(fighter2);

    if (typeof window !== 'undefined') {
      window.npcSystem = this;
    }

    console.log("NPC System Initialized: Exactly 6 active NPCs created across 3 zones.");
  }

  createSparringRing(scene, THREE, pos) {
    const ringGroup = new THREE.Group();
    ringGroup.position.copy(pos);

    // Mat / Canvas panggung tinju
    const canvasMat = new THREE.MeshStandardMaterial({ color: 0x3d1d1d, roughness: 0.85 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.9 });
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.14, 5.2),
      [edgeMat, edgeMat, canvasMat, edgeMat, edgeMat, edgeMat]
    );
    platform.position.y = 0.07;
    platform.receiveShadow = true;
    ringGroup.add(platform);

    // 4 Tiang Ring di setiap sudut
    const postMatRed = new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.5, roughness: 0.3 });
    const postMatBlue = new THREE.MeshStandardMaterial({ color: 0x1976d2, metalness: 0.5, roughness: 0.3 });
    const postMatWhite = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.4, roughness: 0.4 });
    const corners = [
      { x: -2.4, z: -2.4, mat: postMatRed },
      { x: 2.4, z: -2.4, mat: postMatBlue },
      { x: -2.4, z: 2.4, mat: postMatWhite },
      { x: 2.4, z: 2.4, mat: postMatWhite }
    ];

    corners.forEach(c => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 12), c.mat);
      post.position.set(c.x, 0.68, c.z);
      post.castShadow = true;
      ringGroup.add(post);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 12), c.mat);
      pad.position.set(c.x, 0.72, c.z);
      ringGroup.add(pad);
    });

    // 3 Tali Ring (Ropes) sekeliling sudut
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.6 });
    const ropeHeights = [0.45, 0.75, 1.05];
    ropeHeights.forEach(h => {
      const ropeN = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 8), ropeMat);
      ropeN.rotation.z = Math.PI / 2;
      ropeN.position.set(0, h, -2.4);
      ringGroup.add(ropeN);

      const ropeS = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 8), ropeMat);
      ropeS.rotation.z = Math.PI / 2;
      ropeS.position.set(0, h, 2.4);
      ringGroup.add(ropeS);

      const ropeW = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 8), ropeMat);
      ropeW.rotation.x = Math.PI / 2;
      ropeW.position.set(-2.4, h, 0);
      ringGroup.add(ropeW);

      const ropeE = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 8), ropeMat);
      ropeE.rotation.x = Math.PI / 2;
      ropeE.position.set(2.4, h, 0);
      ringGroup.add(ropeE);
    });

    scene.add(ringGroup);
  }

  createShootingTarget(scene, THREE, pos) {
    const g = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d1f, roughness: 0.9 });
    const targetMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.5 });
    const bullseyeMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });

    // Tiang kayu penyangga
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 8), woodMat);
    post.position.y = 0.95;
    post.castShadow = true;
    g.add(post);

    // Papan sasaran lingkaran
    const board = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), targetMat);
    board.position.set(0, 1.4, 0);
    board.rotation.x = Math.PI / 2;
    g.add(board);

    // Lingkaran merah bullseye
    const bull = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.045, 16), bullseyeMat);
    bull.position.set(0, 1.4, 0);
    bull.rotation.x = Math.PI / 2;
    g.add(bull);

    g.position.copy(pos);
    scene.add(g);
  }

  getNearestNPC(playerPos, maxDist = 3.8) {
    if (!playerPos) return null;
    let closest = null;
    let minD = maxDist;
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const d = Math.hypot(npc.root.position.x - playerPos.x, npc.root.position.z - playerPos.z);
      if (d < minD) {
        minD = d;
        closest = { npc, dist: d };
      }
    }
    return closest;
  }

  interactWithNearest(playerPos) {
    const nearby = this.getNearestNPC(playerPos);
    if (!nearby) return null;
    return nearby.npc.talkTo(playerPos);
  }

  update(delta, elapsed, player) {
    const playerPos = player ? player.position : null;
    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].update(delta, elapsed, playerPos);
    }
  }
}

export const npcSystem = new NPCSystemManager();
export function initNPCSystem(scene, THREE, options = {}) {
  npcSystem.init(scene, THREE, options);
  if (typeof window !== 'undefined') {
    window.npcSystem = npcSystem;
  }
}
export function updateNPCSystem(delta, elapsed, player) {
  npcSystem.update(delta, elapsed, player);
}
export function getNearestNPC(playerPos, maxDist) {
  return npcSystem.getNearestNPC(playerPos, maxDist);
}
export function interactWithNearestNPC(playerPos) {
  return npcSystem.interactWithNearest(playerPos);
}
