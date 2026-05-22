/**
 * Shared chainable Supabase query builder mock for apps/api/tests.
 *
 * Every Supabase query method (`.select`, `.eq`, `.in`, `.order`, etc.) is a
 * `vi.fn()` that returns the builder itself for chaining, so production code
 * like:
 *
 *   ctx.supabase
 *     .from('intelligence_nodes')
 *     .select('*', { count: 'exact', head: true })
 *     .eq('org_id', ctx.orgId)
 *     .eq('is_active', true)
 *     .gte('created_at', ...)
 *     .lte('created_at', ...)
 *     .order('created_at', { ascending: false })
 *
 * resolves uniformly regardless of how many chain methods get added.
 *
 * Assertion patterns supported (Track 0D Group 3 scan confirmed):
 *   - expect(builder.eq).toHaveBeenCalledWith('org_id', X)
 *   - expect(builder.eq).toHaveBeenCalledTimes(2)
 *   - expect(builder.eq).toHaveBeenNthCalledWith(1, 'org_id', X)
 *   - expect(builder.eq).toHaveBeenNthCalledWith(2, 'is_active', true)
 *
 * Authority: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0D-CI-GREEN-UP.md Group 3.
 */

import { vi, type Mock } from 'vitest';

export interface MockQueryBuilder {
  select: Mock;
  insert: Mock;
  update: Mock;
  upsert: Mock;
  delete: Mock;
  eq: Mock;
  neq: Mock;
  in: Mock;
  is: Mock;
  gte: Mock;
  lte: Mock;
  gt: Mock;
  lt: Mock;
  match: Mock;
  order: Mock;
  limit: Mock;
  range: Mock;
  single: Mock;
  maybeSingle: Mock;
  ilike: Mock;
  contains: Mock;
  or: Mock;
  then: <T>(onFulfilled: (value: unknown) => T) => Promise<T>;
  // Index signature so dynamic key assignment in the factory is type-safe.
  [key: string]: unknown;
}

const BUILDER_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'neq',
  'in',
  'is',
  'gte',
  'lte',
  'gt',
  'lt',
  'match',
  'order',
  'limit',
  'range',
  'single',
  'maybeSingle',
  'ilike',
  'contains',
  'or',
] as const;

export function createMockQuery(resolvedValue: unknown): MockQueryBuilder {
  const builder = {} as MockQueryBuilder;

  BUILDER_METHODS.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  builder.then = <T>(onFulfilled: (value: unknown) => T): Promise<T> =>
    Promise.resolve(resolvedValue).then(onFulfilled);

  return builder;
}
