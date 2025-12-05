/**
 * Personality Store Service (Sprint S11)
 * Handles CRUD operations for agent personalities and assignments
 */

import type { AgentPersonality, PersonalityProfile, PersonalityAssignment } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PersonalityStoreOptions {
  debugMode?: boolean;
}

export interface CreatePersonalityInput {
  slug: string;
  name: string;
  description: string;
  configuration: PersonalityProfile;
}

export interface UpdatePersonalityInput {
  name?: string;
  description?: string;
  configuration?: PersonalityProfile;
}

/**
 * Personality Store Service
 * Manages personality profiles and agent assignments
 */
export class PersonalityStore {
  private supabase: SupabaseClient;
  private debugMode: boolean;

  constructor(supabase: SupabaseClient, options: PersonalityStoreOptions = {}) {
    this.supabase = supabase;
    this.debugMode = options.debugMode || false;
  }

  /**
   * Create a new personality profile
   */
  async createPersonality(
    orgId: string,
    userId: string | null,
    data: CreatePersonalityInput
  ): Promise<AgentPersonality> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Creating personality', { orgId, slug: data.slug });
    }

    const { data: personality, error } = await this.supabase
      .from('agent_personalities')
      .insert({
        org_id: orgId,
        slug: data.slug,
        name: data.name,
        description: data.description || '',
        configuration: data.configuration,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create personality: ${error.message}`);
    }

    return this.mapPersonalityFromDb(personality);
  }

  /**
   * Update an existing personality profile
   */
  async updatePersonality(
    orgId: string,
    personalityId: string,
    data: UpdatePersonalityInput
  ): Promise<AgentPersonality> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Updating personality', { orgId, personalityId });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.configuration !== undefined) updateData.configuration = data.configuration;

    const { data: personality, error } = await this.supabase
      .from('agent_personalities')
      .update(updateData)
      .eq('id', personalityId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update personality: ${error.message}`);
    }

    return this.mapPersonalityFromDb(personality);
  }

  /**
   * List all personalities for an organization
   */
  async listPersonalities(orgId: string, limit: number = 50, offset: number = 0): Promise<AgentPersonality[]> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Listing personalities', { orgId, limit, offset });
    }

    const { data, error } = await this.supabase
      .from('agent_personalities')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list personalities: ${error.message}`);
    }

    return (data || []).map((row) => this.mapPersonalityFromDb(row));
  }

  /**
   * Get a specific personality by ID
   */
  async getPersonality(orgId: string, id: string): Promise<AgentPersonality | null> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Getting personality', { orgId, id });
    }

    const { data, error } = await this.supabase
      .from('agent_personalities')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get personality: ${error.message}`);
    }

    return this.mapPersonalityFromDb(data);
  }

  /**
   * Get a personality by slug
   */
  async getPersonalityBySlug(orgId: string, slug: string): Promise<AgentPersonality | null> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Getting personality by slug', { orgId, slug });
    }

    const { data, error } = await this.supabase
      .from('agent_personalities')
      .select('*')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get personality by slug: ${error.message}`);
    }

    return this.mapPersonalityFromDb(data);
  }

  /**
   * Assign a personality to an agent
   */
  async assignPersonalityToAgent(orgId: string, agentId: string, personalityId: string): Promise<void> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Assigning personality to agent', { orgId, agentId, personalityId });
    }

    // Check if assignment already exists
    const { data: existing } = await this.supabase
      .from('agent_personality_assignments')
      .select('id')
      .eq('org_id', orgId)
      .eq('agent_id', agentId)
      .single();

    if (existing) {
      // Update existing assignment
      const { error } = await this.supabase
        .from('agent_personality_assignments')
        .update({ personality_id: personalityId })
        .eq('org_id', orgId)
        .eq('agent_id', agentId);

      if (error) {
        throw new Error(`Failed to update personality assignment: ${error.message}`);
      }
    } else {
      // Create new assignment
      const { error } = await this.supabase.from('agent_personality_assignments').insert({
        org_id: orgId,
        agent_id: agentId,
        personality_id: personalityId,
      });

      if (error) {
        throw new Error(`Failed to assign personality: ${error.message}`);
      }
    }
  }

  /**
   * Get the assigned personality for an agent
   */
  async getPersonalityForAgent(orgId: string, agentId: string): Promise<AgentPersonality | null> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Getting personality for agent', { orgId, agentId });
    }

    const { data: assignment, error: assignmentError } = await this.supabase
      .from('agent_personality_assignments')
      .select('personality_id')
      .eq('org_id', orgId)
      .eq('agent_id', agentId)
      .single();

    if (assignmentError || !assignment) {
      return null; // No assignment found
    }

    return this.getPersonality(orgId, assignment.personality_id);
  }

  /**
   * Remove personality assignment from an agent
   */
  async removePersonalityFromAgent(orgId: string, agentId: string): Promise<void> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Removing personality from agent', { orgId, agentId });
    }

    const { error } = await this.supabase
      .from('agent_personality_assignments')
      .delete()
      .eq('org_id', orgId)
      .eq('agent_id', agentId);

    if (error) {
      throw new Error(`Failed to remove personality assignment: ${error.message}`);
    }
  }

  /**
   * Get all personality assignments for an organization
   */
  async listAssignments(orgId: string): Promise<PersonalityAssignment[]> {
    if (this.debugMode) {
      console.log('[PersonalityStore] Listing assignments', { orgId });
    }

    const { data, error } = await this.supabase
      .from('agent_personality_assignments')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to list assignments: ${error.message}`);
    }

    return (data || []).map((row) => this.mapAssignmentFromDb(row));
  }

  /**
   * Map database row to AgentPersonality
   */
  private mapPersonalityFromDb(row: any): AgentPersonality {
    return {
      id: row.id,
      orgId: row.org_id,
      slug: row.slug,
      name: row.name,
      description: row.description || '',
      configuration: row.configuration,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to PersonalityAssignment
   */
  private mapAssignmentFromDb(row: any): PersonalityAssignment {
    return {
      id: row.id,
      orgId: row.org_id,
      agentId: row.agent_id,
      personalityId: row.personality_id,
      createdAt: row.created_at,
    };
  }
}
