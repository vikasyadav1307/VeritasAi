import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Pre-configured Axios instance for all API calls.
 *
 * Features:
 * - Base URL from environment variable
 * - JSON content type by default
 * - Request interceptor for JWT injection (Phase 2)
 * - Response interceptor for token refresh (Phase 2)
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30_000, // 30 seconds
  withCredentials: true, // Send cookies (refresh token)
});

// ── Request Interceptor ──
api.interceptors.request.use(
  (config) => {
    // JWT injection will be added in Phase 2
    // const token = useAuthStore.getState().accessToken;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Token refresh logic will be added in Phase 2
    // if (error.response?.status === 401) { ... }
    return Promise.reject(error);
  },
);
