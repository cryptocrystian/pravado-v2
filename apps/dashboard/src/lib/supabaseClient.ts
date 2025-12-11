/**
 * Supabase client initialization for dashboard
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Debug: Log initialization (only in browser)
if (typeof window !== 'undefined') {
  console.log('[Supabase] Initializing client');
  console.log('[Supabase] URL:', supabaseUrl.substring(0, 30) + '...');
  console.log('[Supabase] Key prefix:', supabaseAnonKey.substring(0, 20) + '...');

  // Check if using placeholders
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    console.error('[Supabase] WARNING: Using placeholder values! Check NEXT_PUBLIC_SUPABASE_* env vars');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
