import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Lane H — server-side publish governance enforcement.
 *
 * Canon (CONTENT_WORK_SURFACE_CONTRACT):
 *   §7.4 Publishing = Manual only (Copilot/Autopilot = No).
 *   §7.1 CiteMind qualification gate must pass; `blocked` hard-blocks.
 *
 * enforcePublishGovernance is the chokepoint the PUT /items/:id route calls on a
 * status→published transition. These tests prove it BLOCKS non-manual modes and
 * blocked CiteMind gates, and only ALLOWS when both gates pass — i.e. governance
 * can no longer be bypassed from the client (the old FE gate was dead code).
 */

const resolveOrgModeState = vi.fn();
const checkGate = vi.fn();

vi.mock('../src/services/mode/modeService', () => ({
  resolveOrgModeState: (...args: unknown[]) => resolveOrgModeState(...args),
}));

vi.mock('../src/services/citeMind/citeMindPublishGateService', () => ({
  checkGate: (...args: unknown[]) => checkGate(...args),
}));

import { enforcePublishGovernance } from '../src/services/content/publishGovernance';

const supabase = {} as never;

function modeState(mode: 'manual' | 'copilot' | 'autopilot') {
  return {
    pillars: {
      content: { mode, source: 'user', floor: 'manual', ceiling: 'autopilot' },
    },
  };
}

describe('enforcePublishGovernance', () => {
  beforeEach(() => {
    resolveOrgModeState.mockReset();
    checkGate.mockReset();
  });

  it('blocks publish when content pillar is in copilot mode (§7.4 ceiling)', async () => {
    resolveOrgModeState.mockResolvedValue(modeState('copilot'));
    const r = await enforcePublishGovernance(supabase, 'u1', 'o1', 'c1');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('mode_ceiling');
    // Mode ceiling is cheap + unambiguous — CiteMind is not even consulted.
    expect(checkGate).not.toHaveBeenCalled();
  });

  it('blocks publish in autopilot mode (no auto-publish)', async () => {
    resolveOrgModeState.mockResolvedValue(modeState('autopilot'));
    const r = await enforcePublishGovernance(supabase, 'u1', 'o1', 'c1');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('mode_ceiling');
  });

  it('blocks publish in manual mode when CiteMind gate is blocked (§7.1)', async () => {
    resolveOrgModeState.mockResolvedValue(modeState('manual'));
    checkGate.mockResolvedValue({
      allowed: false,
      score: 40,
      gate_status: 'blocked',
      recommendations: ['Add citations'],
    });
    const r = await enforcePublishGovernance(supabase, 'u1', 'o1', 'c1');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('citemind_blocked');
    expect(r.gate?.gate_status).toBe('blocked');
  });

  it('allows publish in manual mode when CiteMind gate passes', async () => {
    resolveOrgModeState.mockResolvedValue(modeState('manual'));
    checkGate.mockResolvedValue({
      allowed: true,
      score: 82,
      gate_status: 'passed',
      recommendations: [],
    });
    const r = await enforcePublishGovernance(supabase, 'u1', 'o1', 'c1');
    expect(r.ok).toBe(true);
    expect(r.mode).toBe('manual');
  });

  it('allows publish in manual mode on a warning gate (advisory, not a block)', async () => {
    resolveOrgModeState.mockResolvedValue(modeState('manual'));
    checkGate.mockResolvedValue({
      allowed: true,
      score: 60,
      gate_status: 'warning',
      recommendations: ['Reduce repetition'],
    });
    const r = await enforcePublishGovernance(supabase, 'u1', 'o1', 'c1');
    expect(r.ok).toBe(true);
  });
});
