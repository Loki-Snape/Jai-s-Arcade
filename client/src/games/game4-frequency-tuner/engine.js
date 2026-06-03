import { findGame } from '../../data/games';

export const game = findGame('game4-frequency-tuner');

const whiteNoiseAudio = new Audio('/assets/game04_tuner/audio/white_noise.wav');
const sweepAudio = new Audio('/assets/game04_tuner/audio/sweep.wav');
const hitLockAudio = new Audio('/assets/game04_tuner/audio/hit_lock.wav');
const missStaticAudio = new Audio('/assets/game04_tuner/audio/miss_static.wav');

whiteNoiseAudio.loop = true;

const ASSET_PATHS = {
  bg: '/assets/game04_tuner/sprites/bg_spiritbox.png',
  needle: '/assets/game04_tuner/sprites/dial_needle.png',
  node: '/assets/game04_tuner/sprites/signal_node.png'
};

const GAME_STATES = {
  PLAYING: 'PLAYING',
  WIN: 'WIN',
  GAME_OVER: 'GAME_OVER'
};

function generateTargets(canvas) {
  return Array.from({ length: 3 }, () => ({
    x: 50 + Math.random() * Math.max(0, canvas.width - 100 - 50),
    width: 30 + Math.random() * 30,
    locked: false
  }));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.error('Failed to load:', src);
      reject(new Error(`Failed to load image: ${src}`));
    };
    image.src = src;
  });
}

function loadAudioAsset(audio, src) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('loadeddata', onReady);
      audio.removeEventListener('error', onError);
    };

    const onReady = () => {
      cleanup();
      resolve(audio);
    };

    const onError = () => {
      cleanup();
      console.error('Failed to load:', src);
      reject(new Error(`Failed to load audio: ${src}`));
    };

    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('loadeddata', onReady, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = src;
    audio.load();
  });
}

function createFallbackTexture(fillStyle) {
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = 64;
  fallbackCanvas.height = 64;
  const fallbackContext = fallbackCanvas.getContext('2d');

  if (!fallbackContext) {
    return null;
  }

  fallbackContext.fillStyle = fillStyle;
  fallbackContext.fillRect(0, 0, 64, 64);
  return fallbackCanvas;
}

function playAudio(audio) {
  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch (_error) {
    // Ignore autoplay restrictions.
  }
}

export function createEngine(canvas, maybeGameOrCallback, maybeOnStateUpdate) {
  const onStateUpdate = typeof maybeGameOrCallback === 'function'
    ? maybeGameOrCallback
    : typeof maybeOnStateUpdate === 'function'
      ? maybeOnStateUpdate
      : () => {};

  const context = canvas.getContext('2d');
  if (!context) {
    return () => {};
  }

  let targetZones = generateTargets(canvas);

  const textures = {
    bg: null,
    needle: null,
    node: null
  };

  const fallbackTextures = {
    bg: createFallbackTexture('#0b1020'),
    needle: createFallbackTexture('#67e8f9'),
    node: createFallbackTexture('#8ef08b')
  };

  let screenY = canvas.height * 0.35;
  let screenHeight = canvas.height * 0.3;

  let lives = 3;
  let score = 0;
  let gameState = GAME_STATES.PLAYING;
  let running = false;
  let animationFrameId = 0;
  let lastTimestamp = 0;
  let needle = { x: 50, width: 40, velocity: 220, direction: 1 };
  let bgmStarted = false;
  let startCanvasListener = null;

  const emitStateUpdate = () => {
    onStateUpdate({
      score,
      lives,
      gameState
    });
  };

  const resetGame = () => {
    lives = 3;
    score = 0;
    gameState = GAME_STATES.PLAYING;
    needle = { x: 50, width: 40, velocity: 220, direction: 1 };
    targetZones = generateTargets(canvas);
    bgmStarted = false;
    lastTimestamp = 0;
    emitStateUpdate();
  };

  const stopLoop = () => {
    running = false;
    window.cancelAnimationFrame(animationFrameId);
  };

  const allZonesLocked = () => targetZones.every((zone) => zone.locked);

  const handleSpace = () => {
    if (gameState !== GAME_STATES.PLAYING) {
      return;
    }

    let hitAnyZone = false;

    for (const zone of targetZones) {
      if (needle.x > zone.x && needle.x < zone.x + zone.width) {
        hitAnyZone = true;

        if (!zone.locked) {
          zone.locked = true;
          hitLockAudio.currentTime = 0;
          playAudio(hitLockAudio);
          score += 100;
          emitStateUpdate();
        }

        break;
      }
    }

    if (!hitAnyZone) {
      lives -= 1;
      playAudio(missStaticAudio);
      emitStateUpdate();

      if (lives === 0) {
        whiteNoiseAudio.pause();
        gameState = GAME_STATES.GAME_OVER;
        emitStateUpdate();
        stopLoop();
        return;
      }
    }

    if (allZonesLocked()) {
      whiteNoiseAudio.pause();
      gameState = GAME_STATES.WIN;
      emitStateUpdate();
      stopLoop();
    }
  };

  const startAudioPlayback = () => {
    if (bgmStarted) {
      return;
    }

    bgmStarted = true;
    playAudio(whiteNoiseAudio);
    playAudio(sweepAudio);
  };

  const handleKeyDown = (event) => {
    if (gameState === GAME_STATES.GAME_OVER || gameState === GAME_STATES.WIN) {
      if (event.key === 'Enter' || event.code === 'Enter') {
        resetGame();
        running = true;
        animationFrameId = window.requestAnimationFrame(loop);
        event.preventDefault();
      }
      return;
    }

    const isSpaceKey = event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space' || event.code === 'Space';
    if (!isSpaceKey) {
      return;
    }

    startAudioPlayback();
    handleSpace();
    event.preventDefault();
  };

  const draw = () => {
    const width = canvas.width;
    const height = canvas.height;

    screenY = canvas.height * 0.35;
    screenHeight = canvas.height * 0.3;

    context.clearRect(0, 0, width, height);
    context.drawImage(textures.bg || fallbackTextures.bg, 0, 0, width, height);

    targetZones.forEach((zone) => {
      if (zone.locked) {
        context.drawImage(textures.node || fallbackTextures.node, zone.x, screenY, zone.width, screenHeight);
      } else {
        context.fillStyle = 'rgba(255, 0, 0, 0.4)';
        context.fillRect(zone.x, screenY, zone.width, screenHeight);
      }
    });

    context.drawImage(textures.needle || fallbackTextures.needle, needle.x, screenY, needle.width, screenHeight);
  };

  function loop(timestamp) {
    if (!running || gameState !== GAME_STATES.PLAYING) {
      return;
    }

    const deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
    lastTimestamp = timestamp;

    const interference = Math.sin(timestamp / 180) * 120;
    needle.velocity = 220 + interference;
    needle.x += needle.direction * needle.velocity * deltaTime;

    if (needle.x <= 0) {
      needle.x = 0;
      needle.direction = 1;
      playAudio(sweepAudio);
    } else if (needle.x >= canvas.width - needle.width) {
      needle.x = canvas.width - needle.width;
      needle.direction = -1;
      playAudio(sweepAudio);
    }

    draw();
    animationFrameId = window.requestAnimationFrame(loop);
  }

  const loadAssets = async () => {
    const [bg, needleImage, node, whiteNoise, sweep, hitLock, missStatic] = await Promise.all([
      loadImage(ASSET_PATHS.bg),
      loadImage(ASSET_PATHS.needle),
      loadImage(ASSET_PATHS.node),
      loadAudioAsset(whiteNoiseAudio, '/assets/game04_tuner/audio/white_noise.wav'),
      loadAudioAsset(sweepAudio, '/assets/game04_tuner/audio/sweep.wav'),
      loadAudioAsset(hitLockAudio, '/assets/game04_tuner/audio/hit_lock.wav'),
      loadAudioAsset(missStaticAudio, '/assets/game04_tuner/audio/miss_static.wav')
    ]);

    textures.bg = bg;
    textures.needle = needleImage;
    textures.node = node;
    whiteNoiseAudio.loop = true;

    return { whiteNoise, sweep, hitLock, missStatic };
  };

  const start = async () => {
    window.addEventListener('keydown', handleKeyDown, true);

    startCanvasListener = () => {
      startAudioPlayback();
    };

    canvas.addEventListener('click', startCanvasListener, { once: true });

    try {
      await loadAssets();
      running = true;
      emitStateUpdate();
      draw();
      animationFrameId = window.requestAnimationFrame(loop);
    } catch (error) {
      console.error('Failed to initialize Frequency Tuner engine:', error);
    }
  };

  start();

  return () => {
    stopLoop();
    window.removeEventListener('keydown', handleKeyDown, true);
    if (startCanvasListener) {
      canvas.removeEventListener('click', startCanvasListener);
    }
    whiteNoiseAudio.pause();
    whiteNoiseAudio.currentTime = 0;
    sweepAudio.pause();
    sweepAudio.currentTime = 0;
    hitLockAudio.pause();
    hitLockAudio.currentTime = 0;
    missStaticAudio.pause();
    missStaticAudio.currentTime = 0;
  };
}