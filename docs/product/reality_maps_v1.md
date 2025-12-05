# AI-Driven Multi-Outcome Reality Maps Engine V1

**Sprint:** S73
**Status:** Complete
**Feature Flag:** `ENABLE_REALITY_MAPS`

## Overview

The Reality Maps Engine is an advanced intelligence layer that generates branching trees of possible "realities" from multi-scenario simulation data. Each node in the tree represents a distinct possible future with AI-generated narratives, probability estimates, risk/opportunity scores, and key drivers. The system enables executives and strategists to visualize the complete landscape of potential outcomes from any strategic scenario.

## Key Concepts

### Reality Map
A hierarchical visualization showing all possible outcome paths from a given starting scenario. Each map contains:
- **Nodes**: Individual reality states with probability, risk, and opportunity metrics
- **Edges**: Transitions between states with associated probabilities
- **Paths**: Complete sequences from root to outcome nodes
- **Analysis**: Aggregated insights including correlations and contradictions

### Node Types
- **Root**: The initial scenario or starting point
- **Branch**: Intermediate decision points or events
- **Outcome**: Terminal nodes representing final states

### Outcome Types
- **Positive**: Favorable outcomes with high opportunity scores
- **Negative**: Unfavorable outcomes with high risk scores
- **Neutral**: Balanced outcomes with moderate scores
- **Mixed**: Outcomes with both significant risks and opportunities
- **Unknown**: Outcomes requiring additional analysis

## Architecture

### Data Flow
```
S71 Simulations → S72 Orchestration → S73 Reality Maps
       ↓                  ↓                   ↓
   Run Data          Suite Data          Graph Generation
   Outcomes          Transitions         Probability Model
   Metrics           Conditions          Narrative Engine
```

### Generation Pipeline

1. **Data Ingestion**: Consumes simulation results from S71/S72 suites
2. **Branching Structure**: Computes tree topology based on scenario transitions
3. **Probability Model**: Assigns probabilities using weighted average, Bayesian, or Monte Carlo methods
4. **Narrative Generation**: AI creates executive summaries for each node
5. **Risk/Opportunity Scoring**: Computes metrics based on accumulated factors
6. **Graph Construction**: Builds visualization-ready data structure
7. **Path Analysis**: Identifies and classifies all outcome paths

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/reality-maps` | List reality maps |
| POST | `/api/v1/reality-maps` | Create new map |
| GET | `/api/v1/reality-maps/:id` | Get map details |
| PATCH | `/api/v1/reality-maps/:id` | Update map |
| DELETE | `/api/v1/reality-maps/:id` | Delete map |
| POST | `/api/v1/reality-maps/:id/generate` | Trigger generation |
| GET | `/api/v1/reality-maps/:id/graph` | Get visualization data |
| GET | `/api/v1/reality-maps/:id/analysis` | Get analysis results |
| GET | `/api/v1/reality-maps/stats` | Get org-wide stats |
| GET | `/api/v1/reality-maps/:id/audit-log` | Get audit events |

### Create Reality Map

```typescript
POST /api/v1/reality-maps
{
  "name": "Crisis Reality Map",
  "description": "Multi-outcome analysis for crisis scenarios",
  "suiteId": "suite-123", // Optional: Link to S72 suite
  "parameters": {
    "maxDepth": 5,           // Max tree depth (1-10)
    "branchingFactor": 3,    // Max branches per node (1-10)
    "minProbability": 0.05,  // Exclude low probability paths (0-0.5)
    "includeRiskAnalysis": true,
    "includeOpportunityAnalysis": true,
    "narrativeStyle": "executive", // executive | technical | strategic | journalistic
    "probabilityModel": "weighted_average" // weighted_average | bayesian | monte_carlo
  }
}
```

### Generation Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| maxDepth | number | 5 | Maximum tree depth (1-10) |
| branchingFactor | number | 3 | Maximum branches per node (1-10) |
| minProbability | number | 0.05 | Minimum probability threshold (0-0.5) |
| includeRiskAnalysis | boolean | true | Include risk scoring |
| includeOpportunityAnalysis | boolean | true | Include opportunity scoring |
| narrativeStyle | string | "executive" | AI narrative writing style |
| probabilityModel | string | "weighted_average" | Probability calculation method |

### Graph Response

```typescript
{
  "nodes": [
    {
      "id": "node-1",
      "type": "root",
      "label": "Crisis Detection",
      "probability": 1.0,
      "cumulativeProbability": 1.0,
      "riskScore": 50,
      "opportunityScore": 40,
      "depth": 0,
      "summary": "AI-generated summary...",
      "position": { "x": 400, "y": 50 },
      "parentId": null,
      "childIds": ["node-2", "node-3"]
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "probability": 0.6,
      "label": "Quick response"
    }
  ],
  "paths": [
    {
      "id": "path-1",
      "pathNodes": ["node-1", "node-2", "node-4"],
      "label": "Best Case Scenario",
      "outcomeType": "positive",
      "cumulativeProbability": 0.42,
      "riskScore": 15,
      "opportunityScore": 80
    }
  ],
  "metadata": {
    "totalNodes": 25,
    "totalEdges": 24,
    "totalPaths": 8,
    "maxDepth": 5,
    "generatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### Analysis Response

```typescript
{
  "outcomeUniverse": {
    "totalOutcomes": 8,
    "positiveOutcomes": 3,
    "negativeOutcomes": 2,
    "neutralOutcomes": 2,
    "mixedOutcomes": 1,
    "outcomeDistribution": {
      "positive": 0.42,
      "negative": 0.32,
      "neutral": 0.15,
      "mixed": 0.11
    },
    "riskSummary": {
      "averageScore": 45,
      "maxScore": 90,
      "minScore": 10
    },
    "opportunitySummary": {
      "averageScore": 55,
      "maxScore": 85,
      "minScore": 15
    },
    "topDrivers": [
      { "name": "Response Speed", "direction": "positive", "impact": "high" }
    ]
  },
  "contradictions": [
    {
      "type": "probability_conflict",
      "description": "Branch probabilities exceed 100%",
      "severity": "low",
      "nodeIds": ["node-5"]
    }
  ],
  "correlations": [
    {
      "type": "risk_opportunity",
      "description": "Speed correlates with lower risk",
      "strength": "strong",
      "coefficient": -0.85
    }
  ],
  "aggregatedRisks": [
    { "name": "Reputational Damage", "severity": "high" }
  ],
  "aggregatedOpportunities": [
    { "name": "Brand Strengthening", "potential": "high" }
  ]
}
```

## Probability Models

### Weighted Average (Default)
Combines probabilities from simulation runs with historical data weights. Best for scenarios with extensive historical precedent.

### Bayesian
Updates probabilities based on prior beliefs and observed evidence. Best for scenarios where expert opinion can inform initial estimates.

### Monte Carlo
Simulates thousands of random paths to estimate outcome probabilities. Best for complex scenarios with many interdependencies.

## Narrative Styles

### Executive
Concise, action-oriented summaries suitable for C-suite consumption. Focus on strategic implications and key decisions.

### Technical
Detailed analysis with specific metrics and technical considerations. Suitable for operational teams.

### Strategic
Long-term focused narratives emphasizing competitive position and market dynamics.

### Journalistic
Clear, accessible language suitable for broad stakeholder communication.

## UI Components

### RealityMapCard
Displays map summary in list view with status, node/path counts, and action buttons.

### RealityMapGraph
Interactive SVG visualization with pan/zoom, node selection, and path highlighting.

### RealityNodeDetailDrawer
Side panel showing full node details including AI summary, key drivers, risk factors, and opportunities.

### RealityPathPanel
Tabbed panel for browsing paths and path comparisons with highlighting controls.

### RealityAnalysisPanel
Dashboard showing outcome universe, aggregated risks/opportunities, contradictions, and correlations.

### RealityCreateForm
Form for creating/editing maps with parameter configuration.

### RealityMapToolbar
Action toolbar with generate, edit, export, and delete controls.

## Database Schema

### Tables

- `reality_maps`: Core map metadata and parameters
- `reality_map_nodes`: Individual nodes with all metrics
- `reality_map_edges`: Connections between nodes
- `reality_map_paths`: Pre-computed paths through the graph
- `reality_map_audit_log`: Event log for compliance
- `reality_map_comparisons`: Stored path comparisons

### Key Features

- Row-Level Security (RLS) for organization isolation
- Automatic timestamp triggers
- Computed cumulative probabilities
- Graph traversal functions

## Integration Points

### Dependencies
- **S71**: AI Scenario Simulation Engine (run data)
- **S72**: Scenario Orchestration Engine (suite data)
- **S60**: Risk Radar (risk factors)
- **S70**: Unified Narrative Engine (narrative generation)

### Consumers
- Executive dashboards
- Strategic planning tools
- Risk management systems
- Board reporting

## Feature Flag

Enable with: `ENABLE_REALITY_MAPS: true`

When disabled:
- All API endpoints return 503
- UI components hide the feature
- No background generation tasks run

## Performance Considerations

- Large trees (>100 nodes) may require pagination
- Generation is async; poll status for completion
- Graph rendering optimized for trees up to 500 nodes
- Consider reducing depth/branching for initial exploration

## Best Practices

1. **Start Small**: Begin with depth 3-4 and expand as needed
2. **Use Thresholds**: Set minProbability to exclude unlikely paths
3. **Link to Suites**: Connect to S72 suites for richer data
4. **Review Contradictions**: Address probability conflicts before sharing
5. **Export for Sharing**: Use PDF/PNG export for stakeholder presentations

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| No source data | Suite has no completed runs | Run simulations first |
| Generation timeout | Tree too complex | Reduce depth/branching |
| Probability overflow | Sum exceeds 100% | Review branching logic |
| Empty paths | All filtered by threshold | Lower minProbability |

## Changelog

### V1.0 (S73)
- Initial release
- Core generation engine
- Interactive graph visualization
- Analysis dashboard
- Audit logging
- Export capabilities
