// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import VeeStatusWidget from '@/components/dashboard/VeeStatusWidget';
import PillarsGrid from '@/components/dashboard/PillarsGrid';

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
    veeHealth,
    veeWeight,
    user,
    latestMetrics,
    setVeeState,
    dashboardHealthScore,
    setDashboardHealthScore,
  } = useStore();

  const healthScoreData = dashboardHealthScore.data;
  const hasFreshCache = isFresh(dashboardHealthScore.fetchedAt);
  const [isSyncing, setIsSyncing] = useState<boolean>(() => !hasFreshCache);

  useEffect(() => {
    if (hasFreshCache) {
      setIsSyncing(false);
      return;
    }

    let isMounted = true;

    const fetchHealthScore = async () => {
      setIsSyncing(true);

      try {
        const payload = {
          user_id: user?.name || 'Yunggi',
          nlp_result: latestMetrics.nlp || { emotion: 'neutral', stress_level: 0.2 },
          food_result: latestMetrics.food || { estimated_calories: 2000 },
          sleep_result: latestMetrics.sleep || { quality_score: 80 },
          typing_result: latestMetrics.typing || { stress_score: 0.1 },
        };

        const response = await vitaraApi.getHealthScore(payload);
        if (!isMounted) return;

        setDashboardHealthScore(response);
      } catch (error) {
        console.warn('Health Score API Offline. Waiting state active.', error);
        if (!isMounted) return;

        if (!healthScoreData) setDashboardHealthScore(null);
        setVeeState('waiting', veeWeight);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    fetchHealthScore();

    return () => {
      isMounted = false;
    };
  }, [
    dashboardHealthScore.fetchedAt,
    hasFreshCache,
    healthScoreData,
    latestMetrics,
    setDashboardHealthScore,
    setVeeState,
    user,
    veeWeight,
  ]);

  const isLoading = isSyncing && !healthScoreData;

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      <DashboardHeader user={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isLoading={isLoading} />
      
      <VeeStatusWidget 
        veeHealth={veeHealth} 
        veeWeight={veeWeight} 
        realScore={healthScoreData?.health_score} 
        isSyncing={isLoading}
      />

      <PillarsGrid breakdown={healthScoreData?.breakdown} isSyncing={isLoading} />

      <div className="h-32 shrink-0 w-full"></div>
    </div>
  );
}
