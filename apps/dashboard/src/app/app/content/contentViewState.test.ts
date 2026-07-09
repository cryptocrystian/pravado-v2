/**
 * PR-2 — contentViewState unit tests (pure logic; no React harness needed,
 * runs under the existing dashboard vitest .test.ts path — see ticket #92 for
 * the missing React component harness).
 */

import { describe, it, expect } from 'vitest';

import {
  resolveContentViewState,
  type ContentAutomationMode,
} from './contentViewState';

describe('resolveContentViewState', () => {
  it('returns loading while the mode is hydrating (prevents wrong-mode flash)', () => {
    // Even with a resolved-looking mode, isLoading wins — we must not render the
    // mode-gated view until the server mode is known.
    expect(resolveContentViewState(true, 'autopilot')).toEqual({
      kind: 'loading',
    });
    expect(resolveContentViewState(true, 'manual')).toEqual({
      kind: 'loading',
    });
  });

  it('returns the ready view carrying the effective mode once loaded', () => {
    const modes: ContentAutomationMode[] = ['manual', 'copilot', 'autopilot'];
    for (const mode of modes) {
      expect(resolveContentViewState(false, mode)).toEqual({
        kind: 'ready',
        mode,
      });
    }
  });

  it('defaults to copilot-ready when loaded (D026 default flows through unchanged)', () => {
    // The helper is mode-agnostic; it must faithfully pass whatever mode the
    // keystone resolved (copilot is the D026 default for non-enterprise).
    expect(resolveContentViewState(false, 'copilot')).toEqual({
      kind: 'ready',
      mode: 'copilot',
    });
  });
});
