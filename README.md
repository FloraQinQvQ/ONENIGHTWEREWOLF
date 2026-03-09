# One Night Werewolf — Online

A full-stack real-time multiplayer implementation of the One Night Werewolf board game.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + Socket.io + TypeScript
- **Auth**: Google OAuth 2.0 via Passport.js
- **Database**: SQLite (via better-sqlite3)
- **Real-time**: Socket.io

## Setup

### 1. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Google Identity** API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add Authorized redirect URI: `http://localhost:3001/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment

```bash
cp .env.example server/.env
# Then edit server/.env with your Google credentials
```

```env
PORT=3001
SESSION_SECRET=some-long-random-string
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
CLIENT_URL=http://localhost:5173
DATABASE_PATH=./data/werewolf.db
NODE_ENV=development
```

### 3. Install Dependencies

Requires **Node.js 18+**.

```bash
npm install
```

### 4. Run in Development

```bash
npm run dev
```

- **Server** → `http://localhost:3001`
- **Client** → `http://localhost:5173`

Open `http://localhost:5173` in your browser.

## How to Play

### Setup
1. One player creates a room and shares the 6-character code
2. All players join using the code (3–10 players)
3. The host selects roles — exactly `players + 3` total (extras go face-down as center cards)
4. Host clicks **Start Game**

### Roles
| Role | Team | Night Action |
|------|------|-------------|
| 🐺 Werewolf | Werewolf | See fellow Werewolves |
| 🦹 Minion | Werewolf | See who the Werewolves are |
| 🔨 Mason | Village | See fellow Masons |
| 🔮 Seer | Village | Look at a player's card OR two center cards |
| 🗡️ Robber | Village | Swap your card with another's (see your new role) |
| 😈 Troublemaker | Village | Swap two other players' cards |
| 🍺 Drunk | Village | Swap your card with a center card (you won't see it) |
| 👁️ Insomniac | Village | Check your final card at the end of night |
| 🏹 Hunter | Village | If eliminated, drags their vote target down too |
| 💀 Tanner | Solo | Wins only if they are eliminated |
| 👨‍🌾 Villager | Village | No night action |

### Night Phase
Each player acts on their **own device** — no phone passing! Players whose role is not active see a sleeping screen. The server guides each role in order.

### Day Phase
Discuss with your group (voice/video recommended). A 5-minute timer counts down on screen. The host can skip to voting early.

### Voting
Everyone votes simultaneously. The player(s) with the most votes are eliminated. If all players tie at exactly 1 vote, nobody dies.

### Win Conditions
- **Village**: At least one Werewolf is eliminated
- **Werewolf team**: No Werewolves are eliminated
- **Tanner**: Tanner is eliminated (solo win, overrides others)
- **Hunter special**: If Hunter is eliminated, the person they voted for also dies

## Project Structure

```
├── shared/          # Shared TypeScript types (RoleName, NightAction, GameResults, etc.)
├── server/          # Express + Socket.io backend
│   └── src/
│       ├── config/  # Database, session, passport setup
│       ├── db/      # SQLite query functions
│       ├── game/    # Game engine: role assignment, night processor, win conditions
│       ├── routes/  # REST: /auth/*, /api/rooms
│       └── socket/  # Socket.io event handlers
└── client/          # React + Vite frontend
    └── src/
        ├── components/  # UI: game phases, night actions, results
        ├── pages/       # Login, Lobby, Room, Game
        ├── store/       # Zustand: auth, room, game state
        └── utils/       # Role info, class name helper
```
