# Pravado Visual QA Checklist

> **Sprint S86 - Visual QA, Screenshot Suite & UX Polish**
> **Live App**: https://pravado-dashboard.vercel.app
> **Last Updated**: December 8, 2025

---

## Pre-QA Setup

- [ ] **Browser**: Use Chrome (latest) with DevTools available
- [ ] **Viewport**: Start at 1440x900 (standard laptop), then test 1920x1080 (desktop)
- [ ] **Dark Mode**: Confirm system is in dark mode (DS v2 is dark-mode first)
- [ ] **Login**: Authenticate and ensure session is active
- [ ] **Console**: Keep DevTools Console open to catch runtime errors

---

## 1. Global Shell & Navigation

### App Layout (`/app/layout.tsx`)
| Check | Pass | Notes |
|-------|------|-------|
| Sidebar background is `bg-slate-1` (dark charcoal) | [ ] | |
| Sidebar text uses `text-white-0` for active, `text-muted` for inactive | [ ] | |
| Active nav item has `bg-brand-cyan/10` or visible highlight | [ ] | |
| Logo renders correctly (no broken image) | [ ] | |
| Collapse/expand animation is smooth | [ ] | |

### Top Bar / Header
| Check | Pass | Notes |
|-------|------|-------|
| Background uses `bg-slate-1` or `bg-page` | [ ] | |
| User avatar/dropdown renders | [ ] | |
| Org switcher (if visible) uses DS v2 styling | [ ] | |

---

## 2. Authentication Flow

### Login Page (`/login`)
| Check | Pass | Notes |
|-------|------|-------|
| Background is gradient/dark pattern (not plain white) | [ ] | |
| Login card uses `auth-card` styling | [ ] | |
| "Sign in with Microsoft" button has correct branding | [ ] | |
| Loading state shows spinner with `text-brand-cyan` | [ ] | |
| Error messages use `alert-error` class | [ ] | |

### Callback (`/callback`)
| Check | Pass | Notes |
|-------|------|-------|
| Shows loading spinner during auth processing | [ ] | |
| Spinner color is `brand-cyan` | [ ] | |
| Redirects to `/app` on success | [ ] | |

### Onboarding (`/onboarding`)
| Check | Pass | Notes |
|-------|------|-------|
| Background matches login aesthetic | [ ] | |
| Form inputs use `input-field` class | [ ] | |
| Primary button uses `btn-primary` | [ ] | |
| Step indicators use DS v2 colors | [ ] | |

---

## 3. Dashboard Home (`/app`)

| Check | Pass | Notes |
|-------|------|-------|
| Page background is `bg-page` | [ ] | |
| Welcome/hero section uses `text-white-0` for headings | [ ] | |
| Cards use `panel-card` styling | [ ] | |
| Quick action buttons use `btn-primary` or `btn-ghost` | [ ] | |
| No stray gray backgrounds (should be slate tones) | [ ] | |

---

## 4. Core Pillar Pages

### PR Intelligence (`/app/pr`)
| Check | Pass | Notes |
|-------|------|-------|
| Header text is `text-white-0` | [ ] | |
| Search input uses `input-field` | [ ] | |
| Filter dropdowns use `input-field` | [ ] | |
| Selected journalists highlight with `border-brand-cyan` | [ ] | |
| Lists panel uses `panel-card` | [ ] | |
| "Create List" button is `btn-primary` | [ ] | |
| Modal overlay is `bg-slate-0/80` | [ ] | |
| Empty state text uses `text-muted` | [ ] | |

### Content Hub (`/app/content`)
| Check | Pass | Notes |
|-------|------|-------|
| Header background is `bg-slate-1` | [ ] | |
| Content list items have proper spacing | [ ] | |
| Status badges use semantic colors | [ ] | |
| Search input uses `input-field` | [ ] | |

### SEO (`/app/seo`)
| Check | Pass | Notes |
|-------|------|-------|
| Page uses `bg-page` background | [ ] | |
| Cards use `panel-card` | [ ] | |
| Tab styling matches DS v2 (active: `border-brand-cyan`) | [ ] | |

### Playbooks (`/app/playbooks`)
| Check | Pass | Notes |
|-------|------|-------|
| List view uses `panel-card` for items | [ ] | |
| Status badges use semantic colors | [ ] | |
| "Create Playbook" button is `btn-primary` | [ ] | |
| Empty state has proper illustration/messaging | [ ] | |

### Agents (`/app/agents`)
| Check | Pass | Notes |
|-------|------|-------|
| Agent cards use `panel-card` | [ ] | |
| Status indicators use semantic colors | [ ] | |
| Headers use `text-white-0` | [ ] | |

### Team (`/app/team`)
| Check | Pass | Notes |
|-------|------|-------|
| Member list items styled correctly | [ ] | |
| Invite button uses `btn-primary` | [ ] | |
| Role badges use appropriate colors | [ ] | |

---

## 5. Executive Suite

### Executive Dashboard (`/app/exec`)
| Check | Pass | Notes |
|-------|------|-------|
| Brand color is `brand-iris` for accents | [ ] | |
| KPI cards use `panel-card` | [ ] | |
| Charts render without errors | [ ] | |

### Investor Relations (`/app/exec/investors`)
| Check | Pass | Notes |
|-------|------|-------|
| Stats cards use semantic colors (`semantic-success`, `semantic-warning`) | [ ] | |
| Accent color is `brand-teal` | [ ] | |
| Loader is `brand-cyan` | [ ] | |
| Error states use `alert-error` | [ ] | |

### Strategy (`/app/exec/strategy`)
| Check | Pass | Notes |
|-------|------|-------|
| Uses shadcn components with DS v2 theming | [ ] | |
| Cards render correctly | [ ] | |

---

## 6. Scenario & Simulation Suite

### Scenarios (`/app/scenarios`)
| Check | Pass | Notes |
|-------|------|-------|
| Tab styling: active is `border-brand-cyan text-brand-cyan` | [ ] | |
| Inactive tabs are `text-slate-6` | [ ] | |
| Modal overlays use `bg-slate-0/80` | [ ] | |
| Create button is `btn-primary` | [ ] | |

### Simulations (`/app/scenarios/simulations`)
| Check | Pass | Notes |
|-------|------|-------|
| StatCards use DS v2 tokens | [ ] | |
| Info section uses `brand-iris` | [ ] | |
| Loading states have proper spinners | [ ] | |

### Orchestrations (`/app/scenarios/orchestrations`)
| Check | Pass | Notes |
|-------|------|-------|
| Suite cards use `panel-card` | [ ] | |
| Loading spinner is `brand-cyan` | [ ] | |
| Alert errors use `alert-error` | [ ] | |
| Input fields use `input-field` | [ ] | |

---

## 7. Reality & Conflicts

### Reality Maps (`/app/reality-maps`)
| Check | Pass | Notes |
|-------|------|-------|
| Background is `bg-page` | [ ] | |
| Cards use `panel-card` | [ ] | |
| Tabs follow DS v2 tab pattern | [ ] | |
| Delete buttons use `semantic-danger` | [ ] | |
| Modal overlays correct | [ ] | |

### Insight Conflicts (`/app/insight-conflicts`)
| Check | Pass | Notes |
|-------|------|-------|
| Filter bar styled correctly | [ ] | |
| Conflict cards use `panel-card` | [ ] | |
| Batch action buttons use `brand-iris` | [ ] | |
| Resolution modal styled correctly | [ ] | |

---

## 8. Risk Management

### Risk Radar (`/app/risk-radar`)
| Check | Pass | Notes |
|-------|------|-------|
| Header uses `bg-slate-1` | [ ] | |
| Icon uses `brand-magenta` | [ ] | |
| Risk levels use semantic colors: | | |
| - Critical: `semantic-danger` | [ ] | |
| - High: `brand-amber` | [ ] | |
| - Medium: `semantic-warning` | [ ] | |
| - Low: `semantic-success` | [ ] | |
| Muted icons use `text-slate-6` | [ ] | |

---

## 9. Common Patterns

### Buttons
| Check | Pass | Notes |
|-------|------|-------|
| Primary actions use `btn-primary` (brand-cyan bg) | [ ] | |
| Secondary/cancel use `btn-ghost` or `btn-secondary` | [ ] | |
| Disabled states show reduced opacity | [ ] | |
| Hover states are visible | [ ] | |

### Form Inputs
| Check | Pass | Notes |
|-------|------|-------|
| All inputs use `input-field` class | [ ] | |
| Placeholder text is readable | [ ] | |
| Focus ring is `brand-cyan` | [ ] | |
| Error states show red border | [ ] | |

### Cards/Panels
| Check | Pass | Notes |
|-------|------|-------|
| Use `panel-card` class (rounded, border-subtle, bg-slate-1) | [ ] | |
| Consistent border-radius (0.5rem / rounded-lg) | [ ] | |
| Proper padding (p-4 or p-6) | [ ] | |

### Empty States
| Check | Pass | Notes |
|-------|------|-------|
| Icon uses `text-slate-6` | [ ] | |
| Heading uses `text-white-0` | [ ] | |
| Description uses `text-muted` | [ ] | |
| CTA button present and styled correctly | [ ] | |

### Loading States
| Check | Pass | Notes |
|-------|------|-------|
| Spinner/loader uses `brand-cyan` | [ ] | |
| Loading text uses `text-muted` | [ ] | |
| Skeleton screens (if any) use slate tones | [ ] | |

### Error States
| Check | Pass | Notes |
|-------|------|-------|
| Use `alert-error` class | [ ] | |
| Red border and background visible | [ ] | |
| Dismiss/retry button present | [ ] | |

### Modals
| Check | Pass | Notes |
|-------|------|-------|
| Backdrop is `bg-slate-0/80` | [ ] | |
| Modal content uses `panel-card` styling | [ ] | |
| Close/cancel button present | [ ] | |
| Primary action button is `btn-primary` | [ ] | |

---

## 10. Error Pages

### 404 Not Found (`/not-found`)
| Check | Pass | Notes |
|-------|------|-------|
| Background matches app theme | [ ] | |
| "Go Home" button is styled correctly | [ ] | |

### Global Error (`/error`)
| Check | Pass | Notes |
|-------|------|-------|
| Error message is visible | [ ] | |
| "Try Again" button present | [ ] | |
| Uses DS v2 color tokens | [ ] | |

---

## 11. Responsive Checks

### Mobile Breakpoint (375px width)
| Check | Pass | Notes |
|-------|------|-------|
| Sidebar collapses to hamburger menu | [ ] | |
| Cards stack vertically | [ ] | |
| Text remains readable | [ ] | |
| Buttons are touch-friendly (min 44px) | [ ] | |

### Tablet Breakpoint (768px width)
| Check | Pass | Notes |
|-------|------|-------|
| Two-column layouts adjust | [ ] | |
| Navigation adapts | [ ] | |

---

## 12. Accessibility Quick Checks

| Check | Pass | Notes |
|-------|------|-------|
| Focus indicators visible on all interactive elements | [ ] | |
| Color contrast meets WCAG AA (check with DevTools) | [ ] | |
| No text below 12px font size | [ ] | |
| Buttons have discernible text or aria-label | [ ] | |

---

## QA Sign-Off

| Reviewer | Date | Pass/Fail | Critical Issues |
|----------|------|-----------|-----------------|
| | | | |
| | | | |

---

## Issue Tracking Template

```markdown
### Issue: [Brief Description]
- **Page**: [URL path]
- **Element**: [Button/Card/Input/etc.]
- **Expected**: [What should happen]
- **Actual**: [What is happening]
- **Screenshot**: [Link or attachment]
- **Severity**: Critical / High / Medium / Low
```

---

## DS v2 Quick Reference

### Color Tokens
- `bg-page` - Main page background
- `bg-slate-1` - Card/panel backgrounds
- `text-white-0` - Primary text (headings)
- `text-muted` - Secondary text
- `text-slate-6` - Tertiary/disabled text
- `border-border-subtle` - Subtle borders
- `brand-cyan` - Primary actions
- `brand-iris` - Secondary accent
- `brand-teal` - Investor/finance
- `brand-magenta` - Risk/alerts
- `semantic-danger` - Errors/critical
- `semantic-warning` - Warnings/medium risk
- `semantic-success` - Success/low risk

### Component Classes
- `panel-card` - Standard card styling
- `btn-primary` - Primary action button
- `btn-secondary` - Secondary button
- `btn-ghost` - Ghost/text button
- `input-field` - Form input styling
- `alert-error` - Error alert box
- `auth-card` - Auth page card
