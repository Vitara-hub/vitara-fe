import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export type VeeHealthStatus = 'fresh' | 'tired' | 'sick' | 'stressed' | 'waiting';

interface StoreState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;

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
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
      
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
    { name: 'vitara-storage' }
  )
);

export default useStore;
