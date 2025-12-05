-- Migration 70: Unified Intelligence Graph Schema (Sprint S66)
-- Global Insight Fabric & Unified Intelligence Graph V1
-- A cross-system knowledge graph integrating S38-S65

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Node types representing all entities across the Pravado ecosystem
CREATE TYPE node_type_enum AS ENUM (
  -- Core entities
  'organization',
  'user',
  'team',

  -- Media & PR entities (S43-S49)
  'press_release',
  'media_coverage',
  'journalist',
  'publication',
  'media_list',
  'pitch',
  'outreach_campaign',

  -- Monitoring & Alerts (S45, S48)
  'media_mention',
  'media_alert',
  'sentiment_signal',

  -- Performance & Analytics (S57)
  'performance_metric',
  'kpi_indicator',
  'trend_signal',

  -- Competitive Intelligence (S58)
  'competitor',
  'competitive_insight',
  'market_trend',

  -- Crisis & Risk (S59, S62)
  'crisis_event',
  'crisis_response',
  'risk_factor',
  'risk_assessment',
  'escalation',

  -- Brand (S60)
  'brand_signal',
  'brand_mention',
  'reputation_score',

  -- Governance (S61)
  'compliance_item',
  'governance_policy',
  'audit_finding',

  -- Executive (S63, S64)
  'executive_digest',
  'board_report',
  'investor_update',
  'command_center_alert',

  -- Strategic Intelligence (S65)
  'strategic_report',
  'strategic_insight',
  'strategic_recommendation',

  -- Audience & Personas (S56)
  'audience_persona',
  'audience_segment',

  -- Content (S46, S47)
  'content_brief',
  'content_piece',
  'narrative',

  -- Graph-specific
  'cluster',
  'topic',
  'theme',
  'event',
  'custom'
);

-- Edge types representing relationships between nodes
CREATE TYPE edge_type_enum AS ENUM (
  -- Hierarchical relationships
  'parent_of',
  'child_of',
  'belongs_to',
  'contains',

  -- Causal relationships
  'caused_by',
  'leads_to',
  'triggers',
  'mitigates',
  'escalates_to',

  -- Temporal relationships
  'precedes',
  'follows',
  'concurrent_with',
  'during',

  -- Similarity relationships
  'similar_to',
  'related_to',
  'contrasts_with',
  'complements',

  -- Attribution relationships
  'authored_by',
  'mentions',
  'references',
  'cites',
  'covers',

  -- Influence relationships
  'influences',
  'impacts',
  'derives_from',
  'contributes_to',

  -- Association relationships
  'associated_with',
  'linked_to',
  'correlates_with',

  -- Sentiment relationships
  'positive_sentiment_toward',
  'negative_sentiment_toward',
  'neutral_sentiment_toward',

  -- Strategic relationships
  'supports_strategy',
  'threatens_strategy',
  'opportunity_for',
  'risk_to',

  -- Custom
  'custom'
);

-- Embedding providers for vector storage
CREATE TYPE embedding_provider_enum AS ENUM (
  'openai_ada_002',
  'openai_3_small',
  'openai_3_large',
  'cohere_embed_v3',
  'anthropic',
  'custom'
);

-- Graph snapshot status
CREATE TYPE graph_snapshot_status_enum AS ENUM (
  'pending',
  'generating',
  'complete',
  'failed',
  'archived'
);

-- Audit event types
CREATE TYPE graph_event_type_enum AS ENUM (
  'node_created',
  'node_updated',
  'node_deleted',
  'node_merged',
  'edge_created',
  'edge_updated',
  'edge_deleted',
  'embedding_generated',
  'embedding_updated',
  'snapshot_created',
  'snapshot_regenerated',
  'query_executed',
  'traversal_executed',
  'metrics_computed',
  'reasoning_executed'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Intelligence Nodes - vertices in the knowledge graph
CREATE TABLE intelligence_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Node identity
  node_type node_type_enum NOT NULL,
  external_id VARCHAR(255),
  source_system VARCHAR(100),
  source_table VARCHAR(100),

  -- Node content
  label VARCHAR(500) NOT NULL,
  description TEXT,
  properties_json JSONB DEFAULT '{}',

  -- Classification
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',

  -- Temporal bounds
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,

  -- Graph metrics (computed)
  degree_centrality DECIMAL(10,6),
  betweenness_centrality DECIMAL(10,6),
  closeness_centrality DECIMAL(10,6),
  pagerank_score DECIMAL(10,6),
  cluster_id UUID,
  community_id VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT true,
  confidence_score DECIMAL(5,4),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(org_id, external_id, source_system)
);

-- Intelligence Edges - relationships between nodes
CREATE TABLE intelligence_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Edge endpoints
  source_node_id UUID NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,

  -- Edge identity
  edge_type edge_type_enum NOT NULL,
  label VARCHAR(500),
  description TEXT,
  properties_json JSONB DEFAULT '{}',

  -- Edge weight and directionality
  weight DECIMAL(10,4) DEFAULT 1.0,
  is_bidirectional BOOLEAN DEFAULT false,

  -- Temporal bounds
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,

  -- Provenance
  source_system VARCHAR(100),
  inference_method VARCHAR(100),
  confidence_score DECIMAL(5,4),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT no_self_loops CHECK (source_node_id != target_node_id)
);

-- Node Embeddings - vector representations of nodes
CREATE TABLE intelligence_node_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,

  -- Embedding details
  provider embedding_provider_enum NOT NULL,
  model_version VARCHAR(100),
  embedding_vector VECTOR(1536),
  dimensions INTEGER NOT NULL,

  -- Context used for embedding
  context_text TEXT,
  context_hash VARCHAR(64),

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(node_id, provider, is_current) WHERE is_current = true
);

-- Edge Embeddings - vector representations of edges
CREATE TABLE intelligence_edge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  edge_id UUID NOT NULL REFERENCES intelligence_edges(id) ON DELETE CASCADE,

  -- Embedding details
  provider embedding_provider_enum NOT NULL,
  model_version VARCHAR(100),
  embedding_vector VECTOR(1536),
  dimensions INTEGER NOT NULL,

  -- Context used for embedding
  context_text TEXT,
  context_hash VARCHAR(64),

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(edge_id, provider, is_current) WHERE is_current = true
);

-- Graph Snapshots - point-in-time captures of graph state
CREATE TABLE intelligence_graph_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Snapshot identity
  name VARCHAR(300) NOT NULL,
  description TEXT,
  snapshot_type VARCHAR(100) DEFAULT 'full',

  -- Status
  status graph_snapshot_status_enum NOT NULL DEFAULT 'pending',

  -- Snapshot data
  node_count INTEGER,
  edge_count INTEGER,
  cluster_count INTEGER,

  -- Metrics at snapshot time
  metrics_json JSONB DEFAULT '{}',

  -- Graph structure (serialized)
  nodes_json JSONB,
  edges_json JSONB,
  clusters_json JSONB,

  -- Diff from previous snapshot
  previous_snapshot_id UUID REFERENCES intelligence_graph_snapshots(id),
  diff_json JSONB,

  -- Storage
  storage_url TEXT,
  storage_size_bytes BIGINT,

  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Graph Audit Log
CREATE TABLE intelligence_graph_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Event details
  event_type graph_event_type_enum NOT NULL,

  -- Entity references
  node_id UUID REFERENCES intelligence_nodes(id) ON DELETE SET NULL,
  edge_id UUID REFERENCES intelligence_edges(id) ON DELETE SET NULL,
  snapshot_id UUID REFERENCES intelligence_graph_snapshots(id) ON DELETE SET NULL,

  -- Actor
  actor_id UUID REFERENCES auth.users(id),
  actor_type VARCHAR(50) DEFAULT 'user',

  -- Change details
  changes_json JSONB DEFAULT '{}',
  metadata_json JSONB DEFAULT '{}',

  -- Query/traversal details (for query events)
  query_json JSONB,
  result_count INTEGER,
  execution_time_ms INTEGER,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Node indexes
CREATE INDEX idx_intelligence_nodes_org ON intelligence_nodes(org_id);
CREATE INDEX idx_intelligence_nodes_type ON intelligence_nodes(node_type);
CREATE INDEX idx_intelligence_nodes_external ON intelligence_nodes(org_id, external_id, source_system);
CREATE INDEX idx_intelligence_nodes_source ON intelligence_nodes(source_system, source_table);
CREATE INDEX idx_intelligence_nodes_cluster ON intelligence_nodes(cluster_id) WHERE cluster_id IS NOT NULL;
CREATE INDEX idx_intelligence_nodes_community ON intelligence_nodes(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX idx_intelligence_nodes_active ON intelligence_nodes(org_id, is_active) WHERE is_active = true;
CREATE INDEX idx_intelligence_nodes_tags ON intelligence_nodes USING GIN(tags);
CREATE INDEX idx_intelligence_nodes_properties ON intelligence_nodes USING GIN(properties_json);
CREATE INDEX idx_intelligence_nodes_valid ON intelligence_nodes(valid_from, valid_to);

-- Edge indexes
CREATE INDEX idx_intelligence_edges_org ON intelligence_edges(org_id);
CREATE INDEX idx_intelligence_edges_source ON intelligence_edges(source_node_id);
CREATE INDEX idx_intelligence_edges_target ON intelligence_edges(target_node_id);
CREATE INDEX idx_intelligence_edges_type ON intelligence_edges(edge_type);
CREATE INDEX idx_intelligence_edges_nodes ON intelligence_edges(source_node_id, target_node_id);
CREATE INDEX idx_intelligence_edges_active ON intelligence_edges(org_id, is_active) WHERE is_active = true;
CREATE INDEX idx_intelligence_edges_weight ON intelligence_edges(weight DESC);
CREATE INDEX idx_intelligence_edges_properties ON intelligence_edges USING GIN(properties_json);

-- Embedding indexes
CREATE INDEX idx_node_embeddings_node ON intelligence_node_embeddings(node_id);
CREATE INDEX idx_node_embeddings_current ON intelligence_node_embeddings(node_id, is_current) WHERE is_current = true;
CREATE INDEX idx_node_embeddings_provider ON intelligence_node_embeddings(provider);

CREATE INDEX idx_edge_embeddings_edge ON intelligence_edge_embeddings(edge_id);
CREATE INDEX idx_edge_embeddings_current ON intelligence_edge_embeddings(edge_id, is_current) WHERE is_current = true;

-- Snapshot indexes
CREATE INDEX idx_graph_snapshots_org ON intelligence_graph_snapshots(org_id);
CREATE INDEX idx_graph_snapshots_status ON intelligence_graph_snapshots(status);
CREATE INDEX idx_graph_snapshots_created ON intelligence_graph_snapshots(created_at DESC);

-- Audit log indexes
CREATE INDEX idx_graph_audit_org ON intelligence_graph_audit_log(org_id);
CREATE INDEX idx_graph_audit_event ON intelligence_graph_audit_log(event_type);
CREATE INDEX idx_graph_audit_node ON intelligence_graph_audit_log(node_id) WHERE node_id IS NOT NULL;
CREATE INDEX idx_graph_audit_edge ON intelligence_graph_audit_log(edge_id) WHERE edge_id IS NOT NULL;
CREATE INDEX idx_graph_audit_created ON intelligence_graph_audit_log(created_at DESC);
CREATE INDEX idx_graph_audit_actor ON intelligence_graph_audit_log(actor_id) WHERE actor_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE intelligence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_node_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_edge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_graph_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_graph_audit_log ENABLE ROW LEVEL SECURITY;

-- Nodes policies
CREATE POLICY "Users can view nodes in their org"
  ON intelligence_nodes FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert nodes in their org"
  ON intelligence_nodes FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update nodes in their org"
  ON intelligence_nodes FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete nodes in their org"
  ON intelligence_nodes FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Edges policies
CREATE POLICY "Users can view edges in their org"
  ON intelligence_edges FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert edges in their org"
  ON intelligence_edges FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update edges in their org"
  ON intelligence_edges FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete edges in their org"
  ON intelligence_edges FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Node embeddings policies
CREATE POLICY "Users can view node embeddings in their org"
  ON intelligence_node_embeddings FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert node embeddings in their org"
  ON intelligence_node_embeddings FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update node embeddings in their org"
  ON intelligence_node_embeddings FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Edge embeddings policies
CREATE POLICY "Users can view edge embeddings in their org"
  ON intelligence_edge_embeddings FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert edge embeddings in their org"
  ON intelligence_edge_embeddings FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update edge embeddings in their org"
  ON intelligence_edge_embeddings FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Snapshots policies
CREATE POLICY "Users can view snapshots in their org"
  ON intelligence_graph_snapshots FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert snapshots in their org"
  ON intelligence_graph_snapshots FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update snapshots in their org"
  ON intelligence_graph_snapshots FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete snapshots in their org"
  ON intelligence_graph_snapshots FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Audit log policies (read-only for users)
CREATE POLICY "Users can view audit logs in their org"
  ON intelligence_graph_audit_log FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON intelligence_graph_audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER set_intelligence_nodes_updated_at
  BEFORE UPDATE ON intelligence_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_intelligence_edges_updated_at
  BEFORE UPDATE ON intelligence_edges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_intelligence_graph_snapshots_updated_at
  BEFORE UPDATE ON intelligence_graph_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get node neighbors (1-hop)
CREATE OR REPLACE FUNCTION get_node_neighbors(
  p_node_id UUID,
  p_direction VARCHAR DEFAULT 'both',
  p_edge_types edge_type_enum[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  node_id UUID,
  node_type node_type_enum,
  label VARCHAR,
  edge_id UUID,
  edge_type edge_type_enum,
  edge_weight DECIMAL,
  direction VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS node_id,
    n.node_type,
    n.label,
    e.id AS edge_id,
    e.edge_type,
    e.weight AS edge_weight,
    CASE
      WHEN e.source_node_id = p_node_id THEN 'outgoing'
      ELSE 'incoming'
    END AS direction
  FROM intelligence_edges e
  JOIN intelligence_nodes n ON (
    CASE
      WHEN e.source_node_id = p_node_id THEN e.target_node_id = n.id
      ELSE e.source_node_id = n.id
    END
  )
  WHERE
    e.is_active = true
    AND n.is_active = true
    AND (
      (p_direction = 'both' AND (e.source_node_id = p_node_id OR e.target_node_id = p_node_id))
      OR (p_direction = 'outgoing' AND e.source_node_id = p_node_id)
      OR (p_direction = 'incoming' AND e.target_node_id = p_node_id)
    )
    AND (p_edge_types IS NULL OR e.edge_type = ANY(p_edge_types))
  ORDER BY e.weight DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function for multi-hop traversal
CREATE OR REPLACE FUNCTION traverse_graph(
  p_start_node_id UUID,
  p_max_depth INTEGER DEFAULT 3,
  p_edge_types edge_type_enum[] DEFAULT NULL,
  p_node_types node_type_enum[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
  node_id UUID,
  node_type node_type_enum,
  label VARCHAR,
  depth INTEGER,
  path UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE graph_traversal AS (
    -- Base case: start node
    SELECT
      n.id AS node_id,
      n.node_type,
      n.label,
      0 AS depth,
      ARRAY[n.id] AS path
    FROM intelligence_nodes n
    WHERE n.id = p_start_node_id AND n.is_active = true

    UNION ALL

    -- Recursive case: traverse edges
    SELECT
      n.id AS node_id,
      n.node_type,
      n.label,
      gt.depth + 1 AS depth,
      gt.path || n.id AS path
    FROM graph_traversal gt
    JOIN intelligence_edges e ON (
      e.source_node_id = gt.node_id OR
      (e.target_node_id = gt.node_id AND e.is_bidirectional = true)
    )
    JOIN intelligence_nodes n ON (
      CASE
        WHEN e.source_node_id = gt.node_id THEN e.target_node_id = n.id
        ELSE e.source_node_id = n.id
      END
    )
    WHERE
      gt.depth < p_max_depth
      AND e.is_active = true
      AND n.is_active = true
      AND NOT (n.id = ANY(gt.path))  -- Prevent cycles
      AND (p_edge_types IS NULL OR e.edge_type = ANY(p_edge_types))
      AND (p_node_types IS NULL OR n.node_type = ANY(p_node_types))
  )
  SELECT DISTINCT ON (gt.node_id)
    gt.node_id,
    gt.node_type,
    gt.label,
    gt.depth,
    gt.path
  FROM graph_traversal gt
  ORDER BY gt.node_id, gt.depth
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find shortest path between two nodes
CREATE OR REPLACE FUNCTION find_shortest_path(
  p_start_node_id UUID,
  p_end_node_id UUID,
  p_max_depth INTEGER DEFAULT 6
)
RETURNS TABLE (
  path UUID[],
  path_length INTEGER,
  total_weight DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE path_search AS (
    -- Base case
    SELECT
      ARRAY[p_start_node_id] AS path,
      0 AS path_length,
      0::DECIMAL AS total_weight
    WHERE EXISTS (SELECT 1 FROM intelligence_nodes WHERE id = p_start_node_id AND is_active = true)

    UNION ALL

    -- Recursive case
    SELECT
      ps.path || e.target_node_id,
      ps.path_length + 1,
      ps.total_weight + e.weight
    FROM path_search ps
    JOIN intelligence_edges e ON e.source_node_id = ps.path[array_length(ps.path, 1)]
    WHERE
      ps.path_length < p_max_depth
      AND NOT (e.target_node_id = ANY(ps.path))
      AND e.is_active = true
  )
  SELECT
    ps.path,
    ps.path_length,
    ps.total_weight
  FROM path_search ps
  WHERE ps.path[array_length(ps.path, 1)] = p_end_node_id
  ORDER BY ps.path_length, ps.total_weight
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE intelligence_nodes IS 'Knowledge graph nodes representing entities across all Pravado systems';
COMMENT ON TABLE intelligence_edges IS 'Knowledge graph edges representing relationships between nodes';
COMMENT ON TABLE intelligence_node_embeddings IS 'Vector embeddings for semantic node similarity';
COMMENT ON TABLE intelligence_edge_embeddings IS 'Vector embeddings for semantic edge similarity';
COMMENT ON TABLE intelligence_graph_snapshots IS 'Point-in-time captures of graph state for analysis and comparison';
COMMENT ON TABLE intelligence_graph_audit_log IS 'Audit trail for all graph operations';

COMMENT ON FUNCTION get_node_neighbors IS 'Get immediate neighbors of a node with optional filtering';
COMMENT ON FUNCTION traverse_graph IS 'Perform multi-hop graph traversal from a starting node';
COMMENT ON FUNCTION find_shortest_path IS 'Find the shortest path between two nodes';
