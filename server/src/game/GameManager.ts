import type { RoleName, GamePhase, NightAction, NightActionResult, GameResults, RoomSettings } from 'shared';

export interface PlayerState {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  customAvatar: string | null;
  socketId: string;
  originalRole: RoleName;
  currentRole: RoleName;
  isReady: boolean;
  hasActedThisStep: boolean;
  vote: string | null;
  nightResult: NightActionResult | null;
}

export interface ServerGameState {
  roomCode: string;
  roomId: string;
  phase: GamePhase;
  players: Map<string, PlayerState>;
  centerCards: [RoleName, RoleName, RoleName];
  nightOrder: RoleName[];
  currentNightRoleIndex: number;
  settings: RoomSettings;
  dayTimerHandle: ReturnType<typeof setInterval> | null;
  nightTimerHandle: ReturnType<typeof setTimeout> | null;
}

const games = new Map<string, ServerGameState>();

export function getGame(roomCode: string): ServerGameState | undefined {
  return games.get(roomCode);
}

export function setGame(roomCode: string, state: ServerGameState): void {
  games.set(roomCode, state);
}

export function deleteGame(roomCode: string): void {
  const state = games.get(roomCode);
  if (state) {
    if (state.dayTimerHandle) clearInterval(state.dayTimerHandle);
    if (state.nightTimerHandle) clearTimeout(state.nightTimerHandle);
  }
  games.delete(roomCode);
}
