// ==================== UI & HUD MANAGEMENT ====================
let worldAudioRef = null;

// ==================== PORTAL OVERLAY ====================
let portalOverlay = null;

export function initPortalOverlay() {
  if (portalOverlay) return;
  portalOverlay = document.createElement('div');
  portalOverlay.id = 'portalTransitionOverlay';
  portalOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, #66ccff 0%, #0a1a35 100%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.8s ease;
    z-index: 9999;
  `;
  document.body.appendChild(portalOverlay);
}

export function triggerPortalWarp(type, onComplete) {
  initPortalOverlay();
  if (worldAudioRef) worldAudioRef.playPortalWarp(type);

  if (type === 'camp') {
    portalOverlay.style.background = 'radial-gradient(circle at center, #aaff66 0%, #0a1a05 100%)';
  } else if (type === 'arena') {
    portalOverlay.style.background = 'radial-gradient(circle at center, #ffaa44 0%, #300a20 100%)';
  } else {
    portalOverlay.style.background = 'radial-gradient(circle at center, #66ccff 0%, #0a1a35 100%)';
  }

  portalOverlay.style.opacity = '1';
  setTimeout(() => {
    if (typeof onComplete === 'function') onComplete();
  }, 850);
}

// ==================== AUDIO UI ====================
export function updateAudioUI() {
  const audioIcon = document.getElementById('audioIcon');
  const audioVolume = document.getElementById('audioVolume');
  if (!worldAudioRef) return;
  if (audioIcon) audioIcon.textContent = worldAudioRef.isMuted ? '🔇' : '🔊';
  if (audioVolume) audioVolume.value = worldAudioRef.isMuted ? 0 : worldAudioRef.volume;
}

export function initAudioUI(worldAudio) {
  worldAudioRef = worldAudio;
  const btnAudioMute = document.getElementById('btnAudioMute');
  const audioVolume = document.getElementById('audioVolume');

  if (btnAudioMute) {
    btnAudioMute.addEventListener('click', (e) => {
      e.stopPropagation();
      worldAudio.ensureContext();
      worldAudio.toggleMute();
      updateAudioUI();
    });
  }

  if (audioVolume) {
    audioVolume.addEventListener('input', (e) => {
      e.stopPropagation();
      worldAudio.ensureContext();
      const val = parseFloat(e.target.value);
      worldAudio.setVolume(val);
      if (worldAudio.isMuted && val > 0) {
        worldAudio.setMuted(false);
      }
      updateAudioUI();
    });
    audioVolume.addEventListener('click', (e) => e.stopPropagation());
    audioVolume.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  }

  updateAudioUI();

  const resumeAudioOnGesture = () => {
    worldAudio.ensureContext();
  };
  window.addEventListener('pointerdown', resumeAudioOnGesture, { once: true });
  window.addEventListener('keydown', resumeAudioOnGesture, { once: true });
}

// ==================== NAVIGATION COMPASS & WAYPOINTS ====================
const WAYPOINTS = [
  { id: 'farm', name: 'Kebun', icon: '🍎', x: -38, z: 22 },
  { id: 'camp', name: 'Kamp', icon: '🎖️', x: 42, z: -12 },
  { id: 'arena', name: 'Arena', icon: '⚔️', x: 30, z: 22 },
  { id: 'plaza', name: 'Plaza', icon: '🏆', x: -14, z: 5 }
];

export function updateCompassHUD(playerPos, currentYaw) {
  if (!playerPos) return;
  const compassWaypoints = document.getElementById('compassWaypoints');

  if (compassWaypoints && compassWaypoints.children.length === 0) {
    WAYPOINTS.forEach(wp => {
      const pin = document.createElement('div');
      pin.className = 'compass-pin';
      pin.id = 'pin-' + wp.id;
      pin.innerHTML = `<span>${wp.icon}</span><span class="pin-label">${wp.name}</span>`;
      compassWaypoints.appendChild(pin);
    });
  }

  WAYPOINTS.forEach(wp => {
    const dx = wp.x - playerPos.x;
    const dz = wp.z - playerPos.z;
    const dist = Math.hypot(dx, dz);

    const distEl = document.getElementById('dist' + wp.id.charAt(0).toUpperCase() + wp.id.slice(1));
    if (distEl) {
      distEl.textContent = Math.round(dist) + 'm';
    }

    const pin = document.getElementById('pin-' + wp.id);
    if (pin) {
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - currentYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const fov = Math.PI * 0.75;
      if (Math.abs(diff) < fov) {
        pin.style.display = 'flex';
        const percent = 50 + (diff / fov) * 45;
        pin.style.left = percent + '%';
        pin.style.opacity = (1 - Math.abs(diff) / fov).toFixed(2);
      } else {
        pin.style.display = 'none';
      }
    }
  });
}

// ==================== GLOBAL QUEST HUD TRACKER ====================
export function updateQuestHUD() {
  try {
    const hasFruit = localStorage.getItem('gamedev_meta_fruit_cleared') === '1' || parseInt(localStorage.getItem('gamedev_meta_fruit_score') || 0) >= 200;
    const hasDeadZone = localStorage.getItem('gamedev_meta_deadzone_cleared') === '1';
    const hasArena = localStorage.getItem('gamedev_meta_arena_champion') === '1';

    const qFruit = document.getElementById('qFruitItem');
    const qFruitSt = document.getElementById('qFruitStatus');
    if (qFruit && qFruitSt) {
      if (hasFruit) {
        qFruit.classList.add('completed');
        qFruitSt.textContent = '✅';
      } else {
        qFruit.classList.remove('completed');
        qFruitSt.textContent = '⏳';
      }
    }

    const qDZ = document.getElementById('qDeadZoneItem');
    const qDZSt = document.getElementById('qDeadZoneStatus');
    if (qDZ && qDZSt) {
      if (hasDeadZone) {
        qDZ.classList.add('completed');
        qDZSt.textContent = '✅';
      } else {
        qDZ.classList.remove('completed');
        qDZSt.textContent = '⏳';
      }
    }

    const qArena = document.getElementById('qArenaItem');
    const qArenaSt = document.getElementById('qArenaStatus');
    if (qArena && qArenaSt) {
      if (hasArena) {
        qArena.classList.add('completed');
        qArenaSt.textContent = '✅';
      } else {
        qArena.classList.remove('completed');
        qArenaSt.textContent = '⏳';
      }
    }
  } catch(e) {}
}

// ==================== TROPHY BANNER POPUP ====================
let activeTrophyTimer = null;
let lastAnnouncedTrophyId = null;

export function showTrophyBanner(icon, title, desc, unlocked, id) {
  const trophyBanner = document.getElementById('trophyBanner');
  const trophyIcon = document.getElementById('trophyIcon');
  const trophyTitle = document.getElementById('trophyTitle');
  const trophyDesc = document.getElementById('trophyDesc');

  if (!trophyBanner) return;
  if (trophyIcon) trophyIcon.textContent = icon;
  if (trophyTitle) trophyTitle.textContent = unlocked ? '🏆 ' + title : '🔒 ' + title;
  if (trophyDesc) trophyDesc.textContent = desc;

  trophyBanner.classList.remove('hidden');

  if (unlocked && lastAnnouncedTrophyId !== id) {
    lastAnnouncedTrophyId = id;
    if (worldAudioRef) worldAudioRef.playTrophyFanfare();
    updateQuestHUD();
  }

  clearTimeout(activeTrophyTimer);
  activeTrophyTimer = setTimeout(() => {
    if (trophyBanner) trophyBanner.classList.add('hidden');
  }, 3500);
}

// ==================== CENTRAL PLAZA KIOSK MODAL ====================
export function openKioskModal() {
  const kioskModal = document.getElementById('kioskModal');
  const kioskBody = document.getElementById('kioskBody');
  if (!kioskModal || !kioskBody) return;

  const fruitScore = parseInt(localStorage.getItem('gamedev_meta_fruit_score') || '0');
  const fruitDone = localStorage.getItem('gamedev_meta_fruit_cleared') === '1' || fruitScore >= 200;
  const dzKills = parseInt(localStorage.getItem('gamedev_meta_deadzone_kills') || '0');
  const dzDone = localStorage.getItem('gamedev_meta_deadzone_cleared') === '1';
  const arenaWins = parseInt(localStorage.getItem('gamedev_meta_arena_wins') || '0');
  const arenaDone = localStorage.getItem('gamedev_meta_arena_champion') === '1';

  kioskBody.innerHTML = `
    <div class="kiosk-stat-row">
      <div class="kiosk-stat-label"><span>🍎</span> Kebun Buah (Fruit Block Blast)</div>
      <div class="kiosk-stat-val">${fruitDone ? '🏆 JUARA' : '⏳ DALAM PROSES'} (${fruitScore} Poin)</div>
    </div>
    <div class="kiosk-stat-row">
      <div class="kiosk-stat-label"><span>💀</span> Kamp Militer (Dead Zone FPS)</div>
      <div class="kiosk-stat-val">${dzDone ? '🎖️ PENYINTAS' : '⏳ DALAM PROSES'} (${dzKills} Zombie)</div>
    </div>
    <div class="kiosk-stat-row">
      <div class="kiosk-stat-label"><span>⚔️</span> Battle Arena (Arena Zero)</div>
      <div class="kiosk-stat-val">${arenaDone ? '🥊 JUARA ARENA' : '⏳ DALAM PROSES'} (${arenaWins} Kemenangan)</div>
    </div>
  `;

  kioskModal.classList.remove('hidden');
  if (worldAudioRef) worldAudioRef.playDialogueChirp();
}

export function closeKioskModal() {
  const kioskModal = document.getElementById('kioskModal');
  if (kioskModal) kioskModal.classList.add('hidden');
}

export function initKioskModal() {
  const btnKioskClose = document.getElementById('btnKioskClose');
  const btnKioskOk = document.getElementById('btnKioskOk');
  if (btnKioskClose) btnKioskClose.onclick = closeKioskModal;
  if (btnKioskOk) btnKioskOk.onclick = closeKioskModal;
}

// ==================== DIALOGUE BOX UI ====================
export function showDialogue(avatar, name, role, text) {
  const dialogueAvatar = document.getElementById('dialogueAvatar');
  const dialogueName = document.getElementById('dialogueName');
  const dialogueRole = document.getElementById('dialogueRole');
  const dialogueText = document.getElementById('dialogueText');
  const dialogueCard = document.getElementById('dialogueCard');

  if (dialogueAvatar) dialogueAvatar.textContent = avatar;
  if (dialogueName) dialogueName.textContent = name;
  if (dialogueRole) dialogueRole.textContent = role;
  if (dialogueText) dialogueText.textContent = text;
  if (dialogueCard) dialogueCard.classList.remove('hidden');

  if (worldAudioRef) worldAudioRef.playDialogueChirp();
}

export function hideDialogue() {
  const dialogueCard = document.getElementById('dialogueCard');
  if (dialogueCard) dialogueCard.classList.add('hidden');
}

export function initDialogueUI() {
  const btnDialogueNext = document.getElementById('btnDialogueNext');
  if (btnDialogueNext) {
    btnDialogueNext.addEventListener('click', (e) => {
      e.stopPropagation();
      hideDialogue();
    });
  }
}

// ==================== INISIALISASI SELURUH UI ====================
export function initUI(worldAudio) {
  initPortalOverlay();
  initAudioUI(worldAudio);
  initKioskModal();
  initDialogueUI();
  updateQuestHUD();
}

