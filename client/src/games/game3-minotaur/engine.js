import { findGame } from '../../data/games';

export const game = findGame('game3-minotaur');

const bgm = new Audio('/assets/game03_minotaur/audio/bgm_myth.wav');
const pickupSfx = new Audio('/assets/game03_minotaur/audio/pickup.wav');
const crashSfx = new Audio('/assets/game03_minotaur/audio/crash.wav');

bgm.loop = true;

const GRID_COLS = 20;
const GRID_ROWS = 15;
const FRAME_MS = 150;
const WIN_SCORE = 8;

const TILE_VALUES = {
  floor: 0,
  wall: 1
};

const GAME_STATES = {
  playing: 'PLAYING',
  win: 'WIN',
  gameOver: 'GAME_OVER'
};

const ASSET_PATHS = {
  floor: '/assets/game03_minotaur/sprites/floor_stone.png',
  wall: '/assets/game03_minotaur/sprites/wall_brick.png',
  head: '/assets/game03_minotaur/sprites/thread_head.png',
  body: '/assets/game03_minotaur/sprites/thread_body.png',
  artifact: '/assets/game03_minotaur/sprites/artifact.png'
};

function makeGrid(rows, cols, fillValue) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fillValue));
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

function createLevelMatrix() {
  const levelMatrix = makeGrid(GRID_ROWS, GRID_COLS, TILE_VALUES.floor);

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLS; column += 1) {
      if (row === 0 || column === 0 || row === GRID_ROWS - 1 || column === GRID_COLS - 1) {
        levelMatrix[row][column] = TILE_VALUES.wall;
      }
    }
  }

  [
    [3, 3], [3, 4], [3, 5], [3, 6],
    [5, 10], [6, 10], [7, 10],
    [8, 3], [8, 4], [8, 5], [8, 6], [8, 7],
    [10, 13], [11, 13], [12, 13],
    [4, 15], [5, 15], [6, 15]
  ].forEach(([row, column]) => {
    if (row > 0 && row < GRID_ROWS - 1 && column > 0 && column < GRID_COLS - 1) {
      levelMatrix[row][column] = TILE_VALUES.wall;
    }
  });

  return levelMatrix;
}

function isInsideGrid(x, y) {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

function getArtifactCells(levelMatrix, thread) {
  const blocked = new Set(thread.map((part) => `${part.x},${part.y}`));
  const cells = [];

  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      if (levelMatrix[y][x] === TILE_VALUES.floor && !blocked.has(`${x},${y}`)) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

function pickRandomArtifact(levelMatrix, thread) {
  const cells = getArtifactCells(levelMatrix, thread);
  if (cells.length === 0) {
    return null;
  }

  return cells[Math.floor(Math.random() * cells.length)];
}

function createFallbackTexture(label, fillStyle, textColor = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.fillStyle = fillStyle;
  context.fillRect(0, 0, 64, 64);
  context.fillStyle = textColor;
  context.font = 'bold 12px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, 32, 32);
  return canvas;
}

function drawTile(context, image, fallback, x, y, size) {
  context.drawImage(image || fallback, x, y, size, size);
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

  const textures = {
    floor: null,
    wall: null,
    head: null,
    body: null,
    artifact: null
  };

  const fallbackTextures = {
    floor: createFallbackTexture('F', '#1f2937'),
    wall: createFallbackTexture('W', '#4b5563'),
    head: createFallbackTexture('H', '#14b8a6', '#042f2e'),
    body: createFallbackTexture('B', '#22c55e', '#052e16'),
    artifact: createFallbackTexture('A', '#f59e0b', '#422006')
  };

  let levelMatrix = createLevelMatrix();
  let thread = [{ x: 1, y: 1 }];
  let dx = 0;
  let dy = 0;
  let artifact = pickRandomArtifact(levelMatrix, thread);
  let score = 0;
  let gameState = GAME_STATES.playing;
  let timerId = 0;
  let running = false;

  const tileSize = canvas.width / GRID_COLS;

  const emitStateUpdate = () => {
    onStateUpdate({
      score,
      gameState
    });
  };

  const resetGame = () => {
    levelMatrix = createLevelMatrix();
    thread = [{ x: 1, y: 1 }];
    dx = 0;
    dy = 0;
    score = 0;
    artifact = pickRandomArtifact(levelMatrix, thread);
    gameState = GAME_STATES.playing;
    emitStateUpdate();
  };

  const draw = () => {
    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLS; column += 1) {
        const x = column * tileSize;
        const y = row * tileSize;
        drawTile(context, textures.floor, fallbackTextures.floor, x, y, tileSize);

        if (levelMatrix[row][column] === TILE_VALUES.wall) {
          drawTile(context, textures.wall, fallbackTextures.wall, x, y, tileSize);
        }
      }
    }

    if (artifact) {
      drawTile(context, textures.artifact, fallbackTextures.artifact, artifact.x * tileSize, artifact.y * tileSize, tileSize);
    }

    thread.forEach((segment, index) => {
      const image = index === 0 ? textures.head : textures.body;
      const fallback = index === 0 ? fallbackTextures.head : fallbackTextures.body;
      drawTile(context, image, fallback, segment.x * tileSize, segment.y * tileSize, tileSize);
    });

    if (gameState === GAME_STATES.win || gameState === GAME_STATES.gameOver) {
      context.save();
      context.fillStyle = 'rgba(0, 0, 0, 0.72)';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#f8fafc';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '700 32px Inter, system-ui, sans-serif';
      context.fillText(
        gameState === GAME_STATES.win ? 'YOU WIN! Press ENTER to Restart' : 'GAME OVER! Press ENTER to Restart',
        width / 2,
        height / 2
      );
      context.restore();
    }
  };

  const scheduleNextFrame = () => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(loop, FRAME_MS);
  };

  const endGame = (nextState) => {
    if (gameState !== GAME_STATES.playing) {
      return;
    }

    gameState = nextState;
    running = false;
    window.clearTimeout(timerId);
    emitStateUpdate();
    draw();
  };

  function loop() {
    if (!running || gameState !== GAME_STATES.playing) {
      return;
    }

    if (dx === 0 && dy === 0) {
      scheduleNextFrame();
      return;
    }

    const newHead = { x: thread[0].x + dx, y: thread[0].y + dy };

    if (!isInsideGrid(newHead.x, newHead.y) || levelMatrix[newHead.y][newHead.x] === TILE_VALUES.wall) {
      crashSfx.play();
      bgm.pause();
      endGame(GAME_STATES.gameOver);
      return;
    }

    const selfCollision = thread.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
    if (selfCollision) {
      crashSfx.play();
      bgm.pause();
      endGame(GAME_STATES.gameOver);
      return;
    }

    const collectedArtifact = artifact && newHead.x === artifact.x && newHead.y === artifact.y;

    thread.unshift(newHead);

    if (collectedArtifact) {
      pickupSfx.currentTime = 0;
      pickupSfx.play();
      score += 1;
      artifact = pickRandomArtifact(levelMatrix, thread);
      if (!artifact) {
        endGame(GAME_STATES.win);
        return;
      }

      if (score >= WIN_SCORE) {
        endGame(GAME_STATES.win);
        return;
      }
    } else {
      thread.pop();
    }

    emitStateUpdate();
    draw();
    scheduleNextFrame();
  }

  function restartGame() {
    resetGame();
    running = true;
    draw();
    scheduleNextFrame();
  }

  function handleKeyDown(event) {
    if (gameState === GAME_STATES.win || gameState === GAME_STATES.gameOver) {
      if (event.key === 'Enter' || event.code === 'Enter') {
        restartGame();
        event.preventDefault();
      }
      return;
    }

    const nextDirection = {
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 }
    }[event.key];

    if (!nextDirection) {
      return;
    }

    const isReverse = nextDirection.dx === -dx && nextDirection.dy === -dy && (dx !== 0 || dy !== 0);
    if (isReverse) {
      return;
    }

    const wasIdle = dx === 0 && dy === 0;
    dx = nextDirection.dx;
    dy = nextDirection.dy;

    if (wasIdle && bgm.paused) {
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
    }
    event.preventDefault();
  }

  const loadAssets = async () => {
    const [floor, wall, head, body, artifactImage] = await Promise.all([
      loadImage(ASSET_PATHS.floor),
      loadImage(ASSET_PATHS.wall),
      loadImage(ASSET_PATHS.head),
      loadImage(ASSET_PATHS.body),
      loadImage(ASSET_PATHS.artifact)
    ]);

    textures.floor = floor;
    textures.wall = wall;
    textures.head = head;
    textures.body = body;
    textures.artifact = artifactImage;
  };

  const start = async () => {
    window.clearTimeout(timerId);
    window.addEventListener('keydown', handleKeyDown, true);

    try {
      await loadAssets();
      running = true;
      emitStateUpdate();
      draw();
      scheduleNextFrame();
    } catch (error) {
      console.error('Failed to initialize Minotaur engine:', error);
    }
  };

  start();

  return () => {
    running = false;
    window.clearTimeout(timerId);
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}