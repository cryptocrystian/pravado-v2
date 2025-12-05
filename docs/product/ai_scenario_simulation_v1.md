# AI Scenario Simulation Engine V1

**Sprint:** S71
**Status:** Implemented
**Feature Flag:** `ENABLE_AI_SCENARIO_SIMULATIONS`

## Overview

The AI Scenario Simulation Engine enables autonomous multi-agent simulations for crisis, investor, and strategic scenario planning. It leverages LLMs to generate realistic dialogues between various stakeholder personas (executives, journalists, investors, regulators, etc.) to help organizations prepare for critical communications scenarios.

## Core Concepts

### Simulations

A simulation is a container for running scenario exercises. Each simulation has:

- **Name & Description**: Identifying information
- **Objective Type**: The primary purpose (crisis_comms, investor_relations, reputation, etc.)
- **Simulation Mode**: How the simulation operates
  - `single_run`: One complete simulation run
  - `multi_run`: Multiple runs with variations for comparison
  - `what_if`: Explore alternative outcomes and branching scenarios
- **Configuration**: Settings like max steps, temperature, and custom prompts

### Runs

A run is an individual execution of a simulation. Each run has:

- **Status Lifecycle**: `starting` → `in_progress` → `completed`/`failed`/`aborted`
- **Step Tracking**: Current step, max steps, tokens used
- **Risk Assessment**: Low, medium, high, or critical risk levels
- **Seed Context**: Initial scenario conditions and context

### Agents

Agents are AI-powered personas that participate in the simulation dialogue:

- **Internal Exec**: Company executives (CEO, PR Director, etc.)
- **Journalist**: Media representatives
- **Investor**: Shareholders and analysts
- **Customer**: End users and clients
- **Employee**: Internal staff
- **Regulator**: Government/regulatory bodies
- **Market Analyst**: Industry analysts
- **Critic**: Adversarial personas for stress testing
- **System**: Narrator/moderator role

### Turns

Turns are individual dialogue entries within a run, capturing:

- Speaker agent and target agent(s)
- Content (the actual dialogue)
- Communication channel (press_conference, email, internal_memo, etc.)
- LLM metadata (model, tokens, latency)

## Database Schema

### Tables

- `ai_scenario_simulations`: Main simulation records
- `ai_scenario_runs`: Individual run instances
- `ai_scenario_agents`: Agent configurations per run
- `ai_scenario_turns`: Dialogue turns/exchanges
- `ai_scenario_audit_log`: Complete audit trail

### Key Relationships

```
simulations 1:N runs 1:N agents
                    1:N turns
simulations 1:N audit_log
```

## API Endpoints

### Simulation Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai-scenario-simulations` | Create simulation |
| GET | `/api/v1/ai-scenario-simulations` | List simulations |
| GET | `/api/v1/ai-scenario-simulations/:id` | Get simulation |
| PUT | `/api/v1/ai-scenario-simulations/:id` | Update simulation |
| POST | `/api/v1/ai-scenario-simulations/:id/archive` | Archive simulation |

### Run Lifecycle

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai-scenario-simulations/:id/runs` | Start new run |
| GET | `/api/v1/ai-scenario-simulations/:id/runs` | List runs |
| GET | `/api/v1/ai-scenario-simulations/runs/:runId` | Get run detail |
| POST | `/api/v1/ai-scenario-simulations/runs/:runId/step` | Advance one step |
| POST | `/api/v1/ai-scenario-simulations/runs/:runId/run-to-completion` | Run until done |
| POST | `/api/v1/ai-scenario-simulations/runs/:runId/abort` | Abort run |

### Turns & Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai-scenario-simulations/runs/:runId/turns` | List turns |
| GET | `/api/v1/ai-scenario-simulations/agents/presets` | Get agent presets |

### Observability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai-scenario-simulations/stats` | Get statistics |
| GET | `/api/v1/ai-scenario-simulations/runs/:runId/metrics` | Get run metrics |
| GET | `/api/v1/ai-scenario-simulations/:id/audit-log` | Get audit log |

## Frontend Components

### SimulationList

Displays paginated list of simulations with:
- Search by name
- Filter by status and objective type
- Quick actions (view, edit, start run, archive)

### CreateSimulationModal

Form for creating new simulations with:
- Name and description inputs
- Objective type selection (10 options)
- Simulation mode selection

### RunViewer

Real-time viewer for simulation runs:
- Agent roster with role colors
- Step-by-step dialogue display
- Manual step/auto-run controls
- Risk level indicator
- Abort functionality

### SimulationCard

Card component for individual simulation display with:
- Status badge
- Objective and mode indicators
- Linked playbook info
- Action buttons

## Usage Patterns

### Basic Workflow

1. Create a simulation with objective type and mode
2. Configure agents and seed context (optional)
3. Start a run
4. Advance steps manually or run to completion
5. Review dialogue and risk assessment
6. Archive when done

### Crisis Drill Example

```typescript
// Create crisis simulation
const simulation = await createSimulation({
  name: 'Product Recall Response Drill',
  objectiveType: 'crisis_comms',
  simulationMode: 'single_run',
  config: {
    maxStepsPerRun: 20,
    temperature: 0.8,
  },
});

// Start run with crisis scenario
const run = await startRun(simulation.id, {
  runLabel: 'Scenario A: Full Recall',
  seedContext: {
    scenario: 'Safety defect discovered in flagship product',
    affectedUnits: 50000,
    mediaAttention: 'high',
  },
});

// Step through or run to completion
await runToCompletion(run.id, { maxSteps: 20 });
```

## Configuration Options

### Simulation Config

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxStepsPerRun` | number | 20 | Maximum dialogue turns |
| `temperature` | number | 0.7 | LLM creativity (0-1) |
| `agentTemperatures` | Record | - | Per-agent temperature |
| `scenarioPrompt` | string | - | Custom scenario description |
| `moderatorEnabled` | boolean | true | Enable system narrator |

### Agent Config

| Field | Type | Description |
|-------|------|-------------|
| `roleType` | enum | Agent persona type |
| `displayName` | string | Human-readable name |
| `systemPrompt` | string | Agent behavior prompt |
| `behaviorTraits` | object | Personality settings |
| `temperature` | number | Agent-specific LLM temperature |

## Security & Access Control

- All endpoints require authentication
- RLS policies enforce org-level isolation
- Feature flag controls availability
- Audit log captures all operations
- Sensitive context is properly scoped

## Future Enhancements

- Playbook integration for automated scenario triggers
- Real-time collaboration with human-in-loop
- Branching scenarios with decision trees
- Export/report generation
- Historical comparison analytics
- Custom agent persona builder
