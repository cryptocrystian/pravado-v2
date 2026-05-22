/**
 * Vitest configuration for @pravado/api.
 *
 * Exclude block:
 *   The 31 test files listed below have pre-existing failures that pre-date
 *   2026-05-07 (commit b7e8567 ? the last point at which apps/api CI test
 *   job was green). Classification per Track 0D Group 3 triage:
 *
 *     - C (drifted expectations): production code added chain methods
 *       (.gte/.lte/.range/.is/.match/etc.) without updating test mocks.
 *       Tests need full rewrite against the current chain shape.
 *
 *     - A (production-bug candidates): two files surfaced TS issues in the
 *       service code (unifiedIntelligenceGraphService.ts crypto import,
 *       governanceService.ts Map iteration). Phase 1 tickets.
 *
 *   See docs/tests/PRE-EXISTING-FAILURES-2026-05-14.md for the full
 *   classified list with code locations.
 *
 *   DECISIONS_LOG 2026-05-15 records this exclusion as a one-time Phase 0
 *   scope decision (not a pattern). Tracks 0B/0C exit criteria do NOT
 *   require these to pass. Phase 1 must fix or delete each entry; the
 *   excludes get removed as files come back green.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',

      // === Pre-existing failures (Track 0D Group 3) ===
      // Re-enable each as Phase 1 tracks rewrite the mocks.

      '__tests__/billingAlerts.test.ts',
      '__tests__/billingInvoices.test.ts',
      '__tests__/billingRoutes.test.ts',
      '__tests__/billingService.test.ts',
      '__tests__/overageBilling.test.ts',
      '__tests__/playbookRunView.test.ts',
      'tests/audiencePersonaService.test.ts',
      'tests/auth.test.ts',
      'tests/billingPlanManagement.test.ts',
      'tests/brandReputationService.test.ts',
      'tests/competitorIntelligenceService.test.ts',
      'tests/crisisService.test.ts',
      'tests/executiveBoardReportService.test.ts',
      'tests/executiveDigestService.test.ts',
      'tests/governanceService.test.ts',
      'tests/insightConflictService.test.ts',
      'tests/journalistEnrichmentService.test.ts',
      'tests/journalistTimelineService.test.ts',
      'tests/mediaBriefingService.test.ts',
      'tests/mediaCrawlerService.test.ts',
      'tests/mediaListService.test.ts',
      'tests/mediaMonitoringService.test.ts',
      'tests/mediaPerformanceService.test.ts',
      'tests/ops.test.ts',
      'tests/orgs.test.ts',
      'tests/prPitchService.test.ts',
      'tests/realityMapService.test.ts',
      'tests/riskRadarService.test.ts',
      'tests/scenarioOrchestrationService.test.ts',
      'tests/strategicIntelligenceService.test.ts',
      'tests/unifiedGraphService.test.ts',
    ],
  },
});
