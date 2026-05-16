// src/components/dashboard/PillarsGrid.tsx
import { ReactNode } from 'react';
import { Brain, Activity, Utensils, Moon } from 'lucide-react';

interface PillarCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  sub?: string;
  bg: string;
  darkBg: string;
  iconColor: string;
  delay: string;
  isLoading: boolean; // 👈 Menambahkan prop isLoading untuk skeleton
}

function PillarCard({ icon, title, value, sub, bg, darkBg, iconColor, delay, isLoading }: PillarCardProps) {
  return (
    <div className={`group p-4 rounded-[24px] ${bg} ${darkBg} flex flex-col h-32 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in fade-in slide-in-from-bottom-8 ${delay} fill-mode-both`}>
      <div className={`w-10 h-10 rounded-[14px] bg-white dark:bg-black/20 flex items-center justify-center mb-auto ${iconColor} shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-[#647C73] dark:text-stone-400 text-[10px] uppercase tracking-wider font-black mb-1">{title}</p>
        
        {/* Render Skeleton jika sedang sync, jika tidak render nilainya */}
        {isLoading ? (
          <div className="h-6 w-16 bg-black/10 dark:bg-white/10 rounded-md animate-pulse mt-1"></div>
        ) : (
          <p className="text-[#244135] dark:text-stone-100 text-lg font-black">
            {value} {sub && <span className="text-[10px] font-bold text-[#647C73]">{sub}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

interface PillarsGridProps {
  breakdown?: { 
    mood: number; 
    nutrition: number; 
    stress: number; 
    sleep: number; 
  };
  isSyncing: boolean; // 👈 Menambahkan prop isSyncing di interface
}

export default function PillarsGrid({ breakdown, isSyncing }: PillarsGridProps) {
  // Jika sedang offline (breakdown null), kita tampilkan strip "--"
  const moodScore = breakdown ? `${Math.round(breakdown.mood)}%` : '--';
  const stressLevel = breakdown ? `${Math.round(breakdown.stress)}%` : '--';
  const nutritionVal = breakdown ? Math.round(breakdown.nutrition * 2500) : '--'; 
  const sleepVal = breakdown ? (breakdown.sleep * 8 / 100).toFixed(1) : '--';

  return (
    <div className="grid grid-cols-2 gap-4">
      <PillarCard 
        isLoading={isSyncing} 
        delay="delay-[300ms]" 
        icon={<Brain size={20}/>} 
        title="Mood Score" 
        value={moodScore} 
        bg="bg-[#E6F7ED]" 
        darkBg="dark:bg-[#1A2620]" 
        iconColor="text-[#2B5B4D]" 
      />
      <PillarCard 
        isLoading={isSyncing} 
        delay="delay-[400ms]" 
        icon={<Activity size={20}/>} 
        title="Stress Rate" 
        value={stressLevel} 
        bg="bg-[#FFF0E6]" 
        darkBg="dark:bg-[#2A1E18]" 
        iconColor="text-[#FF9F66]" 
      />
      <PillarCard 
        isLoading={isSyncing} 
        delay="delay-[500ms]" 
        icon={<Utensils size={20}/>} 
        title="Nutrition" 
        value={nutritionVal} 
        sub={(!isSyncing && breakdown) ? "kcal" : ""} 
        bg="bg-[#FFF9E6]" 
        darkBg="dark:bg-[#2A2616]" 
        iconColor="text-[#FFD966]" 
      />
      <PillarCard 
        isLoading={isSyncing} 
        delay="delay-[600ms]" 
        icon={<Moon size={20}/>} 
        title="Sleep" 
        value={sleepVal} 
        sub={(!isSyncing && breakdown) ? "Jam" : ""} 
        bg="bg-[#EEF2F5]" 
        darkBg="dark:bg-[#1A1D20]" 
        iconColor="text-[#647C73]" 
      />
    </div>
  );
}