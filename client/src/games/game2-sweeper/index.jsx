import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { game, createEngine } from './engine';

export default function Game() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const cleanup = createEngine(canvasRef.current, game, ({ score: nextScore }) => {
      setScore(nextScore);
    });

    return typeof cleanup === 'function' ? cleanup : undefined;
  }, []);

  return (
    <main className="sweeper-cabinet-page">
      <button type="button" className="return-arcade-button" onClick={() => navigate('/')} aria-label="Return to Arcade">
        Return to Arcade
      </button>

      <section className="sweeper-cabinet-shell" aria-label="Spectral Sweeper arcade cabinet">
        <div className="sweeper-scoreboard">
          SPECTRAL SWEEPER | SCORE: {score}
        </div>

        <div className="sweeper-bezel">
          <canvas
            id="gameCanvas"
            ref={canvasRef}
            width="800"
            height="600"
            className="game-canvas sweeper-canvas"
            aria-label="Spectral Sweeper"
          />
        </div>
      </section>
    </main>
  );
}
