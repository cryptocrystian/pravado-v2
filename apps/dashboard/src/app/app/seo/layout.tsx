/**
 * SEO/AEO Surface Layout — /app/seo/*
 * Server component: fetches session, passes to SEOShell client wrapper.
 */

import { getCurrentUser } from '@/lib/getCurrentUser';
import { SEOShell } from '@/components/seo/SEOShell';
import { MSWProvider } from '@/mocks/MSWProvider';

export const dynamic = 'force-dynamic';

export default async function SEOLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  return (
    <SEOShell
      orgName={session?.activeOrg?.name ?? 'Workspace'}
      userName={session?.user.fullName || 'User'}
      userEmail={session?.user.email || undefined}
      userAvatarUrl={session?.user.avatarUrl || undefined}
    >
      <MSWProvider>{children}</MSWProvider>
    </SEOShell>
  );
}
