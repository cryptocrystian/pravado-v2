/**
 * SEO/AEO Surface Layout — /app/seo/*
 * Server component: fetches session, passes to SEOShell client wrapper.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { SEOShell } from '@/components/seo/SEOShell';
import { MSWProvider } from '@/mocks/MSWProvider';

export const dynamic = 'force-dynamic';

export default async function SEOLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');
  if (!session.activeOrg) redirect('/onboarding');

  return (
    <SEOShell
      orgName={session.activeOrg.name}
      userName={session.user.fullName || 'User'}
      userAvatarUrl={session.user.avatarUrl || undefined}
    >
      <MSWProvider>{children}</MSWProvider>
    </SEOShell>
  );
}
