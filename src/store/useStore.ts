import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

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

function removeSupabaseAuthParamsFromUrl() {
  if (!hasSupabaseAuthCallback()) return;

  window.history.replaceState({}, document.title, window.location.pathname);
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
          console.log('Auth State:', event, session);

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
        } catch (error) {
          console.error('Supabase auth session check failed:', error);
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
        isServerDown: state.isServerDown,
      }),
    }
  )
);

export default useStore;
