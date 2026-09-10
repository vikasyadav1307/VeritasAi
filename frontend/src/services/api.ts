import axios from 'axios';
import { useAuthStore, type AuthUser } from '../store/auth.store';

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
  detected_language?: string;
  language_name?: string | null;
  language_confidence?: number | null;
}


export interface AnalyzeUrlRequest {
  url: string;
}

export interface AnalyzeUrlResponse extends AnalyzeResponse {
  source_url: string;
  final_url?: string;
  extracted_title?: string;
  extracted_text?: string;
  detected_language: string;
  character_count: number;
}

export interface AnalyzeImageResponse extends AnalyzeResponse {
  filename: string;
  content_type: string;
  ocr_text: string;
  detected_language: string;
  character_count: number;
}

// ── Explainability API Types ──

export interface AttributedToken {
  token: string;
  score: number;
  direction: 'supporting' | 'opposing';
  normalized_score: number;
}

export interface ModelExplanation {
  predicted_label: string;
  confidence: number;
  method: string;
  tokens: AttributedToken[];
  latency_ms: number;
}

export interface ExplainResponse {
  credibility_explanation: ModelExplanation;
  sentiment_explanation: ModelExplanation;
  total_latency_ms: number;
  disclaimer: string;
}

// ── Translation API Types ──

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  is_supported_for_analysis: boolean;
  is_verified_translation: boolean;
}

export interface LanguagesResponse {
  languages: SupportedLanguage[];
  total_supported: number;
  default_target: string;
}

export interface TranslateRequest {
  text: string;
  target_lang: string;
  source_lang?: string;
}

export interface TranslateResponse {
  translated_text: string;
  source_lang: string;
  source_lang_name: string;
  target_lang: string;
  target_lang_name: string;
  character_count: number;
  provider: string;
  is_cached: boolean;
  disclaimer: string;
}


// ── History API Types ──

export interface HistoryItem {
  id: string;
  input_type: 'text' | 'url' | 'image' | string;
  original_text: string;
  source_url?: string;
  title?: string;
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

// ── Dashboard API Types ──

export interface CredibilityDistribution {
  real_count: number;
  fake_count: number;
  real_percentage: number;
  fake_percentage: number;
}

export interface SentimentDistribution {
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
}

export interface LanguageCount {
  language: string;
  count: number;
  percentage: number;
}

export interface DashboardSummary {
  total_analyses: number;
  credibility_distribution: CredibilityDistribution;
  sentiment_distribution: SentimentDistribution;
  average_confidence: number;
  average_processing_time_ms: number;
  language_distribution: LanguageCount[];
  recent_analyses: HistoryItem[];
}

// ── Auth API Types ──

export interface RegisterRequest {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

/**
 * Pre-configured Axios instance for all API calls.
 *
 * Features:
 * - Base URL from environment variable
 * - JSON content type by default
 * - Request interceptor for JWT injection
 * - Response interceptor for 401 → token refresh → retry
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120_000, // 120 seconds — CPU model inference takes ~68s
});

// ── Request Interceptor — JWT Injection ──
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor — 401 Refresh ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors, skip if already retried or is an auth endpoint
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while refresh is in progress
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const { access_token, refresh_token: newRefresh, user } = response.data;
      useAuthStore.getState().setAuth(user, access_token, newRefresh);

      processQueue(null, access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Auth API ──

/**
 * Register a new user account.
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/register', data);
  return response.data;
}

/**
 * Authenticate with email and password.
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/login', data);
  return response.data;
}

/**
 * Refresh access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthUser>('/api/v1/auth/me');
  return response.data;
}

/**
 * Log out the current user: calls backend /logout endpoint and clears local auth state.
 */
export async function logoutUser(): Promise<void> {
  try {
    await api.post('/api/v1/auth/logout');
  } catch {
    // Ignore network / server errors during logout — client auth must still be cleared
  } finally {
    useAuthStore.getState().clearAuth();
  }
}

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

/**
 * Send an article URL to the backend for SSRF-safe scraping and analysis.
 *
 * @param url - Public HTTP or HTTPS article URL.
 */
export async function analyzeUrl(url: string): Promise<AnalyzeUrlResponse> {
  const response = await api.post<AnalyzeUrlResponse>('/api/v1/analyze/url', {
    url,
  } satisfies AnalyzeUrlRequest);

  return response.data;
}

/**
 * Send an image file to the backend for OCR text extraction and analysis.
 *
 * @param file - Image file (JPEG, PNG, or WEBP, max 10MB).
 */
export async function analyzeImage(file: File): Promise<AnalyzeImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<AnalyzeImageResponse>('/api/v1/analyze/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// ── Explainability API ──

/**
 * Request token-level gradient attribution explanation for analyzed text.
 *
 * @param text - The actual analyzed text (submitted text, extracted article text, or OCR cleaned text).
 */
export async function explainText(text: string): Promise<ExplainResponse> {
  const response = await api.post<ExplainResponse>('/api/v1/explain/text', { text });
  return response.data;
}

// ── Translation API ──

/**
 * Fetch the registry of supported languages for analysis and translation.
 */
export async function getSupportedLanguages(): Promise<LanguagesResponse> {
  const response = await api.get<LanguagesResponse>('/api/v1/languages');
  return response.data;
}

/**
 * Translate analyzed text to a target language on demand for presentation.
 * Note: Model inference and token explainability remain strictly bound to the original text.
 */
export async function translateText(data: TranslateRequest): Promise<TranslateResponse> {
  const response = await api.post<TranslateResponse>('/api/v1/translate', data);
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

// ── Dashboard API ──

/**
 * Fetch analytics dashboard summary metrics and distributions.
 */
export async function getDashboardSummary(userId?: string): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (userId) params.append('user_id', userId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get<DashboardSummary>(`/api/v1/dashboard/summary${qs}`);
  return response.data;
}
