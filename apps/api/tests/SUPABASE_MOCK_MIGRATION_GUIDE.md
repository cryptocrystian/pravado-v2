# Supabase Mock Migration Guide (Sprint S26)

## Overview

Sprint S26 created a comprehensive Supabase mock utility that properly supports method chaining and all query builder methods. This guide shows how to migrate existing tests.

## The Problem

Old mock approach:
```typescript
const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
};
```

**Issue**: Only supports ONE `.eq()` call. If service code chains `.eq().eq()`, the second call fails with "eq is not a function".

## The Solution

New comprehensive mock from `tests/helpers/supabaseMock.ts`:
```typescript
import { createMockSupabaseClient, createMockQueryBuilder, createMockSuccess } from './helpers/supabaseMock';
```

### Benefits:
- ✅ Supports infinite method chaining (`.eq().eq().eq()...`)
- ✅ Supports all query methods: `eq`, `or`, `ilike`, `limit`, `order`, `range`, etc.
- ✅ Supports all DML methods: `insert`, `update`, `delete` with chained filters
- ✅ Thenable (works with `await`)
- ✅ Proper response format matching Supabase API

## Migration Steps

### Step 1: Update imports

**Before:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
  } as unknown as SupabaseClient;
  return mockSupabase;
};
```

**After:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  createMockSuccess,
  createMockError
} from './helpers/supabaseMock';
```

### Step 2: Update beforeEach

**Before:**
```typescript
beforeEach(() => {
  mockSupabase = createMockSupabase();
  service = new MyService(mockSupabase);
});
```

**After:**
```typescript
beforeEach(() => {
  mockSupabase = createMockSupabaseClient();
  service = new MyService(mockSupabase);
});
```

### Step 3: Update test mocks

**Before (failing with chained .eq() calls):**
```typescript
const mockQuery = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
};
(mockSupabase.from as any).mockReturnValue(mockQuery);
```

**After (supports unlimited chaining):**
```typescript
const mockQuery = createMockQueryBuilder(createMockSuccess(null));
(mockSupabase.from as any).mockReturnValue(mockQuery);
```

### Step 4: Handle multiple queries

**Before:**
```typescript
const mockSelectQuery = { select: vi.fn()... };
const mockInsertQuery = { insert: vi.fn()... };

(mockSupabase.from as any)
  .mockReturnValueOnce(mockSelectQuery)
  .mockReturnValueOnce(mockInsertQuery);
```

**After:**
```typescript
const mockSelectQuery = createMockQueryBuilder(
  createMockSuccess({ id: 'existing' })
);
const mockInsertQuery = createMockQueryBuilder(
  createMockSuccess(null)
);

(mockSupabase.from as any)
  .mockReturnValueOnce(mockSelectQuery)
  .mockReturnValueOnce(mockInsertQuery);
```

## Complete Example: personalityStore.test.ts

This test was migrated successfully in Sprint S26:

```typescript
it('should update existing assignment', async () => {
  const orgId = 'org-123';
  const agentId = 'agent-456';
  const personalityId = 'personality-789';

  // Mock query to check for existing assignment
  const mockSelectQuery = createMockQueryBuilder(
    createMockSuccess({ id: 'assignment-1' })
  );

  // Mock query to update - supports chaining .eq().eq()
  const mockUpdateQuery = createMockQueryBuilder(
    createMockSuccess(null)
  );

  (mockSupabase.from as any)
    .mockReturnValueOnce(mockSelectQuery)
    .mockReturnValueOnce(mockUpdateQuery);

  await store.assignPersonalityToAgent(orgId, agentId, personalityId);

  expect(mockSupabase.from).toHaveBeenCalledWith('agent_personality_assignments');
});
```

**Service code this supports:**
```typescript
await this.supabase
  .from('agent_personality_assignments')
  .update({ personality_id: personalityId })
  .eq('org_id', orgId)      // First .eq()
  .eq('agent_id', agentId); // Second .eq() - now works!
```

## Files Still Needing Migration

Apply this pattern to:
1. ✅ `tests/personalityStore.test.ts` - **DONE** (2 tests fixed)
2. ⏳ `tests/contentService.test.ts` - 5 failing tests
3. ⏳ `tests/prMediaService.test.ts` - 4 failing tests
4. ⏳ `tests/briefGeneratorService.test.ts` - 3 failing tests

## Helper Functions Reference

### createMockSupabaseClient(tableResponses?)
Creates a full Supabase client mock with auth, storage, and rpc.

```typescript
const mockSupabase = createMockSupabaseClient({
  'users': createMockSuccess([{ id: '1', name: 'John' }]),
  'posts': createMockSuccess([]),
});
```

### createMockQueryBuilder(defaultResponse?)
Creates a chainable query builder that resolves to the given response.

```typescript
const queryBuilder = createMockQueryBuilder(
  createMockSuccess({ id: '123', name: 'Test' })
);

// Supports chaining:
await queryBuilder.select('*').eq('id', '123').eq('org_id', 'org-1');
// Returns: { data: { id: '123', name: 'Test' }, error: null }
```

### createMockSuccess<T>(data, count?)
Creates a successful response object.

```typescript
createMockSuccess([{ id: '1' }], 10)
// Returns: { data: [{ id: '1' }], error: null, count: 10 }
```

### createMockError(message, code?)
Creates an error response object.

```typescript
createMockError('Not found', 'PGRST116')
// Returns: { data: null, error: { message: 'Not found', code: 'PGRST116', ... } }
```

## Testing the Migration

Run specific test file after migration:
```bash
pnpm vitest run tests/yourFile.test.ts
```

Expected result: All tests should pass with proper chaining support.

## Notes

- The new mock is **fully backward compatible** - existing tests that don't chain methods will continue to work
- The mock is **thenable**, so both `await query` and `query.then()` work
- All Supabase query builder methods are supported (see full list in `supabaseMock.ts`)
- The mock properly simulates Supabase's response format: `{ data, error, count? }`
