// src/components/dashboard/PillarsGrid.tsx
import { ReactNode } from 'react';
import { Brain, Activity, Utensils, Moon } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

interface PillarCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  sub?: string;
  bg: string;
  darkBg: string;
  iconColor: string;
  delay: string;
  isLoading: boolean;
}

function PillarCard({ icon, title, value, sub, bg, darkBg, iconColor, delay, isLoading }: PillarCardProps) {
  return (
    <div className={`group p-4 rounded-[24px] ${bg} ${darkBg} flex flex-col h-32 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in fade-in slide-in-from-bottom-8 ${delay} fill-mode-both`}>
      {isLoading ? (
        <>
          <Skeleton className="w-10 h-10 rounded-[14px] mb-auto bg-white/70 dark:bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-20 bg-white/70 dark:bg-white/10" />
            <Skeleton className="h-6 w-16 bg-white/80 dark:bg-white/10" />
          </div>
        </>
      ) : (
        <>
          <div className={`w-10 h-10 rounded-[14px] bg-white dark:bg-black/20 flex items-center justify-center mb-auto ${iconColor} shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div>
            <p className="text-[#647C73] dark:text-stone-400 text-[10px] uppercase tracking-wider font-black mb-1">{title}</p>
            <p className="text-[#244135] dark:text-stone-100 text-lg font-black">
              {value} {sub && <span className="text-[10px] font-bold text-[#647C73]">{sub}</span>}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

interface PillarsGridProps {
  breakdown?: {
    moodLabel: string;
    stressLabel: string;
    nutritionKcal?: number;
    sleepHours?: number;
  };
  isSyncing: boolean;
  hasActivityHistory?: boolean;
}

export default function PillarsGrid({ breakdown, isSyncing, hasActivityHistory = true }: PillarsGridProps) {
  const moodScore = breakdown?.moodLabel ?? '--';
  const stressLevel = hasActivityHistory ? (breakdown?.stressLabel ?? 'Stabil') : 'Belum Ada Data';
  const nutritionVal = breakdown ? Math.round(breakdown?.nutritionKcal ?? 0) : '--';
  const sleepVal = breakdown ? (breakdown?.sleepHours ?? 0).toFixed(1) : '--';

  return (
    <div className="grid grid-cols-2 gap-4">
      <PillarCard
        isLoading={isSyncing}
        delay="delay-[300ms]"
        icon={<Brain size={20} />}
        title="Mood Score"
        value={moodScore}
        bg="bg-[#E6F7ED]"
        darkBg="dark:bg-[#1A2620]"
        iconColor="text-[#2B5B4D]"
      />
      <PillarCard
        isLoading={isSyncing}
        delay="delay-[400ms]"
        icon={<Activity size={20} />}
        title="Stress Rate"
        value={stressLevel}
        bg="bg-[#FFF0E6]"
        darkBg="dark:bg-[#2A1E18]"
        iconColor="text-[#FF9F66]"
      />
      <PillarCard
        isLoading={isSyncing}
        delay="delay-[500ms]"
        icon={<Utensils size={20} />}
        title="Nutrition"
        value={nutritionVal}
        sub={!isSyncing && breakdown ? 'kcal' : ''}
        bg="bg-[#FFF9E6]"
        darkBg="dark:bg-[#2A2616]"
        iconColor="text-[#B39200]"
      />
      <PillarCard
        isLoading={isSyncing}
        delay="delay-[600ms]"
        icon={<Moon size={20} />}
        title="Sleep"
        value={sleepVal}
        sub={!isSyncing && breakdown ? 'Jam' : ''}
        bg="bg-[#EEF2F5]"
        darkBg="dark:bg-[#1A1D20]"
        iconColor="text-[#647C73]"
      />
    </div>
  );
}
