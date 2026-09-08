import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// ── Analysis API Types ──

export interface AnalyzeRequest {
  text: string;
  language?: string;
}

export interface CredibilityResult {
  label: 'Real' | 'Fake';
  confidence: number;
  is_mock: boolean;
}

export interface SentimentResult {
  label: 'Positive' | 'Negative' | 'Neutral';
  confidence: number;
  is_mock: boolean;
}

export interface AnalyzeResponse {
  credibility: CredibilityResult;
  sentiment: SentimentResult;
  processing_time_ms: number;
}

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
  timeout: 120_000, // 120 seconds — CPU model inference takes ~68s
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

// ── Analysis API ──

/**
 * Analyze text for fake news detection and sentiment analysis.
 *
 * @param text - The text content to analyze (10–50,000 characters).
 * @param language - Language code or "auto" for automatic detection.
 */
export async function analyzeText(
  text: string,
  language: string = 'auto',
): Promise<AnalyzeResponse> {
  const response = await api.post<AnalyzeResponse>('/api/v1/analyze/text', {
    text,
    language,
  } satisfies AnalyzeRequest);

  return response.data;
}
