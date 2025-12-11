/**
 * Supabase client initialization for dashboard
 * Uses @supabase/ssr for proper cookie-based session storage
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Debug: Log initialization (only in browser)
if (typeof window !== 'undefined') {
  console.log('[Supabase] Initializing browser client with cookie storage');
  console.log('[Supabase] URL:', supabaseUrl.substring(0, 30) + '...');
  console.log('[Supabase] Key prefix:', supabaseAnonKey.substring(0, 20) + '...');

  // Check if using placeholders
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    console.error('[Supabase] WARNING: Using placeholder values! Check NEXT_PUBLIC_SUPABASE_* env vars');
  }
}

// Create browser client that stores session in cookies (not localStorage)
// This allows middleware and server components to read the session
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
