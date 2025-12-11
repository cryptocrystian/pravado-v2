-- Migration 65: Executive Command Center Schema (Sprint S61)
-- Executive Command Center & Cross-System Insights V1
-- Provides unified executive dashboards with KPIs, insights, and narratives

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Time window for dashboard analysis
CREATE TYPE exec_dashboard_time_window AS ENUM (
  '24h',
  '7d',
  '30d',
  '90d'
);

-- Primary focus area for dashboard
CREATE TYPE exec_dashboard_primary_focus AS ENUM (
  'risk',
  'reputation',
  'growth',
  'governance',
  'mixed'
);

-- Source system for insights
CREATE TYPE exec_insight_source_system AS ENUM (
  'risk_radar',
  'crisis',
  'reputation',
  'governance',
  'media_performance',
  'competitive_intel',
  'personas',
  'outreach',
  'media_monitoring',
  'press_releases',
  'pitches',
  'media_lists',
  'journalist_discovery',
  'other'
);

-- Audit action types
CREATE TYPE exec_dashboard_action_type AS ENUM (
  'created',
  'updated',
  'deleted',
  'viewed',
  'refreshed',
  'narrative_generated',
  'exported'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1) exec_dashboards - Main dashboard configuration and cached summary
CREATE TABLE exec_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Executive Dashboard',
  description TEXT,
  time_window exec_dashboard_time_window NOT NULL DEFAULT '7d',
  primary_focus exec_dashboard_primary_focus NOT NULL DEFAULT 'mixed',
  filters JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_refreshed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) exec_dashboard_insights - Cross-system insights
CREATE TABLE exec_dashboard_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES exec_dashboards(id) ON DELETE CASCADE,
  source_system exec_insight_source_system NOT NULL,
  insight_type VARCHAR(100) NOT NULL,
  severity_or_impact NUMERIC(5,2) DEFAULT 0,
  category VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  link_url TEXT,
  linked_entity_type VARCHAR(100),
  linked_entity_id UUID,
  is_top_insight BOOLEAN NOT NULL DEFAULT false,
  is_opportunity BOOLEAN NOT NULL DEFAULT false,
  is_risk BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) exec_dashboard_kpis - Key performance indicators
CREATE TABLE exec_dashboard_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES exec_dashboards(id) ON DELETE CASCADE,
  metric_key VARCHAR(100) NOT NULL,
  metric_label VARCHAR(255) NOT NULL,
  metric_value NUMERIC(15,4) NOT NULL DEFAULT 0,
  metric_unit VARCHAR(50),
  metric_trend JSONB DEFAULT '{"direction": "flat", "change": 0, "previous_value": null}',
  display_order INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  source_system exec_insight_source_system,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) exec_dashboard_narratives - LLM-generated executive summaries
CREATE TABLE exec_dashboard_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES exec_dashboards(id) ON DELETE CASCADE,
  model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  narrative_text TEXT NOT NULL,
  risks_section TEXT,
  opportunities_section TEXT,
  storyline_section TEXT,
  context_snapshot JSONB DEFAULT '{}',
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) exec_dashboard_audit_log - Audit trail for dashboard actions
CREATE TABLE exec_dashboard_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES exec_dashboards(id) ON DELETE SET NULL,
  action_type exec_dashboard_action_type NOT NULL,
  user_id UUID,
  description TEXT,
  meta JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- exec_dashboards indexes
CREATE INDEX idx_exec_dashboards_org_id ON exec_dashboards(org_id);
CREATE INDEX idx_exec_dashboards_org_archived ON exec_dashboards(org_id, is_archived);
CREATE INDEX idx_exec_dashboards_org_default ON exec_dashboards(org_id, is_default) WHERE is_default = true;
CREATE INDEX idx_exec_dashboards_created_at ON exec_dashboards(created_at DESC);

-- exec_dashboard_insights indexes
CREATE INDEX idx_exec_dashboard_insights_org_id ON exec_dashboard_insights(org_id);
CREATE INDEX idx_exec_dashboard_insights_dashboard_id ON exec_dashboard_insights(dashboard_id);
CREATE INDEX idx_exec_dashboard_insights_source ON exec_dashboard_insights(dashboard_id, source_system);
CREATE INDEX idx_exec_dashboard_insights_top ON exec_dashboard_insights(dashboard_id, is_top_insight) WHERE is_top_insight = true;
CREATE INDEX idx_exec_dashboard_insights_risk ON exec_dashboard_insights(dashboard_id, is_risk) WHERE is_risk = true;
CREATE INDEX idx_exec_dashboard_insights_opportunity ON exec_dashboard_insights(dashboard_id, is_opportunity) WHERE is_opportunity = true;
CREATE INDEX idx_exec_dashboard_insights_sort ON exec_dashboard_insights(dashboard_id, sort_order);
CREATE INDEX idx_exec_dashboard_insights_created_at ON exec_dashboard_insights(created_at DESC);

-- exec_dashboard_kpis indexes
CREATE INDEX idx_exec_dashboard_kpis_org_id ON exec_dashboard_kpis(org_id);
CREATE INDEX idx_exec_dashboard_kpis_dashboard_id ON exec_dashboard_kpis(dashboard_id);
CREATE INDEX idx_exec_dashboard_kpis_metric_key ON exec_dashboard_kpis(dashboard_id, metric_key);
CREATE INDEX idx_exec_dashboard_kpis_display_order ON exec_dashboard_kpis(dashboard_id, display_order);
CREATE INDEX idx_exec_dashboard_kpis_created_at ON exec_dashboard_kpis(created_at DESC);

-- exec_dashboard_narratives indexes
CREATE INDEX idx_exec_dashboard_narratives_org_id ON exec_dashboard_narratives(org_id);
CREATE INDEX idx_exec_dashboard_narratives_dashboard_id ON exec_dashboard_narratives(dashboard_id);
CREATE INDEX idx_exec_dashboard_narratives_current ON exec_dashboard_narratives(dashboard_id, is_current) WHERE is_current = true;
CREATE INDEX idx_exec_dashboard_narratives_created_at ON exec_dashboard_narratives(created_at DESC);

-- exec_dashboard_audit_log indexes
CREATE INDEX idx_exec_dashboard_audit_log_org_id ON exec_dashboard_audit_log(org_id);
CREATE INDEX idx_exec_dashboard_audit_log_dashboard_id ON exec_dashboard_audit_log(dashboard_id);
CREATE INDEX idx_exec_dashboard_audit_log_action ON exec_dashboard_audit_log(org_id, action_type);
CREATE INDEX idx_exec_dashboard_audit_log_user ON exec_dashboard_audit_log(user_id);
CREATE INDEX idx_exec_dashboard_audit_log_created_at ON exec_dashboard_audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE exec_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_dashboard_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_dashboard_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_dashboard_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exec_dashboards
CREATE POLICY exec_dashboards_org_isolation ON exec_dashboards
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for exec_dashboard_insights
CREATE POLICY exec_dashboard_insights_org_isolation ON exec_dashboard_insights
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for exec_dashboard_kpis
CREATE POLICY exec_dashboard_kpis_org_isolation ON exec_dashboard_kpis
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for exec_dashboard_narratives
CREATE POLICY exec_dashboard_narratives_org_isolation ON exec_dashboard_narratives
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- RLS Policies for exec_dashboard_audit_log
CREATE POLICY exec_dashboard_audit_log_org_isolation ON exec_dashboard_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at trigger for exec_dashboards
CREATE TRIGGER exec_dashboards_updated_at
  BEFORE UPDATE ON exec_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default dashboard per org
CREATE OR REPLACE FUNCTION ensure_single_default_exec_dashboard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE exec_dashboards
    SET is_default = false
    WHERE org_id = NEW.org_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exec_dashboards_single_default
  BEFORE INSERT OR UPDATE ON exec_dashboards
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_exec_dashboard();

-- Mark previous narratives as not current when new one is added
CREATE OR REPLACE FUNCTION update_narrative_current_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE exec_dashboard_narratives
    SET is_current = false
    WHERE dashboard_id = NEW.dashboard_id
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exec_narratives_current_status
  BEFORE INSERT OR UPDATE ON exec_dashboard_narratives
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION update_narrative_current_status();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exec_dashboards IS 'Executive Command Center dashboards with configurable time windows and focus areas';
COMMENT ON TABLE exec_dashboard_insights IS 'Cross-system insights aggregated from Risk Radar, Crisis, Reputation, Governance, and other systems';
COMMENT ON TABLE exec_dashboard_kpis IS 'Key performance indicators with trends for executive dashboards';
COMMENT ON TABLE exec_dashboard_narratives IS 'LLM-generated executive narratives summarizing risks, opportunities, and weekly storylines';
COMMENT ON TABLE exec_dashboard_audit_log IS 'Audit trail for executive dashboard actions';

COMMENT ON COLUMN exec_dashboards.summary IS 'Cached summary snapshot containing key metrics and counts';
COMMENT ON COLUMN exec_dashboards.filters IS 'Optional filters for dashboard customization';
COMMENT ON COLUMN exec_dashboard_insights.is_top_insight IS 'Flagged as one of the top insights to surface prominently';
COMMENT ON COLUMN exec_dashboard_insights.is_risk IS 'Categorized as a risk insight';
COMMENT ON COLUMN exec_dashboard_insights.is_opportunity IS 'Categorized as an opportunity insight';
COMMENT ON COLUMN exec_dashboard_kpis.metric_trend IS 'Trend data including direction (up/down/flat), change percentage, and previous value';
COMMENT ON COLUMN exec_dashboard_narratives.context_snapshot IS 'Lightweight input context used for narrative generation';
