// ============================================================================
// DEAD ZONE — TOUCH CONTROLS & DEVICE MODE SWITCHER
// Provides virtual joystick, action buttons (Fire, Jump, Sprint, Reload, Flashlight),
// touch drag for camera look, and synchronized mode toggle (Laptop vs HP).
// ============================================================================

export class TouchControls {
  constructor(player, weaponManager) {
    this.player = player;
    this.weaponManager = weaponManager;

    this.btnModeLaptop = document.getElementById('btnModeLaptop');
    this.btnModeHP = document.getElementById('btnModeHP');
    this.mobileControls = document.getElementById('mobile-controls');

    this.joyContainer = document.getElementById('joystick-container');
    this.joyThumb = document.getElementById('joystick-thumb');
    this.joyRadius = 42;
    this.joyTouchId = null;

    this.touchLookZone = document.getElementById('touch-look-zone');
    this.lookTouchId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    this.btnFire = document.getElementById('btn-mobile-fire');
    this.btnJump = document.getElementById('btn-mobile-jump');
    this.btnSprint = document.getElementById('btn-mobile-sprint');
    this.btnReload = document.getElementById('btn-mobile-reload');
    this.btnFlashlight = document.getElementById('btn-mobile-flashlight');

    this.fireInterval = null;

    this.initModeSelector();
    this.initJoystick();
    this.initTouchLook();
    this.initActionButtons();
  }

  initModeSelector() {
    let mode = localStorage.getItem('game_device_mode') || 
      (('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'hp' : 'laptop');

    this.applyMode(mode);

    if (this.btnModeLaptop && this.btnModeHP) {
      this.btnModeLaptop.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyMode('laptop');
      });
      this.btnModeHP.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyMode('hp');
      });
    }
  }

  applyMode(mode) {
    this.currentMode = mode;
    try { localStorage.setItem('game_device_mode', mode); } catch (e) {}

    const isHP = (mode === 'hp');
    this.player.isTouchMode = isHP;
    this.weaponManager.isTouchMode = isHP;

    if (isHP) {
      document.body.classList.add('mode-hp');
      document.body.classList.remove('mode-laptop');
      this.btnModeHP?.classList.add('active');
      this.btnModeLaptop?.classList.remove('active');
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } else {
      document.body.classList.remove('mode-hp');
      document.body.classList.add('mode-laptop');
      this.btnModeLaptop?.classList.add('active');
      this.btnModeHP?.classList.remove('active');
    }
  }

  initJoystick() {
    if (!this.joyContainer || !this.joyThumb) return;

    const updatePos = (clientX, clientY) => {
      const rect = this.joyContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > this.joyRadius) {
        dx = (dx / dist) * this.joyRadius;
        dy = (dy / dist) * this.joyRadius;
      }

      this.joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      // x: -1 (left) to 1 (right)
      // z: -1 (down/backward) to 1 (up/forward)
      const normX = dx / this.joyRadius;
      const normZ = -dy / this.joyRadius;
      this.player.setJoystick(normX, normZ);
    };

    const resetJoy = () => {
      this.joyTouchId = null;
      this.joyThumb.style.transform = 'translate(-50%, -50%)';
      this.player.setJoystick(0, 0);
    };

    this.joyContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joyTouchId === null) {
          this.joyTouchId = touch.identifier;
          updatePos(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joyTouchId) {
          updatePos(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (this.joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joyTouchId) {
          resetJoy();
          break;
        }
      }
    });

    window.addEventListener('touchcancel', (e) => {
      if (this.joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joyTouchId) {
          resetJoy();
          break;
        }
      }
    });
  }

  initTouchLook() {
    if (!this.touchLookZone) return;

    this.touchLookZone.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.lookTouchId === null) {
          this.lookTouchId = touch.identifier;
          this.lastLookX = touch.clientX;
          this.lastLookY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.lookTouchId) {
          const dx = touch.clientX - this.lastLookX;
          const dy = touch.clientY - this.lastLookY;
          this.player.setTouchLook(dx, dy);
          this.lastLookX = touch.clientX;
          this.lastLookY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    const endLook = (e) => {
      if (this.lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.lookTouchId) {
          this.lookTouchId = null;
          break;
        }
      }
    };
    window.addEventListener('touchend', endLook);
    window.addEventListener('touchcancel', endLook);
  }

  initActionButtons() {
    // 1. Jump Button
    if (this.btnJump) {
      const doJump = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.player.jump();
      };
      this.btnJump.addEventListener('touchstart', doJump, { passive: false });
      this.btnJump.addEventListener('mousedown', doJump);
    }

    // 2. Sprint Button (Toggle)
    if (this.btnSprint) {
      const toggleSprint = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.player.isSprinting = !this.player.isSprinting;
        this.btnSprint.classList.toggle('active', this.player.isSprinting);
      };
      this.btnSprint.addEventListener('touchstart', toggleSprint, { passive: false });
      this.btnSprint.addEventListener('click', toggleSprint);
    }

    // 3. Fire Button
    if (this.btnFire) {
      const startFire = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.weaponManager.shoot();
        if (!this.fireInterval) {
          this.fireInterval = setInterval(() => {
            this.weaponManager.shoot();
          }, 220);
        }
      };
      const stopFire = (e) => {
        if (e) { e.preventDefault(); }
        if (this.fireInterval) {
          clearInterval(this.fireInterval);
          this.fireInterval = null;
        }
      };
      this.btnFire.addEventListener('touchstart', startFire, { passive: false });
      this.btnFire.addEventListener('touchend', stopFire);
      this.btnFire.addEventListener('touchcancel', stopFire);
      this.btnFire.addEventListener('mousedown', startFire);
      this.btnFire.addEventListener('mouseup', stopFire);
      this.btnFire.addEventListener('mouseleave', stopFire);
    }

    // 4. Reload Button
    if (this.btnReload) {
      const doReload = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.weaponManager.reload();
      };
      this.btnReload.addEventListener('touchstart', doReload, { passive: false });
      this.btnReload.addEventListener('click', doReload);
    }

    // 5. Flashlight Button
    if (this.btnFlashlight) {
      const toggleFlash = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.player.toggleFlashlight();
      };
      this.btnFlashlight.addEventListener('touchstart', toggleFlash, { passive: false });
      this.btnFlashlight.addEventListener('click', toggleFlash);
    }
  }
}
