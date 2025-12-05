/**
 * Playbook Service (Sprint S7)
 * CRUD operations and validation for AI playbooks
 */

import type {
  Playbook,
  PlaybookStep,
  PlaybookDefinitionDTO,
  PlaybookStatus,
} from '@pravado/types';
import { validatePlaybookStructure, type PlaybookStepInput } from '@pravado/validators';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CreatePlaybookData {
  name: string;
  version?: number;
  status?: PlaybookStatus;
  inputSchema?: unknown;
  outputSchema?: unknown;
  timeoutSeconds?: number | null;
  maxRetries?: number;
  tags?: string[] | null;
  steps: PlaybookStepInput[];
}

export interface UpdatePlaybookData {
  name?: string;
  status?: PlaybookStatus;
  inputSchema?: unknown;
  outputSchema?: unknown;
  timeoutSeconds?: number | null;
  maxRetries?: number;
  tags?: string[] | null;
  steps?: PlaybookStepInput[];
}

export interface ListPlaybooksFilters {
  status?: PlaybookStatus;
  limit?: number;
  offset?: number;
  tags?: string[];
}

export class PlaybookService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get playbook by ID with all steps
   */
  async getPlaybookById(
    orgId: string,
    playbookId: string
  ): Promise<PlaybookDefinitionDTO | null> {
    // Fetch playbook
    const { data: playbook, error: playbookError } = await this.supabase
      .from('playbooks')
      .select('*')
      .eq('id', playbookId)
      .eq('org_id', orgId)
      .single();

    if (playbookError || !playbook) {
      return null;
    }

    // Fetch steps
    const { data: steps, error: stepsError } = await this.supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', playbookId)
      .eq('org_id', orgId)
      .order('position', { ascending: true });

    if (stepsError) {
      throw new Error(`Failed to fetch playbook steps: ${stepsError.message}`);
    }

    return {
      playbook: this.mapPlaybookFromDb(playbook),
      steps: (steps || []).map(this.mapStepFromDb),
    };
  }

  /**
   * List playbooks for an org
   */
  async listPlaybooks(
    orgId: string,
    filters: ListPlaybooksFilters = {}
  ): Promise<Playbook[]> {
    const { status, limit = 20, offset = 0, tags } = filters;

    let query = this.supabase
      .from('playbooks')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list playbooks: ${error.message}`);
    }

    return (data || []).map(this.mapPlaybookFromDb);
  }

  /**
   * Create a new playbook with steps
   */
  async createPlaybook(
    orgId: string,
    userId: string,
    data: CreatePlaybookData
  ): Promise<PlaybookDefinitionDTO> {
    // Validate playbook structure
    this.validatePlaybookDefinition(data.steps);

    // Create playbook
    const { data: playbook, error: playbookError } = await this.supabase
      .from('playbooks')
      .insert({
        org_id: orgId,
        name: data.name,
        version: data.version || 1,
        status: data.status || 'DRAFT',
        input_schema: data.inputSchema || null,
        output_schema: data.outputSchema || null,
        timeout_seconds: data.timeoutSeconds || null,
        max_retries: data.maxRetries || 0,
        tags: data.tags || null,
        created_by: userId,
      })
      .select()
      .single();

    if (playbookError || !playbook) {
      throw new Error(`Failed to create playbook: ${playbookError?.message}`);
    }

    // Create steps
    const stepsToInsert = data.steps.map((step) => ({
      playbook_id: playbook.id,
      org_id: orgId,
      key: step.key,
      name: step.name,
      type: step.type,
      config: step.config,
      position: step.position,
      next_step_key: step.nextStepKey || null,
    }));

    const { data: steps, error: stepsError } = await this.supabase
      .from('playbook_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) {
      // Rollback: delete the playbook
      await this.supabase.from('playbooks').delete().eq('id', playbook.id);
      throw new Error(`Failed to create playbook steps: ${stepsError.message}`);
    }

    return {
      playbook: this.mapPlaybookFromDb(playbook),
      steps: (steps || []).map(this.mapStepFromDb),
    };
  }

  /**
   * Update playbook and/or steps
   */
  async updatePlaybook(
    orgId: string,
    playbookId: string,
    data: UpdatePlaybookData
  ): Promise<PlaybookDefinitionDTO> {
    // Validate steps if provided
    if (data.steps) {
      this.validatePlaybookDefinition(data.steps);
    }

    // Update playbook metadata
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.inputSchema !== undefined) updateData.input_schema = data.inputSchema;
    if (data.outputSchema !== undefined) updateData.output_schema = data.outputSchema;
    if (data.timeoutSeconds !== undefined) updateData.timeout_seconds = data.timeoutSeconds;
    if (data.maxRetries !== undefined) updateData.max_retries = data.maxRetries;
    if (data.tags !== undefined) updateData.tags = data.tags;

    if (Object.keys(updateData).length > 0) {
      const { error: playbookError } = await this.supabase
        .from('playbooks')
        .update(updateData)
        .eq('id', playbookId)
        .eq('org_id', orgId);

      if (playbookError) {
        throw new Error(`Failed to update playbook: ${playbookError.message}`);
      }
    }

    // Update steps if provided (delete + insert pattern)
    if (data.steps) {
      // Delete existing steps
      const { error: deleteError } = await this.supabase
        .from('playbook_steps')
        .delete()
        .eq('playbook_id', playbookId)
        .eq('org_id', orgId);

      if (deleteError) {
        throw new Error(`Failed to delete old steps: ${deleteError.message}`);
      }

      // Insert new steps
      const stepsToInsert = data.steps.map((step) => ({
        playbook_id: playbookId,
        org_id: orgId,
        key: step.key,
        name: step.name,
        type: step.type,
        config: step.config,
        position: step.position,
        next_step_key: step.nextStepKey || null,
      }));

      const { error: insertError } = await this.supabase
        .from('playbook_steps')
        .insert(stepsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert new steps: ${insertError.message}`);
      }
    }

    // Fetch and return updated playbook
    const updated = await this.getPlaybookById(orgId, playbookId);
    if (!updated) {
      throw new Error('Playbook not found after update');
    }

    return updated;
  }

  /**
   * Validate playbook definition (DAG structure)
   */
  validatePlaybookDefinition(steps: PlaybookStepInput[]): void {
    const validation = validatePlaybookStructure(steps);

    if (!validation.valid) {
      throw new Error(`Invalid playbook structure: ${validation.errors.join(', ')}`);
    }

    // Additional validation: ensure at least one step exists
    if (steps.length === 0) {
      throw new Error('Playbook must have at least one step');
    }

    // Ensure there's at least one step without dependsOn (entry point)
    // For S7, we use nextStepKey pattern, so first step (position 0) is the entry point
    const sortedByPosition = [...steps].sort((a, b) => a.position - b.position);
    if (sortedByPosition.length > 0) {
      // Optionally validate that positions are sequential
      const positions = sortedByPosition.map((s) => s.position);
      const expectedPositions = Array.from({ length: positions.length }, (_, i) => i);
      const positionsMatch = positions.every((p, i) => p === expectedPositions[i]);

      if (!positionsMatch) {
        throw new Error('Step positions must be sequential starting from 0');
      }
    }
  }

  /**
   * Map database row to Playbook type
   */
  private mapPlaybookFromDb(row: any): Playbook {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      version: row.version,
      status: row.status,
      inputSchema: row.input_schema,
      outputSchema: row.output_schema,
      timeoutSeconds: row.timeout_seconds,
      maxRetries: row.max_retries,
      tags: row.tags,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to PlaybookStep type
   */
  private mapStepFromDb(row: any): PlaybookStep {
    return {
      id: row.id,
      orgId: row.org_id,
      playbookId: row.playbook_id,
      key: row.key,
      name: row.name,
      type: row.type,
      config: row.config,
      position: row.position,
      nextStepKey: row.next_step_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ========================================
  // Sprint S8: Versioning & Status Management
  // ========================================

  /**
   * List all versions of a playbook (by name)
   */
  async listPlaybookVersions(
    orgId: string,
    playbookId: string
  ): Promise<import('@pravado/types').PlaybookVersionSummary[]> {
    // First get the playbook to find its name
    const { data: playbook, error: playbookError } = await this.supabase
      .from('playbooks')
      .select('name')
      .eq('id', playbookId)
      .eq('org_id', orgId)
      .single();

    if (playbookError || !playbook) {
      return [];
    }

    // Find all versions with same name
    const { data: versions, error: versionsError } = await this.supabase
      .from('playbooks')
      .select('id, version, status, created_at, updated_at, created_by')
      .eq('org_id', orgId)
      .eq('name', playbook.name)
      .order('version', { ascending: false });

    if (versionsError) {
      throw new Error(`Failed to list playbook versions: ${versionsError.message}`);
    }

    return (versions || []).map((v) => ({
      id: v.id,
      version: v.version,
      status: v.status,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      createdBy: v.created_by,
    }));
  }

  /**
   * Clone a playbook version (create new version)
   */
  async clonePlaybookVersion(
    orgId: string,
    playbookId: string,
    userId: string
  ): Promise<import('@pravado/types').PlaybookDefinitionDTO> {
    // Fetch the source playbook and its steps
    const source = await this.getPlaybookById(orgId, playbookId);
    if (!source) {
      throw new Error('Source playbook not found');
    }

    // Find highest version number for this playbook name
    const { data: versions } = await this.supabase
      .from('playbooks')
      .select('version')
      .eq('org_id', orgId)
      .eq('name', source.playbook.name)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 ? versions[0].version + 1 : 1;

    // Create new playbook with incremented version
    const { data: newPlaybook, error: playbookError } = await this.supabase
      .from('playbooks')
      .insert({
        org_id: orgId,
        name: source.playbook.name,
        version: nextVersion,
        status: 'DRAFT', // Always start as DRAFT
        input_schema: source.playbook.inputSchema,
        output_schema: source.playbook.outputSchema,
        timeout_seconds: source.playbook.timeoutSeconds,
        max_retries: source.playbook.maxRetries,
        tags: source.playbook.tags,
        created_by: userId,
      })
      .select()
      .single();

    if (playbookError || !newPlaybook) {
      throw new Error(`Failed to clone playbook: ${playbookError?.message}`);
    }

    // Clone all steps
    const stepsToInsert = source.steps.map((step) => ({
      playbook_id: newPlaybook.id,
      org_id: orgId,
      key: step.key,
      name: step.name,
      type: step.type,
      config: step.config,
      position: step.position,
      next_step_key: step.nextStepKey,
    }));

    const { data: newSteps, error: stepsError } = await this.supabase
      .from('playbook_steps')
      .insert(stepsToInsert)
      .select();

    if (stepsError) {
      // Rollback: delete the playbook
      await this.supabase.from('playbooks').delete().eq('id', newPlaybook.id);
      throw new Error(`Failed to clone playbook steps: ${stepsError.message}`);
    }

    return {
      playbook: this.mapPlaybookFromDb(newPlaybook),
      steps: (newSteps || []).map(this.mapStepFromDb),
    };
  }

  /**
   * Set playbook status
   * If setting to ACTIVE, optionally deprecate other versions with same name
   */
  async setPlaybookStatus(
    orgId: string,
    playbookId: string,
    status: PlaybookStatus
  ): Promise<Playbook> {
    // Get playbook name first
    const { data: playbook } = await this.supabase
      .from('playbooks')
      .select('name')
      .eq('id', playbookId)
      .eq('org_id', orgId)
      .single();

    if (!playbook) {
      throw new Error('Playbook not found');
    }

    // If setting to ACTIVE, deprecate other ACTIVE versions with same name
    if (status === 'ACTIVE') {
      await this.supabase
        .from('playbooks')
        .update({ status: 'DEPRECATED' })
        .eq('org_id', orgId)
        .eq('name', playbook.name)
        .eq('status', 'ACTIVE')
        .neq('id', playbookId);
    }

    // Update the target playbook status
    const { data: updated, error } = await this.supabase
      .from('playbooks')
      .update({ status })
      .eq('id', playbookId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update playbook status: ${error?.message}`);
    }

    return this.mapPlaybookFromDb(updated);
  }
}
