/**
 * Supabase Client Helper (Sprint S73/S74)
 * Provides shared Supabase client for services
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';

let supabaseClient: SupabaseClient | null = null;
let cachedEnv: ReturnType<typeof validateEnv<typeof apiEnvSchema>> | null = null;

function getEnv() {
  if (!cachedEnv) {
    cachedEnv = validateEnv(apiEnvSchema);
  }
  return cachedEnv;
}

/**
 * Get or create a Supabase client instance
 * Uses the service role key for full database access
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const env = getEnv();
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

/**
 * Create a new Supabase client instance (not cached)
 * Useful for specific use cases requiring isolated clients
 */
export function createSupabaseClient(): SupabaseClient {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export type { SupabaseClient };
