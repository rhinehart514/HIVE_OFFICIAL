/**
 * HIVE Cloud Functions
 *
 * Entry point for all Firebase Cloud Functions.
 */

// ============================================================================
// AUTOMATIONS (Sprint 4)
// ============================================================================

export {
  onToolStateChange,
} from './automations/on-state-change';

export {
  runScheduledAutomations,
  runScheduledAutomationsHttp,
} from './automations/run-scheduled';
