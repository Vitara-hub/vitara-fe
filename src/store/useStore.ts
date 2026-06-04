import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  clearAuthTokens,
  getOAuthCode,
  getOAuthHashTokens,
  hasAuthTokens,
  hasOAuthCallbackParams,
  markPostLoginPreparation,
  removeOAuthParamsFromUrl,
  setAuthTokens,
} from '@/services/authSession';
import { isApiConfigured, resetChatSession, vitaraApi } from '@/services/api';
import { mapActivityFeed } from '@/utils/activityMapper';
import type { AuthMeResponse, AuthTokensResponse, UserMetadata } from '@/types/api';
import type {
  ActivityDataResponse,
  ActivityHistoryItem,
  ChatHistoryMessage,
  DashboardTodayResponse,
} from '@/types/api';

export interface BaseActivityLog { 
  id: number; 
  timestamp: string; 
  summary: string; 
  syncStatus?: 'synced' | 'pending'; 
  pendingPayload?: Record<string, unknown>;
}

export interface JournalLog extends BaseActivityLog { type: 'journal'; emotion?: string; stressLevel?: number; }
export interface FoodLog extends BaseActivityLog {
  type: 'food';
  calories?: number;
  foods?: string[];
  protein?: number;
  carbs?: number;
  fat?: number;
}
export interface SleepLog extends BaseActivityLog { type: 'sleep'; qualityScore?: number; }
export interface ChatLog extends BaseActivityLog { type: 'chat'; }

export type ActivityLog = JournalLog | FoodLog | SleepLog | ChatLog;

export type NewActivityLog = 
  | Omit<JournalLog, 'id' | 'timestamp'>
  | Omit<FoodLog, 'id' | 'timestamp'>
  | Omit<SleepLog, 'id' | 'timestamp'>
  | Omit<ChatLog, 'id' | 'timestamp'>;

export interface LatestMetrics {
  nlp: { emotion: string; stressLevel: number } | null;
  food: { estimatedCalories: number } | null;
  sleep: { qualityScore: number } | null;
  typing: { stressScore: number } | null;
}

export interface CacheEntry<T> {
  data: T | null;
  fetchedAt: number | null;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  imageUrl: string | null;
  name: string;
  user_metadata?: UserMetadata | null;
}

function mapProfileUser(profile: AuthMeResponse): AuthUser {
  const displayName =
    profile.fullName?.trim() ||
    profile.email?.trim() ||
    'Vitara User';

  return {
    uid: profile.id,
    email: profile.email || '',
    displayName,
    imageUrl: profile.imageUrl,
    name: displayName,
    user_metadata: profile.user_metadata ?? null,
  };
}

async function bootstrapBackendProfile() {
  try {
    await vitaraApi.bootstrapProfile();
  } catch (error) {
    console.warn('Failed to bootstrap backend profile.', error);
  }
}

async function loadAuthenticatedProfile(): Promise<AuthUser> {
  await bootstrapBackendProfile();
  const profile = await vitaraApi.getMe();
  return mapProfileUser(profile);
}

async function applyAuthTokens(tokens: AuthTokensResponse): Promise<AuthUser> {
  setAuthTokens(tokens);
  return loadAuthenticatedProfile();
}

function emptyCacheEntry<T>(): CacheEntry<T> {
  return { data: null, fetchedAt: null };
}

function formatActivityTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';

  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActivityTitle(log: ActivityLog) {
  if (log.type === 'journal') return 'Emotion';
  if (log.type === 'sleep') return 'Quality Score';
  if (log.type === 'food') return log.foods?.join(', ') || 'Makanan';
  return 'Percakapan Vee';
}

function getActivityScore(log: ActivityLog) {
  if (log.type === 'journal') return log.emotion ?? 'Tercatat';
  if (log.type === 'sleep') return log.qualityScore ?? 'Pending';
  if (log.type === 'food') return typeof log.calories === 'number' ? `${log.calories} kcal` : 'Tercatat';
  return log.syncStatus === 'pending' ? 'Pending' : 'Tersimpan';
}

function mapLocalActivityLog(log: ActivityLog): ActivityHistoryItem {
  return {
    id: `local-${log.id}`,
    type: log.type,
    title: getActivityTitle(log),
    time: formatActivityTime(log.timestamp),
    score: getActivityScore(log),
    nutritionDetails: log.type === 'food'
      ? {
          calories: log.calories ?? null,
          protein: log.protein ?? null,
          carbs: log.carbs ?? null,
          fat: log.fat ?? null,
        }
      : undefined,
  };
}

function isSameActivityItem(left: ActivityHistoryItem, right: ActivityHistoryItem) {
  return (
    left.type === right.type &&
    left.title === right.title &&
    left.time === right.time &&
    String(left.score) === String(right.score)
  );
}

function mergeLocalActivityLogs(
  data: ActivityDataResponse | null,
  activityHistory: ActivityLog[],
): ActivityDataResponse | null {
  const localItems = activityHistory
    .filter((log) => log.type !== 'journal')
    .map(mapLocalActivityLog);
  if (!data) {
    return localItems.length
      ? { average_score: 0, weekly_change_percent: 0, chart: [], history: localItems }
      : null;
  }

  const remoteIds = new Set(data.history.map((item) => String(item.id)));
  const newLocalItems = localItems.filter(
    (item) =>
      !remoteIds.has(String(item.id)) &&
      !data.history.some((remoteItem) => isSameActivityItem(item, remoteItem)),
  );

  return {
    ...data,
    history: [...newLocalItems, ...data.history],
  };
}

function getLoggedOutState() {
  return {
    isAuthenticated: false,
    isAuthLoading: false,
    user: null,
    activityHistory: [],
    latestMetrics: { nlp: null, food: null, sleep: null, typing: null },
    dashboardHealthScore: emptyCacheEntry<DashboardTodayResponse>(),
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
  dashboardHealthScore: CacheEntry<DashboardTodayResponse>;
  activityData: CacheEntry<ActivityDataResponse>;
  chatMessages: CacheEntry<ChatHistoryMessage[]>;
  setDashboardHealthScore: (data: DashboardTodayResponse | null) => void;
  setActivityData: (data: ActivityDataResponse | null) => void;
  setChatMessages: (data: ChatHistoryMessage[] | null) => void;
  refreshDashboardAndActivity: () => Promise<void>;
  clearCachedPageData: () => void;

  isServerDown: boolean;
  setServerDown: (status: boolean) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isAuthLoading: true,
      user: null,
      login: (user) => set({ isAuthenticated: true, isAuthLoading: false, user }),
      establishSession: async (tokens) => {
        set({ isAuthenticated: false, isAuthLoading: true, user: null });
        try {
          const user = await applyAuthTokens(tokens);
          set({ isAuthenticated: true, isAuthLoading: false, user });
          return user;
        } catch (error) {
          clearAuthTokens();
          set({ isAuthenticated: false, isAuthLoading: false, user: null });
          throw error;
        }
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
            markPostLoginPreparation();
            set({ isAuthenticated: true, isAuthLoading: false, user });
            return;
          }

          if (hashTokens) {
            const tokens = await vitaraApi.completeGoogleCallback(hashTokens);
            const user = await applyAuthTokens(tokens);
            removeOAuthParamsFromUrl();
            markPostLoginPreparation();
            set({ isAuthenticated: true, isAuthLoading: false, user });
            return;
          }

          if (hasAuthTokens()) {
            const user = await loadAuthenticatedProfile();
            set({
              isAuthenticated: true,
              isAuthLoading: false,
              user,
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
        if (log.type === 'journal' && log.syncStatus === 'synced') {
          return state;
        }

        if (log.type === 'food' && typeof log.calories === 'number' && log.calories <= 0) {
          return state;
        }

        const newLog = { 
          id: Date.now(), 
          timestamp: new Date().toISOString(), 
          syncStatus: 'pending',
          ...log 
        } as ActivityLog;
        const nextActivityHistory = [newLog, ...state.activityHistory];

        return {
          activityHistory: nextActivityHistory,
          activityData: {
            data: mergeLocalActivityLogs(state.activityData.data, nextActivityHistory),
            fetchedAt: Date.now(),
          },
        };
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
      setActivityData: (data) => set((state) => ({
        activityData: {
          data: mergeLocalActivityLogs(data, state.activityHistory),
          fetchedAt: data ? Date.now() : null,
        },
      })),
      setChatMessages: (data) => set({
        chatMessages: { data, fetchedAt: data ? Date.now() : null },
      }),
      refreshDashboardAndActivity: async () => {
        const [dashboardResult, dailyResult, recentResult, summaryResult] = await Promise.allSettled([
          vitaraApi.getDashboardToday(),
          vitaraApi.getHealthDaily(),
          vitaraApi.getActivityRecent({ limit: 20 }),
          vitaraApi.getActivitySummary('7d'),
        ]);

        if (dashboardResult.status === 'fulfilled') {
          set({
            dashboardHealthScore: {
              data: dashboardResult.value,
              fetchedAt: Date.now(),
            },
          });
        } else {
          console.warn('Failed to refresh dashboard after log update.', dashboardResult.reason);
        }

        if (
          dailyResult.status === 'fulfilled' &&
          recentResult.status === 'fulfilled' &&
          summaryResult.status === 'fulfilled'
        ) {
          const remoteActivityData = mapActivityFeed(dailyResult.value, recentResult.value, summaryResult.value);

          set({
            activityData: {
              data: mergeLocalActivityLogs(remoteActivityData, get().activityHistory),
              fetchedAt: Date.now(),
            },
          });
        } else {
          console.warn('Failed to refresh activity after log update.', {
            daily: dailyResult.status === 'rejected' ? dailyResult.reason as unknown : null,
            recent: recentResult.status === 'rejected' ? recentResult.reason as unknown : null,
            summary: summaryResult.status === 'rejected' ? summaryResult.reason as unknown : null,
          });
        }
      },
      clearCachedPageData: () => set({
        dashboardHealthScore: emptyCacheEntry<DashboardTodayResponse>(),
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
        activityHistory: state.activityHistory.filter(
          (log) => log.type !== 'journal' || log.syncStatus === 'pending',
        ),
        latestMetrics: state.latestMetrics,
        dashboardHealthScore: state.dashboardHealthScore,
        activityData: state.activityData,
        chatMessages: state.chatMessages,
        isServerDown: state.isServerDown,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<StoreState>;
        const activityHistory = persisted.activityHistory?.filter(
          (log) => log.type !== 'journal' || log.syncStatus === 'pending',
        ) ?? currentState.activityHistory;
        const activityData = persisted.activityData?.data
          ? {
              ...persisted.activityData,
              data: {
                ...persisted.activityData.data,
                history: persisted.activityData.data.history.filter(
                  (item) => !(item.type === 'journal' && String(item.id).startsWith('local-')),
                ),
              },
            }
          : persisted.activityData ?? currentState.activityData;

        return {
          ...currentState,
          ...persisted,
          activityHistory,
          activityData,
        };
      },
    }
  )
);

export default useStore;
