// ============================================================================
// DEAD ZONE — UI & HUD INTERFACE MANAGER
// Controls HUD rendering, health bars, ammo readouts, hit-markers,
// full-screen menus, modals, and user settings.
// ============================================================================

import { sound } from './audio.js';
import { GameState } from './gameState.js';

export class UIManager {
  constructor() {
    // DOM Elements Cache
    this.hud = document.getElementById('hud');
    this.menuScreen = document.getElementById('menu-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.victoryScreen = document.getElementById('victory-screen');

    // HUD Elements
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.healthText = document.getElementById('health-text');
    this.staminaBarFill = document.getElementById('stamina-bar-fill');
    this.staminaText = document.getElementById('stamina-text');
    this.damageFlash = document.getElementById('damage-flash');
    this.lowHpVignette = document.getElementById('low-hp-vignette');
    this.playerStatusText = document.getElementById('player-status-text');

    // Sci-Fi Economy & Inventory Elements
    this.hudWalletVal = document.getElementById('hud-wallet-val');
    this.hudBackpackVal = document.getElementById('hud-backpack-val');
    this.hudStimVal = document.getElementById('hud-stim-val');
    this.hudZoneBadge = document.getElementById('hud-zone-badge');

    this.hudWaveTitle = document.getElementById('hud-wave-title');
    this.hudZombiesCount = document.getElementById('hud-zombies-count');
    this.hudKillCount = document.getElementById('hud-kill-count');

    this.crosshair = document.getElementById('crosshair');
    this.hitMarker = document.getElementById('hit-marker');

    this.reloadAlert = document.getElementById('reload-alert');
    this.reloadBarContainer = document.getElementById('reload-bar-container');
    this.reloadBarFill = document.getElementById('reload-bar-fill');

    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.weaponNameDisplay = document.querySelector('.weapon-name');
    this.quickSelectBar = document.getElementById('quick-select-bar');

    this.announcementBanner = document.getElementById('announcement-banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerSubtitle = document.getElementById('banner-subtitle');

    // Modals
    this.modalHow = document.getElementById('modal-how');
    this.modalSettings = document.getElementById('modal-settings');

    // Settings Inputs & Controls
    this.settingSens = document.getElementById('setting-sensitivity');
    this.valSens = document.getElementById('val-sensitivity');
    this.settingVol = document.getElementById('setting-volume');
    this.valVol = document.getElementById('val-volume');
    this.btnToggleMute = document.getElementById('btn-toggle-mute');
    this.settingSfxVol = document.getElementById('setting-sfx-volume');
    this.valSfxVol = document.getElementById('val-sfx-volume');
    this.settingZombieVol = document.getElementById('setting-zombie-volume');
    this.valZombieVol = document.getElementById('val-zombie-volume');
    this.settingAmbientVol = document.getElementById('setting-ambient-volume');
    this.valAmbientVol = document.getElementById('val-ambient-volume');
    this.btnTestAudio = document.getElementById('btn-test-audio');
    this.btnResetAudio = document.getElementById('btn-reset-audio');
    this.btnHudAudio = document.getElementById('btn-hud-audio');
    this.btnMobileAudio = document.getElementById('btn-mobile-audio');
    this.btnPauseSettings = document.getElementById('btn-pause-settings');

    this.announcementTimer = null;
    this.hitMarkerTimer = null;
    this.recoilTimer = null;
    this.flashTimer = null;
  }

  init(callbacks) {
    this.callbacks = callbacks || {};

    // Play button
    const startPlay = () => {
      sound.init();
      if (this.callbacks.onStartGame) this.callbacks.onStartGame();
    };

    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', startPlay);
      btnPlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startPlay();
      }, { passive: false });
    }

    // Dukung tombol [Enter] dan [Spasi] pada keyboard saat di Menu Start
    window.addEventListener('keydown', (e) => {
      const startScreen = document.getElementById('start-screen');
      if (startScreen && !startScreen.classList.contains('hidden')) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startPlay();
        }
      }
    });

    // Resume button
    document.getElementById('btn-resume').addEventListener('click', () => {
      if (this.callbacks.onResumeGame) this.callbacks.onResumeGame();
    });

    // Pause restart button
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      if (this.callbacks.onRestartGame) this.callbacks.onRestartGame();
    });

    // Game Over restart button
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      if (this.callbacks.onRestartGame) this.callbacks.onRestartGame();
    });

    // Victory restart button
    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      if (this.callbacks.onRestartGame) this.callbacks.onRestartGame();
    });

    // How to play modals
    document.getElementById('btn-how-to-play').addEventListener('click', () => this.showModal('how', true));
    document.getElementById('btn-pause-how').addEventListener('click', () => this.showModal('how', true));
    document.getElementById('btn-close-how').addEventListener('click', () => this.showModal('how', false));
    document.getElementById('btn-how-ack').addEventListener('click', () => this.showModal('how', false));

    // Settings modals
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) btnSettings.addEventListener('click', () => this.showModal('settings', true));
    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => this.showModal('settings', false));
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', () => this.showModal('settings', false));

    // Pause screen settings button
    if (this.btnPauseSettings) {
      this.btnPauseSettings.addEventListener('click', () => {
        if (this.callbacks.onOpenSettings) {
          this.callbacks.onOpenSettings();
        } else {
          this.showModal('settings', true);
        }
      });
    }

    // HUD & Mobile Quick Audio buttons
    if (this.btnHudAudio) {
      this.btnHudAudio.addEventListener('click', () => {
        if (this.callbacks.onOpenSettings) {
          this.callbacks.onOpenSettings();
        } else {
          this.showModal('settings', true);
        }
      });
    }
    if (this.btnMobileAudio) {
      this.btnMobileAudio.addEventListener('click', () => {
        if (this.callbacks.onOpenSettings) {
          this.callbacks.onOpenSettings();
        } else {
          this.showModal('settings', true);
        }
      });
    }

    // Sensitivity slider
    if (this.settingSens) {
      this.settingSens.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.valSens) this.valSens.textContent = val.toFixed(4);
        if (this.callbacks.onSensitivityChange) {
          this.callbacks.onSensitivityChange(val);
        }
      });
    }

    // Master Volume slider
    if (this.settingVol) {
      this.settingVol.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (typeof sound !== 'undefined') {
          sound.setVolume(val / 100);
        }
        this.syncAudioUI();
      });
    }

    // Mute toggle button
    if (this.btnToggleMute) {
      this.btnToggleMute.addEventListener('click', () => {
        if (typeof sound !== 'undefined') {
          sound.toggleMute();
          this.syncAudioUI();
        }
      });
    }

    // Preset volume pills (0%, 15%, 35%, 75%)
    document.querySelectorAll('.preset-vol-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const vol = parseInt(e.currentTarget.getAttribute('data-vol'), 10);
        if (typeof sound !== 'undefined') {
          sound.setVolume(vol / 100);
          this.syncAudioUI();
          if (vol > 0) sound.playTestTone();
        }
      });
    });

    // Subchannel: SFX Volume
    if (this.settingSfxVol) {
      this.settingSfxVol.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.valSfxVol) this.valSfxVol.textContent = `${val}%`;
        if (typeof sound !== 'undefined') sound.setSfxVolume(val / 100);
      });
    }

    // Subchannel: Zombie Volume
    if (this.settingZombieVol) {
      this.settingZombieVol.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.valZombieVol) this.valZombieVol.textContent = `${val}%`;
        if (typeof sound !== 'undefined') sound.setZombieVolume(val / 100);
      });
    }

    // Subchannel: Ambient Volume
    if (this.settingAmbientVol) {
      this.settingAmbientVol.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.valAmbientVol) this.valAmbientVol.textContent = `${val}%`;
        if (typeof sound !== 'undefined') sound.setAmbientVolume(val / 100);
      });
    }

    // Test Audio button
    if (this.btnTestAudio) {
      this.btnTestAudio.addEventListener('click', () => {
        if (typeof sound !== 'undefined') {
          sound.playTestTone();
        }
      });
    }

    // Reset Audio button
    if (this.btnResetAudio) {
      this.btnResetAudio.addEventListener('click', () => {
        if (typeof sound !== 'undefined') {
          sound.setVolume(0.35);
          sound.setSfxVolume(0.85);
          sound.setZombieVolume(0.80);
          sound.setAmbientVolume(0.65);
          sound.setMuted(false);
          this.syncAudioUI();
          sound.playTestTone();
        }
      });
    }

    // Initial audio UI sync
    this.syncAudioUI();

    // Nano-Stim Button [Q] on HUD
    const btnStim = document.getElementById('btn-use-stim');
    if (btnStim) {
      btnStim.addEventListener('click', () => {
        if (this.callbacks.onUseStim) this.callbacks.onUseStim();
      });
    }

    // Mobile buttons for Stim and Interact
    const btnMobileStim = document.getElementById('btn-mobile-stim');
    if (btnMobileStim) {
      btnMobileStim.addEventListener('click', () => {
        if (this.callbacks.onUseStim) this.callbacks.onUseStim();
      });
    }

    const btnMobileInteract = document.getElementById('btn-mobile-interact');
    if (btnMobileInteract) {
      btnMobileInteract.addEventListener('click', () => {
        if (this.callbacks.onInteract) this.callbacks.onInteract();
      });
    }

    // Hotbar Quick-Select Slots Click / Touch Handlers
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    hotbarSlots.forEach(slotBtn => {
      const handleSlotClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slot = parseInt(slotBtn.dataset.slot, 10);
        if (this.callbacks.onSelectSlot) {
          this.callbacks.onSelectSlot(slot);
        }
      };
      slotBtn.addEventListener('click', handleSlotClick);
      slotBtn.addEventListener('touchstart', handleSlotClick, { passive: false });
    });
  }

  updateHUD() {
    if (this.hudWalletVal) {
      this.hudWalletVal.textContent = GameState.formatRp(GameState.wallet);
    }
    if (this.hudBackpackVal) {
      this.hudBackpackVal.textContent = `${GameState.backpack.length} / ${GameState.backpackMaxSlots}`;
    }
    if (this.hudStimVal) {
      this.hudStimVal.textContent = GameState.countItem('nano_stim', true);
    }
    if (this.hudZoneBadge) {
      if (GameState.activeZone === 'safe_zone') {
        this.hudZoneBadge.textContent = 'SAFE ZONE (AMAN)';
        this.hudZoneBadge.style.color = '#00e5ff';
        this.hudWaveTitle.textContent = 'DESA ASRI (PERMUKIMAN AMAN)';
      } else {
        this.hudZoneBadge.textContent = 'HUTAN SECTOR-7 (BAHAYA)';
        this.hudZoneBadge.style.color = '#10b981';
        this.hudWaveTitle.textContent = 'HUTAN RIMBA SECTOR-7';
      }
    }
    this.updateQuickSelectBar();
    this.updateBuffDisplay();
  }

  updateStamina(stamina, maxStamina = 5.0, isExhausted = false) {
    if (!this.staminaBarFill) {
      this.staminaBarFill = document.getElementById('stamina-bar-fill');
      this.staminaText = document.getElementById('stamina-text');
    }
    if (!this.staminaBarFill) return;

    const pct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
    this.staminaBarFill.style.width = `${pct}%`;
    this.staminaBarFill.classList.toggle('exhausted', isExhausted);

    if (this.staminaText) {
      if (isExhausted) {
        this.staminaText.textContent = 'TERENGAH-ENGAH (LELAH)';
      } else {
        this.staminaText.textContent = `${stamina.toFixed(1)}s (${Math.round(pct)}%)`;
      }
    }
  }

  updateQuickSelectBar(activeWeaponId = null, weaponData = null) {
    if (!this.quickSelectBar) {
      this.quickSelectBar = document.getElementById('quick-select-bar');
    }
    if (!this.quickSelectBar) return;

    const wId = activeWeaponId || (this.player && this.player.weapons ? this.player.weapons.currentWeaponId : 'pulse_pistol');
    const wData = weaponData || (this.player && this.player.weapons ? this.player.weapons.weaponData : null);

    // 1. Slot 1: Desert Eagle .50 AE Pistol
    const meta1 = document.getElementById('hotbar-meta-1');
    const slot1 = document.getElementById('hotbar-slot-1');
    if (meta1 && wData && wData.pulse_pistol) {
      meta1.textContent = `${wData.pulse_pistol.ammoInMag}/${wData.pulse_pistol.reserveAmmo}`;
    }
    if (slot1) slot1.classList.toggle('active', wId === 'pulse_pistol' || wId === 'desert_eagle');

    // 2. Slot 2: AK-47 Assault Rifle
    const meta2 = document.getElementById('hotbar-meta-2');
    const slot2 = document.getElementById('hotbar-slot-2');
    const hasRifle = GameState.ownedWeapons.includes('plasma_rifle') || GameState.ownedWeapons.includes('ak47');
    if (slot2) {
      slot2.classList.toggle('locked', !hasRifle);
      slot2.classList.toggle('active', hasRifle && (wId === 'plasma_rifle' || wId === 'ak47'));
    }
    if (meta2 && wData && wData.plasma_rifle) {
      meta2.textContent = `${wData.plasma_rifle.ammoInMag}/${wData.plasma_rifle.reserveAmmo}`;
    }

    // 3. Slot 3: AWP Sniper Rifle
    const meta3 = document.getElementById('hotbar-meta-3');
    const slot3 = document.getElementById('hotbar-slot-3');
    const hasAwp = GameState.ownedWeapons.includes('awp') || GameState.ownedWeapons.includes('awm');
    if (slot3) {
      slot3.classList.toggle('locked', !hasAwp);
      slot3.classList.toggle('active', hasAwp && (wId === 'awp' || wId === 'awm'));
    }
    if (meta3 && wData && wData.awp) {
      meta3.textContent = `${wData.awp.ammoInMag}/${wData.awp.reserveAmmo}`;
    }

    // 4. Slot 4: Pisau Komando / Golok Pedesaan
    const meta4 = document.getElementById('hotbar-meta-4');
    const slot4 = document.getElementById('hotbar-slot-4');
    const hasMachete = GameState.ownedWeapons.includes('machete') || GameState.ownedWeapons.includes('combat_knife');
    if (slot4) {
      slot4.classList.toggle('locked', !hasMachete);
      slot4.classList.toggle('active', hasMachete && (wId === 'machete' || wId === 'combat_knife'));
    }
    if (meta4) {
      meta4.textContent = hasMachete ? 'MELEE' : 'LOCKED 🔒';
    }

    // 5. Slot 5: Scatter Shotgun
    const meta5 = document.getElementById('hotbar-meta-5');
    const slot5 = document.getElementById('hotbar-slot-5');
    const hasShotgun = GameState.ownedWeapons.includes('scatter_blaster');
    if (slot5) {
      slot5.classList.toggle('locked', !hasShotgun);
      slot5.classList.toggle('active', hasShotgun && wId === 'scatter_blaster');
    }
    if (meta5 && wData && wData.scatter_blaster) {
      meta5.textContent = `${wData.scatter_blaster.ammoInMag}/${wData.scatter_blaster.reserveAmmo}`;
    }

    // 6. Slot 6: Medkit / Ramuan Jamu Herbal (Nano-Stim)
    const meta6 = document.getElementById('hotbar-meta-6');
    const slot6 = document.getElementById('hotbar-slot-6');
    const stimCount = GameState.countItem ? GameState.countItem('nano_stim', true) : 0;
    if (meta6) {
      meta6.textContent = `x${stimCount}`;
    }
    if (slot6) {
      slot6.classList.toggle('empty-slot', stimCount === 0);
    }

    // 7. Slot 7: Ranjau Paku Bambu
    const meta7 = document.getElementById('hotbar-meta-7');
    const slot7 = document.getElementById('hotbar-slot-7');
    const trapCount = GameState.countItem ? GameState.countItem('bamboo_trap', true) : 0;
    if (meta7) {
      meta7.textContent = `x${trapCount}`;
    }
    if (slot7) {
      slot7.classList.toggle('empty-slot', trapCount === 0);
    }

    // 8. Slot 8: Flashlight Utility
    const meta8 = document.getElementById('hotbar-meta-8');
    const slot8 = document.getElementById('hotbar-slot-8');
    const isFlashOn = !!(this.player && this.player.flashlightEnabled);
    if (meta8) {
      meta8.textContent = isFlashOn ? 'ON 💡' : 'OFF';
      meta8.style.color = isFlashOn ? '#fde047' : '#94a3b8';
    }
    if (slot8) {
      slot8.classList.toggle('active', isFlashOn);
    }
  }

  // Menampilkan / menyembunyikan banner hitung mundur evakuasi
  showHoldoutBanner(show, initialDuration = 12.0) {
    if (!this.holdoutBanner) {
      this.holdoutBanner = document.getElementById('holdout-banner');
      this.holdoutTimerEl = document.getElementById('holdout-timer');
      this.holdoutInfoEl = document.getElementById('holdout-info');
      this.holdoutProgressFill = document.getElementById('holdout-progress-fill');
    }
    this.initialHoldoutDuration = initialDuration || 12.0;
    if (this.holdoutBanner) {
      this.holdoutBanner.classList.toggle('hidden', !show);
    }
    if (show && this.holdoutProgressFill) {
      this.holdoutProgressFill.style.width = '100%';
    }
  }

  // Update timer hitung mundur dan jarak pemain ke suar
  updateHoldoutCountdown(remainingSeconds, distToBeacon) {
    if (!this.holdoutTimerEl) {
      this.holdoutTimerEl = document.getElementById('holdout-timer');
      this.holdoutInfoEl = document.getElementById('holdout-info');
      this.holdoutProgressFill = document.getElementById('holdout-progress-fill');
    }
    const secs = Math.max(0, remainingSeconds);
    if (this.holdoutTimerEl) {
      this.holdoutTimerEl.textContent = `${secs.toFixed(1)}s`;
    }
    if (this.holdoutInfoEl) {
      const d = distToBeacon.toFixed(1);
      const isDanger = distToBeacon > 10.0;
      this.holdoutInfoEl.innerHTML = isDanger
        ? `<span style="color:#ef4444; font-weight:800;">PERINGATAN: Jarak suar ${d}m (Batas 14m)!</span>`
        : `Jarak ke suar: <strong>${d}m</strong> / 14m`;
    }
    if (this.holdoutProgressFill && this.initialHoldoutDuration) {
      const pct = Math.max(0, Math.min(100, (secs / this.initialHoldoutDuration) * 100));
      this.holdoutProgressFill.style.width = `${pct}%`;
    }
  }

  // Tampilkan badge buff herbal yang sedang aktif
  updateBuffDisplay() {
    const container = document.getElementById('active-buffs-container');
    if (!container || !GameState.activeBuffs) return;

    let html = '';
    if (GameState.activeBuffs.staminaBoostTimer > 0) {
      html += `<div class="buff-pill stamina-boost">🌾 Beras Kencur (Stamina 2x) <span class="buff-time">${Math.ceil(GameState.activeBuffs.staminaBoostTimer)}s</span></div>`;
    }
    if (GameState.activeBuffs.poisonImmuneTimer > 0) {
      html += `<div class="buff-pill poison-immune">🧪 Kunyit Asam (Kebal Racun) <span class="buff-time">${Math.ceil(GameState.activeBuffs.poisonImmuneTimer)}s</span></div>`;
    }
    container.innerHTML = html;
  }

  updateWeaponName(name) {
    if (!this.weaponNameDisplay) {
      this.weaponNameDisplay = document.querySelector('.weapon-name');
    }
    if (this.weaponNameDisplay) {
      this.weaponNameDisplay.textContent = name;
    }
  }

  syncAudioUI() {
    if (typeof sound === 'undefined') return;
    const isMuted = !!sound.isMuted;
    const masterPercent = isMuted ? 0 : Math.round((sound.volume !== undefined ? sound.volume : 0.35) * 100);
    const sfxPercent = Math.round((sound.sfxVolume !== undefined ? sound.sfxVolume : 0.85) * 100);
    const zombiePercent = Math.round((sound.zombieVolume !== undefined ? sound.zombieVolume : 0.80) * 100);
    const ambientPercent = Math.round((sound.ambientVolume !== undefined ? sound.ambientVolume : 0.65) * 100);

    if (this.settingVol) this.settingVol.value = isMuted ? 0 : masterPercent;
    if (this.valVol) {
      this.valVol.textContent = isMuted ? 'BISU (0%)' : `${masterPercent}%`;
      this.valVol.style.color = isMuted ? '#ff3366' : '#00e5ff';
    }

    if (this.btnToggleMute) {
      this.btnToggleMute.textContent = isMuted ? '🔊 NYALAKAN' : '🔇 BISU';
      this.btnToggleMute.classList.toggle('active', isMuted);
    }

    if (this.settingSfxVol) this.settingSfxVol.value = sfxPercent;
    if (this.valSfxVol) this.valSfxVol.textContent = `${sfxPercent}%`;

    if (this.settingZombieVol) this.settingZombieVol.value = zombiePercent;
    if (this.valZombieVol) this.valZombieVol.textContent = `${zombiePercent}%`;

    if (this.settingAmbientVol) this.settingAmbientVol.value = ambientPercent;
    if (this.valAmbientVol) this.valAmbientVol.textContent = `${ambientPercent}%`;

    // Highlight active preset pill if match
    document.querySelectorAll('.preset-vol-pill').forEach(pill => {
      const pVol = parseInt(pill.getAttribute('data-vol'), 10);
      if ((isMuted && pVol === 0) || (!isMuted && pVol === masterPercent)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    this.updateAudioHUDIndicator();
  }

  updateAudioHUDIndicator() {
    if (!this.btnHudAudio) return;
    if (typeof sound === 'undefined') return;
    if (sound.isMuted || sound.volume <= 0) {
      this.btnHudAudio.innerHTML = '🔇 BISU [O]';
      this.btnHudAudio.style.borderColor = '#ff3366';
      this.btnHudAudio.style.color = '#ff3366';
    } else {
      const pct = Math.round(sound.volume * 100);
      this.btnHudAudio.innerHTML = `🔊 SUARA (${pct}%) [O]`;
      this.btnHudAudio.style.borderColor = '';
      this.btnHudAudio.style.color = '';
    }
  }

  showModal(name, show) {
    if (name === 'how') {
      this.modalHow.classList.toggle('hidden', !show);
    } else if (name === 'settings') {
      if (show) {
        this.syncAudioUI();
      } else {
        if (typeof sound !== 'undefined') sound.saveSettings();
      }
      this.modalSettings.classList.toggle('hidden', !show);
    }
  }

  showScreen(name) {
    this.menuScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.hud.classList.add('hidden');

    switch (name) {
      case 'menu':
        this.menuScreen.classList.remove('hidden');
        break;
      case 'playing':
        this.hud.classList.remove('hidden');
        break;
      case 'paused':
        this.hud.classList.remove('hidden');
        this.pauseScreen.classList.remove('hidden');
        break;
      case 'gameover':
        this.gameOverScreen.classList.remove('hidden');
        break;
      case 'victory':
        this.victoryScreen.classList.remove('hidden');
        break;
    }
  }

  updateHealth(health, maxHealth = 100) {
    const pct = Math.max(0, Math.min(100, Math.round((health / maxHealth) * 100)));
    this.healthBarFill.style.width = `${pct}%`;
    this.healthText.textContent = `${health} / ${maxHealth}`;

    // Color gradient based on health
    if (pct > 60) {
      this.healthBarFill.style.background = 'linear-gradient(90deg, #15803d, #22c55e)';
      this.playerStatusText.textContent = 'SEHAT & SIAGA';
      this.playerStatusText.style.color = '#22c55e';
      this.lowHpVignette.classList.remove('pulse-active');
    } else if (pct > 30) {
      this.healthBarFill.style.background = 'linear-gradient(90deg, #b45309, #f59e0b)';
      this.playerStatusText.textContent = 'TERLUKA';
      this.playerStatusText.style.color = '#f59e0b';
      this.lowHpVignette.classList.remove('pulse-active');
    } else {
      this.healthBarFill.style.background = 'linear-gradient(90deg, #991b1b, #ef4444)';
      this.playerStatusText.textContent = 'KRITIS';
      this.playerStatusText.style.color = '#ef4444';
      this.lowHpVignette.classList.add('pulse-active');
    }
  }

  triggerDamageFlash() {
    this.damageFlash.classList.add('flash-active');
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.damageFlash.classList.remove('flash-active');
    }, 120);
  }

  updateWaveInfo(wave, maxWaves, remainingZombies, kills, bossInfo = null) {
    if (this.hudWaveTitle) {
      if (GameState.activeZone === 'sector_7') {
        if (bossInfo && bossInfo.isAlive) {
          this.hudWaveTitle.innerHTML = `<span style="color:#ef4444; text-shadow:0 0 12px #ef4444; font-weight:bold;">⚠️ BOSS TITAN MUTAN AKTIF (HP: ${Math.max(0, Math.round(bossInfo.hp))} / ${bossInfo.maxHp}) ⚠️</span>`;
        } else {
          const bossProgress = kills % 10;
          const remainingToBoss = 10 - bossProgress;
          this.hudWaveTitle.innerHTML = `<span>HUTAN DEAD-ZONE · MENUJU BOSS: <strong style="color:#38bdf8;">${bossProgress}/10</strong> (Sisa ${remainingToBoss} Kill)</span>`;
        }
      } else {
        this.hudWaveTitle.textContent = 'DESA RIMBA ASRI (SAFE ZONE)';
      }
    }
    if (this.hudZombiesCount) {
      this.hudZombiesCount.textContent = remainingZombies;
    }
    if (this.hudKillCount) {
      this.hudKillCount.textContent = kills;
    }
  }

  updateAmmo(current, reserve) {
    this.ammoCurrent.textContent = current;
    this.ammoReserve.textContent = reserve;

    if (current <= 3 && current > 0) {
      this.ammoCurrent.style.color = '#f59e0b';
    } else if (current === 0) {
      this.ammoCurrent.style.color = '#ef4444';
    } else {
      this.ammoCurrent.style.color = '#ffffff';
    }
  }

  showReloadAlert(show) {
    this.reloadAlert.classList.toggle('hidden', !show);
  }

  showReloadProgressBar(show) {
    this.reloadBarContainer.classList.toggle('hidden', !show);
    if (!show) {
      this.reloadBarFill.style.width = '0%';
    }
  }

  updateReloadProgress(fraction) {
    const pct = Math.min(100, Math.round(fraction * 100));
    this.reloadBarFill.style.width = `${pct}%`;
  }

  triggerCrosshairRecoil() {
    this.crosshair.classList.add('recoil');
    if (this.recoilTimer) clearTimeout(this.recoilTimer);
    this.recoilTimer = setTimeout(() => {
      this.crosshair.classList.remove('recoil');
    }, 90);
  }

  showHitMarker(isCritical) {
    this.hitMarker.classList.remove('hidden');
    if (isCritical) {
      this.hitMarker.style.setProperty('--color-accent-red', '#ff1111');
      this.hitMarker.style.transform = 'translate(-50%, -50%) scale(1.4)';
    } else {
      this.hitMarker.style.setProperty('--color-accent-red', '#ffffff');
      this.hitMarker.style.transform = 'translate(-50%, -50%) scale(1.0)';
    }

    if (this.hitMarkerTimer) clearTimeout(this.hitMarkerTimer);
    this.hitMarkerTimer = setTimeout(() => {
      this.hitMarker.classList.add('hidden');
    }, 120);
  }

  showAnnouncement(title, subtitle, durationSeconds = 3.0) {
    this.bannerTitle.textContent = title;
    this.bannerSubtitle.textContent = subtitle;
    this.announcementBanner.classList.remove('hidden');

    if (this.announcementTimer) clearTimeout(this.announcementTimer);
    this.announcementTimer = setTimeout(() => {
      this.announcementBanner.classList.add('hidden');
    }, durationSeconds * 1000);
  }

  showGameOver(wave, kills, shots, accuracy) {
    document.getElementById('stat-go-wave').textContent = `${wave} / 3`;
    document.getElementById('stat-go-kills').textContent = kills;
    document.getElementById('stat-go-shots').textContent = shots;
    document.getElementById('stat-go-accuracy').textContent = `${accuracy}%`;
    this.showScreen('gameover');
  }

  showVictory(kills, shots, headshots, accuracy) {
    document.getElementById('stat-vic-kills').textContent = kills;
    document.getElementById('stat-vic-shots').textContent = shots;
    document.getElementById('stat-vic-headshots').textContent = headshots;
    document.getElementById('stat-vic-accuracy').textContent = `${accuracy}%`;
    this.showScreen('victory');
  }

  showWebGLError(msg) {
    const errorEl = document.getElementById('webgl-error');
    const msgEl = document.getElementById('error-message');
    if (errorEl && msgEl) {
      msgEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  }
}
