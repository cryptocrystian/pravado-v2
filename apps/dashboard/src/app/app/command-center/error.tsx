'use client';

/**
 * Command Center page-level error boundary.
 *
 * CRITICAL: this boundary deliberately does NOT call reset(). Next.js
 * defaults to allowing retry, but for the Command Center cold-start
 * crash, retry IS the bug — it re-mounts the broken component tree,
 * which throws again, looping until Chrome kills the renderer.
 *
 * If you're tempted to add a "Try again" button here, read
 * docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0A-COLD-START-UNBLOCK.md §4 first.
 */

import Link from 'next/link';
import { useEffect } from 'react';

export default function CommandCenterError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log for observability. Do NOT call reset() — that's what caused the freeze loop.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[CommandCenterError]', {
        message: error.message,
        digest: error.digest,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      });
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h2 className="text-2xl font-semibold mb-3">Command Center couldn&apos;t load</h2>
      <p className="text-white/60 mb-6 max-w-md">
        This usually means your workspace isn&apos;t fully set up yet. Continue
        onboarding to activate SAGE.
      </p>
      <div className="flex gap-3">
        <Link
          href="/onboarding/ai-intro"
          className="px-4 py-2 bg-brand-iris text-white rounded-lg font-medium"
        >
          Continue setup
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 border border-white/20 text-white/80 rounded-lg"
        >
          Sign out
        </Link>
      </div>
      {error.digest && (
        <p className="text-white/30 text-xs mt-6">Error ref: {error.digest}</p>
      )}
    </div>
  );
}
