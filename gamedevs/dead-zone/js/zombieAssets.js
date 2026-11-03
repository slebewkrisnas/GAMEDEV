// ============================================================================
// DEAD ZONE — 3D ZOMBIE ASSET PIPELINE & SKELETAL ANIMATION SYSTEM
// Manages loading, PBR texturing, instancing (via SkeletonUtils.clone),
// and animation state controllers for Zombie Biasa and Boss Necromancer.
// ============================================================================

import * as THREE from 'three';
import { FBXLoader } from './libs/FBXLoader.js';
import { clone } from './libs/SkeletonUtils.js';

export const zombieAssets = {
  isLoaded: false,
  isLoading: false,
  loadProgress: 0,

  // Templates
  biasaTemplate: null,
  biasaClips: {},

  bossTemplate: null,
  bossClips: {},

  // PBR Materials
  materials: {
    biasa: null,
    bossBody: null,
    bossWeapon: null
  }
};

let _initPromise = null;

export function initZombieAssets() {
  if (_initPromise) return _initPromise;

  zombieAssets.isLoading = true;
  const fbxLoader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  // Helper to load texture with correct encoding
  function loadTex(url, isColor = false) {
    const tex = texLoader.load(encodeURI(url));
    if (isColor && THREE.SRGBColorSpace) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // 1. Prepare Textures
  const biasaAlbedo = loadTex('./zombie/zombie biasa/textures_web/2_Albedo.png', true);
  const biasaNormal = loadTex('./zombie/zombie biasa/textures_web/2_Normal.png');
  const biasaRough = loadTex('./zombie/zombie biasa/textures_web/2_gloss.png');
  const biasaMetal = loadTex('./zombie/zombie biasa/textures_web/2_Metallic.png');
  const biasaEmmi = loadTex('./zombie/zombie biasa/textures_web/2_Emission.jpg', true);

  zombieAssets.materials.biasa = new THREE.MeshStandardMaterial({
    map: biasaAlbedo,
    normalMap: biasaNormal,
    roughnessMap: biasaRough,
    metalnessMap: biasaMetal,
    emissiveMap: biasaEmmi,
    emissive: new THREE.Color(0x223322),
    emissiveIntensity: 0.35,
    roughness: 0.75,
    metalness: 0.15
  });

  const bossBodyAlbedo = loadTex('./zombie/bos zombie/textures_web/T_SKin1_Necromanser_Body_Albedo.png', true);
  const bossBodyNormal = loadTex('./zombie/bos zombie/textures_web/T_SKin1_Necromanser_Body_Normal.png');
  const bossBodyRough = loadTex('./zombie/bos zombie/textures_web/T_SKin1_Necromanser_Body_roughness.jpg');
  const bossBodyMetal = loadTex('./zombie/bos zombie/textures_web/T_SKin1_Necromanser_Body_Metallic.jpg');
  const bossBodyEmmi = loadTex('./zombie/bos zombie/textures_web/T_SKin1_Necromanser_Body_emmi.jpg', true);

  zombieAssets.materials.bossBody = new THREE.MeshStandardMaterial({
    map: bossBodyAlbedo,
    normalMap: bossBodyNormal,
    roughnessMap: bossBodyRough,
    metalnessMap: bossBodyMetal,
    emissiveMap: bossBodyEmmi,
    emissive: new THREE.Color(0x581c87),
    emissiveIntensity: 0.6,
    roughness: 0.65,
    metalness: 0.3
  });

  const bossWepAlbedo = loadTex('./zombie/bos zombie/textures_web/T_Skin1_Necromanser_Weapon_Albedo.png', true);
  const bossWepNormal = loadTex('./zombie/bos zombie/textures_web/T_Skin1_Necromanser_Weapon_Normal.png');
  const bossWepRough = loadTex('./zombie/bos zombie/textures_web/T_Skin1_Necromanser_Weapon_roughness.jpg');
  const bossWepMetal = loadTex('./zombie/bos zombie/textures_web/T_Skin1_Necromanser_Weapon_Metallic.jpg');
  const bossWepEmmi = loadTex('./zombie/bos zombie/textures_web/T_Skin1_Necromanser_Weapon_emmi.jpg', true);

  zombieAssets.materials.bossWeapon = new THREE.MeshStandardMaterial({
    map: bossWepAlbedo,
    normalMap: bossWepNormal,
    roughnessMap: bossWepRough,
    metalnessMap: bossWepMetal,
    emissiveMap: bossWepEmmi,
    emissive: new THREE.Color(0xd946ef),
    emissiveIntensity: 0.8,
    roughness: 0.45,
    metalness: 0.7
  });

  function loadFBX(url) {
    return new Promise((resolve, reject) => {
      fbxLoader.load(encodeURI(url), resolve, undefined, reject);
    });
  }

  _initPromise = (async () => {
    try {
      console.log('🔄 [DEAD-ZONE] Loading 3D Zombie FBX Assets & Animations...');

      // 2. Load Base Meshes
      const [biasaFbx, bossFbx] = await Promise.all([
        loadFBX('./zombie/zombie biasa/Base+mesh/Base mesh fbx.fbx'),
        loadFBX('./zombie/bos zombie/FBX+MB+BASE+MESH/FBX+MB BASE MESH/base mesh.fbx')
      ]);

      // Setup Biasa Template
      biasaFbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = zombieAssets.materials.biasa;
        }
      });
      biasaFbx.scale.set(0.01, 0.01, 0.01);
      zombieAssets.biasaTemplate = biasaFbx;

      // Setup Boss Template
      bossFbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.name.toLowerCase().includes('weapon') || (child.material && child.material.name.toLowerCase().includes('weapon'))) {
            child.material = zombieAssets.materials.bossWeapon;
          } else {
            child.material = zombieAssets.materials.bossBody;
          }
        }
      });
      bossFbx.scale.set(0.014, 0.014, 0.014);
      zombieAssets.bossTemplate = bossFbx;

      // 3. Load Animations in Parallel
      const [
        bIdle, bWalk, bRun, bAttack, bDeath,
        bossIdle, bossWalk, bossAttack, bossDeath, bossRoar
      ] = await Promise.all([
        loadFBX('./zombie/zombie biasa/Zombie+animation/animation fbx/zombie@idle1.fbx'),
        loadFBX('./zombie/zombie biasa/Zombie+animation/animation fbx/zombie@walk.fbx'),
        loadFBX('./zombie/zombie biasa/Zombie+animation/animation fbx/zombie@run.fbx'),
        loadFBX('./zombie/zombie biasa/Zombie+animation/animation fbx/zombie@atack1.fbx'),
        loadFBX('./zombie/zombie biasa/Zombie+animation/animation fbx/zombie@death1.fbx'),
        loadFBX('./zombie/bos zombie/animation+pack/Animation FBX/Necromancer@idle1.fbx'),
        loadFBX('./zombie/bos zombie/animation+pack/Animation FBX/Necromancer@walk.fbx'),
        loadFBX('./zombie/bos zombie/animation+pack/Animation FBX/Necromancer@atack1.fbx'),
        loadFBX('./zombie/bos zombie/animation+pack/Animation FBX/Necromancer@death.fbx'),
        loadFBX('./zombie/bos zombie/animation+pack/Animation FBX/Necromancer@roar.fbx')
      ]);

      zombieAssets.biasaClips.idle = bIdle.animations[0];
      zombieAssets.biasaClips.walk = bWalk.animations[0];
      zombieAssets.biasaClips.run = bRun.animations[0];
      zombieAssets.biasaClips.attack = bAttack.animations[0];
      zombieAssets.biasaClips.death = bDeath.animations[0];

      zombieAssets.bossClips.idle = bossIdle.animations[0];
      zombieAssets.bossClips.walk = bossWalk.animations[0];
      zombieAssets.bossClips.attack = bossAttack.animations[0];
      zombieAssets.bossClips.death = bossDeath.animations[0];
      zombieAssets.bossClips.roar = bossRoar.animations[0];

      zombieAssets.isLoaded = true;
      zombieAssets.isLoading = false;
      console.log('✅ [DEAD-ZONE] 3D Zombie Assets & Skeletal Animations READY!');
    } catch (err) {
      console.error('❌ [DEAD-ZONE] Failed to load zombie 3D assets:', err);
      zombieAssets.isLoading = false;
    }
  })();

  return _initPromise;
}

/**
 * Creates an instance of a 3D zombie model with its own independent skeleton & mixer.
 * @param {string} type - 'walker', 'runner', 'tank', 'brute', 'stalker', or 'boss'
 * @returns {Object|null} { model, mixer, actions, type }
 */
export function createZombieInstance(type = 'walker') {
  if (!zombieAssets.isLoaded) return null;

  const isBoss = (type === 'boss');
  const template = isBoss ? zombieAssets.bossTemplate : zombieAssets.biasaTemplate;
  const clips = isBoss ? zombieAssets.bossClips : zombieAssets.biasaClips;

  if (!template) return null;

  // Deep clone mesh & bones using SkeletonUtils
  const model = clone(template);

  // Facing adjustment container:
  // Maya FBX models face -Z or +Z; container handles orientation
  const rootGroup = new THREE.Group();
  rootGroup.name = `Zombie3D_${type}`;

  // FBX forward orientation offset
  model.rotation.y = Math.PI; // Face forward along +Z in container
  rootGroup.add(model);

  // Animation Mixer
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};

  if (clips.idle) {
    actions.idle = mixer.clipAction(clips.idle);
  }

  if (clips.walk) {
    actions.walk = mixer.clipAction(clips.walk);
  }

  if (clips.run) {
    actions.run = mixer.clipAction(clips.run);
  }

  if (clips.attack) {
    actions.attack = mixer.clipAction(clips.attack);
  }

  if (clips.death) {
    actions.death = mixer.clipAction(clips.death);
    actions.death.setLoop(THREE.LoopOnce);
    actions.death.clampWhenFinished = true;
  }

  if (clips.roar) {
    actions.roar = mixer.clipAction(clips.roar);
  }

  // Variant-specific tweaks
  if (type === 'runner' && actions.run) {
    actions.run.setEffectiveTimeScale(1.25);
  } else if ((type === 'tank' || type === 'brute') && actions.walk) {
    actions.walk.setEffectiveTimeScale(0.85);
  } else if (isBoss) {
    if (actions.walk) actions.walk.setEffectiveTimeScale(0.9);
    if (actions.attack) actions.attack.setEffectiveTimeScale(1.1);
  }

  return {
    group: rootGroup,
    model: model,
    mixer: mixer,
    actions: actions,
    currentAction: null,
    isBoss: isBoss
  };
}

/**
 * Transitions smoothly between skeletal animations on the zombie.
 */
export function playZombieAction(zInstance, actionName, fadeDuration = 0.25) {
  if (!zInstance || !zInstance.actions) return;

  // Fallback mapping if action not found
  let targetAction = zInstance.actions[actionName];
  if (!targetAction && actionName === 'run' && zInstance.actions.walk) {
    targetAction = zInstance.actions.walk;
  }

  if (!targetAction) return;

  if (zInstance.currentAction === targetAction && targetAction.isRunning()) {
    return;
  }

  const prevAction = zInstance.currentAction;
  targetAction.reset();
  targetAction.setEffectiveWeight(1.0);
  targetAction.fadeIn(fadeDuration);
  targetAction.play();

  if (prevAction && prevAction !== targetAction) {
    prevAction.fadeOut(fadeDuration);
  }

  zInstance.currentAction = targetAction;
}

