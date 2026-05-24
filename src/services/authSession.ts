// Token storage for backend-proxied auth (no Supabase client in the browser).

const STORAGE_KEYS = {
  access: 'vitara_access_token',
  refresh: 'vitara_refresh_token',
  expiresAt: 'vitara_token_expires_at',
} as const;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function setAuthTokens(tokens: AuthTokens): void {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  sessionStorage.setItem(STORAGE_KEYS.access, tokens.accessToken);
  sessionStorage.setItem(STORAGE_KEYS.refresh, tokens.refreshToken);
  sessionStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt));
}

export function clearAuthTokens(): void {
  sessionStorage.removeItem(STORAGE_KEYS.access);
  sessionStorage.removeItem(STORAGE_KEYS.refresh);
  sessionStorage.removeItem(STORAGE_KEYS.expiresAt);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.access);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.refresh);
}

export function hasAuthTokens(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function isAccessTokenExpired(skewMs = 60_000): boolean {
  const raw = sessionStorage.getItem(STORAGE_KEYS.expiresAt);
  if (!raw) return true;
  return Date.now() >= Number(raw) - skewMs;
}

export function hasOAuthCallbackParams(): boolean {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return (
    searchParams.has('code') ||
    searchParams.has('error') ||
    hashParams.has('access_token') ||
    hashParams.has('refresh_token') ||
    hashParams.has('error')
  );
}

export function getOAuthCode(): string | null {
  return new URLSearchParams(window.location.search).get('code');
}

export function getOAuthHashTokens(): Pick<AuthTokens, 'accessToken' | 'refreshToken'> | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export function removeOAuthParamsFromUrl(): void {
  if (!hasOAuthCallbackParams()) return;
  window.history.replaceState({}, document.title, window.location.pathname);
}
