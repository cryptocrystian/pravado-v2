/**
 * SAGE Signal Scan Worker — Fix A (F13 Tier 2 remediation) unit tests.
 *
 * Verifies the post-scan pipeline branches correctly and swallows
 * downstream errors instead of failing the scan job.
 *
 *   1. signals_written > 0 → generateProposals is invoked and
 *      generateColdStartProposals is NOT.
 *   2. signals_written === 0 → generateColdStartProposals is invoked
 *      and generateProposals is NOT.
 *   3. If generateProposals throws, the worker still resolves and
 *      captures the error to Sentry with phase=sage_signal_scan_proposal_gen.
 *   4. If generateColdStartProposals throws, same posture with
 *      phase=sage_signal_scan_cold_start.
 *
 * These are the four causal claims the F13 remediation makes about the
 * wiring layer — if any of them regress the compound bug returns.
 */

import * as Sentry from '@sentry/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processSageSignalScan } from '../src/queue/workers/sageSignalScanWorker';
import { generateColdStartProposals } from '../src/services/sage/sageColdStartProposals';
import { generateProposals } from '../src/services/sage/sageProposalGenerator';
import { runSignalScan } from '../src/services/sage/sageSignalIngestor';

// vi.mock is hoisted to the top of the module by vitest's transformer,
// so these calls run before the imports above resolve at runtime.
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

vi.mock('../src/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({ __marker: 'stub-supabase' })),
}));

vi.mock('../src/services/sage/sageSignalIngestor', () => ({
  runSignalScan: vi.fn(),
}));

vi.mock('../src/services/sage/sageProposalGenerator', () => ({
  generateProposals: vi.fn(),
}));

vi.mock('../src/services/sage/sageColdStartProposals', () => ({
  generateColdStartProposals: vi.fn(),
}));

const ORG_ID = 'aaaaaaaa-1111-2222-3333-444444444444';

const successfulScanResult = (written: number) => ({
  signals_found: written,
  signals_written: written,
  by_pillar: { PR: 0, Content: 0, SEO: written },
  errors: [] as string[],
});

describe('processSageSignalScan — Fix A wiring (F13 Tier 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes generateProposals when signals_written > 0', async () => {
    vi.mocked(runSignalScan).mockResolvedValue(successfulScanResult(3));
    vi.mocked(generateProposals).mockResolvedValue({
      org_id: ORG_ID,
      proposals_generated: 3,
      llm_provider_used: 'anthropic',
      errors: [],
    } as never);

    await processSageSignalScan({ orgId: ORG_ID });

    expect(generateProposals).toHaveBeenCalledTimes(1);
    expect(generateColdStartProposals).not.toHaveBeenCalled();
  });

  it('invokes generateColdStartProposals when signals_written === 0', async () => {
    vi.mocked(runSignalScan).mockResolvedValue(successfulScanResult(0));
    vi.mocked(generateColdStartProposals).mockResolvedValue({
      org_id: ORG_ID,
      generated: 3,
      llm_provider_used: 'anthropic',
      reason: 'ok',
      errors: [],
    });

    await processSageSignalScan({ orgId: ORG_ID });

    expect(generateColdStartProposals).toHaveBeenCalledTimes(1);
    expect(generateProposals).not.toHaveBeenCalled();
  });

  it('captures proposal-gen errors to Sentry without rethrowing', async () => {
    vi.mocked(runSignalScan).mockResolvedValue(successfulScanResult(2));
    const proposalErr = new Error('LLM router blew up');
    vi.mocked(generateProposals).mockRejectedValue(proposalErr);

    await expect(
      processSageSignalScan({ orgId: ORG_ID })
    ).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(
      proposalErr,
      expect.objectContaining({
        tags: expect.objectContaining({
          org_id: ORG_ID,
          phase: 'sage_signal_scan_proposal_gen',
        }),
      })
    );
  });

  it('captures cold-start errors to Sentry without rethrowing', async () => {
    vi.mocked(runSignalScan).mockResolvedValue(successfulScanResult(0));
    const coldStartErr = new Error('Supabase insert failed');
    vi.mocked(generateColdStartProposals).mockRejectedValue(coldStartErr);

    await expect(
      processSageSignalScan({ orgId: ORG_ID })
    ).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(
      coldStartErr,
      expect.objectContaining({
        tags: expect.objectContaining({
          org_id: ORG_ID,
          phase: 'sage_signal_scan_cold_start',
        }),
      })
    );
  });

  it('rethrows scan-level errors (contract preserved)', async () => {
    const scanErr = new Error('Supabase network partition');
    vi.mocked(runSignalScan).mockRejectedValue(scanErr);

    await expect(processSageSignalScan({ orgId: ORG_ID })).rejects.toThrow(
      'Supabase network partition'
    );

    expect(generateProposals).not.toHaveBeenCalled();
    expect(generateColdStartProposals).not.toHaveBeenCalled();
  });
});
