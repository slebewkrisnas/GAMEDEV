// ============================================================================
// DEAD ZONE — WEAPON SYSTEM (TACTICAL 9MM PISTOL)
// Handles procedural 3D weapon rendering, firing cooldown, raycast hit detection,
// headshot calculation, recoil spring animation, reload logic, and ammo counters.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';

export class WeaponManager {
  constructor(camera, parentGroup, zombiesManager, uiManager, environment) {
    this.camera = camera;
    this.parentGroup = parentGroup; // player's pitchObject
    this.zombiesManager = zombiesManager;
    this.uiManager = uiManager;
    this.environment = environment;

    // Ammo specifications
    this.magCapacity = 12;
    this.ammoInMag = 12;
    this.reserveAmmo = 60;
    this.maxReserveAmmo = 120;

    // Firing timing
    this.fireRate = 0.22; // Seconds between shots
    this.fireCooldown = 0;

    // Reload timing
    this.reloadDuration = 1.3; // 1.3 seconds reload
    this.isReloading = false;
    this.reloadTimer = 0;

    // Damage specifications
    this.bodyDamage = 35; // 3 body shots to eliminate 100hp walker
    this.headshotDamage = 100; // 1 shot kill on regular walkers

    // Combat statistics
    this.totalShots = 0;
    this.totalHits = 0;
    this.totalHeadshots = 0;

    // Raycaster from screen center (0, 0 in NDC)
    this.raycaster = new THREE.Raycaster();
    this.screenCenter = new THREE.Vector2(0, 0);

    // Procedural weapon 3D mesh
    this.weaponGroup = new THREE.Group();
    this.defaultWeaponPos = new THREE.Vector3(0.22, -0.22, -0.42);
    this.weaponGroup.position.copy(this.defaultWeaponPos);

    this.recoilOffset = new THREE.Vector3(0, 0, 0);
    this.recoilRotation = new THREE.Euler(0, 0, 0);

    // Build the 3D pistol model
    this.buildPistolModel();
    this.parentGroup.add(this.weaponGroup);

    // Event listeners
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  destroy() {
    window.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('keydown', this.boundOnKeyDown);
  }

  buildPistolModel() {
    // 1. Slide (Gunmetal top)
    const slideGeo = new THREE.BoxGeometry(0.045, 0.05, 0.22);
    const slideMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d32,
      roughness: 0.35,
      metalness: 0.8
    });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.04, -0.04);
    this.weaponGroup.add(slide);

    // 2. Barrel interior
    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.23, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.045, -0.04);
    this.weaponGroup.add(barrel);

    // 3. Lower Frame & Trigger Guard
    const frameGeo = new THREE.BoxGeometry(0.042, 0.038, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1b1c1e,
      roughness: 0.7,
      metalness: 0.2
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.005, -0.04);
    this.weaponGroup.add(frame);

    // 4. Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.065);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x151617,
      roughness: 0.9,
      metalness: 0.1
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.06, 0.02);
    grip.rotation.x = 0.22; // angled tactical grip
    this.weaponGroup.add(grip);

    // 5. Sights (Front & Rear glowing dots)
    const sightMat = new THREE.MeshBasicMaterial({ color: 0x22ff55 }); // Tritium green
    const frontSightGeo = new THREE.BoxGeometry(0.006, 0.01, 0.006);
    const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
    frontSight.position.set(0, 0.07, -0.14);
    this.weaponGroup.add(frontSight);

    // 6. Muzzle Flash Flare & Light
    const flashGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffdd66 });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.045, -0.18);
    this.muzzleFlashMesh.visible = false;
    this.weaponGroup.add(this.muzzleFlashMesh);

    this.muzzleLight = new THREE.PointLight(0xffaa22, 2.0, 6);
    this.muzzleLight.position.set(0, 0.045, -0.18);
    this.muzzleLight.visible = false;
    this.weaponGroup.add(this.muzzleLight);
  }

  onMouseDown(e) {
    if (e.button !== 0) return; // Only Left Click
    this.shoot();
  }

  onKeyDown(e) {
    if (e.code === 'KeyR') {
      this.reload();
    }
  }

  shoot() {
    // Cannot shoot if pointer is unlocked (unless in touch mode), during reload, or cooldown active
    const canShootPointer = (document.pointerLockElement !== null) || this.isTouchMode;
    if (!canShootPointer || this.isReloading || this.fireCooldown > 0) {
      return;
    }

    // Out of ammo in current magazine
    if (this.ammoInMag <= 0) {
      sound.playDryFire();
      this.uiManager.showReloadAlert(true);
      return;
    }

    // Deduct bullet
    this.ammoInMag--;
    this.totalShots++;
    this.fireCooldown = this.fireRate;

    // Play gunshot sound
    sound.playPistolShot();

    // Trigger visual recoil and muzzle flash
    this.triggerRecoil();
    this.showMuzzleFlash();
    this.uiManager.triggerCrosshairRecoil();
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);

    if (this.ammoInMag === 0) {
      this.uiManager.showReloadAlert(true);
    }

    // Raycast hit detection
    this.performRaycast();
  }

  performRaycast() {
    this.raycaster.setFromCamera(this.screenCenter, this.camera);

    // Get hitboxes from active live zombies and obstacles
    const targets = [
      ...this.zombiesManager.getActiveHitboxes(),
      ...(this.environment ? this.environment.obstacleMeshes : [])
    ];
    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitMesh = hit.object;

      // Check if zombie hitbox
      if (hitMesh.userData && hitMesh.userData.zombie) {
        const zombie = hitMesh.userData.zombie;
        const isHead = hitMesh.userData.isHead || false;
        const damage = isHead ? this.headshotDamage : this.bodyDamage;

        this.totalHits++;
        if (isHead) {
          this.totalHeadshots++;
          sound.playHeadshot();
          this.uiManager.showHitMarker(true); // Red critical hitmarker
          this.uiManager.showAnnouncement("CRITICAL HEADSHOT!", "+100 DAMAGE", 1.0);
        } else {
          sound.playZombieHurt();
          this.uiManager.showHitMarker(false); // White standard hitmarker
        }

        zombie.takeDamage(damage, isHead);
      }
    }
  }

  reload() {
    // Only reload if not already reloading, mag is not full, and reserve ammo exists
    if (this.isReloading || this.ammoInMag >= this.magCapacity || this.reserveAmmo <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    this.uiManager.showReloadAlert(false);
    this.uiManager.showReloadProgressBar(true);

    sound.playReload();
  }

  triggerRecoil() {
    this.recoilOffset.z = 0.08; // Kick back
    this.recoilRotation.x = 0.16; // Muzzle rises
  }

  showMuzzleFlash() {
    this.muzzleFlashMesh.visible = true;
    this.muzzleLight.visible = true;
    this.flashTimer = 0.05; // Visible for 50ms
  }

  update(delta) {
    // Fire cooldown countdown
    if (this.fireCooldown > 0) {
      this.fireCooldown -= delta;
    }

    // Muzzle flash visibility timer
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleLight.visible = false;
      }
    }

    // Reload handling
    if (this.isReloading) {
      this.reloadTimer -= delta;
      const progress = 1 - Math.max(0, this.reloadTimer) / this.reloadDuration;
      this.uiManager.updateReloadProgress(progress);

      // Weapon lower and raise animation during reload
      const reloadPhase = progress * Math.PI;
      this.weaponGroup.position.y = this.defaultWeaponPos.y - Math.sin(reloadPhase) * 0.15;
      this.weaponGroup.rotation.x = -Math.sin(reloadPhase) * 0.45;

      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    } else {
      // Smooth recoil recovery using exponential decay
      this.recoilOffset.z += (0 - this.recoilOffset.z) * Math.min(1, delta * 20);
      this.recoilRotation.x += (0 - this.recoilRotation.x) * Math.min(1, delta * 20);

      this.weaponGroup.position.set(
        this.defaultWeaponPos.x + this.recoilOffset.x,
        this.defaultWeaponPos.y + this.recoilOffset.y,
        this.defaultWeaponPos.z + this.recoilOffset.z
      );

      this.weaponGroup.rotation.set(
        this.recoilRotation.x,
        this.recoilRotation.y,
        this.recoilRotation.z
      );
    }
  }

  finishReload() {
    this.isReloading = false;
    const needed = this.magCapacity - this.ammoInMag;
    const toLoad = Math.min(needed, this.reserveAmmo);
    this.ammoInMag += toLoad;
    this.reserveAmmo -= toLoad;

    this.weaponGroup.position.copy(this.defaultWeaponPos);
    this.weaponGroup.rotation.set(0, 0, 0);

    this.uiManager.showReloadProgressBar(false);
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
  }

  getAccuracy() {
    if (this.totalShots === 0) return 0;
    return Math.round((this.totalHits / this.totalShots) * 100);
  }

  // Resupply ammunition (reward between waves)
  resupplyAmmo(amount = 24) {
    this.reserveAmmo = Math.min(120, this.reserveAmmo + amount);
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
    if (this.ammoInMag > 0) {
      this.uiManager.showReloadAlert(false);
    }
  }

  reset() {
    this.ammoInMag = this.magCapacity;
    this.reserveAmmo = 60;
    this.fireCooldown = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.totalHeadshots = 0;
    this.muzzleFlashMesh.visible = false;
    this.muzzleLight.visible = false;
    this.weaponGroup.position.copy(this.defaultWeaponPos);
    this.weaponGroup.rotation.set(0, 0, 0);
    this.uiManager.showReloadAlert(false);
    this.uiManager.showReloadProgressBar(false);
    this.uiManager.updateAmmo(this.ammoInMag, this.reserveAmmo);
  }
}
