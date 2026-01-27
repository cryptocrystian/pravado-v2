/**
 * PR Service - Direct Database Access for PR Pillar
 * Sprint S100.1: Server-side service for PR data operations
 *
 * This service provides:
 * - Direct Supabase queries (bypasses external API)
 * - CRUD operations for journalist profiles, pitches, etc.
 * - Inbox computation from DB entities
 *
 * RULES:
 * - This module is server-only
 * - All operations require org_id for tenant isolation
 * - Respects runtime flags for demo/strict mode
 */

import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { getPRConfig } from '@/lib/env/pr-config';

// ============================================
// TYPES
// ============================================

export interface JournalistProfile {
  id: string;
  orgId: string;
  fullName: string;
  primaryEmail: string;
  secondaryEmails: string[];
  primaryOutlet: string | null;
  beat: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  engagementScore: number;
  responsivenessScore: number;
  relevanceScore: number;
  lastActivityAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PitchSequence {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  defaultSubject: string | null;
  defaultPreviewText: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MediaList {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  inputTopic: string;
  inputKeywords: string[];
  inputMarket: string | null;
  inputGeography: string | null;
  inputProduct: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboxItem {
  id: string;
  type: 'inquiry' | 'follow_up_due' | 'coverage_triage' | 'relationship_decay' | 'approval_queue' | 'data_hygiene';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueAt?: string;
  urgency: number;
  confidence?: number;
  risk?: 'none' | 'low' | 'medium' | 'high';
  relatedContactId?: string;
  relatedPitchId?: string;
  primaryAction: {
    label: string;
    targetRoute: string;
  };
  modeCeiling: 'manual' | 'copilot' | 'autopilot';
  createdAt: string;
}

// ============================================
// PR SERVICE CLASS
// ============================================

export class PRService {
  private client: SupabaseClient;
  private orgId: string;

  constructor(client: SupabaseClient, orgId: string) {
    this.client = client;
    this.orgId = orgId;
  }

  // --------------------------------------------
  // JOURNALIST PROFILES
  // --------------------------------------------

  async listJournalists(options?: {
    q?: string;
    outlet?: string;
    beat?: string;
    minEngagementScore?: number;
    minRelevanceScore?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: JournalistProfile[]; total: number }> {
    let query = this.client
      .from('journalist_profiles')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId);

    if (options?.q) {
      query = query.or(`full_name.ilike.%${options.q}%,primary_email.ilike.%${options.q}%,primary_outlet.ilike.%${options.q}%`);
    }
    if (options?.outlet) {
      query = query.ilike('primary_outlet', `%${options.outlet}%`);
    }
    if (options?.beat) {
      query = query.ilike('beat', `%${options.beat}%`);
    }
    if (options?.minEngagementScore !== undefined) {
      query = query.gte('engagement_score', options.minEngagementScore);
    }
    if (options?.minRelevanceScore !== undefined) {
      query = query.gte('relevance_score', options.minRelevanceScore);
    }

    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder === 'asc';
    query = query.order(this.toSnakeCase(sortBy), { ascending: sortOrder });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list journalists: ${error.message}`);
    }

    return {
      profiles: (data || []).map(this.mapJournalistFromDb),
      total: count || 0,
    };
  }

  async getJournalist(id: string): Promise<JournalistProfile | null> {
    const { data, error } = await this.client
      .from('journalist_profiles')
      .select('*')
      .eq('id', id)
      .eq('org_id', this.orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get journalist: ${error.message}`);
    }

    return this.mapJournalistFromDb(data);
  }

  async createJournalist(input: {
    fullName: string;
    primaryEmail: string;
    primaryOutlet?: string;
    beat?: string;
    twitterHandle?: string;
    linkedinUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<JournalistProfile> {
    const { data, error } = await this.client
      .from('journalist_profiles')
      .insert({
        org_id: this.orgId,
        full_name: input.fullName,
        primary_email: input.primaryEmail,
        primary_outlet: input.primaryOutlet || null,
        beat: input.beat || null,
        twitter_handle: input.twitterHandle || null,
        linkedin_url: input.linkedinUrl || null,
        metadata: input.metadata || {},
        engagement_score: 0.5,
        responsiveness_score: 0.5,
        relevance_score: 0.5,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create journalist: ${error.message}`);
    }

    return this.mapJournalistFromDb(data);
  }

  async updateJournalist(id: string, input: Partial<{
    fullName: string;
    primaryEmail: string;
    primaryOutlet: string;
    beat: string;
    twitterHandle: string;
    linkedinUrl: string;
    engagementScore: number;
    responsivenessScore: number;
    relevanceScore: number;
    metadata: Record<string, unknown>;
  }>): Promise<JournalistProfile> {
    const updates: Record<string, unknown> = {};
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.primaryEmail !== undefined) updates.primary_email = input.primaryEmail;
    if (input.primaryOutlet !== undefined) updates.primary_outlet = input.primaryOutlet;
    if (input.beat !== undefined) updates.beat = input.beat;
    if (input.twitterHandle !== undefined) updates.twitter_handle = input.twitterHandle;
    if (input.linkedinUrl !== undefined) updates.linkedin_url = input.linkedinUrl;
    if (input.engagementScore !== undefined) updates.engagement_score = input.engagementScore;
    if (input.responsivenessScore !== undefined) updates.responsiveness_score = input.responsivenessScore;
    if (input.relevanceScore !== undefined) updates.relevance_score = input.relevanceScore;
    if (input.metadata !== undefined) updates.metadata = input.metadata;

    const { data, error } = await this.client
      .from('journalist_profiles')
      .update(updates)
      .eq('id', id)
      .eq('org_id', this.orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update journalist: ${error.message}`);
    }

    return this.mapJournalistFromDb(data);
  }

  // --------------------------------------------
  // PITCH SEQUENCES
  // --------------------------------------------

  async listPitchSequences(options?: {
    status?: string[];
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ sequences: PitchSequence[]; total: number }> {
    let query = this.client
      .from('pr_pitch_sequences')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId);

    if (options?.status && options.status.length > 0) {
      query = query.in('status', options.status);
    }
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder === 'asc';
    query = query.order(this.toSnakeCase(sortBy), { ascending: sortOrder });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list sequences: ${error.message}`);
    }

    return {
      sequences: (data || []).map(this.mapSequenceFromDb),
      total: count || 0,
    };
  }

  async createPitchSequence(userId: string, input: {
    name: string;
    defaultSubject?: string;
    defaultPreviewText?: string;
    settings?: Record<string, unknown>;
  }): Promise<PitchSequence> {
    const { data, error } = await this.client
      .from('pr_pitch_sequences')
      .insert({
        org_id: this.orgId,
        user_id: userId,
        name: input.name,
        status: 'draft',
        default_subject: input.defaultSubject || null,
        default_preview_text: input.defaultPreviewText || null,
        settings: input.settings || {
          sendWindow: { startHour: 9, endHour: 17, timezone: 'America/New_York' },
          followUpDelayDays: 3,
          maxAttempts: 3,
          excludeWeekends: true,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sequence: ${error.message}`);
    }

    return this.mapSequenceFromDb(data);
  }

  async getSequence(id: string): Promise<PitchSequence | null> {
    const { data, error } = await this.client
      .from('pr_pitch_sequences')
      .select('*')
      .eq('id', id)
      .eq('org_id', this.orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get sequence: ${error.message}`);
    }

    return this.mapSequenceFromDb(data);
  }

  async updatePitchSequence(id: string, input: Partial<{
    name: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    defaultSubject: string;
    defaultPreviewText: string;
    settings: Record<string, unknown>;
  }>): Promise<PitchSequence> {
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.status !== undefined) updates.status = input.status;
    if (input.defaultSubject !== undefined) updates.default_subject = input.defaultSubject;
    if (input.defaultPreviewText !== undefined) updates.default_preview_text = input.defaultPreviewText;
    if (input.settings !== undefined) updates.settings = input.settings;

    const { data, error } = await this.client
      .from('pr_pitch_sequences')
      .update(updates)
      .eq('id', id)
      .eq('org_id', this.orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update sequence: ${error.message}`);
    }

    return this.mapSequenceFromDb(data);
  }

  // --------------------------------------------
  // MEDIA LISTS
  // --------------------------------------------

  async listMediaLists(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ lists: MediaList[]; total: number }> {
    let query = this.client
      .from('media_lists')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list media lists: ${error.message}`);
    }

    return {
      lists: (data || []).map(this.mapMediaListFromDb),
      total: count || 0,
    };
  }

  // --------------------------------------------
  // INBOX (Computed from DB entities)
  // --------------------------------------------

  async getInboxItems(): Promise<{ items: InboxItem[]; total: number; byType: Record<string, number> }> {
    const items: InboxItem[] = [];
    const now = new Date();

    // 1. Get journalists with low engagement (relationship decay)
    const { data: lowEngagementJournalists } = await this.client
      .from('journalist_profiles')
      .select('id, full_name, primary_outlet, engagement_score, last_activity_at')
      .eq('org_id', this.orgId)
      .lt('engagement_score', 0.4)
      .order('engagement_score', { ascending: true })
      .limit(10);

    if (lowEngagementJournalists) {
      for (const profile of lowEngagementJournalists) {
        const daysSinceActivity = profile.last_activity_at
          ? Math.floor((now.getTime() - new Date(profile.last_activity_at).getTime()) / (24 * 60 * 60 * 1000))
          : 90;

        if (daysSinceActivity > 30) {
          items.push({
            id: `decay-${profile.id}`,
            type: 'relationship_decay',
            priority: daysSinceActivity > 60 ? 'medium' : 'low',
            title: `Relationship decay: ${profile.full_name}`,
            description: `No interaction in ${daysSinceActivity} days. Engagement: ${Math.round(profile.engagement_score * 100)}%. Consider a touch-base.`,
            urgency: Math.min(daysSinceActivity, 100),
            risk: daysSinceActivity > 60 ? 'medium' : 'low',
            relatedContactId: profile.id,
            primaryAction: {
              label: 'View Contact',
              targetRoute: `/app/pr?tab=database&contactId=${profile.id}&section=ledger`,
            },
            modeCeiling: 'manual',
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    // 2. Get active sequences that need follow-up
    const { data: activeSequences } = await this.client
      .from('pr_pitch_sequences')
      .select('id, name, status, created_at')
      .eq('org_id', this.orgId)
      .eq('status', 'active');

    if (activeSequences) {
      for (const sequence of activeSequences) {
        const daysSinceCreated = Math.floor(
          (now.getTime() - new Date(sequence.created_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        // Follow-up window: 5-7 days after initial pitch
        if (daysSinceCreated >= 5 && daysSinceCreated <= 7) {
          items.push({
            id: `followup-${sequence.id}`,
            type: 'follow_up_due',
            priority: 'medium',
            title: `Follow up: ${sequence.name}`,
            description: `Pitch sent ${daysSinceCreated} days ago. Optimal follow-up window (5-7 days). Max 2 follow-ups per contact/week.`,
            dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            urgency: 65,
            confidence: 72,
            relatedPitchId: sequence.id,
            primaryAction: {
              label: 'Draft Follow-up',
              targetRoute: `/app/pr?tab=pitches&pitchId=${sequence.id}&followup=true`,
            },
            modeCeiling: 'manual', // NON-NEGOTIABLE: Follow-ups require human review
            createdAt: sequence.created_at,
          });
        }
      }
    }

    // 3. Get draft sequences (approval queue)
    const { data: draftSequences } = await this.client
      .from('pr_pitch_sequences')
      .select('id, name, created_at')
      .eq('org_id', this.orgId)
      .eq('status', 'draft')
      .limit(5);

    if (draftSequences) {
      for (const sequence of draftSequences) {
        items.push({
          id: `approval-${sequence.id}`,
          type: 'approval_queue',
          priority: 'low',
          title: `Review draft: ${sequence.name}`,
          description: 'Draft pitch sequence ready for review and activation.',
          urgency: 30,
          relatedPitchId: sequence.id,
          primaryAction: {
            label: 'Review Draft',
            targetRoute: `/app/pr?tab=pitches&pitchId=${sequence.id}`,
          },
          modeCeiling: 'manual',
          createdAt: sequence.created_at,
        });
      }
    }

    // Sort by urgency (highest first)
    items.sort((a, b) => b.urgency - a.urgency);

    // Calculate counts by type
    const byType: Record<string, number> = {
      all: items.length,
      inquiry: 0,
      follow_up_due: 0,
      coverage_triage: 0,
      relationship_decay: 0,
      approval_queue: 0,
      data_hygiene: 0,
    };

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    return { items, total: items.length, byType };
  }

  // --------------------------------------------
  // PITCH EVENTS & TOUCHES
  // --------------------------------------------

  async logTouch(input: {
    journalistId: string;
    activityType: string;
    activityData?: Record<string, unknown>;
    sentiment?: 'positive' | 'neutral' | 'negative';
  }): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from('journalist_activity_log')
      .insert({
        org_id: this.orgId,
        journalist_id: input.journalistId,
        activity_type: input.activityType,
        source_system: 'pr_pillar_manual',
        activity_data: input.activityData || {},
        sentiment: input.sentiment || null,
        occurred_at: new Date().toISOString(),
        metadata: {},
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to log touch: ${error.message}`);
    }

    // Update journalist's last_activity_at
    await this.client
      .from('journalist_profiles')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', input.journalistId)
      .eq('org_id', this.orgId);

    return { id: data.id };
  }

  async manualSendPitch(input: {
    sequenceId: string;
    contactId: string;
    stepPosition?: number;
  }): Promise<{
    eventId: string;
    newStatus: string;
    eviAttribution: {
      pillar: 'pr';
      driver: 'visibility' | 'authority' | 'momentum';
      direction: 'positive';
      delta: number;
      explanation: string;
      timestamp: string;
      entityRefs: { journalistId?: string; sequenceId?: string };
    };
  }> {
    // First verify the contact exists and is in queued state
    const { data: contact, error: contactError } = await this.client
      .from('pr_pitch_contacts')
      .select('id, status, sequence_id, journalist_id')
      .eq('id', input.contactId)
      .eq('org_id', this.orgId)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    if (contact.status !== 'queued' && contact.status !== 'sent') {
      throw new Error(`Cannot send pitch to contact in ${contact.status} status`);
    }

    const timestamp = new Date().toISOString();

    // EVI attribution for pitch send - PR pillar contributes to visibility
    const eviAttribution = {
      pillar: 'pr' as const,
      driver: 'visibility' as const,
      direction: 'positive' as const,
      delta: 0.5, // Estimated visibility impact per pitch
      explanation: 'Manual pitch sent - direct media outreach contributes to visibility',
      timestamp,
      entityRefs: {
        journalistId: contact.journalist_id,
        sequenceId: input.sequenceId,
      },
    };

    // Create pitch event with EVI attribution
    const { data: event, error: eventError } = await this.client
      .from('pr_pitch_events')
      .insert({
        org_id: this.orgId,
        contact_id: input.contactId,
        step_position: input.stepPosition || 1,
        event_type: 'sent',
        payload: {
          manual_send: true,
          sent_at: timestamp,
          evi_attribution: eviAttribution,
        },
      })
      .select('id')
      .single();

    if (eventError) {
      throw new Error(`Failed to create pitch event: ${eventError.message}`);
    }

    // Update contact status
    const { error: updateError } = await this.client
      .from('pr_pitch_contacts')
      .update({
        status: 'sent',
        last_event_at: timestamp,
      })
      .eq('id', input.contactId)
      .eq('org_id', this.orgId);

    if (updateError) {
      throw new Error(`Failed to update contact status: ${updateError.message}`);
    }

    // Log activity with EVI attribution metadata
    await this.client
      .from('journalist_activity_log')
      .insert({
        org_id: this.orgId,
        journalist_id: contact.journalist_id,
        activity_type: 'pitch_sent',
        source_system: 'pr_pillar_manual',
        source_id: contact.sequence_id,
        activity_data: {
          sequence_id: input.sequenceId,
          contact_id: input.contactId,
          manual: true,
        },
        occurred_at: timestamp,
        metadata: {
          evi_attribution: eviAttribution,
        },
      });

    return {
      eventId: event.id,
      newStatus: 'sent',
      eviAttribution,
    };
  }

  // --------------------------------------------
  // BACKEND STATUS
  // --------------------------------------------

  async getBackendStatus(): Promise<{
    connected: boolean;
    counts: {
      journalists: number;
      sequences: number;
      mediaLists: number;
      inboxItems: number;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const counts = {
      journalists: 0,
      sequences: 0,
      mediaLists: 0,
      inboxItems: 0,
    };

    try {
      // Count journalists
      const { count: journalistCount, error: jErr } = await this.client
        .from('journalist_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', this.orgId);

      if (jErr) errors.push(`Journalists: ${jErr.message}`);
      else counts.journalists = journalistCount || 0;

      // Count sequences
      const { count: sequenceCount, error: sErr } = await this.client
        .from('pr_pitch_sequences')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', this.orgId);

      if (sErr) errors.push(`Sequences: ${sErr.message}`);
      else counts.sequences = sequenceCount || 0;

      // Count media lists
      const { count: listCount, error: lErr } = await this.client
        .from('media_lists')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', this.orgId);

      if (lErr) errors.push(`Media Lists: ${lErr.message}`);
      else counts.mediaLists = listCount || 0;

      // Get inbox items count
      const inbox = await this.getInboxItems();
      counts.inboxItems = inbox.total;

      return {
        connected: errors.length === 0,
        counts,
        errors,
      };
    } catch (err) {
      return {
        connected: false,
        counts,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      };
    }
  }

  // --------------------------------------------
  // HELPERS
  // --------------------------------------------

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapJournalistFromDb(row: Record<string, unknown>): JournalistProfile {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      fullName: row.full_name as string,
      primaryEmail: row.primary_email as string,
      secondaryEmails: (row.secondary_emails as string[]) || [],
      primaryOutlet: row.primary_outlet as string | null,
      beat: row.beat as string | null,
      twitterHandle: row.twitter_handle as string | null,
      linkedinUrl: row.linkedin_url as string | null,
      websiteUrl: row.website_url as string | null,
      engagementScore: (row.engagement_score as number) || 0,
      responsivenessScore: (row.responsiveness_score as number) || 0,
      relevanceScore: (row.relevance_score as number) || 0,
      lastActivityAt: row.last_activity_at as string | null,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapSequenceFromDb(row: Record<string, unknown>): PitchSequence {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      userId: row.user_id as string,
      name: row.name as string,
      status: row.status as PitchSequence['status'],
      defaultSubject: row.default_subject as string | null,
      defaultPreviewText: row.default_preview_text as string | null,
      settings: (row.settings as Record<string, unknown>) || {},
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapMediaListFromDb(row: Record<string, unknown>): MediaList {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      name: row.name as string,
      description: row.description as string | null,
      inputTopic: row.input_topic as string,
      inputKeywords: (row.input_keywords as string[]) || [],
      inputMarket: row.input_market as string | null,
      inputGeography: row.input_geography as string | null,
      inputProduct: row.input_product as string | null,
      createdBy: row.created_by as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createPRService(client: SupabaseClient, orgId: string): PRService {
  const config = getPRConfig();

  if (config.showBackendStatus) {
    console.log(`[PRService] Creating service for org: ${orgId.substring(0, 8)}...`);
  }

  return new PRService(client, orgId);
}
