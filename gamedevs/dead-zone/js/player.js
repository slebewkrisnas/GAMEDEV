// ============================================================================
// DEAD ZONE — FIRST-PERSON PLAYER CONTROLLER & HEALTH
// Implements smooth WASD movement relative to camera yaw, mouse look,
// sprint, sliding collision physics, health management, and pointer lock.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';
import { GameState } from './gameState.js';

export class Player {
  constructor(camera, domElement, environment, onDamageCallback, onDeathCallback) {
    this.camera = camera;
    this.domElement = domElement;
    this.environment = environment;
    this.onDamageCallback = onDamageCallback;
    this.onDeathCallback = onDeathCallback;
    this.onInteractCallback = null;

    // Player Hierarchy:
    // yawObject (controls horizontal rotation & position at eye height)
    //  └── pitchObject (controls vertical pitch & holds camera and weapon)
    this.yawObject = new THREE.Group();
    this.pitchObject = new THREE.Group();
    this.yawObject.position.set(0, 1.7, -6); // Eye level in front of Safehouse
    this.yawObject.add(this.pitchObject);
    this.pitchObject.add(this.camera);

    // Tactical Flashlight (illuminates path ahead)
    this.flashlight = new THREE.SpotLight(0xffffff, 2.8, 50, Math.PI / 5, 0.4, 1.2);
    this.flashlight.position.set(0.15, -0.1, 0.1);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -10);
    this.pitchObject.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.pitchObject.add(this.flashlight);
    this.flashlightEnabled = true;

    // Movement speeds (meters per second)
    // Kecepatan jalan disesuaikan ke 4.2 m/s agar zombie Runner (3.9 m/s) tetap mengancam
    this.walkSpeed = 4.2;
    this.sprintSpeed = 7.8;
    this.radius = 0.5; // Collision radius

    // Stamina System (Maksimal 5 Detik Sprint)
    this.maxStamina = 5.0;
    this.stamina = 5.0;
    this.staminaDrain = 1.0; // Habis dalam 5 detik sprint penuh
    this.staminaRegen = 1.25; // Pulih penuh dalam ~4 detik saat istirahat/jalan santai
    this.isExhausted = false; // Terkunci sprint jika stamina terkuras habis hingga 0

    // Vertical physics & Jump mechanics
    this.eyeHeight = 1.7; // Standard camera eye height on ground
    this.isGrounded = true;
    this.velocityY = 0;
    this.gravity = 22.0; // Snappy responsive FPS gravity
    this.jumpForce = 7.8; // Gives ~1.4m vertical clearance to leap over barricades

    // Health attributes
    this.maxHealth = 100;
    this.health = 100;
    this.isDead = false;
    this.damageCooldown = 0.45; // Minimum time between consecutive damage instances
    this.damageTimer = 0;

    // Movement state inputs
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;

    // Velocity & friction
    this.velocity = new THREE.Vector3();

    // Mouse look configuration
    this.mouseSensitivity = 0.0022;
    this.pitchLimit = Math.PI / 2 - 0.05; // ~87 degrees clamp

    // Pointer lock state
    this.isPointerLocked = false;
    this.isInputEnabled = true;

    // Head bobbing and camera shake
    this.bobTimer = 0;
    this.cameraShakeIntensity = 0;

    // Bind event handlers
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnPointerLockChange = this.onPointerLockChange.bind(this);
    this.boundOnPointerLockError = this.onPointerLockError.bind(this);

    this.attachEventListeners();
  }

  attachEventListeners() {
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
    document.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('pointerlockchange', this.boundOnPointerLockChange);
    document.addEventListener('pointerlockerror', this.boundOnPointerLockError);
  }

  destroy() {
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    document.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('pointerlockchange', this.boundOnPointerLockChange);
    document.removeEventListener('pointerlockerror', this.boundOnPointerLockError);
  }

  requestPointerLock() {
    if (this.isDead) return;
    try {
      const p = this.domElement.requestPointerLock();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch (e) {
      // Ignore user gesture timing mismatches
    }
  }

  exitPointerLock() {
    try {
      if (document.pointerLockElement === this.domElement) {
        document.exitPointerLock();
      }
    } catch (e) {
      console.warn("Exit pointer lock error:", e);
    }
  }

  onPointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);
  }

  onPointerLockError() {
    console.warn("Pointer Lock Error encountered.");
  }

  onKeyDown(e) {
    if (!this.isInputEnabled || this.isDead) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (!this.isExhausted && this.stamina > 0.4) {
          this.isSprinting = true;
        }
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'KeyI':
        if (this.onToggleInventoryCallback) this.onToggleInventoryCallback();
        break;
      case 'Tab':
        e.preventDefault();
        if (this.onToggleInventoryCallback) this.onToggleInventoryCallback();
        break;
      case 'KeyM':
        if (this.onToggleMarketplaceCallback) this.onToggleMarketplaceCallback();
        break;
      case 'KeyP':
        if (this.onToggleProfileCallback) this.onToggleProfileCallback();
        break;
      case 'Escape':
        if (this.onEscapeCallback) this.onEscapeCallback();
        break;
      case 'KeyE':
        if (this.onInteractCallback) this.onInteractCallback();
        break;
      case 'KeyQ':
        this.useNanoStim();
        break;
      case 'KeyV':
        // Quick Melee (Golok Pedesaan)
        if (this.weapons) {
          if (this.weapons.currentWeaponId === 'machete') {
            this.weapons.switchWeapon(this.previousFirearmId || 'pulse_pistol');
          } else {
            this.previousFirearmId = this.weapons.currentWeaponId;
            this.weapons.switchWeapon('machete');
          }
        }
        break;
      case 'KeyT':
        // Deploy Ranjau Paku Bambu
        this.deployBambooTrap();
        break;
      case 'Digit1':
      case 'Numpad1':
        this.selectSlot(1);
        break;
      case 'Digit2':
      case 'Numpad2':
        this.selectSlot(2);
        break;
      case 'Digit3':
      case 'Numpad3':
        this.selectSlot(3);
        break;
      case 'Digit4':
      case 'Numpad4':
        this.selectSlot(4);
        break;
      case 'Digit5':
      case 'Numpad5':
        this.selectSlot(5);
        break;
      case 'Digit6':
      case 'Numpad6':
        this.selectSlot(6);
        break;
      case 'Digit7':
      case 'Numpad7':
        this.selectSlot(7);
        break;
      case 'Space':
        e.preventDefault();
        this.jump();
        break;
    }
  }

  selectSlot(slot) {
    if (this.isDead) return;
    switch (slot) {
      case 1:
        if (this.weapons) this.weapons.switchWeapon('pulse_pistol');
        break;
      case 2:
        if (this.weapons) this.weapons.switchWeapon('scatter_blaster');
        break;
      case 3:
        if (this.weapons) this.weapons.switchWeapon('plasma_rifle');
        break;
      case 4:
        if (this.weapons) this.weapons.switchWeapon('machete');
        break;
      case 5:
        this.useNanoStim(this.ui);
        break;
      case 6:
        this.deployBambooTrap();
        break;
      case 7:
        this.toggleFlashlight();
        break;
    }
  }

  jump() {
    if (!this.isGrounded || this.isDead) return;
    if (!this.isPointerLocked && !this.isTouchMode) return;
    this.velocityY = this.jumpForce;
    this.isGrounded = false;
    sound.playJump();
  }

  setJoystick(x, z) {
    this.joyX = x;
    this.joyZ = z;
  }

  setTouchLook(dx, dy) {
    this.yawObject.rotation.y -= dx * this.mouseSensitivity * 1.8;
    this.pitchObject.rotation.x -= dy * this.mouseSensitivity * 1.8;
    this.pitchObject.rotation.x = Math.max(
      -this.pitchLimit,
      Math.min(this.pitchLimit, this.pitchObject.rotation.x)
    );
  }

  toggleFlashlight() {
    this.flashlightEnabled = !this.flashlightEnabled;
    this.flashlight.visible = this.flashlightEnabled;
    const btnFlash = document.getElementById('btn-mobile-flashlight');
    if (btnFlash) btnFlash.classList.toggle('active', this.flashlightEnabled);
    if (this.ui) {
      this.ui.updateQuickSelectBar(this.weapons?.currentWeaponId, this.weapons?.weaponData);
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked || !this.isInputEnabled || this.isDead) return;

    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    // Horizontal rotation (Yaw) rotates the whole player body around Y axis
    this.yawObject.rotation.y -= movementX * this.mouseSensitivity;

    // Vertical rotation (Pitch) rotates camera pitch around X axis
    this.pitchObject.rotation.x -= movementY * this.mouseSensitivity;
    this.pitchObject.rotation.x = Math.max(
      -this.pitchLimit,
      Math.min(this.pitchLimit, this.pitchObject.rotation.x)
    );
  }

  // Take damage from zombie attacks
  takeDamage(amount) {
    if (this.isDead || this.damageTimer > 0) return;

    this.health = Math.max(0, this.health - amount);
    this.damageTimer = this.damageCooldown;
    this.cameraShakeIntensity = 0.12;

    sound.playPlayerHurt();

    if (this.onDamageCallback) {
      this.onDamageCallback(this.health, this.maxHealth);
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
    }
  }

  // Update player physics, collisions, and camera effects
  update(delta) {
    if (this.isDead) return;

    // Update damage cooldown timer
    if (this.damageTimer > 0) {
      this.damageTimer -= delta;
    }

    // Camera shake decay
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 0.4);
      this.camera.position.x = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y = (Math.random() - 0.5) * this.cameraShakeIntensity;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 0;
    }

    // Determine current speed and update Stamina system
    let currentSpeed = this.walkSpeed;
    const isMovingInput = (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight || !!this.joyX || !!this.joyZ);

    if (this.isSprinting && isMovingInput && !this.isExhausted) {
      // Konsumsi Stamina saat sprint aktif (5 detik total)
      this.stamina = Math.max(0, this.stamina - delta * this.staminaDrain);
      currentSpeed = this.sprintSpeed;
      if (this.stamina <= 0.01) {
        this.stamina = 0;
        this.isSprinting = false;
        this.isExhausted = true; // Kehabisan nafas
      }
    } else {
      // Pulihkan Stamina saat jalan santai atau diam (2x lipat lebih cepat dengan Jamu Beras Kencur)
      this.isSprinting = false;
      const regenRate = (GameState.hasBuff && GameState.hasBuff('stamina_boost'))
        ? (this.staminaRegen * 2.0)
        : this.staminaRegen;
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * regenRate);
      if (this.stamina >= 1.2) {
        this.isExhausted = false; // Pulih dari lelah
      }
    }

    // Update active buffs duration
    if (GameState.updateBuffs) {
      GameState.updateBuffs(delta);
    }

    // Detak jantung low-HP audio saat sekarat (HP <= 25)
    if (this.health <= 25 && !this.isDead) {
      this.heartbeatTimer = (this.heartbeatTimer || 0) + delta;
      if (this.heartbeatTimer >= 1.05) {
        this.heartbeatTimer = 0;
        sound.playHeartbeat();
      }
    } else {
      this.heartbeatTimer = 0;
    }

    // Beritahukan UI perubahan stamina
    if (this.ui && typeof this.ui.updateStamina === 'function') {
      this.ui.updateStamina(this.stamina, this.maxStamina, this.isExhausted);
    }

    // Calculate local input movement vector
    let inputX = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
    let inputZ = (this.moveForward ? 1 : 0) - (this.moveBackward ? 1 : 0);

    if (this.joyX || this.joyZ) {
      inputX += (this.joyX || 0);
      inputZ += (this.joyZ || 0);
    }

    const isMoving = (inputX !== 0 || inputZ !== 0);

    if (isMoving) {
      // Normalize input so diagonal moving is not faster
      const length = Math.hypot(inputX, inputZ);
      const normX = inputX / length;
      const normZ = inputZ / length;

      // Transform local movement direction by Player Yaw
      // Note: Forward in Three.js is -Z
      const yaw = this.yawObject.rotation.y;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);

      // Exact world velocity:
      // Forward vector in world is (-sin(yaw), -cos(yaw))
      // Right vector in world is (cos(yaw), -sin(yaw))
      const moveWorldX = (normX * cos - normZ * sin) * currentSpeed;
      const moveWorldZ = (-normX * sin - normZ * cos) * currentSpeed;

      // Smooth acceleration
      this.velocity.x += (moveWorldX - this.velocity.x) * Math.min(1, delta * 12);
      this.velocity.z += (moveWorldZ - this.velocity.z) * Math.min(1, delta * 12);

      // Head bobbing effect only when on the ground
      if (this.isGrounded) {
        const prevBob = Math.sin(this.bobTimer);
        this.bobTimer += delta * (this.isSprinting ? 14 : 9);
        const curBob = Math.sin(this.bobTimer);
        this.pitchObject.position.y = curBob * 0.04;

        // Suara langkah kaki natural saat puncak hentakan kaki menyentuh tanah
        if (curBob < -0.80 && prevBob >= -0.80) {
          sound.playFootstep(this.isSprinting);
        }
      } else {
        this.pitchObject.position.y += (0 - this.pitchObject.position.y) * Math.min(1, delta * 10);
      }
    } else {
      // Decelerate smoothly to stop
      this.velocity.x += (0 - this.velocity.x) * Math.min(1, delta * 14);
      this.velocity.z += (0 - this.velocity.z) * Math.min(1, delta * 14);
      this.pitchObject.position.y += (0 - this.pitchObject.position.y) * Math.min(1, delta * 10);
    }

    const currentPos = this.yawObject.position;

    // =========================================================================
    // VERTICAL JUMP, GRAVITY, & TERRAIN ADAPTATION PHYSICS:
    // Ensures player walks ON TOP of undulating mounds without clipping into dirt
    // =========================================================================
    const groundY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(currentPos.x, currentPos.z)
      : 0;
    const minCameraY = groundY + this.eyeHeight;

    if (!this.isGrounded) {
      this.velocityY -= this.gravity * delta;
      currentPos.y += this.velocityY * delta;

      // Check ground landing
      if (currentPos.y <= minCameraY) {
        currentPos.y = minCameraY;
        this.velocityY = 0;
        if (!this.isGrounded) {
          sound.playLand();
        }
        this.isGrounded = true;
      }
    } else {
      // Smoothly adapt to terrain elevation changes when walking
      if (currentPos.y < minCameraY) {
        // Step up over mounds smoothly
        currentPos.y += (minCameraY - currentPos.y) * Math.min(1, delta * 25);
        if (Math.abs(minCameraY - currentPos.y) < 0.02) currentPos.y = minCameraY;
      } else if (currentPos.y > minCameraY + 0.35) {
        // Walked off high elevation ledge: start free-falling
        this.isGrounded = false;
        this.velocityY = 0;
      } else {
        // Step down gentle slopes
        currentPos.y += (minCameraY - currentPos.y) * Math.min(1, delta * 20);
        if (Math.abs(minCameraY - currentPos.y) < 0.02) currentPos.y = minCameraY;
      }
    }

    const feetY = currentPos.y - this.eyeHeight;

    // =========================================================================
    // SLIDING COLLISION SYSTEM:
    // Move on X and Z independently so the player slides along walls and
    // NEVER gets stuck permanently! Also supports leaping over low barricades.
    // =========================================================================
    const deltaX = this.velocity.x * delta;
    const deltaZ = this.velocity.z * delta;

    // 1. Test X movement
    const testX = currentPos.x + deltaX;
    if (!this.environment.checkCollision(testX, currentPos.z, this.radius, feetY)) {
      currentPos.x = testX;
    } else {
      this.velocity.x = 0; // Hit wall in X, slide along Z
    }

    // 2. Test Z movement
    const testZ = currentPos.z + deltaZ;
    if (!this.environment.checkCollision(currentPos.x, testZ, this.radius, feetY)) {
      currentPos.z = testZ;
    } else {
      this.velocity.z = 0; // Hit wall in Z, slide along X
    }
  }

  // Reset player state to pristine starting conditions
  reset() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.damageTimer = 0;
    this.isGrounded = true;
    this.velocityY = 0;
    this.yawObject.position.set(0, this.eyeHeight, -6);
    this.yawObject.rotation.set(0, 0, 0);
    this.pitchObject.rotation.set(0, 0, 0);
    this.pitchObject.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.stamina = this.maxStamina;
    this.isExhausted = false;
    if (this.ui && typeof this.ui.updateStamina === 'function') {
      this.ui.updateStamina(this.stamina, this.maxStamina, false);
    }
    this.bobTimer = 0;
    this.cameraShakeIntensity = 0;
  }

  // Teleport player to specific coordinates (e.g., zone transitions)
  teleport(x, y, z) {
    const groundY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(x, z)
      : 0;
    const targetY = (y !== undefined && y > groundY + this.eyeHeight) ? y : (groundY + this.eyeHeight);

    this.yawObject.position.set(x, targetY, z);
    this.velocity.set(0, 0, 0);
    this.velocityY = 0;
    this.isGrounded = true;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
  }

  // Use Nano-Stim Potion (Medkit/Jamu) to recover HP
  useNanoStim(uiManager = null) {
    const ui = uiManager || this.ui;
    if (this.isDead) return;
    const stimCount = GameState.countItem('nano_stim', true);
    if (stimCount <= 0) {
      if (ui) ui.showAnnouncement('MEDKIT HABIS', 'Beli Ramuan Jamu di Toko Serba Ada Desa', 2.0);
      return;
    }

    if (this.health >= this.maxHealth) {
      if (ui) ui.showAnnouncement('VITAL PRIMA', 'HP Anda sudah maksimal 100%', 1.5);
      return;
    }

    // Consume 1 stim
    GameState.removeItemsById('nano_stim', 1, true);
    this.health = Math.min(this.maxHealth, this.health + 40);
    sound.playStimSound();

    if (ui) {
      ui.updateHealth(this.health, this.maxHealth);
      ui.updateHUD();
      ui.updateQuickSelectBar(this.weapons?.currentWeaponId, this.weapons?.weaponData);
      ui.showAnnouncement('MEDKIT DIGUNAKAN', '+40 HP Dipulihkan!', 1.8);

      const medkitSlot = document.getElementById('hotbar-slot-4') || document.getElementById('hotbar-slot-5');
      if (medkitSlot) {
        medkitSlot.classList.add('healing');
        setTimeout(() => medkitSlot.classList.remove('healing'), 400);
      }
    }
  }

  // Gunakan Jamu Beras Kencur (Stamina 2x regen selama 60s)
  useJamuKencur(uiManager = null) {
    const ui = uiManager || this.ui;
    if (this.isDead) return;
    const count = GameState.countItem('jamu_kencur', true);
    if (count <= 0) {
      if (ui) ui.showAnnouncement('JAMU KENCUR KOSONG', 'Racik di Meja Perakit (Workbench)!', 2.0);
      return;
    }
    GameState.removeItemsById('jamu_kencur', 1, true);
    GameState.applyBuff('stamina_boost', 60);
    sound.playStimSound();
    if (ui) {
      ui.showAnnouncement('JAMU BERAS KENCUR 🌾', 'Stamina Regen 2x Lipat Aktif Selama 60 Detik!', 3.0);
      ui.updateHUD();
    }
  }

  // Gunakan Jamu Kunyit Asam (Kebal Racun selama 60s)
  useJamuKunyit(uiManager = null) {
    const ui = uiManager || this.ui;
    if (this.isDead) return;
    const count = GameState.countItem('jamu_kunyit', true);
    if (count <= 0) {
      if (ui) ui.showAnnouncement('JAMU KUNYIT KOSONG', 'Racik di Meja Perakit (Workbench)!', 2.0);
      return;
    }
    GameState.removeItemsById('jamu_kunyit', 1, true);
    GameState.applyBuff('poison_immune', 60);
    sound.playStimSound();
    if (ui) {
      ui.showAnnouncement('JAMU KUNYIT ASAM 🧪', 'Kebal Racun Toxic Stalker Selama 60 Detik!', 3.0);
      ui.updateHUD();
    }
  }

  // Pasang Ranjau Paku Bambu di posisi berdiri
  deployBambooTrap(uiManager = null) {
    const ui = uiManager || this.ui;
    if (this.isDead) return;
    const trapCount = GameState.countItem('bamboo_trap', true);
    if (trapCount <= 0) {
      if (ui) ui.showAnnouncement('RANJAU HABIS', 'Rakit Ranjau Paku Bambu di Meja Perakit (Workbench)!', 2.0);
      return;
    }
    GameState.removeItemsById('bamboo_trap', 1, true);
    const zMgr = this.zombiesManager || (this.weapons ? this.weapons.zombiesManager : null);
    if (zMgr && typeof zMgr.placeBambooTrap === 'function') {
      zMgr.placeBambooTrap(this.yawObject.position);
    }
    if (ui) {
      ui.showAnnouncement('RANJAU BAMBU DITANAM 🎋', 'Zombi yang memijak akan terkena 50 DMG + Slow 50%!', 2.5);
      ui.updateQuickSelectBar(this.weapons?.currentWeaponId, this.weapons?.weaponData);
    }
  }
}





