import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { games, findGame } from '../data/games';
import GameWrapper from '../games/GameWrapper';

const gameModules = import.meta.glob('../games/game*/index.jsx');

export default function Game() {
  const { slug } = useParams();
  const game = useMemo(() => findGame(slug), [slug]);
  const [GameComponent, setGameComponent] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadGame() {
      if (!game) {
        setGameComponent(null);
        return;
      }

      const modulePath = `../games/${game.id}/index.jsx`;
      const loader = gameModules[modulePath];

      if (!loader) {
        setGameComponent(() => () => <GameWrapper gameId={game.id} game={game} />);
        return;
      }

      const module = await loader();
      if (active) {
        setGameComponent(() => module.default);
      }
    }

    loadGame();

    return () => {
      active = false;
    };
  }, [game]);

  if (!game) {
    return (
      <main className="page-shell">
        <p>Game not found.</p>
      </main>
    );
  }

  if (!GameComponent) {
    return (
      <main className="page-shell">
        <p>Loading {game.title}...</p>
      </main>
    );
  }

  return <GameComponent />;
}
