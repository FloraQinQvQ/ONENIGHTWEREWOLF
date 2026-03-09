import type { NightAction, NightActionResult, RoleName } from 'shared';
import type { ServerGameState, PlayerState } from './GameManager';

export function processNightAction(
  state: ServerGameState,
  actingUserId: string,
  action: NightAction
): NightActionResult {
  const role = state.players.get(actingUserId)?.currentRole;
  if (!role) return { role: 'villager' };

  switch (action.type) {
    case 'werewolf:view': {
      const werewolves = [...state.players.values()]
        .filter(p => p.currentRole === 'werewolf')
        .map(p => ({ userId: p.userId, displayName: p.displayName }));
      const isLoneWolf = werewolves.length === 1;
      const result: NightActionResult = { role: 'werewolf', werewolves };
      if (isLoneWolf && action.centerIndex !== undefined) {
        result.centerCards = [{ index: action.centerIndex, role: state.centerCards[action.centerIndex] }];
      }
      return result;
    }

    case 'minion:view': {
      const werewolves = [...state.players.values()]
        .filter(p => p.currentRole === 'werewolf')
        .map(p => ({ userId: p.userId, displayName: p.displayName }));
      return { role: 'minion', werewolves };
    }

    case 'mason:view': {
      const masons = [...state.players.values()]
        .filter(p => p.currentRole === 'mason')
        .map(p => ({ userId: p.userId, displayName: p.displayName }));
      return { role: 'mason', masons };
    }

    case 'seer:view_player': {
      const target = state.players.get(action.targetUserId);
      if (!target) return { role: 'seer' };
      return { role: 'seer', revealedRole: target.currentRole, revealedTarget: target.displayName };
    }

    case 'seer:view_center': {
      const [i, j] = action.centerIndices;
      return {
        role: 'seer',
        centerCards: [
          { index: i, role: state.centerCards[i] },
          { index: j, role: state.centerCards[j] },
        ],
      };
    }

    case 'robber:steal': {
      const robber = state.players.get(actingUserId)!;
      const target = state.players.get(action.targetUserId);
      if (!target) return { role: 'robber' };
      const stolen = target.currentRole;
      target.currentRole = robber.currentRole;
      robber.currentRole = stolen;
      return { role: 'robber', newRole: robber.currentRole, stolenFrom: target.displayName };
    }

    case 'troublemaker:swap': {
      const [idA, idB] = action.targetUserIds;
      const a = state.players.get(idA);
      const b = state.players.get(idB);
      if (!a || !b) return { role: 'troublemaker' };
      const temp = a.currentRole;
      a.currentRole = b.currentRole;
      b.currentRole = temp;
      return { role: 'troublemaker' };
    }

    case 'drunk:take_center': {
      const drunk = state.players.get(actingUserId)!;
      const center = state.centerCards[action.centerIndex];
      state.centerCards[action.centerIndex] = drunk.currentRole;
      drunk.currentRole = center;
      return { role: 'drunk' }; // drunk doesn't see their new role
    }

    case 'insomniac:view': {
      const player = state.players.get(actingUserId)!;
      return { role: 'insomniac', currentRole: player.currentRole };
    }

    default:
      return { role: role as RoleName };
  }
}

export function getPlayersForCurrentStep(state: ServerGameState): PlayerState[] {
  const currentRole = state.nightOrder[state.currentNightRoleIndex];
  if (!currentRole) return [];
  return [...state.players.values()].filter(p => p.originalRole === currentRole);
}

export function allCurrentStepActed(state: ServerGameState): boolean {
  const players = getPlayersForCurrentStep(state);
  return players.length > 0 && players.every(p => p.hasActedThisStep);
}
