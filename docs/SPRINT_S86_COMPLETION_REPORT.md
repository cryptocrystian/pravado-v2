# Sprint S86 - Visual QA, Screenshot Suite & UX Polish

> **Completed**: December 8, 2025
> **Sprint Focus**: Visual QA documentation, screenshot guidelines, and UX polish for high-impact pages

---

## Summary

Sprint S86 focused on creating visual quality assurance documentation and polishing the UI/UX of high-impact pages. This sprint builds on the DS v2 enforcement work from S84-S85 by providing practical tools for visual inspection and establishing patterns for consistent screenshot capture.

---

## Deliverables

### 1. Documentation Created

#### Visual QA Checklist (`docs/S86_VISUAL_QA_CHECKLIST.md`)
A comprehensive, checklist-style document for visual inspection of the live app at https://pravado-dashboard.vercel.app.

**Contents:**
- Pre-QA setup instructions
- Global shell & navigation checks
- Authentication flow verification
- Core pillar page checks (PR, Content, SEO, Playbooks, Agents, Team)
- Executive suite verification
- Scenario & Simulation suite checks
- Common pattern verification (buttons, inputs, cards, empty/loading states)
- Error page checks
- Responsive breakpoint verification
- Accessibility quick checks
- Issue tracking template
- DS v2 quick reference

#### Screenshot Guide (`docs/S86_SCREENSHOT_GUIDE.md`)
A standardized guide for capturing consistent, high-quality screenshots.

**Contents:**
- Environment setup (browser, viewport, system settings)
- Naming convention with section and state codes
- Required screenshot list (34 priority screenshots)
- Capture techniques for full page, element, and animation shots
- Post-processing and optimization guidelines
- Demo data requirements
- Tools and resources recommendations

---

### 2. Legacy Class Audit

Scanned the dashboard codebase for remaining legacy Tailwind classes:

| Pattern | Files Found |
|---------|-------------|
| `bg-gray-*`, `text-gray-*`, `border-gray-*` | 278 files |
| `bg-white`, `bg-black` | 161 files |
| `bg-indigo-*`, `text-indigo-*` | 71 files |
| `bg-purple-*`, `text-purple-*` | 106 files |
| `bg-blue-*`, `text-blue-*` | 217 files |

**Note**: Most of these are in component library files, nested feature pages, and API library files. The main pillar pages were addressed in S85.

---

### 3. Pages Polished (DS v2 Enforcement)

#### Agents Page (`/app/app/agents/page.tsx`)
| Section | Changes |
|---------|---------|
| Page Header | `text-gray-900` → `text-white-0`, `text-gray-600` → `text-muted` |
| Coming Soon Banner | `bg-amber-50 border-amber-200` → `bg-brand-amber/10 border-brand-amber/20`, text colors updated to `text-brand-amber` variants |
| PR Agents | `bg-white shadow` → `panel-card`, `text-gray-900` → `text-white-0`, `bg-blue-100 text-blue-700` → `bg-brand-cyan/10 text-brand-cyan` |
| Content Agents | Same pattern, capabilities badges use `bg-brand-iris/10 text-brand-iris` |
| SEO Agents | Capabilities badges use `bg-semantic-success/10 text-semantic-success` |
| General Agents | Capabilities badges use `bg-slate-5 text-slate-6` |

#### Billing Page (`/app/app/billing/page.tsx`)
| Section | Changes |
|---------|---------|
| Loading State | Spinner `border-gray-900` → `border-brand-cyan`, text `text-gray-600` → `text-muted` |
| Error State | `bg-red-50 border-red-200 text-red-700` → `alert-error` |
| Page Header | `text-gray-600` → `text-muted`, added `text-white-0` for heading |
| Alerts Panel | `bg-white shadow` → `panel-card`, alert severities use semantic colors |
| Current Plan Card | `bg-white shadow` → `panel-card`, status badges use semantic colors |
| Usage Tracking | `bg-white shadow` → `panel-card`, border uses `border-border-subtle` |
| Plan Selection | Headings use `text-white-0`, descriptions use `text-muted` |
| Billing History CTA | `bg-gray-50 border-gray-200` → `panel-card`, button uses `btn-primary` |

---

## Build Verification

| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | Passed |
| No new TypeScript errors introduced | Verified |

---

## Files Modified

### Documentation
- `docs/S86_VISUAL_QA_CHECKLIST.md` (created)
- `docs/S86_SCREENSHOT_GUIDE.md` (created)
- `docs/SPRINT_S86_COMPLETION_REPORT.md` (this file)

### Dashboard Pages
- `apps/dashboard/src/app/app/agents/page.tsx` (DS v2 polish)
- `apps/dashboard/src/app/app/billing/page.tsx` (DS v2 polish)

---

## DS v2 Token Mappings Applied

### Color Replacements (This Sprint)
| Legacy Class | DS v2 Replacement |
|--------------|-------------------|
| `border-gray-900` | `border-brand-cyan` (spinners) |
| `bg-amber-50 border-amber-200` | `bg-brand-amber/10 border-brand-amber/20` |
| `text-amber-900/800/700` | `text-brand-amber` variants |
| `bg-blue-100 text-blue-700` | `bg-brand-cyan/10 text-brand-cyan` |
| `bg-purple-100 text-purple-700` | `bg-brand-iris/10 text-brand-iris` |
| `bg-green-100 text-green-700` | `bg-semantic-success/10 text-semantic-success` |
| `bg-gray-100 text-gray-700` | `bg-slate-5 text-slate-6` |
| `bg-green-100 text-green-800` | `bg-semantic-success/10 text-semantic-success` |
| `bg-blue-100 text-blue-800` | `bg-brand-cyan/10 text-brand-cyan` |
| `bg-red-100 text-red-800` | `bg-semantic-danger/10 text-semantic-danger` |
| `border-gray-200` | `border-border-subtle` |

---

## Remaining Work (Future Sprints)

### Recommended Next Steps

1. **Component Library DS v2 Pass**
   - Update shared components in `/components/ui/` and feature-specific components
   - High-priority: dialog.tsx, sheet.tsx, dropdown-menu.tsx

2. **Nested Feature Pages**
   - PR sub-pages (discovery, enrichment, pitches, outreach)
   - Billing history and invoice pages
   - Playbook editor components
   - Media monitoring sub-pages

3. **Visual Regression Testing**
   - Implement Playwright visual regression tests using screenshot guide
   - Create baseline screenshots for critical paths

4. **Storybook Documentation**
   - Document DS v2 patterns in Storybook
   - Create component showcase with all variants

---

## Reference to Previous Sprints

| Sprint | Focus |
|--------|-------|
| S83 | Initial pillar page inventory and DS v2 planning |
| S84 | Auth flow and app shell DS v2 enforcement |
| S85 | Feature dashboard DS v2 enforcement |
| S86 | Visual QA documentation and UX polish (this sprint) |

---

## Notes

1. **Legacy Class Scope**: Many legacy classes remain in component library files (shadcn/ui components) and feature-specific components. These are lower priority as they follow shadcn's theming system which respects DS v2 CSS variables.

2. **Screenshot Automation**: The screenshot guide is designed to support future automation with Playwright. The naming conventions and required shots are structured for programmatic capture.

3. **QA Checklist Usage**: The visual QA checklist should be used during:
   - Pre-deployment verification
   - Post-sprint visual regression checks
   - Onboarding new team members to visual standards

4. **Brand Color Assignment Consistency**:
   - PR Agents: brand-cyan
   - Content Agents: brand-iris
   - SEO Agents: semantic-success (green)
   - General Agents: slate tones
