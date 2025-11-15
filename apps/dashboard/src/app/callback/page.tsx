/**
 * Auth callback page - handles redirects after authentication
 */

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';

export default async function CallbackPage() {
  const session = await getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  // If user has orgs, redirect to app
  if (session.orgs && session.orgs.length > 0) {
    redirect('/app');
  }

  // Otherwise, redirect to onboarding to create an org
  redirect('/onboarding');
}
