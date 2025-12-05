/**
 * Migration 60: Crisis Response & Escalation Engine V1 Schema (Sprint S55)
 *
 * Creates comprehensive crisis intelligence layer for detecting early-warning
 * signals, escalating to leadership, generating crisis briefs, recommending
 * actions, and monitoring sentiment trajectory in real time.
 *
 * Components:
 * - 8 custom enums (crisis_severity, crisis_source_system, crisis_trajectory, etc.)
 * - 8 tables with full RLS policies
 * - 15+ indexes for query optimization
 * - Auto-update triggers
 * - Severity auto-scoring function
 *
 * Integration Points:
 * - S38: Press Releases
 * - S39: Pitch Engine
 * - S40: Media Monitoring
 * - S41: Media Crawling
 * - S43: Media Alerts
 * - S47: Media Lists
 * - S49: Relationship Timeline
 * - S52: Media Performance
 * - S53: Competitive Intelligence
 * - S54: Media Briefings
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Crisis severity levels
CREATE TYPE crisis_severity AS ENUM (
  'low',           -- Minor issue, monitoring only
  'medium',        -- Moderate concern, needs attention
  'high',          -- Significant issue, immediate response needed
  'critical',      -- Major crisis, all hands on deck
  'severe'         -- Existential threat, executive escalation
);

-- Source systems that can trigger crisis signals
CREATE TYPE crisis_source_system AS ENUM (
  'media_monitoring',      -- S40 monitoring alerts
  'media_crawling',        -- S41 crawled content
  'media_alerts',          -- S43 smart signals
  'journalist_timeline',   -- S49 relationship events
  'media_performance',     -- S52 performance metrics
  'competitive_intel',     -- S53 competitor activity
  'media_briefing',        -- S54 briefing insights
  'manual_entry',          -- User-reported signals
  'external_api',          -- Third-party integrations
  'social_listening'       -- Social media monitoring
);

-- Crisis trajectory direction
CREATE TYPE crisis_trajectory AS ENUM (
  'improving',       -- Situation getting better
  'stable',          -- No significant change
  'worsening',       -- Situation deteriorating
  'critical',        -- Rapid deterioration
  'resolved',        -- Crisis contained/resolved
  'unknown'          -- Insufficient data
);

-- Crisis propagation level
CREATE TYPE crisis_propagation_level AS ENUM (
  'contained',       -- Single outlet or small reach
  'spreading',       -- Multiple outlets, growing
  'viral',           -- Rapid cross-platform spread
  'mainstream',      -- Major news coverage
  'saturated'        -- Ubiquitous coverage
);

-- Crisis brief format types
CREATE TYPE crisis_brief_format AS ENUM (
  'executive_summary',     -- Quick overview for leadership
  'full_brief',            -- Comprehensive crisis report
  'situation_report',      -- Status update format
  'stakeholder_brief',     -- External stakeholder focus
  'media_response',        -- Media interaction prep
  'legal_brief'            -- Legal team focus
);

-- Crisis brief section types
CREATE TYPE crisis_brief_section_type AS ENUM (
  'situation_overview',
  'timeline_of_events',
  'media_landscape',
  'key_stakeholders',
  'sentiment_analysis',
  'propagation_analysis',
  'recommended_actions',
  'talking_points',
  'qa_preparation',
  'risk_assessment',
  'mitigation_status',
  'next_steps'
);

-- Crisis action types
CREATE TYPE crisis_action_type AS ENUM (
  'statement_release',      -- Issue public statement
  'media_outreach',         -- Proactive journalist contact
  'social_response',        -- Social media response
  'internal_comms',         -- Internal communication
  'stakeholder_briefing',   -- Stakeholder update
  'legal_review',           -- Legal team involvement
  'executive_escalation',   -- C-suite notification
  'monitoring_increase',    -- Increase monitoring frequency
  'content_creation',       -- Create response content
  'press_conference',       -- Organize press event
  'interview_prep',         -- Prepare for media interviews
  'fact_check',             -- Verify facts/claims
  'third_party_outreach',   -- Contact allies/partners
  'no_comment',             -- Strategic silence
  'other'                   -- Custom action
);

-- Crisis action status
CREATE TYPE crisis_action_status AS ENUM (
  'recommended',     -- AI or rule-suggested
  'approved',        -- Approved for execution
  'in_progress',     -- Currently being executed
  'completed',       -- Successfully completed
  'deferred',        -- Postponed
  'rejected',        -- Not approved
  'failed'           -- Attempted but failed
);

-- ============================================================================
-- TABLE 1: crisis_events
-- Stores raw detected events that may indicate a crisis
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Event Identity
  title TEXT NOT NULL,
  description TEXT,
  source_system crisis_source_system NOT NULL,
  source_id TEXT,                              -- ID in source system
  source_url TEXT,                             -- URL to source

  -- Classification
  event_type TEXT NOT NULL,                    -- Specific event type from source
  keywords TEXT[] NOT NULL DEFAULT '{}',       -- Matched keywords
  topics TEXT[] NOT NULL DEFAULT '{}',         -- Detected topics

  -- Metrics
  sentiment_score DECIMAL(5,4),                -- -1 to 1
  magnitude_score DECIMAL(5,2),                -- 0 to 100 (impact estimate)
  confidence_score DECIMAL(5,4),               -- 0 to 1
  estimated_reach BIGINT,                      -- Potential audience
  velocity_score DECIMAL(5,2),                 -- Rate of spread

  -- Source Details (JSONB for flexibility)
  source_metadata JSONB DEFAULT '{}',          -- Source-specific data
  entities_mentioned JSONB DEFAULT '[]',       -- People, orgs, brands
  outlets_involved TEXT[] DEFAULT '{}',        -- Media outlets
  journalists_involved TEXT[] DEFAULT '{}',    -- Journalist IDs

  -- Status
  is_processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  linked_incident_id UUID,                     -- Link to crisis_incidents
  linked_signal_id UUID,                       -- Link to crisis_signals

  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crisis_events
CREATE INDEX idx_crisis_events_org ON crisis_events(org_id);
CREATE INDEX idx_crisis_events_source ON crisis_events(source_system, source_id);
CREATE INDEX idx_crisis_events_timestamp ON crisis_events(event_timestamp DESC);
CREATE INDEX idx_crisis_events_detected ON crisis_events(detected_at DESC);
CREATE INDEX idx_crisis_events_sentiment ON crisis_events(sentiment_score);
CREATE INDEX idx_crisis_events_magnitude ON crisis_events(magnitude_score DESC);
CREATE INDEX idx_crisis_events_processed ON crisis_events(is_processed);
CREATE INDEX idx_crisis_events_incident ON crisis_events(linked_incident_id) WHERE linked_incident_id IS NOT NULL;
CREATE INDEX idx_crisis_events_keywords ON crisis_events USING GIN(keywords);
CREATE INDEX idx_crisis_events_topics ON crisis_events USING GIN(topics);

-- ============================================================================
-- TABLE 2: crisis_signals
-- Aggregated signals that indicate potential crisis
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Signal Identity
  signal_type TEXT NOT NULL,                   -- Type of signal pattern
  title TEXT NOT NULL,
  description TEXT,

  -- Classification
  severity crisis_severity NOT NULL DEFAULT 'low',
  confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.5,
  priority_score DECIMAL(5,2) NOT NULL DEFAULT 50,

  -- Detection Context
  detection_method TEXT NOT NULL,              -- Algorithm/rule used
  trigger_conditions JSONB NOT NULL DEFAULT '{}',  -- Conditions that triggered
  source_events UUID[] NOT NULL DEFAULT '{}',      -- Linked event IDs
  source_systems crisis_source_system[] NOT NULL DEFAULT '{}',

  -- Metrics
  sentiment_score DECIMAL(5,4),
  sentiment_velocity DECIMAL(5,4),             -- Rate of sentiment change
  mention_velocity DECIMAL(5,2),               -- Rate of mention increase
  estimated_impact DECIMAL(5,2),               -- Projected impact 0-100
  propagation_score DECIMAL(5,2),              -- Spread potential

  -- Time Window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_escalated BOOLEAN NOT NULL DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalated_by UUID,
  linked_incident_id UUID,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crisis_signals
CREATE INDEX idx_crisis_signals_org ON crisis_signals(org_id);
CREATE INDEX idx_crisis_signals_severity ON crisis_signals(severity);
CREATE INDEX idx_crisis_signals_active ON crisis_signals(is_active) WHERE is_active = true;
CREATE INDEX idx_crisis_signals_priority ON crisis_signals(priority_score DESC);
CREATE INDEX idx_crisis_signals_sentiment ON crisis_signals(sentiment_score);
CREATE INDEX idx_crisis_signals_window ON crisis_signals(window_start, window_end);
CREATE INDEX idx_crisis_signals_created ON crisis_signals(created_at DESC);
CREATE INDEX idx_crisis_signals_escalated ON crisis_signals(is_escalated) WHERE is_escalated = true;
CREATE INDEX idx_crisis_signals_incident ON crisis_signals(linked_incident_id) WHERE linked_incident_id IS NOT NULL;

-- ============================================================================
-- TABLE 3: crisis_incidents
-- Main incident records for active crisis management
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Incident Identity
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,                                 -- Executive summary
  incident_code TEXT,                           -- Internal reference code

  -- Classification
  severity crisis_severity NOT NULL DEFAULT 'medium',
  trajectory crisis_trajectory NOT NULL DEFAULT 'unknown',
  propagation_level crisis_propagation_level NOT NULL DEFAULT 'contained',

  -- Crisis Context
  crisis_type TEXT,                             -- Category (product, PR, legal, etc.)
  affected_products TEXT[] DEFAULT '{}',
  affected_regions TEXT[] DEFAULT '{}',
  affected_stakeholders TEXT[] DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  topics TEXT[] NOT NULL DEFAULT '{}',

  -- Linked Sources
  linked_signal_ids UUID[] NOT NULL DEFAULT '{}',
  linked_event_ids UUID[] NOT NULL DEFAULT '{}',
  linked_mention_ids UUID[] NOT NULL DEFAULT '{}',   -- S40 mentions
  linked_alert_ids UUID[] NOT NULL DEFAULT '{}',     -- S43 alerts
  linked_article_ids UUID[] NOT NULL DEFAULT '{}',   -- External articles
  linked_competitor_ids UUID[] NOT NULL DEFAULT '{}', -- S53 competitors

  -- Metrics
  sentiment_score DECIMAL(5,4),
  sentiment_trend DECIMAL(5,4),                -- Change over time
  mention_count INTEGER NOT NULL DEFAULT 0,
  estimated_reach BIGINT DEFAULT 0,
  media_value_impact DECIMAL(12,2),            -- Estimated media value at risk
  propagation_score DECIMAL(5,2),
  risk_score DECIMAL(5,2),                     -- Overall risk assessment

  -- Sentiment Windows (JSONB for time-series)
  sentiment_history JSONB DEFAULT '[]',         -- Array of {timestamp, score}
  mention_history JSONB DEFAULT '[]',           -- Array of {timestamp, count}

  -- Status
  status TEXT NOT NULL DEFAULT 'active',        -- active, contained, resolved, closed
  is_escalated BOOLEAN NOT NULL DEFAULT false,
  escalation_level INTEGER DEFAULT 0,           -- 0=none, 1=manager, 2=director, 3=vp, 4=c-suite

  -- Key Dates
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  escalated_at TIMESTAMPTZ,
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Ownership
  owner_id UUID,                                -- Primary owner
  team_ids UUID[] DEFAULT '{}',                 -- Assigned team members
  created_by UUID NOT NULL,

  -- LLM Generation
  llm_model TEXT,
  llm_generated_summary TEXT,
  llm_risk_assessment JSONB,
  llm_recommendations JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crisis_incidents
CREATE INDEX idx_crisis_incidents_org ON crisis_incidents(org_id);
CREATE INDEX idx_crisis_incidents_severity ON crisis_incidents(severity);
CREATE INDEX idx_crisis_incidents_trajectory ON crisis_incidents(trajectory);
CREATE INDEX idx_crisis_incidents_propagation ON crisis_incidents(propagation_level);
CREATE INDEX idx_crisis_incidents_status ON crisis_incidents(status);
CREATE INDEX idx_crisis_incidents_escalated ON crisis_incidents(is_escalated) WHERE is_escalated = true;
CREATE INDEX idx_crisis_incidents_escalation_level ON crisis_incidents(escalation_level) WHERE escalation_level > 0;
CREATE INDEX idx_crisis_incidents_created ON crisis_incidents(created_at DESC);
CREATE INDEX idx_crisis_incidents_first_detected ON crisis_incidents(first_detected_at DESC);
CREATE INDEX idx_crisis_incidents_sentiment ON crisis_incidents(sentiment_score);
CREATE INDEX idx_crisis_incidents_risk ON crisis_incidents(risk_score DESC);
CREATE INDEX idx_crisis_incidents_owner ON crisis_incidents(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_crisis_incidents_keywords ON crisis_incidents USING GIN(keywords);
CREATE INDEX idx_crisis_incidents_topics ON crisis_incidents USING GIN(topics);
CREATE INDEX idx_crisis_incidents_signals ON crisis_incidents USING GIN(linked_signal_ids);

-- ============================================================================
-- TABLE 4: crisis_actions
-- Actions taken or recommended for crisis response
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES crisis_incidents(id) ON DELETE CASCADE,

  -- Action Identity
  title TEXT NOT NULL,
  description TEXT,
  action_type crisis_action_type NOT NULL,
  status crisis_action_status NOT NULL DEFAULT 'recommended',

  -- Priority & Timing
  priority_score DECIMAL(5,2) NOT NULL DEFAULT 50,
  urgency TEXT,                                 -- immediate, urgent, normal, low
  due_at TIMESTAMPTZ,
  estimated_duration_mins INTEGER,

  -- Generation
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  generation_context JSONB,                     -- Context used for generation
  llm_model TEXT,
  confidence_score DECIMAL(5,4),

  -- Execution
  assigned_to UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,

  -- Outcome
  outcome TEXT,                                 -- success, partial, failed
  outcome_notes TEXT,
  impact_assessment JSONB,                      -- Post-action impact

  -- Linked Content
  linked_content_ids UUID[] DEFAULT '{}',       -- Related content (briefs, releases)
  attachments JSONB DEFAULT '[]',               -- File attachments

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Indexes for crisis_actions
CREATE INDEX idx_crisis_actions_org ON crisis_actions(org_id);
CREATE INDEX idx_crisis_actions_incident ON crisis_actions(incident_id);
CREATE INDEX idx_crisis_actions_type ON crisis_actions(action_type);
CREATE INDEX idx_crisis_actions_status ON crisis_actions(status);
CREATE INDEX idx_crisis_actions_priority ON crisis_actions(priority_score DESC);
CREATE INDEX idx_crisis_actions_due ON crisis_actions(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX idx_crisis_actions_assigned ON crisis_actions(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_crisis_actions_ai ON crisis_actions(is_ai_generated) WHERE is_ai_generated = true;
CREATE INDEX idx_crisis_actions_created ON crisis_actions(created_at DESC);

-- ============================================================================
-- TABLE 5: crisis_escalation_rules
-- Automated escalation rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Rule Identity
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,                      -- threshold, pattern, time-based

  -- Trigger Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL,
  /*
    Example conditions:
    {
      "severity_gte": "high",
      "sentiment_lte": -0.5,
      "mention_velocity_gte": 50,
      "propagation_level": ["viral", "mainstream"],
      "keywords_any": ["lawsuit", "recall"],
      "sources_any": ["media_monitoring", "competitive_intel"],
      "time_window_minutes": 60
    }
  */

  -- Actions to Take
  escalation_actions JSONB NOT NULL DEFAULT '[]',
  /*
    Example actions:
    [
      {"type": "notify", "channel": "email", "recipients": ["ceo@company.com"]},
      {"type": "create_incident", "severity": "critical"},
      {"type": "generate_brief", "format": "executive_summary"},
      {"type": "webhook", "url": "https://..."}
    ]
  */

  -- Escalation Level
  escalation_level INTEGER NOT NULL DEFAULT 1,  -- Target escalation level
  notify_channels TEXT[] DEFAULT '{}',          -- email, slack, sms, etc.
  notify_roles TEXT[] DEFAULT '{}',             -- Roles to notify
  notify_user_ids UUID[] DEFAULT '{}',          -- Specific users

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,     -- System-defined rule
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,

  -- Cooldown
  cooldown_minutes INTEGER DEFAULT 60,          -- Minimum time between triggers

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Indexes for crisis_escalation_rules
CREATE INDEX idx_crisis_rules_org ON crisis_escalation_rules(org_id);
CREATE INDEX idx_crisis_rules_active ON crisis_escalation_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_crisis_rules_type ON crisis_escalation_rules(rule_type);
CREATE INDEX idx_crisis_rules_level ON crisis_escalation_rules(escalation_level);
CREATE INDEX idx_crisis_rules_last_trigger ON crisis_escalation_rules(last_triggered_at);

-- ============================================================================
-- TABLE 6: crisis_briefs
-- Generated crisis briefings
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES crisis_incidents(id) ON DELETE CASCADE,

  -- Brief Identity
  title TEXT NOT NULL,
  subtitle TEXT,
  format crisis_brief_format NOT NULL DEFAULT 'executive_summary',
  version INTEGER NOT NULL DEFAULT 1,

  -- Content
  executive_summary TEXT,
  key_takeaways JSONB DEFAULT '[]',             -- Array of key points
  risk_assessment JSONB,                        -- Structured risk data
  recommendations JSONB DEFAULT '[]',           -- Array of recommendations

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',         -- draft, generated, reviewed, approved
  is_current BOOLEAN NOT NULL DEFAULT true,     -- Latest version flag

  -- Approval Flow
  generated_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID,

  -- Generation Metadata
  llm_model TEXT,
  llm_temperature DECIMAL(3,2),
  total_tokens_used INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  generation_context JSONB,                     -- Sources and context used

  -- Distribution
  shared_with UUID[] DEFAULT '{}',              -- Users shared with
  shared_at TIMESTAMPTZ,
  distribution_channels TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Indexes for crisis_briefs
CREATE INDEX idx_crisis_briefs_org ON crisis_briefs(org_id);
CREATE INDEX idx_crisis_briefs_incident ON crisis_briefs(incident_id);
CREATE INDEX idx_crisis_briefs_format ON crisis_briefs(format);
CREATE INDEX idx_crisis_briefs_status ON crisis_briefs(status);
CREATE INDEX idx_crisis_briefs_current ON crisis_briefs(is_current) WHERE is_current = true;
CREATE INDEX idx_crisis_briefs_created ON crisis_briefs(created_at DESC);
CREATE INDEX idx_crisis_briefs_version ON crisis_briefs(incident_id, version DESC);

-- ============================================================================
-- TABLE 7: crisis_brief_sections
-- Sections within crisis briefs
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_brief_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  brief_id UUID NOT NULL REFERENCES crisis_briefs(id) ON DELETE CASCADE,

  -- Section Identity
  section_type crisis_brief_section_type NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Content
  content TEXT,
  summary TEXT,
  bullet_points JSONB DEFAULT '[]',
  supporting_data JSONB DEFAULT '{}',
  source_references JSONB DEFAULT '[]',

  -- Generation
  is_generated BOOLEAN NOT NULL DEFAULT false,
  is_manually_edited BOOLEAN NOT NULL DEFAULT false,
  generation_prompt TEXT,
  llm_model TEXT,
  tokens_used INTEGER,
  generation_duration_ms INTEGER,

  -- Timestamps
  generated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crisis_brief_sections
CREATE INDEX idx_crisis_sections_org ON crisis_brief_sections(org_id);
CREATE INDEX idx_crisis_sections_brief ON crisis_brief_sections(brief_id);
CREATE INDEX idx_crisis_sections_type ON crisis_brief_sections(section_type);
CREATE INDEX idx_crisis_sections_order ON crisis_brief_sections(brief_id, sort_order);

-- ============================================================================
-- TABLE 8: crisis_audit_log
-- Audit trail for all crisis-related actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Context
  incident_id UUID REFERENCES crisis_incidents(id) ON DELETE SET NULL,
  user_id UUID,
  action TEXT NOT NULL,

  -- Entity
  entity_type TEXT NOT NULL,                    -- incident, action, brief, signal, rule
  entity_id UUID,

  -- Change Details
  old_value JSONB,
  new_value JSONB,
  change_summary TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crisis_audit_log
CREATE INDEX idx_crisis_audit_org ON crisis_audit_log(org_id);
CREATE INDEX idx_crisis_audit_incident ON crisis_audit_log(incident_id) WHERE incident_id IS NOT NULL;
CREATE INDEX idx_crisis_audit_user ON crisis_audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_crisis_audit_action ON crisis_audit_log(action);
CREATE INDEX idx_crisis_audit_entity ON crisis_audit_log(entity_type, entity_id);
CREATE INDEX idx_crisis_audit_created ON crisis_audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_brief_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crisis_events
CREATE POLICY "crisis_events_org_isolation" ON crisis_events
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_signals
CREATE POLICY "crisis_signals_org_isolation" ON crisis_signals
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_incidents
CREATE POLICY "crisis_incidents_org_isolation" ON crisis_incidents
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_actions
CREATE POLICY "crisis_actions_org_isolation" ON crisis_actions
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_escalation_rules
CREATE POLICY "crisis_rules_org_isolation" ON crisis_escalation_rules
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_briefs
CREATE POLICY "crisis_briefs_org_isolation" ON crisis_briefs
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_brief_sections
CREATE POLICY "crisis_sections_org_isolation" ON crisis_brief_sections
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for crisis_audit_log
CREATE POLICY "crisis_audit_org_isolation" ON crisis_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_crisis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crisis_events_updated_at
  BEFORE UPDATE ON crisis_events
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

CREATE TRIGGER crisis_signals_updated_at
  BEFORE UPDATE ON crisis_signals
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

CREATE TRIGGER crisis_incidents_updated_at
  BEFORE UPDATE ON crisis_incidents
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

CREATE TRIGGER crisis_actions_updated_at
  BEFORE UPDATE ON crisis_actions
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

CREATE TRIGGER crisis_rules_updated_at
  BEFORE UPDATE ON crisis_escalation_rules
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

CREATE TRIGGER crisis_briefs_updated_at
  BEFORE UPDATE ON crisis_briefs
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

CREATE TRIGGER crisis_sections_updated_at
  BEFORE UPDATE ON crisis_brief_sections
  FOR EACH ROW EXECUTE FUNCTION update_crisis_updated_at();

-- ============================================================================
-- SEVERITY AUTO-SCORING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_crisis_severity(
  p_sentiment_score DECIMAL,
  p_propagation_level crisis_propagation_level,
  p_mention_count INTEGER,
  p_estimated_reach BIGINT
) RETURNS crisis_severity AS $$
DECLARE
  v_score INTEGER := 0;
BEGIN
  -- Sentiment component (0-25 points)
  IF p_sentiment_score IS NOT NULL THEN
    IF p_sentiment_score <= -0.7 THEN v_score := v_score + 25;
    ELSIF p_sentiment_score <= -0.5 THEN v_score := v_score + 20;
    ELSIF p_sentiment_score <= -0.3 THEN v_score := v_score + 15;
    ELSIF p_sentiment_score <= 0 THEN v_score := v_score + 10;
    ELSE v_score := v_score + 5;
    END IF;
  END IF;

  -- Propagation component (0-25 points)
  CASE p_propagation_level
    WHEN 'saturated' THEN v_score := v_score + 25;
    WHEN 'mainstream' THEN v_score := v_score + 20;
    WHEN 'viral' THEN v_score := v_score + 15;
    WHEN 'spreading' THEN v_score := v_score + 10;
    WHEN 'contained' THEN v_score := v_score + 5;
    ELSE v_score := v_score + 0;
  END CASE;

  -- Mention count component (0-25 points)
  IF p_mention_count >= 1000 THEN v_score := v_score + 25;
  ELSIF p_mention_count >= 500 THEN v_score := v_score + 20;
  ELSIF p_mention_count >= 100 THEN v_score := v_score + 15;
  ELSIF p_mention_count >= 50 THEN v_score := v_score + 10;
  ELSIF p_mention_count >= 10 THEN v_score := v_score + 5;
  END IF;

  -- Reach component (0-25 points)
  IF p_estimated_reach >= 10000000 THEN v_score := v_score + 25;
  ELSIF p_estimated_reach >= 1000000 THEN v_score := v_score + 20;
  ELSIF p_estimated_reach >= 100000 THEN v_score := v_score + 15;
  ELSIF p_estimated_reach >= 10000 THEN v_score := v_score + 10;
  ELSIF p_estimated_reach >= 1000 THEN v_score := v_score + 5;
  END IF;

  -- Map score to severity
  IF v_score >= 80 THEN RETURN 'severe'::crisis_severity;
  ELSIF v_score >= 60 THEN RETURN 'critical'::crisis_severity;
  ELSIF v_score >= 40 THEN RETURN 'high'::crisis_severity;
  ELSIF v_score >= 20 THEN RETURN 'medium'::crisis_severity;
  ELSE RETURN 'low'::crisis_severity;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE crisis_events IS 'Raw detected events from various source systems that may indicate a crisis (Sprint S55)';
COMMENT ON TABLE crisis_signals IS 'Aggregated signals indicating potential crisis situations (Sprint S55)';
COMMENT ON TABLE crisis_incidents IS 'Main incident records for active crisis management (Sprint S55)';
COMMENT ON TABLE crisis_actions IS 'Actions taken or recommended for crisis response (Sprint S55)';
COMMENT ON TABLE crisis_escalation_rules IS 'Automated escalation rules for crisis detection (Sprint S55)';
COMMENT ON TABLE crisis_briefs IS 'Generated crisis briefings for stakeholders (Sprint S55)';
COMMENT ON TABLE crisis_brief_sections IS 'Sections within crisis briefs (Sprint S55)';
COMMENT ON TABLE crisis_audit_log IS 'Audit trail for all crisis-related actions (Sprint S55)';
COMMENT ON FUNCTION calculate_crisis_severity IS 'Calculates crisis severity based on multiple factors (Sprint S55)';
