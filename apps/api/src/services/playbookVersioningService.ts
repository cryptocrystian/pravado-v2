/**
 * Playbook Versioning Service (Sprint S20)
 * Manages versioning history for playbook graphs and definitions
 */

import type {
  PlaybookGraph,
  PlaybookVersionRecord,
  GraphDiff,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Save a new version of a playbook
 */
export async function saveVersion(
  supabase: SupabaseClient,
  playbookId: string,
  graph: PlaybookGraph,
  playbookJson: Record<string, unknown>,
  userId: string,
  commitMessage?: string
): Promise<PlaybookVersionRecord> {
  // Get current version number
  const { data: playbook } = await supabase
    .from('playbooks')
    .select('current_version, org_id')
    .eq('id', playbookId)
    .single();

  if (!playbook) {
    throw new Error('Playbook not found');
  }

  const newVersion = (playbook.current_version || 0) + 1;

  // Insert new version
  const { data: version, error } = await supabase
    .from('playbook_versions')
    .insert({
      playbook_id: playbookId,
      org_id: playbook.org_id,
      version: newVersion,
      graph,
      playbook_json: playbookJson,
      commit_message: commitMessage || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save version: ${error.message}`);
  }

  // Update playbook current version
  await supabase
    .from('playbooks')
    .update({ current_version: newVersion })
    .eq('id', playbookId);

  return {
    id: version.id,
    playbookId: version.playbook_id,
    orgId: version.org_id,
    version: version.version,
    graph: version.graph as PlaybookGraph,
    playbookJson: version.playbook_json as Record<string, unknown>,
    commitMessage: version.commit_message,
    createdBy: version.created_by,
    createdAt: version.created_at,
  };
}

/**
 * Get all versions for a playbook
 */
export async function getVersions(
  supabase: SupabaseClient,
  playbookId: string
): Promise<PlaybookVersionRecord[]> {
  const { data: versions, error } = await supabase
    .from('playbook_versions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch versions: ${error.message}`);
  }

  return (versions || []).map((v) => ({
    id: v.id,
    playbookId: v.playbook_id,
    orgId: v.org_id,
    version: v.version,
    graph: v.graph as PlaybookGraph,
    playbookJson: v.playbook_json as Record<string, unknown>,
    commitMessage: v.commit_message,
    createdBy: v.created_by,
    createdAt: v.created_at,
  }));
}

/**
 * Get details of a specific version
 */
export async function getVersionDetails(
  supabase: SupabaseClient,
  versionId: string
): Promise<PlaybookVersionRecord | null> {
  const { data: version, error } = await supabase
    .from('playbook_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error || !version) {
    return null;
  }

  return {
    id: version.id,
    playbookId: version.playbook_id,
    orgId: version.org_id,
    version: version.version,
    graph: version.graph as PlaybookGraph,
    playbookJson: version.playbook_json as Record<string, unknown>,
    commitMessage: version.commit_message,
    createdBy: version.created_by,
    createdAt: version.created_at,
  };
}

/**
 * Compute diff between two graphs
 */
export function diffGraphs(
  oldGraph: PlaybookGraph,
  newGraph: PlaybookGraph
): GraphDiff {
  const diff: GraphDiff = {
    addedNodes: [],
    removedNodes: [],
    modifiedNodes: [],
    addedEdges: [],
    removedEdges: [],
    hasChanges: false,
  };

  // Build node maps
  const oldNodeMap = new Map(oldGraph.nodes.map((n) => [n.id, n]));
  const newNodeMap = new Map(newGraph.nodes.map((n) => [n.id, n]));

  // Find added and modified nodes
  for (const newNode of newGraph.nodes) {
    const oldNode = oldNodeMap.get(newNode.id);

    if (!oldNode) {
      // Node added
      diff.addedNodes.push({
        id: newNode.id,
        label: newNode.data.label,
        type: newNode.type,
      });
      diff.hasChanges = true;
    } else {
      // Check if node modified
      const changes: string[] = [];

      if (oldNode.data.label !== newNode.data.label) {
        changes.push(`Label: "${oldNode.data.label}" → "${newNode.data.label}"`);
      }

      if (oldNode.type !== newNode.type) {
        changes.push(`Type: ${oldNode.type} → ${newNode.type}`);
      }

      if (JSON.stringify(oldNode.data.config) !== JSON.stringify(newNode.data.config)) {
        changes.push('Configuration changed');
      }

      if (
        oldNode.position.x !== newNode.position.x ||
        oldNode.position.y !== newNode.position.y
      ) {
        changes.push('Position changed');
      }

      if (changes.length > 0) {
        diff.modifiedNodes.push({
          id: newNode.id,
          label: newNode.data.label,
          changes,
        });
        diff.hasChanges = true;
      }
    }
  }

  // Find removed nodes
  for (const oldNode of oldGraph.nodes) {
    if (!newNodeMap.has(oldNode.id)) {
      diff.removedNodes.push({
        id: oldNode.id,
        label: oldNode.data.label,
        type: oldNode.type,
      });
      diff.hasChanges = true;
    }
  }

  // Build edge maps
  const oldEdgeMap = new Map(
    oldGraph.edges.map((e) => [`${e.source}-${e.target}-${e.label || ''}`, e])
  );
  const newEdgeMap = new Map(
    newGraph.edges.map((e) => [`${e.source}-${e.target}-${e.label || ''}`, e])
  );

  // Find added edges
  for (const newEdge of newGraph.edges) {
    const key = `${newEdge.source}-${newEdge.target}-${newEdge.label || ''}`;
    if (!oldEdgeMap.has(key)) {
      diff.addedEdges.push({
        source: newEdge.source,
        target: newEdge.target,
        label: newEdge.label,
      });
      diff.hasChanges = true;
    }
  }

  // Find removed edges
  for (const oldEdge of oldGraph.edges) {
    const key = `${oldEdge.source}-${oldEdge.target}-${oldEdge.label || ''}`;
    if (!newEdgeMap.has(key)) {
      diff.removedEdges.push({
        source: oldEdge.source,
        target: oldEdge.target,
        label: oldEdge.label,
      });
      diff.hasChanges = true;
    }
  }

  return diff;
}

/**
 * Bump playbook version number (without saving graph)
 */
export async function bumpVersion(
  supabase: SupabaseClient,
  playbookId: string
): Promise<number> {
  const { data: playbook } = await supabase
    .from('playbooks')
    .select('current_version')
    .eq('id', playbookId)
    .single();

  if (!playbook) {
    throw new Error('Playbook not found');
  }

  const newVersion = (playbook.current_version || 0) + 1;

  await supabase
    .from('playbooks')
    .update({ current_version: newVersion })
    .eq('id', playbookId);

  return newVersion;
}

/**
 * Get latest saved version for a playbook
 */
export async function getLatestVersion(
  supabase: SupabaseClient,
  playbookId: string
): Promise<PlaybookVersionRecord | null> {
  const { data: version, error } = await supabase
    .from('playbook_versions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error || !version) {
    return null;
  }

  return {
    id: version.id,
    playbookId: version.playbook_id,
    orgId: version.org_id,
    version: version.version,
    graph: version.graph as PlaybookGraph,
    playbookJson: version.playbook_json as Record<string, unknown>,
    commitMessage: version.commit_message,
    createdBy: version.created_by,
    createdAt: version.created_at,
  };
}
