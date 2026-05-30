import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/games', gameRoutes);

app.get('/api/test', (_req, res) => {
  res.json({ message: 'Arcade API is live' });
});

app.listen(port, () => {
  console.log(`Arcade API running on port ${port}`);
});
