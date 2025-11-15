/**
 * Invite acceptance page
 */

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';

import { InviteAcceptClient } from './InviteAcceptClient';

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await getCurrentUser();

  // If not logged in, redirect to login with return URL
  if (!session) {
    redirect(`/login?redirect=/invite/${token}`);
  }

  return <InviteAcceptClient token={token} />;
}
