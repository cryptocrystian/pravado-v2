/**
 * Playbook Merge Service (Sprint S23)
 * Implements 3-way merge algorithm for playbook graphs
 */

import type {
  PlaybookGraph,
  PlaybookCommit,
  MergeConflict,
  MergeResult,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getCommit, getLatestCommit } from './playbookCommitService';

interface GraphNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, unknown>;
}

/**
 * Find common ancestor commit between two branches
 */
export async function findCommonAncestor(
  supabase: SupabaseClient,
  commitId1: string,
  commitId2: string
): Promise<string | null> {
  // Build ancestor chains for both commits
  const ancestors1 = await buildAncestorChain(supabase, commitId1);
  const ancestors2 = await buildAncestorChain(supabase, commitId2);

  // Find first common ancestor
  for (const ancestor1 of ancestors1) {
    if (ancestors2.includes(ancestor1)) {
      return ancestor1;
    }
  }

  return null;
}

/**
 * Build chain of ancestor commit IDs
 */
async function buildAncestorChain(
  supabase: SupabaseClient,
  commitId: string
): Promise<string[]> {
  const chain: string[] = [commitId];
  let currentId: string | null = commitId;

  while (currentId) {
    const commit = await getCommit(supabase, currentId);
    if (!commit || !commit.parentCommitId) {
      break;
    }

    chain.push(commit.parentCommitId);
    currentId = commit.parentCommitId;
  }

  return chain;
}

/**
 * Perform 3-way merge between two branches
 */
export async function mergeBranches(
  supabase: SupabaseClient,
  sourceBranchId: string,
  targetBranchId: string,
  userId: string,
  message?: string,
  conflictResolutions?: Array<{ nodeId?: string; edgeId?: string; resolution: 'ours' | 'theirs' }>
): Promise<MergeResult> {
  // Get latest commits from both branches
  const sourceCommit = await getLatestCommit(supabase, sourceBranchId);
  const targetCommit = await getLatestCommit(supabase, targetBranchId);

  if (!sourceCommit || !targetCommit) {
    throw new Error('Cannot merge: missing commits on source or target branch');
  }

  // Find common ancestor
  const ancestorId = await findCommonAncestor(supabase, sourceCommit.id, targetCommit.id);

  if (!ancestorId) {
    // No common ancestor - branches are unrelated
    // For now, reject this scenario
    throw new Error('Cannot merge unrelated branches');
  }

  const ancestorCommit = await getCommit(supabase, ancestorId);
  if (!ancestorCommit) {
    throw new Error('Common ancestor commit not found');
  }

  // Perform 3-way merge
  const mergeResult = runThreeWayMerge(
    ancestorCommit.graph,
    targetCommit.graph, // ours
    sourceCommit.graph, // theirs
    conflictResolutions
  );

  if (!mergeResult.success) {
    // Return conflicts for UI resolution
    return mergeResult;
  }

  // Create merge commit on target branch
  const mergeCommit = await createMergeCommit(
    supabase,
    targetBranchId,
    mergeResult.mergedGraph!,
    sourceCommit.playbookJson,
    message || `Merge ${sourceBranchId} into ${targetBranchId}`,
    userId,
    sourceCommit.id
  );

  return {
    success: true,
    conflicts: [],
    mergedGraph: mergeResult.mergedGraph,
    mergeCommitId: mergeCommit.id,
  };
}

/**
 * Create a merge commit (has two parents)
 */
async function createMergeCommit(
  supabase: SupabaseClient,
  targetBranchId: string,
  graph: PlaybookGraph,
  playbookJson: Record<string, unknown>,
  message: string,
  userId: string,
  mergeParentCommitId: string
): Promise<PlaybookCommit> {
  // Get branch info
  const { data: branch, error: branchError } = await supabase
    .from('playbook_branches')
    .select('*')
    .eq('id', targetBranchId)
    .single();

  if (branchError || !branch) {
    throw new Error('Branch not found');
  }

  // Get latest commit version on target branch
  const { data: latestCommit } = await supabase
    .from('playbook_commits')
    .select('version, id')
    .eq('branch_id', targetBranchId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = latestCommit ? latestCommit.version + 1 : 1;
  const parentCommitId = latestCommit ? latestCommit.id : null;

  // Insert merge commit
  const { data: commit, error } = await supabase
    .from('playbook_commits')
    .insert({
      playbook_id: branch.playbook_id,
      org_id: branch.org_id,
      branch_id: targetBranchId,
      version: newVersion,
      graph,
      playbook_json: playbookJson,
      message,
      parent_commit_id: parentCommitId,
      merge_parent_commit_id: mergeParentCommitId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create merge commit: ${error.message}`);
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
 * Run 3-way merge algorithm on graphs
 */
function runThreeWayMerge(
  base: PlaybookGraph,
  ours: PlaybookGraph,
  theirs: PlaybookGraph,
  resolutions?: Array<{ nodeId?: string; edgeId?: string; resolution: 'ours' | 'theirs' }>
): MergeResult {
  const conflicts: MergeConflict[] = [];

  // Create maps for efficient lookup
  const baseNodes = new Map((base.nodes || []).map((n) => [n.id, n]));
  const ourNodes = new Map((ours.nodes || []).map((n) => [n.id, n]));
  const theirNodes = new Map((theirs.nodes || []).map((n) => [n.id, n]));

  const baseEdges = new Map((base.edges || []).map((e) => [e.id, e]));
  const ourEdges = new Map((ours.edges || []).map((e) => [e.id, e]));
  const theirEdges = new Map((theirs.edges || []).map((e) => [e.id, e]));

  // Merged result
  const mergedNodes: GraphNode[] = [];
  const mergedEdges: GraphEdge[] = [];

  // Process nodes
  const allNodeIds = new Set([...baseNodes.keys(), ...ourNodes.keys(), ...theirNodes.keys()]);

  for (const nodeId of allNodeIds) {
    const baseNode = baseNodes.get(nodeId);
    const ourNode = ourNodes.get(nodeId);
    const theirNode = theirNodes.get(nodeId);

    // Case 1: Node added in both branches
    if (!baseNode && ourNode && theirNode) {
      if (JSON.stringify(ourNode) === JSON.stringify(theirNode)) {
        // Same addition - no conflict
        mergedNodes.push(ourNode);
      } else {
        // Different additions - conflict
        const resolution = resolutions?.find((r) => r.nodeId === nodeId);
        if (resolution) {
          mergedNodes.push(resolution.resolution === 'ours' ? ourNode : theirNode);
        } else {
          conflicts.push({
            nodeId,
            type: 'add',
            ours: ourNode as unknown as Record<string, unknown>,
            theirs: theirNode as unknown as Record<string, unknown>,
          });
        }
      }
    }
    // Case 2: Node modified in both branches
    else if (baseNode && ourNode && theirNode) {
      const ourModified = JSON.stringify(baseNode) !== JSON.stringify(ourNode);
      const theirModified = JSON.stringify(baseNode) !== JSON.stringify(theirNode);

      if (ourModified && theirModified) {
        // Both modified - check if changes are identical
        if (JSON.stringify(ourNode) === JSON.stringify(theirNode)) {
          // Identical changes - no conflict
          mergedNodes.push(ourNode);
        } else {
          // Different modifications - conflict
          const resolution = resolutions?.find((r) => r.nodeId === nodeId);
          if (resolution) {
            mergedNodes.push(resolution.resolution === 'ours' ? ourNode : theirNode);
          } else {
            conflicts.push({
              nodeId,
              type: 'modify',
              ours: ourNode as unknown as Record<string, unknown>,
              theirs: theirNode as unknown as Record<string, unknown>,
            });
          }
        }
      } else if (ourModified) {
        mergedNodes.push(ourNode);
      } else if (theirModified) {
        mergedNodes.push(theirNode);
      } else {
        mergedNodes.push(baseNode);
      }
    }
    // Case 3: Node deleted in one branch, modified in another
    else if (baseNode && ourNode && !theirNode) {
      // Deleted in theirs, exists in ours
      if (JSON.stringify(baseNode) !== JSON.stringify(ourNode)) {
        // Modified in ours - conflict
        const resolution = resolutions?.find((r) => r.nodeId === nodeId);
        if (resolution) {
          if (resolution.resolution === 'ours') {
            mergedNodes.push(ourNode);
          }
          // If 'theirs', don't add (deleted)
        } else {
          conflicts.push({
            nodeId,
            type: 'delete',
            ours: ourNode as unknown as Record<string, unknown>,
            theirs: undefined,
          });
        }
      }
      // Otherwise, accept deletion
    }
    // Case 4: Node deleted in ours, modified in theirs
    else if (baseNode && !ourNode && theirNode) {
      if (JSON.stringify(baseNode) !== JSON.stringify(theirNode)) {
        // Modified in theirs - conflict
        const resolution = resolutions?.find((r) => r.nodeId === nodeId);
        if (resolution) {
          if (resolution.resolution === 'theirs') {
            mergedNodes.push(theirNode);
          }
          // If 'ours', don't add (deleted)
        } else {
          conflicts.push({
            nodeId,
            type: 'delete',
            ours: undefined,
            theirs: theirNode as unknown as Record<string, unknown>,
          });
        }
      }
      // Otherwise, accept deletion
    }
    // Case 5: Node added in only one branch
    else if (!baseNode && ourNode) {
      mergedNodes.push(ourNode);
    } else if (!baseNode && theirNode) {
      mergedNodes.push(theirNode);
    }
    // Case 6: Node deleted in both branches
    // Don't add to merged
  }

  // Process edges (similar logic)
  const allEdgeIds = new Set([...baseEdges.keys(), ...ourEdges.keys(), ...theirEdges.keys()]);

  for (const edgeId of allEdgeIds) {
    const baseEdge = baseEdges.get(edgeId);
    const ourEdge = ourEdges.get(edgeId);
    const theirEdge = theirEdges.get(edgeId);

    // Similar cases as nodes
    if (!baseEdge && ourEdge && theirEdge) {
      if (JSON.stringify(ourEdge) === JSON.stringify(theirEdge)) {
        mergedEdges.push(ourEdge);
      } else {
        const resolution = resolutions?.find((r) => r.edgeId === edgeId);
        if (resolution) {
          mergedEdges.push(resolution.resolution === 'ours' ? ourEdge : theirEdge);
        } else {
          conflicts.push({
            edgeId,
            type: 'add',
            ours: ourEdge as unknown as Record<string, unknown>,
            theirs: theirEdge as unknown as Record<string, unknown>,
          });
        }
      }
    } else if (baseEdge && ourEdge && theirEdge) {
      const ourModified = JSON.stringify(baseEdge) !== JSON.stringify(ourEdge);
      const theirModified = JSON.stringify(baseEdge) !== JSON.stringify(theirEdge);

      if (ourModified && theirModified) {
        if (JSON.stringify(ourEdge) === JSON.stringify(theirEdge)) {
          mergedEdges.push(ourEdge);
        } else {
          const resolution = resolutions?.find((r) => r.edgeId === edgeId);
          if (resolution) {
            mergedEdges.push(resolution.resolution === 'ours' ? ourEdge : theirEdge);
          } else {
            conflicts.push({
              edgeId,
              type: 'modify',
              ours: ourEdge as unknown as Record<string, unknown>,
              theirs: theirEdge as unknown as Record<string, unknown>,
            });
          }
        }
      } else if (ourModified) {
        mergedEdges.push(ourEdge);
      } else if (theirModified) {
        mergedEdges.push(theirEdge);
      } else {
        mergedEdges.push(baseEdge);
      }
    } else if (baseEdge && ourEdge && !theirEdge) {
      if (JSON.stringify(baseEdge) !== JSON.stringify(ourEdge)) {
        const resolution = resolutions?.find((r) => r.edgeId === edgeId);
        if (resolution) {
          if (resolution.resolution === 'ours') {
            mergedEdges.push(ourEdge);
          }
        } else {
          conflicts.push({
            edgeId,
            type: 'delete',
            ours: ourEdge as unknown as Record<string, unknown>,
            theirs: undefined,
          });
        }
      }
    } else if (baseEdge && !ourEdge && theirEdge) {
      if (JSON.stringify(baseEdge) !== JSON.stringify(theirEdge)) {
        const resolution = resolutions?.find((r) => r.edgeId === edgeId);
        if (resolution) {
          if (resolution.resolution === 'theirs') {
            mergedEdges.push(theirEdge);
          }
        } else {
          conflicts.push({
            edgeId,
            type: 'delete',
            ours: undefined,
            theirs: theirEdge as unknown as Record<string, unknown>,
          });
        }
      }
    } else if (!baseEdge && ourEdge) {
      mergedEdges.push(ourEdge);
    } else if (!baseEdge && theirEdge) {
      mergedEdges.push(theirEdge);
    }
  }

  if (conflicts.length > 0) {
    return {
      success: false,
      conflicts,
    };
  }

  return {
    success: true,
    conflicts: [],
    mergedGraph: {
      nodes: mergedNodes as any,
      edges: mergedEdges as any,
    },
  };
}
