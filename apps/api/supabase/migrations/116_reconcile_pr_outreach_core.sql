-- Migration 116: Reconcile the PR Outreach core schema (prod drift repair)
--
-- Migrations 49 & 50 (the PR outreach engine tables) were never fully applied to
-- prod — an end-to-end test on 2026-08-12 revealed `pr_outreach_sequences`,
-- `pr_outreach_sequence_steps`, `pr_outreach_runs`, `pr_outreach_events`, and
-- `pr_outreach_email_messages` all MISSING, while `pr_outreach_engagement_metrics`
-- and newer migrations (112 pr_pitch_reviews, 115 reply-capture) WERE present.
-- The prod migration history was applied piecemeal, so this migration is a
-- fully-idempotent reconciliation that creates ONLY the missing objects.
--
-- Deviations from the original 49/50 DDL, both deliberate:
--   1. `pr_outreach_sequences.pitch_id` drops its FK to `pr_generated_pitches`
--      (that table is ALSO absent from prod — a separate feature). The column is
--      kept (nullable UUID) so the code still writes it; referential integrity to
--      the pitch-generation table can be re-added if/when that schema lands.
--   2. `pr_outreach_engagement_metrics` and its indexes/policy/trigger are NOT
--      recreated (already present) — only the engagement FUNCTIONS are refreshed.
--
-- Idempotent + transactional: CREATE TABLE/INDEX IF NOT EXISTS, DROP POLICY/
-- TRIGGER IF EXISTS before CREATE, CREATE OR REPLACE FUNCTION. Safe to re-run.

BEGIN;

-- ============================================================================
-- pr_outreach_sequences  (49; pitch_id FK dropped — see note 1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pr_outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  journalist_ids UUID[] DEFAULT '{}',
  outlet_ids UUID[] DEFAULT '{}',
  beat_filter TEXT[],
  tier_filter TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_runs_per_day INTEGER DEFAULT 50,
  stop_on_reply BOOLEAN DEFAULT true,
  pitch_id UUID, -- FK to pr_generated_pitches intentionally omitted (table absent in prod)
  press_release_id UUID REFERENCES pr_generated_releases(id) ON DELETE SET NULL,
  total_runs INTEGER NOT NULL DEFAULT 0,
  completed_runs INTEGER NOT NULL DEFAULT 0,
  active_runs INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_org_id ON pr_outreach_sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_is_active ON pr_outreach_sequences(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_pitch_id ON pr_outreach_sequences(pitch_id) WHERE pitch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_press_release_id ON pr_outreach_sequences(press_release_id) WHERE press_release_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_journalist_ids ON pr_outreach_sequences USING GIN(journalist_ids);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_outlet_ids ON pr_outreach_sequences USING GIN(outlet_ids);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_beat_filter ON pr_outreach_sequences USING GIN(beat_filter);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequences_tier_filter ON pr_outreach_sequences USING GIN(tier_filter);

-- ============================================================================
-- pr_outreach_sequence_steps  (49)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pr_outreach_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  template_variables JSONB DEFAULT '{}',
  use_llm_generation BOOLEAN DEFAULT false,
  llm_prompt TEXT,
  llm_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_number)
);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequence_steps_sequence_id ON pr_outreach_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_sequence_steps_step_number ON pr_outreach_sequence_steps(sequence_id, step_number);

-- ============================================================================
-- pr_outreach_runs  (49)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pr_outreach_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalists(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  current_step_number INTEGER NOT NULL DEFAULT 1,
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT,
  total_steps_sent INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  reply_step_number INTEGER,
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, journalist_id)
);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_runs_org_id ON pr_outreach_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_runs_sequence_id ON pr_outreach_runs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_runs_journalist_id ON pr_outreach_runs(journalist_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_runs_status ON pr_outreach_runs(status);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_runs_next_step_at ON pr_outreach_runs(next_step_at) WHERE next_step_at IS NOT NULL AND status = 'running';

-- ============================================================================
-- pr_outreach_events  (49)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pr_outreach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES pr_outreach_runs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES pr_outreach_sequence_steps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  email_subject TEXT,
  email_body TEXT,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (event_type IN ('sent', 'opened', 'clicked', 'replied', 'bounced', 'failed'))
);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_events_org_id ON pr_outreach_events(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_events_run_id ON pr_outreach_events(run_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_events_sequence_id ON pr_outreach_events(sequence_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_events_step_id ON pr_outreach_events(step_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_events_event_type ON pr_outreach_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_events_created_at ON pr_outreach_events(created_at DESC);

-- ============================================================================
-- pr_outreach_email_messages  (50)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pr_outreach_email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES pr_outreach_runs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  journalist_id UUID NOT NULL REFERENCES journalists(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  provider_message_id TEXT,
  send_status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  raw_event JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (send_status IN ('pending', 'sent', 'bounced', 'complained', 'failed'))
);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_org_id ON pr_outreach_email_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_run_id ON pr_outreach_email_messages(run_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_sequence_id ON pr_outreach_email_messages(sequence_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_journalist_id ON pr_outreach_email_messages(journalist_id);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_provider_message_id ON pr_outreach_email_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_send_status ON pr_outreach_email_messages(send_status);
CREATE INDEX IF NOT EXISTS idx_pr_outreach_email_messages_sent_at ON pr_outreach_email_messages(sent_at DESC) WHERE sent_at IS NOT NULL;

-- ============================================================================
-- RLS (matches 49/50: org isolation via user_orgs; service role bypasses)
-- ============================================================================
ALTER TABLE pr_outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_outreach_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_outreach_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_outreach_email_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_outreach_sequences_org_isolation ON pr_outreach_sequences;
CREATE POLICY pr_outreach_sequences_org_isolation ON pr_outreach_sequences
  FOR ALL USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_outreach_sequence_steps_org_isolation ON pr_outreach_sequence_steps;
CREATE POLICY pr_outreach_sequence_steps_org_isolation ON pr_outreach_sequence_steps
  FOR ALL USING (sequence_id IN (SELECT id FROM pr_outreach_sequences WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS pr_outreach_runs_org_isolation ON pr_outreach_runs;
CREATE POLICY pr_outreach_runs_org_isolation ON pr_outreach_runs
  FOR ALL USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_outreach_events_org_isolation ON pr_outreach_events;
CREATE POLICY pr_outreach_events_org_isolation ON pr_outreach_events
  FOR ALL USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_outreach_email_messages_org_isolation ON pr_outreach_email_messages;
CREATE POLICY pr_outreach_email_messages_org_isolation ON pr_outreach_email_messages
  FOR ALL USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- ============================================================================
-- updated_at triggers (drop-then-create for idempotency)
-- ============================================================================
DROP TRIGGER IF EXISTS set_pr_outreach_sequences_updated_at ON pr_outreach_sequences;
CREATE TRIGGER set_pr_outreach_sequences_updated_at BEFORE UPDATE ON pr_outreach_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_pr_outreach_sequence_steps_updated_at ON pr_outreach_sequence_steps;
CREATE TRIGGER set_pr_outreach_sequence_steps_updated_at BEFORE UPDATE ON pr_outreach_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_pr_outreach_runs_updated_at ON pr_outreach_runs;
CREATE TRIGGER set_pr_outreach_runs_updated_at BEFORE UPDATE ON pr_outreach_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_pr_outreach_email_messages_updated_at ON pr_outreach_email_messages;
CREATE TRIGGER set_pr_outreach_email_messages_updated_at BEFORE UPDATE ON pr_outreach_email_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper functions (CREATE OR REPLACE — idempotent). engagement_metrics table
-- itself is untouched (already present).
-- ============================================================================
CREATE OR REPLACE FUNCTION get_outreach_stats(p_org_id UUID, p_sequence_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_sequences', COUNT(DISTINCT s.id),
    'active_sequences', COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true),
    'total_runs', COALESCE(SUM(s.total_runs), 0),
    'active_runs', COALESCE(SUM(s.active_runs), 0),
    'completed_runs', COALESCE(SUM(s.completed_runs), 0),
    'total_emails_sent', (SELECT COUNT(*) FROM pr_outreach_events e WHERE e.org_id = p_org_id AND e.event_type = 'sent' AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)),
    'total_opens', (SELECT COUNT(*) FROM pr_outreach_events e WHERE e.org_id = p_org_id AND e.event_type = 'opened' AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)),
    'total_clicks', (SELECT COUNT(*) FROM pr_outreach_events e WHERE e.org_id = p_org_id AND e.event_type = 'clicked' AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)),
    'total_replies', (SELECT COUNT(*) FROM pr_outreach_events e WHERE e.org_id = p_org_id AND e.event_type = 'replied' AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id))
  ) INTO v_stats
  FROM pr_outreach_sequences s
  WHERE s.org_id = p_org_id AND (p_sequence_id IS NULL OR s.id = p_sequence_id);
  RETURN v_stats;
END; $$;

COMMIT;
