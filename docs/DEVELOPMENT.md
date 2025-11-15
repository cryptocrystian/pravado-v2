# Development Guide

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Git**

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_ORG/pravado-v2.git
   cd pravado-v2
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - API on http://localhost:3001
   - Dashboard on http://localhost:3000
   - Mobile (Expo DevTools)

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Available Scripts

### Root Level

```bash
# Start all development servers
pnpm dev

# Build all packages and apps
pnpm build

# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format all code
pnpm format

# Check formatting
pnpm format:check

# Clean all build artifacts
pnpm clean
```

### Package-Specific

Run commands for specific packages using `--filter`:

```bash
# Run API dev server only
pnpm --filter @pravado/api dev

# Build only the dashboard
pnpm --filter @pravado/dashboard build

# Test utils package
pnpm --filter @pravado/utils test
```

## Development Workflow

### 1. Creating a New Feature

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests and linting:
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. Push and create a PR:
   ```bash
   git push origin feature/your-feature-name
   ```

### 2. Adding a New Shared Package

1. Create package directory:
   ```bash
   mkdir -p packages/new-package/src
   ```

2. Create `package.json`:
   ```json
   {
     "name": "@pravado/new-package",
     "version": "0.0.0-s0",
     "type": "module",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

3. Create `tsconfig.json`:
   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"]
   }
   ```

4. Add code in `src/index.ts`

5. Build and test:
   ```bash
   pnpm --filter @pravado/new-package build
   ```

### 3. Adding Dependencies

**To workspace root:**
```bash
pnpm add -D <package> -w
```

**To specific package:**
```bash
pnpm --filter @pravado/api add <package>
```

**Add workspace dependency:**
```bash
pnpm --filter @pravado/api add @pravado/types@workspace:*
```

## Code Style

### TypeScript

- Use strict mode (enabled by default)
- Avoid `any` types
- Use interfaces for objects, types for unions
- Export types alongside implementations

### Naming Conventions

- **Files:** kebab-case (e.g., `user-service.ts`)
- **Classes:** PascalCase (e.g., `UserService`)
- **Functions:** camelCase (e.g., `getUserById`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (e.g., `UserProfile`)

### Imports

Follow this order (enforced by ESLint):
1. Node built-ins
2. External packages
3. Internal packages (@pravado/*)
4. Relative imports

Example:
```typescript
import { readFile } from 'fs/promises';

import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { User } from '@pravado/types';
import { validateEnv } from '@pravado/validators';

import { createLogger } from './logger';
```

## Testing

### Unit Tests

Create `.test.ts` files alongside source files:

```typescript
// src/utils.ts
export function add(a: number, b: number) {
  return a + b;
}

// src/utils.test.ts
import { describe, it, expect } from 'vitest';
import { add } from './utils';

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

Run tests:
```bash
pnpm test
```

### Integration Tests (API)

```typescript
import { describe, it, expect } from 'vitest';
import { createServer } from './server';

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
    });
  });
});
```

## Environment Variables

### API
Create `apps/api/.env`:
```bash
NODE_ENV=development
API_PORT=3001
DATABASE_URL=postgresql://localhost/pravado
```

### Dashboard
Create `apps/dashboard/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Validation

Environment variables are validated at startup using Zod schemas in `@pravado/validators`:

```typescript
import { validateEnv, apiEnvSchema } from '@pravado/validators';

const env = validateEnv(apiEnvSchema);
// TypeScript knows env.API_PORT is a number
```

## Feature Flags

### Defining Flags

Edit `packages/feature-flags/src/flags.ts`:

```typescript
export const FLAGS = {
  ENABLE_NEW_FEATURE: false,
  // ... other flags
} as const;
```

### Using Flags

```typescript
import { isEnabled } from '@pravado/feature-flags';

if (isEnabled('ENABLE_NEW_FEATURE')) {
  // Feature enabled
}
```

### Environment Override

```bash
# .env
ENABLE_NEW_FEATURE=true
```

## Debugging

### VS Code

1. Install recommended extensions (see `.vscode/extensions.json`)

2. Add breakpoints in code

3. Run debug configuration (F5)

### API Debugging

```typescript
import { createLogger } from '@pravado/utils';

const logger = createLogger('my-module');

logger.debug('Debug message', { userId: 123 });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', { error });
```

### Browser DevTools (Dashboard)

- Next.js automatically generates source maps
- Use React DevTools extension
- Console logs visible in browser

## Troubleshooting

### "Module not found" errors

1. Rebuild packages:
   ```bash
   pnpm build
   ```

2. Clear Turborepo cache:
   ```bash
   rm -rf .turbo
   ```

3. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### Type errors in workspace packages

1. Ensure packages are built:
   ```bash
   pnpm --filter @pravado/types build
   ```

2. Restart TypeScript server in VS Code:
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

### Port already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Expo not starting

```bash
# Clear Expo cache
pnpm --filter @pravado/mobile expo start -c
```

## Git Workflow

### Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

Examples:
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve CORS issue in API"
git commit -m "docs: update development guide"
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Refactoring
- `test/` - Test improvements

## Performance Tips

### Faster Installs

pnpm uses content-addressable storage, making installs very fast.

### Faster Builds

Turborepo caches build outputs:
```bash
# First build: ~30s
pnpm build

# Cached build: ~1s
pnpm build
```

### Faster Type Checking

Use project references in `tsconfig.json` for incremental builds.

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Fastify Documentation](https://fastify.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated:** 2025-11-14
**Version:** 0.0.0-s0
