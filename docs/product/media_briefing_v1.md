# Media Briefing & Executive Talking Points Generator V1

**Sprint:** S54
**Status:** Implemented
**Last Updated:** 2024-11-28

## Overview

The Media Briefing & Executive Talking Points Generator is an AI-powered system that creates comprehensive, context-rich briefings for media interactions. It aggregates intelligence from multiple sources across the Pravado platform to generate structured briefings with sections, talking points, and actionable insights.

## Features

### Briefing Management

- **Create Briefings**: Create new briefings with customizable format, tone, and focus areas
- **Multiple Formats**: Support for full briefs, executive summaries, talking points only, media prep, crisis briefs, and interview prep
- **Workflow States**: Draft → Generated → Reviewed → Approved → Archived
- **Source Linking**: Connect briefings to journalists, personas, competitors, and press releases

### AI Generation

- **Section Generation**: AI-powered generation of structured sections including:
  - Executive Summary
  - Key Messages
  - Media Landscape
  - Competitive Analysis
  - Journalist Intelligence
  - Audience Insights
  - Performance Metrics
  - Recommended Actions
  - Q&A Preparation
  - Appendix

- **Talking Point Generation**: Automatically generate talking points by category:
  - Primary Messages
  - Supporting Points
  - Defensive Points
  - Bridging Statements
  - Calls to Action
  - Stat Highlights
  - Quote Suggestions
  - Pivot Phrases

### Intelligence Integration

The generator aggregates context from:
- Press Releases (S38)
- PR Pitches (S39)
- Media Monitoring mentions (S40-S41)
- Journalist profiles and enrichment (S46-S50)
- Audience personas (S51)
- Media performance metrics (S52)
- Competitive intelligence (S53)

## Architecture

### Database Schema

```sql
-- Main briefing table
mb_briefings (
  id, org_id, story_id,
  title, subtitle, format, status,
  journalist_ids, outlet_ids, persona_ids, competitor_ids,
  press_release_ids, pitch_ids, mention_ids,
  tone, focus_areas, key_messages, exclusions,
  custom_instructions, generated_at, reviewed_at, approved_at,
  confidence_score, total_tokens_used, llm_model, llm_temperature,
  ...
)

-- Section content
mb_briefing_sections (
  id, org_id, briefing_id,
  section_type, title, content, summary,
  bullet_points, supporting_data, insights,
  source_summary, generation_prompt, llm_model,
  tokens_used, generation_duration_ms,
  ...
)

-- Talking points
mb_talking_points (
  id, org_id, briefing_id,
  category, headline, content, priority_score,
  supporting_facts, context_notes, use_case,
  target_audience, is_approved, is_archived,
  ...
)

-- Source references
mb_source_references (
  id, org_id, briefing_id,
  source_type, source_id, title, url,
  relevance_score, extracted_content,
  used_in_section_ids, used_in_talking_point_ids,
  ...
)

-- Audit logging
mb_briefing_audit_log (
  id, org_id, briefing_id, user_id,
  action, entity_type, entity_id,
  old_value, new_value, metadata,
  ...
)
```

### API Endpoints

```
POST   /api/v1/media-briefings/briefings           Create briefing
GET    /api/v1/media-briefings/briefings           List briefings
GET    /api/v1/media-briefings/briefings/:id       Get briefing
PATCH  /api/v1/media-briefings/briefings/:id       Update briefing
DELETE /api/v1/media-briefings/briefings/:id       Delete briefing

POST   /api/v1/media-briefings/briefings/:id/generate              Generate content
POST   /api/v1/media-briefings/briefings/:id/generate-talking-points  Generate talking points
POST   /api/v1/media-briefings/briefings/:id/review                Mark as reviewed
POST   /api/v1/media-briefings/briefings/:id/approve               Approve briefing
POST   /api/v1/media-briefings/briefings/:id/archive               Archive briefing

GET    /api/v1/media-briefings/briefings/:id/sections/:sectionId   Get section
PATCH  /api/v1/media-briefings/briefings/:id/sections/:sectionId   Update section
POST   /api/v1/media-briefings/briefings/:id/sections/:sectionId/regenerate  Regenerate section
PUT    /api/v1/media-briefings/briefings/:id/sections/reorder      Reorder sections

POST   /api/v1/media-briefings/talking-points      Create talking point
GET    /api/v1/media-briefings/talking-points      List talking points
GET    /api/v1/media-briefings/talking-points/:id  Get talking point
PATCH  /api/v1/media-briefings/talking-points/:id  Update talking point
DELETE /api/v1/media-briefings/talking-points/:id  Delete talking point
POST   /api/v1/media-briefings/talking-points/:id/approve  Approve talking point

GET    /api/v1/media-briefings/briefings/:id/sources  Get source references
```

## Frontend Components

### BriefingCard
Displays briefing summary in list/grid view with format icon, status badge, section/point counts, and confidence score.

### BriefingSection
Renders individual section with expand/collapse, inline editing, regeneration, and copy functionality.

### TalkingPointCard
Shows talking point with category badge, content, supporting facts, and approve/copy actions.

### BriefingEditor
Central editor with tabs for sections, talking points, and settings. Handles all editing operations.

### InsightPanel
Sidebar panel displaying grouped insights by strength with filtering and expansion.

### BriefingGenerationForm
Multi-step form for briefing creation with format selection, source linking, and configuration.

### BriefingDetailDrawer
Full-screen drawer for detailed briefing view with all functionality.

## Usage

### Creating a Briefing

1. Navigate to Media Briefings page
2. Click "New Briefing"
3. Enter title and optional subtitle
4. Select format (Full Brief, Executive Summary, etc.)
5. Choose tone (Professional, Confident, etc.)
6. Optionally link sources (journalists, personas, competitors)
7. Add focus areas and topics to avoid
8. Click "Create Briefing"

### Generating Content

1. Select a draft briefing
2. Click "Generate"
3. Wait for AI to generate sections and talking points
4. Review generated content
5. Edit sections inline if needed
6. Regenerate individual sections with custom instructions

### Approval Workflow

1. **Draft**: Initial state, can edit configuration
2. **Generated**: AI content generated, ready for review
3. **Reviewed**: Content reviewed by team member
4. **Approved**: Final approval for use
5. **Archived**: No longer active, preserved for reference

### Working with Talking Points

- Talking points are grouped by category
- Higher priority scores appear first
- Approve individual points for use
- Copy points to clipboard
- Delete unwanted points
- Generate more points by category

## Configuration

### Feature Flag

```typescript
FLAGS.ENABLE_MEDIA_BRIEFINGS = true
```

### Environment Variables

```
OPENAI_API_KEY=your-api-key
```

## Best Practices

1. **Link Relevant Sources**: Connect briefings to specific journalists, personas, and competitors for more targeted content
2. **Use Focus Areas**: Define specific topics to emphasize in generation
3. **Add Exclusions**: Specify sensitive topics to avoid
4. **Review Before Approval**: Always review generated content before marking as approved
5. **Regenerate with Instructions**: Use custom instructions when regenerating sections for better results

## Limitations

- Generation quality depends on available source data
- LLM token limits may affect very long briefings
- Real-time generation may take 30-60 seconds for full briefs

## Future Enhancements

- Export to PDF/DOCX formats
- Collaborative editing
- Version history
- Template library
- Scheduling for regular briefing generation
- Integration with calendar for interview prep
