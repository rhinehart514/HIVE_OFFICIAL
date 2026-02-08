'use client';

/**
 * Progress Indicator Element
 *
 * Visual progress tracking with:
 * - Bar and circular variants
 * - useCounterState hook for state management
 * - StateContainer for loading/error states
 * - Color shift from green to gold as value approaches max
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Card, CardContent } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { useCounterState, StateContainer, ElementEmpty, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface ProgressIndicatorConfig {
  value?: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'bar' | 'circular';
  label?: string;
  color?: string;
}

interface ProgressIndicatorElementProps extends ElementProps {
  config: ProgressIndicatorConfig;
  mode?: ElementMode;
}

// ============================================================
// Constants
// ============================================================

const CIRCULAR_SIZE = 120;
const CIRCULAR_STROKE = 8;
const CIRCULAR_RADIUS = (CIRCULAR_SIZE - CIRCULAR_STROKE) / 2;
const CIRCULAR_CIRCUMFERENCE = 2 * Math.PI * CIRCULAR_RADIUS;

// ============================================================
// Progress Indicator Element
// ============================================================

export function ProgressIndicatorElement({
  id,
  config,
  data,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: ProgressIndicatorElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Use core state hook
  const counterState = useCounterState(id, sharedState, userState);

  // Derive value - prefer shared state, fall back to config
  const sharedValue = counterState.value?.count ?? 0;
  const configValue = (data?.value as number) ?? config.value ?? 0;
  const [value, setValue] = useState(sharedValue || configValue);

  // Sync with state changes
  React.useEffect(() => {
    const newValue = sharedValue || configValue;
    setValue(newValue);
  }, [sharedValue, configValue]);

  // Config
  const max = config.max ?? 100;
  const showLabel = config.showLabel !== false;
  const label = config.label || 'Progress';
  const variant = config.variant || 'bar';

  // Progress calculation
  const clampedValue = Math.max(0, Math.min(value, max));
  const progressPercent = max > 0 ? (clampedValue / max) * 100 : 0;

  // Color shift: green -> gold as progress increases
  const getProgressColor = () => {
    if (progressPercent >= 90) return 'text-amber-500';
    if (progressPercent >= 70) return 'text-yellow-500';
    if (progressPercent >= 40) return 'text-emerald-500';
    return 'text-green-500';
  };

  const getBarColor = () => {
    if (progressPercent >= 90) return 'bg-amber-500';
    if (progressPercent >= 70) return 'bg-yellow-500';
    if (progressPercent >= 40) return 'bg-emerald-500';
    return 'bg-green-500';
  };

  // Handlers
  const handleSet = useCallback((newValue: number) => {
    const clamped = Math.max(0, Math.min(newValue, max));
    setValue(clamped);
    onAction?.('set_progress', { value: clamped });
  }, [max, onAction]);

  const handleIncrement = useCallback(() => {
    const step = 1;
    const newValue = Math.min(value + step, max);
    setValue(newValue);
    onAction?.('increment_progress', { value: newValue, step });
  }, [value, max, onAction]);

  const handleReset = useCallback(() => {
    setValue(0);
    onAction?.('reset_progress', { value: 0 });
  }, [onAction]);

  // Empty state
  if (clampedValue === 0 && !sharedValue && !configValue) {
    return (
      <StateContainer status={counterState.status}>
        <Card className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
          <CardContent className="p-6">
            <ElementEmpty
              message="No progress recorded yet"
              description={label}
            />
          </CardContent>
        </Card>
      </StateContainer>
    );
  }

  // Circular offset
  const strokeDashoffset = CIRCULAR_CIRCUMFERENCE - (progressPercent / 100) * CIRCULAR_CIRCUMFERENCE;

  return (
    <StateContainer status={counterState.status}>
      <Card className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="p-6">
          {/* Label */}
          {showLabel && (
            <div className="text-sm font-medium text-muted-foreground mb-4">
              {label}
            </div>
          )}

          {variant === 'circular' ? (
            /* Circular Variant */
            <div className="flex flex-col items-center gap-4">
              <div className="relative" style={{ width: CIRCULAR_SIZE, height: CIRCULAR_SIZE }}>
                <svg
                  width={CIRCULAR_SIZE}
                  height={CIRCULAR_SIZE}
                  className="transform -rotate-90"
                >
                  {/* Background circle */}
                  <circle
                    cx={CIRCULAR_SIZE / 2}
                    cy={CIRCULAR_SIZE / 2}
                    r={CIRCULAR_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={CIRCULAR_STROKE}
                    className="text-muted/30"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx={CIRCULAR_SIZE / 2}
                    cy={CIRCULAR_SIZE / 2}
                    r={CIRCULAR_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={CIRCULAR_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={CIRCULAR_CIRCUMFERENCE}
                    className={getProgressColor()}
                    initial={{ strokeDashoffset: CIRCULAR_CIRCUMFERENCE }}
                    animate={{ strokeDashoffset }}
                    transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold tabular-nums">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>

              {/* Value text */}
              <div className="text-xs text-muted-foreground tabular-nums">
                {clampedValue} / {max}
              </div>
            </div>
          ) : (
            /* Bar Variant */
            <div className="space-y-2">
              {/* Percentage and value */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold tabular-nums">
                  {Math.round(progressPercent)}%
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {clampedValue} / {max}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getBarColor()}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                />
              </div>
            </div>
          )}

          {/* Action buttons (runtime mode only) */}
          {mode === 'runtime' && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                onClick={handleIncrement}
                variant="outline"
                size="sm"
                disabled={value >= max}
                className="text-xs"
              >
                + Increment
              </Button>
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                disabled={value === 0}
                className="text-xs"
              >
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default ProgressIndicatorElement;
