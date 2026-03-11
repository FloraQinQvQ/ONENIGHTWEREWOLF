import type { RoleName } from 'shared';

export const NIGHT_ORDER: RoleName[] = [
  'werewolf',
  'minion',
  'mason',
  'seer',
  'robber',
  'troublemaker',
  'drunk',
  'insomniac',
];

// Roles that have no night action (just observe or skip)
export const OBSERVE_ONLY_ROLES: RoleName[] = ['werewolf', 'minion', 'mason', 'insomniac'];

export function assignRoles(
  playerIds: string[],
  selectedRoles: RoleName[]
): { playerRoles: Map<string, RoleName>; centerCards: [RoleName, RoleName, RoleName] } {
  const shuffled = [...selectedRoles].sort(() => Math.random() - 0.5);
  const centerCards = shuffled.slice(0, 3) as [RoleName, RoleName, RoleName];
  const playerRoles = new Map<string, RoleName>();
  playerIds.forEach((id, i) => playerRoles.set(id, shuffled[3 + i]));

  // Guarantee at least one werewolf is assigned to a player.
  // If all werewolves landed in the center, swap one center werewolf
  // with a random non-werewolf player card.
  const playerHasWerewolf = [...playerRoles.values()].some(r => r === 'werewolf');
  if (!playerHasWerewolf) {
    const centerWolfIndex = centerCards.findIndex(r => r === 'werewolf');
    if (centerWolfIndex !== -1) {
      const playerIds2 = [...playerRoles.keys()];
      const swapTarget = playerIds2[Math.floor(Math.random() * playerIds2.length)];
      const swappedRole = playerRoles.get(swapTarget)!;
      playerRoles.set(swapTarget, 'werewolf');
      centerCards[centerWolfIndex] = swappedRole;
    }
  }

  return { playerRoles, centerCards };
}

export function computeNightOrder(allRoles: RoleName[]): RoleName[] {
  const roleSet = new Set(allRoles);
  // Deduplicate: each role appears at most once in the order
  const seen = new Set<RoleName>();
  const order: RoleName[] = [];
  for (const role of NIGHT_ORDER) {
    if (roleSet.has(role) && !seen.has(role)) {
      // Skip purely passive roles that don't require a UI action from each player individually
      // (werewolves, minions, masons all wake as a group; they do need to act)
      seen.add(role);
      order.push(role);
    }
  }
  return order;
}
