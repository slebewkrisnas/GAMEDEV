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

      console.log("Sci-Fi FPS Survival & Economic Ecosystem initialized.");
    } catch (err) {
      console.error("Game initialization error:", err);
      this.ui.showWebGLError("Initialization Error: " + err.message);
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
      this.environment
    );
    this.waveManager.weaponManager = this.weaponManager;
    this.player.weapons = this.weaponManager;

    // 7. Touch Controls & Device Mode Switcher
    this.touchControls = new TouchControls(this.player, this.weaponManager);

    // 8. Shop & Kiosk Interaction Manager
    this.shopManager = new ShopManager(this.ui);
    this.ui.player = this.player;
    this.player.onInteractCallback = () => this.shopManager.interact();

    // Start in Safe Zone with weapons holstered
    this.environment.setZoneActive('safe_zone', this.player);
    GameState.activeZone = 'safe_zone';
    this.weaponManager.setHolstered(true);
  }

  initUI() {
    this.ui.init({
      onStartGame: () => this.startGame(),
      onResumeGame: () => this.resumeGame(),
      onRestartGame: () => this.restartGame(),
      onSwitchZone: (zoneName) => this.switchZone(zoneName),
      onLootCrate: (crateId) => this.lootManager.lootCrate(crateId, this.ui),
      onUseStim: () => this.player.useNanoStim(this.ui),
      onInteract: () => this.shopManager.interact(),
      onSensitivityChange: (val) => {
        if (this.player) this.player.mouseSensitivity = val;
      }
    });

    this.ui.showScreen('menu');
  }

  attachGlobalEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Re-lock pointer on canvas click at any time during gameplay
    this.renderer.domElement.addEventListener('click', () => {
      if (this.currentState === this.STATES.PLAYING && !this.shopManager.modalActive && !this.player.isTouchMode) {
        this.player.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (!this.player.isTouchMode && document.pointerLockElement !== this.renderer.domElement) {
        if (this.currentState === this.STATES.PLAYING && !this.shopManager.modalActive) {
          this.pauseGame();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
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
    this.currentState = this.STATES.PLAYING;
    this.ui.showScreen('playing');

    this.player.reset();
    this.weaponManager.reset();
    this.zombiesManager.clearAll();
    this.waveManager.reset();

    // Spawn at Safehouse in Safe Zone
    this.environment.setZoneActive('safe_zone', this.player);
    GameState.activeZone = 'safe_zone';
    this.weaponManager.setHolstered(true);

    this.ui.updateHealth(this.player.health, this.player.maxHealth);
    this.ui.updateAmmo(this.weaponManager.ammoInMag, this.weaponManager.reserveAmmo);
    this.ui.updateHUD();

    if (!this.player.isTouchMode) {
      this.player.requestPointerLock();
    }

    this.ui.showAnnouncement('DESA ASRI (SAFE ZONE)', 'Persiapkan perlengkapan di Rumah, Pande Besi, & Tabib', 3.0);
  }

  // Switch cleanly between Safe Zone & Sector-7 Wasteland
  switchZone(zoneName) {
    this.zoneSwitchCooldown = 2.5;
    sound.playTeleportSound();
    this.currentState = this.STATES.PLAYING;
    this.ui.showScreen('playing');

    this.environment.setZoneActive(zoneName, this.player);
    GameState.activeZone = zoneName;

    // Reset player velocity and input states to ensure immediate smooth WASD response
    this.player.velocity.set(0, 0, 0);
    this.player.moveForward = false;
    this.player.moveBackward = false;
    this.player.moveLeft = false;
    this.player.moveRight = false;
    this.player.isInputEnabled = true;

    if (zoneName === 'safe_zone') {
      this.weaponManager.setHolstered(true);
      this.zombiesManager.clearAll();
      this.lootManager.clearDrops();
      this.ui.showAnnouncement('KEMBALI KE DESA ASRI', 'Evakuasi Sukses! Semua jarahan tersimpan aman di desa.', 3.0);
    } else {
      // sector_7 (Blackwood Forest)
      this.weaponManager.setHolstered(false);
      this.ui.showAnnouncement(
        'HUTAN TERBENGKALAI (SECTOR-7)',
        'PERINGATAN: Kematian akan menghilangkan isi tas! Cari pondok terbengkalai untuk looting!',
        4.0
      );
      this.waveManager.startWave(1);
    }

    this.ui.updateHUD();

    if (!this.player.isTouchMode) {
      this.player.requestPointerLock();
    }
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

  restartGame() {
    this.startGame();
  }

  // HIGH-STAKES DEATH PENALTY
  onPlayerDeath() {
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
      this.weaponManager.setHolstered(true);
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
    this.ui.showAnnouncement('HUTAN TELAH DIBERSIHKAN!', 'Kembali ke Suar Evakuasi untuk membawa semua jarahan pulang ke Desa Asri!', 4.0);
  }

  // Game Loop
  animate() {
    requestAnimationFrame(this.animate);

    let delta = this.clock.getDelta();
    delta = Math.min(delta, this.maxDelta);

    if (this.environment) {
      this.environment.update(delta);
    }

    if (this.currentState === this.STATES.PLAYING) {
      this.player.update(delta);
      this.weaponManager.update(delta);

      // Otomatis pindah zona jika pemain melangkah masuk portal fisik (selain tombol [E])
      if (this.zoneSwitchCooldown > 0) {
        this.zoneSwitchCooldown -= delta;
      } else {
        const pPos = this.player.yawObject.position;
        if (GameState.activeZone === 'safe_zone' && pPos.z >= 34.5 && Math.abs(pPos.x) < 3.5) {
          this.switchZone('sector_7');
        } else if (GameState.activeZone === 'sector_7' && pPos.z <= -90.5 && Math.abs(pPos.x) < 3.2) {
          this.switchZone('safe_zone');
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
