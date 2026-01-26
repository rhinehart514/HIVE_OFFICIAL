'use client';

/**
 * Counter Element - Refactored with Core Abstractions
 *
 * Interactive increment/decrement counter with:
 * - useCounterState hook for state management
 * - StateContainer for loading/error states
 * - Progress visualization for bounded ranges
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { useCounterState, StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface CounterConfig {
  label?: string;
  initialValue?: number;
  step?: number;
  min?: number;
  max?: number;
  showReset?: boolean;
  showControls?: boolean;
}

interface CounterElementProps extends ElementProps {
  config: CounterConfig;
  mode?: ElementMode;
}

// ============================================================
// Counter Element
// ============================================================

export function CounterElement({
  id,
  config,
  data,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: CounterElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Use core state hook
  const counterState = useCounterState(id, sharedState, userState);

  // Derive count - prefer shared state, fall back to legacy
  const sharedCount = counterState.value?.count ?? 0;
  const legacyCount = (data?.count as number) ?? config.initialValue ?? 0;
  const [count, setCount] = useState(sharedCount || legacyCount);

  // Sync with state changes
  React.useEffect(() => {
    const newCount = sharedCount || legacyCount;
    setCount(newCount);
  }, [sharedCount, legacyCount]);

  // Local UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  // Config
  const step = config.step ?? 1;
  const min = config.min;
  const max = config.max;
  const hasRange = min !== undefined && max !== undefined;
  const atMin = min !== undefined && count <= min;
  const atMax = max !== undefined && count >= max;

  // Progress calculation
  const progressPercent = hasRange
    ? ((count - min!) / (max! - min!)) * 100
    : 0;

  const getProgressColor = () => {
    if (!hasRange) return 'bg-primary';
    if (progressPercent >= 90) return 'bg-green-500';
    if (progressPercent >= 70) return 'bg-emerald-500';
    if (progressPercent >= 30) return 'bg-blue-500';
    return 'bg-primary';
  };

  // Handlers
  const handleIncrement = useCallback(() => {
    if (isUpdating || atMax) return;

    setIsUpdating(true);
    const newCount = count + step;

    if (max !== undefined && newCount > max) {
      setIsUpdating(false);
      return;
    }

    setDirection('up');
    setCount(newCount);
    onAction?.('increment', { count: newCount, step });

    setIsUpdating(false);
    setTimeout(() => setDirection(null), 300);
  }, [count, step, max, atMax, isUpdating, onAction]);

  const handleDecrement = useCallback(() => {
    if (isUpdating || atMin) return;

    setIsUpdating(true);
    const newCount = count - step;

    if (min !== undefined && newCount < min) {
      setIsUpdating(false);
      return;
    }

    setDirection('down');
    setCount(newCount);
    onAction?.('decrement', { count: newCount, step });

    setIsUpdating(false);
    setTimeout(() => setDirection(null), 300);
  }, [count, step, min, atMin, isUpdating, onAction]);

  const handleReset = useCallback(() => {
    const initialValue = config.initialValue ?? 0;
    setCount(initialValue);
    setDirection(null);
    onAction?.('reset', { count: initialValue });
  }, [config.initialValue, onAction]);

  const showControls = config.showControls !== false;

  return (
    <StateContainer status={counterState.status}>
      <motion.div
        initial={false}
        animate={direction ? { scale: [1, 1.02, 1] } : {}}
        transition={springPresets.snappy}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
          <CardContent className="p-6 text-center">
            {/* Label */}
            <div className="text-sm font-medium text-muted-foreground mb-4">
              {config.label || 'Counter'}
            </div>

            {/* Counter Display */}
            <div className="flex items-center justify-center gap-4">
              {/* Decrement Button */}
              {showControls && (
                <motion.div
                  whileHover={!atMin ? { scale: 1.05 } : {}}
                  whileTap={!atMin ? { scale: 0.95 } : {}}
                  transition={springPresets.snappy}
                >
                  <Button
                    onClick={handleDecrement}
                    variant="outline"
                    size="icon"
                    disabled={isUpdating || atMin}
                    className={`h-12 w-12 rounded-full text-xl font-bold transition-colors ${
                      atMin ? 'opacity-30' : 'hover:border-red-500/50 hover:text-red-500'
                    }`}
                  >
                    −
                  </Button>
                </motion.div>
              )}

              {/* Count Display */}
              <div className="min-w-[100px] relative">
                <motion.div
                  className="text-5xl font-bold tabular-nums"
                  animate={
                    direction && !prefersReducedMotion
                      ? {
                          color: direction === 'up'
                            ? ['inherit', '#22c55e', 'inherit']
                            : ['inherit', '#ef4444', 'inherit'],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  <AnimatedNumber
                    value={count}
                    springOptions={numberSpringPresets.bouncy}
                  />
                </motion.div>

                {/* Direction Indicator */}
                <AnimatePresence>
                  {direction && !prefersReducedMotion && (
                    <motion.div
                      initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: direction === 'up' ? -10 : 10 }}
                      className={`absolute -right-2 top-1/2 -translate-y-1/2 text-lg ${
                        direction === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {direction === 'up' ? '↑' : '↓'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Increment Button */}
              {showControls && (
                <motion.div
                  whileHover={!atMax ? { scale: 1.05 } : {}}
                  whileTap={!atMax ? { scale: 0.95 } : {}}
                  transition={springPresets.snappy}
                >
                  <Button
                    onClick={handleIncrement}
                    variant="outline"
                    size="icon"
                    disabled={isUpdating || atMax}
                    className={`h-12 w-12 rounded-full text-xl font-bold transition-colors ${
                      atMax ? 'opacity-30' : 'hover:border-green-500/50 hover:text-green-500'
                    }`}
                  >
                    +
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Progress Bar (if range is set) */}
            {hasRange && (
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${getProgressColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{min}</span>
                  <span>{max}</span>
                </div>
              </div>
            )}

            {/* Reset Button */}
            {config.showReset && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: count !== (config.initialValue ?? 0) ? 1 : 0.3 }}
              >
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  disabled={count === (config.initialValue ?? 0)}
                >
                  ↺ Reset to {config.initialValue ?? 0}
                </Button>
              </motion.div>
            )}

            {/* Min/Max indicators (if partial range) */}
            {(min !== undefined || max !== undefined) && !hasRange && (
              <div className="mt-3 text-xs text-muted-foreground">
                {min !== undefined && `Min: ${min}`}
                {min !== undefined && max !== undefined && ' • '}
                {max !== undefined && `Max: ${max}`}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </StateContainer>
  );
}

export default CounterElement;
