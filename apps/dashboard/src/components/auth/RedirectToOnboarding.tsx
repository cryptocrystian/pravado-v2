'use client';

/**
 * RedirectToOnboarding — soft safety-net component.
 *
 * Rendered by a Command Center pane when it receives a NO_ORG response.
 * Soft auto-redirects to /onboarding/ai-intro after 1s, with a visible
 * "Continue setup" link as the immediate fallback.
 *
 * The callback page should prevent users from ever reaching a state
 * where this renders. This exists for stale-cookie / bad-state cases.
 *
 * Authority: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0A-COLD-START-UNBLOCK.md §3
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RedirectToOnboarding({
  reason,
}: {
  reason: 'no-org' | 'incomplete';
}) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/onboarding/ai-intro'), 1000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center"
      data-redirect-reason={reason}
    >
      <p className="text-white/70 mb-3">Setting up your workspace&hellip;</p>
      <Link
        href="/onboarding/ai-intro"
        className="text-brand-cyan underline text-sm"
      >
        Continue setup &rarr;
      </Link>
    </div>
  );
}
