/**
 * Shared AI Components
 *
 * Cross-pillar AI state indicators and perception utilities.
 * Used by Content, PR, and SEO pillars for consistent AI communication.
 *
 * @see /docs/canon/AI_VISUAL_COMMUNICATION_CANON.md
 */

// AI Perception module
export {
  type AIPerceptualState,
  type AIPerceptualSignal,
  type GenericGateStatus,
  type GenericAutomationMode,
  type ConfidenceLevel,
  AI_STATE_PRIORITY,
  AI_PERCEPTUAL_SIGNALS,
  CONFIDENCE_SIGNALS,
  deriveAIPerceptualState,
  deriveUrgencyFromDeadline,
  getHighestPriorityState,
  getConfidenceLevel,
} from './ai-perception';

// AI State Indicator components
export {
  AmbientAIIndicator,
  LocalAIIndicator,
  AIStateDot,
  AIStateRing,
  AIProgressIndicator,
} from './AIStateIndicator';
