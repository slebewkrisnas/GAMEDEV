import * as THREE from 'three';
import { GLTFLoader } from '../libs/GLTFLoader.js';
import { FBXLoader } from '../libs/FBXLoader.js';
import { SPAWN_POS } from './world.js';

// ==================== KONSTANTA FISIKA KARAKTER ====================
export const JUMP_FORCE = 12.0;
export const GRAVITY = 28.0;

// ==================== STATE KARAKTER & ANIMASI ====================
export const player = new THREE.Group();
export const proceduralModel = new THREE.Group();
export let realisticModel = null;
export let realisticBones = null;
export let usingRealisticModel = false;

export let characterMixer = null;
export const animActions = {
  idle: null,
  walk: null,
  run: null,
  jump: null
};
export let currentActionName = 'idle';
export let fbxAnimationsLoaded = false;
export let anim = null;

let _onPlayerReadyCallbacks = [];
let _onPlayerProgressCallbacks = [];
export let isCharacterFullyReady = false;

export function onPlayerReady(cb) {
  if (isCharacterFullyReady) {
    cb();
  } else {
    _onPlayerReadyCallbacks.push(cb);
  }
}

export function onPlayerProgress(cb) {
  _onPlayerProgressCallbacks.push(cb);
}

export function notifyPlayerProgress(percent, statusText) {
  for (const cb of _onPlayerProgressCallbacks) {
    try { cb(percent, statusText); } catch (e) { console.error(e); }
  }
}

export function notifyPlayerReady() {
  if (isCharacterFullyReady) return;
  isCharacterFullyReady = true;
  for (const cb of _onPlayerReadyCallbacks) {
    try { cb(); } catch (e) { console.error(e); }
  }
  _onPlayerReadyCallbacks = [];
}

export function getCharacterMixer() { return characterMixer; }
export function isFBXLoaded() { return fbxAnimationsLoaded; }
export function isUsingRealisticModel() { return usingRealisticModel; }
export function getRealisticBones() { return realisticBones; }
export function getCurrentActionName() { return currentActionName; }
export function getAnimActions() { return animActions; }
export function getAnim() { return anim; }

// ==================== POSE KEPALAN TANGAN (CLENCHED FIST) ====================
// Menjaga agar seluruh 30 tulang jari selalu mengepal kokoh & maskulin di setiap frame
export function applyFistPose() {
  if (!realisticBones || !realisticBones.fistFingerMap) return;
  for (const [bone, qFist] of realisticBones.fistFingerMap.entries()) {
    bone.quaternion.copy(qFist);
  }
}

export function getFistFingerQuats(targetModel, bindQuats = null) {
  const bonesMap = {};
  targetModel.traverse((c) => { if (c.isBone) bonesMap[c.name] = c; });

  const fistQuats = new Map();
  const fingerCurlConfig = {
    index:  [-1.25, -1.50, -1.30],
    middle: [-1.28, -1.55, -1.32],
    ring:   [-1.26, -1.52, -1.30],
    pinky:  [-1.22, -1.48, -1.28]
  };

  ['l', 'r'].forEach(side => {
    // 4 Jari utama: Tekuk buku jari (knuckle) & lipat erat ke dalam telapak
    for (const [finger, curls] of Object.entries(fingerCurlConfig)) {
      for (let j = 1; j <= 3; j++) {
        const boneName = `c_${finger}${j}.${side}`;
        const bone = bonesMap[boneName];
        if (!bone) continue;
        const qBind = (bindQuats && bindQuats.has(bone)) ? bindQuats.get(bone).clone() : bone.quaternion.clone();
        const angle = curls[j - 1];
        const splayZ = (finger === 'index' ? -0.06 : (finger === 'pinky' ? 0.08 : (finger === 'ring' ? 0.04 : 0))) * (side === 'l' ? 1 : -1);
        const qCurl = new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, 0, splayZ, 'XYZ'));
        fistQuats.set(bone, qBind.clone().multiply(qCurl));
      }
    }

    // Ibu Jari (Thumb): Mengunci kokoh melintang di depan jari-jari
    const t1 = bonesMap[`c_thumb1.${side}`];
    const t2 = bonesMap[`c_thumb2.${side}`];
    const t3 = bonesMap[`c_thumb3.${side}`];

    if (t1) {
      const qBind1 = (bindQuats && bindQuats.has(t1)) ? bindQuats.get(t1).clone() : t1.quaternion.clone();
      const euler1 = side === 'l' ? new THREE.Euler(-0.45, 0.35, -0.55, 'XYZ') : new THREE.Euler(-0.45, -0.35, 0.55, 'XYZ');
      fistQuats.set(t1, qBind1.clone().multiply(new THREE.Quaternion().setFromEuler(euler1)));
    }
    if (t2) {
      const qBind2 = (bindQuats && bindQuats.has(t2)) ? bindQuats.get(t2).clone() : t2.quaternion.clone();
      fistQuats.set(t2, qBind2.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.95, 0, 0, 'XYZ'))));
    }
    if (t3) {
      const qBind3 = (bindQuats && bindQuats.has(t3)) ? bindQuats.get(t3).clone() : t3.quaternion.clone();
      fistQuats.set(t3, qBind3.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.05, 0, 0, 'XYZ'))));
    }
  });

  return fistQuats;
}

// player declared above
// proceduralModel declared above
proceduralModel.visible = false; // Model lama dinonaktifkan secara default agar tidak muncul
player.add(proceduralModel);

// ==================== SISTEM ANIMASI FBX DARI FOLDER ANIMATION ====================
// characterMixer declared above
// animActions declared above
// currentActionName declared above
// fbxAnimationsLoaded declared above

const MIXAMO_ARP_BONE_PAIRS = [
  // Pelvis & Spine
  ['mixamorigHips', 'rootx'],
  ['mixamorigSpine', 'spine_01x'],
  ['mixamorigSpine1', 'spine_02x'],
  ['mixamorigSpine2', 'spine_03x'],
  ['mixamorigNeck', 'neckx'],
  ['mixamorigHead', 'headx'],
  // Clavicles & Arms
  ['mixamorigLeftShoulder', 'shoulderl'],
  ['mixamorigLeftArm', 'arm_stretchl'],
  ['mixamorigLeftForeArm', 'forearm_stretchl'],
  ['mixamorigLeftHand', 'handl'],
  ['mixamorigRightShoulder', 'shoulderr'],
  ['mixamorigRightArm', 'arm_stretchr'],
  ['mixamorigRightForeArm', 'forearm_stretchr'],
  ['mixamorigRightHand', 'handr'],
  // Legs
  ['mixamorigLeftUpLeg', 'thigh_stretchl'],
  ['mixamorigLeftLeg', 'leg_stretchl'],
  ['mixamorigLeftFoot', 'footl'],
  ['mixamorigLeftToeBase', 'toes_01l'],
  ['mixamorigRightUpLeg', 'thigh_stretchr'],
  ['mixamorigRightLeg', 'leg_stretchr'],
  ['mixamorigRightFoot', 'footr'],
  ['mixamorigRightToeBase', 'toes_01r']
];

export function playCharacterAnimation(targetName, fadeDuration = 0.2) {
  if (!characterMixer || !fbxAnimationsLoaded) return;
  if (currentActionName === targetName) return;

  const prevAction = animActions[currentActionName];
  const nextAction = animActions[targetName];

  if (nextAction) {
    nextAction.reset();
    if (targetName === 'jump') {
      // Jumping.fbx mocap memiliki jeda crouch 0.38 detik sebelum lepas landas.
      // Pada gameplay responsif, dorongan lompat seketika (instant physics launch),
      // sehingga kita langsung lompat ke frame lepas landas/tuck di udara (t = 0.38s) dengan playback lincah.
      nextAction.time = 0.38;
      nextAction.setEffectiveTimeScale(1.15);
    } else {
      nextAction.setEffectiveTimeScale(1.0);
    }
    nextAction.setEffectiveWeight(1.0);
    nextAction.fadeIn(fadeDuration);
    nextAction.play();
  }

  if (prevAction) {
    prevAction.fadeOut(fadeDuration);
  }

  currentActionName = targetName;
}

function getRelativeQuatChain(obj, root, bindQuatsMap = null) {
  const q = new THREE.Quaternion();
  let cur = obj;
  const chain = [];
  while (cur && cur !== root) {
    const qLocal = (bindQuatsMap && bindQuatsMap.has(cur)) ? bindQuatsMap.get(cur) : cur.quaternion;
    chain.unshift(qLocal);
    cur = cur.parent;
  }
  for (const qLocal of chain) {
    q.multiply(qLocal);
  }
  return q;
}

function getBoneDirInModel(b, child, root) {
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  b.getWorldPosition(p1);
  child.getWorldPosition(p2);
  root.worldToLocal(p1);
  root.worldToLocal(p2);
  return p2.sub(p1).normalize();
}

async function loadAndRetargetFBX(fbxLoader, targetModel, candidates, clipName, bindQuats = null, fistFingerMap = null) {
  let loadedFbx = null;
  for (const url of candidates) {
    try {
      loadedFbx = await new Promise((resolve, reject) => {
        fbxLoader.load(url, resolve, undefined, reject);
      });
      if (loadedFbx) break;
    } catch (e) {
      // coba kandidat berikutnya
    }
  }

  if (!loadedFbx || !loadedFbx.animations || loadedFbx.animations.length === 0) {
    console.warn(`[FBX Loader] Gagal memuat klip animasi: ${clipName}`);
    return null;
  }

  // Pastikan targetModel berada dalam bind pose murni sebelum pembacaan alignment / rest directions
  if (bindQuats) {
    for (const [bone, qBind] of bindQuats.entries()) {
      bone.quaternion.copy(qBind);
    }
    targetModel.updateMatrixWorld(true);
  }

  loadedFbx.position.set(0, 0, 0);
  loadedFbx.rotation.set(0, 0, 0);
  loadedFbx.scale.set(1, 1, 1);
  loadedFbx.updateMatrixWorld(true);

  const clip = loadedFbx.animations[0];
  const fbxBones = {};
  loadedFbx.traverse((c) => { if (c.isBone) fbxBones[c.name] = c; });

  const gltfBones = {};
  targetModel.traverse((c) => { if (c.isBone) gltfBones[c.name] = c; });

  // Hitung kuaternion rotasi penyesuaian (A-Pose vs T-Pose) langsung dalam koordinat model-space murni
  const dirMixArmL = getBoneDirInModel(fbxBones['mixamorigLeftArm'], fbxBones['mixamorigLeftForeArm'], loadedFbx);
  const dirGltfArmL = getBoneDirInModel(gltfBones['arm_stretchl'], gltfBones['forearm_stretchl'], targetModel);
  const qAlignArmL = new THREE.Quaternion().setFromUnitVectors(dirMixArmL, dirGltfArmL);

  const dirMixForeArmL = getBoneDirInModel(fbxBones['mixamorigLeftForeArm'], fbxBones['mixamorigLeftHand'], loadedFbx);
  const dirGltfForeArmL = getBoneDirInModel(gltfBones['forearm_stretchl'], gltfBones['handl'], targetModel);
  const qAlignForeArmL = new THREE.Quaternion().setFromUnitVectors(dirMixForeArmL, dirGltfForeArmL);

  const mixMiddleL = fbxBones['mixamorigLeftHandMiddle1'] || (fbxBones['mixamorigLeftHand'] && fbxBones['mixamorigLeftHand'].children[0]);
  const gltfMiddleL = gltfBones['c_middle1l'] || (gltfBones['handl'] && (gltfBones['handl'].children.find(c => c.name.includes('middle')) || gltfBones['handl'].children[0]));
  const qAlignHandL = (mixMiddleL && gltfMiddleL)
    ? new THREE.Quaternion().setFromUnitVectors(
        getBoneDirInModel(fbxBones['mixamorigLeftHand'], mixMiddleL, loadedFbx),
        getBoneDirInModel(gltfBones['handl'], gltfMiddleL, targetModel)
      )
    : null;

  const dirMixArmR = getBoneDirInModel(fbxBones['mixamorigRightArm'], fbxBones['mixamorigRightForeArm'], loadedFbx);
  const dirGltfArmR = getBoneDirInModel(gltfBones['arm_stretchr'], gltfBones['forearm_stretchr'], targetModel);
  const qAlignArmR = new THREE.Quaternion().setFromUnitVectors(dirMixArmR, dirGltfArmR);

  const dirMixForeArmR = getBoneDirInModel(fbxBones['mixamorigRightForeArm'], fbxBones['mixamorigRightHand'], loadedFbx);
  const dirGltfForeArmR = getBoneDirInModel(gltfBones['forearm_stretchr'], gltfBones['handr'], targetModel);
  const qAlignForeArmR = new THREE.Quaternion().setFromUnitVectors(dirMixForeArmR, dirGltfForeArmR);

  const mixMiddleR = fbxBones['mixamorigRightHandMiddle1'] || (fbxBones['mixamorigRightHand'] && fbxBones['mixamorigRightHand'].children[0]);
  const gltfMiddleR = gltfBones['c_middle1r'] || (gltfBones['handr'] && (gltfBones['handr'].children.find(c => c.name.includes('middle')) || gltfBones['handr'].children[0]));
  const qAlignHandR = (mixMiddleR && gltfMiddleR)
    ? new THREE.Quaternion().setFromUnitVectors(
        getBoneDirInModel(fbxBones['mixamorigRightHand'], mixMiddleR, loadedFbx),
        getBoneDirInModel(gltfBones['handr'], gltfMiddleR, targetModel)
      )
    : null;

  const alignMap = {
    'mixamorigLeftArm': qAlignArmL,
    'mixamorigLeftForeArm': qAlignForeArmL,
    'mixamorigRightArm': qAlignArmR,
    'mixamorigRightForeArm': qAlignForeArmR
  };
  if (qAlignHandL) alignMap['mixamorigLeftHand'] = qAlignHandL;
  if (qAlignHandR) alignMap['mixamorigRightHand'] = qAlignHandR;

  const boneData = [];
  for (const [mName, gName] of MIXAMO_ARP_BONE_PAIRS) {
    const mBone = fbxBones[mName];
    const gBone = gltfBones[gName];
    if (mBone && gBone) {
      const qMixBind = getRelativeQuatChain(mBone, loadedFbx);
      const qGltfBind = getRelativeQuatChain(gBone, targetModel, bindQuats);

      let qMixBindEff = qMixBind.clone();
      if (alignMap[mName]) {
        qMixBindEff = alignMap[mName].clone().multiply(qMixBind);
      }

      boneData.push({
        mName,
        gName,
        mBone,
        gBone,
        qMixBindEffInv: qMixBindEff.clone().invert(),
        qGltfBind,
        bindLocal: (bindQuats && bindQuats.has(gBone)) ? bindQuats.get(gBone).clone() : gBone.quaternion.clone()
      });
    }
  }

  const duration = clip.duration;
  const mixerFbx = new THREE.AnimationMixer(loadedFbx);
  const actFbx = mixerFbx.clipAction(clip);
  actFbx.play();

  const sampleFPS = 30;
  const totalFrames = Math.floor(duration * sampleFPS) + 1;
  const times = new Float32Array(totalFrames);
  const tracksData = boneData.map(() => new Float32Array(totalFrames * 4));

  const qMixCur = new THREE.Quaternion();
  const deltaQ = new THREE.Quaternion();
  const qTargetWorld = new THREE.Quaternion();
  const qTargetLocal = new THREE.Quaternion();

  for (let f = 0; f < totalFrames; f++) {
    const t = Math.min(f / sampleFPS, duration);
    times[f] = t;
    mixerFbx.setTime(t);
    loadedFbx.updateMatrixWorld(true);

    const targetModelQuats = new Map();

    for (let bIdx = 0; bIdx < boneData.length; bIdx++) {
      const b = boneData[bIdx];
      qMixCur.copy(getRelativeQuatChain(b.mBone, loadedFbx));
      deltaQ.copy(qMixCur).multiply(b.qMixBindEffInv);

      // Redam ayunan pelvis berlebih agar badan tidak goyang liar
      if (b.gName === 'rootx') {
        deltaQ.slerp(new THREE.Quaternion(), 0.5);
      }

      // Kunci dan stabilkan pergelangan tangan agar kepalan tangan tegak, kokoh, dan maskulin sejajar lengan bawah (tidak lunglai / bencong)
      if (b.gName === 'handl' || b.gName === 'handr') {
        deltaQ.slerp(new THREE.Quaternion(), 0.92);
      }

      qTargetWorld.copy(deltaQ).multiply(b.qGltfBind);
      targetModelQuats.set(b.gBone, qTargetWorld.clone());

      const parentGBone = b.gBone.parent;
      let parentQuat = null;
      if (parentGBone && targetModelQuats.has(parentGBone)) {
        parentQuat = targetModelQuats.get(parentGBone);
      } else if (parentGBone && parentGBone.isBone) {
        parentQuat = getRelativeQuatChain(parentGBone, targetModel, bindQuats);
      }

      if (parentQuat) {
        qTargetLocal.copy(parentQuat).invert().multiply(qTargetWorld);
      } else {
        qTargetLocal.copy(qTargetWorld);
      }

      const valIdx = f * 4;
      tracksData[bIdx][valIdx] = qTargetLocal.x;
      tracksData[bIdx][valIdx+1] = qTargetLocal.y;
      tracksData[bIdx][valIdx+2] = qTargetLocal.z;
      tracksData[bIdx][valIdx+3] = qTargetLocal.w;
    }
  }

  const newTracks = [];
  for (let bIdx = 0; bIdx < boneData.length; bIdx++) {
    newTracks.push(new THREE.QuaternionKeyframeTrack(
      boneData[bIdx].gName + '.quaternion',
      times,
      tracksData[bIdx]
    ));
  }

  // Tambahkan track kepalan tangan (clenched fist) untuk seluruh 30 tulang jari agar tangan selalu mengepal kokoh
  if (fistFingerMap && fistFingerMap.size > 0) {
    for (const [fBone, qFist] of fistFingerMap.entries()) {
      newTracks.push(new THREE.QuaternionKeyframeTrack(
        fBone.name + '.quaternion',
        [0, duration],
        [qFist.x, qFist.y, qFist.z, qFist.w, qFist.x, qFist.y, qFist.z, qFist.w]
      ));
    }
  }

  return { clip: new THREE.AnimationClip(clipName, duration, newTracks), boneData };
}

async function initFBXAnimations(targetModel, bindQuats = null, fistFingerMap = null) {
  try {
    if (!fistFingerMap) {
      fistFingerMap = getFistFingerQuats(targetModel, bindQuats);
    }
    const fbxLoader = new FBXLoader();
    console.log('[FBX Loader] Memuat dan me-retarget animasi dari folder animation...');
    notifyPlayerProgress(82, 'Memuat & me-retarget animasi FBX (Walk, Run, Jump)...');

    const [walkRes, runRes, jumpRes] = await Promise.all([
      loadAndRetargetFBX(fbxLoader, targetModel, [
        './animation/Walking.fbx',
        '../animation/Walking.fbx',
        '/animation/Walking.fbx',
        '/gamedevs/animation/Walking.fbx'
      ], 'Walk', bindQuats, fistFingerMap),
      loadAndRetargetFBX(fbxLoader, targetModel, [
        './animation/Fast Run.fbx',
        '../animation/Fast Run.fbx',
        '/animation/Fast Run.fbx',
        '/gamedevs/animation/Fast Run.fbx'
      ], 'Run', bindQuats, fistFingerMap),
      loadAndRetargetFBX(fbxLoader, targetModel, [
        './animation/Jumping.fbx',
        '../animation/Jumping.fbx',
        '/animation/Jumping.fbx',
        '/gamedevs/animation/Jumping.fbx'
      ], 'Jump', bindQuats, fistFingerMap)
    ]);

    const walkClip = walkRes ? walkRes.clip : null;
    const runClip = runRes ? runRes.clip : null;
    const jumpClip = jumpRes ? jumpRes.clip : null;
    const refBoneData = (walkRes && walkRes.boneData) || (runRes && runRes.boneData) || (jumpRes && jumpRes.boneData);

    // Bangun Idle Clip organik dengan pernapasan dada alami & postur relaks
    let idleClip = null;
    if (refBoneData) {
      const idleTracks = [];
      const idleDuration = 2.4;
      const idleTimes = [0, idleDuration * 0.5, idleDuration];

      for (const b of refBoneData) {
        let q0 = (bindQuats && bindQuats.has(b.gBone)) ? bindQuats.get(b.gBone).clone() : b.bindLocal.clone();

        // Relaksasikan lengan dari T-Pose ke samping pinggul untuk postur berdiri alami
        if (b.gName === 'arm_stretchl') {
          const qRelax = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.24, 0, -0.04, 'ZYX'));
          q0.multiply(qRelax);
        } else if (b.gName === 'arm_stretchr') {
          const qRelax = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.24, 0, 0.04, 'ZYX'));
          q0.multiply(qRelax);
        } else if (b.gName === 'forearm_stretchl') {
          const qRelax = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.22, 'ZYX'));
          q0.multiply(qRelax);
        } else if (b.gName === 'forearm_stretchr') {
          const qRelax = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.22, 'ZYX'));
          q0.multiply(qRelax);
        } else if (b.gName === 'handl') {
          // Kepalan tangan kiri tegap rapi sejajar sisi paha
          const qFist = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, -0.10, 'ZYX'));
          q0.multiply(qFist);
        } else if (b.gName === 'handr') {
          // Kepalan tangan kanan tegap rapi sejajar sisi paha
          const qFist = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.12, 0.10, 'ZYX'));
          q0.multiply(qFist);
        }

        let qMid = q0.clone();

        // Pernapasan ritmik halus pada tulang belakang & dada
        if (b.gName === 'spine_02x' || b.gName === 'spine_03x') {
          const qBreath = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.025);
          qMid.multiply(qBreath);
        } else if (b.gName === 'shoulderl' || b.gName === 'shoulderr') {
          const qShoulderBreath = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), b.gName === 'shoulderl' ? 0.015 : -0.015);
          qMid.multiply(qShoulderBreath);
        }

        idleTracks.push(new THREE.QuaternionKeyframeTrack(
          b.gName + '.quaternion',
          idleTimes,
          [q0.x, q0.y, q0.z, q0.w, qMid.x, qMid.y, qMid.z, qMid.w, q0.x, q0.y, q0.z, q0.w]
        ));
      }

      // Tambahkan track kepalan tangan (clenched fist) untuk seluruh 30 tulang jari saat idle
      if (fistFingerMap && fistFingerMap.size > 0) {
        for (const [fBone, qFist] of fistFingerMap.entries()) {
          idleTracks.push(new THREE.QuaternionKeyframeTrack(
            fBone.name + '.quaternion',
            [0, idleDuration],
            [qFist.x, qFist.y, qFist.z, qFist.w, qFist.x, qFist.y, qFist.z, qFist.w]
          ));
        }
      }

      idleClip = new THREE.AnimationClip('Idle', idleDuration, idleTracks);
    }

    // Pastikan seluruh tulang dikembalikan ke bind pose murni sebelum mixer diaktifkan
    if (bindQuats) {
      for (const [bone, qBind] of bindQuats.entries()) {
        bone.quaternion.copy(qBind);
      }
      targetModel.updateMatrixWorld(true);
    }

    // Terapkan pose kepalan tangan ke seluruh 30 tulang jari
    if (fistFingerMap && fistFingerMap.size > 0) {
      for (const [bone, qFist] of fistFingerMap.entries()) {
        bone.quaternion.copy(qFist);
      }
      targetModel.updateMatrixWorld(true);
    }

    characterMixer = new THREE.AnimationMixer(targetModel);

    if (idleClip) {
      animActions.idle = characterMixer.clipAction(idleClip);
      animActions.idle.setLoop(THREE.LoopRepeat);
      animActions.idle.play();
    }
    if (walkClip) {
      animActions.walk = characterMixer.clipAction(walkClip);
      animActions.walk.setLoop(THREE.LoopRepeat);
    }
    if (runClip) {
      animActions.run = characterMixer.clipAction(runClip);
      animActions.run.setLoop(THREE.LoopRepeat);
    }
    if (jumpClip) {
      animActions.jump = characterMixer.clipAction(jumpClip);
      animActions.jump.setLoop(THREE.LoopOnce);
      animActions.jump.clampWhenFinished = true;
    }

    characterMixer.addEventListener('finished', (e) => {
      if (e.action === animActions.jump) {
        if (isGrounded) {
          if (keys['w'] || keys['s'] || keys['a'] || keys['d'] || keys['arrowup'] || keys['arrowdown'] || keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) {
            playCharacterAnimation(isSprinting ? 'run' : 'walk', 0.2);
          } else {
            playCharacterAnimation('idle', 0.2);
          }
        }
      }
    });

    currentActionName = 'idle';
    fbxAnimationsLoaded = true;
    console.log('[FBX Loader] Seluruh animasi FBX (Walking, Fast Run, Jumping) berhasil aktif di Realistic Man dengan postur tegak sempurna!');
    return true;
  } catch (err) {
    console.warn('[FBX Loader] Gagal inisialisasi FBX animations, menggunakan fallback prosedural:', err);
    return false;
  }
}

// Variabel dan Cache untuk Realistic Man Model (GLB)
// realisticModel declared above
// realisticBones declared above
// usingRealisticModel declared above

const _tempBoneEuler = new THREE.Euler();
const _tempBoneQuat = new THREE.Quaternion();

export function rotateRealisticBone(bone, x, y, z) {
  if (!bone || !realisticBones || !realisticBones.binds) return;
  const bind = realisticBones.binds.get(bone);
  if (!bind) return;
  _tempBoneEuler.set(x, y, z, 'ZYX');
  _tempBoneQuat.setFromEuler(_tempBoneEuler);
  bone.quaternion.copy(bind).multiply(_tempBoneQuat);
}

// Inisialisasi pemuatan model 3D Realistic Man dengan multi-candidate URL
function loadRealisticManModel() {
  const badge = document.getElementById('characterLoaderBadge');
  const badgeText = document.getElementById('charLoaderText');
  if (badge) {
    badge.style.display = 'flex';
    badge.style.opacity = '1';
    badge.classList.remove('hidden');
  }

  const loader = new GLTFLoader();

  const candidateUrls = [
    './realistic_man.glb',
    './Realistic man_Glb/realistic_man.glb',
    './Realistic man_Glb/Realistic man.glb',
    '../Realistic man_Glb/realistic_man.glb',
    '../Realistic man_Glb/Realistic man.glb',
    '/Realistic man_Glb/realistic_man.glb',
    '/gamedevs/realistic_man.glb'
  ];

  let candidateIdx = 0;

  function tryNextCandidate() {
    if (candidateIdx >= candidateUrls.length) {
      console.warn('Semua path GLB gagal dimuat. Mengaktifkan model cadangan.');
      proceduralModel.visible = true;
      if (badgeText) badgeText.textContent = 'Gagal memuat GLB Karakter';
      setTimeout(() => { if (badge) badge.style.display = 'none'; }, 2000);
      notifyPlayerProgress(100, 'Dunia siap dimainkan!');
      notifyPlayerReady();
      return;
    }

    const currentUrl = candidateUrls[candidateIdx];
    console.log(`[ModelLoader] Memuat Realistic Man dari: "${currentUrl}" (${candidateIdx + 1}/${candidateUrls.length})`);
    notifyPlayerProgress(20, 'Mengunduh model 3D karakter...');

    loader.load(
      currentUrl,
      (gltf) => {
        realisticModel = gltf.scene;

        // Optimasi bayangan & material khusus
        realisticModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const matName = child.material.name || '';
              const meshName = child.name || '';
              if (matName.includes('Hair') || matName.includes('Scalp') || meshName.includes('Buzz') || meshName.includes('Hair')) {
                child.material.alphaTest = 0.45;
                child.material.depthWrite = true;
              }
              if (matName.includes('Tear') || matName.includes('Occlusion') || meshName.includes('EyeOcclusion') || meshName.includes('TearLine')) {
                child.material.transparent = true;
                child.material.depthWrite = false;
              }
              child.material.needsUpdate = true;
            }
          }
        });

        // Bounding box asli ~1.86m. Di dalam player yang berskala 1.28,
        // skala 0.88 menghasilkan tinggi total 1.86 * 0.88 * 1.28 ≈ 2.09m (postur gagah proporsional).
        realisticModel.scale.set(0.88, 0.88, 0.88);
        realisticModel.position.set(0, 0, 0);

        // Mapping skeletal bones dari rig Auto-Rig Pro
        const bonesMap = {};
        const bindQuats = new Map();

        realisticModel.traverse((obj) => {
          if (obj.isBone) {
            bonesMap[obj.name] = obj;
            bindQuats.set(obj, obj.quaternion.clone());
          }
        });

        function findBone(regex) {
          for (const k in bonesMap) {
            if (regex.test(k)) return bonesMap[k];
          }
          return null;
        }

        const fistFingerMap = getFistFingerQuats(realisticModel, bindQuats);

        // Langsung terapkan kepalan tangan kokoh ke bind pose awal model 3D
        if (fistFingerMap && fistFingerMap.size > 0) {
          for (const [bone, qFist] of fistFingerMap.entries()) {
            bone.quaternion.copy(qFist);
          }
          realisticModel.updateMatrixWorld(true);
        }

        realisticBones = {
          thighL: findBone(/^thigh_stretch\.?l$/i),
          thighR: findBone(/^thigh_stretch\.?r$/i),
          legL: findBone(/^leg_stretch\.?l$/i),
          legR: findBone(/^leg_stretch\.?r$/i),
          footL: findBone(/^foot\.?l$/i),
          footR: findBone(/^foot\.?r$/i),
          armL: findBone(/^arm_stretch\.?l$/i),
          armR: findBone(/^arm_stretch\.?r$/i),
          forearmL: findBone(/^forearm_stretch\.?l$/i),
          forearmR: findBone(/^forearm_stretch\.?r$/i),
          handL: findBone(/^hand\.?l$/i),
          handR: findBone(/^hand\.?r$/i),
          spine: findBone(/^spine_01\.?x$/i) || findBone(/^spine_02\.?x$/i),
          head: findBone(/^head\.?x$/i),
          neck: findBone(/^neck\.?x$/i),
          binds: bindQuats,
          fistFingerMap: fistFingerMap
        };

        // Tambahkan model realistis ke player dalam posisi invisible terlebih dahulu
        // agar tidak terkena manipulasi rotasi prosedural sela saat animasi FBX di-download & retarget
        player.add(realisticModel);
        realisticModel.visible = false;

        initFBXAnimations(realisticModel, bindQuats, fistFingerMap).then((success) => {
          realisticModel.visible = true;
          proceduralModel.visible = false;
          usingRealisticModel = true;

          // Update badge loading
          if (badgeText) badgeText.textContent = 'Karakter Siap!';
          setTimeout(() => {
            if (badge) {
              badge.style.opacity = '0';
              setTimeout(() => { badge.style.display = 'none'; }, 500);
            }
          }, 1000);
          console.log(`[ModelLoader] Model Realistic Man & FBX Animasi berhasil aktif dari: "${currentUrl}"! (sukses: ${success})`);
          notifyPlayerProgress(100, 'Karakter & animasi siap!');
          notifyPlayerReady();
        });
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          const overall = Math.min(78, 20 + Math.round(pct * 0.58));
          const mbLoaded = (xhr.loaded / (1024 * 1024)).toFixed(1);
          const mbTotal = (xhr.total / (1024 * 1024)).toFixed(1);
          if (badgeText) badgeText.textContent = `Memuat Karakter 3D... ${pct}% (${mbLoaded}/${mbTotal} MB)`;
          notifyPlayerProgress(overall, `Mengunduh model karakter... ${pct}% (${mbLoaded}/${mbTotal} MB)`);
        } else if (xhr.loaded > 0) {
          const mbLoaded = (xhr.loaded / (1024 * 1024)).toFixed(1);
          const approxPct = Math.min(78, 20 + Math.round((xhr.loaded / 14000000) * 58));
          if (badgeText) badgeText.textContent = `Memuat Karakter 3D... (${mbLoaded} MB)`;
          notifyPlayerProgress(approxPct, `Mengunduh model karakter... (${mbLoaded} MB)`);
        }
      },
      (err) => {
        console.warn(`[ModelLoader] Gagal memuat "${currentUrl}":`, err);
        candidateIdx++;
        tryNextCandidate();
      }
    );
  }

  tryNextCandidate();
}
// loadRealisticManModel called in createPlayer

// Realistic Materials Palette
const M = {
  skin:         new THREE.MeshStandardMaterial({ color: 0xecd0be, roughness: 0.62, metalness: 0.02 }),
  skinLips:     new THREE.MeshStandardMaterial({ color: 0xc47a75, roughness: 0.55 }),
  eyeWhite:     new THREE.MeshStandardMaterial({ color: 0xf5f5fa, roughness: 0.15 }),
  eyeIris:      new THREE.MeshStandardMaterial({ color: 0x2e1e14, roughness: 0.2, emissive: 0x140b06, emissiveIntensity: 0.3 }),
  eyePupil:     new THREE.MeshBasicMaterial({ color: 0x050508 }),
  eyeShine:     new THREE.MeshBasicMaterial({ color: 0xffffff }),
  brow:         new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.85 }),
  hair:         new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.72, metalness: 0.08 }),
  hairHi:       new THREE.MeshStandardMaterial({ color: 0x382c24, roughness: 0.6 }),
  jacket:       new THREE.MeshStandardMaterial({ color: 0x1c2128, roughness: 0.78, metalness: 0.1 }),
  jacketTrim:   new THREE.MeshStandardMaterial({ color: 0x12161b, roughness: 0.85 }),
  shirt:        new THREE.MeshStandardMaterial({ color: 0xededed, roughness: 0.65 }),
  pants:        new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.82, metalness: 0.05 }),
  belt:         new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.45 }),
  metal:        new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.9, roughness: 0.2 }),
  watchStrap:   new THREE.MeshStandardMaterial({ color: 0x252528, roughness: 0.5 }),
  sneakerWhite: new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.35 }),
  sneakerDark:  new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.65 }),
  sneakerAccent:new THREE.MeshStandardMaterial({ color: 0xe64a2e, roughness: 0.5 })
};

// ==================== HEAD GROUP ====================
const headGroup = new THREE.Group();
headGroup.position.set(0, 1.54, 0);
proceduralModel.add(headGroup);

// Cranium (Anatomical skull shape)
const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), M.skin);
cranium.scale.set(0.92, 1.12, 1.05);
cranium.position.set(0, 0.07, 0);
cranium.castShadow = true;
headGroup.add(cranium);

// Face & Jaw
const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.058, 0.12, 16), M.skin);
jaw.position.set(0, -0.015, 0.025);
jaw.scale.set(1.0, 1.0, 0.88);
headGroup.add(jaw);

// Defined Chin
const chin = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 14), M.skin);
chin.position.set(0, -0.075, 0.055);
chin.scale.set(1.0, 0.75, 0.9);
headGroup.add(chin);

// Cheekbones
[-1, 1].forEach(side => {
  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), M.skin);
  cheek.position.set(side * 0.065, 0.01, 0.04);
  cheek.scale.set(0.8, 1.2, 0.8);
  headGroup.add(cheek);
});

// Realistic Eyes Function
function createEye(side) {
  const eye = new THREE.Group();
  eye.position.set(side * 0.038, 0.045, 0.086);

  // Sclera
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), M.eyeWhite);
  sclera.scale.set(1.15, 0.75, 0.55);
  eye.add(sclera);

  // Iris
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 14), M.eyeIris);
  iris.scale.set(1.05, 0.95, 0.4);
  iris.position.set(0, 0, 0.007);
  eye.add(iris);

  // Pupil
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), M.eyePupil);
  pupil.position.set(0, 0, 0.011);
  eye.add(pupil);

  // Catchlight
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 8, 8), M.eyeShine);
  shine.position.set(-side * 0.003, 0.003, 0.013);
  eye.add(shine);

  // Upper eyelid crease
  const upperLid = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.006, 0.012), M.skin);
  upperLid.position.set(0, 0.013, 0.006);
  upperLid.rotation.z = side * -0.05;
  eye.add(upperLid);

  // Natural Eyebrow
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.014), M.brow);
  brow.position.set(0, 0.028, 0.004);
  brow.rotation.z = side * -0.12;
  brow.rotation.y = side * 0.08;
  eye.add(brow);

  return eye;
}
headGroup.add(createEye(-1));
headGroup.add(createEye(1));

// Natural Sculpted Nose
const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.045, 10), M.skin);
noseBridge.position.set(0, 0.02, 0.098);
noseBridge.rotation.x = 0.22;
headGroup.add(noseBridge);

const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), M.skin);
noseTip.position.set(0, -0.003, 0.108);
noseTip.scale.set(1.0, 0.85, 1.1);
headGroup.add(noseTip);

[-1, 1].forEach(side => {
  const alar = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), M.skin);
  alar.position.set(side * 0.013, -0.008, 0.098);
  headGroup.add(alar);
});

// Realistic Mouth & Lips
const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.01), M.skinLips);
upperLip.position.set(0, -0.032, 0.088);
headGroup.add(upperLip);

const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), M.skinLips);
lowerLip.position.set(0, -0.043, 0.085);
lowerLip.scale.set(1.4, 0.6, 0.8);
headGroup.add(lowerLip);

// Anatomical Ears
[-1, 1].forEach(side => {
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), M.skin);
  ear.position.set(side * 0.105, 0.025, -0.005);
  ear.scale.set(0.35, 1.15, 0.8);
  ear.rotation.y = side * 0.15;
  ear.rotation.z = side * -0.08;
  headGroup.add(ear);
});

// Realistic Modern Hair (Textured Crop & Tapered Sides)
const hairBase = new THREE.Mesh(
  new THREE.SphereGeometry(0.125, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58),
  M.hair
);
hairBase.position.set(0, 0.08, -0.012);
hairBase.scale.set(0.96, 1.12, 1.04);
headGroup.add(hairBase);

const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), M.hair);
hairTop.position.set(0, 0.15, 0.01);
hairTop.scale.set(0.95, 0.55, 1.05);
headGroup.add(hairTop);

// Layered Textured Fringe
const fringeLocks = [
  { x: -0.04, y: 0.12, z: 0.08, sx: 0.05, sy: 0.04, sz: 0.06, rz: 0.15 },
  { x: 0.01,  y: 0.13, z: 0.09, sx: 0.06, sy: 0.045, sz: 0.06, rz: -0.1 },
  { x: 0.05,  y: 0.11, z: 0.075, sx: 0.045, sy: 0.035, sz: 0.05, rz: -0.3 },
  { x: -0.07, y: 0.08, z: 0.055, sx: 0.035, sy: 0.05, sz: 0.05, rz: 0.2 },
  { x: 0.08,  y: 0.08, z: 0.055, sx: 0.035, sy: 0.05, sz: 0.05, rz: -0.2 }
];
fringeLocks.forEach(f => {
  const lock = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), M.hairHi);
  lock.position.set(f.x, f.y, f.z);
  lock.scale.set(f.sx / 0.04, f.sy / 0.04, f.sz / 0.04);
  lock.rotation.z = f.rz;
  headGroup.add(lock);
});

// Neck
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.11, 16), M.skin);
neck.position.set(0, 1.48, -0.005);
neck.rotation.x = 0.05;
neck.castShadow = true;
proceduralModel.add(neck);

// ==================== TORSO & OUTFIT ====================
// Inner Shirt Collar & Chest
const shirtCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.08, 16), M.shirt);
shirtCollar.position.set(0, 1.44, 0.005);
proceduralModel.add(shirtCollar);

const shirtChest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.04), M.shirt);
shirtChest.position.set(0, 1.25, 0.115);
proceduralModel.add(shirtChest);

// Tailored Modern Jacket (Chest & Ribcage)
const jacketChest = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.165, 0.32, 20), M.jacket);
jacketChest.position.set(0, 1.30, 0);
jacketChest.scale.set(1.15, 1.0, 0.76);
jacketChest.castShadow = true;
proceduralModel.add(jacketChest);

// Jacket Waist
const jacketWaist = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.155, 0.22, 20), M.jacket);
jacketWaist.position.set(0, 1.06, 0);
jacketWaist.scale.set(1.1, 1.0, 0.74);
jacketWaist.castShadow = true;
proceduralModel.add(jacketWaist);

// Jacket Lapels
[-1, 1].forEach(side => {
  const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.025), M.jacketTrim);
  lapel.position.set(side * 0.08, 1.34, 0.11);
  lapel.rotation.z = side * -0.22;
  lapel.rotation.y = side * 0.12;
  proceduralModel.add(lapel);
});

// Metallic Zipper line & Pull
const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.01), M.metal);
zipper.position.set(0, 1.12, 0.118);
proceduralModel.add(zipper);

const zipperPull = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.035, 0.015), M.metal);
zipperPull.position.set(0, 1.25, 0.125);
proceduralModel.add(zipperPull);

// Jacket Hem Ribbing
const jacketHem = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.05, 20), M.jacketTrim);
jacketHem.position.set(0, 0.94, 0);
jacketHem.scale.set(1.08, 1.0, 0.74);
proceduralModel.add(jacketHem);

// Belt & Buckle
const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.045, 20), M.belt);
belt.position.set(0, 0.90, 0);
belt.scale.set(1.05, 1.0, 0.72);
proceduralModel.add(belt);

const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.018), M.metal);
buckle.position.set(0, 0.90, 0.112);
proceduralModel.add(buckle);

// Pelvis (Jeans / Pants)
const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.156, 0.148, 0.14, 20), M.pants);
pelvis.position.set(0, 0.82, 0);
pelvis.scale.set(1.05, 1.0, 0.72);
pelvis.castShadow = true;
proceduralModel.add(pelvis);

// ==================== ARMS ====================
function makeArm(side) {
  const armGroup = new THREE.Group();
  armGroup.position.set(side * 0.225, 1.38, 0);

  // Shoulder / Deltoid
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), M.jacket);
  shoulder.scale.set(1.05, 1.1, 1.0);
  shoulder.castShadow = true;
  armGroup.add(shoulder);

  // Upper Arm
  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 8, 14), M.jacket);
  upperArm.position.set(0, -0.12, 0);
  upperArm.castShadow = true;
  armGroup.add(upperArm);

  // Elbow group (Pivot for lower arm)
  const lowerGroup = new THREE.Group();
  lowerGroup.position.set(0, -0.25, 0);
  armGroup.add(lowerGroup);

  // Forearm (Sleeve)
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.14, 8, 14), M.jacket);
  forearm.position.set(0, -0.09, 0);
  forearm.castShadow = true;
  lowerGroup.add(forearm);

  // Sleeve Cuff
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.035, 14), M.jacketTrim);
  cuff.position.set(0, -0.17, 0);
  lowerGroup.add(cuff);

  // Left Wristwatch Accessory
  if (side === -1) {
    const watchStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.02, 14), M.watchStrap);
    watchStrap.position.set(0, -0.19, 0);
    lowerGroup.add(watchStrap);

    const watchDial = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12), M.metal);
    watchDial.position.set(-0.035, -0.19, 0.01);
    watchDial.rotation.z = Math.PI / 2;
    lowerGroup.add(watchDial);
  }

  // Wrist (Skin)
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.03, 12), M.skin);
  wrist.position.set(0, -0.20, 0);
  lowerGroup.add(wrist);

  // Kepalan Tangan Kokoh & Maskulin (Clenched Fist - Tangan Mengepal)
  const fistGroup = new THREE.Group();
  fistGroup.position.set(side * 0.004, -0.235, 0.002);
  fistGroup.rotation.y = side * 0.18; // Hadap sedikit ke sisi dalam paha
  lowerGroup.add(fistGroup);

  // Inti Kepalan Tangan (Fist Core)
  const fistCore = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.058, 0.046), M.skin);
  fistCore.position.set(0, 0, 0);
  fistCore.castShadow = true;
  fistGroup.add(fistCore);

  // Buku Jari Depan / 4 Knuckles
  [-0.018, -0.006, 0.006, 0.018].forEach(kx => {
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), M.skin);
    knuckle.position.set(side * kx, -0.014, 0.022);
    fistGroup.add(knuckle);
  });

  // Jari-jari Melipat Rapat ke Dalam Telapak
  const curledFingers = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.044, 12), M.skin);
  curledFingers.rotation.z = Math.PI / 2;
  curledFingers.position.set(0, -0.016, 0.012);
  fistGroup.add(curledFingers);

  // Ibu Jari Mengunci Kokoh di Depan (Thumb Clench Lock)
  const thumbLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.034, 8, 8), M.skin);
  thumbLock.position.set(side * -0.018, -0.008, 0.022);
  thumbLock.rotation.z = side * -0.65;
  thumbLock.rotation.x = 0.25;
  thumbLock.castShadow = true;
  fistGroup.add(thumbLock);

  return { armGroup, lowerGroup };
}

const armLData = makeArm(-1);
const armRData = makeArm(1);
proceduralModel.add(armLData.armGroup);
proceduralModel.add(armRData.armGroup);

// ==================== LEGS ====================
function makeLeg(side) {
  const legGroup = new THREE.Group();
  legGroup.position.set(side * 0.108, 0.82, 0);

  // Hip / Thigh Top
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.076, 14, 14), M.pants);
  hip.castShadow = true;
  legGroup.add(hip);

  // Thigh (Slim fit pants)
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.22, 8, 14), M.pants);
  thigh.position.set(0, -0.16, 0.005);
  thigh.castShadow = true;
  legGroup.add(thigh);

  // Knee Group (Pivot for lower leg)
  const lowerGroup = new THREE.Group();
  lowerGroup.position.set(0, -0.32, 0);
  legGroup.add(lowerGroup);

  // Knee Joint
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), M.pants);
  knee.position.set(0, 0, 0.005);
  lowerGroup.add(knee);

  // Calf / Shin
  const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.22, 8, 14), M.pants);
  calf.position.set(0, -0.14, -0.002);
  calf.castShadow = true;
  lowerGroup.add(calf);

  // Ankle / Cuff
  const ankleCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.04, 14), M.pants);
  ankleCuff.position.set(0, -0.27, 0);
  lowerGroup.add(ankleCuff);

  // ==================== REALISTIC MODERN SNEAKERS ====================
  // Rubber Midsole & Outsole
  const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.026, 0.23), M.sneakerWhite);
  shoeSole.position.set(0, -0.315, 0.035);
  shoeSole.castShadow = true;
  lowerGroup.add(shoeSole);

  // Rubber Toe bumper
  const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 14, 12), M.sneakerWhite);
  toeCap.position.set(0, -0.308, 0.125);
  toeCap.scale.set(1.02, 0.45, 0.95);
  toeCap.castShadow = true;
  lowerGroup.add(toeCap);

  // Sneaker Upper (Dark Body)
  const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.18), M.sneakerDark);
  shoeUpper.position.set(0, -0.28, 0.015);
  shoeUpper.castShadow = true;
  lowerGroup.add(shoeUpper);

  // Sneaker Tongue
  const shoeTongue = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.08), M.sneakerDark);
  shoeTongue.position.set(0, -0.255, 0.04);
  shoeTongue.rotation.x = -0.35;
  lowerGroup.add(shoeTongue);

  // Sporty Contrast Stripe Accent
  [-1, 1].forEach(stSide => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.018, 0.11), M.sneakerAccent);
    stripe.position.set(stSide * 0.046, -0.285, 0.015);
    stripe.rotation.z = stSide * -0.15;
    lowerGroup.add(stripe);
  });

  // White Laces
  for (let l = 0; l < 3; l++) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.008, 0.015), M.sneakerWhite);
    lace.position.set(0, -0.265 + l * 0.014, 0.055 - l * 0.018);
    lace.rotation.x = -0.35;
    lowerGroup.add(lace);
  }

  return { legGroup, lowerGroup };
}

const legLData = makeLeg(-1);
const legRData = makeLeg(1);
proceduralModel.add(legLData.legGroup);
proceduralModel.add(legRData.legGroup);

anim = {
  legL: legLData.legGroup,
  legR: legRData.legGroup,
  legLLow: legLData.lowerGroup,
  legRLow: legRData.lowerGroup,
  armL: armLData.armGroup,
  armR: armRData.armGroup,
  armLLow: armLData.lowerGroup,
  armRLow: armRData.lowerGroup,
  headGroup: headGroup
};


export function createPlayer(scene) {
  player.scale.set(1.28, 1.28, 1.28);

player.position.copy(SPAWN_POS);
player.rotation.y = Math.atan2(-player.position.x, -player.position.z);
scene.add(player);
  loadRealisticManModel();
}
window.__player = player;
window.__usingRealisticModel = () => usingRealisticModel;
window.__realisticBones = () => realisticBones;
window.__fbxLoaded = () => fbxAnimationsLoaded;
window.__characterMixer = () => characterMixer;
window.__animActions = () => animActions;
window.__currentActionName = () => currentActionName;