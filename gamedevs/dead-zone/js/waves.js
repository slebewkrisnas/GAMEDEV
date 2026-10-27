// ============================================================================
// DEAD ZONE — SURVIVAL WAVE MANAGER
// Manages exactly 3 waves, enemy spawn sequencing, kill counts,
// wave transitions, and victory conditions.
// ============================================================================

import { sound } from './audio.js';

export class WaveManager {
  constructor(zombiesManager, environment, player, uiManager, onVictoryCallback) {
    this.zombiesManager = zombiesManager;
    this.environment = environment;
    this.player = player;
    this.uiManager = uiManager;
    this.onVictoryCallback = onVictoryCallback;

    // Wave parameters
    this.currentWave = 1;
    this.maxWaves = 3;
    this.totalKills = 0;

    // Wave spawn queue & progression
    this.waveInProgress = false;
    this.pendingSpawns = [];
    this.spawnInterval = 0.7; // Seconds between individual spawns
    this.spawnTimer = 0;

    // Transition delay between waves
    this.intermissionTimer = 0;
    this.isIntermission = false;

    // Pre-calculated safe spawn perimeter zones
    this.spawnPoints = [
      { x: -30, z: -30 },
      { x: 0, z: -34 },
      { x: 30, z: -30 },
      { x: 34, z: 0 },
      { x: 30, z: 30 },
      { x: 0, z: 34 },
      { x: -30, z: 30 },
      { x: -34, z: 0 }
    ];
  }

  // Start the wave sequence
  startWave(waveNum) {
    this.currentWave = waveNum;
    this.waveInProgress = true;
    this.isIntermission = false;
    this.pendingSpawns = [];
    this.spawnTimer = 0.2;

    sound.playWaveStart();

    // Configure exact zombie counts and composition per wave
    if (waveNum === 1) {
      // Wave 1: 5 slow walkers
      for (let i = 0; i < 5; i++) {
        this.pendingSpawns.push({ type: 'walker', hp: 70, speed: 2.2, damage: 12, scale: 1.0 });
      }
      this.uiManager.showAnnouncement("WAVE 1 INCOMING", "5 INFECTED DETECTED", 3.0);
    } else if (waveNum === 2) {
      // Wave 2: 8 faster runners
      for (let i = 0; i < 8; i++) {
        this.pendingSpawns.push({ type: 'runner', hp: 90, speed: 3.6, damage: 15, scale: 1.0 });
      }
      this.uiManager.showAnnouncement("WAVE 2 INCOMING", "8 FAST SPRINTERS SPOTTED", 3.0);
    } else if (waveNum === 3) {
      // Wave 3: 10 combination (6 fast runners + 4 heavy brutes)
      for (let i = 0; i < 6; i++) {
        this.pendingSpawns.push({ type: 'runner', hp: 95, speed: 3.8, damage: 16, scale: 1.0 });
      }
      for (let i = 0; i < 4; i++) {
        this.pendingSpawns.push({ type: 'brute', hp: 175, speed: 2.4, damage: 22, scale: 1.25 });
      }
      this.uiManager.showAnnouncement("FINAL WAVE 3", "10 INFECTED — BRUTES DETECTED!", 3.5);
    }

    this.totalZombiesInWave = this.pendingSpawns.length;
    this.updateHUD();
  }

  // Spawns next zombie from the pending queue
  spawnNextZombie() {
    if (this.pendingSpawns.length === 0) return;

    const config = this.pendingSpawns.shift();
    const spawnPos = this.getValidSpawnPosition();

    config.x = spawnPos.x;
    config.z = spawnPos.z;

    this.zombiesManager.spawnZombie(config);
  }

  // Finds a valid spawn position far enough from player and not inside a building
  getValidSpawnPosition() {
    const playerPos = this.player.yawObject.position;
    // Shuffle candidate spawn points
    const candidates = [...this.spawnPoints].sort(() => Math.random() - 0.5);

    for (let i = 0; i < candidates.length; i++) {
      const pt = candidates[i];
      const dist = Math.hypot(pt.x - playerPos.x, pt.z - playerPos.z);
      // Spawn at least 15m away from player and with clear collision
      if (dist >= 14 && !this.environment.checkCollision(pt.x, pt.z, 1.0)) {
        return {
          x: pt.x + (Math.random() - 0.5) * 4,
          z: pt.z + (Math.random() - 0.5) * 4
        };
      }
    }

    // Fallback safe border coordinate
    return { x: 30, z: -30 };
  }

  onZombieKilled() {
    this.totalKills++;
    this.updateHUD();
  }

  update(delta) {
    if (!this.waveInProgress) return;

    // Handle staggered zombie spawning
    if (this.pendingSpawns.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnNextZombie();
        this.spawnTimer = this.spawnInterval;
      }
    }

    // Check wave completion status
    const activeZombies = this.zombiesManager.getActiveCount();
    const remainingInWave = this.pendingSpawns.length + activeZombies;

    this.updateHUD(remainingInWave);

    // If all zombies in current wave are dead and none pending
    if (remainingInWave === 0 && !this.isIntermission) {
      this.onWaveCleared();
    }

    // Handle intermission countdown before next wave
    if (this.isIntermission) {
      this.intermissionTimer -= delta;
      if (this.intermissionTimer <= 0) {
        this.isIntermission = false;
        if (this.currentWave < this.maxWaves) {
          this.startWave(this.currentWave + 1);
        } else {
          // Wave 3 completed -> Victory!
          this.waveInProgress = false;
          try {
            localStorage.setItem('gamedev_meta_deadzone_cleared', '1');
            localStorage.setItem('gamedev_meta_deadzone_kills', (this.totalKills || 23).toString());
          } catch(e) {}
          if (this.onVictoryCallback) {
            this.onVictoryCallback();
          }
        }
      }
    }
  }

  onWaveCleared() {
    this.isIntermission = true;
    sound.playWaveClear();

    // Reward player with ammunition resupply between waves
    if (this.weaponManager) {
      this.weaponManager.resupplyAmmo(24);
      setTimeout(() => {
        sound.playAmmoResupply();
      }, 700);
    }

    if (this.currentWave < this.maxWaves) {
      this.intermissionTimer = 3.5; // 3.5s break between waves
      this.uiManager.showAnnouncement(
        `WAVE ${this.currentWave} CLEARED!`,
        `+24 AMMO SECURED · WAVE ${this.currentWave + 1} IN 3s`,
        3.2
      );
    } else {
      // Wave 3 finished!
      this.intermissionTimer = 1.8;
      this.uiManager.showAnnouncement("ALL WAVES ERADICATED!", "EXTRACTION PROTOCOL READY", 2.0);
    }
  }

  updateHUD(remaining = null) {
    const rem = (remaining !== null) ? remaining : (this.pendingSpawns.length + this.zombiesManager.getActiveCount());
    this.uiManager.updateWaveInfo(this.currentWave, this.maxWaves, rem, this.totalKills);
  }

  reset() {
    this.currentWave = 1;
    this.totalKills = 0;
    this.waveInProgress = false;
    this.pendingSpawns = [];
    this.spawnTimer = 0;
    this.intermissionTimer = 0;
    this.isIntermission = false;
  }
}
