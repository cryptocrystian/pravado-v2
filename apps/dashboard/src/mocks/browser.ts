/**
 * MSW Browser Setup
 *
 * This file configures MSW for browser-based mocking.
 * Used during development to intercept API calls and return contract examples.
 *
 * Usage:
 * - Import and call initMocks() early in the application lifecycle
 * - Enable via NEXT_PUBLIC_MSW_ENABLED=true environment variable
 */

import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';
import { createLogger } from '../lib/clientLogger';

const logger = createLogger('dashboard:mocks:browser');
export const worker = setupWorker(...handlers);

/**
 * Initialize MSW in the browser
 * Call this function at app startup when mocking is enabled
 */
export async function initMocks(): Promise<void> {
  if (typeof window === 'undefined') {
    logger.warn('[MSW] Cannot initialize in non-browser environment');
    return;
  }

  const isMswEnabled = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';

  if (!isMswEnabled) {
    logger.info(
      '[MSW] Mocking disabled (set NEXT_PUBLIC_MSW_ENABLED=true to enable)'
    );
    return;
  }

  try {
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });

    logger.info('[MSW] Mock Service Worker started successfully');
    logger.info('[MSW] Intercepting Command Center API endpoints:');
    logger.info('  - GET /api/command-center/action-stream');
    logger.info('  - GET /api/command-center/intelligence-canvas');
    logger.info('  - GET /api/command-center/strategy-panel');
    logger.info('  - GET /api/command-center/orchestration-calendar');
  } catch (error) {
    logger.error('[MSW] Failed to start Mock Service Worker:', error);
  }
}
