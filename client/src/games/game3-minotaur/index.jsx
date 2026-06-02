import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { game, createEngine } from './engine';

export default function Game() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    score: 0,
    gameState: 'PLAYING'
  });

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const cleanup = createEngine(canvasRef.current, game, (nextStatus) => {
      setStatus(nextStatus);
    });

    return typeof cleanup === 'function' ? cleanup : undefined;
  }, []);

  return (
    <main className="minotaur-cabinet-page">
      <button type="button" className="return-arcade-button" onClick={() => navigate('/')} aria-label="Return to Arcade">
        Return to Arcade
      </button>

      <section className="minotaur-cabinet-shell" aria-label={game?.title || 'Labyrinth of the Minotaur'}>
        <div className="minotaur-scoreboard" aria-live="polite">
          MYTHIC THREAD LENGTH: {status.score}
        </div>

        <div className="minotaur-bezel">
          <canvas
            id="gameCanvas"
            ref={canvasRef}
            width="800"
            height="600"
            className="game-canvas minotaur-canvas"
            aria-label={game?.title || 'Labyrinth of the Minotaur'}
          />
        </div>
      </section>
    </main>
  );
}
