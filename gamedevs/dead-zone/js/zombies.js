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

    // Configuration / Stats according to Zombie Type
    this.type = config.type || 'walker'; // 'walker', 'runner', 'tank', 'brute', 'stalker', 'boss'

    // 1. Health
    if (config.hp) {
      this.maxHealth = config.hp;
    } else if (this.type === 'boss') {
      this.maxHealth = 650;
    } else if (this.type === 'tank' || this.type === 'brute') {
      this.maxHealth = 175;
    } else if (this.type === 'runner') {
      this.maxHealth = 55;
    } else if (this.type === 'stalker') {
      this.maxHealth = 95;
    } else {
      this.maxHealth = 80;
    }
    this.health = this.maxHealth;

    // 2. Speed
    if (config.speed) {
      this.speed = config.speed;
    } else if (this.type === 'boss') {
      this.speed = 2.4;
    } else if (this.type === 'tank' || this.type === 'brute') {
      this.speed = 1.6; // Jalan lambat
    } else if (this.type === 'runner') {
      this.speed = 3.9; // Jalan cepat / sprint
    } else if (this.type === 'stalker') {
      this.speed = 2.8;
    } else {
      this.speed = 2.2;
    }

    // 3. Attack Damage
    if (config.damage) {
      this.attackDamage = config.damage;
    } else if (this.type === 'boss') {
      this.attackDamage = 38; // Jauh lebih sakit!
    } else if (this.type === 'tank' || this.type === 'brute') {
      this.attackDamage = 25; // Damage lumayan besar
    } else if (this.type === 'runner') {
      this.attackDamage = 8; // Damage tidak sebesar yang lambat
    } else if (this.type === 'stalker') {
      this.attackDamage = 16;
    } else {
      this.attackDamage = 13;
    }

    // 4. Scale
    if (config.scale) {
      this.scale = config.scale;
    } else if (this.type === 'boss') {
      this.scale = 2.6; // Ukuran jauh lebih besar (Titan)
    } else if (this.type === 'tank' || this.type === 'brute') {
      this.scale = 1.35; // Kekar dan kokoh
    } else if (this.type === 'runner') {
      this.scale = 0.88; // Gesit dan ramping
    } else if (this.type === 'stalker') {
      this.scale = 1.05;
    } else {
      this.scale = 1.0;
    }

    // AI States: 'chase', 'attack', 'dead'
    this.state = 'chase';
    this.isAlive = true;

    // Combat parameters
    this.attackRange = 1.75 * this.scale;
    this.attackCooldown = this.type === 'runner' ? 0.8 : (this.type === 'boss' ? 1.4 : 1.1);
    this.attackTimer = 0.5;

    // Death / Despawn timing
    this.deathTimer = 0;
    this.deathDuration = this.type === 'boss' ? 3.5 : 2.0;

    // Animation variables
    this.walkCycle = Math.random() * Math.PI * 2;
    this.groanTimer = Math.random() * 5 + 3;

    // Hitboxes list for raycasting
    this.hitboxes = [];

    // Create 3D Zombie Mesh hierarchy
    this.mesh = new THREE.Group();
    this.buildZombieMesh();
    this.mesh.scale.set(this.scale, this.scale, this.scale);

    // Initial position adapted to terrain
    const initY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(config.x, config.z)
      : 0;
    this.mesh.position.set(config.x, initY, config.z);
    this.scene.add(this.mesh);
  }

  buildZombieMesh() {
    // Skin & Clothing materials tuned by zombie type
    let skinColor = 0x6b8f60;
    let shirtColor = 0x475569;
    let eyeColor = 0xff2222;
    let emissiveSkin = 0x1e2e1c;
    let emissiveIntensity = 0.35;

    if (this.type === 'boss') {
      skinColor = 0x221a2c; // Mutated dark obsidian purple
      shirtColor = 0x181024;
      eyeColor = 0xff0033; // Radiant blazing crimson eyes
      emissiveSkin = 0x581c87;
      emissiveIntensity = 0.55;
    } else if (this.type === 'tank' || this.type === 'brute') {
      skinColor = 0x475841; // Heavy mossy armored skin
      shirtColor = 0x272e36;
      emissiveSkin = 0x162414;
    } else if (this.type === 'runner') {
      skinColor = 0x8da178; // Sickly pale green
      shirtColor = 0x991b1b; // Tattered bloodied red shirt
      emissiveSkin = 0x291515;
    } else if (this.type === 'stalker') {
      skinColor = 0x2f3d32; // Toxic camouflage
      shirtColor = 0x1e2922;
      eyeColor = 0x22c55e; // Menacing neon radioactive green
      emissiveSkin = 0x14532d;
    }

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      emissive: emissiveSkin,
      emissiveIntensity: emissiveIntensity,
      roughness: 0.8,
      metalness: 0.05
    });

    const clothesMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      emissive: 0x0f172a,
      emissiveIntensity: 0.25,
      roughness: 0.85
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

    // 1. Torso (Body)
    const torsoW = (this.type === 'tank' || this.type === 'brute') ? 0.62 : ((this.type === 'boss') ? 0.68 : 0.5);
    const torsoH = (this.type === 'boss') ? 0.8 : 0.72;
    const torsoD = (this.type === 'tank' || this.type === 'boss') ? 0.38 : 0.28;

    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    this.torso = new THREE.Mesh(torsoGeo, clothesMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.torso.userData = { zombie: this, isHead: false };
    this.mesh.add(this.torso);
    this.hitboxes.push(this.torso);

    // Boss special features: Glowing Chest Bio-Core & Spiked Pauldrons
    if (this.type === 'boss') {
      const coreGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const bioCore = new THREE.Mesh(coreGeo, coreMat);
      bioCore.position.set(0, 0.05, torsoD / 2 + 0.03);
      this.torso.add(bioCore);
    }

    // 2. Head
    const headSize = (this.type === 'boss') ? 0.38 : 0.32;
    const headGeo = new THREE.BoxGeometry(headSize, headSize * 1.06, headSize);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 1.62;
    this.head.castShadow = true;
    this.head.receiveShadow = true;
    this.head.userData = { zombie: this, isHead: true };
    this.mesh.add(this.head);
    this.hitboxes.push(this.head);

    // Eyes (Two glowing dots)
    const eyeSize = (this.type === 'boss') ? 0.055 : 0.035;
    const eyeGeo = new THREE.SphereGeometry(eyeSize, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-headSize * 0.25, 0.04, -headSize * 0.51);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(headSize * 0.25, 0.04, -headSize * 0.51);
    this.head.add(leftEye);
    this.head.add(rightEye);

    // Boss Horns/Crown
    if (this.type === 'boss') {
      const hornGeo = new THREE.ConeGeometry(0.08, 0.35, 5);
      hornGeo.rotateX(Math.PI / 4);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
      const leftHorn = new THREE.Mesh(hornGeo, hornMat);
      leftHorn.position.set(-0.16, 0.22, -0.05);
      const rightHorn = new THREE.Mesh(hornGeo, hornMat);
      rightHorn.position.set(0.16, 0.22, -0.05);
      this.head.add(leftHorn);
      this.head.add(rightHorn);
    }

    // 3. Arms with Pivots at shoulders
    const armW = (this.type === 'tank' || this.type === 'boss') ? 0.18 : 0.14;
    const armGeo = new THREE.BoxGeometry(armW, 0.65, armW);
    armGeo.translate(0, -0.28, 0); // Center pivot at top of arm

    // Left Arm Pivot
    const shoulderX = torsoW * 0.5 + armW * 0.5;
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-shoulderX, 1.35, 0);
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.castShadow = true;
    this.leftArm.userData = { zombie: this, isHead: false };
    this.leftArmPivot.add(this.leftArm);
    this.mesh.add(this.leftArmPivot);
    this.hitboxes.push(this.leftArm);

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(shoulderX, 1.35, 0);
    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.castShadow = true;
    this.rightArm.userData = { zombie: this, isHead: false };
    this.rightArmPivot.add(this.rightArm);
    this.mesh.add(this.rightArmPivot);
    this.hitboxes.push(this.rightArm);

    // Boss Shoulder Spikes
    if (this.type === 'boss') {
      const spikeGeo = new THREE.ConeGeometry(0.12, 0.32, 5);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x0f0b14, roughness: 0.7 });
      const leftSpike = new THREE.Mesh(spikeGeo, spikeMat);
      leftSpike.position.set(0, 0.12, 0);
      this.leftArmPivot.add(leftSpike);
      const rightSpike = new THREE.Mesh(spikeGeo, spikeMat);
      rightSpike.position.set(0, 0.12, 0);
      this.rightArmPivot.add(rightSpike);
    }

    // 4. Legs with Pivots at hips
    const legW = (this.type === 'tank' || this.type === 'boss') ? 0.2 : 0.16;
    const legGeo = new THREE.BoxGeometry(legW, 0.72, legW);
    legGeo.translate(0, -0.36, 0);

    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.9 });

    // Left Leg Pivot
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-torsoW * 0.25, 0.72, 0);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.castShadow = true;
    this.leftLeg.userData = { zombie: this, isHead: false };
    this.leftLegPivot.add(this.leftLeg);
    this.mesh.add(this.leftLegPivot);
    this.hitboxes.push(this.leftLeg);

    // Right Leg Pivot
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(torsoW * 0.25, 0.72, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.castShadow = true;
    this.rightLeg.userData = { zombie: this, isHead: false };
    this.rightLegPivot.add(this.rightLeg);
    this.mesh.add(this.rightLegPivot);
    this.hitboxes.push(this.rightLeg);
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
    this.leftArm.userData = {};
    this.rightArm.userData = {};
    this.leftLeg.userData = {};
    this.rightLeg.userData = {};

    if (this.onDeathCallback) {
      this.onDeathCallback(this.mesh.position, this.type === 'boss', this);
    }
  }

  update(delta) {
    const groundY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(this.mesh.position.x, this.mesh.position.z)
      : 0;

    // ------------------------------------------------------------------------
    // STATE: DEAD
    // ------------------------------------------------------------------------
    if (this.state === 'dead') {
      this.deathTimer += delta;

      // Fall backward animation
      if (this.mesh.rotation.x > -Math.PI / 2) {
        this.mesh.rotation.x -= delta * 3.5;
        this.mesh.position.y = Math.max(groundY + 0.15, this.mesh.position.y - delta * 0.8);
      }

      // After 1.4s, sink into the ground
      if (this.deathTimer > 1.4) {
        this.mesh.position.y -= delta * 0.5;
      }

      return;
    }

    // Walking / Chasing / Attacking: Adapt vertically to terrain height
    this.mesh.position.y = groundY;

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
    const zombie = new Zombie(this.scene, this.environment, this.player, config, (pos, isBoss, zInstance) => {
      if (this.onZombieKilled) {
        this.onZombieKilled(pos || zombie.mesh.position, isBoss, zInstance || zombie);
      }
    });
    this.zombies.push(zombie);
    return zombie;
  }

  getBoss() {
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.isAlive && z.type === 'boss') {
        return z;
      }
    }
    return null;
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
