/**
 * Playbook API Client Helpers (Sprint S20 + S23)
 * Client-side API functions for playbook editor integration
 */

import type {
  PlaybookGraph,
  GraphValidationResult,
  PlaybookVersionRecord,
  GraphDiff,
  PlaybookBranchWithCommit,
  PlaybookCommitWithBranch,
  CommitDAGNode,
  MergeResult,
  MergeConflict,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Validate graph structure
 */
export async function validateGraph(
  playbookId: string,
  graph: PlaybookGraph
): Promise<GraphValidationResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/validate-graph`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ graph }),
    }
  );

  const result: ApiResponse<GraphValidationResult> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to validate graph');
  }

  return result.data;
}

/**
 * Execute playbook from graph
 */
export async function executeFromGraph(
  playbookId: string,
  graph: PlaybookGraph,
  options?: {
    input?: Record<string, unknown>;
    webhookUrl?: string;
    saveVersion?: boolean;
    commitMessage?: string;
  }
): Promise<{ runId: string; navigationUrl: string; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/execute-from-graph`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        graph,
        ...options,
      }),
    }
  );

  const result: ApiResponse<{
    runId: string;
    navigationUrl: string;
    message: string;
  }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to execute playbook');
  }

  return result.data;
}

/**
 * Fetch version history for a playbook
 */
export async function fetchVersionHistory(
  playbookId: string
): Promise<PlaybookVersionRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/versions`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<{ versions: PlaybookVersionRecord[] }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch version history');
  }

  return result.data.versions;
}

/**
 * Fetch details of a specific version
 */
export async function fetchVersionDetails(
  playbookId: string,
  versionId: string
): Promise<PlaybookVersionRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/versions/${versionId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<PlaybookVersionRecord> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch version details');
  }

  return result.data;
}

/**
 * Compute diff between current graph and latest saved version
 */
export async function diffGraphs(
  playbookId: string,
  currentGraph: PlaybookGraph
): Promise<{
  diff: GraphDiff;
  validation: GraphValidationResult;
  latestVersion?: {
    id: string;
    version: number;
    createdAt: string;
    commitMessage: string | null;
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/diff`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ currentGraph }),
    }
  );

  const result: ApiResponse<{
    diff: GraphDiff;
    validation: GraphValidationResult;
    latestVersion?: {
      id: string;
      version: number;
      createdAt: string;
      commitMessage: string | null;
    };
  }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to compute diff');
  }

  return result.data;
}

// ========================================
// SPRINT S23: BRANCHING & VERSION CONTROL
// ========================================

/**
 * List all branches for a playbook
 */
export async function listBranches(
  playbookId: string
): Promise<PlaybookBranchWithCommit[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/branches`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<{ branches: PlaybookBranchWithCommit[] }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list branches');
  }

  return result.data.branches;
}

/**
 * Create a new branch
 */
export async function createBranch(
  playbookId: string,
  name: string,
  parentBranchId?: string
): Promise<PlaybookBranchWithCommit> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/branches`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, parentBranchId }),
    }
  );

  const result: ApiResponse<{ branch: PlaybookBranchWithCommit }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create branch');
  }

  return result.data.branch;
}

/**
 * Switch to a different branch
 */
export async function switchBranch(
  playbookId: string,
  branchId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/branches/${branchId}/switch`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to switch branch');
  }
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  playbookId: string,
  branchId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/branches/${branchId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<unknown> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to delete branch');
  }
}

/**
 * Create a commit on a branch
 */
export async function createCommit(
  playbookId: string,
  branchId: string,
  message: string,
  graph: PlaybookGraph,
  playbookJson: Record<string, unknown>
): Promise<PlaybookCommitWithBranch> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/branches/${branchId}/commits`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message, graph, playbookJson }),
    }
  );

  const result: ApiResponse<{ commit: PlaybookCommitWithBranch }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create commit');
  }

  return result.data.commit;
}

/**
 * List commits for a branch
 */
export async function listCommits(
  playbookId: string,
  branchId: string,
  limit = 20,
  offset = 0
): Promise<PlaybookCommitWithBranch[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/branches/${branchId}/commits?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<{ commits: PlaybookCommitWithBranch[] }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list commits');
  }

  return result.data.commits;
}

/**
 * Get commit DAG for visualization
 */
export async function getCommitDAG(
  playbookId: string
): Promise<CommitDAGNode[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/commits/dag`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<{ dag: CommitDAGNode[] }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get commit DAG');
  }

  return result.data.dag;
}

/**
 * Get diff between a commit and its parent
 */
export async function getCommitDiff(
  playbookId: string,
  commitId: string
): Promise<GraphDiff> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/commits/${commitId}/diff`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  const result: ApiResponse<{ diff: GraphDiff }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get commit diff');
  }

  return result.data.diff;
}

/**
 * Merge two branches
 */
export async function mergeBranches(
  playbookId: string,
  sourceBranchId: string,
  targetBranchId: string,
  message?: string,
  resolveConflicts?: Array<{ nodeId?: string; edgeId?: string; resolution: 'ours' | 'theirs' }>
): Promise<MergeResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/playbooks/${playbookId}/merge`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        sourceBranchId,
        targetBranchId,
        message,
        resolveConflicts,
      }),
    }
  );

  const result: ApiResponse<MergeResult | { conflicts: MergeConflict[] }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to merge branches');
  }

  // Handle 409 Conflict response
  if (response.status === 409 && 'conflicts' in result.data) {
    return {
      success: false,
      conflicts: result.data.conflicts,
    };
  }

  return result.data as MergeResult;
}
