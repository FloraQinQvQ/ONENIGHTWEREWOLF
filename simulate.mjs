/**
 * Dry-run simulation of a full One Night Werewolf game.
 * Simulates 5 players, full night → day → vote → results cycle.
 *
 * Run with:  node simulate.mjs
 * (server must be running on http://localhost:3001)
 */

import { io } from 'socket.io-client';

const BASE = 'http://localhost:3001';
const DELAY = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Colours for readable output ──────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  cyan:  '\x1b[36m',
  yellow:'\x1b[33m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  magenta:'\x1b[35m',
  blue:  '\x1b[34m',
};

const log  = (tag, msg) => console.log(`${C.dim}[${tag}]${C.reset} ${msg}`);
const info = (msg)      => console.log(`\n${C.bold}${C.cyan}▶ ${msg}${C.reset}`);
const ok   = (msg)      => console.log(`${C.green}✓ ${msg}${C.reset}`);
const warn = (msg)      => console.log(`${C.yellow}⚠ ${msg}${C.reset}`);
const err  = (msg)      => console.log(`${C.red}✗ ${msg}${C.reset}`);

// ── Players ───────────────────────────────────────────────────────────────────
const PLAYERS = [
  { id: 'sim-alice', name: 'Alice' },
  { id: 'sim-bob',   name: 'Bob'   },
  { id: 'sim-carol', name: 'Carol' },
  { id: 'sim-dave',  name: 'Dave'  },
  { id: 'sim-eve',   name: 'Eve'   },
];

// 5 players → need 8 roles (5 + 3 center)
const ROLES = [
  'werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'mason', 'mason',
];

// ── HTTP helpers (using built-in fetch, Node 18+) ─────────────────────────────
async function devLogin(player) {
  const res = await fetch(`${BASE}/auth/dev/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: player.id, name: player.name }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Login failed for ${player.name}: ${await res.text()}`);
  // Grab the Set-Cookie header so we can use it on subsequent requests
  const cookie = res.headers.get('set-cookie');
  return cookie;
}

async function createRoom(cookie) {
  const res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ settings: { roles: ROLES, dayTimerSeconds: 15, nightTimerSeconds: 8 } }),
  });
  if (!res.ok) throw new Error(`Create room failed: ${await res.text()}`);
  return res.json();
}

// ── Socket client factory ─────────────────────────────────────────────────────
function makeClient(player, cookie) {
  const socket = io(BASE, {
    extraHeaders: { Cookie: cookie },
    transports: ['websocket'],
  });

  socket._player = player;
  socket._cookie = cookie;
  socket._role   = null;
  socket._nightResult = null;

  socket.onAny((event, ...args) => {
    log(player.name, `${C.dim}← ${event}${C.reset} ${JSON.stringify(args[0] ?? '').slice(0, 120)}`);
  });

  return socket;
}

function waitFor(socket, event, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for ${event} on ${socket._player.name}`)), timeout);
    socket.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

// ── Main simulation ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.magenta}═══════════════════════════════════════════════`);
  console.log(`       ONE NIGHT WEREWOLF — DRY RUN SIM`);
  console.log(`═══════════════════════════════════════════════${C.reset}\n`);

  // ── 1. Login all players ──────────────────────────────────────────────────
  info('Step 1/6 — Logging in all players via dev endpoint');
  const cookies = [];
  for (const p of PLAYERS) {
    const cookie = await devLogin(p);
    if (!cookie) throw new Error(`No cookie returned for ${p.name}`);
    cookies.push(cookie);
    ok(`${p.name} logged in`);
  }

  // ── 2. Host creates a room ────────────────────────────────────────────────
  info('Step 2/6 — Host (Alice) creates a room');
  const room = await createRoom(cookies[0]);
  ok(`Room created: code=${C.bold}${room.code}${C.reset}, id=${room.roomId}`);
  console.log(`       Roles in play: ${ROLES.join(', ')}`);

  // ── 3. Connect all sockets and join room ──────────────────────────────────
  info('Step 3/6 — All players connect via Socket.io and join the room');
  const clients = PLAYERS.map((p, i) => makeClient(p, cookies[i]));

  await Promise.all(clients.map(s => new Promise((res, rej) => {
    s.connect();
    s.once('connect', res);
    s.once('connect_error', rej);
  })));
  ok('All sockets connected');

  // Alice joins first (she's the host)
  const roomStates = clients.map(() => null);
  clients.forEach((s, i) => {
    s.on('room:state', (state) => { roomStates[i] = state; });
  });

  for (const [i, client] of clients.entries()) {
    client.emit('room:join', { roomCode: room.code });
    await DELAY(200);
  }
  await DELAY(500);
  ok(`All players joined room ${room.code}`);
  console.log(`       Players: ${clients.map(c => c._player.name).join(', ')}`);

  // ── 4. Host starts the game ───────────────────────────────────────────────
  info('Step 4/6 — Host starts the game');

  // Set up role-assignment listeners before start
  const rolePromises = clients.map(s =>
    waitFor(s, 'game:role_assigned', 10000).then(data => { s._role = data.role; return data; })
  );

  clients[0].emit('room:start_game');

  const roleAssignments = await Promise.all(rolePromises);
  console.log('');
  roleAssignments.forEach((r, i) => {
    const emoji = { werewolf:'🐺', seer:'🔮', robber:'🗡️', troublemaker:'😈', mason:'🔨', villager:'👨‍🌾', minion:'🦹', drunk:'🍺', insomniac:'👁️', hunter:'🏹', tanner:'💀' }[r.role] ?? '❓';
    ok(`${PLAYERS[i].name.padEnd(6)} → ${emoji} ${C.bold}${r.role}${C.reset}`);
  });

  // ── 4b. Role reveal — all players signal ready ────────────────────────────
  info('Step 4b/6 — Role reveal: all players confirm they\'ve seen their role');
  const nightBeginPromises = clients.map(s => waitFor(s, 'game:night_begin', 20000));
  // Small stagger so server processes one-by-one
  for (const client of clients) {
    await DELAY(150);
    client.emit('game:player_ready');
    log(client._player.name, 'sent game:player_ready');
  }

  // ── 5. Night phase ────────────────────────────────────────────────────────
  info('Step 5/6 — Night phase (responding to action requests)');

  const nightBeginResults = await Promise.all(nightBeginPromises);
  const nightOrder = nightBeginResults[0]?.order ?? ['werewolf', 'mason', 'seer', 'robber'];
  ok(`Night order: ${nightOrder.join(' → ')}`);

  // Each client handles its own night action request
  const nightDonePromises = clients.map(s => new Promise((resolve) => {
    s.on('game:night_action_request', (req) => {
      const player = s._player;
      const role = req.role;
      const others = req.players ?? [];

      let action;
      switch (role) {
        case 'werewolf':
          action = req.isLoneWolf
            ? { type: 'werewolf:view', centerIndex: 0 }
            : { type: 'werewolf:view' };
          break;
        case 'minion':
          action = { type: 'minion:view' };
          break;
        case 'mason':
          action = { type: 'mason:view' };
          break;
        case 'seer':
          if (others.length > 0) action = { type: 'seer:view_player', targetUserId: others[0].userId };
          else action = { type: 'seer:view_center', centerIndices: [0, 1] };
          break;
        case 'robber':
          action = others.length > 0
            ? { type: 'robber:steal', targetUserId: others[0].userId }
            : { type: 'no_action' };
          break;
        case 'troublemaker':
          action = others.length >= 2
            ? { type: 'troublemaker:swap', targetUserIds: [others[0].userId, others[1].userId] }
            : { type: 'no_action' };
          break;
        case 'drunk':
          action = { type: 'drunk:take_center', centerIndex: 2 };
          break;
        case 'insomniac':
          action = { type: 'insomniac:view' };
          break;
        default:
          action = { type: 'no_action' };
      }

      log(player.name, `sending night action: ${C.yellow}${action.type}${C.reset}`);
      s.emit('game:night_action', { action });
    });

    s.on('game:night_action_ack', (data) => {
      s._nightResult = data.result;
    });

    s.on('game:night_phase_end', () => resolve(true));
    s.on('game:day_begin', () => resolve(true)); // also resolves if we get day_begin
  }));

  await Promise.all(nightDonePromises);
  console.log('');

  // Print what each player learned
  clients.forEach(s => {
    if (!s._nightResult) return;
    const r = s._nightResult;
    if (r.werewolves?.length) warn(`${s._player.name} sees werewolves: ${r.werewolves.map(w => w.displayName).join(', ')}`);
    if (r.revealedRole)       warn(`${s._player.name} sees ${r.revealedTarget}'s role: ${r.revealedRole}`);
    if (r.centerCards?.length) warn(`${s._player.name} sees center cards: ${r.centerCards.map(c => `#${c.index+1}=${c.role}`).join(', ')}`);
    if (r.newRole)             warn(`${s._player.name} stole → now is: ${r.newRole}`);
    if (r.currentRole)         warn(`${s._player.name} (insomniac) final role: ${r.currentRole}`);
    if (r.masons?.length)      warn(`${s._player.name} sees masons: ${r.masons.map(m => m.displayName).join(', ')}`);
  });

  ok('Night phase complete');

  // ── 6. Day phase & voting ─────────────────────────────────────────────────
  info('Step 6/6 — Day phase & voting');

  // Register ALL end-phase listeners BEFORE awaiting day_begin so we don't miss fast transitions
  const votingBeginPromises = clients.map(s => waitFor(s, 'game:voting_begin', 60000));
  const resultsPromises     = clients.map(s => waitFor(s, 'game:results', 60000));

  // Wait for day phase to start (or skip if already started)
  await Promise.all(clients.map(s =>
    waitFor(s, 'game:day_begin', 20000).catch(() => null)
  ));
  ok('Day phase started — waiting for timer (15s) or host skip');

  // The host can skip; if timer expires naturally that's fine too
  // Don't emit skip here — let the 15s timer run to prove the server-side timer works
  // (or emit it if you want a faster test):
  await DELAY(300);
  clients[0].emit('game:skip_day');

  await Promise.all(votingBeginPromises);
  ok('Voting phase started — all players casting votes');

  for (const [i, client] of clients.entries()) {
    const target = clients[(i + 1) % clients.length]._player.id;
    await DELAY(100);
    client.emit('game:submit_vote', { targetUserId: target });
    log(client._player.name, `voted for ${PLAYERS[(i + 1) % PLAYERS.length].name}`);
  }

  const results = await resultsPromises[0];

  // ── Results ───────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.magenta}═══════════════════════════════════════════════`);
  console.log(`                    RESULTS`);
  console.log(`═══════════════════════════════════════════════${C.reset}`);

  const teamEmoji = { village:'🌿', werewolf:'🐺', tanner:'💀' }[results.winTeam] ?? '❓';
  console.log(`\n${C.bold}Winner: ${teamEmoji}  ${results.winTeam.toUpperCase()} TEAM${C.reset}`);
  console.log(`Reason: ${results.reason}`);
  console.log(`\nEliminated: ${results.killed.length === 0 ? 'nobody' : results.killed.map(id => PLAYERS.find(p => p.id === id)?.name ?? id).join(', ')}`);

  console.log('\nFinal roles:');
  for (const p of results.players) {
    const orig = results.originalRoles[p.userId];
    const final = results.finalRoles[p.userId];
    const changed = orig !== final ? ` ${C.dim}(was ${orig})${C.reset}` : '';
    const won = results.winners.includes(p.userId) ? ` ${C.yellow}🏆${C.reset}` : '';
    console.log(`  ${p.displayName.padEnd(8)}: ${C.bold}${final}${C.reset}${changed}${won}`);
  }

  console.log('\nCenter cards:', results.centerCards.join(', '));

  console.log('\nVotes:');
  for (const [voterId, targetId] of Object.entries(results.votes)) {
    if (!targetId) continue;
    const voter  = results.players.find(p => p.userId === voterId)?.displayName ?? voterId;
    const target = results.players.find(p => p.userId === targetId)?.displayName ?? targetId;
    console.log(`  ${voter.padEnd(8)} → ${target}`);
  }

  console.log(`\n${C.bold}${C.green}Simulation complete — all phases passed!${C.reset}\n`);

  // Cleanup
  clients.forEach(s => s.disconnect());
  process.exit(0);
}

main().catch(e => {
  err(`Simulation failed: ${e.message}`);
  console.error(e);
  process.exit(1);
});
