# Command Center UI Implementation

Version: v4.0 (Anchored HoverCard Micro-Brief)
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

**CRITICAL**: Strategy Panel is DIAGNOSTIC ONLY. It explains EVI state but contains NO action buttons. Actions belong in the Action Stream.

Displays strategic intelligence:
- **EVI Hero**: Single North Star KPI with score, delta, status band, sparkline
- **Driver Breakdown**: Three expandable rows (Visibility 40%, Authority 35%, Momentum 25%)
- **AI Narratives**: Generated explanations of EVI movement with sentiment indicators
- **Upgrade Hooks**: Blurred insights and locked features for plan upsells

**@see** `/docs/canon/EARNED_VISIBILITY_INDEX.md` for EVI specification.

## EVI: The North Star KPI

### Definition
The **Earned Visibility Index (EVI)** is the single North Star KPI for the Command Center Strategy Panel.

```
EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
```

### EVI Status Bands

| EVI Range | Status | Color | Interpretation |
|-----------|--------|-------|----------------|
| **0–40** | At Risk | `semantic-danger` (Red) | Brand is invisible. Urgent action required. |
| **41–60** | Emerging | `brand-amber` (Yellow) | Foundational presence. Growth focus. |
| **61–80** | Competitive | `brand-cyan` (Cyan) | Meaningful visibility. Maintenance mode. |
| **81–100** | Dominant | `semantic-success` (Green) | Category leader. Expansion focus. |

### EVI Drivers

| Driver | Weight | Purpose | Color |
|--------|--------|---------|-------|
| **Visibility** | 40% | Where brand appears (AI, SERP, press) | `brand-cyan` |
| **Authority** | 35% | Why brand should be trusted | `brand-iris` |
| **Momentum** | 25% | Trajectory and competitive velocity | `brand-magenta` |

### Strategy Panel KPI Rules

**REQUIRED:**
1. EVI is the ONLY top-level KPI in Strategy Panel
2. All supporting metrics must map to an EVI driver
3. EVI driver weights must sum to 100%

**FORBIDDEN (will fail CI):**
1. No "AEO Health Score" anywhere in codebase
2. No second top-level KPI in Strategy Panel
3. No metrics that cannot explain EVI movement
4. No action buttons in Strategy Panel (diagnostic only)

### KPI Mapping Table

Every metric displayed in Strategy Panel must trace to an EVI driver:

| Metric | Driver | Why It Matters |
|--------|--------|----------------|
| AI Answer Presence % | Visibility | AI systems are decision surfaces |
| Press Mention Coverage | Visibility | Third-party validation |
| Topic SERP Coverage % | Visibility | Discovery and credibility |
| Featured Snippets | Visibility | Position zero attention |
| Citation Quality Score | Authority | High-authority citations transfer trust |
| Referring Domain Authority | Authority | Backlink source credibility |
| Journalist Match Strength | Authority | Contextual coverage relevance |
| Structured Data Coverage % | Authority | AI comprehension signals |
| Citation Velocity (WoW) | Momentum | Growth rate indicator |
| Share of Voice Change | Momentum | Relative competitive position |
| Content Velocity | Momentum | Output vs. competitor average |
| Topic Growth Rate | Momentum | Emerging topic coverage velocity |

### Anti-Patterns (ENFORCED BY CI)

| Pattern | Why It's Bad | CI Guard |
|---------|--------------|----------|
| "AEO Health Score" | Duplicate top-level KPI | `check-command-center-kpis.mjs` |
| Traffic-only metrics | Outcomes, not inputs | `check-command-center-kpis.mjs` |
| Vanity metrics | Not earned visibility | `check-command-center-kpis.mjs` |
| Action buttons in Strategy Panel | Breaks diagnostic-only role | `check-command-center-kpis.mjs` |
| Metrics without driver mapping | Cannot explain EVI | `check-command-center-kpis.mjs` |

### Calendar Widget
**Component:** `CalendarPeek`

Positioned at the bottom of the center pane, shows:
- Next 5 upcoming orchestration items
- Pillar and status badges
- Mode indicators
- "View Full Calendar" link to `/app/calendar`

## Action Stream Interaction Contract v2.0 (Modal Model)

### Core Principle: One Click, One Outcome
Every action card has **one primary interaction path**. The user should never wonder "what happens if I click here?" The answer must be visually obvious before clicking.

### Interaction Behavior Matrix

| Element | Action | Result |
|---------|--------|--------|
| **Card Body Click** | Investigate | Opens Action Modal (centered overlay) |
| **"Review" Button** | Investigate | Opens Action Modal (centered overlay) |
| **Primary CTA** | Execute | Executes action OR opens confirmation if destructive |
| **Hover** | Preview | Reveals hover intelligence block inside card |

### Hover Micro-Brief v5 (ANCHORED HOVERCARD)

**CRITICAL:** Hover reveals a popover ANCHORED to the card, positioned to the left within the Action Stream column.

#### HoverCard Architecture (v5)
The micro-brief uses a Radix HoverCard component:
1. **HoverCard component**: `@radix-ui/react-hover-card`
2. **ActionHoverBrief**: Popover content component with structured sections
3. **Arrow**: Points to the hovered card for clear association
4. **Positioning**: `side="left"` to stay inside the Action Stream pane

#### Hover Coordination (CI ENFORCED)
| Rule | Enforcement |
|------|-------------|
| Radix HoverCard import | Required |
| ActionHoverBrief content component | Required |
| `isHoverOpen` controlled state prop | Required |
| `onHoverOpenChange` callback prop | Required |
| `isDimmed` prop for sibling dimming | Required |
| Single hover tracking in ActionStreamPane | Required |
| Compact mode: no hover popover | Required |

#### Hover Timing
| Event | Delay | Purpose |
|-------|-------|---------|
| Open | ~200ms | Hover intent filter |
| Close | ~250ms | Allows cursor to move into popover |

#### ActionHoverBrief Content Sections
The `ActionHoverBrief` component displays:
1. **Title**: Action title with pillar accent color
2. **Why Now**: Strategic rationale (2-3 lines)
3. **Next Step**: Single recommended next action
4. **Signals**: Up to 3 key metrics with tone colors
5. **Guardrails**: Up to 2 warnings/constraints
6. **Footer hint**: "Click card to review full details"

#### Content by Density Mode

| Density | Hover Behavior |
|---------|----------------|
| **Comfortable** | HoverCard popover with full ActionHoverBrief content |
| **Standard** | HoverCard popover with full ActionHoverBrief content |
| **Compact** | NO hover popover (click card to open modal) |

#### What Hover Must NOT Do
- Reveal hidden CTAs or change available actions
- Open multiple popovers simultaneously
- Block interaction with adjacent cards (uses dimming instead)

### Primary CTA Behavior
- **Never opens the modal** - Primary CTA executes or confirms
- Executes immediately for non-destructive actions
- Opens confirmation modal for destructive/irreversible actions
- Shows executing state (spinner) during processing
- Updates card state on completion (success/error badge)

### Secondary CTA ("Review") Behavior
- **Always opens the Action Modal**
- Label is always "Review" (consolidated from "Details", "View", etc.)
- In compact mode: secondary CTA is removed; card click is the review path

### Action Modal (Centered Overlay)
**Component:** `ActionModal`

A centered modal overlay (NOT a right-side drawer) that opens for investigation:
1. **Header**: Title, pillar badge, status chip (Ready/Gated/Critical), timestamp
2. **"Why this matters"**: AI rationale summary
3. **Metrics**: Confidence, Impact, Effort estimate, Risk level, Gate reason
4. **Evidence**: Citations, links, diff preview (if applicable)
5. **Actions Footer**: Primary CTA (matches card), Close button

**Accessibility:**
- Focus trapped inside modal
- Escape closes modal
- Click outside closes modal
- ARIA labels for screen readers

### Anti-Patterns (FORBIDDEN)

| Pattern | Why It's Bad | Correct Approach |
|---------|--------------|------------------|
| Right-side drawer for Action Stream | Breaks spatial continuity | Use centered modal |
| In-place card expansion | Layout shift, scroll disruption | Fixed modal overlay |
| Hover-reveal CTAs | Hidden affordances, touch-unfriendly | Always-visible CTAs |
| Primary CTA opens modal | Confuses execute vs investigate | Primary = execute only |
| "View" + "Review" + "Details" | Redundant labels | Use "Review" consistently |
| Card click executes action | Accidental execution risk | Card click = investigate |

### Density Scaling (Behavior Preserved)
Interaction model does NOT change per density—only visual presentation:

| Density | Primary CTA | Secondary CTA | Card Click | Hover |
|---------|-------------|---------------|------------|-------|
| Comfortable | Large colored pill | Ghost "Review" button | → Modal | Full intelligence |
| Standard | Medium pill | Text link "Review →" | → Modal | Condensed intelligence |
| Compact | Small pill | Hidden (card click) | → Modal | Row highlight only |

### Execution States
Cards support execution state visualization:
```
[Idle] → [Executing...] → [Success ✓] or [Error ✗]
```
- Executing: Spinner, disabled CTA, subtle pulse
- Success: Green checkmark badge, toast notification
- Error: Red badge, error message in toast

## Other Interaction Patterns

### 1. Node Focus (Intelligence Canvas)
Clicking a node in the Intelligence Canvas:
- Highlights the selected node with pillar glow
- Updates the graph placeholder to show connections
- Displays related edge labels and target nodes
- Click "Clear focus" or another node to deselect

### 2. Entity Map (SAGE-Native Graph)
**Component:** `EntityMap`
**@see** `/docs/canon/ENTITY-MAP-SAGE.md` for full specification.

The Entity Map renders the strategic relationship graph within the Intelligence Canvas pane:

**Layout:**
- Zone-based positioning (Authority/Signal/Growth/Exposure)
- Deterministic layout seed (stable positions)
- Top-20 node constraint by default

**Action Stream Integration:**
- Hover: Highlights impacted nodes/edges, dims others
- Execute: Triggers pulse animation on affected entities
- Uses same hover coordination as Action Stream (single active)

**Node Types:**
- `brand` (center) - Central brand entity
- `journalist`, `outlet` (left) - Media contacts
- `topic`, `ai_model` (right) - Content/SEO topics
- `competitor` (bottom) - Competitive brands

**Styling:**
- Nodes use pillar accent colors (magenta/iris/cyan)
- Edges use pillar colors at 50% opacity
- Glow effects follow DS v3.1 specifications

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

## Action Stream Density Contract (v6.0)

### UX-Pilot Authority
**Comfortable mode is the UX-Pilot reference authority.** All Action Stream cards should look like UX-Pilot in comfortable mode by default.

### Density Levels (3 Modes)

| Level | Card Count | Card Height | Content Shown | CTA Visibility |
|-------|------------|-------------|---------------|----------------|
| **Comfortable** (DEFAULT) | ≤8 cards | ~130-150px | Full details, metrics row, summary | **DOMINANT** primary + subdued secondary |
| Standard | 9-12 cards | ~80-100px | Title, summary, condensed badges | Visible primary + text secondary |
| Compact | 13+ cards | ~48-56px | Title only, inline badges | Primary CTA only + chevron |

### Density Selection Rules
1. **Comfortable is DEFAULT** - Should be the most common state
2. **≤8 cards** → Always comfortable (unless height-constrained)
3. **9-12 cards** → Standard (transition zone)
4. **13+ cards** → Compact (fallback only)

### CTA Hierarchy Rules (CRITICAL)

**Comfortable Mode (UX-Pilot Authority):**
- **Primary CTA**: DOMINANT - Large, fully colored pill, strong glow, white text
  - Ready state: `bg-semantic-success` with green glow
  - Non-ready: Pillar color (`bg-brand-magenta/iris/cyan`) with pillar glow
- **Secondary CTA**: SUBDUED - Ghost style, border only, never competes
  - `text-white/60` with `border-white/10`, no background

**Standard Mode:**
- Primary CTA: Colored background/border, moderate size
- Secondary CTA: Text-only link style (`text-white/55`)

**Compact Mode:**
- Primary CTA only - Compact pill button
- Secondary: Click card or chevron to open drawer

### On-Card CTAs (REQUIRED)
Every action card MUST include visible CTAs:

**Primary CTA:**
- Contextual action label from `action.cta.primary`
- "Execute", "Auto-Fix", "Send Email", "Investigate", etc.
- Ready state (confidence ≥0.8 + no gate): Green success styling
- Non-ready: Pillar-colored

**Secondary CTA (Comfortable/Standard only):**
- Action from `action.cta.secondary`
- "Review", "Details", "View", etc.
- Opens ActionPeekDrawer

### Ready State Definition
```typescript
isReady = confidence >= 0.8 && !gate.required
```
- Shows "✓ Ready" badge in comfortable mode
- Primary CTA uses success styling with enhanced glow

### Progressive Disclosure (3 Layers)
1. **Layer 1 (Card)**: Content scales with density + visible CTAs
2. **Layer 2 (Hover)**: Background tint via `group-hover:opacity`
3. **Layer 3 (Drawer)**: Full details via ActionPeekDrawer

### Grouping
- Critical/Urgent actions pinned to top with "Requires Attention" header
- Divider separates urgent from other items
- Within tiers: sorted by confidence descending

### Card Layout by Density

**Compact (13+ cards):**
```
[●] [PR] Title text truncated...       [Execute] [→]
```

**Standard (9-12 cards):**
```
[●] [PR] [High] [Ready]                         2h ago
Title text that can wrap to one line
Summary text truncated...
[Execute] Review                              87%  [●]
```

**Comfortable (DEFAULT, ≤8 cards):**
```
┌─────────────────────────────────────────────────────┐
│ [●][High] [PR] [✓ Ready] [Auto]             2h ago  │
│                                                      │
│ Title text that can wrap to two lines maximum       │
│                                                      │
│ Summary text showing more detail in readable        │
│ contrast (white/65)...                              │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Confidence  87%  │  Impact  72%  │ [Approval]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [████ Execute ████]  [ Review ]                     │
│  (DOMINANT - colored)  (subdued - ghost)            │
└─────────────────────────────────────────────────────┘
```

## Testing (Development Only)

### Density Query Param Override
Use `?density=` query parameter to force density modes for testing:

```
/app/command-center?density=comfortable   # Force comfortable mode
/app/command-center?density=standard      # Force standard mode
/app/command-center?density=compact       # Force compact mode
```

**Behavior:**
- Overrides auto-calculation when present
- Shows "DEV" badge in density toggle area
- Disables manual toggle buttons
- Only works on `/app/command-center` route

### Toggle Buttons
UI toggle buttons in header (disabled when query param active):
- **A** (Auto): Adaptive density based on card count (default)
- **F** (Force Comfortable): Always comfortable mode
- **C** (Compact): Always compact mode

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
├── components/ui/
│   └── hover-card.tsx            # Radix HoverCard wrapper (shadcn style)
├── components/command-center/
│   ├── index.ts                  # Exports
│   ├── types.ts                  # TypeScript definitions
│   ├── pillar-accents.ts         # DS v3.1 accent system
│   ├── typography.ts             # Typography tokens
│   ├── text-intents.ts           # Semantic text intent helpers
│   ├── TriPaneShell.tsx          # Responsive layout
│   ├── CommandCenterTopbar.tsx   # AI-native topbar navigation
│   ├── ActionStreamPane.tsx      # Left pane with adaptive density
│   ├── ActionCard.tsx            # Action card component (v8 - anchored HoverCard micro-brief)
│   ├── ActionHoverBrief.tsx      # HoverCard popover content (v5)
│   ├── ActionModal.tsx           # Centered modal for action investigation
│   ├── IntelligenceCanvasPane.tsx # Center pane
│   ├── StrategyPanelPane.tsx     # Right pane
│   └── CalendarPeek.tsx          # Calendar widget
├── scripts/
│   ├── check-command-center-contrast.mjs  # Contrast/legibility CI guard
│   ├── check-command-center-typography.mjs # Typography CI guard
│   ├── check-command-center-density.mjs   # Density pattern CI guard
│   └── check-actionstream-interactions.mjs # Modal model interaction guard
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

## How to Test (Development)

### Action Stream Interaction Model

1. **Visit the Command Center:**
   ```
   http://localhost:3000/app/command-center
   ```

2. **Test Hover Micro-Brief (v5 Anchored HoverCard):**
   - Hover over any action card (comfortable/standard mode)
   - Observe: HoverCard popover appears to the left of the card after ~200ms
   - Verify: Arrow points to the hovered card
   - Verify: Popover shows Why Now, Next Step, Signals, Guardrails
   - Verify: Moving cursor into popover keeps it open
   - Verify: Other cards are dimmed when hover is open
   - Verify: Only ONE popover can be open at a time
   - Verify: Compact mode has NO hover popover

3. **Test Card Click → Modal:**
   - Click anywhere on a card body (not on CTAs)
   - Verify: Centered modal opens with full action details
   - Verify: Modal is NOT a right-side drawer

4. **Test "Review" Button → Modal:**
   - Click the "Review" button on any card
   - Verify: Same modal opens as card click

5. **Test Primary CTA → Execute:**
   - Click the primary CTA (e.g., "Send Pitch", "Execute")
   - Verify: Card shows "Executing..." state
   - Verify: After timeout, card shows success/completion state
   - Verify: Toast notification appears
   - Verify: Modal does NOT open

6. **Test TechCrunch Pitch Flow (Full UX):**
   - Find "Pitch opportunity: TechCrunch AI coverage" card
   - Click "Review" to see full pitch details in modal
   - Click "Send Pitch" on card → see execution flow
   - Verify: Card updates to "Sent" state

### Density Mode Testing
```
/app/command-center?density=comfortable  # Force comfortable
/app/command-center?density=standard     # Force standard
/app/command-center?density=compact      # Force compact
```

Verify that interaction behavior (modal vs execute) remains identical across all density modes.

## Compliance Notes

- All components are keyboard accessible
- Focus states follow DS v3.1 specifications
- Loading and error states are handled for all data fetches
- Contract examples are the single source of mock data
- Action Stream uses centered modal (NOT right-side drawer)
