import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import axiosClient from '../api/axiosClient';

export default function Lobby() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <main className="page-shell">
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
