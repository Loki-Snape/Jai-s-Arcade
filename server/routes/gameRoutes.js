import express from 'express';
import { getGames, getGameBySlug } from '../controllers/gameController.js';

const router = express.Router();

router.get('/', getGames);
router.get('/:slug', getGameBySlug);

export default router;
