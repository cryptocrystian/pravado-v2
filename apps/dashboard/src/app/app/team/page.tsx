/**
 * Team management page
 */

import type { ListMembersResponse } from '@pravado/types';
import { redirect } from 'next/navigation';

import { apiRequest } from '@/lib/apiClient';
import { getCurrentUser } from '@/lib/getCurrentUser';

import { TeamPageClient } from './TeamPageClient';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getCurrentUser();

  if (!session || !session.activeOrg) {
    redirect('/login');
  }

  // Fetch members and invites
  const response = await apiRequest<ListMembersResponse['data']>(
    `/api/v1/orgs/${session.activeOrg.id}/members`
  );

  if (!response.success || !response.data) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Team</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load team members</p>
          </div>
        </div>
      </div>
    );
  }

  const { members, invites } = response.data;

  return (
    <TeamPageClient
      orgId={session.activeOrg.id}
      members={members}
      invites={invites}
      currentUserId={session.user.id}
    />
  );
}
