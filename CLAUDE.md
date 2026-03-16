# PRAVADO v2 - Claude Code Instructions

## Allowed Edit Scope

**Claude may ONLY modify files in these paths without a Work Order:**

| Path | Purpose |
|------|---------|
| `docs/canon/**` | Canonical specifications |
| `contracts/**` | API contracts and schemas |
| `apps/dashboard/**` | Canonical UI application |
| `apps/api/**` | Backend API service |
| `packages/**` | Shared packages |
| `.github/**` | CI/CD and repo config |
| `scripts/**` | Build and automation scripts |
| `*.json` | Root config files (package.json, tsconfig.json, etc.) |
| `*.yaml` / `*.yml` | Root config files |
| `*.md` | Root documentation (CLAUDE.md, README.md) |

### Restricted Paths (Require Work Order)
Any path NOT listed above requires explicit authorization:
- Creating new apps in `apps/` (except `dashboard` and `api`)
- Modifying `docs/_archive/**` (archived, read-only)
- Creating new top-level directories

### Work Order Process
If a task requires modifying restricted paths:
1. **STOP** - Do not proceed
2. **FLAG** - Inform the user that a Work Order is required
3. **WAIT** - User must explicitly authorize the out-of-scope change

---

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
- **Superseded files are non-authoritative** - Any file marked SUPERSEDED in the canon README must be treated as archived even if physically present in `docs/canon/`. Do not implement from superseded docs.

### Canon Conflict Resolution Priority
When two canon files conflict on the same topic, resolve by this chain (highest wins):

| Priority | File(s) | Domain |
|----------|---------|--------|
| 1 | `PRODUCT_CONSTITUTION.md` | Mission, non-negotiables |
| 2 | `SAGE_v2.md`, `AUTOMATE_v2.md` | Core product model |
| 3 | `DS_v3_PRINCIPLES.md`, `DS_v3_1_EXPRESSION.md` | Design system |
| 4 | `CORE_UX_FLOWS.md`, `AUTOMATION_MODES_UX.md` | UX flows and modes |
| 5 | `UX_SURFACES.md` | Surface definitions |
| 6 | V1 Freeze Contracts (per surface) | Surface-specific implementation |
| 7 | `PLANS_LIMITS_ENTITLEMENTS.md` | Pricing/limits |
| 8 | `contracts/*` | API/data contracts |

**For Content:** `CONTENT_WORK_SURFACE_CONTRACT.md` wins on implementation details. `CONTENT_PILLAR_CANON.md` wins on product philosophy.
**For PR:** `PR_WORK_SURFACE_CONTRACT.md` wins on implementation details. `PR_PILLAR_MODEL.md` wins on product philosophy.
**For Command Center:** `COMMAND_CENTER_CONTRACT.md` is the single authority.

### Design System Rule
**Never infer design tokens from existing components.** Always reference `DS_v3_1_EXPRESSION.md` and `DS_v3_PRINCIPLES.md` directly. Existing components may contain legacy DS tokens — do not replicate them.

**Before writing or reviewing any UI component:**
1. Read `docs/skills/PRAVADO_DESIGN_SKILL.md` — the single source of truth for what Pravado UI looks and behaves like
2. Read `DS_v3_COMPLIANCE_CHECKLIST.md` in canon for the full token reference and audit findings
3. Run the pre-commit self-check from either doc before finishing
4. Use the quick-fix table in the compliance checklist to correct violations
5. Flag remaining violations with `// DS-VIOLATION:` comments — do not silently leave broken patterns

**Banned phantom hex values (automatic fail — never use these):**
```
#050508  #0D0D12  #111116  #111118  #16161E  #1A1A24  #2A2A36  #3A3A48
```
See `DS_v3_COMPLIANCE_CHECKLIST.md` Section 1 for the full banned list and correct replacements.

### What is NOT Canon
- `docs/_archive/*` - Archived, historical only
- `docs/playbooks/` - Operational guides
- `docs/agents/` - Agent configs
- `docs/product/` - Legacy (superseded)
- Sprint reports - Historical artifacts

---

## Project Overview

PRAVADO is an AI-native Visibility Operating System — not a marketing tool collection, but an integrated platform where PR, Content, and SEO/AEO compound each other through shared strategy (SAGE), governed execution (AUTOMATE), and citation intelligence (CiteMind).

**Three pillars, each best-in-class standalone, exponentially more powerful together:**
- **PR Intelligence** - Relationship-based influence orchestration. Journalist outreach, coverage tracking, narrative building. Feeds citation signals to CiteMind.
- **Content Hub** - Authority infrastructure, not a blog editor. CiteMind-governed content creation that compounds across PR and AEO.
- **SEO/AEO Command** - Bridge between traditional search and AI engine visibility. LLM citation tracking, Share of Model measurement, technical health. Powered by CiteMind.

**The governing layers visible in every surface:**
- **SAGE** - Strategy mesh. Decides what to do next and why, across all pillars simultaneously.
- **AUTOMATE** - Execution layer. Turns SAGE proposals into governed, traceable, mode-aware tasks.
- **CiteMind** - Intelligence engine. Qualifies content, tracks AI citations, measures brand authority in LLM answers.

**Target customer segments and their mode preferences:**
- **SMB** - Prefers Autopilot. Wants the system to run with minimal intervention.
- **Mid-market** - Prefers Copilot. AI does heavy lifting, human stays in decision seat.
- **Enterprise** - Requires Manual floors per pillar. Compliance, approval chains, dedicated staff.

**Modes are per-pillar policies, not platform-wide toggles.** An enterprise customer can run Content on Copilot, PR on Manual, and SEO monitoring on Autopilot simultaneously.

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
