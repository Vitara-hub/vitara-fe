import { Shield } from 'lucide-react';
import type { AuthUser } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';
import UserAvatar from '@/components/ui/UserAvatar';

interface ProfileHeaderProps {
  user: AuthUser | null;
  isLoading?: boolean;
}

export default function ProfileHeader({ user, isLoading = false }: ProfileHeaderProps) {
  const displayName = user?.displayName?.trim() || user?.name?.trim() || 'User';

  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-8 flex flex-col items-center border-b border-[#E8F0EA] dark:border-stone-800 min-h-[238px]">
      {isLoading ? (
        <>
          <Skeleton className="w-24 h-24 rounded-[32px]" />
          <Skeleton className="mt-4 h-6 w-32" />
          <Skeleton className="mt-2 h-3 w-64 max-w-full" />
        </>
      ) : (
        <>
          <div className="relative group">
            <UserAvatar
              user={user}
              sizeClassName="w-24 h-24"
              containerClassName="border-2 border-[#8CE0A7] shadow-sm"
              placeholderClassName="border-2 border-[#8CE0A7] shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#2B4B3D] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
              <Shield size={14} />
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold text-[#2B4B3D] dark:text-stone-50">
            {displayName}
          </h1>
          <p className="text-xs font-semibold text-[#8CAAB8] uppercase tracking-wider text-center mt-1">
            {user?.email || ''}
          </p>
        </>
      )}
    </div>
  );
}
