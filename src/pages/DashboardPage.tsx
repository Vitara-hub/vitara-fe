// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import VeeStatusWidget from '@/components/dashboard/VeeStatusWidget';
import PillarsGrid from '@/components/dashboard/PillarsGrid';
import { deriveVeeHealthFromDashboard } from '@/utils/veeLogic';

interface DashboardPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DASHBOARD_CACHE_TTL = 5 * 60 * 1000;

function isFresh(fetchedAt: number | null, ttl = DASHBOARD_CACHE_TTL) {
  return Boolean(fetchedAt && Date.now() - fetchedAt < ttl);
}

export default function DashboardPage({ isDarkMode, toggleDarkMode }: DashboardPageProps) {
  const {
    user,
    veeWeight,
    activityHistory,
    dashboardHealthScore,
    activityData,
    setDashboardHealthScore,
  } = useStore();

  const dashboardData = dashboardHealthScore.data;
  const hasFreshCache = isFresh(dashboardHealthScore.fetchedAt);
  const [isSyncing, setIsSyncing] = useState<boolean>(() => !hasFreshCache);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hasFreshCache) {
      queueMicrotask(() => {
        setIsSyncing(false);
        setErrorMessage(null);
      });
      return;
    }

    let isMounted = true;

    const fetchDashboardToday = async () => {
      setIsSyncing(true);
      setErrorMessage(null);

      try {
        const response = await vitaraApi.getDashboardToday();
        if (!isMounted) return;

        setDashboardHealthScore(response);
      } catch (error) {
        console.warn('Dashboard API unavailable. Waiting state active.', error);
        if (!isMounted) return;

        if (!dashboardData) setDashboardHealthScore(null);
        setErrorMessage('Dashboard hari ini belum bisa dimuat. Data terakhir tetap ditampilkan bila tersedia.');
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    void fetchDashboardToday();

    return () => {
      isMounted = false;
    };
  }, [
    dashboardHealthScore.fetchedAt,
    hasFreshCache,
    dashboardData,
    setDashboardHealthScore,
  ]);

  const isLoading = isSyncing && !dashboardData;
  const hasActivityHistory =
    activityHistory.length > 0 || (activityData.data?.history.length ?? 0) > 0;
  const hasDashboardData = hasActivityHistory && Boolean(dashboardData);
  const dashboardVeeHealth = errorMessage
    ? 'waiting'
    : hasDashboardData
      ? deriveVeeHealthFromDashboard(dashboardData)
      : 'waiting';

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      <DashboardHeader
        user={user}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLoading={isLoading}
        dateLabel={dashboardData?.dateLabel}
      />

      {!isLoading && errorMessage && (
        <div className="bg-[#EEF2F5] dark:bg-[#1A1D20] rounded-[20px] p-4 text-xs font-semibold leading-relaxed text-[#647C73] dark:text-stone-400 border border-[#E8F0EA] dark:border-stone-800">
          {errorMessage}
        </div>
      )}
      
      <VeeStatusWidget 
        veeHealth={dashboardVeeHealth} 
        veeWeight={veeWeight} 
        realScore={dashboardData?.healthScore}
        isSyncing={isLoading}
        statusLabel={dashboardData?.statusLabel}
        suggestion={dashboardData?.suggestion}
        hasData={hasDashboardData}
      />

      <PillarsGrid
        breakdown={hasDashboardData ? dashboardData?.breakdown : undefined}
        isSyncing={isLoading}
        hasActivityHistory={hasActivityHistory}
      />

      <div className="h-32 shrink-0 w-full"></div>
    </div>
  );
}
