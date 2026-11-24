// ============================================================================
// SCI-FI FPS SURVIVAL & ECONOMIC ECOSYSTEM — MAIN ENGINE
// Orchestrates 2 maps (Neo-Haven Safe Zone & Sector-7 Wasteland),
// Economy in Rupiah (Rp), Safehouse, Shops, Looting, and High-Stakes Death.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';
import { GameState } from './gameState.js';
import { EnvironmentDual } from './environment_dual.js';
import { Player } from './player.js';
import { WeaponManager } from './weapons.js';
import { ZombiesManager } from './zombies.js';
import { WaveManager } from './waves.js';
import { UIManager } from './ui.js';
import { ShopManager } from './shops.js';
import { LootManager } from './loot.js';
import { TouchControls } from './touchControls.js';
import { initZombieAssets } from './zombieAssets.js';

class DeadZoneGame {
  constructor() {
    this.container = document.getElementById('game-container');

    // Game States
    this.STATES = {
      MENU: 'MENU',
      PLAYING: 'PLAYING',
      PAUSED: 'PAUSED',
      GAMEOVER: 'GAMEOVER',
      VICTORY: 'VICTORY'
    };
    this.currentState = this.STATES.MENU;

    // Timing
    this.clock = new THREE.Clock();
    this.maxDelta = 0.1;
    this.zoneSwitchCooldown = 0;
    this.isWorldRendered = false;

    // UI Manager
    this.ui = new UIManager();

    if (!this.checkWebGLSupport()) {
      this.ui.showWebGLError("WebGL tidak didukung oleh browser Anda. Mohon aktifkan akselerasi perangkat keras.");
      return;
    }

    try {
      this.initThree();
      this.initSubsystems();
      this.initUI();
      this.attachGlobalEvents();

      // Start global game loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);

      // Loading sesungguhnya: tunggu aset 3D & zombie selesai, kompilasi shader GPU & render 3 frame
      this.preloadAndRenderWorld();

      console.log("Sci-Fi FPS Survival & Economic Ecosystem initialized.");
    } catch (err) {
      console.error("Game initialization error:", err);
      this.ui.showWebGLError("Initialization Error: " + err.message);
    }
  }

  // Preload aset 3D, kompilasi shader Three.js ke GPU, dan render frame offscreen
  async preloadAndRenderWorld() {
    const screen = document.getElementById('zone-loading-screen');
    const titleEl = document.getElementById('zoneLoaderTitle');
    const subEl = document.getElementById('zoneLoaderSubtitle');
    const fillEl = document.getElementById('zoneLoaderFill');
    const statEl = document.getElementById('zoneLoaderStatus');
    const btnPlay = document.getElementById('btn-play');

    if (screen) screen.classList.remove('hidden');
    if (titleEl) {
      titleEl.textContent = 'MEMASUKI DEAD ZONE';
      titleEl.style.color = '#22c55e';
    }
    if (subEl) subEl.textContent = 'Memulai mesin 3D & inisialisasi lingkungan...';
    if (btnPlay) {
      btnPlay.disabled = true;
      btnPlay.style.opacity = '0.5';
    }

    let isDone = false;
    let currentPct = 15;
    let targetPct = 30;

    // Smooth continuous progress ticker (bar selalu bergerak mulus, anti-stuck)
    const progressInterval = setInterval(() => {
      if (isDone) return;
      if (currentPct < targetPct) {
        currentPct = Math.min(targetPct, currentPct + 2.0);
      } else if (currentPct < 96) {
        currentPct += 0.35; // Creep pelan sehingga visual progres selalu hidup
      }
      const rounded = Math.min(99, Math.round(currentPct));
      if (fillEl) fillEl.style.width = `${rounded}%`;
      if (statEl) statEl.textContent = `MEMUAT... ${rounded}%`;
    }, 40);

    const updateStage = (target, subText) => {
      if (isDone) return;
      targetPct = Math.max(targetPct, target);
      if (subEl && subText) subEl.textContent = subText;
    };

    const finishLoading = () => {
      if (isDone) return;
      isDone = true;
      clearInterval(progressInterval);

      if (fillEl) fillEl.style.width = '100%';
      if (statEl) statEl.textContent = 'DUNIA SELESAI DIRENDER! 100%';
      if (subEl) subEl.textContent = 'Dunia 3D & shader GPU telah siap!';
      this.isWorldRendered = true;
      if (btnPlay) {
        btnPlay.disabled = false;
        btnPlay.style.opacity = '1';
      }

      setTimeout(() => {
        if (screen) screen.classList.add('hidden');
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');
        this.startGame();
      }, 250);
    };

    // Hard fail-safe timeout 4.8s: Loading screen TIDAK PERNAH bisa stuck
    const failSafeTimer = setTimeout(() => {
      console.warn('⚠️ [DEAD-ZONE] Preload timeout reached, forcing start with ready assets.');
      try {
        this.renderer.compile(this.scene, this.camera);
        this.renderer.render(this.scene, this.camera);
      } catch (e) {}
      finishLoading();
    }, 4800);

    try {
      updateStage(45, 'Memuat permukiman desa 3D (Rumah, Toko & Lapak)...');

      // 1. Tunggu model 3D Safe Zone (House GLB, Shop GLB, Lapak FBX, Portal FBX)
      await Promise.race([
        this.environment.whenReady(),
        new Promise(r => setTimeout(r, 3200))
      ]);
      if (isDone) return;

      updateStage(75, 'Memuat mutan zombie & rigging animasi...');

      // 2. Tunggu aset zombie FBX & tekstur
      await Promise.race([
        initZombieAssets(),
        new Promise(r => setTimeout(r, 3200))
      ]);
      if (isDone) return;

      updateStage(90, 'Kompilasi pipeline shader Three.js ke GPU...');

      // 3. Kompilasi GPU shader
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch (e) {}

      // 4. Pre-render offscreen frame
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (e) {}

      clearTimeout(failSafeTimer);
      finishLoading();
    } catch (err) {
      console.warn('Preload warning:', err);
      clearTimeout(failSafeTimer);
      try {
        this.renderer.compile(this.scene, this.camera);
        this.renderer.render(this.scene, this.camera);
      } catch (e) {}
      finishLoading();
    }
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );

    // 3. Renderer with shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  initSubsystems() {
    // 1. Dual-Zone Environment (Safe Zone & Sector-7 Wasteland)
    this.environment = new EnvironmentDual(this.scene);

    // 2. Player Controller & Camera Rig
    this.player = new Player(
      this.camera,
      this.renderer.domElement,
      this.environment,
      // On Damage callback
      (health, maxHealth) => {
        this.ui.updateHealth(health, maxHealth);
        this.ui.triggerDamageFlash();
      },
      // On Death callback
      () => {
        this.onPlayerDeath();
      }
    );
    this.scene.add(this.player.yawObject);

    // 3. Loot Manager (3D drops and cargo crates)
    this.lootManager = new LootManager(this.scene, this.environment);

    // 4. Waves System (Unlimited Survival & Boss Encounters)
    this.waveManager = new WaveManager(
      null,
      this.environment,
      this.player,
      this.ui,
      () => this.onVictory()
    );
    this.waveManager.lootManager = this.lootManager;

    // 5. Mutants / Infected System with Loot Drops & Boss Progression
    this.zombiesManager = new ZombiesManager(
      this.scene,
      this.environment,
      this.player,
      (pos, isBoss, zombieInstance) => {
        if (GameState.activeZone === 'sector_7') {
          this.waveManager.onZombieKilled(pos, isBoss, zombieInstance);
        }
      }
    );
    this.waveManager.zombiesManager = this.zombiesManager;

    // 6. Weapons System
    this.weaponManager = new WeaponManager(
      this.camera,
      this.player.pitchObject,
      this.zombiesManager,
      this.ui,
      this.environment,
      this.player
    );
    this.waveManager.weaponManager = this.weaponManager;
    this.player.weapons = this.weaponManager;
    this.player.zombiesManager = this.zombiesManager;

    // 7. Touch Controls & Device Mode Switcher
    this.touchControls = new TouchControls(this.player, this.weaponManager);

    // 8. Shop & Kiosk Interaction Manager
    this.shopManager = new ShopManager(this.ui);
    this.ui.player = this.player;
    this.player.onInteractCallback = () => this.shopManager.interact();

    // Wire Player Inventory, Marketplace, Profile & Audio Settings Hotkeys [I, M, P, O, Esc]
    this.player.onToggleInventoryCallback = () => this.shopManager.toggleInventoryModal();
    this.player.onToggleMarketplaceCallback = () => this.shopManager.toggleMarketplaceModal();
    this.player.onToggleProfileCallback = () => this.shopManager.toggleProfileModal();
    this.player.onToggleSettingsCallback = () => this.toggleSettingsModal();
    this.player.onEscapeCallback = () => {
      const modalSettings = document.getElementById('modal-settings');
      if (modalSettings && !modalSettings.classList.contains('hidden')) {
        this.toggleSettingsModal();
        return;
      }
      if (this.shopManager.modalActive) {
        this.shopManager.closeAllModals();
      } else {
        this.pauseGame();
      }
    };

    // Real-Time Notification Callbacks for Market Sales & Milestone Achievements
    GameState.onItemSoldCallback = (listing) => {
      sound.playCoinSound();
      this.ui.showAnnouncement('BARANG TERJUAL DI PASAR! 🏪', `${listing.item.icon || '📦'} ${listing.item.name} (${GameState.formatRp(listing.totalPrice)})`, 2.5);
      if (this.shopManager.modalActive && (this.shopManager.activeMarketTab === 'listings' || this.shopManager.activeMarketTab === 'sold' || this.shopManager.activeMarketTab === 'wallet')) {
        this.shopManager.renderMarketplaceModal();
      }
    };

    GameState.onAchievementUnlockedCallback = (ach) => {
      sound.playBossRoar();
      this.ui.showAnnouncement(`🏆 PENCAPAIAN TERBUKA: ${ach.title}!`, ach.desc, 4.0);
    };

    // Start in Safe Zone with weapons ready
    this.environment.setZoneActive('safe_zone', this.player);
    GameState.activeZone = 'safe_zone';
    this.weaponManager.setHolstered(false);

    // Holdout Extraction State Tracking
    this.isHoldoutActive = false;
    this.holdoutTimer = 0;
    this.holdoutWaveSpawned = false;
  }

  initUI() {
    this.ui.init({
      onStartGame: () => this.startGame(),
      onResumeGame: () => this.resumeGame(),
      onRestartGame: () => this.restartGame(),
      onSwitchZone: (zoneName) => {
        if (zoneName === 'safe_zone' && GameState.activeZone === 'sector_7') {
          this.startHoldoutExtraction();
        } else {
          this.switchZone(zoneName);
        }
      },
      onStartExtraction: () => this.startHoldoutExtraction(),
      onLootCrate: (crateId) => {
        this.lootManager.lootCrate(crateId, this.ui);
        if (this.environment && this.environment.chunkManager) {
          this.environment.chunkManager.markLooted(crateId);
        }
      },
      onUseStim: () => this.player.useNanoStim(this.ui),
      onSelectSlot: (slot) => {
        if (this.player) this.player.selectSlot(slot);
      },
      onInteract: () => this.shopManager.interact(),
      onOpenSettings: () => this.toggleSettingsModal(),
      onSensitivityChange: (val) => {
        if (this.player) this.player.mouseSensitivity = val;
      },
      onGraphicsChange: (gfx) => this.applyGraphicsSettings(gfx)
    });

    // Do not show menu screen - loading screen is active and will transition directly into game after rendering
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) menuScreen.classList.add('hidden');
  }

  applyGraphicsSettings(gfx) {
    if (!gfx) return;
    if (this.camera && gfx.fov) {
      const fov = Math.min(95, Math.max(65, parseFloat(gfx.fov) || 75));
      if (this.camera.fov !== fov) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
    }
    if (this.renderer && gfx.quality) {
      const scale = gfx.quality === 'native'
        ? Math.min(window.devicePixelRatio || 1, 2)
        : Math.max(0.5, parseFloat(gfx.quality) || 1);
      this.renderer.setPixelRatio(scale);
    }
    if (this.renderer && typeof gfx.shadows === 'boolean') {
      if (this.renderer.shadowMap.enabled !== gfx.shadows) {
        this.renderer.shadowMap.enabled = gfx.shadows;
        this.renderer.shadowMap.needsUpdate = true;
      }
    }
    if (this.ui && this.ui.crosshair && gfx.crosshairColor) {
      this.ui.crosshair.style.setProperty('--ch-color', gfx.crosshairColor);
    }
  }

  attachGlobalEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Re-lock pointer on canvas click at any time during gameplay
    this.renderer.domElement.addEventListener('click', () => {
      const modalSettings = document.getElementById('modal-settings');
      const isSettingsOpen = modalSettings && !modalSettings.classList.contains('hidden');
      if (this.currentState === this.STATES.PLAYING && !this.shopManager.modalActive && !isSettingsOpen && !this.player.isTouchMode) {
        this.player.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (!this.player.isTouchMode && document.pointerLockElement !== this.renderer.domElement) {
        const modalSettings = document.getElementById('modal-settings');
        const isSettingsOpen = modalSettings && !modalSettings.classList.contains('hidden');
        if (this.currentState === this.STATES.PLAYING && !this.shopManager.modalActive && !isSettingsOpen) {
          this.pauseGame();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        const modalSettings = document.getElementById('modal-settings');
        if (modalSettings && !modalSettings.classList.contains('hidden')) {
          this.toggleSettingsModal();
          return;
        }
        if (this.shopManager && this.shopManager.modalActive) {
          this.shopManager.closeAllModals();
          if (!this.player.isTouchMode) this.player.requestPointerLock();
          return;
        }
        if (this.currentState === this.STATES.PLAYING) {
          this.pauseGame();
        } else if (this.currentState === this.STATES.PAUSED) {
          this.resumeGame();
        }
      }
    });
  }

  startGame() {
    sound.resume();

    // Pastikan status render siap & sembunyikan loading screen secara definitif
    this.isWorldRendered = true;
    const screen = document.getElementById('zone-loading-screen');
    if (screen) screen.classList.add('hidden');
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) menuScreen.classList.add('hidden');

    this.currentState = this.STATES.PLAYING;
    this.ui.showScreen('playing');

    this.player.reset();
    this.weaponManager.reset();
    this.zombiesManager.clearAll();
    this.waveManager.reset();

    // Spawn at Safehouse in Safe Zone
    this.environment.setZoneActive('safe_zone', this.player);
    GameState.activeZone = 'safe_zone';
    this.weaponManager.setHolstered(false);

    this.ui.updateHealth(this.player.health, this.player.maxHealth);
    this.ui.updateAmmo(this.weaponManager.ammoInMag, this.weaponManager.reserveAmmo);
    this.ui.updateHUD();

    if (!this.player.isTouchMode) {
      this.player.requestPointerLock();
    }

    this.ui.showAnnouncement('DESA ASRI (SAFE ZONE)', 'Persiapkan perlengkapan di Rumah & Toko Desa', 3.0);
  }

  // Fullscreen Loading Transition Screen between Zones & Portals
  showZoneLoadingScreen({ title, subtitle, symbol = '☣️', accent = '#00e5ff', duration = 1000, onHalfway, onComplete }) {
    const screen = document.getElementById('zone-loading-screen');
    const titleEl = document.getElementById('zoneLoaderTitle');
    const subEl = document.getElementById('zoneLoaderSubtitle');
    const symEl = document.getElementById('zoneLoaderSymbol');
    const fillEl = document.getElementById('zoneLoaderFill');
    const statEl = document.getElementById('zoneLoaderStatus');
    const spinEl = document.getElementById('zoneLoaderSpinner');

    if (!screen) {
      if (onHalfway) onHalfway();
      if (onComplete) onComplete();
      return;
    }

    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.color = accent;
    }
    if (subEl) subEl.textContent = subtitle;
    if (symEl) symEl.textContent = symbol;
    if (spinEl) spinEl.style.borderColor = accent;
    if (fillEl) fillEl.style.background = `linear-gradient(90deg, ${accent}, #38bdf8)`;

    screen.classList.remove('hidden');

    let startTime = performance.now();
    let halfwayTriggered = false;
    let isTransitionDone = false;

    const finishTransition = () => {
      if (isTransitionDone) return;
      isTransitionDone = true;
      if (!halfwayTriggered) {
        halfwayTriggered = true;
        if (typeof onHalfway === 'function') onHalfway();
      }
      if (screen) screen.classList.add('hidden');
      if (typeof onComplete === 'function') onComplete();
    };

    // Hard failsafe timeout agar transisi zone loading screen tidak pernah stuck
    const safeTimer = setTimeout(finishTransition, duration + 400);

    const animateProgress = () => {
      if (isTransitionDone) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const pct = Math.round(progress * 100);

      if (fillEl) fillEl.style.width = `${pct}%`;
      if (statEl) statEl.textContent = `MEMUAT... ${pct}%`;

      if (progress >= 0.5 && !halfwayTriggered) {
        halfwayTriggered = true;
        if (typeof onHalfway === 'function') onHalfway();
      }

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        clearTimeout(safeTimer);
        setTimeout(finishTransition, 150);
      }
    };

    requestAnimationFrame(animateProgress);
  }

  // Keluar kembali ke Dunia 3D dengan transisi loading mulus
  exitToWorld() {
    this.showZoneLoadingScreen({
      title: 'KEMBALI KE DUNIA 3D',
      subtitle: 'Menyimpan progres petualangan & memuat kembali alun-alun...',
      symbol: '🗺️',
      accent: '#38bdf8',
      duration: 1000,
      onComplete: () => {
        if (document.exitPointerLock) document.exitPointerLock();
        window.location.href = '../main.html?from=camp';
      }
    });
  }

  // Switch cleanly between Safe Zone & Sector-7 Wasteland with Smooth GPU-Rendered Loading
  switchZone(zoneName) {
    this.zoneSwitchCooldown = 3.5;
    sound.playTeleportSound();

    const isSector7 = zoneName === 'sector_7';
    const screen = document.getElementById('zone-loading-screen');
    const titleEl = document.getElementById('zoneLoaderTitle');
    const subEl = document.getElementById('zoneLoaderSubtitle');
    const symEl = document.getElementById('zoneLoaderSymbol');
    const fillEl = document.getElementById('zoneLoaderFill');
    const statEl = document.getElementById('zoneLoaderStatus');
    const spinEl = document.getElementById('zoneLoaderSpinner');

    const accent = isSector7 ? '#ef4444' : '#00e5ff';
    if (titleEl) {
      titleEl.textContent = isSector7 ? 'MEMASUKI SECTOR-7 (ZONA ZOMBIE)' : 'EVAKUASI KE DESA ASRI (SAFE ZONE)';
      titleEl.style.color = accent;
    }
    if (subEl) {
      subEl.textContent = isSector7
        ? 'PERINGATAN: Memuat mutan zombie & kompilasi shader Sector-7...'
        : 'Evakuasi Berhasil! Menyimpan jarahan & memuat Desa Asri...';
    }
    if (symEl) symEl.textContent = isSector7 ? '☣️' : '🛡️';
    if (spinEl) spinEl.style.borderColor = accent;
    if (fillEl) {
      fillEl.style.background = `linear-gradient(90deg, ${accent}, #38bdf8)`;
      fillEl.style.width = '30%';
    }
    if (statEl) statEl.textContent = 'MEMPERSIAPKAN ZONA... 30%';

    if (screen) screen.classList.remove('hidden');

    let isSwitchDone = false;
    const finishZoneSwitch = () => {
      if (isSwitchDone) return;
      isSwitchDone = true;

      if (fillEl) fillEl.style.width = '100%';
      if (statEl) statEl.textContent = 'ZONA SELESAI DIRENDER! 100%';

      setTimeout(() => {
        if (screen) screen.classList.add('hidden');
        this.currentState = this.STATES.PLAYING;
        this.ui.showScreen('playing');

        if (zoneName === 'safe_zone') {
          this.ui.showAnnouncement('DESA ASRI (SAFE ZONE)', 'Persiapkan perlengkapan di Rumah & Toko Desa', 3.0);
        } else {
          this.ui.showAnnouncement(
            'KOTA APOKALIPTIK (SECTOR-7)',
            'PERINGATAN: Kematian akan menghilangkan isi tas! Jarah peti pasokan & evakuasi via Menara Pusat Kota!',
            4.0
          );
        }

        if (!this.player.isTouchMode) {
          this.player.requestPointerLock();
        }
      }, 150);
    };

    // Hard failsafe timer (2.2s): switchZone tidak akan pernah stuck
    const switchFailsafeTimer = setTimeout(finishZoneSwitch, 2200);

    setTimeout(() => {
      this.environment.setZoneActive(zoneName, this.player);
      GameState.activeZone = zoneName;

      // Reset input & kecepatan pemain agar responsif seketika
      this.player.velocity.set(0, 0, 0);
      this.player.moveForward = false;
      this.player.moveBackward = false;
      this.player.moveLeft = false;
      this.player.moveRight = false;
      this.player.isInputEnabled = true;

      if (zoneName === 'safe_zone') {
        this.weaponManager.setHolstered(false);
        this.zombiesManager.clearAll();
        this.lootManager.clearDrops();
      } else {
        this.weaponManager.setHolstered(false);
        this.waveManager.startWave(1);

        if (this.environment.currentBeaconSite) {
          setTimeout(() => {
            this.ui.showAnnouncement(
              "📡 SUAR EVAKUASI TERDETEKSI",
              `Lokasi Suar: ${this.environment.currentBeaconSite.name}. Cari pilar cahaya cyan menuju pusat kota!`,
              5.0
            );
          }, 1800);
        }
      }

      this.ui.updateHUD();

      if (fillEl) fillEl.style.width = '70%';
      if (statEl) statEl.textContent = 'KOMPILASI SHADER GPU... 70%';

      // Kompilasi shader untuk zona baru
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch (e) {}

      // Pre-render 3 frame di balik layar loading agar seluruh geometri dan tekstur ter-render
      let warmFrames = 0;
      const warmUpZone = () => {
        if (isSwitchDone) return;
        try {
          this.renderer.render(this.scene, this.camera);
        } catch (e) {}
        warmFrames++;
        if (warmFrames < 3) {
          requestAnimationFrame(warmUpZone);
        } else {
          clearTimeout(switchFailsafeTimer);
          finishZoneSwitch();
        }
      };
      requestAnimationFrame(warmUpZone);
    }, 150);
  }

  pauseGame() {
    if (this.currentState !== this.STATES.PLAYING) return;
    this.currentState = this.STATES.PAUSED;
    this.ui.showScreen('paused');
    this.player.exitPointerLock();
  }

  resumeGame() {
    if (this.currentState !== this.STATES.PAUSED) return;
    this.currentState = this.STATES.PLAYING;
    this.ui.showScreen('playing');
    if (!this.player.isTouchMode) {
      this.player.requestPointerLock();
    }
  }

  toggleSettingsModal() {
    const modalSettings = document.getElementById('modal-settings');
    if (!modalSettings) return;
    const isHidden = modalSettings.classList.contains('hidden');
    if (isHidden) {
      if (this.shopManager && this.shopManager.modalActive) {
        this.shopManager.closeAllModals();
      }
      this.ui.showModal('settings', true);
      if (this.player && !this.player.isTouchMode) {
        this.player.exitPointerLock();
      }
    } else {
      this.ui.showModal('settings', false);
      if (this.currentState === this.STATES.PLAYING && this.player && !this.player.isTouchMode) {
        this.player.requestPointerLock();
      }
    }
  }

  restartGame() {
    this.startGame();
  }

  // =========================================================================
  // TIMED HOLDOUT EXTRACTION SYSTEM (12s Survival Wave within 14m Radius)
  // =========================================================================
  startHoldoutExtraction() {
    if (this.isHoldoutActive || GameState.activeZone !== 'sector_7') return;

    this.isHoldoutActive = true;
    this.holdoutTimer = 12.0;
    this.holdoutWaveSpawned = false;

    sound.playExtractionSiren();

    // Spawn 3 Runner zombi agresif di sekitar suar
    if (this.zombiesManager && this.environment.currentBeaconSite) {
      const bs = this.environment.currentBeaconSite;
      for (let i = 0; i < 3; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 16 + Math.random() * 8;
        this.zombiesManager.spawnZombie({
          type: 'runner',
          hp: 55,
          speed: 4.1,
          damage: 10,
          scale: 0.9,
          x: bs.x + Math.cos(ang) * dist,
          z: bs.z + Math.sin(ang) * dist
        });
      }
    }

    this.ui.showAnnouncement(
      "🚨 SINYAL EVAKUASI DIAKTIFKAN!",
      "Sirine memancing mutan! Bertahanlah dalam radius 14m dari Suar selama 12 detik!",
      4.0
    );
    this.ui.showHoldoutBanner(true, 12.0);
  }

  cancelHoldoutExtraction(reason = "Meninggalkan radius suar evakuasi!") {
    if (!this.isHoldoutActive) return;
    this.isHoldoutActive = false;
    this.holdoutTimer = 0;
    sound.stopExtractionSiren();
    this.ui.showHoldoutBanner(false);
    this.ui.showAnnouncement("❌ EVAKUASI DIBATALKAN!", reason, 3.5);
  }

  finishHoldoutExtraction() {
    this.isHoldoutActive = false;
    this.holdoutTimer = 0;
    sound.stopExtractionSiren();
    sound.playExtractionSuccess();
    this.ui.showHoldoutBanner(false);
    this.ui.showAnnouncement(
      "🚁 EVAKUASI BERHASIL!",
      "Anda berhasil bertahan hidup dan dievakuasi kembali ke Desa Asri!",
      4.0
    );
    this.switchZone('safe_zone');
  }

  // HIGH-STAKES DEATH PENALTY
  onPlayerDeath() {
    GameState.recordPlayerDeath();

    if (this.isHoldoutActive) {
      this.cancelHoldoutExtraction('Pemain gugur saat bertahan evakuasi!');
    }

    sound.playGameOver();

    if (GameState.activeZone === 'sector_7') {
      // 1. Purge all unextracted items in expedition backpack
      const lostItems = GameState.clearBackpackOnDeath();
      const lostSummary = lostItems.length > 0 ? `${lostItems.length} item jarahan hangus` : 'Tidak ada jarahan yang hilang';

      // 2. Respawn inside Safehouse Hab Pod with full health
      this.player.health = this.player.maxHealth;
      this.player.isDead = false;
      this.environment.setZoneActive('safe_zone', this.player);
      GameState.activeZone = 'safe_zone';
      this.weaponManager.setHolstered(false);
      this.zombiesManager.clearAll();
      this.lootManager.clearDrops();

      this.ui.updateHealth(this.player.health, this.player.maxHealth);
      this.ui.updateHUD();

      // Show red alert banner
      this.ui.showAnnouncement(
        'EKSPEDISI GAGAL — ANDA GUGUR!',
        `${lostSummary}. Seluruh barang di Peti Kayu Stash rumah desa tetap aman!`,
        4.5
      );
    } else {
      // Died in safe zone (unlikely) -> respawn at village house
      this.player.reset();
      this.environment.setZoneActive('safe_zone', this.player);
      this.ui.updateHealth(this.player.health, this.player.maxHealth);
      this.ui.updateHUD();
    }
  }

  onVictory() {
    if (this.waveManager) {
      GameState.recordWaveSurvived(this.waveManager.currentWave);
    }
    this.ui.showAnnouncement('SECTOR-7 TELAH DIBERSIHKAN!', 'Menuju Menara Evakuasi di pusat kota untuk membawa semua jarahan pulang!', 4.0);
  }

  // Game Loop
  animate() {
    requestAnimationFrame(this.animate);

    let delta = this.clock.getDelta();
    delta = Math.min(delta, this.maxDelta);

    // Update real-time survival playtime & simulated dynamic marketplace
    GameState.updatePlaytime(delta);
    GameState.updateMarketplace(delta);

    if (this.environment) {
      this.environment.update(delta, this.player);
    }

    if (this.currentState === this.STATES.PLAYING) {
      this.player.update(delta);
      this.weaponManager.update(delta);

      // Timed Holdout Extraction Countdown & Boundary Verification
      if (this.isHoldoutActive && GameState.activeZone === 'sector_7' && this.environment.currentBeaconSite) {
        const bSite = this.environment.currentBeaconSite;
        const pPos = this.player.yawObject.position;
        const distToBeacon = Math.hypot(pPos.x - bSite.x, pPos.z - bSite.z);

        if (distToBeacon > 14.0) {
          this.cancelHoldoutExtraction("Anda keluar terlalu jauh dari perimeter suar (>14m)!");
        } else {
          this.holdoutTimer -= delta;
          this.ui.updateHoldoutCountdown(this.holdoutTimer, distToBeacon);

          // Gelombang bala bantuan Runner saat sisa waktu 6 detik
          if (this.holdoutTimer <= 6.0 && !this.holdoutWaveSpawned) {
            this.holdoutWaveSpawned = true;
            if (this.zombiesManager) {
              for (let i = 0; i < 2; i++) {
                const ang = Math.random() * Math.PI * 2;
                this.zombiesManager.spawnZombie({
                  type: 'runner',
                  hp: 55,
                  speed: 4.2,
                  x: bSite.x + Math.cos(ang) * 18,
                  z: bSite.z + Math.sin(ang) * 18
                });
              }
            }
            this.ui.showAnnouncement("⚠️ GELOMBANG RUNNER!", "Mutan menyerbu suar! Tetap bertahan!", 2.5);
          }

          if (this.holdoutTimer <= 0) {
            this.finishHoldoutExtraction();
          }
        }
      }

      // Otomatis pindah zona jika pemain melangkah masuk portal fisik (selain tombol [E])
      if (this.zoneSwitchCooldown > 0) {
        this.zoneSwitchCooldown -= delta;
      } else {
        const pPos = this.player.yawObject.position;
        if (GameState.activeZone === 'safe_zone' && pPos.z >= 34.5 && Math.abs(pPos.x) < 3.5) {
          this.switchZone('sector_7');
        } else if (GameState.activeZone === 'sector_7' && this.environment.currentBeaconSite) {
          const bSite = this.environment.currentBeaconSite;
          if (Math.hypot(pPos.x - bSite.x, pPos.z - bSite.z) <= 3.2 && !this.isHoldoutActive) {
            this.startHoldoutExtraction();
          }
        }
      }

      // Check proximity to interactive points (Shops, Stash, Air-Lock, Beacon, Crates)
      if (this.shopManager) {
        this.shopManager.checkProximity(this.player.yawObject.position, this.environment.getInteractables());
      }

      // Mutants and loot updates active in Sector-7
      if (GameState.activeZone === 'sector_7') {
        this.zombiesManager.update(delta);
        this.waveManager.update(delta);
        this.lootManager.update(delta, this.player.yawObject.position, this.ui);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.GameState = GameState;
  window.deadZoneGame = new DeadZoneGame();
  window.game = window.deadZoneGame;
});
