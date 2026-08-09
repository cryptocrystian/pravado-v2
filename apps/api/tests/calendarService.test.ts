/**
 * CalendarService tests (W2 — content_calendar CRUD)
 *
 * Covers the honesty invariants:
 *   - org-scoping on list (org_id filter applied)
 *   - honest empty list when the org has scheduled nothing
 *   - cross-org / unknown asset rejection on create (before any insert)
 *   - reschedule/unschedule are org-scoped (null/false on no match)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  createMockSuccess,
} from './helpers/supabaseMock';
import {
  CalendarService,
  CalendarAssetNotFoundError,
} from '../src/services/calendarService';

describe('CalendarService', () => {
  let service: CalendarService;
  let mockSupabase: SupabaseClient;
  const orgId = 'org-123';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new CalendarService(mockSupabase);
  });

  describe('listEntries', () => {
    it('returns an honest empty array when nothing is scheduled', async () => {
      const mockQuery = createMockQueryBuilder(createMockSuccess([], 0));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listEntries(orgId);

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('content_calendar');
      // org-scoped
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
    });

    it('applies the from/to range filter and maps the joined asset', async () => {
      const mockRows = [
        {
          id: 'cal-1',
          org_id: orgId,
          asset_id: 'asset-1',
          scheduled_at: '2026-09-01T10:00:00.000Z',
          campaign: 'Q3 Launch',
          theme: 'authority',
          cross_pillar_deps: [],
          automation_mode: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          content_items: {
            id: 'asset-1',
            title: 'Test Article',
            content_type: 'blog_post',
            status: 'draft',
          },
        },
      ];
      const mockQuery = createMockQueryBuilder(createMockSuccess(mockRows, 1));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listEntries(orgId, {
        from: '2026-09-01T00:00:00.000Z',
        to: '2026-09-30T23:59:59.000Z',
      });

      expect(result).toHaveLength(1);
      expect(result[0].assetId).toBe('asset-1');
      expect(result[0].asset?.title).toBe('Test Article');
      expect(result[0].asset?.contentType).toBe('blog_post');
      expect(mockQuery.gte).toHaveBeenCalledWith(
        'scheduled_at',
        '2026-09-01T00:00:00.000Z'
      );
      expect(mockQuery.lte).toHaveBeenCalledWith(
        'scheduled_at',
        '2026-09-30T23:59:59.000Z'
      );
      expect(mockQuery.order).toHaveBeenCalledWith('scheduled_at', {
        ascending: true,
      });
    });

    it('surfaces DB errors instead of swallowing them into empty data', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'boom', code: 'XX000' },
      });
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(service.listEntries(orgId)).rejects.toThrow(
        'Failed to list calendar entries: boom'
      );
    });
  });

  describe('createEntry', () => {
    it('rejects a cross-org / unknown asset before inserting', async () => {
      // Ownership lookup returns no row → asset is not in this org.
      const ownershipQuery = createMockQueryBuilder(createMockSuccess(null));
      (mockSupabase.from as any).mockReturnValueOnce(ownershipQuery);

      await expect(
        service.createEntry(orgId, {
          assetId: 'asset-from-other-org',
          scheduledAt: '2026-09-01T10:00:00.000Z',
        })
      ).rejects.toBeInstanceOf(CalendarAssetNotFoundError);

      // Only the ownership check ran — no insert into content_calendar.
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('content_items');
      expect(ownershipQuery.eq).toHaveBeenCalledWith('org_id', orgId);
    });

    it('inserts scheduling metadata when the asset belongs to the org', async () => {
      const ownershipQuery = createMockQueryBuilder(
        createMockSuccess({ id: 'asset-1' })
      );
      const insertedRow = {
        id: 'cal-new',
        org_id: orgId,
        asset_id: 'asset-1',
        scheduled_at: '2026-09-05T09:00:00.000Z',
        campaign: null,
        theme: null,
        cross_pillar_deps: [],
        automation_mode: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        content_items: {
          id: 'asset-1',
          title: 'Owned Asset',
          content_type: 'guide',
          status: 'draft',
        },
      };
      const insertQuery = createMockQueryBuilder(
        createMockSuccess(insertedRow)
      );

      (mockSupabase.from as any)
        .mockReturnValueOnce(ownershipQuery)
        .mockReturnValueOnce(insertQuery);

      const result = await service.createEntry(orgId, {
        assetId: 'asset-1',
        scheduledAt: '2026-09-05T09:00:00.000Z',
      });

      expect(result.id).toBe('cal-new');
      expect(result.assetId).toBe('asset-1');
      expect(result.automationMode).toBe('manual');
      expect(result.asset?.title).toBe('Owned Asset');
      // insert was org-scoped with asset_id + org_id
      expect(insertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ org_id: orgId, asset_id: 'asset-1' })
      );
    });
  });

  describe('updateEntry', () => {
    it('returns null when no row matches the org (PGRST116)', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.updateEntry(orgId, 'cal-x', {
        scheduledAt: '2026-09-10T09:00:00.000Z',
      });

      expect(result).toBeNull();
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
    });
  });

  describe('deleteEntry', () => {
    it('returns false when no row matched the org', async () => {
      const mockQuery = createMockQueryBuilder(createMockSuccess(null));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.deleteEntry(orgId, 'cal-x');

      expect(result).toBe(false);
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
    });

    it('returns true when a row was deleted', async () => {
      const mockQuery = createMockQueryBuilder(
        createMockSuccess({ id: 'cal-1' })
      );
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.deleteEntry(orgId, 'cal-1');

      expect(result).toBe(true);
    });
  });
});
