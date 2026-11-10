// ============================================================================
// DEAD ZONE — VILLAGE NPC CUSTOMER SYSTEM (DESA ASRI)
// Manages NPCs walking back and forth to the Player's Market Stall (tempat jualan),
// browsing items, making purchases, and displaying interactive speech bubbles.
// ============================================================================

import * as THREE from 'three';
import { GameState } from './gameState.js';
import { sound } from './audio.js';

export const NPC_PROFILES = [
  {
    id: 'mang_ujang',
    name: 'Mang Ujang',
    role: 'Pemburu Rimba',
    avatar: '🏹',
    colors: {
      shirt: 0x4a5d4e, // Hijau lumut hutan
      pants: 0x3d312a, // Cokelat tua
      hat: 0xb89758,   // Anyaman jerami
      skin: 0xd4a373   // Kulit sawo matang
    },
    browseQuotes: [
      'Hmm, butuh peluru dan jamu untuk bekal masuk hutan...',
      'Wah, lapak ini punya daging mutan segar!',
      'Mencari perbekalan darurat sebelum gerbang hutan dibuka.'
    ],
    buyQuotes: [
      'Bagus sekali! Saya beli ini, uangnya saya taruh di kasir ya!',
      'Pas sekali harganya! Terima kasih sudah jualan di sini!',
      'Barang mantap! Besok saya mampir lagi ke lapakmu!'
    ],
    homePos: { x: -6, z: 8 },
    wanderPos: { x: -3, z: -8 }
  },
  {
    id: 'bu_siti',
    name: 'Bu Siti',
    role: 'Kolektor Pedesaan',
    avatar: '🧺',
    colors: {
      shirt: 0x9b2226, // Merah marun elegan
      pants: 0x2b2d42, // Biru tua gelap
      hat: 0xae2012,   // Selendang batik merah
      skin: 0xe0b694   // Kulit cerah
    },
    browseQuotes: [
      'Permata hutan dan jamu tradisional di sini lengkap sekali...',
      'Bagus-bagus barang dagangannya! Boleh saya lihat-lihat?',
      'Kiosnya ramai, suasananya jadi hidup!'
    ],
    buyQuotes: [
      'Cantik sekali barang ini! Uang pas saya masukkan ke kotak kasir ya!',
      'Cocok buat persediaan di rumah. Daganganmu laris manis!',
      'Terima kasih, senang bisa belanja di lapak pribadimu!'
    ],
    homePos: { x: 5, z: -10 },
    wanderPos: { x: -8, z: 2 }
  },
  {
    id: 'kang_dimas',
    name: 'Kang Dimas',
    role: 'Prajurit Patroli',
    avatar: '🪖',
    colors: {
      shirt: 0x5c677d, // Abu-abu taktis
      pants: 0x1b263b, // Biru militer gelap
      hat: 0x415a77,   // Baret penjaga
      skin: 0xc68b59   // Kulit sawo matang
    },
    browseQuotes: [
      'Patroli aman. Cek amunisi cadangan di kios pemain dulu...',
      'Perlu ranjau paku dan perbekalan untuk jaga malam.',
      'Lapak ini posisinya pas banget di alun-alun desa.'
    ],
    buyQuotes: [
      'Siap! Amunisi dan perbekalan terbeli, uang saya setor ke kasir!',
      'Sangat membantu pertahanan desa! Terima kasih kawan!',
      'Barang berharga diamankan. Tetap waspada di perbatasan!'
    ],
    homePos: { x: -2, z: 18 },
    wanderPos: { x: 8, z: 12 }
  }
];

export class VillageNPC {
  constructor(profile, parentGroup, stallPosition) {
    this.profile = profile;
    this.name = profile.name;
    this.role = profile.role;
    this.parentGroup = parentGroup;
    this.stallPos = stallPosition || { x: 14.0, z: 0 };

    this.group = new THREE.Group();
    this.walkCycle = Math.random() * Math.PI * 2;
    this.walkSpeed = 2.4; // m/s
    this.state = 'IDLE'; // IDLE | WALKING_TO_STALL | BROWSING | WALKING_AWAY
    this.stateTimer = 4.0 + Math.random() * 6.0;

    this.currentWaypointIndex = 0;
    this.waypoints = [];

    this.buildCharacterMesh();
    this.buildSpeechBubble();

    // Posisi awal di titik asal (homePos)
    this.group.position.set(profile.homePos.x, 0, profile.homePos.z);
    this.parentGroup.add(this.group);
  }

  buildCharacterMesh() {
    const c = this.profile.colors;

    // Material dasar
    const skinMat = new THREE.MeshStandardMaterial({ color: c.skin, roughness: 0.65 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: c.shirt, roughness: 0.75 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: c.pants, roughness: 0.8 });
    const hatMat = new THREE.MeshStandardMaterial({ color: c.hat, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });

    // 1. Badan (Torso)
    const torsoGeom = new THREE.BoxGeometry(0.52, 0.65, 0.32);
    const torso = new THREE.Mesh(torsoGeom, shirtMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.group.add(torso);
    this.torso = torso;

    // Sabuk / Pouch
    const beltGeom = new THREE.BoxGeometry(0.54, 0.1, 0.34);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = 0.75;
    this.group.add(belt);

    // 2. Kepala (Head & Face)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.55;

    const headGeom = new THREE.BoxGeometry(0.32, 0.34, 0.32);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Hidung & Mata
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    eyeL.position.set(-0.08, 0.04, 0.165);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    eyeR.position.set(0.08, 0.04, 0.165);
    headGroup.add(eyeL);
    headGroup.add(eyeR);

    // Topi / Caping Tradisional
    const hatGeom = new THREE.ConeGeometry(0.38, 0.18, 12);
    const hat = new THREE.Mesh(hatGeom, hatMat);
    hat.position.y = 0.23;
    headGroup.add(hat);

    this.group.add(headGroup);
    this.headGroup = headGroup;

    // 3. Lengan Kiri (Left Arm Pivot)
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.34, 1.3, 0);
    const armGeom = new THREE.BoxGeometry(0.14, 0.58, 0.14);
    const leftArm = new THREE.Mesh(armGeom, shirtMat);
    leftArm.position.y = -0.26;
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);
    this.group.add(this.leftArmPivot);

    // 4. Lengan Kanan (Right Arm Pivot)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.34, 1.3, 0);
    const rightArm = new THREE.Mesh(armGeom, shirtMat);
    rightArm.position.y = -0.26;
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);
    this.group.add(this.rightArmPivot);

    // 5. Kaki Kiri (Left Leg Pivot)
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0.72, 0);
    const legGeom = new THREE.BoxGeometry(0.18, 0.65, 0.2);
    const leftLeg = new THREE.Mesh(legGeom, pantsMat);
    leftLeg.position.y = -0.32;
    leftLeg.castShadow = true;
    this.leftLegPivot.add(leftLeg);

    const shoeGeom = new THREE.BoxGeometry(0.19, 0.1, 0.28);
    const shoeL = new THREE.Mesh(shoeGeom, shoeMat);
    shoeL.position.set(0, -0.66, 0.04);
    shoeL.castShadow = true;
    this.leftLegPivot.add(shoeL);
    this.group.add(this.leftLegPivot);

    // 6. Kaki Kanan (Right Leg Pivot)
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0.72, 0);
    const rightLeg = new THREE.Mesh(legGeom, pantsMat);
    rightLeg.position.y = -0.32;
    rightLeg.castShadow = true;
    this.rightLegPivot.add(rightLeg);

    const shoeR = new THREE.Mesh(shoeGeom, shoeMat);
    shoeR.position.set(0, -0.66, 0.04);
    shoeR.castShadow = true;
    this.rightLegPivot.add(shoeR);
    this.group.add(this.rightLegPivot);
  }

  buildSpeechBubble() {
    this.bubbleCanvas = document.createElement('canvas');
    this.bubbleCanvas.width = 512;
    this.bubbleCanvas.height = 140;
    this.bubbleCtx = this.bubbleCanvas.getContext('2d');

    this.bubbleTexture = new THREE.CanvasTexture(this.bubbleCanvas);
    this.bubbleTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.bubbleTexture,
      transparent: true,
      opacity: 0,
      depthTest: false
    });

    this.speechSprite = new THREE.Sprite(spriteMat);
    this.speechSprite.scale.set(3.4, 0.95, 1.0);
    this.speechSprite.position.set(0, 2.25, 0);
    this.group.add(this.speechSprite);

    this.bubbleVisibleTimer = 0;
  }

  showDialogue(text, isPurchase = false) {
    if (!this.bubbleCtx) return;
    const ctx = this.bubbleCtx;
    ctx.clearRect(0, 0, 512, 140);

    // Latar belakang balon dialog bernuansa pedesaan taktis
    ctx.fillStyle = isPurchase ? 'rgba(16, 185, 129, 0.92)' : 'rgba(26, 38, 57, 0.92)';
    ctx.strokeStyle = isPurchase ? '#34d399' : '#d4af37';
    ctx.lineWidth = 4;

    // Rounded rectangle
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.lineTo(512 - r, 6);
    ctx.quadraticCurveTo(512, 6, 512, 6 + r);
    ctx.lineTo(512, 120 - r);
    ctx.quadraticCurveTo(512, 120, 512 - r, 120);
    ctx.lineTo(256 + 18, 120);
    ctx.lineTo(256, 138); // Panah bawah
    ctx.lineTo(256 - 18, 120);
    ctx.lineTo(r, 120);
    ctx.quadraticCurveTo(0, 120, 0, 120 - r);
    ctx.lineTo(0, 6 + r);
    ctx.quadraticCurveTo(0, 6, r, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nama & Ikon Pembeli
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = isPurchase ? '#ecfdf5' : '#f59e0b';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.profile.avatar} ${this.profile.name} (${this.profile.role})`, 22, 38);

    // Teks Dialog
    ctx.font = '20px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 22, 78, 468);

    this.bubbleTexture.needsUpdate = true;
    this.speechSprite.material.opacity = 1.0;
    this.bubbleVisibleTimer = 4.5;
  }

  setWaypoints(pts) {
    this.waypoints = pts;
    this.currentWaypointIndex = 0;
  }

  update(delta) {
    // Perbarui durasi balon dialog
    if (this.bubbleVisibleTimer > 0) {
      this.bubbleVisibleTimer -= delta;
      if (this.bubbleVisibleTimer <= 0.5) {
        this.speechSprite.material.opacity = Math.max(0, this.bubbleVisibleTimer / 0.5);
      }
    }

    switch (this.state) {
      case 'IDLE':
        this.stateTimer -= delta;
        // Pose diam rileks
        this.leftLegPivot.rotation.x = 0;
        this.rightLegPivot.rotation.x = 0;
        this.leftArmPivot.rotation.x = 0;
        this.rightArmPivot.rotation.x = 0;

        if (this.stateTimer <= 0) {
          // Putuskan untuk pergi belanja ke lapak pemain
          this.state = 'WALKING_TO_STALL';
          const stallZOffset = (Math.random() - 0.5) * 2.2;
          this.setWaypoints([
            { x: this.profile.wanderPos.x, z: this.profile.wanderPos.z },
            { x: 3.0, z: stallZOffset * 0.5 },
            { x: this.stallPos.x, z: this.stallPos.z + stallZOffset }
          ]);
        }
        break;

      case 'WALKING_TO_STALL':
        this.updateWalking(delta);
        if (this.currentWaypointIndex >= this.waypoints.length) {
          // Tiba di depan lapak jualan pemain!
          this.state = 'BROWSING';
          this.stateTimer = 5.5 + Math.random() * 2.5;
          // Hadap ke timur (arah meja kios X = 18)
          this.group.rotation.y = -Math.PI / 2;

          // Balon dialog melihat-lihat barang
          const q = this.profile.browseQuotes[Math.floor(Math.random() * this.profile.browseQuotes.length)];
          this.showDialogue(q, false);
          this.hasPurchased = false;
        }
        break;

      case 'BROWSING':
        this.stateTimer -= delta;
        // Animasi kepala mengamati etalase
        this.headGroup.rotation.y = Math.sin(this.stateTimer * 2.0) * 0.25;
        this.leftArmPivot.rotation.x = Math.sin(this.stateTimer * 1.5) * 0.15;
        this.rightArmPivot.rotation.x = -Math.sin(this.stateTimer * 1.5) * 0.15;

        // Saat sisa waktu 2.5 detik, lakukan transaksi belanja!
        if (this.stateTimer <= 2.5 && !this.hasPurchased) {
          this.hasPurchased = true;
          const purchase = GameState.npcPurchaseFromStall(this.profile.name);
          sound.playCoinSound();

          if (purchase.type === 'item') {
            this.showDialogue(`💰 Beli ${purchase.itemName} (${GameState.formatRp(purchase.price)})!`, true);
          } else {
            this.showDialogue(`💰 Beli ${purchase.itemName} (+${GameState.formatRp(purchase.price)} masuk kasir)!`, true);
          }
        }

        if (this.stateTimer <= 0) {
          // Selesai belanja, berjalan pulang ke desa
          this.state = 'WALKING_AWAY';
          this.setWaypoints([
            { x: 4.0, z: (Math.random() - 0.5) * 6 },
            { x: this.profile.homePos.x, z: this.profile.homePos.z }
          ]);
        }
        break;

      case 'WALKING_AWAY':
        this.updateWalking(delta);
        if (this.currentWaypointIndex >= this.waypoints.length) {
          this.state = 'IDLE';
          this.stateTimer = 12.0 + Math.random() * 15.0; // Santai 12-27 detik sebelum belanja lagi
        }
        break;
    }
  }

  updateWalking(delta) {
    if (this.currentWaypointIndex >= this.waypoints.length) return;

    const target = this.waypoints[this.currentWaypointIndex];
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.45) {
      this.currentWaypointIndex++;
      return;
    }

    // Arah hadap (rotasi Y)
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - this.group.rotation.y;
    // Normalisasi -PI ke PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.group.rotation.y += angleDiff * Math.min(1.0, delta * 8.0);

    // Langkah maju
    const step = Math.min(dist, this.walkSpeed * delta);
    this.group.position.x += Math.sin(this.group.rotation.y) * step;
    this.group.position.z += Math.cos(this.group.rotation.y) * step;

    // Animasi locomotion (kaki & tangan berayun alami)
    this.walkCycle += delta * 8.5;
    const legAngle = Math.sin(this.walkCycle) * 0.48;
    this.leftLegPivot.rotation.x = legAngle;
    this.rightLegPivot.rotation.x = -legAngle;

    const armAngle = -Math.sin(this.walkCycle) * 0.38;
    this.leftArmPivot.rotation.x = armAngle;
    this.rightArmPivot.rotation.x = -armAngle;

    // Bobbing vertikal halus
    this.group.position.y = Math.abs(Math.sin(this.walkCycle * 2.0)) * 0.05;
  }
}

export class VillageNPCManager {
  constructor(safeZoneGroup) {
    this.group = new THREE.Group();
    this.group.name = 'VillageNPCGroup';
    safeZoneGroup.add(this.group);

    this.npcs = [];
    this.initNPCs();
  }

  initNPCs() {
    const stallFront = { x: 13.8, z: 0 };
    NPC_PROFILES.forEach((profile, idx) => {
      const npc = new VillageNPC(profile, this.group, stallFront);
      // Buat jeda awal yang berbeda agar kedatangan tidak bersamaan
      npc.stateTimer = 2.0 + idx * 7.5;
      this.npcs.push(npc);
    });
    console.log(`✅ [VILLAGE] ${this.npcs.length} NPC Warga Pembeli siap berbelanja di Lapak Dagang.`);
  }

  update(delta) {
    if (GameState.activeZone !== 'safe_zone') return;
    for (const npc of this.npcs) {
      npc.update(delta);
    }
  }
}
