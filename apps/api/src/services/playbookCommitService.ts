/**
 * Playbook Commit Service (Sprint S23)
 * Manages version control commits for playbook branches
 */

import type {
  PlaybookCommit,
  PlaybookCommitWithBranch,
  PlaybookGraph,
  CommitDAGNode,
  GraphDiff,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a new commit on a branch
 */
export async function createCommit(
  supabase: SupabaseClient,
  branchId: string,
  graph: PlaybookGraph,
  playbookJson: Record<string, unknown>,
  message: string,
  userId: string
): Promise<PlaybookCommit> {
  // Get branch info
  const { data: branch, error: branchError } = await supabase
    .from('playbook_branches')
    .select('*')
    .eq('id', branchId)
    .single();

  if (branchError || !branch) {
    throw new Error('Branch not found');
  }

  // Check if branch is protected
  if (branch.is_protected) {
    throw new Error('Cannot commit directly to protected branch');
  }

  // Get latest commit version on this branch
  const { data: latestCommit } = await supabase
    .from('playbook_commits')
    .select('version, id')
    .eq('branch_id', branchId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = latestCommit ? latestCommit.version + 1 : 1;
  const parentCommitId = latestCommit ? latestCommit.id : null;

  // Insert new commit
  const { data: commit, error } = await supabase
    .from('playbook_commits')
    .insert({
      playbook_id: branch.playbook_id,
      org_id: branch.org_id,
      branch_id: branchId,
      version: newVersion,
      graph,
      playbook_json: playbookJson,
      message,
      parent_commit_id: parentCommitId,
      merge_parent_commit_id: null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create commit: ${error.message}`);
  }

  return {
    id: commit.id,
    playbookId: commit.playbook_id,
    orgId: commit.org_id,
    branchId: commit.branch_id,
    version: commit.version,
    graph: commit.graph,
    playbookJson: commit.playbook_json,
    message: commit.message,
    parentCommitId: commit.parent_commit_id,
    mergeParentCommitId: commit.merge_parent_commit_id,
    createdBy: commit.created_by,
    createdAt: commit.created_at,
  };
}

/**
 * Get a specific commit by ID
 */
export async function getCommit(
  supabase: SupabaseClient,
  commitId: string
): Promise<PlaybookCommit | null> {
  const { data: commit, error } = await supabase
    .from('playbook_commits')
    .select('*')
    .eq('id', commitId)
    .single();

  if (error || !commit) {
    return null;
  }

  return {
    id: commit.id,
    playbookId: commit.playbook_id,
    orgId: commit.org_id,
    branchId: commit.branch_id,
    version: commit.version,
    graph: commit.graph,
    playbookJson: commit.playbook_json,
    message: commit.message,
    parentCommitId: commit.parent_commit_id,
    mergeParentCommitId: commit.merge_parent_commit_id,
    createdBy: commit.created_by,
    createdAt: commit.created_at,
  };
}

/**
 * List commits for a branch
 */
export async function listCommits(
  supabase: SupabaseClient,
  branchId: string,
  limit = 20,
  offset = 0
): Promise<PlaybookCommitWithBranch[]> {
  const { data: commits, error } = await supabase
    .from('playbook_commits')
    .select(`
      *,
      playbook_branches (
        id,
        playbook_id,
        org_id,
        name,
        parent_branch_id,
        is_protected,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('branch_id', branchId)
    .order('version', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to list commits: ${error.message}`);
  }

  if (!commits) {
    return [];
  }

  return commits.map((commit) => ({
    id: commit.id,
    playbookId: commit.playbook_id,
    orgId: commit.org_id,
    branchId: commit.branch_id,
    version: commit.version,
    graph: commit.graph,
    playbookJson: commit.playbook_json,
    message: commit.message,
    parentCommitId: commit.parent_commit_id,
    mergeParentCommitId: commit.merge_parent_commit_id,
    createdBy: commit.created_by,
    createdAt: commit.created_at,
    branch: {
      id: commit.playbook_branches.id,
      playbookId: commit.playbook_branches.playbook_id,
      orgId: commit.playbook_branches.org_id,
      name: commit.playbook_branches.name,
      parentBranchId: commit.playbook_branches.parent_branch_id,
      isProtected: commit.playbook_branches.is_protected,
      createdBy: commit.playbook_branches.created_by,
      createdAt: commit.playbook_branches.created_at,
      updatedAt: commit.playbook_branches.updated_at,
    },
  }));
}

/**
 * Get latest commit on a branch
 */
export async function getLatestCommit(
  supabase: SupabaseClient,
  branchId: string
): Promise<PlaybookCommit | null> {
  const { data: commit, error } = await supabase
    .from('playbook_commits')
    .select('*')
    .eq('branch_id', branchId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error || !commit) {
    return null;
  }

  return {
    id: commit.id,
    playbookId: commit.playbook_id,
    orgId: commit.org_id,
    branchId: commit.branch_id,
    version: commit.version,
    graph: commit.graph,
    playbookJson: commit.playbook_json,
    message: commit.message,
    parentCommitId: commit.parent_commit_id,
    mergeParentCommitId: commit.merge_parent_commit_id,
    createdBy: commit.created_by,
    createdAt: commit.created_at,
  };
}

/**
 * Get commit DAG for visualization
 */
export async function getCommitDAG(
  supabase: SupabaseClient,
  playbookId: string
): Promise<CommitDAGNode[]> {
  // Get all commits for this playbook across all branches
  const { data: commits, error } = await supabase
    .from('playbook_commits')
    .select(`
      id,
      message,
      version,
      parent_commit_id,
      merge_parent_commit_id,
      created_by,
      created_at,
      branch_id,
      playbook_branches (
        name
      )
    `)
    .eq('playbook_id', playbookId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get commit DAG: ${error.message}`);
  }

  if (!commits) {
    return [];
  }

  return commits.map((commit) => {
    const parentIds: string[] = [];
    if (commit.parent_commit_id) {
      parentIds.push(commit.parent_commit_id);
    }
    if (commit.merge_parent_commit_id) {
      parentIds.push(commit.merge_parent_commit_id);
    }

    return {
      id: commit.id,
      message: commit.message,
      version: commit.version,
      branchName: (commit.playbook_branches as any)?.name || 'unknown',
      branchId: commit.branch_id,
      parentIds,
      createdBy: commit.created_by,
      createdAt: commit.created_at,
      isMerge: commit.merge_parent_commit_id !== null,
    };
  });
}

/**
 * Get diff between a commit and its parent
 */
export async function getCommitDiff(
  supabase: SupabaseClient,
  commitId: string
): Promise<GraphDiff> {
  const commit = await getCommit(supabase, commitId);
  if (!commit) {
    throw new Error('Commit not found');
  }

  if (!commit.parentCommitId) {
    // First commit - everything is added
    const nodes = commit.graph.nodes || [];
    const edges = commit.graph.edges || [];

    return {
      addedNodes: nodes.map((n: any) => ({
        id: n.id,
        label: n.data?.label as string || n.id,
        type: n.type || 'default',
      })),
      removedNodes: [],
      modifiedNodes: [],
      addedEdges: edges.map((e: any) => ({
        source: e.source,
        target: e.target,
        label: e.data?.label as string,
      })),
      removedEdges: [],
      hasChanges: nodes.length > 0 || edges.length > 0,
    };
  }

  const parentCommit = await getCommit(supabase, commit.parentCommitId);
  if (!parentCommit) {
    throw new Error('Parent commit not found');
  }

  // Compare graphs
  const currentNodes = commit.graph.nodes || [];
  const parentNodes = parentCommit.graph.nodes || [];
  const currentEdges = commit.graph.edges || [];
  const parentEdges = parentCommit.graph.edges || [];

  const parentNodeMap = new Map(parentNodes.map((n: any) => [n.id, n]));
  const currentNodeMap = new Map(currentNodes.map((n: any) => [n.id, n]));
  const parentEdgeMap = new Map(parentEdges.map((e: any) => [`${e.source}-${e.target}`, e]));
  const currentEdgeMap = new Map(currentEdges.map((e: any) => [`${e.source}-${e.target}`, e]));

  // Find added nodes
  const addedNodes = currentNodes
    .filter((n: any) => !parentNodeMap.has(n.id))
    .map((n: any) => ({
      id: n.id,
      label: n.data?.label as string || n.id,
      type: n.type || 'default',
    }));

  // Find removed nodes
  const removedNodes = parentNodes
    .filter((n: any) => !currentNodeMap.has(n.id))
    .map((n: any) => ({
      id: n.id,
      label: n.data?.label as string || n.id,
      type: n.type || 'default',
    }));

  // Find modified nodes
  const modifiedNodes = currentNodes
    .filter((n: any) => {
      const parent = parentNodeMap.get(n.id);
      if (!parent) return false;
      return JSON.stringify(n) !== JSON.stringify(parent);
    })
    .map((n: any) => ({
      id: n.id,
      label: n.data?.label as string || n.id,
      changes: ['Modified'], // TODO: detailed diff
    }));

  // Find added edges
  const addedEdges = currentEdges
    .filter((e: any) => !parentEdgeMap.has(`${e.source}-${e.target}`))
    .map((e: any) => ({
      source: e.source,
      target: e.target,
      label: e.data?.label as string,
    }));

  // Find removed edges
  const removedEdges = parentEdges
    .filter((e: any) => !currentEdgeMap.has(`${e.source}-${e.target}`))
    .map((e: any) => ({
      source: e.source,
      target: e.target,
      label: e.data?.label as string,
    }));

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    hasChanges:
      addedNodes.length > 0 ||
      removedNodes.length > 0 ||
      modifiedNodes.length > 0 ||
      addedEdges.length > 0 ||
      removedEdges.length > 0,
  };
}
