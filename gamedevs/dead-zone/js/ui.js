// ============================================================================
// DEAD ZONE — UI & HUD INTERFACE MANAGER
// Controls HUD rendering, health bars, ammo readouts, hit-markers,
// full-screen menus, modals, and user settings.
// ============================================================================

import { sound } from './audio.js';

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
    this.damageFlash = document.getElementById('damage-flash');
    this.lowHpVignette = document.getElementById('low-hp-vignette');
    this.playerStatusText = document.getElementById('player-status-text');

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

    this.announcementBanner = document.getElementById('announcement-banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerSubtitle = document.getElementById('banner-subtitle');

    // Modals
    this.modalHow = document.getElementById('modal-how');
    this.modalSettings = document.getElementById('modal-settings');

    // Settings Inputs
    this.settingSens = document.getElementById('setting-sensitivity');
    this.valSens = document.getElementById('val-sensitivity');
    this.settingVol = document.getElementById('setting-volume');
    this.valVol = document.getElementById('val-volume');

    this.announcementTimer = null;
    this.hitMarkerTimer = null;
    this.recoilTimer = null;
    this.flashTimer = null;
  }

  init(callbacks) {
    this.callbacks = callbacks || {};

    // Play button
    document.getElementById('btn-play').addEventListener('click', () => {
      sound.init();
      if (this.callbacks.onStartGame) this.callbacks.onStartGame();
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
    document.getElementById('btn-settings').addEventListener('click', () => this.showModal('settings', true));
    document.getElementById('btn-close-settings').addEventListener('click', () => this.showModal('settings', false));
    document.getElementById('btn-save-settings').addEventListener('click', () => this.showModal('settings', false));

    // Sensitivity slider
    if (this.settingSens) {
      this.settingSens.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.valSens.textContent = val.toFixed(4);
        if (this.callbacks.onSensitivityChange) {
          this.callbacks.onSensitivityChange(val);
        }
      });
    }

    // Volume slider
    if (this.settingVol) {
      this.settingVol.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.valVol.textContent = `${val}%`;
        sound.setVolume(val / 100);
      });
    }
  }

  showModal(name, show) {
    if (name === 'how') {
      this.modalHow.classList.toggle('hidden', !show);
    } else if (name === 'settings') {
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
      this.playerStatusText.textContent = 'OPERATIONAL';
      this.playerStatusText.style.color = '#22c55e';
      this.lowHpVignette.classList.remove('pulse-active');
    } else if (pct > 30) {
      this.healthBarFill.style.background = 'linear-gradient(90deg, #b45309, #f59e0b)';
      this.playerStatusText.textContent = 'INJURED';
      this.playerStatusText.style.color = '#f59e0b';
      this.lowHpVignette.classList.remove('pulse-active');
    } else {
      this.healthBarFill.style.background = 'linear-gradient(90deg, #991b1b, #ef4444)';
      this.playerStatusText.textContent = 'CRITICAL';
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

  updateWaveInfo(wave, maxWaves, remainingZombies, kills) {
    this.hudWaveTitle.textContent = `WAVE ${wave} / ${maxWaves}`;
    this.hudZombiesCount.textContent = remainingZombies;
    this.hudKillCount.textContent = kills;
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
