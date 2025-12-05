-- Migration 73: AI Scenario Simulation Engine Schema (Sprint S71)
-- Autonomous multi-agent simulation engine for crisis, investor, and strategic scenarios

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Simulation mode determines how the simulation runs
CREATE TYPE ai_simulation_mode AS ENUM (
  'single_run',      -- One-time execution
  'multi_run',       -- Multiple parallel runs for comparison
  'what_if'          -- Exploratory branching scenarios
);

-- Simulation status lifecycle
CREATE TYPE ai_simulation_status AS ENUM (
  'draft',           -- Initial creation, not yet configured
  'configured',      -- Ready to run
  'running',         -- Active execution in progress
  'paused',          -- Temporarily halted
  'completed',       -- Successfully finished
  'failed',          -- Terminated with errors
  'archived'         -- Soft-deleted / historical
);

-- Run status for individual simulation runs
CREATE TYPE ai_run_status AS ENUM (
  'starting',        -- Initializing context
  'in_progress',     -- Actively stepping through agents
  'completed',       -- All steps finished
  'failed',          -- Error during execution
  'aborted'          -- User-cancelled
);

-- Agent role types in simulations
CREATE TYPE ai_agent_role_type AS ENUM (
  'internal_exec',   -- CEO, CFO, CMO, etc.
  'journalist',      -- Media reporters
  'investor',        -- Shareholders, analysts
  'customer',        -- End users, clients
  'employee',        -- Internal staff
  'regulator',       -- Government, compliance bodies
  'market_analyst',  -- Industry analysts
  'system',          -- System narrator/moderator
  'critic'           -- Devil's advocate role
);

-- Communication channels for scenario turns
CREATE TYPE ai_scenario_channel AS ENUM (
  'press',           -- Press releases, media statements
  'email',           -- Direct email communications
  'social',          -- Social media posts
  'internal_meeting',-- Internal discussions
  'board',           -- Board communications
  'investor_call',   -- Investor relations calls
  'public_statement',-- Public announcements
  'private_message', -- Private/confidential messages
  'analyst_report'   -- Analyst briefings
);

-- Objective types for simulations
CREATE TYPE ai_scenario_objective AS ENUM (
  'crisis_comms',       -- Crisis communication planning
  'investor_relations', -- Investor Q&A preparation
  'reputation',         -- Reputation management
  'go_to_market',       -- Product launch scenarios
  'regulatory',         -- Regulatory response planning
  'competitive',        -- Competitive response
  'earnings',           -- Earnings call preparation
  'leadership_change',  -- Executive transition
  'm_and_a',            -- Merger/acquisition communications
  'custom'              -- User-defined objective
);

-- Risk levels for outcomes and runs
CREATE TYPE ai_scenario_risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Outcome types
CREATE TYPE ai_scenario_outcome_type AS ENUM (
  'risk',            -- Negative outcome / threat
  'opportunity',     -- Positive outcome / opportunity
  'neutral'          -- Informational / no clear valence
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Main simulation configurations
CREATE TABLE ai_scenario_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Scenario configuration
  linked_playbook_id UUID REFERENCES scenario_playbooks(id) ON DELETE SET NULL,
  simulation_mode ai_simulation_mode NOT NULL DEFAULT 'single_run',
  objective_type ai_scenario_objective NOT NULL DEFAULT 'custom',

  -- Status
  status ai_simulation_status NOT NULL DEFAULT 'draft',

  -- Configuration JSONB
  -- Structure: {
  --   timeHorizonHours: number,
  --   maxStepsPerRun: number,
  --   constraints: string[],
  --   focusAreas: string[],
  --   excludeTopics: string[],
  --   temperature: number,
  --   agentConfigs: Record<string, AgentConfig>
  -- }
  config JSONB NOT NULL DEFAULT '{}',

  -- Tracking
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Individual simulation runs
CREATE TABLE ai_scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES ai_scenario_simulations(id) ON DELETE CASCADE,

  -- Run identification
  run_label TEXT,
  run_number INTEGER NOT NULL DEFAULT 1,

  -- Context snapshot
  -- Structure: {
  --   riskRadarSnapshot: {...},
  --   unifiedGraphContext: {...},
  --   narrativeContext: {...},
  --   strategicIntelContext: {...},
  --   competitiveContext: {...},
  --   reputationContext: {...}
  -- }
  seed_context JSONB NOT NULL DEFAULT '{}',

  -- Execution status
  status ai_run_status NOT NULL DEFAULT 'starting',
  step_count INTEGER NOT NULL DEFAULT 0,
  max_steps INTEGER NOT NULL DEFAULT 20,
  current_step INTEGER NOT NULL DEFAULT 0,

  -- Risk assessment
  risk_level ai_scenario_risk_level DEFAULT 'low',

  -- Run summary
  -- Structure: {
  --   keyInsights: string[],
  --   criticalMoments: [...],
  --   agentSummaries: Record<agentId, {...}>,
  --   overallAssessment: string
  -- }
  summary JSONB DEFAULT '{}',

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent definitions for simulations
CREATE TABLE ai_scenario_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES ai_scenario_simulations(id) ON DELETE CASCADE,
  run_id UUID REFERENCES ai_scenario_runs(id) ON DELETE CASCADE,

  -- Agent identity
  agent_key TEXT NOT NULL,  -- e.g., 'ceo', 'journalist_nyt', 'activist_investor'
  display_name TEXT NOT NULL,
  role_type ai_agent_role_type NOT NULL,

  -- Persona reference (links to S51 audience personas)
  -- Structure: { personaId?: string, personaSnapshot?: {...} }
  persona_ref JSONB DEFAULT '{}',

  -- Agent configuration
  -- Structure: {
  --   style: string,
  --   tone: string,
  --   priorities: string[],
  --   constraints: string[],
  --   responseLength: 'brief' | 'moderate' | 'detailed',
  --   aggressiveness: number (0-1)
  -- }
  config JSONB NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual turns/messages in a simulation run
CREATE TABLE ai_scenario_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES ai_scenario_runs(id) ON DELETE CASCADE,

  -- Turn positioning
  step_index INTEGER NOT NULL,
  turn_order INTEGER NOT NULL DEFAULT 0,  -- Multiple turns per step

  -- Participants
  speaker_agent_id UUID NOT NULL REFERENCES ai_scenario_agents(id) ON DELETE CASCADE,
  target_agent_id UUID REFERENCES ai_scenario_agents(id) ON DELETE SET NULL,

  -- Communication
  channel ai_scenario_channel NOT NULL DEFAULT 'internal_meeting',
  content TEXT NOT NULL,

  -- Metadata
  -- Structure: {
  --   toolsUsed: string[],
  --   sourcesReferenced: string[],
  --   sentimentScore: number,
  --   keyTopics: string[],
  --   llmModel: string,
  --   tokenCount: number,
  --   generationTimeMs: number
  -- }
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metrics computed during/after runs
CREATE TABLE ai_scenario_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES ai_scenario_runs(id) ON DELETE CASCADE,

  -- Metric identification
  metric_key TEXT NOT NULL,  -- e.g., 'reputation_risk', 'investor_confidence'
  metric_label TEXT NOT NULL,
  metric_category TEXT,  -- e.g., 'risk', 'sentiment', 'engagement'

  -- Values
  value_numeric DECIMAL(10, 4),
  value_json JSONB,  -- For complex metric data

  -- Context
  step_index INTEGER,  -- Which step this metric was computed for (null = run-level)

  -- Timestamps
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outcomes and recommendations from runs
CREATE TABLE ai_scenario_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES ai_scenario_runs(id) ON DELETE CASCADE,

  -- Classification
  outcome_type ai_scenario_outcome_type NOT NULL DEFAULT 'neutral',
  risk_level ai_scenario_risk_level NOT NULL DEFAULT 'medium',

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Recommendations
  -- Structure: [{ action: string, priority: 'high' | 'medium' | 'low', rationale: string }]
  recommended_actions JSONB DEFAULT '[]',

  -- Links to scenario playbook steps (S67)
  linked_playbook_step_ids TEXT[] DEFAULT '{}',

  -- Confidence
  confidence_score DECIMAL(3, 2),  -- 0.00 to 1.00

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log for simulation activities
CREATE TABLE ai_scenario_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES ai_scenario_simulations(id) ON DELETE SET NULL,
  run_id UUID REFERENCES ai_scenario_runs(id) ON DELETE SET NULL,

  -- Event info
  event_type TEXT NOT NULL,  -- e.g., 'simulation_created', 'run_started', 'agent_step'
  actor_id UUID,  -- User who triggered the event

  -- Details
  -- Structure: {
  --   description: string,
  --   before: {...},
  --   after: {...},
  --   llmModel?: string,
  --   tokenUsage?: { prompt: number, completion: number },
  --   durationMs?: number,
  --   errorMessage?: string
  -- }
  details JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- ai_scenario_simulations indexes
CREATE INDEX idx_ai_scenario_simulations_org_id ON ai_scenario_simulations(org_id);
CREATE INDEX idx_ai_scenario_simulations_status ON ai_scenario_simulations(status);
CREATE INDEX idx_ai_scenario_simulations_objective ON ai_scenario_simulations(objective_type);
CREATE INDEX idx_ai_scenario_simulations_playbook ON ai_scenario_simulations(linked_playbook_id) WHERE linked_playbook_id IS NOT NULL;
CREATE INDEX idx_ai_scenario_simulations_created ON ai_scenario_simulations(created_at DESC);
CREATE INDEX idx_ai_scenario_simulations_deleted ON ai_scenario_simulations(deleted_at) WHERE deleted_at IS NULL;

-- ai_scenario_runs indexes
CREATE INDEX idx_ai_scenario_runs_org_id ON ai_scenario_runs(org_id);
CREATE INDEX idx_ai_scenario_runs_simulation_id ON ai_scenario_runs(simulation_id);
CREATE INDEX idx_ai_scenario_runs_status ON ai_scenario_runs(status);
CREATE INDEX idx_ai_scenario_runs_risk_level ON ai_scenario_runs(risk_level);
CREATE INDEX idx_ai_scenario_runs_created ON ai_scenario_runs(created_at DESC);

-- ai_scenario_agents indexes
CREATE INDEX idx_ai_scenario_agents_org_id ON ai_scenario_agents(org_id);
CREATE INDEX idx_ai_scenario_agents_simulation_id ON ai_scenario_agents(simulation_id);
CREATE INDEX idx_ai_scenario_agents_run_id ON ai_scenario_agents(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX idx_ai_scenario_agents_role_type ON ai_scenario_agents(role_type);
CREATE INDEX idx_ai_scenario_agents_active ON ai_scenario_agents(is_active) WHERE is_active = true;

-- ai_scenario_turns indexes
CREATE INDEX idx_ai_scenario_turns_org_id ON ai_scenario_turns(org_id);
CREATE INDEX idx_ai_scenario_turns_run_id ON ai_scenario_turns(run_id);
CREATE INDEX idx_ai_scenario_turns_step ON ai_scenario_turns(run_id, step_index);
CREATE INDEX idx_ai_scenario_turns_speaker ON ai_scenario_turns(speaker_agent_id);
CREATE INDEX idx_ai_scenario_turns_created ON ai_scenario_turns(created_at DESC);

-- ai_scenario_metrics indexes
CREATE INDEX idx_ai_scenario_metrics_org_id ON ai_scenario_metrics(org_id);
CREATE INDEX idx_ai_scenario_metrics_run_id ON ai_scenario_metrics(run_id);
CREATE INDEX idx_ai_scenario_metrics_key ON ai_scenario_metrics(metric_key);
CREATE INDEX idx_ai_scenario_metrics_category ON ai_scenario_metrics(metric_category) WHERE metric_category IS NOT NULL;

-- ai_scenario_outcomes indexes
CREATE INDEX idx_ai_scenario_outcomes_org_id ON ai_scenario_outcomes(org_id);
CREATE INDEX idx_ai_scenario_outcomes_run_id ON ai_scenario_outcomes(run_id);
CREATE INDEX idx_ai_scenario_outcomes_type ON ai_scenario_outcomes(outcome_type);
CREATE INDEX idx_ai_scenario_outcomes_risk ON ai_scenario_outcomes(risk_level);

-- ai_scenario_audit_log indexes
CREATE INDEX idx_ai_scenario_audit_org_id ON ai_scenario_audit_log(org_id);
CREATE INDEX idx_ai_scenario_audit_simulation ON ai_scenario_audit_log(simulation_id) WHERE simulation_id IS NOT NULL;
CREATE INDEX idx_ai_scenario_audit_run ON ai_scenario_audit_log(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX idx_ai_scenario_audit_event ON ai_scenario_audit_log(event_type);
CREATE INDEX idx_ai_scenario_audit_created ON ai_scenario_audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ai_scenario_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scenario_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scenario_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scenario_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scenario_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scenario_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scenario_audit_log ENABLE ROW LEVEL SECURITY;

-- Simulations policies
CREATE POLICY "ai_scenario_simulations_org_isolation" ON ai_scenario_simulations
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Runs policies
CREATE POLICY "ai_scenario_runs_org_isolation" ON ai_scenario_runs
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Agents policies
CREATE POLICY "ai_scenario_agents_org_isolation" ON ai_scenario_agents
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Turns policies
CREATE POLICY "ai_scenario_turns_org_isolation" ON ai_scenario_turns
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Metrics policies
CREATE POLICY "ai_scenario_metrics_org_isolation" ON ai_scenario_metrics
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Outcomes policies
CREATE POLICY "ai_scenario_outcomes_org_isolation" ON ai_scenario_outcomes
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Audit log policies
CREATE POLICY "ai_scenario_audit_log_org_isolation" ON ai_scenario_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for simulations
CREATE TRIGGER update_ai_scenario_simulations_updated_at
  BEFORE UPDATE ON ai_scenario_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for runs
CREATE TRIGGER update_ai_scenario_runs_updated_at
  BEFORE UPDATE ON ai_scenario_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for agents
CREATE TRIGGER update_ai_scenario_agents_updated_at
  BEFORE UPDATE ON ai_scenario_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_scenario_simulations IS 'AI scenario simulation configurations for multi-agent what-if analysis';
COMMENT ON TABLE ai_scenario_runs IS 'Individual execution runs of simulations with context snapshots';
COMMENT ON TABLE ai_scenario_agents IS 'Agent definitions with roles and personas for simulation participants';
COMMENT ON TABLE ai_scenario_turns IS 'Individual dialogue turns/messages within simulation runs';
COMMENT ON TABLE ai_scenario_metrics IS 'Computed metrics (risk, sentiment, etc.) during simulation execution';
COMMENT ON TABLE ai_scenario_outcomes IS 'Synthesized outcomes and recommendations from simulation runs';
COMMENT ON TABLE ai_scenario_audit_log IS 'Audit trail for simulation activities and LLM usage';

COMMENT ON COLUMN ai_scenario_simulations.config IS 'JSONB configuration including time horizon, constraints, agent configs';
COMMENT ON COLUMN ai_scenario_runs.seed_context IS 'Snapshot of intelligence context at run start (unified graph, risk radar, etc.)';
COMMENT ON COLUMN ai_scenario_agents.persona_ref IS 'Reference to S51 audience persona or inline persona snapshot';
COMMENT ON COLUMN ai_scenario_turns.metadata IS 'LLM generation metadata including model, tokens, sources referenced';
COMMENT ON COLUMN ai_scenario_outcomes.recommended_actions IS 'Array of action recommendations with priority and rationale';
