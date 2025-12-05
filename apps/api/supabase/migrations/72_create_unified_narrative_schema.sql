-- Migration 72: Unified Narrative Generator V2 Schema (Sprint S70)
-- Cross-domain synthesis engine for multi-layer narrative documents

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Narrative type enum
CREATE TYPE unified_narrative_type AS ENUM (
  'executive',
  'strategy',
  'investor',
  'crisis',
  'competitive_intelligence',
  'reputation',
  'quarterly_context',
  'talking_points',
  'analyst_brief',
  'internal_alignment_memo',
  'tldr_synthesis',
  'custom'
);

-- Narrative section type enum
CREATE TYPE unified_narrative_section_type AS ENUM (
  -- Executive Narrative sections
  'executive_summary',
  'strategic_overview',
  'key_achievements',
  'critical_risks',
  'market_position',
  'competitive_landscape',
  'financial_implications',
  'forward_outlook',

  -- Strategy Narrative sections
  'strategic_context',
  'opportunity_analysis',
  'threat_assessment',
  'resource_allocation',
  'initiative_priorities',
  'timeline_milestones',

  -- Investor Narrative sections
  'investment_thesis',
  'growth_drivers',
  'market_dynamics',
  'competitive_moat',
  'risk_factors',
  'financial_performance',
  'guidance_outlook',

  -- Crisis Narrative sections
  'situation_assessment',
  'impact_analysis',
  'response_actions',
  'stakeholder_communications',
  'recovery_timeline',
  'lessons_learned',

  -- Competitive Intelligence sections
  'competitor_overview',
  'market_share_analysis',
  'product_comparison',
  'pricing_analysis',
  'strategic_moves',
  'threat_opportunities',

  -- Reputation Narrative sections
  'brand_health',
  'sentiment_analysis',
  'media_coverage',
  'stakeholder_perception',
  'reputation_risks',
  'enhancement_opportunities',

  -- Quarterly Context sections
  'quarter_highlights',
  'performance_metrics',
  'trend_analysis',
  'variance_explanation',
  'next_quarter_outlook',

  -- Generic sections
  'introduction',
  'conclusion',
  'appendix',
  'sources_references',
  'custom'
);

-- Insight strength enum
CREATE TYPE unified_insight_strength AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'informational'
);

-- Delta type enum
CREATE TYPE unified_delta_type AS ENUM (
  'improved',
  'declined',
  'unchanged',
  'new_insight',
  'removed_insight',
  'context_shift'
);

-- Narrative format type enum
CREATE TYPE unified_narrative_format AS ENUM (
  'long_form',
  'executive_brief',
  'bullet_points',
  'structured_report',
  'presentation_ready',
  'email_friendly'
);

-- Narrative status enum
CREATE TYPE unified_narrative_status AS ENUM (
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived'
);

-- Source system enum (covers all S38-S69 systems)
CREATE TYPE unified_source_system AS ENUM (
  'media_briefing',
  'crisis_engine',
  'brand_reputation',
  'brand_alerts',
  'governance',
  'risk_radar',
  'exec_command_center',
  'exec_digest',
  'board_reports',
  'investor_relations',
  'strategic_intelligence',
  'unified_graph',
  'scenario_playbooks',
  'media_monitoring',
  'media_performance',
  'journalist_graph',
  'audience_personas',
  'competitive_intel',
  'content_quality',
  'pr_outreach',
  'custom'
);

-- Audit event type
CREATE TYPE unified_narrative_event_type AS ENUM (
  'created',
  'updated',
  'generated',
  'section_generated',
  'section_regenerated',
  'section_edited',
  'delta_computed',
  'status_changed',
  'approved',
  'published',
  'archived',
  'exported',
  'shared'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Main unified narratives table
CREATE TABLE unified_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Narrative metadata
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(1000),
  narrative_type unified_narrative_type NOT NULL,
  format unified_narrative_format NOT NULL DEFAULT 'long_form',
  status unified_narrative_status NOT NULL DEFAULT 'draft',

  -- Period context
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  fiscal_quarter VARCHAR(10),
  fiscal_year INTEGER,

  -- Target audience
  target_audience VARCHAR(200),
  audience_context JSONB DEFAULT '{}',

  -- Generation parameters
  generation_config JSONB DEFAULT '{}',
  source_systems unified_source_system[] DEFAULT '{}',
  excluded_systems unified_source_system[] DEFAULT '{}',

  -- Generated content
  executive_summary TEXT,
  tldr_synthesis TEXT,
  three_sentence_summary TEXT,

  -- Aggregated insights
  key_insights JSONB DEFAULT '[]',
  cross_system_patterns JSONB DEFAULT '[]',
  contradictions_detected JSONB DEFAULT '[]',
  risk_clusters JSONB DEFAULT '[]',
  correlations JSONB DEFAULT '[]',

  -- Metrics and scores
  overall_sentiment_score DECIMAL(5,4),
  confidence_score DECIMAL(5,4),
  coverage_completeness DECIMAL(5,4),
  insight_density INTEGER,

  -- Delta tracking
  previous_narrative_id UUID REFERENCES unified_narratives(id),
  delta_summary TEXT,
  delta_json JSONB,

  -- LLM metadata
  llm_model VARCHAR(100),
  llm_version VARCHAR(50),
  total_tokens_used INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,

  -- Workflow
  generated_at TIMESTAMPTZ,
  generated_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),

  -- Export tracking
  export_formats JSONB DEFAULT '[]',
  last_exported_at TIMESTAMPTZ,

  -- Tags and metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Narrative sections table
CREATE TABLE unified_narrative_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES unified_narratives(id) ON DELETE CASCADE,

  -- Section metadata
  section_type unified_narrative_section_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Content
  content_md TEXT,
  content_html TEXT,
  content_plain TEXT,

  -- Structured data
  key_points JSONB DEFAULT '[]',
  supporting_data JSONB DEFAULT '{}',
  visualizations JSONB DEFAULT '[]',

  -- Source attribution
  source_systems unified_source_system[] DEFAULT '{}',
  source_references JSONB DEFAULT '[]',

  -- Insights
  section_insights JSONB DEFAULT '[]',
  insight_strength unified_insight_strength,

  -- Generation metadata
  is_generated BOOLEAN DEFAULT true,
  is_edited BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  llm_model VARCHAR(100),
  tokens_used INTEGER DEFAULT 0,

  -- Confidence and quality
  confidence_score DECIMAL(5,4),
  quality_score DECIMAL(5,4),

  -- Audit
  generated_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Narrative sources table (tracks which source records were used)
CREATE TABLE unified_narrative_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES unified_narratives(id) ON DELETE CASCADE,
  section_id UUID REFERENCES unified_narrative_sections(id) ON DELETE CASCADE,

  -- Source identification
  source_system unified_source_system NOT NULL,
  source_record_id UUID NOT NULL,
  source_record_type VARCHAR(100),

  -- Source metadata
  source_title VARCHAR(500),
  source_summary TEXT,
  source_date TIMESTAMPTZ,

  -- Relevance and usage
  relevance_score DECIMAL(5,4),
  confidence_score DECIMAL(5,4),
  is_primary_source BOOLEAN DEFAULT false,
  usage_context TEXT,

  -- Extracted insights
  extracted_insights JSONB DEFAULT '[]',
  extracted_data JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Narrative diff table (tracks changes between narratives)
CREATE TABLE unified_narrative_diff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Comparison references
  current_narrative_id UUID NOT NULL REFERENCES unified_narratives(id) ON DELETE CASCADE,
  previous_narrative_id UUID NOT NULL REFERENCES unified_narratives(id) ON DELETE CASCADE,

  -- Diff metadata
  diff_type unified_delta_type NOT NULL,
  diff_summary TEXT,

  -- Detailed changes
  changes JSONB NOT NULL DEFAULT '[]',

  -- Sentiment and score changes
  sentiment_delta DECIMAL(5,4),
  confidence_delta DECIMAL(5,4),

  -- Section-level changes
  sections_added JSONB DEFAULT '[]',
  sections_removed JSONB DEFAULT '[]',
  sections_modified JSONB DEFAULT '[]',

  -- Insight changes
  new_insights JSONB DEFAULT '[]',
  removed_insights JSONB DEFAULT '[]',
  changed_insights JSONB DEFAULT '[]',

  -- Risk and pattern changes
  risk_changes JSONB DEFAULT '[]',
  pattern_changes JSONB DEFAULT '[]',

  -- Context shift analysis
  context_shift_summary TEXT,
  context_shift_factors JSONB DEFAULT '[]',

  -- LLM metadata
  llm_model VARCHAR(100),
  tokens_used INTEGER DEFAULT 0,

  -- Audit
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  computed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log table
CREATE TABLE unified_narrative_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  narrative_id UUID REFERENCES unified_narratives(id) ON DELETE SET NULL,
  section_id UUID REFERENCES unified_narrative_sections(id) ON DELETE SET NULL,

  -- Event details
  event_type unified_narrative_event_type NOT NULL,
  event_description TEXT,

  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),

  -- Change tracking
  previous_state JSONB,
  new_state JSONB,
  changes JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- unified_narratives indexes
CREATE INDEX idx_unified_narratives_org_id ON unified_narratives(org_id);
CREATE INDEX idx_unified_narratives_type ON unified_narratives(narrative_type);
CREATE INDEX idx_unified_narratives_status ON unified_narratives(status);
CREATE INDEX idx_unified_narratives_period ON unified_narratives(period_start, period_end);
CREATE INDEX idx_unified_narratives_fiscal ON unified_narratives(fiscal_year, fiscal_quarter);
CREATE INDEX idx_unified_narratives_created ON unified_narratives(created_at DESC);
CREATE INDEX idx_unified_narratives_source_systems ON unified_narratives USING GIN(source_systems);
CREATE INDEX idx_unified_narratives_tags ON unified_narratives USING GIN(tags);
CREATE INDEX idx_unified_narratives_key_insights ON unified_narratives USING GIN(key_insights);
CREATE INDEX idx_unified_narratives_risk_clusters ON unified_narratives USING GIN(risk_clusters);

-- unified_narrative_sections indexes
CREATE INDEX idx_unified_narrative_sections_narrative ON unified_narrative_sections(narrative_id);
CREATE INDEX idx_unified_narrative_sections_type ON unified_narrative_sections(section_type);
CREATE INDEX idx_unified_narrative_sections_order ON unified_narrative_sections(narrative_id, sort_order);
CREATE INDEX idx_unified_narrative_sections_sources ON unified_narrative_sections USING GIN(source_systems);

-- unified_narrative_sources indexes
CREATE INDEX idx_unified_narrative_sources_narrative ON unified_narrative_sources(narrative_id);
CREATE INDEX idx_unified_narrative_sources_section ON unified_narrative_sources(section_id);
CREATE INDEX idx_unified_narrative_sources_system ON unified_narrative_sources(source_system);
CREATE INDEX idx_unified_narrative_sources_record ON unified_narrative_sources(source_record_id);

-- unified_narrative_diff indexes
CREATE INDEX idx_unified_narrative_diff_org ON unified_narrative_diff(org_id);
CREATE INDEX idx_unified_narrative_diff_current ON unified_narrative_diff(current_narrative_id);
CREATE INDEX idx_unified_narrative_diff_previous ON unified_narrative_diff(previous_narrative_id);
CREATE INDEX idx_unified_narrative_diff_type ON unified_narrative_diff(diff_type);

-- unified_narrative_audit_log indexes
CREATE INDEX idx_unified_narrative_audit_org ON unified_narrative_audit_log(org_id);
CREATE INDEX idx_unified_narrative_audit_narrative ON unified_narrative_audit_log(narrative_id);
CREATE INDEX idx_unified_narrative_audit_section ON unified_narrative_audit_log(section_id);
CREATE INDEX idx_unified_narrative_audit_event ON unified_narrative_audit_log(event_type);
CREATE INDEX idx_unified_narrative_audit_user ON unified_narrative_audit_log(user_id);
CREATE INDEX idx_unified_narrative_audit_created ON unified_narrative_audit_log(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE unified_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_narrative_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_narrative_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_narrative_diff ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_narrative_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for unified_narratives
CREATE POLICY "Users can view narratives in their org"
  ON unified_narratives FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can create narratives in their org"
  ON unified_narratives FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update narratives in their org"
  ON unified_narratives FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete narratives in their org"
  ON unified_narratives FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Policies for unified_narrative_sections
CREATE POLICY "Users can view sections via narrative org"
  ON unified_narrative_sections FOR SELECT
  USING (narrative_id IN (
    SELECT id FROM unified_narratives
    WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can manage sections via narrative org"
  ON unified_narrative_sections FOR ALL
  USING (narrative_id IN (
    SELECT id FROM unified_narratives
    WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  ));

-- Policies for unified_narrative_sources
CREATE POLICY "Users can view sources via narrative org"
  ON unified_narrative_sources FOR SELECT
  USING (narrative_id IN (
    SELECT id FROM unified_narratives
    WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can manage sources via narrative org"
  ON unified_narrative_sources FOR ALL
  USING (narrative_id IN (
    SELECT id FROM unified_narratives
    WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  ));

-- Policies for unified_narrative_diff
CREATE POLICY "Users can view diffs in their org"
  ON unified_narrative_diff FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can create diffs in their org"
  ON unified_narrative_diff FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Policies for unified_narrative_audit_log
CREATE POLICY "Users can view audit logs in their org"
  ON unified_narrative_audit_log FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "System can create audit logs"
  ON unified_narrative_audit_log FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at trigger for unified_narratives
CREATE TRIGGER update_unified_narratives_updated_at
  BEFORE UPDATE ON unified_narratives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for unified_narrative_sections
CREATE TRIGGER update_unified_narrative_sections_updated_at
  BEFORE UPDATE ON unified_narrative_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE unified_narratives IS 'Central cross-domain narrative documents synthesizing all intelligence systems (S70)';
COMMENT ON TABLE unified_narrative_sections IS 'Individual sections within a unified narrative';
COMMENT ON TABLE unified_narrative_sources IS 'Source records from various systems used to generate narratives';
COMMENT ON TABLE unified_narrative_diff IS 'Computed differences between narrative versions';
COMMENT ON TABLE unified_narrative_audit_log IS 'Audit trail for narrative operations';

COMMENT ON COLUMN unified_narratives.key_insights IS 'Aggregated insights from all source systems';
COMMENT ON COLUMN unified_narratives.cross_system_patterns IS 'Patterns detected across multiple source systems';
COMMENT ON COLUMN unified_narratives.contradictions_detected IS 'Conflicting signals or data from different systems';
COMMENT ON COLUMN unified_narratives.risk_clusters IS 'Grouped risk factors identified across systems';
COMMENT ON COLUMN unified_narratives.correlations IS 'Correlated events or metrics across systems';
