# Sprint S0 GitHub Issues

This document contains all the GitHub issues for Sprint S0. Copy these to create issues in your repository.

---

## Milestone: Sprint S0 - Foundation

**Description:** Establish monorepo structure, shared packages, and development infrastructure.

**Due Date:** 6 days from sprint start

---

## Issue #1: Set up monorepo structure with Turborepo and pnpm

**Labels:** `sprint:s0`, `type:infrastructure`, `priority:high`

**Description:**

Set up the foundational monorepo structure using Turborepo and pnpm workspaces.

**Tasks:**
- [ ] Initialize pnpm workspace configuration
- [ ] Create `turbo.json` with pipeline configuration
- [ ] Set up root `package.json` with workspace references
- [ ] Configure build pipeline (build, test, lint, typecheck, dev)
- [ ] Test that `pnpm install` works correctly
- [ ] Verify Turborepo caching is working

**Acceptance Criteria:**
- `pnpm install` completes successfully
- `pnpm build` builds all packages in correct order
- Turborepo caching reduces subsequent build times
- All workspace packages can reference each other

**Related Files:**
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`

---

## Issue #2: Create shared TypeScript configuration and tooling

**Labels:** `sprint:s0`, `type:infrastructure`, `priority:high`

**Description:**

Set up shared TypeScript configuration, ESLint, Prettier, and Vitest for the monorepo.

**Tasks:**
- [ ] Create base `tsconfig.json` with strict mode
- [ ] Configure ESLint with TypeScript support
- [ ] Set up Prettier with consistent formatting
- [ ] Configure Vitest for unit testing
- [ ] Add VS Code settings and recommended extensions
- [ ] Test linting, formatting, and type checking

**Acceptance Criteria:**
- All packages use strict TypeScript mode
- `pnpm lint` runs successfully
- `pnpm format` formats all code consistently
- `pnpm typecheck` validates types
- VS Code shows proper IntelliSense and errors

**Related Files:**
- `tsconfig.json`
- `.eslintrc.js`
- `.prettierrc`
- `vitest.config.ts`
- `.vscode/settings.json`
- `.vscode/extensions.json`

---

## Issue #3: Create @pravado/types shared package

**Labels:** `sprint:s0`, `type:package`, `priority:high`

**Description:**

Create the `@pravado/types` package with shared TypeScript type definitions.

**Tasks:**
- [ ] Initialize package with `package.json` and `tsconfig.json`
- [ ] Create `common.ts` with base types (UUID, Timestamp, BaseEntity, etc.)
- [ ] Create `api.ts` with API-related types
- [ ] Create `user.ts` with user and auth types
- [ ] Build package and verify exports
- [ ] Add to workspace references

**Acceptance Criteria:**
- Package builds successfully
- Types are exported correctly
- Other packages can import types
- TypeScript IntelliSense works

**Related Files:**
- `packages/types/package.json`
- `packages/types/src/index.ts`
- `packages/types/src/common.ts`
- `packages/types/src/api.ts`
- `packages/types/src/user.ts`

---

## Issue #4: Create @pravado/validators shared package

**Labels:** `sprint:s0`, `type:package`, `priority:high`

**Description:**

Create the `@pravado/validators` package with Zod validation schemas.

**Tasks:**
- [ ] Initialize package with dependencies (Zod)
- [ ] Create environment variable schemas (API, Dashboard, Mobile)
- [ ] Create API validation schemas (pagination, UUID, etc.)
- [ ] Create user validation schemas
- [ ] Implement `validateEnv` utility function
- [ ] Add unit tests for validators
- [ ] Build and verify exports

**Acceptance Criteria:**
- Package builds successfully
- Environment validation works correctly
- Validation schemas enforce correct types
- Tests pass for all validators
- Other packages can use validators

**Related Files:**
- `packages/validators/package.json`
- `packages/validators/src/env.ts`
- `packages/validators/src/api.ts`
- `packages/validators/src/user.ts`

---

## Issue #5: Create @pravado/utils shared package

**Labels:** `sprint:s0`, `type:package`, `priority:medium`

**Description:**

Create the `@pravado/utils` package with shared utility functions.

**Tasks:**
- [ ] Initialize package
- [ ] Create Logger class with structured logging
- [ ] Create formatting utilities (timestamps, string conversions)
- [ ] Create error classes (AppError, ValidationError, etc.)
- [ ] Add unit tests for all utilities
- [ ] Build and verify exports

**Acceptance Criteria:**
- Package builds successfully
- Logger works with different log levels
- Formatting utilities handle edge cases
- Error classes extend Error properly
- All tests pass
- Other packages can use utilities

**Related Files:**
- `packages/utils/package.json`
- `packages/utils/src/logger.ts`
- `packages/utils/src/formatting.ts`
- `packages/utils/src/errors.ts`

---

## Issue #6: Create @pravado/feature-flags package

**Labels:** `sprint:s0`, `type:package`, `priority:medium`

**Description:**

Create the `@pravado/feature-flags` package for type-safe feature flag management.

**Tasks:**
- [ ] Initialize package
- [ ] Define initial feature flags with defaults
- [ ] Create FeatureFlagProvider class
- [ ] Implement environment variable overrides
- [ ] Add `isEnabled` convenience function
- [ ] Add unit tests for flag provider
- [ ] Build and verify exports

**Acceptance Criteria:**
- Package builds successfully
- Flags are type-safe (no magic strings)
- Environment variables override defaults
- Runtime flag toggling works
- Tests pass
- Other packages can use feature flags

**Related Files:**
- `packages/feature-flags/package.json`
- `packages/feature-flags/src/flags.ts`
- `packages/feature-flags/src/provider.ts`

---

## Issue #7: Create apps/api Fastify application

**Labels:** `sprint:s0`, `type:application`, `priority:high`

**Description:**

Create the Fastify backend API application with basic setup.

**Tasks:**
- [ ] Initialize Fastify app with TypeScript
- [ ] Set up server configuration (CORS, logging, error handling)
- [ ] Create health check endpoints (/health, /ready, /live)
- [ ] Implement environment validation using @pravado/validators
- [ ] Add structured logging using @pravado/utils
- [ ] Configure hot reload with tsx
- [ ] Test API starts correctly on port 3001

**Acceptance Criteria:**
- API starts on port 3001
- Health check returns 200 with correct response
- CORS is configured correctly
- Environment validation works at startup
- Logs are structured JSON
- Hot reload works in development
- Error handling returns proper responses

**Related Files:**
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `apps/api/src/server.ts`
- `apps/api/src/routes/health.ts`

---

## Issue #8: Create apps/dashboard Next.js application

**Labels:** `sprint:s0`, `type:application`, `priority:high`

**Description:**

Create the Next.js 14 dashboard application with App Router and Tailwind CSS.

**Tasks:**
- [ ] Initialize Next.js 14 with App Router
- [ ] Configure TypeScript and transpile packages
- [ ] Set up Tailwind CSS
- [ ] Create root layout and home page
- [ ] Configure environment variables
- [ ] Test app starts on port 3000
- [ ] Verify hot reload works

**Acceptance Criteria:**
- Dashboard starts on port 3000
- Home page renders correctly
- Tailwind CSS styling works
- TypeScript compilation works
- Shared packages can be imported
- Hot reload works
- Build succeeds

**Related Files:**
- `apps/dashboard/package.json`
- `apps/dashboard/next.config.js`
- `apps/dashboard/tailwind.config.ts`
- `apps/dashboard/src/app/layout.tsx`
- `apps/dashboard/src/app/page.tsx`

---

## Issue #9: Create apps/mobile Expo application stub

**Labels:** `sprint:s0`, `type:application`, `priority:low`

**Description:**

Create a minimal Expo React Native application stub for future mobile development.

**Tasks:**
- [ ] Initialize Expo project with Expo Router
- [ ] Configure TypeScript
- [ ] Create basic home screen
- [ ] Set up app.json configuration
- [ ] Test app runs on simulator/emulator
- [ ] Add README with instructions

**Acceptance Criteria:**
- Expo app runs on iOS simulator / Android emulator
- Basic navigation works
- TypeScript compilation works
- App displays "Pravado Mobile" screen
- Shared packages can be referenced (even if not used yet)

**Related Files:**
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/index.tsx`

---

## Issue #10: Set up GitHub Actions CI/CD pipeline

**Labels:** `sprint:s0`, `type:ci-cd`, `priority:high`

**Description:**

Create GitHub Actions workflow for automated CI/CD.

**Tasks:**
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add lint job
- [ ] Add type check job
- [ ] Add test job
- [ ] Add build job with dependencies
- [ ] Configure pnpm and Node.js setup
- [ ] Add caching for faster builds
- [ ] Test workflow runs on push and PR

**Acceptance Criteria:**
- CI runs on push to main
- CI runs on pull requests
- All jobs pass (lint, typecheck, test, build)
- Build artifacts are uploaded
- Caching speeds up subsequent runs
- Failed checks block PRs

**Related Files:**
- `.github/workflows/ci.yml`

---

## Issue #11: Write documentation (ARCHITECTURE.md, DEVELOPMENT.md, etc.)

**Labels:** `sprint:s0`, `type:documentation`, `priority:medium`

**Description:**

Create comprehensive documentation for the monorepo.

**Tasks:**
- [ ] Write `docs/ARCHITECTURE.md` - system architecture overview
- [ ] Write `docs/DEVELOPMENT.md` - development guide and workflows
- [ ] Write `docs/FEATURE_FLAGS.md` - feature flag usage guide
- [ ] Write `docs/TESTING.md` - testing guide and best practices
- [ ] Update `README.md` for v2
- [ ] Create `SPRINT_S0_PLAN.md` with sprint details

**Acceptance Criteria:**
- All documentation is complete and accurate
- Code examples work correctly
- Architecture diagrams are clear
- Development guide covers common workflows
- README reflects Sprint S0 status
- Documentation is well-formatted

**Related Files:**
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/FEATURE_FLAGS.md`
- `docs/TESTING.md`
- `README.md`
- `SPRINT_S0_PLAN.md`

---

## Issue #12: Create Sprint S0 tagging and release instructions

**Labels:** `sprint:s0`, `type:documentation`, `priority:low`

**Description:**

Create instructions for tagging the v0.0.0-s0 release.

**Tasks:**
- [ ] Document git tagging process
- [ ] List all Sprint S0 deliverables
- [ ] Create verification checklist
- [ ] Write release notes template

**Acceptance Criteria:**
- Tagging instructions are clear
- All deliverables are listed
- Verification checklist is complete
- Release notes template is ready

**Related Files:**
- `TAGGING_v0.0.0-s0.md`

---

## Issue Templates for Future Use

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., macOS 14.0]
- Node version: [e.g., 20.11.0]
- pnpm version: [e.g., 9.0.0]

**Additional context**
Any other context about the problem.
```

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

---

**Total Issues:** 12
**Estimated Total Effort:** 6 days
**Sprint Duration:** 6 days
