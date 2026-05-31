import { findGame } from '../../data/games';

export const game = findGame('game2-sweeper');

const GRID_ROWS = 15;
const GRID_COLS = 20;
const ENTITY_MOVE_MS = 600;

const TILE_VALUES = {
  FLOOR: 0,
  WALL: 1,
  NODE: 2
};

const GAME_STATES = {
  PLAYING: 'PLAYING',
  WIN: 'WIN',
  GAME_OVER: 'GAME_OVER'
};

const ASSET_PATHS = {
  wall: '/assets/game02_sweeper/sprites/wall.png',
  floor: '/assets/game02_sweeper/sprites/floor.png',
  player: '/assets/game02_sweeper/sprites/player.png',
  node: '/assets/game02_sweeper/sprites/node.png',
  entity: '/assets/game02_sweeper/sprites/entity.png'
};

const AUDIO_PATHS = {
  bgm: '/assets/game02_sweeper/audio/bgm.wav',
  collect: '/assets/game02_sweeper/audio/collect.mp3',
  caught: '/assets/game02_sweeper/audio/caught.wav'
};

function makeGrid(rows, cols, fillValue) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fillValue));
}

function loadImageAsset(src) {
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

function loadAudioAsset(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

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

    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('loadeddata', onReady, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = src;
    audio.load();
  });
}

function buildLevelMatrix() {
  const levelMatrix = makeGrid(GRID_ROWS, GRID_COLS, TILE_VALUES.FLOOR);

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLS; column += 1) {
      if (row === 0 || column === 0 || row === GRID_ROWS - 1 || column === GRID_COLS - 1) {
        levelMatrix[row][column] = TILE_VALUES.WALL;
      }
    }
  }

  [
    [2, 2], [2, 3], [2, 4], [2, 5],
    [4, 6], [5, 6], [6, 6],
    [8, 2], [8, 3], [8, 4],
    [10, 10], [10, 11], [10, 12],
    [11, 12], [12, 12],
    [5, 14], [6, 14], [7, 14],
    [9, 15], [10, 15], [11, 15]
  ].forEach(([row, column]) => {
    levelMatrix[row][column] = TILE_VALUES.WALL;
  });

  const nodeSlots = [];
  for (let row = 1; row < GRID_ROWS - 1; row += 1) {
    for (let column = 1; column < GRID_COLS - 1; column += 1) {
      if (levelMatrix[row][column] === TILE_VALUES.FLOOR) {
        nodeSlots.push([row, column]);
      }
    }
  }

  for (let index = nodeSlots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nodeSlots[index], nodeSlots[swapIndex]] = [nodeSlots[swapIndex], nodeSlots[index]];
  }

  nodeSlots.slice(0, 15).forEach(([row, column]) => {
    levelMatrix[row][column] = TILE_VALUES.NODE;
  });

  return levelMatrix;
}

function countNodes(levelMatrix) {
  let total = 0;
  levelMatrix.forEach((row) => {
    row.forEach((cell) => {
      if (cell === TILE_VALUES.NODE) {
        total += 1;
      }
    });
  });
  return total;
}

function isWalkable(levelMatrix, x, y) {
  return y >= 0 && y < GRID_ROWS && x >= 0 && x < GRID_COLS && levelMatrix[y][x] !== TILE_VALUES.WALL;
}

function shuffledDirections() {
  const directions = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ];

  for (let index = directions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [directions[index], directions[swapIndex]] = [directions[swapIndex], directions[index]];
  }

  return directions;
}

function bfsNextStep(levelMatrix, startX, startY, goalX, goalY) {
  const visited = makeGrid(GRID_ROWS, GRID_COLS, false);
  const queue = [{ x: startX, y: startY, path: [] }];
  visited[startY][startX] = true;

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === goalX && current.y === goalY) {
      return current.path[0] || { x: startX, y: startY };
    }

    for (const [dx, dy] of shuffledDirections()) {
      const nextX = current.x + dx;
      const nextY = current.y + dy;

      if (!isWalkable(levelMatrix, nextX, nextY) || visited[nextY][nextX]) {
        continue;
      }

      visited[nextY][nextX] = true;
      queue.push({
        x: nextX,
        y: nextY,
        path: [...current.path, { x: nextX, y: nextY }]
      });
    }
  }

  return { x: startX, y: startY };
}

function createFallbackTexture(label, fillStyle, textColor = '#ffffff') {
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = 64;
  fallbackCanvas.height = 64;
  const fallbackContext = fallbackCanvas.getContext('2d');

  if (!fallbackContext) {
    return null;
  }

  fallbackContext.fillStyle = fillStyle;
  fallbackContext.fillRect(0, 0, 64, 64);
  if (label) {
    fallbackContext.fillStyle = textColor;
    fallbackContext.font = 'bold 12px sans-serif';
    fallbackContext.textAlign = 'center';
    fallbackContext.fillText(label, 32, 36);
  }
  return fallbackCanvas;
}

function drawTexture(context, texture, fallback, x, y, size) {
  context.drawImage(texture || fallback, x, y, size, size);
}

function playAudio(audio) {
  if (!audio) {
    return Promise.reject(new Error('No audio'));
  }

  try {
    audio.currentTime = 0;
    const playResult = audio.play();
    return playResult;
  } catch (_error) {
    return Promise.reject(_error);
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

  const player = { gridX: 1, gridY: 1 };
  const entity = { gridX: 18, gridY: 13 };

  const textures = {
    wall: null,
    floor: null,
    player: null,
    node: null,
    entity: null
  };

  const audio = {
    bgm: null,
    collect: null,
    caught: null
  };

  const fallbackTextures = {
    wall: createFallbackTexture('W', '#334155'),
    floor: createFallbackTexture('F', '#0f172a'),
    player: createFallbackTexture('P', '#22d3ee', '#0f172a'),
    node: createFallbackTexture('N', '#8b5cf6'),
    entity: createFallbackTexture('E', '#ef4444')
  };

  const overlayTexture = createFallbackTexture('', '#000000');

  let levelMatrix = buildLevelMatrix();
  let gameState = GAME_STATES.PLAYING;
  let score = 0;
  let running = false;
  let gameOverMessage = '';
  let animationFrameId = 0;
  let entityTimerId = 0;

  const tileSize = () => canvas.width / GRID_COLS;

  const notifyState = () => {
    onStateUpdate({ score, gameState });
  };

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvas.getBoundingClientRect().width || 800;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round((canvas.width / GRID_COLS) * GRID_ROWS);
  };

  const resetGame = () => {
    levelMatrix = buildLevelMatrix();
    player.gridX = 1;
    player.gridY = 1;
    entity.gridX = 18;
    entity.gridY = 13;
    score = 0;
    gameState = GAME_STATES.PLAYING;
    gameOverMessage = '';
    notifyState();
  };

  const draw = () => {
    const size = tileSize();
    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLS; column += 1) {
        const x = column * size;
        const y = row * size;

        drawTexture(context, textures.floor, fallbackTextures.floor, x, y, size);

        if (levelMatrix[row][column] === TILE_VALUES.WALL) {
          drawTexture(context, textures.wall, fallbackTextures.wall, x, y, size);
        } else if (levelMatrix[row][column] === TILE_VALUES.NODE) {
          drawTexture(context, textures.node, fallbackTextures.node, x, y, size);
        }
      }
    }

    drawTexture(context, textures.entity, fallbackTextures.entity, entity.gridX * size, entity.gridY * size, size);
    drawTexture(context, textures.player, fallbackTextures.player, player.gridX * size, player.gridY * size, size);

    if (gameState === GAME_STATES.WIN || gameState === GAME_STATES.GAME_OVER) {
      context.drawImage(overlayTexture, 0, 0, width, height);
      context.save();
      context.fillStyle = '#f8fafc';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '700 32px Inter, system-ui, sans-serif';
      context.fillText(gameOverMessage, width / 2, height / 2);
      context.restore();
    }
  };

  const endGame = (nextState, sound) => {
    if (gameState !== GAME_STATES.PLAYING) {
      return;
    }

    gameState = nextState;
    gameOverMessage = nextState === GAME_STATES.WIN
      ? 'YOU WIN! Press ENTER to Restart'
      : 'CAUGHT! Press ENTER to Restart';
    running = false;
    window.clearInterval(entityTimerId);
    playAudio(sound);
    notifyState();
    draw();
  };

  function moveEntity() {
    if (!running || gameState !== GAME_STATES.PLAYING) {
      return;
    }

    const nextStep = bfsNextStep(levelMatrix, entity.gridX, entity.gridY, player.gridX, player.gridY);
    entity.gridX = nextStep.x;
    entity.gridY = nextStep.y;

    if (entity.gridX === player.gridX && entity.gridY === player.gridY) {
      endGame(GAME_STATES.GAME_OVER, audio.caught);
    }
  }

  const startMotion = () => {
    running = true;
    window.clearInterval(entityTimerId);
    entityTimerId = window.setInterval(moveEntity, ENTITY_MOVE_MS);
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = window.requestAnimationFrame(loop);
  };

  const restartGame = () => {
    resetGame();
    startMotion();
  };

  const handleKeyDown = (event) => {
    if (gameState === GAME_STATES.WIN || gameState === GAME_STATES.GAME_OVER) {
      if (event.key === 'Enter' || event.code === 'Enter') {
        restartGame();
        event.preventDefault();
      }
      return;
    }

    const moves = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0]
    };

    const delta = moves[event.key];
    if (!delta) {
      return;
    }

    const targetX = player.gridX + delta[0];
    const targetY = player.gridY + delta[1];

    if (!isWalkable(levelMatrix, targetX, targetY)) {
      return;
    }

    player.gridX = targetX;
    player.gridY = targetY;

    if (levelMatrix[targetY][targetX] === TILE_VALUES.NODE) {
      levelMatrix[targetY][targetX] = TILE_VALUES.FLOOR;
      score += 100;
      playAudio(audio.collect);
      notifyState();
    }

    event.preventDefault();
  };

  const loop = () => {
    if (gameState !== GAME_STATES.PLAYING) {
      draw();
      return;
    }

    if (countNodes(levelMatrix) === 0) {
      endGame(GAME_STATES.WIN, audio.caught);
      return;
    }

    draw();
    animationFrameId = window.requestAnimationFrame(loop);
  };

  const loadAllAssets = async () => {
    const [wall, floor, playerImage, node, entityImage, bgm, collect, caught] = await Promise.all([
      loadImageAsset(ASSET_PATHS.wall),
      loadImageAsset(ASSET_PATHS.floor),
      loadImageAsset(ASSET_PATHS.player),
      loadImageAsset(ASSET_PATHS.node),
      loadImageAsset(ASSET_PATHS.entity),
      loadAudioAsset(AUDIO_PATHS.bgm),
      loadAudioAsset(AUDIO_PATHS.collect),
      loadAudioAsset(AUDIO_PATHS.caught)
    ]);

    textures.wall = wall;
    textures.floor = floor;
    textures.player = playerImage;
    textures.node = node;
    textures.entity = entityImage;
    audio.bgm = bgm;
    audio.collect = collect;
    audio.caught = caught;
  };

  const start = async () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown, true);

    try {
      await loadAllAssets();
      if (audio.bgm) {
        audio.bgm.loop = true;
        audio.bgm.volume = 0.45;
        try {
          await playAudio(audio.bgm);
        } catch (err) {
          console.warn('Autoplay blocked, waiting for user gesture to start BGM');
          const startBgmOnGesture = () => {
            playAudio(audio.bgm).catch(() => {});
            window.removeEventListener('pointerdown', startBgmOnGesture);
            window.removeEventListener('keydown', startBgmOnGesture);
          };
          window.addEventListener('pointerdown', startBgmOnGesture, { once: true });
          window.addEventListener('keydown', startBgmOnGesture, { once: true });
        }
      }
      notifyState();
      startMotion();
    } catch (error) {
      console.error(error);
    }
  };

  start();

  return () => {
    running = false;
    window.cancelAnimationFrame(animationFrameId);
    window.clearInterval(entityTimerId);
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', handleKeyDown, true);

    if (audio.bgm) {
      audio.bgm.pause();
      audio.bgm.currentTime = 0;
    }
  };
}