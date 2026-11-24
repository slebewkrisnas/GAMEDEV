// ============================================================================
// CHUNK STATE STORE — PERSISTENCE ACROSS CHUNK STREAMING LIFECYCLES
// Tracks opened loot crates, destroyed props, and world modifications
// so chunk reloading never resets player progress or duplicates loot.
// ============================================================================

export class ChunkStateStore {
  constructor() {
    this.lootedCaches = new Set();
    this.destroyedProps = new Set();
    this.customChunkStates = new Map();
  }

  markLooted(crateId) {
    if (!crateId) return;
    this.lootedCaches.add(crateId);
  }

  isLooted(crateId) {
    if (!crateId) return false;
    return this.lootedCaches.has(crateId);
  }

  markDestroyed(propId) {
    if (!propId) return;
    this.destroyedProps.add(propId);
  }

  isDestroyed(propId) {
    if (!propId) return false;
    return this.destroyedProps.has(propId);
  }

  setChunkData(chunkKey, key, value) {
    if (!this.customChunkStates.has(chunkKey)) {
      this.customChunkStates.set(chunkKey, new Map());
    }
    this.customChunkStates.get(chunkKey).set(key, value);
  }

  getChunkData(chunkKey, key) {
    if (!this.customChunkStates.has(chunkKey)) return null;
    return this.customChunkStates.get(chunkKey).get(key) || null;
  }

  serialize() {
    return {
      lootedCaches: Array.from(this.lootedCaches),
      destroyedProps: Array.from(this.destroyedProps)
    };
  }

  deserialize(data) {
    if (!data) return;
    if (Array.isArray(data.lootedCaches)) {
      this.lootedCaches = new Set(data.lootedCaches);
    }
    if (Array.isArray(data.destroyedProps)) {
      this.destroyedProps = new Set(data.destroyedProps);
    }
  }

  clear() {
    this.lootedCaches.clear();
    this.destroyedProps.clear();
    this.customChunkStates.clear();
  }
}
