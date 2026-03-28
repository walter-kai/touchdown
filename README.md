# Touchdown

Touchdown is a live NFL/NBA pick game where users choose a 5-player lineup during a live game and score points from real play-by-play events.

The app is built as:

- Next.js client (in [client](client))
- Express + TypeScript API server (in [server](server))
- Firebase (users + picks persistence)
- ESPN APIs (scoreboard, summary, plays)

---

## How the game works

### Core loop

1. Open a game page (`/nfl/game/:gameId` or `/nba/game/:gameId`).
2. Pick up to **5 players** from the two teams.
3. Press **Lock In**.
4. Your lineup is locked for **120 seconds**.
5. During lock, your players earn points from live plays.
6. After cooldown ends, you can swap players and lock again.
7. Repeat during the game to maximize score.

### Pregame behavior

- Picks are locked before the game starts.
- Picks unlock **2 minutes before game start**.

---

## Rules

These rules are based on current implementation in the codebase:

1. **Roster size:** max 5 active picks.
2. **Swap model:** swaps are **slot-based** (index 1–5). If a slot in NEW is empty, current player in that slot is kept.
3. **Lock window:** every lock starts a fixed **120s cooldown** where edits are blocked.
4. **Multiple lock sessions per game:** each lock is saved as a pick submission with timestamp.
5. **No duplicate player in current/new composition:** duplicate adds are prevented in selection flow.
6. **Auth required to save picks:** unauthenticated users see a sign-in gate before lock-in.

---

## Points system

### What counts as 1 point

A player gets +1 whenever that player appears in `athletesInvolved` for a play event.

So if athlete `A` appears in 8 qualifying plays, athlete score is 8 for that scope.

### Score types used in UI

Touchdown tracks 3 score views:

1. **Game Score (`gameScores`)**
	- All qualifying plays in the full game.
	- Per-athlete total, independent of your lock time.

2. **Session Score (`sessionScores`)**
	- Qualifying plays for your **current lineup** after your **latest lock timestamp**.
	- Used as “MY SCORE” in current lock session.

3. **User Score (`userScores`)**
	- Accumulated score per athlete across all your lock periods in the game.
	- If you drop and re-add a player later, only plays in active lock periods count.

### Total score

Total game score for a user is:

$$
	ext{totalScore} = \sum_{p \in \text{all picked athletes}} \text{userScores}[p]
$$

### Important fallback behavior

If ESPN play-by-play is unavailable for a game (for example old/404 events), the app falls back to stored pick `totalScore` instead of recomputing from plays.

---

## Data model (current)

### Picks collection

Each user/game pair is stored in one document:

- `picks/{gameId}:{displayName}`
  - `email`
  - `displayName`
  - `gameId`
  - `picks: PickSubmission[]`
  - `timestamp` (last update)
  - `teamData` / `teamLogos` (metadata)

Each `PickSubmission` stores:

- `players[]`
- `timestamp` (lock time)
- `totalScore`
- optional `playerHistory` ranges

### Users collection

- `users/{email}` contains profile/auth info and game references (`gameIds`).

---

## API overview

### Auth

- `POST /auth/google`
- `GET /auth/google/login`
- `GET /auth/google/callback`
- `GET /auth/test` (test login)

### Picks

- `POST /api/picks` (save lock submission)
- `GET /api/picks/game/:gameId/user`
- `GET /api/picks/game/:gameId/user/latest`
- `GET /api/picks/game/:gameId/user/history`
- `GET /api/picks/game/:gameId/user/scores`
- `GET /api/picks/game/:gameId/stats`
- `GET /api/picks/user/all`
- `GET /api/picks/user/all-for-dashboard`
- `GET /api/picks/user/all-with-scores`

### Leaderboard / game data

- `GET /api/leaderboard`
- `GET /api/game-data/:league/:gameId`

---

## Local development

### Requirements

- Node.js 20+
- npm
- Firebase project/service account
- Google OAuth credentials

### Install

At repo root:

1. `npm install`
2. `cd client && npm install`

### Run

From repo root:

- `npm run dev`

This starts:

- Next.js client on `http://localhost:3000`
- Express API on `http://localhost:3001`

---

## Environment variables

Create root `.env` (server reads from `server/server.ts` bootstrap):

- `BACKEND_PORT=3001`
- `HOST_URL=http://localhost:3001`
- `JWT_SECRET=...`
- `GOOGLE_OAUTH_CLIENT_ID=...`
- `GOOGLE_OAUTH_SECRET=...`
- `FIREBASE_PROJECT_ID=...`
- `FIREBASE_CLIENT_EMAIL=...`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

Optional build-time client variables (Docker/hosting):

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BASE_URL`

---

## Architecture notes

- Client computes live scoring from ESPN play logs for dashboard and pick views.
- Server currently returns lightweight score payloads for some endpoints and relies on stored totals for dashboard speed.
- API requests from Next.js are proxied via rewrites in [client/next.config.js](client/next.config.js).

---

## Deployment

- Docker build is multi-stage and produces a standalone Next.js app + compiled server.
- Procfile runs `npm start` for platform deployment.

---

## Current behavior caveats (from code)

- `GET /api/picks/game/:gameId/user/scores` currently returns empty score maps and frontend calculates with play logs.
- If ESPN play data is unavailable, stored score fallback is used.
- Leaderboard endpoint returns top 10 from `leaderboards/totalScore` document.

---

## Quick path map

- Client app: [client/app](client/app)
- Client game logic: [client/src/views/espn/scoreboard/ChoosePicks.tsx](client/src/views/espn/scoreboard/ChoosePicks.tsx)
- Client scoring utility: [client/src/utils/scoreCalculation.ts](client/src/utils/scoreCalculation.ts)
- Picks API: [server/api/picks](server/api/picks)
- Auth API: [server/auth](server/auth)
