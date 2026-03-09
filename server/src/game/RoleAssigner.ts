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
