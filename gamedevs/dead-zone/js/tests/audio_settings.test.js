// ============================================================================
// DEAD ZONE — AUDIO SETTINGS UNIT & INTEGRATION TEST
// Tests procedural volume control, sub-channels, muting, presets & persistence
// ============================================================================

import assert from 'node:assert';
import { sound } from '../audio.js';

console.log("--- RUNNING AUDIO SETTINGS TESTS ---");

// Test 1: Comfortable default volume (0.35, not 0.8)
assert.strictEqual(sound.volume, 0.35, "Default volume should be comfortable 0.35 (35%)");
assert.strictEqual(sound.isMuted, false, "Sound should start unmuted by default");
assert.strictEqual(sound.sfxVolume, 0.85, "Default SFX volume should be 0.85");
assert.strictEqual(sound.zombieVolume, 0.80, "Default Zombie volume should be 0.80");
assert.strictEqual(sound.ambientVolume, 0.65, "Default Ambient volume should be 0.65");
console.log("✓ Test 1: Default volume and subchannel levels passed");

// Test 2: Master Volume clamping
sound.setVolume(1.5);
assert.strictEqual(sound.volume, 1.0, "Volume should clamp to maximum 1.0");

sound.setVolume(-0.2);
assert.strictEqual(sound.volume, 0.0, "Volume should clamp to minimum 0.0");

sound.setVolume(0.5);
assert.strictEqual(sound.volume, 0.5, "Volume should set correctly to 0.5");
console.log("✓ Test 2: Volume clamping passed");

// Test 3: Subchannel volume setters
sound.setSfxVolume(0.7);
assert.strictEqual(sound.sfxVolume, 0.7, "SFX volume set to 0.7");
sound.setSfxVolume(2.0);
assert.strictEqual(sound.sfxVolume, 1.0, "SFX volume clamp to 1.0");

sound.setZombieVolume(0.6);
assert.strictEqual(sound.zombieVolume, 0.6, "Zombie volume set to 0.6");

sound.setAmbientVolume(0.4);
assert.strictEqual(sound.ambientVolume, 0.4, "Ambient volume set to 0.4");
console.log("✓ Test 3: Subchannel volume setters passed");

// Test 4: Mute and Toggle Mute
sound.setMuted(true);
assert.strictEqual(sound.isMuted, true, "Sound should be muted");

sound.toggleMute();
assert.strictEqual(sound.isMuted, false, "Toggle mute should unmute");

sound.toggleMute();
assert.strictEqual(sound.isMuted, true, "Toggle mute should mute again");

// Setting volume > 0 should automatically unmute
sound.setVolume(0.45);
assert.strictEqual(sound.isMuted, false, "Setting positive volume should clear isMuted flag");
assert.strictEqual(sound.volume, 0.45, "Volume updated to 0.45");
console.log("✓ Test 4: Mute and un-mute mechanics passed");

// Test 5: Persistence via localStorage mock
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

sound.setVolume(0.25);
sound.setSfxVolume(0.9);
sound.setZombieVolume(0.5);
sound.setAmbientVolume(0.3);
sound.setMuted(true);
sound.saveSettings();

const savedRaw = global.localStorage.getItem('deadzone_audio_settings');
assert.ok(savedRaw, "Settings should be saved in localStorage");
const saved = JSON.parse(savedRaw);
assert.strictEqual(saved.volume, 0.25);
assert.strictEqual(saved.sfxVolume, 0.9);
assert.strictEqual(saved.zombieVolume, 0.5);
assert.strictEqual(saved.ambientVolume, 0.3);
assert.strictEqual(saved.isMuted, true);

// Reset in memory and reload from storage
sound.volume = 1.0;
sound.isMuted = false;
sound.loadSettings();
assert.strictEqual(sound.volume, 0.25, "Loaded volume correctly from storage");
assert.strictEqual(sound.isMuted, true, "Loaded isMuted correctly from storage");
assert.strictEqual(sound.sfxVolume, 0.9, "Loaded sfxVolume correctly");
console.log("✓ Test 5: Settings persistence passed");

// Test 6: GainNode connection and live volume application
class MockGain {
  constructor() {
    this.gain = {
      value: 1,
      setValueAtTime: (v) => { this.gain.value = v; },
      linearRampToValueAtTime: (v) => { this.gain.value = v; },
      exponentialRampToValueAtTime: (v) => { this.gain.value = v; }
    };
    this.connectedTo = null;
  }
  connect(dest) {
    this.connectedTo = dest;
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = new MockGain();
    this.state = 'running';
  }
  createGain() {
    return new MockGain();
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  resume() { return Promise.resolve(); }
}

sound.ctx = new MockAudioContext();
sound.masterGain = sound.ctx.createGain();
sound.sfxGain = sound.ctx.createGain();
sound.zombieGain = sound.ctx.createGain();
sound.ambientGain = sound.ctx.createGain();

sound.setMuted(false);
sound.setVolume(0.35);
sound.setSfxVolume(0.85);
sound.setZombieVolume(0.80);
sound.setAmbientVolume(0.65);

assert.strictEqual(sound.masterGain.gain.value, 0.35, "Master gain reflects 0.35");
assert.strictEqual(sound.sfxGain.gain.value, 0.85, "SFX gain reflects 0.85");
assert.strictEqual(sound.zombieGain.gain.value, 0.80, "Zombie gain reflects 0.80");
assert.strictEqual(sound.ambientGain.gain.value, 0.65, "Ambient gain reflects 0.65");

// When muted, master gain drops to 0 while subchannels preserve their settings
sound.setMuted(true);
assert.strictEqual(sound.masterGain.gain.value, 0, "Master gain drops to 0 when muted");
assert.strictEqual(sound.sfxGain.gain.value, 0.85, "SFX gain preserved when muted");

// Unmute restores master gain
sound.setMuted(false);
assert.strictEqual(sound.masterGain.gain.value, 0.35, "Master gain restored on unmute");
console.log("✓ Test 6: Gain node simulation passed");

// Test 7: Test tone generation with mock context
assert.doesNotThrow(() => {
  sound.playTestTone();
}, "playTestTone should run without error");
console.log("✓ Test 7: playTestTone preview chime passed");

console.log("--- ALL AUDIO SETTINGS TESTS PASSED SUCCESSFULLY! ---");
