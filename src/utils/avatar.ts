import type { SyntheticEvent } from 'react';
import type { AuthUser } from '@/store/useStore';

const DICEBEAR_AVATAR_BASE = 'https://api.dicebear.com/7.x/notionists/svg';

function cleanText(value?: string | null): string {
  return value?.trim() || '';
}

export function getAvatarSeed(user: AuthUser | null): string {
  return (
    cleanText(user?.user_metadata?.full_name) ||
    cleanText(user?.user_metadata?.name) ||
    cleanText(user?.displayName) ||
    cleanText(user?.name) ||
    cleanText(user?.username) ||
    cleanText(user?.email) ||
    'vitara-user'
  );
}

export function getFallbackAvatar(user: AuthUser | null): string {
  return `${DICEBEAR_AVATAR_BASE}?seed=${encodeURIComponent(getAvatarSeed(user))}`;
}

export function getAvatarSrc(user: AuthUser | null): string {
  return (
    cleanText(user?.user_metadata?.avatar_url) ||
    cleanText(user?.user_metadata?.picture) ||
    cleanText(user?.imageUrl) ||
    getFallbackAvatar(user)
  );
}

export function getAvatarAlt(user: AuthUser | null): string {
  const label = cleanText(user?.username) || getAvatarSeed(user);
  return `${label}'s avatar`;
}

export function createAvatarFallbackHandler(user: AuthUser | null) {
  return (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = getFallbackAvatar(user);
  };
}
