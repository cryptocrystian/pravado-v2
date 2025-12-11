# Sprint S85 - Design System v2 Enforcement (Feature Dashboards)

> **Completed**: December 8, 2025
> **Sprint Focus**: DS v2 Enforcement for ALL remaining pillar pages and feature dashboards

---

## Summary

Sprint S85 completed the Design System v2 enforcement across all major pillar pages and feature dashboards in the Pravado dashboard application. This sprint established visual consistency across the entire application, following the AI-first, premium aesthetic defined in the Pravado Design System v2.

---

## Scope

### Pages Updated

#### Scenario & Simulation Suite
| File | Changes Applied |
|------|-----------------|
| `/app/app/scenarios/page.tsx` | bg-page, panel-card, text-white-0, text-muted, btn-primary, btn-secondary, tab styling with brand-cyan, modal overlay with bg-slate-0/80, brand color icons |
| `/app/app/scenarios/simulations/page.tsx` | bg-page, panel-card, text-white-0, text-muted, StatCard with DS v2 tokens, brand-iris info section |
| `/app/app/scenarios/orchestrations/page.tsx` | bg-page, panel-card, alert-error, input-field, btn-primary, btn-ghost, loading spinner with brand-cyan, modal overlays |

#### Reality & Conflicts
| File | Changes Applied |
|------|-----------------|
| `/app/app/reality-maps/page.tsx` | bg-page, panel-card, text-white-0, text-muted, input-field, btn-primary, btn-ghost, tabs with brand-cyan, modal overlays, semantic-danger delete button |
| `/app/app/insight-conflicts/page.tsx` | bg-page, panel-card, text-white-0, text-muted, alert-error, btn-ghost, tabs with brand-cyan, modal overlays, brand-iris batch actions |

#### Risk Management
| File | Changes Applied |
|------|-----------------|
| `/app/app/risk-radar/page.tsx` | bg-page, bg-slate-1 header, text-white-0, text-muted, brand-magenta icon, semantic-danger/warning/success risk colors, slate-6 icons |

#### Executive Module
| File | Changes Applied |
|------|-----------------|
| `/app/app/exec/page.tsx` | Already DS v2 compliant (brand-iris, text-white-0, alert-error, semantic colors) |
| `/app/app/exec/investors/page.tsx` | text-white-0, text-muted, alert-error, brand-cyan loader, brand-teal accent, semantic-success/warning stat cards |

#### Core GTM Pillars
| File | Changes Applied |
|------|-----------------|
| `/app/app/pr/page.tsx` | bg-page, panel-card, text-white-0, text-muted, input-field, btn-primary, brand-cyan selections, brand-iris badges, semantic-danger remove buttons |
| `/app/app/content/page.tsx` | bg-page, bg-slate-1, text-white-0, text-muted, input-field, border-border-subtle |

---

## Token Mappings Applied

### Color Replacements
| Legacy Class | DS v2 Replacement |
|--------------|-------------------|
| `bg-gray-50` | `bg-page` |
| `bg-white` | `panel-card` class or `bg-slate-1` |
| `text-gray-900` | `text-white-0` |
| `text-gray-600`, `text-gray-500` | `text-muted` |
| `text-gray-400`, `text-gray-300` | `text-slate-6` |
| `border-gray-200`, `border-gray-300` | `border-border-subtle` |
| `bg-blue-600`, `hover:bg-blue-700` | `btn-primary` class |
| `bg-indigo-600` | `bg-brand-iris` or `btn-primary` |
| `text-indigo-600` | `text-brand-cyan` or `text-brand-iris` |
| `bg-purple-100 text-purple-700` | `bg-brand-iris/10 text-brand-iris` |
| `bg-blue-50 border-blue-200` | `bg-brand-cyan/10 border-brand-cyan/20` |
| `bg-red-50 border-red-200 text-red-700` | `alert-error` class |
| `text-red-600` | `text-semantic-danger` |
| `bg-green-50 text-green-600` | `bg-semantic-success/10 text-semantic-success` |
| `bg-yellow-50 text-yellow-600` | `bg-semantic-warning/10 text-semantic-warning` |
| `bg-black bg-opacity-50` | `bg-slate-0/80` |
| `focus:ring-blue-500` | `focus:ring-brand-cyan` |

### Component Class Usage
| Scenario | DS v2 Class |
|----------|-------------|
| Primary action button | `btn-primary` |
| Secondary/Ghost button | `btn-secondary`, `btn-ghost` |
| Form inputs | `input-field` |
| Dashboard panels | `panel-card` |
| Error alerts | `alert-error` |
| Active tabs | `border-brand-cyan text-brand-cyan` |
| Modal overlays | `bg-slate-0/80` |

---

## Design Patterns Established

### Page Background Pattern
```tsx
<div className="min-h-screen bg-page">
  {/* Header with slate-1 background */}
  <div className="bg-slate-1 border-b border-border-subtle px-6 py-4">
    <h1 className="text-2xl font-bold text-white-0">Page Title</h1>
    <p className="text-sm text-muted">Description text</p>
  </div>
  {/* Content */}
</div>
```

### Tab Navigation Pattern
```tsx
<button
  className={`px-4 py-2 text-sm font-medium border-b-2 ${
    isActive
      ? 'border-brand-cyan text-brand-cyan'
      : 'border-transparent text-slate-6 hover:text-white-0'
  }`}
>
  Tab Label
</button>
```

### Modal Overlay Pattern
```tsx
<div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
  <div className="panel-card p-6 max-w-md w-full">
    <h3 className="text-lg font-semibold text-white-0 mb-4">Modal Title</h3>
    {/* Content */}
    <div className="flex gap-3">
      <button className="btn-ghost flex-1">Cancel</button>
      <button className="btn-primary flex-1">Confirm</button>
    </div>
  </div>
</div>
```

### Stat Card Pattern
```tsx
<div className="panel-card p-4">
  <p className="text-sm font-medium text-muted">Label</p>
  <p className="text-2xl font-bold text-white-0 mt-1">Value</p>
  <p className="text-xs text-slate-6 mt-1">Description</p>
</div>
```

---

## Build Verification

| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | Passed |
| Next.js lint | Passed (pre-existing import order issues only) |
| DS v2 tokens applied | Verified |
| No hardcoded grays in updated files | Verified |

---

## Files Modified

### Scenario & Simulation
- `apps/dashboard/src/app/app/scenarios/page.tsx`
- `apps/dashboard/src/app/app/scenarios/simulations/page.tsx`
- `apps/dashboard/src/app/app/scenarios/orchestrations/page.tsx`

### Reality & Conflicts
- `apps/dashboard/src/app/app/reality-maps/page.tsx`
- `apps/dashboard/src/app/app/insight-conflicts/page.tsx`

### Risk Management
- `apps/dashboard/src/app/app/risk-radar/page.tsx`

### Executive Module
- `apps/dashboard/src/app/app/exec/investors/page.tsx`

### Core GTM Pillars
- `apps/dashboard/src/app/app/pr/page.tsx`
- `apps/dashboard/src/app/app/content/page.tsx`

### Documentation
- `docs/DESIGN_SYSTEM_ALIGNMENT_S85.md` (this file)

---

## Pre-Existing Compliant Files

The following files were already DS v2 compliant (no changes needed):
- `apps/dashboard/src/app/app/exec/page.tsx` - Uses brand-iris, text-white-0, alert-error, semantic colors
- `apps/dashboard/src/app/app/exec/strategy/page.tsx` - Uses shadcn components with DS v2 theming

---

## Reference to Previous Sprints

- **S83**: Initial pillar page inventory and DS v2 planning
- **S84**: Auth flow and app shell DS v2 enforcement (login, callback, onboarding, layout, error pages)
- **S85**: Complete feature dashboard DS v2 enforcement (this sprint)

---

## Notes

1. **Semantic Colors for Status**: Risk levels use semantic-danger (critical), brand-amber (high), semantic-warning (medium), semantic-success (low)

2. **Brand Color Assignment**:
   - Investor Relations: brand-teal
   - Risk Radar: brand-magenta
   - Scenarios/Playbooks: brand-cyan/brand-iris
   - PR/Media: brand-cyan
   - Content: brand-iris

3. **Modal Overlays**: All modals use `bg-slate-0/80` for the backdrop

4. **Input Styling**: All form inputs use the `input-field` class for consistent dark-mode styling

5. **Button Hierarchy**: Primary actions use `btn-primary`, secondary/cancel use `btn-ghost` or `btn-secondary`

---

## Remaining Work (Future Sprints)

1. Update remaining component library internals for DS v2
2. Add visual regression tests for DS v2 compliance
3. Update any remaining nested pages and detail views
4. Create Storybook documentation for DS v2 patterns
