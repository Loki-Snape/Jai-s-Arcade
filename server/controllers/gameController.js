import { games } from '../data/games.js';

export function getGames(_req, res) {
  res.json({ games });
}

export function getGameBySlug(req, res) {
  const game = games.find((entry) => entry.slug === req.params.slug || entry.id === req.params.slug);

  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  return res.json({ game });
}
