// src/components/activity/RecentHistory.tsx
import { ReactNode } from 'react';
import { Brain, Moon, Utensils, Heart, MessageCircle } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import type { ActivityHistoryItem, ActivityType } from '@/types/api';

interface LogCardProps {
  icon: ReactNode;
  color: string;
  title: string;
  time: string;
  score: string | number;
}

const activityStyles: Record<ActivityType, { icon: ReactNode; color: string }> = {
  journal: {
    icon: <Brain size={18} />,
    color: 'text-[#2B4B3D] bg-[#E8F0EA] dark:text-[#8CE0A7] dark:bg-[#1A2620]',
  },
  sleep: {
    icon: <Moon size={18} />,
    color: 'text-[#4A7A8C] bg-[#EEF2F5] dark:text-[#8CAAB8] dark:bg-[#1A1D20]',
  },
  food: {
    icon: <Utensils size={18} />,
    color: 'text-[#B39200] bg-[#FFF9E6] dark:text-[#FFD966] dark:bg-[#2A2616]',
  },
  chat: {
    icon: <MessageCircle size={18} />,
    color: 'text-[#2B7A50] bg-[#E6F7ED] dark:text-[#8CE0A7] dark:bg-[#1A2620]',
  },
  stress: {
    icon: <Heart size={18} />,
    color: 'text-[#FF9F66] bg-[#FFF0E6] dark:text-[#FF9F66] dark:bg-[#2A1E18]',
  },
};

function LogCard({ icon, color, title, time, score }: LogCardProps) {
  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-4 rounded-[20px] shadow-sm flex items-center justify-between border border-[#E8F0EA] dark:border-stone-800">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#2B4B3D] dark:text-stone-100 mb-0.5 truncate">{title}</p>
          <p className="text-[10px] font-medium text-[#A0B0A8]">{time}</p>
        </div>
      </div>
      <span className="text-xs font-black text-[#2B4B3D] dark:text-stone-50 bg-[#FAF9F6] dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-[#E8F0EA] dark:border-stone-700 shrink-0 ml-3">
        {score}
      </span>
    </div>
  );
}

function LogCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-4 rounded-[20px] shadow-sm flex items-center justify-between border border-[#E8F0EA] dark:border-stone-800 min-h-[82px]">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="w-12 h-12 rounded-[14px]" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-36 max-w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
  );
}

interface RecentHistoryProps {
  items: ActivityHistoryItem[];
  isLoading?: boolean;
}

export default function RecentHistory({ items, isLoading = false }: RecentHistoryProps) {
  const handleSeeAll = () => {
    if (window.location.pathname !== '/activity') {
      window.history.pushState({}, '', '/activity');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 mt-2">
         <h3 className="text-sm font-bold text-[#2B4B3D] dark:text-stone-100">Riwayat Terakhir</h3>
         {isLoading ? (
           <Skeleton className="h-3 w-16" />
         ) : (
           <button
             type="button"
             onClick={handleSeeAll}
             className="text-[10px] font-bold text-[#8CAAB8] dark:text-stone-500 cursor-pointer hover:text-[#8CE0A7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7] rounded-md"
           >
             Lihat Semua
           </button>
         )}
      </div>
      <div className="space-y-3">
        {isLoading ? (
          [0, 1, 2, 3].map((item) => <LogCardSkeleton key={item} />)
        ) : items.length > 0 ? (
          items.map((item) => {
            const style = activityStyles[item.type] ?? activityStyles.journal;

            return (
              <LogCard
                key={item.id}
                icon={style.icon}
                color={style.color}
                title={item.title}
                time={item.time}
                score={item.score}
              />
            );
          })
        ) : (
          <div className="bg-white dark:bg-[#1A1D1B] p-6 rounded-[20px] shadow-sm border border-[#E8F0EA] dark:border-stone-800 text-center">
            <p className="text-sm font-bold text-[#2B4B3D] dark:text-stone-100">Belum ada riwayat aktivitas.</p>
            <p className="text-xs font-medium text-[#8CAAB8] mt-1">Data akan muncul setelah kamu mencatat aktivitas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
