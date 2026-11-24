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
    display: flex;
    align-items: center;
    justify-content: center;
    background: #07090d;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s ease;
    z-index: 99999;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #f8fafc;
    text-align: center;
  `;
  portalOverlay.innerHTML = `
    <div style="max-width: 440px; width: 90%; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 28px 26px; background: rgba(11, 14, 19, 0.96); border: 1px solid rgba(255, 255, 255, 0.14); border-top: 3px solid #e59a28; border-radius: 6px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85);">
      <div id="portalVortexRing" style="width: 58px; height: 58px; border: 3px solid rgba(255,255,255,0.12); border-top: 3px solid #e59a28; border-radius: 50%; animation: portalSpin 0.9s linear infinite;"></div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div id="portalOverlayTitle" style="font-family: 'Cinzel', Georgia, serif; font-size: 20px; font-weight: 700; letter-spacing: 1.5px; color: #f8fafc; text-transform: uppercase;">MEMASUKI PORTAL</div>
        <div id="portalOverlaySubtitle" style="font-size: 13px; color: #94a3b8; font-weight: 500;">Menyiapkan dunia 3D & kompilasi visual...</div>
      </div>
      <div style="width: 100%; height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; overflow: hidden; position: relative;">
        <div id="portalOverlayProgress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #b46d0c, #e59a28); transition: width 0.1s linear;"></div>
      </div>
      <div id="portalOverlayPct" style="font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; color: #e59a28; letter-spacing: 1px;">0%</div>
    </div>
    <style>
      @keyframes portalSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(portalOverlay);
}

export function triggerPortalWarp(type, onComplete) {
  initPortalOverlay();
  if (worldAudioRef) worldAudioRef.playPortalWarp(type);

  const titleEl = document.getElementById('portalOverlayTitle');
  const subEl = document.getElementById('portalOverlaySubtitle');
  const barEl = document.getElementById('portalOverlayProgress');
  const pctEl = document.getElementById('portalOverlayPct');
  const ringEl = document.getElementById('portalVortexRing');

  if (type === 'camp') {
    portalOverlay.style.background = 'radial-gradient(circle at center, #0d1712 0%, #060908 100%)';
    if (titleEl) {
      titleEl.textContent = 'MEMASUKI DEAD ZONE';
      titleEl.style.color = '#38a169';
    }
    if (subEl) subEl.textContent = 'Memuat Desa Asri Safe Zone, persenjataan & Kota Sector-7...';
    if (ringEl) ringEl.style.borderTopColor = '#38a169';
    if (barEl) barEl.style.background = 'linear-gradient(90deg, #1e6b43, #38a169)';
  } else if (type === 'arena') {
    portalOverlay.style.background = 'radial-gradient(circle at center, #1f0d0d 0%, #070404 100%)';
    if (titleEl) {
      titleEl.textContent = 'MEMASUKI BATTLE ARENA';
      titleEl.style.color = '#dc3545';
    }
    if (subEl) subEl.textContent = 'Menyiapkan arena duel, robot petarung, dan sistem kombat...';
    if (ringEl) ringEl.style.borderTopColor = '#dc3545';
    if (barEl) barEl.style.background = 'linear-gradient(90deg, #991b1b, #dc3545)';
  } else {
    portalOverlay.style.background = 'radial-gradient(circle at center, #0e1726 0%, #07090d 100%)';
    if (titleEl) {
      titleEl.textContent = 'MEMASUKI PORTAL';
      titleEl.style.color = '#e59a28';
    }
    if (subEl) subEl.textContent = 'Menyiapkan dunia 3D & memuat aset grafis...';
    if (ringEl) ringEl.style.borderTopColor = '#e59a28';
    if (barEl) barEl.style.background = 'linear-gradient(90deg, #b46d0c, #e59a28)';
  }

  portalOverlay.style.opacity = '1';
  portalOverlay.style.pointerEvents = 'auto';

  let currentPct = 0;
  const startTime = performance.now();
  const totalDuration = 1300; // 1.3 detik durasi loading stabil

  const updateProgress = () => {
    const elapsed = performance.now() - startTime;
    currentPct = Math.min(100, Math.round((elapsed / totalDuration) * 100));

    if (barEl) barEl.style.width = `${currentPct}%`;
    if (pctEl) pctEl.textContent = `${currentPct}%`;

    if (subEl) {
      if (currentPct < 30) {
        subEl.textContent = 'Menginisialisasi gerbang portal dimensi...';
      } else if (currentPct < 65) {
        subEl.textContent = 'Memuat tekstur dan lingkungan dunia 3D...';
      } else if (currentPct < 90) {
        subEl.textContent = 'Kompilasi shader GPU & stabilisasi frame...';
      } else {
        subEl.textContent = 'Dunia Siap! Masuk ke permainan...';
      }
    }

    if (currentPct < 100) {
      requestAnimationFrame(updateProgress);
    } else {
      setTimeout(() => {
        if (typeof onComplete === 'function') onComplete();
      }, 150);
    }
  };

  requestAnimationFrame(updateProgress);
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

// ==================== NAVIGATION COMPASS & WAYPOINTS (ZOMBIE OUTPOST) ====================
const WAYPOINTS = [
  { id: 'camp', name: 'Portal Rift', icon: '🌀', x: 19.6, z: -4.8 },
  { id: 'farm', name: 'Api Unggun', icon: '🔥', x: -7.2, z: 0.4 },
  { id: 'plaza', name: 'Gerbang Pos', icon: '🚧', x: 7.2, z: 10.1 },
  { id: 'arena', name: 'Menara', icon: '🗼', x: 2.3, z: -9.6 }
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
    const hasDeadZone = localStorage.getItem('gamedev_meta_deadzone_cleared') === '1';
    const hasArena = localStorage.getItem('gamedev_meta_arena_champion') === '1';

    const qGarden = document.getElementById('qGardenItem');
    if (qGarden) {
      qGarden.classList.add('completed');
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

  const dzKills = parseInt(localStorage.getItem('gamedev_meta_deadzone_kills') || '0');
  const dzDone = localStorage.getItem('gamedev_meta_deadzone_cleared') === '1';
  const arenaWins = parseInt(localStorage.getItem('gamedev_meta_arena_wins') || '0');
  const arenaDone = localStorage.getItem('gamedev_meta_arena_champion') === '1';

  kioskBody.innerHTML = `
    <div class="kiosk-stat-row">
      <div class="kiosk-stat-label"><span>🌸</span> Taman Asri & Paviliun Air Mancur</div>
      <div class="kiosk-stat-val">🌿 TERJELAJAHI (Area Santai)</div>
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

export function initControlGuideToggle() {
  const info = document.getElementById('info');
  const btn = document.getElementById('btnInfoToggle');
  if (info && btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const collapsed = info.classList.toggle('collapsed');
      btn.textContent = collapsed ? '[+]' : '[−]';
    });
  }
}

// ==================== INISIALISASI SELURUH UI ====================
export function initUI(worldAudio) {
  initPortalOverlay();
  initAudioUI(worldAudio);
  initKioskModal();
  initDialogueUI();
  initControlGuideToggle();
  updateQuestHUD();
}

