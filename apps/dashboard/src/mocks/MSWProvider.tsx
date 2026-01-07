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

import { useEffect, useState, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isMswEnabled = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';

    if (!isMswEnabled) {
      setIsReady(true);
      return;
    }

    // Dynamic import to avoid bundling MSW in production
    import('./browser')
      .then(({ initMocks }) => initMocks())
      .then(() => setIsReady(true))
      .catch((error) => {
        console.error('[MSW] Failed to initialize:', error);
        setIsReady(true); // Continue anyway
      });
  }, []);

  // Show nothing until MSW is ready (prevents flash of unintercepted requests)
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}

export default MSWProvider;
