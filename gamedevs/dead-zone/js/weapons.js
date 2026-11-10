// ============================================================================
// DEAD ZONE — MULTI-WEAPON & COMBAT ARSENAL SYSTEM
// Supports Tactical 9mm Pistol, Scatter Shotgun, and Automatic Rifle.
// Handles procedural 3D weapon meshes, spread physics, recoil, reloading,
// automatic firing cycles, sound dispatch, and bottom-center hotbar sync.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';
import { GameState } from './gameState.js';

export const WEAPON_CONFIGS = {
  pulse_pistol: {
    id: 'pulse_pistol',
    slot: 1,
    name: 'TACTICAL 9MM',
    shortName: 'PISTOL',
    icon: '🔫',
    magCapacity: 12,
    defaultReserve: 60,
    maxReserve: 120,
    fireRate: 0.22,
    reloadDuration: 1.3,
    bodyDamage: 35,
    headshotDamage: 100,
    pellets: 1,
    spread: 0,
    isAutomatic: false,
    recoilZ: 0.08,
    recoilRotX: 0.16,
    sound: 'pistol',
    muzzlePos: new THREE.Vector3(0, 0.045, -0.18)
  },
  scatter_blaster: {
    id: 'scatter_blaster',
    slot: 2,
    name: 'SCATTER SHOTGUN',
    shortName: 'SHOTGUN',
    icon: '💥',
    magCapacity: 6,
    defaultReserve: 36,
    maxReserve: 72,
    fireRate: 0.70,
    reloadDuration: 2.0,
    bodyDamage: 24, // 6 pellets * 24 = 144 max close range
    headshotDamage: 52, // 6 pellets * 52 = 312 critical headshot
    pellets: 6,
    spread: 0.045,
    isAutomatic: false,
    recoilZ: 0.16,
    recoilRotX: 0.30,
    sound: 'shotgun',
    muzzlePos: new THREE.Vector3(0, 0.05, -0.32)
  },
  plasma_rifle: {
    id: 'plasma_rifle',
    slot: 3,
    name: 'SENAPAN TAKTIS 7.62MM',
    shortName: 'RIFLE 7.62MM',
    icon: '⚡',
    magCapacity: 30,
    defaultReserve: 90,
    maxReserve: 180,
    fireRate: 0.11,
    reloadDuration: 1.8,
    bodyDamage: 28,
    headshotDamage: 85,
    pellets: 1,
    spread: 0.012,
    isAutomatic: true,
    recoilZ: 0.05,
    recoilRotX: 0.09,
    sound: 'rifle',
    muzzlePos: new THREE.Vector3(0, 0.055, -0.36)
  }
};

export class WeaponManager {
  constructor(camera, parentGroup, zombiesManager, uiManager, environment) {
    this.camera = camera;
    this.parentGroup = parentGroup; // player's pitchObject
    this.zombiesManager = zombiesManager;
    this.uiManager = uiManager;
    this.environment = environment;

    // Per-weapon ammo storage
    this.weaponData = {
      pulse_pistol: { ammoInMag: 12, reserveAmmo: 60 },
      scatter_blaster: { ammoInMag: 6, reserveAmmo: 36 },
      plasma_rifle: { ammoInMag: 30, reserveAmmo: 90 }
    };

    this.currentWeaponId = 'pulse_pistol';
    const initialConfig = WEAPON_CONFIGS.pulse_pistol;

    this.magCapacity = initialConfig.magCapacity;
    this.ammoInMag = initialConfig.magCapacity;
    this.reserveAmmo = initialConfig.defaultReserve;
    this.maxReserveAmmo = initialConfig.maxReserve;
    this.fireRate = initialConfig.fireRate;
    this.fireCooldown = 0;
    this.reloadDuration = initialConfig.reloadDuration;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.bodyDamage = initialConfig.bodyDamage;
    this.headshotDamage = initialConfig.headshotDamage;
    this.isMouseDown = false;

    // Combat statistics
    this.totalShots = 0;
    this.totalHits = 0;
    this.totalHeadshots = 0;

    // Raycaster from screen center (0, 0 in NDC)
    this.raycaster = new THREE.Raycaster();
    this.screenCenter = new THREE.Vector2(0, 0);

    // Procedural weapon 3D root group
    this.weaponGroup = new THREE.Group();
    this.defaultWeaponPos = new THREE.Vector3(0.22, -0.22, -0.42);
    this.weaponGroup.position.copy(this.defaultWeaponPos);

    this.recoilOffset = new THREE.Vector3(0, 0, 0);
    this.recoilRotation = new THREE.Euler(0, 0, 0);

    // Build the 3D procedural models for all 3 weapons
    this.buildPistolModel();
    this.buildShotgunModel();
    this.buildRifleModel();

    // Muzzle flash particle & point light
    this.buildMuzzleFlash();

    this.parentGroup.add(this.weaponGroup);
    this.isHolstered = false;

    // Event listeners
    this.boundOnMouseDown = (e) => {
      if (e.button !== 0) return;
      this.isMouseDown = true;
      this.shoot();
    };
    this.boundOnMouseUp = (e) => {
      if (e.button === 0) this.isMouseDown = false;
    };
    this.boundOnKeyDown = (e) => {
      if (e.code === 'KeyR') {
        this.reload();
      }
    };
    this.boundOnWheel = (e) => {
      if (document.pointerLockElement !== null) {
        if (e.deltaY > 0) this.nextWeapon();
        else if (e.deltaY < 0) this.prevWeapon();
      }
    };

    window.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mouseup', this.boundOnMouseUp);
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('wheel', this.boundOnWheel);
  }

  destroy() {
    window.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('wheel', this.boundOnWheel);
  }

  // --------------------------------------------------------------------------
  // 3D WEAPON PROCEDURAL MODELS
  // --------------------------------------------------------------------------
  buildPistolModel() {
    this.pistolGroup = new THREE.Group();

    // 1. Slide (Gunmetal top)
    const slideGeo = new THREE.BoxGeometry(0.045, 0.05, 0.22);
    const slideMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d32,
      roughness: 0.35,
      metalness: 0.8
    });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.04, -0.04);
    this.pistolGroup.add(slide);

    // 2. Barrel interior
    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.23, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.045, -0.04);
    this.pistolGroup.add(barrel);

    // 3. Lower Frame & Trigger Guard
    const frameGeo = new THREE.BoxGeometry(0.042, 0.038, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1b1c1e,
      roughness: 0.7,
      metalness: 0.2
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.005, -0.04);
    this.pistolGroup.add(frame);

    // 4. Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.065);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x151617,
      roughness: 0.9,
      metalness: 0.1
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.06, 0.02);
    grip.rotation.x = 0.22;
    this.pistolGroup.add(grip);

    // 5. Tritium Sights
    const sightMat = new THREE.MeshBasicMaterial({ color: 0x22ff55 });
    const frontSightGeo = new THREE.BoxGeometry(0.006, 0.01, 0.006);
    const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
    frontSight.position.set(0, 0.07, -0.14);
    this.pistolGroup.add(frontSight);

    this.pistolGroup.visible = true;
    this.weaponGroup.add(this.pistolGroup);
  }

  buildShotgunModel() {
    this.shotgunGroup = new THREE.Group();

    // 1. Heavy Receiver (dark steel block)
    const recGeo = new THREE.BoxGeometry(0.052, 0.068, 0.22);
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.4, metalness: 0.8 });
    const receiver = new THREE.Mesh(recGeo, darkSteelMat);
    receiver.position.set(0, 0.035, -0.02);
    this.shotgunGroup.add(receiver);

    // 2. Twin Barrels
    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.3, metalness: 0.9 });

    const topBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    topBarrel.position.set(0, 0.055, -0.18);
    this.shotgunGroup.add(topBarrel);

    const botBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    botBarrel.position.set(0, 0.03, -0.18);
    this.shotgunGroup.add(botBarrel);

    // 3. Magazine Tube under barrels
    const magTubeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.26, 8);
    magTubeGeo.rotateX(Math.PI / 2);
    const magTube = new THREE.Mesh(magTubeGeo, barrelMat);
    magTube.position.set(0, 0.008, -0.15);
    this.shotgunGroup.add(magTube);

    // 4. Pump Grip (warm oak wood)
    const pumpGeo = new THREE.BoxGeometry(0.056, 0.045, 0.12);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.7, metalness: 0.1 });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, 0.015, -0.15);
    this.shotgunGroup.add(pump);

    // 5. Heavy Stock & Pistol Grip
    const stockGeo = new THREE.BoxGeometry(0.046, 0.12, 0.14);
    const stockMat = new THREE.MeshStandardMaterial({ color: 0x3d2518, roughness: 0.75, metalness: 0.1 });
    const stock = new THREE.Mesh(stockGeo, stockMat);
    stock.position.set(0, -0.04, 0.1);
    stock.rotation.x = -0.15;
    this.shotgunGroup.add(stock);

    // 6. Ejection Port & Brass Shell
    const portGeo = new THREE.BoxGeometry(0.012, 0.018, 0.045);
    const portMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const port = new THREE.Mesh(portGeo, portMat);
    port.position.set(0.026, 0.045, -0.02);
    this.shotgunGroup.add(port);

    // 7. Bead Sight
    const beadGeo = new THREE.SphereGeometry(0.006, 6, 6);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(0, 0.07, -0.32);
    this.shotgunGroup.add(bead);

    this.shotgunGroup.visible = false;
    this.weaponGroup.add(this.shotgunGroup);
  }

  buildRifleModel() {
    this.rifleGroup = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.35, metalness: 0.85 });
    const polymerMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.8, metalness: 0.15 });

    // 1. Upper & Lower Receiver
    const recGeo = new THREE.BoxGeometry(0.048, 0.07, 0.28);
    const receiver = new THREE.Mesh(recGeo, metalMat);
    receiver.position.set(0, 0.04, -0.04);
    this.rifleGroup.add(receiver);

    // 2. Long Rifled Barrel with Muzzle Brake
    const barrelGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.36, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.position.set(0, 0.048, -0.25);
    this.rifleGroup.add(barrel);

    const brakeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8);
    brakeGeo.rotateX(Math.PI / 2);
    const brake = new THREE.Mesh(brakeGeo, metalMat);
    brake.position.set(0, 0.048, -0.44);
    this.rifleGroup.add(brake);

    // 3. Handguard Shroud
    const shroudGeo = new THREE.BoxGeometry(0.05, 0.055, 0.18);
    const shroud = new THREE.Mesh(shroudGeo, polymerMat);
    shroud.position.set(0, 0.045, -0.18);
    this.rifleGroup.add(shroud);

    // 4. Curved Banana Magazine (30 rounds)
    const magGeo = new THREE.BoxGeometry(0.038, 0.16, 0.06);
    const magMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6, metalness: 0.5 });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(0, -0.08, -0.08);
    mag.rotation.x = 0.28;
    this.rifleGroup.add(mag);

    // 5. Tactical Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.13, 0.06);
    const grip = new THREE.Mesh(gripGeo, polymerMat);
    grip.position.set(0, -0.07, 0.04);
    grip.rotation.x = 0.25;
    this.rifleGroup.add(grip);

    // 6. Tactical Stock
    const stockGeo = new THREE.BoxGeometry(0.044, 0.08, 0.16);
    const stock = new THREE.Mesh(stockGeo, polymerMat);
    stock.position.set(0, 0.02, 0.18);
    this.rifleGroup.add(stock);

    // 7. Holographic Sight Mount & Glowing Reticle
    const scopeMountGeo = new THREE.BoxGeometry(0.036, 0.03, 0.08);
    const scopeMount = new THREE.Mesh(scopeMountGeo, metalMat);
    scopeMount.position.set(0, 0.09, -0.04);
    this.rifleGroup.add(scopeMount);

    const reticleGeo = new THREE.RingGeometry(0.005, 0.008, 8);
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.position.set(0, 0.095, -0.07);
    this.rifleGroup.add(reticle);

    this.rifleGroup.visible = false;
    this.weaponGroup.add(this.rifleGroup);
  }

  buildMuzzleFlash() {
    const flashGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffdd66 });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.045, -0.18);
    this.muzzleFlashMesh.visible = false;
    this.weaponGroup.add(this.muzzleFlashMesh);

    this.muzzleLight = new THREE.PointLight(0xffaa22, 2.0, 6);
    this.muzzleLight.position.set(0, 0.045, -0.18);
    this.muzzleLight.visible = false;
    this.weaponGroup.add(this.muzzleLight);
  }

  // --------------------------------------------------------------------------
  // WEAPON SWITCHING
  // --------------------------------------------------------------------------
  switchWeapon(weaponId) {
    if (!WEAPON_CONFIGS[weaponId]) return false;
    if (this.currentWeaponId === weaponId) return true;

    // Check ownership in GameState
    if (!GameState.ownedWeapons.includes(weaponId)) {
      sound.playDryFire();
      if (this.uiManager) {
        this.uiManager.showAnnouncement('SENJATA TERKUNCI 🔒', 'Beli di Toko Serba Ada Desa', 1.8);
      }
      return false;
    }

    // Cancel active reload
    if (this.isReloading) {
      this.isReloading = false;
      this.reloadTimer = 0;
      if (this.uiManager) this.uiManager.showReloadProgressBar(false);
    }

    // Save previous weapon state
    const prevData = this.weaponData[this.currentWeaponId];
    if (prevData) {
      prevData.ammoInMag = this.ammoInMag;
      prevData.reserveAmmo = this.reserveAmmo;
    }

    // Switch ID and config
    this.currentWeaponId = weaponId;
    const cfg = WEAPON_CONFIGS[weaponId];

    // Load new weapon state
    const curData = this.weaponData[weaponId];
    this.magCapacity = cfg.magCapacity;
    this.ammoInMag = curData.ammoInMag;
    this.reserveAmmo = curData.reserveAmmo;
    this.maxReserveAmmo = cfg.maxReserve;
    this.fireRate = cfg.fireRate;
    this.fireCooldown = 0.15; // Small switch delay
    this.reloadDuration = cfg.reloadDuration;
    this.bodyDamage = cfg.bodyDamage;
    this.headshotDamage = cfg.headshotDamage;

    // Mesh visibility
    if (this.pistolGroup) this.pistolGroup.visible = (weaponId === 'pulse_pistol');
    if (this.shotgunGroup) this.shotgunGroup.visible = (weaponId === 'scatter_blaster');
    if (this.rifleGroup) this.rifleGroup.visible = (weaponId === 'plasma_rifle');

    // Reposition muzzle flash
    if (this.muzzleFlashMesh && cfg.muzzlePos) {
      this.muzzleFlashMesh.position.copy(cfg.muzzlePos);
      this.muzzleLight.position.copy(cfg.muzzlePos);
    }

    // Brief weapon swap animation
    this.weaponGroup.position.y = this.defaultWeaponPos.y - 0.12;
    this.weaponGroup.rotation.x = -0.3;

    // Sound
    sound.playWeaponSwitch();

    // Update UI
    if (this.uiManager) {
      this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
      this.uiManager.updateWeaponName(cfg.name);
      this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);
      this.uiManager.showAnnouncement(cfg.name, 'Senjata Aktif Dipilih', 1.2);
      this.uiManager.showReloadAlert(this.ammoInMag === 0);
    }

    return true;
  }

  nextWeapon() {
    const list = Object.keys(WEAPON_CONFIGS).filter(id => GameState.ownedWeapons.includes(id));
    if (list.length <= 1) return;
    const idx = list.indexOf(this.currentWeaponId);
    const nextIdx = (idx + 1) % list.length;
    this.switchWeapon(list[nextIdx]);
  }

  prevWeapon() {
    const list = Object.keys(WEAPON_CONFIGS).filter(id => GameState.ownedWeapons.includes(id));
    if (list.length <= 1) return;
    const idx = list.indexOf(this.currentWeaponId);
    const prevIdx = (idx - 1 + list.length) % list.length;
    this.switchWeapon(list[prevIdx]);
  }

  // --------------------------------------------------------------------------
  // FIRING & RAYCASTING
  // --------------------------------------------------------------------------
  shoot() {
    if (this.isHolstered) return;
    const canShootPointer = (document.pointerLockElement !== null) || this.isTouchMode;
    if (!canShootPointer || this.isReloading || this.fireCooldown > 0) {
      return;
    }

    // Out of ammo in current magazine
    if (this.ammoInMag <= 0) {
      sound.playDryFire();
      this.uiManager.showReloadAlert(true);
      return;
    }

    const cfg = WEAPON_CONFIGS[this.currentWeaponId] || WEAPON_CONFIGS.pulse_pistol;

    // Deduct bullet
    this.ammoInMag--;
    this.weaponData[this.currentWeaponId].ammoInMag = this.ammoInMag;
    this.totalShots++;
    this.fireCooldown = this.fireRate;

    // Play gunshot sound according to weapon
    if (cfg.sound === 'shotgun') {
      sound.playShotgunShot();
    } else if (cfg.sound === 'rifle') {
      sound.playRifleShot();
    } else {
      sound.playPistolShot();
    }

    // Trigger visual recoil and muzzle flash
    this.triggerRecoil(cfg.recoilZ, cfg.recoilRotX);
    this.showMuzzleFlash();
    this.uiManager.triggerCrosshairRecoil();
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
    this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);

    if (this.ammoInMag === 0) {
      this.uiManager.showReloadAlert(true);
    }

    // Raycast hit detection (Supports shotgun multi-pellet spread)
    if (cfg.pellets > 1) {
      for (let i = 0; i < cfg.pellets; i++) {
        const spreadX = (Math.random() - 0.5) * cfg.spread;
        const spreadY = (Math.random() - 0.5) * cfg.spread;
        this.performRaycast(spreadX, spreadY, cfg.bodyDamage, cfg.headshotDamage);
      }
    } else {
      const spreadX = cfg.spread > 0 ? (Math.random() - 0.5) * cfg.spread : 0;
      const spreadY = cfg.spread > 0 ? (Math.random() - 0.5) * cfg.spread : 0;
      this.performRaycast(spreadX, spreadY, cfg.bodyDamage, cfg.headshotDamage);
    }
  }

  performRaycast(spreadX = 0, spreadY = 0, bodyDmg = this.bodyDamage, headDmg = this.headshotDamage) {
    const rayCoord = new THREE.Vector2(this.screenCenter.x + spreadX, this.screenCenter.y + spreadY);
    this.raycaster.setFromCamera(rayCoord, this.camera);

    const activeHitboxes = this.zombiesManager ? this.zombiesManager.getActiveHitboxes() : [];
    const envObstacles = (this.environment && Array.isArray(this.environment.obstacleMeshes))
      ? this.environment.obstacleMeshes
      : [];
    const targets = [...activeHitboxes, ...envObstacles];

    if (targets.length === 0) return;

    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];

      let zombie = null;
      let isHead = false;
      let curr = hit.object;
      while (curr) {
        if (curr.userData && curr.userData.zombie) {
          zombie = curr.userData.zombie;
          isHead = curr.userData.isHead || false;
          break;
        }
        curr = curr.parent;
      }

      if (zombie && zombie.isAlive) {
        const damage = isHead ? headDmg : bodyDmg;

        this.totalHits++;
        if (isHead) {
          this.totalHeadshots++;
          sound.playHeadshot();
          this.uiManager.showHitMarker(true);
          this.uiManager.showAnnouncement("CRITICAL HEADSHOT!", `+${damage} DAMAGE`, 1.0);
        } else {
          sound.playZombieHurt();
          this.uiManager.showHitMarker(false);
        }

        zombie.takeDamage(damage, isHead);
      }
    }
  }

  reload() {
    if (this.isReloading || this.ammoInMag >= this.magCapacity || this.reserveAmmo <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    this.uiManager.showReloadAlert(false);
    this.uiManager.showReloadProgressBar(true);

    sound.playReload();
  }

  triggerRecoil(recoilZ = 0.08, recoilRotX = 0.16) {
    this.recoilOffset.z = recoilZ;
    this.recoilRotation.x = recoilRotX;
  }

  showMuzzleFlash() {
    this.muzzleFlashMesh.visible = true;
    this.muzzleLight.visible = true;
    this.flashTimer = 0.05;
  }

  update(delta) {
    if (this.fireCooldown > 0) {
      this.fireCooldown -= delta;
    }

    // Automatic fire support for Automatic Rifle
    const cfg = WEAPON_CONFIGS[this.currentWeaponId];
    if (cfg && cfg.isAutomatic && this.isMouseDown && !this.isReloading && this.fireCooldown <= 0) {
      this.shoot();
    }

    // Muzzle flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleLight.visible = false;
      }
    }

    // Reload handling
    if (this.isReloading) {
      this.reloadTimer -= delta;
      const progress = 1 - Math.max(0, this.reloadTimer) / this.reloadDuration;
      this.uiManager.updateReloadProgress(progress);

      const reloadPhase = progress * Math.PI;
      this.weaponGroup.position.y = this.defaultWeaponPos.y - Math.sin(reloadPhase) * 0.15;
      this.weaponGroup.rotation.x = -Math.sin(reloadPhase) * 0.45;

      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    } else {
      // Smooth recoil recovery
      this.recoilOffset.z += (0 - this.recoilOffset.z) * Math.min(1, delta * 20);
      this.recoilRotation.x += (0 - this.recoilRotation.x) * Math.min(1, delta * 20);

      this.weaponGroup.position.set(
        this.defaultWeaponPos.x + this.recoilOffset.x,
        this.defaultWeaponPos.y + this.recoilOffset.y,
        this.defaultWeaponPos.z + this.recoilOffset.z
      );

      this.weaponGroup.rotation.set(
        this.recoilRotation.x,
        this.recoilRotation.y,
        this.recoilRotation.z
      );
    }
  }

  finishReload() {
    this.isReloading = false;
    const needed = this.magCapacity - this.ammoInMag;
    const toLoad = Math.min(needed, this.reserveAmmo);
    this.ammoInMag += toLoad;
    this.reserveAmmo -= toLoad;

    this.weaponData[this.currentWeaponId].ammoInMag = this.ammoInMag;
    this.weaponData[this.currentWeaponId].reserveAmmo = this.reserveAmmo;

    this.weaponGroup.position.copy(this.defaultWeaponPos);
    this.weaponGroup.rotation.set(0, 0, 0);

    this.uiManager.showReloadProgressBar(false);
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
    this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);
  }

  getAccuracy() {
    if (this.totalShots === 0) return 0;
    return Math.round((this.totalHits / this.totalShots) * 100);
  }

  // Tambah amunisi spesifik per kaliber senjata
  addWeaponAmmo(weaponId, count) {
    if (!this.weaponData[weaponId]) return;
    const maxRes = WEAPON_CONFIGS[weaponId]?.maxReserve || 120;
    this.weaponData[weaponId].reserveAmmo = Math.min(maxRes, this.weaponData[weaponId].reserveAmmo + count);
    if (this.currentWeaponId === weaponId) {
      this.reserveAmmo = this.weaponData[weaponId].reserveAmmo;
      this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
      if (this.ammoInMag > 0) this.uiManager.showReloadAlert(false);
    }
    this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);
  }

  // Resupply ammunition terbatas (misal 1 kotak drop darurat)
  resupplyAmmo(amount = 24) {
    // Hanya mengisi amunisi senjata yang sedang dipegang (1 kotak saja)
    const targetWep = this.currentWeaponId;
    const count = (targetWep === 'scatter_blaster') ? Math.round(amount * 0.5) : ((targetWep === 'plasma_rifle') ? amount : amount);
    this.addWeaponAmmo(targetWep, count);
  }

  reset() {
    this.weaponData = {
      pulse_pistol: { ammoInMag: 12, reserveAmmo: 60 },
      scatter_blaster: { ammoInMag: 6, reserveAmmo: 36 },
      plasma_rifle: { ammoInMag: 30, reserveAmmo: 90 }
    };
    this.currentWeaponId = 'pulse_pistol';
    const cfg = WEAPON_CONFIGS.pulse_pistol;

    this.magCapacity = cfg.magCapacity;
    this.ammoInMag = cfg.magCapacity;
    this.reserveAmmo = cfg.defaultReserve;
    this.fireCooldown = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.totalHeadshots = 0;
    this.muzzleFlashMesh.visible = false;
    this.muzzleLight.visible = false;
    this.weaponGroup.position.copy(this.defaultWeaponPos);
    this.weaponGroup.rotation.set(0, 0, 0);

    if (this.pistolGroup) this.pistolGroup.visible = true;
    if (this.shotgunGroup) this.shotgunGroup.visible = false;
    if (this.rifleGroup) this.rifleGroup.visible = false;

    this.uiManager.showReloadAlert(false);
    this.uiManager.showReloadProgressBar(false);
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
    this.uiManager.updateWeaponName(cfg.name);
    this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);
  }

  setHolstered(holstered) {
    this.isHolstered = !!holstered;
    this.weaponGroup.visible = !this.isHolstered;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.style.opacity = this.isHolstered ? '0.2' : '1.0';
    }
  }

  getCurrentWeapon() {
    return this;
  }
}
