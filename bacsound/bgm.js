// Shared looping background soundtrack controller for all maps

export function createBgmPlayer({
  src = new URL('./backsound.mp3', import.meta.url).href,
  volume = 0.35,
  muted = false,
  mixScale = 0.65
} = {}) {
  let masterVol = typeof volume === 'number' && !Number.isNaN(volume) ? volume : 0.35;
  let isMuted = !!muted;

  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return {
      audio: null,
      play: () => {},
      setMix: (v, m) => {
        if (typeof v === 'number' && !Number.isNaN(v)) masterVol = Math.max(0, Math.min(1, v));
        if (typeof m === 'boolean') isMuted = m;
      },
      destroy: () => {}
    };
  }

  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'auto';

  const unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'click'];
  let unlockAttached = false;

  const applyVolume = () => {
    const eff = isMuted ? 0 : Math.max(0, Math.min(1, masterVol * mixScale));
    audio.muted = isMuted;
    audio.volume = eff;
    return eff;
  };

  const onUserGesture = () => {
    tryPlay();
  };

  const detachUnlock = () => {
    if (!unlockAttached) return;
    unlockAttached = false;
    for (const evt of unlockEvents) {
      window.removeEventListener(evt, onUserGesture, true);
    }
  };

  const attachUnlock = () => {
    if (unlockAttached) return;
    unlockAttached = true;
    for (const evt of unlockEvents) {
      window.addEventListener(evt, onUserGesture, { capture: true, passive: true });
    }
  };

  const tryPlay = () => {
    const eff = applyVolume();
    if (isMuted || eff <= 0) return;
    if (!audio.paused) {
      detachUnlock();
      return;
    }
    try {
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => detachUnlock()).catch(() => attachUnlock());
      }
    } catch {
      attachUnlock();
    }
  };

  const setMix = (nextVol, nextMuted) => {
    if (typeof nextVol === 'number' && !Number.isNaN(nextVol)) {
      masterVol = Math.max(0, Math.min(1, nextVol));
    }
    if (typeof nextMuted === 'boolean') {
      isMuted = nextMuted;
    }
    const eff = applyVolume();
    if (!isMuted && eff > 0 && audio.paused) {
      tryPlay();
    }
  };

  const destroy = () => {
    detachUnlock();
    try {
      audio.pause();
      audio.src = '';
    } catch {}
  };

  attachUnlock();
  tryPlay();

  return { audio, play: tryPlay, setMix, destroy };
}
