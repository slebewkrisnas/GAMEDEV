// ==================== KONTROL & INPUT ====================
export const keys = {};
window.__keys = keys;

export let yaw = 0;
export let pitch = 0;
export let pointerLocked = false;
let isDragging = false;

export function getYaw() { return yaw; }
export function setYaw(y) { yaw = y; }
export function getPitch() { return pitch; }
export function setPitch(p) { pitch = p; }

window.setYaw = (y) => { yaw = y; };
window.setPitch = (p) => { pitch = p; };

// ==================== JOYSTICK & MOBILE ====================
export const joyState = { x: 0, y: 0 };
export let mobileSprintActive = false;

// ==================== DEVICE MODE ====================
export let currentDeviceMode = localStorage.getItem('game_device_mode') || 
  (('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'hp' : 'laptop');

export function getDeviceMode() { return currentDeviceMode; }

export function setDeviceMode(mode) {
  currentDeviceMode = mode;
  try { localStorage.setItem('game_device_mode', mode); } catch (e) {}

  const btnModeLaptop = document.getElementById('btnModeLaptop');
  const btnModeHP = document.getElementById('btnModeHP');

  if (mode === 'hp') {
    document.body.classList.add('mode-hp');
    btnModeHP?.classList.add('active');
    btnModeLaptop?.classList.remove('active');
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  } else {
    document.body.classList.remove('mode-hp');
    btnModeLaptop?.classList.add('active');
    btnModeHP?.classList.remove('active');
  }
}

// ==================== INISIALISASI LISTENER ====================
export function initControls(canvas, onJump = null) {
  // 1. Keyboard
  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Shift') keys.shift = true;
    if (e.code === 'Space' || e.key === ' ') {
      keys.space = true;
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key === 'Shift') keys.shift = false;
    if (e.code === 'Space' || e.key === ' ') {
      keys.space = false;
    }
  });

  // 2. Mouse Look & Pointer Lock
  const hintEl = document.getElementById('hint');

  if (canvas) {
    canvas.addEventListener('click', () => {
      if (currentDeviceMode === 'laptop' && !pointerLocked) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === canvas;
      if (pointerLocked) {
        if (hintEl) hintEl.classList.add('hidden');
      } else if (currentDeviceMode === 'laptop') {
        if (hintEl) hintEl.classList.remove('hidden');
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) isDragging = true;
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    document.addEventListener('mousemove', (e) => {
      if (pointerLocked) {
        yaw -= e.movementX * 0.0025;
        pitch -= e.movementY * 0.0025;
      } else if (isDragging) {
        yaw -= e.movementX * 0.005;
        pitch -= e.movementY * 0.005;
      } else return;
      pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
    });
  }

  // 3. Device Mode Switcher Buttons
  const btnModeLaptop = document.getElementById('btnModeLaptop');
  const btnModeHP = document.getElementById('btnModeHP');
  if (btnModeLaptop) btnModeLaptop.addEventListener('click', () => setDeviceMode('laptop'));
  if (btnModeHP) btnModeHP.addEventListener('click', () => setDeviceMode('hp'));
  setDeviceMode(currentDeviceMode);

  // 4. Virtual Joystick (Mobile)
  const joyContainer = document.getElementById('joystick-container');
  const joyThumb = document.getElementById('joystick-thumb');
  let joyTouchId = null;

  if (joyContainer && joyThumb) {
    const joyRadius = 42;

    function updateJoystickPos(clientX, clientY) {
      const rect = joyContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > joyRadius) {
        dx = (dx / dist) * joyRadius;
        dy = (dy / dist) * joyRadius;
      }

      joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      joyState.x = dx / joyRadius;
      joyState.y = -dy / joyRadius;
    }

    joyContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (joyTouchId === null) {
          joyTouchId = touch.identifier;
          updateJoystickPos(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joyTouchId) {
          updateJoystickPos(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    const handleJoyEnd = (e) => {
      if (joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId) {
          joyTouchId = null;
          joyState.x = 0;
          joyState.y = 0;
          joyThumb.style.transform = 'translate(-50%, -50%)';
          break;
        }
      }
    };

    window.addEventListener('touchend', handleJoyEnd);
    window.addEventListener('touchcancel', handleJoyEnd);
  }

  // 5. Mobile Buttons (Jump & Sprint)
  const btnMobileJump = document.getElementById('btn-mobile-jump');
  const btnMobileSprint = document.getElementById('btn-mobile-sprint');

  if (btnMobileJump) {
    const triggerJump = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (typeof onJump === 'function') onJump();
    };
    btnMobileJump.addEventListener('touchstart', triggerJump, { passive: false });
    btnMobileJump.addEventListener('mousedown', triggerJump);
  }

  if (btnMobileSprint) {
    const toggleSprint = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      mobileSprintActive = !mobileSprintActive;
      btnMobileSprint.classList.toggle('active', mobileSprintActive);
    };
    btnMobileSprint.addEventListener('touchstart', toggleSprint, { passive: false });
    btnMobileSprint.addEventListener('click', toggleSprint);
  }

  // 6. Touch Look Zone
  const touchLookZone = document.getElementById('touch-look-zone');
  let lookTouchId = null;
  let lastLookX = 0, lastLookY = 0;

  if (touchLookZone) {
    touchLookZone.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (lookTouchId === null) {
          lookTouchId = touch.identifier;
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === lookTouchId) {
          const dx = touch.clientX - lastLookX;
          const dy = touch.clientY - lastLookY;
          yaw -= dx * 0.0055;
          pitch -= dy * 0.0055;
          pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    const handleLookEnd = (e) => {
      if (lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchend', handleLookEnd);
    window.addEventListener('touchcancel', handleLookEnd);
  }
}

