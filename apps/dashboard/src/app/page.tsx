/**
 * Root page - always redirects to /login
 *
 * The middleware on /login handles authenticated users by redirecting
 * them to /app. This avoids redirect loops caused by stale auth
 * cookies that are present but invalid.
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
