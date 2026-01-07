# PRAVADO v2 - Claude Code Instructions

## Canon Authority

**CRITICAL: Read canon FIRST before any product work.**

### Canon Location
All canonical specifications are in: `/docs/canon/`

### Required Reading Order
1. `/docs/canon/README.md` - Start here (canon index)
2. Then follow the reading order specified in the README

### Canon Rules
- **Canon wins on ALL conflicts** - If any other doc contradicts canon, follow canon
- **Never use `docs/_archive/`** - Contains historical artifacts only
- **Flag conflicts explicitly** - Don't silently reconcile contradictions

### What is NOT Canon
- `docs/_archive/*` - Archived, historical only
- `docs/playbooks/` - Operational guides
- `docs/agents/` - Agent configs
- `docs/product/` - Legacy (superseded)
- Sprint reports - Historical artifacts

---

## Project Overview

PRAVADO is an AI-powered Marketing Operations Platform with three integrated pillars:
- **PR Intelligence** - Media relations, journalist outreach, coverage tracking
- **Content Hub** - AI-assisted content creation, briefs, quality scoring
- **SEO Command** - Keyword tracking, SERP analysis, optimization

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Hono.js on Render, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with RLS
- **Monorepo**: pnpm workspaces, Turborepo

## Key Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm --filter @pravado/dashboard dev   # Dashboard only
pnpm --filter @pravado/api dev         # API only

# Build
pnpm build                  # Build all
pnpm typecheck              # TypeScript check
pnpm lint                   # ESLint

# Testing
pnpm test                   # Run tests
pnpm --filter @pravado/api test        # API tests only
```

## Architecture

```
pravado-v2/
├── apps/
│   ├── api/               # Hono backend
│   └── dashboard/         # Next.js frontend
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── validators/        # Zod schemas
│   ├── utils/             # Shared utilities
│   └── feature-flags/     # Feature flag system
└── docs/
    ├── canon/             # CANONICAL SPECIFICATIONS (source of truth)
    ├── audit/             # Audit reports
    ├── _archive/          # IGNORED - historical only
    └── *.md               # Operational guides (DEVELOPMENT, TESTING, etc.)
```

## Documentation Hierarchy

| Priority | Location | Purpose |
|----------|----------|---------|
| 1 (Highest) | `/docs/canon/` | Product specifications - AUTHORITATIVE |
| 2 | `/docs/audit/` | Audit reports and findings |
| 3 | `/docs/*.md` | Operational guides (DEVELOPMENT, TESTING, DEPLOYMENT) |
| IGNORE | `/docs/_archive/` | Historical artifacts - NEVER use for guidance |

## Environment Variables

See `/docs/DEVELOPMENT.md` for required environment variables.

## Deployment

- **Dashboard**: Vercel
- **API**: Render
- **Database**: Supabase (hosted)

See `/docs/DEPLOYMENT_GUIDE.md` for deployment procedures.
