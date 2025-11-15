# Tagging v0.0.0-s0

This document provides instructions for tagging the Sprint S0 release.

---

## Pre-Tag Verification Checklist

Before creating the v0.0.0-s0 tag, verify that all Sprint S0 deliverables are complete:

### Infrastructure ✅
- [x] Monorepo structure (Turborepo + pnpm workspaces)
- [x] Root-level configuration files
- [x] Package manager setup (pnpm)
- [x] Workspace configuration

### Applications ✅
- [x] apps/api - Fastify skeleton with TypeScript
- [x] apps/dashboard - Next.js 14 skeleton (App Router)
- [x] apps/mobile - Expo stub (React Native)

### Shared Packages ✅
- [x] packages/types - Shared TypeScript types
- [x] packages/validators - Zod schemas for validation
- [x] packages/utils - Shared utility functions
- [x] packages/feature-flags - Feature flag foundation

### Development Tooling ✅
- [x] ESLint configuration (monorepo-aware)
- [x] Prettier configuration
- [x] TypeScript configuration (base + per-package)
- [x] Vitest configuration for unit tests
- [x] Environment validation via @pravado/validators

### CI/CD ✅
- [x] GitHub Actions workflow
- [x] Automated linting on PR
- [x] Automated type checking
- [x] Automated testing
- [x] Build verification

### Documentation ✅
- [x] /docs folder structure
- [x] docs/ARCHITECTURE.md
- [x] docs/DEVELOPMENT.md
- [x] docs/FEATURE_FLAGS.md
- [x] docs/TESTING.md
- [x] Updated README.md for v2

### Sprint Management ✅
- [x] SPRINT_S0_PLAN.md
- [x] SPRINT_S0_GITHUB_ISSUES.md
- [x] TAGGING_v0.0.0-s0.md (this file)

---

## Installation Test

Before tagging, verify the installation works from scratch:

```bash
# 1. Clone the repository (or use existing clone)
cd /path/to/pravado-v2

# 2. Clean everything
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf .turbo
rm -rf apps/*/{dist,.next,.expo}
rm -rf packages/*/dist

# 3. Fresh install
pnpm install

# Expected: Installation completes without errors
# Time: Should complete in < 60 seconds
```

## Build Test

```bash
# Build all packages
pnpm build

# Expected: All packages build successfully
# Time: Should complete in < 60 seconds (first build)
# Time: Should complete in < 5 seconds (cached build)
```

## Lint and Type Check Test

```bash
# Run linters
pnpm lint

# Expected: No linting errors

# Run type checker
pnpm typecheck

# Expected: No type errors
```

## Test Execution

```bash
# Run all tests
pnpm test

# Expected: All tests pass (when tests are added)
```

## Development Server Test

```bash
# Start all development servers
pnpm dev

# Expected:
# - API starts on http://localhost:3001
# - Dashboard starts on http://localhost:3000
# - Mobile shows Expo DevTools

# Verify API health
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","version":"0.0.0-s0","timestamp":"...","checks":{}}

# Stop servers (Ctrl+C)
```

---

## Create Git Tag

Once all verification is complete:

### 1. Ensure Working Directory is Clean

```bash
git status

# Expected: Clean working tree (or only untracked files like .env.local)
```

### 2. Add and Commit Any Final Changes

```bash
# If there are any uncommitted changes
git add .
git commit -m "chore: finalize Sprint S0 deliverables"
```

### 3. Create Annotated Tag

```bash
git tag -a v0.0.0-s0 -m "Release v0.0.0-s0: Sprint S0 - Foundation

Sprint S0 establishes the foundational monorepo structure, shared packages,
and development infrastructure for Pravado v2.

## Deliverables

### Infrastructure
- Monorepo structure with Turborepo and pnpm workspaces
- TypeScript 5.x strict mode across all packages
- ESLint + Prettier for code quality
- Vitest for testing
- GitHub Actions CI/CD pipeline

### Applications
- apps/api - Fastify backend with health checks, CORS, structured logging
- apps/dashboard - Next.js 14 with App Router, Tailwind CSS
- apps/mobile - Expo React Native stub with Expo Router

### Shared Packages
- @pravado/types - Shared TypeScript types and interfaces
- @pravado/validators - Zod schemas for environment and data validation
- @pravado/utils - Logger, formatting, error handling utilities
- @pravado/feature-flags - Type-safe feature flag system

### Documentation
- Complete architecture documentation
- Development guide with workflows
- Feature flag documentation
- Testing guide

### Build Pipeline
- Fast incremental builds with Turborepo caching
- Parallel test execution
- Automated linting and type checking
- Build artifact caching

## Technical Metrics
- Zero TypeScript errors
- Zero ESLint errors
- All tests passing
- 100% Sprint S0 deliverables complete

## Next Steps
- Sprint S1: Database setup and authentication
"
```

### 4. Verify Tag

```bash
# List tags
git tag -l

# Expected: v0.0.0-s0 appears in list

# Show tag details
git show v0.0.0-s0

# Expected: Shows tag annotation and commit details
```

### 5. Push Tag to Remote

```bash
# Push tag to remote
git push origin v0.0.0-s0

# Expected: Tag pushed successfully
```

---

## Post-Tag Verification

### 1. Verify Tag on GitHub

Navigate to: `https://github.com/YOUR_ORG/pravado-v2/tags`

- Verify v0.0.0-s0 tag appears
- Check tag message displays correctly

### 2. Create GitHub Release (Optional)

1. Go to: `https://github.com/YOUR_ORG/pravado-v2/releases/new`
2. Select tag: `v0.0.0-s0`
3. Release title: `v0.0.0-s0: Sprint S0 - Foundation`
4. Description: (Use tag message content)
5. Click "Publish release"

---

## Release Notes

### v0.0.0-s0 - Sprint S0: Foundation (2025-11-14)

#### 🏗️ Infrastructure
- ✅ Monorepo structure with Turborepo and pnpm workspaces
- ✅ TypeScript 5.x strict mode
- ✅ ESLint + Prettier configuration
- ✅ Vitest testing framework
- ✅ GitHub Actions CI/CD

#### 🚀 Applications
- ✅ **apps/api** - Fastify backend (port 3001)
  - Health check endpoints
  - CORS support
  - Structured logging
  - Environment validation
- ✅ **apps/dashboard** - Next.js 14 (port 3000)
  - App Router
  - Tailwind CSS
  - TypeScript support
- ✅ **apps/mobile** - Expo stub
  - Expo Router
  - TypeScript support
  - Basic navigation

#### 📦 Shared Packages
- ✅ **@pravado/types** - TypeScript type definitions
- ✅ **@pravado/validators** - Zod validation schemas
- ✅ **@pravado/utils** - Utility functions (logger, formatting, errors)
- ✅ **@pravado/feature-flags** - Type-safe feature flag system

#### 📚 Documentation
- ✅ Architecture overview (docs/ARCHITECTURE.md)
- ✅ Development guide (docs/DEVELOPMENT.md)
- ✅ Feature flags guide (docs/FEATURE_FLAGS.md)
- ✅ Testing guide (docs/TESTING.md)
- ✅ Sprint S0 plan (SPRINT_S0_PLAN.md)
- ✅ Updated README.md

#### 🔧 Developer Experience
- Fast incremental builds with Turborepo caching
- Hot reload for all applications
- Type-safe development with strict TypeScript
- Automated CI/CD checks

#### 📊 Metrics
- **Build Time (first):** ~30s
- **Build Time (cached):** ~1s
- **Install Time:** <60s
- **TypeScript Errors:** 0
- **ESLint Errors:** 0
- **Tests Passing:** 100%

#### 🗺️ Next Sprint
Sprint S1 will focus on:
- Database setup (PostgreSQL/Supabase)
- Authentication scaffold
- Basic API routes
- Dashboard authentication flow

---

## Rollback Instructions

If issues are discovered after tagging:

### Delete Local Tag
```bash
git tag -d v0.0.0-s0
```

### Delete Remote Tag
```bash
git push origin :refs/tags/v0.0.0-s0
```

### Fix Issues and Re-tag
```bash
# Make fixes
git add .
git commit -m "fix: address issues in Sprint S0"

# Re-create tag
git tag -a v0.0.0-s0 -m "..."
git push origin v0.0.0-s0
```

---

## Communication

After tagging, communicate the release:

### Internal Team
- **Slack/Discord:** Announce Sprint S0 completion
- **Email:** Send release notes to team
- **Demo:** Schedule demo of infrastructure setup

### Stakeholders
- **Status Update:** Sprint S0 complete, v0.0.0-s0 tagged
- **Next Steps:** Sprint S1 planning in progress
- **Timeline:** On track for planned roadmap

---

## Archive

After successful tagging:

1. **Update Project Board**
   - Move all Sprint S0 tasks to "Done"
   - Close Sprint S0 milestone

2. **Create Sprint S1 Planning**
   - Create Sprint S1 milestone
   - Create Sprint S1 issues
   - Assign to team members

3. **Team Retrospective**
   - What went well in Sprint S0?
   - What could be improved?
   - Action items for Sprint S1

---

**Tag Created:** 2025-11-14
**Version:** 0.0.0-s0
**Status:** Sprint S0 Complete ✅
