import { create } from 'zustand';
import type { User } from '@/types';
import { authUtils } from '@/lib/auth';
import { apiClient } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    if (user) {
      authUtils.setUser(user);
    } else {
      authUtils.removeUser();
    }
    set({ user, isAuthenticated: !!user });
  },

  logout: () => {
    authUtils.logout();
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    const user = authUtils.getUser();
    const isAuthenticated = authUtils.isAuthenticated();
    set({ user, isAuthenticated });

    if (!isAuthenticated || user?.id) return;

    try {
      const currentUser = await apiClient.getCurrentUser();
      authUtils.setUser(currentUser);
      set({ user: currentUser, isAuthenticated: true });
    } catch {
      authUtils.logout();
      set({ user: null, isAuthenticated: false });
    }
  },
}));

// Made with Bob
