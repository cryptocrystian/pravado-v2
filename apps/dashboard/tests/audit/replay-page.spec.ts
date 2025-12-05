/**
 * Audit Replay Page E2E Tests (Sprint S37)
 * Playwright tests for audit replay functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Audit Replay Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to audit replay page (assumes authenticated session)
    await page.goto('/app/audit/replay');
  });

  test.describe('Page Layout', () => {
    test('should display page header', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Audit Replay');
      await expect(
        page.locator('text=Reconstruct and visualize past system state')
      ).toBeVisible();
    });

    test('should display replay configurator', async ({ page }) => {
      await expect(page.locator('text=Configure Replay')).toBeVisible();
      await expect(page.locator('text=Start Date')).toBeVisible();
      await expect(page.locator('text=End Date')).toBeVisible();
      await expect(page.locator('text=Severity')).toBeVisible();
    });

    test('should display past replays section', async ({ page }) => {
      await expect(page.locator('text=Past Replays')).toBeVisible();
    });

    test('should display event timeline section', async ({ page }) => {
      await expect(page.locator('text=Event Timeline')).toBeVisible();
    });
  });

  test.describe('Replay Configuration', () => {
    test('should allow setting date range', async ({ page }) => {
      const startDateInput = page.locator('input[type="datetime-local"]').first();
      const endDateInput = page.locator('input[type="datetime-local"]').nth(1);

      await expect(startDateInput).toBeVisible();
      await expect(endDateInput).toBeVisible();

      await startDateInput.fill('2024-01-01T00:00');
      await endDateInput.fill('2024-01-31T23:59');

      await expect(startDateInput).toHaveValue('2024-01-01T00:00');
      await expect(endDateInput).toHaveValue('2024-01-31T23:59');
    });

    test('should allow selecting severity', async ({ page }) => {
      const severitySelect = page.locator('select').first();

      await expect(severitySelect).toBeVisible();
      await severitySelect.selectOption('error');

      await expect(severitySelect).toHaveValue('error');
    });

    test('should allow toggling event categories', async ({ page }) => {
      const contentButton = page.locator('button:has-text("Content Events")');
      const playbookButton = page.locator('button:has-text("Playbook Events")');

      await expect(contentButton).toBeVisible();
      await expect(playbookButton).toBeVisible();

      // Click to select
      await contentButton.click();
      await expect(contentButton).toHaveClass(/bg-blue-600/);

      // Click to deselect
      await contentButton.click();
      await expect(contentButton).toHaveClass(/bg-gray-100/);
    });
  });

  test.describe('Starting Replay', () => {
    test('should show start replay button', async ({ page }) => {
      const startButton = page.locator('button:has-text("Start Replay")');
      await expect(startButton).toBeVisible();
    });

    test('should initiate replay on button click', async ({ page }) => {
      // Mock the API call
      await page.route('**/api/v1/audit/replay', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { jobId: 'test-job-123', status: 'queued' },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Mock SSE stream
      await page.route('**/api/v1/audit/replay/test-job-123/stream', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: `data: ${JSON.stringify({ type: 'connected', runId: 'test-job-123' })}\n\n`,
        });
      });

      const startButton = page.locator('button:has-text("Start Replay")');
      await startButton.click();

      // Should show progress modal
      await expect(page.locator('text=Replay Progress')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Replay Progress Modal', () => {
    test('should show progress bar during replay', async ({ page }) => {
      // Setup mocks
      await page.route('**/api/v1/audit/replay', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { jobId: 'test-job-123', status: 'queued' },
            }),
          });
        }
      });

      await page.route('**/api/v1/audit/replay/test-job-123/stream', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: [
            `data: ${JSON.stringify({ type: 'replay.started', data: { runId: 'test-job-123' } })}\n\n`,
            `data: ${JSON.stringify({ type: 'replay.progress', data: { runId: 'test-job-123', progress: 50, currentEvent: 5, totalEvents: 10 } })}\n\n`,
          ].join(''),
        });
      });

      const startButton = page.locator('button:has-text("Start Replay")');
      await startButton.click();

      // Should show modal with progress
      await expect(page.locator('text=Replay Progress')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Status')).toBeVisible();
    });
  });

  test.describe('Past Replays List', () => {
    test('should display past replay runs', async ({ page }) => {
      // Mock list API
      await page.route('**/api/v1/audit/replays*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              runs: [
                {
                  id: 'run-1',
                  orgId: 'org-1',
                  userId: 'user-1',
                  status: 'success',
                  filters: {},
                  eventCount: 100,
                  snapshotCount: 100,
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'run-2',
                  orgId: 'org-1',
                  userId: 'user-1',
                  status: 'running',
                  filters: {},
                  eventCount: 0,
                  snapshotCount: 0,
                  createdAt: new Date().toISOString(),
                },
              ],
              total: 2,
              hasMore: false,
            },
          }),
        });
      });

      await page.reload();

      // Should show replay cards
      await expect(page.locator('text=Replay #run-1')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Replay #run-2')).toBeVisible();
    });

    test('should show empty state when no replays', async ({ page }) => {
      await page.route('**/api/v1/audit/replays*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              runs: [],
              total: 0,
              hasMore: false,
            },
          }),
        });
      });

      await page.reload();

      await expect(page.locator('text=No replay runs yet')).toBeVisible();
    });
  });

  test.describe('Timeline View', () => {
    test('should display timeline when run is selected', async ({ page }) => {
      // Mock list API
      await page.route('**/api/v1/audit/replays*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              runs: [
                {
                  id: 'run-1',
                  orgId: 'org-1',
                  userId: 'user-1',
                  status: 'success',
                  filters: {},
                  eventCount: 5,
                  snapshotCount: 5,
                  result: {
                    totalEvents: 5,
                    totalSnapshots: 5,
                    entityBreakdown: { content: 3, playbook: 2 },
                    eventTypeBreakdown: {},
                    severityBreakdown: { info: 4, warning: 1, error: 0, critical: 0 },
                    timeRange: { start: '2024-01-01', end: '2024-01-02' },
                    stateChanges: { additions: 2, modifications: 2, deletions: 1 },
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
              total: 1,
              hasMore: false,
            },
          }),
        });
      });

      // Mock run details API
      await page.route('**/api/v1/audit/replay/run-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              run: {
                id: 'run-1',
                status: 'success',
                eventCount: 5,
                snapshotCount: 5,
              },
              timeline: [
                {
                  index: 0,
                  eventId: 'evt-1',
                  eventType: 'content.created',
                  timestamp: '2024-01-01T10:00:00Z',
                  severity: 'info',
                  actorType: 'user',
                  summary: 'Content created: Test Article',
                  entityType: 'content',
                  changeCount: 3,
                },
                {
                  index: 1,
                  eventId: 'evt-2',
                  eventType: 'playbook.execution_started',
                  timestamp: '2024-01-01T11:00:00Z',
                  severity: 'info',
                  actorType: 'system',
                  summary: 'Playbook started: Content Distribution',
                  entityType: 'playbook',
                  changeCount: 2,
                },
              ],
            },
          }),
        });
      });

      await page.reload();

      // Click on replay card
      const replayCard = page.locator('text=Replay #run-1');
      await replayCard.click();

      // Should show timeline events
      await expect(page.locator('text=Content created: Test Article')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('text=Playbook started: Content Distribution')).toBeVisible();
    });

    test('should show message when no run selected', async ({ page }) => {
      await expect(page.locator('text=Select a replay run to view timeline')).toBeVisible();
    });
  });

  test.describe('Snapshot Inspector', () => {
    test('should display snapshot details on event click', async ({ page }) => {
      // Setup mocks for list, run details, and snapshot
      await page.route('**/api/v1/audit/replays*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              runs: [
                {
                  id: 'run-1',
                  status: 'success',
                  eventCount: 1,
                  snapshotCount: 1,
                  createdAt: new Date().toISOString(),
                },
              ],
              total: 1,
            },
          }),
        });
      });

      await page.route('**/api/v1/audit/replay/run-1', async (route) => {
        if (!route.request().url().includes('snapshots')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                run: { id: 'run-1', status: 'success' },
                timeline: [
                  {
                    index: 0,
                    eventId: 'evt-1',
                    eventType: 'content.created',
                    timestamp: '2024-01-01T10:00:00Z',
                    severity: 'info',
                    summary: 'Content created',
                    changeCount: 2,
                  },
                ],
              },
            }),
          });
        }
      });

      await page.route('**/api/v1/audit/replay/run-1/snapshots/0', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'snapshot-1',
              replayRunId: 'run-1',
              snapshotIndex: 0,
              eventType: 'content.created',
              timestamp: '2024-01-01T10:00:00Z',
              stateBefore: null,
              stateAfter: { id: 'content-1', title: 'New Article' },
              diff: [
                { field: 'id', before: undefined, after: 'content-1', operation: 'added' },
                { field: 'title', before: undefined, after: 'New Article', operation: 'added' },
              ],
              entityType: 'content',
            },
          }),
        });
      });

      await page.reload();

      // Click on replay card
      await page.locator('text=Replay #run-1').click();

      // Wait for timeline to load
      await expect(page.locator('text=Content created')).toBeVisible({ timeout: 5000 });

      // Click on timeline event
      await page.locator('text=Content created').click();

      // Should show snapshot details
      await expect(page.locator('text=Event #1')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Changes')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on API failure', async ({ page }) => {
      await page.route('**/api/v1/audit/replays*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch replay runs',
            },
          }),
        });
      });

      await page.reload();

      await expect(page.locator('text=Failed to fetch replay runs').or(page.locator('.bg-red-50'))).toBeVisible();
    });
  });
});
