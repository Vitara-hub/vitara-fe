// src/types/api.ts

export interface ApiErrorResponse {
  status?: 'error';
  detail?: string;
  message?: string;
}

export interface ApiSuccessEnvelope<T> {
  status: 'success';
  data: T;
}

export interface ApiErrorEnvelope {
  status: 'error';
  message: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

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
  imageUrl: string | null;
  user_metadata?: UserMetadata | null;
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
  entryId: string;
  emotion: string;
  stressLevel: number;
  topics: string[];
  createdAt: string;
}

export interface FoodAnalyzeResponse {
  entryId: string;
  foods: string[];
  estimatedCalories: number;
  imageUrl?: string | null;
}

/** @deprecated use FoodAnalyzeResponse */
export type FoodResponse = Pick<FoodAnalyzeResponse, 'foods' | 'estimatedCalories'>;

export interface ManualFoodLogRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  consumedAt: string;
}

export interface FoodLogItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  consumedAt: string;
  createdAt: string;
  imageUrl: string | null;
  imagePath: string | null;
}

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
  entryId: string;
  durationHours: number;
  qualityScore: number;
}

export interface SleepLogItem {
  id: string;
  sleepTime: string;
  wakeTime: string;
  interruptions: number;
  notes?: string | null;
  durationHours: number;
  qualityScore: number;
  createdAt: string;
}

export interface TypingRequest {
  wpm: number;
  backspaceRate: number;
  interKeyTimings: number[];
  total_keystrokes: number;
  backspace_count: number;
  typing_duration_ms: number;
  average_time_between_keys_ms: number;
  duration?: number;
  textContent?: string;
}

export interface TypingResponse {
  sessionId: string;
  stressScore: number;
}

export interface TypingSessionItem {
  id: string;
  wpm: number;
  duration: number;
  textContent: string | null;
  backspaceRate: number;
  interKeyTimings: number[];
  stressScore: number;
  createdAt: string;
}

export interface HealthBreakdown {
  mood: number;
  nutrition: number;
  stress: number;
  sleep: number;
}

export interface HealthScoreResponse {
  healthScore: number;
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
    name?: string | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
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
  imageUrl?: string | null;
  user_metadata?: UserMetadata | null;
}

export interface UserMetadata {
  avatar_url?: string | null;
  picture?: string | null;
  full_name?: string | null;
  name?: string | null;
}

export interface JournalLogItem {
  id: string;
  text: string;
  emotion: string;
  stressLevel: number;
  topics: string[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ProfileUpdateRequest {
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
  role: 'user' | 'assistant';
  content: string;
  recommendations: string[] | null;
  model?: string | null;
  createdAt: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  response: string;
  full_response?: string;
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
  nutritionDetails?: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
}

export interface ActivityDataResponse {
  average_score: number;
  weekly_change_percent: number;
  chart: ActivityChartPoint[];
  history: ActivityHistoryItem[];
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  recommendations?: string[];
}
