/**
 * Entry Flow Components
 *
 * Unified entry experience for the /enter page
 *
 * Primary flow: Entry (4-phase)
 * - Gate: Email + code verification
 * - Naming: Real identity claim (THE WEDGE)
 * - Field: Year + major selection
 * - Crossing: Interests selection
 */

// Primary Entry Component (4-phase flow)
export { Entry, clashDisplay } from './Entry';

// 4-Phase Screen Components
export {
  GateScreen,
  NamingScreen,
  FieldScreen,
  CrossingScreen,
} from './screens';

// Layout
export { EntryShell, EntryShellStatic, type EntryShellProps, type EntryStep } from './EntryShell';
export { NarrativeShell, type NarrativeShellProps } from './NarrativeShell';
export { EntryProgress } from './EntryProgress';

// Legacy: Evolving Entry (single-page flow)
export { EvolvingEntry } from './EvolvingEntry';

// Legacy: Narrative Entry (3-act cinematic flow)
export { NarrativeEntry } from './NarrativeEntry';

// Section components (legacy)
export {
  SchoolSection,
  AVAILABLE_SCHOOLS,
  EmailSection,
  CodeSection,
  RoleSection,
  IdentitySection,
  ArrivalSection,
  AlumniWaitlistSection,
} from './sections';

// Acts and Scenes (narrative flow)
export { ActOne, ActTwo, ActThree } from './acts';
export {
  InvitationScene,
  ProofScene,
  GateScene as NarrativeGateScene,
  RoleScene,
  NameScene,
  HandleScene,
  FieldScene as NarrativeFieldScene,
  PassionsScene,
  ArrivalScene,
} from './scenes';

// Primitives for entry flow
export * from './primitives';

// Motion components
export * from './motion';

// Hooks
export {
  // Primary hook
  useEntry,
  type EntryPhase,
  type GateStep,
  type FieldStep,
  type EntryData,
  type EntryState,
  type UseEntryOptions,
  type UseEntryReturn,
  type WaitlistSchoolInfo,
  // Legacy hooks
  useEvolvingEntry,
  useNarrativeEntry,
  type SectionId,
  type SectionState,
  type SectionStatus,
  type School,
  type UserRole,
  type AccessCodeLockout,
  type UseEvolvingEntryOptions,
  type UseEvolvingEntryReturn,
  type ActId,
  type NarrativeSceneId,
  type EmotionalState,
  type NarrativeState,
  type NarrativeData,
  type UseNarrativeEntryReturn,
} from './hooks';
