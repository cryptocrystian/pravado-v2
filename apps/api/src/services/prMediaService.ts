/**
 * PR Media Service
 * Sprint S6: Media search, list management, and journalist relationships
 */

import type {
  Journalist,
  MediaOutlet,
  PRBeat,
  JournalistWithContext,
  PRList,
  PRListWithMembers,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SearchJournalistsOptions {
  q?: string; // Search query
  beatId?: string;
  outletId?: string;
  country?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}

export interface SearchJournalistsResult {
  items: JournalistWithContext[];
  total: number;
  limit: number;
  offset: number;
}

export class PRMediaService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Search journalists with filtering and context
   */
  async searchJournalists(
    orgId: string,
    options: SearchJournalistsOptions = {}
  ): Promise<SearchJournalistsResult> {
    const {
      q,
      beatId,
      outletId,
      country,
      tier,
      limit = 20,
      offset = 0,
    } = options;

    // Build base query for journalists
    let query = this.supabase
      .from('journalists')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (q) {
      // Search in full_name, email, bio
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    if (outletId) {
      query = query.eq('primary_outlet_id', outletId);
    }

    if (country) {
      query = query.eq('location', country);
    }

    // Execute journalist query
    query = query.range(offset, offset + limit - 1);

    const { data: journalists, error: journalistsError, count } = await query;

    if (journalistsError) {
      throw new Error(`Failed to search journalists: ${journalistsError.message}`);
    }

    if (!journalists || journalists.length === 0) {
      return {
        items: [],
        total: count || 0,
        limit,
        offset,
      };
    }

    // Get journalist IDs for additional queries
    const journalistIds = journalists.map((j) => j.id);

    // Fetch outlets for all journalists
    const outletIds = journalists
      .map((j) => j.primary_outlet_id)
      .filter((id): id is string => id !== null);

    let outlets: any[] = [];
    if (outletIds.length > 0) {
      const { data: outletsData } = await this.supabase
        .from('media_outlets')
        .select('*')
        .in('id', outletIds);

      outlets = outletsData || [];
    }

    // Filter by tier if needed
    if (tier && outlets.length > 0) {
      const filteredOutletIds = outlets
        .filter((o) => o.tier === tier)
        .map((o) => o.id);

      // Re-filter journalists by outlet tier
      const filteredJournalists = journalists.filter((j) =>
        filteredOutletIds.includes(j.primary_outlet_id)
      );

      if (filteredJournalists.length === 0) {
        return {
          items: [],
          total: 0,
          limit,
          offset,
        };
      }
    }

    // Fetch beats for all journalists
    const { data: journalistBeats } = await this.supabase
      .from('journalist_beats')
      .select('journalist_id, beat_id')
      .in('journalist_id', journalistIds);

    // Fetch beat details
    const beatIds = journalistBeats?.map((jb) => jb.beat_id) || [];
    let beats: any[] = [];

    if (beatIds.length > 0) {
      const { data: beatsData } = await this.supabase
        .from('pr_beats')
        .select('*')
        .in('id', beatIds);

      beats = beatsData || [];
    }

    // Filter by beatId if needed
    if (beatId && journalistBeats) {
      const journalistIdsWithBeat = journalistBeats
        .filter((jb) => jb.beat_id === beatId)
        .map((jb) => jb.journalist_id);

      const filteredJournalists = journalists.filter((j) =>
        journalistIdsWithBeat.includes(j.id)
      );

      if (filteredJournalists.length === 0) {
        return {
          items: [],
          total: 0,
          limit,
          offset,
        };
      }
    }

    // Build journalist-to-beats map
    const journalistBeatsMap = new Map<string, string[]>();
    if (journalistBeats) {
      for (const jb of journalistBeats) {
        if (!journalistBeatsMap.has(jb.journalist_id)) {
          journalistBeatsMap.set(jb.journalist_id, []);
        }
        journalistBeatsMap.get(jb.journalist_id)!.push(jb.beat_id);
      }
    }

    // Build outlet map
    const outletMap = new Map<string, any>();
    for (const outlet of outlets) {
      outletMap.set(outlet.id, outlet);
    }

    // Build beat map
    const beatMap = new Map<string, any>();
    for (const beat of beats) {
      beatMap.set(beat.id, beat);
    }

    // Assemble journalist context
    const items: JournalistWithContext[] = journalists.map((journalist) => {
      const outlet = journalist.primary_outlet_id
        ? outletMap.get(journalist.primary_outlet_id) || null
        : null;

      const beatIds = journalistBeatsMap.get(journalist.id) || [];
      const journalistBeats = beatIds
        .map((id) => beatMap.get(id))
        .filter((b): b is any => b !== undefined)
        .map(this.mapBeatFromDb);

      return {
        journalist: this.mapJournalistFromDb(journalist),
        outlet: outlet ? this.mapOutletFromDb(outlet) : null,
        beats: journalistBeats,
        topics: [], // TODO: Fetch topics if needed
      };
    });

    return {
      items,
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * List all PR lists for an org
   */
  async listPRLists(orgId: string): Promise<PRList[]> {
    const { data, error } = await this.supabase
      .from('pr_lists')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list PR lists: ${error.message}`);
    }

    return (data || []).map(this.mapListFromDb);
  }

  /**
   * Get a PR list with all its members
   */
  async getPRListWithMembers(orgId: string, listId: string): Promise<PRListWithMembers | null> {
    // Fetch the list
    const { data: list, error: listError } = await this.supabase
      .from('pr_lists')
      .select('*')
      .eq('id', listId)
      .eq('org_id', orgId)
      .single();

    if (listError || !list) {
      return null;
    }

    // Fetch list members
    const { data: members } = await this.supabase
      .from('pr_list_members')
      .select('journalist_id')
      .eq('list_id', listId)
      .eq('org_id', orgId);

    if (!members || members.length === 0) {
      return {
        list: this.mapListFromDb(list),
        members: [],
        memberCount: 0,
      };
    }

    // Fetch journalists for all members
    const journalistIds = members.map((m) => m.journalist_id);

    const { data: journalists } = await this.supabase
      .from('journalists')
      .select('*')
      .in('id', journalistIds)
      .eq('org_id', orgId);

    if (!journalists || journalists.length === 0) {
      return {
        list: this.mapListFromDb(list),
        members: [],
        memberCount: 0,
      };
    }

    // Fetch outlets for all journalists
    const outletIds = journalists
      .map((j) => j.primary_outlet_id)
      .filter((id): id is string => id !== null);

    let outlets: any[] = [];
    if (outletIds.length > 0) {
      const { data: outletsData } = await this.supabase
        .from('media_outlets')
        .select('*')
        .in('id', outletIds);

      outlets = outletsData || [];
    }

    // Fetch beats for all journalists
    const { data: journalistBeats } = await this.supabase
      .from('journalist_beats')
      .select('journalist_id, beat_id')
      .in('journalist_id', journalistIds);

    // Fetch beat details
    const beatIds = journalistBeats?.map((jb) => jb.beat_id) || [];
    let beats: any[] = [];

    if (beatIds.length > 0) {
      const { data: beatsData } = await this.supabase
        .from('pr_beats')
        .select('*')
        .in('id', beatIds);

      beats = beatsData || [];
    }

    // Build maps
    const outletMap = new Map<string, any>();
    for (const outlet of outlets) {
      outletMap.set(outlet.id, outlet);
    }

    const beatMap = new Map<string, any>();
    for (const beat of beats) {
      beatMap.set(beat.id, beat);
    }

    const journalistBeatsMap = new Map<string, string[]>();
    if (journalistBeats) {
      for (const jb of journalistBeats) {
        if (!journalistBeatsMap.has(jb.journalist_id)) {
          journalistBeatsMap.set(jb.journalist_id, []);
        }
        journalistBeatsMap.get(jb.journalist_id)!.push(jb.beat_id);
      }
    }

    // Assemble journalist context
    const journalistWithContext: JournalistWithContext[] = journalists.map((journalist) => {
      const outlet = journalist.primary_outlet_id
        ? outletMap.get(journalist.primary_outlet_id) || null
        : null;

      const beatIds = journalistBeatsMap.get(journalist.id) || [];
      const journalistBeats = beatIds
        .map((id) => beatMap.get(id))
        .filter((b): b is any => b !== undefined)
        .map(this.mapBeatFromDb);

      return {
        journalist: this.mapJournalistFromDb(journalist),
        outlet: outlet ? this.mapOutletFromDb(outlet) : null,
        beats: journalistBeats,
        topics: [], // TODO: Fetch topics if needed
      };
    });

    return {
      list: this.mapListFromDb(list),
      members: journalistWithContext,
      memberCount: journalistWithContext.length,
    };
  }

  /**
   * Create a new PR list
   */
  async createPRList(
    orgId: string,
    userId: string,
    name: string,
    description?: string
  ): Promise<PRList> {
    const { data, error } = await this.supabase
      .from('pr_lists')
      .insert({
        org_id: orgId,
        name,
        description: description || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create PR list: ${error?.message}`);
    }

    return this.mapListFromDb(data);
  }

  /**
   * Add members to a list
   */
  async addMembersToList(
    orgId: string,
    listId: string,
    journalistIds: string[],
    userId: string
  ): Promise<void> {
    // Verify list exists and belongs to org
    const { data: list, error: listError } = await this.supabase
      .from('pr_lists')
      .select('id')
      .eq('id', listId)
      .eq('org_id', orgId)
      .single();

    if (listError || !list) {
      throw new Error('List not found or access denied');
    }

    // Prepare member records
    const members = journalistIds.map((journalistId) => ({
      org_id: orgId,
      list_id: listId,
      journalist_id: journalistId,
      added_by: userId,
    }));

    // Insert members (ignore duplicates based on unique constraint)
    const { error: insertError } = await this.supabase
      .from('pr_list_members')
      .upsert(members, {
        onConflict: 'list_id,journalist_id',
        ignoreDuplicates: true,
      });

    if (insertError) {
      throw new Error(`Failed to add members: ${insertError.message}`);
    }
  }

  /**
   * Remove members from a list
   */
  async removeMembersFromList(
    orgId: string,
    listId: string,
    journalistIds: string[]
  ): Promise<void> {
    const { error } = await this.supabase
      .from('pr_list_members')
      .delete()
      .eq('list_id', listId)
      .eq('org_id', orgId)
      .in('journalist_id', journalistIds);

    if (error) {
      throw new Error(`Failed to remove members: ${error.message}`);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private mapJournalistFromDb(row: any): Journalist {
    return {
      id: row.id,
      orgId: row.org_id,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: row.full_name || row.name || '',
      name: row.name || row.full_name || '', // backward compatibility
      email: row.email,
      twitterHandle: row.twitter_handle,
      linkedinUrl: row.linkedin_url,
      websiteUrl: row.website_url,
      mediaOutletId: row.media_outlet_id || row.primary_outlet_id, // backward compatibility
      primaryOutletId: row.primary_outlet_id,
      location: row.location,
      timezone: row.timezone,
      bio: row.bio,
      isFreelancer: row.is_freelancer || false,
      beat: row.beat, // deprecated
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapOutletFromDb(row: any): MediaOutlet {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      domain: row.domain,
      websiteUrl: row.website_url,
      country: row.country,
      language: row.language,
      outletType: row.outlet_type,
      tier: row.tier,
      distribution: row.distribution,
      reachEstimate: row.reach_estimate,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapBeatFromDb(row: any): PRBeat {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapListFromDb(row: any): PRList {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      description: row.description,
      isDefault: row.is_default || false,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
