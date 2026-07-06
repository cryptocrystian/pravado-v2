/**
 * API client for backend requests (Server-side)
 *
 * S99 Fix: Use centralized config, no localhost fallback in production
 */

import {
  getServerAccessToken,
  ServerAuthError,
} from '@/server/supabaseServerAuth';

// In production, NEXT_PUBLIC_API_URL must be set
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api-url-not-configured.invalid'
    : 'http://localhost:3001');

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // F37 fix: resolve the token via the canonical server-side extractor and
  // forward it as `Authorization: Bearer`, matching backendFetch. The prior
  // implementation forwarded `Cookie: access_token=<jwt>`, but the auth token
  // lives in Supabase SSR `sb-*` cookies (never a plain `access_token`), and the
  // backend auth plugin only reads the Authorization header or an
  // `sb-access-token` cookie — so the backend saw no token and returned 401.
  let token: string;
  try {
    token = await getServerAccessToken();
  } catch (err) {
    // Preserve the non-throwing contract: callers check `success`.
    const code = err instanceof ServerAuthError ? err.code : 'AUTH_MISSING';
    return {
      success: false,
      error: { code, message: 'Authentication required' },
    };
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    cache: 'no-store',
  });

  return response.json();
}
