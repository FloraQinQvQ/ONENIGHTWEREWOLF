# One Night Werewolf — Online

A full-stack real-time multiplayer implementation of the One Night Ultimate Werewolf board game. Each player acts on their own device — no phone-passing needed.

## Features

- **Real-time multiplayer** via Socket.io — up to 10 players per room
- **Full night phase automation** — server-driven state machine walks through each role's turn
- **Narrator voice** — Web Speech API narrates the night phase and results (English & Chinese voices)
- **Chinese / English language support** — full UI translation, role descriptions, and narration
- **Night deception** — the night indicator shows all configured roles (including center cards) so players can't infer center card contents from timing; center-card-only roles fake a 6–13 second wait
- **Role descriptions** in room setup — hover/expand each role card to read what it does before adding it
- **Discussion timer** — configurable 1–10 min or no limit; host can skip to voting early
- **Player notepad** — private notes and trust/role tags per player during discussion
- **Reconnect support** — players who disconnect mid-game can rejoin and resume
- **Google OAuth login** + dev-only quick login for local testing

## Roles

| Role | Team | Night Action |
|------|------|-------------|
| 🐺 Werewolf | Werewolf | See fellow Werewolves; lone wolf may peek a center card |
| 🦹 Minion | Werewolf | See who the Werewolves are |
| 🔨 Mason | Village | See fellow Masons |
| 🔮 Seer | Village | Look at one player's card OR two center cards |
| 🗡️ Robber | Village | Swap your card with another's (see your new role) |
| 😈 Troublemaker | Village | Swap two other players' cards |
| 🍺 Drunk | Village | Must swap your card with a center card (new role unknown) |
| 👁️ Insomniac | Village | Wake last to check if your card changed |
| 🏹 Hunter | Village | No action (if eliminated, drags their vote target down too) |
| 💀 Tanner | Solo | No action (wins by getting eliminated) |
| 🌿 Villager | Village | No action |

## Win Conditions

- **Village wins** if at least one Werewolf is eliminated by vote
- **Tanner wins** if they are eliminated (overrides village win)
- **Werewolf team wins** if no Werewolf is eliminated
- **Special case:** no Werewolves in game + nobody eliminated → Village wins

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node 20, Express, Socket.io, TypeScript
- **Auth:** Google OAuth 2.0 via Passport.js + express-session
- **Database:** SQLite via better-sqlite3 (game results + sessions)
- **Monorepo:** npm workspaces (`client/`, `server/`, `shared/`)

## Setup

### 1. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project → enable the **Google Identity** API
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Set application type to **Web application**
5. Add Authorized redirect URI: `http://localhost:3001/auth/google/callback`
6. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment

Create `server/.env`:

```env
PORT=3001
SESSION_SECRET=some-long-random-string
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
CLIENT_URL=http://localhost:5173
DATABASE_PATH=./data/werewolf.db
NODE_ENV=development
```

### 3. Install & Run

Requires **Node.js 20+** and Linux/WSL (the dev script uses `nvm`).

```bash
npm install
npm run dev
```

- Server → `http://localhost:3001`
- Client → `http://localhost:5173`

**Dev quick login:** In development mode, the login page shows a name field for instant login without OAuth — useful for testing multiple players in different browser tabs. Each login generates a unique user ID.

## Production Deploy

```bash
npm run build
npm start        # serves client + API from port 3001
```

In production, at least 4 players are required to start a game.

For production Google OAuth, add your domain's callback URL in Google Cloud Console and set `GOOGLE_CALLBACK_URL` accordingly.

## How to Play

1. **Login** with Google (or quick login in dev)
2. **Create a room** from the lobby, or enter a 6-character code to join
3. **Host configures** the role pool — select exactly `players + 3` roles (at least one Werewolf required). Tap ℹ on any role card to read its description. Use **✨ Suggest** for presets by player count
4. **Host sets discussion timer** and clicks **Start Game**
5. **Night phase** — the narrator guides each role's turn. Players with an active action see their UI; others see a sleep screen
6. **Day phase** — discuss with your group (voice/video recommended). Use the notepad to track suspicions and tag other players
7. **Voting** — everyone votes simultaneously for who they think is a Werewolf (can't vote for yourself)
8. **Results** — final role reveal, vote breakdown, and winner announcement

## Project Structure

```
├── shared/          # Shared TypeScript types
│   └── src/types.ts
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/       # LoginPage, LobbyPage, RoomPage, GamePage
│       ├── components/
│       │   ├── game/    # NightPhase, DayPhase, VotingPhase, Timer
│       │   ├── night/   # Per-role night action components
│       │   ├── results/ # ResultsCard
│       │   ├── room/    # RoleSelector, PlayerList
│       │   └── ui/      # PlayerAvatar
│       ├── store/       # Zustand: gameStore, roomStore, authStore, langStore
│       ├── hooks/       # useNarrator (Web Speech API)
│       ├── utils/       # roleInfo (EN+ZH), narratorScript
│       └── i18n/        # Translations (EN+ZH) + useT() hook
└── server/          # Express + Socket.io backend
    └── src/
        ├── db/          # SQLite: rooms, users, sessions
        ├── game/        # GameManager, NightProcessor, WinCondition, RoleAssigner
        ├── routes/      # REST: /auth/*, /api/rooms
        └── socket/
            └── handlers/ # roomHandlers, gameHandlers
```

## Architecture Notes

- **Game state is in-memory** — if the server restarts mid-game, the game is lost. Only final results persist to SQLite.
- **Werewolf guarantee:** The role assigner ensures at least one player (not a center card) is always a Werewolf.
- **Drunk rule:** The Drunk must always swap a card. If the timer expires before they act, the server forces a random center card swap.
