import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import type { ActivityDataResponse, ChatHistoryMessage, HealthScoreResponse } from '@/types/api';

export interface BaseActivityLog { 
  id: number; 
  timestamp: string; 
  summary: string; 
  syncStatus?: 'synced' | 'pending'; 
}

export interface JournalLog extends BaseActivityLog { type: 'journal'; emotion?: string; stressLevel?: number; }
export interface FoodLog extends BaseActivityLog { type: 'food'; calories?: number; foods?: string[]; }
export interface SleepLog extends BaseActivityLog { type: 'sleep'; qualityScore?: number; }
export interface ChatLog extends BaseActivityLog { type: 'chat'; }

export type ActivityLog = JournalLog | FoodLog | SleepLog | ChatLog;

export type NewActivityLog = 
  | Omit<JournalLog, 'id' | 'timestamp'>
  | Omit<FoodLog, 'id' | 'timestamp'>
  | Omit<SleepLog, 'id' | 'timestamp'>
  | Omit<ChatLog, 'id' | 'timestamp'>;

export interface LatestMetrics {
  nlp: { emotion: string; stress_level: number } | null;
  food: { estimated_calories: number } | null;
  sleep: { quality_score: number } | null;
  typing: { stress_score: number } | null;
}

export interface CacheEntry<T> {
  data: T | null;
  fetchedAt: number | null;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  name: string;
}

function mapSupabaseUser(user: User): AuthUser {
  const metadata = user.user_metadata ?? {};
  const displayName = metadata.full_name || metadata.name || user.email || 'Vitara User';
  const photoURL = metadata.avatar_url || metadata.picture || '';

  return {
    uid: user.id,
    email: user.email || '',
    displayName,
    photoURL,
    name: displayName,
  };
}

function hasSupabaseAuthCallback() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return (
    searchParams.has('code') ||
    searchParams.has('error') ||
    hashParams.has('access_token') ||
    hashParams.has('refresh_token') ||
    hashParams.has('error')
  );
}

function getSupabaseHashSession() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

function removeSupabaseAuthParamsFromUrl() {
  if (!hasSupabaseAuthCallback()) return;

  window.history.replaceState({}, document.title, window.location.pathname);
}

export function getFriendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid credentials') ||
    lowerMessage.includes('invalid_grant')
  ) {
    return 'Email atau password salah. Silakan coba lagi.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox kamu untuk menyelesaikan verifikasi.';
  }

  if (lowerMessage.includes('user already registered') || lowerMessage.includes('already registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk dengan password akun tersebut.';
  }

  if (lowerMessage.includes('password')) {
    return 'Kata sandi belum memenuhi syarat. Gunakan minimal 6 karakter.';
  }

  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Koneksi bermasalah. Periksa internet kamu lalu coba lagi.';
  }

  if (lowerMessage.includes('provider') || lowerMessage.includes('oauth')) {
    return 'Login Google belum bisa dimulai. Silakan coba lagi.';
  }

  return 'Proses autentikasi gagal. Silakan coba lagi.';
}

export type VeeHealthStatus = 'fresh' | 'tired' | 'sick' | 'stressed' | 'waiting';

interface StoreState {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  setAuthUser: (user: AuthUser | null) => void;
  initAuth: () => Promise<() => void>;

  isDarkMode: boolean;
  toggleDarkMode: () => void;

  veeHealth: VeeHealthStatus;
  veeWeight: number;
  setVeeState: (health?: VeeHealthStatus, weight?: number) => void;

  activityHistory: ActivityLog[];
  addLog: (log: NewActivityLog) => void;
  clearHistory: () => void;

  latestMetrics: LatestMetrics;
  updateMetric: <K extends keyof LatestMetrics>(key: K, data: LatestMetrics[K]) => void;
  dashboardHealthScore: CacheEntry<HealthScoreResponse>;
  activityData: CacheEntry<ActivityDataResponse>;
  chatMessages: CacheEntry<ChatHistoryMessage[]>;
  setDashboardHealthScore: (data: HealthScoreResponse | null) => void;
  setActivityData: (data: ActivityDataResponse | null) => void;
  setChatMessages: (data: ChatHistoryMessage[] | null) => void;
  clearCachedPageData: () => void;

  // 🚀 STATE BARU BUAT SERVER DOWN
  isServerDown: boolean;
  setServerDown: (status: boolean) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isAuthLoading: true,
      user: null,
      login: (user) => set({ isAuthenticated: true, isAuthLoading: false, user }),
      logout: async () => {
        if (isSupabaseConfigured) await supabase.auth.signOut();
        set({ isAuthenticated: false, isAuthLoading: false, user: null });
      },
      setAuthUser: (user) => set({ isAuthenticated: Boolean(user), isAuthLoading: false, user }),
      initAuth: async () => {
        set({ isAuthLoading: true });

        if (!isSupabaseConfigured) {
          set({ isAuthenticated: false, isAuthLoading: false, user: null });
          return () => {};
        }

        const isOAuthCallback = hasSupabaseAuthCallback();

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            set({
              isAuthenticated: true,
              isAuthLoading: false,
              user: mapSupabaseUser(session.user),
            });
            removeSupabaseAuthParamsFromUrl();
            return;
          }

          if (!isOAuthCallback || event === 'SIGNED_OUT') {
            set({
              isAuthenticated: false,
              isAuthLoading: false,
              user: null,
            });
          }
        });

        try {
          const code = new URLSearchParams(window.location.search).get('code');
          const hashSession = getSupabaseHashSession();

          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;

            set({
              isAuthenticated: Boolean(data.session?.user),
              isAuthLoading: false,
              user: data.session?.user ? mapSupabaseUser(data.session.user) : null,
            });
            removeSupabaseAuthParamsFromUrl();
            return () => listener.subscription.unsubscribe();
          }

          if (hashSession) {
            const { data, error } = await supabase.auth.setSession(hashSession);
            if (error) throw error;

            set({
              isAuthenticated: Boolean(data.session?.user),
              isAuthLoading: false,
              user: data.session?.user ? mapSupabaseUser(data.session.user) : null,
            });
            removeSupabaseAuthParamsFromUrl();
            return () => listener.subscription.unsubscribe();
          }

          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (data.session?.user) {
            set({
              isAuthenticated: true,
              isAuthLoading: false,
              user: mapSupabaseUser(data.session.user),
            });
            removeSupabaseAuthParamsFromUrl();
          } else if (!isOAuthCallback) {
            set({
              isAuthenticated: false,
              isAuthLoading: false,
              user: null,
            });
          } else {
            window.setTimeout(async () => {
              const { data: retryData } = await supabase.auth.getSession();
              set({
                isAuthenticated: Boolean(retryData.session?.user),
                isAuthLoading: false,
                user: retryData.session?.user ? mapSupabaseUser(retryData.session.user) : null,
              });
              if (retryData.session?.user) removeSupabaseAuthParamsFromUrl();
            }, 1200);
          }
        } catch {
          set({ isAuthenticated: false, isAuthLoading: false, user: null });
        }

        return () => listener.subscription.unsubscribe();
      },
      
      isDarkMode: false, 
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      veeHealth: 'fresh',
      veeWeight: 1,
      setVeeState: (health, weight) => set((state) => ({ 
        veeHealth: health || state.veeHealth, 
        veeWeight: weight || state.veeWeight 
      })),
      
      activityHistory: [],
      addLog: (log) => set((state) => {
        const newLog = { 
          id: Date.now(), 
          timestamp: new Date().toISOString(), 
          syncStatus: 'pending', // Default pending saat offline
          ...log 
        } as ActivityLog;
        return { activityHistory: [newLog, ...state.activityHistory] };
      }),
      clearHistory: () => set({ activityHistory: [] }),

      latestMetrics: { nlp: null, food: null, sleep: null, typing: null },
      updateMetric: (key, data) => set((state) => ({
        latestMetrics: { ...state.latestMetrics, [key]: data }
      })),
      dashboardHealthScore: { data: null, fetchedAt: null },
      activityData: { data: null, fetchedAt: null },
      chatMessages: { data: null, fetchedAt: null },
      setDashboardHealthScore: (data) => set({
        dashboardHealthScore: { data, fetchedAt: data ? Date.now() : null },
      }),
      setActivityData: (data) => set({
        activityData: { data, fetchedAt: data ? Date.now() : null },
      }),
      setChatMessages: (data) => set({
        chatMessages: { data, fetchedAt: data ? Date.now() : null },
      }),
      clearCachedPageData: () => set({
        dashboardHealthScore: { data: null, fetchedAt: null },
        activityData: { data: null, fetchedAt: null },
        chatMessages: { data: null, fetchedAt: null },
      }),

      // 🚀 INISIALISASI STATE
      isServerDown: false,
      setServerDown: (status) => set({ isServerDown: status }),
    }),
    {
      name: 'vitara-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isDarkMode: state.isDarkMode,
        veeHealth: state.veeHealth,
        veeWeight: state.veeWeight,
        activityHistory: state.activityHistory,
        latestMetrics: state.latestMetrics,
        dashboardHealthScore: state.dashboardHealthScore,
        activityData: state.activityData,
        chatMessages: state.chatMessages,
        isServerDown: state.isServerDown,
      }),
    }
  )
);

export default useStore;
