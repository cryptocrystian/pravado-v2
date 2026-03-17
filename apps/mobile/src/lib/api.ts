import { supabase } from './supabase';

const API_BASE = 'https://pravado-api.onrender.com/api/v1';

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error?.message || err.message || `API ${res.status}`);
  }

  const data = await res.json();
  // Unwrap { success: true, data: ... } pattern
  if (data && typeof data === 'object' && 'success' in data && data.data !== undefined) {
    return data.data as T;
  }
  return data as T;
}
