// src/services/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/services/authSession';
import { mapActivityFeed } from '@/utils/activityMapper';
import { estimateNutritionMacros, hasNutritionMacros } from '@/utils/nutrition';
import type {
  ActivityDataResponse,
  ActivityRecentItem,
  ActivitySummary,
  ApiEnvelope,
  ApiErrorResponse,
  AuthMeResponse,
  AuthTokensResponse,
  ChatMessageItem,
  ChatRequest,
  ChatResponse,
  ChatSession,
  DailyHealthSnapshot,
  DashboardTodayResponse,
  FoodAnalyzeResponse,
  FoodLogItem,
  GoogleAuthCallbackRequest,
  GoogleAuthResponse,
  HealthScoreResponse,
  JournalLogItem,
  JournalRequest,
  JournalResponse,
  LoginRequest,
  LoginResponse,
  ManualFoodLogRequest,
  PaginatedResponse,
  ProfileResponse,
  ProfileUpdateRequest,
  SignupRequest,
  SleepLogItem,
  SleepAnalyzeRequest,
  SleepRequest,
  SleepResponse,
  TypingSessionItem,
  TypingRequest,
  TypingResponse,
} from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL;

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error('FATAL ERROR: VITE_API_URL is not configured for production builds.');
}

export const isApiConfigured = Boolean(API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

let chatSessionId: string | null = null;

interface ChatPayload {
  response?: string;
  full_response?: string;
  recommendations?: string[];
}

interface ChatEnvelopePayload extends ChatPayload {
  data?: ChatPayload;
}

interface ChatStreamChunk {
  token?: string;
  full_response?: string;
  recommendations?: unknown;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function readString(source: unknown, ...keys: string[]): string | undefined {
  if (!isRecord(source)) return undefined;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') return value;
  }

  return undefined;
}

function readNullableString(source: unknown, ...keys: string[]): string | null {
  if (!isRecord(source)) return null;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') return value;
    if (value === null) return null;
  }

  return null;
}

function readNumber(source: unknown, ...keys: string[]): number | undefined {
  if (!isRecord(source)) return undefined;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }

  return undefined;
}

function readStringArray(source: unknown, ...keys: string[]): string[] {
  if (!isRecord(source)) return [];

  for (const key of keys) {
    const value = source[key];
    if (isStringArray(value)) return value;
  }

  return [];
}

function readRecord(source: unknown, ...keys: string[]): ApiRecord {
  if (!isRecord(source)) return {};

  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) return value;
  }

  return {};
}

function mapPaginatedResponse<T>(
  raw: unknown,
  mapper: (item: unknown) => T,
): PaginatedResponse<T> {
  const items = isRecord(raw) && Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw)
      ? raw
      : [];

  return {
    items: items.map(mapper),
    nextCursor: readNullableString(raw, 'nextCursor', 'next_cursor'),
  };
}

function mapAuthTokens(raw: unknown): AuthTokensResponse {
  return {
    accessToken: readString(raw, 'accessToken', 'access_token') ?? '',
    refreshToken: readString(raw, 'refreshToken', 'refresh_token') ?? '',
    expiresIn: readNumber(raw, 'expiresIn', 'expires_in') ?? 0,
  };
}

function mapAuthMe(raw: unknown): AuthMeResponse {
  return {
    id: readString(raw, 'id', 'userId', 'user_id') ?? '',
    username: readNullableString(raw, 'username'),
    email: readNullableString(raw, 'email'),
    fullName: readNullableString(raw, 'fullName', 'full_name'),
    timezone: readString(raw, 'timezone') ?? 'Asia/Jakarta',
    imageUrl: readNullableString(raw, 'imageUrl', 'image_url', 'avatarUrl', 'avatar_url'),
    user_metadata: isRecord(raw) && isRecord(raw.user_metadata) ? raw.user_metadata : null,
  };
}

function mapProfileResponse(raw: unknown): ProfileResponse {
  return {
    ...mapAuthMe(raw),
    imageUrl: readNullableString(raw, 'imageUrl', 'image_url', 'avatarUrl', 'avatar_url'),
  };
}

function mapJournalResponse(raw: unknown): JournalResponse {
  return {
    entryId: readString(raw, 'entryId', 'entry_id', 'id') ?? '',
    emotion: readString(raw, 'emotion') ?? 'neutral',
    stressLevel: readNumber(raw, 'stressLevel', 'stress_level') ?? 0,
    topics: readStringArray(raw, 'topics'),
    createdAt: readString(raw, 'createdAt', 'created_at') ?? new Date().toISOString(),
  };
}

function mapJournalLogItem(raw: unknown): JournalLogItem {
  return {
    id: readString(raw, 'id', 'entryId', 'entry_id') ?? '',
    text: readString(raw, 'text') ?? '',
    emotion: readString(raw, 'emotion') ?? 'neutral',
    stressLevel: readNumber(raw, 'stressLevel', 'stress_level') ?? 0,
    topics: readStringArray(raw, 'topics'),
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
  };
}

function mapFoodAnalyzeResponse(raw: unknown): FoodAnalyzeResponse {
  return {
    entryId: readString(raw, 'entryId', 'entry_id', 'id') ?? '',
    foods: readStringArray(raw, 'foods'),
    estimatedCalories: readNumber(raw, 'estimatedCalories', 'estimated_calories') ?? 0,
    imageUrl: readNullableString(raw, 'imageUrl', 'image_url'),
  };
}

function mapFoodLogItem(raw: unknown): FoodLogItem {
  const calories = readNumber(raw, 'calories', 'estimatedCalories', 'estimated_calories') ?? 0;
  const mappedMacros = {
    protein: readNumber(raw, 'protein') ?? 0,
    carbs: readNumber(raw, 'carbs') ?? 0,
    fat: readNumber(raw, 'fat') ?? 0,
  };
  const macros = hasNutritionMacros(mappedMacros)
    ? mappedMacros
    : estimateNutritionMacros(calories);

  return {
    id: readString(raw, 'id', 'entryId', 'entry_id') ?? '',
    name: readString(raw, 'name') ?? '',
    calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    source: readString(raw, 'source') ?? 'manual',
    consumedAt: readString(raw, 'consumedAt', 'consumed_at') ?? '',
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
    imageUrl: readNullableString(raw, 'imageUrl', 'image_url'),
    imagePath: readNullableString(raw, 'imagePath', 'image_path'),
  };
}

function mapSleepResponse(raw: unknown): SleepResponse {
  return {
    entryId: readString(raw, 'entryId', 'entry_id', 'id') ?? '',
    durationHours: readNumber(raw, 'durationHours', 'duration_hours') ?? 0,
    qualityScore: readNumber(raw, 'qualityScore', 'quality_score') ?? 0,
  };
}

function mapSleepLogItem(raw: unknown): SleepLogItem {
  return {
    id: readString(raw, 'id', 'entryId', 'entry_id') ?? '',
    sleepTime: readString(raw, 'sleepTime', 'sleep_time', 'bedtime') ?? '',
    wakeTime: readString(raw, 'wakeTime', 'wake_time') ?? '',
    interruptions: readNumber(raw, 'interruptions') ?? 0,
    notes: readNullableString(raw, 'notes'),
    durationHours: readNumber(raw, 'durationHours', 'duration_hours') ?? 0,
    qualityScore: readNumber(raw, 'qualityScore', 'quality_score') ?? 0,
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
  };
}

function mapTypingResponse(raw: unknown): TypingResponse {
  return {
    sessionId: readString(raw, 'sessionId', 'session_id', 'id') ?? '',
    stressScore: readNumber(raw, 'stressScore', 'stress_score') ?? 0,
  };
}

function mapTypingSessionItem(raw: unknown): TypingSessionItem {
  const timings = isRecord(raw) && Array.isArray(raw.interKeyTimings)
    ? raw.interKeyTimings
    : isRecord(raw) && Array.isArray(raw.inter_key_timings)
      ? raw.inter_key_timings
      : [];

  return {
    id: readString(raw, 'id', 'sessionId', 'session_id') ?? '',
    wpm: readNumber(raw, 'wpm') ?? 0,
    duration: readNumber(raw, 'duration') ?? 0,
    textContent: readNullableString(raw, 'textContent', 'text_content'),
    backspaceRate: readNumber(raw, 'backspaceRate', 'backspace_rate') ?? 0,
    interKeyTimings: timings.filter((item): item is number => typeof item === 'number'),
    stressScore: readNumber(raw, 'stressScore', 'stress_score') ?? 0,
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
  };
}

function mapHealthBreakdown(raw: unknown): HealthScoreResponse['breakdown'] {
  return {
    mood: readNumber(raw, 'mood', 'mood_score') ?? 0,
    nutrition: readNumber(raw, 'nutrition', 'nutrition_score') ?? 0,
    stress: readNumber(raw, 'stress', 'stress_score') ?? 0,
    sleep: readNumber(raw, 'sleep', 'sleep_score') ?? 0,
  };
}

function mapActivitySummary(raw: unknown): ActivitySummary {
  return {
    period: readString(raw, 'period') ?? '7d',
    averageHealthScore: readNumber(raw, 'averageHealthScore', 'average_health_score') ?? 0,
    daysTracked: readNumber(raw, 'daysTracked', 'days_tracked') ?? 0,
    bestScore: readNumber(raw, 'bestScore', 'best_score') ?? 0,
    worstScore: readNumber(raw, 'worstScore', 'worst_score') ?? 0,
  };
}

function mapHealthScore(raw: unknown): HealthScoreResponse {
  return {
    healthScore: readNumber(raw, 'healthScore', 'health_score') ?? 0,
    breakdown: mapHealthBreakdown(readRecord(raw, 'breakdown')),
    snapshotDate: readString(raw, 'snapshotDate', 'snapshot_date'),
    insightSummary: readNullableString(raw, 'insightSummary', 'insight_summary'),
  };
}

function mapDailyHealthSnapshot(raw: unknown): DailyHealthSnapshot {
  return {
    id: readString(raw, 'id') ?? '',
    snapshotDate: readString(raw, 'snapshotDate', 'snapshot_date') ?? '',
    healthScore: readNumber(raw, 'healthScore', 'health_score') ?? 0,
    breakdown: mapHealthBreakdown(readRecord(raw, 'breakdown')),
    insightSummary: readNullableString(raw, 'insightSummary', 'insight_summary'),
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
  };
}

function mapDashboardTodayResponse(raw: unknown): DashboardTodayResponse {
  const breakdown = readRecord(raw, 'breakdown');

  return {
    dateLabel: readString(raw, 'dateLabel', 'date_label') ?? '',
    healthScore: readNumber(raw, 'healthScore', 'health_score') ?? 0,
    statusLabel: readString(raw, 'statusLabel', 'status_label') ?? '',
    suggestion: readString(raw, 'suggestion') ?? '',
    breakdown: {
      moodLabel: readString(breakdown, 'moodLabel', 'mood_label') ?? '',
      stressLabel: readString(breakdown, 'stressLabel', 'stress_label') ?? '',
      nutritionKcal: readNumber(breakdown, 'nutritionKcal', 'nutrition_kcal') ?? 0,
      sleepHours: readNumber(breakdown, 'sleepHours', 'sleep_hours') ?? 0,
    },
  };
}

function mapActivityRecentItem(raw: unknown): ActivityRecentItem {
  const meta = readRecord(raw, 'meta');

  return {
    id: readString(raw, 'id') ?? '',
    type: (readString(raw, 'type') as ActivityRecentItem['type']) ?? 'journal',
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
    title: readString(raw, 'title') ?? 'Aktivitas',
    meta: {
      name:
        readNullableString(meta, 'name', 'foodName', 'food_name') ??
        readNullableString(raw, 'name', 'foodName', 'food_name'),
      calories: readNumber(meta, 'calories') ?? readNumber(raw, 'calories') ?? null,
      protein: readNumber(meta, 'protein') ?? readNumber(raw, 'protein') ?? null,
      carbs: readNumber(meta, 'carbs') ?? readNumber(raw, 'carbs') ?? null,
      fat: readNumber(meta, 'fat') ?? readNumber(raw, 'fat') ?? null,
      qualityScore:
        readNumber(meta, 'qualityScore', 'quality_score') ??
        readNumber(raw, 'qualityScore', 'quality_score') ??
        null,
      emotion: readNullableString(meta, 'emotion') ?? readNullableString(raw, 'emotion'),
      stressScore:
        readNumber(meta, 'stressScore', 'stress_score') ??
        readNumber(raw, 'stressScore', 'stress_score') ??
        null,
      wpm: readNumber(meta, 'wpm') ?? null,
      endTime: readNullableString(meta, 'endTime', 'end_time'),
    },
  };
}

function mapChatSession(raw: unknown): ChatSession {
  return {
    id: readString(raw, 'id') ?? '',
    title: readNullableString(raw, 'title'),
    summary: readNullableString(raw, 'summary'),
    lastMessageAt: readNullableString(raw, 'lastMessageAt', 'last_message_at'),
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
  };
}

function mapChatMessageItem(raw: unknown): ChatMessageItem {
  const recommendations = isRecord(raw) && isStringArray(raw.recommendations)
    ? raw.recommendations
    : null;

  return {
    id: readString(raw, 'id') ?? '',
    sessionId: readString(raw, 'sessionId', 'session_id') ?? '',
    role: readString(raw, 'role') === 'assistant' ? 'assistant' : 'user',
    content: readString(raw, 'content') ?? '',
    recommendations,
    model: readNullableString(raw, 'model'),
    createdAt: readString(raw, 'createdAt', 'created_at') ?? '',
  };
}

function toChatPayload(raw: unknown): ChatPayload {
  if (!isRecord(raw)) return {};

  const payload: ChatPayload = {};
  const responseValue = raw.response;
  const fullResponseValue = raw.full_response;
  const recommendationsValue = raw.recommendations;

  if (typeof responseValue === 'string') payload.response = responseValue;
  if (typeof fullResponseValue === 'string') payload.full_response = fullResponseValue;
  if (isStringArray(recommendationsValue)) payload.recommendations = recommendationsValue;

  return payload;
}

function toChatEnvelopePayload(raw: unknown): ChatEnvelopePayload {
  if (!isRecord(raw)) return {};
  const rootPayload = toChatPayload(raw);
  const dataPayload = isRecord(raw.data) ? toChatPayload(raw.data) : undefined;
  return dataPayload ? { ...rootPayload, data: dataPayload } : rootPayload;
}

function toChatStreamChunk(raw: unknown): ChatStreamChunk {
  if (!isRecord(raw)) return {};
  return {
    token: typeof raw.token === 'string' ? raw.token : undefined,
    full_response: typeof raw.full_response === 'string' ? raw.full_response : undefined,
    recommendations: raw.recommendations,
  };
}

async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Missing refresh token.');

  const response = await axios.post<ApiEnvelope<AuthTokensResponse>>(
    API_URL === '/' ? '/api/auth/refresh' : `${API_URL}/api/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000, withCredentials: true },
  );

  setAuthTokens(mapAuthTokens(unwrap(response.data)));
}

export function ensureValidAccessToken(): Promise<void> {
  // Rely on HttpOnly cookies; if missing/expired, the interceptor will handle 401.
  return Promise.resolve();
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh') &&
      !originalRequest.url?.includes('/api/auth/google')
    ) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        return apiClient(originalRequest);
      } catch {
        clearAuthTokens();
        // Redirect to login or reset state could go here
      }
    }

    if (!error.response) {
      console.error('Network/CORS Error: Unable to reach the Vitara API.');
    } else if (error.response.status >= 500) {
      console.error('Server Error: Vitara API returned a server-side failure.');
    }

    return Promise.reject(error);
  },
);

function toFoodFormData(imageOrFormData: File | FormData): FormData {
  if (imageOrFormData instanceof FormData) return imageOrFormData;

  const formData = new FormData();
  formData.append('image', imageOrFormData);
  return formData;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (envelope.status === 'error') {
    throw new Error(envelope.message);
  }

  return envelope.data;
}

export function resetChatSession() {
  chatSessionId = null;
}

async function resolveChatSessionId(): Promise<string> {
  if (chatSessionId) return chatSessionId;

  const sessions = await vitaraApi.listChatSessions({ limit: 1 });
  if (sessions.length > 0) {
    chatSessionId = sessions[0].id;
    return chatSessionId;
  }

  const created = await vitaraApi.createChatSession('Vitara Chat');
  chatSessionId = created.id;
  return chatSessionId;
}

export const vitaraApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/auth/login', data);
    return mapAuthTokens(unwrap(response.data));
  },

  signup: async (data: SignupRequest): Promise<void> => {
    await apiClient.post('/api/auth/signup', data);
  },

  refresh: async (refreshToken: string): Promise<AuthTokensResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/auth/refresh', {
      refreshToken,
    });
    return mapAuthTokens(unwrap(response.data));
  },

  getGoogleAuthUrl: async (): Promise<string> => {
    const response = await apiClient.post<ApiEnvelope<GoogleAuthResponse>>('/api/auth/google');
    return unwrap(response.data).authUrl;
  },

  completeGoogleCallback: async (payload: GoogleAuthCallbackRequest): Promise<AuthTokensResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>(
      '/api/auth/google/callback',
      payload,
    );
    return mapAuthTokens(unwrap(response.data));
  },

  getMe: async (): Promise<AuthMeResponse> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>('/api/auth/me');
    return mapAuthMe(unwrap(response.data));
  },

  bootstrapProfile: async (): Promise<void> => {
    await apiClient.post('/api/profile/bootstrap');
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>('/api/profile');
    return mapProfileResponse(unwrap(response.data));
  },

  updateProfile: async (data: ProfileUpdateRequest): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ApiEnvelope<unknown>>('/api/profile', data);
    return mapProfileResponse(unwrap(response.data));
  },

  requestDataDeletion: async (): Promise<void> => {
    const response = await apiClient.post<ApiEnvelope<Record<string, never>>>(
      '/api/profile/request-delete',
      { requestDelete: true },
    );
    unwrap(response.data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
    resetChatSession();
  },

  predictJournal: async (data: JournalRequest): Promise<JournalResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/journal/analyze', data);
    return mapJournalResponse(unwrap(response.data));
  },

  getJournalLogs: async (
    params?: { limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<JournalLogItem>> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/journal',
      { params },
    );
    return mapPaginatedResponse(unwrap(response.data), mapJournalLogItem);
  },

  createManualFoodLog: async (data: ManualFoodLogRequest): Promise<FoodLogItem> => {
    if (data.calories <= 0) {
      throw new Error('Food calories must be greater than 0 before saving.');
    }

    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/food', data);
    return mapFoodLogItem(unwrap(response.data));
  },

  predictFood: async (imageOrFormData: File | FormData): Promise<FoodAnalyzeResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/food/analyze-image', toFoodFormData(imageOrFormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return mapFoodAnalyzeResponse(unwrap(response.data));
  },

  getFoodLogs: async (
    params?: { date?: string; limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<FoodLogItem>> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/food',
      { params },
    );
    return mapPaginatedResponse(unwrap(response.data), mapFoodLogItem);
  },

  predictSleep: async (data: SleepAnalyzeRequest | SleepRequest): Promise<SleepResponse> => {
    const body =
      'sleepTime' in data
        ? data
        : {
          sleepTime: data.bedtime,
          wakeTime: data.wake_time,
          interruptions: data.interruptions,
        };

    const response = await apiClient.post<ApiEnvelope<unknown>>(
      '/api/sleep/analyze',
      body,
    );
    return mapSleepResponse(unwrap(response.data));
  },

  getSleepLogs: async (
    params?: { date?: string; limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<SleepLogItem>> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/sleep',
      { params },
    );
    return mapPaginatedResponse(unwrap(response.data), mapSleepLogItem);
  },

  predictTyping: async (data: TypingRequest): Promise<TypingResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>(
      '/api/typing/analyze',
      {
        wpm: data.wpm,
        duration: data.duration ?? Math.max(1, Math.round(data.interKeyTimings.length / 5)),
        textContent: data.textContent ?? 'Typing telemetry',
        backspaceRate: data.backspaceRate,
        interKeyTimings: data.interKeyTimings,
        backspace_rate: data.backspaceRate,
        inter_key_timings: data.interKeyTimings,
        total_keystrokes: data.total_keystrokes,
        backspace_count: data.backspace_count,
        typing_duration_ms: data.typing_duration_ms,
        average_time_between_keys_ms: data.average_time_between_keys_ms,
      },
    );
    return mapTypingResponse(unwrap(response.data));
  },

  getTypingSessions: async (
    params?: { date?: string; limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<TypingSessionItem>> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/typing',
      { params },
    );
    return mapPaginatedResponse(unwrap(response.data), mapTypingSessionItem);
  },

  computeHealth: async (): Promise<HealthScoreResponse> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/health/compute');
    return mapHealthScore(unwrap(response.data));
  },

  getHealthDaily: async (params?: { from?: string; to?: string }): Promise<DailyHealthSnapshot[]> => {
    const response = await apiClient.get<ApiEnvelope<unknown[]>>('/api/health/daily', {
      params,
    });
    return unwrap(response.data).map(mapDailyHealthSnapshot);
  },

  getDashboardToday: async (): Promise<DashboardTodayResponse> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>('/api/dashboard/today');
    return mapDashboardTodayResponse(unwrap(response.data));
  },

  getActivitySummary: async (period: '7d' | '30d' = '7d'): Promise<ActivitySummary> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>('/api/activity/summary', {
      params: { period },
    });
    return mapActivitySummary(unwrap(response.data));
  },

  getActivityRecent: async (
    params: { limit?: number; cursor?: string } = {},
  ): Promise<ActivityRecentItem[]> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/activity/recent',
      { params },
    );
    const recentItems = mapPaginatedResponse(unwrap(response.data), mapActivityRecentItem).items;
    if (!recentItems.some((item) => item.type === 'food')) return recentItems;

    try {
      const foodLogs = await vitaraApi.getFoodLogs({ limit: 100 });
      const foodById = new Map(foodLogs.items.map((food) => [food.id, food]));

      return recentItems.map((item) => {
        if (item.type !== 'food') return item;

        const food = foodById.get(item.id);
        if (!food) return item;

        return {
          ...item,
          title: food.name || item.title,
          meta: {
            ...item.meta,
            name: food.name || item.meta.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          },
        };
      });
    } catch (error) {
      console.warn('Food details unavailable for activity enrichment.', error);
      return recentItems;
    }
  },

  getActivityFeed: async (period: '7d' | '30d' = '7d'): Promise<ActivityDataResponse> => {
    const [daily, recent, summary] = await Promise.all([
      vitaraApi.getHealthDaily(),
      vitaraApi.getActivityRecent({ limit: 20 }),
      vitaraApi.getActivitySummary(period),
    ]);

    return mapActivityFeed(daily, recent, summary);
  },

  createChatSession: async (title: string): Promise<ChatSession> => {
    const response = await apiClient.post<ApiEnvelope<unknown>>('/api/chat/sessions', { title });
    return mapChatSession(unwrap(response.data));
  },

  listChatSessions: async (
    params: { limit?: number; cursor?: string } = {},
  ): Promise<ChatSession[]> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/chat/sessions',
      { params },
    );
    return mapPaginatedResponse(unwrap(response.data), mapChatSession).items;
  },

  listChatMessages: async (
    sessionId: string,
    params: { limit?: number; cursor?: string } = {},
  ): Promise<ChatMessageItem[]> => {
    const response = await apiClient.get<ApiEnvelope<unknown>>(
      '/api/chat/messages',
      { params: { sessionId, ...params } },
    );
    return mapPaginatedResponse(unwrap(response.data), mapChatMessageItem).items;
  },

  sendChatMessage: async (data: ChatRequest, onChunk?: (text: string) => void): Promise<ChatResponse> => {
    const sessionId = data.sessionId ?? (await resolveChatSessionId());
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const fetchUrl = API_URL === '/' ? '/api/chat/messages' : `${API_URL}/api/chat/messages`;
    const response = await fetch(fetchUrl, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        sessionId,
        message: data.message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = toChatEnvelopePayload(await response.json() as unknown);
      const source = payload.data ?? payload;
      const finalText = source.full_response ?? source.response ?? "";
      return {
        response: finalText,
        full_response: source.full_response,
        recommendations: source.recommendations ?? [],
      };
    }

    if (!response.body) {
      return { response: "", recommendations: [] };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let recommendations: string[] = [];
    let buffer = "";

    const processEvent = (eventText: string) => {
      const dataLines = eventText
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());

      if (dataLines.length === 0) return;

      const dataStr = dataLines.join("\n").trim();
      if (!dataStr || dataStr === "[DONE]") return;

      try {
        const parsed = toChatStreamChunk(JSON.parse(dataStr) as unknown);
        if (parsed.token) {
          fullText += parsed.token;
          onChunk?.(fullText);
        }

        if (parsed.full_response) {
          fullText = parsed.full_response;
          onChunk?.(fullText);
        }

        if (isStringArray(parsed.recommendations)) {
          recommendations = parsed.recommendations;
        }
      } catch {
        // Ignore malformed completed events and continue streaming.
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        processEvent(eventText);
      }
    }

    if (buffer.trim()) {
      processEvent(buffer);
    }

    return {
      response: fullText,
      full_response: fullText,
      recommendations,
    };
  },

  loadChatHistory: async (): Promise<{ sessionId: string; messages: ChatMessageItem[] }> => {
    const sessionId = await resolveChatSessionId();
    const items = await vitaraApi.listChatMessages(sessionId, { limit: 50 });
    return { sessionId, messages: items.reverse() };
  },

  /** @deprecated use computeHealth — BE aggregates from DB */
  getHealthScore: async (): Promise<HealthScoreResponse> => {
    return vitaraApi.computeHealth();
  },

  calculateHealthScore: async (): Promise<HealthScoreResponse> => {
    return vitaraApi.computeHealth();
  },
};
