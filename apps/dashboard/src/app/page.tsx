/**
 * Root page - redirects to appropriate destination
 * - Authenticated users -> /app
 * - Unauthenticated users -> /login
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Check for Supabase auth cookies
  const hasAuthCookie = allCookies.some(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  );

  if (hasAuthCookie) {
    redirect('/app');
  } else {
    redirect('/login');
  }
}
