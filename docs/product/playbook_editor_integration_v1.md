# Playbook Editor ↔ Execution Viewer Integration V1 (Sprint S20)

## Overview

Sprint S20 establishes the **seamless flow** between the Visual Playbook Editor (S17) and the Execution Viewer (S19), enabling users to:

1. **Run playbooks directly** from the visual editor
2. **Validate graph structure** before execution
3. **Track version history** with automatic versioning
4. **View and compare** graph changes over time
5. **Restore previous versions** with one-click rollback

This integration bridges the gap between playbook design and execution, providing a unified workflow for building and testing AI playbooks.

## Architecture

### System Components

```
┌──────────────────────────────────────────────────────────────┐
│                   Visual Playbook Editor                      │
│  - Graph canvas (nodes + edges)                              │
│  - Toolbar with Run/Validate/Save                           │
│  - Version History drawer                                   │
└─────────────┬────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│                 S20 Integration Layer                         │
│  1. Graph Validation API                                     │
│  2. Execute-from-Graph API                                   │
│  3. Versioning & Diff API                                    │
└─────────────┬────────────────────────────────────────────────┘
              │
              ├──► Validation Service (cycles, orphans, etc.)
              ├──► Versioning Service (history, diff, restore)
              └──► Execution Engine V2 (queue & execute)
                   │
                   ▼
              ┌──────────────────────────────────────┐
              │     Execution Viewer (S19)           │
              │  - Live progress tracking            │
              │  - Step-by-step logs                 │
              │  - Memory & collaboration            │
              └──────────────────────────────────────┘
```

### Data Flow

```
User clicks "Run Playbook" in Editor
  │
  ├─► 1. POST /api/v1/playbooks/:id/validate-graph
  │      └─► Validate graph structure
  │          ├─ Check for cycles
  │          ├─ Check for orphaned nodes
  │          ├─ Check for duplicate keys
  │          └─ Check for entry points
  │
  ├─► 2. If valid:
  │      POST /api/v1/playbooks/:id/execute-from-graph
  │      └─► Convert graph → playbook steps
  │          └─► Save version (optional)
  │              └─► Update DB steps
  │                  └─► Queue execution (V2 Engine)
  │                      └─► Return runId
  │
  └─► 3. Navigate to:
         /app/playbooks/runs/:runId (Execution Viewer)
```

## Database Schema

### New Table: `playbook_versions`

```sql
CREATE TABLE playbook_versions (
  id UUID PRIMARY KEY,
  playbook_id UUID REFERENCES playbooks(id),
  org_id UUID REFERENCES orgs(id),
  version INTEGER NOT NULL,
  graph JSONB NOT NULL,              -- Full editor graph
  playbook_json JSONB NOT NULL,      -- Compiled playbook steps
  commit_message TEXT,               -- Optional user message
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(playbook_id, version)
);
```

### Updated Table: `playbooks`

```sql
ALTER TABLE playbooks
  ADD COLUMN current_version INTEGER DEFAULT 1;
```

## API Endpoints

### 1. POST /api/v1/playbooks/:id/validate-graph

**Purpose**: Validate graph structure before execution

**Request Body**:
```json
{
  "graph": {
    "nodes": [
      {
        "id": "step-1",
        "type": "AGENT",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "Research",
          "config": { "prompt": "..." }
        }
      }
    ],
    "edges": [
      {
        "id": "step-1-step-2",
        "source": "step-1",
        "target": "step-2"
      }
    ]
  },
  "validateOnly": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      "Graph contains cycles (circular dependencies)"
    ],
    "issues": [
      {
        "code": "CYCLIC_GRAPH",
        "message": "Graph contains cycles (circular dependencies)",
        "severity": "error"
      },
      {
        "code": "INCOMPLETE_BRANCH",
        "message": "Branch node 'decision' missing false path",
        "severity": "warning"
      }
    ]
  }
}
```

**Validation Rules**:
- ✅ Exactly one entry point (node with no incoming edges)
- ✅ No orphaned nodes (disconnected from main graph)
- ✅ No cycles (circular dependencies)
- ✅ All step keys unique
- ✅ All edges connect to valid nodes
- ⚠️ BRANCH nodes should have both true/false paths (warning)

### 2. POST /api/v1/playbooks/:id/execute-from-graph

**Purpose**: Execute playbook directly from editor graph

**Request Body**:
```json
{
  "graph": { /* same as validate */ },
  "input": { "topic": "AI trends" },
  "webhookUrl": "https://example.com/webhook",
  "saveVersion": true,
  "commitMessage": "Added sentiment analysis step"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "runId": "550e8400-e29b-41d4-a716-446655440000",
    "navigationUrl": "/app/playbooks/runs/550e8400-...",
    "message": "Playbook queued for execution"
  }
}
```

**Process**:
1. Validate graph structure
2. Convert graph → playbook steps
3. Optionally save as new version
4. Update `playbook_steps` table
5. Create `playbook_run` record
6. Queue for execution (V2 Engine)
7. Return `runId` for navigation

### 3. GET /api/v1/playbooks/:id/versions

**Purpose**: Fetch version history

**Response**:
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "ver-1",
        "playbookId": "pb-1",
        "version": 3,
        "commitMessage": "Added sentiment analysis",
        "createdBy": "user-id",
        "createdAt": "2025-11-17T10:00:00Z",
        "graph": { /* full graph */ }
      }
    ]
  }
}
```

### 4. GET /api/v1/playbooks/:id/versions/:versionId

**Purpose**: Get details of a specific version

**Response**: Same structure as single version above

### 5. POST /api/v1/playbooks/:id/diff

**Purpose**: Compare current graph with latest saved version

**Request Body**:
```json
{
  "currentGraph": { /* current editor graph */ }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "diff": {
      "hasChanges": true,
      "addedNodes": [
        { "id": "step-4", "label": "Summarize", "type": "AGENT" }
      ],
      "removedNodes": [],
      "modifiedNodes": [
        {
          "id": "step-1",
          "label": "Research",
          "changes": [
            "Label: 'Search' → 'Research'",
            "Configuration changed"
          ]
        }
      ],
      "addedEdges": [
        { "source": "step-3", "target": "step-4" }
      ],
      "removedEdges": []
    },
    "validation": {
      "valid": true,
      "errors": [],
      "issues": []
    },
    "latestVersion": {
      "id": "ver-2",
      "version": 2,
      "createdAt": "2025-11-17T09:00:00Z",
      "commitMessage": "Initial version"
    }
  }
}
```

## Frontend Components

### 1. ValidationIssuesModal

**Location**: `apps/dashboard/src/app/app/playbooks/editor/components/ValidationIssuesModal.tsx`

**Purpose**: Display graph validation errors and warnings

**Usage**:
```tsx
<ValidationIssuesModal
  isOpen={showValidationModal}
  onClose={() => setShowValidationModal(false)}
  issues={validationIssues}
  errors={validationErrors}
/>
```

**Features**:
- Categorizes issues by severity (error/warning)
- Color-coded display (red for errors, yellow for warnings)
- Shows error codes and detailed messages
- Dismissable modal overlay

### 2. VersionDiffViewer

**Location**: `apps/dashboard/src/app/app/playbooks/editor/components/VersionDiffViewer.tsx`

**Purpose**: Visual diff between two playbook graphs

**Usage**:
```tsx
<VersionDiffViewer
  diff={graphDiff}
  latestVersion={{
    version: 2,
    createdAt: "2025-11-17T09:00:00Z",
    commitMessage: "Initial version"
  }}
/>
```

**Features**:
- Shows added nodes (green)
- Shows removed nodes (red, strikethrough)
- Shows modified nodes (blue) with list of changes
- Shows added/removed edges
- Summary of total changes

### 3. VersionHistoryDrawer

**Location**: `apps/dashboard/src/app/app/playbooks/editor/components/VersionHistoryDrawer.tsx`

**Purpose**: Sidebar showing version history

**Usage**:
```tsx
<VersionHistoryDrawer
  isOpen={showHistory}
  onClose={() => setShowHistory(false)}
  versions={versionHistory}
  onRestoreVersion={handleRestoreVersion}
  currentDiff={currentDiff}
/>
```

**Features**:
- List view of all saved versions
- "Latest" badge on newest version
- Shows current unsaved changes (if any)
- Click version to see details
- One-click version restore
- Shows node/edge counts for each version

### 4. Updated Toolbar

**Location**: `apps/dashboard/src/app/app/playbooks/editor/components/Toolbar.tsx`

**New Props**:
```tsx
interface ToolbarProps {
  // Existing props...
  hasUnsavedChanges?: boolean;       // S20: Changes since last version
  isRunning?: boolean;                // S20: Execution in progress
  onRun?: () => void;                 // S20: Run playbook
  onShowVersionHistory?: () => void;  // S20: Show version history
}
```

**New UI Elements**:
1. **"Run Playbook" button** (green, with play icon)
   - Validates graph
   - Shows validation modal if errors
   - Executes and navigates to viewer if valid

2. **"History" button** (with clock icon)
   - Opens version history drawer
   - Shows count of saved versions

3. **"Changes since last version" indicator** (yellow dot)
   - Appears when current graph differs from latest saved version
   - Distinct from "Unsaved changes" (which means unsaved to DB)

## Usage Flow

### Running a Playbook from Editor

```
1. User designs playbook in visual editor
   └─► Add nodes, connect edges, configure steps

2. User clicks "Run Playbook" button
   └─► Editor calls validateGraph(playbookId, graph)

3a. If validation FAILS:
    └─► Show ValidationIssuesModal
        └─► User fixes issues
        └─► Try again

3b. If validation SUCCEEDS:
    └─► Call executeFromGraph(playbookId, graph, options)
        └─► Optional: Save version with commit message
        └─► Queue execution
        └─► Return runId

4. Navigate to /app/playbooks/runs/:runId
   └─► User watches live execution in Execution Viewer (S19)
```

### Viewing Version History

```
1. User clicks "History" button in Toolbar
   └─► Fetch version history

2. VersionHistoryDrawer opens
   └─► Shows list of all saved versions
   └─► Shows current unsaved changes (diff from latest)

3. User clicks a version
   └─► Shows version details:
       - Created date
       - Commit message
       - Node/edge stats
       - Full graph structure

4. User clicks "Restore This Version"
   └─► Loads that version's graph into editor
   └─► Marks editor as dirty (unsaved changes)
   └─► User can save or continue editing
```

### Checking for Unsaved Changes

```
1. Editor periodically calls diffGraphs(playbookId, currentGraph)
   └─► Compares current graph to latest saved version

2. If diff.hasChanges === true:
   └─► Show "Changes since last version" indicator
   └─► Toolbar badge turns yellow

3. User can:
   a. Save changes (creates new version)
   b. Run anyway (executes unsaved graph)
   c. View diff to see what changed
```

## Validation Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| `EMPTY_GRAPH` | error | Graph has no nodes |
| `NO_ENTRY_POINT` | error | No node without incoming edges |
| `MULTIPLE_ENTRY_POINTS` | error | More than one entry point found |
| `DUPLICATE_KEYS` | error | Duplicate node IDs detected |
| `ORPHANED_NODES` | error | Nodes not connected to graph |
| `CYCLIC_GRAPH` | error | Graph contains circular dependencies |
| `INVALID_EDGES` | error | Edges reference non-existent nodes |
| `INCOMPLETE_BRANCH` | warning | BRANCH node missing true/false path |

## Versioning Model

### Version Numbering

- Versions increment automatically: `1, 2, 3, ...`
- Each save creates a new version
- Versions are **immutable** (cannot edit past versions)
- Latest version number stored in `playbooks.current_version`

### What Gets Versioned

Each version captures:
1. **Full editor graph** (nodes + edges with positions)
2. **Compiled playbook JSON** (steps extracted from graph)
3. **Commit message** (optional user description)
4. **Created by** (user ID)
5. **Timestamp**

### Version Restoration

- Restoring loads the graph into editor
- Does NOT automatically save (user must explicitly save)
- Creates a **new version** when saved (not a rollback)

Example:
```
v1 → v2 → v3 (current)
         ↓
    Restore v2
         ↓
v1 → v2 → v3 → v4 (copy of v2)
```

## Graph Diff Algorithm

The diff algorithm compares two graphs node-by-node and edge-by-edge:

### Node Comparison

```javascript
For each node in newGraph:
  If not in oldGraph:
    → Added node
  Else:
    If label changed: → Modified (label change)
    If type changed: → Modified (type change)
    If config changed: → Modified (config change)
    If position changed: → Modified (position change)

For each node in oldGraph:
  If not in newGraph:
    → Removed node
```

### Edge Comparison

```javascript
For each edge in newGraph:
  If not in oldGraph (by source-target-label):
    → Added edge

For each edge in oldGraph:
  If not in newGraph:
    → Removed edge
```

### Change Detection

- **Position changes** are tracked but don't prevent execution
- **Configuration changes** trigger revalidation
- **Structural changes** (nodes/edges) always tracked

## Integration with Existing Features

### With S17 (Visual Playbook Editor)

- **No breaking changes** to existing editor
- **Additive only**: New buttons and features
- **Backward compatible**: Old playbooks continue to work

### With S18 (Execution Engine V2)

- Uses V2 engine's `queuePlaybook()` method
- Respects async execution model
- Leverages worker pool and job queue

### With S19 (Execution Viewer)

- Seamless navigation from editor → viewer
- Passes `runId` for tracking
- Real-time progress display

## Known Limitations (S20)

1. **No auto-merge**: Concurrent edits not handled
2. **No branching**: Linear version history only
3. **No version labels**: Only numeric versions
4. **No version comparison UI**: Can only compare with latest
5. **No bulk restore**: Must restore one version at a time
6. **No execution from past version**: Must restore first, then run

## Future Enhancements (S21+)

1. **Real-time collaboration**: Multiple users editing simultaneously
2. **Version branching**: Create alternate versions
3. **Version tags**: Named versions (e.g., "v1.0.0", "production")
4. **Side-by-side comparison**: Compare any two versions visually
5. **Bulk operations**: Restore/delete multiple versions
6. **Execute from version**: Run past version without restoring
7. **Auto-save**: Optional auto-versioning every N minutes
8. **Version notes**: Rich text descriptions with images

## Testing

### Backend Tests

**graphValidation.test.ts**:
- Empty graph rejection
- Entry point validation
- Duplicate key detection
- Orphaned node detection
- Cycle detection (simple and complex)
- Branch node validation
- Invalid edge detection
- Valid graph acceptance

**playbookVersioning.test.ts**:
- Diff detection (added/removed/modified nodes)
- Diff detection (added/removed edges)
- Label/type/config change detection
- Position change detection
- No-change scenarios
- Complex multi-change scenarios

### Manual Testing Checklist

- [ ] Run valid playbook from editor
- [ ] Attempt to run invalid playbook (see validation modal)
- [ ] Save version with commit message
- [ ] View version history
- [ ] Restore old version
- [ ] Check "unsaved changes" indicator
- [ ] View diff between versions
- [ ] Navigate to execution viewer after run
- [ ] Verify RLS permissions (org isolation)

## Troubleshooting

### Run Button Doesn't Execute

**Symptoms**: Clicking "Run Playbook" shows validation modal with errors

**Solution**: Fix validation errors shown in modal:
- Remove orphaned nodes
- Fix circular dependencies
- Ensure exactly one entry point
- Remove duplicate node IDs

### Version History Empty

**Symptoms**: History drawer shows "No saved versions"

**Cause**: No versions saved yet (only happens on first use)

**Solution**: Save playbook with "Save Version" option to create first version

### Diff Shows No Changes

**Symptoms**: Version diff says "No changes detected" but graph looks different

**Cause**: Only structural changes tracked, not visual styling

**Solution**: Verify actual node/edge changes (not just position/styling)

### Execution Doesn't Start

**Symptoms**: After "Run Playbook", execution viewer shows no progress

**Cause**: Execution engine V2 not running or queue stalled

**Solution**:
1. Check V2 engine status: `GET /api/v1/playbooks/queue/stats`
2. Verify worker pool has capacity
3. Check `playbook_runs` table for run status

## Performance Considerations

### Validation Performance

- **Small graphs** (<10 nodes): <10ms
- **Medium graphs** (10-50 nodes): 10-50ms
- **Large graphs** (50+ nodes): 50-200ms

Cycle detection is O(V+E) where V=nodes, E=edges.

### Diff Computation Performance

- **Small changes**: <5ms
- **Large changes** (100+ nodes): 20-50ms

Diff is O(N) where N = max(old nodes, new nodes).

### Version Storage

- Each version ~10-50KB (depending on graph size)
- 100 versions ≈ 1-5MB per playbook
- No automatic cleanup (manual deletion required)

## Related Documentation

- [Visual Playbook Editor V1 (S17)](./visual_playbook_editor.md)
- [Execution Engine V2 (S18)](./playbook_execution_engine_v2.md)
- [Playbook Execution Viewer V1 (S19)](./playbook_execution_viewer_v1.md)
- [API Playbooks Runtime](./ai_playbooks_runtime.md)

## Acceptance Criteria

Sprint S20 is COMPLETE when:

✅ Validation endpoint returns detailed error codes
✅ Execute-from-graph triggers V2 execution
✅ Versioning system persists graphs
✅ Diff algorithm detects all change types
✅ ValidationIssuesModal displays errors
✅ VersionHistoryDrawer shows version list
✅ VersionDiffViewer shows visual diff
✅ Toolbar has "Run" and "History" buttons
✅ "Unsaved changes" indicator functional
✅ All tests pass (validation + versioning)
✅ Documentation complete
✅ Zero new build failures

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Status**: Sprint S20 Complete ✅
