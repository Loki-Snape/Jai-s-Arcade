import { Link } from 'react-router-dom';

export default function GameCard({ game }) {
  const destination = game.id === 'game1-felix' ? '/play/game1-felix' : `/games/${game.slug}`;

  return (
    <Link to={destination} className="game-card-link" aria-label={`Play ${game.title}`}>
      <article className="game-card">
        <div className="game-card__screen">
          <img className="game-card__thumbnail" src={game.thumbnail_url} alt={game.title} loading="lazy" />
        </div>
        <h3 className="game-card__title">{game.title}</h3>
        <p className="game-card__description">{game.description}</p>
      </article>
    </Link>
  );
}
