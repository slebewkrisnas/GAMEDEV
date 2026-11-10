// ============================================================================
// DEAD ZONE — UNLIMITED SURVIVAL & BOSS SPAWN ENGINE
// Implements continuous randomized zombie spawning, diverse zombie variants
// (Fast Runner, Slow Heavy Tank, Balanced Walker, Toxic Stalker),
// and a colossal Boss Zombie encounter every 10 kills with massive Rp rewards.
// ============================================================================

import { sound } from './audio.js';
import { GameState, ITEMS } from './gameState.js';

export class WaveManager {
  constructor(zombiesManager, environment, player, uiManager, onVictoryCallback) {
    this.zombiesManager = zombiesManager;
    this.environment = environment;
    this.player = player;
    this.uiManager = uiManager;
    this.onVictoryCallback = onVictoryCallback;
    this.lootManager = null;
    this.weaponManager = null;

    // Pasang listener jika Boss meraung memanggil 2 runner
    if (this.zombiesManager) {
      this.zombiesManager.onBossRoar = (bossInst) => {
        this.uiManager.showAnnouncement(
          "⚠️ RAUNGAN TITAN MUTAN!",
          "Boss meraung keras dan memanggil 2 Runner mutan ke medan laga!",
          3.5
        );
      };
    }

    // Survival progression
    this.totalKills = 0;
    this.waveInProgress = false;

    // Concurrent population cap
    this.targetConcurrentZombies = 8;
    this.spawnInterval = 1.6; // Seconds between spawns
    this.spawnTimer = 0.5;

    // Boss state tracking
    this.bossActive = false;
    this.currentBoss = null;

    // Wide perimeter candidate spawn points across the 230m x 230m forest
    this.spawnPoints = [
      { x: -55, z: -45 },
      { x: 55, z: -45 },
      { x: -75, z: 10 },
      { x: 75, z: 10 },
      { x: -50, z: 65 },
      { x: 50, z: 65 },
      { x: 0, z: 75 },
      { x: -30, z: 90 },
      { x: 30, z: 90 },
      { x: -70, z: -25 },
      { x: 70, z: -15 },
      { x: -20, z: 20 },
      { x: 25, z: 20 },
      { x: -60, z: -70 },
      { x: 60, z: -70 },
      { x: -80, z: 40 },
      { x: 80, z: 40 },
      { x: -15, z: 50 },
      { x: 15, z: 50 }
    ];
  }

  // Start the unlimited survival mode in Sector-7
  startWave(waveNum = 1) {
    this.waveInProgress = true;
    this.spawnTimer = 0.3;

    sound.playWaveStart();

    // Initial burst of 3 zombies
    for (let i = 0; i < 3; i++) {
      this.spawnRandomZombie();
    }

    this.uiManager.showAnnouncement(
      "PERBURUAN HUTAN DIMULAI",
      "Mutan Unlimited · Kalahkan 10 zombie untuk memanggil Boss Titan!",
      4.0
    );

    this.updateHUD();
  }

  // Randomly roll zombie variant based on weighted chances
  getRandomZombieConfig() {
    const roll = Math.random();

    // 1. Runner (30%): Fast, low damage (jalan cepat, damage lebih kecil)
    if (roll < 0.30) {
      return {
        type: 'runner',
        hp: 55,
        speed: 3.9,
        damage: 8,
        scale: 0.88
      };
    }
    // 2. Tank / Brute (25%): Slow, high damage (jalan lambat, damage lumayan besar)
    else if (roll < 0.55) {
      return {
        type: 'tank',
        hp: 175,
        speed: 1.6,
        damage: 25,
        scale: 1.35
      };
    }
    // 3. Stalker / Toxic (10%): Toxic lurker
    else if (roll < 0.65) {
      return {
        type: 'stalker',
        hp: 95,
        speed: 2.8,
        damage: 16,
        scale: 1.05
      };
    }
    // 4. Walker (35%): Standard balanced
    else {
      return {
        type: 'walker',
        hp: 80,
        speed: 2.2,
        damage: 13,
        scale: 1.0
      };
    }
  }

  // Spawn a single randomized zombie into the forest
  spawnRandomZombie() {
    if (!this.zombiesManager) return;
    const config = this.getRandomZombieConfig();
    const spawnPos = this.getValidSpawnPosition();

    config.x = spawnPos.x;
    config.z = spawnPos.z;

    this.zombiesManager.spawnZombie(config);
  }

  // Spawn Colossal Boss Zombie (Titan Aberration)
  spawnBoss() {
    if (!this.zombiesManager) return;
    this.bossActive = true;

    const spawnPos = this.getValidSpawnPosition(25); // Spawn at least 25m away
    const bossConfig = {
      type: 'boss',
      hp: 650,
      speed: 2.4,
      damage: 38, // Jauh lebih sakit!
      scale: 2.6, // Ukuran jauh lebih besar!
      x: spawnPos.x,
      z: spawnPos.z
    };

    const boss = this.zombiesManager.spawnZombie(bossConfig);
    this.currentBoss = boss;

    sound.playBossRoar();

    this.uiManager.showAnnouncement(
      "⚠️ TITAN MUTAN TELAH BANGKIT! ⚠️",
      "BOSS ZOMBIE MUNCUL — Kalahkan untuk Hadiah Rp 200.000!",
      4.5
    );

    this.updateHUD();
  }

  // Finds a valid spawn position far enough from player and with clear collision
  getValidSpawnPosition(minDist = 18) {
    const playerPos = this.player ? this.player.yawObject.position : { x: 0, z: 0 };
    const candidates = [...this.spawnPoints].sort(() => Math.random() - 0.5);

    for (let i = 0; i < candidates.length; i++) {
      const pt = candidates[i];
      const dist = Math.hypot(pt.x - playerPos.x, pt.z - playerPos.z);
      if (dist >= minDist && !this.environment.checkCollision(pt.x, pt.z, 1.2)) {
        return {
          x: pt.x + (Math.random() - 0.5) * 6,
          z: pt.z + (Math.random() - 0.5) * 6
        };
      }
    }

    // Fallback safe forest coordinate
    const angle = Math.random() * Math.PI * 2;
    return {
      x: playerPos.x + Math.cos(angle) * 35,
      z: playerPos.z + Math.sin(angle) * 35
    };
  }

  // Handle zombie elimination event
  onZombieKilled(pos, isBoss = false, zombieInstance = null) {
    this.totalKills++;

    const zType = zombieInstance ? zombieInstance.type : (isBoss ? 'boss' : 'walker');

    // Catat progress kontrak buruan di alun-alun desa
    if (zType === 'runner') {
      GameState.recordBountyProgress('runner', 1);
    } else if (zType === 'tank' || zType === 'brute') {
      GameState.recordBountyProgress('tank', 1);
    }

    if (isBoss || zType === 'boss') {
      // Boss Defeated!
      this.bossActive = false;
      this.currentBoss = null;

      sound.playBossDeath();

      // Hadiah Boss Diubah Menjadi Barang Fisik di Ransel: Inti Titan (Rp 200.000)
      // Pemain wajib berhasil evakuasi hidup-hidup ke Desa Asri untuk menjualnya!
      const titanCore = { ...ITEMS.TITAN_CORE };
      let addedToBag = false;
      if (GameState.backpack.length < GameState.backpackMaxSlots) {
        GameState.addItemToBackpack(titanCore);
        addedToBag = true;
      } else if (this.lootManager && pos) {
        this.lootManager.spawnSpecificDrop(pos, titanCore);
      }

      // 4x Rare Loot Drops
      if (this.lootManager && pos) {
        this.lootManager.spawnDrop(pos, true);
      }

      // Bonus Ammo Terbatas (Hanya 1 Kotak 24 peluru, tidak lagi +36 ke semua senjata)
      if (this.weaponManager) {
        this.weaponManager.resupplyAmmo(24);
        setTimeout(() => sound.playAmmoResupply(), 600);
      }

      this.uiManager.showAnnouncement(
        "🏆 BOSS TITAN TELAH TUMBANG!",
        addedToBag
          ? "Inti Titan (Rp 200.000) masuk ke ransel! Segera evakuasi ke Desa Asri untuk mencairkannya!"
          : "Ransel penuh! Inti Titan (Rp 200.000) terjatuh di tanah dekat bangkai Boss!",
        5.5
      );
      this.uiManager.updateHUD();
    } else {
      // Regular Zombie Drop
      if (this.lootManager && pos) {
        this.lootManager.spawnDrop(pos, false);
      }

      // Check if 10 kills reached -> Trigger Boss Zombie!
      if (this.totalKills > 0 && this.totalKills % 10 === 0 && !this.bossActive) {
        setTimeout(() => {
          if (this.waveInProgress && !this.bossActive) {
            this.spawnBoss();
          }
        }, 1200);
      }
    }

    this.updateHUD();
  }

  update(delta) {
    if (!this.waveInProgress || !this.zombiesManager) return;

    // Check current active zombie count
    const activeZombies = this.zombiesManager.getActiveCount();

    // Maintain continuous population in the forest
    if (activeZombies < this.targetConcurrentZombies) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnRandomZombie();
        this.spawnTimer = Math.random() * 1.5 + 1.2; // 1.2s to 2.7s between spawns
      }
    }

    // Check boss health status for HUD readout
    let bossInfo = null;
    if (this.bossActive && this.currentBoss && this.currentBoss.isAlive) {
      bossInfo = {
        hp: this.currentBoss.health,
        maxHp: this.currentBoss.maxHealth,
        isAlive: true
      };
    } else if (this.bossActive && (!this.currentBoss || !this.currentBoss.isAlive)) {
      this.bossActive = false;
      this.currentBoss = null;
    }

    this.updateHUD(activeZombies, bossInfo);
  }

  updateHUD(activeCount = null, bossInfo = null) {
    const active = (activeCount !== null) ? activeCount : (this.zombiesManager ? this.zombiesManager.getActiveCount() : 0);
    this.uiManager.updateWaveInfo(1, 1, active, this.totalKills, bossInfo);
  }

  reset() {
    this.totalKills = 0;
    this.waveInProgress = false;
    this.spawnTimer = 0;
    this.bossActive = false;
    this.currentBoss = null;
  }
}
