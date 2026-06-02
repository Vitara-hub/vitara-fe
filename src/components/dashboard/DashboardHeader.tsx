import { Sun, Moon } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import UserAvatar from '@/components/ui/UserAvatar';
import type { AuthUser } from '@/store/useStore';

interface DashboardHeaderProps {
  user: AuthUser | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading?: boolean;
  dateLabel?: string;
}

export default function DashboardHeader({
  user,
  isDarkMode,
  toggleDarkMode,
  isLoading = false,
  dateLabel,
}: DashboardHeaderProps) {
  const currentDate = dateLabel || new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const displayName = user?.displayName?.trim() || user?.name?.trim() || 'User';

  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12
    ? 'Selamat Pagi'
    : hour >= 12 && hour < 15
      ? 'Selamat Siang'
      : hour >= 15 && hour < 18
        ? 'Selamat Sore'
        : 'Selamat Malam';

  return (
    <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 min-w-0">
        {isLoading ? (
          <>
            <Skeleton className="w-12 h-12 rounded-[20px] shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-44 max-w-[54vw]" />
            </div>
          </>
        ) : (
          <>
            <UserAvatar
              user={user}
              sizeClassName="w-12 h-12"
              containerClassName="shadow-[0_4px_12px_rgba(0,0,0,0.03)] group hover:scale-105 transition-transform cursor-pointer"
              imageClassName="group-hover:rotate-6 transition-transform"
              placeholderClassName="shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
            />
            <div className="min-w-0">
              <p className="text-[#647C73] dark:text-stone-400 text-xs font-medium mb-0.5">{currentDate}</p>
              <h2 className="text-lg font-extrabold text-[#244135] dark:text-stone-50 leading-none truncate">
                {greeting}, {displayName}
              </h2>
            </div>
          </>
        )}
      </div>
      <button
        onClick={toggleDarkMode}
        className="w-10 h-10 rounded-[16px] bg-white dark:bg-stone-800 flex items-center justify-center text-[#647C73] dark:text-stone-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:scale-105 hover:text-[#1DB38A] dark:hover:text-[#8CE0A7] transition-all shrink-0"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
