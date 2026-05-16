// src/pages/ActivityPage.tsx
import { CalendarDays } from 'lucide-react';
import useStore from '@/store/useStore';
import ActivityChart from '@/components/activity/ActivityChart'; 
import RecentHistory from '@/components/activity/RecentHistory';

export default function ActivityPage() {
  // Destructuring dengan TS yang sudah ketat dari Langkah 4 sebelumnya
  const { veeHealth, veeWeight } = useStore();
  
  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6 bg-[#FAF9F6] dark:bg-[#121413]">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-black text-[#2B4B3D] dark:text-stone-50">Aktivitas</h2>
        <div className="p-2 bg-white dark:bg-[#1A1D1B] rounded-[14px] shadow-sm border border-[#E8F0EA] dark:border-stone-800">
          <CalendarDays size={20} className="text-[#8CAAB8] dark:text-stone-400" />
        </div>
      </div>

      <ActivityChart veeHealth={veeHealth} veeWeight={veeWeight} />
      <RecentHistory />
      
      <div className="h-32 shrink-0 w-full"></div>
    </div>
  );
}