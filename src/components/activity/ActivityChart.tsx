// src/components/activity/ActivityChart.tsx
import VeeMascot from '@/components/mascot/VeeMascot';
import { VeeHealthStatus } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';

interface ActivityChartProps {
  veeHealth: VeeHealthStatus;
  veeWeight: number;
  isLoading?: boolean;
}

export default function ActivityChart({ veeHealth, veeWeight, isLoading = false }: ActivityChartProps) {
  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-6 rounded-[28px] shadow-sm border border-[#E8F0EA] dark:border-stone-800 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#E8F0EA] dark:bg-[#1A2620] rounded-full opacity-50 blur-xl"></div>

      <div className="flex justify-between items-end mb-8 relative z-10">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold text-[#8CAAB8] uppercase tracking-widest mb-1">Rata-rata Skor</p>
            <p className="text-4xl font-black text-[#2B4B3D] dark:text-stone-50">82<span className="text-base text-[#A0B0A8] font-bold">/100</span></p>
          </div>
        )}
        
        <div className="flex flex-col items-end gap-2">
          <div className="w-12 h-10 flex items-end justify-center mr-2">
             {isLoading ? <Skeleton className="w-10 h-10 rounded-full" /> : <VeeMascot veeHealth={veeHealth} weight={veeWeight} scale={0.45} />}
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-28 rounded-lg" />
          ) : (
            <div className="px-3 py-1.5 bg-[#E8F0EA] dark:bg-[#1A2620] text-[#1DB38A] dark:text-[#8CE0A7] rounded-lg text-[10px] font-bold shadow-sm">
              +5% dr minggu lalu
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end h-32 gap-2 mt-4 relative z-10">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => {
          const heights = ['h-16', 'h-20', 'h-12', 'h-24', 'h-14', 'h-28', 'h-20']; 
          const isToday = i === 5; 
          return (
            <div key={day} className="flex flex-col items-center gap-3 flex-1 group cursor-pointer">
              {isLoading ? (
                <Skeleton className={`w-full ${heights[i]} rounded-[8px]`} />
              ) : (
                <div className={`w-full ${heights[i]} ${isToday ? 'bg-[#8CE0A7]' : 'bg-[#F4F6F5] dark:bg-stone-800 group-hover:bg-[#D5E5DB] dark:group-hover:bg-stone-700'} rounded-[8px] transition-colors duration-300 relative`}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2B4B3D] text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">8{i}</div>
                </div>
              )}
              {isLoading ? (
                <Skeleton className="h-2.5 w-6" />
              ) : (
                <span className={`text-[10px] font-bold ${isToday ? 'text-[#2B4B3D] dark:text-[#8CE0A7]' : 'text-[#8CAAB8]'}`}>{day}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
