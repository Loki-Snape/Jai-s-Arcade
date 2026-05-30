import express from 'express';
import { getLeaderboard, submitScore } from '../controllers/scoreController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/scores/:game_id - top scores for a game
router.get('/:game_id', getLeaderboard);

// POST /api/scores/:game_id - submit a score (protected)
router.post('/:game_id', verifyToken, (req, res, next) => {
	// ensure submitScore receives game_id in body for compatibility
	req.body = req.body || {};
	req.body.game_id = req.params.game_id;
	return submitScore(req, res, next);
});

export default router;
