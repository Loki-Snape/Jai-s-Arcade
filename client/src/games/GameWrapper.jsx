import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createEngine } from './sharedEngine';

export default function GameWrapper({ gameId, GameLogic, game, onGameOver = () => {}, onStateUpdate = () => {}, createEngine: buildEngine = createEngine }) {
  const canvasRef = useRef(null);
  const activeGameId = gameId || game?.id || '';
  const activeGameTitle = game?.title || 'Game';

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    if (typeof GameLogic === 'function') {
      const cleanup = GameLogic(canvasRef.current, onGameOver, onStateUpdate);
      return typeof cleanup === 'function' ? cleanup : undefined;
    }

    if (game) {
      return buildEngine(canvasRef.current, game);
    }

    return undefined;
  }, [GameLogic, buildEngine, game]);

  return (
    <main className="page-shell game-shell game-wrapper-shell">
      <header className="hero-banner compact game-wrapper-header">
        <div>
          <p className="eyebrow">Now playing</p>
          <h1>{activeGameTitle}</h1>
          <p>{activeGameId || "Jai's Arcade session"}</p>
        </div>
        <Link to="/" className="ghost-button">
          Back to lobby
        </Link>
      </header>

      <section className="game-layout game-wrapper-layout">
        <div className="canvas-card game-wrapper-canvas-card">
          <canvas id="gameCanvas" ref={canvasRef} width="800" height="600" className="game-canvas" aria-label={activeGameTitle} />
        </div>
      </section>
    </main>
  );
}
