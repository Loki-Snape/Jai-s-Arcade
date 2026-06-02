import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import axiosClient from '../api/axiosClient';

export default function Lobby() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const lobbyMusicRef = useRef(new Audio('/assets/lobby/audio/lobby_bgm.wav'));

  useEffect(() => {
    let active = true;

    async function loadGames() {
      try {
        setLoading(true);
        setError('');

        const response = await axiosClient.get('/api/games');
        const nextGames = response.data.games || [];

        if (active) {
          setGames(nextGames);
        }
      } catch (fetchError) {
        if (active) {
          setError('Unable to load arcade roster.');
          setGames([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const lobbyMusic = lobbyMusicRef.current;
    lobbyMusic.loop = true;

    if (isMusicPlaying) {
      lobbyMusic.play().catch(() => {});
    } else {
      lobbyMusic.pause();
    }

    return () => {
      lobbyMusic.pause();
    };
  }, [isMusicPlaying]);

  return (
    <main className="lobby-page-shell">
      <button
        type="button"
        className="lobby-music-toggle"
        onClick={() => setIsMusicPlaying((current) => !current)}
        aria-pressed={isMusicPlaying}
        aria-label={isMusicPlaying ? 'Turn lobby music off' : 'Turn lobby music on'}
      >
        {isMusicPlaying ? '🎵 Music: ON' : '🔇 Music: OFF'}
      </button>

      <Navbar />
      <header className="lobby-masthead">
        <p className="lobby-kicker">Press start</p>
        <h1 className="lobby-title">JAI&apos;S ARCADE</h1>
        <p className="lobby-subtitle">Twenty games. One neon cabinet wall.</p>
      </header>
      {loading && <div className="status-pill lobby-status">Loading arcade roster...</div>}
      {error && !loading && <div className="status-pill lobby-status lobby-status--error">{error}</div>}
      <section className="game-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
    </main>
  );
}
