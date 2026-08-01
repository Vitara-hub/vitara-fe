// src/components/profile/ProfileHeader.tsx
import type { AuthUser } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';

interface ProfileHeaderProps {
  user: AuthUser | null;
  isLoading?: boolean;
}

export default function ProfileHeader({ user, isLoading = false }: ProfileHeaderProps) {
  const displayName = user?.displayName?.trim() || user?.name?.trim() || 'User';

  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-8 flex flex-col items-center justify-center border-b border-[#E8F0EA] dark:border-stone-800 min-h-[180px]">
      {isLoading ? (
        <>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-3 h-3 w-32" />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-black text-[#2B4B3D] dark:text-stone-50">
            {displayName}
          </h1>
          <p className="text-xs font-semibold text-[#8CAAB8] uppercase tracking-wider text-center mt-2">
            {user?.email || ''}
          </p>
        </>
      )}
    </div>
  );
}