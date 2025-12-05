# Scenario Simulation & Autonomous Playbook Orchestration V1 - Product Specification

**Sprint:** S67
**Feature:** Scenario Simulation & Autonomous Playbook Orchestration Engine
**Status:** Implemented
**Last Updated:** December 2024

## Overview

The Scenario Simulation & Autonomous Playbook Orchestration Engine enables PR teams to define, simulate, and autonomously execute multi-step response playbooks for various scenarios. It combines predictive simulation with human-in-the-loop approval gates, allowing organizations to prepare for and respond to crises, opportunities, and ongoing monitoring needs with AI-powered automation.

## Problem Statement

Modern PR teams face challenges in:

- **Rapid Response**: Crisis situations require immediate, coordinated action across multiple channels
- **Consistency**: Different team members may handle similar situations differently
- **Predictability**: No way to simulate outcomes before committing to a response strategy
- **Scalability**: Manual processes don't scale with increasing media complexity
- **Governance**: Need for approval workflows while maintaining speed

## Solution

An integrated playbook system that:

1. **Defines Reusable Playbooks**: Multi-step workflows for different scenario types
2. **Simulates Outcomes**: LLM-powered prediction of response effectiveness
3. **Orchestrates Execution**: Step-by-step automated execution with status tracking
4. **Enables Human Control**: Approval gates for sensitive actions
5. **Provides Visibility**: Real-time run monitoring and audit trails

## Core Concepts

### Scenario Playbooks

Reusable templates defining response workflows:

| Field | Description |
|-------|-------------|
| Name | Descriptive playbook name |
| Category | Type: crisis_management, product_launch, reputation_repair, media_outreach, content_amplification, competitor_response, custom |
| Steps | Ordered list of actions to execute |
| Trigger Conditions | Optional automatic trigger criteria |
| Version | Auto-incrementing version number |

### Playbook Steps

Individual actions within a playbook:

| Field | Description |
|-------|-------------|
| Action Type | Type of action (see Action Types below) |
| Action Payload | Configuration for the action |
| Requires Approval | Whether human approval is needed |
| Approval Roles | Roles that can approve |
| Estimated Duration | Expected time to complete |

### Action Types

11 supported action types:

| Type | Description |
|------|-------------|
| `generate_content` | Create content using AI |
| `analyze_sentiment` | Analyze sentiment of coverage |
| `send_outreach` | Send media outreach |
| `schedule_post` | Schedule social media posts |
| `monitor_coverage` | Monitor media coverage |
| `update_metrics` | Update tracking metrics |
| `escalate` | Escalate to stakeholders |
| `notify` | Send notifications |
| `wait` | Pause for specified duration |
| `branch` | Conditional branching |
| `custom` | Custom action handler |

### Scenarios

Instances of playbooks with specific context:

| Field | Description |
|-------|-------------|
| Scenario Type | crisis, opportunity, monitoring, proactive, reactive, scheduled |
| Risk Level | low, medium, high, critical |
| Context Parameters | Scenario-specific data (product, region, etc.) |
| Status | draft, ready, in_progress, completed, archived |

### Scenario Runs

Execution instances of scenarios:

| Status | Description |
|--------|-------------|
| `running` | Currently executing |
| `paused` | Temporarily paused |
| `awaiting_approval` | Waiting for human approval |
| `completed` | Successfully finished |
| `failed` | Encountered error |
| `cancelled` | Manually cancelled |

### Run Steps

Individual step execution records:

| Status | Description |
|--------|-------------|
| `pending` | Not yet started |
| `ready` | Ready for execution/approval |
| `running` | Currently executing |
| `completed` | Successfully finished |
| `failed` | Encountered error |
| `skipped` | Skipped (rejected or bypassed) |

## Architecture

### Database Schema

Six PostgreSQL tables with RLS policies:

```
scenario_playbooks        - Playbook definitions
scenario_playbook_steps   - Step definitions within playbooks
scenarios                 - Scenario instances
scenario_runs            - Run execution records
scenario_run_steps       - Step execution records
scenario_audit_log       - Operation audit trail
```

### Enums

```sql
scenario_playbook_category: crisis_management | product_launch | reputation_repair | media_outreach | content_amplification | competitor_response | custom

scenario_step_action_type: generate_content | analyze_sentiment | send_outreach | schedule_post | monitor_coverage | update_metrics | escalate | notify | wait | branch | custom

scenario_type: crisis | opportunity | monitoring | proactive | reactive | scheduled

scenario_status: draft | ready | in_progress | completed | archived

scenario_risk_level: low | medium | high | critical

scenario_run_status: running | paused | awaiting_approval | completed | failed | cancelled

scenario_step_status: pending | ready | running | completed | failed | skipped
```

### API Endpoints

All endpoints under `/api/v1/scenario-playbooks`:

#### Playbook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /playbooks | Create playbook with steps |
| GET | /playbooks/:id | Get playbook with steps |
| PATCH | /playbooks/:id | Update playbook |
| DELETE | /playbooks/:id | Delete playbook |
| GET | /playbooks | List playbooks with filters |

#### Scenario Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /scenarios | Create scenario |
| GET | /scenarios/:id | Get scenario |
| PATCH | /scenarios/:id | Update scenario |
| DELETE | /scenarios/:id | Delete scenario |
| GET | /scenarios | List scenarios with filters |
| POST | /scenarios/:id/simulate | Run simulation |

#### Run Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /runs | Start new run |
| GET | /runs/:id | Get run with steps |
| GET | /runs | List runs with filters |
| POST | /runs/:id/pause | Pause running run |
| POST | /runs/:id/resume | Resume paused run |
| POST | /runs/:id/cancel | Cancel run |

#### Step Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /steps/:id/approve | Approve or reject step |

#### Statistics & Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /stats | Get summary statistics |
| GET | /audit | List audit logs |

## Simulation Engine

The simulation engine uses LLM (GPT-4o) to predict outcomes:

### Simulation Flow

1. **Context Assembly**: Gather playbook, scenario, and graph context from S66
2. **Risk Assessment**: Evaluate baseline and contextual risk factors
3. **Step Prediction**: Predict outcome of each step
4. **Timeline Generation**: Project metrics over time
5. **Recommendation Generation**: Suggest optimizations

### Simulation Output

```typescript
interface SimulationResult {
  scenarioId: string;
  playbookId: string;
  simulatedAt: string;
  riskScore: number;          // 0-100
  opportunityScore: number;   // 0-100
  confidenceScore: number;    // 0-1
  projectedMetrics: {
    timeline: Array<{
      day: number;
      sentimentProjected: number;
      coverageProjected: number;
      riskLevel: RiskLevel;
    }>;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expectedImpact?: string;
  }>;
  stepPreviews: Array<{
    stepName: string;
    actionType: string;
    riskLevel: RiskLevel;
    predictedOutcome: string;
  }>;
  narrativeSummary: string;
}
```

## Run Orchestration

### Execution Flow

1. **Start Run**: Create run record and step records
2. **Initialize First Step**: Set to 'ready' or 'awaiting_approval'
3. **Execute Step**: Run action based on type
4. **Record Result**: Store execution output
5. **Advance**: Move to next step or complete
6. **Handle Approval**: Pause at approval gates

### Human-in-the-Loop

Steps with `requiresApproval: true`:

1. Step enters `ready` status
2. Run enters `awaiting_approval` status
3. User reviews step details and simulated impact
4. User approves (execute) or rejects (skip)
5. Execution continues

### Simulated Impact Preview

Each approval step shows predicted impact:

- Sentiment delta
- Coverage delta
- Engagement delta
- Risk level change

## Frontend Components

### Dashboard Page

Located at `/app/scenarios`:

- **Header**: Title, description, action buttons
- **Stats Panel**: Playbook, scenario, and run counts
- **Tab Navigation**: Scenarios, Playbooks, Runs
- **Content Lists**: Filtered, paginated data

### Components

| Component | Purpose |
|-----------|---------|
| `ScenarioPlaybookStats` | Summary statistics display |
| `PlaybookList` | Playbook listing with filters |
| `PlaybookCard` | Individual playbook display |
| `PlaybookStepEditor` | Step creation/editing |
| `ScenarioList` | Scenario listing with filters |
| `ScenarioCard` | Individual scenario display |
| `RunList` | Run listing with status filters |
| `RunCard` | Individual run display |
| `SimulationResultsPanel` | Simulation output display |
| `StepApprovalPanel` | Step review and approval |
| `CreatePlaybookDialog` | Playbook creation modal |
| `CreateScenarioDialog` | Scenario creation modal |

## Integration Points

### S66 - Unified Intelligence Graph

- Uses graph context for simulation predictions
- References node types: `campaign`, `playbook_run`, `media_mention`
- Leverages relationship data for impact prediction

### S38-S65 - Feature Modules

- Integrates with content generation (S30-S32)
- Uses journalist discovery data (S46)
- Leverages media monitoring (S41)
- Connects to outreach engine (S43)

## Audit Logging

All operations are logged to `scenario_audit_log`:

| Action | Description |
|--------|-------------|
| `create_playbook` | Playbook created |
| `update_playbook` | Playbook updated |
| `delete_playbook` | Playbook deleted |
| `create_scenario` | Scenario created |
| `update_scenario` | Scenario updated |
| `delete_scenario` | Scenario deleted |
| `simulate_scenario` | Simulation executed |
| `start_run` | Run started |
| `pause_run` | Run paused |
| `resume_run` | Run resumed |
| `cancel_run` | Run cancelled |
| `complete_run` | Run completed |
| `fail_run` | Run failed |
| `approve_step` | Step approved |
| `reject_step` | Step rejected |

## Feature Flag

```typescript
ENABLE_SCENARIO_PLAYBOOK: true
```

## Performance Considerations

- Playbook steps are loaded eagerly with playbook
- Run steps are indexed by run_id for fast lookup
- Simulation caches graph context queries
- Pagination limits prevent large result sets

## Security

- RLS policies enforce org isolation
- All routes require authentication
- Approval actions require user context
- Audit log captures all state changes

## Future Enhancements

- **Parallel Step Execution**: Execute independent steps concurrently
- **Webhook Triggers**: External event-triggered runs
- **Template Library**: Pre-built playbook templates
- **A/B Testing**: Compare playbook variations
- **ML-based Timing**: Optimal execution timing prediction
- **Cross-Org Templates**: Share playbooks across organizations
