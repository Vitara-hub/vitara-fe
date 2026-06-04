// src/pages/ActivityPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CloudOff } from 'lucide-react';
import useStore, { ActivityLog } from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import ActivityChart from '@/components/activity/ActivityChart';
import RecentHistory from '@/components/activity/RecentHistory';
import Skeleton from '@/components/ui/Skeleton';
import type { ActivityChartPoint, ActivityDataResponse, ActivityHistoryItem } from '@/types/api';
import type { VeeOverrideState } from '@/utils/veeLogic';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_CACHE_TTL = 5 * 60 * 1000;

const emptyActivityData: ActivityDataResponse = {
  average_score: 0,
  weekly_change_percent: 0,
  chart: buildEmptyChart(),
  history: [],
};

function isFresh(fetchedAt: number | null, ttl = ACTIVITY_CACHE_TTL) {
  return Boolean(fetchedAt && Date.now() - fetchedAt < ttl);
}

function buildEmptyChart(): ActivityChartPoint[] {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      score: 0,
      is_today: index === 6,
    };
  });
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getLogScore(log: ActivityLog) {
  if (log.type === 'journal') {
    if (typeof log.stressLevel === 'number') {
      return clampScore(100 - (log.stressLevel <= 1 ? log.stressLevel * 100 : log.stressLevel));
    }
    return 70;
  }

  if (log.type === 'sleep') return clampScore(log.qualityScore ?? 70);

  if (log.type === 'food') {
    if (typeof log.calories !== 'number') return 70;
    return clampScore(100 - (Math.abs(log.calories - 2000) / 2000) * 100);
  }

  return 70;
}

function getHistoryTitle(log: ActivityLog) {
  if (log.type === 'journal') return 'Emotion';
  if (log.type === 'sleep') return 'Quality Score';
  if (log.type === 'food') return log.foods?.join(', ') || 'Makanan';
  return 'Percakapan Vee';
}

function getHistoryScore(log: ActivityLog) {
  if (log.type === 'journal') return log.emotion ?? 'Tercatat';
  if (log.type === 'sleep') return log.qualityScore ?? getLogScore(log);
  if (log.type === 'food') return typeof log.calories === 'number' ? `${log.calories} kcal` : 'Tercatat';
  return log.syncStatus === 'pending' ? 'Pending' : 'Tersimpan';
}

function formatHistoryTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';

  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildLocalActivityData(activityHistory: ActivityLog[]): ActivityDataResponse {
  const now = new Date();
  const currentWeekStart = new Date(now.getTime() - 6 * DAY_MS);
  const previousWeekStart = new Date(now.getTime() - 13 * DAY_MS);
  const currentWeekScores: number[] = [];
  const previousWeekScores: number[] = [];

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = toDateKey(date);

    const scores = activityHistory
      .filter((log) => toDateKey(new Date(log.timestamp)) === key)
      .map(getLogScore);

    currentWeekScores.push(...scores);

    return {
      day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      score: scores.length ? clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
      is_today: index === 6,
    };
  });

  activityHistory.forEach((log) => {
    const timestamp = new Date(log.timestamp);
    if (Number.isNaN(timestamp.getTime())) return;

    const score = getLogScore(log);
    if (timestamp >= previousWeekStart && timestamp < currentWeekStart) previousWeekScores.push(score);
  });

  const averageScore = currentWeekScores.length
    ? clampScore(currentWeekScores.reduce((sum, score) => sum + score, 0) / currentWeekScores.length)
    : 0;
  const previousAverage = previousWeekScores.length
    ? previousWeekScores.reduce((sum, score) => sum + score, 0) / previousWeekScores.length
    : averageScore;

  const history: ActivityHistoryItem[] = activityHistory.map((log) => ({
    id: log.id,
    type: log.type,
    title: getHistoryTitle(log),
    time: formatHistoryTime(log.timestamp),
    score: getHistoryScore(log),
    nutritionDetails: log.type === 'food'
      ? {
          calories: log.calories ?? null,
          protein: log.protein ?? null,
          carbs: log.carbs ?? null,
          fat: log.fat ?? null,
        }
      : undefined,
  }));

  return {
    average_score: averageScore,
    weekly_change_percent: Math.round(averageScore - previousAverage),
    chart,
    history,
  };
}

export default function ActivityPage() {
  const {
    veeHealth,
    veeWeight,
    activityHistory,
    activityData: cachedActivityData,
    setActivityData,
  } = useStore();
  const hasFreshCache = isFresh(cachedActivityData.fetchedAt);
  const activityData = cachedActivityData.data || emptyActivityData;
  const [isLoading, setIsLoading] = useState<boolean>(() => !hasFreshCache);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const observerVeeState: VeeOverrideState = { activeTraits: ['glasses'] };

  const localActivityData = useMemo(() => buildLocalActivityData(activityHistory), [activityHistory]);
  const hasActivityLogs = activityData.history.length > 0;

  useEffect(() => {
    if (hasFreshCache) {
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    let isMounted = true;

    const loadActivity = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const remoteData = await vitaraApi.getActivityFeed('7d');
        if (!isMounted) return;
        setActivityData(remoteData);
      } catch (error) {
        console.warn('Activity API Offline, showing local fallback.', error);
        if (!isMounted) return;
        setActivityData(localActivityData);
        setErrorMessage('Menampilkan riwayat lokal dari perangkat ini.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadActivity();

    return () => {
      isMounted = false;
    };
  }, [cachedActivityData.fetchedAt, hasFreshCache, localActivityData, setActivityData]);
  
  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6 bg-[#FAF9F6] dark:bg-[#121413]">
      <div className="flex justify-between items-center mb-2">
        {isLoading ? <Skeleton className="h-8 w-28" /> : <h2 className="text-2xl font-black text-[#2B4B3D] dark:text-stone-50">Aktivitas</h2>}
        <div className="p-2 bg-white dark:bg-[#1A1D1B] rounded-[14px] shadow-sm border border-[#E8F0EA] dark:border-stone-800">
          <CalendarDays size={20} className="text-[#8CAAB8] dark:text-stone-400" />
        </div>
      </div>

      {!isLoading && errorMessage && (
        <div className="bg-[#EEF2F5] dark:bg-[#1A1D20] rounded-[20px] p-4 flex gap-3 items-start border border-[#E8F0EA] dark:border-stone-800">
          <CloudOff size={18} className="text-[#4A7A8C] dark:text-[#8CAAB8] shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed text-[#647C73] dark:text-stone-400">{errorMessage}</p>
        </div>
      )}

      <ActivityChart
        veeHealth={veeHealth}
        veeWeight={veeWeight}
        averageScore={activityData.average_score}
        weeklyChangePercent={activityData.weekly_change_percent}
        chartData={activityData.chart}
        isLoading={isLoading}
        overrideState={!isLoading && hasActivityLogs ? observerVeeState : undefined}
        hasData={hasActivityLogs}
      />
      <RecentHistory items={activityData.history} isLoading={isLoading} />
      
      <div className="h-32 shrink-0 w-full"></div>
    </div>
  );
}
