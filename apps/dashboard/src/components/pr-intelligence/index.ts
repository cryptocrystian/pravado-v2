/**
 * PR Intelligence Components (Sprint S95)
 *
 * Best-in-class PR pillar components with:
 * - AI Recommendations (what to do)
 * - Continuity Links (cross-pillar orchestration)
 *
 * The mock-fed Situation Brief component was retired — the canonical brief is
 * the SAGE Daily Brief in the Command Center (D039).
 *
 * All components are DS v2 compliant with AI transparency
 */

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
