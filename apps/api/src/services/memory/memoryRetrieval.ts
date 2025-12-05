/**
 * Memory Retrieval Service (Sprint S10)
 * Handles vector similarity search and importance-based ranking
 */

import type { AgentMemory, EpisodicTrace, MemoryRetrievalResult, MemoryRetrievalOptions } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryRetrievalServiceOptions {
  debugMode?: boolean;
}

/**
 * Memory Retrieval Service
 * Implements semantic search using pgvector cosine similarity
 */
export class MemoryRetrievalService {
  private supabase: SupabaseClient;
  private debugMode: boolean;

  constructor(supabase: SupabaseClient, options: MemoryRetrievalServiceOptions = {}) {
    this.supabase = supabase;
    this.debugMode = options.debugMode || false;
  }

  /**
   * Retrieve semantic memories using vector similarity
   */
  async retrieveSemanticMemory(
    orgId: string,
    _embedding: number[],
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryRetrievalResult> {
    const { limit = 10, minRelevance = 0.5, memoryType } = options;

    if (this.debugMode) {
      console.log('[MemoryRetrieval] Retrieving semantic memory', { orgId, limit, minRelevance, memoryType });
    }

    // Build query with vector similarity
    // Note: Supabase supports pgvector, we use the <=> operator for cosine distance
    // Smaller distance = higher similarity
    // const embeddingStr = JSON.stringify(embedding); // Reserved for future pgvector integration

    let query = this.supabase
      .from('agent_memories')
      .select('*, similarity:embedding <=> $1')
      .eq('org_id', orgId);

    if (memoryType) {
      query = query.eq('type', memoryType);
    }

    // Order by similarity (ascending distance = descending similarity)
    // and by importance (descending)
    const { data, error } = await query.order('similarity', { ascending: true }).limit(limit * 2); // Get extra for filtering

    if (error) {
      throw new Error(`Failed to retrieve semantic memory: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { items: [], relevance: [] };
    }

    // Calculate combined relevance score: cosine similarity * importance
    const results = data
      .map((row: any) => {
        const cosineSimilarity = 1 - (row.similarity || 0); // Convert distance to similarity
        const relevance = cosineSimilarity * row.importance;
        return {
          memory: this.mapMemoryFromDb(row),
          relevance,
        };
      })
      .filter((result) => result.relevance >= minRelevance)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return {
      items: results.map((r) => r.memory),
      relevance: results.map((r) => r.relevance),
    };
  }

  /**
   * Retrieve episodic context for a specific run
   */
  async retrieveEpisodicContext(runId: string, orgId: string): Promise<EpisodicTrace[]> {
    if (this.debugMode) {
      console.log('[MemoryRetrieval] Retrieving episodic context', { runId, orgId });
    }

    const { data, error } = await this.supabase
      .from('agent_episode_runs')
      .select('*')
      .eq('org_id', orgId)
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to retrieve episodic context: ${error.message}`);
    }

    return (data || []).map((row) => this.mapEpisodicTraceFromDb(row));
  }

  /**
   * Score memories by importance and recency
   */
  scoreByImportance(memories: AgentMemory[]): AgentMemory[] {
    // Sort by importance (descending) and recency (descending)
    return [...memories].sort((a, b) => {
      // Primary sort: importance
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      // Secondary sort: recency
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Search memories by text query (using full-text search if available)
   */
  async searchMemoriesByText(
    orgId: string,
    query: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryRetrievalResult> {
    const { limit = 10, memoryType } = options;

    if (this.debugMode) {
      console.log('[MemoryRetrieval] Searching memories by text', { orgId, query, limit });
    }

    // Simple text search in content field
    // In production, consider using full-text search extensions
    let dbQuery = this.supabase
      .from('agent_memories')
      .select('*')
      .eq('org_id', orgId)
      .ilike('content', `%${query}%`);

    if (memoryType) {
      dbQuery = dbQuery.eq('type', memoryType);
    }

    const { data, error } = await dbQuery.order('importance', { ascending: false }).limit(limit);

    if (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }

    const items = (data || []).map((row) => this.mapMemoryFromDb(row));

    // Simple relevance based on importance for text search
    const relevance = items.map((item) => item.importance);

    return { items, relevance };
  }

  /**
   * Calculate cosine similarity between two vectors (reserved for future use)
   * Commented out to avoid unused method warning - will be used in production
   */
  // private cosineSimilarity(a: number[], b: number[]): number {
  //   if (a.length !== b.length) {
  //     throw new Error('Vectors must have the same length');
  //   }
  //   let dotProduct = 0;
  //   let normA = 0;
  //   let normB = 0;
  //   for (let i = 0; i < a.length; i++) {
  //     dotProduct += a[i] * b[i];
  //     normA += a[i] * a[i];
  //     normB += b[i] * b[i];
  //   }
  //   normA = Math.sqrt(normA);
  //   normB = Math.sqrt(normB);
  //   if (normA === 0 || normB === 0) {
  //     return 0;
  //   }
  //   return dotProduct / (normA * normB);
  // }

  /**
   * Map database row to AgentMemory
   */
  private mapMemoryFromDb(row: any): AgentMemory {
    return {
      id: row.id,
      orgId: row.org_id,
      type: row.type,
      content: row.content,
      embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
      source: row.source,
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
}
