import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { game, createEngine } from './engine';

const INITIAL_STATUS = {
  score: 0,
  lives: 3,
  gameState: 'PLAYING'
};

export default function Game() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const cleanup = createEngine(canvasRef.current, game, (nextStatus) => {
      setStatus(nextStatus);
    });

    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [restartKey, status.gameState]);

  // Play ghost message on WIN state
  useEffect(() => {
    if (status.gameState === 'WIN') {
      const winAudio = new Audio('/assets/game04_tuner/audio/ghost_message.mp3');
      winAudio.volume = 1.0; // Forces 100% volume
      winAudio.play().catch(e => console.error("Audio block:", e));
    }
  }, [status.gameState]);

  const handleRestart = () => {
    setStatus(INITIAL_STATUS);
    setRestartKey((current) => current + 1);
  };

  const isPlaying = status.gameState === 'PLAYING';
  const isGameOver = status.gameState === 'GAME_OVER';
  const isWin = status.gameState === 'WIN';

  const endScreenStyle = {
    minHeight: '100%',
    display: 'grid',
    placeItems: 'center',
    padding: '28px',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background:
      'radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 38%), linear-gradient(180deg, #020205 0%, #08090d 45%, #0d0b10 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 0 36px rgba(0, 0, 0, 0.7)',
    color: '#e2e8f0'
  };

  const endPanelStyle = {
    width: 'min(520px, 100%)',
    display: 'grid',
    gap: '18px',
    justifyItems: 'center',
    textAlign: 'center'
  };

  const restartButtonStyle = {
    padding: '14px 24px',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    background: 'linear-gradient(180deg, rgba(14, 18, 24, 0.98), rgba(4, 6, 10, 1))',
    color: isGameOver ? '#ff6b6b' : '#7CFF7A',
    boxShadow: isGameOver
      ? '0 0 18px rgba(255, 52, 52, 0.45), 0 0 40px rgba(255, 52, 52, 0.18)'
      : '0 0 18px rgba(124, 255, 122, 0.45), 0 0 40px rgba(124, 255, 122, 0.18)',
    cursor: 'pointer',
    fontFamily: 'Press Start 2P, monospace',
    fontSize: '0.72rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase'
  };

  return (
    <main className="page-shell game-shell">
      <header className="hero-banner compact">
        <div>
          <p className="eyebrow">Now playing</p>
          <h1>{game?.title || 'Frequency Tuner'}</h1>
          <p>SCORE: {status.score} | LIVES: {status.lives} | STATE: {status.gameState}</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => navigate('/')}>
          Back to lobby
        </button>
      </header>

      <section className="game-layout">
        {isPlaying ? (
          <div className="canvas-card" key={restartKey}>
            <canvas
              id="gameCanvas"
              ref={canvasRef}
              width="800"
              height="600"
              className="game-canvas"
              aria-label={game?.title || 'Frequency Tuner'}
            />
          </div>
        ) : (
          <div className="canvas-card" key={restartKey}>
            <div style={endScreenStyle}>
              <div style={endPanelStyle}>
                {isGameOver ? (
                  <h2 style={{ margin: 0, color: '#ff4d4d', fontFamily: 'Press Start 2P, monospace', fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '0.12em', textShadow: '0 0 14px rgba(255, 61, 61, 0.8), 0 0 32px rgba(255, 61, 61, 0.35)' }}>
                    SIGNAL LOST
                  </h2>
                ) : (
                  <h2 style={{ margin: 0, color: '#7CFF7A', fontFamily: 'Press Start 2P, monospace', fontSize: 'clamp(1.6rem, 3.6vw, 2.9rem)', letterSpacing: '0.12em', textShadow: '0 0 14px rgba(124, 255, 122, 0.8), 0 0 32px rgba(124, 255, 122, 0.35)' }}>
                    MESSAGE DECODED
                  </h2>
                )}

                <p style={{ margin: 0, color: '#cbd5e1', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', letterSpacing: '0.08em' }}>
                  FINAL SCORE: {status.score}
                </p>

                <button type="button" style={restartButtonStyle} onClick={handleRestart}>
                  RESTART
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}