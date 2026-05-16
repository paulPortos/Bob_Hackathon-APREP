import { create } from 'zustand';
import type { User } from '@/types';
import { authUtils } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initialize: () => void;
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

  initialize: () => {
    const user = authUtils.getUser();
    const isAuthenticated = authUtils.isAuthenticated();
    set({ user, isAuthenticated });
  },
}));

// Made with Bob
