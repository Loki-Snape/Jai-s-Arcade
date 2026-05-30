# Arcade Portfolio

A two-part arcade portfolio scaffold with an Express + PostgreSQL backend and a React + Vite frontend.

## Layout

- `server/` contains the API, auth, and score endpoints.
- `client/` contains the arcade lobby and game shells.
- Game metadata is centralized so the 20-game roster can be rendered from a single source of truth.

## Next steps

1. Install dependencies in `server/` and `client/`.
2. Set `server/.env` and `client/.env`.
3. Connect the game shells to real gameplay logic.
