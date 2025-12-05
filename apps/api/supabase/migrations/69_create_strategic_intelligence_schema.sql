-- Migration 69: Strategic Intelligence Narrative Engine Schema (Sprint S65)
-- Creates tables for unified CEO-level strategic intelligence reports

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Strategic report format types
CREATE TYPE strategic_report_format AS ENUM (
  'quarterly_strategic_review',
  'annual_strategic_assessment',
  'board_strategy_brief',
  'ceo_intelligence_brief',
  'investor_strategy_update',
  'crisis_strategic_response',
  'competitive_strategy_report',
  'custom'
);

-- Strategic report status workflow
CREATE TYPE strategic_report_status AS ENUM (
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived'
);

-- Strategic section types
CREATE TYPE strategic_section_type AS ENUM (
  'executive_summary',
  'strategic_outlook',
  'market_dynamics',
  'competitive_positioning',
  'risk_opportunity_matrix',
  'messaging_alignment',
  'ceo_talking_points',
  'quarter_changes',
  'key_kpis_narrative',
  'prioritized_initiatives',
  'brand_health_overview',
  'crisis_posture',
  'governance_compliance',
  'investor_sentiment',
  'media_performance_summary',
  'strategic_recommendations',
  'appendix',
  'custom'
);

-- Strategic section status
CREATE TYPE strategic_section_status AS ENUM (
  'draft',
  'generated',
  'edited',
  'approved'
);

-- Target audience for strategic reports
CREATE TYPE strategic_audience AS ENUM (
  'ceo',
  'c_suite',
  'board',
  'investors',
  'senior_leadership',
  'all_executives'
);

-- Source systems for data aggregation
CREATE TYPE strategic_source_system AS ENUM (
  'pr_generator',
  'media_monitoring',
  'media_alerts',
  'media_performance',
  'competitive_intel',
  'crisis_engine',
  'brand_reputation',
  'brand_alerts',
  'governance',
  'risk_radar',
  'exec_command_center',
  'exec_digest',
  'board_reports',
  'investor_relations',
  'journalist_graph',
  'media_lists',
  'outreach_engine',
  'custom'
);

-- Audit event types
CREATE TYPE strategic_event_type AS ENUM (
  'created',
  'updated',
  'status_changed',
  'section_generated',
  'section_regenerated',
  'section_edited',
  'insights_refreshed',
  'source_added',
  'source_removed',
  'approved',
  'published',
  'archived'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main strategic intelligence reports table
CREATE TABLE strategic_intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Report metadata
  title TEXT NOT NULL,
  description TEXT,
  format strategic_report_format NOT NULL DEFAULT 'quarterly_strategic_review',
  status strategic_report_status NOT NULL DEFAULT 'draft',
  audience strategic_audience NOT NULL DEFAULT 'c_suite',

  -- Time period covered
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  fiscal_quarter TEXT, -- e.g., 'Q1', 'Q2'
  fiscal_year INTEGER,

  -- Section configuration
  section_types strategic_section_type[] NOT NULL DEFAULT ARRAY[
    'executive_summary',
    'strategic_outlook',
    'market_dynamics',
    'competitive_positioning',
    'risk_opportunity_matrix',
    'key_kpis_narrative'
  ]::strategic_section_type[],

  -- Consolidated KPIs snapshot (from all upstream systems)
  kpis_snapshot JSONB DEFAULT '{}'::jsonb,

  -- Strategic scores and metrics
  overall_strategic_score NUMERIC(5,2), -- 0-100
  risk_posture_score NUMERIC(5,2), -- 0-100
  opportunity_score NUMERIC(5,2), -- 0-100
  messaging_alignment_score NUMERIC(5,2), -- 0-100
  competitive_position_score NUMERIC(5,2), -- 0-100
  brand_health_score NUMERIC(5,2), -- 0-100

  -- Summary JSONB for quick access
  summary_json JSONB DEFAULT '{}'::jsonb,

  -- LLM metadata
  total_tokens_used INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  llm_model TEXT,
  llm_fallback_json JSONB,

  -- Generation settings
  tone TEXT DEFAULT 'executive',
  target_length TEXT DEFAULT 'comprehensive',
  include_charts BOOLEAN DEFAULT true,
  include_recommendations BOOLEAN DEFAULT true,

  -- Publishing
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  pdf_storage_path TEXT,
  pptx_storage_path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategic intelligence sections table
CREATE TABLE strategic_intelligence_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES strategic_intelligence_reports(id) ON DELETE CASCADE,

  -- Section metadata
  section_type strategic_section_type NOT NULL,
  title TEXT,
  status strategic_section_status NOT NULL DEFAULT 'draft',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,

  -- Content
  content_md TEXT,
  content_html TEXT,
  raw_llm_json JSONB,

  -- Charts and visualizations
  charts_config JSONB DEFAULT '[]'::jsonb,
  data_tables JSONB DEFAULT '[]'::jsonb,

  -- Strategic metrics for this section
  section_metrics JSONB DEFAULT '{}'::jsonb,

  -- Source tracking
  source_refs JSONB DEFAULT '[]'::jsonb,

  -- Edit tracking
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Regeneration tracking
  regeneration_count INTEGER NOT NULL DEFAULT 0,
  last_regenerated_at TIMESTAMPTZ,

  -- LLM metadata
  tokens_used INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategic intelligence sources table (tracks data sources used)
CREATE TABLE strategic_intelligence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES strategic_intelligence_reports(id) ON DELETE CASCADE,

  -- Source metadata
  source_system strategic_source_system NOT NULL,
  source_id TEXT, -- Reference ID in the source system
  source_type TEXT, -- Specific type within the source system
  source_title TEXT,
  source_url TEXT,

  -- Data extracted
  extracted_data JSONB DEFAULT '{}'::jsonb,
  extraction_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Relevance and quality
  relevance_score NUMERIC(5,2), -- 0-100
  data_quality_score NUMERIC(5,2), -- 0-100
  is_primary_source BOOLEAN DEFAULT false,

  -- Usage tracking
  sections_using TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strategic intelligence audit log
CREATE TABLE strategic_intelligence_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES strategic_intelligence_reports(id) ON DELETE CASCADE,

  -- Event metadata
  event_type strategic_event_type NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,

  -- Event details
  details_json JSONB DEFAULT '{}'::jsonb,
  previous_status strategic_report_status,
  new_status strategic_report_status,

  -- Section reference (if applicable)
  section_id UUID REFERENCES strategic_intelligence_sections(id) ON DELETE SET NULL,
  section_type strategic_section_type,

  -- LLM usage (if applicable)
  tokens_used INTEGER,
  duration_ms INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Reports indexes
CREATE INDEX idx_strategic_reports_org_id ON strategic_intelligence_reports(org_id);
CREATE INDEX idx_strategic_reports_status ON strategic_intelligence_reports(status);
CREATE INDEX idx_strategic_reports_format ON strategic_intelligence_reports(format);
CREATE INDEX idx_strategic_reports_audience ON strategic_intelligence_reports(audience);
CREATE INDEX idx_strategic_reports_period ON strategic_intelligence_reports(period_start, period_end);
CREATE INDEX idx_strategic_reports_created_at ON strategic_intelligence_reports(created_at DESC);
CREATE INDEX idx_strategic_reports_created_by ON strategic_intelligence_reports(created_by);
CREATE INDEX idx_strategic_reports_fiscal ON strategic_intelligence_reports(fiscal_year, fiscal_quarter);

-- Sections indexes
CREATE INDEX idx_strategic_sections_org_id ON strategic_intelligence_sections(org_id);
CREATE INDEX idx_strategic_sections_report_id ON strategic_intelligence_sections(report_id);
CREATE INDEX idx_strategic_sections_type ON strategic_intelligence_sections(section_type);
CREATE INDEX idx_strategic_sections_status ON strategic_intelligence_sections(status);
CREATE INDEX idx_strategic_sections_order ON strategic_intelligence_sections(report_id, order_index);

-- Sources indexes
CREATE INDEX idx_strategic_sources_org_id ON strategic_intelligence_sources(org_id);
CREATE INDEX idx_strategic_sources_report_id ON strategic_intelligence_sources(report_id);
CREATE INDEX idx_strategic_sources_system ON strategic_intelligence_sources(source_system);
CREATE INDEX idx_strategic_sources_relevance ON strategic_intelligence_sources(relevance_score DESC);

-- Audit log indexes
CREATE INDEX idx_strategic_audit_org_id ON strategic_intelligence_audit_log(org_id);
CREATE INDEX idx_strategic_audit_report_id ON strategic_intelligence_audit_log(report_id);
CREATE INDEX idx_strategic_audit_event_type ON strategic_intelligence_audit_log(event_type);
CREATE INDEX idx_strategic_audit_user_id ON strategic_intelligence_audit_log(user_id);
CREATE INDEX idx_strategic_audit_created_at ON strategic_intelligence_audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for reports
CREATE TRIGGER update_strategic_reports_updated_at
  BEFORE UPDATE ON strategic_intelligence_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for sections
CREATE TRIGGER update_strategic_sections_updated_at
  BEFORE UPDATE ON strategic_intelligence_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for sources
CREATE TRIGGER update_strategic_sources_updated_at
  BEFORE UPDATE ON strategic_intelligence_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE strategic_intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_intelligence_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_intelligence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_intelligence_audit_log ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY strategic_reports_org_isolation ON strategic_intelligence_reports
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_reports_select ON strategic_intelligence_reports
  FOR SELECT USING (true);

CREATE POLICY strategic_reports_insert ON strategic_intelligence_reports
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_reports_update ON strategic_intelligence_reports
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_reports_delete ON strategic_intelligence_reports
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Sections policies
CREATE POLICY strategic_sections_org_isolation ON strategic_intelligence_sections
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_sections_select ON strategic_intelligence_sections
  FOR SELECT USING (true);

CREATE POLICY strategic_sections_insert ON strategic_intelligence_sections
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_sections_update ON strategic_intelligence_sections
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_sections_delete ON strategic_intelligence_sections
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Sources policies
CREATE POLICY strategic_sources_org_isolation ON strategic_intelligence_sources
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_sources_select ON strategic_intelligence_sources
  FOR SELECT USING (true);

CREATE POLICY strategic_sources_insert ON strategic_intelligence_sources
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_sources_update ON strategic_intelligence_sources
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_sources_delete ON strategic_intelligence_sources
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Audit log policies
CREATE POLICY strategic_audit_org_isolation ON strategic_intelligence_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY strategic_audit_select ON strategic_intelligence_audit_log
  FOR SELECT USING (true);

CREATE POLICY strategic_audit_insert ON strategic_intelligence_audit_log
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE strategic_intelligence_reports IS 'CEO-level strategic intelligence narrative reports synthesizing all Pravado systems (S65)';
COMMENT ON TABLE strategic_intelligence_sections IS 'Individual sections within strategic intelligence reports';
COMMENT ON TABLE strategic_intelligence_sources IS 'Data sources used to generate strategic intelligence reports';
COMMENT ON TABLE strategic_intelligence_audit_log IS 'Audit trail for strategic intelligence report activities';

COMMENT ON COLUMN strategic_intelligence_reports.kpis_snapshot IS 'Consolidated KPIs from all upstream systems at report generation time';
COMMENT ON COLUMN strategic_intelligence_reports.overall_strategic_score IS 'Composite strategic health score (0-100)';
COMMENT ON COLUMN strategic_intelligence_reports.risk_posture_score IS 'Current risk posture assessment (0-100, higher = better)';
COMMENT ON COLUMN strategic_intelligence_reports.opportunity_score IS 'Opportunity landscape score (0-100)';
COMMENT ON COLUMN strategic_intelligence_reports.messaging_alignment_score IS 'How well messaging aligns across channels (0-100)';
COMMENT ON COLUMN strategic_intelligence_sources.relevance_score IS 'How relevant this source is to the strategic narrative';
