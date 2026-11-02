# Modularize 3D Walking Game JavaScript Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic ~4,900-line `gamedevs/app.js` for the 3D Walking Game into clean, modular ES6 JavaScript files under `gamedevs/js/` while preserving 100% of gameplay features, performance (60 FPS), realistic character rigging, FBX retargeted animations, and portal returns.

**Architecture:** Split the codebase by responsibility into native ES modules (`world.js`, `zones.js`, `player.js`, `controls.js`, `ui.js`), orchestrating them through a clean, compact `gamedevs/app.js` (~200 lines). Native browser ES modules require zero extra bundlers or build steps, preserving fast reloading and debugging simplicity.

**Tech Stack:** Three.js (WebGL), Web Audio API, Native ES Modules (`type="module"`), GLTFLoader, FBXLoader.

**Spec:** User request: "COBA UNTUK 3D WALKING GAME JSNYA DI PISAH PISAH JANGAN DI TUMPUK SEKALIAN GITU"

---

## Global Constraints

- Preserve 100% feature parity: Realistic Man GLB model, FBX mocap animations (Walking, Fast Run, Jumping, organic Idle), NPC system with dialogues, 4 landmark zones (Kebun, Kamp Tentara, Battle Arena, Plaza Prestasi), waypoints compass, trophy banners, audio effects, and device mode switcher (Laptop / HP).
- No new external bundler or compile step (pure native ES modules compatible with browser importmap).
- Zero frame drops: hot loop in `animate()` must avoid memory allocations and run at smooth 60 FPS.
- Guarantee portal transitions and portal returns (`?from=camp`, `?from=kebun`, `?from=arena`) work seamlessly without player spawn position resets or bone warping.

---

## Review Focus

1. **Realistic Man Model & Animation Retargeting:** Ensure `player.js` properly exports `player`, retains Auto-Rig Pro bone mappings, and retargets Mixamo FBX files with relaxed idle arm posture.
2. **Fence & Boundary Collisions:** Ensure collision boxes in `world.js` and `zones.js` are properly registered in `fences` array and checked in the physics loop.
3. **Portal Warp Triggers & Cooldowns:** Ensure proximity detection for Fruit, Camp, and Arena portals triggers the visual warp overlay and navigation redirects correctly.
4. **NPC Proximity & Dialogue System:** Ensure `npc_system.js` integrates cleanly with `ui.js` and `controls.js` for "E: Bicara" prompts and kiosk modal popups.
5. **Mobile & Desktop Controls Compatibility:** Ensure pointer lock, keyboard keys, virtual joystick, and touch look zone remain responsive across devices.

---

## File Structure

```
gamedevs/
├── js/
│   ├── world.js      # Ground, roads, rock boundaries, clouds, fences/colliders
│   ├── zones.js      # Farm (Kebun), Army Camp, Battle Arena, Plaza & Monuments + Portals
│   ├── player.js     # Realistic Man GLB, Auto-Rig Pro rig, Mixamo FBX retargeting, anim actions, procedural fallback
│   ├── controls.js   # Keyboard, mouse look, pointer lock, virtual joystick, touch look zone, device mode
│   └── ui.js         # Compass HUD, quest tracker, trophy banner, kiosk modal, audio UI, portal overlay
├── audio_system.js   # Web Audio API sound synthesis (existing)
├── npc_system.js     # NPC management & dialogue routines (existing)
├── app.js            # Slim main orchestrator & 60 FPS animation/physics game loop (~200 lines)
└── main.html         # Entry HTML loading app.js as ES module
```

---

## Tasks

### Task 1: Create `gamedevs/js/world.js` (Environment & Terrain)

**Files:**
- Create: `gamedevs/js/world.js`
- Test: Verify module syntax via Node.js

- [ ] Extract ground mesh, main road, branch roads (farm, camp, arena, statue connections).
- [ ] Extract rock boundaries, perimeter fencing, and sky clouds.
- [ ] Maintain the `fences` collision array and export `MAP_SIZE`, `SPAWN_POS`, `fences`, and `createWorld(scene)`.
- [ ] Run syntax check: `node -c gamedevs/js/world.js`.

---

### Task 2: Create `gamedevs/js/zones.js` (Landmarks, Portals & Statues)

**Files:**
- Create: `gamedevs/js/zones.js`
- Test: Verify module syntax via Node.js

- [ ] Extract Farm / Kebun zone (fruit trees, fences, fruit portal with pulsing light, signboards).
- [ ] Extract Military Camp / Kamp Tentara zone (tents, sandbags, barrels, camp portal with green light).
- [ ] Extract Battle Arena zone (platform, posts, ropes, torches, arena portal with purple light).
- [ ] Extract Plaza Prestasi (Gamedev 25 statue, dynamic TV monitor canvas, trophy podiums, kiosk stand, Logo statue).
- [ ] Export `PORTAL_POS`, `CAMP_PORTAL_POS`, `ARENA_PORTAL_POS`, `createZones(scene, fences)`, `updatePortals(delta)`, and portal light references.
- [ ] Run syntax check: `node -c gamedevs/js/zones.js`.

---

### Task 3: Create `gamedevs/js/player.js` (Realistic Man, Skeleton Rig & FBX Retargeting)

**Files:**
- Create: `gamedevs/js/player.js`
- Test: Verify module syntax via Node.js

- [ ] Extract procedural player fallback model (head, torso, arms, legs).
- [ ] Extract Realistic Man loader (`realistic_man.glb`) with multi-candidate paths, shadow/material optimization, and Auto-Rig Pro bone mapping.
- [ ] Extract Mixamo FBX animation retargeting system (`loadAndRetargetFBX`, `initFBXAnimations`, `MIXAMO_ARP_BONE_PAIRS`, `idleClip` builder with relaxed arms).
- [ ] Extract animation action switcher `playCharacterAnimation(name, fade)`.
- [ ] Export `player`, `createPlayer(scene)`, `playCharacterAnimation`, `getCharacterMixer()`, `isFBXLoaded()`, `isUsingRealisticModel()`, `getRealisticBones()`, `getCurrentActionName()`.
- [ ] Run syntax check: `node -c gamedevs/js/player.js`.

---

### Task 4: Create `gamedevs/js/controls.js` (Input & Interaction)

**Files:**
- Create: `gamedevs/js/controls.js`
- Test: Verify module syntax via Node.js

- [ ] Extract keyboard listener & `keys` tracker.
- [ ] Extract mouse movement, camera `yaw` and `pitch`, pointer lock.
- [ ] Extract virtual joystick, touch look zone, mobile buttons (Jump, Sprint).
- [ ] Extract device mode switcher (`setDeviceMode('laptop' | 'hp')`).
- [ ] Export `keys`, `getCameraAngles()`, `setCameraAngles(yaw, pitch)`, `initControls(canvas, callbacks)`, `getDeviceMode()`, `setDeviceMode()`.
- [ ] Run syntax check: `node -c gamedevs/js/controls.js`.

---

### Task 5: Create `gamedevs/js/ui.js` (HUDs, Modals & Overlays)

**Files:**
- Create: `gamedevs/js/ui.js`
- Test: Verify module syntax via Node.js

- [ ] Extract compass HUD & waypoints pins update (`updateCompassHUD`).
- [ ] Extract global quest tracker HUD (`updateQuestTrackerHUD`).
- [ ] Extract trophy banner notification popup (`showTrophyBanner`).
- [ ] Extract Central Plaza Kiosk modal dialog (`openKioskModal`, `closeKioskModal`).
- [ ] Extract audio controls UI (`initAudioUI`).
- [ ] Extract portal warp fullscreen overlay & transition effect (`triggerPortalWarp`).
- [ ] Export all UI update & trigger functions.
- [ ] Run syntax check: `node -c gamedevs/js/ui.js`.

---

### Task 6: Refactor `gamedevs/app.js` into Slim Orchestrator

**Files:**
- Modify: `gamedevs/app.js`
- Test: Verify syntax and imports via Node.js

- [ ] Import modules from `./js/world.js`, `./js/zones.js`, `./js/player.js`, `./js/controls.js`, `./js/ui.js`, `./audio_system.js`, and `./npc_system.js`.
- [ ] Setup Scene, Fog, Camera, Renderer, and Lighting.
- [ ] Initialize all systems and handle portal spawn parameters (`?from=camp`, etc.).
- [ ] Streamline 60 FPS `animate()` loop: physics, player locomotion, animation blending, portal triggers, NPC update, camera chase rig, render.
- [ ] Add window resize handler.
- [ ] Run syntax check: `node -c gamedevs/app.js`.

---

### Task 7: Update `gamedevs/main.html` & Live End-to-End Verification

**Files:**
- Modify: `gamedevs/main.html`
- Test: Live browser testing via Edge Headless CDP

- [ ] Update cache buster in `main.html` (`src="app.js?v=20261101_modular_v1"`).
- [ ] Run automated CDP test verifying:
  - Game boots with 0 console errors.
  - Realistic Man GLB and FBX animations load cleanly.
  - Normal idle and walking animations function at 60 FPS.
  - Portal return (`?from=camp`) places player at correct spawn position without leg glitches.
  - NPCs roam and dialogue prompt responds.
- [ ] Capture verification screenshots and confirm visual quality.

