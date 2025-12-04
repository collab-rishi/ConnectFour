
<h1 align="center"><strong>Connect Four - Real-Time Multiplayer Web App</strong></h1>

<p align="center"> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"> <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white"> <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"> </p>

## Overview

A Real-time multiplayer **Connect Four** web application featuring:
 - Live Matchmaking 
 - Competitive bot support
 - Persistent leaderboard
 - Low-latency real-time gameplay

Built with a **React + TypeScript** frontend and a **Node.js + Socket.IO** backend using **Prisma + PostgreSQL**.

---
## Quick Start

```bash
git clone <repo-url>

# Backend
cd backend
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```
Backend: http://localhost:3000

Frontend: http://localhost:5173


## Project Structure

```
root/
 ├── backend/   # Node.js + TS + Socket.IO + Prisma
 └── frontend/  # React + TS + Vite
```

- `backend/` — Node.js + TypeScript backend (Socket.IO, Prisma)
- `frontend/` — React + TypeScript frontend (Vite)

---

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL
- Git

---

## Environment Variables

Place environment variables in a `.env` file in the `backend/` folder. Example `.env`:

```
# backend/.env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/connect4db?schema=public
PORT=3000

```


---

## Setup & Run

Open two terminals — one for backend, one for frontend.

1) **Backend**

```bash
# from repository root
cd backend/
npm install
# apply prisma migrations if necessary
# npx prisma migrate dev --name init
npm run dev
```

- The backend defaults to `http://localhost:3000` for Socket.IO. If you change the port, update `frontend/src/api/socket.ts` accordingly.



2) **Frontend**

```bash
cd frontend
npm install
npm run dev
```

- The frontend uses Vite and typically runs on `http://localhost:5173`.

- If sockets are not connecting, ensure CORS and matching ports are allowed and that backend is running.

---

## Architecture Decisions

- **Real-time communication**: Socket.IO for event-based, low-latency game updates and matchmaking.
- **Frontend**: React + TypeScript with custom hooks (`useGame`, `useLeaderboard`) to separate concerns.
- **Backend**: Node.js + TypeScript; services separated logically (Matchmaking, GameLogic, GameState, Leaderboard).
- **Persistence**: Prisma used to persist completed games and leaderboard stats.
- **Board representation**: a 2D array. The board is configured as 7 rows × 6 columns in the frontend. Ensure backend configuration matches this before running (see `backend/src/config/index.ts`).

---


## API / Socket.IO Events

This project uses Socket.IO event names for real-time communication. Below are the main events (client -> server) and (server -> client) used by the app.

**Client -> Server**

- `join_queue` (payload: `username: string`)
  - Joins matchmaking queue. Server will respond with `match_found` or `waiting_for_opponent` via `game_update` broadcasts when a match starts.

- `make_move` (payload: `column: number`)
  - Attempt to drop a piece into the specified 0-based column (0..5). Server validates and broadcasts `game_update` to the room.

- `reconnect_game` (payload: `gameId: string`)
  - Attempt to rejoin a game after disconnection (server-handled event name may vary; check `backend` handlers).

- `fetch_leaderboard` (no payload)
  - Requests the current leaderboard; server responds with `leaderboard_update`.

**Server -> Client**

- `game_update` (payload: `GameState`)
  - Broadcast when the game state changes (move completed, turn switched, game start). Contains `board`, `players`, `currentPlayerId`, `status`, `winnerId`, `id`, etc.

- `move_rejected` or `error` (payload: `{ message: string }`)
  - If a move is invalid (not your turn, column full), the server notifies the client.

- `game_end` (payload: `GameState`)
  - Emitted after the end of a game and after a short delay (used for client animations).

- `leaderboard_update` (payload: `LeaderboardPlayer[]`)
  - Provides current leaderboard entries.

---

## Important Files

### Frontend

- `src/components/Board.tsx` — Renders board and drop targets; `onColumnClick` should send 0-based column index to `useGame` / socket layer.
- `src/api/socket.ts` — Socket initialization and emit/listen helper functions.
- `src/hooks/useGame.ts` — Game state hook that listens for `game_update` and calls `emitMakeMove`.

### Backend

- `src/config/index.ts` — Board dimensions (`BOARD_ROWS`, `BOARD_COLS`) and constants — ensure these match the frontend.
- `src/services/GameLogic.ts` — Contains `makeMove` and validation logic (ensures pieces land on the lowest empty row in a column).
- `src/controllers/SocketController.ts` — Socket event handlers and matchmaking glue.

---
