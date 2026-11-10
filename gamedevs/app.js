// ============================================================================
// 3D WALKING GAME - MAIN APPLICATION ORCHESTRATOR (MODULAR ES6)
// ============================================================================

import * as THREE from 'three';
import { worldAudio } from './audio_system.js';
import { initNPCSystem, updateNPCSystem, getNearestNPC, interactWithNearestNPC } from './npc_system.js?v=4';

import { MAP_SIZE, SPAWN_POS, collisionWalls, resolveWallCollisions, createWorld } from './js/world.js';
import {
  PORTAL_POS,
  CAMP_PORTAL_POS,
  ARENA_PORTAL_POS,
  KIOSK_POS,
  portalLight,
  campPortalLight,
  arenaPortalLight,
  createZones,
  updateZones
} from './js/zones.js';
import {
  player,
  createPlayer,
  playCharacterAnimation,
  getCharacterMixer,
  isFBXLoaded,
  isUsingRealisticModel,
  getRealisticBones,
  getCurrentActionName,
  getAnimActions,
  getAnim,
  rotateRealisticBone,
  applyFistPose,
  JUMP_FORCE,
  GRAVITY,
  onPlayerReady,
  onPlayerProgress
} from './js/player.js?v=20261104_fist_v1';
import {
  keys,
  getYaw,
  setYaw,
  getPitch,
  setPitch,
  joyState,
  mobileSprintActive,
  getDeviceMode,
  initControls
} from './js/controls.js';
import {
  initUI,
  updateCompassHUD,
  updateQuestHUD,
  showTrophyBanner,
  openKioskModal,
  closeKioskModal,
  triggerPortalWarp,
  showDialogue,
  hideDialogue
} from './js/ui.js';

// ==================== THREE.JS SCENE SETUP ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 120, 400);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ==================== LIGHTING (ORIGINAL NATURAL BRIGHT) ====================
scene.add(new THREE.AmbientLight(0xffffff, 0.75));

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(50, 80, 30);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.0005;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xfff0e6, 0.45);
fillLight.position.set(-30, 40, -40);
scene.add(fillLight);

scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4a8f3c, 0.65));

// ==================== BANGUN DUNIA & ZONA ====================
createWorld(scene);
createZones(scene);
createPlayer(scene);
initNPCSystem(scene, THREE);

// ==================== VARIABEL FISIKA & GAMEPLAY ====================
let playerVelocityY = 0;
let isGrounded = true;
let isSprinting = false;
let isMoving = false;
let walkTime = 0;
let idleTime = 0;

let portalCooldown = 0;
let campPortalCooldown = 0;
let arenaPortalCooldown = 0;

let currentNearbyNPC = null;
let isNearKiosk = false;

// ==================== INISIALISASI KONTROL & UI ====================
const canvas = renderer.domElement;

initControls(canvas, () => {
  if (isGrounded) {
    playerVelocityY = JUMP_FORCE;
    isGrounded = false;
    worldAudio.playJump();
  }
});

initUI(worldAudio);

// ==================== VIDEO LOADING SCREEN MANAGER ====================
const loadingScreen = document.getElementById('gameLoadingScreen');
const loadingBarFill = document.getElementById('loadingBarFill');
const loadingStatusText = document.getElementById('loadingStatusText');
const loadingPercentText = document.getElementById('loadingPercentText');
const loadingSubtitle = document.querySelector('.loading-subtitle');
const loadingVideo = document.getElementById('loadingVideo');

let loadingProgress = 15;
let isGameStarted = false;

function updateLoadingUI(pct, text) {
  if (isGameStarted) return;
  loadingProgress = Math.max(loadingProgress, Math.min(100, Math.round(pct)));
  if (loadingBarFill) loadingBarFill.style.width = `${loadingProgress}%`;
  if (loadingPercentText) loadingPercentText.textContent = `${loadingProgress}%`;
  if (loadingStatusText && text) loadingStatusText.textContent = text;
}

function dismissLoadingScreen() {
  if (isGameStarted || !loadingScreen) return;
  isGameStarted = true;
  updateLoadingUI(100, 'Kompilasi shader GPU & rendering dunia...');

  // 1. Kompilasi seluruh shader Three.js pada GPU
  try {
    renderer.compile(scene, camera);
  } catch (e) {}

  // 2. Pre-render 3 frame offscreen agar VRAM terisi sebelum loading screen dibuka
  let warmFrames = 0;
  function warmUp() {
    try {
      renderer.render(scene, camera);
    } catch (e) {}
    warmFrames++;
    if (warmFrames < 3) {
      requestAnimationFrame(warmUp);
    } else {
      updateLoadingUI(100, 'Dunia Siap! Masuk ke permainan...');
      if (loadingScreen) loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        if (loadingVideo) {
          try {
            loadingVideo.pause();
            loadingVideo.src = '';
            loadingVideo.load();
          } catch (e) {}
        }
        if (loadingScreen && loadingScreen.parentNode) {
          loadingScreen.remove();
        }
      }, 650);
    }
  }
  requestAnimationFrame(warmUp);
}

// Pastikan video berputar otomatis (looping)
if (loadingVideo) {
  loadingVideo.play().catch(e => {
    console.log('[LoadingScreen] Video autoplay notice:', e);
  });
}

// Pantau kemajuan download model dan animasi FBX
onPlayerProgress((pct, text) => {
  updateLoadingUI(pct, text);
});

// Ketika seluruh karakter & animasi FBX selesai dimuat
onPlayerReady(() => {
  console.log('[LoadingScreen] Seluruh aset 3D & karakter selesai dimuat!');
  requestAnimationFrame(() => {
    dismissLoadingScreen();
  });
});

// Failsafe Timeout: Beri waktu cukup untuk model 75MB, jangan putus sebelum GPU render
setTimeout(() => {
  if (!isGameStarted) {
    console.warn('[LoadingScreen] Failsafe timeout tercapai (40 detik), memastikan render GPU selesai.');
    dismissLoadingScreen();
  }
}, 40000);

// ==================== CEK RETURN DARI GAME PORTAL ====================
const urlParams = new URLSearchParams(window.location.search);
const fromGame = urlParams.get('from');

if (fromGame === 'camp' || fromGame === 'deadzone') {
  player.position.set(CAMP_PORTAL_POS.x - 2.5, 0, CAMP_PORTAL_POS.z);
  player.rotation.y = -Math.PI / 2;
  setYaw(Math.PI / 2);
  campPortalCooldown = 3.5;
} else if (fromGame === 'arena' || fromGame === 'fight') {
  player.position.set(ARENA_PORTAL_POS.x - 2.5, 0, ARENA_PORTAL_POS.z);
  player.rotation.y = -Math.PI / 2;
  setYaw(Math.PI / 2);
  arenaPortalCooldown = 3.5;
}

const hintEl = document.getElementById('hint');
if (fromGame && loadingSubtitle) {
  if (fromGame === 'camp' || fromGame === 'deadzone') {
    loadingSubtitle.textContent = 'Kembali dari Dead Zone, memuat kembali Dunia 3D...';
  } else if (fromGame === 'arena' || fromGame === 'fight') {
    loadingSubtitle.textContent = 'Kembali dari Battle Arena, memuat kembali Dunia 3D...';
  }
}
if (hintEl && fromGame) {
  if (fromGame === 'camp' || fromGame === 'deadzone') {
    hintEl.textContent = '💀 Kembali dari Dead Zone! Klik di layar untuk lanjut jalan';
  } else if (fromGame === 'arena' || fromGame === 'fight') {
    hintEl.textContent = '⚔️ Kembali dari Battle Arena! Klik di layar untuk lanjut jalan';
  }
}

// ==================== INTERAKSI NPC & DIALOGUE ====================
function triggerDialogue() {
  if (isNearKiosk) {
    openKioskModal();
    return;
  }
  if (!currentNearbyNPC) return;
  const data = currentNearbyNPC.talkTo(player.position);
  if (!data) return;
  showDialogue(data.avatar, data.name, data.role, data.text);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    triggerDialogue();
  }
});

const btnMobileTalk = document.getElementById('btn-mobile-talk');
if (btnMobileTalk) {
  btnMobileTalk.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDialogue();
  });
  btnMobileTalk.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    triggerDialogue();
  }, { passive: true });
}

// ==================== CLOCK & LOOP ANIMASI UTAMA (60 FPS) ====================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsedTime = clock.getElapsedTime();

  // Update mixer animasi FBX karakter & kunci kepalan tangan kokoh
  const characterMixer = getCharacterMixer();
  if (characterMixer) {
    characterMixer.update(delta);
    applyFistPose();
  }

  // Update animasi zona (portal berputar, lampu berdenyut, patung logo)
  updateZones(delta, elapsedTime);

  // Fisika Gravitasi & Lompat
  if (!isGrounded) {
    playerVelocityY -= GRAVITY * delta;
    player.position.y += playerVelocityY * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      playerVelocityY = 0;
      if (!isGrounded) {
        worldAudio.playLand();
      }
      isGrounded = true;
    }
  }

  // Tombol Spasi Lompat (Desktop)
  if ((keys.space || keys[' ']) && isGrounded) {
    playerVelocityY = JUMP_FORCE;
    isGrounded = false;
    worldAudio.playJump();
  }

  // Vektor Arah Pandangan (Yaw)
  const currentYaw = getYaw();
  const currentPitch = getPitch();
  const forward = new THREE.Vector3(-Math.sin(currentYaw), 0, -Math.cos(currentYaw));
  const right = new THREE.Vector3(Math.cos(currentYaw), 0, -Math.sin(currentYaw));
  const moveVec = new THREE.Vector3();

  isMoving = false;
  isSprinting = keys.shift || mobileSprintActive;

  // Input Keyboard
  if (keys['w'] || keys['arrowup']) { moveVec.add(forward); isMoving = true; }
  if (keys['s'] || keys['arrowdown']) { moveVec.sub(forward); isMoving = true; }
  if (keys['a'] || keys['arrowleft']) { moveVec.sub(right); isMoving = true; }
  if (keys['d'] || keys['arrowright']) { moveVec.add(right); isMoving = true; }

  // Input Virtual Joystick
  if (Math.abs(joyState.x) > 0.05 || Math.abs(joyState.y) > 0.05) {
    isMoving = true;
    moveVec.addScaledVector(right, joyState.x);
    moveVec.addScaledVector(forward, joyState.y);
  }

  // Perpindahan Posisi & Kecepatan
  if (isMoving) {
    moveVec.normalize();
    const speed = isSprinting ? 10.0 : 5.5;
    player.position.addScaledVector(moveVec, speed * delta);

    // Tabrakan Pagar & Batas Map
    resolveWallCollisions(player.position);

    // Rotasi Hadap Karakter Menyesuaikan Arah Jalan
    const targetAngle = Math.atan2(moveVec.x, moveVec.z);
    let diff = targetAngle - player.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * 0.2;

    walkTime += delta * (isSprinting ? 13.0 : 8.5);
    const swing = Math.sin(walkTime);

    // Audio Langkah Kaki
    if (isGrounded && Math.abs(swing) > 0.88) {
      worldAudio.playFootstep(isSprinting);
    }

    // State Animasi Bergerak
    if (isFBXLoaded() && characterMixer) {
      if (!isGrounded) {
        playCharacterAnimation('jump', 0.1);
      } else if (isSprinting) {
        playCharacterAnimation('run', 0.16);
      } else {
        playCharacterAnimation('walk', 0.18);
      }
    } else {
      const animObj = getAnim();
      if (animObj) {
        animObj.legL.rotation.x = swing * 0.75;
        animObj.legR.rotation.x = -swing * 0.75;
        animObj.legLLow.rotation.x = Math.max(0, -swing) * 0.9;
        animObj.legRLow.rotation.x = Math.max(0, swing) * 0.9;
        animObj.armL.rotation.x = -swing * 0.6;
        animObj.armR.rotation.x = swing * 0.6;
      }
    }

    if (isGrounded) {
      const bob = Math.abs(Math.sin(walkTime)) * (isSprinting ? 0.085 : 0.045);
      player.position.y = bob;
    }
  } else {
    // Karakter Diam (Idle)
    idleTime += delta;
    if (isFBXLoaded() && characterMixer) {
      if (!isGrounded) {
        playCharacterAnimation('jump', 0.1);
      } else {
        playCharacterAnimation('idle', 0.22);
      }
    } else {
      const animObj = getAnim();
      if (animObj) {
        animObj.legL.rotation.x *= 0.85;
        animObj.legR.rotation.x *= 0.85;
        animObj.armL.rotation.x *= 0.85;
        animObj.armR.rotation.x *= 0.85;
      }
    }

    if (isGrounded) {
      const breath = Math.sin(idleTime * 1.6) * 0.02;
      player.position.y += (breath - player.position.y) * 0.1;
    }
  }

  // Pastikan posisi player selalu mematuhi batas pagar keliling & dinding (Anti-Tembus & Anti-Bug)
  resolveWallCollisions(player.position);

  // ===== CEK MASUK PORTAL =====
  if (campPortalCooldown > 0) campPortalCooldown -= delta;
  const dpcx = player.position.x - CAMP_PORTAL_POS.x;
  const dpcz = player.position.z - CAMP_PORTAL_POS.z;
  const distCampPortal = Math.hypot(dpcx, dpcz);
  if (distCampPortal < 1.4 && campPortalCooldown <= 0) {
    campPortalCooldown = 999;
    if (campPortalLight) campPortalLight.intensity = 8;
    triggerPortalWarp('camp', () => {
      window.location.href = 'dead-zone/index.html';
    });
  }

  if (arenaPortalCooldown > 0) arenaPortalCooldown -= delta;
  const dpax = player.position.x - ARENA_PORTAL_POS.x;
  const dpaz = player.position.z - ARENA_PORTAL_POS.z;
  const distArenaPortal = Math.hypot(dpax, dpaz);
  if (distArenaPortal < 1.4 && arenaPortalCooldown <= 0) {
    arenaPortalCooldown = 999;
    if (arenaPortalLight) arenaPortalLight.intensity = 8;
    triggerPortalWarp('arena', () => {
      window.location.href = 'bakalae/index.html';
    });
  }

  // Update NPC System (Patrol AI & Proximity)
  updateNPCSystem(player.position, delta);
  currentNearbyNPC = getNearestNPC();

  const distToKiosk = Math.hypot(player.position.x - KIOSK_POS.x, player.position.z - KIOSK_POS.z);
  isNearKiosk = distToKiosk < 2.4;

  const npcPrompt = document.getElementById('npcPrompt');
  const npcPromptText = document.getElementById('npcPromptText');
  if (npcPrompt && npcPromptText) {
    if (isNearKiosk) {
      npcPromptText.textContent = 'Tekan E untuk Lihat Rekor & Prestasi';
      npcPrompt.classList.remove('hidden');
    } else if (currentNearbyNPC) {
      npcPromptText.textContent = `Tekan E untuk bicara dengan ${currentNearbyNPC.name}`;
      npcPrompt.classList.remove('hidden');
    } else {
      npcPrompt.classList.add('hidden');
    }
  }

  // Audio update
  worldAudio.update(delta, player.position);

  // Update Compass HUD
  updateCompassHUD(player.position, currentYaw);

  // Chase Camera Rig (Sudut Pandang Ketiga)
  if (window.__cameraOverride) {
    camera.position.copy(window.__cameraOverride.pos);
    camera.lookAt(window.__cameraOverride.lookAt);
  } else {
    const camDist = 5.0;
    const camHeight = 2.2;
    const cx = player.position.x + Math.sin(currentYaw) * camDist * Math.cos(currentPitch);
    const cz = player.position.z + Math.cos(currentYaw) * camDist * Math.cos(currentPitch);
    const cy = player.position.y + camHeight + Math.sin(currentPitch) * camDist;

    camera.position.set(cx, cy, cz);
    camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);
  }

  renderer.render(scene, camera);
}

animate();

// ==================== RESIZE HANDLER ====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==================== GLOBAL TESTING HELPERS ====================
window.__player = player;
window.__usingRealisticModel = isUsingRealisticModel;
window.__realisticBones = getRealisticBones;
window.__fbxLoaded = isFBXLoaded;
window.__characterMixer = getCharacterMixer;
window.__animActions = getAnimActions;
window.__currentActionName = getCurrentActionName;
window.THREE = THREE;
window.__scene = scene;
window.__resolveWallCollisions = resolveWallCollisions;
