# Jai's Arcade

Jai's Arcade is a React + Vite arcade frontend backed by an Express + PostgreSQL API. It is named after my younger brother Jai. The project is structured around a central lobby that launches a growing roster of canvas games, each with its own engine, asset set, and score/state flow.

## What This Project Includes

- A neon-styled lobby that loads the full arcade roster from the API.
- A shared game shell for most titles and custom cabinet layouts for selected games.
- Canvas-based engines for multiple arcade modes with keyboard input, scoring, collision handling, and restart flow.
- Background music and sound effects for the lobby and selected games.
- A backend score API and game metadata source that keep the frontend roster consistent.

## Project Structure

- `client/` contains the React frontend, lobby, wrappers, game pages, shared UI, and canvas engines.
- `server/` contains the API routes, auth flow, score handling, and database access.
- `client/src/data/games.js` is the single source of truth for the full 20-game roster.
- `client/public/assets/` stores game sprites, audio, thumbnails, and other static media.

## Lobby

The lobby is the main entry point for the arcade.

- It loads the current game roster from `/api/games` and renders each game card from the shared metadata source.
- It uses a full-screen arcade presentation with a dark, atmospheric background and neon-style UI.
- It includes lobby background music with a toggle button in the top-right corner.
- The lobby music is managed with a browser-safe `Audio` ref and pauses on route changes so game music can take over cleanly.
- The navbar links back to the lobby and auth page, matching the rest of the arcade shell.

## Arcade Pages And Engines

The arcade now includes 20 games. Each card links to its own route, and each engine handles its own gameplay loop and assets.

### Game List

- `Wreck-It Ralph / Fix-It Felix` - Choose Ralph or Felix and climb the building while dodging hazards.
- `Spectral Sweeper` - Collect residual energy while avoiding shadow entities.
- `Labyrinth of the Minotaur` - Guide a growing thread of light through a cursed maze.
- `Frequency Tuner` - Time your taps to lock a spirit signal.
- `Astro-Miner` - Defend a drilling rig from debris and alien parasites.
- `EVP Catcher` - Cross a poltergeist-infested room and place recorders.
- `Block Builder's Quest` - Arrange falling blocks to build a bridge over lava.
- `Crypto-Hacker` - Break through a firewall and retrieve hidden files.
- `Yokai Tower` - Drop swinging talismans to build a seal tower.
- `Neon Drift` - Dodge traffic and keep your hover-car cooled.
- `Phantom Defense` - Place defenses to stop entities reaching the core.
- `Relic Hunter` - Dig through terrain and drop boulders on monsters.
- `Glitch Runner` - Run, jump, and slide to outrun deletion.
- `Galactic Delivery` - Land a fragile cargo ship with precision.
- `Poltergeist Ping` - Bounce the orb while gravity shifts unpredictably.
- `Chrono-Sniper` - Click timeline anomalies before they vanish.
- `Slime Survivor` - Auto-fire at expanding hordes and upgrade through gems.
- `Mythic Descent` - Jump upward through runes and avoid falling back down.
- `Shadow Jumper` - Leap across disappearing platforms to gather light.
- `Alchemist's Cauldron` - Aim potion shots and match colors to clear the screen.

### Current Gameplay Notes

- `Wreck-It Ralph / Fix-It Felix` uses a custom cabinet wrapper with visible score, lives, and tick state. It includes bgm plus effect sounds for moving, fixing, smashing, and collision feedback.
- `Spectral Sweeper` uses a custom canvas engine with asset loading, timed enemy movement, collectible nodes, and win/game-over overlays.
- `Labyrinth of the Minotaur` uses a snake-like thread engine with grid collision, artifact pickup, and a React score/state callback.
- The remaining games are registered through the shared metadata and are rendered through the common game shell unless they need a custom cabinet.

## Shared UI Patterns

- The arcade uses a consistent retro visual language across pages, with glowing panels, beveled cabinets, and dark gradient backgrounds.
- Game wrappers mount a canvas into a React page and pass state back up through callbacks where needed.
- Audio is managed per page so the lobby, Felix, Sweeper, and Minotaur can each own their own playback lifecycle.

## Backend

- The backend exposes the game roster and score endpoints used by the lobby and game pages.
- Score submission is handled through the API and tied to the game identifier coming from the frontend metadata.
- The project uses PostgreSQL for persistent data.

## Local Setup

1. Install dependencies in both app folders.
2. Configure environment variables for the server and client.
3. Start the backend and frontend development servers.

Example commands:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

## Asset Conventions

- Game art and audio are stored under `client/public/assets/`.
- Game-specific assets follow the folder naming pattern used by the game ID.
- Canvas engines use absolute asset paths so they work correctly in local development and production builds.

## Build Notes

- The client has been validated with a production build after the current round of game and lobby updates.
- Game shells that manage their own audio should stop playback on unmount so route changes do not leave background music running.

## Current Status

- The lobby is live and includes a music toggle.
- Felix, Spectral Sweeper, and Labyrinth of the Minotaur have custom engine work beyond the shared wrapper.
- The full 20-game roster is centralized and visible from the lobby.

## Next Steps

- Add or refine the remaining game engines as needed.
- Expand score tables, leaderboards, or per-game instructions if you want each game page to explain its controls.
- Keep game metadata in `client/src/data/games.js` synchronized with the lobby cards and route structure.
