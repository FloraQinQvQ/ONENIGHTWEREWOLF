import { create } from 'zustand';
import type { RoomState } from 'shared';

interface RoomStore {
  room: RoomState | null;
  error: string | null;
  setRoom: (room: RoomState | null) => void;
  setError: (error: string | null) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  error: null,
  setRoom: (room) => set({ room, error: null }),
  setError: (error) => set({ error }),
}));
