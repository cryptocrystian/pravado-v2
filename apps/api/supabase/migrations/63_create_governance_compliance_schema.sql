-- Migration 63: Governance, Compliance & Audit Intelligence Engine Schema (Sprint S59)
-- Creates tables for centralized policy, compliance, and risk management across all Pravado systems

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Policy category enum
CREATE TYPE governance_policy_category AS ENUM (
  'content',
  'crisis',
  'reputation',
  'journalist',
  'legal',
  'data_privacy',
  'media_relations',
  'executive_comms',
  'competitive_intel',
  'brand_safety'
);

-- Policy scope enum
CREATE TYPE governance_policy_scope AS ENUM (
  'global',
  'brand',
  'campaign',
  'journalist',
  'region',
  'channel',
  'team'
);

-- Severity level enum
CREATE TYPE governance_severity_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Rule type enum
CREATE TYPE governance_rule_type AS ENUM (
  'threshold',
  'pattern',
  'blacklist',
  'whitelist',
  'time_window',
  'compound',
  'frequency',
  'sentiment',
  'relationship',
  'approval_required'
);

-- Target system enum
CREATE TYPE governance_target_system AS ENUM (
  'media_monitoring',
  'crisis',
  'reputation',
  'outreach',
  'briefings',
  'journalists',
  'press_releases',
  'pitches',
  'media_lists',
  'personas',
  'competitive_intel'
);

-- Finding status enum
CREATE TYPE governance_finding_status AS ENUM (
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'dismissed',
  'escalated'
);

-- Entity type enum
CREATE TYPE governance_entity_type AS ENUM (
  'brand',
  'campaign',
  'journalist',
  'story',
  'channel',
  'outlet',
  'spokesperson',
  'competitor',
  'region'
);

-- ============================================================================
-- GOVERNANCE POLICIES TABLE
-- ============================================================================

CREATE TABLE governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Policy identification
  key VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Classification
  category governance_policy_category NOT NULL,
  scope governance_policy_scope NOT NULL DEFAULT 'global',
  severity governance_severity_level NOT NULL DEFAULT 'medium',

  -- Configuration
  rule_config JSONB NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  -- Ownership
  owner_user_id UUID,
  department VARCHAR(100),

  -- Compliance metadata
  regulatory_reference VARCHAR(255),
  effective_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(org_id, key)
);

-- ============================================================================
-- GOVERNANCE RULES TABLE
-- ============================================================================

CREATE TABLE governance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES governance_policies(id) ON DELETE CASCADE,

  -- Rule identification
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Rule definition
  rule_type governance_rule_type NOT NULL,
  target_system governance_target_system NOT NULL,

  -- Rule logic (JSONB structures)
  condition JSONB NOT NULL DEFAULT '{}',
  action JSONB NOT NULL DEFAULT '{}',

  -- Execution settings
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Evaluation settings
  evaluation_mode VARCHAR(50) DEFAULT 'on_event', -- on_event, scheduled, manual
  schedule_cron VARCHAR(100),

  -- Thresholds and limits
  cooldown_minutes INT DEFAULT 0,
  max_findings_per_day INT,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GOVERNANCE FINDINGS TABLE
-- ============================================================================

CREATE TABLE governance_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES governance_policies(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES governance_rules(id) ON DELETE CASCADE,

  -- Source identification
  source_system governance_target_system NOT NULL,
  source_reference_id VARCHAR(255) NOT NULL,
  source_reference_type VARCHAR(100),

  -- Finding classification
  severity governance_severity_level NOT NULL,
  status governance_finding_status NOT NULL DEFAULT 'open',

  -- Finding details
  summary VARCHAR(500) NOT NULL,
  details TEXT,

  -- Impact assessment
  impact_score INT CHECK (impact_score >= 0 AND impact_score <= 100),
  affected_entities JSONB DEFAULT '[]',

  -- Recommended actions
  recommended_actions JSONB DEFAULT '[]',
  mitigation_notes TEXT,

  -- Resolution tracking
  assigned_to UUID,
  resolved_by UUID,
  resolution_notes TEXT,

  -- Timestamps
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Context snapshot
  metadata JSONB DEFAULT '{}',
  event_snapshot JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GOVERNANCE RISK SCORES TABLE
-- ============================================================================

CREATE TABLE governance_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Entity identification
  entity_type governance_entity_type NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  entity_name VARCHAR(255),

  -- Overall risk score
  overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level governance_severity_level NOT NULL,

  -- Dimensional risk scores
  content_risk INT CHECK (content_risk >= 0 AND content_risk <= 100),
  reputation_risk INT CHECK (reputation_risk >= 0 AND reputation_risk <= 100),
  crisis_risk INT CHECK (crisis_risk >= 0 AND crisis_risk <= 100),
  legal_risk INT CHECK (legal_risk >= 0 AND legal_risk <= 100),
  relationship_risk INT CHECK (relationship_risk >= 0 AND relationship_risk <= 100),
  competitive_risk INT CHECK (competitive_risk >= 0 AND competitive_risk <= 100),

  -- Trend indicators
  previous_score INT,
  score_trend VARCHAR(20), -- improving, stable, worsening
  trend_period_days INT DEFAULT 30,

  -- Score breakdown
  breakdown JSONB NOT NULL DEFAULT '{}',
  contributing_factors JSONB DEFAULT '[]',

  -- Linked data
  active_findings_count INT DEFAULT 0,
  linked_finding_ids UUID[] DEFAULT '{}',

  -- Computation metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computation_method VARCHAR(50) DEFAULT 'weighted_average',
  confidence_score DECIMAL(3,2),

  -- Validity
  valid_until TIMESTAMPTZ,
  is_stale BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per entity
  UNIQUE(org_id, entity_type, entity_id)
);

-- ============================================================================
-- GOVERNANCE AUDIT INSIGHTS TABLE
-- ============================================================================

CREATE TABLE governance_audit_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Time window
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,

  -- Insight classification
  insight_type VARCHAR(100) DEFAULT 'periodic_review',
  scope governance_policy_scope DEFAULT 'global',

  -- Content
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  executive_summary TEXT,
  detailed_analysis TEXT,

  -- Recommendations
  recommendations JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',

  -- Risk overview
  top_risks JSONB DEFAULT '[]',
  risk_distribution JSONB DEFAULT '{}',

  -- Metrics snapshot
  metrics_snapshot JSONB DEFAULT '{}',
  trend_analysis JSONB DEFAULT '{}',

  -- Linked findings
  linked_findings UUID[] DEFAULT '{}',
  findings_count INT DEFAULT 0,
  resolved_findings_count INT DEFAULT 0,

  -- Generation metadata
  generated_by VARCHAR(50) NOT NULL DEFAULT 'rule_based', -- rule_based, llm_assisted, hybrid
  llm_model VARCHAR(100),
  generation_prompt TEXT,
  tokens_used INT,

  -- Distribution
  recipients JSONB DEFAULT '[]',
  distributed_at TIMESTAMPTZ,

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GOVERNANCE POLICY VERSIONS TABLE (for audit trail)
-- ============================================================================

CREATE TABLE governance_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES governance_policies(id) ON DELETE CASCADE,

  version_number INT NOT NULL,

  -- Snapshot of policy at this version
  policy_snapshot JSONB NOT NULL,

  -- Change tracking
  change_summary TEXT,
  changed_fields TEXT[],

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(policy_id, version_number)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Governance policies indexes
CREATE INDEX idx_governance_policies_org ON governance_policies(org_id);
CREATE INDEX idx_governance_policies_category ON governance_policies(org_id, category);
CREATE INDEX idx_governance_policies_scope ON governance_policies(org_id, scope);
CREATE INDEX idx_governance_policies_active ON governance_policies(org_id, is_active) WHERE is_active = true;
CREATE INDEX idx_governance_policies_key ON governance_policies(org_id, key);

-- Governance rules indexes
CREATE INDEX idx_governance_rules_org ON governance_rules(org_id);
CREATE INDEX idx_governance_rules_policy ON governance_rules(org_id, policy_id);
CREATE INDEX idx_governance_rules_target ON governance_rules(org_id, target_system);
CREATE INDEX idx_governance_rules_type ON governance_rules(org_id, rule_type);
CREATE INDEX idx_governance_rules_active ON governance_rules(org_id, is_active) WHERE is_active = true;
CREATE INDEX idx_governance_rules_priority ON governance_rules(org_id, policy_id, priority);

-- Governance findings indexes
CREATE INDEX idx_governance_findings_org ON governance_findings(org_id);
CREATE INDEX idx_governance_findings_policy ON governance_findings(org_id, policy_id);
CREATE INDEX idx_governance_findings_rule ON governance_findings(org_id, rule_id);
CREATE INDEX idx_governance_findings_status ON governance_findings(org_id, status);
CREATE INDEX idx_governance_findings_severity ON governance_findings(org_id, severity);
CREATE INDEX idx_governance_findings_source ON governance_findings(org_id, source_system, source_reference_id);
CREATE INDEX idx_governance_findings_detected ON governance_findings(org_id, detected_at DESC);
CREATE INDEX idx_governance_findings_open ON governance_findings(org_id, policy_id, rule_id, status)
  WHERE status IN ('open', 'acknowledged', 'in_progress');

-- Governance risk scores indexes
CREATE INDEX idx_governance_risk_scores_org ON governance_risk_scores(org_id);
CREATE INDEX idx_governance_risk_scores_entity ON governance_risk_scores(org_id, entity_type, entity_id);
CREATE INDEX idx_governance_risk_scores_level ON governance_risk_scores(org_id, risk_level);
CREATE INDEX idx_governance_risk_scores_computed ON governance_risk_scores(org_id, computed_at DESC);
CREATE INDEX idx_governance_risk_scores_high_risk ON governance_risk_scores(org_id, overall_score DESC)
  WHERE overall_score >= 70;

-- Governance audit insights indexes
CREATE INDEX idx_governance_audit_insights_org ON governance_audit_insights(org_id);
CREATE INDEX idx_governance_audit_insights_time ON governance_audit_insights(org_id, time_window_start, time_window_end);
CREATE INDEX idx_governance_audit_insights_type ON governance_audit_insights(org_id, insight_type);
CREATE INDEX idx_governance_audit_insights_created ON governance_audit_insights(org_id, created_at DESC);

-- Policy versions indexes
CREATE INDEX idx_governance_policy_versions_policy ON governance_policy_versions(policy_id);
CREATE INDEX idx_governance_policy_versions_org ON governance_policy_versions(org_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audit_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_policy_versions ENABLE ROW LEVEL SECURITY;

-- Governance policies RLS
CREATE POLICY governance_policies_org_isolation ON governance_policies
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Governance rules RLS
CREATE POLICY governance_rules_org_isolation ON governance_rules
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Governance findings RLS
CREATE POLICY governance_findings_org_isolation ON governance_findings
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Governance risk scores RLS
CREATE POLICY governance_risk_scores_org_isolation ON governance_risk_scores
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Governance audit insights RLS
CREATE POLICY governance_audit_insights_org_isolation ON governance_audit_insights
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Policy versions RLS
CREATE POLICY governance_policy_versions_org_isolation ON governance_policy_versions
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for governance_policies
CREATE OR REPLACE FUNCTION update_governance_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_governance_policies_updated_at
  BEFORE UPDATE ON governance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_policies_updated_at();

-- Auto-update updated_at for governance_rules
CREATE OR REPLACE FUNCTION update_governance_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_governance_rules_updated_at
  BEFORE UPDATE ON governance_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_rules_updated_at();

-- Auto-update updated_at for governance_findings
CREATE OR REPLACE FUNCTION update_governance_findings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_governance_findings_updated_at
  BEFORE UPDATE ON governance_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_findings_updated_at();

-- Auto-update updated_at for governance_risk_scores
CREATE OR REPLACE FUNCTION update_governance_risk_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_governance_risk_scores_updated_at
  BEFORE UPDATE ON governance_risk_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_risk_scores_updated_at();

-- Auto-update updated_at for governance_audit_insights
CREATE OR REPLACE FUNCTION update_governance_audit_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_governance_audit_insights_updated_at
  BEFORE UPDATE ON governance_audit_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_governance_audit_insights_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE governance_policies IS 'Central governance policies for compliance and risk management across Pravado';
COMMENT ON TABLE governance_rules IS 'Individual rules that define conditions and actions within governance policies';
COMMENT ON TABLE governance_findings IS 'Concrete violations or warnings when governance rules are triggered';
COMMENT ON TABLE governance_risk_scores IS 'Aggregated risk scores by entity type (brand, campaign, journalist, etc.)';
COMMENT ON TABLE governance_audit_insights IS 'Higher-level governance reports and insights for executive review';
COMMENT ON TABLE governance_policy_versions IS 'Version history for governance policies for audit trail';

COMMENT ON COLUMN governance_policies.rule_config IS 'JSONB configuration for policy-level settings';
COMMENT ON COLUMN governance_rules.condition IS 'JSONB defining the rule evaluation conditions';
COMMENT ON COLUMN governance_rules.action IS 'JSONB defining the actions to take when rule triggers';
COMMENT ON COLUMN governance_findings.metadata IS 'JSONB snapshot of event context when finding was created';
COMMENT ON COLUMN governance_risk_scores.breakdown IS 'JSONB explaining score contributions from different systems';
COMMENT ON COLUMN governance_audit_insights.top_risks IS 'JSONB array of top risk items in the reporting period';
