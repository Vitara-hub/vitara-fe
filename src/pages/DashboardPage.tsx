// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import VeeStatusWidget from '@/components/dashboard/VeeStatusWidget';
import PillarsGrid from '@/components/dashboard/PillarsGrid';
import type { HealthScoreResponse } from '@/types/api';

interface DashboardPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function DashboardPage({ isDarkMode, toggleDarkMode }: DashboardPageProps) {
  const { veeHealth, veeWeight, user, latestMetrics, setVeeState } = useStore();
  const [healthScoreData, setHealthScoreData] = useState<HealthScoreResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealthScore = async () => {
      setIsSyncing(true);
      try {
        const payload = {
          user_id: user?.name || 'Yunggi',
          nlp_result: latestMetrics.nlp || { emotion: 'neutral', stress_level: 0.2 },
          food_result: latestMetrics.food || { estimated_calories: 2000 },
          sleep_result: latestMetrics.sleep || { quality_score: 80 },
          typing_result: latestMetrics.typing || { stress_score: 0.1 }
        };

        const response = await vitaraApi.getHealthScore(payload);
        setHealthScoreData(response);
      } catch (error) {
        console.warn("Health Score API Offline. Waiting state active.");
        
        // 🚀 STANDAR INDUSTRI: Kosongkan data, jangan tebak-tebak. 
        setHealthScoreData(null);
        // Override state lokal Vee menjadi 'waiting'
        setVeeState('waiting', veeWeight);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchHealthScore();
  }, [user, latestMetrics, veeWeight, setVeeState]); 

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      <DashboardHeader user={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      <VeeStatusWidget 
        veeHealth={veeHealth} 
        veeWeight={veeWeight} 
        realScore={healthScoreData?.health_score} 
        isSyncing={isSyncing}
      />

      <PillarsGrid breakdown={healthScoreData?.breakdown} isSyncing={isSyncing} />

      <div className="h-32 shrink-0 w-full"></div>
    </div>
  );
}