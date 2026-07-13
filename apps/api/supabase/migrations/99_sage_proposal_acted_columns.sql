-- PR-5a — SAGE proposal action audit columns.
--
-- Canon-mapped action model (FLAG 1 resolution): user actions are `execute`
-- (→ status 'executed') and `dismiss` (→ status 'dismissed'); no 'approved' or
-- 'modified' status. These columns record WHO acted and WHEN. No dedicated
-- sage_proposal_actions table (FLAG 3 resolution) — reasoning_trace remains the
-- generation-time audit; a richer action-feedback audit is deferred (SAGE_v2
-- §259, tracked in the feedback-loop ticket).
--
-- Non-breaking: both columns are nullable and default NULL (unacted proposals).

ALTER TABLE sage_proposals
  ADD COLUMN IF NOT EXISTS acted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS acted_at timestamptz;

COMMENT ON COLUMN sage_proposals.acted_by IS
  'User who executed/dismissed this proposal (PR-5a). NULL until acted on.';
COMMENT ON COLUMN sage_proposals.acted_at IS
  'When the proposal was executed/dismissed (PR-5a). NULL until acted on.';
