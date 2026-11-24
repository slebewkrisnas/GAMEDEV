// ============================================================================
// UNIVERSAL BACKSOUND (BGM) INTEGRATION TEST SUITE
// Verifies shared looping MP3 soundtrack across:
// - bacsound/bgm.js & bacsound/backsound.mp3
// - Dead Zone (Safe Zone & Sector-7 Zombie Zone) SoundManager
// - 3D Walking WorldAudioSystem
// - All standalone 3D map / diorama HTML viewers
// ============================================================================

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());

// Mock browser globals with simulated HTMLAudioElement
const windowListeners = new Map();
const noop = () => {};
let allowAutoplay = false;
let createdAudios = [];

class MockAudio {
  constructor(src) {
    this.src = src;
    this.loop = false;
    this.preload = '';
    this.volume = 1;
    this.muted = false;
    this.paused = true;
    this.playAttempts = 0;
    createdAudios.push(this);
  }
  play() {
    this.playAttempts++;
    if (!allowAutoplay) {
      return Promise.reject(new Error('NotAllowedError'));
    }
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

global.Audio = MockAudio;
global.window = {
  addEventListener: (evt, fn) => {
    if (!windowListeners.has(evt)) windowListeners.set(evt, new Set());
    windowListeners.get(evt).add(fn);
  },
  removeEventListener: (evt, fn) => {
    windowListeners.get(evt)?.delete(fn);
  }
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] ?? null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

const { createBgmPlayer } = await import('../../../../bacsound/bgm.js');
const { sound } = await import('../audio.js');
const { worldAudio } = await import('../../../audio_system.js');

console.log('--- RUNNING UNIVERSAL BACKSOUND (BGM) INTEGRATION TESTS ---');

// 1. Verify backsound asset exists
const mp3Path = path.join(repoRoot, 'bacsound', 'backsound.mp3');
assert.ok(fs.existsSync(mp3Path), 'bacsound/backsound.mp3 must exist');
assert.ok(fs.statSync(mp3Path).size > 1_000_000, 'backsound.mp3 must contain real audio data');
console.log('✓ Test 1: bacsound/backsound.mp3 asset verified');

// 2. Verify autoplay fallback -> unlock on first user gesture -> listener cleanup
allowAutoplay = false;
const bgm = createBgmPlayer({ volume: 0.5, muted: false, mixScale: 0.8 });
assert.ok(bgm.audio, 'BGM audio element must be initialized in browser environment');
assert.strictEqual(bgm.audio.loop, true, 'BGM must loop continuously');
assert.ok(bgm.audio.src.endsWith('/bacsound/backsound.mp3') || bgm.audio.src.includes('backsound.mp3'), 'BGM src must resolve to bacsound/backsound.mp3');
assert.strictEqual(Math.round(bgm.audio.volume * 100), 40, 'Effective BGM volume = 0.5 * 0.8 = 0.4');
assert.ok(windowListeners.get('pointerdown')?.size >= 1, 'Gesture unlock listeners must arm when autoplay is blocked');

// Simulate user pressing a key -> autoplay now permitted inside gesture
allowAutoplay = true;
for (const fn of [...(windowListeners.get('keydown') || [])]) fn();
await new Promise(r => setTimeout(r, 0));
assert.strictEqual(bgm.audio.paused, false, 'BGM must start playing on first user gesture');
assert.strictEqual(bgm.audio.playAttempts >= 2, true, 'BGM retried playback cleanly');

// Muting & unmuting via setMix
bgm.setMix(0.5, true);
assert.strictEqual(bgm.audio.muted, true);
assert.strictEqual(bgm.audio.volume, 0);
bgm.setMix(0.8, false);
assert.strictEqual(bgm.audio.muted, false);
assert.strictEqual(Math.round(bgm.audio.volume * 100), 64);
bgm.destroy();
console.log('✓ Test 2: Autoplay retry, user-gesture unlock, looping, and mute/volume mix verified');

// 3. Verify Dead Zone SoundManager (Safe Zone & Sector-7 Zombie Zone) BGM binding
assert.ok(sound.bgm && sound.bgm.audio, 'Dead Zone SoundManager must instantiate BGM player');
assert.strictEqual(sound.bgm.audio.loop, true, 'Dead Zone BGM must loop across Safe Zone & Zona Zombie');
sound.setVolume(0.4);
sound.setAmbientVolume(0.5);
sound.setMuted(false);
assert.strictEqual(Math.round(sound.bgm.audio.volume * 100), 25, 'Dead Zone BGM tracks volume * ambientVolume * 1.25');
sound.setMuted(true);
assert.strictEqual(sound.bgm.audio.muted, true, 'Dead Zone mute mutes BGM');
sound.setMuted(false);
assert.strictEqual(sound.bgm.audio.muted, false, 'Dead Zone unmute restores BGM');
console.log('✓ Test 3: Dead Zone (Safe Zone + Zona Zombie) BGM sync verified');

// 4. Verify 3D Walking WorldAudioSystem BGM binding
assert.ok(worldAudio.bgm && worldAudio.bgm.audio, '3D Walking WorldAudioSystem must instantiate BGM player');
assert.strictEqual(worldAudio.bgm.audio.loop, true, '3D Walking BGM must loop continuously');
worldAudio.setVolume(0.8);
worldAudio.setMuted(false);
assert.strictEqual(Math.round(worldAudio.bgm.audio.volume * 100), 44, '3D Walking BGM tracks master volume * 0.55');
worldAudio.toggleMute();
assert.strictEqual(worldAudio.bgm.audio.muted, true, '3D Walking mute toggle mutes BGM');
worldAudio.toggleMute();
assert.strictEqual(worldAudio.bgm.audio.muted, false, '3D Walking unmute toggle restores BGM');
console.log('✓ Test 4: 3D Walking WorldAudioSystem BGM sync verified');

// 5. Verify all standalone 3D map HTML files wire up bacsound/bgm.js
const standaloneMaps = [
  'gamedevs/dead-zone/dead-zone map/index.html',
  'zombie_apocalypse_city_map.html',
  'zombie_survivor_outpost_3d.html',
  'military_base_camp_portal_diorama.html'
];
for (const rel of standaloneMaps) {
  const html = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  assert.ok(html.includes('bacsound/bgm.js'), `${rel} must import bacsound/bgm.js`);
}
console.log('✓ Test 5: All standalone 3D map/diorama viewers wire up bacsound/bgm.js');

console.log('--- ALL UNIVERSAL BACKSOUND TESTS PASSED! ---');
