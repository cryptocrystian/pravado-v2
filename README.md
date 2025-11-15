# Pravado v2

**Version:** 0.0.1-s1 | **Status:** Sprint S1 Complete ✅

Next-generation AI-powered PR, content, and SEO orchestration platform built with modern tooling and architecture.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Sprint S0 Achievements](#sprint-s0-achievements)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🎯 Overview

Pravado v2 is a complete rebuild of the Pravado platform, designed from the ground up with modern architecture, tooling, and best practices. This clean-room implementation establishes a solid foundation for rapid feature development while maintaining type safety, developer experience, and scalability.

### Sprint S0 Focus

Sprint S0 establishes the **Repo & Plumbing** - the foundational infrastructure that enables fast, reliable development:

- 🏗️ **Monorepo Architecture** - Turborepo + pnpm workspaces for efficient builds
- 📦 **Shared Packages** - Type-safe, reusable code across all applications
- 🚀 **Modern Stack** - Fastify, Next.js 14, Expo, TypeScript 5
- 🔧 **Developer Experience** - Fast builds, hot reload, excellent tooling
- 🧪 **Testing Foundation** - Vitest for unit and integration tests
- 🔄 **CI/CD Pipeline** - Automated linting, testing, and builds
- 📚 **Documentation** - Complete architecture and development guides

---

## ✅ Sprint S0 Achievements

### Infrastructure
- ✅ Monorepo structure with Turborepo and pnpm workspaces
- ✅ TypeScript 5.x strict mode across all packages
- ✅ ESLint + Prettier for code quality
- ✅ Vitest for testing
- ✅ GitHub Actions CI/CD pipeline

### Applications
- ✅ **apps/api** - Fastify backend with health checks, CORS, structured logging
- ✅ **apps/dashboard** - Next.js 14 with App Router, Tailwind CSS
- ✅ **apps/mobile** - Expo React Native stub with Expo Router

### Shared Packages
- ✅ **@pravado/types** - Shared TypeScript types and interfaces
- ✅ **@pravado/validators** - Zod schemas for environment and data validation
- ✅ **@pravado/utils** - Logger, formatting, error handling utilities
- ✅ **@pravado/feature-flags** - Type-safe feature flag system

### Documentation
- ✅ Complete architecture documentation
- ✅ Development guide with workflows
- ✅ Feature flag documentation
- ✅ Testing guide

### Build Pipeline
- ✅ Fast incremental builds with Turborepo caching
- ✅ Parallel test execution
- ✅ Automated linting and type checking
- ✅ Build artifact caching

---

## 🏗️ Core Features (Roadmap)

These features will be implemented in future sprints:

### Content & Campaign Management (Future)
- AI-Powered Content Generation
- PR Campaign Management
- SEO Optimization
- Multi-Channel Distribution

### AI Agent System (Future)
- Agentic Workflows
- Agent Orchestration
- Multi-Agent Collaboration
- Performance Tracking

### Admin & Security (Future)
- Role-Based Access Control
- Granular Permissions
- Admin Console
- Audit Trail

### Content Moderation (Future)
- Real-Time Moderation Queue
- AI-Powered Abuse Detection
- Automated Moderation
- Escalation System

---

## 🏗️ Architecture

Pravado v2 uses a modern monorepo architecture powered by Turborepo and pnpm workspaces.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PRAVADO V2 MONOREPO                 │
└─────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Dashboard      │────▶│   API            │────▶│   Database       │
│   Next.js 14     │     │   Fastify        │     │   (Future)       │
│   Port: 3000     │     │   Port: 3001     │     │   PostgreSQL     │
└──────────────────┘     └──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────────────────────────────┐
│   Mobile         │     │   Shared Packages                        │
│   Expo/RN        │     │   @pravado/types                         │
│   (Stub)         │     │   @pravado/validators                    │
└──────────────────┘     │   @pravado/utils                         │
                         │   @pravado/feature-flags                 │
                         └──────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Monorepo Structure** - All code in one repository for easy cross-package changes
2. **Type Safety** - Strict TypeScript across all packages
3. **Shared Code** - Common types, utilities, and validation logic
4. **Fast Builds** - Turborepo caching for incremental builds
5. **Modern Stack** - Latest stable versions of all frameworks

---

## 💻 Technology Stack

### Build System
- **Monorepo**: Turborepo 2.x - Incremental builds with intelligent caching
- **Package Manager**: pnpm 9.x - Fast, efficient dependency management
- **TypeScript**: 5.3.3 - Strict type safety across all code

### Backend (apps/api)
- **Framework**: Fastify 4.x - High-performance Node.js framework
- **Language**: TypeScript 5.x
- **Testing**: Vitest - Fast unit testing
- **Validation**: Zod - Runtime type validation

### Frontend (apps/dashboard)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **Testing**: Vitest (React Testing Library - future)

### Mobile (apps/mobile)
- **Framework**: Expo SDK 50+
- **Language**: TypeScript 5.x
- **Router**: Expo Router - File-based routing
- **Platform**: React Native 0.73

### Shared Packages
- **Validation**: Zod 3.x
- **Testing**: Vitest 1.x
- **Linting**: ESLint 8.x + Prettier 3.x

### CI/CD
- **Platform**: GitHub Actions
- **Jobs**: Lint, Type Check, Test, Build
- **Caching**: Turborepo + pnpm caching

---

## 📁 Project Structure

```
pravado-v2/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── index.ts       # Entry point
│   │   │   ├── server.ts      # Server setup
│   │   │   └── routes/        # Route handlers
│   │   │       └── health.ts  # Health checks
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── dashboard/              # Next.js 14 frontend
│   │   ├── src/
│   │   │   └── app/           # App Router
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── globals.css
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── tailwind.config.ts
│   └── mobile/                 # Expo mobile app
│       ├── app/
│       │   ├── _layout.tsx
│       │   └── index.tsx
│       ├── package.json
│       ├── tsconfig.json
│       └── app.json
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── common.ts
│   │   │   ├── api.ts
│   │   │   └── user.ts
│   │   └── package.json
│   ├── validators/             # Zod validation schemas
│   │   ├── src/
│   │   │   ├── env.ts
│   │   │   ├── api.ts
│   │   │   └── user.ts
│   │   └── package.json
│   ├── utils/                  # Shared utilities
│   │   ├── src/
│   │   │   ├── logger.ts
│   │   │   ├── formatting.ts
│   │   │   └── errors.ts
│   │   └── package.json
│   └── feature-flags/          # Feature flag system
│       ├── src/
│       │   ├── flags.ts
│       │   └── provider.ts
│       └── package.json
├── docs/
│   ├── ARCHITECTURE.md         # Architecture docs
│   ├── DEVELOPMENT.md          # Development guide
│   ├── FEATURE_FLAGS.md        # Feature flag guide
│   └── TESTING.md              # Testing guide
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── .vscode/
│   ├── settings.json           # VS Code settings
│   └── extensions.json         # Recommended extensions
├── SPRINT_S0_PLAN.md           # Sprint S0 plan
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── vitest.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_ORG/pravado-v2.git
cd pravado-v2

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start development servers
pnpm dev
```

This starts:
- **API** on http://localhost:3001
- **Dashboard** on http://localhost:3000
- **Mobile** (Expo DevTools)

### Verify Installation

```bash
# Check API health
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","version":"0.0.0-s0","timestamp":"...","checks":{}}
```

---

## 🛠️ Development

### Available Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm dev --filter api # Start API only

# Building
pnpm build            # Build all packages
pnpm typecheck        # Type check all packages

# Testing
pnpm test             # Run all tests
pnpm test --watch     # Run tests in watch mode

# Code Quality
pnpm lint             # Lint all packages
pnpm format           # Format all code
pnpm format:check     # Check formatting

# Cleanup
pnpm clean            # Clean all build artifacts
```

### Package-Specific Commands

```bash
# Run commands for specific packages
pnpm --filter @pravado/api dev
pnpm --filter @pravado/dashboard build
pnpm --filter @pravado/utils test
```

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development guide.


---

## 📚 Documentation

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Complete architecture overview
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development guide and workflows
- [FEATURE_FLAGS.md](./docs/FEATURE_FLAGS.md) - Feature flag system documentation
- [TESTING.md](./docs/TESTING.md) - Testing guide and best practices
- [SPRINT_S0_PLAN.md](./SPRINT_S0_PLAN.md) - Sprint S0 plan and deliverables

---

## 🗺️ Roadmap

### Sprint S1 ✅ COMPLETE
- ✅ Database setup (Supabase PostgreSQL)
- ✅ Authentication with Supabase Auth
- ✅ Organization management with roles (owner/admin/member)
- ✅ User management with RLS
- ✅ API routes (auth, orgs, invites)
- ✅ Dashboard auth flow (login, onboarding, app)
- ✅ Complete documentation

**See [SPRINT_S1_COMPLETE.md](./SPRINT_S1_COMPLETE.md) for full details**

### Sprint S2 (Next)
- Fix dashboard production build
- Enhanced org management (update roles, remove members)
- Email integration for invites
- Refresh token implementation
- API documentation (OpenAPI/Swagger)

### Sprint S3+
- Content management
- AI agent system
- Campaign orchestration
- Advanced features from v1

---

## 📄 License

Proprietary - All rights reserved

© 2025 Pravado. Unauthorized copying, modification, or distribution is prohibited.

---

## 🎉 Acknowledgments

Built with:
- [Turborepo](https://turbo.build/) - Monorepo build system
- [pnpm](https://pnpm.io/) - Fast package manager
- [Fastify](https://fastify.dev/) - High-performance API framework
- [Next.js](https://nextjs.org/) - React framework
- [Expo](https://expo.dev/) - React Native platform
- [Vitest](https://vitest.dev/) - Fast testing framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development

🤖 Developed with assistance from [Claude Code](https://claude.com/claude-code)

---

**Version:** 0.0.1-s1 | **Last Updated:** 2025-11-15 | **Status:** Sprint S1 Complete ✅
