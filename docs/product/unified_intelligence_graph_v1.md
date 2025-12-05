# Unified Intelligence Graph V1 - Product Specification

**Sprint:** S66
**Feature:** Global Insight Fabric & Unified Intelligence Graph
**Status:** Implemented
**Last Updated:** December 2024

## Overview

The Unified Intelligence Graph is a cross-system knowledge graph layer that integrates intelligence from all Pravado systems (S38-S65). It provides a semantic layer for discovering relationships, patterns, and insights across content, journalists, campaigns, and performance data.

## Problem Statement

Pravado's various modules (content quality, journalist discovery, outreach, media monitoring, etc.) operate as independent systems with their own data stores. This creates silos that prevent:

- Understanding how entities relate across systems
- Discovering emergent patterns spanning multiple domains
- Generating holistic insights for strategic decision-making
- Tracing the provenance and relationships of intelligence

## Solution

A unified knowledge graph that:

1. **Aggregates entities** from all systems as typed nodes
2. **Captures relationships** between entities as weighted edges
3. **Enables graph traversal** for multi-hop relationship discovery
4. **Supports semantic search** using vector embeddings
5. **Provides analytics** including centrality, clustering, and PageRank
6. **Maintains audit trails** for governance and explainability

## Core Concepts

### Node Types

The graph supports 40+ node types covering all integrated systems:

| Category | Node Types |
|----------|-----------|
| Content | `content_piece`, `content_brief`, `content_topic`, `narrative`, `keyword` |
| People | `journalist`, `author`, `spokesperson`, `audience_persona` |
| Organizations | `media_outlet`, `competitor`, `agency` |
| Campaigns | `campaign`, `playbook`, `outreach_sequence`, `pitch` |
| Performance | `media_mention`, `coverage`, `alert`, `sentiment` |
| Analytics | `metric`, `trend`, `insight`, `benchmark` |
| System | `playbook_run`, `user`, `team` |

### Edge Types

37 relationship types capture connections:

| Category | Edge Types |
|----------|-----------|
| Authorship | `authored_by`, `attributed_to`, `quoted_in` |
| Coverage | `covers_topic`, `mentioned_in`, `related_to` |
| Hierarchy | `part_of`, `belongs_to`, `derived_from` |
| Influence | `influences`, `competes_with`, `precedes` |
| Performance | `measured_by`, `resulted_in`, `targets` |
| Workflow | `created_by`, `approved_by`, `triggered` |

### Graph Metrics

The system computes:

- **Degree Centrality**: Node connectivity measure
- **PageRank Score**: Importance based on incoming links
- **Cluster ID**: Community detection grouping
- **Graph Density**: Overall connectivity ratio
- **Average Degree**: Mean connections per node

## Architecture

### Database Schema

Six PostgreSQL tables with RLS policies:

```
intelligence_nodes          - Core node entities
intelligence_edges          - Relationships between nodes
intelligence_node_embeddings - Vector embeddings for nodes
intelligence_edge_embeddings - Vector embeddings for edges
intelligence_graph_snapshots - Point-in-time captures
intelligence_graph_audit_log - Operation audit trail
```

### API Endpoints

All endpoints under `/api/v1/unified-graph`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /nodes | Create node |
| GET | /nodes/:id | Get node |
| PATCH | /nodes/:id | Update node |
| DELETE | /nodes/:id | Delete node |
| GET | /nodes/:id/connections | Get node with edges/neighbors |
| GET | /nodes | List nodes with filters |
| POST | /edges | Create edge |
| GET | /edges/:id | Get edge |
| PATCH | /edges/:id | Update edge |
| DELETE | /edges/:id | Delete edge |
| GET | /edges/:id/with-nodes | Get edge with source/target |
| GET | /edges | List edges with filters |
| POST | /merge | Merge duplicate nodes |
| POST | /query | Execute graph query |
| POST | /traverse | BFS graph traversal |
| POST | /path | Find shortest path |
| POST | /explain-path | LLM-powered path explanation |
| POST | /search | Semantic vector search |
| GET | /metrics | Get current metrics |
| POST | /metrics/compute | Compute centrality/clusters |
| POST | /embeddings/generate | Generate vector embeddings |
| POST | /snapshots | Create snapshot |
| GET | /snapshots/:id | Get snapshot |
| GET | /snapshots | List snapshots |
| POST | /snapshots/:id/regenerate | Regenerate snapshot |
| GET | /audit | List audit logs |
| GET | /stats | Get graph statistics |

## Key Features

### 1. Graph Traversal

BFS-based traversal supporting:

- **Direction**: outgoing, incoming, or both
- **Max Depth**: configurable hop limit (default 3)
- **Type Filters**: restrict by node/edge types
- **Path Collection**: returns all discovered paths

```typescript
const result = await traverseGraph(ctx, {
  startNodeId: 'node-123',
  direction: 'outgoing',
  maxDepth: 3,
  nodeTypes: ['journalist', 'media_outlet'],
  limit: 100,
});
```

### 2. Path Finding & Explanation

Shortest path discovery with LLM-powered explanations:

```typescript
const explanation = await explainPath(ctx, {
  startNodeId: 'content-abc',
  endNodeId: 'journalist-xyz',
  maxDepth: 6,
  includeReasoning: true,
});
// Returns: path, explanation, reasoning steps, confidence score
```

### 3. Semantic Search

Vector similarity search using OpenAI embeddings:

```typescript
const results = await semanticSearch(ctx, {
  query: 'technology coverage in enterprise software',
  nodeTypes: ['content_piece', 'journalist'],
  threshold: 0.7,
  limit: 20,
});
```

### 4. Node Merging

Deduplicate entities while preserving relationships:

```typescript
const result = await mergeNodes(ctx, {
  sourceNodeIds: ['journalist-1', 'journalist-2'],
  mergeStrategy: 'create_new', // or 'absorb'
  newLabel: 'John Doe (Merged)',
  preserveEdges: true,
});
```

### 5. Graph Snapshots

Point-in-time captures for auditing and comparison:

- Full graph export
- Diff computation against previous snapshot
- Node/edge counts and metrics
- Cluster information

### 6. Audit Logging

Complete operation audit trail:

- Node/edge CRUD operations
- Query executions with timing
- Merge operations
- Metric computations
- Snapshot generations

## UI Components

### Dashboard Layout

Three-panel layout:

1. **Left Panel**: Node/edge lists with filters and pagination
2. **Center Panel**: Interactive graph visualization
3. **Right Panel**: Metrics display and snapshot management

### Components

| Component | Purpose |
|-----------|---------|
| `GraphNodeCard` | Compact/full node display |
| `GraphEdgeCard` | Edge display with endpoints |
| `GraphVisualizationPanel` | Canvas-based force-directed layout |
| `GraphMetricsPanel` | Analytics and distributions |
| `NodeInspectorDrawer` | Detailed node view/edit |
| `EdgeInspectorDrawer` | Detailed edge view/edit |
| `SnapshotPanel` | Snapshot list and creation |
| `GraphQueryBuilder` | Filter/traverse/semantic query UI |

## Integration Points

### Upstream Systems (Data Sources)

The graph ingests from:

- S38 Content Quality: content pieces, quality scores
- S39 Content Rewrites: rewrite chains
- S43 Press Releases: releases, distribution
- S44 Pitches: pitch sequences, templates
- S45 Deliverability: email tracking
- S46 Journalist Graph: profiles, activities
- S47 Media Lists: lists, targets
- S48 Discovery: search results
- S49 Enrichment: enriched profiles
- S50 Performance: metrics, analytics
- S52 Personas: audience segments
- S53 Playbooks: runs, steps
- S63 Executive Reports: strategic insights
- S64 Investor Relations: stakeholder content
- S65 Strategic Intelligence: narratives

### Downstream Systems (Consumers)

The graph provides intelligence to:

- Strategic dashboards
- AI agents for context assembly
- Search and discovery interfaces
- Reporting and analytics

## Performance Considerations

### Indexing

Optimized with B-tree and GIN indexes:

- Node type lookups
- Edge type queries
- Org isolation (RLS)
- Full-text search on labels
- Tag/category overlap queries

### Pagination

All list operations use cursor-based pagination with configurable limits.

### Caching

Metrics cached at computation time; snapshots serve as long-term caches.

## Security

### Row-Level Security

All tables enforce org_id isolation via RLS policies.

### Feature Flag

Protected by `ENABLE_UNIFIED_INTELLIGENCE_GRAPH` flag.

### Audit Trail

All operations logged with actor, timestamp, and changes.

## Future Enhancements

### V2 Considerations

- Real-time streaming updates
- Graph neural network embeddings
- Multi-tenant graph sharding
- GraphQL API layer
- Temporal graph queries
- Advanced community detection

## Testing

### Unit Tests

Comprehensive service tests covering:

- Node/edge CRUD
- Merge operations
- Graph traversal
- Path finding
- Metrics computation
- Snapshot management
- Audit logging

### E2E Tests

Full API integration tests for all endpoints.

## Dependencies

### External

- OpenAI API (embeddings, explanations)
- Supabase (PostgreSQL + pgvector)

### Internal Packages

- `@pravado/types`: Type definitions
- `@pravado/validators`: Zod schemas
- `@pravado/feature-flags`: Feature gating

## Configuration

### Environment Variables

```
OPENAI_API_KEY          - Required for embeddings/explanations
```

### Feature Flag

```typescript
ENABLE_UNIFIED_INTELLIGENCE_GRAPH: true
```

## Changelog

### V1.0.0 (S66)

- Initial release
- 40+ node types, 37 edge types
- Graph traversal and path finding
- LLM-powered path explanation
- Semantic search with embeddings
- Metrics computation
- Snapshot management
- Full audit logging
- Dashboard UI with visualization
