"use client";

/**
 * Leader Onboarding Hook
 *
 * Manages the onboarding flow for new space leaders.
 * Tracks completion of key setup tasks and shows the onboarding modal
 * when a leader first visits their space.
 *
 * Storage: localStorage with key `leader-onboarding-{spaceId}`
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export interface OnboardingTask {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  /** Action to trigger when clicking the task */
  action?: 'deploy-tool' | 'create-event' | 'invite-members' | 'customize-sidebar';
}

export interface LeaderOnboardingState {
  hasSeenWelcome: boolean;
  completedAt: number | null;
  tasks: {
    deployTool: boolean;
    createEvent: boolean;
    inviteMembers: boolean;
    customizeSidebar: boolean;
  };
  dismissedAt: number | null;
}

const DEFAULT_STATE: LeaderOnboardingState = {
  hasSeenWelcome: false,
  completedAt: null,
  tasks: {
    deployTool: false,
    createEvent: false,
    inviteMembers: false,
    customizeSidebar: false,
  },
  dismissedAt: null,
};

const STORAGE_KEY_PREFIX = "leader-onboarding-";

function getStorageKey(spaceId: string): string {
  return `${STORAGE_KEY_PREFIX}${spaceId}`;
}

function loadState(spaceId: string): LeaderOnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const stored = localStorage.getItem(getStorageKey(spaceId));
    if (!stored) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(spaceId: string, state: LeaderOnboardingState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(spaceId), JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export interface UseLeaderOnboardingOptions {
  /** The space ID to track onboarding for */
  spaceId: string | undefined;
  /** Whether the current user is a leader of this space */
  isLeader: boolean;
  /** Current member count (for invite tracking) */
  memberCount?: number;
  /** Number of deployed tools */
  deployedToolCount?: number;
  /** Number of events created */
  eventCount?: number;
}

export interface UseLeaderOnboardingReturn {
  /** Whether the onboarding modal should be shown */
  shouldShowOnboarding: boolean;
  /** Whether the setup progress widget should be shown */
  shouldShowProgress: boolean;
  /** Current onboarding state */
  state: LeaderOnboardingState;
  /** List of tasks with completion status */
  tasks: OnboardingTask[];
  /** Number of completed tasks */
  completedCount: number;
  /** Total number of tasks */
  totalCount: number;
  /** Percentage complete (0-100) */
  percentComplete: number;
  /** Mark the welcome as seen */
  markWelcomeSeen: () => void;
  /** Mark a specific task as complete */
  markTaskComplete: (taskId: keyof LeaderOnboardingState["tasks"]) => void;
  /** Dismiss the onboarding (hide modal but keep progress visible) */
  dismiss: () => void;
  /** Reset onboarding state (for testing) */
  reset: () => void;
}

export function useLeaderOnboarding(
  options: UseLeaderOnboardingOptions
): UseLeaderOnboardingReturn {
  const { spaceId, isLeader, memberCount = 0, deployedToolCount = 0, eventCount = 0 } = options;

  const [state, setState] = useState<LeaderOnboardingState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!spaceId) return;
    const loaded = loadState(spaceId);
    setState(loaded);
    setIsInitialized(true);
  }, [spaceId]);

  // Auto-complete tasks based on actual data
  useEffect(() => {
    if (!spaceId || !isInitialized) return;

    let hasChanges = false;
    const newTasks = { ...state.tasks };

    // Auto-complete deployTool if there are deployed tools
    if (deployedToolCount > 0 && !newTasks.deployTool) {
      newTasks.deployTool = true;
      hasChanges = true;
    }

    // Auto-complete createEvent if there are events
    if (eventCount > 0 && !newTasks.createEvent) {
      newTasks.createEvent = true;
      hasChanges = true;
    }

    // Auto-complete inviteMembers if there are 5+ members
    if (memberCount >= 5 && !newTasks.inviteMembers) {
      newTasks.inviteMembers = true;
      hasChanges = true;
    }

    if (hasChanges) {
      const newState = { ...state, tasks: newTasks };
      setState(newState);
      saveState(spaceId, newState);
    }
  }, [spaceId, isInitialized, deployedToolCount, eventCount, memberCount, state]);

  // Build task list for UI
  const tasks: OnboardingTask[] = useMemo(
    () => [
      {
        id: "deployTool",
        label: "Deploy your first tool",
        description: "Add a poll, countdown, or custom tool to your sidebar",
        completed: state.tasks.deployTool,
        action: 'deploy-tool' as const,
      },
      {
        id: "createEvent",
        label: "Create an event",
        description: "Schedule your first meeting or event",
        completed: state.tasks.createEvent,
        action: 'create-event' as const,
      },
      {
        id: "inviteMembers",
        label: "Invite 5 members",
        description: "Share your space link with your community",
        completed: state.tasks.inviteMembers,
        action: 'invite-members' as const,
      },
      {
        id: "customizeSidebar",
        label: "Customize your sidebar",
        description: "Arrange widgets and add quick links",
        completed: state.tasks.customizeSidebar,
        action: 'customize-sidebar' as const,
      },
    ],
    [state.tasks]
  );

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  // Determine if we should show onboarding
  const shouldShowOnboarding = useMemo(() => {
    if (!isLeader || !spaceId || !isInitialized) return false;
    if (state.hasSeenWelcome) return false;
    if (state.dismissedAt) return false;
    return true;
  }, [isLeader, spaceId, isInitialized, state.hasSeenWelcome, state.dismissedAt]);

  // Show progress widget if leader, has seen welcome, and not all complete
  const shouldShowProgress = useMemo(() => {
    if (!isLeader || !spaceId || !isInitialized) return false;
    if (completedCount >= totalCount) return false;
    if (state.completedAt) return false;
    return state.hasSeenWelcome || state.dismissedAt !== null;
  }, [isLeader, spaceId, isInitialized, completedCount, totalCount, state]);

  const markWelcomeSeen = useCallback(() => {
    if (!spaceId) return;
    const newState = { ...state, hasSeenWelcome: true };
    setState(newState);
    saveState(spaceId, newState);
  }, [spaceId, state]);

  const markTaskComplete = useCallback(
    (taskId: keyof LeaderOnboardingState["tasks"]) => {
      if (!spaceId) return;
      const newTasks = { ...state.tasks, [taskId]: true };
      const allComplete = Object.values(newTasks).every(Boolean);
      const newState: LeaderOnboardingState = {
        ...state,
        tasks: newTasks,
        completedAt: allComplete ? Date.now() : null,
      };
      setState(newState);
      saveState(spaceId, newState);
    },
    [spaceId, state]
  );

  const dismiss = useCallback(() => {
    if (!spaceId) return;
    const newState = { ...state, dismissedAt: Date.now() };
    setState(newState);
    saveState(spaceId, newState);
  }, [spaceId, state]);

  const reset = useCallback(() => {
    if (!spaceId) return;
    setState(DEFAULT_STATE);
    saveState(spaceId, DEFAULT_STATE);
  }, [spaceId]);

  return {
    shouldShowOnboarding,
    shouldShowProgress,
    state,
    tasks,
    completedCount,
    totalCount,
    percentComplete,
    markWelcomeSeen,
    markTaskComplete,
    dismiss,
    reset,
  };
}

export default useLeaderOnboarding;
