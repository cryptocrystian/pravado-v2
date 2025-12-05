# Sprint S83 - Pillar Page Inventory

> **Canonical Design System**: `docs/design-system/pravado_design_system_v2_ai_first_standard.md`
> **S82 Aligned Foundation**: globals.css, tailwind.config.ts, login, onboarding, app shell

---

## Summary

This inventory documents all pillar pages requiring Design System V2 alignment. All pages currently use legacy styling (light backgrounds, gray/blue colors, hardcoded hex values).

---

## Priority Tier 1: Core Pillar Pages

### `/app` - Main Dashboard
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/page.tsx` |
| Components | Stats cards, Sprint progress section |
| Issues | `bg-white` panels, `text-gray-900`, `bg-gray-200` progress bars, `bg-green-600`/`bg-blue-600` hardcoded, emoji icons |

### `/app/pr` - PR/Media Explorer
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/pr/page.tsx` |
| Components | Search, filters, journalist cards, lists panel, modal |
| Issues | `bg-white` panels, `text-gray-900`, `bg-blue-600` buttons, `border-gray-300` inputs, `bg-blue-50` selected states, `bg-gray-50` hover states |

### `/app/content` - Content Intelligence
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/content/page.tsx` |
| Components | Three-panel layout, content library, briefs tab, clusters/gaps cards |
| Issues | `bg-gray-50` page background, `bg-white` panels, `border-gray-200`, `text-blue-600` tabs, `bg-green-100`/`bg-yellow-100` status badges |

### `/app/seo` - SEO Intelligence
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/seo/page.tsx` |
| Components | Tabs (keywords/onpage/backlinks), data table, SERP snapshot, opportunities panel |
| Issues | `bg-white` cards, `border-blue-500` active tabs, `bg-gray-50` table headers, hardcoded intent badge colors |

### `/app/playbooks` - Playbooks
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/playbooks/page.tsx` |
| Components | Data table, filters, template dialog |
| Issues | `bg-gray-50` empty states, `bg-blue-600` buttons, `border-gray-300` inputs, `bg-green-100`/`bg-yellow-100` status badges |

---

## Priority Tier 2: Executive Views (Phase 3 Priority)

### `/app/exec` - Executive Command Center
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/exec/page.tsx` |
| Components | ExecDashboardLayout, KPI grid, insights feed, narrative panel, dashboard cards |
| Issues | Uses `@/components/ui/*` (shadcn), `text-gray-900`, `bg-red-50` errors, `text-gray-500` muted |

### `/app/exec/digests` - Executive Digests
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/exec/digests/page.tsx` |
| Components | Digest cards, stats card, tabs, forms, delivery history |
| Issues | `text-gray-900`, `text-gray-500`, `bg-red-50` error states, uses shadcn Card components |

### `/app/exec/board-reports` - Board Reports
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/exec/board-reports/page.tsx` |
| Components | Report cards, header, section list, audience list, audit log |
| Issues | Same as digests - `text-gray-900`, `text-gray-500`, shadcn components with default styling |

### `/app/unified-narratives` - Unified Narratives
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/unified-narratives/page.tsx` |
| Components | Stats cards grid, filters bar, narrative cards grid, generator form, detail drawer |
| Issues | `bg-gray-50` page background, `text-gray-500`, `text-yellow-600`/`text-blue-600`/`text-green-600` status colors, `bg-black/50` modal overlay |

---

## Priority Tier 3: Supporting Pages

### `/app/team` - Team Management
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/team/page.tsx` + TeamPageClient.tsx |
| Components | Member table, invite form |
| Issues | `text-gray-900`, `bg-red-50` error states |

### `/app/agents` - Agents
| Property | Value |
|----------|-------|
| File | `apps/dashboard/src/app/app/agents/page.tsx` |
| Issues | Likely similar legacy styling |

### `/app/billing/*` - Billing Pages
| Property | Value |
|----------|-------|
| Files | billing/page.tsx, billing/history/page.tsx, billing/invoice/[id]/page.tsx |
| Issues | Uses shadcn components, likely `text-gray-*` patterns |

### `/app/audit/*` - Audit Pages
| Property | Value |
|----------|-------|
| Files | audit/page.tsx, audit/replay/page.tsx |
| Issues | Uses audit components in `@/components/audit/*` |

---

## Common Anti-Patterns Found

### Background Colors
```
bg-white          → bg-panel (var(--panel-bg))
bg-gray-50        → bg-page (var(--page-bg))
bg-gray-100       → bg-slate-3 or bg-slate-4
```

### Text Colors
```
text-gray-900     → text-text (var(--text)) or text-white-0
text-gray-600     → text-muted (var(--muted)) or text-slate-6
text-gray-500     → text-muted or text-slate-6
```

### Accent Colors
```
bg-blue-600       → bg-brand-iris
text-blue-600     → text-brand-iris or text-brand-cyan
bg-blue-50        → bg-brand-iris/10 (use rgba)
border-blue-500   → border-brand-cyan
```

### Semantic Status Colors
```
bg-green-100 text-green-700    → bg-semantic-success/10 text-semantic-success
bg-yellow-100 text-yellow-700  → bg-semantic-warning/10 text-semantic-warning
bg-red-100 text-red-700        → bg-semantic-danger/10 text-semantic-danger
```

### Border Colors
```
border-gray-200   → border-border-subtle
border-gray-300   → border-border-subtle
```

### Focus States
```
focus:ring-blue-500   → focus:ring-brand-cyan
focus:border-blue-500 → focus:border-brand-cyan
```

---

## Components Directory Scan

### `/components/ui/*` (shadcn base)
These need DS token mapping but are generally wired via CSS variables in globals.css:
- button.tsx
- card.tsx
- input.tsx
- badge.tsx
- tabs.tsx
- select.tsx
- sheet.tsx
- dialog.tsx

### Domain-Specific Components
High priority for DS alignment:
- `/components/executive-command-center/*`
- `/components/executive-digests/*`
- `/components/executive-board-reports/*`
- `/components/unified-narratives/*`
- `/components/media-monitoring/*`
- `/components/pr-generator/*`
- `/components/pr-pitch/*`

---

## Alignment Strategy

### Phase 2 - Core Pillar Pages
1. `/app/page.tsx` (Dashboard)
2. `/app/pr/page.tsx` (PR/Media Explorer)
3. `/app/content/page.tsx` (Content Intelligence)
4. `/app/seo/page.tsx` (SEO Intelligence)
5. `/app/playbooks/page.tsx` (Playbooks)

### Phase 3 - Executive Views
1. `/app/exec/page.tsx` (Command Center)
2. `/app/exec/digests/page.tsx` (Digests)
3. `/app/exec/board-reports/page.tsx` (Board Reports)
4. `/app/unified-narratives/page.tsx` (Unified Narratives)

### Phase 4 - Supporting Pages
- Team, Agents, Billing, Audit, etc.

---

## Notes

- All pages share common issues: light backgrounds, gray/blue hardcoded colors
- Executive views use shadcn components which are partially styled via CSS variables
- Focus states need `ring-brand-cyan` instead of `ring-blue-*`
- Modal overlays should use `bg-slate-0/80` instead of `bg-black/50`
- AI narrative sections need the "AI assistant" visual pattern from DS
