// src/components/activity/RecentHistory.tsx
import { ReactNode, useState } from 'react';
import { Brain, ChevronDown, Moon, Utensils, Heart, MessageCircle } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import type { ActivityHistoryItem, ActivityType } from '@/types/api';

interface LogCardProps {
  icon: ReactNode;
  color: string;
  type: ActivityType;
  title: string;
  time: string;
  score: string | number;
  nutritionDetails?: ActivityHistoryItem['nutritionDetails'];
  isExpanded?: boolean;
  onToggle?: () => void;
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

const GENERIC_TITLES = new Set([
  'nutrition lens',
  'journal entry',
  'unknown',
]);

function normalizeText(value: string | number) {
  return String(value).trim().toLowerCase();
}

function getNumericScore(value: string | number) {
  if (typeof value === 'number') return value;

  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function isZeroCalorieFood(item: ActivityHistoryItem) {
  if (item.type !== 'food') return false;

  const score = getNumericScore(item.score);
  return score !== null && score <= 0;
}

function isUnknownItem(item: ActivityHistoryItem) {
  return normalizeText(item.title) === 'unknown' || normalizeText(item.score) === 'unknown';
}

function isLocalJournalItem(item: ActivityHistoryItem) {
  return item.type === 'journal' && String(item.id).startsWith('local-');
}

function isGenericItem(item: ActivityHistoryItem) {
  return GENERIC_TITLES.has(normalizeText(item.title));
}

function cleanActivityItems(items: ActivityHistoryItem[]) {
  const structurallyValidItems = items.filter(
    (item) => !isZeroCalorieFood(item) && !isUnknownItem(item) && !isLocalJournalItem(item),
  );

  return structurallyValidItems.filter((item, _index, allItems) => {
    if (!isGenericItem(item)) return true;

    const hasMeaningfulSibling = allItems.some(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.type === item.type &&
        candidate.time === item.time &&
        !isGenericItem(candidate),
    );

    return !hasMeaningfulSibling;
  });
}

function formatNutritionValue(value: number | null | undefined, suffix: string) {
  return value == null ? '-' : `${value}${suffix}`;
}

function LogCard({
  icon,
  color,
  type,
  title,
  time,
  score,
  nutritionDetails,
  isExpanded = false,
  onToggle,
}: LogCardProps) {
  const isFood = type === 'food';
  const cardContent = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#2B4B3D] dark:text-stone-100 mb-0.5 truncate">{title}</p>
            <p className="text-[10px] font-medium text-[#A0B0A8]">{time}</p>
          </div>
        </div>
        {isFood ? (
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`shrink-0 text-[#A0B0A8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        ) : (
          <span className="text-xs font-black text-[#2B4B3D] dark:text-stone-50 bg-[#FAF9F6] dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-[#E8F0EA] dark:border-stone-700 shrink-0">
            {score}
          </span>
        )}
      </div>

      {isFood && (
        <div
          className={`grid grid-cols-4 gap-2 overflow-hidden transition-all duration-200 group-hover:mt-4 group-hover:max-h-20 group-hover:opacity-100 ${
            isExpanded ? 'mt-4 max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {[
            ['Kalori', formatNutritionValue(nutritionDetails?.calories, ' kcal')],
            ['Protein', formatNutritionValue(nutritionDetails?.protein, 'g')],
            ['Karbo', formatNutritionValue(nutritionDetails?.carbs, 'g')],
            ['Lemak', formatNutritionValue(nutritionDetails?.fat, 'g')],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[12px] bg-[#FAF9F6] dark:bg-stone-800 px-2 py-2 text-center">
              <p className="text-[9px] font-bold text-[#A0B0A8]">{label}</p>
              <p className="mt-0.5 text-[11px] font-black text-[#2B4B3D] dark:text-stone-100">{value}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (isFood) {
    return (
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggle}
        className="group w-full bg-white dark:bg-[#1A1D1B] p-4 rounded-[20px] shadow-sm border border-[#E8F0EA] dark:border-stone-800 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-4 rounded-[20px] shadow-sm border border-[#E8F0EA] dark:border-stone-800">
      {cardContent}
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
  const [showAll, setShowAll] = useState<boolean>(false);
  const [expandedFoodId, setExpandedFoodId] = useState<string | number | null>(null);
  const cleanItems = cleanActivityItems(items);
  const canExpand = cleanItems.length > 6;
  const displayedItems = showAll ? cleanItems : cleanItems.slice(0, 6);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 mt-2">
         <h3 className="text-sm font-bold text-[#2B4B3D] dark:text-stone-100">Riwayat Terakhir</h3>
         {isLoading ? (
           <Skeleton className="h-3 w-16" />
         ) : canExpand ? (
           <button
             type="button"
             onClick={() => setShowAll((current) => !current)}
             className="text-[10px] font-bold text-[#8CAAB8] dark:text-stone-500 cursor-pointer hover:text-[#8CE0A7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7] rounded-md"
           >
             {showAll ? 'Lebih Sedikit' : 'Lihat Semua'}
           </button>
         ) : null}
      </div>
      <div className="space-y-3">
        {isLoading ? (
          [0, 1, 2, 3].map((item) => <LogCardSkeleton key={item} />)
        ) : cleanItems.length > 0 ? (
          displayedItems.map((item) => {
            const style = activityStyles[item.type] ?? activityStyles.journal;

            return (
              <LogCard
                key={item.id}
                icon={style.icon}
                color={style.color}
                type={item.type}
                title={item.title}
                time={item.time}
                score={item.score}
                nutritionDetails={item.nutritionDetails}
                isExpanded={expandedFoodId === item.id}
                onToggle={() => setExpandedFoodId((current) => current === item.id ? null : item.id)}
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
