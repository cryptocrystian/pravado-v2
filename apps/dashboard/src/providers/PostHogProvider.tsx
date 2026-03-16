'use client';

/**
 * PostHog Provider (Sprint S-INT-08)
 *
 * Initializes PostHog product analytics on the client side.
 * Wraps the application to provide PostHog context.
 */

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function PostHogPageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', { $current_url: pathname });
    }
  }, [pathname]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false, // manual pageview tracking via PostHogPageviewTracker
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug();
        }
      },
    });
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageviewTracker />
      {children}
    </PHProvider>
  );
}
