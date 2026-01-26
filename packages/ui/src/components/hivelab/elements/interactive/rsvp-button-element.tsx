'use client';

/**
 * RSVP Button Element - Refactored with Core Abstractions
 *
 * Event signup with capacity tracking:
 * - useRsvpState hook for state management
 * - StateContainer for loading/error states
 * - Waitlist support when at capacity
 */

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { UserPlusIcon, UsersIcon, CheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { useRsvpState, StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface RsvpConfig {
  eventName?: string;
  eventDate?: string;
  maxAttendees?: number;
  showCount?: boolean;
  requireConfirmation?: boolean;
  allowWaitlist?: boolean;
}

interface RsvpButtonElementProps extends ElementProps {
  config: RsvpConfig;
  mode?: ElementMode;
}

// ============================================================
// RSVP Button Element
// ============================================================

export function RsvpButtonElement({
  id,
  config,
  data,
  onChange,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: RsvpButtonElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'rsvp';
  const maxAttendees = config.maxAttendees ?? 100;

  // Use core state hook
  const rsvpState = useRsvpState(instanceId, maxAttendees, sharedState, userState);

  // Extract state values
  const {
    attendeeCount: sharedAttendeeCount,
    isRsvped: sharedIsRsvped,
    isWaitlisted: sharedIsWaitlisted,
    waitlistPosition: sharedWaitlistPosition,
    isFull: sharedIsFull,
  } = rsvpState.value ?? {
    attendeeCount: 0,
    isRsvped: false,
    isWaitlisted: false,
    waitlistPosition: null,
    isFull: false,
  };

  // Legacy data fallback
  const legacyCount = (data?.count as number) ?? Object.keys(data?.attendees ?? {}).length ?? 0;
  const legacyIsRsvped = (data?.userRsvp as string) === 'yes';
  const legacyIsOnWaitlist = (data?.userOnWaitlist as boolean) ?? false;
  const legacyWaitlistPosition = (data?.userWaitlistPosition as number) ?? null;

  // Use shared state if available, otherwise legacy
  const hasSharedState = sharedState && Object.keys(sharedState.counters ?? {}).length > 0;

  const [isRsvped, setIsRsvped] = useState(hasSharedState ? sharedIsRsvped : legacyIsRsvped);
  const [rsvpCount, setRsvpCount] = useState(hasSharedState ? sharedAttendeeCount : legacyCount);
  const [isOnWaitlist, setIsOnWaitlist] = useState(hasSharedState ? sharedIsWaitlisted : legacyIsOnWaitlist);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(
    hasSharedState ? sharedWaitlistPosition : legacyWaitlistPosition
  );

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
  const [justRsvped, setJustRsvped] = useState(false);
  const [justJoinedWaitlist, setJustJoinedWaitlist] = useState(false);

  // Sync with external state changes
  useEffect(() => {
    if (hasSharedState) {
      setRsvpCount(sharedAttendeeCount);
      setIsRsvped(sharedIsRsvped);
      setIsOnWaitlist(sharedIsWaitlisted);
      setWaitlistPosition(sharedWaitlistPosition);
    }
  }, [hasSharedState, sharedAttendeeCount, sharedIsRsvped, sharedIsWaitlisted, sharedWaitlistPosition]);

  // Derived values
  const isFull = maxAttendees ? rsvpCount >= maxAttendees : false;
  const capacityPercentage = maxAttendees ? Math.min(100, (rsvpCount / maxAttendees) * 100) : 0;
  const spotsLeft = maxAttendees ? Math.max(0, maxAttendees - rsvpCount) : null;

  const getCapacityColor = () => {
    if (isFull) return 'bg-red-500';
    if (capacityPercentage >= 90) return 'bg-orange-500';
    if (capacityPercentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Handlers
  const handleRsvp = useCallback(async () => {
    if ((isFull && !isRsvped) || isLoading) return;

    setIsLoading(true);
    const newState = !isRsvped;

    // Optimistic update
    setIsRsvped(newState);
    setRsvpCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));

    if (newState) {
      setJustRsvped(true);
      setTimeout(() => setJustRsvped(false), 1500);
    }

    // Call handlers
    onChange?.({ isRsvped: newState, rsvpCount: rsvpCount + (newState ? 1 : -1) });
    onAction?.(newState ? 'rsvp' : 'cancel_rsvp', {
      response: newState ? 'yes' : 'no',
      eventName: config.eventName,
    });

    setIsLoading(false);
  }, [isFull, isRsvped, isLoading, rsvpCount, config.eventName, onChange, onAction]);

  const handleWaitlistToggle = useCallback(async () => {
    if (isWaitlistLoading) return;

    setIsWaitlistLoading(true);
    const newState = !isOnWaitlist;

    // Optimistic update
    setIsOnWaitlist(newState);
    if (newState) {
      setWaitlistPosition((waitlistPosition ?? 0) + 1);
      setJustJoinedWaitlist(true);
      setTimeout(() => setJustJoinedWaitlist(false), 1500);
    } else {
      setWaitlistPosition(null);
    }

    // Call handlers
    onChange?.({
      isOnWaitlist: newState,
      waitlistPosition: newState ? (waitlistPosition ?? 0) + 1 : null,
    });
    onAction?.(newState ? 'join_waitlist' : 'leave_waitlist', {
      eventName: config.eventName,
      position: newState ? (waitlistPosition ?? 0) + 1 : null,
    });

    setIsWaitlistLoading(false);
  }, [isOnWaitlist, isWaitlistLoading, waitlistPosition, config.eventName, onChange, onAction]);

  return (
    <StateContainer status={rsvpState.status}>
      <motion.div
        initial={false}
        animate={justRsvped ? { scale: [1, 1.02, 1] } : {}}
        transition={springPresets.bouncy}
      >
        <Card
          className={`overflow-hidden transition-all duration-300 ${
            isRsvped
              ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
              : ''
          }`}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold">{config.eventName || 'Event'}</div>
                {config.eventDate && (
                  <div className="text-sm text-muted-foreground">{config.eventDate}</div>
                )}
              </div>

              {/* Attendee Count */}
              {config.showCount !== false && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4" />
                  <AnimatedNumber value={rsvpCount} springOptions={numberSpringPresets.quick} />
                  {maxAttendees && <span>/ {maxAttendees}</span>}
                </div>
              )}
            </div>

            {/* Capacity Bar */}
            {maxAttendees && (
              <div className="mb-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full transition-colors ${getCapacityColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${capacityPercentage}%` }}
                    transition={springPresets.default}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  {isFull ? (
                    <span className="text-red-500 font-medium">Event is full</span>
                  ) : (
                    <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                  )}
                </div>
              </div>
            )}

            {/* RSVP Button */}
            <div className="space-y-3">
              <motion.div
                whileHover={!isFull || isRsvped ? { scale: 1.02 } : {}}
                whileTap={!isFull || isRsvped ? { scale: 0.98 } : {}}
              >
                <Button
                  onClick={handleRsvp}
                  disabled={isLoading || (isFull && !isRsvped)}
                  variant={isRsvped ? 'default' : 'outline'}
                  className={`w-full transition-all ${
                    isRsvped
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : isFull
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        ...
                      </motion.span>
                    ) : isRsvped ? (
                      <motion.span
                        key="rsvped"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <CheckIcon className="h-4 w-4" />
                        You're Going!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="rsvp"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                        {isFull ? 'Event Full' : 'RSVP'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Waitlist Button */}
              {config.allowWaitlist && isFull && !isRsvped && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springPresets.gentle}
                >
                  <Button
                    onClick={handleWaitlistToggle}
                    disabled={isWaitlistLoading}
                    variant="ghost"
                    className={`w-full ${isOnWaitlist ? 'text-amber-600' : ''}`}
                  >
                    {isOnWaitlist ? (
                      <span className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4" />
                        On Waitlist #{waitlistPosition}
                      </span>
                    ) : (
                      'Join Waitlist'
                    )}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Success celebration */}
            <AnimatePresence>
              {justRsvped && !prefersReducedMotion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-center text-sm text-green-600"
                >
                  See you there!
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </StateContainer>
  );
}

export default RsvpButtonElement;
