'use client';

/**
 * useNarrativeEntry - State Machine for Narrative Entry Flow
 *
 * Simplified state machine for the 3-act narrative entry:
 * - Act I: The Invitation (school → email → code)
 * - Act II: The Claiming (role → name → handle → field)
 * - Act III: The Crossing (interests → arrival)
 *
 * Delegates API calls to useEvolvingEntry but provides a narrative-focused interface.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useEvolvingEntry, type School, type UserRole, type UseEvolvingEntryOptions } from './useEvolvingEntry';
import type { HandleStatus } from '@hive/ui/design-system/primitives';

// ============================================
// TYPES
// ============================================

export type ActId = 'invitation' | 'claiming' | 'crossing';

export type SceneId =
  // Act I: The Invitation
  | 'school'
  | 'email'
  | 'code'
  // Act II: The Claiming
  | 'role'
  | 'name'
  | 'handle'
  | 'field'
  // Act III: The Crossing
  | 'interests'
  | 'arrival';

export type EmotionalState = 'neutral' | 'anticipation' | 'celebration';

export interface NarrativeState {
  act: ActId;
  scene: SceneId;
  isTransitioning: boolean;
  emotionalState: EmotionalState;
}

export interface NarrativeData {
  // Act I
  school: School | null;
  email: string;
  fullEmail: string;
  code: string[];

  // Act II
  role: UserRole | null;
  firstName: string;
  lastName: string;
  handle: string;
  major: string;
  graduationYear: number | null;

  // Act III
  interests: string[];
}

export interface UseNarrativeEntryReturn {
  // State
  state: NarrativeState;
  data: NarrativeData;

  // User type
  isNewUser: boolean;
  isReturningUser: boolean;

  // Loading states
  isLoading: boolean;
  isSubmittingEmail: boolean;
  isVerifyingCode: boolean;
  isSubmittingRole: boolean;
  isSubmittingIdentity: boolean;

  // Email cooldown
  resendCooldown: number;
  codeSentAt: number | null;

  // Handle validation
  handleStatus: HandleStatus;
  handleSuggestions: string[];

  // Errors
  error: string | null;
  clearError: () => void;

  // Act I: The Invitation
  setSchool: (school: School) => void;
  confirmSchool: () => void;
  setEmail: (email: string) => void;
  submitEmail: () => Promise<void>;
  setCode: (code: string[]) => void;
  verifyCode: (codeString: string) => Promise<void>;
  resendCode: () => Promise<void>;
  editEmail: () => void;

  // Act II: The Claiming
  setRole: (role: UserRole) => void;
  submitRole: () => Promise<void>;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  advanceToHandle: () => void;
  setHandle: (handle: string) => void;
  selectHandleSuggestion: (handle: string) => void;
  advanceToField: () => void;
  setMajor: (major: string) => void;
  setGraduationYear: (year: number | null) => void;
  advanceToInterests: () => void;

  // Act III: The Crossing
  setInterests: (interests: string[]) => void;
  completeEntry: () => Promise<void>;
  handleArrivalComplete: () => void;

  // Navigation
  goBack: () => void;

  // Act transition
  triggerActTransition: (callback: () => void) => void;
}

// ============================================
// SCENE TO ACT MAPPING
// ============================================

const SCENE_TO_ACT: Record<SceneId, ActId> = {
  school: 'invitation',
  email: 'invitation',
  code: 'invitation',
  role: 'claiming',
  name: 'claiming',
  handle: 'claiming',
  field: 'claiming',
  interests: 'crossing',
  arrival: 'crossing',
};

// Section ID mapping from evolving entry
const SECTION_TO_SCENE: Record<string, SceneId> = {
  school: 'school',
  email: 'email',
  code: 'code',
  role: 'role',
  'identity-name': 'name',
  'identity-handle': 'handle',
  'identity-field': 'field',
  'identity-interests': 'interests',
  arrival: 'arrival',
};

// ============================================
// HOOK
// ============================================

export function useNarrativeEntry(options: UseEvolvingEntryOptions): UseNarrativeEntryReturn {
  // Use the underlying evolving entry hook for API calls
  const evolving = useEvolvingEntry(options);

  // Local state for narrative-specific features
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // ============================================
  // DERIVED STATE
  // ============================================

  // Map active section to scene
  const currentScene = useMemo((): SceneId => {
    if (!evolving.activeSection) return 'school';
    return SECTION_TO_SCENE[evolving.activeSection] || 'school';
  }, [evolving.activeSection]);

  // Derive act from scene
  const currentAct = useMemo((): ActId => {
    return SCENE_TO_ACT[currentScene];
  }, [currentScene]);

  // Derive emotional state from current scene and status
  const emotionalState = useMemo((): EmotionalState => {
    // Celebration moments
    if (currentScene === 'arrival') return 'celebration';
    if (currentScene === 'interests' && evolving.data.interests.length >= 2) return 'anticipation';

    // Anticipation when handle is available
    if (currentScene === 'handle' && evolving.handleStatus === 'available') return 'anticipation';

    // Anticipation when code section is complete (just verified)
    if (evolving.sections.code?.status === 'complete' && currentScene === 'role') return 'anticipation';

    return 'neutral';
  }, [currentScene, evolving.handleStatus, evolving.sections.code?.status, evolving.data.interests.length]);

  // Aggregate error from sections
  const error = useMemo(() => {
    if (localError) return localError;

    // Check current section for errors
    const section = evolving.sections[evolving.activeSection || 'school'];
    return section?.error || null;
  }, [localError, evolving.sections, evolving.activeSection]);

  // Aggregate loading state
  const isLoading = evolving.isSubmittingEmail ||
    evolving.isVerifyingCode ||
    evolving.isSubmittingRole ||
    evolving.isSubmittingIdentity;

  // ============================================
  // STATE OBJECT
  // ============================================

  const state: NarrativeState = useMemo(() => ({
    act: currentAct,
    scene: currentScene,
    isTransitioning,
    emotionalState,
  }), [currentAct, currentScene, isTransitioning, emotionalState]);

  const data: NarrativeData = useMemo(() => ({
    school: evolving.data.school,
    email: evolving.data.email,
    fullEmail: evolving.fullEmail,
    code: evolving.data.verificationCode,
    role: evolving.data.role,
    firstName: evolving.data.firstName,
    lastName: evolving.data.lastName,
    handle: evolving.data.handle,
    major: evolving.data.major,
    graduationYear: evolving.data.graduationYear,
    interests: evolving.data.interests,
  }), [evolving.data, evolving.fullEmail]);

  // ============================================
  // ERROR HANDLING
  // ============================================

  const clearError = useCallback(() => {
    setLocalError(null);
    if (evolving.activeSection) {
      evolving.clearSectionError(evolving.activeSection as never);
    }
  }, [evolving]);

  // ============================================
  // ACT TRANSITION
  // ============================================

  const triggerActTransition = useCallback((callback: () => void) => {
    setIsTransitioning(true);

    // Duration matches ACT_TRANSITION.total (1.4s)
    setTimeout(() => {
      callback();
      setIsTransitioning(false);
    }, 1400);
  }, []);

  // ============================================
  // SCENE ACTIONS
  // ============================================

  // Act I: School
  const confirmSchool = useCallback(() => {
    evolving.confirmSchool();
  }, [evolving]);

  // Act I: Email
  const submitEmail = useCallback(async () => {
    await evolving.submitEmail();
  }, [evolving]);

  // Act I: Code
  const verifyCode = useCallback(async (codeString: string) => {
    await evolving.verifyEmailCode(codeString);
  }, [evolving]);

  // Act II: Role - needs act transition
  const submitRole = useCallback(async () => {
    const prevAct = currentAct;
    await evolving.submitRole();

    // If we're transitioning from invitation to claiming, trigger transition
    if (prevAct === 'invitation' && evolving.data.role !== 'alumni') {
      // Note: The actual act change will happen in the evolving hook
    }
  }, [evolving, currentAct]);

  // Act II: Name → Handle
  const advanceToHandle = useCallback(() => {
    evolving.advanceToHandle();
  }, [evolving]);

  // Act II: Handle → Field
  const advanceToField = useCallback(() => {
    evolving.advanceToField();
  }, [evolving]);

  // Act II: Field → Interests (act transition)
  const advanceToInterests = useCallback(() => {
    evolving.advanceToInterests();
  }, [evolving]);

  // Act III: Complete
  const completeEntry = useCallback(async () => {
    await evolving.completeIdentity();
  }, [evolving]);

  // ============================================
  // NAVIGATION
  // ============================================

  const goBack = useCallback(() => {
    // Going back within scenes - not implemented in evolving entry
    // For now, only email edit is supported
    if (currentScene === 'code') {
      evolving.editEmail();
    }
  }, [currentScene, evolving]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    state,
    data,

    // User type
    isNewUser: evolving.isNewUser,
    isReturningUser: evolving.isReturningUser,

    // Loading states
    isLoading,
    isSubmittingEmail: evolving.isSubmittingEmail,
    isVerifyingCode: evolving.isVerifyingCode,
    isSubmittingRole: evolving.isSubmittingRole,
    isSubmittingIdentity: evolving.isSubmittingIdentity,

    // Email cooldown
    resendCooldown: evolving.resendCooldown,
    codeSentAt: evolving.codeSentAt,

    // Handle validation
    handleStatus: evolving.handleStatus,
    handleSuggestions: evolving.handleSuggestions,

    // Errors
    error,
    clearError,

    // Act I: The Invitation
    setSchool: evolving.setSchool,
    confirmSchool,
    setEmail: evolving.setEmail,
    submitEmail,
    setCode: evolving.setVerificationCode,
    verifyCode,
    resendCode: evolving.resendCode,
    editEmail: evolving.editEmail,

    // Act II: The Claiming
    setRole: evolving.setRole,
    submitRole,
    setFirstName: evolving.setFirstName,
    setLastName: evolving.setLastName,
    advanceToHandle,
    setHandle: evolving.setHandle,
    selectHandleSuggestion: evolving.selectSuggestion,
    advanceToField,
    setMajor: evolving.setMajor,
    setGraduationYear: evolving.setGraduationYear,
    advanceToInterests,

    // Act III: The Crossing
    setInterests: evolving.setInterests,
    completeEntry,
    handleArrivalComplete: evolving.handleArrivalComplete,

    // Navigation
    goBack,

    // Act transition
    triggerActTransition,
  };
}
