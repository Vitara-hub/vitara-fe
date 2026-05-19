// src/types/api.ts

// 1. Journal Endpoint
export interface JournalRequest {
  text: string;
}
export interface JournalResponse {
  emotion: string;
  stress_level: number;
  topics: string[];
}

// 2. Food Endpoint (Request menggunakan FormData)
export interface FoodResponse {
  foods: string[];
  estimated_calories: number;
}

// 3. Sleep Endpoint
export interface SleepRequest {
  duration_hours: number;
  bedtime: string;
  wake_time: string;
  interruptions: number;
  sleep_debt_hours?: number; // Optional
}
export interface SleepResponse {
  quality_score: number;
}

// 4. Typing Endpoint
export interface TypingRequest {
  wpm: number;
  backspace_rate: number;
  inter_key_timings: number[];
}
export interface TypingResponse {
  stress_score: number;
}

// 5. Health Score Endpoint
export interface HealthScoreRequest {
  user_id: string;
  nlp_result: {
    emotion: string;
    stress_level: number;
  };
  food_result: {
    estimated_calories: number;
  };
  sleep_result: {
    quality_score: number;
  };
  typing_result: {
    stress_score: number;
  };
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

// 6. Activity Summary Endpoint
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

// 7. Companion Chat Endpoint
export interface ChatRequest {
  user_id: string;
  message: string;
}
export interface ChatResponse {
  response: string;
  recommendations: string[];
}
