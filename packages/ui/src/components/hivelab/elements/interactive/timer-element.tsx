'use client';

/**
 * Timer Element (Stopwatch) - Refactored with Core Abstractions
 *
 * Stopwatch-style timer with:
 * - Start/Stop/Reset controls
 * - Lap time tracking
 * - Flip-digit animation
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface TimerConfig {
  label?: string;
  showControls?: boolean;
  countUp?: boolean;
  initialSeconds?: number;
  showHours?: boolean;
  showLapTimes?: boolean;
}

interface TimerElementProps extends ElementProps {
  config: TimerConfig;
  mode?: ElementMode;
}

// ============================================================
// Time Unit Component
// ============================================================

function StopwatchTimeUnit({
  value,
  label,
  isRunning,
}: {
  value: number;
  label: string;
  isRunning: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const paddedValue = value.toString().padStart(2, '0');
  const digits = paddedValue.split('');

  return (
    <div className="text-center">
      <div className="flex items-center justify-center">
        {digits.map((digit, i) => (
          <div key={`${label}-${i}`} className="relative h-[48px] w-[32px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={digit}
                initial={prefersReducedMotion ? false : { y: -48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { y: 48, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className={`absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums ${
                  isRunning ? 'text-green-500' : 'text-foreground'
                }`}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground uppercase mt-1">{label}</div>
    </div>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function formatTime(seconds: number, showHours?: boolean) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { hrs, mins, secs, showHours: hrs > 0 || showHours };
}

// ============================================================
// Main Timer Element
// ============================================================

export function TimerElement({
  id,
  config,
  data,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: TimerElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Hydrate from server state
  const serverElapsed = (data?.elapsed as number) ?? 0;
  const serverIsRunning = (data?.isRunning as boolean) ?? false;
  const serverStartedAt = (data?.startedAt as string) ?? null;

  const [elapsed, setElapsed] = useState(serverElapsed);
  const [isRunning, setIsRunning] = useState(serverIsRunning);
  const [startTime, setStartTime] = useState<number | null>(
    serverStartedAt ? new Date(serverStartedAt).getTime() : null
  );
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const [justStarted, setJustStarted] = useState(false);

  // Sync with server state
  useEffect(() => {
    setElapsed(serverElapsed);
    setIsRunning(serverIsRunning);
    if (serverStartedAt) {
      setStartTime(new Date(serverStartedAt).getTime());
    }
  }, [serverElapsed, serverIsRunning, serverStartedAt]);

  // Clock tick
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setElapsed(serverElapsed + Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, startTime, serverElapsed]);

  // Handlers
  const handleStart = useCallback(() => {
    setIsRunning(true);
    setStartTime(Date.now());
    setJustStarted(true);
    setTimeout(() => setJustStarted(false), 500);
    onAction?.('start', { startedAt: new Date().toISOString() });
  }, [onAction]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setStartTime(null);
    onAction?.('stop', { elapsed, stoppedAt: new Date().toISOString() });
  }, [elapsed, onAction]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    setLapTimes([]);
    onAction?.('reset', {});
  }, [onAction]);

  const handleLap = useCallback(() => {
    if (isRunning && elapsed > 0) {
      setLapTimes(prev => [...prev, elapsed]);
      onAction?.('lap', { lapTime: elapsed, lapNumber: lapTimes.length + 1 });
    }
  }, [isRunning, elapsed, lapTimes.length, onAction]);

  const time = formatTime(elapsed, config.showHours);
  const showControls = config.showControls !== false;

  // Dynamic card styling
  const cardClasses = isRunning
    ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
    : 'bg-gradient-to-br from-muted/30 to-muted/10';

  return (
    <StateContainer status="complete">
      <motion.div
        initial={false}
        animate={justStarted ? { scale: [1, 1.02, 1] } : {}}
        transition={springPresets.bouncy}
      >
        <Card className={`overflow-hidden transition-all duration-300 ${cardClasses}`}>
          <CardContent className="p-6 text-center">
            {/* Header */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              animate={isRunning && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
              transition={isRunning ? { duration: 1.5, repeat: Infinity } : {}}
            >
              <motion.div
                animate={isRunning && !prefersReducedMotion ? { rotate: [0, 360] } : {}}
                transition={isRunning ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
              >
                <ClockIcon className={`h-5 w-5 transition-colors duration-300 ${isRunning ? 'text-green-500' : 'text-primary'}`} />
              </motion.div>
              <span className="text-sm font-medium text-muted-foreground">
                {config.label || 'Stopwatch'}
              </span>
            </motion.div>

            {/* Time Display */}
            <div className="flex items-center justify-center gap-1 mb-6">
              {time.showHours && (
                <>
                  <StopwatchTimeUnit value={time.hrs} label="Hours" isRunning={isRunning} />
                  <motion.div
                    className="text-2xl font-bold text-muted-foreground self-start mt-1"
                    animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    :
                  </motion.div>
                </>
              )}
              <StopwatchTimeUnit value={time.mins} label="Mins" isRunning={isRunning} />
              <motion.div
                className="text-2xl font-bold text-muted-foreground self-start mt-1"
                animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                :
              </motion.div>
              <StopwatchTimeUnit value={time.secs} label="Secs" isRunning={isRunning} />
            </div>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center justify-center gap-3">
                <AnimatePresence mode="wait">
                  {!isRunning ? (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={springPresets.snappy}
                    >
                      <Button
                        onClick={handleStart}
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <span className="flex items-center gap-1.5">
                          ▶ Start
                        </span>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stop"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={springPresets.snappy}
                      className="flex gap-2"
                    >
                      <Button
                        onClick={handleStop}
                        variant="outline"
                        size="sm"
                        className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                      >
                        ⏸ Stop
                      </Button>
                      {config.showLapTimes && (
                        <Button
                          onClick={handleLap}
                          variant="outline"
                          size="sm"
                          className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                        >
                          🏁 Lap
                        </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  disabled={elapsed === 0 && !isRunning}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ↺ Reset
                </Button>
              </div>
            )}

            {/* Lap Times */}
            {config.showLapTimes && lapTimes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-border"
              >
                <div className="text-xs text-muted-foreground mb-2">Lap Times</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {lapTimes.map((lapTime, index) => {
                    const formatted = formatTime(lapTime);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex justify-between text-sm bg-muted/30 rounded px-2 py-1"
                      >
                        <span className="text-muted-foreground">Lap {index + 1}</span>
                        <span className="font-sans tabular-nums">
                          {formatted.showHours && `${formatted.hrs}:`}
                          {formatted.mins.toString().padStart(2, '0')}:
                          {formatted.secs.toString().padStart(2, '0')}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </StateContainer>
  );
}

export default TimerElement;
