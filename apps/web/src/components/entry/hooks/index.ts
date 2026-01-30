/**
 * Entry Flow Hooks
 */

// 4-phase entry flow (primary)
export {
  useEntry,
  type EntryPhase,
  type GateStep,
  type FieldStep,
  type EntryData,
  type EntryState,
  type UseEntryOptions,
  type UseEntryReturn,
  type WaitlistSchoolInfo,
} from './useEntry';

// Legacy: Evolving entry (single-page flow)
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
} from './useEvolvingEntry';

// Legacy: Narrative entry (3-act cinematic flow)
export {
  useNarrativeEntry,
  type ActId,
  type SceneId as NarrativeSceneId,
  type EmotionalState,
  type NarrativeState,
  type NarrativeData,
  type UseNarrativeEntryReturn,
} from './useNarrativeEntry';
