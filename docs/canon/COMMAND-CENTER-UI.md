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

### Contrast Token Rules (ENFORCED BY CI)
No `text-slate-*`, `text-gray-*`, `text-neutral-*`, `text-zinc-*` tokens in Command Center scope.

Allowed text tokens:
- Primary labels: `text-white/90`
- Secondary labels: `text-white/70`
- Muted/tertiary: `text-white/50`
- Disabled/subtle: `text-white/30`
- Brand accents: `text-brand-cyan`, `text-brand-iris`, `text-brand-magenta`
- Semantic: `text-semantic-danger`, `text-semantic-warning`, `text-semantic-success`

Exceptions require `contrast-allow:` comment on the same line.

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

### Auto-Compact Mode (v3.0)
When cards exceed pane height, automatically switches to compact layout.

Toggle modes:
- **Auto (A)**: Compacts when overflow detected
- **Compact (C)**: Always single-line cards
- **Expanded (E)**: Always full cards

### Progressive Disclosure (3 Layers)
1. **Layer 1 (Card)**: Title + pillar badge + priority dot + conf/impact pills
2. **Layer 2 (Hover)**: Overlay reveals summary, time estimate, gated indicator
3. **Layer 3 (Drawer)**: Full details via ActionPeekDrawer

### Grouping
- Critical/Urgent actions pinned to top with "Urgent" header
- Divider separates urgent from other items
- Within tiers: sorted by confidence descending

### Compact Card Layout
- Single line: priority dot + pillar badge + title + metric pills + arrow
- Hover overlay shows truncated summary + gated chip

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
│   ├── TriPaneShell.tsx          # Responsive layout
│   ├── ActionStreamPane.tsx      # Left pane
│   ├── ActionPeekDrawer.tsx      # Drawer for action details
│   ├── IntelligenceCanvasPane.tsx # Center pane
│   ├── StrategyPanelPane.tsx     # Right pane
│   └── CalendarPeek.tsx          # Calendar widget
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
