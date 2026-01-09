# Command Center UI Implementation

Version: v1.0 (Sprint 2)
Status: Hollow Implementation (MSW-backed)

## Overview

The Command Center is the AI-first operational hub for PRAVADO. It provides a tri-pane layout for monitoring, deciding, and acting on AI-generated proposals across PR, Content, and SEO pillars.

## Architecture

### Route
```
/app/command-center
```

### Data Sources
During hollow development, all data is served via MSW (Mock Service Worker) handlers:
- `GET /api/command-center/action-stream`
- `GET /api/command-center/intelligence-canvas`
- `GET /api/command-center/strategy-panel`
- `GET /api/command-center/orchestration-calendar`

Contract examples are the single source of truth:
- `/contracts/examples/action-stream.json`
- `/contracts/examples/intelligence-canvas.json`
- `/contracts/examples/strategy-panel.json`
- `/contracts/examples/orchestration-calendar.json`

## Tri-Pane Layout

### Left Pane: Action Stream
**Component:** `ActionStreamPane`

Displays prioritized AI proposals and tasks. Each action card shows:
- Pillar chip (PR/Content/SEO)
- Priority indicator (Critical/High/Medium/Low)
- Title and summary
- Confidence and Impact meters
- Gate warnings (approval required, plan limits)
- Mode badge (Autopilot/Copilot/Manual)
- Primary and Secondary CTAs

**Interaction:** Clicking a card opens the Peek Drawer with full details.

### Center Pane: Intelligence Canvas
**Component:** `IntelligenceCanvasPane`

Displays the knowledge graph and citation feed:
- Node list by kind (AI Models, Journalists, Topics, Competitors)
- Citation feed with platform badges (ChatGPT, Perplexity, Claude, Gemini)
- Graph visualization placeholder

**Interaction:** Clicking a node enters "focus mode" showing related connections in the graph placeholder area. Click "Clear focus" or another node to exit.

### Right Pane: Strategy Panel
**Component:** `StrategyPanelPane`

Displays strategic intelligence:
- KPIs with sparklines (EVI, Share of Model, Citation Velocity, etc.)
- AI-generated narratives with sentiment indicators
- Prioritized recommendations with effort/impact ratings
- Upgrade hooks (blurred insights, locked features)

### Calendar Widget
**Component:** `CalendarPeek`

Positioned at the bottom of the center pane, shows:
- Next 5 upcoming orchestration items
- Pillar and status badges
- Mode indicators
- "View Full Calendar" link to `/app/calendar`

## Interaction Patterns

### 1. Peek Drawer
**Component:** `ActionPeekDrawer`

A right-side sheet that opens when clicking an action card:
- Full action details (title, summary, badges)
- Confidence and Impact meters with tick marks
- Gate warnings with plan requirements
- Diff/Details placeholder area
- Primary and Secondary CTA buttons
- Keyboard accessible (Escape to close, Tab for navigation)

### 2. Node Focus (Intelligence Canvas)
Clicking a node in the Intelligence Canvas:
- Highlights the selected node with pillar glow
- Updates the graph placeholder to show connections
- Displays related edge labels and target nodes
- Click "Clear focus" or another node to deselect

### 3. Pillar Accent System
**File:** `pillar-accents.ts`

Consistent visual language for PR/Content/SEO:
```typescript
pillarAccents: {
  pr: {
    bg: 'bg-brand-magenta/10',
    text: 'text-brand-magenta',
    border: 'border-brand-magenta/30',
    glow: 'shadow-[0_0_12px_rgba(232,121,249,0.15)]',
  },
  content: { /* brand-iris */ },
  seo: { /* brand-cyan */ },
}
```

## DS v3.1 Styling

### Surface Tokens
- Page background: `#0A0A0F`
- Card background: `#13131A`
- Card elevated: `#1A1A24`
- Border default: `#1F1F28`
- Border hover: `#2A2A36`

### Glow Effects
- Pillar glows on hover/focus
- 12px blur radius with 15% opacity
- Colors match pillar accent system

### Typography
- Section headers: `text-xs font-semibold uppercase tracking-wide`
- Card titles: `text-sm font-medium`
- Body text: `text-xs` with `text-white/50`
- Metrics: `text-[10px] uppercase tracking-wide`

## Topbar Structure Rules

### Layout Grouping (v2.0)
The Command Center topbar follows a specific grouping hierarchy:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo ●]  [Org ▼]  │  [Command Center] [PR] [Content] [SEO] ...  │  [Ask Pravado… ⌘K]  │  [AI●] [chips] [🔔] [👤▼] │
│   LEFT CLUSTER     │          MIDDLE CLUSTER (NAV)               │   OMNI-TRAY        │    RIGHT CLUSTER          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Left Cluster:**
- Pravado wordmark with gradient text
- AI status dot (animated pulse, cyan glow)
- Org selector (compact variant)

**Middle Cluster (PROMINENT):**
- Surface navigation tabs
- Primary navigation anchor for the entire app
- Active state: `bg-brand-cyan/12 + border + glow + underline`
- Inactive state: `text-white/70 hover:text-white`

**Center-Right:**
- Omni-Tray trigger (ONLY search-like affordance)
- Chat icon, NOT magnifying glass
- "Ask Pravado…" placeholder text
- Keyboard shortcut hint (⌘K)

**Right Cluster:**
- AI Active indicator pill
- Context toggle chips (Media Monitoring, Content Quality)
- Notifications bell with badge
- User avatar + dropdown

### Navigation Prominence Rules
- Nav items use `text-sm` font size (NOT text-xs)
- Inactive text: `text-white/70` (lighter than body text)
- Active state includes:
  - Background: `bg-brand-cyan/12`
  - Border: `border-brand-cyan/25`
  - Glow: `shadow-[0_0_14px_rgba(0,217,255,0.18)]`
  - Underline: `h-[2px] bg-brand-cyan` with glow
- Consistent `gap-1` spacing between nav items

### Single Search Rule
**CRITICAL:** The Omni-Tray trigger is the ONLY search-like element.
- Do NOT add additional search inputs
- Do NOT add magnifying glass icons elsewhere
- The chat bubble icon differentiates it from traditional search

## Typography + Contrast Rules

### Typography Intent System
Use semantic text intent helpers from `text-intents.ts`:

| Intent | Class | Use Case |
|--------|-------|----------|
| `titlePrimary` | `text-sm font-semibold text-white/90` | Card titles |
| `bodyPrimary` | `text-sm text-white/85` | Main content |
| `bodySecondary` | `text-xs text-white/70` | Descriptions |
| `mutedPrimary` | `text-xs text-white/55` | Helper text |
| `microText` | `text-[11px] text-white/55` | Timestamps, badges |

### Contrast Token Rules (ENFORCED BY CI v2.0)
No `text-slate-*`, `text-gray-*`, `text-neutral-*`, `text-zinc-*` tokens in Command Center scope.

**Opacity Minimums:**
| Text Type | Minimum Opacity | Example |
|-----------|-----------------|---------|
| Title/Primary | `white/70` | Card titles, headings |
| Body/Secondary | `white/55` | Descriptions, summaries |
| Muted/Tertiary | `white/50` | Secondary labels |
| Micro/Timestamps | `white/35` | Requires `typography-allow:` comment |

**Allowed text tokens:**
- Primary labels: `text-white/90`, `text-white/85`
- Secondary labels: `text-white/70`, `text-white/65`
- Muted/tertiary: `text-white/55`, `text-white/50`
- Micro/subtle: `text-white/45`, `text-white/40`, `text-white/35` (with allowlist)
- Brand accents: `text-brand-cyan`, `text-brand-iris`, `text-brand-magenta`
- Semantic: `text-semantic-danger`, `text-semantic-warning`, `text-semantic-success`

**Allowlist Comments:**
- `contrast-allow:` - For forbidden color tokens
- `typography-allow: micro` - For low-opacity micro text

## Calendar Interaction Rules

### Outlook-Like Contract (v3.0)
**CRITICAL**: Container height is FIXED at `h-[280px]` - DOES NOT CHANGE between Day/Week/Month views.

#### View Behaviors
- **Day View**: Large single-day header with hourly agenda grouping (Early Morning, Morning, Midday, Afternoon, Evening)
- **Week View**: 7-day horizontal strip with selectable days, agenda list for selected date below
- **Month View**: Compact 6-row grid with pillar dots, split-view agenda panel on desktop

#### Interaction
- Clicking any day updates `selectedDate` and agenda list
- On mobile: Segmented "Calendar | Agenda" tabs
- "Today" button appears when not viewing today

### Desktop Split-View
- Left side: Calendar grid (Day/Week/Month selector)
- Right side: Agenda panel showing items for selected date
- Both panels scroll independently within fixed container

## Action Stream Disclosure Rules

### Adaptive Density System (v5.0)
The Action Stream automatically adjusts card density based on available space AND card count:

**Density Levels:**
| Level | Card Count | Card Height | Content Shown |
|-------|------------|-------------|---------------|
| Comfortable | 1-3 cards | ~140px | Full details, large CTAs, metrics row, summary |
| Standard | 4-7 cards | ~90px | Title, summary, CTA row, confidence badge |
| Compact | 8-14 cards | ~52px | Title, CTA row, mode/gate badges |
| Ultra-compact | 15+ cards | ~32px | Single line - title + pillar + priority only |

**Toggle Modes:**
- **Auto (A)**: Adaptive density based on space + count (default)
- **Compact (C)**: Forces compact mode regardless of space
- **Expanded (E)**: Forces comfortable mode (may require scrolling)

### On-Card CTAs (REQUIRED)
Every action card MUST include two visible CTAs:

**Primary CTA** (left):
- Contextual action label: "Execute", "Auto-Fix", "Send Email", etc.
- Sourced from `action.cta.primary`
- Green glow when action is "ready" state (high confidence + not gated)
- Pillar-colored otherwise

**Secondary CTA** (right of primary):
- Review/Details action: "Review", "Details", etc.
- Sourced from `action.cta.secondary`
- Opens ActionPeekDrawer with full details

**Ready State:**
- Defined as: `confidence >= 0.8 AND gate.required === false`
- Shows "Ready" badge in standard/comfortable modes
- Primary CTA uses success styling (green glow)

### Progressive Disclosure (3 Layers)
1. **Layer 1 (Card)**: Content scales with density level + visible CTAs
2. **Layer 2 (Hover)**: Background tint + enhanced interactivity
3. **Layer 3 (Drawer)**: Full details via ActionPeekDrawer

### Grouping
- Critical/Urgent actions pinned to top with "Requires Attention" header
- Divider separates urgent from other items
- Within tiers: sorted by confidence descending

### Card Layout by Density

**Ultra-Compact:**
```
[●] [PR] Title text truncated... [→]
```

**Compact:**
```
[●] [PR] Title text...                           2h ago
[Execute] [Review]                    [Auto] [Gated]
```

**Standard:**
```
[PR] [High] [Ready]                              2h ago
Title text that can wrap to two lines
Summary text in muted color...
[Execute] [Review]              87% conf [Auto] [Gated]
```

**Comfortable:**
```
[PR] [High] [Ready] [Autopilot]                  2h ago
Title text that can wrap to two lines maximum
Summary text showing more detail in muted color...
─────────────────────────────────────────────────────
Confidence: 87%  |  Impact: 72%  |  [Approval Required]
[  Execute  ] [  Review  ]
```

## Keyboard Accessibility

- All interactive elements are focusable
- Focus ring: `ring-2 ring-brand-cyan/30 ring-offset-2 ring-offset-[#0A0A0F]`
- Action cards support Enter/Space to open drawer
- Node items support Enter/Space to toggle focus
- Drawer supports Escape to close

## Files Structure

```
apps/dashboard/src/
├── app/app/
│   ├── command-center/
│   │   └── page.tsx              # Main page with data fetching
│   └── calendar/
│       └── page.tsx              # Stub calendar page
├── components/command-center/
│   ├── index.ts                  # Exports
│   ├── types.ts                  # TypeScript definitions
│   ├── pillar-accents.ts         # DS v3.1 accent system
│   ├── typography.ts             # Typography tokens
│   ├── text-intents.ts           # Semantic text intent helpers
│   ├── TriPaneShell.tsx          # Responsive layout
│   ├── CommandCenterTopbar.tsx   # AI-native topbar navigation
│   ├── ActionStreamPane.tsx      # Left pane with adaptive density
│   ├── ActionCard.tsx            # Action card component (v3)
│   ├── ActionPeekDrawer.tsx      # Drawer for action details
│   ├── IntelligenceCanvasPane.tsx # Center pane
│   ├── StrategyPanelPane.tsx     # Right pane
│   └── CalendarPeek.tsx          # Calendar widget
├── scripts/
│   ├── check-command-center-contrast.mjs  # Contrast/legibility CI guard
│   ├── check-command-center-typography.mjs # Typography CI guard
│   └── check-command-center-density.mjs   # Density pattern CI guard
└── mocks/
    ├── handlers.ts               # MSW request handlers
    ├── browser.ts                # Browser MSW setup
    └── server.ts                 # Node MSW setup
```

## Future Enhancements

The following are noted for future sprints:

1. **Full Graph Visualization**
   - Replace placeholder with D3/Cytoscape canvas
   - Interactive node dragging and zooming

2. **Real-time Updates**
   - WebSocket/SSE for live action stream updates
   - Optimistic UI updates for CTA interactions

3. **Full Calendar Surface**
   - Week/Month/Day views
   - Drag-and-drop rescheduling
   - Cross-pillar dependency visualization

4. **Action Execution**
   - Wire CTAs to actual backend endpoints
   - Implement approval workflows
   - Add execution confirmation modals

## Compliance Notes

- All components are keyboard accessible
- Focus states follow DS v3.1 specifications
- Loading and error states are handled for all data fetches
- Contract examples are the single source of mock data
