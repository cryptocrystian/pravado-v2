/**
 * PR Work Surface V1.1 Components
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/PR_INBOX_CONTRACT.md
 * @see /docs/canon/PR_CONTACT_LEDGER_CONTRACT.md
 * @see /docs/canon/PR_PITCH_PIPELINE_CONTRACT.md
 */

// Types
export * from './types';
export type { PRTab } from './PRWorkSurfaceShell';

// Core Components
export { PRWorkSurfaceShell } from './PRWorkSurfaceShell';
export { PRInbox } from './views/PRInbox';
export { PROverview } from './views/PROverview';
export { PRDatabase } from './views/PRDatabase';
export { PRPitches } from './views/PRPitches';
export { PRCoverage } from './views/PRCoverage';
export { PRDistribution } from './views/PRDistribution';
export { PRSettings } from './views/PRSettings';
export { PRPitchPipeline } from './views/PRPitchPipeline';

// Shared Components
export { DistributionDecisionMatrix } from './components/DistributionDecisionMatrix';
export { ContactDetailDrawer } from './components/ContactDetailDrawer';
export { ContactRelationshipLedger } from './components/ContactRelationshipLedger';
export { ImpactStrip, SAGETag, EVIIndicator, ModeBadge } from './components/ImpactStrip';
export { PitchComposer } from './components/PitchComposer';
export { AttentionQueue } from './components/AttentionQueue';
export { CopilotSuggestions } from './components/CopilotSuggestions';
export { MediaContactTable } from './components/MediaContactTable';
export { RelationshipBadge } from './components/RelationshipBadge';
export { TopicCurrencyIndicator } from './components/TopicCurrencyIndicator';
