// src/services/api.ts
import axios, { AxiosError } from 'axios';
import type {
  ApiErrorResponse,
  ChatRequest,
  ChatResponse,
  FoodResponse,
  HealthScoreRequest,
  HealthScoreResponse,
  JournalRequest,
  JournalResponse,
  SleepRequest,
  SleepResponse,
  TypingRequest,
  TypingResponse,
} from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error('FATAL ERROR: VITE_API_URL is not configured for production builds.');
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      console.error('Network/CORS Error: Unable to reach the Vitara API.');
    } else if (error.response.status >= 500) {
      console.error('Server Error: Vitara API returned a server-side failure.');
    }

    return Promise.reject(error);
  }
);

function toFoodFormData(imageOrFormData: File | FormData): FormData {
  if (imageOrFormData instanceof FormData) return imageOrFormData;

  const formData = new FormData();
  formData.append('image', imageOrFormData);
  return formData;
}

export const vitaraApi = {
  predictJournal: async (data: JournalRequest): Promise<JournalResponse> => {
    const response = await apiClient.post<JournalResponse>('/predict/journal', data);
    return response.data;
  },

  predictFood: async (imageOrFormData: File | FormData): Promise<FoodResponse> => {
    const response = await apiClient.post<FoodResponse>('/predict/food', toFoodFormData(imageOrFormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  predictSleep: async (data: SleepRequest): Promise<SleepResponse> => {
    const response = await apiClient.post<SleepResponse>('/predict/sleep', data);
    return response.data;
  },

  predictTyping: async (data: TypingRequest): Promise<TypingResponse> => {
    const response = await apiClient.post<TypingResponse>('/predict/typing', data);
    return response.data;
  },

  calculateHealthScore: async (data: HealthScoreRequest): Promise<HealthScoreResponse> => {
    const response = await apiClient.post<HealthScoreResponse>('/health/score', data);
    return response.data;
  },

  getHealthScore: async (data: HealthScoreRequest): Promise<HealthScoreResponse> => {
    return vitaraApi.calculateHealthScore(data);
  },

  sendChatMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/companion/chat', data);
    return response.data;
  },
};
