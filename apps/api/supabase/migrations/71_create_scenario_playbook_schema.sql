-- Migration 71: Scenario Simulation & Autonomous Playbook Orchestration Schema (Sprint S67)
-- Creates tables for scenario-based playbook simulation, orchestration, and execution tracking

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Scenario type enum
CREATE TYPE scenario_type_enum AS ENUM (
  'crisis_sim',
  'campaign_sim',
  'reputation_sim',
  'strategic_sim',
  'outreach_sim',
  'competitive_sim',
  'custom'
);

-- Scenario playbook status enum
CREATE TYPE scenario_playbook_status_enum AS ENUM (
  'draft',
  'active',
  'archived',
  'deprecated'
);

-- Scenario trigger type enum
CREATE TYPE scenario_trigger_type_enum AS ENUM (
  'manual',
  'signal_based',
  'scheduled',
  'threshold_based',
  'event_driven'
);

-- Scenario step action type enum
CREATE TYPE scenario_step_action_type_enum AS ENUM (
  'outreach',
  'crisis_response',
  'governance',
  'report_generation',
  'media_alert',
  'reputation_action',
  'competitive_analysis',
  'stakeholder_notify',
  'content_publish',
  'escalation',
  'approval_gate',
  'wait',
  'conditional',
  'custom'
);

-- Scenario run status enum
CREATE TYPE scenario_run_status_enum AS ENUM (
  'pending',
  'initializing',
  'running',
  'paused',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled'
);

-- Scenario step status enum
CREATE TYPE scenario_step_status_enum AS ENUM (
  'pending',
  'ready',
  'approved',
  'executing',
  'executed',
  'skipped',
  'failed',
  'cancelled'
);

-- Scenario risk level enum
CREATE TYPE scenario_risk_level_enum AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Scenario Playbooks - Library of reusable playbook templates
CREATE TABLE scenario_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  -- Status and configuration
  status scenario_playbook_status_enum NOT NULL DEFAULT 'draft',
  trigger_type scenario_trigger_type_enum NOT NULL DEFAULT 'manual',

  -- Target systems this playbook can affect
  target_systems TEXT[] NOT NULL DEFAULT '{}',

  -- Risk assessment
  risk_level scenario_risk_level_enum NOT NULL DEFAULT 'medium',

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  parent_playbook_id UUID REFERENCES scenario_playbooks(id),

  -- Ownership
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario Playbook Steps - Individual steps within a playbook
CREATE TABLE scenario_playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES scenario_playbooks(id) ON DELETE CASCADE,

  -- Step ordering
  step_index INTEGER NOT NULL,

  -- Step configuration
  name VARCHAR(255) NOT NULL,
  description TEXT,
  action_type scenario_step_action_type_enum NOT NULL,

  -- Action parameters (varies by action_type)
  action_payload JSONB NOT NULL DEFAULT '{}',

  -- Approval requirements
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_roles TEXT[] DEFAULT '{}',

  -- Timing and signals
  wait_for_signals BOOLEAN NOT NULL DEFAULT false,
  signal_conditions JSONB DEFAULT '{}',
  wait_duration_minutes INTEGER,
  timeout_minutes INTEGER,

  -- Conditional execution
  condition_expression TEXT,
  skip_on_failure BOOLEAN NOT NULL DEFAULT false,

  -- Dependencies
  depends_on_steps UUID[] DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for step ordering within playbook
  UNIQUE (playbook_id, step_index)
);

-- Scenarios - Simulation scenario definitions
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scenario configuration
  scenario_type scenario_type_enum NOT NULL,
  horizon_days INTEGER NOT NULL DEFAULT 30,

  -- Status
  status scenario_run_status_enum NOT NULL DEFAULT 'pending',

  -- Input parameters for simulation
  parameters JSONB NOT NULL DEFAULT '{}',

  -- Initial state snapshot (from graph/metrics at creation time)
  initial_state JSONB DEFAULT '{}',

  -- Associated playbook (optional - can be assigned during run)
  default_playbook_id UUID REFERENCES scenario_playbooks(id),

  -- Simulation constraints
  constraints JSONB DEFAULT '{}',

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Ownership
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario Runs - Execution instances of scenarios
CREATE TABLE scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Chosen playbook for this run
  playbook_id UUID REFERENCES scenario_playbooks(id),

  -- Run status
  status scenario_run_status_enum NOT NULL DEFAULT 'pending',

  -- Timing
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- State snapshots
  initial_state JSONB NOT NULL DEFAULT '{}',
  current_state JSONB DEFAULT '{}',

  -- Results
  result_summary JSONB DEFAULT '{}',

  -- Scoring
  risk_score NUMERIC(5,2),
  opportunity_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),

  -- Projected metrics timeline
  projected_metrics JSONB DEFAULT '{}',

  -- LLM-generated narrative
  narrative_summary TEXT,
  recommendations JSONB DEFAULT '[]',

  -- Error handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Ownership
  started_by UUID REFERENCES users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario Run Steps - Execution state of individual steps within a run
CREATE TABLE scenario_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  scenario_run_id UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  playbook_step_id UUID NOT NULL REFERENCES scenario_playbook_steps(id),

  -- Step ordering (copied from playbook step)
  step_index INTEGER NOT NULL,

  -- Execution status
  status scenario_step_status_enum NOT NULL DEFAULT 'pending',

  -- Timing
  scheduled_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,

  -- Approval tracking
  approved_by UUID REFERENCES users(id),
  approval_notes TEXT,

  -- Execution context (input data at time of execution)
  execution_context JSONB DEFAULT '{}',

  -- Outcome (what would happen / what happened)
  outcome JSONB DEFAULT '{}',

  -- Simulated impact metrics
  simulated_impact JSONB DEFAULT '{}',

  -- Error handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario Audit Log - Complete audit trail for all scenario operations
CREATE TABLE scenario_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- References (optional - depends on event type)
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  scenario_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
  playbook_id UUID REFERENCES scenario_playbooks(id) ON DELETE SET NULL,
  step_id UUID REFERENCES scenario_run_steps(id) ON DELETE SET NULL,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}',

  -- Actor
  actor_id UUID REFERENCES users(id),
  actor_email VARCHAR(255),

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Scenario Playbooks indexes
CREATE INDEX idx_scenario_playbooks_org_id ON scenario_playbooks(org_id);
CREATE INDEX idx_scenario_playbooks_status ON scenario_playbooks(status);
CREATE INDEX idx_scenario_playbooks_category ON scenario_playbooks(category);
CREATE INDEX idx_scenario_playbooks_trigger_type ON scenario_playbooks(trigger_type);
CREATE INDEX idx_scenario_playbooks_risk_level ON scenario_playbooks(risk_level);
CREATE INDEX idx_scenario_playbooks_created_at ON scenario_playbooks(created_at DESC);
CREATE INDEX idx_scenario_playbooks_tags ON scenario_playbooks USING GIN(tags);

-- Scenario Playbook Steps indexes
CREATE INDEX idx_scenario_playbook_steps_org_id ON scenario_playbook_steps(org_id);
CREATE INDEX idx_scenario_playbook_steps_playbook_id ON scenario_playbook_steps(playbook_id);
CREATE INDEX idx_scenario_playbook_steps_action_type ON scenario_playbook_steps(action_type);
CREATE INDEX idx_scenario_playbook_steps_ordering ON scenario_playbook_steps(playbook_id, step_index);

-- Scenarios indexes
CREATE INDEX idx_scenarios_org_id ON scenarios(org_id);
CREATE INDEX idx_scenarios_scenario_type ON scenarios(scenario_type);
CREATE INDEX idx_scenarios_status ON scenarios(status);
CREATE INDEX idx_scenarios_default_playbook_id ON scenarios(default_playbook_id);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX idx_scenarios_tags ON scenarios USING GIN(tags);

-- Scenario Runs indexes
CREATE INDEX idx_scenario_runs_org_id ON scenario_runs(org_id);
CREATE INDEX idx_scenario_runs_scenario_id ON scenario_runs(scenario_id);
CREATE INDEX idx_scenario_runs_playbook_id ON scenario_runs(playbook_id);
CREATE INDEX idx_scenario_runs_status ON scenario_runs(status);
CREATE INDEX idx_scenario_runs_started_at ON scenario_runs(started_at DESC);
CREATE INDEX idx_scenario_runs_completed_at ON scenario_runs(completed_at DESC);

-- Scenario Run Steps indexes
CREATE INDEX idx_scenario_run_steps_org_id ON scenario_run_steps(org_id);
CREATE INDEX idx_scenario_run_steps_scenario_run_id ON scenario_run_steps(scenario_run_id);
CREATE INDEX idx_scenario_run_steps_playbook_step_id ON scenario_run_steps(playbook_step_id);
CREATE INDEX idx_scenario_run_steps_status ON scenario_run_steps(status);
CREATE INDEX idx_scenario_run_steps_ordering ON scenario_run_steps(scenario_run_id, step_index);

-- Scenario Audit Log indexes
CREATE INDEX idx_scenario_audit_log_org_id ON scenario_audit_log(org_id);
CREATE INDEX idx_scenario_audit_log_scenario_id ON scenario_audit_log(scenario_id);
CREATE INDEX idx_scenario_audit_log_scenario_run_id ON scenario_audit_log(scenario_run_id);
CREATE INDEX idx_scenario_audit_log_playbook_id ON scenario_audit_log(playbook_id);
CREATE INDEX idx_scenario_audit_log_event_type ON scenario_audit_log(event_type);
CREATE INDEX idx_scenario_audit_log_created_at ON scenario_audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger for scenario_playbooks
CREATE TRIGGER set_scenario_playbooks_updated_at
  BEFORE UPDATE ON scenario_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for scenario_playbook_steps
CREATE TRIGGER set_scenario_playbook_steps_updated_at
  BEFORE UPDATE ON scenario_playbook_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for scenarios
CREATE TRIGGER set_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for scenario_runs
CREATE TRIGGER set_scenario_runs_updated_at
  BEFORE UPDATE ON scenario_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for scenario_run_steps
CREATE TRIGGER set_scenario_run_steps_updated_at
  BEFORE UPDATE ON scenario_run_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE scenario_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_audit_log ENABLE ROW LEVEL SECURITY;

-- Scenario Playbooks policies
CREATE POLICY scenario_playbooks_org_isolation ON scenario_playbooks
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Scenario Playbook Steps policies
CREATE POLICY scenario_playbook_steps_org_isolation ON scenario_playbook_steps
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Scenarios policies
CREATE POLICY scenarios_org_isolation ON scenarios
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Scenario Runs policies
CREATE POLICY scenario_runs_org_isolation ON scenario_runs
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Scenario Run Steps policies
CREATE POLICY scenario_run_steps_org_isolation ON scenario_run_steps
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Scenario Audit Log policies
CREATE POLICY scenario_audit_log_org_isolation ON scenario_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE scenario_playbooks IS 'Library of reusable playbook templates for scenario-based orchestration';
COMMENT ON TABLE scenario_playbook_steps IS 'Individual steps within a playbook template';
COMMENT ON TABLE scenarios IS 'Simulation scenario definitions with parameters and constraints';
COMMENT ON TABLE scenario_runs IS 'Execution instances of scenarios with chosen playbooks';
COMMENT ON TABLE scenario_run_steps IS 'Execution state of individual steps within a run';
COMMENT ON TABLE scenario_audit_log IS 'Complete audit trail for all scenario operations';

COMMENT ON COLUMN scenario_playbooks.target_systems IS 'Array of system identifiers this playbook can affect (e.g., crisis, reputation, outreach)';
COMMENT ON COLUMN scenario_playbook_steps.action_payload IS 'JSON parameters specific to the action type';
COMMENT ON COLUMN scenario_playbook_steps.signal_conditions IS 'JSON conditions that must be met when wait_for_signals is true';
COMMENT ON COLUMN scenarios.parameters IS 'Input parameters for simulation (e.g., crisis severity, sentiment change)';
COMMENT ON COLUMN scenarios.initial_state IS 'Snapshot of graph/metrics state at scenario creation time';
COMMENT ON COLUMN scenario_runs.projected_metrics IS 'Timeline of projected metric values over the simulation horizon';
COMMENT ON COLUMN scenario_run_steps.simulated_impact IS 'Projected impact of this step on various metrics';
