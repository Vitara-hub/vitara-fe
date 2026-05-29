import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  clearAuthTokens,
  getOAuthCode,
  getOAuthHashTokens,
  hasAuthTokens,
  hasOAuthCallbackParams,
  removeOAuthParamsFromUrl,
  setAuthTokens,
} from '@/services/authSession';
import { isApiConfigured, resetChatSession, vitaraApi } from '@/services/api';
import type { AuthMeResponse, AuthTokensResponse } from '@/types/api';
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

function mapProfileUser(profile: AuthMeResponse): AuthUser {
  const displayName =
    profile.fullName?.trim() ||
    profile.username?.trim() ||
    profile.email?.trim() ||
    'Vitara User';

  return {
    uid: profile.id,
    email: profile.email || '',
    displayName,
    photoURL: '',
    name: displayName,
  };
}

async function bootstrapBackendProfile() {
  try {
    await vitaraApi.bootstrapProfile();
  } catch (error) {
    console.warn('Failed to bootstrap backend profile.', error);
  }
}

async function applyAuthTokens(tokens: AuthTokensResponse): Promise<AuthUser> {
  setAuthTokens(tokens);
  const profile = await vitaraApi.getMe();
  await bootstrapBackendProfile();
  return mapProfileUser(profile);
}

function emptyCacheEntry<T>(): CacheEntry<T> {
  return { data: null, fetchedAt: null };
}

function getLoggedOutState() {
  return {
    isAuthenticated: false,
    isAuthLoading: false,
    user: null,
    activityHistory: [],
    latestMetrics: { nlp: null, food: null, sleep: null, typing: null },
    dashboardHealthScore: emptyCacheEntry<HealthScoreResponse>(),
    activityData: emptyCacheEntry<ActivityDataResponse>(),
    chatMessages: emptyCacheEntry<ChatHistoryMessage[]>(),
    veeHealth: 'fresh' as VeeHealthStatus,
    veeWeight: 1,
    isServerDown: false,
  };
}

export function getFriendlyAuthError(error: unknown) {
  const responseData =
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object'
      ? (error.response.data as Record<string, unknown>)
      : null;
  const responseMessage =
    typeof responseData?.message === 'string'
      ? responseData.message
      : typeof responseData?.detail === 'string'
        ? responseData.detail
        : '';
  const message =
    responseMessage ||
    (error instanceof Error ? error.message : typeof error === 'string' ? error : '');
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
  establishSession: (tokens: AuthTokensResponse) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setAuthUser: (user: AuthUser | null) => void;
  initAuth: () => Promise<void>;

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
      establishSession: async (tokens) => {
        const user = await applyAuthTokens(tokens);
        set({ isAuthenticated: true, isAuthLoading: false, user });
        return user;
      },
      logout: async () => {
        if (hasAuthTokens()) {
          try {
            await vitaraApi.logout();
          } catch (error) {
            console.warn('Backend logout failed; signing out locally.', error);
          }
        }
        clearAuthTokens();
        resetChatSession();
        set(getLoggedOutState());
      },
      setAuthUser: (user) => set({ isAuthenticated: Boolean(user), isAuthLoading: false, user }),
      initAuth: async () => {
        set({ isAuthLoading: true });

        if (!isApiConfigured) {
          set({ isAuthenticated: false, isAuthLoading: false, user: null });
          return;
        }

        try {
          const code = getOAuthCode();
          const hashTokens = getOAuthHashTokens();

          if (code) {
            const tokens = await vitaraApi.completeGoogleCallback({ code });
            const user = await applyAuthTokens(tokens);
            removeOAuthParamsFromUrl();
            set({ isAuthenticated: true, isAuthLoading: false, user });
            return;
          }

          if (hashTokens) {
            const tokens = await vitaraApi.completeGoogleCallback(hashTokens);
            const user = await applyAuthTokens(tokens);
            removeOAuthParamsFromUrl();
            set({ isAuthenticated: true, isAuthLoading: false, user });
            return;
          }

          if (hasAuthTokens()) {
            const profile = await vitaraApi.getMe();
            set({
              isAuthenticated: true,
              isAuthLoading: false,
              user: mapProfileUser(profile),
            });
            if (hasOAuthCallbackParams()) removeOAuthParamsFromUrl();
            return;
          }

          set({ isAuthenticated: false, isAuthLoading: false, user: null });
        } catch {
          clearAuthTokens();
          set({ isAuthenticated: false, isAuthLoading: false, user: null });
        }
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
          syncStatus: 'pending',
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
        dashboardHealthScore: emptyCacheEntry<HealthScoreResponse>(),
        activityData: emptyCacheEntry<ActivityDataResponse>(),
        chatMessages: emptyCacheEntry<ChatHistoryMessage[]>(),
      }),

      isServerDown: false,
      setServerDown: (status) => set({ isServerDown: status }),
    }),
    {
      name: 'vitara-storage',
      partialize: (state) => ({
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
