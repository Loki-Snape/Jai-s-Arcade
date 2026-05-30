import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

function getUserIdFromReq(req) {
  if (req.user && req.user.userId) return req.user.userId;

  const auth = req.headers?.authorization || req.get('Authorization');
  if (!auth) return null;

  const parts = auth.split(' ');
  if (parts.length !== 2) return null;

  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.userId || payload.sub || null;
  } catch (err) {
    return null;
  }
}

export async function submitScore(req, res) {
  const { game_id, score } = req.body;

  if (!game_id) return res.status(400).json({ message: 'game_id is required' });
  if (typeof score !== 'number') return res.status(400).json({ message: 'score must be a number' });

  const userId = getUserIdFromReq(req);

  try {
    // verify game exists
    const g = await pool.query('SELECT id FROM games WHERE id = $1', [game_id]);
    if (g.rowCount === 0) return res.status(404).json({ message: 'Game not found' });

    const insert = await pool.query(
      'INSERT INTO scores (game_id, user_id, score) VALUES ($1, $2, $3) RETURNING id, game_id, user_id, score, achieved_at',
      [game_id, userId, score]
    );

    return res.status(201).json({ score: insert.rows[0] });
  } catch (error) {
    console.error('submitScore error:', error);
    return res.status(500).json({ message: 'Unable to submit score' });
  }
}

export async function getLeaderboard(req, res) {
  const { game_id } = req.params;
  const limit = Number(req.query.limit || 10);

  if (!game_id) return res.status(400).json({ message: 'game_id param is required' });

  try {
    const result = await pool.query(
      `SELECT s.id, s.score, s.achieved_at, COALESCE(u.username, 'Guest') AS username
       FROM scores s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.game_id = $1
       ORDER BY s.score DESC, s.achieved_at ASC
       LIMIT $2`,
      [game_id, limit]
    );

    return res.json({ leaderboard: result.rows });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ message: 'Unable to fetch leaderboard' });
  }
}
