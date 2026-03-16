# Content Hub Redesign Proposal

**Author:** Principal Product Design Review
**Date:** 2026-02-05
**Status:** PROPOSAL (Not Canon)
**Scope:** UX architecture, interaction model, feature gaps, SAGE/AUTOMATE integration

---

## 1. Honest Assessment of Where We Are

The current Content Hub is a **task management interface wearing a content editor costume**. It prioritizes operations (queues, modes, execution gravity) over the thing users actually came to do: **write, refine, and publish authoritative content**.

### What a user sees today:

1. A shell header with a mode switcher they don't understand yet
2. Tab navigation to four views (Work Queue, Library, Calendar, Insights)
3. The default landing is a "Work Queue" -- a prioritized action list
4. If they click into an item and hit "Edit", they get a `<textarea>` with Bold/Italic stub buttons
5. A collapsible right rail showing CiteMind status and entity tags
6. Mock data everywhere -- the product doesn't feel alive

### The core problem:

**The Content Hub treats content creation as a subtask of operations, not as the primary experience.**

No marketing professional will switch from Google Docs, Notion, or even WordPress to a platform where the editor is a plain textarea inside a task queue panel. The writing experience must be the reason they stay, not something they tolerate to access the intelligence features.

---

## 2. Competitive Benchmark: Table Stakes

I benchmarked against: Notion, Google Docs, Craft, Medium, Linear (for structured work), Webflow Editor, and Clearscope (for SEO-aware writing).

### 2.1 Table-Stakes Features We're Missing

| Feature | Notion | Docs | Craft | Medium | Us |
|---------|--------|------|-------|--------|-----|
| Block-based rich text editor | Yes | Yes | Yes | Yes | **No** (textarea) |
| Slash commands (/, /h1, /image) | Yes | No | Yes | No | **No** |
| Inline formatting toolbar (floating) | Yes | Yes | Yes | Yes | **No** (static stub) |
| Heading hierarchy + outline nav | Yes | Yes | Yes | Yes | **No** |
| Inline comments / suggestions | Yes | Yes | No | No | **No** |
| Version history with diff view | Yes | Yes | Yes | No | **No** |
| Real-time collaboration cursors | Yes | Yes | Yes | No | **No** |
| Auto-save with "Saving..." indicator | Yes | Yes | Yes | Yes | **No** |
| Word count / reading time in editor | Yes | Yes | Yes | Yes | **No** |
| Media embedding (images, video) | Yes | Yes | Yes | Yes | **No** |
| Keyboard shortcuts for formatting | Yes | Yes | Yes | Yes | **No** |
| Full-screen / distraction-free mode | No | No | Yes | Yes | **No** |
| Template system for new content | Yes | Yes | Yes | No | **No** |
| Drag-and-drop content blocks | Yes | No | Yes | No | **No** |
| Table of contents / document outline | Yes | Yes | Yes | No | **No** |
| Search within document | Yes | Yes | Yes | Yes | **No** |
| Export (Markdown, PDF, HTML) | Yes | Yes | Yes | Yes | **No** |
| Link preview / unfurling | Yes | Yes | Yes | Yes | **No** |

**Verdict: We have zero of the 18 table-stakes editor features.**

### 2.2 Table-Stakes Workflow Features We're Missing

| Feature | Best-in-class example | Us |
|---------|----------------------|-----|
| Content list with search + sort + bulk actions | Notion database view | Partial (library view, basic) |
| Status-based kanban view | Linear, Notion | **No** |
| Content templates / blueprints | Notion, Webflow | **No** |
| Duplicate content item | Every platform | **No** |
| Archive / soft delete with undo | Every platform | **No** |
| Assign content to team members | Notion, Linear, Asana | **No** |
| Due date with reminder | Every PM tool | **No** |
| Content preview (how it looks published) | Webflow, WordPress | **No** |
| Publish / unpublish toggle | Every CMS | **No** |
| SEO metadata editor (title, description, OG) | WordPress, Webflow | **No** |

---

## 3. What We're Missing vs. What Canon Promises

Canon (CONTENT_PILLAR_CANON.md Section 3.1) explicitly lists these as "required for competitive parity":

> - Content calendar (multi-format) -- **Partially built** (basic month grid)
> - Long-form writing (articles, guides, landing pages) -- **Not functional** (textarea)
> - Short-form writing (social, snippets, summaries) -- **Not functional**
> - Editorial workflow: Draft > Review > Approved > Published -- **Status types exist, but no workflow enforcement**
> - Versioning and revision history -- **Not built**
> - Collaboration (comments, suggestions) -- **Not built**
> - Basic performance metrics -- **Mocked**

The canon is honest about the bar. We are not meeting it.

---

## 4. Proposed Editor UX Model

### 4.1 The Mental Model Shift

**Current model:** Content Hub is a queue-processing interface with an editor bolted on.
**Proposed model:** Content Hub is a writing environment with intelligence woven in.

The primary experience is **the document**. Everything else -- SAGE signals, CiteMind governance, cross-pillar hooks, authority scores -- exists to make the writing better, not to distract from it.

### 4.2 Primary Canvas Architecture

```
+-------------------------------------------------------------------------+
|  DOCUMENT HEADER (breadcrumb, title, status, last saved)                |
+----+--------------------------------------------------------------------+
|    |                                                                    |
| O  |                    WRITING CANVAS                                  |
| U  |                                                                    |
| T  |    [Block-based rich text editor]                                  |
| L  |    - Slash commands for block types                                |
| I  |    - Floating format toolbar on selection                          |
| N  |    - Section headings create outline entries                       |
| E  |    - Full viewport height, scrolls internally                     |
|    |    - Generous line height, reading-optimized typography            |
|    |                                                                    |
| N  |    [Content blocks: text, heading, list, quote, image,            |
| A  |     callout, table, code, divider, embed]                         |
| V  |                                                                    |
|    |    [CiteMind inline annotations appear as subtle                   |
|    |     underlines on flagged claims -- click to see detail]           |
|    |                                                                    |
+----+--------------------------------------------------+-----------------+
|  STATUS BAR (word count | reading time | auto-save | CiteMind score)    |
+-------------------------------------------------------------------------+
```

### 4.3 The Outline Rail (Left, 200px, collapsible)

Not a task queue. A **document outline** when editing. Shows:

- Heading hierarchy extracted from the document (H1, H2, H3)
- Click to jump to section
- Drag to reorder sections
- Section-level CiteMind status (green dot, amber dot, red dot)
- When no document is open: shows the content list for navigation

This mirrors how Notion, Google Docs, and Craft let you navigate long documents.

### 4.4 The Intelligence Margin (Right, contextual, collapsible)

Not a generic "context rail". A **contextual intelligence panel** that changes based on what's happening:

| User State | Intelligence Margin Shows |
|------------|--------------------------|
| Writing a paragraph | Relevant SAGE signals for this section's topic |
| Selecting text | Inline suggestions: "Strengthen claim", "Add citation" |
| Viewing a CiteMind flag | The specific issue, suggested fix, one-click resolve |
| Reviewing before publish | Full CiteMind report, authority score, derivative preview |
| Idle / overview | Entity associations, cross-pillar hooks, derivatives |

The key principle: **the rail responds to the writer's current focus, not a static dashboard**.

### 4.5 Block Types (Structured, Not Freeform)

Canon requires "structured sections, not freeform." This doesn't mean a rigid form -- it means semantically meaningful blocks:

| Block Type | Purpose | CiteMind Behavior |
|------------|---------|-------------------|
| Heading | Section structure | Scanned for entity alignment |
| Paragraph | Body content | Claim verification active |
| Claim Block | Explicit factual assertion | **Required** citation source |
| Citation Block | Source reference | Verified against CiteMind DB |
| Quote | External voice | Source attribution required |
| Callout | Key insight / highlight | Flagged if unsubstantiated |
| Data / Stat | Numerical claim | Source verification required |
| Image | Visual content | Alt text + entity association |
| Embed | External content | Source tracking |

The critical innovation: **Claim Blocks and Citation Blocks are first-class editor primitives**, not afterthoughts. When a writer makes a factual assertion, they can wrap it in a Claim Block that CiteMind actively governs. This is how we differentiate from every other editor.

---

## 5. How SAGE Appears During Writing

SAGE should feel like a **thoughtful editor sitting beside you** -- not a dashboard you have to visit.

### 5.1 During Writing (Ambient)

**SAGE Whispers** -- small, non-intrusive suggestions that appear in the intelligence margin when relevant:

```
+-----------------------------------------+
| SAGE SIGNAL                             |
| "Coverage of 'marketing automation'     |
|  increased 23% this week. Consider      |
|  emphasizing your unique angle."        |
|                                         |
| Source: Signal (PR coverage trend)      |
| Confidence: 82%                         |
|                                         |
| [Dismiss]  [Show me the data]           |
+-----------------------------------------+
```

These appear contextually based on what the writer is writing about. They are:
- Dismissible (never blocking)
- Traceable (always show source signal and confidence)
- Actionable (link to data or suggest a specific edit)

### 5.2 During Review (Active)

When the writer shifts from writing to review (clicking "Review" or reaching the publish flow), SAGE becomes more prominent:

**SAGE Review Summary** -- appears at the top of the intelligence margin:

```
+------------------------------------------+
| SAGE ANALYSIS                            |
|                                          |
| Authority: +12 projected impact          |
| Signal:    Aligns with 3 active trends   |
| Growth:    2 derivative surfaces ready   |
| Exposure:  High AI ingestion likelihood  |
|                                          |
| This content reinforces "B2B Marketing   |
| Automation" entity cluster and supports  |
| pending PR pitch to TechCrunch.          |
|                                          |
| [View Full Analysis]                     |
+------------------------------------------+
```

### 5.3 During Publishing (Gate)

SAGE becomes a **publish gate advisor** -- not blocking (that's CiteMind's job), but informing:

```
+------------------------------------------+
| SAGE PUBLISHING ADVISORY                 |
|                                          |
| Timing: Good -- no competing content     |
|         scheduled this week              |
| Impact: +15 authority if published now   |
| Risk:   Low -- all claims verified       |
|                                          |
| Suggested: Publish now + trigger         |
|            derivative generation          |
|                                          |
| [Publish]  [Schedule for Later]          |
+------------------------------------------+
```

---

## 6. How AUTOMATE Appears During Writing

AUTOMATE should be **invisible until needed** -- the user should never feel like they're "in a mode."

### 6.1 Manual Mode (Default for Content)

The user doesn't see "Manual Mode" anywhere prominent. They just write. The experience is:
- They open a document. They write.
- AI assists on demand (slash commands, formatting suggestions)
- CiteMind runs checks in the background, shows results inline
- SAGE whispers appear in the margin when relevant
- The user controls everything. No surprises.

The mode indicator exists but is **ambient** -- a small badge in the document header, not a mode switcher demanding attention.

### 6.2 Copilot Mode

When the user escalates to Copilot (via the header badge or by invoking AI), the experience shifts:

- AI can draft sections within the current document outline
- AI-generated text appears with a subtle **iris left-border** to distinguish it from human text
- Each AI-generated block has: [Accept] [Edit] [Regenerate] [Reject]
- The intelligence margin shows the AI's reasoning for what it generated
- Human approval is required before AI text becomes "real" content

The key: **AI text is always visually distinct until the human accepts it.** This is the copilot contract.

### 6.3 Autopilot Mode (Content: Limited)

Per canon, content autopilot is restricted to:
- Quality analysis (can run automatically)
- Optimization suggestions (can appear automatically)
- Derivative generation (can run automatically after publish)

It does NOT auto-draft or auto-publish. The editor experience in autopilot is nearly identical to manual -- the difference is in background operations, not the writing surface.

---

## 7. Recommended Layout and Navigation

### 7.1 Content Hub Navigation Restructure

**Current:** Work Queue > Library > Calendar > Insights (tabs)
**Proposed:**

```
+------------------------------------------------------------------+
| CONTENT HUB                                     [+ New]  [Search] |
+------------------------------------------------------------------+
| All Content | Drafts | In Review | Published | Calendar | Insights |
+------------------------------------------------------------------+
```

**Why:** The primary navigation should be **content states**, not operational concepts. "Work Queue" is a developer/PM concept. "Drafts" is a writer's concept. A marketing professional thinks: "Where are my drafts? What's ready to publish? What's scheduled?"

The "Work Queue" concept doesn't disappear -- it becomes how content is **sorted within each view** (by SAGE priority, deadline proximity, etc.). The intelligence is in the ordering, not a separate surface.

### 7.2 Content List View (Default)

```
+-------+----------------------------------------------------------+---------+
|       |                                                          |         |
| SIDE  |  CONTENT LIST                                            | PREVIEW |
| BAR   |                                                          | PANEL   |
|       |  +-----------------------------------------------------+|         |
| All   |  | [checkbox] "Ultimate Guide to Marketing Auto..."   ||  Title  |
| Drafts|  |   Article | Published | Authority: 85 | Jan 10     ||  Status |
| Review|  +-----------------------------------------------------+|  Score  |
| Ready |  | [checkbox] "Content Strategy Best Practices..."     ||  Meta   |
| Pub'd |  |   Article | Draft | Authority: 62 | Jan 14         ||         |
| Arch  |  +-----------------------------------------------------+|  SAGE   |
|       |  | [checkbox] "Acme Corp Case Study..."                ||  Summary|
| ------+  |   Article | Review | Authority: 74 | Jan 13        ||         |
| SAGE  |  +-----------------------------------------------------+|  [Open] |
| Signals|                                                         |  [Edit] |
|       |  Sort: Priority | Date | Authority | Title               |         |
| Entity|  Filter: Type | Status | Entity | Campaign               |         |
| Filter|                                                          |         |
+-------+----------------------------------------------------------+---------+
```

When a user clicks "Open" or double-clicks a row, they enter the full document editor (Section 4).

### 7.3 How This Fits in the Larger Pravado Platform

```
GLOBAL NAV (left sidebar, always visible):
+------------------+
| PRAVADO          |
|                  |
| Command Center   |  <-- Strategic overview (SAGE dashboard)
| PR Intelligence  |  <-- PR work surface
| Content Hub      |  <-- You are here
| SEO Command      |  <-- SEO work surface
| Calendar         |  <-- Cross-pillar orchestration calendar
| Analytics        |  <-- Outcomes and attribution
|                  |
| Settings         |
+------------------+
```

Content Hub is a **peer surface** to PR Intelligence and SEO Command. It is not nested inside the Command Center. The Command Center is the strategic overview; the pillar surfaces are where work happens.

When a user navigates from Command Center to Content Hub (e.g., clicking a SAGE proposal that says "Draft article about X"), they should land **in the editor with context pre-loaded**, not on a queue view that requires two more clicks to start writing.

### 7.4 Deep-Link Navigation

Every content item has a stable URL: `/app/content/{id}`

- Coming from Command Center SAGE proposal: `/app/content/{id}` opens the editor directly
- Coming from Calendar: `/app/content/{id}` opens with the schedule context in the intelligence margin
- Coming from PR work surface: `/app/content/{id}?ref=pr&pitchId={x}` opens with PR context showing cross-pillar connection
- Coming from Insights: `/app/content/{id}?panel=authority` opens with authority analysis in the intelligence margin

The editor is the **single canonical destination**. Context travels with the user via URL params that configure the intelligence margin.

---

## 8. Interaction Model Summary

### 8.1 Content Lifecycle as the User Experiences It

```
CREATE                      WRITE                     REVIEW                 PUBLISH
  |                           |                         |                      |
  v                           v                         v                      v
Click "+ New"            Block editor              CiteMind runs           SAGE advisory
  |                      Slash commands             Full report             Timing check
  v                      SAGE whispers              Entity check            Derivative gen
Choose type              CiteMind inline            Cross-pillar            Schedule or
(Article, Email,         Auto-save                  Version diff            publish now
 Social, Landing,        Outline nav                Approval flow           |
 Campaign)               |                          |                      v
  |                      v                          v                    LIVE
  v                    Draft saved                Mark "Ready"            |
Open editor              |                          |                    Derivatives
with template            v                          v                    auto-generated
                       Continue or               Reviewer sees            |
                       come back later            clean view              Authority
                                                  with CiteMind           tracking
                                                  summary                 begins
```

### 8.2 Key Interaction Principles

1. **Cursor-first.** When a user creates new content, the cursor is in the editor within 1 second. No intermediate screens.

2. **Context follows focus.** The intelligence margin shows information relevant to what the user is currently doing, not a static dashboard.

3. **AI is ambient until invoked.** SAGE signals appear as whispers. CiteMind annotations appear as subtle underlines. The user chooses when to engage.

4. **Governance is inline, not modal.** CiteMind doesn't pop up a dialog. It underlines problematic claims in the document, like spell-check. The user fixes issues in-flow.

5. **Publish is earned, not gated by bureaucracy.** The publish flow checks CiteMind, shows SAGE advisory, and lets the user publish in 2 clicks. No approval chains unless the org configures them.

6. **Every view leads to a document.** Library, Calendar, Insights, Search -- every path ends at a specific document in the editor. The document is always the destination.

---

## 9. Why This Feels Better (From the User's Perspective)

**Before (current):**
"I open Content Hub. I see a Work Queue with priority badges and confidence scores. I have to pick an item, click it, then click 'Edit' to get a textarea. It feels like I'm processing tickets, not creating content. The AI mode switcher confuses me. The right rail shows entity tags I don't understand yet. I just wanted to write an article."

**After (proposed):**
"I open Content Hub. I see my content -- drafts at the top, organized by what needs attention. I click '+ New Article' and I'm writing immediately, with a clean editor that feels like Notion or Craft. As I write, subtle signals appear in the margin: 'This topic is trending in your industry' or 'Add a source for this claim.' When I'm done, I click 'Review' and see a clean summary of my content's authority potential. I click 'Publish' and my article is live, with derivatives auto-generating for PR and SEO. I feel like I wrote something meaningful, not like I processed a task."

The difference is **agency**. The current design makes the user feel like they're serving the system. The proposed design makes the system serve the user.

### Why professionals would switch:

1. **The editor is competitive.** Block-based, rich formatting, slash commands. Not a step down from their current tools.

2. **Intelligence is additive.** SAGE signals and CiteMind governance make their writing better without adding friction. No other editor tells you "this claim needs a source" inline.

3. **Cross-pillar is automatic.** Their article automatically generates PR pitch excerpts and SEO snippets. No manual repurposing. This is a real time-saver.

4. **Authority metrics are motivating.** Seeing "+15 authority score" when you publish is more meaningful than page views. It connects their work to business outcomes.

5. **The workflow is simple.** Draft > Review > Publish. Not Draft > Queue > Prioritize > Execute > Approve > Schedule > Publish.

---

## 10. Implementation Priority (If Approved)

Not estimating timelines, but ordering by user impact:

### Must-Have (Without these, don't ship)

1. **Block-based rich text editor** -- Replace textarea with Tiptap or ProseMirror-based editor. This is the foundation everything else depends on.
2. **Content list as default landing** -- Replace Work Queue default with a content list view organized by status.
3. **Auto-save with indicator** -- Users must never lose work.
4. **Inline CiteMind annotations** -- Underline problematic claims in the editor, not in a side panel.
5. **Document outline navigation** -- Left rail shows heading hierarchy when editing.

### Should-Have (Makes it competitive)

6. **Floating format toolbar** -- Selection-based formatting, not a static toolbar.
7. **Slash commands** -- `/heading`, `/quote`, `/claim`, `/image` for block creation.
8. **Claim Block and Citation Block** -- First-class block types that CiteMind governs.
9. **Intelligence margin (contextual right panel)** -- Responds to user focus, not static.
10. **SAGE whispers** -- Contextual suggestions during writing.

### Nice-to-Have (Makes it best-in-class)

11. **Version history with diff view**
12. **Template system for content types**
13. **Keyboard shortcuts for all formatting**
14. **Full-screen distraction-free mode**
15. **Derivative preview in publish flow**

---

## 11. What This Proposal Does NOT Change

- Canon documents remain unchanged. This proposal implements what canon already requires.
- SAGE and AUTOMATE specifications remain unchanged. This proposal defines how they surface in the editor.
- The type system (ContentType, ContentStatus, etc.) remains unchanged.
- API contracts remain unchanged.
- The tri-pane shell pattern from Command Center can still be used -- but the content within those panes changes dramatically.

---

## 12. Open Questions

1. **Editor library choice:** Tiptap (ProseMirror-based) vs. Lexical (Meta) vs. Plate (also ProseMirror). Tiptap is the most mature for this use case. Recommend a technical spike.

2. **Real-time collaboration:** Is this V1 or V2? Canon mentions "collaboration (comments, suggestions)" as table stakes. Suggesting V1.5 -- build the editor with collaboration-ready architecture, ship collaboration features in a fast follow.

3. **Content preview:** How important is "preview as published" for V1? If Pravado publishes to external CMSs, we need to define what "preview" means.

4. **Mobile experience:** Canon specifies responsive breakpoints. The proposed editor model needs a mobile story. Suggest: read-only on mobile, edit on tablet+.
