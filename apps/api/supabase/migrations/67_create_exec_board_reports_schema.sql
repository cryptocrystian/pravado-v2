-- Sprint S63: Board Reporting & Quarterly Executive Pack Generator V1
-- Migration 67: Create executive board reports schema
-- Date: 2025-12-01

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Board report format enum
CREATE TYPE exec_board_report_format_enum AS ENUM (
  'quarterly',       -- Quarterly executive pack
  'annual',          -- Annual review report
  'monthly',         -- Monthly summary
  'board_meeting',   -- Board meeting preparation pack
  'investor_update', -- Investor/stakeholder update
  'custom'           -- Custom format
);

-- Board report status enum
CREATE TYPE exec_board_report_status_enum AS ENUM (
  'draft',           -- Initial draft state
  'generating',      -- Content generation in progress
  'review',          -- Ready for executive review
  'approved',        -- Approved by executive
  'published',       -- Published/distributed
  'archived'         -- Archived report
);

-- Board report section type enum
CREATE TYPE exec_board_report_section_type_enum AS ENUM (
  'executive_summary',        -- High-level executive summary
  'strategic_highlights',     -- Key strategic achievements
  'kpi_dashboard',            -- KPI metrics dashboard
  'financial_overview',       -- Financial performance summary
  'market_analysis',          -- Market and competitive analysis
  'risk_assessment',          -- Risk analysis and mitigation
  'brand_health',             -- Brand reputation and health
  'media_coverage',           -- Media coverage analysis
  'operational_updates',      -- Operational updates
  'talent_updates',           -- Team and talent updates
  'technology_updates',       -- Technology and product updates
  'sustainability',           -- ESG and sustainability
  'forward_outlook',          -- Forward-looking statements
  'action_items',             -- Action items and recommendations
  'appendix'                  -- Supporting materials
);

-- Board report section status enum
CREATE TYPE exec_board_report_section_status_enum AS ENUM (
  'pending',         -- Not yet generated
  'generating',      -- Currently being generated
  'generated',       -- Content generated
  'edited',          -- Manually edited
  'approved',        -- Section approved
  'error'            -- Generation error
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Main board reports table
CREATE TABLE IF NOT EXISTS exec_board_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Report metadata
  title TEXT NOT NULL,
  description TEXT,
  format exec_board_report_format_enum NOT NULL DEFAULT 'quarterly',
  status exec_board_report_status_enum NOT NULL DEFAULT 'draft',

  -- Time period coverage
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  fiscal_quarter TEXT, -- e.g., "Q1 2025"
  fiscal_year INTEGER,

  -- Configuration
  template_config JSONB DEFAULT '{}'::jsonb,
  section_types exec_board_report_section_type_enum[] DEFAULT ARRAY[
    'executive_summary',
    'strategic_highlights',
    'kpi_dashboard',
    'financial_overview',
    'market_analysis',
    'risk_assessment',
    'brand_health',
    'forward_outlook',
    'action_items'
  ]::exec_board_report_section_type_enum[],

  -- Generation settings
  llm_model TEXT DEFAULT 'gpt-4o',
  tone TEXT DEFAULT 'professional', -- professional, formal, executive
  target_length TEXT DEFAULT 'comprehensive', -- brief, standard, comprehensive

  -- Output artifacts
  pdf_storage_path TEXT,
  pptx_storage_path TEXT,
  html_content TEXT,

  -- Approval workflow
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Generation metadata
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_duration_ms INTEGER,
  total_tokens_used INTEGER DEFAULT 0,
  generation_error TEXT,

  -- Upstream data sources summary
  data_sources_used JSONB DEFAULT '{}'::jsonb,

  -- Archival
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board report sections table
CREATE TABLE IF NOT EXISTS exec_board_report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES exec_board_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Section metadata
  section_type exec_board_report_section_type_enum NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Content
  content TEXT,
  content_html TEXT,
  summary TEXT, -- Brief summary for TOC

  -- Generation metadata
  status exec_board_report_section_status_enum NOT NULL DEFAULT 'pending',
  model_name TEXT,
  prompt_used TEXT,
  tokens_used INTEGER,
  generation_duration_ms INTEGER,
  generation_error TEXT,

  -- Source data
  source_data JSONB DEFAULT '{}'::jsonb,

  -- Visibility and editing
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_editable BOOLEAN NOT NULL DEFAULT true,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ,
  original_content TEXT, -- Store original before edits

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board report data sources table (tracks which upstream systems contributed data)
CREATE TABLE IF NOT EXISTS exec_board_report_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES exec_board_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES exec_board_report_sections(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Source identification
  source_system TEXT NOT NULL, -- e.g., 'exec_command_center', 'risk_radar', 'media_performance'
  source_sprint TEXT, -- e.g., 'S61', 'S60'
  source_table TEXT, -- e.g., 'exec_dashboards', 'risk_forecasts'
  source_record_ids UUID[], -- IDs of records used

  -- Data snapshot
  data_snapshot JSONB DEFAULT '{}'::jsonb,
  data_fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board report audience table (who receives/views the report)
CREATE TABLE IF NOT EXISTS exec_board_report_audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES exec_board_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Recipient info
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT, -- e.g., 'CEO', 'CFO', 'Board Member'

  -- Access control
  access_level TEXT NOT NULL DEFAULT 'view', -- view, comment, approve
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Delivery tracking
  last_sent_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(report_id, email)
);

-- Board report audit log table
CREATE TABLE IF NOT EXISTS exec_board_report_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES exec_board_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Action info
  action TEXT NOT NULL, -- 'created', 'updated', 'generated', 'reviewed', 'approved', 'published', 'archived', etc.
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,

  -- Change details
  changes JSONB DEFAULT '{}'::jsonb,
  section_id UUID REFERENCES exec_board_report_sections(id) ON DELETE SET NULL,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Main reports indexes
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_org_id ON exec_board_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_status ON exec_board_reports(status);
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_format ON exec_board_reports(format);
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_period ON exec_board_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_fiscal ON exec_board_reports(fiscal_year, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_created_at ON exec_board_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_board_reports_not_archived ON exec_board_reports(org_id) WHERE is_archived = false;

-- Sections indexes
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sections_report_id ON exec_board_report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sections_org_id ON exec_board_report_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sections_type ON exec_board_report_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sections_sort ON exec_board_report_sections(report_id, sort_order);

-- Sources indexes
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sources_report_id ON exec_board_report_sources(report_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sources_section_id ON exec_board_report_sources(section_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_sources_system ON exec_board_report_sources(source_system);

-- Audience indexes
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audience_report_id ON exec_board_report_audience(report_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audience_org_id ON exec_board_report_audience(org_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audience_email ON exec_board_report_audience(email);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audience_user_id ON exec_board_report_audience(user_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audit_log_report_id ON exec_board_report_audit_log(report_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audit_log_org_id ON exec_board_report_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audit_log_action ON exec_board_report_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_exec_board_report_audit_log_created_at ON exec_board_report_audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for exec_board_reports
CREATE OR REPLACE FUNCTION update_exec_board_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exec_board_reports_updated_at
  BEFORE UPDATE ON exec_board_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_exec_board_reports_updated_at();

-- Auto-update updated_at for exec_board_report_sections
CREATE OR REPLACE FUNCTION update_exec_board_report_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exec_board_report_sections_updated_at
  BEFORE UPDATE ON exec_board_report_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_exec_board_report_sections_updated_at();

-- Auto-update updated_at for exec_board_report_audience
CREATE OR REPLACE FUNCTION update_exec_board_report_audience_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exec_board_report_audience_updated_at
  BEFORE UPDATE ON exec_board_report_audience
  FOR EACH ROW
  EXECUTE FUNCTION update_exec_board_report_audience_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE exec_board_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_board_report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_board_report_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_board_report_audience ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_board_report_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for exec_board_reports
CREATE POLICY exec_board_reports_org_isolation ON exec_board_reports
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for exec_board_report_sections
CREATE POLICY exec_board_report_sections_org_isolation ON exec_board_report_sections
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for exec_board_report_sources
CREATE POLICY exec_board_report_sources_org_isolation ON exec_board_report_sources
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for exec_board_report_audience
CREATE POLICY exec_board_report_audience_org_isolation ON exec_board_report_audience
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for exec_board_report_audit_log
CREATE POLICY exec_board_report_audit_log_org_isolation ON exec_board_report_audit_log
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exec_board_reports IS 'S63: Executive board reports and quarterly packs';
COMMENT ON TABLE exec_board_report_sections IS 'S63: Individual sections within board reports';
COMMENT ON TABLE exec_board_report_sources IS 'S63: Tracks data sources used in report generation';
COMMENT ON TABLE exec_board_report_audience IS 'S63: Board report recipients and access control';
COMMENT ON TABLE exec_board_report_audit_log IS 'S63: Audit trail for board report actions';
