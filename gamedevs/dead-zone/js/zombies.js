// ============================================================================
// DEAD ZONE — ZOMBIE SYSTEM & AI STATE MACHINE
// Integrates high-fidelity 3D Skeletal FBX Zombie assets (Zombie Biasa & Boss Titan)
// with PBR textures, animation state machine (CHASE, ATTACK, DEAD),
// precision hitboxes for headshots & damage, and smooth audio effects.
// ============================================================================

import * as THREE from 'three';
import { sound } from './audio.js';
import { zombieAssets, createZombieInstance, playZombieAction, initZombieAssets } from './zombieAssets.js';

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

    // 4. Scale factor for entity bounds
    if (config.scale) {
      this.scale = config.scale;
    } else if (this.type === 'boss') {
      this.scale = 2.6; // Massive colossal Necromancer boss
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
    // Sesuaikan jangkauan serangan Boss Titan ke 3.8 meter agar tebasan pedang raksasanya realistis
    this.attackRange = this.type === 'boss' ? 3.8 : (1.85 * this.scale);
    this.attackCooldown = this.type === 'runner' ? 0.8 : (this.type === 'boss' ? 1.4 : 1.1);
    this.attackTimer = 0.5;

    // Special Boss state: Raungan & Pemanggilan Runner saat HP <= 50%
    this.hasSummonedRunners = false;
    this.onBossRoarCallback = null;
    this.onToxicDeathCallback = null;

    // Death / Despawn timing
    this.deathTimer = 0;
    this.deathDuration = this.type === 'boss' ? 5.2 : 3.8;

    // Animation & Groan variables
    this.walkCycle = Math.random() * Math.PI * 2;
    this.groanTimer = Math.random() * 5 + 3;

    // Hitboxes list for raycasting
    this.hitboxes = [];

    // Real FBX 3D Asset reference
    this.realAsset = null;
    this.proceduralGroup = null;

    // Create 3D Zombie Mesh hierarchy
    this.mesh = new THREE.Group();
    this.buildZombieMesh();

    // Initial position adapted to terrain
    const initY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(config.x, config.z)
      : 0;
    this.mesh.position.set(config.x, initY, config.z);
    this.scene.add(this.mesh);
  }

  buildZombieMesh() {
    // Try building real 3D FBX asset first
    const realInstance = createZombieInstance(this.type);
    if (realInstance) {
      this.setupRealAsset(realInstance);
    } else {
      // Temporary procedural fallback until 3D FBX finish loading
      this.buildProceduralZombieMesh();
    }
  }

  setupRealAsset(instance) {
    if (this.proceduralGroup) {
      this.mesh.remove(this.proceduralGroup);
      this.proceduralGroup = null;
    }

    this.realAsset = instance;

    // Scale model container
    this.realAsset.group.scale.set(this.scale, this.scale, this.scale);
    this.mesh.add(this.realAsset.group);

    // Initial animation action
    const initAction = (this.type === 'runner') ? 'run' : 'walk';
    playZombieAction(this.realAsset, initAction, 0.1);

    // Create precision invisible hitboxes for bullet raycasting
    this.setupHitboxes();
  }

  setupHitboxes() {
    // Clear previous hitboxes
    for (const hb of this.hitboxes) {
      this.mesh.remove(hb);
    }
    this.hitboxes.length = 0;

    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    // 1. Head Hitbox (CRITICAL HEADSHOT)
    const headH = (this.type === 'boss') ? 0.6 : 0.42;
    const headW = (this.type === 'boss') ? 0.55 : 0.38;
    const headGeo = new THREE.BoxGeometry(headW * this.scale, headH * this.scale, headW * this.scale);
    const headHitbox = new THREE.Mesh(headGeo, hitMat);
    headHitbox.position.y = (this.type === 'boss' ? 2.5 : 1.62) * this.scale;
    headHitbox.userData = { zombie: this, isHead: true };
    this.mesh.add(headHitbox);
    this.hitboxes.push(headHitbox);

    // 2. Torso Hitbox (BODY DAMAGE)
    const torsoW = (this.type === 'boss') ? 0.95 : 0.65;
    const torsoH = (this.type === 'boss') ? 1.3 : 0.9;
    const torsoD = (this.type === 'boss') ? 0.75 : 0.5;
    const torsoGeo = new THREE.BoxGeometry(torsoW * this.scale, torsoH * this.scale, torsoD * this.scale);
    const torsoHitbox = new THREE.Mesh(torsoGeo, hitMat);
    torsoHitbox.position.y = (this.type === 'boss' ? 1.45 : 1.0) * this.scale;
    torsoHitbox.userData = { zombie: this, isHead: false };
    this.mesh.add(torsoHitbox);
    this.hitboxes.push(torsoHitbox);

    // 3. Legs Hitbox (LOWER BODY)
    const legW = (this.type === 'boss') ? 0.7 : 0.48;
    const legH = (this.type === 'boss') ? 0.95 : 0.75;
    const legGeo = new THREE.BoxGeometry(legW * this.scale, legH * this.scale, legW * this.scale);
    const legHitbox = new THREE.Mesh(legGeo, hitMat);
    legHitbox.position.y = (legH * 0.5) * this.scale;
    legHitbox.userData = { zombie: this, isHead: false };
    this.mesh.add(legHitbox);
    this.hitboxes.push(legHitbox);
  }

  buildProceduralZombieMesh() {
    this.proceduralGroup = new THREE.Group();
    this.proceduralGroup.scale.set(this.scale, this.scale, this.scale);

    let skinColor = (this.type === 'boss') ? 0x221a2c : ((this.type === 'runner') ? 0x8da178 : 0x6b8f60);
    let shirtColor = (this.type === 'boss') ? 0x181024 : ((this.type === 'runner') ? 0x991b1b : 0x475569);
    let eyeColor = (this.type === 'boss') ? 0xff0033 : 0xff2222;

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.85 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.28), clothesMat);
    torso.position.y = 1.05;
    torso.userData = { zombie: this, isHead: false };
    this.proceduralGroup.add(torso);
    this.hitboxes.push(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), skinMat);
    head.position.y = 1.62;
    head.userData = { zombie: this, isHead: true };
    this.proceduralGroup.add(head);
    this.hitboxes.push(head);

    // Eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    leftEye.position.set(-0.08, 0.04, 0.16);
    head.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    rightEye.position.set(0.08, 0.04, 0.16);
    head.add(rightEye);

    // Limbs
    const armGeo = new THREE.BoxGeometry(0.14, 0.65, 0.14);
    armGeo.translate(0, -0.28, 0);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.32, 1.35, 0);
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.userData = { zombie: this, isHead: false };
    this.leftArmPivot.add(this.leftArm);
    this.proceduralGroup.add(this.leftArmPivot);
    this.hitboxes.push(this.leftArm);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.32, 1.35, 0);
    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.userData = { zombie: this, isHead: false };
    this.rightArmPivot.add(this.rightArm);
    this.proceduralGroup.add(this.rightArmPivot);
    this.hitboxes.push(this.rightArm);

    const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.16);
    legGeo.translate(0, -0.36, 0);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.9 });

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.13, 0.72, 0);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.userData = { zombie: this, isHead: false };
    this.leftLegPivot.add(this.leftLeg);
    this.proceduralGroup.add(this.leftLegPivot);
    this.hitboxes.push(this.leftLeg);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.13, 0.72, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.userData = { zombie: this, isHead: false };
    this.rightLegPivot.add(this.rightLeg);
    this.proceduralGroup.add(this.rightLegPivot);
    this.hitboxes.push(this.rightLeg);

    this.mesh.add(this.proceduralGroup);
  }

  tryUpgradeToRealAsset() {
    if (this.realAsset || !zombieAssets.isLoaded || !this.isAlive) return;
    const realInstance = createZombieInstance(this.type);
    if (realInstance) {
      this.setupRealAsset(realInstance);
    }
  }

  takeDamage(amount, isHeadshot) {
    if (!this.isAlive) return;

    this.health -= amount;

    // Recoil flinch
    this.mesh.position.y += 0.05;

    // Jurus Unik Boss Titan: Raungan Necromancer & Panggil 2 Runner saat HP <= 50%
    if (this.type === 'boss' && !this.hasSummonedRunners && this.health <= this.maxHealth * 0.5 && this.health > 0) {
      this.hasSummonedRunners = true;
      if (this.realAsset && this.realAsset.actions && this.realAsset.actions.roar) {
        playZombieAction(this.realAsset, 'roar', 0.2);
      }
      sound.playBossRoar();
      if (this.onBossRoarCallback) {
        this.onBossRoarCallback(this);
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.state = 'dead';

    // Clear hitboxes immediately so dead zombies cannot be shot or block raycasts
    for (const hb of this.hitboxes) {
      hb.userData = {};
    }
    this.hitboxes.length = 0;

    // Jurus Unik Toxic Stalker: Tinggalkan kabut racun hijau mematikan saat mati
    if (this.type === 'stalker' && this.onToxicDeathCallback) {
      this.onToxicDeathCallback(this.mesh.position.clone());
    }

    // Play skeletal death animation
    if (this.realAsset) {
      playZombieAction(this.realAsset, 'death', 0.1);
    }

    if (this.onDeathCallback) {
      this.onDeathCallback(this.mesh.position, this.type === 'boss', this);
    }
  }

  update(delta) {
    // Try upgrading to real FBX asset once assets finish loading
    if (!this.realAsset && zombieAssets.isLoaded && this.isAlive) {
      this.tryUpgradeToRealAsset();
    }

    // Update skeletal mixer
    if (this.realAsset && this.realAsset.mixer) {
      this.realAsset.mixer.update(delta);
    }

    const groundY = (this.environment && typeof this.environment.getTerrainHeight === 'function')
      ? this.environment.getTerrainHeight(this.mesh.position.x, this.mesh.position.z)
      : 0;

    // ------------------------------------------------------------------------
    // STATE: DEAD
    // ------------------------------------------------------------------------
    if (this.state === 'dead') {
      this.deathTimer += delta;

      if (this.realAsset) {
        // Skeletal animation handles collapse organically; sink after 2.4s
        if (this.deathTimer > 2.4) {
          this.mesh.position.y -= delta * 0.45;
        }
      } else {
        // Fallback procedural backward fall
        if (this.mesh.rotation.x > -Math.PI / 2) {
          this.mesh.rotation.x -= delta * 3.5;
          this.mesh.position.y = Math.max(groundY + 0.15, this.mesh.position.y - delta * 0.8);
        }
        if (this.deathTimer > 1.4) {
          this.mesh.position.y -= delta * 0.5;
        }
      }
      return;
    }

    // Walking / Chasing / Attacking: Adapt vertically to terrain height
    this.mesh.position.y = groundY;

    // Occasional groans
    this.groanTimer -= delta;
    if (this.groanTimer <= 0) {
      const distToPlayer = this.mesh.position.distanceTo(this.player.yawObject.position);
      if (distToPlayer < 28) {
        sound.playZombieGroan();
      }
      this.groanTimer = Math.random() * 8 + 5;
    }

    const playerPos = this.player.yawObject.position;
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const distanceToPlayer = Math.hypot(dx, dz);

    // Always rotate smoothly to face player (+Z forward vector)
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - this.mesh.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.mesh.rotation.y += angleDiff * Math.min(1, delta * 9);

    // ------------------------------------------------------------------------
    // STATE: ATTACK
    // ------------------------------------------------------------------------
    if (distanceToPlayer <= this.attackRange) {
      this.state = 'attack';

      if (this.realAsset) {
        playZombieAction(this.realAsset, 'attack', 0.15);
      } else if (this.leftArmPivot && this.rightArmPivot) {
        this.attackTimer += delta;
        const clawPhase = Math.sin(this.attackTimer * 6);
        this.leftArmPivot.rotation.x = -Math.PI / 2 + clawPhase * 0.5;
        this.rightArmPivot.rotation.x = -Math.PI / 2 - clawPhase * 0.5;
      }

      // Strike player on attack cooldown
      this.attackTimer += delta;
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

      if (this.realAsset) {
        const moveAction = (this.type === 'runner') ? 'run' : 'walk';
        playZombieAction(this.realAsset, moveAction, 0.2);
      }

      // Movement vector toward player
      const dirX = dx / (distanceToPlayer || 1);
      const dirZ = dz / (distanceToPlayer || 1);

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

      // Procedural limb swing fallback
      if (!this.realAsset && this.leftLegPivot && this.rightLegPivot) {
        this.walkCycle += delta * this.speed * 3.5;
        const legSwing = Math.sin(this.walkCycle) * 0.5;
        this.leftLegPivot.rotation.x = legSwing;
        this.rightLegPivot.rotation.x = -legSwing;
        this.leftArmPivot.rotation.x = -Math.PI / 2.6 + Math.sin(this.walkCycle) * 0.15;
        this.rightArmPivot.rotation.x = -Math.PI / 2.6 - Math.sin(this.walkCycle) * 0.15;
      }
    }
  }

  isFullyDisposed() {
    return this.state === 'dead' && this.deathTimer >= this.deathDuration;
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.hitboxes.length = 0;
    if (this.realAsset && this.realAsset.mixer) {
      this.realAsset.mixer.stopAllAction();
    }
  }
}

// ============================================================================
// KABUT RACUN TOXIC STALKER (POISON MIST CLOUD)
// Menimbulkan DoT (Damage over Time) jika pemain berada di dalam lingkaran kabut
// ============================================================================
export class PoisonCloud {
  constructor(scene, player, position) {
    this.scene = scene;
    this.player = player;
    this.position = (position && position.clone)
      ? position.clone()
      : new THREE.Vector3(position?.x || 0, position?.y || 0, position?.z || 0);
    this.radius = 2.6;
    this.duration = 6.5; // Durasi bertahan 6.5 detik
    this.timer = 0;
    this.damageTimer = 0;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Lingkaran tanah beracun berkilau hijau
    const ringGeo = new THREE.RingGeometry(0.3, this.radius, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    this.group.add(ring);

    // Silinder kabut gas beracun
    const cylGeo = new THREE.CylinderGeometry(this.radius * 0.9, this.radius, 1.8, 16, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = 0.9;
    this.group.add(cyl);

    this.scene.add(this.group);
  }

  update(delta) {
    this.timer += delta;
    this.group.rotation.y += delta * 0.4;
    const remaining = this.duration - this.timer;
    if (remaining < 1.5) {
      this.group.scale.multiplyScalar(Math.max(0.01, 1 - delta * 0.7));
    }

    // Periksa apakah pemain berada di dalam radius kabut
    const pPos = this.player.yawObject.position;
    const dist = Math.hypot(pPos.x - this.position.x, pPos.z - this.position.z);
    if (dist <= this.radius && Math.abs(pPos.y - this.position.y) < 2.5) {
      this.damageTimer += delta;
      if (this.damageTimer >= 0.5) {
        this.damageTimer = 0;
        this.player.takeDamage(4); // 8 Damage per detik
      }
    }
    return this.timer >= this.duration;
  }

  destroy() {
    this.scene.remove(this.group);
  }
}

export class ZombiesManager {
  constructor(scene, environment, player, onZombieKilled, onBossRoar = null) {
    this.scene = scene;
    this.environment = environment;
    this.player = player;
    this.onZombieKilled = onZombieKilled;
    this.onBossRoar = onBossRoar;
    this.zombies = [];
    this.poisonClouds = [];

    // Preload zombie FBX assets & textures early
    initZombieAssets().catch(err => {
      console.warn("Zombie assets preload warning:", err);
    });
  }

  spawnZombie(config) {
    const zombie = new Zombie(this.scene, this.environment, this.player, config, (pos, isBoss, zInstance) => {
      if (this.onZombieKilled) {
        this.onZombieKilled(pos || zombie.mesh.position, isBoss, zInstance || zombie);
      }
    });

    // Pasang callback Boss Roar
    zombie.onBossRoarCallback = (bossInst) => {
      // Panggil 2 Runner di samping kanan & kiri Boss
      const bx = bossInst.mesh.position.x;
      const bz = bossInst.mesh.position.z;
      this.spawnZombie({ type: 'runner', x: bx + 3.0, z: bz + 1.5 });
      this.spawnZombie({ type: 'runner', x: bx - 3.0, z: bz - 1.5 });

      if (this.onBossRoar) {
        this.onBossRoar(bossInst);
      }
    };

    // Pasang callback Toxic Stalker Death
    zombie.onToxicDeathCallback = (pos) => {
      const cloud = new PoisonCloud(this.scene, this.player, pos);
      this.poisonClouds.push(cloud);
    };

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
    // Update active poison clouds
    for (let i = this.poisonClouds.length - 1; i >= 0; i--) {
      const cloud = this.poisonClouds[i];
      const isExpired = cloud.update(delta);
      if (isExpired) {
        cloud.destroy();
        this.poisonClouds.splice(i, 1);
      }
    }

    // Soft zombie-to-zombie repulsion to prevent unnatural stacking
    for (let i = 0; i < this.zombies.length; i++) {
      const z1 = this.zombies[i];
      if (!z1.isAlive) continue;
      for (let j = i + 1; j < this.zombies.length; j++) {
        const z2 = this.zombies[j];
        if (!z2.isAlive) continue;
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

    for (let i = 0; i < this.poisonClouds.length; i++) {
      this.poisonClouds[i].destroy();
    }
    this.poisonClouds = [];
  }
}
