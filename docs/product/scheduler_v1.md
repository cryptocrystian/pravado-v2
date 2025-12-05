# Scheduled Crawling & Background Tasks V1

**Sprint**: S42
**Status**: Complete
**Feature Flag**: `ENABLE_SCHEDULER`

## Overview

Sprint S42 implements a complete scheduled job execution system that automates media crawling workflows from S40 and S41. The scheduler provides cron-like task scheduling, automatic job execution, retry logic, and comprehensive monitoring through an admin dashboard.

## Architecture

### Task Execution Flow

```
Server Boot → Initialize Scheduler → Start Cron Tick (60s)
                        ↓
                  executeDueTasks()
                        ↓
              Check cron schedule for each task
                        ↓
                  Execute task handlers
                        ↓
        (hourly-rss / 10min-queue / nightly-cleanup)
                        ↓
                Record run results
```

### Database Schema (Migration 47)

**scheduler_tasks**
- System-wide scheduled tasks
- Cron expression scheduling
- Enable/disable toggle
- Last run tracking
- Admin-only RLS policies

**scheduler_task_runs**
- Complete audit trail of executions
- Success/failure status
- Error messages and metadata
- 60-day retention (auto-cleanup)

### Service Architecture

```
SchedulerService
├── Task Management
│   ├── listTasks()
│   ├── getTask() / getTaskByName()
│   ├── updateTaskStatus()
│   └── Statistics
├── Task Run Recording
│   ├── recordTaskRunStart()
│   ├── recordTaskRunEnd()
│   └── listTaskRuns()
├── Task Execution
│   ├── runTaskNow()
│   ├── executeDueTasks()
│   └── executeTask() (private)
└── Task Handlers
    ├── executeHourlyRssFetch()
    ├── executeQueueJobs()
    └── executeNightlyCleanup()
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/scheduler/tasks` | List all scheduled tasks (admin) |
| POST | `/api/v1/scheduler/tasks/:id/toggle` | Toggle task enabled/disabled (admin) |
| POST | `/api/v1/scheduler/tasks/:name/run` | Run task immediately (admin) |
| GET | `/api/v1/scheduler/runs` | List task run history (admin) |
| GET | `/api/v1/scheduler/stats` | Get scheduler statistics (admin) |

All endpoints require:
- `requireUser` authentication
- `requireAdmin` authorization
- Zod validation

## Scheduled Tasks

### Task 1: Hourly RSS Fetch
**Schedule**: `0 * * * *` (every hour at :00)
**Handler**: `executeHourlyRssFetch()`

Workflow:
1. Query all active RSS feeds across all orgs
2. Group feeds by org_id
3. Call `mediaCrawlerService.fetchAllActiveFeeds()` per org
4. Create crawl jobs for discovered articles
5. Track total feeds fetched and jobs created

### Task 2: Queue Pending Jobs
**Schedule**: `*/10 * * * *` (every 10 minutes)
**Handler**: `executeQueueJobs()`

Workflow:
1. Query crawl jobs with status='queued' (limit 100)
2. Execute each job via `mediaCrawlerService.executeCrawlJob()`
3. Track successful enqueues and errors
4. Continue processing remaining jobs in next cycle

### Task 3: Nightly Cleanup
**Schedule**: `0 0 * * *` (midnight daily)
**Handler**: `executeNightlyCleanup()`

Workflow:
1. Delete `media_crawl_jobs` older than 30 days
2. Delete `scheduler_task_runs` older than 60 days
3. Track deletion counts
4. Return cleanup statistics

## Cron Matching

### Simple Cron Parser
- Format: `minute hour day month weekday` (5 fields)
- Supports: numbers, `*`, `*/N` (step values)
- Matching logic:
  - Never-run tasks → always due
  - Calculate minimum interval from cron expression
  - Compare time since last run

### Production Enhancement
Current implementation uses simple heuristic matching. Production would use:
- `cron-parser` or `node-cron` library
- Precise cron expression evaluation
- Timezone-aware scheduling
- Daylight saving time handling

## Dashboard UI

### Admin Scheduler Page (`/app/admin/scheduler`)
**Layout**:
- Header with title and description
- 6 statistics cards (Total Tasks, Enabled, Runs, Success, Failed, Last 24h)
- Task table with inline actions
- Error alert banner

**Features**:
- Real-time task list with status indicators
- Toggle switches for enable/disable
- "Run Now" buttons for manual execution
- Cron schedule display
- Last run timestamp
- Status badges (success/failure)

**Components**:
- `TaskListTable` - Main task display
- `StatusBadge` - Color-coded status indicators
- `ToggleButton` - Enable/disable switch
- `RunNowButton` - Manual execution trigger

**Security**:
- Admin-only access (checked via API)
- All mutations require confirmation
- Error boundaries for graceful failures

## Server Integration

### Boot Sequence
1. Check `ENABLE_SCHEDULER` feature flag
2. Initialize monitoring and crawler services
3. Create scheduler service instance
4. Start cron tick via `setInterval(60_000)`
5. Execute due tasks every 60 seconds

### Error Handling
- Task execution errors don't crash scheduler
- Failed tasks marked with error messages
- Automatic retry on next cron cycle
- Comprehensive logging in debug mode

## Statistics & Monitoring

### Metrics Tracked
- Total tasks / enabled tasks
- Total runs / successful runs / failed runs
- Runs in last 24 hours
- Per-task last run time and status

### RPC Function
`get_scheduler_stats()` provides aggregated metrics with single query.

Fallback to manual queries if RPC unavailable.

## Security & Access Control

### Authentication
- All endpoints require authenticated user
- Admin role checked via `profiles.role = 'admin'`
- RLS policies enforce admin-only access to tables

### Audit Trail
- Every task execution recorded
- Start time, end time, status, error
- Metadata includes task-specific details
- 60-day retention for compliance

## Integration Points

- **S40**: Uses Media Monitoring ingestion pipeline
- **S41**: Orchestrates RSS fetching and crawl job execution
- **S18/S21**: Compatible with existing queue system
- **Feature Flags**: Respects ENABLE_SCHEDULER
- **RLS**: Admin-only policies on all tables

## Configuration

### Feature Flag
```typescript
ENABLE_SCHEDULER: true
```

### Cron Tick Interval
```typescript
setInterval(() => schedulerService.executeDueTasks(), 60_000) // 60 seconds
```

### Task Parameters
- Max crawl jobs per cycle: 100
- Crawl job retention: 30 days
- Task run retention: 60 days

## Limitations

- Simple cron matching (not production-grade parser)
- 60-second tick granularity (cannot schedule sub-minute tasks)
- Single-server execution (no distributed scheduling)
- No task priority or dependency management
- Manual task execution only via admin UI

## Future Enhancements (S43+)

1. **Production Cron Parser**
   - Use `cron-parser` library
   - Precise expression evaluation
   - Timezone support

2. **Distributed Scheduling**
   - Leader election for multi-server deployments
   - Job locking to prevent duplicate execution
   - Load balancing across workers

3. **Advanced Task Features**
   - Task dependencies (run B after A completes)
   - Priority queues
   - Conditional execution (only if condition met)
   - Task chaining and workflows

4. **Enhanced Monitoring**
   - Task execution duration tracking
   - Performance trends and alerts
   - Slack/email notifications on failure
   - Grafana/Prometheus integration

5. **User-Defined Tasks**
   - Admin UI for creating custom tasks
   - Visual workflow builder
   - Template library for common patterns

## Dependencies

- S40: Media Monitoring Engine
- S41: Media Crawler Service
- Supabase: Database with RLS
- Fastify: HTTP framework

## Performance Considerations

- 60-second tick overhead: minimal (single query)
- Task execution: async, non-blocking
- Cleanup queries: indexed on created_at
- Statistics: RPC function for efficiency
