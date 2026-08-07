/**
 * Content `content.create_brief` executor (Wave-2 — the FIRST concrete executor).
 *
 * Given a `content.create_brief` proposal, creates a REAL content brief in the
 * governed content backend (ContentService → `content_briefs`, org-scoped), links it
 * back to the originating proposal + execution via brief metadata, and returns a
 * VERIFIED `success` outcome (not the neutral `governed_complete`) carrying the real
 * brief id.
 *
 * Governance: this runs inside the already-audited, human-initiated CRAFT execution
 * (see executors/types.ts). Creating a brief is a fully-reversible, owned-surface,
 * internal action — it does NOT publish anything. The content-PUBLISH action
 * (content.publish) is reserved and, when implemented, MUST route through the
 * existing H publish gate (CiteMind qualification, CONTENT_WORK_SURFACE_CONTRACT
 * §"Publishing = Manual only"); it is deliberately NOT registered here.
 */

import type { ActionExecutor } from './types';
import { ContentService } from '../../contentService';

interface CreateBriefParams {
  topic?: unknown;
  keyword?: unknown;
}

function asTrimmedString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export const contentCreateBriefExecutor: ActionExecutor = async (
  proposal,
  ctx
) => {
  const params = (proposal.action_params ?? {}) as CreateBriefParams;
  const topic = asTrimmedString(params.topic);
  const keyword = asTrimmedString(params.keyword) || topic || undefined;

  // Prefer the proposal's human-facing title; fall back to a topic-derived title.
  const proposalTitle = asTrimmedString(proposal.title);
  const title =
    proposalTitle || (topic ? `Content brief: ${topic}` : 'SAGE content brief');

  const content = new ContentService(ctx.supabase);
  const brief = await content.createContentBrief(ctx.orgId, {
    title,
    targetKeyword: keyword,
    targetKeywords: keyword ? [keyword] : [],
    status: 'draft',
    // Linkage back to the proposal + execution so the brief is traceable to the
    // governed action that created it (the sage_outcomes row links the other way).
    metadata: {
      source: 'sage_proposal',
      action_type: 'content.create_brief',
      proposal_id: ctx.proposalId,
      execution_id: ctx.executionId,
      topic: topic || null,
    },
  });

  // A real brief was created → VERIFIED business success (real id, not fabricated).
  return {
    result: 'success',
    detail: {
      kind: 'content_brief_created',
      brief_id: brief.id,
      title: brief.title,
      topic: topic || null,
      keyword: keyword ?? null,
    },
  };
};
