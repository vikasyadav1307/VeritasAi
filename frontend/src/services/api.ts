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
  id?: string;
  credibility: CredibilityResult;
  sentiment: SentimentResult;
  processing_time_ms: number;
}

// ── History API Types ──

export interface HistoryItem {
  id: string;
  input_type: 'text' | 'url' | 'image' | string;
  original_text: string;
  detected_language: string;
  credibility_label: 'Real' | 'Fake';
  credibility_score: number;
  sentiment_label: 'Positive' | 'Negative' | 'Neutral';
  sentiment_score: number;
  confidence: number;
  processing_time_ms: number;
  is_mock: boolean;
  created_at: string;
}

export interface PaginatedHistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
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

// ── History API ──

/**
 * Fetch paginated analysis history.
 */
export async function getHistory(
  page: number = 1,
  perPage: number = 10,
  credibility?: string,
  sentiment?: string,
  search?: string,
): Promise<PaginatedHistoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (credibility) params.append('credibility', credibility);
  if (sentiment) params.append('sentiment', sentiment);
  if (search) params.append('search', search);

  const response = await api.get<PaginatedHistoryResponse>(
    `/api/v1/history?${params.toString()}`,
  );
  return response.data;
}

/**
 * Fetch details of a single analysis record by ID.
 */
export async function getHistoryById(id: string): Promise<HistoryItem> {
  const response = await api.get<HistoryItem>(`/api/v1/history/${id}`);
  return response.data;
}

/**
 * Soft-delete an analysis record by ID.
 */
export async function deleteHistory(id: string): Promise<void> {
  await api.delete(`/api/v1/history/${id}`);
}
