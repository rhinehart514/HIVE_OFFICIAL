"use client";

/**
 * FoundingClass Ritual Hook
 *
 * Tracks a leader's progress toward the FoundingClass ritual - the first 50 leaders
 * to fully activate their spaces during January (Leader Month).
 *
 * Completion criteria:
 * - Deploy a tool
 * - Create an event
 * - Invite 5+ members
 * - Customize sidebar
 *
 * Uses leader onboarding progress as the ritual progress metric.
 *
 * @version 1.0.0 - January 2026 launch
 */

import { useMemo } from "react";
import type { UseLeaderOnboardingReturn } from "./use-leader-onboarding";

export interface FoundingClassRitualData {
  id: string;
  name: string;
  description: string;
  icon?: string;
  progress: number; // 0-100
  participantCount: number;
  timeRemaining?: string;
  isParticipating: boolean;
}

export interface UseFoundingClassRitualOptions {
  /** Whether the user is a verified leader */
  isLeader: boolean;
  /** Whether the FoundingClass feature flag is enabled */
  isEnabled: boolean;
  /** Leader onboarding data from useLeaderOnboarding */
  leaderOnboarding: UseLeaderOnboardingReturn;
  /** Number of participants in the ritual (for display) */
  participantCount?: number;
}

export interface UseFoundingClassRitualReturn {
  /** Whether to show the ritual banner */
  shouldShowRitual: boolean;
  /** Ritual data for RitualStrip component */
  ritualData: FoundingClassRitualData | null;
  /** Whether the user is eligible (leader + flag enabled) */
  isEligible: boolean;
  /** Whether the ritual is complete */
  isComplete: boolean;
}

/**
 * Calculate time remaining until January 31, 2026 (end of Leader Month)
 */
function calculateTimeRemaining(): string | undefined {
  const deadline = new Date("2026-01-31T23:59:59");
  const now = new Date();

  // If past deadline, no time remaining
  if (now > deadline) {
    return undefined;
  }

  const diff = deadline.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

/**
 * Hook for tracking FoundingClass ritual progress
 *
 * @example
 * ```tsx
 * const { shouldShowRitual, ritualData } = useFoundingClassRitual({
 *   isLeader: true,
 *   isEnabled: true,
 *   leaderOnboarding,
 *   participantCount: 23,
 * });
 *
 * if (shouldShowRitual && ritualData) {
 *   return <RitualStrip ritual={ritualData} />;
 * }
 * ```
 */
export function useFoundingClassRitual(
  options: UseFoundingClassRitualOptions
): UseFoundingClassRitualReturn {
  const {
    isLeader,
    isEnabled,
    leaderOnboarding,
    participantCount = 0,
  } = options;

  const isEligible = isLeader && isEnabled;
  const isComplete = leaderOnboarding.percentComplete >= 100;

  // Should show if:
  // - User is eligible (leader + flag enabled)
  // - Not yet complete (hide when 100%)
  // - Has seen the welcome (started the onboarding)
  const shouldShowRitual = useMemo(() => {
    if (!isEligible) return false;
    if (isComplete) return false;

    // Only show if leader has started (seen welcome or has some progress)
    return leaderOnboarding.state.hasSeenWelcome || leaderOnboarding.completedCount > 0;
  }, [isEligible, isComplete, leaderOnboarding.state.hasSeenWelcome, leaderOnboarding.completedCount]);

  const ritualData: FoundingClassRitualData | null = useMemo(() => {
    if (!isEligible) return null;

    return {
      id: "founding-class-2026",
      name: "Founding Leader Class of 2026",
      description: "Complete your space setup to earn permanent Founding Leader status",
      icon: "🏆",
      progress: leaderOnboarding.percentComplete,
      participantCount,
      timeRemaining: calculateTimeRemaining(),
      isParticipating: true, // Leaders are auto-enrolled
    };
  }, [isEligible, leaderOnboarding.percentComplete, participantCount]);

  return {
    shouldShowRitual,
    ritualData,
    isEligible,
    isComplete,
  };
}

export default useFoundingClassRitual;
