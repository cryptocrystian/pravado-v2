/**
 * Team management page
 */

import type { ListMembersResponse } from '@pravado/types';
import * as Sentry from '@sentry/nextjs';

import { apiRequest } from '@/lib/apiClient';
import { getCurrentUser } from '@/lib/getCurrentUser';

import { TeamPageClient } from './TeamPageClient';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getCurrentUser();

  // No session at all — a legitimate mid-auth / unauthenticated state.
  if (!session) {
    return <div className="p-8 text-white/50">Loading team data...</div>;
  }

  // Session present but no active org — a DISTINCT failure mode (F37'): the
  // upstream admin org query returned empty/failed. Show an actionable error
  // and emit an observability signal instead of an indefinite loader.
  if (!session.activeOrg) {
    Sentry.captureMessage('team_page_no_active_org', {
      level: 'warning',
      tags: {
        phase: 'team_page_no_active_org',
        user_id: session.user.id,
      },
    });
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white-0 mb-8">Team</h2>
          <div className="bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg p-4">
            <p className="text-semantic-danger">
              Could not load organization. Please refresh or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch members and invites
  const response = await apiRequest<ListMembersResponse['data']>(
    `/api/v1/orgs/${session.activeOrg.id}/members`
  );

  if (!response.success || !response.data) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white-0 mb-8">Team</h2>
          <div className="bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg p-4">
            <p className="text-semantic-danger">Failed to load team members</p>
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
