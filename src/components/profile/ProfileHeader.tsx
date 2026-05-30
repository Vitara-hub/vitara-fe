// src/components/profile/ProfileHeader.tsx
import { Shield } from 'lucide-react';
import { AuthUser } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';

interface ProfileHeaderProps {
  user: AuthUser | null;
  isLoading?: boolean;
}

export default function ProfileHeader({ user, isLoading = false }: ProfileHeaderProps) {
  const avatarSeed = encodeURIComponent(user?.username || user?.email || user?.uid || 'vitara-user');
  const avatarSrc = user?.imageUrl?.trim() || `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`;
  const avatarAlt = `${user?.username || user?.displayName || 'Vitara user'}'s avatar`;

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
            <div className="w-24 h-24 rounded-[32px] bg-[#E8F0EA] dark:bg-[#1A2620] flex items-center justify-center border-2 border-[#8CE0A7] overflow-hidden shadow-sm">
              <img src={avatarSrc} alt={avatarAlt} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#2B4B3D] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
              <Shield size={14} />
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold text-[#2B4B3D] dark:text-stone-50">
            {user?.displayName || user?.name || 'Yunggi'}
          </h1>
          <p className="text-xs font-semibold text-[#8CAAB8] uppercase tracking-wider text-center mt-1">
            {user?.email || 'Full-Stack Developer & Security Researcher'}
          </p>
        </>
      )}
    </div>
  );
}
