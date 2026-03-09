import { create } from 'zustand';
import axios from 'axios';

export interface AuthUser {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
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
}));
