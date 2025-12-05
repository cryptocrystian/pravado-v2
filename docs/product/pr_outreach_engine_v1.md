# PR Outreach Engine V1 (Sprint S44)

## Overview

The Automated Journalist Outreach Engine enables systematic, multi-step email campaigns to journalists with smart targeting, AI-generated content, and comprehensive tracking.

## Key Features

### 1. Sequence Management
- Create multi-step email sequences
- Configure delays between steps
- Template-based email content
- Active/inactive status control
- Rate limiting (max runs per day)
- Auto-stop on journalist reply

### 2. Smart Targeting
- Target specific journalists by ID
- Filter by outlet
- Filter by beat/topic
- Filter by outlet tier
- Preview targeting before launch

### 3. Email Steps
- Step-by-step progression
- Configurable delays (hours)
- Template variables
- Optional LLM generation
- Subject and body templates

### 4. Run Management
- Track individual journalist runs
- Monitor step progression
- Manual stop control
- Manual step advancement
- Error tracking and retry logic

### 5. Event Tracking
- Sent tracking
- Open tracking
- Click tracking
- Reply detection
- Bounce handling
- Failure logging

### 6. Analytics & Stats
- Total sequences and active count
- Run statistics
- Email delivery metrics
- Open/click/reply rates
- Per-sequence analytics

## Architecture

### Database Schema

**pr_outreach_sequences**: Campaign definitions
- Targeting criteria
- Execution settings
- Associated content (pitch/press release)
- Statistics tracking

**pr_outreach_sequence_steps**: Email templates
- Step ordering and delays
- Template content
- LLM generation settings

**pr_outreach_runs**: Execution instances
- Per-journalist tracking
- State management
- Progress monitoring

**pr_outreach_events**: Activity log
- All email events
- Timestamp tracking
- Metadata storage

### Service Layer

**OutreachService** (~950 lines):
- Sequence CRUD operations
- Step management
- Run execution engine
- Event tracking
- Email generation (with LLM)
- Journalist targeting
- Statistics aggregation
- Scheduler integration

### API Routes

**Base**: `/api/v1/pr-outreach`

- `POST /sequences` - Create sequence
- `GET /sequences` - List sequences
- `GET /sequences/:id` - Get sequence
- `GET /sequences/:id/with-steps` - Get with steps
- `PATCH /sequences/:id` - Update sequence
- `DELETE /sequences/:id` - Delete sequence
- `POST /sequences/:sequenceId/steps` - Create step
- `PATCH /steps/:id` - Update step
- `DELETE /steps/:id` - Delete step
- `POST /sequences/:sequenceId/start` - Start runs
- `GET /runs` - List runs
- `GET /runs/:id` - Get run details
- `POST /runs/:id/stop` - Stop run
- `POST /runs/:id/advance` - Advance run
- `GET /events` - List events
- `POST /webhooks/track` - Track email events
- `GET /sequences/:id/preview-targeting` - Preview targeting
- `GET /stats` - Get statistics

## Usage Examples

### Creating a Sequence

```typescript
const sequence = await createOutreachSequence({
  name: 'Summer Product Launch',
  description: 'Introducing our new AI features',
  maxRunsPerDay: 50,
  stopOnReply: true,
  journalistIds: ['...'], // Optional specific targeting
  beatFilter: ['technology', 'AI'], // Optional beat filter
});
```

### Adding Steps

```typescript
// Step 1: Initial outreach (immediate)
await createOutreachStep(sequence.id, {
  stepNumber: 1,
  delayHours: 0,
  subjectTemplate: 'Hi {{journalist_name}}, exclusive AI launch',
  bodyTemplate: 'Hello {{journalist_name}}, ...',
});

// Step 2: Follow-up (2 days later)
await createOutreachStep(sequence.id, {
  stepNumber: 2,
  delayHours: 48,
  subjectTemplate: 'Following up on {{outlet}} story',
  bodyTemplate: 'Just wanted to circle back...',
});
```

### Starting Runs

```typescript
const result = await startSequenceRuns(sequence.id, {
  dryRun: false, // Set to true to preview
});

console.log(`Created ${result.runsCreated} runs`);
console.log(`Skipped ${result.skippedJournalists.length} duplicates`);
```

## Template Variables

Available in all email templates:

- `{{journalist_name}}` - Journalist's full name
- `{{journalist_email}}` - Journalist's email
- `{{outlet}}` - Outlet name
- `{{sequence_name}}` - Sequence name

Custom variables can be added in step configuration.

## LLM Generation

Steps can use LLM to generate personalized emails:

```typescript
await createOutreachStep(sequence.id, {
  stepNumber: 1,
  useLlmGeneration: true,
  llmModel: 'gpt-4',
  llmPrompt: 'Generate a personalized outreach email for {{journalist_name}} at {{outlet}} about our new AI product launch. Make it professional and concise.',
  subjectTemplate: '...', // Used as starting point
  bodyTemplate: '...',
});
```

## Scheduler Integration

The system automatically processes scheduled runs every 60 seconds:

- Checks for runs with `next_step_at` <= now
- Advances runs to next step
- Sends emails
- Updates run state
- Handles errors and retries

## Event Tracking

Track email engagement via webhooks:

```typescript
// When email is opened
POST /api/v1/pr-outreach/webhooks/track
{
  "eventId": "event-123",
  "eventType": "opened",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

Supported events: sent, opened, clicked, replied, bounced, failed

## Frontend Components

1. **OutreachSequenceList**: Browse and manage sequences
2. **OutreachSequenceEditor**: Create/edit sequences with steps
3. **OutreachRunList**: View active and completed runs
4. **OutreachRunDetailDrawer**: Full run details with event timeline

## Security & Permissions

- Org-scoped RLS policies
- Feature flag: `ENABLE_PR_OUTREACH`
- Requires authenticated user
- No admin-only features

## Integration Points

### S39 (PR Pitch Engine)
- Link sequences to generated pitches
- Access pitch context in templates

### S38 (Press Release Generator)
- Link sequences to press releases
- Include release content in outreach

### S40-S43 (Media Monitoring)
- Target journalists from monitoring data
- Track coverage from outreach

### S42 (Scheduler)
- Automatic run advancement
- Scheduled email sending
- Background processing

## Metrics & KPIs

Dashboard displays:
- Total sequences (active vs. inactive)
- Total runs (running vs. completed)
- Email metrics (sent/opened/clicked/replied)
- Reply rate percentage
- Per-sequence performance

## Future Enhancements

- A/B testing for subject lines
- Send-time optimization
- Automated response classification
- Sentiment analysis on replies
- Integration with email providers (SendGrid, AWS SES)
- Advanced targeting with ML
- Personalization scoring
- Unsubscribe handling
