// ============================================================================
// DEAD ZONE — ZOMBIE SYSTEM & AI STATE MACHINE
// Handles procedural humanoid zombie geometry, limb animations, AI states
// (CHASE, ATTACK, DEAD), hitboxes, damage, and death despawn.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';

export class Zombie {
  constructor(scene, environment, player, config, onDeathCallback) {
    this.scene = scene;
    this.environment = environment;
    this.player = player;
    this.onDeathCallback = onDeathCallback;

    // Configuration / Stats
    this.type = config.type || 'walker'; // 'walker', 'runner', 'brute'
    this.maxHealth = config.hp || 70;
    this.health = this.maxHealth;
    this.speed = config.speed || 2.2;
    this.attackDamage = config.damage || 12;
    this.scale = config.scale || 1.0;

    // AI States: 'chase', 'attack', 'dead'
    this.state = 'chase';
    this.isAlive = true;

    // Combat parameters
    this.attackRange = 1.75 * this.scale;
    this.attackCooldown = 1.1; // seconds between attacks
    this.attackTimer = 0.5; // initial small delay before first strike

    // Death / Despawn timing
    this.deathTimer = 0;
    this.deathDuration = 2.0;

    // Animation variables
    this.walkCycle = Math.random() * Math.PI * 2;
    this.groanTimer = Math.random() * 5 + 3;

    // Hitboxes list for raycasting
    this.hitboxes = [];

    // Create 3D Zombie Mesh hierarchy
    this.mesh = new THREE.Group();
    this.buildZombieMesh();
    this.mesh.scale.set(this.scale, this.scale, this.scale);

    // Initial position
    this.mesh.position.set(config.x, 0, config.z);
    this.scene.add(this.mesh);
  }

  buildZombieMesh() {
    // Skin & Clothing materials (tuned for clear visibility & horror silhouette)
    const skinColor = this.type === 'brute' ? 0x5a7554 : 0x76996c;
    const shirtColor = this.type === 'runner' ? 0x992b2b : (this.type === 'brute' ? 0x3d4857 : 0x4f5e73);

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      emissive: 0x1e2e1c,
      emissiveIntensity: 0.35,
      roughness: 0.8,
      metalness: 0.05
    });

    const clothesMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      emissive: 0x141820,
      emissiveIntensity: 0.25,
      roughness: 0.8
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 }); // Menacing glowing red eyes

    // 1. Torso (Body)
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.72, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, clothesMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.torso.userData = { zombie: this, isHead: false };
    this.mesh.add(this.torso);
    this.hitboxes.push(this.torso);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.32, 0.34, 0.32);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 1.62;
    this.head.castShadow = true;
    this.head.receiveShadow = true;
    this.head.userData = { zombie: this, isHead: true };
    this.mesh.add(this.head);
    this.hitboxes.push(this.head);

    // Eyes (Two glowing red dots)
    const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.04, -0.165);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.04, -0.165);
    this.head.add(leftEye);
    this.head.add(rightEye);

    // 3. Arms with Pivots at shoulders
    const armGeo = new THREE.BoxGeometry(0.14, 0.65, 0.14);
    armGeo.translate(0, -0.28, 0); // Center pivot at top of arm

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.32, 1.35, 0);
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.castShadow = true;
    this.leftArmPivot.add(this.leftArm);
    this.mesh.add(this.leftArmPivot);

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.32, 1.35, 0);
    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.castShadow = true;
    this.rightArmPivot.add(this.rightArm);
    this.mesh.add(this.rightArmPivot);

    // 4. Legs with Pivots at hips
    const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.16);
    legGeo.translate(0, -0.36, 0);

    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.9 });

    // Left Leg Pivot
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.14, 0.72, 0);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.castShadow = true;
    this.leftLegPivot.add(this.leftLeg);
    this.mesh.add(this.leftLegPivot);

    // Right Leg Pivot
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.14, 0.72, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.castShadow = true;
    this.rightLegPivot.add(this.rightLeg);
    this.mesh.add(this.rightLegPivot);
  }

  takeDamage(amount, isHeadshot) {
    if (!this.isAlive) return;

    this.health -= amount;

    // Recoil flinch
    this.mesh.position.y += 0.05;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.state = 'dead';

    // Clear hitboxes immediately so dead zombies cannot be shot or block raycasts
    this.hitboxes.length = 0;
    this.torso.userData = {};
    this.head.userData = {};

    if (this.onDeathCallback) {
      this.onDeathCallback();
    }
  }

  update(delta) {
    // ------------------------------------------------------------------------
    // STATE: DEAD
    // ------------------------------------------------------------------------
    if (this.state === 'dead') {
      this.deathTimer += delta;

      // Fall backward animation
      if (this.mesh.rotation.x > -Math.PI / 2) {
        this.mesh.rotation.x -= delta * 3.5;
        this.mesh.position.y = Math.max(0.15, this.mesh.position.y - delta * 0.8);
      }

      // After 1.4s, sink into the ground
      if (this.deathTimer > 1.4) {
        this.mesh.position.y -= delta * 0.5;
      }

      return;
    }

    // Occasional groans
    this.groanTimer -= delta;
    if (this.groanTimer <= 0) {
      const distToPlayer = this.mesh.position.distanceTo(this.player.yawObject.position);
      if (distToPlayer < 25) {
        sound.playZombieGroan();
      }
      this.groanTimer = Math.random() * 8 + 5;
    }

    const playerPos = this.player.yawObject.position;
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const distanceToPlayer = Math.hypot(dx, dz);

    // Always rotate smoothly to face player
    const targetAngle = Math.atan2(dx, dz) + Math.PI; // Face player
    let angleDiff = targetAngle - this.mesh.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.mesh.rotation.y += angleDiff * Math.min(1, delta * 9);

    // ------------------------------------------------------------------------
    // STATE: ATTACK
    // ------------------------------------------------------------------------
    if (distanceToPlayer <= this.attackRange) {
      this.state = 'attack';

      // Attack claw animation
      this.attackTimer += delta;
      const clawPhase = Math.sin(this.attackTimer * 6);
      this.leftArmPivot.rotation.x = -Math.PI / 2 + clawPhase * 0.5;
      this.rightArmPivot.rotation.x = -Math.PI / 2 - clawPhase * 0.5;

      // Strike player on attack cooldown
      if (this.attackTimer >= this.attackCooldown) {
        this.attackTimer = 0;
        sound.playZombieAttack();
        this.player.takeDamage(this.attackDamage);
      }
    }
    // ------------------------------------------------------------------------
    // STATE: CHASE
    // ------------------------------------------------------------------------
    else {
      this.state = 'chase';
      this.attackTimer = 0.3; // Ready to attack soon when in range

      // Movement vector toward player
      const dirX = dx / distanceToPlayer;
      const dirZ = dz / distanceToPlayer;

      const moveStep = this.speed * delta;
      const newX = this.mesh.position.x + dirX * moveStep;
      const newZ = this.mesh.position.z + dirZ * moveStep;

      // Obstacle sliding with lateral whisker steering:
      const colRadius = 0.45 * this.scale;
      const canMoveX = !this.environment.checkCollision(newX, this.mesh.position.z, colRadius);
      const canMoveZ = !this.environment.checkCollision(this.mesh.position.x, newZ, colRadius);

      if (canMoveX) this.mesh.position.x = newX;
      if (canMoveZ) this.mesh.position.z = newZ;

      // If obstructed on both axes (e.g. wall/corner), steer laterally to unstick:
      if (!canMoveX && !canMoveZ) {
        const perpX = -dirZ;
        const perpZ = dirX;
        const slideStep = moveStep * 0.85;
        if (!this.environment.checkCollision(this.mesh.position.x + perpX * slideStep, this.mesh.position.z + perpZ * slideStep, colRadius)) {
          this.mesh.position.x += perpX * slideStep;
          this.mesh.position.z += perpZ * slideStep;
        } else if (!this.environment.checkCollision(this.mesh.position.x - perpX * slideStep, this.mesh.position.z - perpZ * slideStep, colRadius)) {
          this.mesh.position.x -= perpX * slideStep;
          this.mesh.position.z -= perpZ * slideStep;
        }
      }

      // Walk cycle animation (swinging arms & legs)
      this.walkCycle += delta * this.speed * 3.5;
      const legSwing = Math.sin(this.walkCycle) * 0.5;
      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;

      // Arms raised forward in classic zombie stalk pose + subtle swing
      this.leftArmPivot.rotation.x = -Math.PI / 2.6 + Math.sin(this.walkCycle) * 0.15;
      this.rightArmPivot.rotation.x = -Math.PI / 2.6 - Math.sin(this.walkCycle) * 0.15;
    }
  }

  isFullyDisposed() {
    return this.state === 'dead' && this.deathTimer >= this.deathDuration;
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.hitboxes.length = 0;
  }
}

export class ZombiesManager {
  constructor(scene, environment, player, onZombieKilled) {
    this.scene = scene;
    this.environment = environment;
    this.player = player;
    this.onZombieKilled = onZombieKilled;
    this.zombies = [];
  }

  spawnZombie(config) {
    const zombie = new Zombie(this.scene, this.environment, this.player, config, () => {
      if (this.onZombieKilled) {
        this.onZombieKilled();
      }
    });
    this.zombies.push(zombie);
    return zombie;
  }

  getActiveHitboxes() {
    const list = [];
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.isAlive) {
        list.push(...z.hitboxes);
      }
    }
    return list;
  }

  getActiveCount() {
    let count = 0;
    for (let i = 0; i < this.zombies.length; i++) {
      if (this.zombies[i].isAlive) {
        count++;
      }
    }
    return count;
  }

  update(delta) {
    // Soft zombie-to-zombie repulsion to prevent unnatural stacking
    for (let i = 0; i < this.zombies.length; i++) {
      const z1 = this.zombies[i];
      if (z1.isDead) continue;
      for (let j = i + 1; j < this.zombies.length; j++) {
        const z2 = this.zombies[j];
        if (z2.isDead) continue;
        const sepX = z2.mesh.position.x - z1.mesh.position.x;
        const sepZ = z2.mesh.position.z - z1.mesh.position.z;
        const sepDist = Math.hypot(sepX, sepZ);
        const minDist = (z1.scale + z2.scale) * 0.65;
        if (sepDist < minDist && sepDist > 0.01) {
          const push = (minDist - sepDist) * 0.5;
          const nx = sepX / sepDist;
          const nz = sepZ / sepDist;
          z1.mesh.position.x -= nx * push * Math.min(1, delta * 5);
          z1.mesh.position.z -= nz * push * Math.min(1, delta * 5);
          z2.mesh.position.x += nx * push * Math.min(1, delta * 5);
          z2.mesh.position.z += nz * push * Math.min(1, delta * 5);
        }
      }
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.update(delta);

      // Clean up fully dead zombies that completed death/sink animation
      if (z.isFullyDisposed()) {
        z.destroy();
        this.zombies.splice(i, 1);
      }
    }
  }

  clearAll() {
    for (let i = 0; i < this.zombies.length; i++) {
      this.zombies[i].destroy();
    }
    this.zombies = [];
  }
}
