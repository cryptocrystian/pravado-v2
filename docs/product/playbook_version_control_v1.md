# Playbook Version Control V1 (Sprint S23)

**Status:** ✅ Implemented
**Sprint:** S23
**Dependencies:** S20 (Versioning), S21 (SSE Streaming), S22 (Collaboration)

---

## Overview

Playbook Version Control adds Git-like branching, committing, and merging capabilities to the playbook editor. This enables:
- Safe experimentation with playbook changes on feature branches
- Version history with commit DAG visualization
- 3-way merge with automatic conflict detection
- Protected main branch with controlled merges
- Collaboration-aware version control (integrates with S22 editor streaming)

---

## Architecture

### Branch Model

**Schema:** `playbook_branches` table (Migration 32)

```sql
CREATE TABLE playbook_branches (
  id UUID PRIMARY KEY,
  playbook_id UUID NOT NULL,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_branch_id UUID,
  is_protected BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(playbook_id, name)
);
```

**Key Concepts:**
- Each playbook can have multiple branches
- Branches are named (e.g., "main", "feature-x")
- "main" branch is created automatically and marked protected
- Branches can have parent branches (for tracking lineage)
- Protected branches cannot be committed to directly (merge-only)

**Service:** `playbookBranchService.ts`
- `createBranch(playbookId, name, userId, parentBranchId?)`
- `listBranches(playbookId)`
- `getBranch(branchId)`
- `deleteBranch(branchId)`
- `switchBranch(playbookId, branchId)`

---

### Commit Model

**Schema:** `playbook_commits` table (Migration 32)

```sql
CREATE TABLE playbook_commits (
  id UUID PRIMARY KEY,
  playbook_id UUID NOT NULL,
  org_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  version INTEGER NOT NULL,
  graph JSONB NOT NULL,
  playbook_json JSONB NOT NULL,
  message TEXT NOT NULL,
  parent_commit_id UUID,
  merge_parent_commit_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ,
  UNIQUE(branch_id, version)
);
```

**Key Concepts:**
- Commits are immutable snapshots of playbook graphs
- Each commit stores: graph (nodes/edges), compiled playbook JSON, message
- Version numbers are per-branch (v1, v2, v3...)
- Commits form a DAG via `parent_commit_id` and `merge_parent_commit_id`
- Merge commits have two parents (one from each branch)

**Service:** `playbookCommitService.ts`
- `createCommit(branchId, graph, playbookJson, message, userId)`
- `getCommit(commitId)`
- `listCommits(branchId, limit, offset)`
- `getLatestCommit(branchId)`
- `getCommitDAG(playbookId)` — returns full DAG for visualization
- `getCommitDiff(commitId)` — diff between commit and its parent

---

### Diff Model

**Reuses S20 Graph Diff:**

```typescript
interface GraphDiff {
  addedNodes: Array<{ id: string; label: string; type: string }>;
  removedNodes: Array<{ id: string; label: string; type: string }>;
  modifiedNodes: Array<{ id: string; label: string; changes: string[] }>;
  addedEdges: Array<{ source: string; target: string; label?: string }>;
  removedEdges: Array<{ source: string; target: string; label?: string }>;
  hasChanges: boolean;
}
```

**Diff Computation:**
- Node-level: Added, removed, modified (checks label, type, config, position)
- Edge-level: Added, removed (by source-target pair)

---

### Merge Model

**3-Way Merge Algorithm:**

**Inputs:**
- **Base:** Common ancestor commit
- **Ours:** Target branch tip (e.g., main)
- **Theirs:** Source branch tip (e.g., feature-x)

**Process:**
1. Find common ancestor using `findCommonAncestor(commit1, commit2)`
2. Build node/edge maps for base, ours, theirs
3. For each node/edge:
   - **Case 1:** Added in both → Conflict if different
   - **Case 2:** Modified in both → Conflict if changes differ
   - **Case 3:** Deleted in one, modified in other → Conflict
   - **Case 4:** Added in one only → Auto-merge
   - **Case 5:** Modified in one only → Auto-merge
   - **Case 6:** Deleted in both → Auto-merge (removed)
4. If conflicts exist, return `MergeResult` with conflicts array
5. If no conflicts (or all resolved), create merge commit

**Conflict Resolution:**
```typescript
interface MergeConflict {
  nodeId?: string;
  edgeId?: string;
  type: 'modify' | 'delete' | 'add';
  ours?: Record<string, unknown>;
  theirs?: Record<string, unknown>;
}

interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  mergedGraph?: PlaybookGraph;
  mergeCommitId?: string;
}
```

**Service:** `playbookMergeService.ts`
- `mergeBranches(sourceBranchId, targetBranchId, userId, message?, resolutions?)`
- `findCommonAncestor(commitId1, commitId2)`
- `runThreeWayMerge(base, ours, theirs, resolutions?)`

---

## API Endpoints

### Branches

**GET** `/api/v1/playbooks/:id/branches`
- List all branches for a playbook
- Returns: `{ branches: PlaybookBranchWithCommit[] }`

**POST** `/api/v1/playbooks/:id/branches`
- Create a new branch
- Body: `{ name: string, parentBranchId?: string }`
- Returns: `{ branch: PlaybookBranchWithCommit }`

**GET** `/api/v1/playbooks/:id/branches/:branchId`
- Get branch details

**POST** `/api/v1/playbooks/:id/branches/:branchId/switch`
- Switch playbook to a different branch
- Updates `playbooks.current_branch_id`

**DELETE** `/api/v1/playbooks/:id/branches/:branchId`
- Delete a branch (fails if protected or currently active)

### Commits

**POST** `/api/v1/playbooks/:id/branches/:branchId/commits`
- Create a commit on a branch
- Body: `{ message: string, graph: PlaybookGraph, playbookJson: object }`
- Returns: `{ commit: PlaybookCommitWithBranch }`
- **Note:** Fails if branch is protected

**GET** `/api/v1/playbooks/:id/branches/:branchId/commits`
- List commits for a branch
- Query params: `limit`, `offset`
- Returns: `{ commits: PlaybookCommitWithBranch[] }`

**GET** `/api/v1/playbooks/:id/commits/:commitId/diff`
- Get diff between a commit and its parent
- Returns: `{ diff: GraphDiff }`

**GET** `/api/v1/playbooks/:id/commits/dag`
- Get commit DAG for visualization
- Returns: `{ dag: CommitDAGNode[] }`

### Merge

**POST** `/api/v1/playbooks/:id/merge`
- Merge two branches
- Body: `{ sourceBranchId: string, targetBranchId: string, message?: string, resolveConflicts?: Array<...> }`
- Returns:
  - **Success:** `{ success: true, mergeCommitId: string, mergedGraph: PlaybookGraph }`
  - **Conflicts:** `{ success: false, conflicts: MergeConflict[] }` (HTTP 409)

---

## UI Components

### BranchSelector (Toolbar)

**Location:** `apps/dashboard/src/app/app/playbooks/editor/components/BranchSelector.tsx`

**Features:**
- Dropdown showing all branches
- Current branch highlighted
- Lock icon for protected branches (e.g., main)
- "Create Branch" button
- Branch switching via API

**Usage:**
```tsx
<BranchSelector
  playbookId={playbookId}
  currentBranchId={currentBranchId}
  onBranchChange={(branchId) => switchBranch(branchId)}
  onCreateBranch={() => openCreateBranchModal()}
/>
```

### CommitModal

**Location:** `apps/dashboard/src/app/app/playbooks/editor/components/CommitModal.tsx`

**Features:**
- Commit message input (required, 1-500 chars)
- Shows current branch name
- "Commit" button (disabled if no changes or branch is protected)

**Workflow:**
1. User clicks "Commit" in toolbar
2. Modal opens with commit message input
3. User enters message, clicks "Commit"
4. API creates commit on current branch
5. Version history and DAG refresh

### VersionGraph

**Location:** `apps/dashboard/src/app/app/playbooks/editor/components/VersionGraph.tsx`

**Features:**
- SVG-based DAG visualization
- Commits as nodes (shows branch, message, version, timestamp)
- Edges show parent relationships
- Merge commits highlighted (dashed edges, amber color)
- Clickable nodes for commit details

**Layout Algorithm:**
- Horizontal: Chronological (left to right)
- Vertical: Branch lanes (separate lanes per branch)

### VersionHistoryDrawer

**Location:** `apps/dashboard/src/app/app/playbooks/editor/components/VersionHistoryDrawer.tsx`

**Features:**
- Drawer showing commit list
- Displays: message, branch, version, author, timestamp
- Click commit to view diff

### VersionDiffViewer

**Location:** `apps/dashboard/src/app/app/playbooks/editor/components/VersionDiffViewer.tsx`

**Features:**
- Side-by-side or unified diff view
- Color-coded changes:
  - Green: Added nodes/edges
  - Red: Removed nodes/edges
  - Yellow: Modified nodes/edges

### MergeModal

**Location:** `apps/dashboard/src/app/app/playbooks/editor/components/MergeModal.tsx`

**Features:**
- Source branch selector
- Target branch display (current branch)
- Merge message input (optional)
- Conflict resolution UI:
  - Lists all conflicts
  - "Keep Ours" vs "Keep Theirs" buttons per conflict
  - Merge button disabled until all conflicts resolved

**Workflow:**
1. User clicks "Merge" in toolbar
2. Modal opens with branch selector
3. User selects source branch, clicks "Merge"
4. If conflicts: API returns conflicts → user resolves → retry merge with resolutions
5. If no conflicts: merge commit created → graph updated

---

## Protected Branches

**"main" Branch Semantics:**

- Automatically created for all playbooks (Migration 32)
- `is_protected = true`
- Cannot commit directly to main
- Changes must go through feature branches → merge to main
- Deletion blocked

**Enforcement:**
- Backend: `playbookCommitService.createCommit()` checks `is_protected`
- Frontend: Commit button disabled when on protected branch

---

## Collaboration Integration (S22)

**SSE/Editor Streaming:**

When a user switches branches or commits:
1. Editor page calls `switchBranch()` or `createCommit()`
2. New graph loaded from branch's latest commit
3. Editor broadcasts `graph.replace` event to collaborators
4. Remote users see branch switch notification

**Avoiding Stomping:**
- Only one user should commit at a time per branch
- Protected main branch forces merge workflow (reduces direct conflicts)
- Collaboration events include `branchId` for context

**Future (S24+):**
- Branch-aware presence (show which branch each user is on)
- Merge conflict UI with live collaboration

---

## Example Workflows

### Workflow 1: Feature Branch Development

1. User on "main" branch clicks "Create Branch"
2. Names it "feature-add-seo-step"
3. Editor switches to new branch (empty, inherits main's latest commit as parent)
4. User adds SEO step nodes to graph
5. Clicks "Commit" → enters message "Add SEO research step"
6. Commit created on "feature-add-seo-step" branch
7. User continues iterating (more commits)
8. When ready, clicks "Merge" → selects "main" as target
9. If conflicts: Resolve in UI, retry
10. Merge commit created on main
11. Feature branch can be deleted

### Workflow 2: Viewing Version History

1. User clicks "History" in toolbar
2. Drawer opens showing commit list for current branch
3. User clicks a commit → diff viewer shows changes
4. User clicks "Graph" → DAG visualization opens
5. User clicks another commit in graph → diff updates

### Workflow 3: Resolving Merge Conflicts

1. User merges "feature-x" into "main"
2. API returns 409 Conflict with conflicts array
3. MergeModal shows conflicts:
   - "Node: seo-step (modify): Ours vs Theirs"
4. User clicks "Keep Ours" for node conflict
5. Clicks "Merge" again with resolutions
6. Merge succeeds → merge commit created

---

## Data Model Relationships

```
playbooks (S0)
  ├─ current_branch_id → playbook_branches.id (S23)
  └─ current_version → integer (S20, deprecated by S23 commits)

playbook_branches (S23)
  ├─ playbook_id → playbooks.id
  ├─ parent_branch_id → playbook_branches.id (self-reference)
  └─ commits: playbook_commits[]

playbook_commits (S23)
  ├─ playbook_id → playbooks.id
  ├─ branch_id → playbook_branches.id
  ├─ parent_commit_id → playbook_commits.id (DAG parent)
  ├─ merge_parent_commit_id → playbook_commits.id (DAG second parent, if merge)
  └─ version: integer (per-branch)

playbook_versions (S20, still used for pre-S23 history)
  └─ playbook_id → playbooks.id
```

---

## Performance Considerations

**Commit DAG Queries:**
- Index on `(playbook_id, created_at)` for chronological DAG fetch
- Index on `(branch_id, version DESC)` for latest commit lookup

**Merge Performance:**
- In-memory graph comparison (no DB joins)
- Handles up to ~1000 nodes/edges efficiently
- For larger graphs: Consider incremental diff or chunked merge

**Branch Switching:**
- Loads full graph from commit JSONB (fast)
- SSE broadcast to collaborators (< 100ms latency)

---

## Security & Permissions

**RLS Policies:**
- All branch/commit tables have `org_id` isolation
- Users can only access branches/commits for playbooks in their orgs
- Protected branch checks in service layer (not RLS)

**Future (S24+):**
- Role-based branch permissions (who can merge to main)
- Audit log for branch/commit actions

---

## Testing

**Backend:**
- Unit tests: `playbookGraphService.test.ts` (graph diff, merge logic)
- Integration tests: Branch CRUD, commit creation, merge scenarios

**Frontend:**
- Component tests: BranchSelector, CommitModal, MergeModal
- E2E tests: Full branch workflow (Playwright)

---

## Limitations

**Current (V1):**
- No branch permissions (all org members can create/merge branches)
- Merge conflicts are all-or-nothing (no partial merge)
- No rebase or cherry-pick operations
- No Git-like "stash" for uncommitted changes
- No branch comparison UI (diff between branch tips)

**Future Enhancements (S24+):**
- Branch permissions (who can merge to main)
- Rebase operations
- Conflict resolution in-editor (visual graph merge)
- Branch comparison view
- Playbook templates from branches

---

## Migration Path

**From S20 Versioning to S23 Branching:**

Migration 32 includes seed data logic:
1. For each existing playbook, creates "main" branch
2. Migrates all `playbook_versions` → `playbook_commits` on main branch
3. Sets `parent_commit_id` to link commits in order
4. Sets `playbooks.current_branch_id` to main

**Result:** All pre-S23 playbooks now have commit history on main branch

---

## Conclusion

Sprint S23 delivers a complete Git-like version control system for playbooks, enabling safe collaboration, experimentation, and merge workflows. The system integrates seamlessly with S22's live editor collaboration and provides a foundation for advanced workflows in future sprints.

**Key Achievements:**
- ✅ Branch model with protected main branch
- ✅ Commit DAG with parent tracking
- ✅ 3-way merge with automatic conflict detection
- ✅ Full UI for branching, committing, merging, and history
- ✅ Collaboration-aware version control

**Next Steps (S24+):**
- Branch permissions
- Rebase/cherry-pick
- Visual conflict resolution in editor
- Branch templates
