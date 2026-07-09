/**
 * Dashboard test harness bootstrap (#92).
 *
 * - Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.).
 * - Auto-cleans the DOM between tests.
 * - Provides safe default mocks for Next.js client navigation hooks (individual
 *   tests can override with vi.mock).
 * - Sets deterministic NEXT_PUBLIC_* defaults (never real values).
 *
 * #83 logger note: apps/api's pino logger crashes under vitest (transport). The
 * dashboard has no `@/lib/logger`, and the smoke test doesn't import one, so no
 * global logger mock is needed yet. If a future component test transitively
 * imports a pino-based logger via a shared package, mock that specific module in
 * the test (or add a global vi.mock here) — see the PR body's "logger pattern".
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Next.js App Router client hooks — safe no-op defaults.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Deterministic public env — placeholder values only.
process.env.NEXT_PUBLIC_API_URL ||= 'http://localhost:4000';
process.env.NEXT_PUBLIC_MSW_ENABLED ||= 'false';
