// src/services/api.ts
import axios from 'axios';
import { 
  JournalRequest, 
  JournalResponse, 
  SleepRequest, 
  SleepResponse, 
  ChatRequest, 
  ChatResponse, 
  HealthScoreRequest, 
  HealthScoreResponse, 
  TypingRequest, 
  TypingResponse 
} from '@/types/api';

// Terapkan Fallback: Jika di .env tidak ada, gunakan localhost sebagai cadangan aman
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validasi Keamanan: Beri peringatan keras jika lupa set URL saat di-build untuk Production
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error("🚨 FATAL ERROR: VITE_API_URL belum dikonfigurasi di Environment Variables Production!");
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, 
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('🚨 Network/CORS Error: Tidak dapat terhubung ke server Vitara.');
    } else if (error.response.status >= 500) {
      console.error('🚨 Server Error: Backend Python sedang bermasalah.');
    }
    return Promise.reject(error);
  }
);

export const vitaraApi = {
  predictJournal: async (data: JournalRequest): Promise<JournalResponse> => {
    const response = await apiClient.post('/predict/journal', data);
    return response.data;
  },
  predictFood: async (formData: FormData): Promise<any> => {
    const response = await apiClient.post('/predict/food', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  predictSleep: async (data: SleepRequest): Promise<SleepResponse> => {
    const response = await apiClient.post('/predict/sleep', data);
    return response.data;
  },
  predictTyping: async (data: TypingRequest): Promise<TypingResponse> => {
    const response = await apiClient.post('/predict/typing', data);
    return response.data;
  },
  sendChatMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post('/chat', data);
    return response.data;
  },
  getHealthScore: async (data: HealthScoreRequest): Promise<HealthScoreResponse> => {
    const response = await apiClient.post('/health/score', data);
    return response.data;
  }
};