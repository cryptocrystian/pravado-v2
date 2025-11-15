# Sprint S0: Repo & Plumbing

**Sprint Goal:** Establish the foundational monorepo structure, development tooling, and core infrastructure for pravado-v2.

**Duration:** 6 days
**Version Target:** v0.0.0-s0
**Status:** In Progress

---

## Overview

Sprint S0 is the foundational sprint that sets up the entire development infrastructure for pravado-v2. This sprint focuses on establishing a clean, maintainable, and scalable monorepo structure with proper tooling, type safety, and CI/CD pipelines.

### Strategic Goals

1. **Zero Technical Debt Start** - Begin with best practices from day one
2. **Developer Experience** - Fast builds, hot reloading, excellent DX
3. **Type Safety** - End-to-end TypeScript with shared types
4. **Automation** - CI/CD, linting, testing, validation
5. **Documentation** - Clear context and architecture docs

---

## Deliverables Checklist

### Core Infrastructure
- [x] Monorepo structure (Turborepo + pnpm workspaces)
- [x] Root-level configuration files
- [x] Package manager setup (pnpm)
- [x] Workspace configuration

### Applications
- [x] apps/api - Fastify skeleton with TypeScript
- [x] apps/dashboard - Next.js 14 skeleton (App Router)
- [x] apps/mobile - Expo stub (React Native)

### Shared Packages
- [x] packages/types - Shared TypeScript types
- [x] packages/validators - Zod schemas for validation
- [x] packages/utils - Shared utility functions
- [x] packages/feature-flags - Feature flag foundation

### Development Tooling
- [x] ESLint configuration (monorepo-aware)
- [x] Prettier configuration
- [x] TypeScript configuration (base + per-package)
- [x] Vitest configuration for unit tests
- [x] Environment validation via @pravado/validators

### CI/CD
- [x] GitHub Actions workflow
- [x] Automated linting on PR
- [x] Automated type checking
- [x] Automated testing
- [x] Build verification

### Documentation
- [x] /docs folder structure
- [x] docs/ARCHITECTURE.md
- [x] docs/DEVELOPMENT.md
- [x] docs/FEATURE_FLAGS.md
- [x] docs/TESTING.md
- [x] Updated README.md for v2

### Sprint Management
- [x] SPRINT_S0_PLAN.md (this file)
- [x] GitHub Issues for all tasks
- [x] Tagging instructions for v0.0.0-s0

---

## Architecture Overview

### Monorepo Structure

```
pravado-v2/
├── apps/
│   ├── api/                    # Fastify backend API
│   ├── dashboard/              # Next.js 14 admin dashboard
│   └── mobile/                 # Expo React Native app
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── validators/             # Zod validation schemas
│   ├── utils/                  # Shared utilities
│   └── feature-flags/          # Feature flag system
├── docs/                       # Documentation
├── .github/
│   └── workflows/              # CI/CD workflows
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace config
├── package.json                # Root package.json
├── tsconfig.json               # Base TypeScript config
├── .eslintrc.js                # ESLint config
└── .prettierrc                 # Prettier config
```

### Tech Stack

**Build System:**
- Turborepo 2.x for incremental builds and caching
- pnpm 9.x for efficient package management
- TypeScript 5.x for type safety

**Backend (apps/api):**
- Fastify 4.x - Fast, low-overhead framework
- TypeScript - Type safety
- Vitest - Testing framework
- Zod - Runtime validation

**Frontend (apps/dashboard):**
- Next.js 14 - React framework with App Router
- TypeScript - Type safety
- Tailwind CSS - Styling
- React Query - Server state management

**Mobile (apps/mobile):**
- Expo SDK 50+ - React Native framework
- TypeScript - Type safety
- Expo Router - File-based routing

**Shared Packages:**
- Zod - Schema validation
- TypeScript - Shared types
- Vitest - Unit testing

---

## Phase Breakdown

### Phase 1: Foundation (Day 1)
**Tasks:**
- Initialize git repository
- Set up pnpm workspaces
- Configure Turborepo
- Create root package.json
- Set up base TypeScript config

**Deliverables:**
- Working monorepo structure
- Dependency installation works
- `pnpm install` succeeds

### Phase 2: Shared Packages (Day 2)
**Tasks:**
- Create @pravado/types package
- Create @pravado/validators package
- Create @pravado/utils package
- Create @pravado/feature-flags package
- Set up inter-package dependencies

**Deliverables:**
- All packages buildable
- Type definitions exported
- Basic utilities available

### Phase 3: API Application (Day 2-3)
**Tasks:**
- Initialize Fastify app
- Set up route structure
- Configure environment validation
- Add health check endpoint
- Set up logging
- Configure CORS

**Deliverables:**
- API starts on port 3001
- Health check returns 200
- TypeScript compilation works
- Hot reload functional

### Phase 4: Dashboard Application (Day 3-4)
**Tasks:**
- Initialize Next.js 14 with App Router
- Set up basic layout
- Configure Tailwind CSS
- Add home page
- Set up environment variables
- Configure API client

**Deliverables:**
- Dashboard starts on port 3000
- Homepage renders
- TypeScript compilation works
- Hot reload functional

### Phase 5: Mobile Stub (Day 4)
**Tasks:**
- Initialize Expo project
- Set up basic navigation
- Add splash screen
- Configure TypeScript
- Add basic components

**Deliverables:**
- Expo app runs on simulator
- Basic navigation works
- TypeScript compilation works

### Phase 6: Development Tooling (Day 5)
**Tasks:**
- Configure ESLint for monorepo
- Configure Prettier
- Set up Vitest for unit tests
- Add pre-commit hooks (optional)
- Configure VS Code settings

**Deliverables:**
- `pnpm lint` works across all packages
- `pnpm format` works
- `pnpm test` runs unit tests
- Consistent code style

### Phase 7: CI/CD (Day 5-6)
**Tasks:**
- Create GitHub Actions workflow
- Add lint job
- Add type check job
- Add test job
- Add build job
- Configure caching

**Deliverables:**
- CI passes on main branch
- PR checks run automatically
- Build artifacts validated

### Phase 8: Documentation (Day 6)
**Tasks:**
- Create docs folder structure
- Write ARCHITECTURE.md
- Write DEVELOPMENT.md
- Write FEATURE_FLAGS.md
- Write TESTING.md
- Update README.md

**Deliverables:**
- Complete documentation
- Clear onboarding guide
- Architecture diagrams (text-based)

---

## Feature Flag Foundation

### Implementation Strategy

**Package:** `@pravado/feature-flags`

**Core Principles:**
1. Type-safe flag definitions
2. Environment-based overrides
3. Runtime toggleable (future)
4. A/B testing ready (future)

**Initial Flags:**
```typescript
export const FLAGS = {
  // API flags
  ENABLE_API_V2: false,
  ENABLE_RATE_LIMITING: false,

  // Dashboard flags
  ENABLE_DARK_MODE: false,
  ENABLE_ANALYTICS: false,

  // Mobile flags
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_BIOMETRICS: false,
} as const;
```

**Usage:**
```typescript
import { isEnabled } from '@pravado/feature-flags';

if (isEnabled('ENABLE_DARK_MODE')) {
  // Show dark mode UI
}
```

---

## Environment Validation

### Package: @pravado/validators

**Scope:**
- Validate all environment variables at startup
- Type-safe env access
- Clear error messages for missing/invalid vars

**Example Schema:**
```typescript
import { z } from 'zod';

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
```

---

## Testing Strategy

### Unit Tests
- **Framework:** Vitest
- **Coverage Target:** 70%+ (future sprints)
- **Location:** `__tests__` folders in each package

### Integration Tests
- **Scope:** API endpoint testing
- **Framework:** Vitest + Fastify test utilities
- **Coverage:** Health checks, basic routes

### E2E Tests
- **Scope:** Dashboard user flows
- **Framework:** Playwright (future sprint)
- **Coverage:** Critical paths only

---

## Build Pipeline

### Turborepo Tasks

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".expo/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Build Order
1. packages/types
2. packages/validators
3. packages/utils
4. packages/feature-flags
5. apps/api
6. apps/dashboard
7. apps/mobile

---

## GitHub Issues

All Sprint S0 tasks are tracked in GitHub Issues with the following labels:
- `sprint:s0` - Sprint S0 task
- `type:infrastructure` - Infrastructure setup
- `type:tooling` - Development tooling
- `priority:high` - Critical path items

**Issue Milestones:**
- Foundation Setup
- Shared Packages
- Applications
- CI/CD & Documentation

---

## Success Metrics

### Technical Metrics
- [ ] All packages build successfully
- [ ] All apps start without errors
- [ ] CI pipeline passes 100%
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors

### Developer Experience Metrics
- [ ] `pnpm install` completes in < 60s
- [ ] `pnpm dev` starts all apps in < 30s
- [ ] Hot reload works in all apps
- [ ] Type checking is fast (< 10s)

### Documentation Metrics
- [ ] All core docs complete
- [ ] README has clear setup instructions
- [ ] Architecture is documented
- [ ] Feature flags are documented

---

## Risk & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Turborepo learning curve | Medium | Reference official docs, keep config simple |
| Package dependency cycles | High | Enforce one-way dependencies, lint rules |
| Build time increases | Medium | Turborepo caching, remote cache (future) |
| Mobile setup complexity | Low | Use Expo for simplicity, minimal config |

---

## Post-Sprint S0

### Immediate Next Steps
1. Tag v0.0.0-s0
2. Create Sprint S1 plan
3. Begin feature development

### Sprint S1 Preview
- Database setup (Supabase/PostgreSQL)
- Authentication scaffold
- Basic API routes
- Dashboard authentication flow

---

## Notes

- All code uses TypeScript strict mode
- All packages use ES modules (type: "module")
- Node.js 20+ required
- Git hooks optional for this sprint
- Remote Turborepo cache deferred to later sprint

---

**Last Updated:** 2025-11-14
**Sprint Status:** In Progress
**Completion:** 100%
