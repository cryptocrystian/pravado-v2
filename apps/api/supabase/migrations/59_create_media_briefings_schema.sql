-- ============================================================================
-- Migration 59: Media Briefings & Executive Talking Points Schema (Sprint S54)
-- ============================================================================
-- Creates tables for AI-powered media briefing generation and executive
-- talking points, integrating intelligence from S38-S53 modules.
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Briefing section types
CREATE TYPE briefing_section_type AS ENUM (
  'executive_summary',
  'key_messages',
  'media_landscape',
  'competitive_analysis',
  'journalist_intelligence',
  'audience_insights',
  'performance_metrics',
  'recommended_actions',
  'qa_preparation',
  'appendix'
);

-- Talking point categories
CREATE TYPE talking_point_category AS ENUM (
  'primary_message',
  'supporting_point',
  'defensive_point',
  'bridging_statement',
  'call_to_action',
  'stat_highlight',
  'quote_suggestion',
  'pivot_phrase'
);

-- Insight strength levels
CREATE TYPE insight_strength AS ENUM (
  'strong',
  'moderate',
  'weak',
  'speculative'
);

-- Briefing format types
CREATE TYPE brief_format_type AS ENUM (
  'full_brief',
  'executive_summary',
  'talking_points_only',
  'media_prep',
  'crisis_brief',
  'interview_prep'
);

-- Briefing status
CREATE TYPE briefing_status AS ENUM (
  'draft',
  'generating',
  'generated',
  'reviewed',
  'approved',
  'archived'
);

-- Source types for briefing references
CREATE TYPE briefing_source_type AS ENUM (
  'press_release',
  'pitch',
  'media_mention',
  'journalist_profile',
  'media_list',
  'audience_persona',
  'competitive_intel',
  'performance_metric',
  'relationship_event',
  'enrichment_data',
  'external_article',
  'internal_note'
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Media Briefings - Core briefing documents
CREATE TABLE IF NOT EXISTS media_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  -- Briefing metadata
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  format brief_format_type NOT NULL DEFAULT 'full_brief',
  status briefing_status NOT NULL DEFAULT 'draft',

  -- Context and targeting
  story_id UUID,                           -- Link to press release or pitch
  journalist_ids UUID[] DEFAULT '{}',      -- Target journalists
  outlet_ids UUID[] DEFAULT '{}',          -- Target outlets
  persona_ids UUID[] DEFAULT '{}',         -- Target audience personas
  competitor_ids UUID[] DEFAULT '{}',      -- Competitors to analyze

  -- Generation configuration
  tone VARCHAR(100) DEFAULT 'professional', -- professional, conversational, formal
  focus_areas TEXT[] DEFAULT '{}',         -- Custom focus areas
  excluded_topics TEXT[] DEFAULT '{}',     -- Topics to avoid
  custom_instructions TEXT,                -- Additional LLM instructions

  -- Generated content (JSONB for flexibility)
  executive_summary TEXT,
  key_takeaways JSONB DEFAULT '[]',        -- Array of key points
  generated_insights JSONB DEFAULT '[]',   -- AI-generated insights

  -- Metrics and scoring
  confidence_score NUMERIC(5,2),           -- 0-100 confidence in generation
  relevance_score NUMERIC(5,2),            -- 0-100 relevance to context
  completeness_score NUMERIC(5,2),         -- 0-100 completeness

  -- LLM generation metadata
  llm_model VARCHAR(100),
  generation_tokens_used INTEGER,
  generation_duration_ms INTEGER,
  last_generated_at TIMESTAMPTZ,

  -- User workflow
  created_by UUID,
  reviewed_by UUID,
  approved_by UUID,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Briefing Sections - Individual sections within a briefing
CREATE TABLE IF NOT EXISTS media_briefing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  briefing_id UUID NOT NULL REFERENCES media_briefings(id) ON DELETE CASCADE,

  -- Section metadata
  section_type briefing_section_type NOT NULL,
  title VARCHAR(300),
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Content
  content TEXT,                            -- Main section content
  bullet_points JSONB DEFAULT '[]',        -- Structured bullet points
  supporting_data JSONB DEFAULT '{}',      -- Charts, stats, etc.

  -- Source tracking
  source_ids UUID[] DEFAULT '{}',          -- References to source records
  source_summary TEXT,                     -- Summary of sources used

  -- Generation metadata
  is_generated BOOLEAN DEFAULT FALSE,
  generation_prompt TEXT,                  -- Prompt used (truncated)
  llm_model VARCHAR(100),
  tokens_used INTEGER,
  generation_duration_ms INTEGER,

  -- User modifications
  is_manually_edited BOOLEAN DEFAULT FALSE,
  original_content TEXT,                   -- Preserved if edited
  edited_by UUID,
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Briefing Sources - Source references for briefings
CREATE TABLE IF NOT EXISTS media_briefing_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  briefing_id UUID NOT NULL REFERENCES media_briefings(id) ON DELETE CASCADE,
  section_id UUID REFERENCES media_briefing_sections(id) ON DELETE SET NULL,

  -- Source identification
  source_type briefing_source_type NOT NULL,
  source_id UUID,                          -- ID in source table
  source_url TEXT,                         -- External URL if applicable

  -- Source content
  title VARCHAR(500),
  excerpt TEXT,                            -- Relevant excerpt
  relevance_score NUMERIC(5,2),            -- 0-100 relevance
  insight_strength insight_strength,

  -- Metadata
  source_date TIMESTAMPTZ,
  author_name VARCHAR(255),
  outlet_name VARCHAR(255),

  -- Usage tracking
  is_cited BOOLEAN DEFAULT FALSE,
  citation_text TEXT,
  used_in_sections UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Talking Points - Executive talking points
CREATE TABLE IF NOT EXISTS media_talking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  briefing_id UUID REFERENCES media_briefings(id) ON DELETE CASCADE,

  -- Talking point content
  category talking_point_category NOT NULL,
  headline VARCHAR(300) NOT NULL,          -- Short headline
  content TEXT NOT NULL,                   -- Full talking point
  supporting_facts JSONB DEFAULT '[]',     -- Supporting data points

  -- Context
  target_audience VARCHAR(255),            -- Who this is for
  use_case VARCHAR(255),                   -- When to use
  context_notes TEXT,                      -- Additional context

  -- Related entities
  journalist_ids UUID[] DEFAULT '{}',
  persona_ids UUID[] DEFAULT '{}',
  competitor_ids UUID[] DEFAULT '{}',

  -- Scoring
  priority_score INTEGER DEFAULT 50,       -- 1-100 priority
  confidence_score NUMERIC(5,2),           -- 0-100 confidence
  effectiveness_score NUMERIC(5,2),        -- 0-100 predicted effectiveness

  -- Generation metadata
  is_generated BOOLEAN DEFAULT TRUE,
  llm_model VARCHAR(100),
  generation_prompt TEXT,

  -- User workflow
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Briefing Audit Log - Track all generation events
CREATE TABLE IF NOT EXISTS media_briefing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  briefing_id UUID REFERENCES media_briefings(id) ON DELETE SET NULL,
  section_id UUID REFERENCES media_briefing_sections(id) ON DELETE SET NULL,
  talking_point_id UUID REFERENCES media_talking_points(id) ON DELETE SET NULL,

  -- User context
  user_id UUID NOT NULL,

  -- Action details
  action VARCHAR(100) NOT NULL,            -- generate, regenerate, edit, approve, etc.
  action_details JSONB DEFAULT '{}',

  -- LLM details (for generation events)
  llm_model VARCHAR(100),
  prompt_snapshot TEXT,                    -- Truncated prompt for audit
  tokens_input INTEGER,
  tokens_output INTEGER,
  total_tokens INTEGER,
  duration_ms INTEGER,

  -- Response details
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Media Briefings indexes
CREATE INDEX idx_media_briefings_org_id ON media_briefings(org_id);
CREATE INDEX idx_media_briefings_story_id ON media_briefings(story_id);
CREATE INDEX idx_media_briefings_status ON media_briefings(org_id, status);
CREATE INDEX idx_media_briefings_format ON media_briefings(org_id, format);
CREATE INDEX idx_media_briefings_created_at ON media_briefings(org_id, created_at DESC);
CREATE INDEX idx_media_briefings_journalist_ids ON media_briefings USING GIN(journalist_ids);
CREATE INDEX idx_media_briefings_persona_ids ON media_briefings USING GIN(persona_ids);
CREATE INDEX idx_media_briefings_competitor_ids ON media_briefings USING GIN(competitor_ids);

-- Media Briefing Sections indexes
CREATE INDEX idx_media_briefing_sections_briefing_id ON media_briefing_sections(briefing_id);
CREATE INDEX idx_media_briefing_sections_org_id ON media_briefing_sections(org_id);
CREATE INDEX idx_media_briefing_sections_type ON media_briefing_sections(briefing_id, section_type);
CREATE INDEX idx_media_briefing_sections_order ON media_briefing_sections(briefing_id, order_index);

-- Media Briefing Sources indexes
CREATE INDEX idx_media_briefing_sources_briefing_id ON media_briefing_sources(briefing_id);
CREATE INDEX idx_media_briefing_sources_section_id ON media_briefing_sources(section_id);
CREATE INDEX idx_media_briefing_sources_org_id ON media_briefing_sources(org_id);
CREATE INDEX idx_media_briefing_sources_type ON media_briefing_sources(org_id, source_type);
CREATE INDEX idx_media_briefing_sources_source_id ON media_briefing_sources(source_id);

-- Media Talking Points indexes
CREATE INDEX idx_media_talking_points_org_id ON media_talking_points(org_id);
CREATE INDEX idx_media_talking_points_briefing_id ON media_talking_points(briefing_id);
CREATE INDEX idx_media_talking_points_category ON media_talking_points(org_id, category);
CREATE INDEX idx_media_talking_points_priority ON media_talking_points(org_id, priority_score DESC);
CREATE INDEX idx_media_talking_points_approved ON media_talking_points(org_id, is_approved);

-- Media Briefing Audit Log indexes
CREATE INDEX idx_media_briefing_audit_log_org_id ON media_briefing_audit_log(org_id);
CREATE INDEX idx_media_briefing_audit_log_briefing_id ON media_briefing_audit_log(briefing_id);
CREATE INDEX idx_media_briefing_audit_log_user_id ON media_briefing_audit_log(user_id);
CREATE INDEX idx_media_briefing_audit_log_action ON media_briefing_audit_log(org_id, action);
CREATE INDEX idx_media_briefing_audit_log_created_at ON media_briefing_audit_log(org_id, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for media_briefings
CREATE OR REPLACE FUNCTION update_media_briefings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_media_briefings_updated_at
  BEFORE UPDATE ON media_briefings
  FOR EACH ROW
  EXECUTE FUNCTION update_media_briefings_updated_at();

-- Auto-update updated_at for media_briefing_sections
CREATE TRIGGER trigger_media_briefing_sections_updated_at
  BEFORE UPDATE ON media_briefing_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_media_briefings_updated_at();

-- Auto-update updated_at for media_talking_points
CREATE TRIGGER trigger_media_talking_points_updated_at
  BEFORE UPDATE ON media_talking_points
  FOR EACH ROW
  EXECUTE FUNCTION update_media_briefings_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE media_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_briefing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_briefing_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_talking_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_briefing_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_briefings
CREATE POLICY media_briefings_select_policy ON media_briefings
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefings_insert_policy ON media_briefings
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefings_update_policy ON media_briefings
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefings_delete_policy ON media_briefings
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for media_briefing_sections
CREATE POLICY media_briefing_sections_select_policy ON media_briefing_sections
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefing_sections_insert_policy ON media_briefing_sections
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefing_sections_update_policy ON media_briefing_sections
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefing_sections_delete_policy ON media_briefing_sections
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for media_briefing_sources
CREATE POLICY media_briefing_sources_select_policy ON media_briefing_sources
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefing_sources_insert_policy ON media_briefing_sources
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefing_sources_delete_policy ON media_briefing_sources
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for media_talking_points
CREATE POLICY media_talking_points_select_policy ON media_talking_points
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_talking_points_insert_policy ON media_talking_points
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_talking_points_update_policy ON media_talking_points
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_talking_points_delete_policy ON media_talking_points
  FOR DELETE USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for media_briefing_audit_log
CREATE POLICY media_briefing_audit_log_select_policy ON media_briefing_audit_log
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY media_briefing_audit_log_insert_policy ON media_briefing_audit_log
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE media_briefings IS 'Sprint S54: AI-generated media briefing documents';
COMMENT ON TABLE media_briefing_sections IS 'Sprint S54: Individual sections within a media briefing';
COMMENT ON TABLE media_briefing_sources IS 'Sprint S54: Source references used in briefing generation';
COMMENT ON TABLE media_talking_points IS 'Sprint S54: Executive talking points for media interactions';
COMMENT ON TABLE media_briefing_audit_log IS 'Sprint S54: Audit trail for briefing generation events';
