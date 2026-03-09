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
  reset: () => set(initial),
}));
