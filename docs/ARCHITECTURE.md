# Pravado v2 Architecture

## Overview

Pravado v2 is built as a modern monorepo using Turborepo and pnpm workspaces. The architecture follows a modular, scalable design with clear separation between applications and shared packages.

## Monorepo Structure

```
pravado-v2/
├── apps/                       # Applications
│   ├── api/                   # Fastify backend API
│   ├── dashboard/             # Next.js admin dashboard
│   └── mobile/                # Expo React Native app
├── packages/                   # Shared packages
│   ├── types/                 # TypeScript type definitions
│   ├── validators/            # Zod validation schemas
│   ├── utils/                 # Shared utilities
│   └── feature-flags/         # Feature flag system
└── docs/                      # Documentation
```

## Technology Stack

### Build System
- **Turborepo 2.x** - Incremental builds with intelligent caching
- **pnpm 9.x** - Efficient package management with workspaces
- **TypeScript 5.x** - Type safety across all packages

### Backend (apps/api)
- **Fastify 4.x** - High-performance Node.js framework
- **TypeScript** - Type-safe API development
- **Vitest** - Fast unit testing framework

### Frontend (apps/dashboard)
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe frontend development

### Mobile (apps/mobile)
- **Expo SDK 50+** - React Native development platform
- **Expo Router** - File-based routing for React Native
- **TypeScript** - Type-safe mobile development

## Architecture Principles

### 1. Type Safety
All code is written in TypeScript with strict mode enabled. Shared types in `@pravado/types` ensure consistency across all applications.

### 2. Shared Packages
Common functionality is extracted into shared packages:
- `@pravado/types` - Type definitions
- `@pravado/validators` - Zod schemas for validation
- `@pravado/utils` - Utility functions (logging, formatting, errors)
- `@pravado/feature-flags` - Feature flag management

### 3. Environment Validation
All environment variables are validated at startup using Zod schemas in `@pravado/validators`. This ensures:
- Required variables are present
- Variables have correct types
- Default values are applied consistently

### 4. Feature Flags
The feature flag system (`@pravado/feature-flags`) provides:
- Type-safe flag definitions
- Environment variable overrides
- Runtime toggleability (future)

## Application Architecture

### API (apps/api)

**Framework:** Fastify
**Port:** 3001 (default)

**Structure:**
```
apps/api/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # Server setup
│   └── routes/            # Route handlers
│       └── health.ts      # Health check endpoints
```

**Key Features:**
- Request/response logging
- CORS support
- Error handling
- Health check endpoints

### Dashboard (apps/dashboard)

**Framework:** Next.js 14 (App Router)
**Port:** 3000 (default)

**Structure:**
```
apps/dashboard/
├── src/
│   └── app/
│       ├── layout.tsx     # Root layout
│       ├── page.tsx       # Home page
│       └── globals.css    # Global styles
```

**Key Features:**
- Server-side rendering
- Tailwind CSS styling
- TypeScript support
- Hot module replacement

### Mobile (apps/mobile)

**Framework:** Expo
**Router:** Expo Router

**Structure:**
```
apps/mobile/
├── app/
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
└── app.json               # Expo config
```

**Key Features:**
- Cross-platform (iOS, Android, Web)
- File-based routing
- TypeScript support

## Build Pipeline

### Turborepo Tasks

1. **build** - Build all packages and applications
   - Depends on `^build` (build dependencies first)
   - Outputs cached to speed up subsequent builds

2. **test** - Run all tests
   - Depends on `^build`
   - Uses Vitest

3. **lint** - Run ESLint across all packages
   - Fast, no dependencies

4. **typecheck** - TypeScript type checking
   - Depends on `^build`
   - Validates types across workspace

5. **dev** - Start development servers
   - Not cached (persistent processes)

### Build Order

Packages are built in dependency order:
1. packages/types
2. packages/validators
3. packages/utils
4. packages/feature-flags
5. apps/* (in parallel)

## Testing Strategy

### Unit Tests
- **Framework:** Vitest
- **Location:** `__tests__` folders or `.test.ts` files
- **Coverage:** Shared packages and utilities

### Integration Tests
- **Scope:** API endpoints
- **Framework:** Vitest + Fastify test utilities

### E2E Tests (Future)
- **Framework:** Playwright
- **Scope:** Critical user flows in dashboard

## CI/CD Pipeline

### GitHub Actions Workflow

**Jobs:**
1. **Lint** - ESLint + Prettier checks
2. **Type Check** - TypeScript validation
3. **Test** - Unit test execution
4. **Build** - Build all packages

**Triggers:**
- Push to main branch
- Pull requests to main

## Environment Variables

### API (.env)
```bash
NODE_ENV=development
API_PORT=3001
API_HOST=localhost
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CORS_ORIGIN=http://localhost:3000
```

### Dashboard (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Security Considerations

1. **Environment Variables** - Never commit `.env` files
2. **Type Safety** - Strict TypeScript prevents common errors
3. **Validation** - All inputs validated with Zod
4. **Error Handling** - Structured error responses

## Performance Optimization

1. **Turborepo Caching** - Build artifacts cached locally
2. **pnpm Workspaces** - Efficient dependency management
3. **Code Splitting** - Next.js automatic code splitting
4. **Type Generation** - Incremental TypeScript compilation

## Future Enhancements

1. **Remote Caching** - Turborepo remote cache for teams
2. **Database Integration** - PostgreSQL + Drizzle ORM
3. **Authentication** - JWT-based auth system
4. **Real-time** - WebSocket support
5. **Monitoring** - Sentry, OpenTelemetry

## Development Workflow

1. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR_ORG/pravado-v2.git
   cd pravado-v2
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development**
   ```bash
   pnpm dev
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

5. **Build for Production**
   ```bash
   pnpm build
   ```

## Troubleshooting

### Build Failures
- Clear Turborepo cache: `rm -rf .turbo`
- Clean all builds: `pnpm clean`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

### Type Errors
- Ensure all packages are built: `pnpm build`
- Restart TypeScript server in VS Code
- Check `tsconfig.json` references

### Dev Server Issues
- Check port availability (3000, 3001)
- Verify environment variables
- Check logs for errors

---

**Last Updated:** 2025-11-14
**Version:** 0.0.0-s0
