import { describe, it, expect } from 'vitest';

import {
  createContentItemSchema,
  updateContentItemSchema,
  listContentItemsSchema,
} from '../src/pillar';

/**
 * Lane H — 3-way content enum reconciliation.
 *
 * Canon (CONTENT_WORK_SURFACE_CONTRACT §9.1/§4.1) is the source of truth:
 *   contentType: blog_post | long_form | landing_page | guide | case_study
 *   status:      draft | review | approved | published | archived
 *
 * These tests pin the contract so the FE, API validators, and DB can round-trip
 * the same values. They also lock out the three legacy sets that caused the hard
 * integration break: the old API set (social_post/video_script/newsletter) and
 * the old FE set (article/email/campaign + needs_review/ready).
 */

const CANON_TYPES = [
  'blog_post',
  'long_form',
  'landing_page',
  'guide',
  'case_study',
] as const;

const CANON_STATUSES = [
  'draft',
  'review',
  'approved',
  'published',
  'archived',
] as const;

describe('content enum reconciliation → canon', () => {
  it('createContentItemSchema accepts every canon content type', () => {
    for (const contentType of CANON_TYPES) {
      const r = createContentItemSchema.safeParse({ title: 'X', contentType });
      expect(r.success, `type ${contentType} should pass`).toBe(true);
    }
  });

  it('createContentItemSchema accepts every canon status', () => {
    for (const status of CANON_STATUSES) {
      const r = createContentItemSchema.safeParse({
        title: 'X',
        contentType: 'blog_post',
        status,
      });
      expect(r.success, `status ${status} should pass`).toBe(true);
    }
  });

  it('rejects the legacy API content types (social_post/video_script/newsletter)', () => {
    for (const contentType of ['social_post', 'video_script', 'newsletter']) {
      const r = createContentItemSchema.safeParse({ title: 'X', contentType });
      expect(r.success, `legacy API type ${contentType} must reject`).toBe(
        false
      );
    }
  });

  it('rejects the legacy FE content types (article/email/campaign)', () => {
    for (const contentType of ['article', 'email', 'campaign']) {
      const r = createContentItemSchema.safeParse({ title: 'X', contentType });
      expect(r.success, `legacy FE type ${contentType} must reject`).toBe(
        false
      );
    }
  });

  it('rejects the legacy FE statuses (needs_review/ready) the API used to drop', () => {
    for (const status of ['needs_review', 'ready']) {
      const r = createContentItemSchema.safeParse({
        title: 'X',
        contentType: 'blog_post',
        status,
      });
      expect(r.success, `legacy FE status ${status} must reject`).toBe(false);
    }
  });

  it('updateContentItemSchema accepts canon review/approved statuses', () => {
    for (const status of ['review', 'approved'] as const) {
      const r = updateContentItemSchema.safeParse({ status });
      expect(r.success, `update status ${status} should pass`).toBe(true);
    }
  });

  it('listContentItemsSchema filters on canon statuses and rejects legacy', () => {
    expect(
      listContentItemsSchema.safeParse({ status: 'approved' }).success
    ).toBe(true);
    expect(listContentItemsSchema.safeParse({ status: 'ready' }).success).toBe(
      false
    );
  });
});
