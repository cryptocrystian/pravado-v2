/**
 * API client for backend requests (Server-side)
 *
 * S99 Fix: Use centralized config, no localhost fallback in production
 */

import { cookies } from 'next/headers';

// In production, NEXT_PUBLIC_API_URL must be set
const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://api-url-not-configured.invalid'
    : 'http://localhost:3001'
);

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
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `access_token=${accessToken}`,
      ...options.headers,
    },
    credentials: 'include',
  });

  return response.json();
}
