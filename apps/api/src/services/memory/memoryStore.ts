/**
 * Memory Store Service (Sprint S10)
 * Handles persistence of semantic memory, episodic traces, and memory links
 */

import type { AgentMemory, EpisodicTrace, MemoryLink, MemoryType, MemorySource } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryStoreOptions {
  debugMode?: boolean;
}

export interface PruneMemoryOptions {
  expiredOnly?: boolean;
  minImportance?: number;
  limit?: number;
}

/**
 * Memory Store Service
 * Responsible for persisting and managing memory entries
 */
export class MemoryStore {
  private supabase: SupabaseClient;
  private debugMode: boolean;

  constructor(supabase: SupabaseClient, options: MemoryStoreOptions = {}) {
    this.supabase = supabase;
    this.debugMode = options.debugMode || false;
  }

  /**
   * Save a semantic memory entry
   */
  async saveSemanticMemory(
    orgId: string,
    content: Record<string, unknown>,
    embedding: number[],
    importance: number,
    source: MemorySource,
    ttlSeconds?: number | null
  ): Promise<AgentMemory> {
    if (this.debugMode) {
      console.log('[MemoryStore] Saving semantic memory', { orgId, importance, source });
    }

    const { data, error } = await this.supabase
      .from('agent_memories')
      .insert({
        org_id: orgId,
        type: 'semantic',
        content,
        embedding: JSON.stringify(embedding),
        source,
        importance,
        ttl_seconds: ttlSeconds,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save semantic memory: ${error.message}`);
    }

    return this.mapMemoryFromDb(data);
  }

  /**
   * Save an episodic trace for a playbook step execution
   */
  async saveEpisodicTrace(
    orgId: string,
    runId: string,
    stepKey: string,
    content: Record<string, unknown>,
    embedding: number[]
  ): Promise<EpisodicTrace> {
    if (this.debugMode) {
      console.log('[MemoryStore] Saving episodic trace', { orgId, runId, stepKey });
    }

    const { data, error } = await this.supabase
      .from('agent_episode_runs')
      .insert({
        org_id: orgId,
        run_id: runId,
        step_key: stepKey,
        content,
        embedding: JSON.stringify(embedding),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save episodic trace: ${error.message}`);
    }

    return this.mapEpisodicTraceFromDb(data);
  }

  /**
   * Link a memory to an external entity
   */
  async linkMemoryToEntity(
    memoryId: string,
    entityType: string,
    entityId: string,
    weight: number = 1.0
  ): Promise<MemoryLink> {
    if (this.debugMode) {
      console.log('[MemoryStore] Linking memory to entity', { memoryId, entityType, entityId, weight });
    }

    const { data, error } = await this.supabase
      .from('agent_memory_links')
      .insert({
        memory_id: memoryId,
        entity_type: entityType,
        entity_id: entityId,
        weight,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link memory to entity: ${error.message}`);
    }

    return this.mapMemoryLinkFromDb(data);
  }

  /**
   * Update importance score for a memory
   */
  async updateImportance(memoryId: string, importance: number): Promise<void> {
    if (this.debugMode) {
      console.log('[MemoryStore] Updating memory importance', { memoryId, importance });
    }

    const { error } = await this.supabase
      .from('agent_memories')
      .update({ importance })
      .eq('id', memoryId);

    if (error) {
      throw new Error(`Failed to update memory importance: ${error.message}`);
    }
  }

  /**
   * Prune expired or low-importance memories
   */
  async pruneMemory(orgId: string, options: PruneMemoryOptions = {}): Promise<number> {
    if (this.debugMode) {
      console.log('[MemoryStore] Pruning memories', { orgId, options });
    }

    const { expiredOnly = true, minImportance = 0, limit = 100 } = options;

    let query = this.supabase.from('agent_memories').delete().eq('org_id', orgId);

    if (expiredOnly) {
      // Delete memories where TTL has expired
      const now = Math.floor(Date.now() / 1000);
      query = query.lt('created_at', new Date(now * 1000).toISOString()).not('ttl_seconds', 'is', null);
    } else if (minImportance > 0) {
      // Delete memories below importance threshold
      query = query.lt('importance', minImportance);
    }

    const { data, error } = await query.select('id').limit(limit);

    if (error) {
      throw new Error(`Failed to prune memories: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get all episodic traces for a specific run
   */
  async getEpisodicTracesForRun(orgId: string, runId: string): Promise<EpisodicTrace[]> {
    const { data, error } = await this.supabase
      .from('agent_episode_runs')
      .select('*')
      .eq('org_id', orgId)
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch episodic traces: ${error.message}`);
    }

    return (data || []).map((row) => this.mapEpisodicTraceFromDb(row));
  }

  /**
   * Get memory links for a specific memory
   */
  async getMemoryLinks(memoryId: string): Promise<MemoryLink[]> {
    const { data, error } = await this.supabase
      .from('agent_memory_links')
      .select('*')
      .eq('memory_id', memoryId);

    if (error) {
      throw new Error(`Failed to fetch memory links: ${error.message}`);
    }

    return (data || []).map((row) => this.mapMemoryLinkFromDb(row));
  }

  /**
   * Get memories linked to a specific entity
   */
  async getMemoriesByEntity(entityType: string, entityId: string): Promise<AgentMemory[]> {
    const { data, error } = await this.supabase
      .from('agent_memory_links')
      .select('memory_id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) {
      throw new Error(`Failed to fetch memories by entity: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const memoryIds = data.map((link) => link.memory_id);

    const { data: memories, error: memoriesError } = await this.supabase
      .from('agent_memories')
      .select('*')
      .in('id', memoryIds);

    if (memoriesError) {
      throw new Error(`Failed to fetch memories: ${memoriesError.message}`);
    }

    return (memories || []).map((row) => this.mapMemoryFromDb(row));
  }

  /**
   * Map database row to AgentMemory
   */
  private mapMemoryFromDb(row: any): AgentMemory {
    return {
      id: row.id,
      orgId: row.org_id,
      type: row.type as MemoryType,
      content: row.content,
      embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
      source: row.source as MemorySource,
      importance: row.importance,
      createdAt: row.created_at,
      ttlSeconds: row.ttl_seconds,
    };
  }

  /**
   * Map database row to EpisodicTrace
   */
  private mapEpisodicTraceFromDb(row: any): EpisodicTrace {
    return {
      id: row.id,
      runId: row.run_id,
      orgId: row.org_id,
      stepKey: row.step_key,
      content: row.content,
      embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
      createdAt: row.created_at,
    };
  }

  /**
   * Map database row to MemoryLink
   */
  private mapMemoryLinkFromDb(row: any): MemoryLink {
    return {
      id: row.id,
      memoryId: row.memory_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      weight: row.weight,
      createdAt: row.created_at,
    };
  }
}
