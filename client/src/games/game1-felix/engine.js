import { findGame } from '../../data/games';
import { playManagedAudio, stopAllManagedAudio } from '../../utils/audioManager.js';

export const game = findGame('game1-felix');

// Ralph movement speed on roof
const RALPH_MOVE_SPEED = 140;

const GRID_ROWS = 4;
const GRID_COLS = 9;
const WINDOW_DRAW_WIDTH = 50;
const WINDOW_DRAW_HEIGHT = 60;
const FELIX_DRAW_WIDTH = 56;
const FELIX_DRAW_HEIGHT = 56;
const RALPH_DRAW_WIDTH = 104;
const RALPH_DRAW_HEIGHT = 92;
const PLAYER_LIVES = 3;
const MATCH_DURATION_MS = 120000;
const OPPONENT_ACTION_MS = 5000;

const WINDOW_STATES = {
  fixed: 0,
  broken: 1
};

const GAME_STATES = {
  MENU: 'MENU',
  FELIX_MODE: 'FELIX_MODE',
  RALPH_MODE: 'RALPH_MODE',
  GAME_OVER: 'GAME_OVER',
  WIN: 'WIN'
};

const ASSET_PATHS = {
  bg: '/assets/game01_felix/sprites/building_bg.png',
  brokenWindow: '/assets/game01_felix/sprites/Broken_window.png',
  fixedWindow: '/assets/game01_felix/sprites/Fixed_Window.png',
  ralph: '/assets/game01_felix/sprites/ralph_sheet.png',
  felix: '/assets/game01_felix/sprites/felix_sheet.png',
  medals: '/assets/game01_felix/sprites/ui_medals.png',
  bgm: '/assets/game01_felix/audio/bgm.mp3',
  fix: '/assets/game01_felix/audio/fix.wav',
  smash: '/assets/game01_felix/audio/smash.wav',
  jump: '/assets/game01_felix/audio/jump.wav'
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(src) {
  const image = new Image();
  const promise = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });

  image.src = src;
  return { image, promise };
}

function loadAudio(src) {
  const audio = new Audio();
  const promise = new Promise((resolve, reject) => {
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
      reject(new Error(`Failed to load audio: ${src}`));
    };

    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('loadeddata', onReady, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = src;
    audio.load();
  });

  return { audio, promise };
}

function createWindowGrid(initialState = WINDOW_STATES.broken) {
  return Array.from({ length: GRID_ROWS }, (_, rowIndex) =>
    Array.from({ length: GRID_COLS }, (_, columnIndex) => ({
      rowIndex,
      columnIndex,
      state: initialState
    }))
  );
}

function pickRandomCell(windows) {
  const rowIndex = Math.floor(Math.random() * GRID_ROWS);
  const columnIndex = Math.floor(Math.random() * GRID_COLS);
  return windows[rowIndex][columnIndex];
}

function ensureOpponentTarget(windows, targetState, replacementState) {
  if (findRandomWindowByState(windows, targetState)) {
    return;
  }

  const cell = pickRandomCell(windows);
  if (cell) {
    cell.state = replacementState;
  }
}

function forceOpponentWindow(windows, nextState) {
  const cell = pickRandomCell(windows);
  if (cell) {
    cell.state = nextState;
  }
}

function seedOpponentWindow(windows, targetState) {
  if (findRandomWindowByState(windows, targetState)) {
    return;
  }

  const cell = pickRandomCell(windows);
  if (cell) {
    cell.state = targetState;
  }
}

function countWindowsByState(windows, targetState) {
  let total = 0;
  windows.forEach((row) => {
    row.forEach((cell) => {
      if (cell.state === targetState) {
        total += 1;
      }
    });
  });
  return total;
}

function findRandomWindowByState(windows, targetState) {
  const matches = [];
  windows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell.state === targetState) {
        matches.push({ rowIndex, columnIndex });
      }
    });
  });

  if (matches.length === 0) {
    return null;
  }

  return matches[Math.floor(Math.random() * matches.length)];
}

function gridLayout(canvas) {
  const gridLeft = Math.round(canvas.width * 0.085);
  const gridTop = Math.round(canvas.height * 0.31);
  const gridWidth = Math.round(canvas.width * 0.83);
  const gridHeight = Math.round(canvas.height * 0.58);
  const cellWidth = gridWidth / GRID_COLS;
  const cellHeight = gridHeight / GRID_ROWS;

  return {
    gridLeft,
    gridTop,
    gridWidth,
    gridHeight,
    cellWidth,
    cellHeight
  };
}

function getWindowBounds(canvas, rowIndex, columnIndex) {
  const layout = gridLayout(canvas);
  return {
    x: layout.gridLeft + columnIndex * layout.cellWidth + (layout.cellWidth - WINDOW_DRAW_WIDTH) / 2,
    y: layout.gridTop + rowIndex * layout.cellHeight + (layout.cellHeight - WINDOW_DRAW_HEIGHT) / 2,
    width: WINDOW_DRAW_WIDTH,
    height: WINDOW_DRAW_HEIGHT
  };
}

function getPlayerBounds(canvas, gridX, gridY, gameState) {
  const layout = gridLayout(canvas);
  const playerWidth = gameState === GAME_STATES.FELIX_MODE ? FELIX_DRAW_WIDTH : RALPH_DRAW_WIDTH;
  const playerHeight = gameState === GAME_STATES.FELIX_MODE ? FELIX_DRAW_HEIGHT : RALPH_DRAW_HEIGHT;

  return {
    x: layout.gridLeft + gridX * layout.cellWidth + (layout.cellWidth - playerWidth) / 2,
    y: layout.gridTop + gridY * layout.cellHeight + (layout.cellHeight - playerHeight) / 2,
    width: playerWidth,
    height: playerHeight
  };
}

function getOpponentBounds(canvas, xPos, gameState) {
  const layout = gridLayout(canvas);
  const opponentWidth = gameState === GAME_STATES.FELIX_MODE ? RALPH_DRAW_WIDTH : FELIX_DRAW_WIDTH;
  const opponentHeight = gameState === GAME_STATES.FELIX_MODE ? RALPH_DRAW_HEIGHT : FELIX_DRAW_HEIGHT;
  const roofY = layout.gridTop - opponentHeight - 12;

  return {
    x: clamp(xPos, 0, canvas.width - opponentWidth),
    y: roofY,
    width: opponentWidth,
    height: opponentHeight
  };
}

function drawImage(ctx, image, x, y, width, height) {
  if (image) {
    ctx.drawImage(image, x, y, width, height);
  }
}

function isEnterKey(event) {
  return event.key === 'Enter' || event.code === 'Enter' || event.keyCode === 13 || event.which === 13;
}

export function startFelixGame(canvas, onGameOver = () => {}, onStateUpdate = () => {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return () => {};
  }

  const assetEntries = {
    bg: loadImage(ASSET_PATHS.bg),
    brokenWindow: loadImage(ASSET_PATHS.brokenWindow),
    fixedWindow: loadImage(ASSET_PATHS.fixedWindow),
    ralph: loadImage(ASSET_PATHS.ralph),
    felix: loadImage(ASSET_PATHS.felix),
    medals: loadImage(ASSET_PATHS.medals),
    bgm: loadAudio(ASSET_PATHS.bgm),
    fix: loadAudio(ASSET_PATHS.fix),
    smash: loadAudio(ASSET_PATHS.smash),
    jump: loadAudio(ASSET_PATHS.jump)
  };

  const assetPromises = Object.values(assetEntries).map((entry) => entry.promise);

  const assets = {
    bg: null,
    brokenWindow: null,
    fixedWindow: null,
    ralph: null,
    felix: null,
    medals: null,
    bgm: null,
    fix: null,
    smash: null,
    jump: null
  };

  const state = {
    gameState: GAME_STATES.MENU,
    score: 0,
    lives: PLAYER_LIVES,
    windows: createWindowGrid(),
    playerGridX: 4,
    playerGridY: 3,
    opponentX: 28,
    opponentDirection: 1,
    running: false,
    rafId: 0,
    lastTimestamp: 0,
    winOwner: null,
    modeStartedAt: 0,
    opponentIntervalId: 0,
    opponentTickCount: 0
  };

  function emitStateUpdate() {
    onStateUpdate({
      score: state.score,
      lives: state.lives,
      currentMode: state.gameState,
      opponentTickCount: state.opponentTickCount
    });
  }

  function resetModeState(nextState) {
    state.gameState = nextState;
    state.score = 0;
    state.lives = PLAYER_LIVES;
    state.windows = createWindowGrid(nextState === GAME_STATES.RALPH_MODE ? WINDOW_STATES.fixed : WINDOW_STATES.broken);
    seedOpponentWindow(
      state.windows,
      nextState === GAME_STATES.FELIX_MODE ? WINDOW_STATES.fixed : WINDOW_STATES.broken
    );
    state.playerGridX = 4;
    state.playerGridY = 3;
    state.opponentX = 28;
    state.opponentDirection = 1;
    state.modeStartedAt = Date.now();
    state.winOwner = null;
    state.running = true;
    state.lastTimestamp = 0;
    state.opponentTickCount = 0;

    if (state.opponentIntervalId) {
      window.clearInterval(state.opponentIntervalId);
    }

    state.opponentIntervalId = window.setInterval(() => {
      if (!state.running || state.gameState === GAME_STATES.MENU) {
        return;
      }

      if (state.gameState === GAME_STATES.FELIX_MODE) {
        forceOpponentWindow(state.windows, WINDOW_STATES.broken);
        seedOpponentWindow(state.windows, WINDOW_STATES.fixed);
        state.score -= 25;
      } else if (state.gameState === GAME_STATES.RALPH_MODE) {
        forceOpponentWindow(state.windows, WINDOW_STATES.fixed);
        seedOpponentWindow(state.windows, WINDOW_STATES.broken);
        state.score -= 25;
      }

      state.opponentTickCount += 1;

      emitStateUpdate();
    }, OPPONENT_ACTION_MS);
  }

  function resetAll() {
    state.gameState = GAME_STATES.MENU;
    state.score = 0;
    state.lives = PLAYER_LIVES;
    state.windows = createWindowGrid(WINDOW_STATES.broken);
    state.playerGridX = 4;
    state.playerGridY = 3;
    state.opponentX = 28;
    state.opponentDirection = 1;
    state.running = false;
    state.lastTimestamp = 0;
    state.modeStartedAt = 0;
    state.winOwner = null;
    state.opponentTickCount = 0;

    if (state.opponentIntervalId) {
      window.clearInterval(state.opponentIntervalId);
      state.opponentIntervalId = 0;
    }
  }

  function startMode(nextState) {
    resetModeState(nextState);
    emitStateUpdate();
  }

  function finishGame(nextState, winner) {
    if (state.gameState === GAME_STATES.WIN || state.gameState === GAME_STATES.GAME_OVER) {
      return;
    }

    state.gameState = nextState;
    state.running = false;
    state.winOwner = winner || null;
    emitStateUpdate();
    queueMicrotask(() => onGameOver(state.score));
  }

  function allWindowsMatchGoal() {
    const goalState = state.gameState === GAME_STATES.FELIX_MODE ? WINDOW_STATES.fixed : WINDOW_STATES.broken;
    return countWindowsByState(state.windows, goalState) === GRID_ROWS * GRID_COLS;
  }

  function drawBackground() {
    if (assets.bg) {
      ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.fillStyle = '#09111f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawWindowCell(cell) {
    const bounds = getWindowBounds(canvas, cell.rowIndex, cell.columnIndex);
    const image = cell.state === WINDOW_STATES.fixed ? assets.fixedWindow : assets.brokenWindow;
    drawImage(ctx, image, bounds.x, bounds.y, bounds.width, bounds.height);
  }

  function drawPlayer() {
    const bounds = getPlayerBounds(canvas, state.playerGridX, state.playerGridY, state.gameState);
    const image = state.gameState === GAME_STATES.FELIX_MODE ? assets.felix : assets.ralph;
    drawImage(ctx, image, bounds.x, bounds.y, bounds.width, bounds.height);
  }

  function drawOpponent() {
    const bounds = getOpponentBounds(canvas, state.opponentX, state.gameState);
    const image = state.gameState === GAME_STATES.FELIX_MODE ? assets.ralph : assets.felix;
    drawImage(ctx, image, bounds.x, bounds.y, bounds.width, bounds.height);
  }

  function drawMenu() {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(54, 246, canvas.width - 108, 116);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = '700 24px Inter, system-ui, sans-serif';
    ctx.fillText('Press F for Felix Mode', canvas.width / 2, 288);
    ctx.fillText('Press R for Ralph Mode', canvas.width / 2, 322);
    ctx.restore();
  }

  function drawWinOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (assets.medals) {
      const medalSize = 160;
      const medalX = (canvas.width - medalSize) / 2;
      const medalY = (canvas.height - medalSize) / 2 - 60;
      ctx.drawImage(assets.medals, medalX, medalY, medalSize, medalSize);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN! Press ENTER to Restart', canvas.width / 2, canvas.height / 2 + 90);
    ctx.restore();
  }

  function drawGameOverOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER! Press ENTER to Restart', canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  function updateMode(deltaTime) {
    if (state.gameState === GAME_STATES.MENU) {
      return;
    }

    const now = Date.now();

    state.opponentX += state.opponentDirection * RALPH_MOVE_SPEED * deltaTime;
    if (state.opponentX <= 0) {
      state.opponentX = 0;
      state.opponentDirection = 1;
    } else if (state.opponentX >= canvas.width - RALPH_DRAW_WIDTH) {
      state.opponentX = canvas.width - RALPH_DRAW_WIDTH;
      state.opponentDirection = -1;
    }

    if (now - state.modeStartedAt >= MATCH_DURATION_MS) {
      finishGame(GAME_STATES.GAME_OVER, null);
      return;
    }

    if (allWindowsMatchGoal()) {
      finishGame(GAME_STATES.WIN, state.gameState === GAME_STATES.FELIX_MODE ? 'FELIX' : 'RALPH');
    }

    emitStateUpdate();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (state.gameState === GAME_STATES.MENU) {
      drawMenu();
      return;
    }

    state.windows.forEach((row) => row.forEach((cell) => drawWindowCell(cell)));
    drawOpponent();
    drawPlayer();

    if (state.gameState === GAME_STATES.WIN) {
      drawWinOverlay();
      return;
    }

    if (state.gameState === GAME_STATES.GAME_OVER) {
      drawGameOverOverlay();
    }
  }

  function loop(timestamp) {
    if (!state.running) {
      return;
    }

    const deltaTime = state.lastTimestamp ? Math.min((timestamp - state.lastTimestamp) / 1000, 0.05) : 0;
    state.lastTimestamp = timestamp;
    updateMode(deltaTime);
    draw();

    if (state.running) {
      state.rafId = window.requestAnimationFrame(loop);
    }
  }

  function restartToMenu() {
    resetAll();
    emitStateUpdate();
    state.running = true;
    state.rafId = window.requestAnimationFrame(loop);
  }

  function handleKeyDown(event) {
    if (state.gameState === GAME_STATES.GAME_OVER || state.gameState === GAME_STATES.WIN) {
      if (isEnterKey(event)) {
        restartToMenu();
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'f' || event.key === 'F') {
      startMode(GAME_STATES.FELIX_MODE);
      event.preventDefault();
      return;
    }

    if (event.key === 'r' || event.key === 'R') {
      startMode(GAME_STATES.RALPH_MODE);
      event.preventDefault();
      return;
    }

    if (state.gameState === GAME_STATES.MENU) {
      if (isEnterKey(event)) {
        startMode(GAME_STATES.FELIX_MODE);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      state.playerGridX = clamp(state.playerGridX - 1, 0, GRID_COLS - 1);
      emitStateUpdate();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight') {
      state.playerGridX = clamp(state.playerGridX + 1, 0, GRID_COLS - 1);
      emitStateUpdate();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowUp') {
      const nextGridY = clamp(state.playerGridY - 1, 0, GRID_ROWS - 1);
      if (nextGridY !== state.playerGridY) {
        state.playerGridY = nextGridY;
        playManagedAudio(assets.jump, { volume: 0.05 }).catch(() => {});
      }
      emitStateUpdate();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowDown') {
      const nextGridY = clamp(state.playerGridY + 1, 0, GRID_ROWS - 1);
      if (nextGridY !== state.playerGridY) {
        state.playerGridY = nextGridY;
        playManagedAudio(assets.jump, { volume: 0.05 }).catch(() => {});
      }
      emitStateUpdate();
      event.preventDefault();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space' || event.code === 'Space' || event.keyCode === 32 || event.which === 32) {
      const goalState = state.gameState === GAME_STATES.FELIX_MODE ? WINDOW_STATES.fixed : WINDOW_STATES.broken;
      const oppositeState = goalState === WINDOW_STATES.fixed ? WINDOW_STATES.broken : WINDOW_STATES.fixed;

      const cell = state.windows[state.playerGridY][state.playerGridX];
      if (cell && cell.state === oppositeState) {
        cell.state = goalState;
        state.score += 100;
        if (state.gameState === GAME_STATES.FELIX_MODE) {
          playManagedAudio(assets.fix, { volume: 0.10 }).catch(() => {});
        } else if (state.gameState === GAME_STATES.RALPH_MODE) {
          playManagedAudio(assets.smash, { volume: 0.15 }).catch(() => {});
        }
      }

      emitStateUpdate();
      event.preventDefault();
    }
  }

  Promise.all(assetPromises)
    .then((loadedAssets) => {
      Object.keys(assetEntries).forEach((key, index) => {
        const entry = assetEntries[key];
        assets[key] = entry.image || entry.audio || loadedAssets[index];
      });

      stopAllManagedAudio();
      if (assets.bgm) {
        playManagedAudio(assets.bgm, { loop: true, volume: 0.45 }).catch(() => {
          const startBgmOnGesture = () => {
            playManagedAudio(assets.bgm, { loop: true, volume: 0.45 }).catch(() => {});
            window.removeEventListener('pointerdown', startBgmOnGesture);
            window.removeEventListener('keydown', startBgmOnGesture);
          };

          window.addEventListener('pointerdown', startBgmOnGesture, { once: true });
          window.addEventListener('keydown', startBgmOnGesture, { once: true });
        });
      }

      state.running = true;
      state.gameState = GAME_STATES.MENU;
      emitStateUpdate();
      document.addEventListener('keydown', handleKeyDown, true);
      state.rafId = window.requestAnimationFrame(loop);
    })
    .catch((error) => {
      console.error('Failed to initialize Felix engine:', error);
    });

  return () => {
    state.running = false;
    window.cancelAnimationFrame(state.rafId);
    if (state.opponentIntervalId) {
      window.clearInterval(state.opponentIntervalId);
    }
    document.removeEventListener('keydown', handleKeyDown, true);
    stopAllManagedAudio();

    if (assets.bgm) {
      assets.bgm.pause();
      assets.bgm.currentTime = 0;
    }
  };
}
