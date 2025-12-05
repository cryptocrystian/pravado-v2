/**
 * PR Pitch & Outreach Sequence Validators (Sprint S39)
 * Zod schemas for PR pitch and outreach sequence validation
 */

import { z } from 'zod';

// ========================================
// STATUS SCHEMAS
// ========================================

export const prPitchSequenceStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
]);

export const prPitchContactStatusSchema = z.enum([
  'queued',
  'sending',
  'sent',
  'opened',
  'replied',
  'bounced',
  'opted_out',
  'failed',
]);

export const prPitchStepTypeSchema = z.enum(['email', 'social_dm', 'phone', 'other']);

export const prPitchEventTypeSchema = z.enum([
  'queued',
  'sent',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'failed',
]);

// ========================================
// SETTINGS SCHEMAS
// ========================================

export const prPitchSendWindowSchema = z.object({
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23),
  timezone: z.string().min(1),
});

export const prPitchSequenceSettingsSchema = z.object({
  sendWindow: prPitchSendWindowSchema.optional(),
  followUpDelayDays: z.number().min(1).max(30).optional(),
  maxAttempts: z.number().min(1).max(10).optional(),
  excludeWeekends: z.boolean().optional(),
});

// ========================================
// STEP INPUT SCHEMAS
// ========================================

export const createPRPitchStepSchema = z.object({
  position: z.number().int().min(1),
  stepType: prPitchStepTypeSchema.optional().default('email'),
  subjectTemplate: z.string().max(500).optional(),
  bodyTemplate: z.string().min(1).max(10000),
  waitDays: z.number().int().min(0).max(30).optional().default(3),
});

export const updatePRPitchStepSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(1),
  stepType: prPitchStepTypeSchema.optional(),
  subjectTemplate: z.string().max(500).optional(),
  bodyTemplate: z.string().min(1).max(10000),
  waitDays: z.number().int().min(0).max(30).optional(),
});

// ========================================
// SEQUENCE INPUT SCHEMAS
// ========================================

export const createPRPitchSequenceSchema = z.object({
  name: z.string().min(1).max(200),
  pressReleaseId: z.string().uuid().optional(),
  defaultSubject: z.string().max(500).optional(),
  defaultPreviewText: z.string().max(200).optional(),
  settings: prPitchSequenceSettingsSchema.optional(),
  steps: z.array(createPRPitchStepSchema).optional(),
});

export const updatePRPitchSequenceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  pressReleaseId: z.string().uuid().nullable().optional(),
  status: prPitchSequenceStatusSchema.optional(),
  defaultSubject: z.string().max(500).optional(),
  defaultPreviewText: z.string().max(200).optional(),
  settings: prPitchSequenceSettingsSchema.optional(),
  steps: z.array(updatePRPitchStepSchema).optional(),
});

// ========================================
// CONTACT INPUT SCHEMAS
// ========================================

export const attachContactsSchema = z.object({
  journalistIds: z.array(z.string().uuid()).min(1).max(100),
});

// ========================================
// PITCH GENERATION SCHEMAS
// ========================================

export const generatePitchPreviewSchema = z.object({
  sequenceId: z.string().uuid(),
  journalistId: z.string().uuid(),
  stepPosition: z.number().int().min(1).optional().default(1),
  customContext: z.string().max(2000).optional(),
});

// ========================================
// QUERY SCHEMAS
// ========================================

export const listPRPitchSequencesSchema = z.object({
  status: z
    .union([prPitchSequenceStatusSchema, z.array(prPitchSequenceStatusSchema)])
    .optional(),
  pressReleaseId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const listPRPitchContactsSchema = z.object({
  status: z
    .union([prPitchContactStatusSchema, z.array(prPitchContactStatusSchema)])
    .optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'lastEventAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type CreatePRPitchSequenceSchemaType = z.infer<typeof createPRPitchSequenceSchema>;
export type UpdatePRPitchSequenceSchemaType = z.infer<typeof updatePRPitchSequenceSchema>;
export type CreatePRPitchStepSchemaType = z.infer<typeof createPRPitchStepSchema>;
export type UpdatePRPitchStepSchemaType = z.infer<typeof updatePRPitchStepSchema>;
export type AttachContactsSchemaType = z.infer<typeof attachContactsSchema>;
export type GeneratePitchPreviewSchemaType = z.infer<typeof generatePitchPreviewSchema>;
export type ListPRPitchSequencesSchemaType = z.infer<typeof listPRPitchSequencesSchema>;
export type ListPRPitchContactsSchemaType = z.infer<typeof listPRPitchContactsSchema>;
