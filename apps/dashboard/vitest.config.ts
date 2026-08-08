import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Dashboard test harness (#92).
 *
 * jsdom + @testing-library/react so React components/hooks are testable. Runs
 * per-package via `pnpm --filter @pravado/dashboard test` (wired into `turbo
 * test`, so CI picks up dashboard tests). Playwright E2E under `tests/` uses a
 * different runner and is excluded here.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror tsconfig `@/* -> ./src/*`.
      '@': path.resolve(__dirname, './src'),
      // Workspace packages ship a `dist` build for the `import` condition, which
      // isn't present under a source-only test run. Point tests at the source.
      '@pravado/feature-flags': path.resolve(
        __dirname,
        '../../packages/feature-flags/src/index.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Server/edge tests (Next middleware) need Node's Web globals (undici
    // Headers/Request), not jsdom's — route them to the node environment so
    // `next/server` spec-extensions work. Component/hook tests stay on jsdom.
    environmentMatchGlobs: [['src/middleware.test.ts', 'node']],
    setupFiles: ['./vitest.setup.ts'],
    // Component/unit tests live in src/. Playwright E2E lives in tests/.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'tests/**', // Playwright E2E — different runner
      '**/*.e2e.test.*',
      // ── Pre-existing tests not yet harness-ready (#92 follow-up) ──
      // Un-exclude one at a time as each is verified under jsdom. See the
      // "Un-exclude pattern" note in the PR body.
      // (populated after triage)
    ],
  },
});
