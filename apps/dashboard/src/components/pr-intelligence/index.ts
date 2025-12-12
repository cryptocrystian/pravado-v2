/**
 * PR Intelligence Components (Sprint S95)
 *
 * Best-in-class PR pillar components with:
 * - Situation Brief (what's happening)
 * - AI Recommendations (what to do)
 * - Continuity Links (cross-pillar orchestration)
 *
 * All components are DS v2 compliant with AI transparency
 */

// Situation Brief
export {
  PRSituationBrief,
  default as PRSituationBriefDefault,
} from './PRSituationBrief';
export type {
  PRSituationBriefData,
  PRChange,
  PRSignal,
  PRAttentionItem,
} from './PRSituationBrief';

// AI Recommendations
export {
  PRAIRecommendations,
  default as PRAIRecommendationsDefault,
} from './PRAIRecommendations';
export type {
  PRAIRecommendationsData,
  PRRecommendation,
} from './PRAIRecommendations';

// Continuity Links (Cross-Pillar)
export {
  PRContinuityLinks,
  default as PRContinuityLinksDefault,
} from './PRContinuityLinks';
export type {
  PRContinuityLinksData,
  PillarConnection,
  LinkedPillar,
} from './PRContinuityLinks';
