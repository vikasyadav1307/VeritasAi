/**
 * Authentication state store using Zustand.
 *
 * Manages user session, JWT tokens, and auth lifecycle.
 *
 * Security notes:
 * - Tokens are stored in localStorage (documented tradeoff — HTTP-only cookies
 *   would be more secure but require backend cookie-setting endpoints which
 *   adds complexity beyond this milestone's scope).
 * - Access tokens are short-lived (default 15 min from backend config).
 * - Refresh tokens are isolated in a dedicated store action.
 * - No passwords or tokens are ever logged.
 * - All secrets come from environment configuration on the backend.
 */

import { create } from 'zustand';

// ── Types ──

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

// ── Storage Keys ──

const STORAGE_PREFIX = 'veritasai-';
const ACCESS_TOKEN_KEY = `${STORAGE_PREFIX}access-token`;
const REFRESH_TOKEN_KEY = `${STORAGE_PREFIX}refresh-token`;
const USER_KEY = `${STORAGE_PREFIX}user`;

// ── Helpers ──

function loadPersistedAuth(): Pick<
  AuthState,
  'user' | 'accessToken' | 'refreshToken' | 'isAuthenticated' | 'isLoading'
> {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (accessToken && refreshToken && userJson) {
      const user = JSON.parse(userJson) as AuthUser;
      return { user, accessToken, refreshToken, isAuthenticated: true, isLoading: true };
    }
  } catch {
    // Corrupted storage — clear it
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false };
}

// ── Store ──

export const useAuthStore = create<AuthState>((set) => ({
  ...loadPersistedAuth(),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
