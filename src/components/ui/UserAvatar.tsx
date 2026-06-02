import { useMemo } from 'react';
import type { AuthUser } from '@/store/useStore';

const DICEBEAR_AVATAR_BASE = 'https://api.dicebear.com/7.x/notionists/svg';

interface UserAvatarProps {
  user: AuthUser | null;
  sizeClassName: string;
  containerClassName?: string;
  imageClassName?: string;
  placeholderClassName?: string;
}

function cleanText(value?: string | null): string {
  return value?.trim() || '';
}

export default function UserAvatar({
  user,
  sizeClassName,
  containerClassName = '',
  imageClassName = '',
  placeholderClassName = '',
}: UserAvatarProps) {
  const metadataAvatarUrl = cleanText(user?.user_metadata?.avatar_url);
  const metadataPicture = cleanText(user?.user_metadata?.picture);
  const metadataFullName = cleanText(user?.user_metadata?.full_name);
  const metadataName = cleanText(user?.user_metadata?.name);
  const displayName = cleanText(user?.displayName);
  const name = cleanText(user?.name);
  const email = cleanText(user?.email);
  const imageUrl = cleanText(user?.imageUrl);
  const uid = cleanText(user?.uid);
  const hasUserIdentity = Boolean(
    uid ||
      email ||
      displayName ||
      name ||
      imageUrl ||
      metadataAvatarUrl ||
      metadataPicture,
  );

  const avatarSeed = useMemo(
    () => metadataFullName || metadataName || displayName || name || email || 'vitara-user',
    [metadataFullName, metadataName, displayName, name, email],
  );
  const fallbackAvatarSrc = useMemo(
    () => `${DICEBEAR_AVATAR_BASE}?seed=${encodeURIComponent(avatarSeed)}`,
    [avatarSeed],
  );
  const avatarSrc = useMemo(
    () => metadataAvatarUrl || metadataPicture || imageUrl || fallbackAvatarSrc,
    [metadataAvatarUrl, metadataPicture, imageUrl, fallbackAvatarSrc],
  );
  const avatarAlt = useMemo(
    () => `${displayName || name || email || avatarSeed}'s avatar`,
    [displayName, name, email, avatarSeed],
  );
  const avatarKey = uid || email || avatarSeed || 'guest';

  if (!hasUserIdentity) {
    return (
      <div
        key="guest"
        aria-hidden="true"
        className={`${sizeClassName} rounded-full bg-[#E8F0EA] dark:bg-stone-800 animate-pulse shrink-0 ${placeholderClassName}`}
      />
    );
  }

  return (
    <div
      key={avatarKey}
      className={`${sizeClassName} rounded-full bg-white dark:bg-stone-800 overflow-hidden shrink-0 ${containerClassName}`}
    >
      <img
        src={avatarSrc}
        alt={avatarAlt}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackAvatarSrc;
        }}
        className={`${sizeClassName} rounded-full object-cover ${imageClassName}`}
      />
    </div>
  );
}
