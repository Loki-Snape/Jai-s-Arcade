CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  score INTEGER NOT NULL,
  achieved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_scores_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_scores_game
    FOREIGN KEY (game_id)
    REFERENCES games (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores (user_id);
CREATE INDEX IF NOT EXISTS idx_scores_game_id ON scores (game_id);
