/**
 * Scheduler Validators (Sprint S42)
 * Zod schemas for scheduler-related inputs
 */

import { z } from 'zod';

// ========================================
// INPUT SCHEMAS
// ========================================

export const updateSchedulerTaskSchema = z.object({
  enabled: z.boolean().optional(),
  description: z.string().min(1).max(500).optional(),
});

export const runTaskSchema = z.object({
  taskName: z.string().min(1),
  runImmediately: z.boolean().optional().default(true),
});

// ========================================
// QUERY SCHEMAS
// ========================================

export const listSchedulerTasksSchema = z.object({
  enabled: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().min(0)),
});

export const listTaskRunsSchema = z.object({
  taskId: z.string().uuid().optional(),
  status: z.enum(['success', 'failure']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().min(0)),
});

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate cron expression format (basic validation)
 * Full validation would use a cron parser library
 */
export function isValidCronExpression(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  // Basic check: 5 parts (minute hour day month weekday)
  return parts.length === 5;
}

/**
 * Validate task name format
 * Format: category:task-name (e.g., "crawl:hourly-fetch-rss")
 */
export function isValidTaskName(name: string): boolean {
  return /^[a-z0-9-]+:[a-z0-9-]+$/.test(name);
}
