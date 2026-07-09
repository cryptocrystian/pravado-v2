/**
 * PR-2 — Content surface view-state resolution (pure, testable without a React
 * harness).
 *
 * The Content surface renders three-mode-aware content via ContentOverviewView
 * (gated on the per-pillar mode from useMode('content')). On first paint the
 * mode is still hydrating from the server; rendering the mode-gated view then
 * would flash the wrong mode (MODE_UX_ARCHITECTURE §4D warns against instant
 * wrong-state swaps). This helper decides whether to show a loading placeholder
 * or the mode-ready view, keeping that decision unit-testable.
 *
 * NOTE: the on-mode-CHANGE re-evaluation transition (§4D/§6A) is deliberately
 * NOT handled here — that is PR-3 scope. This covers first-paint hydration only.
 */

export type ContentAutomationMode = 'manual' | 'copilot' | 'autopilot';

export type ContentViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; mode: ContentAutomationMode };

/**
 * Resolve what the Content surface body should render.
 * @param isLoading — true while useMode('content') is hydrating from the server.
 * @param mode — the effective per-pillar mode (only meaningful once loaded).
 */
export function resolveContentViewState(
  isLoading: boolean,
  mode: ContentAutomationMode
): ContentViewState {
  if (isLoading) return { kind: 'loading' };
  return { kind: 'ready', mode };
}
