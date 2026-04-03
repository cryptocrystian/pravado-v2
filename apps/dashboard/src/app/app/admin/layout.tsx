/**
 * Admin Layout
 * Server component — auth + admin role gate.
 * Uses getCurrentUser for session, then checks is_admin via service-role query.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) {
    // Admin layout still gates because non-admin redirect is not to /login
    redirect('/app/command-center');
  }

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

  return <AdminShell userEmail={session.user.fullName || 'Admin'}>{children}</AdminShell>;
}
