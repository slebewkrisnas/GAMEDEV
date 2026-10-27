/* ============================================================
   WORLD AUDIO SYSTEM — PROCEDURAL WEB AUDIO API ENGINE
   Zero external dependencies, zero file downloads, instant load.
   Provides footsteps, jumps, landings, portal warps, and dynamic
   cross-fading ambient soundscapes across the 3D zones.
   ============================================================ */

class WorldAudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;

    // Settings state
    const savedVol = localStorage.getItem('game_audio_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 0.65;
    this.isMuted = localStorage.getItem('game_audio_muted') === 'true';

    // Step state tracking
    this.lastStepTime = 0;
    this.isLeftFoot = false;

    // Ambient channels
    this.ambienceNodes = null;
    this.isInitialized = false;

    // Zone coordinates for spatial cross-fade
    this.ZONES = {
      farm: { x: -38, z: 22, radius: 24 },
      camp: { x: 42, z: -12, radius: 26 },
      arena: { x: 30, z: 22, radius: 22 },
      plaza: { x: 0, z: 0, radius: 25 }
    };
  }

  // Inisialisasi AudioContext saat interaksi pengguna pertama
  init() {
    if (this.isInitialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      this.ctx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambience Bus
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      // Mulai ambient procedural generator
      this.setupAmbience();

      this.isInitialized = true;
      console.log('World Audio System initialized smoothly.');
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /* ==================== 1. PROCEDURAL AMBIENCE ==================== */
  setupAmbience() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // --- A. Master Wind / Global Breeze (Noise pink/brownian) ---
    const bufferSize = this.ctx.sampleRate * 2.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.11;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(320, now);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.35, now);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambienceGain);
    windSource.start(now);

    // LFO untuk desau angin bernafas perlahan
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.18, now); // 0.18 Hz ayunan santai
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.setValueAtTime(140, now);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start(now);

    // --- B. Zone Specific Sub-Buses ---
    // 1. Kebun Ambience (Soft airy presence)
    const farmGain = this.ctx.createGain();
    farmGain.gain.setValueAtTime(0.01, now);
    farmGain.connect(this.ambienceGain);

    // 2. Kamp Tentara (Industrial low-frequency generator hum 60Hz + 120Hz)
    const campGain = this.ctx.createGain();
    campGain.gain.setValueAtTime(0.01, now);
    campGain.connect(this.ambienceGain);

    const humOsc1 = this.ctx.createOscillator();
    humOsc1.type = 'sawtooth';
    humOsc1.frequency.setValueAtTime(60, now);
    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(180, now);
    humOsc1.connect(humFilter);
    humFilter.connect(campGain);
    humOsc1.start(now);

    // 3. Arena Fight (Warm resonant torch drone 90Hz)
    const arenaGain = this.ctx.createGain();
    arenaGain.gain.setValueAtTime(0.01, now);
    arenaGain.connect(this.ambienceGain);

    const arenaOsc = this.ctx.createOscillator();
    arenaOsc.type = 'triangle';
    arenaOsc.frequency.setValueAtTime(95, now);
    const arenaFilter = this.ctx.createBiquadFilter();
    arenaFilter.type = 'lowpass';
    arenaFilter.frequency.setValueAtTime(220, now);
    arenaOsc.connect(arenaFilter);
    arenaFilter.connect(arenaGain);
    arenaOsc.start(now);

    this.ambienceNodes = {
      windGain,
      farmGain,
      campGain,
      arenaGain
    };
  }

  // Update posisi pemain untuk cross-fade halus antarzona
  update(delta, playerPos) {
    if (!this.isInitialized || !this.ambienceNodes || !playerPos) return;

    const px = playerPos.x;
    const pz = playerPos.z;

    const distFarm = Math.hypot(px - this.ZONES.farm.x, pz - this.ZONES.farm.z);
    const distCamp = Math.hypot(px - this.ZONES.camp.x, pz - this.ZONES.camp.z);
    const distArena = Math.hypot(px - this.ZONES.arena.x, pz - this.ZONES.arena.z);

    const targetFarm = Math.max(0, 1 - distFarm / this.ZONES.farm.radius) * 0.28;
    const targetCamp = Math.max(0, 1 - distCamp / this.ZONES.camp.radius) * 0.22;
    const targetArena = Math.max(0, 1 - distArena / this.ZONES.arena.radius) * 0.26;

    const t = this.ctx.currentTime;
    const rate = 0.08;
    this.ambienceNodes.farmGain.gain.setTargetAtTime(targetFarm, t, rate);
    this.ambienceNodes.campGain.gain.setTargetAtTime(targetCamp, t, rate);
    this.ambienceNodes.arenaGain.gain.setTargetAtTime(targetArena, t, rate);
  }

  /* ==================== 2. FOOTSTEPS ==================== */
  playFootstep(isSprinting = false) {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    const now = this.ctx.currentTime;
    // Anti-rapid spam guard
    const minInterval = isSprinting ? 0.22 : 0.34;
    if (now - this.lastStepTime < minInterval) return;
    this.lastStepTime = now;
    this.isLeftFoot = !this.isLeftFoot;

    try {
      // Noise component untuk tapak tanah/rumput
      const bufSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.012));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Filter: variasi pitch kaki kiri vs kaki kanan agar lebih hidup
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const baseFreq = this.isLeftFoot ? 720 : 660;
      const pitchJitter = (Math.random() - 0.5) * 60;
      filter.frequency.setValueAtTime(baseFreq + pitchJitter, now);
      filter.Q.setValueAtTime(1.4, now);

      // Low thump component
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const thudFreq = this.isLeftFoot ? 110 : 98;
      osc.frequency.setValueAtTime(thudFreq, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.04);

      const gain = this.ctx.createGain();
      const stepVol = (isSprinting ? 0.26 : 0.17) * (0.9 + Math.random() * 0.2);
      gain.gain.setValueAtTime(stepVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

      noise.connect(filter);
      filter.connect(gain);
      osc.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      osc.start(now);
      osc.stop(now + 0.05);

      // Cleanup
      setTimeout(() => {
        try {
          noise.disconnect();
          filter.disconnect();
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, 70);
    } catch (e) {}
  }

  /* ==================== 3. JUMP ==================== */
  playJump() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);

      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, 160);
    } catch (e) {}
  }

  /* ==================== 4. LAND ==================== */
  playLand() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    try {
      const now = this.ctx.currentTime;
      // Low impact thud
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);

      // Short noise crunch
      const bufSize = Math.floor(this.ctx.sampleRate * 0.06);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.095);

      setTimeout(() => {
        try {
          osc.disconnect();
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, 110);
    } catch (e) {}
  }

  /* ==================== 5. PORTAL WARP ==================== */
  playPortalWarp(type = 'default') {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();

    try {
      const now = this.ctx.currentTime;

      // Resonant dual sweep
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle';

      const baseStart = type === 'camp' ? 220 : (type === 'arena' ? 180 : 320);
      const baseEnd = type === 'camp' ? 560 : (type === 'arena' ? 440 : 780);

      osc1.frequency.setValueAtTime(baseStart, now);
      osc1.frequency.exponentialRampToValueAtTime(baseEnd, now + 0.7);

      osc2.frequency.setValueAtTime(baseStart * 1.5, now);
      osc2.frequency.exponentialRampToValueAtTime(baseEnd * 1.5, now + 0.7);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.86);

      setTimeout(() => {
        try {
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, 900);
    } catch (e) {}
  }

  /* ==================== 6. DIALOGUE & INTERACTION SFX ==================== */
  playDialogueChirp() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.13);
        setTimeout(() => {
          try { osc.disconnect(); gain.disconnect(); } catch (e) {}
        }, 300);
      });
    } catch (e) {}
  }

  /* ==================== 7. TROPHY FANFARE ==================== */
  playTrophyFanfare() {
    if (!this.ctx || this.isMuted) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.24, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.23);
        setTimeout(() => {
          try { osc.disconnect(); gain.disconnect(); } catch (e) {}
        }, 600);
      });
    } catch (e) {}
  }

  /* ==================== 8. VOLUME & MUTE CONTROL ==================== */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('game_audio_volume', this.volume.toString());
    } catch (e) {}

    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    try {
      localStorage.setItem('game_audio_muted', this.isMuted.toString());
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}

export const worldAudio = new WorldAudioSystem();
