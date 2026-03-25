'use client';

import { create } from 'zustand';
import type { IUser } from '@/types';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: IUser) => void;
  loadFromStorage: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data: res } = await authApi.login({ email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { data: res } = await authApi.register(data);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAdmin: user.role === 'admin' });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as IUser;
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  fetchProfile: async () => {
    try {
      const { data: res } = await authApi.getProfile();
      const user = res.data;
      get().setUser(user);
    } catch {
      get().logout();
    }
  },
}));
