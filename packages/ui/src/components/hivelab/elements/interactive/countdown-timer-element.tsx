'use client';

/**
 * Countdown Timer Element - Refactored with Core Abstractions
 *
 * Live countdown to any date/time with:
 * - Flip-digit animation
 * - Urgency-based color cascade
 * - Completion celebration
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Card, CardContent } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface CountdownConfig {
  seconds?: number;
  targetDate?: string;
  label?: string;
  showDays?: boolean;
  onComplete?: string;
}

interface CountdownTimerElementProps extends ElementProps {
  config: CountdownConfig;
  mode?: ElementMode;
}

type UrgencyLevel = 'calm' | 'warning' | 'urgent' | 'critical';

// ============================================================
// Flip Digit Component
// ============================================================

function FlipDigit({ value, urgencyLevel }: { value: string; urgencyLevel: UrgencyLevel }) {
  const prefersReducedMotion = useReducedMotion();

  const colorClasses: Record<UrgencyLevel, string> = {
    calm: 'text-foreground',
    warning: 'text-amber-500',
    urgent: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <div className="relative h-[56px] w-[40px] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={prefersReducedMotion ? false : { y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 56, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`absolute inset-0 flex items-center justify-center text-4xl font-bold tabular-nums ${colorClasses[urgencyLevel]}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Time Unit Component
// ============================================================

function TimeUnit({
  value,
  label,
  urgencyLevel,
  pulse = false,
}: {
  value: number;
  label: string;
  urgencyLevel: UrgencyLevel;
  pulse?: boolean;
}) {
  const paddedValue = value.toString().padStart(2, '0');
  const digits = paddedValue.split('');

  return (
    <motion.div
      className="text-center"
      animate={pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={pulse ? { duration: 1, repeat: Infinity, repeatType: 'loop' } : {}}
    >
      <div className="flex items-center justify-center">
        {digits.map((digit, i) => (
          <FlipDigit key={`${label}-${i}`} value={digit} urgencyLevel={urgencyLevel} />
        ))}
      </div>
      <div className="text-xs text-muted-foreground uppercase mt-1">{label}</div>
    </motion.div>
  );
}

// ============================================================
// Colon Separator
// ============================================================

function ColonSeparator({ animate }: { animate: boolean }) {
  return (
    <motion.div
      className="text-2xl font-bold text-muted-foreground self-start mt-2"
      animate={animate ? { opacity: [1, 0.3, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    >
      :
    </motion.div>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function formatTime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return {
    days,
    hours,
    mins,
    secs,
    showDays: days > 0,
  };
}

function getUrgencyLevel(seconds: number): UrgencyLevel {
  if (seconds <= 60) return 'critical';
  if (seconds <= 300) return 'urgent';
  if (seconds <= 3600) return 'warning';
  return 'calm';
}

// ============================================================
// Main Countdown Timer Element
// ============================================================

export function CountdownTimerElement({
  id,
  config,
  data,
  onChange,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: CountdownTimerElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Hydrate from server state
  const serverTimeLeft = (data?.timeLeft as number) ?? null;
  const serverFinished = (data?.finished as boolean) ?? false;

  // Calculate initial time
  const calculateInitialTime = useCallback(() => {
    if (serverTimeLeft !== null) return serverTimeLeft;
    if (config.targetDate) {
      const target = new Date(config.targetDate).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((target - now) / 1000));
    }
    return config.seconds ?? 3600;
  }, [serverTimeLeft, config.targetDate, config.seconds]);

  const [timeLeft, setTimeLeft] = useState(calculateInitialTime);
  const [finished, setFinished] = useState(serverFinished);
  const [justFinished, setJustFinished] = useState(false);

  // Sync with server state
  useEffect(() => {
    if (serverTimeLeft !== null) setTimeLeft(serverTimeLeft);
    if (serverFinished) setFinished(true);
  }, [serverTimeLeft, serverFinished]);

  // Countdown logic
  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      setFinished(true);
      setJustFinished(true);
      onChange?.({ finished: true, timeLeft: 0 });
      onAction?.('finished', { completedAt: new Date().toISOString() });
      setTimeout(() => setJustFinished(false), 2000);
      return;
    }

    if (finished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setFinished(true);
          setJustFinished(true);
          onChange?.({ finished: true, timeLeft: 0 });
          onAction?.('finished', { completedAt: new Date().toISOString() });
          setTimeout(() => setJustFinished(false), 2000);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, finished, onChange, onAction]);

  // Derived values
  const time = formatTime(timeLeft);
  const urgencyLevel = getUrgencyLevel(timeLeft);
  const shouldPulse = timeLeft <= 60 && timeLeft > 0;

  // Styling based on urgency
  const gradientClasses: Record<UrgencyLevel, string> = {
    calm: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
    warning: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    urgent: 'from-orange-500/15 to-red-500/10 border-orange-500/30',
    critical: 'from-red-500/20 to-rose-500/15 border-red-500/40',
  };

  const iconColorClasses: Record<UrgencyLevel, string> = {
    calm: 'text-blue-500',
    warning: 'text-amber-500',
    urgent: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <StateContainer status="complete">
      <motion.div
        initial={false}
        animate={justFinished ? { scale: [1, 1.05, 1] } : {}}
        transition={springPresets.bouncy}
      >
        <Card className={`bg-gradient-to-br transition-colors duration-500 ${gradientClasses[urgencyLevel]}`}>
          <CardContent className="p-6 text-center">
            {/* Header */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              animate={shouldPulse && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
              transition={shouldPulse ? { duration: 1, repeat: Infinity } : {}}
            >
              <motion.div
                animate={shouldPulse && !prefersReducedMotion ? { rotate: [0, -10, 10, 0] } : {}}
                transition={shouldPulse ? { duration: 0.5, repeat: Infinity } : {}}
              >
                <ClockIcon className={`h-5 w-5 transition-colors duration-300 ${iconColorClasses[urgencyLevel]}`} />
              </motion.div>
              <span className="text-sm font-medium text-muted-foreground">
                {config.label || 'Time Remaining'}
              </span>
            </motion.div>

            {/* Time Display */}
            <div className="flex items-center justify-center gap-2">
              {time.showDays && (
                <>
                  <TimeUnit value={time.days} label="Days" urgencyLevel={urgencyLevel} />
                  <ColonSeparator animate={!finished} />
                </>
              )}
              <TimeUnit value={time.hours} label="Hours" urgencyLevel={urgencyLevel} />
              <ColonSeparator animate={!finished} />
              <TimeUnit value={time.mins} label="Mins" urgencyLevel={urgencyLevel} pulse={shouldPulse} />
              <ColonSeparator animate={!finished} />
              <TimeUnit value={time.secs} label="Secs" urgencyLevel={urgencyLevel} pulse={shouldPulse} />
            </div>

            {/* Completion Message */}
            <AnimatePresence>
              {finished && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springPresets.bouncy}
                  className="mt-4"
                >
                  <motion.div
                    className="text-lg font-medium"
                    animate={justFinished ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, repeat: justFinished ? 3 : 0 }}
                  >
                    {justFinished ? "Time's up!" : "Time's up!"}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </StateContainer>
  );
}

export default CountdownTimerElement;
