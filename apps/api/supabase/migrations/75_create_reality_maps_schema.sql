-- Migration 75: Reality Maps Schema (Sprint S73)
-- AI-Driven Multi-Outcome "Reality Maps" Engine
-- Creates branching tree of possible futures from multi-scenario suites

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Reality map status
CREATE TYPE reality_map_status AS ENUM (
  'draft',
  'generating',
  'analyzing',
  'completed',
  'failed'
);

-- Reality map node type
CREATE TYPE reality_map_node_type AS ENUM (
  'root',
  'branch',
  'leaf',
  'terminal'
);

-- Reality map analysis status
CREATE TYPE reality_map_analysis_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main reality maps table
CREATE TABLE IF NOT EXISTS reality_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  suite_id UUID REFERENCES scenario_suites(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status reality_map_status NOT NULL DEFAULT 'draft',

  -- Generation parameters
  parameters JSONB NOT NULL DEFAULT '{
    "maxDepth": 5,
    "branchingFactor": 3,
    "minProbability": 0.05,
    "includeRiskAnalysis": true,
    "includeOpportunityAnalysis": true,
    "narrativeStyle": "executive",
    "probabilityModel": "weighted_average"
  }'::jsonb,

  -- Generation metadata
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  total_nodes INTEGER DEFAULT 0,
  total_edges INTEGER DEFAULT 0,
  total_paths INTEGER DEFAULT 0,
  max_depth_reached INTEGER DEFAULT 0,

  -- Analysis results
  analysis_status reality_map_analysis_status DEFAULT 'pending',
  executive_summary TEXT,
  top_risks JSONB,
  top_opportunities JSONB,
  key_decision_points JSONB,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT reality_maps_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- Reality map nodes - each node represents a possible reality/outcome
CREATE TABLE IF NOT EXISTS reality_map_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reality_map_id UUID NOT NULL REFERENCES reality_maps(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES reality_map_nodes(id) ON DELETE CASCADE,

  -- Node identification
  node_type reality_map_node_type NOT NULL DEFAULT 'branch',
  depth INTEGER NOT NULL DEFAULT 0,
  path_index VARCHAR(100), -- e.g., "0.1.2" for path traversal
  label VARCHAR(255),

  -- Probability and scoring
  probability FLOAT NOT NULL DEFAULT 0.0 CHECK (probability >= 0 AND probability <= 1),
  cumulative_probability FLOAT DEFAULT 0.0,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- AI-generated content
  ai_summary TEXT,
  narrative_delta TEXT, -- How this differs from parent
  key_drivers JSONB DEFAULT '[]'::jsonb, -- Top 3 drivers
  expected_timeline VARCHAR(100),

  -- Simulation linkage
  simulation_id UUID, -- Link to S71 simulation
  simulation_run_id UUID, -- Link to specific run
  suite_item_id UUID, -- Link to S72 suite item

  -- Snapshot of state at this node
  snapshot JSONB DEFAULT '{}'::jsonb,

  -- Risk/opportunity details
  risk_factors JSONB DEFAULT '[]'::jsonb,
  opportunity_factors JSONB DEFAULT '[]'::jsonb,
  mitigation_strategies JSONB DEFAULT '[]'::jsonb,
  action_recommendations JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  generation_order INTEGER,
  processing_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reality map edges - connections between nodes
CREATE TABLE IF NOT EXISTS reality_map_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reality_map_id UUID NOT NULL REFERENCES reality_maps(id) ON DELETE CASCADE,
  parent_node_id UUID NOT NULL REFERENCES reality_map_nodes(id) ON DELETE CASCADE,
  child_node_id UUID NOT NULL REFERENCES reality_map_nodes(id) ON DELETE CASCADE,

  -- Edge properties
  trigger JSONB NOT NULL DEFAULT '{}'::jsonb, -- What causes this transition
  trigger_type VARCHAR(50), -- e.g., 'simulation_outcome', 'risk_escalation', 'opportunity'
  transition_probability FLOAT DEFAULT 0.0,

  -- Edge metadata
  label VARCHAR(255),
  description TEXT,
  weight FLOAT DEFAULT 1.0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT reality_map_edges_no_self_loop CHECK (parent_node_id != child_node_id)
);

-- Reality map paths - pre-computed full paths through the graph
CREATE TABLE IF NOT EXISTS reality_map_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reality_map_id UUID NOT NULL REFERENCES reality_maps(id) ON DELETE CASCADE,

  -- Path definition
  path_nodes UUID[] NOT NULL, -- Ordered array of node IDs
  path_index VARCHAR(100), -- Unique path identifier like "0.1.2"
  depth INTEGER NOT NULL DEFAULT 0,

  -- Path metrics
  total_probability FLOAT NOT NULL DEFAULT 0.0,
  avg_risk_score FLOAT DEFAULT 0.0,
  avg_opportunity_score FLOAT DEFAULT 0.0,
  max_risk_score INTEGER DEFAULT 0,
  max_opportunity_score INTEGER DEFAULT 0,

  -- Path narrative
  path_summary TEXT,
  path_title VARCHAR(255),
  outcome_type VARCHAR(50), -- 'best_case', 'worst_case', 'most_likely', 'high_risk', 'high_opportunity'

  -- Comparison data
  comparison_metrics JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reality map audit log
CREATE TABLE IF NOT EXISTS reality_map_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reality_map_id UUID NOT NULL REFERENCES reality_maps(id) ON DELETE CASCADE,
  node_id UUID REFERENCES reality_map_nodes(id) ON DELETE SET NULL,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  details JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reality map comparisons - for comparing multiple paths or maps
CREATE TABLE IF NOT EXISTS reality_map_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Comparison subjects
  reality_map_ids UUID[] NOT NULL,
  path_ids UUID[],

  -- Comparison results
  comparison_type VARCHAR(50) NOT NULL, -- 'maps', 'paths', 'nodes'
  comparison_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  narrative_comparison TEXT,
  risk_comparison JSONB,
  opportunity_comparison JSONB,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- reality_maps indexes
CREATE INDEX idx_reality_maps_org_id ON reality_maps(org_id);
CREATE INDEX idx_reality_maps_suite_id ON reality_maps(suite_id);
CREATE INDEX idx_reality_maps_status ON reality_maps(status);
CREATE INDEX idx_reality_maps_created_at ON reality_maps(created_at DESC);
CREATE INDEX idx_reality_maps_org_status ON reality_maps(org_id, status);

-- reality_map_nodes indexes
CREATE INDEX idx_reality_map_nodes_map_id ON reality_map_nodes(reality_map_id);
CREATE INDEX idx_reality_map_nodes_parent ON reality_map_nodes(parent_node_id);
CREATE INDEX idx_reality_map_nodes_depth ON reality_map_nodes(reality_map_id, depth);
CREATE INDEX idx_reality_map_nodes_probability ON reality_map_nodes(reality_map_id, probability DESC);
CREATE INDEX idx_reality_map_nodes_risk ON reality_map_nodes(reality_map_id, risk_score DESC);
CREATE INDEX idx_reality_map_nodes_opportunity ON reality_map_nodes(reality_map_id, opportunity_score DESC);
CREATE INDEX idx_reality_map_nodes_type ON reality_map_nodes(reality_map_id, node_type);
CREATE INDEX idx_reality_map_nodes_path ON reality_map_nodes(reality_map_id, path_index);

-- reality_map_edges indexes
CREATE INDEX idx_reality_map_edges_map_id ON reality_map_edges(reality_map_id);
CREATE INDEX idx_reality_map_edges_parent ON reality_map_edges(parent_node_id);
CREATE INDEX idx_reality_map_edges_child ON reality_map_edges(child_node_id);
CREATE INDEX idx_reality_map_edges_type ON reality_map_edges(trigger_type);

-- reality_map_paths indexes
CREATE INDEX idx_reality_map_paths_map_id ON reality_map_paths(reality_map_id);
CREATE INDEX idx_reality_map_paths_probability ON reality_map_paths(reality_map_id, total_probability DESC);
CREATE INDEX idx_reality_map_paths_outcome ON reality_map_paths(reality_map_id, outcome_type);
CREATE INDEX idx_reality_map_paths_risk ON reality_map_paths(reality_map_id, avg_risk_score DESC);

-- reality_map_audit_log indexes
CREATE INDEX idx_reality_map_audit_map ON reality_map_audit_log(reality_map_id);
CREATE INDEX idx_reality_map_audit_node ON reality_map_audit_log(node_id);
CREATE INDEX idx_reality_map_audit_type ON reality_map_audit_log(event_type);
CREATE INDEX idx_reality_map_audit_created ON reality_map_audit_log(created_at DESC);

-- reality_map_comparisons indexes
CREATE INDEX idx_reality_map_comparisons_org ON reality_map_comparisons(org_id);
CREATE INDEX idx_reality_map_comparisons_created ON reality_map_comparisons(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE reality_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_map_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_map_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_map_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_map_comparisons ENABLE ROW LEVEL SECURITY;

-- reality_maps policies
CREATE POLICY "reality_maps_org_isolation" ON reality_maps
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- reality_map_nodes policies (via parent map)
CREATE POLICY "reality_map_nodes_org_isolation" ON reality_map_nodes
  FOR ALL USING (
    reality_map_id IN (
      SELECT id FROM reality_maps
      WHERE org_id = current_setting('app.current_org_id', true)::uuid
    )
  );

-- reality_map_edges policies (via parent map)
CREATE POLICY "reality_map_edges_org_isolation" ON reality_map_edges
  FOR ALL USING (
    reality_map_id IN (
      SELECT id FROM reality_maps
      WHERE org_id = current_setting('app.current_org_id', true)::uuid
    )
  );

-- reality_map_paths policies (via parent map)
CREATE POLICY "reality_map_paths_org_isolation" ON reality_map_paths
  FOR ALL USING (
    reality_map_id IN (
      SELECT id FROM reality_maps
      WHERE org_id = current_setting('app.current_org_id', true)::uuid
    )
  );

-- reality_map_audit_log policies (via parent map)
CREATE POLICY "reality_map_audit_org_isolation" ON reality_map_audit_log
  FOR ALL USING (
    reality_map_id IN (
      SELECT id FROM reality_maps
      WHERE org_id = current_setting('app.current_org_id', true)::uuid
    )
  );

-- reality_map_comparisons policies
CREATE POLICY "reality_map_comparisons_org_isolation" ON reality_map_comparisons
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for reality_maps
CREATE TRIGGER update_reality_maps_updated_at
  BEFORE UPDATE ON reality_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for reality_map_nodes
CREATE TRIGGER update_reality_map_nodes_updated_at
  BEFORE UPDATE ON reality_map_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to compute cumulative probability for a node
CREATE OR REPLACE FUNCTION compute_node_cumulative_probability(node_id UUID)
RETURNS FLOAT AS $$
DECLARE
  current_node reality_map_nodes;
  cumulative FLOAT := 1.0;
BEGIN
  SELECT * INTO current_node FROM reality_map_nodes WHERE id = node_id;

  IF current_node IS NULL THEN
    RETURN 0.0;
  END IF;

  cumulative := current_node.probability;

  WHILE current_node.parent_node_id IS NOT NULL LOOP
    SELECT * INTO current_node FROM reality_map_nodes WHERE id = current_node.parent_node_id;
    IF current_node IS NOT NULL THEN
      cumulative := cumulative * current_node.probability;
    END IF;
  END LOOP;

  RETURN cumulative;
END;
$$ LANGUAGE plpgsql;

-- Function to get node path as array
CREATE OR REPLACE FUNCTION get_node_path_ids(node_id UUID)
RETURNS UUID[] AS $$
DECLARE
  path_ids UUID[] := ARRAY[]::UUID[];
  current_node reality_map_nodes;
BEGIN
  SELECT * INTO current_node FROM reality_map_nodes WHERE id = node_id;

  WHILE current_node IS NOT NULL LOOP
    path_ids := current_node.id || path_ids;
    IF current_node.parent_node_id IS NOT NULL THEN
      SELECT * INTO current_node FROM reality_map_nodes WHERE id = current_node.parent_node_id;
    ELSE
      current_node := NULL;
    END IF;
  END LOOP;

  RETURN path_ids;
END;
$$ LANGUAGE plpgsql;

-- Function to update map statistics
CREATE OR REPLACE FUNCTION update_reality_map_stats(map_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reality_maps
  SET
    total_nodes = (SELECT COUNT(*) FROM reality_map_nodes WHERE reality_map_id = map_id),
    total_edges = (SELECT COUNT(*) FROM reality_map_edges WHERE reality_map_id = map_id),
    total_paths = (SELECT COUNT(*) FROM reality_map_paths WHERE reality_map_id = map_id),
    max_depth_reached = (SELECT COALESCE(MAX(depth), 0) FROM reality_map_nodes WHERE reality_map_id = map_id),
    updated_at = NOW()
  WHERE id = map_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE reality_maps IS 'S73: AI-driven multi-outcome reality maps for scenario planning';
COMMENT ON TABLE reality_map_nodes IS 'S73: Individual nodes/realities in a reality map graph';
COMMENT ON TABLE reality_map_edges IS 'S73: Connections between reality map nodes';
COMMENT ON TABLE reality_map_paths IS 'S73: Pre-computed full paths through reality map graphs';
COMMENT ON TABLE reality_map_audit_log IS 'S73: Audit trail for reality map operations';
COMMENT ON TABLE reality_map_comparisons IS 'S73: Comparisons between reality maps or paths';

COMMENT ON COLUMN reality_map_nodes.probability IS 'Probability of this specific outcome (0-1)';
COMMENT ON COLUMN reality_map_nodes.cumulative_probability IS 'Product of all ancestor probabilities';
COMMENT ON COLUMN reality_map_nodes.risk_score IS 'Aggregated risk score 0-100';
COMMENT ON COLUMN reality_map_nodes.opportunity_score IS 'Aggregated opportunity score 0-100';
COMMENT ON COLUMN reality_map_nodes.key_drivers IS 'Top 3 factors driving this outcome';
COMMENT ON COLUMN reality_map_nodes.narrative_delta IS 'How this reality differs from parent';
