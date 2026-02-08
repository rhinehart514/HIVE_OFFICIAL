'use client';

/**
 * SignupSheet Element
 *
 * Slot-based signups for office hours, volunteer shifts, study sessions.
 * Config: slots (name, time, capacity), allowMultipleSignups
 * Actions: signup, withdraw
 * State: collections.signups
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { ClipboardDocumentListIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface SlotConfig {
  id: string;
  name: string;
  time: string;
  capacity: number;
}

interface SignupEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: {
    slotId: string;
    userId: string;
    userName: string;
    signedUpAt: string;
  };
}

interface SignupSheetConfig {
  slots?: SlotConfig[];
  allowMultipleSignups?: boolean;
  title?: string;
}

interface SignupSheetElementProps extends ElementProps {
  config: SignupSheetConfig;
  mode?: ElementMode;
}

// ============================================================
// SignupSheet Element
// ============================================================

export function SignupSheetElement({
  id,
  config,
  data,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: SignupSheetElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'signup-sheet';

  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [justSignedUp, setJustSignedUp] = useState<string | null>(null);

  const slots: SlotConfig[] = config.slots || [
    { id: 'slot-1', name: 'Slot 1', time: '9:00 AM', capacity: 5 },
    { id: 'slot-2', name: 'Slot 2', time: '10:00 AM', capacity: 5 },
  ];

  const allowMultiple = config.allowMultipleSignups ?? false;

  // Extract signups from shared state collections
  const signupsKey = `${instanceId}:signups`;
  const signupsMap = (sharedState?.collections?.[signupsKey] || {}) as Record<string, SignupEntry>;
  const allSignups = Object.values(signupsMap);

  const currentUserId = context?.userId || userState?.userId as string || '';

  // Group signups by slot
  const signupsBySlot = useMemo(() => {
    const map: Record<string, SignupEntry[]> = {};
    for (const signup of allSignups) {
      const slotId = signup.data?.slotId;
      if (slotId) {
        if (!map[slotId]) map[slotId] = [];
        map[slotId].push(signup);
      }
    }
    return map;
  }, [allSignups]);

  // Check if current user signed up for a given slot
  const isUserSignedUp = useCallback((slotId: string) => {
    return (signupsBySlot[slotId] || []).some(s => s.data?.userId === currentUserId);
  }, [signupsBySlot, currentUserId]);

  // Check if user signed up for any slot
  const userSignupCount = useMemo(() => {
    return allSignups.filter(s => s.data?.userId === currentUserId).length;
  }, [allSignups, currentUserId]);

  const handleSignup = useCallback(async (slotId: string) => {
    if (loadingSlotId) return;
    setLoadingSlotId(slotId);

    onAction?.('signup', { slotId });

    setJustSignedUp(slotId);
    setTimeout(() => setJustSignedUp(null), 1000);
    setLoadingSlotId(null);
  }, [loadingSlotId, onAction]);

  const handleWithdraw = useCallback(async (slotId: string) => {
    if (loadingSlotId) return;
    setLoadingSlotId(slotId);

    onAction?.('withdraw', { slotId });

    setLoadingSlotId(null);
  }, [loadingSlotId, onAction]);

  return (
    <StateContainer status="success">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold">{config.title || 'Sign Up Sheet'}</span>
          </div>

          {/* Slots */}
          <div className="space-y-3">
            {slots.map((slot) => {
              const slotSignups = signupsBySlot[slot.id] || [];
              const filledCount = slotSignups.length;
              const isFull = filledCount >= slot.capacity;
              const userInSlot = isUserSignedUp(slot.id);
              const canSignup = !isFull && !userInSlot && (allowMultiple || userSignupCount === 0);

              return (
                <motion.div
                  key={slot.id}
                  initial={false}
                  animate={justSignedUp === slot.id ? { scale: [1, 1.01, 1] } : {}}
                  transition={springPresets.snappy}
                  className={`border rounded-lg p-4 transition-colors ${
                    userInSlot
                      ? 'border-primary/50 bg-primary/5'
                      : isFull
                        ? 'border-border bg-muted/30'
                        : 'border-border'
                  }`}
                >
                  {/* Slot header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{slot.name}</div>
                      <div className="text-xs text-muted-foreground">{slot.time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        <AnimatedNumber value={filledCount} springOptions={numberSpringPresets.quick} />
                        /{slot.capacity}
                      </span>
                      {userInSlot ? (
                        <Button
                          onClick={() => handleWithdraw(slot.id)}
                          disabled={loadingSlotId === slot.id}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          aria-label={`Withdraw from ${slot.name}`}
                        >
                          <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                          Withdraw
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSignup(slot.id)}
                          disabled={!canSignup || loadingSlotId === slot.id}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          aria-label={`Sign up for ${slot.name}`}
                        >
                          <UserPlusIcon className="h-3.5 w-3.5 mr-1" />
                          {isFull ? 'Full' : 'Sign Up'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Signed up users */}
                  <AnimatePresence>
                    {slotSignups.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-1.5 mt-2"
                      >
                        {slotSignups.map((signup) => (
                          <span
                            key={signup.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                              signup.data?.userId === currentUserId
                                ? 'bg-primary/20 text-primary font-medium'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {signup.data?.userName || 'Anonymous'}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Capacity bar */}
                  <div className="mt-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-red-500' : filledCount > slot.capacity * 0.8 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (filledCount / slot.capacity) * 100)}%` }}
                        transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          {!allowMultiple && userSignupCount > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              You can only sign up for one slot
            </div>
          )}
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default SignupSheetElement;
