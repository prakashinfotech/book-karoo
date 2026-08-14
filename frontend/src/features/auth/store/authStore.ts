import { create } from 'zustand';
import type { User } from '@/shared/types';
import { api } from '@/shared/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user, token) =>
    set({ user, accessToken: token, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  initialize: async () => {
    try {
      const { data } = await api.get<User>('/api/auth/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isInitialized: true });
    }
  },
}));
