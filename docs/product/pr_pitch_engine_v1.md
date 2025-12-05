# PR Pitch & Outreach Sequence Engine V1

**Sprint**: S39
**Status**: Complete
**Feature Flag**: `ENABLE_PR_PITCH_ENGINE`

## Overview

The PR Pitch Engine transforms Pravado into a complete PR campaign platform by enabling:
- Personalized pitch generation for individual journalists
- Multi-step outreach sequences (initial pitch + follow-ups)
- Contact status tracking with event logging
- LLM-powered personalization with deterministic fallback

## Architecture

### Data Model

```
┌─────────────────────────┐
│  pr_pitch_sequences     │
├─────────────────────────┤
│ - name                  │
│ - press_release_id (FK) │
│ - status                │
│ - default_subject       │
│ - settings (JSONB)      │
└──────────┬──────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐
│  pr_pitch_steps         │
├─────────────────────────┤
│ - position              │
│ - step_type             │
│ - subject_template      │
│ - body_template         │
│ - wait_days             │
└─────────────────────────┘

┌─────────────────────────┐
│  pr_pitch_sequences     │
└──────────┬──────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐
│  pr_pitch_contacts      │
├─────────────────────────┤
│ - journalist_id (FK)    │
│ - status                │
│ - current_step_position │
│ - last_event_at         │
└──────────┬──────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐
│  pr_pitch_events        │
├─────────────────────────┤
│ - step_position         │
│ - event_type            │
│ - payload (JSONB)       │
└─────────────────────────┘
```

### Service Architecture

```
PRPitchService
├── Context Assembly
│   ├── assemblePitchContext()
│   ├── fetchPressRelease()
│   ├── fetchJournalistProfile()
│   ├── fetchOrganizationContext()
│   ├── fetchPersonality()
│   └── fetchRecentInteractions()
├── Pitch Personalization
│   ├── generatePitchPreview()
│   ├── generatePersonalizedPitchWithLLM()
│   ├── generateFallbackPitch()
│   └── interpolateTemplate()
├── Sequence Management
│   ├── createSequence()
│   ├── updateSequence()
│   ├── listSequences()
│   ├── getSequenceWithSteps()
│   └── deleteSequence() [soft delete]
├── Contact Management
│   ├── attachContactsToSequence()
│   ├── listContacts()
│   └── getContactWithEvents()
└── Event Handling
    ├── queuePitchForContact()
    ├── recordEvent()
    └── updateContactStatus()
```

## Personalization Strategy

### Context Sources

1. **Press Release Context** (from S38)
   - Headline, angle, body
   - Key points extraction
   - News type

2. **Journalist Context** (from S6)
   - Name, email, beat
   - Outlet and tier
   - Bio and location
   - Recent topics

3. **Organization Context**
   - Company name
   - Industry
   - Description

4. **Personality** (from S11)
   - Tone settings
   - Voice attributes

5. **Recent Interactions**
   - Previous pitch events
   - Engagement history

### LLM Prompt Design

The pitch generation prompt includes:

```
## Journalist Profile
Name, beat, outlet, tier, bio

## Press Release Context
Headline, angle, key points

## Company Context
Name, industry

## Tone Guidance
Personality settings

## Previous Interactions
Recent engagement history

## Task
Generate personalized pitch with:
- Subject line (max 60 chars)
- Greeting with first name
- Opening hook (beat/coverage relevant)
- Value proposition
- Social proof
- Call-to-action
- Professional sign-off
```

### Template Variables

Available for template interpolation:

| Variable | Description |
|----------|-------------|
| `{{journalist.name}}` | Full name |
| `{{journalist.firstName}}` | First name only |
| `{{journalist.beat}}` | Coverage area |
| `{{journalist.outlet}}` | Publication name |
| `{{organization.name}}` | Company name |
| `{{pressRelease.headline}}` | PR headline |
| `{{pressRelease.angle}}` | Story angle |

## Status Model

### Sequence Statuses

| Status | Description |
|--------|-------------|
| `draft` | Being edited, not active |
| `active` | Actively sending pitches |
| `paused` | Temporarily stopped |
| `completed` | All contacts processed |
| `archived` | Soft deleted |

### Contact Statuses

| Status | Description |
|--------|-------------|
| `queued` | Ready to send |
| `sending` | Currently sending |
| `sent` | Successfully sent |
| `opened` | Email opened |
| `replied` | Response received |
| `bounced` | Delivery failed |
| `opted_out` | Unsubscribed |
| `failed` | Send failed |

### Event Types

| Type | Description |
|------|-------------|
| `queued` | Pitch queued for sending |
| `sent` | Pitch sent successfully |
| `opened` | Email opened (tracking) |
| `clicked` | Link clicked |
| `replied` | Response received |
| `bounced` | Delivery bounced |
| `failed` | Send failed |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/pr/pitches/sequences` | Create sequence |
| GET | `/api/v1/pr/pitches/sequences` | List sequences |
| GET | `/api/v1/pr/pitches/sequences/:id` | Get sequence |
| PUT | `/api/v1/pr/pitches/sequences/:id` | Update sequence |
| DELETE | `/api/v1/pr/pitches/sequences/:id` | Archive sequence |
| POST | `/api/v1/pr/pitches/sequences/:id/contacts` | Add contacts |
| GET | `/api/v1/pr/pitches/sequences/:id/contacts` | List contacts |
| POST | `/api/v1/pr/pitches/preview` | Generate preview |
| POST | `/api/v1/pr/pitches/contacts/:id/queue` | Queue pitch |
| GET | `/api/v1/pr/pitches/contacts/:id` | Get contact |

## Dashboard UI

### Pitch Sequences Page

Three-column layout:
1. **Left**: Sequence list with status badges
2. **Center**: Editor or contacts view
3. **Right**: Stats sidebar

### Sequence Editor

- Sequence name and settings
- Press release association
- Step editor with drag-and-drop
- Template editor with variable hints

### Contact Management

- Journalist search and add
- Status table with actions
- Preview drawer for pitch review

## Playbook Integration

System playbook `PR_PITCH_V1`:

1. **GATHER_PITCH_CONTEXT** (DATA)
   - Fetch press release, journalist, org context

2. **GENERATE_PERSONALIZED_PITCH** (AGENT)
   - LLM-powered pitch generation

3. **STRUCTURE_PITCH_OUTPUT** (DATA)
   - Format final output

## Security

1. **Authentication**: All endpoints require user auth
2. **Organization Isolation**: RLS policies on all tables
3. **Input Validation**: Zod schemas for all inputs

## Performance

1. **Async Generation**: Pitches generated on-demand
2. **Batch Contact Add**: Up to 100 contacts per request
3. **Pagination**: All list endpoints paginated

## Future Enhancements

### S40+ Roadmap

1. **ESP Integration**
   - SendGrid, Mailgun, SES
   - Real-time delivery tracking
   - Open/click webhooks

2. **Reply Parsing**
   - AI-powered reply classification
   - Auto-categorization (interested, not now, no)

3. **A/B Testing**
   - Subject line variants
   - Template comparison
   - Statistical significance

4. **Smart Scheduling**
   - Timezone-aware sending
   - Best-time optimization
   - Rate limiting per outlet

5. **Campaign Analytics**
   - Open rates by outlet/beat
   - Reply rate trending
   - Best performing templates

## Dependencies

- `@pravado/types`: Type definitions
- `@pravado/validators`: Zod schemas
- `@pravado/feature-flags`: Feature toggles
- `@pravado/utils`: LLM Router
- S6: PR Intelligence (journalists)
- S38: Press Release Generator
- S11: Personality profiles
