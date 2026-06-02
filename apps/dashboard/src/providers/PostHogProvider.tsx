'use client';

/**
 * PostHog Provider (Sprint S-INT-08)
 *
 * Initializes PostHog product analytics on the client side.
 * Wraps the application to provide PostHog context.
 */

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

function PostHogPageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', { $current_url: pathname });
    }
  }, [pathname]);

  return null;
}

// Track 0C item 12: PostHog initializes only when BOTH the key is non-empty
// AND NEXT_PUBLIC_POSTHOG_ENABLED is the literal string "true". This prevents
// the dev project from accidentally capturing beta-user events when a stale
// key is still set in env, and gives the architect a single env flag to flip
// once the beta-project key is verified in the PostHog dashboard.
function isPostHogEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_POSTHOG_KEY
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isPostHogEnabled()) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false, // manual pageview tracking via PostHogPageviewTracker
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug();
        }
      },
    });
  }, []);

  if (!isPostHogEnabled()) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageviewTracker />
      {children}
    </PHProvider>
  );
}
