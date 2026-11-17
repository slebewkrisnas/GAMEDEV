// ============================================================================
// DEAD ZONE — MULTI-WEAPON & COMBAT ARSENAL SYSTEM
// Supports Desert Eagle .50, AK-47 Rifle, AWP Sniper, Knife/Machete, and Shotgun.
// Handles realistic 3D weapon meshes (FBX & GLB), spread physics, recoil, reloading,
// automatic firing cycles, sound dispatch, and bottom-center hotbar sync.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';
import { GameState } from './gameState.js';
import { FBXLoader } from './libs/FBXLoader.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

export const WEAPON_CONFIGS = {
  pulse_pistol: {
    id: 'pulse_pistol',
    slot: 1,
    name: 'DESERT EAGLE .50',
    shortName: 'DEAGLE',
    icon: '🔫',
    isMelee: false,
    magCapacity: 12,
    defaultReserve: 60,
    maxReserve: 120,
    fireRate: 0.22,
    reloadDuration: 1.3,
    bodyDamage: 35,
    headshotDamage: 70, // Rebalanced: One-shot kill Runner (55 HP), 2-shot Walker (80 HP)
    pellets: 1,
    spread: 0,
    isAutomatic: false,
    noiseRadius: 22, // Caliber noise radius in meters
    recoilZ: 0.08,
    recoilRotX: 0.16,
    sound: 'deagle',
    muzzlePos: new THREE.Vector3(0, 0.045, -0.22)
  },
  plasma_rifle: {
    id: 'plasma_rifle',
    slot: 2,
    name: 'AK-47 ASSAULT RIFLE',
    shortName: 'AK-47',
    icon: '⚡',
    isMelee: false,
    magCapacity: 30,
    defaultReserve: 90,
    maxReserve: 180,
    fireRate: 0.11,
    reloadDuration: 1.8,
    bodyDamage: 28,
    headshotDamage: 105, // Rebalanced: One-shot kill Walker (80 HP), Runner (55 HP) & Stalker (95 HP)
    pellets: 1,
    spread: 0.012,
    isAutomatic: true,
    noiseRadius: 42, // Distinct high-powered rifle crack
    recoilZ: 0.05,
    recoilRotX: 0.09,
    sound: 'rifle',
    muzzlePos: new THREE.Vector3(0, 0.055, -0.42)
  },
  awp: {
    id: 'awp',
    slot: 3,
    name: 'AWP SNIPER RIFLE',
    shortName: 'AWP',
    icon: '🎯',
    isMelee: false,
    magCapacity: 5,
    defaultReserve: 20,
    maxReserve: 40,
    fireRate: 1.20,
    reloadDuration: 2.4,
    bodyDamage: 180,
    headshotDamage: 450,
    pellets: 1,
    spread: 0.001,
    isAutomatic: false,
    noiseRadius: 65,
    recoilZ: 0.22,
    recoilRotX: 0.35,
    sound: 'awp',
    muzzlePos: new THREE.Vector3(0, 0.06, -0.52)
  },
  machete: {
    id: 'machete',
    slot: 4,
    name: 'PISAU KOMANDO / GOLOK',
    shortName: 'PISAU/GOLOK',
    icon: '🗡️',
    isMelee: true,
    magCapacity: 1,
    defaultReserve: 0,
    maxReserve: 0,
    fireRate: 0.55,
    reloadDuration: 0,
    bodyDamage: 45,
    headshotDamage: 80,
    pellets: 1,
    spread: 0,
    range: 2.3, // 2.3 meter melee reach
    staminaCost: 1.0, // 1.0s stamina per ayunan
    isAutomatic: false,
    noiseRadius: 0, // Senyap! Tidak memancing aggro zombi
    recoilZ: 0.04,
    recoilRotX: 0.35,
    sound: 'machete',
    muzzlePos: null
  },
  scatter_blaster: {
    id: 'scatter_blaster',
    slot: 5,
    name: 'SCATTER SHOTGUN',
    shortName: 'SHOTGUN',
    icon: '💥',
    isMelee: false,
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
    noiseRadius: 55, // Loudest blast alerts zombies across clearing
    recoilZ: 0.16,
    recoilRotX: 0.30,
    sound: 'shotgun',
    muzzlePos: new THREE.Vector3(0, 0.05, -0.32)
  }
};

// Aliases for backward compatibility
WEAPON_CONFIGS.desert_eagle = WEAPON_CONFIGS.pulse_pistol;
WEAPON_CONFIGS.ak47 = WEAPON_CONFIGS.plasma_rifle;
WEAPON_CONFIGS.awm = WEAPON_CONFIGS.awp;
WEAPON_CONFIGS.combat_knife = WEAPON_CONFIGS.machete;

export class WeaponManager {
  constructor(camera, parentGroup, zombiesManager, uiManager, environment, player = null) {
    this.camera = camera;
    this.parentGroup = parentGroup; // player's pitchObject
    this.zombiesManager = zombiesManager;
    this.uiManager = uiManager;
    this.environment = environment;
    this.player = player;

    // Per-weapon ammo storage
    this.weaponData = {
      pulse_pistol: { ammoInMag: 12, reserveAmmo: 60 },
      plasma_rifle: { ammoInMag: 30, reserveAmmo: 90 },
      awp: { ammoInMag: 5, reserveAmmo: 20 },
      machete: { ammoInMag: 1, reserveAmmo: 0 },
      scatter_blaster: { ammoInMag: 6, reserveAmmo: 36 }
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

    // Weapon Switching State Machine (IDLE -> SWITCHING_OUT -> SWITCHING_IN -> READY)
    this.switchState = 'IDLE';
    this.switchTimer = 0;
    this.switchDuration = 0.18; // 0.18s switch-out + 0.18s switch-in
    this.pendingWeaponId = null;

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

    // Build the 3D models for all 5 weapons (Deagle, Shotgun, AK-47, AWP, and Knife/Machete)
    this.buildPistolModel();
    this.buildShotgunModel();
    this.buildRifleModel();
    this.buildAWPModel();
    this.buildMacheteModel();

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
  // 3D WEAPON PROCEDURAL MODELS & REALISTIC ASSET LOADERS (DEAGLE, AK-47, AWP, KNIFE, SHOTGUN)
  // --------------------------------------------------------------------------
  buildPistolModel() {
    this.pistolGroup = new THREE.Group();

    // 1. Procedural Fallback Mesh
    const procGroup = new THREE.Group();
    const slideGeo = new THREE.BoxGeometry(0.045, 0.05, 0.22);
    const slideMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d32,
      roughness: 0.35,
      metalness: 0.8
    });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.04, -0.04);
    procGroup.add(slide);

    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.23, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.045, -0.04);
    procGroup.add(barrel);

    const frameGeo = new THREE.BoxGeometry(0.042, 0.038, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1b1c1e,
      roughness: 0.7,
      metalness: 0.2
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.005, -0.04);
    procGroup.add(frame);

    const gripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.065);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x151617,
      roughness: 0.9,
      metalness: 0.1
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.06, 0.02);
    grip.rotation.x = 0.22;
    procGroup.add(grip);

    const sightMat = new THREE.MeshBasicMaterial({ color: 0x22ff55 });
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.01, 0.006), sightMat);
    frontSight.position.set(0, 0.07, -0.14);
    procGroup.add(frontSight);

    this.pistolGroup.add(procGroup);

    // 2. Asynchronous 3D FBX Loader (Desert Eagle .50 AE)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        const basePath = './asset dead-zone/senjata/desert eagle/Textures (1)/Textures/';
        const diffMap = texLoader.load(basePath + 'Pistol_Gun_Metal01_BaseColor.png');
        const normMap = texLoader.load(basePath + 'Pistol_Gun_Metal01_Normal.png');
        const roughMap = texLoader.load(basePath + 'Pistol_Gun_Metal01_Roughness.png');
        const metalMap = texLoader.load(basePath + 'Pistol_Gun_Metal01_Metallic.png');

        const deagleMat = new THREE.MeshStandardMaterial({
          map: diffMap,
          normalMap: normMap,
          roughnessMap: roughMap,
          metalnessMap: metalMap,
          metalness: 0.85,
          roughness: 0.35
        });

        const fbxLoader = new FBXLoader();
        fbxLoader.load(
          encodeURI('./asset dead-zone/senjata/desert eagle/cgtrader_optimized_Pistol_Gun.fbx'),
          (fbx) => {
            const scale = 0.18;
            fbx.scale.set(scale, scale, scale);
            fbx.rotation.set(0, Math.PI / 2, 0);
            fbx.position.set(0.04, -0.05, -0.02);
            fbx.traverse((child) => {
              if (child.isMesh) {
                child.material = deagleMat;
                child.castShadow = true;
              }
            });
            procGroup.visible = false;
            this.pistolGroup.add(fbx);
            console.log('✅ [WEAPON] Desert Eagle FBX viewmodel loaded.');
          },
          undefined,
          (err) => console.warn('Desert Eagle FBX fallback:', err)
        );
      } catch (e) {
        console.warn('Desert Eagle loader init:', e);
      }
    }

    this.pistolGroup.visible = true;
    this.weaponGroup.add(this.pistolGroup);
  }

  buildShotgunModel() {
    this.shotgunGroup = new THREE.Group();

    // 1. Procedural Fallback Mesh
    const procGroup = new THREE.Group();
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.4, metalness: 0.8 });
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.068, 0.22), darkSteelMat);
    receiver.position.set(0, 0.035, -0.02);
    procGroup.add(receiver);

    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.3, metalness: 0.9 });
    const topBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    topBarrel.position.set(0, 0.055, -0.18);
    procGroup.add(topBarrel);

    const botBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    botBarrel.position.set(0, 0.03, -0.18);
    procGroup.add(botBarrel);

    const magTubeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.26, 8);
    magTubeGeo.rotateX(Math.PI / 2);
    const magTube = new THREE.Mesh(magTubeGeo, barrelMat);
    magTube.position.set(0, 0.008, -0.15);
    procGroup.add(magTube);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.045, 0.12), new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.7, metalness: 0.1 }));
    pump.position.set(0, 0.015, -0.15);
    procGroup.add(pump);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.12, 0.14), new THREE.MeshStandardMaterial({ color: 0x3d2518, roughness: 0.75, metalness: 0.1 }));
    stock.position.set(0, -0.04, 0.1);
    stock.rotation.x = -0.15;
    procGroup.add(stock);

    this.shotgunGroup.add(procGroup);

    // 2. Asynchronous 3D FBX Loader (Shotgun)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      try {
        const fbxLoader = new FBXLoader();
        fbxLoader.load(
          encodeURI('./asset dead-zone/senjata/shotgun/lowpoly_shotgun.fbx'),
          (fbx) => {
            const scale = 0.006;
            fbx.scale.set(scale, scale, scale);
            fbx.position.set(0.02, -0.06, 0.06);
            fbx.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
              }
            });
            procGroup.visible = false;
            this.shotgunGroup.add(fbx);
            console.log('✅ [WEAPON] Shotgun FBX viewmodel loaded.');
          },
          undefined,
          (err) => console.warn('Shotgun FBX fallback:', err)
        );
      } catch (e) {
        console.warn('Shotgun loader init:', e);
      }
    }

    this.shotgunGroup.visible = false;
    this.weaponGroup.add(this.shotgunGroup);
  }

  buildRifleModel() {
    this.rifleGroup = new THREE.Group();

    // 1. Procedural Fallback Mesh
    const procGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.35, metalness: 0.85 });
    const polymerMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.8, metalness: 0.15 });

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.07, 0.28), metalMat);
    receiver.position.set(0, 0.04, -0.04);
    procGroup.add(receiver);

    const barrelGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.36, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.position.set(0, 0.048, -0.25);
    procGroup.add(barrel);

    const brakeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8);
    brakeGeo.rotateX(Math.PI / 2);
    const brake = new THREE.Mesh(brakeGeo, metalMat);
    brake.position.set(0, 0.048, -0.44);
    procGroup.add(brake);

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.18), polymerMat);
    shroud.position.set(0, 0.045, -0.18);
    procGroup.add(shroud);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.16, 0.06), new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6, metalness: 0.5 }));
    mag.position.set(0, -0.08, -0.08);
    mag.rotation.x = 0.28;
    procGroup.add(mag);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.06), polymerMat);
    grip.position.set(0, -0.07, 0.04);
    grip.rotation.x = 0.25;
    procGroup.add(grip);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.08, 0.16), polymerMat);
    stock.position.set(0, 0.02, 0.18);
    procGroup.add(stock);

    this.rifleGroup.add(procGroup);

    // 2. Asynchronous 3D FBX Loader (AK-47 Assault Rifle)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        const basePath = './asset dead-zone/senjata/ak47/textures/';
        const diffMap = texLoader.load(basePath + 'AK_Base_color.png');
        const normMap = texLoader.load(basePath + 'AK_Normal_OpenGL.png');
        const roughMap = texLoader.load(basePath + 'AK_Roughness.png');
        const metalMap = texLoader.load(basePath + 'AK_Metallic.png');

        const akMat = new THREE.MeshStandardMaterial({
          map: diffMap,
          normalMap: normMap,
          roughnessMap: roughMap,
          metalnessMap: metalMap,
          metalness: 0.8,
          roughness: 0.4
        });

        const fbxLoader = new FBXLoader();
        fbxLoader.load(
          encodeURI('./asset dead-zone/senjata/ak47/cgtrader_optimized_AK47NoSubdiv.fbx'),
          (fbx) => {
            const scale = 0.52;
            fbx.scale.set(scale, scale, scale);
            fbx.rotation.set(0, Math.PI, 0);
            fbx.position.set(0.02, -0.06, 0.08);
            fbx.traverse((child) => {
              if (child.isMesh) {
                child.material = akMat;
                child.castShadow = true;
              }
            });
            procGroup.visible = false;
            this.rifleGroup.add(fbx);
            console.log('✅ [WEAPON] AK-47 FBX viewmodel loaded.');
          },
          undefined,
          (err) => console.warn('AK-47 FBX fallback:', err)
        );
      } catch (e) {
        console.warn('AK-47 loader init:', e);
      }
    }

    this.rifleGroup.visible = false;
    this.weaponGroup.add(this.rifleGroup);
  }

  buildAWPModel() {
    this.awpGroup = new THREE.Group();

    // 1. Procedural Fallback Mesh (Precision sniper chassis, barrel, and high-zoom scope)
    const procGroup = new THREE.Group();
    const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x2d3a2e, roughness: 0.6, metalness: 0.3 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.3, metalness: 0.85 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.075, 0.42), darkGreenMat);
    chassis.position.set(0, 0.03, -0.02);
    procGroup.add(chassis);

    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.52, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, darkSteelMat);
    barrel.position.set(0, 0.05, -0.36);
    procGroup.add(barrel);

    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.028, 0.06), darkSteelMat);
    muzzle.position.set(0, 0.05, -0.62);
    procGroup.add(muzzle);

    const scopeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12);
    scopeGeo.rotateX(Math.PI / 2);
    const scope = new THREE.Mesh(scopeGeo, darkSteelMat);
    scope.position.set(0, 0.11, -0.06);
    procGroup.add(scope);

    const mnt1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.02), darkSteelMat);
    mnt1.position.set(0, 0.08, -0.12);
    procGroup.add(mnt1);
    const mnt2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.02), darkSteelMat);
    mnt2.position.set(0, 0.08, 0.0);
    procGroup.add(mnt2);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    lens.position.set(0, 0.11, -0.171);
    procGroup.add(lens);

    this.awpGroup.add(procGroup);

    // 2. Asynchronous 3D GLB Loader (AWP / AWM Sniper Rifle)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      try {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
          encodeURI('./asset dead-zone/senjata/awp/awm.glb'),
          (gltf) => {
            const scale = 0.0078;
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.rotation.set(0, -Math.PI / 2, 0);
            model.position.set(0.02, -0.05, 0.02);
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                if (child.material) {
                  child.material.roughness = Math.max(child.material.roughness || 0.4, 0.4);
                  child.material.metalness = Math.min(child.material.metalness || 0.7, 0.85);
                }
              }
            });
            procGroup.visible = false;
            this.awpGroup.add(model);
            console.log('✅ [WEAPON] AWP GLB viewmodel loaded.');
          },
          undefined,
          (err) => console.warn('AWP GLB fallback:', err)
        );
      } catch (e) {
        console.warn('AWP loader init:', e);
      }
    }

    this.awpGroup.visible = false;
    this.weaponGroup.add(this.awpGroup);
  }

  buildMacheteModel() {
    this.macheteGroup = new THREE.Group();

    // 1. Procedural Fallback Mesh
    const procGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.016, 0.019, 0.16, 8);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.75,
      metalness: 0.1
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.06, 0.04);
    handle.rotation.x = 0.35;
    procGroup.add(handle);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.038), new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.4, metalness: 0.8 }));
    guard.position.set(0, 0.015, 0.01);
    procGroup.add(guard);

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x2b3038,
      roughness: 0.35,
      metalness: 0.85
    });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.28, 0.045), spineMat);
    spine.position.set(0, 0.15, -0.03);
    spine.rotation.x = -0.12;
    procGroup.add(spine);

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.98
    });
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.29, 0.025), edgeMat);
    edge.position.set(0, 0.15, -0.055);
    edge.rotation.x = -0.12;
    procGroup.add(edge);

    this.macheteGroup.add(procGroup);

    // 2. Asynchronous 3D FBX Loader (Combat Knife / Machete)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        const basePath = './asset dead-zone/senjata/knife/Machete/Machete/textures/';
        const diffMap = texLoader.load(basePath + 'Machete_Albedo.png');
        const normMap = texLoader.load(basePath + 'Machete_Normal.png');
        const roughMap = texLoader.load(basePath + 'Machete_Roughness.png');
        const metalMap = texLoader.load(basePath + 'Machete_Metallic.png');

        const knifeMat = new THREE.MeshStandardMaterial({
          map: diffMap,
          normalMap: normMap,
          roughnessMap: roughMap,
          metalnessMap: metalMap,
          metalness: 0.8,
          roughness: 0.3
        });

        const fbxLoader = new FBXLoader();
        fbxLoader.load(
          encodeURI('./asset dead-zone/senjata/knife/Machete/Machete/Machete.fbx'),
          (fbx) => {
            const scale = 0.0055;
            fbx.scale.set(scale, scale, scale);
            fbx.position.set(0.02, -0.08, 0.08);
            fbx.traverse((child) => {
              if (child.isMesh) {
                child.material = knifeMat;
                child.castShadow = true;
              }
            });
            procGroup.visible = false;
            this.macheteGroup.add(fbx);
            console.log('✅ [WEAPON] Machete/Knife FBX viewmodel loaded.');
          },
          undefined,
          (err) => console.warn('Machete FBX fallback:', err)
        );
      } catch (e) {
        console.warn('Machete loader init:', e);
      }
    }

    this.macheteGroup.visible = false;
    this.weaponGroup.add(this.macheteGroup);
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
  // WEAPON SWITCHING & INVENTORY AMMUNITION SYNCHRONIZATION
  // --------------------------------------------------------------------------
  getAmmoItemId(weaponId) {
    switch (weaponId) {
      case 'pulse_pistol':
      case 'desert_eagle':
        return 'ammo_pistol';
      case 'scatter_blaster':
        return 'ammo_shotgun';
      case 'plasma_rifle':
      case 'ak47':
        return 'ammo_rifle';
      case 'awp':
      case 'awm':
        return 'ammo_rifle';
      default:
        return null;
    }
  }

  getReserveAmmo(weaponId) {
    const ammoItemId = this.getAmmoItemId(weaponId);
    if (!ammoItemId || !Array.isArray(GameState.inventory)) {
      return this.weaponData[weaponId]?.reserveAmmo || 0;
    }
    let total = 0;
    for (const slot of GameState.inventory) {
      if (slot) {
        const slotId = slot.itemId || (slot.item ? slot.item.id : slot.id);
        if (slotId === ammoItemId) {
          total += (slot.quantity || slot.count || 0);
        }
      }
    }
    if (total > 0) return total;
    return this.weaponData[weaponId]?.reserveAmmo || 0;
  }

  switchSlot(slotName) {
    if (!GameState.equipment || !GameState.equipment[slotName]) {
      return false;
    }
    const item = GameState.equipment[slotName];
    const weaponId = item.itemId || item.id;
    if (WEAPON_CONFIGS[weaponId]) {
      return this.switchWeapon(weaponId);
    }
    return false;
  }

  cycleWeapons(direction = 1) {
    // Prioritize equipped weapons from GameState.equipment
    const equipped = [];
    if (GameState.equipment) {
      ['secondary', 'primary', 'melee'].forEach(s => {
        const itm = GameState.equipment[s];
        if (itm && WEAPON_CONFIGS[itm.itemId || itm.id]) {
          equipped.push(itm.itemId || itm.id);
        }
      });
    }
    const list = equipped.length > 0
      ? [...new Set(equipped)]
      : Object.keys(WEAPON_CONFIGS).filter(id => GameState.ownedWeapons.includes(id));

    if (list.length <= 1) return;
    const idx = list.indexOf(this.currentWeaponId);
    const nextIdx = (idx + (direction > 0 ? 1 : -1) + list.length) % list.length;
    this.switchWeapon(list[nextIdx]);
  }

  switchWeapon(weaponId) {
    if (!WEAPON_CONFIGS[weaponId]) return false;
    if (this.currentWeaponId === weaponId && this.switchState === 'IDLE') return true;

    // Check ownership in GameState or if weapon is currently equipped
    const isEquipped = GameState.equipment && Object.values(GameState.equipment).some(s => s && (s.itemId === weaponId || s.id === weaponId));
    if (!GameState.ownedWeapons.includes(weaponId) && !isEquipped) {
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

    // Save previous weapon state to instance customData and weaponData
    const prevData = this.weaponData[this.currentWeaponId];
    if (prevData) {
      prevData.ammoInMag = this.ammoInMag;
    }
    const activeEquip = GameState.getActiveEquippedItem ? GameState.getActiveEquippedItem() : null;
    if (activeEquip && activeEquip.customData) {
      activeEquip.customData.ammoInMag = this.ammoInMag;
    }

    // Initiate SWITCHING_OUT state machine
    this.pendingWeaponId = weaponId;
    this.switchState = 'SWITCHING_OUT';
    this.switchTimer = this.switchDuration;

    sound.playWeaponSwitch();
    return true;
  }

  _completeWeaponSwitch(weaponId) {
    this.currentWeaponId = weaponId;
    const cfg = WEAPON_CONFIGS[weaponId];

    // Synchronize active equipment slot in GameState
    if (GameState.equipment) {
      for (const [slotKey, slotItem] of Object.entries(GameState.equipment)) {
        if (slotItem && (slotItem.itemId === weaponId || slotItem.id === weaponId)) {
          GameState.activeEquipSlot = slotKey;
          break;
        }
      }
    }

    // Load new weapon state
    const curData = this.weaponData[weaponId] || { ammoInMag: cfg.magCapacity, reserveAmmo: cfg.defaultReserve };
    this.magCapacity = cfg.magCapacity;

    // Instance ammo synchronization
    const activeEquip = GameState.getActiveEquippedItem ? GameState.getActiveEquippedItem() : null;
    if (activeEquip && activeEquip.customData && typeof activeEquip.customData.ammoInMag === 'number') {
      this.ammoInMag = activeEquip.customData.ammoInMag;
    } else {
      this.ammoInMag = curData.ammoInMag;
    }

    this.reserveAmmo = this.getReserveAmmo(weaponId);
    this.maxReserveAmmo = cfg.maxReserve;
    this.fireRate = cfg.fireRate;
    this.fireCooldown = 0.12;
    this.reloadDuration = cfg.reloadDuration;
    this.bodyDamage = cfg.bodyDamage;
    this.headshotDamage = cfg.headshotDamage;

    // Mesh visibility
    if (this.pistolGroup) this.pistolGroup.visible = (weaponId === 'pulse_pistol' || weaponId === 'desert_eagle');
    if (this.shotgunGroup) this.shotgunGroup.visible = (weaponId === 'scatter_blaster');
    if (this.rifleGroup) this.rifleGroup.visible = (weaponId === 'plasma_rifle' || weaponId === 'ak47');
    if (this.awpGroup) this.awpGroup.visible = (weaponId === 'awp' || weaponId === 'awm');
    if (this.macheteGroup) this.macheteGroup.visible = (weaponId === 'machete' || weaponId === 'combat_knife');

    // Reposition muzzle flash
    if (this.muzzleFlashMesh && cfg.muzzlePos) {
      this.muzzleFlashMesh.position.copy(cfg.muzzlePos);
      this.muzzleLight.position.copy(cfg.muzzlePos);
    } else if (this.muzzleFlashMesh) {
      this.muzzleFlashMesh.visible = false;
      this.muzzleLight.visible = false;
    }

    // Update UI
    if (this.uiManager) {
      this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
      this.uiManager.updateWeaponName(cfg.name);
      this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);
      this.uiManager.showAnnouncement(cfg.name, 'Senjata Aktif Dipilih', 1.2);
      this.uiManager.showReloadAlert(this.ammoInMag === 0 && !cfg.isMelee);
    }
  }

  nextWeapon() {
    this.cycleWeapons(1);
  }

  prevWeapon() {
    this.cycleWeapons(-1);
  }

  // --------------------------------------------------------------------------
  // FIRING & RAYCASTING
  // --------------------------------------------------------------------------
  getPlayerPosition() {
    if (this.player && this.player.yawObject) {
      return this.player.yawObject.position;
    }
    if (this.parentGroup && this.parentGroup.parent) {
      return this.parentGroup.parent.position;
    }
    return this.camera.position;
  }

  performMeleeAttack(cfg) {
    if (this.player) {
      if (this.player.isExhausted || this.player.stamina < 0.25) {
        if (this.uiManager) {
          this.uiManager.showAnnouncement('TERLALU LELAH!', 'Tunggu stamina pulih untuk menebas!', 1.2);
        }
        return;
      }
      this.player.stamina = Math.max(0, this.player.stamina - (cfg.staminaCost || 1.0));
      if (this.player.stamina <= 0.01) {
        this.player.stamina = 0;
        this.player.isExhausted = true;
      }
      if (this.uiManager && typeof this.uiManager.updateStamina === 'function') {
        this.uiManager.updateStamina(this.player.stamina, this.player.maxStamina, this.player.isExhausted);
      }
    }

    this.fireCooldown = cfg.fireRate;
    this.totalShots++;
    GameState.recordShotsFired(1);

    // Play blade whoosh sound
    sound.playMacheteSwing();

    // Trigger slashing motion
    this.recoilOffset.z = 0.08;
    this.recoilOffset.x = -0.06;
    this.recoilRotation.x = 0.42;
    this.recoilRotation.y = -0.32;
    this.recoilRotation.z = 0.22;

    if (this.uiManager) {
      this.uiManager.triggerCrosshairRecoil();
    }

    // Raycast up to cfg.range (2.3m reach)
    this.raycaster.setFromCamera(this.screenCenter, this.camera);
    const activeHitboxes = this.zombiesManager ? this.zombiesManager.getActiveHitboxes() : [];
    if (activeHitboxes.length > 0) {
      const intersects = this.raycaster.intersectObjects(activeHitboxes, true);
      if (intersects.length > 0 && intersects[0].distance <= (cfg.range || 2.3)) {
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
          const dmg = isHead ? cfg.headshotDamage : cfg.bodyDamage;
          this.totalHits++;
          GameState.recordDamageDealt(dmg);
          sound.playMacheteHit();
          if (isHead) {
            this.totalHeadshots++;
            GameState.recordHeadshot();
            sound.playHeadshot();
            if (this.uiManager) {
              this.uiManager.showHitMarker(true);
              this.uiManager.showAnnouncement('CRITICAL TEBASAN KEPALA! 🗡️', `+${dmg} DAMAGE`, 1.0);
            }
          } else {
            sound.playZombieHurt();
            if (this.uiManager) {
              this.uiManager.showHitMarker(false);
              this.uiManager.showAnnouncement('TEBASAN GOLOK! 🗡️', `+${dmg} DAMAGE`, 0.8);
            }
          }
          zombie.takeDamage(dmg, isHead);
        }
      }
    }
  }

  shoot() {
    if (this.isHolstered || this.switchState !== 'IDLE') return;
    const canShootPointer = (document.pointerLockElement !== null) || this.isTouchMode;
    if (!canShootPointer || this.isReloading || this.fireCooldown > 0) {
      return;
    }

    const cfg = WEAPON_CONFIGS[this.currentWeaponId] || WEAPON_CONFIGS.pulse_pistol;

    // --- MELEE WEAPON LOGIC (GOLOK PEDESAAN) ---
    if (cfg.isMelee) {
      this.performMeleeAttack(cfg);
      return;
    }

    // Out of ammo in current magazine
    if (this.ammoInMag <= 0) {
      sound.playDryFire();
      this.uiManager.showReloadAlert(true);
      return;
    }

    // Deduct bullet
    this.ammoInMag--;
    this.weaponData[this.currentWeaponId].ammoInMag = this.ammoInMag;
    this.totalShots++;
    this.fireCooldown = this.fireRate;
    GameState.recordShotsFired(1);
    GameState.recordAmmoUsed(1);

    // Play gunshot sound according to weapon
    if (cfg.sound === 'shotgun') {
      sound.playShotgunShot();
    } else if (cfg.sound === 'rifle') {
      sound.playRifleShot();
    } else if (cfg.sound === 'awp') {
      sound.playAwpShot();
    } else if (cfg.sound === 'deagle') {
      sound.playDeagleShot();
    } else {
      sound.playPistolShot();
    }

    // Gunshot Aggro: Caliber-dependent sound radius alerts zombies in vicinity!
    if (cfg.noiseRadius > 0 && this.zombiesManager && typeof this.zombiesManager.alertZombiesInRadius === 'function') {
      const pPos = this.getPlayerPosition();
      if (pPos) {
        this.zombiesManager.alertZombiesInRadius(pPos, cfg.noiseRadius);
      }
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
        GameState.recordDamageDealt(damage);
        if (isHead) {
          this.totalHeadshots++;
          GameState.recordHeadshot();
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
    this.reserveAmmo = this.getReserveAmmo(this.currentWeaponId);
    if (this.isReloading || this.switchState !== 'IDLE' || this.currentWeaponId === 'machete' || this.ammoInMag >= this.magCapacity || this.reserveAmmo <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    if (this.uiManager) {
      this.uiManager.showReloadAlert(false);
      this.uiManager.showReloadProgressBar(true);
    }

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

    // Weapon Switching State Machine (SWITCHING_OUT -> SWITCHING_IN -> IDLE)
    if (this.switchState === 'SWITCHING_OUT') {
      this.switchTimer -= delta;
      const progress = 1 - Math.max(0, this.switchTimer) / this.switchDuration;
      this.weaponGroup.position.y = this.defaultWeaponPos.y - progress * 0.25;
      this.weaponGroup.rotation.x = -progress * 0.45;
      if (this.switchTimer <= 0) {
        this._completeWeaponSwitch(this.pendingWeaponId);
        this.switchState = 'SWITCHING_IN';
        this.switchTimer = this.switchDuration;
      }
      return;
    } else if (this.switchState === 'SWITCHING_IN') {
      this.switchTimer -= delta;
      const progress = Math.max(0, this.switchTimer) / this.switchDuration;
      this.weaponGroup.position.y = this.defaultWeaponPos.y - progress * 0.25;
      this.weaponGroup.rotation.x = -progress * 0.45;
      if (this.switchTimer <= 0) {
        this.switchState = 'IDLE';
        this.weaponGroup.position.copy(this.defaultWeaponPos);
        this.weaponGroup.rotation.set(0, 0, 0);
      }
      return;
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
    const ammoItemId = this.getAmmoItemId(this.currentWeaponId);
    let loaded = 0;

    // Deduct ammo from player's inventory stacks first (Single Source of Truth)
    if (ammoItemId && Array.isArray(GameState.inventory)) {
      let toTake = needed;
      for (let i = 0; i < GameState.inventory.length; i++) {
        const slot = GameState.inventory[i];
        if (slot) {
          const slotId = slot.itemId || (slot.item ? slot.item.id : slot.id);
          if (slotId === ammoItemId) {
            const currentQty = slot.quantity || slot.count || 0;
            const take = Math.min(toTake, currentQty);
            GameState.removeItemFromInventory(i, take, false);
            loaded += take;
            toTake -= take;
            if (toTake <= 0) break;
          }
        }
      }
    }

    // Fallback to legacy weaponData reserve if needed
    if (loaded < needed && this.reserveAmmo > 0) {
      const takeFallback = Math.min(needed - loaded, this.reserveAmmo);
      this.reserveAmmo -= takeFallback;
      loaded += takeFallback;
    }

    this.ammoInMag += loaded;
    this.reserveAmmo = this.getReserveAmmo(this.currentWeaponId);

    if (this.weaponData[this.currentWeaponId]) {
      this.weaponData[this.currentWeaponId].ammoInMag = this.ammoInMag;
      this.weaponData[this.currentWeaponId].reserveAmmo = this.reserveAmmo;
    }

    // Update active equipment instance customData
    const activeEquip = GameState.getActiveEquippedItem ? GameState.getActiveEquippedItem() : null;
    if (activeEquip) {
      if (!activeEquip.customData) activeEquip.customData = {};
      activeEquip.customData.ammoInMag = this.ammoInMag;
    }
    GameState.saveToStorage();

    this.weaponGroup.position.copy(this.defaultWeaponPos);
    this.weaponGroup.rotation.set(0, 0, 0);

    if (this.uiManager) {
      this.uiManager.showReloadProgressBar(false);
      this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
      this.uiManager.updateQuickSelectBar(this.currentWeaponId, this.weaponData);
    }
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
      plasma_rifle: { ammoInMag: 30, reserveAmmo: 90 },
      machete: { ammoInMag: 1, reserveAmmo: 0 }
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
    if (this.macheteGroup) this.macheteGroup.visible = false;

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
