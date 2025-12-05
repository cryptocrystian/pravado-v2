-- Sprint S64: Investor Relations Pack & Earnings Narrative Engine V1
-- Migration 68: Create investor relations schema
-- Date: 2025-12-01

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Investor pack format enum
CREATE TYPE investor_pack_format_enum AS ENUM (
  'quarterly_earnings',  -- Quarterly earnings pack
  'annual_review',       -- Annual review/report
  'investor_day',        -- Investor day presentation
  'board_update',        -- Board update package
  'fundraising_round',   -- Fundraising materials
  'custom'               -- Custom format
);

-- Investor pack status enum
CREATE TYPE investor_pack_status_enum AS ENUM (
  'draft',           -- Initial draft state
  'generating',      -- Content generation in progress
  'review',          -- Ready for review
  'approved',        -- Approved by stakeholders
  'published',       -- Published/distributed
  'archived'         -- Archived pack
);

-- Primary audience enum
CREATE TYPE investor_primary_audience_enum AS ENUM (
  'board',           -- Board of directors
  'investors',       -- Institutional investors
  'analysts',        -- Financial analysts
  'internal_execs'   -- Internal executives
);

-- Investor section type enum
CREATE TYPE investor_section_type_enum AS ENUM (
  'executive_summary',      -- High-level executive summary
  'highlights',             -- Key highlights/wins
  'lowlights',              -- Challenges/misses
  'kpi_overview',           -- KPI dashboard summary
  'market_context',         -- Market environment analysis
  'competition',            -- Competitive landscape
  'product_updates',        -- Product and technology updates
  'go_to_market',           -- GTM strategy and execution
  'customer_stories',       -- Customer success stories
  'risk_and_mitigations',   -- Risk analysis and mitigation
  'governance',             -- Governance and compliance
  'esg',                    -- ESG/sustainability
  'outlook',                -- Forward-looking guidance
  'appendix'                -- Supporting materials
);

-- Investor section status enum
CREATE TYPE investor_section_status_enum AS ENUM (
  'draft',           -- Not yet generated
  'generated',       -- AI-generated content
  'edited',          -- Manually edited
  'approved'         -- Section approved
);

-- Source system enum for pack sources
CREATE TYPE investor_source_system_enum AS ENUM (
  'media_performance',     -- S52
  'board_reports',         -- S63
  'exec_digest',           -- S62
  'exec_command_center',   -- S61
  'risk_radar',            -- S60
  'governance',            -- S59
  'brand_reputation',      -- S56-S57
  'crisis',                -- S55
  'media_briefings',       -- S54
  'competitive_intel',     -- S53
  'persona',               -- S51
  'journalist_enrichment', -- S50
  'journalist_timeline',   -- S49
  'media_lists',           -- S47
  'journalist_graph',      -- S46
  'pr_outreach',           -- S44
  'media_monitoring',      -- S40-S43
  'pitch_engine',          -- S39
  'pr_generator',          -- S38
  'custom'                 -- Custom source
);

-- Q&A category enum
CREATE TYPE investor_qna_category_enum AS ENUM (
  'financials',      -- Financial questions
  'strategy',        -- Strategic direction
  'competition',     -- Competitive positioning
  'product',         -- Product/technology
  'risk',            -- Risk factors
  'governance',      -- Governance/compliance
  'operations',      -- Operational matters
  'other'            -- Other questions
);

-- Audit event type enum
CREATE TYPE investor_event_type_enum AS ENUM (
  'created',              -- Pack created
  'updated',              -- Pack updated
  'status_changed',       -- Status transition
  'section_generated',    -- Section content generated
  'section_regenerated',  -- Section regenerated
  'section_edited',       -- Section manually edited
  'qna_generated',        -- Q&A generated
  'qna_created',          -- Q&A manually created
  'published',            -- Pack published
  'archived'              -- Pack archived
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Investor packs table
CREATE TABLE IF NOT EXISTS investor_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Pack metadata
  title TEXT NOT NULL,
  description TEXT,
  format investor_pack_format_enum NOT NULL DEFAULT 'quarterly_earnings',
  status investor_pack_status_enum NOT NULL DEFAULT 'draft',
  primary_audience investor_primary_audience_enum NOT NULL DEFAULT 'investors',

  -- Time period coverage
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  fiscal_quarter TEXT, -- e.g., "Q1", "Q2", "Q3", "Q4"
  fiscal_year INTEGER,

  -- Summary data
  summary_json JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   revenue: number,
  --   revenue_growth: number,
  --   ebitda: number,
  --   sentiment_score: number,
  --   risk_score: number,
  --   key_metrics: [{name, value, change, trend}],
  --   highlights_count: number,
  --   lowlights_count: number
  -- }

  -- Configuration
  section_types investor_section_type_enum[] DEFAULT ARRAY[
    'executive_summary',
    'highlights',
    'lowlights',
    'kpi_overview',
    'market_context',
    'competition',
    'risk_and_mitigations',
    'outlook'
  ]::investor_section_type_enum[],

  -- Generation settings
  llm_model TEXT DEFAULT 'gpt-4o',
  tone TEXT DEFAULT 'professional', -- professional, formal, executive
  target_length TEXT DEFAULT 'comprehensive', -- brief, standard, comprehensive

  -- Output artifacts
  pdf_storage_path TEXT,
  pptx_storage_path TEXT,

  -- Workflow tracking
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

  -- Additional metadata
  meta JSONB DEFAULT '{}'::jsonb,

  -- Archival
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investor pack sections table
CREATE TABLE IF NOT EXISTS investor_pack_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES investor_packs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Section metadata
  section_type investor_section_type_enum NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Content
  content_md TEXT, -- Markdown content
  content_html TEXT, -- HTML rendered content
  summary TEXT, -- Brief summary

  -- Generation metadata
  status investor_section_status_enum NOT NULL DEFAULT 'draft',
  raw_llm_json JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   prompt: string,
  --   response: string,
  --   model: string,
  --   tokens_used: number,
  --   duration_ms: number
  -- }

  -- Source data used for generation
  source_data JSONB DEFAULT '{}'::jsonb,

  -- Visibility and editing
  is_visible BOOLEAN NOT NULL DEFAULT true,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ,
  original_content TEXT, -- Original before editing

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investor pack sources table
CREATE TABLE IF NOT EXISTS investor_pack_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES investor_packs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  section_id UUID REFERENCES investor_pack_sections(id) ON DELETE SET NULL,

  -- Source identification
  source_system investor_source_system_enum NOT NULL,
  source_ref_id TEXT, -- ID in upstream system
  source_sprint TEXT, -- e.g., "S52", "S60"

  -- Weighting and relevance
  weight FLOAT DEFAULT 1.0,
  relevance_score FLOAT,

  -- Data snapshot
  data_snapshot JSONB DEFAULT '{}'::jsonb,
  data_fetched_at TIMESTAMPTZ DEFAULT now(),

  -- Additional metadata
  meta JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investor Q&A table
CREATE TABLE IF NOT EXISTS investor_qna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES investor_packs(id) ON DELETE SET NULL, -- Nullable for reusable Q&A

  -- Q&A content
  question TEXT NOT NULL,
  answer_md TEXT NOT NULL,
  answer_html TEXT,

  -- Classification
  category investor_qna_category_enum NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Confidence and source
  confidence SMALLINT DEFAULT 80 CHECK (confidence >= 0 AND confidence <= 100),
  is_llm_generated BOOLEAN NOT NULL DEFAULT true,
  source_summary_json JSONB DEFAULT '{}'::jsonb,
  -- Structure: {
  --   sources: [{system, ref_id, relevance}],
  --   key_data_points: string[]
  -- }

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Workflow
  status TEXT DEFAULT 'draft', -- draft, approved, archived
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investor pack audit log table
CREATE TABLE IF NOT EXISTS investor_pack_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES investor_packs(id) ON DELETE CASCADE,

  -- Actor info
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,

  -- Event details
  event_type investor_event_type_enum NOT NULL,
  details_json JSONB DEFAULT '{}'::jsonb,

  -- LLM usage tracking
  model TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,

  -- Section reference (if applicable)
  section_id UUID REFERENCES investor_pack_sections(id) ON DELETE SET NULL,
  qna_id UUID REFERENCES investor_qna(id) ON DELETE SET NULL,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Investor packs indexes
CREATE INDEX IF NOT EXISTS idx_investor_packs_org_id ON investor_packs(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_packs_status ON investor_packs(status);
CREATE INDEX IF NOT EXISTS idx_investor_packs_format ON investor_packs(format);
CREATE INDEX IF NOT EXISTS idx_investor_packs_audience ON investor_packs(primary_audience);
CREATE INDEX IF NOT EXISTS idx_investor_packs_period ON investor_packs(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_investor_packs_fiscal ON investor_packs(fiscal_year, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_investor_packs_created_at ON investor_packs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investor_packs_not_archived ON investor_packs(org_id) WHERE is_archived = false;

-- Investor pack sections indexes
CREATE INDEX IF NOT EXISTS idx_investor_pack_sections_pack_id ON investor_pack_sections(pack_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sections_org_id ON investor_pack_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sections_type ON investor_pack_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sections_order ON investor_pack_sections(pack_id, order_index);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sections_status ON investor_pack_sections(status);

-- Investor pack sources indexes
CREATE INDEX IF NOT EXISTS idx_investor_pack_sources_pack_id ON investor_pack_sources(pack_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sources_org_id ON investor_pack_sources(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sources_section_id ON investor_pack_sources(section_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_sources_system ON investor_pack_sources(source_system);

-- Investor Q&A indexes
CREATE INDEX IF NOT EXISTS idx_investor_qna_org_id ON investor_qna(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_qna_pack_id ON investor_qna(pack_id);
CREATE INDEX IF NOT EXISTS idx_investor_qna_category ON investor_qna(category);
CREATE INDEX IF NOT EXISTS idx_investor_qna_status ON investor_qna(status);
CREATE INDEX IF NOT EXISTS idx_investor_qna_confidence ON investor_qna(confidence);
CREATE INDEX IF NOT EXISTS idx_investor_qna_created_at ON investor_qna(created_at DESC);

-- Investor pack audit log indexes
CREATE INDEX IF NOT EXISTS idx_investor_pack_audit_log_org_id ON investor_pack_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_audit_log_pack_id ON investor_pack_audit_log(pack_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_audit_log_user_id ON investor_pack_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_pack_audit_log_event_type ON investor_pack_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_investor_pack_audit_log_created_at ON investor_pack_audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for investor_packs
CREATE OR REPLACE FUNCTION update_investor_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_investor_packs_updated_at
  BEFORE UPDATE ON investor_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_investor_packs_updated_at();

-- Auto-update updated_at for investor_pack_sections
CREATE OR REPLACE FUNCTION update_investor_pack_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_investor_pack_sections_updated_at
  BEFORE UPDATE ON investor_pack_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_investor_pack_sections_updated_at();

-- Auto-update updated_at for investor_qna
CREATE OR REPLACE FUNCTION update_investor_qna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_investor_qna_updated_at
  BEFORE UPDATE ON investor_qna
  FOR EACH ROW
  EXECUTE FUNCTION update_investor_qna_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE investor_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_pack_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_pack_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_pack_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for investor_packs
CREATE POLICY investor_packs_org_isolation ON investor_packs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for investor_pack_sections
CREATE POLICY investor_pack_sections_org_isolation ON investor_pack_sections
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for investor_pack_sources
CREATE POLICY investor_pack_sources_org_isolation ON investor_pack_sources
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for investor_qna
CREATE POLICY investor_qna_org_isolation ON investor_qna
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS policies for investor_pack_audit_log
CREATE POLICY investor_pack_audit_log_org_isolation ON investor_pack_audit_log
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE investor_packs IS 'S64: Main investor relations packs for quarterly earnings, annual reviews, etc.';
COMMENT ON TABLE investor_pack_sections IS 'S64: Individual sections within an investor pack';
COMMENT ON TABLE investor_pack_sources IS 'S64: Tracks upstream data sources used for pack generation';
COMMENT ON TABLE investor_qna IS 'S64: Q&A bank for investor inquiries, reusable across packs';
COMMENT ON TABLE investor_pack_audit_log IS 'S64: Audit trail for investor pack activities';
