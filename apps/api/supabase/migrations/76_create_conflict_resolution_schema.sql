-- Migration 76: Insight Conflict Resolution Schema (Sprint S74)
-- Autonomous Insight Conflict Resolution Engine V1

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Conflict type enum
CREATE TYPE insight_conflict_type AS ENUM (
  'contradiction',
  'divergence',
  'ambiguity',
  'missing_data',
  'inconsistency'
);

-- Conflict severity enum
CREATE TYPE insight_conflict_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Conflict status enum
CREATE TYPE insight_conflict_status AS ENUM (
  'detected',
  'analyzing',
  'resolved',
  'dismissed'
);

-- Resolution type enum
CREATE TYPE insight_conflict_resolution_type AS ENUM (
  'ai_consensus',
  'weighted_truth',
  'source_priority',
  'hybrid'
);

-- ============================================================================
-- INSIGHT CONFLICTS TABLE
-- ============================================================================

CREATE TABLE insight_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Conflict classification
  conflict_type insight_conflict_type NOT NULL,
  severity insight_conflict_severity NOT NULL DEFAULT 'medium',
  status insight_conflict_status NOT NULL DEFAULT 'detected',

  -- Conflict details
  title TEXT NOT NULL,
  conflict_summary TEXT,
  source_entities JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Affected systems
  affected_systems TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Analysis metadata
  analysis_started_at TIMESTAMPTZ,
  analysis_completed_at TIMESTAMPTZ,
  analysis_result JSONB,

  -- Resolution metadata
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),

  -- Graph data
  conflict_graph JSONB,

  -- Clustering
  cluster_id UUID,
  cluster_similarity DECIMAL(5,4),

  -- Root cause analysis
  root_cause_analysis JSONB,

  -- Reality map linkage (S73)
  linked_reality_map_id UUID,
  linked_node_ids TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT valid_source_entities CHECK (jsonb_typeof(source_entities) = 'array'),
  CONSTRAINT valid_analysis_dates CHECK (
    analysis_completed_at IS NULL OR analysis_started_at IS NOT NULL
  ),
  CONSTRAINT valid_resolution CHECK (
    resolved_at IS NULL OR status IN ('resolved', 'dismissed')
  )
);

-- Indexes for insight_conflicts
CREATE INDEX idx_insight_conflicts_org_id ON insight_conflicts(org_id);
CREATE INDEX idx_insight_conflicts_status ON insight_conflicts(status);
CREATE INDEX idx_insight_conflicts_severity ON insight_conflicts(severity);
CREATE INDEX idx_insight_conflicts_type ON insight_conflicts(conflict_type);
CREATE INDEX idx_insight_conflicts_org_status ON insight_conflicts(org_id, status);
CREATE INDEX idx_insight_conflicts_org_severity ON insight_conflicts(org_id, severity);
CREATE INDEX idx_insight_conflicts_cluster ON insight_conflicts(cluster_id);
CREATE INDEX idx_insight_conflicts_created_at ON insight_conflicts(created_at DESC);
CREATE INDEX idx_insight_conflicts_affected_systems ON insight_conflicts USING GIN(affected_systems);
CREATE INDEX idx_insight_conflicts_source_entities ON insight_conflicts USING GIN(source_entities);

-- ============================================================================
-- INSIGHT CONFLICT ITEMS TABLE
-- ============================================================================

CREATE TABLE insight_conflict_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id UUID NOT NULL REFERENCES insight_conflicts(id) ON DELETE CASCADE,

  -- Entity reference
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Insight data
  raw_insight TEXT NOT NULL,
  processed_insight TEXT,

  -- Vector embedding for similarity
  vector JSONB,

  -- Source metadata
  source_system TEXT NOT NULL,
  source_timestamp TIMESTAMPTZ,
  confidence_score DECIMAL(5,4),

  -- Position in conflict
  item_role TEXT, -- 'primary', 'secondary', 'context'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for insight_conflict_items
CREATE INDEX idx_insight_conflict_items_conflict_id ON insight_conflict_items(conflict_id);
CREATE INDEX idx_insight_conflict_items_entity ON insight_conflict_items(entity_type, entity_id);
CREATE INDEX idx_insight_conflict_items_source ON insight_conflict_items(source_system);

-- ============================================================================
-- INSIGHT CONFLICT RESOLUTIONS TABLE
-- ============================================================================

CREATE TABLE insight_conflict_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id UUID NOT NULL REFERENCES insight_conflicts(id) ON DELETE CASCADE,

  -- Resolution type
  resolution_type insight_conflict_resolution_type NOT NULL,

  -- Resolution content
  resolved_summary TEXT NOT NULL,
  consensus_narrative TEXT,

  -- Recommended actions
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Resolution metadata
  resolution_confidence DECIMAL(5,4),
  resolution_rationale TEXT,

  -- Source weights (for weighted_truth)
  source_weights JSONB,

  -- Priority order (for source_priority)
  priority_order TEXT[],

  -- AI model info
  ai_model_used TEXT,
  ai_prompt_tokens INTEGER,
  ai_completion_tokens INTEGER,

  -- Human review
  human_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Accepted flag
  is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_recommended_actions CHECK (jsonb_typeof(recommended_actions) = 'array')
);

-- Indexes for insight_conflict_resolutions
CREATE INDEX idx_insight_conflict_resolutions_conflict_id ON insight_conflict_resolutions(conflict_id);
CREATE INDEX idx_insight_conflict_resolutions_type ON insight_conflict_resolutions(resolution_type);
CREATE INDEX idx_insight_conflict_resolutions_accepted ON insight_conflict_resolutions(is_accepted);

-- ============================================================================
-- INSIGHT CONFLICT AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE insight_conflict_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id UUID NOT NULL REFERENCES insight_conflicts(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL,

  -- Actor
  actor_id UUID REFERENCES users(id),
  actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'ai'

  -- Event details
  event_details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Previous state (for changes)
  previous_state JSONB,
  new_state JSONB,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for insight_conflict_audit_log
CREATE INDEX idx_insight_conflict_audit_log_conflict_id ON insight_conflict_audit_log(conflict_id);
CREATE INDEX idx_insight_conflict_audit_log_event_type ON insight_conflict_audit_log(event_type);
CREATE INDEX idx_insight_conflict_audit_log_actor ON insight_conflict_audit_log(actor_id);
CREATE INDEX idx_insight_conflict_audit_log_created_at ON insight_conflict_audit_log(created_at DESC);

-- ============================================================================
-- INSIGHT CONFLICT CLUSTERS TABLE (for grouping related conflicts)
-- ============================================================================

CREATE TABLE insight_conflict_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cluster metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Cluster characteristics
  primary_conflict_type insight_conflict_type,
  average_severity insight_conflict_severity,
  conflict_count INTEGER NOT NULL DEFAULT 0,

  -- Cluster centroid vector
  centroid_vector JSONB,

  -- Auto-generated or manual
  is_auto_generated BOOLEAN NOT NULL DEFAULT TRUE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for insight_conflict_clusters
CREATE INDEX idx_insight_conflict_clusters_org_id ON insight_conflict_clusters(org_id);
CREATE INDEX idx_insight_conflict_clusters_active ON insight_conflict_clusters(is_active);

-- ============================================================================
-- INSIGHT CONFLICT GRAPH EDGES TABLE (for conflict relationships)
-- ============================================================================

CREATE TABLE insight_conflict_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Edge endpoints
  source_conflict_id UUID NOT NULL REFERENCES insight_conflicts(id) ON DELETE CASCADE,
  target_conflict_id UUID NOT NULL REFERENCES insight_conflicts(id) ON DELETE CASCADE,

  -- Edge properties
  edge_type TEXT NOT NULL, -- 'related', 'caused_by', 'contradicts', 'supersedes'
  edge_weight DECIMAL(5,4) NOT NULL DEFAULT 1.0,

  -- Edge metadata
  edge_label TEXT,
  edge_metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT no_self_reference CHECK (source_conflict_id != target_conflict_id)
);

-- Indexes for insight_conflict_graph_edges
CREATE INDEX idx_insight_conflict_graph_edges_org ON insight_conflict_graph_edges(org_id);
CREATE INDEX idx_insight_conflict_graph_edges_source ON insight_conflict_graph_edges(source_conflict_id);
CREATE INDEX idx_insight_conflict_graph_edges_target ON insight_conflict_graph_edges(target_conflict_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE insight_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_conflict_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_conflict_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_conflict_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_conflict_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_conflict_graph_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insight_conflicts
CREATE POLICY "Users can view conflicts in their org"
  ON insight_conflicts FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert conflicts in their org"
  ON insight_conflicts FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update conflicts in their org"
  ON insight_conflicts FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete conflicts in their org"
  ON insight_conflicts FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- RLS Policies for insight_conflict_items
CREATE POLICY "Users can view conflict items in their org"
  ON insight_conflict_items FOR SELECT
  USING (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert conflict items in their org"
  ON insight_conflict_items FOR INSERT
  WITH CHECK (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete conflict items in their org"
  ON insight_conflict_items FOR DELETE
  USING (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for insight_conflict_resolutions
CREATE POLICY "Users can view resolutions in their org"
  ON insight_conflict_resolutions FOR SELECT
  USING (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert resolutions in their org"
  ON insight_conflict_resolutions FOR INSERT
  WITH CHECK (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update resolutions in their org"
  ON insight_conflict_resolutions FOR UPDATE
  USING (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for insight_conflict_audit_log
CREATE POLICY "Users can view audit logs in their org"
  ON insight_conflict_audit_log FOR SELECT
  USING (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert audit logs in their org"
  ON insight_conflict_audit_log FOR INSERT
  WITH CHECK (conflict_id IN (
    SELECT id FROM insight_conflicts WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for insight_conflict_clusters
CREATE POLICY "Users can view clusters in their org"
  ON insight_conflict_clusters FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage clusters in their org"
  ON insight_conflict_clusters FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- RLS Policies for insight_conflict_graph_edges
CREATE POLICY "Users can view edges in their org"
  ON insight_conflict_graph_edges FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage edges in their org"
  ON insight_conflict_graph_edges FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger for insight_conflicts
CREATE TRIGGER update_insight_conflicts_updated_at
  BEFORE UPDATE ON insight_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for insight_conflict_clusters
CREATE TRIGGER update_insight_conflict_clusters_updated_at
  BEFORE UPDATE ON insight_conflict_clusters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get conflict severity score
CREATE OR REPLACE FUNCTION get_conflict_severity_score(severity insight_conflict_severity)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE severity
    WHEN 'low' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'high' THEN 3
    WHEN 'critical' THEN 4
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to compute average severity for a cluster
CREATE OR REPLACE FUNCTION compute_cluster_average_severity(cluster_uuid UUID)
RETURNS insight_conflict_severity AS $$
DECLARE
  avg_score DECIMAL;
BEGIN
  SELECT AVG(get_conflict_severity_score(severity))
  INTO avg_score
  FROM insight_conflicts
  WHERE cluster_id = cluster_uuid;

  IF avg_score IS NULL THEN
    RETURN 'medium';
  ELSIF avg_score < 1.5 THEN
    RETURN 'low';
  ELSIF avg_score < 2.5 THEN
    RETURN 'medium';
  ELSIF avg_score < 3.5 THEN
    RETURN 'high';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update cluster stats
CREATE OR REPLACE FUNCTION update_cluster_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.cluster_id IS NOT NULL THEN
      UPDATE insight_conflict_clusters
      SET
        conflict_count = (
          SELECT COUNT(*) FROM insight_conflicts WHERE cluster_id = NEW.cluster_id
        ),
        average_severity = compute_cluster_average_severity(NEW.cluster_id),
        updated_at = NOW()
      WHERE id = NEW.cluster_id;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.cluster_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.cluster_id != NEW.cluster_id) THEN
      UPDATE insight_conflict_clusters
      SET
        conflict_count = (
          SELECT COUNT(*) FROM insight_conflicts WHERE cluster_id = OLD.cluster_id
        ),
        average_severity = compute_cluster_average_severity(OLD.cluster_id),
        updated_at = NOW()
      WHERE id = OLD.cluster_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cluster stats
CREATE TRIGGER update_cluster_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON insight_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_cluster_stats();

-- Function to get conflicts by entity
CREATE OR REPLACE FUNCTION get_conflicts_by_entity(
  p_org_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS SETOF insight_conflicts AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ic.*
  FROM insight_conflicts ic
  JOIN insight_conflict_items ici ON ici.conflict_id = ic.id
  WHERE ic.org_id = p_org_id
    AND ici.entity_type = p_entity_type
    AND ici.entity_id = p_entity_id
  ORDER BY ic.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get related conflicts (via graph edges)
CREATE OR REPLACE FUNCTION get_related_conflicts(p_conflict_id UUID)
RETURNS TABLE(
  conflict_id UUID,
  edge_type TEXT,
  edge_weight DECIMAL(5,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT target_conflict_id, icge.edge_type, icge.edge_weight
  FROM insight_conflict_graph_edges icge
  WHERE source_conflict_id = p_conflict_id
  UNION
  SELECT source_conflict_id, icge.edge_type, icge.edge_weight
  FROM insight_conflict_graph_edges icge
  WHERE target_conflict_id = p_conflict_id;
END;
$$ LANGUAGE plpgsql;

-- Function to compute conflict statistics for an org
CREATE OR REPLACE FUNCTION get_conflict_stats(p_org_id UUID)
RETURNS TABLE(
  total_conflicts BIGINT,
  detected_count BIGINT,
  analyzing_count BIGINT,
  resolved_count BIGINT,
  dismissed_count BIGINT,
  critical_count BIGINT,
  high_count BIGINT,
  medium_count BIGINT,
  low_count BIGINT,
  contradiction_count BIGINT,
  divergence_count BIGINT,
  ambiguity_count BIGINT,
  missing_data_count BIGINT,
  inconsistency_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_conflicts,
    COUNT(*) FILTER (WHERE status = 'detected')::BIGINT as detected_count,
    COUNT(*) FILTER (WHERE status = 'analyzing')::BIGINT as analyzing_count,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_count,
    COUNT(*) FILTER (WHERE status = 'dismissed')::BIGINT as dismissed_count,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_count,
    COUNT(*) FILTER (WHERE severity = 'high')::BIGINT as high_count,
    COUNT(*) FILTER (WHERE severity = 'medium')::BIGINT as medium_count,
    COUNT(*) FILTER (WHERE severity = 'low')::BIGINT as low_count,
    COUNT(*) FILTER (WHERE conflict_type = 'contradiction')::BIGINT as contradiction_count,
    COUNT(*) FILTER (WHERE conflict_type = 'divergence')::BIGINT as divergence_count,
    COUNT(*) FILTER (WHERE conflict_type = 'ambiguity')::BIGINT as ambiguity_count,
    COUNT(*) FILTER (WHERE conflict_type = 'missing_data')::BIGINT as missing_data_count,
    COUNT(*) FILTER (WHERE conflict_type = 'inconsistency')::BIGINT as inconsistency_count
  FROM insight_conflicts
  WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE insight_conflicts IS 'Stores detected conflicts and inconsistencies across intelligence systems (S74)';
COMMENT ON TABLE insight_conflict_items IS 'Individual insight items that are part of a conflict';
COMMENT ON TABLE insight_conflict_resolutions IS 'AI-generated and human-approved conflict resolutions';
COMMENT ON TABLE insight_conflict_audit_log IS 'Audit trail for conflict detection and resolution';
COMMENT ON TABLE insight_conflict_clusters IS 'Groups of related conflicts for batch analysis';
COMMENT ON TABLE insight_conflict_graph_edges IS 'Relationships between conflicts for graph visualization';

COMMENT ON COLUMN insight_conflicts.source_entities IS 'Array of entity references involved in the conflict';
COMMENT ON COLUMN insight_conflicts.conflict_graph IS 'Pre-computed graph data for visualization';
COMMENT ON COLUMN insight_conflicts.root_cause_analysis IS 'AI-generated root cause analysis';
COMMENT ON COLUMN insight_conflict_items.vector IS 'Vector embedding for similarity comparison';
COMMENT ON COLUMN insight_conflict_resolutions.source_weights IS 'Weights assigned to each source in weighted_truth resolution';
COMMENT ON COLUMN insight_conflict_resolutions.priority_order IS 'Source priority order for source_priority resolution';
