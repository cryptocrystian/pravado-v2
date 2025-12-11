-- Migration 74: Scenario Orchestration Engine Schema (Sprint S72)
-- Multi-scenario orchestration for combined crisis/investor/strategic scenario suites
-- Extends S71 AI Scenario Simulation Engine with suite-level orchestration

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Suite status lifecycle
CREATE TYPE scenario_suite_status AS ENUM (
  'draft',           -- Initial creation, not yet configured
  'configured',      -- Ready to run
  'running',         -- Active execution in progress
  'completed',       -- Successfully finished all items
  'failed',          -- Terminated with errors
  'archived'         -- Soft-deleted / historical
);

-- Suite run status
CREATE TYPE scenario_suite_run_status AS ENUM (
  'starting',        -- Initializing suite context
  'in_progress',     -- Actively executing simulations
  'completed',       -- All simulations finished
  'failed',          -- Error during execution
  'aborted'          -- User-cancelled
);

-- Suite run item status
CREATE TYPE scenario_suite_item_status AS ENUM (
  'pending',         -- Waiting to execute
  'condition_met',   -- Trigger condition satisfied
  'condition_unmet', -- Trigger condition not satisfied (skipped)
  'running',         -- Currently executing
  'completed',       -- Successfully finished
  'failed',          -- Error during execution
  'skipped'          -- Intentionally skipped due to branching
);

-- Trigger condition types
CREATE TYPE trigger_condition_type AS ENUM (
  'always',              -- Always trigger (sequential)
  'risk_threshold',      -- Trigger when risk level exceeds threshold
  'sentiment_shift',     -- Trigger on sentiment change
  'keyword_match',       -- Trigger when specific keywords appear
  'agent_response',      -- Trigger based on specific agent response
  'outcome_match',       -- Trigger when specific outcome detected
  'custom_expression'    -- Custom boolean expression
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. scenario_suites - Main suite configurations
CREATE TABLE scenario_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Status and lifecycle
  status scenario_suite_status NOT NULL DEFAULT 'draft',

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- config structure:
  -- {
  --   "maxConcurrentSimulations": 1,
  --   "stopOnFailure": true,
  --   "narrativeEnabled": true,
  --   "riskMapEnabled": true,
  --   "timeout": 3600,
  --   "retryPolicy": { "maxRetries": 2, "backoffMs": 5000 }
  -- }

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT suite_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  CONSTRAINT suite_description_length CHECK (description IS NULL OR char_length(description) <= 2000)
);

-- 2. scenario_suite_items - Individual simulation entries in a suite
CREATE TABLE scenario_suite_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES scenario_suites(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES ai_scenario_simulations(id) ON DELETE CASCADE,

  -- Ordering and dependencies
  order_index INT NOT NULL DEFAULT 0,
  depends_on_item_id UUID REFERENCES scenario_suite_items(id),

  -- Trigger conditions
  trigger_condition_type trigger_condition_type NOT NULL DEFAULT 'always',
  trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- trigger_condition structure examples:
  -- For 'risk_threshold':
  -- { "minRiskLevel": "high", "sourceItemId": "uuid" }
  -- For 'sentiment_shift':
  -- { "direction": "negative", "magnitude": 0.3, "sourceItemId": "uuid" }
  -- For 'keyword_match':
  -- { "keywords": ["crisis", "recall"], "sourceItemId": "uuid" }
  -- For 'agent_response':
  -- { "agentRoleType": "journalist", "containsKeywords": ["lawsuit"] }
  -- For 'outcome_match':
  -- { "outcomeType": "risk", "minSeverity": "high" }
  -- For 'custom_expression':
  -- { "expression": "run.riskLevel >= 'high' && run.stepCount > 5" }

  -- Execution config overrides
  execution_config JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "maxStepsOverride": 30,
  --   "seedContextOverride": {...},
  --   "agentOverrides": {...}
  -- }

  -- Metadata
  label TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_order_index CHECK (order_index >= 0),
  CONSTRAINT label_length CHECK (label IS NULL OR char_length(label) <= 100)
);

-- 3. scenario_suite_runs - Individual execution instances of a suite
CREATE TABLE scenario_suite_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  suite_id UUID NOT NULL REFERENCES scenario_suites(id) ON DELETE CASCADE,

  -- Run identification
  run_number INT NOT NULL DEFAULT 1,
  run_label TEXT,

  -- Status
  status scenario_suite_run_status NOT NULL DEFAULT 'starting',

  -- Progress tracking
  total_items INT NOT NULL DEFAULT 0,
  completed_items INT NOT NULL DEFAULT 0,
  failed_items INT NOT NULL DEFAULT 0,
  skipped_items INT NOT NULL DEFAULT 0,
  current_item_index INT NOT NULL DEFAULT 0,

  -- Aggregate metrics
  aggregate_risk_level ai_scenario_risk_level DEFAULT 'low',
  total_tokens_used INT NOT NULL DEFAULT 0,
  total_steps_executed INT NOT NULL DEFAULT 0,

  -- Context and results
  seed_context JSONB DEFAULT '{}'::jsonb,
  suite_narrative TEXT,
  risk_map JSONB DEFAULT '{}'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Audit
  started_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. scenario_suite_run_items - Individual simulation executions within a suite run
CREATE TABLE scenario_suite_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  suite_run_id UUID NOT NULL REFERENCES scenario_suite_runs(id) ON DELETE CASCADE,
  suite_item_id UUID NOT NULL REFERENCES scenario_suite_items(id) ON DELETE CASCADE,
  simulation_run_id UUID REFERENCES ai_scenario_runs(id),

  -- Execution order and status
  order_index INT NOT NULL DEFAULT 0,
  status scenario_suite_item_status NOT NULL DEFAULT 'pending',

  -- Condition evaluation
  condition_evaluated BOOLEAN NOT NULL DEFAULT false,
  condition_result BOOLEAN,
  condition_details JSONB DEFAULT '{}'::jsonb,

  -- Execution metrics
  tokens_used INT DEFAULT 0,
  steps_executed INT DEFAULT 0,
  duration_ms INT,

  -- Results
  risk_level ai_scenario_risk_level,
  outcome_summary JSONB DEFAULT '{}'::jsonb,
  key_findings JSONB DEFAULT '[]'::jsonb,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. scenario_suite_audit_log - Complete audit trail for suites
CREATE TABLE scenario_suite_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  suite_id UUID REFERENCES scenario_suites(id) ON DELETE SET NULL,
  suite_run_id UUID REFERENCES scenario_suite_runs(id) ON DELETE SET NULL,
  suite_run_item_id UUID REFERENCES scenario_suite_run_items(id) ON DELETE SET NULL,

  -- Event info
  event_type TEXT NOT NULL,
  -- Event types:
  -- 'suite_created', 'suite_updated', 'suite_archived'
  -- 'item_added', 'item_updated', 'item_removed'
  -- 'run_started', 'run_completed', 'run_failed', 'run_aborted'
  -- 'item_condition_evaluated', 'item_started', 'item_completed', 'item_failed', 'item_skipped'
  -- 'narrative_generated', 'risk_map_generated'

  -- Details
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Actor
  user_id UUID REFERENCES users(id),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- scenario_suites indexes
CREATE INDEX idx_scenario_suites_org_id ON scenario_suites(org_id);
CREATE INDEX idx_scenario_suites_status ON scenario_suites(status);
CREATE INDEX idx_scenario_suites_org_status ON scenario_suites(org_id, status);
CREATE INDEX idx_scenario_suites_created_at ON scenario_suites(created_at DESC);
CREATE INDEX idx_scenario_suites_archived_at ON scenario_suites(archived_at) WHERE archived_at IS NULL;

-- scenario_suite_items indexes
CREATE INDEX idx_scenario_suite_items_suite_id ON scenario_suite_items(suite_id);
CREATE INDEX idx_scenario_suite_items_simulation_id ON scenario_suite_items(simulation_id);
CREATE INDEX idx_scenario_suite_items_order ON scenario_suite_items(suite_id, order_index);
CREATE INDEX idx_scenario_suite_items_depends_on ON scenario_suite_items(depends_on_item_id) WHERE depends_on_item_id IS NOT NULL;

-- scenario_suite_runs indexes
CREATE INDEX idx_scenario_suite_runs_org_id ON scenario_suite_runs(org_id);
CREATE INDEX idx_scenario_suite_runs_suite_id ON scenario_suite_runs(suite_id);
CREATE INDEX idx_scenario_suite_runs_status ON scenario_suite_runs(status);
CREATE INDEX idx_scenario_suite_runs_started_at ON scenario_suite_runs(started_at DESC);
CREATE INDEX idx_scenario_suite_runs_suite_status ON scenario_suite_runs(suite_id, status);

-- scenario_suite_run_items indexes
CREATE INDEX idx_scenario_suite_run_items_suite_run_id ON scenario_suite_run_items(suite_run_id);
CREATE INDEX idx_scenario_suite_run_items_suite_item_id ON scenario_suite_run_items(suite_item_id);
CREATE INDEX idx_scenario_suite_run_items_simulation_run_id ON scenario_suite_run_items(simulation_run_id);
CREATE INDEX idx_scenario_suite_run_items_status ON scenario_suite_run_items(status);
CREATE INDEX idx_scenario_suite_run_items_order ON scenario_suite_run_items(suite_run_id, order_index);

-- scenario_suite_audit_log indexes
CREATE INDEX idx_scenario_suite_audit_log_org_id ON scenario_suite_audit_log(org_id);
CREATE INDEX idx_scenario_suite_audit_log_suite_id ON scenario_suite_audit_log(suite_id);
CREATE INDEX idx_scenario_suite_audit_log_suite_run_id ON scenario_suite_audit_log(suite_run_id);
CREATE INDEX idx_scenario_suite_audit_log_event_type ON scenario_suite_audit_log(event_type);
CREATE INDEX idx_scenario_suite_audit_log_created_at ON scenario_suite_audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE scenario_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_suite_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_suite_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_suite_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_suite_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for scenario_suites
CREATE POLICY "Users can view suites in their org"
  ON scenario_suites FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert suites in their org"
  ON scenario_suites FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update suites in their org"
  ON scenario_suites FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete suites in their org"
  ON scenario_suites FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Policies for scenario_suite_items
CREATE POLICY "Users can view suite items via suite access"
  ON scenario_suite_items FOR SELECT
  USING (suite_id IN (
    SELECT id FROM scenario_suites
    WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can manage suite items via suite access"
  ON scenario_suite_items FOR ALL
  USING (suite_id IN (
    SELECT id FROM scenario_suites
    WHERE org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  ));

-- Policies for scenario_suite_runs
CREATE POLICY "Users can view suite runs in their org"
  ON scenario_suite_runs FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert suite runs in their org"
  ON scenario_suite_runs FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update suite runs in their org"
  ON scenario_suite_runs FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Policies for scenario_suite_run_items
CREATE POLICY "Users can view run items in their org"
  ON scenario_suite_run_items FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage run items in their org"
  ON scenario_suite_run_items FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Policies for scenario_suite_audit_log
CREATE POLICY "Users can view audit logs in their org"
  ON scenario_suite_audit_log FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert audit logs in their org"
  ON scenario_suite_audit_log FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scenario_suite_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scenario_suites_updated_at
  BEFORE UPDATE ON scenario_suites
  FOR EACH ROW EXECUTE FUNCTION update_scenario_suite_updated_at();

CREATE TRIGGER trigger_scenario_suite_items_updated_at
  BEFORE UPDATE ON scenario_suite_items
  FOR EACH ROW EXECUTE FUNCTION update_scenario_suite_updated_at();

CREATE TRIGGER trigger_scenario_suite_runs_updated_at
  BEFORE UPDATE ON scenario_suite_runs
  FOR EACH ROW EXECUTE FUNCTION update_scenario_suite_updated_at();

CREATE TRIGGER trigger_scenario_suite_run_items_updated_at
  BEFORE UPDATE ON scenario_suite_run_items
  FOR EACH ROW EXECUTE FUNCTION update_scenario_suite_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE scenario_suites IS 'Multi-scenario orchestration suites combining multiple simulations';
COMMENT ON TABLE scenario_suite_items IS 'Individual simulation entries with trigger conditions in a suite';
COMMENT ON TABLE scenario_suite_runs IS 'Execution instances of a suite with aggregate metrics';
COMMENT ON TABLE scenario_suite_run_items IS 'Individual simulation executions within a suite run';
COMMENT ON TABLE scenario_suite_audit_log IS 'Complete audit trail for suite operations';

COMMENT ON COLUMN scenario_suite_items.trigger_condition_type IS 'Type of condition that triggers this simulation';
COMMENT ON COLUMN scenario_suite_items.trigger_condition IS 'JSON configuration for the trigger condition';
COMMENT ON COLUMN scenario_suite_runs.suite_narrative IS 'AI-generated narrative summarizing the entire suite run';
COMMENT ON COLUMN scenario_suite_runs.risk_map IS 'Aggregated risk assessment across all simulations';
