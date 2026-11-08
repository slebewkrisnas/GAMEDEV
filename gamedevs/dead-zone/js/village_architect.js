// ============================================================================
// VILLAGE ARCHITECT (DESA RIMBA ASRI - SAFE ZONE)
// 100% faithful 3D procedural reconstruction based on reference artwork in:
// asset_dead-zone/
// 1. Rumah Pribadi Pemain (Player House)
// 2. Pande Besi & Senjata (Blacksmith)
// 3. Pondok Tabib & Jamu Herbal (Herbalist Hut)
// 4. Pasar Pengepul Hasil Buruan (Hunter & Game Meat Merchant)
// 5. Gapura Kayu Perbatasan Hutan (Forest Palisade Gate)
// 6. Alun-Alun Tengah Desa (Village Square, Stone Well, Ancient Tree & Notice Board)
// ============================================================================

import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';

export class VillageArchitect {
  constructor(env) {
    this.env = env;
    this.group = env.safeZoneGroup;
    this.colliders = env.safeZoneColliders;
    this.interactables = env.safeZoneInteractables;
    this.lights = env.safeZoneLights;

    // Cache procedural textures & shared materials
    this.initSharedTexturesAndMaterials();
  }

  // --------------------------------------------------------------------------
  // PROCEDURAL TEXTURE GENERATION (FAITHFUL TO 2D ART STYLE)
  // --------------------------------------------------------------------------
  initSharedTexturesAndMaterials() {
    this.textures = {
      woodHorizontal: this.createWoodPlankTexture(false),
      woodVertical: this.createWoodPlankTexture(true),
      roofShingles: this.createDarkShingleRoofTexture(),
      stoneSkirting: this.createStoneSkirtingTexture(),
      cobblestone: this.createCobblestoneTexture(),
      signSmith: this.createSignboardTexture('smith'),
      signHerbalist: this.createSignboardTexture('herbalist'),
      signHunter: this.createSignboardTexture('hunter'),
      signGate: this.createSignboardTexture('gate'),
      noticeBoard: this.createNoticeBoardTexture()
    };

    this.materials = {
      woodHorizontal: new THREE.MeshStandardMaterial({
        map: this.textures.woodHorizontal,
        roughness: 0.85,
        metalness: 0.05
      }),
      woodVertical: new THREE.MeshStandardMaterial({
        map: this.textures.woodVertical,
        roughness: 0.85,
        metalness: 0.05
      }),
      roofShingles: new THREE.MeshStandardMaterial({
        map: this.textures.roofShingles,
        roughness: 0.8,
        metalness: 0.1
      }),
      stoneSkirting: new THREE.MeshStandardMaterial({
        map: this.textures.stoneSkirting,
        roughness: 0.92,
        metalness: 0.05
      }),
      cobblestone: new THREE.MeshStandardMaterial({
        map: this.textures.cobblestone,
        roughness: 0.95
      }),
      timberBeam: new THREE.MeshStandardMaterial({
        color: 0x4a2e1b, // Dark warm oak timber
        roughness: 0.88
      }),
      timberPost: new THREE.MeshStandardMaterial({
        color: 0x3b2213, // Solid log post
        roughness: 0.92
      }),
      ironMetal: new THREE.MeshStandardMaterial({
        color: 0x27272a, // Forged dark iron
        roughness: 0.35,
        metalness: 0.85
      }),
      brassGold: new THREE.MeshStandardMaterial({
        color: 0xd97706, // Antique brass / gold
        roughness: 0.3,
        metalness: 0.8
      }),
      foliageGreen: new THREE.MeshStandardMaterial({
        color: 0x2d6a27, // Rich leaf green
        roughness: 0.9
      }),
      mossGreen: new THREE.MeshStandardMaterial({
        color: 0x3f6212, // Moist moss green
        roughness: 0.95
      }),
      clayTerracotta: new THREE.MeshStandardMaterial({
        color: 0x9a3412, // Terracotta pot
        roughness: 0.8
      }),
      ropeFiber: new THREE.MeshStandardMaterial({
        color: 0xb45309, // Hemp rope
        roughness: 0.95
      }),
      parchmentPaper: new THREE.MeshStandardMaterial({
        color: 0xfef3c7, // Aged yellowed paper
        roughness: 0.95
      }),
      meatRed: new THREE.MeshStandardMaterial({
        color: 0xbe123c, // Fresh dark meat
        roughness: 0.65
      }),
      whiteBone: new THREE.MeshStandardMaterial({
        color: 0xf3f4f6, // Weathered skull bone
        roughness: 0.75
      })
    };
  }

  createWoodPlankTexture(isVertical = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm oak base
    ctx.fillStyle = '#9b6238';
    ctx.fillRect(0, 0, 512, 512);

    const plankSize = 32;
    if (!isVertical) {
      for (let y = 0; y < 512; y += plankSize) {
        ctx.fillStyle = (y / plankSize) % 2 === 0 ? '#b37748' : '#a26a3d';
        ctx.fillRect(0, y, 512, plankSize - 3);

        // Dark shiplap groove
        ctx.fillStyle = '#3a1f11';
        ctx.fillRect(0, y + plankSize - 3, 512, 3);

        // Wood grains
        ctx.strokeStyle = '#85512b';
        ctx.lineWidth = 1;
        for (let g = 0; g < 3; g++) {
          ctx.beginPath();
          const gy = y + 4 + Math.random() * (plankSize - 10);
          ctx.moveTo(0, gy);
          ctx.lineTo(512, gy + (Math.random() - 0.5) * 4);
          ctx.stroke();
        }

        // Nails
        ctx.fillStyle = '#22130c';
        ctx.beginPath();
        ctx.arc(20, y + 14, 2.5, 0, Math.PI * 2);
        ctx.arc(492, y + 14, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      for (let x = 0; x < 512; x += plankSize) {
        ctx.fillStyle = (x / plankSize) % 2 === 0 ? '#b37748' : '#a26a3d';
        ctx.fillRect(x, 0, plankSize - 3, 512);

        // Dark shiplap groove
        ctx.fillStyle = '#3a1f11';
        ctx.fillRect(x + plankSize - 3, 0, 3, 512);

        // Wood grains
        ctx.strokeStyle = '#85512b';
        ctx.lineWidth = 1;
        for (let g = 0; g < 3; g++) {
          ctx.beginPath();
          const gx = x + 4 + Math.random() * (plankSize - 10);
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx + (Math.random() - 0.5) * 4, 512);
          ctx.stroke();
        }

        // Nails
        ctx.fillStyle = '#22130c';
        ctx.beginPath();
        ctx.arc(x + 14, 20, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 14, 492, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(isVertical ? 4 : 3, isVertical ? 3 : 4);
    return tex;
  }

  createDarkShingleRoofTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark greyish-brown slate shingles
    ctx.fillStyle = '#2e2926';
    ctx.fillRect(0, 0, 512, 512);

    const shingleHeight = 28;
    const shingleWidth = 44;

    for (let y = 0; y < 512; y += shingleHeight) {
      const rowIdx = Math.floor(y / shingleHeight);
      const xShift = (rowIdx % 2) * (shingleWidth / 2);

      for (let x = -shingleWidth; x < 512 + shingleWidth; x += shingleWidth) {
        const sx = x + xShift;
        const shade = Math.floor(55 + Math.random() * 25);
        ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 8})`;
        ctx.fillRect(sx, y, shingleWidth - 2, shingleHeight - 3);

        // Overhang shadow
        ctx.fillStyle = '#171412';
        ctx.fillRect(sx, y + shingleHeight - 3, shingleWidth - 2, 3);

        // Highlight upper rim
        ctx.fillStyle = `rgb(${shade + 20}, ${shade + 16}, ${shade + 12})`;
        ctx.fillRect(sx, y, shingleWidth - 2, 1.5);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
  }

  createStoneSkirtingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark earthen mortar
    ctx.fillStyle = '#23201d';
    ctx.fillRect(0, 0, 512, 512);

    const stoneRows = 10;
    const rowH = 512 / stoneRows;

    for (let r = 0; r < stoneRows; r++) {
      const y = r * rowH;
      const stonesInRow = 8 + (r % 2);
      const colW = 512 / stonesInRow;
      const shift = (r % 2) * (colW / 2);

      for (let c = -1; c <= stonesInRow; c++) {
        const x = c * colW + shift;
        const shade = Math.floor(100 + Math.random() * 45);
        ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 8})`;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, colW - 6, rowH - 6, 12);
        ctx.fill();

        // Stone shadow & highlight
        ctx.strokeStyle = `rgb(${shade + 25}, ${shade + 22}, ${shade + 18})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }

  createCobblestoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#221f1d';
    ctx.fillRect(0, 0, 512, 512);

    const stoneSize = 36;
    for (let y = 4; y < 512; y += stoneSize) {
      const rowShift = ((y / stoneSize) % 2) * (stoneSize / 2);
      for (let x = -stoneSize; x < 512 + stoneSize; x += stoneSize) {
        const sx = x + rowShift;
        const shade = Math.floor(95 + Math.random() * 45);
        ctx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 10})`;
        ctx.beginPath();
        ctx.roundRect(sx + 3, y + 3, stoneSize - 6, stoneSize - 6, 10);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  createSignboardTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Weathered warm oak wood plaque
    ctx.fillStyle = '#8b5a36';
    ctx.fillRect(0, 0, 512, 256);

    // Carved dark border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#3e2010';
    ctx.strokeRect(10, 10, 492, 236);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d79965';
    ctx.strokeRect(20, 20, 472, 216);

    ctx.fillStyle = '#261307';
    ctx.strokeStyle = '#261307';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'smith') {
      // Crossed Hammer and Sword
      ctx.save();
      ctx.translate(256, 128);

      // Sword
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(-8, -80, 16, 110); // Blade
      ctx.beginPath();
      ctx.moveTo(-8, -80);
      ctx.lineTo(0, -100);
      ctx.lineTo(8, -80);
      ctx.fill();
      ctx.fillStyle = '#71717a'; // Crossguard
      ctx.fillRect(-24, 30, 48, 8);
      ctx.fillStyle = '#3f3f46'; // Pommel
      ctx.beginPath();
      ctx.arc(0, 50, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Blacksmith Hammer
      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#a16207'; // Wooden handle
      ctx.fillRect(-6, -40, 12, 90);
      ctx.fillStyle = '#3f3f46'; // Hammer head
      ctx.fillRect(-22, -68, 44, 28);
      ctx.restore();

      ctx.restore();
    } else if (type === 'herbalist') {
      // Mortar & Pestle flanked by leaf and potion bottle
      ctx.save();
      ctx.translate(256, 128);

      // Mortar (Mangkuk Lumpang)
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.arc(0, 20, 36, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(-38, 14, 76, 8);

      // Pestle (Alu)
      ctx.save();
      ctx.rotate(0.4);
      ctx.fillStyle = '#71717a';
      ctx.fillRect(-8, -45, 16, 60);
      ctx.beginPath();
      ctx.arc(0, -45, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Left Leaves
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(-90, 0, 30, 16, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-75, -35, 26, 14, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Right Potion Bottle
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(85, 20, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(77, -15, 16, 20); // Neck
      ctx.fillStyle = '#b45309'; // Cork
      ctx.fillRect(75, -24, 20, 9);

      ctx.restore();
    } else if (type === 'hunter') {
      // Antlers and Hunting Bow
      ctx.save();
      ctx.translate(256, 128);

      // Antlers
      ctx.strokeStyle = '#3e2010';
      ctx.lineWidth = 10;
      // Left branch
      ctx.beginPath();
      ctx.moveTo(-15, 30);
      ctx.bezierCurveTo(-40, 0, -80, -20, -70, -70);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-50, -10);
      ctx.lineTo(-40, -50);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-60, -35);
      ctx.lineTo(-95, -45);
      ctx.stroke();

      // Right branch
      ctx.beginPath();
      ctx.moveTo(15, 30);
      ctx.bezierCurveTo(40, 0, 80, -20, 70, -70);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(50, -10);
      ctx.lineTo(40, -50);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(60, -35);
      ctx.lineTo(95, -45);
      ctx.stroke();

      // Bow
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 55, 60, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();

      ctx.restore();
    } else if (type === 'gate') {
      // Ancient Oak Tree flanked by oak leaves
      ctx.save();
      ctx.translate(256, 128);

      ctx.fillStyle = '#261307';
      // Tree trunk
      ctx.fillRect(-12, -10, 24, 60);
      // Roots
      ctx.beginPath();
      ctx.moveTo(-12, 50);
      ctx.lineTo(-35, 70);
      ctx.lineTo(-12, 40);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 50);
      ctx.lineTo(35, 70);
      ctx.lineTo(12, 40);
      ctx.fill();

      // Canopy
      ctx.beginPath();
      ctx.arc(0, -35, 45, 0, Math.PI * 2);
      ctx.arc(-30, -20, 32, 0, Math.PI * 2);
      ctx.arc(30, -20, 32, 0, Math.PI * 2);
      ctx.fill();

      // Side leaves
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(-110, 10, 34, 18, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(110, 10, 34, 18, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  createNoticeBoardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Wood panel backing
    ctx.fillStyle = '#784323';
    ctx.fillRect(0, 0, 512, 512);

    // Parchment Map in center
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(90, 70, 332, 240);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#b45309';
    ctx.strokeRect(90, 70, 332, 240);

    // Island / forest map contours
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.ellipse(256, 190, 110, 75, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Red X marker
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(270, 160); ctx.lineTo(290, 180);
    ctx.moveTo(290, 160); ctx.lineTo(270, 180);
    ctx.stroke();

    // Pinned notices around map
    const notes = [
      { x: 30, y: 80, w: 50, h: 70 },
      { x: 30, y: 170, w: 50, h: 80 },
      { x: 30, y: 270, w: 50, h: 65 },
      { x: 430, y: 90, w: 52, h: 75 },
      { x: 430, y: 190, w: 52, h: 85 },
      { x: 120, y: 340, w: 75, h: 90 },
      { x: 230, y: 340, w: 85, h: 95 },
      { x: 340, y: 340, w: 75, h: 90 }
    ];

    notes.forEach((n, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#fef3c7' : '#fef9c3';
      ctx.fillRect(n.x, n.y, n.w, n.h);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.strokeRect(n.x, n.y, n.w, n.h);

      // Pseudo text lines
      ctx.fillStyle = '#78350f';
      for (let l = 12; l < n.h - 10; l += 8) {
        ctx.fillRect(n.x + 6, n.y + l, n.w - 12, 2);
      }

      // Pin
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(n.x + n.w / 2, n.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // --------------------------------------------------------------------------
  // REUSABLE ARCHITECTURAL SUB-COMPONENTS
  // --------------------------------------------------------------------------

  // 1. Tumpukan Kayu Bakar Silindris
  createChoppedFirewoodStack(x, y, z) {
    const stack = new THREE.Group();
    stack.position.set(x, y, z);

    const logGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.95 });

    const rows = [
      { count: 4, y: 0.14, zBase: -0.45 },
      { count: 3, y: 0.38, zBase: -0.3 },
      { count: 2, y: 0.62, zBase: -0.15 }
    ];

    rows.forEach(r => {
      for (let i = 0; i < r.count; i++) {
        const log = new THREE.Mesh(logGeo, logMat);
        log.rotation.z = Math.PI / 2;
        log.position.set(0, r.y, r.zBase + i * 0.3);
        stack.add(log);
      }
    });

    return stack;
  }

  // 2. Kotak Bunga Kayu dengan Bunga Warna-Warni
  createWindowFlowerBox(x, y, z, width = 1.6) {
    const boxGroup = new THREE.Group();
    boxGroup.position.set(x, y, z);

    // Wooden planter trough
    const boxGeo = new THREE.BoxGeometry(width, 0.35, 0.45);
    const box = new THREE.Mesh(boxGeo, this.materials.timberBeam);
    boxGroup.add(box);

    // Soil
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, 0.08, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x24140b, roughness: 0.98 })
    );
    soil.position.y = 0.15;
    boxGroup.add(soil);

    // Dense leaves & colorful blossoms (Pink, Yellow, Purple, White)
    const flowerColors = [0xec4899, 0xfacc15, 0xa855f7, 0xf8fafc, 0xf43f5e];
    const blossomCount = Math.floor(width * 6);

    for (let i = 0; i < blossomCount; i++) {
      const fx = -((width - 0.2) / 2) + Math.random() * (width - 0.2);
      const fz = (Math.random() - 0.5) * 0.25;
      const fy = 0.22 + Math.random() * 0.12;

      // Leaf bud
      const leaf = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12),
        this.materials.foliageGreen
      );
      leaf.position.set(fx, fy - 0.05, fz);
      boxGroup.add(leaf);

      // Blossom petal
      const col = flowerColors[i % flowerColors.length];
      const blossomMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
      const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), blossomMat);
      blossom.position.set(fx, fy + 0.06, fz);
      boxGroup.add(blossom);
    }

    return boxGroup;
  }

  // 3. Lentera Dinding Pedesaan Menyala
  createWallLantern(x, y, z, rotY = 0) {
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(x, y, z);
    lanternGroup.rotation.y = rotY;

    // Iron Wall Mount Bracket
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.4, 0.4),
      this.materials.ironMetal
    );
    bracket.position.set(0, 0, -0.2);
    lanternGroup.add(bracket);

    // Lantern Body (Glass & Iron cap)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 4), this.materials.ironMetal);
    cap.position.y = 0.12;
    lanternGroup.add(cap);

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.32, 6),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85
      })
    );
    glass.position.y = -0.1;
    lanternGroup.add(glass);

    const light = new THREE.PointLight(0xffa500, 1.2, 9);
    light.position.set(0, -0.05, 0);
    lanternGroup.add(light);

    return lanternGroup;
  }

  // 4. Batu Pijakan Alam (Stepping Stones)
  createSteppingStones(x, zStart, zEnd, count = 4) {
    const group = new THREE.Group();
    const stoneGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.1, 7);
    const zStep = (zEnd - zStart) / (count - 1);

    for (let i = 0; i < count; i++) {
      const stone = new THREE.Mesh(stoneGeo, this.materials.cobblestone);
      stone.position.set(x + (Math.random() - 0.5) * 0.25, 0.05, zStart + i * zStep);
      stone.rotation.y = Math.random() * Math.PI;
      group.add(stone);
    }
    return group;
  }

  // 5. Semak Belukar & Rumput di Bawah Dek
  createDecorativeBushes(x, y, z, width = 6) {
    const bushGroup = new THREE.Group();
    bushGroup.position.set(x, y, z);

    const bushMat = this.materials.foliageGreen;
    const count = Math.floor(width * 2);

    for (let i = 0; i < count; i++) {
      const bx = -((width - 0.5) / 2) + Math.random() * (width - 0.5);
      const bz = (Math.random() - 0.5) * 0.6;
      const scale = 0.3 + Math.random() * 0.35;

      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(scale), bushMat);
      bush.position.set(bx, scale * 0.75, bz);
      bushGroup.add(bush);
    }
    return bushGroup;
  }

  // 6. Tangga Kayu 3 Anak Tangga
  createWoodenStairs(width = 2.4, height = 0.65, depth = 1.2) {
    const stairsGroup = new THREE.Group();
    const stepH = height / 3;
    const stepD = depth / 3;

    for (let i = 0; i < 3; i++) {
      const stepGeo = new THREE.BoxGeometry(width, stepH, depth - i * stepD);
      const step = new THREE.Mesh(stepGeo, this.materials.timberBeam);
      step.position.set(0, (i + 0.5) * stepH, -(i * stepD) / 2);
      stairsGroup.add(step);
    }
    return stairsGroup;
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 1: RUMAH PEMAIN (3D GLB - House+Model+004.glb)
  // --------------------------------------------------------------------------
  loadHouseModel(x = 0, z = -18) {
    // 1. Daftarkan Box Collider segera agar tabrakan fisik bekerja tanpa jeda loading
    // Collider mencakup dinding utama rumah, menyisakan beranda depan agar pemain leluasa
    const houseCollider = new THREE.Box3(
      new THREE.Vector3(x - 6.2, 0, z - 5.5),
      new THREE.Vector3(x + 6.2, 7.0, z + 3.8)
    );
    this.colliders.push(houseCollider);

    // 2. Daftarkan Titik Interaksi di Beranda Depan Rumah
    this.interactables.push({
      id: 'stash',
      type: 'stash',
      position: new THREE.Vector3(x - 2.2, 1.0, z + 4.8),
      radius: 3.5,
      label: 'Peti Kayu Stash (Penyimpanan Aman) [E]'
    });

    this.interactables.push({
      id: 'house_terminal',
      type: 'house',
      position: new THREE.Vector3(x + 2.2, 1.0, z + 4.8),
      radius: 3.5,
      label: 'Papan Desa (Upgrade Rumah Pedesaan) [E]'
    });

    // 3. Lentera Beranda Menyala Hangat
    const porchLight = new THREE.PointLight(0xffb74d, 1.3, 14);
    porchLight.position.set(x, 2.8, z + 4.8);
    this.lights.add(porchLight);

    // 4. Muat Model 3D GLB
    const loader = new GLTFLoader();
    loader.load(
      encodeURI('./asset dead-zone/house/House+Model+004.glb'),
      (gltf) => {
        const model = gltf.scene;
        model.position.set(x, 0, z);
        model.rotation.y = 0; // Menghadap ke arah depan / alun-alun desa (+Z)
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = Math.max(child.material.roughness || 0.5, 0.65);
            }
          }
        });
        this.group.add(model);
        console.log('✅ [VILLAGE] House Model 004 GLB berhasil dimuat.');
      },
      undefined,
      (err) => {
        console.error('❌ [VILLAGE] Gagal memuat House Model 004 GLB:', err);
      }
    );
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 2: TOKO SERBA ADA DESA (3D GLB - pan_shop.glb)
  // Menyatukan Armory (Senjata/Peluru), Tabib Medbay (Obat/Jamu), dan Pengepul (Jual Rongsokan)
  // --------------------------------------------------------------------------
  loadShopModel(x = -18, z = 0) {
    // 1. Daftarkan Box Collider fisik segera
    const shopCollider = new THREE.Box3(
      new THREE.Vector3(x - 5.5, 0, z - 7.5),
      new THREE.Vector3(x + 3.2, 6.0, z + 7.5)
    );
    this.colliders.push(shopCollider);

    // 2. Daftarkan Kios Interaksi Tunggal di Depan Meja Toko (Toko Serba Ada)
    this.interactables.push({
      id: 'general_store',
      type: 'general_store',
      position: new THREE.Vector3(x + 4.0, 1.2, z),
      radius: 5.5,
      label: '🏪 Toko Serba Ada (Beli Senjata, Amunisi, Jamu & Jual Jarahan) [E]'
    });

    // 3. Pencahayaan Toko & Kios
    const shopLight1 = new THREE.PointLight(0xffe082, 1.5, 14);
    shopLight1.position.set(x + 2.8, 2.8, z - 2.8);
    this.lights.add(shopLight1);

    const shopLight2 = new THREE.PointLight(0xffe082, 1.5, 14);
    shopLight2.position.set(x + 2.8, 2.8, z + 2.8);
    this.lights.add(shopLight2);

    // 4. Muat Model 3D GLB
    const loader = new GLTFLoader();
    loader.load(
      encodeURI('./asset dead-zone/shop/pan_shop.glb'),
      (gltf) => {
        const model = gltf.scene;
        model.position.set(x, 0, z);
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = Math.max(child.material.roughness || 0.5, 0.65);
            }
          }
        });
        this.group.add(model);
        console.log('✅ [VILLAGE] Pan Shop GLB berhasil dimuat.');
      },
      undefined,
      (err) => {
        console.error('❌ [VILLAGE] Gagal memuat Pan Shop GLB:', err);
      }
    );
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 1: RUMAH PRIBADI PEMAIN (PLAYER HOUSE - LEGACY)
  // --------------------------------------------------------------------------
  buildPlayerHouse(x, z) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);

    // Dimensi: Lebar 9.6m, Dalam 7.2m, Tinggi Dinding 3.8m, Tinggi Atap Puncak 7.4m
    const width = 9.6;
    const depth = 7.2;
    const wallH = 3.6;
    const porchD = 2.6;
    const stiltH = 0.65;

    // 1. Tiang-tiang Panggung Kayu (Timber Stilts)
    const stiltGeo = new THREE.CylinderGeometry(0.2, 0.24, stiltH, 6);
    const stiltPositions = [
      [-width / 2 + 0.4, -depth / 2 + 0.4],
      [width / 2 - 0.4, -depth / 2 + 0.4],
      [-width / 2 + 0.4, depth / 2 - 0.4],
      [width / 2 - 0.4, depth / 2 - 0.4],
      [0, -depth / 2 + 0.4],
      [0, depth / 2 - 0.4],
      // Porch stilts
      [-width / 2 + 0.4, depth / 2 + porchD - 0.4],
      [width / 2 - 0.4, depth / 2 + porchD - 0.4],
      [0, depth / 2 + porchD - 0.4]
    ];
    stiltPositions.forEach(([sx, sz]) => {
      const stilt = new THREE.Mesh(stiltGeo, this.materials.timberPost);
      stilt.position.set(sx, stiltH / 2, sz);
      house.add(stilt);
    });

    // 2. Dek Lantai Panggung Kayu (Utama + Teras Depan)
    const totalD = depth + porchD;
    const floorGeo = new THREE.BoxGeometry(width, 0.22, totalD);
    const floor = new THREE.Mesh(floorGeo, this.materials.woodHorizontal);
    floor.position.set(0, stiltH + 0.11, porchD / 2);
    house.add(floor);

    // 3. Dinding Rumah Utama (Papan Kayu Horizontal)
    const bodyGeo = new THREE.BoxGeometry(width - 0.4, wallH, depth - 0.4);
    const body = new THREE.Mesh(bodyGeo, this.materials.woodHorizontal);
    body.position.set(0, stiltH + 0.22 + wallH / 2, 0);
    body.castShadow = true;
    house.add(body);

    // 4. Balok Horizontal Pemisah di Ketinggian Atas Dinding
    const rimBeam = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.2, 0.35, depth + 0.2),
      this.materials.timberBeam
    );
    rimBeam.position.set(0, stiltH + 0.22 + wallH, 0);
    house.add(rimBeam);

    // 5. Segitiga Gable Depan & Belakang (Papan Kayu Vertikal)
    const gableH = 3.4;
    const gableGeo = new THREE.ConeGeometry(width / 2, gableH, 4);
    const gableFront = new THREE.Mesh(gableGeo, this.materials.woodVertical);
    gableFront.position.set(0, stiltH + 0.22 + wallH + gableH / 2, 0);
    gableFront.rotation.y = Math.PI / 4;
    house.add(gableFront);

    // 6. Atap Pelana Segitiga Runcing (Overlapping Slate Shingles)
    const roofSlopeL = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.32, depth + 1.2),
      this.materials.roofShingles
    );
    roofSlopeL.position.set(-2.4, stiltH + wallH + 1.9, 0);
    roofSlopeL.rotation.z = Math.PI * 0.19;
    roofSlopeL.castShadow = true;
    house.add(roofSlopeL);

    const roofSlopeR = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.32, depth + 1.2),
      this.materials.roofShingles
    );
    roofSlopeR.position.set(2.4, stiltH + wallH + 1.9, 0);
    roofSlopeR.rotation.z = -Math.PI * 0.19;
    roofSlopeR.castShadow = true;
    house.add(roofSlopeR);

    // Ridge beam at apex
    const ridgeBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, depth + 1.3),
      this.materials.timberBeam
    );
    ridgeBeam.position.set(0, stiltH + wallH + gableH + 0.1, 0);
    house.add(ridgeBeam);

    // 7. Pintu Depan dengan Kusen & Gagang Pintu
    const frontZ = depth / 2 - 0.18;
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.9, 0.15),
      this.materials.timberBeam
    );
    doorFrame.position.set(0, stiltH + 0.22 + 1.45, frontZ);
    house.add(doorFrame);

    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.6, 0.1),
      this.materials.woodVertical
    );
    doorLeaf.position.set(0, stiltH + 0.22 + 1.4, frontZ + 0.05);
    house.add(doorLeaf);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), this.materials.ironMetal);
    handle.position.set(0.65, stiltH + 0.22 + 1.35, frontZ + 0.12);
    house.add(handle);

    // 8. Dua Jendela Kotak dengan Salib Bingkai Kayu & Kotak Bunga
    const winGeo = new THREE.BoxGeometry(1.6, 1.5, 0.1);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.2 });

    // Left Window
    const winL = new THREE.Mesh(winGeo, glassMat);
    winL.position.set(-2.8, stiltH + 0.22 + 2.0, frontZ);
    house.add(winL);
    house.add(this.createWindowFlowerBox(-2.8, stiltH + 0.22 + 1.1, frontZ + 0.2, 1.8));

    // Right Window
    const winR = new THREE.Mesh(winGeo, glassMat);
    winR.position.set(2.8, stiltH + 0.22 + 2.0, frontZ);
    house.add(winR);
    house.add(this.createWindowFlowerBox(2.8, stiltH + 0.22 + 1.1, frontZ + 0.2, 1.8));

    // 9. Lentera Dinding Menyala di Kiri Pintu
    house.add(this.createWallLantern(-1.3, stiltH + 0.22 + 2.2, frontZ + 0.2));

    // 10. Tangga 3 Anak Tangga di Depan Teras
    const stairs = this.createWoodenStairs(2.4, stiltH, 1.1);
    stairs.position.set(0, 0, depth / 2 + porchD + 0.55);
    house.add(stairs);

    // 11. Potongan Balok Kayu Bertingkat di Sebelah Kiri Tangga
    const log1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.9), this.materials.timberBeam);
    log1.position.set(-1.8, 0.12, depth / 2 + porchD + 0.3);
    house.add(log1);
    const log2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.9), this.materials.timberBeam);
    log2.position.set(-2.2, 0.22, depth / 2 + porchD + 0.3);
    house.add(log2);

    // 12. Tumpukan Kayu Bakar di Teras Kiri Depan
    house.add(this.createChoppedFirewoodStack(-3.4, stiltH + 0.22, depth / 2 + 1.0));

    // 13. Semak & Tanaman Hias di Bawah Teras
    house.add(this.createDecorativeBushes(0, 0, depth / 2 + porchD - 0.2, width));

    // 14. Batu Pijakan Alam Menuju Jalan Setapak
    house.add(this.createSteppingStones(0, depth / 2 + porchD + 1.2, depth / 2 + porchD + 3.2, 3));

    // 15. Props Fungsional: Peti Kayu Stash & Papan Renovasi
    // Peti Kayu Stash
    const stashGeo = new THREE.BoxGeometry(1.6, 1.0, 1.1);
    const stash = new THREE.Mesh(stashGeo, this.materials.timberBeam);
    stash.position.set(-1.8, stiltH + 0.22 + 0.5, depth / 2 + 1.2);
    house.add(stash);
    // Besi strap & gembok
    const strap = new THREE.Mesh(new THREE.BoxGeometry(1.64, 1.02, 0.12), this.materials.ironMetal);
    strap.position.set(-1.8, stiltH + 0.22 + 0.5, depth / 2 + 1.2);
    house.add(strap);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.14), this.materials.brassGold);
    lock.position.set(-1.0, stiltH + 0.22 + 0.5, depth / 2 + 1.2);
    house.add(lock);

    // Papan Renovasi Rumah
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.1), this.materials.timberBeam);
    signBoard.position.set(1.8, stiltH + 0.22 + 1.2, depth / 2 + 1.2);
    house.add(signBoard);
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), this.materials.timberPost);
    signPole.position.set(1.8, stiltH + 0.22 + 0.7, depth / 2 + 1.2);
    house.add(signPole);

    this.group.add(house);

    // Colliders (Badan rumah & Teras)
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallH / 2 + stiltH, z),
      new THREE.Vector3(width, wallH + stiltH, depth)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, stiltH / 2, z + depth / 2 + porchD / 2),
      new THREE.Vector3(width, stiltH, porchD)
    ));

    // Interactables
    this.interactables.push({
      id: 'stash',
      type: 'stash',
      position: new THREE.Vector3(x - 1.8, stiltH + 1.0, z + depth / 2 + 1.2),
      radius: 3.2,
      label: 'Peti Kayu Stash (Penyimpanan Aman) [E]'
    });

    this.interactables.push({
      id: 'house_terminal',
      type: 'house',
      position: new THREE.Vector3(x + 1.8, stiltH + 1.0, z + depth / 2 + 1.2),
      radius: 3.2,
      label: 'Papan Desa (Upgrade Rumah Pedesaan) [E]'
    });
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 2: PANDE BESI & SENJATA (BLACKSMITH)
  // --------------------------------------------------------------------------
  buildBlacksmith(x, z) {
    const smith = new THREE.Group();
    smith.position.set(x, 0, z);

    const width = 9.0;
    const depth = 6.8;
    const wallH = 3.6;
    const porchD = 2.4;
    const stiltH = 0.65;

    // 1. Fondasi Bawah Batu Alam Kali (Cobblestone Skirting)
    const stoneBase = new THREE.Mesh(
      new THREE.BoxGeometry(width, 1.1, depth + porchD),
      this.materials.stoneSkirting
    );
    stoneBase.position.set(0, 0.55, porchD / 2);
    smith.add(stoneBase);

    // 2. Dek Teras Lantai Kayu di Atas Fondasi Batu
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.18, depth + porchD),
      this.materials.woodHorizontal
    );
    floor.position.set(0, 1.15, porchD / 2);
    smith.add(floor);

    // 3. Dinding Atas Kayu Horizontal
    const upperWall = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.4, wallH - 0.8, depth - 0.4),
      this.materials.woodHorizontal
    );
    upperWall.position.set(0, 1.15 + (wallH - 0.8) / 2, 0);
    upperWall.castShadow = true;
    smith.add(upperWall);

    // 4. Segitiga Gable dengan Plang Palu & Pedang Bersilang
    const gableH = 3.2;
    const gable = new THREE.Mesh(
      new THREE.ConeGeometry(width / 2, gableH, 4),
      this.materials.woodVertical
    );
    gable.position.set(0, 1.15 + wallH - 0.8 + gableH / 2, 0);
    gable.rotation.y = Math.PI / 4;
    smith.add(gable);

    // Plang Palu & Pedang Bersilang di Gable Depan
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.5, 0.15),
      new THREE.MeshStandardMaterial({ map: this.textures.signSmith, roughness: 0.7 })
    );
    signBoard.position.set(0, 1.15 + wallH + 0.8, depth / 2 + 0.05);
    smith.add(signBoard);

    // 5. Atap Pelana Genteng Sirap Slate
    const roofL = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.3, depth + 1.1),
      this.materials.roofShingles
    );
    roofL.position.set(-2.2, 1.15 + wallH + 1.6, 0);
    roofL.rotation.z = Math.PI * 0.19;
    smith.add(roofL);

    const roofR = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.3, depth + 1.1),
      this.materials.roofShingles
    );
    roofR.position.set(2.2, 1.15 + wallH + 1.6, 0);
    roofR.rotation.z = -Math.PI * 0.19;
    smith.add(roofR);

    // 6. Pintu, Jendela & Kotak Bunga
    const frontZ = depth / 2 - 0.15;
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.1), this.materials.woodVertical);
    door.position.set(0, 1.15 + 1.25, frontZ);
    smith.add(door);

    const winGeo = new THREE.BoxGeometry(1.5, 1.4, 0.1);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
    const winL = new THREE.Mesh(winGeo, glassMat); winL.position.set(-2.6, 1.15 + 1.8, frontZ); smith.add(winL);
    smith.add(this.createWindowFlowerBox(-2.6, 1.15 + 0.95, frontZ + 0.2, 1.6));
    const winR = new THREE.Mesh(winGeo, glassMat); winR.position.set(2.6, 1.15 + 1.8, frontZ); smith.add(winR);
    smith.add(this.createWindowFlowerBox(2.6, 1.15 + 0.95, frontZ + 0.2, 1.6));

    smith.add(this.createWallLantern(-1.2, 1.15 + 2.0, frontZ + 0.2));
    const stairs = this.createWoodenStairs(2.2, 1.15, 1.2);
    stairs.position.set(0, 0, depth / 2 + porchD + 0.6);
    smith.add(stairs);
    smith.add(this.createSteppingStones(0, depth / 2 + porchD + 1.2, depth / 2 + porchD + 3.0, 3));

    // 7. SAYAP KIRI: AREA TEMPA TERBUKA & TUNGKU BATU (OUTDOOR FORGE)
    const forgeWingX = -width / 2 - 2.2;
    // Slanted side roof over forge
    const forgeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.25, 4.8),
      this.materials.roofShingles
    );
    forgeRoof.position.set(forgeWingX, 3.4, 0.5);
    forgeRoof.rotation.z = Math.PI * 0.15;
    smith.add(forgeRoof);

    // Arched Stone Forge Oven
    const ovenBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 2.8),
      this.materials.stoneSkirting
    );
    ovenBase.position.set(forgeWingX, 0.9, 0.5);
    smith.add(ovenBase);

    // Glowing Fire Cavity (Bara Api Merah Oranye)
    const fireCavity = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.9, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff4500,
        emissiveIntensity: 1.8
      })
    );
    fireCavity.rotation.z = Math.PI / 2;
    fireCavity.position.set(forgeWingX, 1.2, 1.9);
    smith.add(fireCavity);

    // Forge Glowing Fire Light
    const forgeLight = new THREE.PointLight(0xff4500, 2.0, 12);
    forgeLight.position.set(forgeWingX, 1.6, 2.2);
    smith.add(forgeLight);

    // Wood logs beneath oven
    smith.add(this.createChoppedFirewoodStack(forgeWingX, 0, 1.8));

    // Cerobong Batu Tinggi (Stone Chimney)
    const chimGeo = new THREE.BoxGeometry(1.6, 6.8, 1.6);
    const chim = new THREE.Mesh(chimGeo, this.materials.stoneSkirting);
    chim.position.set(forgeWingX, 4.4, -0.6);
    smith.add(chim);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 2.0), this.materials.timberBeam);
    chimCap.position.set(forgeWingX, 7.8, -0.6);
    smith.add(chimCap);

    // Landasan Besi (Anvil) on Tree Stump
    const stump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.85, 10),
      this.materials.timberPost
    );
    stump.position.set(forgeWingX, 0.425, 3.2);
    smith.add(stump);

    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.4), this.materials.ironMetal);
    anvil.position.set(forgeWingX, 0.95, 3.2);
    smith.add(anvil);
    // Anvil horn
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), this.materials.ironMetal);
    horn.rotation.z = Math.PI / 2;
    horn.position.set(forgeWingX - 0.5, 1.05, 3.2);
    smith.add(horn);
    // Small smithing hammer on anvil
    const smithHam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.14), this.materials.ironMetal);
    smithHam.position.set(forgeWingX + 0.1, 1.25, 3.2);
    smith.add(smithHam);

    // Water Quenching Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 1.0, 10), this.materials.timberPost);
    barrel.position.set(forgeWingX - 1.2, 0.5, 3.2);
    smith.add(barrel);
    const barrelWater = new THREE.Mesh(
      new THREE.CircleGeometry(0.44, 10),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 })
    );
    barrelWater.rotation.x = -Math.PI / 2;
    barrelWater.position.set(forgeWingX - 1.2, 0.98, 3.2);
    smith.add(barrelWater);

    // Tools resting on porch (Sledgehammer, tongs, chisel)
    const sledHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), this.materials.timberPost);
    sledHandle.rotation.z = 0.2;
    sledHandle.position.set(-width / 2 + 0.3, 0.75, depth / 2 + porchD);
    smith.add(sledHandle);
    const sledHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.22), this.materials.ironMetal);
    sledHead.position.set(-width / 2 + 0.15, 0.15, depth / 2 + porchD);
    smith.add(sledHead);

    // 8. SAYAP KANAN: DISPLAY SENJATA & ZIRAH (WEAPON RACK)
    const rackX = width / 2 + 2.0;
    // Wooden weapon rack frame
    const rackPostL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), this.materials.timberPost);
    rackPostL.position.set(rackX - 1.2, 1.1, 1.8); smith.add(rackPostL);
    const rackPostR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), this.materials.timberPost);
    rackPostR.position.set(rackX + 1.2, 1.1, 1.8); smith.add(rackPostR);
    const rackBar1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), this.materials.timberBeam);
    rackBar1.position.set(rackX, 0.8, 1.8); smith.add(rackBar1);
    const rackBar2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), this.materials.timberBeam);
    rackBar2.position.set(rackX, 1.6, 1.8); smith.add(rackBar2);

    // Swords on rack
    for (let sw = -0.7; sw <= 0.7; sw += 0.5) {
      const swBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.03), this.materials.ironMetal);
      swBlade.position.set(rackX + sw, 1.2, 1.85);
      smith.add(swBlade);
    }

    // Plate Armor Chestpiece on rack
    const armorChest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), this.materials.ironMetal);
    armorChest.position.set(rackX + 0.6, 1.3, 1.9);
    smith.add(armorChest);

    // Spear leaning on rack
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), this.materials.timberPost);
    spearShaft.rotation.z = -0.2;
    spearShaft.position.set(rackX + 1.6, 1.3, 1.8);
    smith.add(spearShaft);
    const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), this.materials.ironMetal);
    spearTip.rotation.z = -0.2;
    spearTip.position.set(rackX + 1.85, 2.5, 1.8);
    smith.add(spearTip);

    // Round Iron Shield on ground
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 14), this.materials.ironMetal);
    shield.rotation.x = Math.PI / 2.3;
    shield.position.set(rackX + 1.4, 0.6, 2.5);
    smith.add(shield);
    const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.materials.brassGold);
    shieldBoss.position.set(rackX + 1.4, 0.65, 2.55);
    smith.add(shieldBoss);

    // Battle Axe
    const axeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), this.materials.timberPost);
    axeShaft.rotation.z = 0.25;
    axeShaft.position.set(rackX - 1.6, 0.9, 2.2);
    smith.add(axeShaft);
    const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.06), this.materials.ironMetal);
    axeBlade.position.set(rackX - 1.8, 1.6, 2.2);
    smith.add(axeBlade);

    // Coal pile & Iron Ingots on ground
    const coal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.6),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 })
    );
    coal.position.set(width / 2 - 0.5, 0.35, depth / 2 + porchD + 0.3);
    smith.add(coal);

    this.group.add(smith);

    // Solid Colliders
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallH / 2, z),
      new THREE.Vector3(width + 4.5, wallH, depth + porchD)
    ));

    // Interactable
    this.interactables.push({
      id: 'armory',
      type: 'armory',
      position: new THREE.Vector3(x, 1.2, z + depth / 2 + porchD),
      radius: 3.5,
      label: 'Pande Besi (Beli Peluru, Senjata & Tas) [E]'
    });
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 3: PONDOK TABIB & JAMU HERBAL (HERBALIST HUT)
  // --------------------------------------------------------------------------
  buildHerbalistHut(x, z) {
    const hut = new THREE.Group();
    hut.position.set(x, 0, z);

    const width = 9.0;
    const depth = 6.8;
    const wallH = 3.6;
    const porchD = 2.4;
    const stiltH = 0.65;

    // 1. Panggung Kayu & Teras
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.2, depth + porchD),
      this.materials.woodHorizontal
    );
    floor.position.set(0, stiltH, porchD / 2);
    hut.add(floor);

    // 2. Dinding Kabin Kayu Horizontal
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.4, wallH, depth - 0.4),
      this.materials.woodHorizontal
    );
    body.position.set(0, stiltH + wallH / 2, 0);
    body.castShadow = true;
    hut.add(body);

    // 3. Gable & Plang Lumpang Alu Obat
    const gableH = 3.2;
    const gable = new THREE.Mesh(
      new THREE.ConeGeometry(width / 2, gableH, 4),
      this.materials.woodVertical
    );
    gable.position.set(0, stiltH + wallH + gableH / 2, 0);
    gable.rotation.y = Math.PI / 4;
    hut.add(gable);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.5, 0.15),
      new THREE.MeshStandardMaterial({ map: this.textures.signHerbalist, roughness: 0.7 })
    );
    signBoard.position.set(0, stiltH + wallH + 0.8, depth / 2 + 0.05);
    hut.add(signBoard);

    // 4. Atap Pelana Shingles
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, depth + 1.1), this.materials.roofShingles);
    roofL.position.set(-2.2, stiltH + wallH + 1.6, 0); roofL.rotation.z = Math.PI * 0.19; hut.add(roofL);
    const roofR = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, depth + 1.1), this.materials.roofShingles);
    roofR.position.set(2.2, stiltH + wallH + 1.6, 0); roofR.rotation.z = -Math.PI * 0.19; hut.add(roofR);

    // 5. Sulur Ivy & Tanaman Rambat Menjalar di Dinding & Atap
    const vineMat = this.materials.foliageGreen;
    for (let v = 0; v < 14; v++) {
      const vine = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.3), vineMat);
      const vx = (v % 2 === 0 ? -1 : 1) * (width / 2 - 0.3);
      const vy = stiltH + 0.5 + Math.random() * 4.2;
      const vz = depth / 2 + (Math.random() - 0.5) * 1.5;
      vine.position.set(vx, vy, vz);
      hut.add(vine);
    }

    // 6. Rentetan Gantungan Herba Kering di Bawah Lis Atap Depan
    const herbColors = [0xeab308, 0xa855f7, 0x16a34a, 0xf97316, 0x84cc16];
    for (let h = -width / 2 + 1.0; h <= width / 2 - 1.0; h += 0.7) {
      const hColor = herbColors[Math.floor(Math.random() * herbColors.length)];
      const hMat = new THREE.MeshStandardMaterial({ color: hColor, roughness: 0.9 });
      const hBundle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 5), hMat);
      hBundle.rotation.x = Math.PI; // Hanging upside down
      hBundle.position.set(h, stiltH + wallH - 0.1, depth / 2 + 0.3);
      hut.add(hBundle);
    }

    // 7. Pintu, Jendela dengan Tirai Krem & Kotak Bunga
    const frontZ = depth / 2 - 0.15;
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.1), this.materials.woodVertical);
    door.position.set(0, stiltH + 1.25, frontZ); hut.add(door);

    const winL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.1), this.materials.parchmentPaper);
    winL.position.set(-2.6, stiltH + 1.8, frontZ); hut.add(winL);
    hut.add(this.createWindowFlowerBox(-2.6, stiltH + 0.95, frontZ + 0.2, 1.6));

    const winR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.1), this.materials.parchmentPaper);
    winR.position.set(2.6, stiltH + 1.8, frontZ); hut.add(winR);
    hut.add(this.createWindowFlowerBox(2.6, stiltH + 0.95, frontZ + 0.2, 1.6));

    hut.add(this.createWallLantern(-1.2, stiltH + 2.0, frontZ + 0.2));
    const stairs = this.createWoodenStairs(2.2, stiltH, 1.2);
    stairs.position.set(0, 0, depth / 2 + porchD + 0.6); hut.add(stairs);
    hut.add(this.createSteppingStones(0, depth / 2 + porchD + 1.2, depth / 2 + porchD + 3.0, 3));

    // 8. SAYAP KIRI: SHED TANAMAN OBAT & RIMPANG (HERB STORAGE SHED)
    const shedX = -width / 2 - 2.0;
    const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.2, 4.6), this.materials.mossGreen);
    shedRoof.position.set(shedX, 3.2, 0.5); shedRoof.rotation.z = Math.PI * 0.14; hut.add(shedRoof);

    // Rak jemuran herba 2 tingkat di dalam shed
    const shedRack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.2), this.materials.timberBeam);
    shedRack.position.set(shedX, 1.4, 0.5); hut.add(shedRack);
    for (let rk = 0; rk < 6; rk++) {
      const hb = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.45, 5),
        new THREE.MeshStandardMaterial({ color: herbColors[rk % herbColors.length], roughness: 0.9 })
      );
      hb.rotation.x = Math.PI;
      hb.position.set(shedX - 1.2 + rk * 0.5, 1.8, 0.7);
      hut.add(hb);
    }

    // Pots of Ginger/Herbs on ground
    for (let pt = 0; pt < 3; pt++) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 8), this.materials.clayTerracotta);
      pot.position.set(shedX - 0.8 + pt * 0.8, 0.3, 2.6); hut.add(pot);
      const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), this.materials.foliageGreen);
      plant.position.set(shedX - 0.8 + pt * 0.8, 0.75, 2.6); hut.add(plant);
    }
    // Sacks of dried leaves
    const sack = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), this.materials.ropeFiber);
    sack.position.set(-width / 2 + 0.3, stiltH + 0.4, depth / 2 + 1.2); hut.add(sack);

    // Clay jugs on porch
    const jug1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.55, 8), this.materials.clayTerracotta);
    jug1.position.set(-1.2, stiltH + 0.45, depth / 2 + 1.2); hut.add(jug1);
    const jug2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.5, 8), this.materials.clayTerracotta);
    jug2.position.set(-0.7, stiltH + 0.4, depth / 2 + 1.3); hut.add(jug2);

    // 9. SAYAP KANAN: MEJA RACIK JAMU & JEMURAN LUAR (APOTHECARY BENCH)
    const benchGeo = new THREE.BoxGeometry(2.8, 0.85, 0.9);
    const bench = new THREE.Mesh(benchGeo, this.materials.timberBeam);
    bench.position.set(2.4, stiltH + 0.425, depth / 2 + 1.2);
    hut.add(bench);

    // Colorful Potion Bottles on Bench
    const potColors = [0xef4444, 0xa855f7, 0x06b6d4, 0xeab308];
    potColors.forEach((col, idx) => {
      const bottleMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.85
      });
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.3, 6), bottleMat);
      bottle.position.set(1.4 + idx * 0.35, stiltH + 0.85 + 0.15, depth / 2 + 1.2);
      hut.add(bottle);
    });

    // Brass Scale on Bench
    const scalePole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), this.materials.brassGold);
    scalePole.position.set(2.8, stiltH + 0.85 + 0.25, depth / 2 + 1.2);
    hut.add(scalePole);
    const scaleBeam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), this.materials.brassGold);
    scaleBeam.position.set(2.8, stiltH + 0.85 + 0.48, depth / 2 + 1.2);
    hut.add(scaleBeam);

    // Tall Standing Herb Drying Rack Outside
    const rackX = width / 2 + 2.0;
    const dryRack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 2.2), this.materials.timberBeam);
    dryRack.position.set(rackX, 1.2, 1.6); hut.add(dryRack);
    for (let dr = 0; dr < 4; dr++) {
      const dBundle = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.5, 5),
        new THREE.MeshStandardMaterial({ color: herbColors[dr % herbColors.length], roughness: 0.9 })
      );
      dBundle.rotation.x = Math.PI;
      dBundle.position.set(rackX, 1.6 - (dr % 2) * 0.6, 0.8 + dr * 0.5);
      hut.add(dBundle);
    }

    this.group.add(hut);

    // Colliders
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallH / 2, z),
      new THREE.Vector3(width + 4.5, wallH, depth + porchD)
    ));

    // Interactable
    this.interactables.push({
      id: 'medbay',
      type: 'medbay',
      position: new THREE.Vector3(x, 1.2, z + depth / 2 + porchD),
      radius: 3.5,
      label: 'Tabib Desa (Beli Jamu Herbal & Pulihkan HP) [E]'
    });
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 4: PASAR PENGEPUL HASIL BURUAN (HUNTER MERCHANT)
  // --------------------------------------------------------------------------
  buildHunterMarket(x, z) {
    const market = new THREE.Group();
    market.position.set(x, 0, z);

    const width = 9.0;
    const depth = 6.8;
    const wallH = 3.6;
    const porchD = 2.4;
    const stiltH = 0.65;

    // 1. Panggung Kayu & Teras
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.2, depth + porchD),
      this.materials.woodHorizontal
    );
    floor.position.set(0, stiltH, porchD / 2);
    market.add(floor);

    // 2. Dinding Utama Kayu Horizontal
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.4, wallH, depth - 0.4),
      this.materials.woodHorizontal
    );
    body.position.set(0, stiltH + wallH / 2, 0);
    body.castShadow = true;
    market.add(body);

    // 3. Gable & Plang Tanduk Rusa & Busur Panah
    const gableH = 3.2;
    const gable = new THREE.Mesh(
      new THREE.ConeGeometry(width / 2, gableH, 4),
      this.materials.woodVertical
    );
    gable.position.set(0, stiltH + wallH + gableH / 2, 0);
    gable.rotation.y = Math.PI / 4;
    market.add(gable);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.5, 0.15),
      new THREE.MeshStandardMaterial({ map: this.textures.signHunter, roughness: 0.7 })
    );
    signBoard.position.set(0, stiltH + wallH + 0.8, depth / 2 + 0.05);
    market.add(signBoard);

    // 4. TENGKORAK HEWAN BERTANDUK BESAR DI PUNCAK ATAP (GIANT HORNED BEAST SKULL)
    const skullGroup = new THREE.Group();
    skullGroup.position.set(0, stiltH + wallH + gableH + 0.5, depth / 2 + 0.2);

    const cranium = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), this.materials.whiteBone);
    skullGroup.add(cranium);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.55), this.materials.whiteBone);
    snout.position.set(0, -0.15, 0.3);
    skullGroup.add(snout);

    // Curved Horns (Tanduk melengkung tajam)
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.2, 6), this.materials.timberBeam);
    hornL.rotation.z = Math.PI * 0.35;
    hornL.rotation.x = -Math.PI * 0.1;
    hornL.position.set(-0.55, 0.45, 0);
    skullGroup.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.2, 6), this.materials.timberBeam);
    hornR.rotation.z = -Math.PI * 0.35;
    hornR.rotation.x = -Math.PI * 0.1;
    hornR.position.set(0.55, 0.45, 0);
    skullGroup.add(hornR);

    market.add(skullGroup);

    // 5. Atap Pelana Shingles
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, depth + 1.1), this.materials.roofShingles);
    roofL.position.set(-2.2, stiltH + wallH + 1.6, 0); roofL.rotation.z = Math.PI * 0.19; market.add(roofL);
    const roofR = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, depth + 1.1), this.materials.roofShingles);
    roofR.position.set(2.2, stiltH + wallH + 1.6, 0); roofR.rotation.z = -Math.PI * 0.19; market.add(roofR);

    // 6. Gantungan Daging Asap & Cakar Monster di Dinding Depan
    const frontZ = depth / 2 - 0.15;
    const ham = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.7, 8), this.materials.meatRed);
    ham.position.set(-1.8, stiltH + 2.4, frontZ + 0.1);
    market.add(ham);

    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 4), this.materials.whiteBone);
    claw.rotation.x = Math.PI;
    claw.position.set(1.8, stiltH + 2.5, frontZ + 0.1);
    market.add(claw);

    // Pintu & Jendela
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.1), this.materials.woodVertical);
    door.position.set(0, stiltH + 1.25, frontZ); market.add(door);
    const winL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.1), this.materials.parchmentPaper);
    winL.position.set(-2.6, stiltH + 1.8, frontZ); market.add(winL);
    market.add(this.createWindowFlowerBox(-2.6, stiltH + 0.95, frontZ + 0.2, 1.6));
    const winR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.1), this.materials.parchmentPaper);
    winR.position.set(2.6, stiltH + 1.8, frontZ); market.add(winR);
    market.add(this.createWindowFlowerBox(2.6, stiltH + 0.95, frontZ + 0.2, 1.6));

    market.add(this.createWallLantern(-1.2, stiltH + 2.0, frontZ + 0.2));
    const stairs = this.createWoodenStairs(2.2, stiltH, 1.2);
    stairs.position.set(0, 0, depth / 2 + porchD + 0.6); market.add(stairs);
    market.add(this.createSteppingStones(0, depth / 2 + porchD + 1.2, depth / 2 + porchD + 3.0, 3));

    // 7. SAYAP KIRI: AREA PENGOLAHAN KULIT & JERAT BERBURU
    const shedX = -width / 2 - 2.0;
    // Bingkai Kayu Peregang Kulit (A-Frame Hide Rack)
    const rackLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), this.materials.timberPost);
    rackLeg1.rotation.z = 0.25; rackLeg1.position.set(shedX - 0.7, 1.1, 1.8); market.add(rackLeg1);
    const rackLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), this.materials.timberPost);
    rackLeg2.rotation.z = -0.25; rackLeg2.position.set(shedX + 0.7, 1.1, 1.8); market.add(rackLeg2);
    const stretchedHide = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.95, side: THREE.DoubleSide })
    );
    stretchedHide.position.set(shedX, 1.1, 1.8);
    market.add(stretchedHide);

    // Perangkap Beruang Besi Bergerigi (Bear Trap) di Tanah Depan
    const trapGroup = new THREE.Group();
    trapGroup.position.set(shedX + 1.0, 0.05, depth / 2 + porchD + 0.5);
    const trapBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 8), this.materials.ironMetal);
    trapGroup.add(trapBase);
    // Jaws
    const jaw1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.06), this.materials.ironMetal);
    jaw1.position.set(0, 0.1, 0.2); jaw1.rotation.x = 0.4; trapGroup.add(jaw1);
    const jaw2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.06), this.materials.ironMetal);
    jaw2.position.set(0, 0.1, -0.2); jaw2.rotation.x = -0.4; trapGroup.add(jaw2);
    market.add(trapGroup);

    // Meja Daging Potong di Teras Kiri
    const meatTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 0.9), this.materials.timberBeam);
    meatTable.position.set(-2.4, stiltH + 0.425, depth / 2 + 1.2);
    market.add(meatTable);
    const meatChop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.5), this.materials.meatRed);
    meatChop.position.set(-2.4, stiltH + 0.85 + 0.12, depth / 2 + 1.2);
    market.add(meatChop);

    // 8. SAYAP KANAN: AREA PENIMBANGAN & DISPLAY HASIL BURUAN
    // Timbangan Gantung Pasar Raksasa di Balok Atap Kanan
    const scaleGroup = new THREE.Group();
    scaleGroup.position.set(width / 2 + 0.4, stiltH + wallH - 0.2, depth / 2 + 0.6);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.06), this.materials.ironMetal);
    scaleGroup.add(beam);
    const pan1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), this.materials.ironMetal);
    pan1.position.set(-0.7, -0.8, 0); scaleGroup.add(pan1);
    const pan2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), this.materials.ironMetal);
    pan2.position.set(0.7, -0.8, 0); scaleGroup.add(pan2);
    market.add(scaleGroup);

    // Lemari Display Terbuka (Curio Trophy Shelf) di Samping Kanan
    const shelfX = width / 2 + 2.2;
    const shelfGeo = new THREE.BoxGeometry(2.2, 2.4, 0.8);
    const shelf = new THREE.Mesh(shelfGeo, this.materials.timberBeam);
    shelf.position.set(shelfX, 1.2, 1.8);
    market.add(shelf);

    // Horns & Claws inside shelf
    const trophyHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 6), this.materials.whiteBone);
    trophyHorn.rotation.z = Math.PI / 3;
    trophyHorn.position.set(shelfX, 1.9, 2.1);
    market.add(trophyHorn);

    // Tumpukan Tong & Peti Kayu
    const brl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.9, 8), this.materials.timberPost);
    brl.position.set(width / 2 + 1.0, 0.45, depth / 2 + porchD + 0.4); market.add(brl);

    this.group.add(market);

    // Colliders
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallH / 2, z),
      new THREE.Vector3(width + 4.5, wallH, depth + porchD)
    ));

    // Interactable
    this.interactables.push({
      id: 'scrap_exchange',
      type: 'scrap_exchange',
      position: new THREE.Vector3(x, 1.2, z + depth / 2 + porchD),
      radius: 3.5,
      label: 'Pengepul Hasil Buruan (Jual Jarahan Dapat Rp) [E]'
    });
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 5: GAPURA KAYU PERBATASAN HUTAN (PALISADE GATE)
  // --------------------------------------------------------------------------
  buildForestGate(x, z) {
    const gate = new THREE.Group();
    gate.position.set(x, 0, z);

    // Dua Batang Pohon Raksasa Berakar Kokoh (Weathered Trunk Pillars)
    const trunkGeo = new THREE.CylinderGeometry(0.48, 0.65, 7.2, 8);
    const trunkL = new THREE.Mesh(trunkGeo, this.materials.timberPost);
    trunkL.position.set(-3.6, 3.6, 0);
    gate.add(trunkL);

    const trunkR = new THREE.Mesh(trunkGeo, this.materials.timberPost);
    trunkR.position.set(3.6, 3.6, 0);
    gate.add(trunkR);

    // Akar-akar pohon berlumut di dasar (Mossy buttress roots)
    for (let r = 0; r < 4; r++) {
      const rootGeo = new THREE.ConeGeometry(0.2, 1.4, 5);
      const rootL = new THREE.Mesh(rootGeo, this.materials.mossGreen);
      rootL.rotation.z = Math.PI / 3;
      rootL.rotation.y = r * Math.PI / 2;
      rootL.position.set(-3.6, 0.4, 0);
      gate.add(rootL);

      const rootR = new THREE.Mesh(rootGeo, this.materials.mossGreen);
      rootR.rotation.z = -Math.PI / 3;
      rootR.rotation.y = r * Math.PI / 2;
      rootR.position.set(3.6, 0.4, 0);
      gate.add(rootR);
    }

    // Balok Lintang Melintang Kayu Gelondongan Tebal di Atas
    const crossbeamGeo = new THREE.BoxGeometry(9.6, 0.9, 0.9);
    const crossbeam = new THREE.Mesh(crossbeamGeo, this.materials.timberPost);
    crossbeam.position.set(0, 6.6, 0);
    gate.add(crossbeam);

    // Lilitan Tali Tambang Tebal (Heavy Rope Lashings) di Sudut
    const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.7, 8), this.materials.ropeFiber);
    ropeL.position.set(-3.6, 6.6, 0); gate.add(ropeL);
    const ropeR = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.7, 8), this.materials.ropeFiber);
    ropeR.position.set(3.6, 6.6, 0); gate.add(ropeR);

    // Tumpukan Lumut & Tanduk Rusa Raksasa di Atas Balok Lintang
    const mossTuft = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 1.2), this.materials.mossGreen);
    mossTuft.position.set(0, 7.25, 0);
    gate.add(mossTuft);

    // Tanduk Rusa Raksasa Bercabang di Atas Gapura
    const antlerGeo = new THREE.ConeGeometry(0.12, 1.8, 6);
    const antlerL1 = new THREE.Mesh(antlerGeo, this.materials.whiteBone);
    antlerL1.rotation.z = Math.PI * 0.25; antlerL1.position.set(-1.4, 8.2, 0); gate.add(antlerL1);
    const antlerL2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.0, 5), this.materials.whiteBone);
    antlerL2.rotation.z = Math.PI * 0.45; antlerL2.position.set(-2.0, 8.5, 0); gate.add(antlerL2);

    const antlerR1 = new THREE.Mesh(antlerGeo, this.materials.whiteBone);
    antlerR1.rotation.z = -Math.PI * 0.25; antlerR1.position.set(1.4, 8.2, 0); gate.add(antlerR1);
    const antlerR2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.0, 5), this.materials.whiteBone);
    antlerR2.rotation.z = -Math.PI * 0.45; antlerR2.position.set(2.0, 8.5, 0); gate.add(antlerR2);

    // Plang Kayu Tergantung di Tengah: Pohon Tua & Daun Ek
    const gateSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.4, 0.15),
      new THREE.MeshStandardMaterial({ map: this.textures.signGate, roughness: 0.7 })
    );
    gateSign.position.set(0, 5.2, 0);
    gate.add(gateSign);

    // Tali Gantungan Plang
    const ropeH1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), this.materials.ropeFiber);
    ropeH1.position.set(-1.2, 6.0, 0); gate.add(ropeH1);
    const ropeH2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), this.materials.ropeFiber);
    ropeH2.position.set(1.2, 6.0, 0); gate.add(ropeH2);

    // Lentera Minyak di Tiang Kanan
    gate.add(this.createWallLantern(4.4, 4.4, 0, Math.PI / 2));

    // Tanaman Pakis & Bebatuan Alam Kali di Dasar
    gate.add(this.createDecorativeBushes(-3.6, 0, 0, 3));
    gate.add(this.createDecorativeBushes(3.6, 0, 0, 3));
    gate.add(this.createSteppingStones(0, -3.0, 3.0, 5));

    // Portal Kabut Mistis Transisi Menuju Hutan
    const portal = new THREE.Mesh(
      new THREE.PlaneGeometry(6.0, 5.8),
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      })
    );
    portal.position.set(0, 2.9, 0);
    gate.add(portal);
    this.env.animatedObjects.push({ mesh: portal, type: 'vortex_pulse', speed: 2.2 });

    this.group.add(gate);

    // Solid Colliders untuk dua tiang gapura
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x - 3.6, 3.6, z),
      new THREE.Vector3(1.8, 7.2, 1.8)
    ));
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x + 3.6, 3.6, z),
      new THREE.Vector3(1.8, 7.2, 1.8)
    ));

    // Interactable Portal
    this.interactables.push({
      id: 'airlock',
      type: 'airlock',
      position: new THREE.Vector3(x, 1.5, z - 2.0),
      radius: 4.5,
      label: 'Gerbang Batas Menuju Hutan Berbahaya [E]'
    });
  }

  // --------------------------------------------------------------------------
  // BANGUNAN 6: ALUN-ALUN TENGAH DESA (VILLAGE SQUARE)
  // --------------------------------------------------------------------------
  buildVillageSquare() {
    const square = new THREE.Group();

    // 1. SUMUR BATU KUNO DI TENGAH DESA (CENTRAL STONE WELL) AT (0, 0, 0)
    const well = new THREE.Group();
    well.position.set(0, 0, 0);

    // Circular Cobblestone Apron (Pelataran Batu Melingkar)
    const apron = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.6, 0.12, 16),
      this.materials.cobblestone
    );
    apron.position.y = 0.06;
    well.add(apron);

    // Silinder Sumur Batu Kali
    const wellWall = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 1.2, 16),
      this.materials.stoneSkirting
    );
    wellWall.position.y = 0.65;
    well.add(wellWall);

    // Air di dalam sumur
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.1, metalness: 0.3 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.95;
    well.add(water);

    // Tiang Kayu Penyangga Atap Sumur (Kiri & Kanan)
    const postGeo = new THREE.BoxGeometry(0.24, 2.8, 0.24);
    const wPostL = new THREE.Mesh(postGeo, this.materials.timberPost);
    wPostL.position.set(-1.4, 1.9, 0); well.add(wPostL);
    const wPostR = new THREE.Mesh(postGeo, this.materials.timberPost);
    wPostR.position.set(1.4, 1.9, 0); well.add(wPostR);

    // Balok Lintang Kayu & Katrol Besi
    const wCross = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 0.2), this.materials.timberBeam);
    wCross.position.set(0, 2.7, 0); well.add(wCross);
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12), this.materials.ironMetal);
    pulley.position.set(0, 2.5, 0); well.add(pulley);

    // Engkol Putaran Kayu di Sisi Kanan
    const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), this.materials.ironMetal);
    crank.rotation.z = Math.PI / 2; crank.position.set(1.65, 2.7, 0); well.add(crank);

    // Atap Pelana Kayu Kecil Sumur (Wooden Gable Well Canopy)
    const wellRoofL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 2.4), this.materials.roofShingles);
    wellRoofL.position.set(-0.75, 3.4, 0); wellRoofL.rotation.z = Math.PI * 0.22; well.add(wellRoofL);
    const wellRoofR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 2.4), this.materials.roofShingles);
    wellRoofR.position.set(0.75, 3.4, 0); wellRoofR.rotation.z = -Math.PI * 0.22; well.add(wellRoofR);

    // Ember Kayu (Satu di Timba, Satu di Lantai)
    const bucketGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
    const bucketHanging = new THREE.Mesh(bucketGeo, this.materials.timberBeam);
    bucketHanging.position.set(0.4, 2.0, 0); well.add(bucketHanging);
    const bucketFloor = new THREE.Mesh(bucketGeo, this.materials.timberBeam);
    bucketFloor.position.set(1.8, 0.32, 1.0); well.add(bucketFloor);

    square.add(well);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(3.4, 2.4, 3.4)
    ));

    // 2. POHON TUA RINDANG DENGAN BANGKU MELINGKAR AT (-9, 0, 3)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(-9, 0, 3);

    // Batang Pohon Besar
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 6.0, 8), this.materials.timberPost);
    trunk.position.y = 3.0;
    treeGroup.add(trunk);

    // Kanopi Rimbun Daun Hijau
    const fol1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4), this.materials.foliageGreen);
    fol1.position.set(0, 6.2, 0); treeGroup.add(fol1);
    const fol2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6), this.materials.foliageGreen);
    fol2.position.set(1.2, 7.2, 0.8); treeGroup.add(fol2);
    const fol3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5), this.materials.foliageGreen);
    fol3.position.set(-1.2, 6.8, -0.6); treeGroup.add(fol3);

    // Bangku Kayu Melingkar (Round Wrap-Around Circular Bench)
    const benchRing = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.12, 16),
      this.materials.timberBeam
    );
    benchRing.position.y = 0.55;
    treeGroup.add(benchRing);
    // Sandaran Melingkar
    const backRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.65, 12, 1, true),
      this.materials.timberBeam
    );
    backRing.position.y = 0.88;
    treeGroup.add(backRing);

    // Lentera Gantung Menyala di Dahan Pohon
    const branchLantern1 = this.createWallLantern(-1.8, 4.4, 0.6); treeGroup.add(branchLantern1);
    const branchLantern2 = this.createWallLantern(1.8, 4.2, -0.6); treeGroup.add(branchLantern2);

    // Tiang Lentera Berdiri di Samping Pohon
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), this.materials.timberPost);
    postL.position.set(-3.2, 1.6, 1.2); treeGroup.add(postL);
    treeGroup.add(this.createWallLantern(-3.2, 2.9, 1.4));

    square.add(treeGroup);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-9, 2.5, 3),
      new THREE.Vector3(4.2, 5.0, 4.2)
    ));

    // 3. PAPAN PENGUMUMAN DESA BERATAP AT (9, 0, 3)
    const boardGroup = new THREE.Group();
    boardGroup.position.set(9, 0, 3);
    boardGroup.rotation.y = -Math.PI * 0.15;

    // Dua Tiang Penyangga
    const bPostL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), this.materials.timberPost);
    bPostL.position.set(-1.8, 1.8, 0); boardGroup.add(bPostL);
    const bPostR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), this.materials.timberPost);
    bPostR.position.set(1.8, 1.8, 0); boardGroup.add(bPostR);

    // Bidang Papan Kayu dengan Tekstur Peta & Perkamen
    const boardPanel = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.2, 0.15),
      new THREE.MeshStandardMaterial({ map: this.textures.noticeBoard, roughness: 0.8 })
    );
    boardPanel.position.set(0, 2.2, 0);
    boardGroup.add(boardPanel);

    // Kanopi Atap Sirap Kayu di Atas Papan
    const bRoofL = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.9), this.materials.roofShingles);
    bRoofL.position.set(0, 3.5, 0.3); bRoofL.rotation.x = 0.35; boardGroup.add(bRoofL);
    const bRoofR = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.9), this.materials.roofShingles);
    bRoofR.position.set(0, 3.5, -0.3); bRoofR.rotation.x = -0.35; boardGroup.add(bRoofR);

    // Tiang Lentera Berdiri di Samping Papan Pengumuman
    const postBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), this.materials.timberPost);
    postBoard.position.set(2.6, 1.6, 0.6); boardGroup.add(postBoard);
    boardGroup.add(this.createWallLantern(2.6, 2.9, 0.8));

    // Tong-tong kayu di samping papan
    const bBrl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.85, 8), this.materials.timberPost);
    bBrl1.position.set(2.4, 0.42, -0.8); boardGroup.add(bBrl1);

    square.add(boardGroup);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(9, 1.8, 3),
      new THREE.Vector3(4.2, 3.6, 1.8)
    ));

    // 4. TIANG PENUNJUK ARAH KAYU BERUKIR AT (4, 0, -3)
    const signpost = new THREE.Group();
    signpost.position.set(4, 0, -3);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.8, 6), this.materials.timberPost);
    post.position.y = 1.4;
    signpost.add(post);

    // 3 Arrow Pointer Boards
    const arrowGeo = new THREE.BoxGeometry(1.2, 0.28, 0.08);
    const arrow1 = new THREE.Mesh(arrowGeo, this.materials.timberBeam); // Right -> Rumah
    arrow1.position.set(0.5, 2.4, 0.05); arrow1.rotation.y = 0.2; signpost.add(arrow1);
    const arrow2 = new THREE.Mesh(arrowGeo, this.materials.timberBeam); // Left -> Pande Besi
    arrow2.position.set(-0.5, 1.9, -0.05); arrow2.rotation.y = -0.3; signpost.add(arrow2);
    const arrow3 = new THREE.Mesh(arrowGeo, this.materials.timberBeam); // Forward -> Hutan
    arrow3.position.set(-0.4, 1.4, 0.05); arrow3.rotation.y = Math.PI / 2; signpost.add(arrow3);

    square.add(signpost);

    // 5. BANGKU-BANGKU KAYU SANTAI DESA (RUSTIC PARK BENCHES)
    const benchCoords = [
      { x: -3.5, z: 3.5, rot: 0.3 },
      { x: 3.5, z: 3.5, rot: -0.3 },
      { x: 0, z: -4.0, rot: 0 },
      { x: -5.5, z: -2.0, rot: Math.PI / 3 }
    ];

    benchCoords.forEach(b => {
      const parkBench = new THREE.Group();
      parkBench.position.set(b.x, 0, b.z);
      parkBench.rotation.y = b.rot;

      // Seat plank
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.65), this.materials.timberBeam);
      seat.position.y = 0.5; parkBench.add(seat);
      // Legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.55), this.materials.timberPost);
      legL.position.set(-1.0, 0.25, 0); parkBench.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.55), this.materials.timberPost);
      legR.position.set(1.0, 0.25, 0); parkBench.add(legR);

      square.add(parkBench);
    });

    this.group.add(square);
  }

  // --------------------------------------------------------------------------
  // MASTER BUILD METHOD (SAFE ZONE: HANYA 2 BANGUNAN - RUMAH & SHOP)
  // --------------------------------------------------------------------------
  static build(env) {
    const arch = new VillageArchitect(env);

    // 1. Bangunan 1: Rumah Pemain (House Model 004 GLB)
    arch.loadHouseModel(0, -18);

    // 2. Bangunan 2: Toko Serba Ada / Shop (Pan Shop GLB)
    // Menggabungkan Pande Besi (Armory), Tabib Herbal (Medbay), dan Pengepul (Scrap Exchange)
    arch.loadShopModel(-18, 0);

    // 3. Gapura Pembatas Hutan Menuju Dead Zone (Forest Gate / Airlock)
    arch.buildForestGate(0, 36);

    // 4. Alun-Alun Tengah Desa (Village Square, Stone Well, Ancient Tree & Notice Board)
    arch.buildVillageSquare();

    return arch;
  }
}

