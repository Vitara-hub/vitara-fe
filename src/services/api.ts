// src/services/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/services/authSession';
import { mapActivityFeed } from '@/utils/activityMapper';
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
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

  setAuthTokens(unwrap(response.data));
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

function mapHealthScore(data: {
  healthScore: number;
  breakdown: HealthScoreResponse['breakdown'];
  snapshotDate?: string;
  insightSummary?: string | null;
}): HealthScoreResponse {
  return {
    healthScore: data.healthScore,
    breakdown: data.breakdown,
    snapshotDate: data.snapshotDate,
    insightSummary: data.insightSummary,
  };
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
    const response = await apiClient.post<ApiEnvelope<LoginResponse>>('/api/auth/login', data);
    return unwrap(response.data);
  },

  signup: async (data: SignupRequest): Promise<void> => {
    await apiClient.post('/api/auth/signup', data);
  },

  refresh: async (refreshToken: string): Promise<AuthTokensResponse> => {
    const response = await apiClient.post<ApiEnvelope<AuthTokensResponse>>('/api/auth/refresh', {
      refreshToken,
    });
    return unwrap(response.data);
  },

  getGoogleAuthUrl: async (): Promise<string> => {
    const response = await apiClient.post<ApiEnvelope<GoogleAuthResponse>>('/api/auth/google');
    return unwrap(response.data).authUrl;
  },

  completeGoogleCallback: async (payload: GoogleAuthCallbackRequest): Promise<AuthTokensResponse> => {
    const response = await apiClient.post<ApiEnvelope<AuthTokensResponse>>(
      '/api/auth/google/callback',
      payload,
    );
    return unwrap(response.data);
  },

  getMe: async (): Promise<AuthMeResponse> => {
    const response = await apiClient.get<ApiEnvelope<AuthMeResponse>>('/api/auth/me');
    return unwrap(response.data);
  },

  bootstrapProfile: async (): Promise<void> => {
    await apiClient.post('/api/profile/bootstrap');
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ApiEnvelope<ProfileResponse>>('/api/profile');
    return unwrap(response.data);
  },

  updateProfile: async (data: ProfileUpdateRequest): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ProfileResponse>>('/api/profile', data);
    return unwrap(response.data);
  },

  requestAccountDeletion: async (): Promise<void> => {
    await apiClient.post('/api/profile/request-delete', { requestDelete: true });
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
    resetChatSession();
  },

  predictJournal: async (data: JournalRequest): Promise<JournalResponse> => {
    const response = await apiClient.post<ApiEnvelope<{
      entryId: string;
      emotion: string;
      stressLevel: number;
      topics: string[];
      createdAt: string;
    }>>('/api/journal/analyze', data);
    const result = unwrap(response.data);

    return {
      entryId: result.entryId,
      emotion: result.emotion,
      stressLevel: result.stressLevel,
      topics: result.topics,
      createdAt: result.createdAt,
    };
  },

  getJournalLogs: async (
    params?: { limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<JournalLogItem>> => {
    const response = await apiClient.get<ApiEnvelope<PaginatedResponse<JournalLogItem>>>(
      '/api/journal',
      { params },
    );
    return unwrap(response.data);
  },

  createManualFoodLog: async (data: ManualFoodLogRequest): Promise<FoodLogItem> => {
    const response = await apiClient.post<ApiEnvelope<FoodLogItem>>('/api/food', data);
    return unwrap(response.data);
  },

  predictFood: async (imageOrFormData: File | FormData): Promise<FoodAnalyzeResponse> => {
    const response = await apiClient.post<ApiEnvelope<{
      entryId: string;
      foods: string[];
      estimatedCalories: number;
      imageUrl?: string | null;
    }>>('/api/food/analyze-image', toFoodFormData(imageOrFormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    const result = unwrap(response.data);

    return {
      entryId: result.entryId,
      foods: result.foods,
      estimatedCalories: result.estimatedCalories,
      imageUrl: result.imageUrl,
    };
  },

  getFoodLogs: async (
    params?: { date?: string; limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<FoodLogItem>> => {
    const response = await apiClient.get<ApiEnvelope<PaginatedResponse<FoodLogItem>>>(
      '/api/food',
      { params },
    );
    return unwrap(response.data);
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

    const response = await apiClient.post<ApiEnvelope<{
      entryId: string;
      durationHours: number;
      qualityScore: number;
    }>>(
      '/api/sleep/analyze',
      body,
    );
    const result = unwrap(response.data);

    return {
      entryId: result.entryId,
      durationHours: result.durationHours,
      qualityScore: result.qualityScore,
    };
  },

  getSleepLogs: async (
    params?: { date?: string; limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<SleepLogItem>> => {
    const response = await apiClient.get<ApiEnvelope<PaginatedResponse<SleepLogItem>>>(
      '/api/sleep',
      { params },
    );
    return unwrap(response.data);
  },

  predictTyping: async (data: TypingRequest): Promise<TypingResponse> => {
    const response = await apiClient.post<ApiEnvelope<{ sessionId: string; stressScore: number }>>(
      '/api/typing/analyze',
      {
        wpm: data.wpm,
        duration: data.duration ?? Math.max(1, Math.round(data.interKeyTimings.length / 5)),
        textContent: data.textContent ?? 'Typing telemetry',
        backspaceRate: data.backspaceRate,
        interKeyTimings: data.interKeyTimings,
      },
    );
    const result = unwrap(response.data);

    return {
      sessionId: result.sessionId,
      stressScore: result.stressScore,
    };
  },

  getTypingSessions: async (
    params?: { date?: string; limit?: number; cursor?: string },
  ): Promise<PaginatedResponse<TypingSessionItem>> => {
    const response = await apiClient.get<ApiEnvelope<PaginatedResponse<TypingSessionItem>>>(
      '/api/typing',
      { params },
    );
    return unwrap(response.data);
  },

  computeHealth: async (): Promise<HealthScoreResponse> => {
    const response = await apiClient.post<ApiEnvelope<{
      snapshotDate: string;
      healthScore: number;
      breakdown: HealthScoreResponse['breakdown'];
      insightSummary?: string | null;
    }>>('/api/health/compute');
    return mapHealthScore(unwrap(response.data));
  },

  getHealthDaily: async (params?: { from?: string; to?: string }): Promise<DailyHealthSnapshot[]> => {
    const response = await apiClient.get<ApiEnvelope<DailyHealthSnapshot[]>>('/api/health/daily', {
      params,
    });
    return unwrap(response.data);
  },

  getDashboardToday: async (): Promise<DashboardTodayResponse> => {
    const response = await apiClient.get<ApiEnvelope<DashboardTodayResponse>>('/api/dashboard/today');
    return unwrap(response.data);
  },

  getActivitySummary: async (period: '7d' | '30d' = '7d'): Promise<ActivitySummary> => {
    const response = await apiClient.get<ApiEnvelope<ActivitySummary>>('/api/activity/summary', {
      params: { period },
    });
    return unwrap(response.data);
  },

  getActivityRecent: async (
    params: { limit?: number; cursor?: string } = {},
  ): Promise<ActivityRecentItem[]> => {
    const response = await apiClient.get<ApiEnvelope<{ items: ActivityRecentItem[] }>>(
      '/api/activity/recent',
      { params },
    );
    return unwrap(response.data).items;
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
    const response = await apiClient.post<ApiEnvelope<ChatSession>>('/api/chat/sessions', { title });
    return unwrap(response.data);
  },

  listChatSessions: async (
    params: { limit?: number; cursor?: string } = {},
  ): Promise<ChatSession[]> => {
    const response = await apiClient.get<ApiEnvelope<{ items: ChatSession[] }>>(
      '/api/chat/sessions',
      { params },
    );
    return unwrap(response.data).items;
  },

  listChatMessages: async (
    sessionId: string,
    params: { limit?: number; cursor?: string } = {},
  ): Promise<ChatMessageItem[]> => {
    const response = await apiClient.get<ApiEnvelope<{ items: ChatMessageItem[] }>>(
      '/api/chat/messages',
      { params: { sessionId, ...params } },
    );
    return unwrap(response.data).items;
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
