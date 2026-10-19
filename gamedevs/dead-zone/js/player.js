// ============================================================================
// DEAD ZONE — FIRST-PERSON PLAYER CONTROLLER & HEALTH
// Implements smooth WASD movement relative to camera yaw, mouse look,
// sprint, sliding collision physics, health management, and pointer lock.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';

export class Player {
  constructor(camera, domElement, environment, onDamageCallback, onDeathCallback) {
    this.camera = camera;
    this.domElement = domElement;
    this.environment = environment;
    this.onDamageCallback = onDamageCallback;
    this.onDeathCallback = onDeathCallback;

    // Player Hierarchy:
    // yawObject (controls horizontal rotation & position at eye height)
    //  └── pitchObject (controls vertical pitch & holds camera and weapon)
    this.yawObject = new THREE.Group();
    this.pitchObject = new THREE.Group();
    this.yawObject.position.set(0, 1.7, 0); // Eye level at 1.7m
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
    this.walkSpeed = 6.0;
    this.sprintSpeed = 10.0;
    this.radius = 0.5; // Collision radius

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
      this.domElement.requestPointerLock();
    } catch (e) {
      console.warn("Pointer lock request failed:", e);
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
        this.isSprinting = true;
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'Space':
        e.preventDefault();
        this.jump();
        break;
    }
  }

  jump() {
    if (!this.isGrounded || this.isDead) return;
    if (!this.isPointerLocked && !this.isTouchMode) return;
    this.velocityY = this.jumpForce;
    this.isGrounded = false;
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

    // Determine current speed
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

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
        this.bobTimer += delta * (this.isSprinting ? 14 : 9);
        this.pitchObject.position.y = Math.sin(this.bobTimer) * 0.04;
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
    // VERTICAL JUMP & GRAVITY PHYSICS:
    // =========================================================================
    if (!this.isGrounded) {
      this.velocityY -= this.gravity * delta;
      currentPos.y += this.velocityY * delta;

      // Check ground landing
      if (currentPos.y <= this.eyeHeight) {
        currentPos.y = this.eyeHeight;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }

    const feetY = Math.max(0, currentPos.y - this.eyeHeight);

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
    this.yawObject.position.set(0, this.eyeHeight, 0);
    this.yawObject.rotation.set(0, 0, 0);
    this.pitchObject.rotation.set(0, 0, 0);
    this.pitchObject.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.bobTimer = 0;
    this.cameraShakeIntensity = 0;
  }
}
