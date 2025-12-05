/**
 * Context Assembler Service (Sprint S10)
 * Assembles comprehensive context for agent step execution
 * Combines memory retrieval, episodic traces, shared state, and collaboration context
 */

import type {
  AssembledContext,
  Playbook,
  PlaybookStep,
  PlaybookRun,
  CollaborationContext,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { MemoryRetrievalService } from './memoryRetrieval';
import { MemoryStore } from './memoryStore';

export interface ContextAssemblerOptions {
  debugMode?: boolean;
  defaultTokenBudget?: number;
}

export interface AssembleContextInput {
  orgId: string;
  playbook: Playbook;
  steps: PlaybookStep[];
  run: PlaybookRun;
  step: PlaybookStep;
  sharedState: Record<string, unknown>;
  collaborationContext?: CollaborationContext;
  stepInput?: unknown;
}

/**
 * Context Assembler Service
 * Core component that builds the full context for agent execution
 */
export class ContextAssembler {
  private supabase: SupabaseClient;
  private memoryRetrieval: MemoryRetrievalService;
  private memoryStore: MemoryStore;
  private debugMode: boolean;
  private defaultTokenBudget: number;

  constructor(supabase: SupabaseClient, options: ContextAssemblerOptions = {}) {
    this.supabase = supabase;
    this.memoryRetrieval = new MemoryRetrievalService(supabase, { debugMode: options.debugMode });
    this.memoryStore = new MemoryStore(supabase, { debugMode: options.debugMode });
    this.debugMode = options.debugMode || false;
    this.defaultTokenBudget = options.defaultTokenBudget || 8000; // Default token budget
  }

  /**
   * Assemble comprehensive context for a step execution
   */
  async assembleContextForStep(input: AssembleContextInput): Promise<AssembledContext> {
    const { orgId, playbook, step, run, sharedState, collaborationContext, stepInput } = input;

    if (this.debugMode) {
      console.log('[ContextAssembler] Assembling context for step', {
        orgId,
        playbookId: playbook.id,
        stepKey: step.key,
        runId: run.id,
      });
    }

    // 1. Generate embedding for current step input
    const embedding = await this.generateEmbedding(stepInput);

    // 2. Retrieve relevant semantic memories
    const semanticMemories = await this.memoryRetrieval.retrieveSemanticMemory(orgId, embedding, {
      limit: 10,
      minRelevance: 0.5,
      memoryType: 'semantic',
    });

    // 3. Retrieve episodic traces from current run
    const episodicTraces = await this.memoryRetrieval.retrieveEpisodicContext(run.id, orgId);

    // 4. Fetch linked entities (if any memories have links)
    const linkedEntities = await this.fetchLinkedEntities(semanticMemories.items);

    // 5. Calculate token budget usage
    const tokenBudget = this.calculateTokenBudget(
      semanticMemories.items,
      episodicTraces,
      sharedState,
      collaborationContext
    );

    // 6. Assemble final context
    const assembledContext: AssembledContext = {
      memories: semanticMemories.items,
      episodicTraces,
      sharedState,
      collaborationContext,
      linkedEntities,
      tokenBudget,
    };

    if (this.debugMode) {
      console.log('[ContextAssembler] Context assembled', {
        memoriesCount: semanticMemories.items.length,
        episodicTracesCount: episodicTraces.length,
        linkedEntitiesCount: Object.keys(linkedEntities).length,
        tokenBudget,
      });
    }

    return assembledContext;
  }

  /**
   * Generate embedding for input (stub for now, in production use OpenAI/Anthropic)
   */
  private async generateEmbedding(_input: unknown): Promise<number[]> {
    // Stub: In production, call OpenAI embeddings API or similar
    // For now, return a random 1536-dimensional vector
    const embedding = new Array(1536).fill(0).map(() => Math.random());

    if (this.debugMode) {
      console.log('[ContextAssembler] Generated embedding (stub)', { length: embedding.length });
    }

    return embedding;
  }

  /**
   * Fetch linked entities for memories
   */
  private async fetchLinkedEntities(
    memories: any[]
  ): Promise<Record<string, unknown[]>> {
    const linkedEntities: Record<string, unknown[]> = {};

    for (const memory of memories) {
      const links = await this.memoryStore.getMemoryLinks(memory.id);

      for (const link of links) {
        if (!linkedEntities[link.entityType]) {
          linkedEntities[link.entityType] = [];
        }

        // Fetch entity data based on type
        const entity = await this.fetchEntityById(link.entityType, link.entityId);
        if (entity) {
          linkedEntities[link.entityType].push(entity);
        }
      }
    }

    return linkedEntities;
  }

  /**
   * Fetch entity by type and ID
   */
  private async fetchEntityById(entityType: string, entityId: string): Promise<unknown | null> {
    // Map entity types to table names
    const tableMap: Record<string, string> = {
      keyword: 'seo_keywords',
      journalist: 'journalists',
      content_item: 'seo_content',
      pr_list: 'pr_lists',
    };

    const tableName = tableMap[entityType];
    if (!tableName) {
      return null;
    }

    const { data, error } = await this.supabase.from(tableName).select('*').eq('id', entityId).single();

    if (error) {
      if (this.debugMode) {
        console.warn(`[ContextAssembler] Failed to fetch entity ${entityType}:${entityId}`, error);
      }
      return null;
    }

    return data;
  }

  /**
   * Calculate token budget usage
   */
  private calculateTokenBudget(
    memories: any[],
    episodicTraces: any[],
    sharedState: Record<string, unknown>,
    collaborationContext?: CollaborationContext
  ): { total: number; used: number; remaining: number } {
    // Rough estimation: 1 token ≈ 4 characters
    const charsPerToken = 4;

    // Calculate used tokens
    let usedChars = 0;

    // Memories
    usedChars += JSON.stringify(memories).length;

    // Episodic traces
    usedChars += JSON.stringify(episodicTraces).length;

    // Shared state
    usedChars += JSON.stringify(sharedState).length;

    // Collaboration context
    if (collaborationContext) {
      usedChars += JSON.stringify(collaborationContext).length;
    }

    const usedTokens = Math.ceil(usedChars / charsPerToken);
    const totalTokens = this.defaultTokenBudget;
    const remainingTokens = Math.max(0, totalTokens - usedTokens);

    return {
      total: totalTokens,
      used: usedTokens,
      remaining: remainingTokens,
    };
  }

  /**
   * Trim context to fit within token budget
   */
  trimContextToFit(context: AssembledContext, maxTokens: number): AssembledContext {
    // Simple trimming strategy: reduce memories first, then episodic traces
    const trimmedContext = { ...context };

    while (trimmedContext.tokenBudget.used > maxTokens && trimmedContext.memories.length > 0) {
      trimmedContext.memories.pop();
      trimmedContext.tokenBudget = this.calculateTokenBudget(
        trimmedContext.memories,
        trimmedContext.episodicTraces,
        trimmedContext.sharedState,
        trimmedContext.collaborationContext
      );
    }

    while (trimmedContext.tokenBudget.used > maxTokens && trimmedContext.episodicTraces.length > 0) {
      trimmedContext.episodicTraces.pop();
      trimmedContext.tokenBudget = this.calculateTokenBudget(
        trimmedContext.memories,
        trimmedContext.episodicTraces,
        trimmedContext.sharedState,
        trimmedContext.collaborationContext
      );
    }

    if (this.debugMode) {
      console.log('[ContextAssembler] Context trimmed', {
        originalTokens: context.tokenBudget.used,
        trimmedTokens: trimmedContext.tokenBudget.used,
        memoriesRemaining: trimmedContext.memories.length,
        episodicTracesRemaining: trimmedContext.episodicTraces.length,
      });
    }

    return trimmedContext;
  }
}
