/**
 * Orchestration Calendar API Route
 * Returns mock orchestration calendar data from contract examples.
 */

import { NextResponse } from 'next/server';
import orchestrationCalendar from '../../../../../../../contracts/examples/orchestration-calendar.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'week';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const pillar = searchParams.get('pillar');
  const status = searchParams.get('status');

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

  return NextResponse.json({
    range: start && end ? { start, end } : orchestrationCalendar.range,
    views: orchestrationCalendar.views,
    default_view: view,
    items,
    filters: orchestrationCalendar.filters,
    summary,
  });
}
