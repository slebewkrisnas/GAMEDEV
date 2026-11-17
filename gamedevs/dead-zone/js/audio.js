// ============================================================================
// DEAD ZONE — PROCEDURAL WEB AUDIO SYNTHESIZER
// 100% self-contained synthesized sound effects without external audio files
// ============================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.zombieGain = null;
    this.ambientGain = null;

    // Default volume diturunkan dari 0.8 (terlalu keras) menjadi 0.35 (nyaman & balanced)
    this.volume = 0.35;
    this.sfxVolume = 0.85;
    this.zombieVolume = 0.80;
    this.ambientVolume = 0.65;
    this.isMuted = false;

    this.lastStepTime = 0;
    this.isLeftFoot = false;

    this.loadSettings();
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Gain Node (terhubung ke output audio speaker)
      this.masterGain = this.ctx.createGain();
      const initialMaster = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(initialMaster, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-channel: SFX (Tembakan, senjata, reload, impact, koin, UI)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Sub-channel: Zombi (Erangan, jeritan, serangan, roar Boss Titan)
      this.zombieGain = this.ctx.createGain();
      this.zombieGain.gain.setValueAtTime(this.zombieVolume, this.ctx.currentTime);
      this.zombieGain.connect(this.masterGain);

      // Sub-channel: Ambience (Langkah kaki, lompatan, desiran angin, sirine suar)
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
    } catch (e) {
      console.warn("AudioContext initialization error:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  // Pengatur Volume Utama (Master Volume: 0.0 - 1.0)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    this._applyVolumes();
    this.saveSettings();
  }

  // Pengatur Volume Efek Suara (SFX: 0.0 - 1.0)
  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this._applyVolumes();
    this.saveSettings();
  }

  // Pengatur Volume Zombi & Monster (0.0 - 1.0)
  setZombieVolume(vol) {
    this.zombieVolume = Math.max(0, Math.min(1, vol));
    this._applyVolumes();
    this.saveSettings();
  }

  // Pengatur Volume Lingkungan / Ambience (0.0 - 1.0)
  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    this._applyVolumes();
    this.saveSettings();
  }

  // Toggle Mute / Bisu Seketika
  setMuted(muted) {
    this.isMuted = !!muted;
    this._applyVolumes();
    this.saveSettings();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this._applyVolumes();
    this.saveSettings();
    return this.isMuted;
  }

  _applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      const targetVol = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetVol, now);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
    }
    if (this.zombieGain) {
      this.zombieGain.gain.setValueAtTime(this.zombieVolume, now);
    }
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, now);
    }
  }

  // Simpan preferensi volume ke localStorage agar tidak hilang saat refresh browser
  saveSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        const payload = {
          volume: this.volume,
          sfxVolume: this.sfxVolume,
          zombieVolume: this.zombieVolume,
          ambientVolume: this.ambientVolume,
          isMuted: this.isMuted
        };
        localStorage.setItem('deadzone_audio_settings', JSON.stringify(payload));
      }
    } catch (e) {}
  }

  // Muat preferensi volume tersimpan saat game pertama kali dijalankan
  loadSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('deadzone_audio_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.volume === 'number' && !isNaN(parsed.volume)) {
            this.volume = Math.max(0, Math.min(1, parsed.volume));
          }
          if (typeof parsed.sfxVolume === 'number' && !isNaN(parsed.sfxVolume)) {
            this.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
          }
          if (typeof parsed.zombieVolume === 'number' && !isNaN(parsed.zombieVolume)) {
            this.zombieVolume = Math.max(0, Math.min(1, parsed.zombieVolume));
          }
          if (typeof parsed.ambientVolume === 'number' && !isNaN(parsed.ambientVolume)) {
            this.ambientVolume = Math.max(0, Math.min(1, parsed.ambientVolume));
          }
          if (typeof parsed.isMuted === 'boolean') {
            this.isMuted = parsed.isMuted;
          }
        }
      }
    } catch (e) {}
  }

  // Nada uji coba lembut (C-E-G Chord Preview) untuk mengetes volume suara di menu
  playTestTone() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.32);
    });
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
    noiseGain.connect(this.sfxGain || this.masterGain);
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
    oscGain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Desert Eagle .50 AE: Heavy, authoritative punch with deep bass drop and snappy transient
  playDeagleShot() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Heavy noise explosive crack
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.038));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1150, now);
    noiseFilter.Q.setValueAtTime(1.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain || this.masterGain);
    noise.start(now);

    // 2. Powerful .50 caliber punch (sawtooth sub-bass drop 320 Hz -> 38 Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

    oscGain.gain.setValueAtTime(1.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  // AWP Sniper Rifle: Thunderous reverberating long-range supersonic concussion + bolt action cycling
  playAwpShot() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Supersonic crack transient
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.32);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.07));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(2400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(350, now + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.32);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain || this.masterGain);
    noise.start(now);

    // 2. Sub-bass shockwave thump (sine kick 115 Hz -> 26 Hz)
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kick.type = "sine";
    kick.frequency.setValueAtTime(115, now);
    kick.frequency.exponentialRampToValueAtTime(26, now + 0.35);

    kickGain.gain.setValueAtTime(1.3, now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    kick.connect(kickGain);
    kickGain.connect(this.sfxGain || this.masterGain);
    kick.start(now);
    kick.stop(now + 0.36);

    // 3. Mechanical bolt cycle sound after firing
    this._playClick(now + 0.42, 1600, 0.04, 0.35);
    this._playClick(now + 0.65, 1200, 0.05, 0.45);
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
    gain.connect(this.sfxGain || this.masterGain);
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
    gain.connect(this.sfxGain || this.masterGain);
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
    gain.connect(this.zombieGain || this.masterGain);
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
    gain.connect(this.sfxGain || this.masterGain);
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
    gain.connect(this.zombieGain || this.masterGain);
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
    gain.connect(this.zombieGain || this.masterGain);
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
    gain.connect(this.sfxGain || this.masterGain);
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
    subGain.connect(this.zombieGain || this.masterGain);
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
    growlGain.connect(this.zombieGain || this.masterGain);
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
    gain.connect(this.zombieGain || this.masterGain);
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
    gain.connect(this.ambientGain || this.masterGain);
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
      gain.connect(this.ambientGain || this.masterGain);
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
    gain.connect(this.ambientGain || this.masterGain);
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
    popGain.connect(this.sfxGain || this.masterGain);
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
    gulp1Gain.connect(this.sfxGain || this.masterGain);
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
    gulp2Gain.connect(this.sfxGain || this.masterGain);
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
      hGain.connect(this.sfxGain || this.masterGain);
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
      gain.connect(this.sfxGain || this.masterGain);
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
    gain.connect(this.sfxGain || this.masterGain);
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
      gain.connect(this.sfxGain || this.masterGain);
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
    noiseGain.connect(this.sfxGain || this.masterGain);
    noise.start(now);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    oscGain.gain.setValueAtTime(1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain || this.masterGain);
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
    noiseGain.connect(this.sfxGain || this.masterGain);
    noise.start(now);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain || this.masterGain);
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
      thumpGain.connect(this.ambientGain || this.masterGain);
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
      noiseGain.connect(this.ambientGain || this.masterGain);
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
      clothGain.connect(this.ambientGain || this.masterGain);
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
      pushGain.connect(this.ambientGain || this.masterGain);
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
      scuffGain.connect(this.ambientGain || this.masterGain);
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
      whooshGain.connect(this.ambientGain || this.masterGain);
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
      oscGain.connect(this.ambientGain || this.masterGain);
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
      noiseGain.connect(this.ambientGain || this.masterGain);
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
      cGain.connect(this.ambientGain || this.masterGain);
      cNoise.start(now);
    } catch (e) {}
  }

  // Detak Jantung Saat Sekarat (Low-HP Heartbeat Thump: Lub-Dub)
  playHeartbeat() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      // 1. "Lub" (ventricular contraction)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(56, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(this.ambientGain || this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // 2. "Dub" (aortic valve snap, ~140ms later)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(46, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(26, now + 0.26);

      gain2.gain.setValueAtTime(0.001, now + 0.14);
      gain2.gain.linearRampToValueAtTime(0.24, now + 0.155);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc2.connect(gain2);
      gain2.connect(this.ambientGain || this.masterGain);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.27);
    } catch (e) {}
  }

  // Ayunan Golok Pedesaan (Crisp Metallic Blade Air Whoosh)
  playMacheteSwing() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      const bufSize = Math.floor(this.ctx.sampleRate * 0.16);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.15);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      noise.start(now);
    } catch (e) {}
  }

  // Tebasan Golok Mengenai Zombi (Heavy Cleaver Impact)
  playMacheteHit() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      // 1. Meat & bone low thump
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.11);

      oscGain.gain.setValueAtTime(0.45, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain || this.masterGain);
      osc.start(now);
      osc.stop(now + 0.12);

      // 2. Blade slice flesh crunch
      const bufSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, now);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.masterGain);
      noise.start(now);
    } catch (e) {}
  }

  // Jebakan Ranjau Bambu Terpijak (Bamboo Spike Snap)
  playTrapSnap() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    try {
      // High wooden snap
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

      oscGain.gain.setValueAtTime(0.55, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain || this.masterGain);
      osc.start(now);
      osc.stop(now + 0.07);

      // Low wooden crack
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      subGain.gain.setValueAtTime(0.40, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      sub.connect(subGain);
      subGain.connect(this.sfxGain || this.masterGain);
      sub.start(now);
      sub.stop(now + 0.09);
    } catch (e) {}
  }

  // Sirine Suar Evakuasi Darurat (Holdout Extraction Siren)
  playExtractionSiren() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    this.stopExtractionSiren();

    try {
      const now = this.ctx.currentTime;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(650, now);

      // Modulate frequency up and down every 0.6s
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(1.6, now); // 1.6 Hz siren pulse
      lfoGain.gain.setValueAtTime(220, now); // ±220 Hz swing (430Hz to 870Hz)
      lfo.connect(this.sirenOsc.frequency);
      lfo.start(now);
      this.sirenLfo = lfo;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      this.sirenGain.gain.setValueAtTime(0.001, now);
      this.sirenGain.gain.linearRampToValueAtTime(0.25, now + 0.3);

      this.sirenOsc.connect(filter);
      filter.connect(this.sirenGain);
      this.sirenGain.connect(this.ambientGain || this.masterGain);
      this.sirenOsc.start(now);
    } catch (e) {}
  }

  stopExtractionSiren() {
    try {
      if (this.sirenGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.sirenGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        setTimeout(() => {
          if (this.sirenOsc) {
            try { this.sirenOsc.stop(); } catch (e) {}
            this.sirenOsc = null;
          }
          if (this.sirenLfo) {
            try { this.sirenLfo.stop(); } catch (e) {}
            this.sirenLfo = null;
          }
        }, 220);
      }
    } catch (e) {}
  }

  // Suara Fanfare Berhasil Evakuasi
  playExtractionSuccess() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const freqs = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.ambientGain || this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });
  }
}

export const sound = new SoundManager();
