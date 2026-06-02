/**
 * Organization Settings — /app/settings/organization
 *
 * Phase 0 Track 0C item 4 (scope-reduced per architect guard):
 * - The audit found this route 404s. Building the full page (display +
 *   PATCH form + Leave Org confirmation modal + the `/api/v1/orgs/:id`
 *   GET/PATCH backend) is a half-day-plus task. Per the spec's risk
 *   note ("if the org details endpoints don't exist, budget another 4
 *   hours for building them") that exceeds the architect's Phase 0
 *   half-day cap.
 * - Phase 0 ships READ-ONLY display of org name + created date, sourced
 *   from getCurrentUser (already returns activeOrg). The PATCH form
 *   (rename / domain edit) and the destructive "Leave organization"
 *   button defer to Phase 1 (tracked separately).
 * - The route now returns 200 with honest content instead of 404.
 *
 * Phase 1 restores:
 *   1. apps/api/src/routes/orgs/index.ts — GET /v1/orgs/:id + PATCH /v1/orgs/:id
 *   2. apps/dashboard/src/components/settings/OrganizationSettingsForm.tsx
 *      with editable name + domain
 *   3. Leave organization destructive flow (with sole-owner UX)
 *
 * Spec: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0C-UX-HYGIENE.md item 4
 */

import Link from 'next/link';

import { getCurrentUser } from '@/lib/getCurrentUser';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default async function OrganizationSettingsPage() {
  const session = await getCurrentUser();
  const org = session?.activeOrg ?? null;

  return (
    <div className="min-h-full bg-cc-page pt-8 pb-16 px-8">
      <div className="max-w-[800px] mx-auto">
        {/* Back */}
        <Link
          href="/app/settings"
          className="text-sm text-white/45 hover:text-white/70 transition-colors mb-8 inline-block"
        >
          &larr; Settings
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">Organization</h1>
        <p className="text-sm text-white/70 mb-8">
          Your workspace details. Editing organization name + domain returns in
          Phase 1.
        </p>

        {org ? (
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
                Name
              </p>
              <p className="text-base text-white">{org.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
                Created
              </p>
              <p className="text-base text-white">
                {formatDate(org.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
                Role
              </p>
              <p className="text-base text-white">Owner</p>
            </div>
          </div>
        ) : (
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
            <p className="text-sm text-white/55">
              No active organization on this session. Sign out and back in, or
              contact support if the issue persists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
