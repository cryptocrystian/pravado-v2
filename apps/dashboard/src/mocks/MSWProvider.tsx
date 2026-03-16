'use client';

/**
 * MSW Provider Component
 *
 * Initializes MSW in the browser when NEXT_PUBLIC_MSW_ENABLED=true.
 * Place this component high in the component tree (e.g., in layout.tsx).
 *
 * Usage:
 * ```tsx
 * <MSWProvider>
 *   <YourApp />
 * </MSWProvider>
 * ```
 */

import { useEffect, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  useEffect(() => {
    const isMswEnabled = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';

    if (!isMswEnabled) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => {
            if (reg.active?.scriptURL?.includes('mockServiceWorker')) {
              reg.unregister().then(() => {
                console.log('[MSW] Stale service worker unregistered');
              });
            }
          });
        });
      }
      return;
    }

    import('./browser')
      .then(({ initMocks }) => initMocks())
      .catch((error) => console.error('[MSW] Failed to initialize:', error));
  }, []);

  // Always render children — never gate SSR output behind client-side state.
  // MSW intercepts fetch calls; it doesn't need to block rendering.
  return <>{children}</>;
}

export default MSWProvider;
