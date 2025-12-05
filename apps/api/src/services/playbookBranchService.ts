/**
 * Playbook Branch Service (Sprint S23)
 * Manages Git-like branches for playbooks
 */

import type { PlaybookBranch, PlaybookBranchWithCommit } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a new branch
 */
export async function createBranch(
  supabase: SupabaseClient,
  playbookId: string,
  name: string,
  userId: string,
  parentBranchId?: string
): Promise<PlaybookBranch> {
  // Get playbook org_id
  const { data: playbook } = await supabase
    .from('playbooks')
    .select('org_id')
    .eq('id', playbookId)
    .single();

  if (!playbook) {
    throw new Error('Playbook not found');
  }

  // Check if branch name already exists
  const { data: existing } = await supabase
    .from('playbook_branches')
    .select('id')
    .eq('playbook_id', playbookId)
    .eq('name', name)
    .single();

  if (existing) {
    throw new Error(`Branch "${name}" already exists`);
  }

  // Insert new branch
  const { data: branch, error } = await supabase
    .from('playbook_branches')
    .insert({
      playbook_id: playbookId,
      org_id: playbook.org_id,
      name,
      parent_branch_id: parentBranchId || null,
      is_protected: false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create branch: ${error.message}`);
  }

  return {
    id: branch.id,
    playbookId: branch.playbook_id,
    orgId: branch.org_id,
    name: branch.name,
    parentBranchId: branch.parent_branch_id,
    isProtected: branch.is_protected,
    createdBy: branch.created_by,
    createdAt: branch.created_at,
    updatedAt: branch.updated_at,
  };
}

/**
 * Get all branches for a playbook
 */
export async function listBranches(
  supabase: SupabaseClient,
  playbookId: string
): Promise<PlaybookBranchWithCommit[]> {
  const { data: branches, error } = await supabase
    .from('playbook_branches')
    .select(`
      id,
      playbook_id,
      org_id,
      name,
      parent_branch_id,
      is_protected,
      created_by,
      created_at,
      updated_at
    `)
    .eq('playbook_id', playbookId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to list branches: ${error.message}`);
  }

  if (!branches) {
    return [];
  }

  // Get latest commit for each branch
  const branchesWithCommits = await Promise.all(
    branches.map(async (branch) => {
      const { data: commits, error: commitError } = await supabase
        .from('playbook_commits')
        .select('*')
        .eq('branch_id', branch.id)
        .order('version', { ascending: false })
        .limit(1);

      if (commitError) {
        throw new Error(`Failed to get latest commit: ${commitError.message}`);
      }

      const latestCommit = commits && commits.length > 0 ? commits[0] : null;

      // Count total commits
      const { count } = await supabase
        .from('playbook_commits')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branch.id);

      return {
        id: branch.id,
        playbookId: branch.playbook_id,
        orgId: branch.org_id,
        name: branch.name,
        parentBranchId: branch.parent_branch_id,
        isProtected: branch.is_protected,
        createdBy: branch.created_by,
        createdAt: branch.created_at,
        updatedAt: branch.updated_at,
        latestCommit: latestCommit ? {
          id: latestCommit.id,
          playbookId: latestCommit.playbook_id,
          orgId: latestCommit.org_id,
          branchId: latestCommit.branch_id,
          version: latestCommit.version,
          graph: latestCommit.graph,
          playbookJson: latestCommit.playbook_json,
          message: latestCommit.message,
          parentCommitId: latestCommit.parent_commit_id,
          mergeParentCommitId: latestCommit.merge_parent_commit_id,
          createdBy: latestCommit.created_by,
          createdAt: latestCommit.created_at,
        } : null,
        commitCount: count || 0,
      };
    })
  );

  return branchesWithCommits;
}

/**
 * Get a specific branch by ID
 */
export async function getBranch(
  supabase: SupabaseClient,
  branchId: string
): Promise<PlaybookBranch | null> {
  const { data: branch, error } = await supabase
    .from('playbook_branches')
    .select('*')
    .eq('id', branchId)
    .single();

  if (error || !branch) {
    return null;
  }

  return {
    id: branch.id,
    playbookId: branch.playbook_id,
    orgId: branch.org_id,
    name: branch.name,
    parentBranchId: branch.parent_branch_id,
    isProtected: branch.is_protected,
    createdBy: branch.created_by,
    createdAt: branch.created_at,
    updatedAt: branch.updated_at,
  };
}

/**
 * Get branch by name
 */
export async function getBranchByName(
  supabase: SupabaseClient,
  playbookId: string,
  name: string
): Promise<PlaybookBranch | null> {
  const { data: branch, error } = await supabase
    .from('playbook_branches')
    .select('*')
    .eq('playbook_id', playbookId)
    .eq('name', name)
    .single();

  if (error || !branch) {
    return null;
  }

  return {
    id: branch.id,
    playbookId: branch.playbook_id,
    orgId: branch.org_id,
    name: branch.name,
    parentBranchId: branch.parent_branch_id,
    isProtected: branch.is_protected,
    createdBy: branch.created_by,
    createdAt: branch.created_at,
    updatedAt: branch.updated_at,
  };
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  supabase: SupabaseClient,
  branchId: string
): Promise<void> {
  // Check if branch is protected
  const branch = await getBranch(supabase, branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }

  if (branch.isProtected) {
    throw new Error('Cannot delete protected branch');
  }

  // Check if branch is currently active for any playbook
  const { data: playbooks } = await supabase
    .from('playbooks')
    .select('id')
    .eq('current_branch_id', branchId);

  if (playbooks && playbooks.length > 0) {
    throw new Error('Cannot delete active branch. Switch to another branch first.');
  }

  const { error } = await supabase
    .from('playbook_branches')
    .delete()
    .eq('id', branchId);

  if (error) {
    throw new Error(`Failed to delete branch: ${error.message}`);
  }
}

/**
 * Switch playbook to a different branch
 */
export async function switchBranch(
  supabase: SupabaseClient,
  playbookId: string,
  branchId: string
): Promise<void> {
  // Verify branch exists and belongs to playbook
  const branch = await getBranch(supabase, branchId);
  if (!branch) {
    throw new Error('Branch not found');
  }

  if (branch.playbookId !== playbookId) {
    throw new Error('Branch does not belong to this playbook');
  }

  // Update playbook's current branch
  const { error } = await supabase
    .from('playbooks')
    .update({ current_branch_id: branchId })
    .eq('id', playbookId);

  if (error) {
    throw new Error(`Failed to switch branch: ${error.message}`);
  }
}
