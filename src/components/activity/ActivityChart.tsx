// src/components/activity/ActivityChart.tsx
import { useState } from 'react';
import VeeMascot from '@/components/mascot/VeeMascot';
import type { VeeHealthStatus } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';
import type { ActivityChartPoint } from '@/types/api';
import type { VeeOverrideState } from '@/utils/veeLogic';

interface ActivityChartProps {
  veeHealth: VeeHealthStatus;
  veeWeight: number;
  averageScore: number;
  weeklyChangePercent: number;
  chartData: ActivityChartPoint[];
  isLoading?: boolean;
  overrideState?: VeeOverrideState;
  hasData?: boolean;
}

export default function ActivityChart({
  veeHealth,
  veeWeight,
  averageScore,
  weeklyChangePercent,
  chartData,
  isLoading = false,
  overrideState,
  hasData = true,
}: ActivityChartProps) {
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const weeklyChangeLabel = `${weeklyChangePercent >= 0 ? '+' : ''}${weeklyChangePercent}% dr minggu lalu`;

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
            <p className="text-4xl font-black text-[#2B4B3D] dark:text-stone-50">
              {hasData ? (
                <>
                  {averageScore}<span className="text-base text-[#A0B0A8] font-bold">/100</span>
                </>
              ) : (
                <span className="text-2xl">Belum ada data</span>
              )}
            </p>
          </div>
        )}
        
        <div className="flex flex-col items-end gap-2">
          <div className="w-12 h-10 flex items-end justify-center mr-2">
             {isLoading ? <Skeleton className="w-10 h-10 rounded-full" /> : <VeeMascot veeHealth={veeHealth} overrideState={overrideState} weight={veeWeight} scale={0.45} />}
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-28 rounded-lg" />
          ) : (
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm ${
              !hasData
                ? 'bg-[#F4F6F5] dark:bg-stone-800 text-[#8CAAB8] dark:text-stone-400'
                : weeklyChangePercent >= 0
                ? 'bg-[#E8F0EA] dark:bg-[#1A2620] text-[#1DB38A] dark:text-[#8CE0A7]'
                : 'bg-[#FFF0E6] dark:bg-[#2A1E18] text-[#D96B2B] dark:text-[#FF9F66]'
            }`}>
              {hasData ? weeklyChangeLabel : '-'}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end h-32 gap-2 mt-4 relative z-10 touch-pan-y">
        {chartData.map((item, index) => {
          const barHeight = isLoading || !hasData ? 16 : Math.max(16, Math.min(128, Math.round((item.score / 100) * 128)));
          const isActive = activeBarIndex === index;

          return (
            <button
              key={item.day}
              type="button"
              onClick={() => setActiveBarIndex(isActive ? null : index)}
              onFocus={() => setActiveBarIndex(index)}
              onMouseLeave={() => setActiveBarIndex((current) => (current === index ? null : current))}
              aria-label={`${item.day}: skor ${item.score}`}
              className="flex flex-col items-center gap-3 flex-1 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7] rounded-[10px] touch-manipulation"
            >
              {isLoading ? (
                <Skeleton className="w-full rounded-[8px]" style={{ height: barHeight }} />
              ) : (
                <div
                  className={`w-full ${item.is_today || isActive ? 'bg-[#8CE0A7]' : 'bg-[#F4F6F5] dark:bg-stone-800 group-hover:bg-[#D5E5DB] dark:group-hover:bg-stone-700'} rounded-[8px] transition-colors duration-300 relative`}
                  style={{ height: barHeight }}
                >
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2B4B3D] text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                    {item.score}
                  </div>
                </div>
              )}
              {isLoading ? (
                <Skeleton className="h-2.5 w-6" />
              ) : (
                <span className={`text-[10px] font-bold ${item.is_today ? 'text-[#2B4B3D] dark:text-[#8CE0A7]' : 'text-[#8CAAB8]'}`}>{item.day}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
