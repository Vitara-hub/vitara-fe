// Token storage for backend-proxied auth (no Supabase client in the browser).

const STORAGE_KEYS = {
  accessToken: 'vitara_access_token',
  refreshToken: 'vitara_refresh_token',
  expiresAt: 'vitara_token_expires_at',
} as const;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function setAuthTokens(tokens: AuthTokens): void {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt));
}

export function clearAuthTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function hasAuthTokens(): boolean {
  return Boolean(getAccessToken() && getRefreshToken() && localStorage.getItem(STORAGE_KEYS.expiresAt));
}

export function isAccessTokenExpired(skewMs = 60_000): boolean {
  const raw = localStorage.getItem(STORAGE_KEYS.expiresAt);
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

