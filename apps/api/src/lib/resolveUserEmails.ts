import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve user emails from `auth.users` (F46).
 *
 * Email lives on `auth.users`, NOT `public.users`, so it cannot be selected via
 * a PostgREST embed (`users!inner(...email)`) — doing so throws
 * "column users.email does not exist" and 500s the caller. This helper resolves
 * emails through the admin API instead.
 *
 * `@supabase/supabase-js` ^2.39 offers no server-side id filter on
 * `admin.listUsers`, so we call `admin.getUserById` per unique id (org member
 * lists are small). Any per-user failure resolves to `null` so the caller
 * degrades gracefully (email omitted) rather than 500-ing.
 *
 * @returns Map of userId → email (or `null` when unavailable).
 */
export async function resolveUserEmails(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, string | null>> {
  const uniqueIds = [...new Set(userIds)];

  const entries = await Promise.all(
    uniqueIds.map(async (id): Promise<[string, string | null]> => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(id);
        if (error) return [id, null];
        return [id, data.user?.email ?? null];
      } catch {
        return [id, null];
      }
    })
  );

  return new Map(entries);
}
