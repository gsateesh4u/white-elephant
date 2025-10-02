# White Elephant Party Game

React + Java (Spring Boot) implementation of a host-driven White Elephant gift exchange with in-memory state, celebratory effects, and turnkey host controls.

## Project layout

- `backend/` - Spring Boot REST API that keeps the game state in memory.
- `frontend/` - Vite + React control room for the host (includes animations and music cues).

## Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

Default port is `8080`. API base path is `/api`.

### Host credentials

```
username: host
password: holidaypass
```

## Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` calls to the backend.

For a production build:

```bash
npm run build
```

## Gameplay highlights

- Shuffle the participant order before the first turn.
- Reveal or steal gifts with a per-gift steal cap of two.
- Automatic turn hand-offs on steals and passes.
- Endless swap phase after the first round until a host ends the game or every gift is locked.
- Animated overlays and sound cues for shuffles, reveals, steals, and passes.
- In-memory reset endpoint to start fresh in seconds.

## Useful API routes

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/host/login` | Obtain the `X-Host-Token` header for protected actions |
| GET | `/api/game/state` | Fetch the current game snapshot |
| POST | `/api/game/shuffle` | Randomize participant order (before the first turn begins) |
| POST | `/api/game/turn/unwrap` | Reveal a selected wrapped gift for the active participant |
| POST | `/api/game/turn/steal` | Steal a revealed gift (respecting the two-steal limit) |
| POST | `/api/game/turn/pass` | Pass during the swap phase without stealing |
| POST | `/api/game/turn/end` | Lock the board when everyone is satisfied |
| POST | `/api/game/reset` | Reset everything to the seeded state |

All protected routes require the `X-Host-Token` header returned by the login call.
