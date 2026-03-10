import { create } from 'zustand';
import type { RoleName, NightActionRequest, NightActionResult, GameResults, GamePhase } from 'shared';

interface GameStore {
  phase: GamePhase;
  myRole: RoleName | null;
  otherPlayers: Array<{ userId: string; displayName: string; avatarUrl: string | null }>;
  nightOrder: RoleName[];
  currentNightRole: RoleName | null;
  nightActionRequest: NightActionRequest | null;
  nightActionResult: NightActionResult | null;
  dayTimerSeconds: number;
  voteCounts: Record<string, number>;
  myVote: string | null;
  results: GameResults | null;
  notes: string;
  playerNotes: Record<string, string>;
  playerTags: Record<string, { trust: 'good' | 'bad' | null; roles: RoleName[] }>;

  setPhase: (phase: GamePhase) => void;
  setMyRole: (role: RoleName, players: Array<{ userId: string; displayName: string; avatarUrl: string | null }>) => void;
  setNightOrder: (order: RoleName[]) => void;
  setNightActionRequest: (req: NightActionRequest | null) => void;
  setNightActionResult: (result: NightActionResult | null) => void;
  setCurrentNightRole: (role: RoleName | null) => void;
  setDayTimer: (seconds: number) => void;
  setVoteCounts: (counts: Record<string, number>) => void;
  setMyVote: (targetId: string) => void;
  setResults: (results: GameResults) => void;
  setNotes: (notes: string) => void;
  setPlayerNote: (userId: string, note: string) => void;
  setPlayerTrust: (userId: string, trust: 'good' | 'bad' | null) => void;
  togglePlayerRole: (userId: string, role: RoleName) => void;
  reset: () => void;
}

const initial = {
  phase: 'waiting' as GamePhase,
  myRole: null,
  otherPlayers: [],
  nightOrder: [],
  currentNightRole: null,
  nightActionRequest: null,
  nightActionResult: null,
  dayTimerSeconds: 300,
  voteCounts: {},
  myVote: null,
  results: null,
  notes: '',
  playerNotes: {},
  playerTags: {},
};

export const useGameStore = create<GameStore>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setMyRole: (myRole, otherPlayers) => set({ myRole, otherPlayers }),
  setNightOrder: (nightOrder) => set({ nightOrder }),
  setNightActionRequest: (nightActionRequest) => set({ nightActionRequest }),
  setNightActionResult: (nightActionResult) => set({ nightActionResult }),
  setCurrentNightRole: (currentNightRole) => set({ currentNightRole }),
  setDayTimer: (dayTimerSeconds) => set({ dayTimerSeconds }),
  setVoteCounts: (voteCounts) => set({ voteCounts }),
  setMyVote: (myVote) => set({ myVote }),
  setResults: (results) => set({ results, phase: 'results' }),
  setNotes: (notes) => set({ notes }),
  setPlayerNote: (userId, note) => set(s => ({ playerNotes: { ...s.playerNotes, [userId]: note } })),
  setPlayerTrust: (userId, trust) => set(s => ({
    playerTags: { ...s.playerTags, [userId]: { ...(s.playerTags[userId] ?? { roles: [] }), trust } },
  })),
  togglePlayerRole: (userId, role) => set(s => {
    const cur = s.playerTags[userId] ?? { trust: null, roles: [] };
    const roles = cur.roles.includes(role) ? cur.roles.filter(r => r !== role) : [...cur.roles, role];
    return { playerTags: { ...s.playerTags, [userId]: { ...cur, roles } } };
  }),
  reset: () => set(initial),
}));
