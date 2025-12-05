# Scenario Orchestration Engine V1

**Sprint:** S72
**Status:** Complete
**Dependencies:** S71 (AI Scenario Simulation Engine)

## Overview

The Scenario Orchestration Engine enables organizations to chain multiple AI scenario simulations into coordinated suites with conditional triggers, branching outcomes, and suite-level analytics. This builds on the S71 simulation engine to provide multi-scenario orchestration capabilities for complex PR and crisis scenarios.

## Key Features

### 1. Suite Management

- **Create Suites**: Define named collections of simulations
- **Configure Behavior**: Set suite-level options for execution
- **Order Items**: Arrange simulations in execution sequence
- **Conditional Triggers**: Define when each simulation should run

### 2. Trigger Conditions

The engine supports six trigger condition types:

| Type | Description | Parameters |
|------|-------------|------------|
| `always` | Always execute | None |
| `risk_threshold` | Execute when risk level meets threshold | `minRiskLevel`, `comparison` |
| `sentiment_shift` | Execute on sentiment changes | `direction`, `magnitude` |
| `keyword_match` | Execute when keywords detected | `keywords`, `matchMode` |
| `agent_response` | Execute based on agent behavior | `agentRoleType`, `responsePattern` |
| `outcome_match` | Execute when outcome type matches | `outcomeType`, `includePartial` |

### 3. Suite Run Execution

- **Sequential Execution**: Run simulations in order
- **Condition Evaluation**: Check conditions before each step
- **Skip Logic**: Skip items when conditions not met
- **Failure Handling**: Optional stop-on-failure behavior
- **Metrics Aggregation**: Track tokens, steps, duration across suite

### 4. Suite-Level Analytics

- **Narrative Generation**: AI-powered summary of suite outcomes
- **Risk Map**: Aggregated risk analysis with mitigations
- **Outcome Aggregation**: Combined findings from all simulations
- **Cross-Scenario Metrics**: Total steps, tokens, duration

## Architecture

### Database Schema

```
scenario_suites
├── id, org_id, name, description
├── status (draft, configured, running, completed, archived)
├── config (JSON: narrative, risk map, stop on failure, etc.)
└── timestamps

scenario_suite_items
├── id, suite_id, simulation_id
├── order_index, label, notes
├── trigger_condition_type
├── trigger_condition (JSON)
└── timestamps

scenario_suite_runs
├── id, suite_id, triggered_by
├── status (pending, running, paused, completed, failed, aborted)
├── current_item_index, total_items
├── aggregated_outcomes (JSON)
├── suite_narrative, risk_map (JSON)
├── total_steps, tokens, duration
└── timestamps

scenario_suite_run_items
├── id, run_id, suite_item_id
├── simulation_run_id, order_index
├── status, risk_level
├── steps_executed, tokens_used, duration_ms
├── condition_evaluated, condition_result
├── key_findings, outcome_summary (JSON)
└── timestamps

scenario_suite_audit_log
├── id, suite_id, run_id, event_type
├── actor_id, event_data (JSON)
└── timestamp
```

### Service Layer

The `scenarioOrchestrationService` provides:

```typescript
// Suite CRUD
createSuite(orgId, userId, input) → { suite }
getSuite(orgId, suiteId) → { suite, items }
listSuites(orgId, query) → { suites, total }
updateSuite(orgId, suiteId, userId, input) → { suite }
archiveSuite(orgId, suiteId, userId, reason?) → { suite }

// Suite Items
addSuiteItem(orgId, suiteId, userId, input) → { item }
updateSuiteItem(orgId, itemId, userId, input) → { item }
removeSuiteItem(orgId, itemId, userId) → { success }

// Suite Runs
startSuiteRun(orgId, suiteId, userId, options?) → { run }
getSuiteRun(orgId, runId) → { run }
listSuiteRuns(orgId, suiteId, query) → { runs, total }
advanceSuiteRun(orgId, runId, userId, options?) → { run, advanced }
abortSuiteRun(orgId, runId, userId, reason?) → { run }

// Analytics
generateSuiteNarrative(orgId, runId, options?) → { narrative }
generateSuiteRiskMap(orgId, runId, options?) → { riskMap }
getSuiteRunMetrics(orgId, runId) → { metrics }
getSuiteStats(orgId) → { stats }
```

### API Endpoints

```
# Suite CRUD
GET    /api/v1/scenario-orchestrations/suites
POST   /api/v1/scenario-orchestrations/suites
GET    /api/v1/scenario-orchestrations/suites/:id
PATCH  /api/v1/scenario-orchestrations/suites/:id
POST   /api/v1/scenario-orchestrations/suites/:id/archive

# Suite Items
POST   /api/v1/scenario-orchestrations/suites/:id/items
PATCH  /api/v1/scenario-orchestrations/suite-items/:id
DELETE /api/v1/scenario-orchestrations/suite-items/:id

# Suite Runs
POST   /api/v1/scenario-orchestrations/suites/:id/runs
GET    /api/v1/scenario-orchestrations/suites/:id/runs
GET    /api/v1/scenario-orchestrations/suite-runs/:id
GET    /api/v1/scenario-orchestrations/suite-runs/:id/items
POST   /api/v1/scenario-orchestrations/suite-runs/:id/advance
POST   /api/v1/scenario-orchestrations/suite-runs/:id/abort

# Analytics
GET    /api/v1/scenario-orchestrations/suite-runs/:id/metrics
POST   /api/v1/scenario-orchestrations/suite-runs/:id/narrative
POST   /api/v1/scenario-orchestrations/suite-runs/:id/risk-map
GET    /api/v1/scenario-orchestrations/stats

# Audit
GET    /api/v1/scenario-orchestrations/suites/:id/audit-log
GET    /api/v1/scenario-orchestrations/suite-runs/:id/audit-log
```

## UI Components

### Dashboard Components

| Component | Purpose |
|-----------|---------|
| `SuiteCard` | Display suite in list view with status, counts, actions |
| `SuiteConfigForm` | Create/edit suite with config options |
| `SuiteItemList` | Display simulation items with conditions |
| `SuiteRunTimeline` | Visual timeline of run progress |
| `SuiteMetricsPanel` | Aggregated metrics display |
| `SuiteOutcomePanel` | Narrative, risk map, outcomes tabs |
| `SuiteRunControlBar` | Advance/abort run controls |

### Page Views

- **List View**: Grid of suite cards with filters
- **Detail View**: Suite configuration and items
- **Run View**: Active run monitoring and controls

## Usage Examples

### Creating a Crisis Response Suite

```typescript
const suite = await createSuite(orgId, userId, {
  name: 'Crisis Response Chain',
  description: 'Multi-phase crisis simulation',
  config: {
    narrativeEnabled: true,
    riskMapEnabled: true,
    stopOnFailure: true,
    maxConcurrentSimulations: 1,
    timeoutSeconds: 3600,
  },
  items: [
    {
      simulationId: 'crisis-detection-sim',
      orderIndex: 0,
      label: 'Initial Detection',
      triggerConditionType: 'always',
      triggerCondition: { type: 'always' },
    },
    {
      simulationId: 'escalation-sim',
      orderIndex: 1,
      label: 'Escalation Response',
      triggerConditionType: 'risk_threshold',
      triggerCondition: {
        type: 'risk_threshold',
        minRiskLevel: 'high',
        comparison: '>=',
      },
    },
    {
      simulationId: 'recovery-sim',
      orderIndex: 2,
      label: 'Recovery Phase',
      triggerConditionType: 'outcome_match',
      triggerCondition: {
        type: 'outcome_match',
        outcomeType: 'negative',
      },
    },
  ],
});
```

### Running a Suite

```typescript
// Start run
const { run } = await startSuiteRun(orgId, suiteId, userId);

// Monitor and advance
while (run.status === 'running') {
  const { run: updated, advanced } = await advanceSuiteRun(orgId, run.id, userId);

  if (!advanced) {
    // All items processed or blocked
    break;
  }

  run = updated;
}

// Generate analytics
const { narrative } = await generateSuiteNarrative(orgId, run.id, {
  format: 'executive',
  includeRecommendations: true,
});

const { riskMap } = await generateSuiteRiskMap(orgId, run.id, {
  includeOpportunities: true,
  includeMitigations: true,
});
```

## Feature Flag

```typescript
// packages/feature-flags/src/flags.ts
ENABLE_SCENARIO_ORCHESTRATION: true
```

## Testing

### Backend Tests

Located at: `apps/api/tests/scenarioOrchestrationService.test.ts`

Covers:
- Suite CRUD operations
- Item management
- Run execution and advancement
- Condition evaluation
- Narrative/risk map generation
- Error handling

### E2E Tests

Located at: `apps/dashboard/tests/e2e/scenarioOrchestrations.e2e.test.ts`

Covers:
- Suite list/detail views
- Suite creation flow
- Run execution and monitoring
- Analytics generation
- Error handling

## Integration Points

### S71 AI Scenario Simulation Engine

The orchestration engine integrates with S71 for:
- Running individual simulations (`aiScenarioSimulationService.startRun`)
- Converging simulations (`aiScenarioSimulationService.runUntilConverged`)
- Extracting outcomes for condition evaluation

### LLM Router

Uses `@pravado/utils/routeLLM` for:
- Narrative generation
- Risk map synthesis
- Outcome summarization

## Performance Considerations

- **Pagination**: All list endpoints support offset/limit pagination
- **Selective Loading**: Suite items loaded separately from suite
- **Metrics Caching**: Aggregated metrics stored on run record
- **Async Execution**: Simulations run asynchronously within suites

## Security

- **Org Isolation**: RLS policies enforce org-level access
- **Audit Trail**: All operations logged to audit table
- **Feature Gating**: Disabled by default via feature flag
- **Input Validation**: Zod schemas validate all inputs

## Future Enhancements

1. **Parallel Execution**: Run multiple simulations concurrently
2. **Complex Branching**: Support for decision trees and loops
3. **Template Library**: Pre-built suite templates
4. **Scheduling**: Automated suite runs on schedule
5. **Webhooks**: Notify external systems on suite events
6. **Comparison Mode**: Compare outcomes across runs
