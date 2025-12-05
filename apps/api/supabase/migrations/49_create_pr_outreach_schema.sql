/**
 * Migration 49: PR Outreach Engine Schema (Sprint S44)
 *
 * Creates the schema for automated journalist outreach:
 * - pr_outreach_sequences: Outreach campaigns with multi-step sequences
 * - pr_outreach_sequence_steps: Individual steps in a sequence
 * - pr_outreach_runs: Execution instances of sequences
 * - pr_outreach_events: Tracking events (sent/opened/clicked/replied/bounced)
 */

-- =============================================
-- Table: pr_outreach_sequences
-- =============================================
CREATE TABLE IF NOT EXISTS pr_outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Sequence metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Targeting
  journalist_ids UUID[] DEFAULT '{}', -- Specific journalists to target
  outlet_ids UUID[] DEFAULT '{}',     -- Specific outlets to target
  beat_filter TEXT[],                  -- Filter by journalist beats
  tier_filter TEXT[],                  -- Filter by outlet tiers (tier_1, tier_2, tier_3)

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Execution settings
  max_runs_per_day INTEGER DEFAULT 50,  -- Rate limiting
  stop_on_reply BOOLEAN DEFAULT true,   -- Stop sequence if journalist replies

  -- Associated content
  pitch_id UUID REFERENCES pr_generated_pitches(id) ON DELETE SET NULL,
  press_release_id UUID REFERENCES pr_generated_releases(id) ON DELETE SET NULL,

  -- Stats (denormalized for quick access)
  total_runs INTEGER NOT NULL DEFAULT 0,
  completed_runs INTEGER NOT NULL DEFAULT 0,
  active_runs INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pr_outreach_sequences_org_id ON pr_outreach_sequences(org_id);
CREATE INDEX idx_pr_outreach_sequences_is_active ON pr_outreach_sequences(is_active) WHERE is_active = true;
CREATE INDEX idx_pr_outreach_sequences_pitch_id ON pr_outreach_sequences(pitch_id) WHERE pitch_id IS NOT NULL;
CREATE INDEX idx_pr_outreach_sequences_press_release_id ON pr_outreach_sequences(press_release_id) WHERE press_release_id IS NOT NULL;

-- GIN indexes for array columns
CREATE INDEX idx_pr_outreach_sequences_journalist_ids ON pr_outreach_sequences USING GIN(journalist_ids);
CREATE INDEX idx_pr_outreach_sequences_outlet_ids ON pr_outreach_sequences USING GIN(outlet_ids);
CREATE INDEX idx_pr_outreach_sequences_beat_filter ON pr_outreach_sequences USING GIN(beat_filter);
CREATE INDEX idx_pr_outreach_sequences_tier_filter ON pr_outreach_sequences USING GIN(tier_filter);

-- =============================================
-- Table: pr_outreach_sequence_steps
-- =============================================
CREATE TABLE IF NOT EXISTS pr_outreach_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,

  -- Step configuration
  step_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  delay_hours INTEGER NOT NULL DEFAULT 0, -- Delay from previous step (0 for first step)

  -- Email template
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,

  -- Template variables (JSONB for flexible data)
  -- Examples: {"journalist_name": "{{journalist.name}}", "outlet": "{{outlet.name}}"}
  template_variables JSONB DEFAULT '{}',

  -- LLM generation settings
  use_llm_generation BOOLEAN DEFAULT false,
  llm_prompt TEXT,
  llm_model TEXT, -- e.g., "gpt-4", "claude-3-sonnet"

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(sequence_id, step_number)
);

-- Indexes
CREATE INDEX idx_pr_outreach_sequence_steps_sequence_id ON pr_outreach_sequence_steps(sequence_id);
CREATE INDEX idx_pr_outreach_sequence_steps_step_number ON pr_outreach_sequence_steps(sequence_id, step_number);

-- =============================================
-- Table: pr_outreach_runs
-- =============================================
CREATE TABLE IF NOT EXISTS pr_outreach_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,

  -- Target
  journalist_id UUID NOT NULL REFERENCES journalists(id) ON DELETE CASCADE,

  -- State
  status TEXT NOT NULL DEFAULT 'running', -- running | completed | failed | stopped
  current_step_number INTEGER NOT NULL DEFAULT 1,

  -- Progress tracking
  next_step_at TIMESTAMPTZ, -- When to send next step
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT, -- manual_stop | journalist_replied | error | sequence_deleted

  -- Results
  total_steps_sent INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ, -- When journalist replied
  reply_step_number INTEGER, -- Which step got the reply

  -- Error tracking
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(sequence_id, journalist_id) -- One run per journalist per sequence
);

-- Indexes
CREATE INDEX idx_pr_outreach_runs_org_id ON pr_outreach_runs(org_id);
CREATE INDEX idx_pr_outreach_runs_sequence_id ON pr_outreach_runs(sequence_id);
CREATE INDEX idx_pr_outreach_runs_journalist_id ON pr_outreach_runs(journalist_id);
CREATE INDEX idx_pr_outreach_runs_status ON pr_outreach_runs(status);
CREATE INDEX idx_pr_outreach_runs_next_step_at ON pr_outreach_runs(next_step_at) WHERE next_step_at IS NOT NULL AND status = 'running';

-- =============================================
-- Table: pr_outreach_events
-- =============================================
CREATE TABLE IF NOT EXISTS pr_outreach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES pr_outreach_runs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES pr_outreach_sequence_steps(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- sent | opened | clicked | replied | bounced | failed
  step_number INTEGER NOT NULL,

  -- Email details
  email_subject TEXT,
  email_body TEXT,
  recipient_email TEXT NOT NULL,

  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Additional metadata
  metadata JSONB DEFAULT '{}', -- Click URLs, bounce reasons, error details, etc.

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CHECK (event_type IN ('sent', 'opened', 'clicked', 'replied', 'bounced', 'failed'))
);

-- Indexes
CREATE INDEX idx_pr_outreach_events_org_id ON pr_outreach_events(org_id);
CREATE INDEX idx_pr_outreach_events_run_id ON pr_outreach_events(run_id);
CREATE INDEX idx_pr_outreach_events_sequence_id ON pr_outreach_events(sequence_id);
CREATE INDEX idx_pr_outreach_events_step_id ON pr_outreach_events(step_id);
CREATE INDEX idx_pr_outreach_events_event_type ON pr_outreach_events(event_type);
CREATE INDEX idx_pr_outreach_events_created_at ON pr_outreach_events(created_at DESC);

-- =============================================
-- RLS Policies
-- =============================================

-- pr_outreach_sequences
ALTER TABLE pr_outreach_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_outreach_sequences_org_isolation ON pr_outreach_sequences
  FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- pr_outreach_sequence_steps
ALTER TABLE pr_outreach_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_outreach_sequence_steps_org_isolation ON pr_outreach_sequence_steps
  FOR ALL
  USING (sequence_id IN (SELECT id FROM pr_outreach_sequences WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())));

-- pr_outreach_runs
ALTER TABLE pr_outreach_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_outreach_runs_org_isolation ON pr_outreach_runs
  FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- pr_outreach_events
ALTER TABLE pr_outreach_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_outreach_events_org_isolation ON pr_outreach_events
  FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- =============================================
-- Updated_at triggers
-- =============================================

CREATE TRIGGER set_pr_outreach_sequences_updated_at
  BEFORE UPDATE ON pr_outreach_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_pr_outreach_sequence_steps_updated_at
  BEFORE UPDATE ON pr_outreach_sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_pr_outreach_runs_updated_at
  BEFORE UPDATE ON pr_outreach_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Helper Functions
-- =============================================

/**
 * Function: get_outreach_stats
 * Returns aggregated statistics for outreach sequences
 */
CREATE OR REPLACE FUNCTION get_outreach_stats(p_org_id UUID, p_sequence_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_sequences', COUNT(DISTINCT s.id),
    'active_sequences', COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true),
    'total_runs', COALESCE(SUM(s.total_runs), 0),
    'active_runs', COALESCE(SUM(s.active_runs), 0),
    'completed_runs', COALESCE(SUM(s.completed_runs), 0),
    'total_emails_sent', (
      SELECT COUNT(*) FROM pr_outreach_events e
      WHERE e.org_id = p_org_id
        AND e.event_type = 'sent'
        AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)
    ),
    'total_opens', (
      SELECT COUNT(*) FROM pr_outreach_events e
      WHERE e.org_id = p_org_id
        AND e.event_type = 'opened'
        AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)
    ),
    'total_clicks', (
      SELECT COUNT(*) FROM pr_outreach_events e
      WHERE e.org_id = p_org_id
        AND e.event_type = 'clicked'
        AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)
    ),
    'total_replies', (
      SELECT COUNT(*) FROM pr_outreach_events e
      WHERE e.org_id = p_org_id
        AND e.event_type = 'replied'
        AND (p_sequence_id IS NULL OR e.sequence_id = p_sequence_id)
    )
  ) INTO v_stats
  FROM pr_outreach_sequences s
  WHERE s.org_id = p_org_id
    AND (p_sequence_id IS NULL OR s.id = p_sequence_id);

  RETURN v_stats;
END;
$$;
