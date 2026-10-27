// ============================================================================
// DEAD ZONE — MAIN ENTRY POINT & GAME LOOP ENGINE
// Initializes Three.js WebGL, sets up lighting & fog, orchestrates player,
// weapons, zombies, waves, and UI through a single robust game loop.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';
import { Environment } from './environment.js';
import { Player } from './player.js';
import { WeaponManager } from './weapons.js';
import { ZombiesManager } from './zombies.js';
import { WaveManager } from './waves.js';
import { UIManager } from './ui.js';
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
    this.maxDelta = 0.1; // Delta time clamp to prevent jumping after tab freeze

    // UI Manager
    this.ui = new UIManager();

    // Check WebGL availability before proceeding
    if (!this.checkWebGLSupport()) {
      this.ui.showWebGLError("WebGL is not supported by your browser or graphics hardware. Please enable hardware acceleration.");
      return;
    }

    try {
      this.initThree();
      this.initSubsystems();
      this.initUI();
      this.attachGlobalEvents();

      // Start the single global game loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);

      console.log("DEAD ZONE initialized successfully.");
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
    // 1. Scene & Atmospheric Fog (Brightened for clear visibility)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x161a26);
    this.scene.fog = new THREE.FogExp2(0x161a26, 0.011); // Much clearer fog, visible up to 90m

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    // 3. Renderer with shadows and correct color space
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Enhanced Night & Moonlight Lighting
    // Ambient light - brightens all shadows and building walls
    const ambientLight = new THREE.AmbientLight(0x506075, 1.3);
    this.scene.add(ambientLight);

    // Hemisphere light - natural sky & ground ambient bounce
    const hemiLight = new THREE.HemisphereLight(0x88aacc, 0x2d3748, 0.75);
    this.scene.add(hemiLight);

    // Moonlight / Directional light casting crisp shadows
    this.moonLight = new THREE.DirectionalLight(0xaaccff, 1.4);
    this.moonLight.position.set(30, 60, 20);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 150;
    this.moonLight.shadow.camera.left = -45;
    this.moonLight.shadow.camera.right = 45;
    this.moonLight.shadow.camera.top = 45;
    this.moonLight.shadow.camera.bottom = -45;
    this.scene.add(this.moonLight);
  }

  initSubsystems() {
    // 1. City Environment & Colliders
    this.environment = new Environment(this.scene);

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

    // 3. Waves System
    this.waveManager = new WaveManager(
      null, // will link below
      this.environment,
      this.player,
      this.ui,
      // On Victory callback
      () => {
        this.onVictory();
      }
    );

    // 4. Zombies System
    this.zombiesManager = new ZombiesManager(
      this.scene,
      this.environment,
      this.player,
      () => this.waveManager.onZombieKilled()
    );
    this.waveManager.zombiesManager = this.zombiesManager;

    // 5. Weapons System
    this.weaponManager = new WeaponManager(
      this.camera,
      this.player.pitchObject,
      this.zombiesManager,
      this.ui,
      this.environment
    );
    this.waveManager.weaponManager = this.weaponManager;

    // 6. Touch Controls & Device Mode Switcher (Laptop vs HP)
    this.touchControls = new TouchControls(this.player, this.weaponManager);
  }

  initUI() {
    this.ui.init({
      onStartGame: () => this.startGame(),
      onResumeGame: () => this.resumeGame(),
      onRestartGame: () => this.restartGame(),
      onSensitivityChange: (val) => {
        if (this.player) this.player.mouseSensitivity = val;
      }
    });

    this.ui.showScreen('menu');
  }

  attachGlobalEvents() {
    // Resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Pointer Lock change listener to handle Escape or browser release
    document.addEventListener('pointerlockchange', () => {
      if (!this.player.isTouchMode && document.pointerLockElement !== this.renderer.domElement) {
        // If in game and pointer was unlocked by user pressing Esc
        if (this.currentState === this.STATES.PLAYING) {
          this.pauseGame();
        }
      }
    });

    // Keyboard shortcut for Escape key
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
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

    this.ui.updateHealth(this.player.health, this.player.maxHealth);
    this.ui.updateAmmo(this.weaponManager.ammoInMag, this.weaponManager.reserveAmmo);

    // Request pointer lock only in Laptop mode
    if (!this.player.isTouchMode) {
      this.player.requestPointerLock();
    }

    // Start wave 1
    this.waveManager.startWave(1);
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

  onPlayerDeath() {
    this.currentState = this.STATES.GAMEOVER;
    this.player.exitPointerLock();
    sound.playGameOver();

    const accuracy = this.weaponManager.getAccuracy();
    this.ui.showGameOver(
      this.waveManager.currentWave,
      this.waveManager.totalKills,
      this.weaponManager.totalShots,
      accuracy
    );
  }

  onVictory() {
    this.currentState = this.STATES.VICTORY;
    this.player.exitPointerLock();

    const accuracy = this.weaponManager.getAccuracy();
    this.ui.showVictory(
      this.waveManager.totalKills,
      this.weaponManager.totalShots,
      this.weaponManager.totalHeadshots,
      accuracy
    );
  }

  // Single game loop driven by requestAnimationFrame
  animate() {
    requestAnimationFrame(this.animate);

    // Calculate delta time and clamp it to avoid physics explosions after tab inactivity
    let delta = this.clock.getDelta();
    delta = Math.min(delta, this.maxDelta);

    // Update scene animations that run at all times (like flickering streetlights)
    if (this.environment) {
      this.environment.update(delta);
    }

    // Only update gameplay simulation when in PLAYING state
    if (this.currentState === this.STATES.PLAYING) {
      this.player.update(delta);
      this.weaponManager.update(delta);
      this.zombiesManager.update(delta);
      this.waveManager.update(delta);
    }

    // Always render current frame
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.deadZoneGame = new DeadZoneGame();
});
