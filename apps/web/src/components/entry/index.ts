/**
 * Entry Flow Components
 *
 * Unified entry experience for the /enter page
 */

// Layout
export { EntryShell, EntryShellStatic, type EntryShellProps, type EntryStep } from './EntryShell';
export { EntryProgress } from './EntryProgress';

// Evolving Entry (new single-page flow)
export { EvolvingEntry } from './EvolvingEntry';

// State components (legacy - kept for reference)
export {
  SchoolState,
  type SchoolStateProps,
  type School as LegacySchool,
  EmailState,
  type EmailStateProps,
  CodeState,
  type CodeStateProps,
  RoleState,
  type RoleStateProps,
  type UserRole as LegacyUserRole,
  IdentityState,
  type IdentityStateProps,
  ArrivalState,
  type ArrivalStateProps,
  AlumniWaitlistState,
  type AlumniWaitlistStateProps,
} from './states';

// Section components (new evolving flow)
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

// Primitives for entry flow
export * from './primitives';

// Motion components
export * from './motion';

// Hooks
export {
  useEntryMachine,
  type EntryState,
  type EntryData,
  type UseEntryMachineOptions,
  type UseEntryMachineReturn,
  useEvolvingEntry,
  type SectionId,
  type SectionState,
  type SectionStatus,
  type School,
  type UserRole,
  type UseEvolvingEntryOptions,
  type UseEvolvingEntryReturn,
} from './hooks';
