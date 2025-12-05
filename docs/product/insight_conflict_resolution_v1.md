# Autonomous Insight Conflict Resolution Engine V1

**Sprint:** S74
**Status:** Complete
**Feature Flag:** `ENABLE_INSIGHT_CONFLICTS`

## Overview

The Autonomous Insight Conflict Resolution Engine is a critical intelligence layer that detects, analyzes, and resolves contradictions, divergences, and inconsistencies across Pravado's upstream intelligence systems (S66 Unified Graph, S70 Unified Narrative, S73 Reality Maps). The system uses AI-driven analysis to identify root causes, generate conflict graphs, and produce consensus resolutions with full audit logging for compliance.

## Key Concepts

### Conflict Types

| Type | Description | Example |
|------|-------------|---------|
| **Contradiction** | Directly opposing statements or data | Revenue projections of $5M vs $4M from different sources |
| **Divergence** | Same metric with significant variance | Market share reported as 15% vs 22% |
| **Ambiguity** | Unclear or multiple interpretations | Sentiment scores that could be positive or neutral |
| **Missing Data** | Required data absent from sources | Trend analysis missing Q4 data points |
| **Inconsistency** | Related data that doesn't align | Product terminology differs across documents |

### Conflict Severity

| Level | Impact | Response Time |
|-------|--------|---------------|
| **Critical** | Financial/reputational risk | Immediate attention required |
| **High** | Strategic decision impact | Same-day resolution recommended |
| **Medium** | Operational efficiency | Within 48 hours |
| **Low** | Minor inconsistency | Weekly review cycle |

### Conflict Lifecycle

```
Detected → Analyzing → Resolved/Dismissed
    ↓          ↓              ↓
  Items    Root Cause     Resolution
  Graph    AI Analysis    Consensus
  Audit    Clustering     Narrative
```

### Resolution Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **AI Consensus** | Weighted average with AI reasoning | Numerical data conflicts |
| **Source Priority** | Prefer authoritative source | Known source reliability hierarchy |
| **Weighted Truth** | Confidence-based weighting | Multiple sources with varying reliability |
| **Hybrid** | Combination of strategies | Complex multi-factor conflicts |

## Architecture

### System Integration

```
S66 Unified Graph    S70 Unified Narrative    S73 Reality Maps
        ↓                     ↓                      ↓
    Vector DB            Narratives              Outcome Nodes
    Entities             Themes                  Probabilities
    Relations            Insights                Factors
        ↓                     ↓                      ↓
        └─────────────────────┴──────────────────────┘
                              ↓
                    S74 Conflict Detection
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
        Analysis Engine              Resolution Engine
              ↓                               ↓
        Root Cause ID                 AI Consensus
        Severity Calc                 Narrative Gen
        Graph Build                   Confidence Score
        Clustering                    Review Workflow
              ↓                               ↓
              └───────────────┬───────────────┘
                              ↓
                         Audit Log
```

### Detection Pipeline

1. **Vector Similarity**: Identifies semantically similar but contradictory content
2. **Cross-System Correlation**: Compares data across S66/S70/S73 boundaries
3. **LLM-Based Detection**: AI analyzes content for logical inconsistencies
4. **Threshold Matching**: Triggers on configurable confidence thresholds

### Analysis Pipeline

1. **Severity Computation**: Assesses impact based on affected areas and urgency
2. **Graph Generation**: Builds conflict relationship visualization
3. **Clustering**: Groups related conflicts for batch resolution
4. **Root Cause Analysis**: AI identifies underlying causes

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/insight-conflicts` | List conflicts |
| POST | `/api/v1/insight-conflicts` | Create conflict |
| GET | `/api/v1/insight-conflicts/:id` | Get conflict details |
| PATCH | `/api/v1/insight-conflicts/:id` | Update conflict |
| DELETE | `/api/v1/insight-conflicts/:id` | Delete conflict |
| POST | `/api/v1/insight-conflicts/:id/analyze` | Trigger analysis |
| POST | `/api/v1/insight-conflicts/:id/resolve` | Generate resolution |
| POST | `/api/v1/insight-conflicts/:id/dismiss` | Dismiss conflict |
| POST | `/api/v1/insight-conflicts/:id/review` | Review resolution |
| GET | `/api/v1/insight-conflicts/:id/items` | Get conflict items |
| GET | `/api/v1/insight-conflicts/:id/graph` | Get conflict graph |
| GET | `/api/v1/insight-conflicts/:id/audit-log` | Get audit events |
| GET | `/api/v1/insight-conflicts/stats` | Get statistics |
| POST | `/api/v1/insight-conflicts/detect` | Run detection |
| POST | `/api/v1/insight-conflicts/batch/analyze` | Batch analyze |
| POST | `/api/v1/insight-conflicts/batch/resolve` | Batch resolve |
| POST | `/api/v1/insight-conflicts/batch/dismiss` | Batch dismiss |
| GET | `/api/v1/insight-conflicts/clusters` | List clusters |
| POST | `/api/v1/insight-conflicts/clusters` | Create cluster |
| POST | `/api/v1/insight-conflicts/graph/edges` | Create graph edge |

### Create Conflict

```typescript
POST /api/v1/insight-conflicts
{
  "title": "Revenue Projection Contradiction",
  "description": "Conflicting revenue projections between IR and market analysis",
  "conflictType": "contradiction",
  "severity": "critical",
  "sourceSystem": "unified_graph",
  "sourceIds": ["entity-1", "entity-2"],
  "affectedEntities": ["Revenue Q1", "Market Forecast"],
  "confidenceScore": 0.92,
  "impactAssessment": {
    "affectedAreas": ["Financial Planning", "Investor Communications"],
    "potentialConsequences": ["Misaligned expectations", "Budget issues"],
    "urgencyLevel": "high"
  }
}
```

### Trigger Analysis

```typescript
POST /api/v1/insight-conflicts/:id/analyze
{}

// Response
{
  "conflict": { /* updated conflict with status: analyzing */ },
  "analysis": {
    "rootCauseHypothesis": "Different calculation methodologies",
    "severityJustification": "Critical due to financial implications",
    "suggestedResolutionStrategies": ["ai_consensus", "source_priority"],
    "relatedConflicts": ["conflict-2", "conflict-5"]
  }
}
```

### Generate Resolution

```typescript
POST /api/v1/insight-conflicts/:id/resolve
{
  "resolutionType": "ai_consensus",
  "resolvedValue": 4650000,
  "manualNotes": "Optional manual context"
}

// Response
{
  "conflict": { /* updated conflict with status: resolved */ },
  "resolution": {
    "id": "resolution-123",
    "resolutionType": "ai_consensus",
    "status": "pending_review",
    "summary": "Weighted average with source reliability factored in",
    "resolvedValue": 4650000,
    "confidenceScore": 0.85,
    "aiReasoning": "Combined projections using reliability weighting...",
    "consensusNarrative": "Q1 revenue is projected at $4.65M based on..."
  }
}
```

### Review Resolution

```typescript
POST /api/v1/insight-conflicts/:id/review
{
  "accept": true,
  "feedback": "Methodology is sound and appropriate"
}

// Response
{
  "resolution": {
    /* updated resolution with status: accepted */
    "acceptedAt": "2024-01-15T14:00:00Z",
    "reviewFeedback": "Methodology is sound and appropriate"
  }
}
```

### Run Detection

```typescript
POST /api/v1/insight-conflicts/detect
{
  "sourceSystems": ["unified_graph", "unified_narrative", "reality_maps"],
  "thresholds": {
    "similarityThreshold": 0.85,
    "divergenceThreshold": 0.15
  }
}

// Response
{
  "detected": 3,
  "conflicts": [ /* newly detected conflicts */ ]
}
```

### Batch Operations

```typescript
// Batch Analyze
POST /api/v1/insight-conflicts/batch/analyze
{
  "conflictIds": ["conflict-1", "conflict-2", "conflict-3"]
}

// Batch Resolve
POST /api/v1/insight-conflicts/batch/resolve
{
  "conflictIds": ["conflict-1", "conflict-2"],
  "resolutionType": "ai_consensus"
}

// Batch Dismiss
POST /api/v1/insight-conflicts/batch/dismiss
{
  "conflictIds": ["conflict-4", "conflict-5"],
  "reason": "Confirmed as low priority items"
}
```

## Data Models

### InsightConflict

```typescript
interface InsightConflict {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  conflictType: 'contradiction' | 'divergence' | 'ambiguity' | 'missing_data' | 'inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'analyzing' | 'resolved' | 'dismissed';
  detectedAt: string;
  sourceSystem: 'unified_graph' | 'unified_narrative' | 'reality_maps' |
                'competitive_intelligence' | 'content_intelligence' | 'media_monitoring';
  sourceIds: string[];
  affectedEntities: string[];
  confidenceScore: number;
  impactAssessment?: ImpactAssessment;
  clusterId?: string;
  resolutionId?: string;
  resolvedAt?: string;
  dismissedAt?: string;
  dismissalReason?: string;
  analysisStartedAt?: string;
  analysisCompletedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### ConflictResolution

```typescript
interface ConflictResolution {
  id: string;
  conflictId: string;
  resolutionType: 'ai_consensus' | 'source_priority' | 'weighted_truth' | 'hybrid' | 'manual';
  status: 'pending_review' | 'accepted' | 'rejected';
  summary: string;
  details?: Record<string, unknown>;
  resolvedValue?: unknown;
  confidenceScore: number;
  aiReasoning?: string;
  consensusNarrative?: string;
  manualOverride?: boolean;
  manualNotes?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  reviewFeedback?: string;
  createdAt: string;
  updatedAt: string;
}
```

### ConflictGraphData

```typescript
interface ConflictGraphData {
  nodes: ConflictGraphNode[];
  edges: ConflictGraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    conflictNodeCount: number;
    itemNodeCount: number;
    sourceNodeCount: number;
    resolutionNodeCount: number;
    generatedAt: string;
  };
}
```

## UI Components

### Dashboard Page

The Insight Conflicts dashboard (`/app/insight-conflicts`) provides:

- **Statistics Overview**: Total conflicts, breakdown by status/severity/type
- **Filter Bar**: Search, status/severity/type filters, detection trigger
- **Conflict List**: Sortable list with batch selection and operations
- **Detail View**: Full conflict details with tabs:
  - Overview: Basic info, items, sources
  - Analysis: Root cause, severity justification, suggestions
  - Resolution: Strategy selection, AI reasoning, review workflow
  - Graph: Visual conflict relationship diagram
  - Audit: Timeline of all events

### Component Library

| Component | Purpose |
|-----------|---------|
| `ConflictCard` | Individual conflict summary card |
| `ConflictList` | List with selection and pagination |
| `ConflictFilterBar` | Search and filter controls |
| `ConflictStatsCard` | Statistics dashboard widget |
| `ConflictDetail` | Detailed conflict view |
| `ConflictAnalysisPanel` | Analysis results display |
| `ConflictResolutionPanel` | Resolution workflow controls |
| `ConflictGraph` | SVG-based relationship visualization |
| `ConflictAuditLog` | Timeline audit event display |

## Audit Logging

All operations are logged for compliance:

### Event Types

| Event | Actor | Logged Data |
|-------|-------|-------------|
| `created` | system | Detection method, threshold |
| `updated` | user/system | Previous/new state |
| `analyzed` | ai | Analysis type, duration |
| `resolved` | ai | Resolution type, confidence |
| `dismissed` | user | Dismissal reason |
| `reviewed` | user | Accept/reject, feedback |
| `resolution_accepted` | user | Acceptance details |
| `resolution_rejected` | user | Rejection reason |
| `clustered` | system | Cluster assignment |
| `graph_edge_created` | system | Edge details |

### Actor Types

- **System**: Automated detection and processing
- **AI**: AI-driven analysis and resolution
- **User**: Human review and override

## Configuration

### Feature Flag

```typescript
// packages/feature-flags/src/flags.ts
ENABLE_INSIGHT_CONFLICTS: true
```

### Detection Thresholds

```typescript
const defaultThresholds = {
  similarityThreshold: 0.85,    // Semantic similarity for contradiction detection
  divergenceThreshold: 0.15,    // Variance threshold for divergence detection
  confidenceMinimum: 0.5,       // Minimum confidence to create conflict
  autoAnalyzeAbove: 'high',     // Auto-trigger analysis for high+ severity
  autoClusterThreshold: 0.7,    // Similarity for auto-clustering
};
```

## Performance Considerations

### Batching

- Detection runs should process up to 1000 entities per batch
- Batch operations limited to 50 conflicts per request
- Graph generation caches intermediate results

### Caching

- Conflict stats cached for 5 minutes
- Graph data cached per conflict (invalidate on update)
- Cluster assignments cached until new detection run

## Security

### Authorization

- All endpoints require authenticated org context
- Admin role required for batch dismiss operations
- Audit log is append-only (no deletions)

### Data Privacy

- Conflict items reference source IDs only (no data duplication)
- Resolution values may be sanitized for sensitive data
- Audit log IP addresses logged for compliance

## Future Enhancements

### Planned for V2

- Real-time conflict detection via webhooks
- Machine learning for pattern recognition
- Custom resolution strategy plugins
- Cross-org conflict correlation (enterprise)
- Natural language conflict queries
- Automated remediation workflows
