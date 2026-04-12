import axios from 'axios';
import { supabase } from '@/lib/supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_EXPRESS_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const vitaraService = {
  analyzeJournal: async (text) => Promise.resolve({
    status: "success",
    data: { sentiment: "neutral", stress_level: "moderate", confidence_score: 0.88 }
  }),
  analyzeFood: async (imageFile) => Promise.resolve({
    status: "success",
    data: { meal_name: "Mock Nasi Goreng", calories_estimated: 450 }
  })
};