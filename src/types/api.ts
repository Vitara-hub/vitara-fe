// src/types/api.ts

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type LoginResponse = AuthTokensResponse;

export interface AuthMeResponse {
  id: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  timezone: string;
}

export type GoogleAuthCallbackRequest =
  | { code: string }
  | { accessToken: string; refreshToken: string };

export interface SignupRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

export interface GoogleAuthResponse {
  authUrl: string;
}

export interface JournalRequest {
  text: string;
}

export interface JournalResponse {
  emotion: string;
  stress_level: number;
  topics: string[];
}

export interface FoodAnalyzeResponse {
  entryId: string;
  foods: string[];
  estimated_calories: number;
  imageUrl?: string | null;
}

/** @deprecated use FoodAnalyzeResponse */
export type FoodResponse = Pick<FoodAnalyzeResponse, 'foods' | 'estimated_calories'>;

export interface SleepAnalyzeRequest {
  sleepTime: string;
  wakeTime: string;
  interruptions: number;
  notes?: string;
}

/** @deprecated use SleepAnalyzeRequest — kept for logbook components */
export interface SleepRequest {
  duration_hours: number;
  bedtime: string;
  wake_time: string;
  interruptions: number;
  sleep_debt_hours?: number;
}

export interface SleepResponse {
  quality_score: number;
}

export interface TypingRequest {
  wpm: number;
  backspace_rate: number;
  inter_key_timings: number[];
  duration?: number;
  text_content?: string;
}

export interface TypingResponse {
  stress_score: number;
}

export interface HealthBreakdown {
  mood: number;
  nutrition: number;
  stress: number;
  sleep: number;
}

export interface HealthScoreResponse {
  health_score: number;
  breakdown: HealthBreakdown;
  snapshotDate?: string;
  insightSummary?: string | null;
}

export interface DashboardTodayResponse {
  dateLabel: string;
  healthScore: number;
  statusLabel: string;
  suggestion: string;
  breakdown: {
    moodLabel: string;
    stressLabel: string;
    nutritionKcal: number;
    sleepHours: number;
  };
}

export interface DailyHealthSnapshot {
  id: string;
  snapshotDate: string;
  healthScore: number;
  breakdown: HealthBreakdown;
  insightSummary?: string | null;
  createdAt: string;
}

export interface ActivitySummary {
  period: string;
  averageHealthScore: number;
  daysTracked: number;
  bestScore: number;
  worstScore: number;
}

export interface ActivityRecentItem {
  id: string;
  type: 'food' | 'sleep' | 'journal' | 'typing';
  createdAt: string;
  title: string;
  meta: {
    calories?: number | null;
    qualityScore?: number | null;
    emotion?: string | null;
    stressScore?: number | null;
    wpm?: number | null;
    endTime?: string | null;
  };
}

export interface ProfileResponse {
  id: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  timezone: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  fullName?: string;
  timezone?: string;
}

export interface ChatSession {
  id: string;
  title: string | null;
  summary: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  model?: string | null;
  createdAt: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  response: string;
  recommendations: string[];
}

// Frontend-only view models. These are not backend API routes in api-contract.md.
export type ActivityType = 'journal' | 'sleep' | 'food' | 'chat' | 'stress';

export interface ActivityChartPoint {
  day: string;
  score: number;
  is_today?: boolean;
}

export interface ActivityHistoryItem {
  id: string | number;
  type: ActivityType;
  title: string;
  time: string;
  score: string | number;
}

export interface ActivityDataResponse {
  average_score: number;
  weekly_change_percent: number;
  chart: ActivityChartPoint[];
  history: ActivityHistoryItem[];
}

export interface ChatHistoryMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  recommendations?: string[];
}
