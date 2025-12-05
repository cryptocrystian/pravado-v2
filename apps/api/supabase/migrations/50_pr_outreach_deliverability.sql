/**
 * Migration 50: PR Outreach Email Deliverability & Engagement Analytics (Sprint S45)
 *
 * Creates the schema for email deliverability tracking and engagement analytics:
 * - pr_outreach_email_messages: Individual email tracking
 * - pr_outreach_engagement_metrics: Aggregated journalist engagement metrics
 */

-- =============================================
-- Table: pr_outreach_email_messages
-- =============================================
CREATE TABLE IF NOT EXISTS pr_outreach_email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Relationship
  run_id UUID NOT NULL REFERENCES pr_outreach_runs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES pr_outreach_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  journalist_id UUID NOT NULL REFERENCES journalists(id) ON DELETE CASCADE,

  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,

  -- Provider tracking
  provider_message_id TEXT, -- External message ID from email provider
  send_status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | bounced | complained | failed

  -- Engagement timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,

  -- Raw data
  raw_event JSONB DEFAULT '{}', -- Raw provider event data
  metadata JSONB DEFAULT '{}', -- Additional tracking metadata

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CHECK (send_status IN ('pending', 'sent', 'bounced', 'complained', 'failed'))
);

-- Indexes
CREATE INDEX idx_pr_outreach_email_messages_org_id ON pr_outreach_email_messages(org_id);
CREATE INDEX idx_pr_outreach_email_messages_run_id ON pr_outreach_email_messages(run_id);
CREATE INDEX idx_pr_outreach_email_messages_sequence_id ON pr_outreach_email_messages(sequence_id);
CREATE INDEX idx_pr_outreach_email_messages_journalist_id ON pr_outreach_email_messages(journalist_id);
CREATE INDEX idx_pr_outreach_email_messages_provider_message_id ON pr_outreach_email_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_pr_outreach_email_messages_send_status ON pr_outreach_email_messages(send_status);
CREATE INDEX idx_pr_outreach_email_messages_sent_at ON pr_outreach_email_messages(sent_at DESC) WHERE sent_at IS NOT NULL;

-- =============================================
-- Table: pr_outreach_engagement_metrics
-- =============================================
CREATE TABLE IF NOT EXISTS pr_outreach_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalists(id) ON DELETE CASCADE,

  -- Email counts
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_clicked INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,
  total_bounced INTEGER NOT NULL DEFAULT 0,
  total_complained INTEGER NOT NULL DEFAULT 0,

  -- Engagement score
  -- Formula: (open_rate * 0.2) + (click_rate * 0.4) + (reply_rate * 0.3) - (bounce_rate * 0.3)
  engagement_score FLOAT NOT NULL DEFAULT 0.0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(org_id, journalist_id)
);

-- Indexes
CREATE INDEX idx_pr_outreach_engagement_metrics_org_id ON pr_outreach_engagement_metrics(org_id);
CREATE INDEX idx_pr_outreach_engagement_metrics_journalist_id ON pr_outreach_engagement_metrics(journalist_id);
CREATE INDEX idx_pr_outreach_engagement_metrics_engagement_score ON pr_outreach_engagement_metrics(engagement_score DESC);

-- =============================================
-- RLS Policies
-- =============================================

-- pr_outreach_email_messages
ALTER TABLE pr_outreach_email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_outreach_email_messages_org_isolation ON pr_outreach_email_messages
  FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- pr_outreach_engagement_metrics
ALTER TABLE pr_outreach_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY pr_outreach_engagement_metrics_org_isolation ON pr_outreach_engagement_metrics
  FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- =============================================
-- Updated_at triggers
-- =============================================

CREATE TRIGGER set_pr_outreach_email_messages_updated_at
  BEFORE UPDATE ON pr_outreach_email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_pr_outreach_engagement_metrics_updated_at
  BEFORE UPDATE ON pr_outreach_engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Helper Functions
-- =============================================

/**
 * Function: calculate_engagement_score
 * Calculates engagement score for a journalist
 */
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_total_sent INTEGER,
  p_total_opened INTEGER,
  p_total_clicked INTEGER,
  p_total_replied INTEGER,
  p_total_bounced INTEGER
) RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  v_open_rate FLOAT;
  v_click_rate FLOAT;
  v_reply_rate FLOAT;
  v_bounce_rate FLOAT;
  v_score FLOAT;
BEGIN
  -- Avoid division by zero
  IF p_total_sent = 0 THEN
    RETURN 0.0;
  END IF;

  -- Calculate rates
  v_open_rate := p_total_opened::FLOAT / p_total_sent::FLOAT;
  v_click_rate := p_total_clicked::FLOAT / p_total_sent::FLOAT;
  v_reply_rate := p_total_replied::FLOAT / p_total_sent::FLOAT;
  v_bounce_rate := p_total_bounced::FLOAT / p_total_sent::FLOAT;

  -- Calculate score
  -- Formula: (open_rate * 0.2) + (click_rate * 0.4) + (reply_rate * 0.3) - (bounce_rate * 0.3)
  v_score := (v_open_rate * 0.2) + (v_click_rate * 0.4) + (v_reply_rate * 0.3) - (v_bounce_rate * 0.3);

  -- Clamp between 0 and 1
  IF v_score < 0.0 THEN
    v_score := 0.0;
  ELSIF v_score > 1.0 THEN
    v_score := 1.0;
  END IF;

  RETURN v_score;
END;
$$;

/**
 * Function: update_journalist_engagement_metrics
 * Updates engagement metrics for a journalist after an event
 */
CREATE OR REPLACE FUNCTION update_journalist_engagement_metrics(
  p_org_id UUID,
  p_journalist_id UUID
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_sent INTEGER;
  v_total_opened INTEGER;
  v_total_clicked INTEGER;
  v_total_replied INTEGER;
  v_total_bounced INTEGER;
  v_total_complained INTEGER;
  v_score FLOAT;
BEGIN
  -- Count metrics from email_messages
  SELECT
    COUNT(*) FILTER (WHERE sent_at IS NOT NULL),
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
    COUNT(*) FILTER (WHERE send_status = 'bounced'),
    COUNT(*) FILTER (WHERE send_status = 'complained')
  INTO
    v_total_sent,
    v_total_opened,
    v_total_clicked,
    v_total_bounced,
    v_total_complained
  FROM pr_outreach_email_messages
  WHERE org_id = p_org_id AND journalist_id = p_journalist_id;

  -- Count replies from runs
  SELECT COUNT(*)
  INTO v_total_replied
  FROM pr_outreach_runs
  WHERE org_id = p_org_id AND journalist_id = p_journalist_id AND replied_at IS NOT NULL;

  -- Calculate score
  v_score := calculate_engagement_score(
    v_total_sent,
    v_total_opened,
    v_total_clicked,
    v_total_replied,
    v_total_bounced
  );

  -- Upsert metrics
  INSERT INTO pr_outreach_engagement_metrics (
    org_id,
    journalist_id,
    total_sent,
    total_opened,
    total_clicked,
    total_replied,
    total_bounced,
    total_complained,
    engagement_score
  ) VALUES (
    p_org_id,
    p_journalist_id,
    v_total_sent,
    v_total_opened,
    v_total_clicked,
    v_total_replied,
    v_total_bounced,
    v_total_complained,
    v_score
  )
  ON CONFLICT (org_id, journalist_id) DO UPDATE SET
    total_sent = EXCLUDED.total_sent,
    total_opened = EXCLUDED.total_opened,
    total_clicked = EXCLUDED.total_clicked,
    total_replied = EXCLUDED.total_replied,
    total_bounced = EXCLUDED.total_bounced,
    total_complained = EXCLUDED.total_complained,
    engagement_score = EXCLUDED.engagement_score,
    updated_at = now();
END;
$$;

/**
 * Function: get_deliverability_summary
 * Returns aggregated deliverability stats for an org
 */
CREATE OR REPLACE FUNCTION get_deliverability_summary(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_messages', COUNT(*),
    'total_sent', COUNT(*) FILTER (WHERE sent_at IS NOT NULL),
    'total_delivered', COUNT(*) FILTER (WHERE delivered_at IS NOT NULL),
    'total_opened', COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
    'total_clicked', COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
    'total_bounced', COUNT(*) FILTER (WHERE bounced_at IS NOT NULL),
    'total_complained', COUNT(*) FILTER (WHERE complained_at IS NOT NULL),
    'total_failed', COUNT(*) FILTER (WHERE send_status = 'failed'),
    'delivery_rate', CASE
      WHEN COUNT(*) FILTER (WHERE sent_at IS NOT NULL) > 0
      THEN (COUNT(*) FILTER (WHERE delivered_at IS NOT NULL)::FLOAT / COUNT(*) FILTER (WHERE sent_at IS NOT NULL)::FLOAT)
      ELSE 0.0
    END,
    'open_rate', CASE
      WHEN COUNT(*) FILTER (WHERE sent_at IS NOT NULL) > 0
      THEN (COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::FLOAT / COUNT(*) FILTER (WHERE sent_at IS NOT NULL)::FLOAT)
      ELSE 0.0
    END,
    'click_rate', CASE
      WHEN COUNT(*) FILTER (WHERE sent_at IS NOT NULL) > 0
      THEN (COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::FLOAT / COUNT(*) FILTER (WHERE sent_at IS NOT NULL)::FLOAT)
      ELSE 0.0
    END,
    'bounce_rate', CASE
      WHEN COUNT(*) FILTER (WHERE sent_at IS NOT NULL) > 0
      THEN (COUNT(*) FILTER (WHERE bounced_at IS NOT NULL)::FLOAT / COUNT(*) FILTER (WHERE sent_at IS NOT NULL)::FLOAT)
      ELSE 0.0
    END
  ) INTO v_summary
  FROM pr_outreach_email_messages
  WHERE org_id = p_org_id;

  RETURN v_summary;
END;
$$;
