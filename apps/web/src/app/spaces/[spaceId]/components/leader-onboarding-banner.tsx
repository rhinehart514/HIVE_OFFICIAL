'use client';

/**
 * Leader Onboarding Banner
 *
 * Shows post-claim onboarding checklist for new space leaders.
 * Persists until all 3 items are complete:
 * 1. Customize your space (avatar/banner)
 * 2. Invite your first members
 * 3. Create your first event
 *
 * @version 1.0.0 - Spaces Perfection Plan (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  PhotoIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@hive/ui';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingStep {
  id: 'customize' | 'invite' | 'event';
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  completed: boolean;
}

interface LeaderOnboardingBannerProps {
  spaceId: string;
  hasAvatar: boolean;
  hasBanner: boolean;
  memberCount: number;
  eventCount: number;
  onOpenInviteModal?: () => void;
  onOpenEventModal?: () => void;
}

// =============================================================================
// STORAGE HELPERS
// =============================================================================

const STORAGE_KEY = 'hive_leader_onboarding';

interface OnboardingState {
  [spaceId: string]: {
    dismissed: boolean;
    dismissedAt?: string;
    completedSteps: string[];
    shownAt: string;
  };
}

function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function isRecentlyClaimed(spaceId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const claimed = localStorage.getItem(`hive_just_claimed_${spaceId}`);
    if (!claimed) return false;
    // Check if claimed within last 5 minutes
    const claimedAt = new Date(claimed);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return claimedAt > fiveMinutesAgo;
  } catch {
    return false;
  }
}

function clearClaimFlag(spaceId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`hive_just_claimed_${spaceId}`);
  } catch {
    // Ignore
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LeaderOnboardingBanner({
  spaceId,
  hasAvatar,
  hasBanner,
  memberCount,
  eventCount,
  onOpenInviteModal,
  onOpenEventModal,
}: LeaderOnboardingBannerProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);

  // Determine step completion
  const hasCustomized = hasAvatar || hasBanner;
  const hasInvited = memberCount > 1; // More than just the leader
  const hasEvent = eventCount > 0;

  const steps: OnboardingStep[] = [
    {
      id: 'customize',
      title: 'Customize your space',
      description: 'Add an avatar and banner',
      icon: PhotoIcon,
      action: 'Settings',
      completed: hasCustomized,
    },
    {
      id: 'invite',
      title: 'Invite your first members',
      description: 'Share your invite link',
      icon: UserPlusIcon,
      action: 'Invite',
      completed: hasInvited,
    },
    {
      id: 'event',
      title: 'Create your first event',
      description: 'Get people together',
      icon: CalendarDaysIcon,
      action: 'Create',
      completed: hasEvent,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;
  const progress = (completedCount / steps.length) * 100;

  // Check if we should show the banner
  React.useEffect(() => {
    setMounted(true);

    const state = getOnboardingState();
    const spaceState = state[spaceId];

    // If all complete, never show
    if (allComplete) {
      setShowBanner(false);
      return;
    }

    // If dismissed, check if it was a temporary dismiss or permanent
    if (spaceState?.dismissed) {
      setIsDismissed(true);
      setShowBanner(false);
      return;
    }

    // If recently claimed, always show
    if (isRecentlyClaimed(spaceId)) {
      setShowBanner(true);
      // Clear the claim flag
      clearClaimFlag(spaceId);
      // Record that we showed it
      setOnboardingState({
        ...state,
        [spaceId]: {
          ...spaceState,
          dismissed: false,
          completedSteps: steps.filter((s) => s.completed).map((s) => s.id),
          shownAt: new Date().toISOString(),
        },
      });
      return;
    }

    // If we've shown before and not all complete, show again
    if (spaceState?.shownAt && !allComplete) {
      setShowBanner(true);
      return;
    }

    // Default: don't show unless just claimed
    setShowBanner(false);
  }, [spaceId, allComplete, steps]);

  const handleDismiss = () => {
    setIsDismissed(true);
    const state = getOnboardingState();
    setOnboardingState({
      ...state,
      [spaceId]: {
        ...state[spaceId],
        dismissed: true,
        dismissedAt: new Date().toISOString(),
        completedSteps: steps.filter((s) => s.completed).map((s) => s.id),
        shownAt: state[spaceId]?.shownAt || new Date().toISOString(),
      },
    });
  };

  const handleStepAction = (step: OnboardingStep) => {
    if (step.completed) return;

    switch (step.id) {
      case 'customize':
        router.push(`/spaces/${spaceId}/settings`);
        break;
      case 'invite':
        onOpenInviteModal?.();
        break;
      case 'event':
        onOpenEventModal?.();
        break;
    }
  };

  // Don't render on server or if dismissed
  if (!mounted || isDismissed || !showBanner || allComplete) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="mx-4 mb-4"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-life-gold/10 via-life-gold/5 to-transparent border border-life-gold/20 p-4">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-life-gold/20">
              <SparklesIcon className="h-4 w-4 text-life-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Welcome, Leader!
              </h3>
              <p className="text-xs text-white/50">
                Complete these steps to get your space started
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/50">Progress</span>
              <span className="text-life-gold font-medium">
                {completedCount}/{steps.length} complete
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-life-gold rounded-full"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepAction(step)}
                  disabled={step.completed}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors',
                    step.completed
                      ? 'bg-white/5 cursor-default'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      step.completed
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-white/40'
                    )}
                  >
                    {step.completed ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        step.completed ? 'text-white/50 line-through' : 'text-white'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-white/40">{step.description}</p>
                  </div>
                  {!step.completed && (
                    <div className="flex items-center gap-1 text-xs text-life-gold">
                      <span>{step.action}</span>
                      <ChevronRightIcon className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
