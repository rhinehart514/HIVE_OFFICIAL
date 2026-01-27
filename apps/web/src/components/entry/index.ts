/**
 * Entry Flow Components
 *
 * Unified entry experience for the /enter page
 */

// Layout
export { EntryShell, EntryShellStatic, type EntryShellProps, type EntryStep } from './EntryShell';
export { EntryProgress } from './EntryProgress';

// Evolving Entry (single-page flow)
export { EvolvingEntry } from './EvolvingEntry';

// Section components
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
  useEvolvingEntry,
  type SectionId,
  type SectionState,
  type SectionStatus,
  type School,
  type UserRole,
  type AccessCodeLockout,
  type UseEvolvingEntryOptions,
  type UseEvolvingEntryReturn,
} from './hooks';
