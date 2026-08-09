/**
 * Content Calendar Service (W2)
 *
 * Real user CRUD over the `content_calendar` table (migration 105). The
 * calendar is SCHEDULING METADATA + click-to-open ONLY:
 *   - It never publishes, executes, or routes through publish governance.
 *   - `automation_mode` is persisted as metadata; it is NOT an execution
 *     trigger. There is deliberately no auto-publish path here.
 *
 * Honesty invariants:
 *   - Every read/write is org-scoped (`org_id = orgId`).
 *   - Create validates that `asset_id` belongs to the caller's org BEFORE
 *     insert; a cross-org (or unknown) asset is rejected, not silently stored.
 *   - No fake-data fallback: DB errors surface, not swallowed into empty rows.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type CalendarAutomationMode = 'manual' | 'copilot' | 'autopilot';

export interface CalendarCrossPillarDep {
  pillar: 'pr' | 'seo';
  type: 'blocks' | 'blocked_by' | 'syncs_with';
  entityId: string;
  entityLabel: string;
}

/** Joined asset summary (from content_items). */
export interface CalendarEntryAsset {
  id: string;
  title: string;
  contentType: string | null;
  status: string | null;
}

/** DTO returned to the dashboard (camelCase, join-enriched). */
export interface CalendarEntryDTO {
  id: string;
  orgId: string;
  assetId: string;
  scheduledAt: string;
  campaign: string | null;
  theme: string | null;
  crossPillarDeps: CalendarCrossPillarDep[];
  automationMode: CalendarAutomationMode;
  createdAt: string;
  updatedAt: string;
  asset: CalendarEntryAsset | null;
}

export interface CreateCalendarEntryInput {
  assetId: string;
  scheduledAt: string;
  campaign?: string;
  theme?: string;
  automationMode?: CalendarAutomationMode;
}

export interface UpdateCalendarEntryInput {
  scheduledAt?: string;
  campaign?: string | null;
  theme?: string | null;
  automationMode?: CalendarAutomationMode;
}

/**
 * Thrown when a create references an asset that does not belong to the caller's
 * org (or does not exist). Routes map this to a 4xx — never a 5xx and never a
 * silent success.
 */
export class CalendarAssetNotFoundError extends Error {
  constructor(assetId: string) {
    super(`Content asset ${assetId} not found in this organization`);
    this.name = 'CalendarAssetNotFoundError';
  }
}

// Select list with the to-one content_items join. `asset_id` is the only FK to
// content_items, so Supabase embeds it as a single object.
const SELECT_WITH_ASSET =
  'id, org_id, asset_id, scheduled_at, campaign, theme, cross_pillar_deps, automation_mode, created_at, updated_at, content_items:asset_id ( id, title, content_type, status )';

export class CalendarService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * List an org's calendar entries, optionally bounded by [from, to] on
   * scheduled_at, ordered by scheduled_at ascending. Honest empty array when
   * the org has scheduled nothing.
   */
  async listEntries(
    orgId: string,
    filters: { from?: string; to?: string } = {}
  ): Promise<CalendarEntryDTO[]> {
    let query = this.supabase
      .from('content_calendar')
      .select(SELECT_WITH_ASSET)
      .eq('org_id', orgId);

    if (filters.from) {
      query = query.gte('scheduled_at', filters.from);
    }
    if (filters.to) {
      query = query.lte('scheduled_at', filters.to);
    }

    query = query.order('scheduled_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list calendar entries: ${error.message}`);
    }

    return (data || []).map((row) => this.mapFromDb(row));
  }

  /**
   * Create a calendar entry. Validates asset ownership server-side first, then
   * inserts scheduling metadata. Never publishes.
   */
  async createEntry(
    orgId: string,
    input: CreateCalendarEntryInput
  ): Promise<CalendarEntryDTO> {
    // Ownership gate: the asset must exist AND belong to this org. Cross-org or
    // unknown asset ids are rejected here, before any write.
    const { data: asset, error: assetError } = await this.supabase
      .from('content_items')
      .select('id')
      .eq('id', input.assetId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (assetError) {
      throw new Error(`Failed to verify content asset: ${assetError.message}`);
    }
    if (!asset) {
      throw new CalendarAssetNotFoundError(input.assetId);
    }

    const insertData = {
      org_id: orgId,
      asset_id: input.assetId,
      scheduled_at: input.scheduledAt,
      campaign: input.campaign ?? null,
      theme: input.theme ?? null,
      // Metadata only — NOT an execution trigger.
      automation_mode: input.automationMode ?? 'manual',
    };

    const { data, error } = await this.supabase
      .from('content_calendar')
      .insert(insertData)
      .select(SELECT_WITH_ASSET)
      .single();

    if (error) {
      throw new Error(`Failed to create calendar entry: ${error.message}`);
    }

    return this.mapFromDb(data);
  }

  /**
   * Update / reschedule an entry, org-scoped. Returns null when no row matches
   * (unknown id or another org's row).
   */
  async updateEntry(
    orgId: string,
    id: string,
    input: UpdateCalendarEntryInput
  ): Promise<CalendarEntryDTO | null> {
    const updateData: Record<string, unknown> = {};
    if (input.scheduledAt !== undefined) {
      updateData.scheduled_at = input.scheduledAt;
    }
    if (input.campaign !== undefined) {
      updateData.campaign = input.campaign;
    }
    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }
    if (input.automationMode !== undefined) {
      // Metadata only — updating the mode never schedules a publish.
      updateData.automation_mode = input.automationMode;
    }

    const { data, error } = await this.supabase
      .from('content_calendar')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select(SELECT_WITH_ASSET)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // no matching row for this org
      }
      throw new Error(`Failed to update calendar entry: ${error.message}`);
    }

    return this.mapFromDb(data);
  }

  /**
   * Unschedule (delete) an entry, org-scoped. Returns false when no row matched.
   */
  async deleteEntry(orgId: string, id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('content_calendar')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to delete calendar entry: ${error.message}`);
    }

    return !!data;
  }

  private mapFromDb(row: any): CalendarEntryDTO {
    // Supabase may return the embedded join as an object (to-one) — defend
    // against an array shape just in case.
    const joined = Array.isArray(row.content_items)
      ? row.content_items[0]
      : row.content_items;

    return {
      id: row.id,
      orgId: row.org_id,
      assetId: row.asset_id,
      scheduledAt: row.scheduled_at,
      campaign: row.campaign ?? null,
      theme: row.theme ?? null,
      crossPillarDeps: Array.isArray(row.cross_pillar_deps)
        ? row.cross_pillar_deps
        : [],
      automationMode: (row.automation_mode ??
        'manual') as CalendarAutomationMode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      asset: joined
        ? {
            id: joined.id,
            title: joined.title,
            contentType: joined.content_type ?? null,
            status: joined.status ?? null,
          }
        : null,
    };
  }
}
