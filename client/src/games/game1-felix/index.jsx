import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { game, startFelixGame } from './engine.js';

function getModeDisplay(currentMode) {
  const modeMap = {
    MENU: 'Insert Coin (Select Mode)',
    FELIX_MODE: 'Mode: Fix-it',
    RALPH_MODE: 'Mode: Wreck-it',
    WIN: 'Mode: Fix-it',
    GAME_OVER: 'Mode: Fix-it'
  };
  return modeMap[currentMode] || currentMode;
}

export default function Game() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [status, setStatus] = useState({
    score: 0,
    lives: 3,
    currentMode: 'MENU',
    opponentTickCount: 0
  });

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    canvasRef.current.focus();

    let active = true;
    const activeGameId = gameId || game?.id || '';

    const cleanup = startFelixGame(
      canvasRef.current,
      async (finalScore) => {
        if (!active || !activeGameId) {
          return;
        }

        try {
          await axiosClient.post('/api/scores', {
            game_id: activeGameId,
            score: finalScore
          });
        } catch (_error) {
          // Ignore score submission failures so the end-state flow stays smooth.
        }
      },
      (nextStatus) => {
        if (active) {
          setStatus(nextStatus);
        }
      }
    );

    return () => {
      active = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [gameId]);

  return (
    <main className="page-shell felix-cabinet-page">
      <button className="return-lobby-button" onClick={() => navigate('/')} aria-label="Return to lobby">
        ↩
      </button>
      <section className="felix-cabinet" aria-label={game?.title || 'Fix-It Felix cabinet'}>
        <div className="felix-scoreboard" aria-live="polite">
          {getModeDisplay(status.currentMode)} | SCORE: {status.score} | LIVES: {status.lives} | TICK: {status.opponentTickCount}
        </div>
        <div className="felix-screen-bezel">
          <canvas ref={canvasRef} tabIndex={0} width="800" height="600" className="game-canvas" aria-label={game?.title || 'Fix-It Felix'} />
        </div>
      </section>
    </main>
  );
}