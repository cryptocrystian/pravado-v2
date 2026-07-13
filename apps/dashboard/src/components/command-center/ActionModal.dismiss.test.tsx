/**
 * PR-5b — ActionModal additive Dismiss affordance.
 *
 * The canon action model is execute + dismiss; the modal is the decision surface.
 * PR-5b adds an OPTIONAL `onDismiss` prop + Dismiss button ([Dismiss | Execute |
 * Close]) without rewriting the modal. These tests pin the additive contract:
 * the button renders only when wired, fires onDismiss, and Execute still fires
 * onPrimaryAction. The Edit deep-link handoff ("modify") is verified as-built.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ActionModal } from './ActionModal';
import type { ActionItem } from './types';

function makeAction(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'prop-1',
    pillar: 'pr',
    type: 'proposal',
    priority: 'high',
    title: 'Pitch FreightWaves on Q4 logistics',
    summary: 'A strong pitch window is open.',
    why: 'Coverage gap detected against a competitor.',
    recommended_next_step: 'Draft the pitch this week.',
    signals: [],
    deep_link: { label: 'Open in PR', href: '/app/pr/pitches' },
    controls: ['edit'],
    confidence: 0.9,
    impact: 0.8,
    mode: 'copilot',
    gate: { required: false, reason: null, min_plan: null },
    cta: { primary: 'Execute', secondary: 'Review' },
    updated_at: '2026-07-13T00:00:00.000Z',
    ...overrides,
  };
}

describe('ActionModal — additive Dismiss (PR-5b)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders the Dismiss button only when onDismiss is provided', () => {
    const { rerender } = render(
      <ActionModal
        action={makeAction()}
        isOpen
        onClose={() => {}}
        onPrimaryAction={() => {}}
      />
    );
    // Backward-compatible: no onDismiss → no Dismiss button.
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();

    rerender(
      <ActionModal
        action={makeAction()}
        isOpen
        onClose={() => {}}
        onPrimaryAction={() => {}}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('fires onDismiss / onPrimaryAction on the respective buttons', () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    const action = makeAction();
    render(
      <ActionModal
        action={action}
        isOpen
        onClose={() => {}}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));
    expect(onPrimaryAction).toHaveBeenCalledWith(action);
  });

  it('disables Dismiss while an execute is in flight', () => {
    render(
      <ActionModal
        action={makeAction()}
        isOpen
        onClose={() => {}}
        onPrimaryAction={() => {}}
        onDismiss={() => {}}
        executionState="executing"
      />
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDisabled();
  });

  it('renders the Edit deep-link handoff ("modify") with the proposal href', () => {
    render(
      <ActionModal
        action={makeAction({
          controls: ['edit'],
          deep_link: { label: 'Open in PR', href: '/app/pr/pitches' },
        })}
        isOpen
        onClose={() => {}}
        onPrimaryAction={() => {}}
      />
    );
    // The Edit control is an anchor (navigation, no PATCH).
    const editLink = screen.getByRole('link', { name: 'Edit' });
    expect(editLink).toHaveAttribute('href', '/app/pr/pitches');
  });
});
