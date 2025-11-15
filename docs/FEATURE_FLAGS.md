# Feature Flags

## Overview

The `@pravado/feature-flags` package provides a type-safe feature flag system for controlling features across all Pravado v2 applications.

## Installation

Feature flags are available as a workspace package:

```bash
pnpm add @pravado/feature-flags@workspace:*
```

## Usage

### Basic Usage

```typescript
import { isEnabled } from '@pravado/feature-flags';

if (isEnabled('ENABLE_DARK_MODE')) {
  // Show dark mode UI
} else {
  // Show light mode UI
}
```

### Available Flags

All flags are defined in `packages/feature-flags/src/flags.ts`:

```typescript
export const FLAGS = {
  // API flags
  ENABLE_API_V2: false,
  ENABLE_RATE_LIMITING: false,
  ENABLE_WEBHOOKS: false,

  // Dashboard flags
  ENABLE_DARK_MODE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_ADVANCED_SEARCH: false,

  // Mobile flags
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_BIOMETRICS: false,
  ENABLE_OFFLINE_MODE: false,

  // System flags
  ENABLE_DEBUG_MODE: false,
  ENABLE_MAINTENANCE_MODE: false,
} as const;
```

## Environment Overrides

Flags can be overridden via environment variables:

```bash
# .env
ENABLE_DARK_MODE=true
ENABLE_ANALYTICS=false
```

Environment variables always take precedence over default values.

## Advanced Usage

### Get All Flags

```typescript
import { getFeatureFlagProvider } from '@pravado/feature-flags';

const provider = getFeatureFlagProvider();
const allFlags = provider.getAllFlags();

console.log(allFlags);
// { ENABLE_DARK_MODE: true, ENABLE_API_V2: false, ... }
```

### Runtime Overrides

```typescript
import { getFeatureFlagProvider } from '@pravado/feature-flags';

const provider = getFeatureFlagProvider();

// Enable a flag at runtime
provider.setFlag('ENABLE_DEBUG_MODE', true);

// Check if enabled
if (provider.isEnabled('ENABLE_DEBUG_MODE')) {
  console.log('Debug mode enabled');
}
```

### Reset Flags

```typescript
import { getFeatureFlagProvider } from '@pravado/feature-flags';

const provider = getFeatureFlagProvider();

// Reset all flags to defaults (from environment or code)
provider.reset();
```

## Type Safety

The feature flag system is fully type-safe:

```typescript
import { FlagName } from '@pravado/feature-flags';

// Valid flag names
const flag: FlagName = 'ENABLE_DARK_MODE'; // ✓

// Invalid flag names cause compile errors
const invalidFlag: FlagName = 'INVALID_FLAG'; // ✗ Type error
```

## Adding New Flags

1. **Define the flag** in `packages/feature-flags/src/flags.ts`:

```typescript
export const FLAGS = {
  // ... existing flags
  ENABLE_MY_NEW_FEATURE: false,
} as const;
```

2. **Use the flag** in your application:

```typescript
import { isEnabled } from '@pravado/feature-flags';

if (isEnabled('ENABLE_MY_NEW_FEATURE')) {
  // Feature code here
}
```

3. **Override via environment** (optional):

```bash
ENABLE_MY_NEW_FEATURE=true
```

## Best Practices

### 1. Use Descriptive Names

```typescript
// Good
ENABLE_PUSH_NOTIFICATIONS
ENABLE_ADVANCED_SEARCH

// Bad
FEATURE_1
NEW_THING
```

### 2. Default to Disabled

New features should default to `false` until ready for production.

```typescript
export const FLAGS = {
  ENABLE_EXPERIMENTAL_FEATURE: false, // ✓
} as const;
```

### 3. Clean Up Old Flags

Remove flags when features are fully rolled out or removed:

```typescript
// Before
if (isEnabled('ENABLE_NEW_UI')) {
  return <NewUI />;
} else {
  return <OldUI />;
}

// After (when fully rolled out)
return <NewUI />;
```

### 4. Document Flag Purpose

Add comments for complex flags:

```typescript
export const FLAGS = {
  // Enables the new query builder UI (Sprint S5)
  // Dependencies: @pravado/query-builder package
  ENABLE_QUERY_BUILDER: false,
} as const;
```

## React Integration

### Custom Hook (Dashboard)

```typescript
// hooks/useFeatureFlag.ts
import { isEnabled, FlagName } from '@pravado/feature-flags';
import { useMemo } from 'react';

export function useFeatureFlag(flag: FlagName): boolean {
  return useMemo(() => isEnabled(flag), [flag]);
}

// Usage
function MyComponent() {
  const darkModeEnabled = useFeatureFlag('ENABLE_DARK_MODE');

  return (
    <div className={darkModeEnabled ? 'dark' : 'light'}>
      {/* ... */}
    </div>
  );
}
```

## API Integration

### Conditional Routes

```typescript
import { isEnabled } from '@pravado/feature-flags';
import type { FastifyInstance } from 'fastify';

export async function routes(server: FastifyInstance) {
  // Always available
  server.get('/users', getUsersHandler);

  // Conditional route
  if (isEnabled('ENABLE_API_V2')) {
    server.get('/v2/users', getUsersV2Handler);
  }
}
```

### Conditional Middleware

```typescript
import { isEnabled } from '@pravado/feature-flags';

// Apply rate limiting only if enabled
if (isEnabled('ENABLE_RATE_LIMITING')) {
  server.register(rateLimitPlugin);
}
```

## Testing

### Mocking Flags in Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getFeatureFlagProvider } from '@pravado/feature-flags';

describe('Feature Flag Tests', () => {
  const provider = getFeatureFlagProvider();

  beforeEach(() => {
    // Reset flags before each test
    provider.reset();
  });

  it('enables feature when flag is set', () => {
    provider.setFlag('ENABLE_DARK_MODE', true);

    expect(provider.isEnabled('ENABLE_DARK_MODE')).toBe(true);
  });
});
```

## Future Enhancements

### Planned Features (Future Sprints)

1. **Remote Configuration**
   - Load flags from database
   - Admin UI for flag management
   - Real-time flag updates

2. **A/B Testing**
   - User segmentation
   - Percentage rollouts
   - Analytics integration

3. **Flag Scheduling**
   - Enable/disable at specific times
   - Automatic flag lifecycle management

4. **Audit Logging**
   - Track flag changes
   - User-level flag overrides
   - Flag usage analytics

## Troubleshooting

### Flag Not Working

1. **Check environment variable**:
   ```bash
   echo $ENABLE_DARK_MODE
   ```

2. **Verify flag name** matches exactly:
   ```typescript
   // Correct
   isEnabled('ENABLE_DARK_MODE')

   // Wrong
   isEnabled('enable_dark_mode')
   ```

3. **Rebuild packages**:
   ```bash
   pnpm --filter @pravado/feature-flags build
   ```

### Type Errors

Ensure you're importing types correctly:

```typescript
import { isEnabled, type FlagName } from '@pravado/feature-flags';
```

---

**Last Updated:** 2025-11-14
**Version:** 0.0.0-s0
