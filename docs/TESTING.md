# Testing Guide

## Overview

Pravado v2 uses **Vitest** as the primary testing framework for all packages and applications.

## Test Structure

### Unit Tests

Unit tests are co-located with source files using the `.test.ts` suffix:

```
src/
├── utils.ts
├── utils.test.ts
├── logger.ts
└── logger.test.ts
```

### Integration Tests

Integration tests live in `__tests__` directories:

```
apps/api/
├── src/
└── __tests__/
    ├── health.test.ts
    └── routes/
        └── users.test.ts
```

## Running Tests

### All Tests

```bash
# Run all tests across all packages
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Package-Specific Tests

```bash
# Test specific package
pnpm --filter @pravado/utils test

# Test API application
pnpm --filter @pravado/api test
```

## Writing Tests

### Basic Unit Test

```typescript
// src/utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

// src/utils.test.ts
import { describe, it, expect } from 'vitest';
import { add } from './utils';

describe('add', () => {
  it('adds two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('adds negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('adds zero', () => {
    expect(add(5, 0)).toBe(5);
  });
});
```

### Testing with Mocks

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock a module
vi.mock('@pravado/utils', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('MyService', () => {
  it('logs messages', () => {
    const logger = createLogger('test');
    logger.info('test message');

    expect(logger.info).toHaveBeenCalledWith('test message');
  });
});
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest';

async function fetchData(): Promise<string> {
  return 'data';
}

describe('fetchData', () => {
  it('returns data', async () => {
    const result = await fetchData();
    expect(result).toBe('data');
  });
});
```

### Testing Errors

```typescript
import { describe, it, expect } from 'vitest';
import { ValidationError } from './errors';

describe('ValidationError', () => {
  it('throws validation error', () => {
    expect(() => {
      throw new ValidationError('Invalid input');
    }).toThrow('Invalid input');
  });

  it('has correct status code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
  });
});
```

## API Testing

### Testing Fastify Routes

```typescript
import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server';

describe('Health Check', () => {
  it('returns healthy status', async () => {
    const server = await createServer();

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'healthy',
      version: '0.0.0-s0',
    });

    await server.close();
  });
});
```

### Testing with Database (Future)

```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

describe('User Repository', () => {
  beforeEach(async () => {
    // Set up test database
    await setupTestDB();
  });

  afterAll(async () => {
    // Clean up
    await teardownTestDB();
  });

  it('creates a user', async () => {
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user.email).toBe('test@example.com');
  });
});
```

## Dashboard Testing (React)

### Component Testing (Future - React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './page';

describe('HomePage', () => {
  it('renders title', () => {
    render(<HomePage />);
    expect(screen.getByText('Pravado Dashboard')).toBeInTheDocument();
  });
});
```

## Test Organization

### Test Suites

Use `describe` blocks to organize related tests:

```typescript
describe('UserService', () => {
  describe('create', () => {
    it('creates a user with valid data', () => {
      // ...
    });

    it('throws error with invalid email', () => {
      // ...
    });
  });

  describe('update', () => {
    it('updates user fields', () => {
      // ...
    });
  });
});
```

### Setup and Teardown

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest';

describe('DatabaseTests', () => {
  beforeEach(() => {
    // Run before each test
    console.log('Setting up test');
  });

  afterEach(() => {
    // Run after each test
    console.log('Cleaning up test');
  });

  it('test 1', () => {
    // ...
  });

  it('test 2', () => {
    // ...
  });
});
```

## Test Coverage

### Generating Coverage Reports

```bash
# Generate coverage report
pnpm test --coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds (Future)

In `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Bad - tests implementation
it('calls internal method', () => {
  expect(service._internalMethod).toHaveBeenCalled();
});

// Good - tests behavior
it('returns user data', async () => {
  const user = await service.getUser(123);
  expect(user.name).toBe('John Doe');
});
```

### 2. Use Descriptive Test Names

```typescript
// Bad
it('works', () => { /* ... */ });

// Good
it('returns 404 when user not found', () => { /* ... */ });
```

### 3. One Assertion Per Test (Generally)

```typescript
// Bad
it('user operations', () => {
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.age).toBe(30);
});

// Good
it('creates user with correct name', () => {
  expect(user.name).toBe('John');
});

it('creates user with correct email', () => {
  expect(user.email).toBe('john@example.com');
});
```

### 4. Avoid Test Interdependence

```typescript
// Bad - tests depend on each other
let userId: string;

it('creates user', () => {
  userId = createUser();
});

it('updates user', () => {
  updateUser(userId); // Depends on previous test
});

// Good - tests are independent
it('creates user', () => {
  const userId = createUser();
  expect(userId).toBeDefined();
});

it('updates user', () => {
  const userId = createUser();
  const updated = updateUser(userId);
  expect(updated).toBeTruthy();
});
```

### 5. Clean Up After Tests

```typescript
import { afterEach } from 'vitest';

afterEach(() => {
  // Clean up database
  // Reset mocks
  // Clear cache
});
```

## Continuous Integration

Tests run automatically in CI via GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: pnpm test
```

## Troubleshooting

### Tests Not Running

1. **Check test file naming**: Files must end with `.test.ts` or be in `__tests__/`

2. **Rebuild packages**:
   ```bash
   pnpm build
   ```

3. **Clear cache**:
   ```bash
   rm -rf node_modules/.vite
   ```

### Import Errors

Ensure packages are built before running tests:

```bash
pnpm build
pnpm test
```

### Async Test Timeouts

Increase timeout for slow tests:

```typescript
it('slow test', async () => {
  // Test code
}, 10000); // 10 second timeout
```

## Future Testing Enhancements

### E2E Testing (Playwright)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('[name=email]', 'user@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});
```

### Visual Regression Testing

- Percy.io or Chromatic for screenshot comparison
- Catch unintended UI changes

### Performance Testing

- K6 or Artillery for load testing
- Lighthouse CI for performance metrics

---

**Last Updated:** 2025-11-14
**Version:** 0.0.0-s0
