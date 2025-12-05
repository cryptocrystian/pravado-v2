# Pravado Design System v2 — AI‑First Standard

> **Goal** Create a production‑ready, AI‑first design system that embodies Pravado’s brand (executive‑grade, living intelligence), scales across web + mobile, and enforces accessibility, speed, and consistency.

---

## 1) Core Principles

1. **Intelligent Presence** — The UI should feel *alive*: subtle state cues, anticipatory affordances, and legible automation modes.
2. **Operator Clarity** — Information density like a trading terminal, but with crystal hierarchy and safe defaults.
3. **Cohesive Mesh** — Cross‑pillar relationships (PR ↔ Content ↔ SEO) are visible and explorable.
4. **Motion with Meaning** — Every animation telegraphs AI intent (thinking, routing, simulating, deploying). No decorative motion.
5. **Accessible by Default** — WCAG 2.1 AA minimum. Tokens enforce contrast, focus, and motion preferences.

---

## 2) Tokens (Design → Code)

> All tokens ship as CSS variables and Tailwind theme extensions. Dark is default; light auto‑derives.

### 2.1 Color Tokens

**Base Neutrals**

- `--slate-0:#0B0F14` (page)
- `--slate-1:#0F141A` (elev-0)
- `--slate-2:#121923` (elev-1)
- `--slate-3:#16202C` (elev-2)
- `--slate-4:#1D2A39` (elev-3/panels)
- `--slate-5:#2A3A4E` (borders/subtle)
- `--slate-6:#3B4E67` (muted text)
- `--white-0:#EAF2F7` (on‑dark text)

**Brand Accents (cool → warm balance)**

- `--brand-iris:#6A6FF9` (primary)
- `--brand-cyan:#38E1FF` (active/ai)
- `--brand-teal:#21B5C5` (success)
- `--brand-magenta:#D66DFF` (attention)
- `--brand-amber:#FFB65A` (signals/warmth)

**Semantic**

- `--semantic-info:#5AC8FA`
- `--semantic-success:#37D39B`
- `--semantic-warning:#FFC95A`
- `--semantic-danger:#FF6B6B`

**Gradients**

- `--grad-hero:linear-gradient(135deg,#6A6FF9 0%,#38E1FF 50%,#D66DFF 100%)`
- `--grad-warm:linear-gradient(145deg,#6A6FF9 0%,#FFB65A 100%)`

> **Contrast**: All text/background combinations must meet ≥ 4.5:1; large text ≥ 3:1.

### 2.2 Typography

- **Font Family**: `Inter` (fallback `system-ui, -apple-system, Segoe UI, Roboto`)
- **Scale**: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48
- **Line Height**: 1.2 (titles), 1.4 (body), 1.6 (long‑form)
- **Weights**: 400, 500, 600, 700
- **Monospace (metrics)**: `JetBrains Mono` for KPIs & code

### 2.3 Space & Layout

- **Spacing**: 4‑pt base (2 / 4 / 8 / 12 / 16 / 24 / 32 / 48)
- **Radii**: `--radius-xs:6px`, `--radius-sm:10px`, `--radius-md:14px`, `--radius-lg:20px`, `--radius-2xl:24px` (cards/buttons)
- **Shadow/Elevation**
  - `--elev-0: none`
  - `--elev-1: 0 1px 0 rgba(0,0,0,.25)`
  - `--elev-2: 0 6px 16px rgba(0,0,0,.35)`
  - `--elev-3: 0 12px 28px rgba(0,0,0,.45)`
- **Border**: `1px solid rgba(255,255,255,.06)`; focus `2px` brand‑cyan outer ring

### 2.4 Data Viz Palette

- Series: `iris, cyan, magenta, amber, teal, mint, violet`
- Gridlines: `rgba(234,242,247,.08)`; Axis labels: `rgba(234,242,247,.72)`

### 2.5 Motion Tokens

- `--motion-duration-xs: 120ms`
- `--motion-duration-sm: 180ms`
- `--motion-duration-md: 280ms`
- `--motion-duration-lg: 420ms`
- `--motion-ease-standard: cubic-bezier(.2,.8,.2,1)`
- `--motion-ease-emphatic: cubic-bezier(.3,0,.2,1)`
- **Micro‑patterns**
  - *Pulse (AI on)*: opacity 0.8→1.0, scale 0.98→1, 1400ms loop
  - *Thinking shimmer*: 8° diagonal shimmer using `--brand-cyan` 1600ms
  - *Route connect*: thin line draw 280ms with delayed node glow

### 2.6 Z‑Index Scale

- `toast: 60`, `popover: 50`, `modal: 40`, `nav: 30`, `base: 0`

---

## 3) AI Presence & Automation Modes

### 3.1 Agent Presence States

- **Idle**: dot = slate‑6; no motion
- **Analyzing**: dot = brand‑cyan; slow pulse (1.4s)
- **Generating**: dot = iris; shimmer on associated card header
- **Deploying**: dot = amber→cyan gradient; progress bar active
- **Error/Blocked**: dot = danger; shake‑x 120ms once, then still

### 3.2 Automation Modes (AUTOMATE)

- **Recommend** (default): primary buttons = iris; label “Recommend”
- **Simulate** (dry run): outline cyan; label “Simulate” + small spark icon
- **Deploy** (writes/changes): solid cyan; confirmation pattern; progress toast with rollback affordance

### 3.3 SAGE Mesh Visual Language

- **Nodes**: PR / Content / SEO badges
- **Edges**: thin cyan lines; hover reveals effect magnitude (+% CVI, +keywords, +mentions)
- **Micro‑motion**: when executing, animate edges from source node → targets

---

## 4) Components (Spec & Variants)

> Components are typed with **semantic variants** and **density** options. All support light/dark via tokens.

### 4.1 Button

- Variants: `primary`, `secondary`, `tertiary`, `danger`, `ghost`, `link`
- Sizes: `sm(28)`, `md(36)`, `lg(44)`
- Automation Mode Overrides: Recommend/Simulate/Deploy visual treatments (see §3.2)
- Loading: inline spinner + `aria-busy="true"`

### 4.2 Card

- Variants: `default`, `kpi`, `recommendation`, `panel`, `warning`, `success`
- Header: icon slot + meta
- Footer: action bar (right‑aligned primary CTA)

### 4.3 KPI Tile

- Props: `label`, `value`, `delta`, `trend` (up/down/flat)
- Color rules: success/danger for deltas; value in Mono

### 4.4 Recommendation Tile

- Fields: `confidence%`, `category`, `title`, `summary`, `cta`
- Confidence chip colors (≥90 strong cyan, 70‑89 magenta, <70 slate)

### 4.5 Progress & Status

- Progress bar with latency stripe when generating; determinate & indeterminate
- Status badge: `idle | analyzing | generating | deploying | blocked`

### 4.6 Tabs & Segmented Control

- Keyboard focus ring; scrollable overflow with shadow fade

### 4.7 Tables (Match / Opportunities)

- Density: `comfortable | compact`
- Row affordances: hover reveal actions; selection supports multiselect; sticky header; empty state with AI suggestion

### 4.8 Charts

- Line/Bar/Donut using tokens (§2.4). Tooltips large touch targets; legends collapsible

### 4.9 Layout Primitives

- **App Shell**: left nav (72px), content max 1440px, right rail ops panel optional
- **Calendar Rail**: week strip with campaign lanes; drag affordances (ghost = cyan outline)

---

## 5) Accessibility & Performance

- **Contrast**: Token‑enforced, automated lint rule
- **Focus**: 2px outer ring `brand-cyan`; never removed
- **Prefers‑reduced‑motion**: disable shimmer/pulse; substitute color‑only states
- **Keyboard**: tab order defined; skip links; roving tab‑index in menus
- **Axe/Playwright**: CI step required on `/`, `/pricing`, `/onboarding`, `/campaigns`, `/contacts`, `/admin/ops-dashboard`, `/media-opportunities`, `/journalist-matching`, `/analytics/evi`
- **Perf budgets**: FCP < 1.5s, TTI < 3s on mid‑tier laptop; JS first load < 130KB per route

---

## 6) Tailwind & CSS Variables (Implementation)

```css
:root {
  --page-bg: var(--slate-0);
  --panel-bg: var(--slate-2);
  --text: var(--white-0);
  --muted: var(--slate-6);
  --border-subtle: rgba(255,255,255,.06);
  --radius: 20px;
}
[data-theme="dark"] { /* same as default, explicit for clarity */ }
```

```js
// tailwind.config.js
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page-bg)',
        panel: 'var(--panel-bg)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        brand: {
          iris: 'var(--brand-iris)',
          cyan: 'var(--brand-cyan)',
          magenta: 'var(--brand-magenta)',
          amber: 'var(--brand-amber)',
          teal: 'var(--brand-teal)'
        },
        semantic: {
          info: 'var(--semantic-info)',
          success: 'var(--semantic-success)',
          warning: 'var(--semantic-warning)',
          danger: 'var(--semantic-danger)'
        }
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        '2xl': '24px'
      },
      boxShadow: {
        panel: '0 12px 28px rgba(0,0,0,.45)'
      },
      transitionTimingFunction: {
        standard: 'var(--motion-ease-standard)'
      },
      transitionDuration: {
        xs: '120ms', sm: '180ms', md: '280ms', lg: '420ms'
      }
    }
  }
}
```

---

## 7) Example Usage Patterns

### 7.1 AI Presence Dot

```html
<div class="relative inline-flex items-center">
  <span class="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-[pulse_1400ms_ease-in-out_infinite]" aria-label="AI analyzing"></span>
  <span class="ml-2 text-muted">AI Active</span>
</div>
```

### 7.2 Recommendation Card

```html
<div class="bg-panel/70 backdrop-blur border border-[color:var(--border-subtle)] rounded-2xl shadow-panel p-4">
  <div class="flex items-center justify-between">
    <div class="text-sm text-muted">PR Intelligence</div>
    <span class="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan">94% confidence</span>
  </div>
  <h3 class="mt-2 text-lg font-semibold">Critical: LinkedIn post gap detected</h3>
  <p class="mt-1 text-sm text-muted">Missing key decision‑maker touchpoints.</p>
  <div class="mt-4 flex gap-2">
    <button class="btn btn-primary">Recommend</button>
    <button class="btn btn-secondary">Simulate</button>
  </div>
</div>
```

---

## 8) Theming (Light / Dark)

- Dark is authoritative default. Light uses same tokens with lighter neutrals (`#F7FAFD` backgrounds, text `#0B0F14`).
- Ensure brand accents retain contrast in light mode (especially cyan).

---

## 9) Page‑Level Layout Guidance

- **Command Center (default)**: 3 columns — Left: Priority & Actions; Middle: Campaign Calendar + Hero lanes; Right: AI Ops & Logs
- **Analytics**: 2 columns — Left: KPIs + Trends; Right: Drilldown panels
- **Onboarding**: Single column wizard; clear progress; AI hints in right rail

---

## 10) QA Checklist (Ship Gate)

1. A11y axe suite passes on 9 routes
2. Prefers‑reduced‑motion checked on at least 3 interaction patterns
3. Contrast report ≥ 4.5:1 for all text
4. FCP < 1.5s; route JS < 130KB
5. Tokens consumed in 100% of components (no hardcoded hex)
6. Automation mode visuals consistent across all CTAs
7. AI presence states reflected in Ops panel & recommendations

---

## 11) Handoff Notes

- This document is the **canonical source** for Pravado visual tokens, motion, and components.
- No external research required; all values here are approved baselines.
- Use this with the UX Pilot reference and the Command Center HTML to finalize components.

---

## 12) Roadmap to v2.1

- Add **mesh mini‑graph micro‑viz** on tiles
- Component docs site (Storybook) with motion demos
- Token plug‑in export for Figma
- iOS/Android theme packs (RN)

