# Visual Playbook Editor V1 (Sprint S17)

## Overview

The Visual Playbook Editor V1 provides a canvas-based, drag-and-drop interface for creating and editing playbooks. Built with React Flow, it offers an intuitive visual representation of playbook execution flows while maintaining full compatibility with the existing playbook schema.

## Architecture

### Frontend Architecture

```
apps/dashboard/src/app/app/playbooks/editor/
├── page.tsx                    # Main editor page
├── types/
│   └── graph.ts               # Graph type definitions
├── hooks/
│   ├── usePlaybookGraph.ts    # Graph ↔ Playbook conversion
│   └── usePlaybookEditor.ts   # Editor state management
└── components/
    ├── Canvas.tsx             # React Flow canvas
    ├── NodeTypes.tsx          # Custom node components
    ├── Toolbar.tsx            # Top toolbar
    ├── Sidebar.tsx            # Left node palette
    └── Inspector.tsx          # Right configuration panel
```

### Backend Architecture

```
apps/api/src/
├── services/
│   └── playbookGraphService.ts    # Server-side graph conversion
└── routes/playbooks/
    └── index.ts                   # API endpoint: GET /:id/graph
```

### Data Flow

1. **Load**: PlaybookDefinitionDTO → PlaybookGraph → EditorGraph
2. **Edit**: User interactions update EditorGraph state
3. **Save**: EditorGraph → PlaybookStep[] → PUT /api/v1/playbooks/:id
4. **Validate**: EditorGraph → Validation results → Visual error indicators

## ReactFlow Usage

### Custom Node Types

The editor uses React Flow's custom node system to render four distinct node types:

```typescript
export const nodeTypes = {
  AGENT: AgentNode,     // 🤖 AI agent execution
  DATA: DataNode,       // ⚙️ Data transformation
  BRANCH: BranchNode,   // ◆ Conditional branching
  API: ApiNode,         // 🌐 External API calls
};
```

### Node Components

Each node component:
- Displays an icon and label
- Shows validation errors as red badges
- Provides connection handles (input/output)
- Highlights when selected

**Branch Nodes** have special dual outputs:
- Top handle: True path
- Bottom handle: False path

### Editor State Management

The `usePlaybookEditor` hook wraps React Flow's state management:

```typescript
const editor = usePlaybookEditor({
  initialGraph,
  onSave: handleSave,
  onValidate: handleValidate,
});

// Provides:
// - nodes, edges (React Flow state)
// - selectedNodeId, selectedEdgeId
// - isDirty, isSaving, isValidating
// - addNode, updateNode, deleteSelected
// - save, validate, reset
```

## Node Types

### 1. AGENT Node

**Purpose**: Execute an AI agent with a specific prompt

**Configuration**:
- `agentId` (string): Identifier for the agent (e.g., "content-strategist")
- `prompt` (string): The instruction/prompt for the agent
- `outputKey` (string): Context key where agent response is stored

**Example**:
```json
{
  "type": "AGENT",
  "config": {
    "agentId": "content-strategist",
    "prompt": "Create a content brief based on input requirements",
    "outputKey": "contentBrief"
  }
}
```

### 2. DATA Node

**Purpose**: Transform or manipulate data from context

**Configuration**:
- `operation` (enum): "pluck" | "map" | "merge" | "filter" | "transform"
- `sourceKey` (string): Context key to read from
- `outputKey` (string): Context key to write to

**Example**:
```json
{
  "type": "DATA",
  "config": {
    "operation": "pluck",
    "sourceKey": "contentBrief.topics",
    "outputKey": "topicList"
  }
}
```

### 3. BRANCH Node

**Purpose**: Conditional execution path

**Configuration**:
- `condition` (string): JavaScript expression to evaluate
- `trueStep` (string): Node ID for true path (set via edge)
- `falseStep` (string): Node ID for false path (set via edge)

**Example**:
```json
{
  "type": "BRANCH",
  "config": {
    "condition": "input.score > 75",
    "trueStep": "high-quality-path",
    "falseStep": "low-quality-path"
  }
}
```

**Visual Representation**: Two connection handles allow users to visually connect true/false paths.

### 4. API Node

**Purpose**: Call external REST APIs

**Configuration**:
- `method` (enum): "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
- `url` (string): API endpoint URL
- `outputKey` (string): Context key for response data

**Example**:
```json
{
  "type": "API",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/analyze",
    "outputKey": "apiResponse"
  }
}
```

## Mapping to Playbook Schema

### PlaybookDefinitionDTO → EditorGraph

The conversion from backend schema to visual graph:

```typescript
function playbookToGraph(playbook: PlaybookDefinitionDTO): EditorGraph {
  // 1. Convert each step to a node
  const nodes = steps.map((step, index) => ({
    id: step.key,
    type: step.type,
    position: {
      x: 100 + (index % 3) * 300,  // Grid layout
      y: 100 + Math.floor(index / 3) * 200,
    },
    data: {
      label: step.name,
      config: step.config,
    },
  }));

  // 2. Convert step relationships to edges
  const edges = [];

  // Regular nextStepKey edges
  if (step.nextStepKey) {
    edges.push({
      source: step.key,
      target: step.nextStepKey,
    });
  }

  // BRANCH special edges
  if (step.type === 'BRANCH') {
    edges.push({
      source: step.key,
      target: step.config.trueStep,
      label: 'true',
    });
    edges.push({
      source: step.key,
      target: step.config.falseStep,
      label: 'false',
    });
  }
}
```

### EditorGraph → PlaybookStep[]

The conversion from visual graph back to backend schema:

```typescript
function graphToSteps(graph: EditorGraph): PlaybookStep[] {
  return nodes.map((node, index) => {
    if (node.type === 'BRANCH') {
      // BRANCH: Extract true/false from edges
      const trueEdge = edges.find(e => e.source === node.id && e.label === 'true');
      const falseEdge = edges.find(e => e.source === node.id && e.label === 'false');

      return {
        key: node.id,
        name: node.data.label,
        type: 'BRANCH',
        config: {
          ...node.data.config,
          trueStep: trueEdge?.target || null,
          falseStep: falseEdge?.target || null,
        },
        position: index,
        nextStepKey: null,
      };
    }

    // Other nodes: Use first outgoing edge
    const nextEdge = edges.find(e => e.source === node.id);
    return {
      key: node.id,
      name: node.data.label,
      type: node.type,
      config: node.data.config,
      position: index,
      nextStepKey: nextEdge?.target || null,
    };
  });
}
```

### Round-Trip Consistency

The mapping is designed to be lossless:
- PlaybookDefinition → Graph → PlaybookDefinition should be identical
- Node positions are added for visual layout (not stored in backend)
- All config data is preserved during conversion

## Validation Rules

### Graph Structure Validation

The `validateGraph` function checks:

1. **Non-Empty Graph**
   - Error: "Graph must have at least one node"

2. **Single Entry Point**
   - Entry node: A node with no incoming edges
   - Error: "Graph must have an entry point"
   - Warning: "Graph should have only one entry point" (multiple entry nodes)

3. **No Orphaned Nodes**
   - Orphaned: Node with no incoming or outgoing edges (when graph has >1 node)
   - Error: "Found X orphaned nodes"

4. **Valid Edge References**
   - All edges must reference existing nodes
   - Invalid edges are filtered during normalization

### Node-Level Validation

Each node type has specific validation rules:

**AGENT Node**:
- Required: `agentId`, `outputKey`
- Optional: `prompt` (can be empty string)

**DATA Node**:
- Required: `operation`, `sourceKey`, `outputKey`
- Valid operations: pluck, map, merge, filter, transform

**BRANCH Node**:
- Required: `condition`
- Must have exactly 2 outgoing edges (true/false)

**API Node**:
- Required: `method`, `url`, `outputKey`
- Valid methods: GET, POST, PUT, DELETE, PATCH
- URL must be valid format

### Visual Error Indicators

Invalid nodes display:
- Red border highlighting
- Red badge with error count
- Error list in Inspector panel

## Saving Workflow

### Save Process

1. **User Clicks Save** → `editor.save()`

2. **Convert Graph to Steps**
   ```typescript
   const steps = convertToSteps(editor.getGraph());
   ```

3. **Call Backend API**
   ```typescript
   PUT /api/v1/playbooks/:id
   {
     name: playbook.playbook.name,
     description: playbook.playbook.description,
     steps: steps,
   }
   ```

4. **Update Local State**
   - Clear dirty flag
   - Update playbook state with server response
   - Show success notification

### Dirty State Tracking

The editor tracks unsaved changes:

```typescript
const isDirty = useRef(false);

useEffect(() => {
  const currentGraph = JSON.stringify({ nodes, edges });
  const initialGraph = JSON.stringify(initialGraphRef.current);
  isDirty.current = currentGraph !== initialGraph;
}, [nodes, edges]);
```

**Indicators**:
- Save button highlighted when dirty
- Browser warning on page leave (future enhancement)

### Auto-Save (Future)

V1 requires manual save. Future versions may include:
- Auto-save every 30 seconds when dirty
- Conflict resolution for concurrent edits
- Version history

## Execution Preview

### Preview Modal

The "Preview Execution" button shows a modal with:

```
Step 1: Generate Content Brief (AGENT)
Step 2: Extract Topics (DATA)
Step 3: Quality Check (BRANCH)
Step 4: Generate Content (AGENT)
...
```

**Current Implementation** (V1):
- Simple ordered list of nodes
- Shows node labels and types
- Does not show branching logic

**Future Enhancement** (S18+):
- Actual DAG execution plan from S7 runtime
- Show branching paths visually
- Estimated execution time
- Context variable flow visualization

### Backend Integration

V1 uses client-side preview. Future versions will call:

```typescript
POST /api/v1/playbooks/:id/plan
{
  graph: editorGraph,
  initialContext: {...}
}

Response:
{
  executionSteps: [...],
  estimatedDuration: 45,
  variables: {...}
}
```

## API Endpoints

### GET /api/v1/playbooks/:id/graph

**Purpose**: Get graph representation for visual editor

**Response**:
```json
{
  "success": true,
  "data": {
    "graph": {
      "nodes": [...],
      "edges": [...]
    },
    "validation": {
      "valid": true,
      "errors": []
    }
  }
}
```

**Used By**: Future enhancement for server-side graph caching

### PUT /api/v1/playbooks/:id

**Purpose**: Update playbook (existing endpoint)

**Modified Behavior**: Now accepts steps from graph conversion

**Request**:
```json
{
  "name": "My Playbook",
  "description": "...",
  "steps": [
    {
      "key": "step-1",
      "name": "First Step",
      "type": "AGENT",
      "config": {...},
      "position": 0,
      "nextStepKey": "step-2"
    },
    ...
  ]
}
```

## Future Enhancements

### S18: Enhanced Node Configuration
- Visual formula builder for DATA nodes
- LLM prompt templates for AGENT nodes
- API request/response preview for API nodes
- Branch condition syntax validation

### S19: Real-Time Validation
- Server-side validation on every change
- Live DAG cycle detection
- Context variable type checking
- LLM prompt feasibility validation

### S20: Collaboration Features
- Real-time cursor presence
- Multiplayer editing with conflict resolution
- Change history with rollback
- Comments and annotations on nodes

### S21: AI-Assisted Editing
- Natural language playbook generation
- "Add a step that..." voice commands
- Auto-layout optimization
- Smart edge routing

### S22: Advanced Features
- Subgraphs and playbook composition
- Loop nodes for iteration
- Parallel execution branches
- Breakpoints and debugging
- A/B testing configurations

## Technical Considerations

### Performance

**Current Limits**:
- Tested with up to 50 nodes
- React Flow handles 100+ nodes efficiently
- No virtualization needed for V1

**Future Optimizations**:
- Virtual rendering for 500+ node graphs
- Lazy loading of node configurations
- WebWorker for graph validation

### Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No IE11 support (React Flow requirement)

### Accessibility

**Current Support**:
- Keyboard navigation for toolbar
- Focus indicators on nodes
- ARIA labels on buttons

**Future Improvements**:
- Keyboard-only graph editing
- Screen reader support for graph structure
- High contrast mode

## Testing Strategy

### Frontend Tests

**Unit Tests**:
- `usePlaybookGraph.test.ts`: Conversion functions
- `validateGraph.test.ts`: Validation logic
- Component tests for node types

**Integration Tests**:
- Full editor workflow: load → edit → save
- Validation error display
- Execution preview modal

### Backend Tests

**Unit Tests**:
- `playbookGraphService.test.ts`: Round-trip conversion
- Validation rules
- Normalization logic

**API Tests**:
- GET /:id/graph endpoint
- Error handling for invalid playbooks

### Manual Testing Checklist

- [ ] Load existing playbook
- [ ] Add all node types
- [ ] Connect nodes with edges
- [ ] Configure each node type
- [ ] Validate graph with errors
- [ ] Save changes
- [ ] Preview execution
- [ ] Delete nodes and edges
- [ ] Reset to initial state

## Deployment

### Environment Variables

None required for V1. Future versions may need:
- `REACT_FLOW_LICENSE_KEY` (if upgrading to Pro)

### Build Process

```bash
# Install dependencies
pnpm install

# Type checking
pnpm typecheck

# Tests
pnpm test

# Build
pnpm build
```

### Migration

**No database changes required**. The visual editor uses existing playbook schema.

**Rollback**: If needed, users can still edit playbooks via API or future form-based editor.

## Conclusion

Visual Playbook Editor V1 provides a solid foundation for visual playbook creation with:
- Intuitive drag-and-drop interface
- Full compatibility with existing schema
- Real-time validation feedback
- Clean separation of concerns

Future sprints (S18–S22) will build on this foundation to create a world-class AI-assisted playbook editor.

---

## S23 — Branching & Version Control

### Overview

Sprint S23 adds Git-like version control to the visual editor:
- **Branches:** Create feature branches, switch between branches
- **Commits:** Save graph snapshots with commit messages
- **Merge:** Merge branches with automatic conflict detection
- **Version Graph:** Visualize commit DAG

See [playbook_version_control_v1.md](./playbook_version_control_v1.md) for full details.

### UI Components

**Branch Selector (Toolbar):**
- Dropdown showing all branches for current playbook
- Current branch highlighted
- Protected branches (e.g., "main") show lock icon
- "Create Branch" button opens modal for new branch creation

**Commit Button (Toolbar):**
- Purple "Commit" button (enabled only when graph has unsaved changes)
- Opens CommitModal for entering commit message
- Disabled on protected branches (must merge instead)

**Version Graph Button (Toolbar):**
- Opens VersionGraph component showing commit DAG
- Nodes represent commits (branch, message, version, timestamp)
- Edges show parent relationships
- Merge commits highlighted with dashed edges

**Merge Button (Toolbar):**
- Opens MergeModal for merging branches
- Shows source branch selector and conflict resolution UI
- If conflicts detected, user must resolve before merge

### Workflow Example

**Feature Branch Development:**
1. User on "main" clicks "Create Branch" → names it "feature-seo-step"
2. Editor switches to new branch (inherits main's latest commit)
3. User adds/modifies nodes → clicks "Commit" → enters message
4. Commit saved on feature branch
5. User clicks "Merge" → selects "main" → resolves conflicts if any
6. Merge commit created on main

### Collaboration Integration

When a user switches branches or commits:
- Editor broadcasts `graph.replace` event to collaborators (S22)
- Remote users see branch switch notification
- Prevents conflicts by forcing merge workflow on protected main branch

### Protected Main Branch

- "main" branch is created automatically for all playbooks
- Cannot commit directly to main (commit button disabled)
- Changes must go through feature branches → merge to main
- Enforces code review-like workflow

### Version Graph Visualization

**VersionGraph.tsx:**
- SVG-based DAG rendering
- Layout: Horizontal (chronological), Vertical (branch lanes)
- Interactive: Click commit to view diff
- Merge commits: Dashed edges, amber color

### Data Model

**Branches:**
- Stored in `playbook_branches` table
- Each playbook can have multiple branches
- Current branch tracked in `playbooks.current_branch_id`

**Commits:**
- Stored in `playbook_commits` table
- Each commit stores: graph snapshot, playbook JSON, message, version
- Commits form DAG via `parent_commit_id` and `merge_parent_commit_id`

**Merge:**
- 3-way merge algorithm: base (ancestor), ours (target), theirs (source)
- Automatic conflict detection for nodes/edges modified in both branches
- UI allows resolution: "Keep Ours" vs "Keep Theirs"

### Future Enhancements (S24+)

- Branch permissions (who can merge to main)
- Rebase operations
- Visual conflict resolution in editor canvas
- Branch templates
- Diff view in canvas (highlight changed nodes)
