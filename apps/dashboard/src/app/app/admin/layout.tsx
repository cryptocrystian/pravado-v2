/**
 * Admin Layout
 * Server component — auth + admin role gate.
 * Uses getCurrentUser for session, then checks is_admin via service-role query.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  // Check admin status via service-role client (bypasses RLS)
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/app/command-center');
  }

  const userEmail = session.user.fullName || 'Admin';

  // Get email from Supabase auth
  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only in server components */ },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? userEmail;

  return <AdminShell userEmail={email}>{children}</AdminShell>;
}
