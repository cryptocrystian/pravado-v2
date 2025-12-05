/**
 * Comprehensive Supabase Mock Utility (Sprint S26)
 * Provides chainable mock that supports full query builder API
 */

import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MockQueryResponse<T = any> {
  data: T | null;
  error: any | null;
  count?: number;
}

export interface MockQueryBuilder {
  // Query methods
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  containedBy: ReturnType<typeof vi.fn>;
  rangeGt: ReturnType<typeof vi.fn>;
  rangeGte: ReturnType<typeof vi.fn>;
  rangeLt: ReturnType<typeof vi.fn>;
  rangeLte: ReturnType<typeof vi.fn>;
  rangeAdjacent: ReturnType<typeof vi.fn>;
  overlaps: ReturnType<typeof vi.fn>;
  textSearch: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;

  // Ordering and pagination
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  abortSignal: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  csv: ReturnType<typeof vi.fn>;

  // Mutation methods
  insert: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;

  // Return the mock response
  then?: (onfulfilled?: any, onrejected?: any) => Promise<MockQueryResponse>;
}

/**
 * Creates a chainable mock query builder
 */
export function createMockQueryBuilder(defaultResponse?: MockQueryResponse): MockQueryBuilder {
  const response: MockQueryResponse = defaultResponse || { data: null, error: null };

  const queryBuilder: MockQueryBuilder = {
    // Query methods - all return this for chaining
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),

    // Ordering and pagination
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
    csv: vi.fn().mockResolvedValue(response),

    // Mutation methods
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),

    // Make it thenable so it works with await
    then: vi.fn((onfulfilled) => {
      return Promise.resolve(response).then(onfulfilled);
    }),
  };

  return queryBuilder as MockQueryBuilder;
}

/**
 * Creates a mock Supabase client with table-specific responses
 */
export function createMockSupabaseClient(
  tableResponses: Record<string, MockQueryResponse> = {}
): SupabaseClient {
  const mockFrom = vi.fn((table: string) => {
    const defaultResponse = tableResponses[table] || { data: null, error: null };
    return createMockQueryBuilder(defaultResponse);
  });

  const mockSupabase = {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as unknown as SupabaseClient;

  return mockSupabase;
}

/**
 * Helper to set up mock responses for specific queries
 */
export function setupMockQueryResponse(
  queryBuilder: MockQueryBuilder,
  response: MockQueryResponse
) {
  // Override the then method to return the specific response
  queryBuilder.then = vi.fn((onfulfilled) => {
    return Promise.resolve(response).then(onfulfilled);
  });

  // Also override single/maybeSingle for cases where those are explicitly called
  queryBuilder.single = vi.fn().mockResolvedValue(response);
  queryBuilder.maybeSingle = vi.fn().mockResolvedValue(response);
}

/**
 * Helper to create a mock error response
 */
export function createMockError(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      code: code || 'PGRST000',
      details: '',
      hint: '',
    },
  };
}

/**
 * Helper to create a mock success response
 */
export function createMockSuccess<T>(data: T, count?: number): MockQueryResponse<T> {
  return {
    data,
    error: null,
    count,
  };
}
