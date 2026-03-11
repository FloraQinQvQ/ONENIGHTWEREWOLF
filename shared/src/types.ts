export type RoleName =
  | 'werewolf'
  | 'minion'
  | 'mason'
  | 'seer'
  | 'robber'
  | 'troublemaker'
  | 'drunk'
  | 'insomniac'
  | 'hunter'
  | 'tanner'
  | 'villager';

export type Team = 'village' | 'werewolf' | 'tanner';

export type GamePhase = 'waiting' | 'role_reveal' | 'night' | 'day' | 'voting' | 'results';

export interface PublicPlayer {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  customAvatar: string | null;
  isHost: boolean;
  isReady: boolean;
  hasVoted: boolean;
}

export interface RoomSettings {
  roles: RoleName[];
  dayTimerSeconds: number;
  nightTimerSeconds: number;
}

export interface RoomState {
  roomId: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'in_progress' | 'finished';
  players: PublicPlayer[];
  settings: RoomSettings;
}

export type NightAction =
  | { type: 'werewolf:view'; centerIndex?: 0 | 1 | 2 }
  | { type: 'minion:view' }
  | { type: 'mason:view' }
  | { type: 'seer:view_player'; targetUserId: string }
  | { type: 'seer:view_center'; centerIndices: [0 | 1 | 2, 0 | 1 | 2] }
  | { type: 'robber:steal'; targetUserId: string }
  | { type: 'troublemaker:swap'; targetUserIds: [string, string] }
  | { type: 'drunk:take_center'; centerIndex: 0 | 1 | 2 }
  | { type: 'insomniac:view' }
  | { type: 'no_action' };

export interface NightActionRequest {
  role: RoleName;
  players: Array<{ userId: string; displayName: string; avatarUrl: string | null; customAvatar: string | null }>;
  isLoneWolf?: boolean;
}

export interface NightActionResult {
  role: RoleName;
  werewolves?: Array<{ userId: string; displayName: string }>;
  masons?: Array<{ userId: string; displayName: string }>;
  revealedRole?: RoleName;
  revealedTarget?: string;
  centerCards?: Array<{ index: number; role: RoleName }>;
  newRole?: RoleName;
  stolenFrom?: string;
  currentRole?: RoleName;
  swappedPlayers?: Array<{ userId: string; displayName: string }>;
}

export interface GameResults {
  winTeam: Team;
  winners: string[];
  reason: string;
  killed: string[];
  votes: Record<string, string>;
  finalRoles: Record<string, RoleName>;
  originalRoles: Record<string, RoleName>;
  centerCards: [RoleName, RoleName, RoleName];
  players: Array<{ userId: string; displayName: string; avatarUrl: string | null; customAvatar: string | null }>;
}
