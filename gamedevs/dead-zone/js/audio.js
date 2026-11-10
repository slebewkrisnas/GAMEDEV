// ============================================================================
// DEAD ZONE — PROCEDURAL WEB AUDIO SYNTHESIZER
// 100% self-contained synthesized sound effects without external audio files
// ============================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.8;
    this.isMuted = false;
    this.lastStepTime = 0;
    this.isLeftFoot = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("AudioContext initialization error:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // Gunshot: White noise blast + fast decaying pitch sine + lowpass filter
  playPistolShot() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Noise blast for explosive pop
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Heavy kick oscillator (punch)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Empty magazine click
  playDryFire() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Tactical reload mechanical clicks
  playReload() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Mag out click at 0.1s
    this._playClick(now + 0.1, 750, 0.05, 0.4);
    // Mag insert clack at 0.7s
    this._playClick(now + 0.7, 500, 0.06, 0.5);
    // Slide rack snap at 1.1s
    this._playClick(now + 1.1, 1200, 0.07, 0.6);
  }

  // Ammo crate / resupply secured sound (double metallic click)
  playAmmoResupply() {
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this._playClick(now, 880, 0.06, 0.5);
    this._playClick(now + 0.1, 1320, 0.08, 0.6);
  }

  _playClick(time, freq, duration, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  // Bullet impact on zombie (flesh thud)
  playZombieHurt() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Headshot high-pitch critical ping
  playHeadshot() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.15);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Zombie groan / growl
  playZombieGroan() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  // Zombie attack swing
  playZombieAttack() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Player hurt damage impact
  playPlayerHurt() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Boss Zombie deep thunderous terrifying roar
  playBossRoar() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sawtooth";
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.linearRampToValueAtTime(35, now + 1.2);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = "lowpass";
    subFilter.frequency.setValueAtTime(220, now);
    subFilter.frequency.linearRampToValueAtTime(120, now + 1.2);

    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 1.25);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 1.3);

    // Mid-range distorted growl
    const growl = this.ctx.createOscillator();
    const growlGain = this.ctx.createGain();
    growl.type = "sawtooth";
    growl.frequency.setValueAtTime(140, now);
    growl.frequency.exponentialRampToValueAtTime(50, now + 0.9);

    growlGain.gain.setValueAtTime(0.6, now);
    growlGain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);

    growl.connect(growlGain);
    growlGain.connect(this.masterGain);
    growl.start(now);
    growl.stop(now + 1.0);
  }

  // Boss death victory impact
  playBossDeath() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 1.5);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Wave start siren
  playWaveStart() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(480, now + 0.4);
    osc.frequency.linearRampToValueAtTime(320, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.95);
  }

  // Wave victory fanfare
  playWaveClear() {
    if (!this.ctx) return;
    this.resume();
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const time = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.38);
    });
  }

  // Game over death drone
  playGameOver() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 1.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.9);
  }

  // Suara Tegukan Botol Kaca Ramuan Jamu Herbal Tradisional Pedesaan
  playStimSound() {
    this.playHerbalGulp();
  }

  playHerbalGulp() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 1. Bunyi Pembuka Tutup Botol Kaca (Cork / Glass Pop)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = "sine";
    popOsc.frequency.setValueAtTime(820, now);
    popOsc.frequency.exponentialRampToValueAtTime(240, now + 0.05);
    popGain.gain.setValueAtTime(0.35, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    popOsc.connect(popGain);
    popGain.connect(this.masterGain);
    popOsc.start(now);
    popOsc.stop(now + 0.07);

    // 2. Tegukan Cairan Pertama (Gulp 1)
    const gulp1 = this.ctx.createOscillator();
    const gulp1Gain = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = "bandpass";
    filter1.frequency.setValueAtTime(380, now + 0.08);
    filter1.Q.setValueAtTime(4.0, now + 0.08);

    gulp1.type = "triangle";
    gulp1.frequency.setValueAtTime(440, now + 0.08);
    gulp1.frequency.exponentialRampToValueAtTime(280, now + 0.18);
    gulp1Gain.gain.setValueAtTime(0.001, now + 0.08);
    gulp1Gain.gain.linearRampToValueAtTime(0.45, now + 0.11);
    gulp1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.19);

    gulp1.connect(filter1);
    filter1.connect(gulp1Gain);
    gulp1Gain.connect(this.masterGain);
    gulp1.start(now + 0.08);
    gulp1.stop(now + 0.20);

    // 3. Tegukan Cairan Kedua (Gulp 2)
    const gulp2 = this.ctx.createOscillator();
    const gulp2Gain = this.ctx.createGain();
    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.setValueAtTime(480, now + 0.22);
    filter2.Q.setValueAtTime(4.0, now + 0.22);

    gulp2.type = "triangle";
    gulp2.frequency.setValueAtTime(510, now + 0.22);
    gulp2.frequency.exponentialRampToValueAtTime(320, now + 0.33);
    gulp2Gain.gain.setValueAtTime(0.001, now + 0.22);
    gulp2Gain.gain.linearRampToValueAtTime(0.5, now + 0.25);
    gulp2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);

    gulp2.connect(filter2);
    filter2.connect(gulp2Gain);
    gulp2Gain.connect(this.masterGain);
    gulp2.start(now + 0.22);
    gulp2.stop(now + 0.35);

    // 4. Resonansi Hangat Pemulihan Herbal (+40 HP Satiation)
    [174.61, 220.00, 261.63].forEach((f, idx) => {
      const hOsc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();
      hOsc.type = "sine";
      hOsc.frequency.setValueAtTime(f, now + 0.34);
      hGain.gain.setValueAtTime(0.001, now + 0.34);
      hGain.gain.linearRampToValueAtTime(0.18, now + 0.45);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      hOsc.connect(hGain);
      hGain.connect(this.masterGain);
      hOsc.start(now + 0.34);
      hOsc.stop(now + 0.88);
    });
  }

  // Rupiah Electronic Coin Chime
  playCoinSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.28);
    });
  }

  // Teleport / Air-Lock Warp Sound
  playTeleportSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.5);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  // Looting item sound
  playLootSound() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * 0.05;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.22);
    });
  }

  // Shotgun Shot: Heavy bass punch + wider noisy blast + prolonged boom
  playShotgunShot() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(900, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    oscGain.gain.setValueAtTime(1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Automatic Rifle Shot: Sharp, high-speed military crack
  playRifleShot() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.09);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(2200, now);
    noiseFilter.Q.setValueAtTime(2.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Weapon switch click
  playWeaponSwitch() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this._playClick(now, 1100, 0.04, 0.4);
    this._playClick(now + 0.05, 1600, 0.05, 0.5);
  }

  // Natural Human Footsteps (Langkah Kaki Natural Taktis)
  playFootstep(isSprinting = false) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const minInterval = isSprinting ? 0.23 : 0.35;
    if (now - this.lastStepTime < minInterval) return;
    this.lastStepTime = now;
    this.isLeftFoot = !this.isLeftFoot;

    try {
      const stepRnd = 0.88 + Math.random() * 0.24;
      const baseThumpFreq = this.isLeftFoot ? 68 : 62;
      const baseScuffFreq = this.isLeftFoot ? 490 : 440;

      // 1. Lapisan Hentakan Tumit Sepatu & Bobot Tubuh (Sub-Thump)
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(baseThumpFreq + (isSprinting ? 12 : 0), now);
      thumpOsc.frequency.exponentialRampToValueAtTime(26, now + 0.045);

      const thumpVol = (isSprinting ? 0.20 : 0.13) * stepRnd;
      thumpGain.gain.setValueAtTime(0.001, now);
      thumpGain.gain.linearRampToValueAtTime(thumpVol, now + 0.003);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.masterGain);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.05);

      // 2. Lapisan Gesekan Sol Sepatu pada Permukaan Tanah/Hutan (Granular Texture)
      const bufSize = Math.floor(this.ctx.sampleRate * 0.055);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.011));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandFilter = this.ctx.createBiquadFilter();
      bandFilter.type = 'bandpass';
      bandFilter.frequency.setValueAtTime(baseScuffFreq + (Math.random() - 0.5) * 50, now);
      bandFilter.Q.setValueAtTime(1.8, now);

      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(1250, now);

      const noiseGain = this.ctx.createGain();
      const scuffVol = (isSprinting ? 0.22 : 0.14) * stepRnd;
      noiseGain.gain.setValueAtTime(scuffVol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(bandFilter);
      bandFilter.connect(lowFilter);
      lowFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);

      // 3. Lapisan Desiran Celana & Pakaian Taktis (Cloth Rustle)
      const clothBufSize = Math.floor(this.ctx.sampleRate * 0.035);
      const clothBuf = this.ctx.createBuffer(1, clothBufSize, this.ctx.sampleRate);
      const clothData = clothBuf.getChannelData(0);
      for (let i = 0; i < clothBufSize; i++) {
        clothData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
      }
      const clothNoise = this.ctx.createBufferSource();
      clothNoise.buffer = clothBuf;

      const clothFilter = this.ctx.createBiquadFilter();
      clothFilter.type = 'highpass';
      clothFilter.frequency.setValueAtTime(800, now);

      const clothGain = this.ctx.createGain();
      clothGain.gain.setValueAtTime(0.04 * stepRnd, now);
      clothGain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      clothNoise.connect(clothFilter);
      clothFilter.connect(clothGain);
      clothGain.connect(this.masterGain);
      clothNoise.start(now);
    } catch (e) {}
  }

  // Natural Jump Launch (Tolakan Lompatan Alami)
  playJump() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      // 1. Dorongan & Tolakan Kaki pada Permukaan Tanah (Sub-Spring Launch)
      const pushOsc = this.ctx.createOscillator();
      const pushGain = this.ctx.createGain();
      pushOsc.type = 'triangle';
      pushOsc.frequency.setValueAtTime(74, now);
      pushOsc.frequency.exponentialRampToValueAtTime(26, now + 0.065);

      pushGain.gain.setValueAtTime(0.001, now);
      pushGain.gain.linearRampToValueAtTime(0.24, now + 0.004);
      pushGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      pushOsc.connect(pushGain);
      pushGain.connect(this.masterGain);
      pushOsc.start(now);
      pushOsc.stop(now + 0.075);

      // 2. Gesekan Sol Lepas Landas (Sole Traction Friction)
      const scuffSize = Math.floor(this.ctx.sampleRate * 0.045);
      const scuffBuffer = this.ctx.createBuffer(1, scuffSize, this.ctx.sampleRate);
      const scuffData = scuffBuffer.getChannelData(0);
      for (let i = 0; i < scuffSize; i++) {
        scuffData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.012));
      }
      const scuffNoise = this.ctx.createBufferSource();
      scuffNoise.buffer = scuffBuffer;

      const scuffFilter = this.ctx.createBiquadFilter();
      scuffFilter.type = 'bandpass';
      scuffFilter.frequency.setValueAtTime(460, now);
      scuffFilter.Q.setValueAtTime(2.0, now);

      const scuffGain = this.ctx.createGain();
      scuffGain.gain.setValueAtTime(0.16, now);
      scuffGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      scuffNoise.connect(scuffFilter);
      scuffFilter.connect(scuffGain);
      scuffGain.connect(this.masterGain);
      scuffNoise.start(now);

      // 3. Desiran Udara & Kibasan Pakaian Saat Melompat (Body Whoosh)
      const whooshSize = Math.floor(this.ctx.sampleRate * 0.16);
      const whooshBuffer = this.ctx.createBuffer(1, whooshSize, this.ctx.sampleRate);
      const whooshData = whooshBuffer.getChannelData(0);
      for (let i = 0; i < whooshSize; i++) {
        const envelope = Math.sin((i / whooshSize) * Math.PI);
        whooshData[i] = (Math.random() * 2 - 1) * envelope;
      }
      const whooshNoise = this.ctx.createBufferSource();
      whooshNoise.buffer = whooshBuffer;

      const whooshFilter = this.ctx.createBiquadFilter();
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(240, now);
      whooshFilter.frequency.exponentialRampToValueAtTime(520, now + 0.13);
      whooshFilter.Q.setValueAtTime(1.5, now);

      const whooshGain = this.ctx.createGain();
      whooshGain.gain.setValueAtTime(0.001, now);
      whooshGain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      whooshNoise.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(this.masterGain);
      whooshNoise.start(now);
    } catch (e) {}
  }

  // Natural Landing Impact (Hentakan Mendarat Alami)
  playLand() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      // 1. Hentakan Beban Berat Tubuh Mendarat di Tanah (Heavy Footing Thump)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(88, now);
      osc.frequency.exponentialRampToValueAtTime(24, now + 0.095);

      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(0.32, now + 0.003);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.10);

      // 2. Kerikil & Kompresi Sol Sepatu Dobel Mendarat (Two-Stage Sole Crunch)
      const bufSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);

      // 3. Kibasan Pakaian & Tekuk Lutut Meredam (Cloth Cushion)
      const cushionBufSize = Math.floor(this.ctx.sampleRate * 0.07);
      const cushionBuf = this.ctx.createBuffer(1, cushionBufSize, this.ctx.sampleRate);
      const cData = cushionBuf.getChannelData(0);
      for (let i = 0; i < cushionBufSize; i++) {
        cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }
      const cNoise = this.ctx.createBufferSource();
      cNoise.buffer = cushionBuf;

      const cFilter = this.ctx.createBiquadFilter();
      cFilter.type = 'bandpass';
      cFilter.frequency.setValueAtTime(360, now);
      cFilter.Q.setValueAtTime(1.4, now);

      const cGain = this.ctx.createGain();
      cGain.gain.setValueAtTime(0.12, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      cNoise.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(this.masterGain);
      cNoise.start(now);
    } catch (e) {}
  }
}

export const sound = new SoundManager();
