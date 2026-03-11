import type { GameResults, RoleName, Team } from 'shared';
import type { ServerGameState } from './GameManager';

export function determineExecuted(state: ServerGameState): string[] {
  const voteCounts = new Map<string, number>();
  for (const player of state.players.values()) {
    if (player.vote) {
      voteCounts.set(player.vote, (voteCounts.get(player.vote) ?? 0) + 1);
    }
  }
  if (voteCounts.size === 0) return [];

  const maxVotes = Math.max(...voteCounts.values());

  // ONW rule: if everyone gets exactly 1 vote (and >= 3 players), nobody dies
  if (maxVotes === 1 && state.players.size >= 3) return [];

  return [...voteCounts.entries()]
    .filter(([, count]) => count === maxVotes)
    .map(([userId]) => userId);
}

export function evaluateWinConditions(
  state: ServerGameState,
  executed: string[],
  depth = 0
): GameResults {
  const players = [...state.players.values()];

  const werewolves = players.filter(p => p.currentRole === 'werewolf');
  const minion = players.find(p => p.currentRole === 'minion');
  const tanner = players.find(p => p.currentRole === 'tanner');

  const tannerExecuted = tanner ? executed.includes(tanner.userId) : false;
  const werewolfExecuted = executed.some(id => state.players.get(id)?.currentRole === 'werewolf');
  const noWerewolvesInGame = werewolves.length === 0;

  // Hunter chain: if hunter is executed, they kill their vote target
  if (depth === 0) {
    const hunter = players.find(p => p.currentRole === 'hunter');
    if (hunter && executed.includes(hunter.userId) && hunter.vote && !executed.includes(hunter.vote)) {
      return evaluateWinConditions(state, [...executed, hunter.vote], 1);
    }
  }

  let winTeam: Team;
  let winners: string[];
  let reason: string;

  if (tannerExecuted) {
    winTeam = 'tanner';
    winners = [tanner!.userId];
    reason = 'The Tanner was executed and wins alone!';
  } else if (werewolfExecuted) {
    winTeam = 'village';
    winners = players
      .filter(p => p.currentRole !== 'werewolf' && p.currentRole !== 'minion' && p.currentRole !== 'tanner')
      .map(p => p.userId);
    reason = 'A Werewolf was executed — Village wins!';
  } else if (noWerewolvesInGame) {
    if (executed.length === 0) {
      // No werewolves, no one killed → village wins (they correctly avoided killing innocents)
      winTeam = 'village';
      winners = players
        .filter(p => p.currentRole !== 'werewolf' && p.currentRole !== 'minion' && p.currentRole !== 'tanner')
        .map(p => p.userId);
      reason = 'No Werewolves existed and no one was killed — Village wins!';
    } else if (minion && executed.includes(minion.userId)) {
      winTeam = 'village';
      winners = players
        .filter(p => p.currentRole !== 'werewolf' && p.currentRole !== 'minion' && p.currentRole !== 'tanner')
        .map(p => p.userId);
      reason = 'The Minion was executed — Village wins!';
    } else {
      winTeam = 'werewolf';
      winners = minion ? [minion.userId] : [];
      reason = 'No Werewolves existed and an innocent was killed — Werewolf team wins!';
    }
  } else {
    // Werewolves exist but none were executed
    winTeam = 'werewolf';
    winners = [
      ...werewolves.map(p => p.userId),
      ...(minion ? [minion.userId] : []),
    ];
    reason = 'No Werewolf was executed — Werewolf team wins!';
  }

  return {
    winTeam,
    winners,
    reason,
    killed: executed,
    votes: Object.fromEntries(players.map(p => [p.userId, p.vote ?? ''])),
    finalRoles: Object.fromEntries(players.map(p => [p.userId, p.currentRole])),
    originalRoles: Object.fromEntries(players.map(p => [p.userId, p.originalRole])),
    centerCards: state.centerCards,
    players: players.map(p => ({ userId: p.userId, displayName: p.displayName, avatarUrl: p.avatarUrl, customAvatar: p.customAvatar })),
  };
}
