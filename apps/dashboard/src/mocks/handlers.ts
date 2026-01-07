/**
 * MSW Request Handlers for Command Center
 *
 * These handlers intercept API requests during development/testing
 * and return contract examples as the source of truth.
 *
 * Contract examples are the ONLY source of mock data.
 * Do NOT create duplicate mock data elsewhere.
 */

import { http, HttpResponse, delay } from 'msw';

// Import contract examples
// Note: These paths are relative to the dashboard app but reference
// the shared contracts folder at repo root
import actionStream from '../../../../contracts/examples/action-stream.json';
import intelligenceCanvas from '../../../../contracts/examples/intelligence-canvas.json';
import strategyPanel from '../../../../contracts/examples/strategy-panel.json';
import orchestrationCalendar from '../../../../contracts/examples/orchestration-calendar.json';

/**
 * Simulated network delay for realistic UX testing
 * Set to 0 for instant responses in tests
 */
const MOCK_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 200;

export const handlers = [
  /**
   * GET /api/command-center/action-stream
   * Returns prioritized action items across all pillars
   */
  http.get('/api/command-center/action-stream', async ({ request }) => {
    await delay(MOCK_DELAY_MS);

    const url = new URL(request.url);
    const pillar = url.searchParams.get('pillar');
    const priority = url.searchParams.get('priority');

    let items = [...actionStream.items];

    // Filter by pillar if specified
    if (pillar) {
      items = items.filter((item) => item.pillar === pillar);
    }

    // Filter by priority if specified
    if (priority) {
      items = items.filter((item) => item.priority === priority);
    }

    return HttpResponse.json({
      ...actionStream,
      items,
      generated_at: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/command-center/intelligence-canvas
   * Returns the intelligence graph with nodes, edges, and citation feed
   */
  http.get('/api/command-center/intelligence-canvas', async ({ request }) => {
    await delay(MOCK_DELAY_MS);

    const url = new URL(request.url);
    const nodeKind = url.searchParams.get('node_kind');

    let response = { ...intelligenceCanvas };

    // Filter nodes by kind if specified
    if (nodeKind) {
      response = {
        ...response,
        nodes: response.nodes.filter((node) => node.kind === nodeKind),
      };
    }

    return HttpResponse.json({
      ...response,
      generated_at: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/command-center/strategy-panel
   * Returns KPIs, narratives, recommendations, and upgrade hooks
   */
  http.get('/api/command-center/strategy-panel', async () => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      ...strategyPanel,
      generated_at: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/command-center/orchestration-calendar
   * Returns calendar items with optional filtering
   */
  http.get('/api/command-center/orchestration-calendar', async ({ request }) => {
    await delay(MOCK_DELAY_MS);

    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'week';
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const pillar = url.searchParams.get('pillar');
    const status = url.searchParams.get('status');

    let items = [...orchestrationCalendar.items];

    // Filter by date range if specified
    if (start) {
      items = items.filter((item) => item.date >= start);
    }
    if (end) {
      items = items.filter((item) => item.date <= end);
    }

    // Filter by pillar if specified
    if (pillar) {
      items = items.filter((item) => item.pillar === pillar);
    }

    // Filter by status if specified
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // Recalculate summary based on filtered items
    const summary = {
      total_items: items.length,
      by_status: items.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      by_pillar: items.reduce(
        (acc, item) => {
          acc[item.pillar] = (acc[item.pillar] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      by_mode: items.reduce(
        (acc, item) => {
          acc[item.mode] = (acc[item.mode] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return HttpResponse.json({
      range: start && end ? { start, end } : orchestrationCalendar.range,
      views: orchestrationCalendar.views,
      default_view: view,
      items,
      filters: orchestrationCalendar.filters,
      summary,
    });
  }),
];
