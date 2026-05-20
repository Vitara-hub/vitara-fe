// src/types/api.ts

export interface ApiErrorResponse {
  detail: string;
}

export interface JournalRequest {
  text: string;
}

export interface JournalResponse {
  emotion: string;
  stress_level: number;
  topics: string[];
}

export interface FoodResponse {
  foods: string[];
  estimated_calories: number;
}

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
}

export interface TypingResponse {
  stress_score: number;
}

export interface HealthScoreRequest {
  user_id: string;
  nlp_result: Pick<JournalResponse, 'emotion' | 'stress_level'>;
  food_result: Pick<FoodResponse, 'estimated_calories'>;
  sleep_result: SleepResponse;
  typing_result: TypingResponse;
}

export interface HealthScoreResponse {
  health_score: number;
  breakdown: {
    mood: number;
    nutrition: number;
    stress: number;
    sleep: number;
  };
}

export interface ChatRequest {
  user_id: string;
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
