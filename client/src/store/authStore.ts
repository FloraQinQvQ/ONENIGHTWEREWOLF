import { create } from 'zustand';
import axios from 'axios';

export interface AuthUser {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  customAvatar: string | null;
  profileSetupDone: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  completeProfile: (displayName: string, customAvatar: string | null) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await axios.get('/auth/me', { withCredentials: true });
      set({ user: res.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await axios.post('/auth/logout', {}, { withCredentials: true });
    set({ user: null });
    window.location.href = '/login';
  },

  updateDisplayName: async (name: string) => {
    const res = await axios.patch('/auth/me', { displayName: name }, { withCredentials: true });
    set((state) => ({ user: state.user ? { ...state.user, ...res.data } : null }));
  },

  completeProfile: async (displayName: string, customAvatar: string | null) => {
    const res = await axios.post('/auth/profile', { displayName, customAvatar }, { withCredentials: true });
    set((state) => ({ user: state.user ? { ...state.user, ...res.data } : null }));
  },

  deleteAccount: async () => {
    await axios.delete('/auth/me', { withCredentials: true });
    set({ user: null });
    window.location.href = '/login';
  },
}));
