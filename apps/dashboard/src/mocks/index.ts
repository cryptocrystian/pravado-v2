/**
 * MSW Mocks Index
 *
 * Re-exports MSW setup for both browser and server environments.
 *
 * IMPORTANT: Contract examples in /contracts/examples are the ONLY
 * source of truth for mock payload shapes. Do not create duplicate
 * mock data elsewhere.
 *
 * @see /contracts/examples/*.json for payload definitions
 * @see /docs/DEVELOPMENT.md for MSW usage instructions
 */

export { handlers } from './handlers';
export { initMocks } from './browser';
export { server } from './server';

// Re-export contract types for convenience
// These can be used to type API responses

export type { default as ActionStreamContract } from '../../../../contracts/examples/action-stream.json';
export type { default as IntelligenceCanvasContract } from '../../../../contracts/examples/intelligence-canvas.json';
export type { default as StrategyPanelContract } from '../../../../contracts/examples/strategy-panel.json';
export type { default as OrchestrationCalendarContract } from '../../../../contracts/examples/orchestration-calendar.json';
