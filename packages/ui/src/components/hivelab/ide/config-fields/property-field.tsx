'use client';

/**
 * PropertyField — Reusable config field renderer
 *
 * Extracted from properties-panel.tsx for reuse across
 * the full IDE and simplified editors.
 */

import { useState, useCallback } from 'react';
import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import { cn } from '../../../../lib/utils';
import { ArrayEditor } from '../field-primitives';
import { FOCUS_RING } from '../../tokens';
import type { PropertySchema } from './element-schemas';

const focusRing = FOCUS_RING;

const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 },
};

function useNudgeFeedback() {
  const [nudgeDirection, setNudgeDirection] = useState<'up' | 'down' | null>(null);

  const triggerNudge = useCallback((direction: 'up' | 'down') => {
    setNudgeDirection(direction);
    setTimeout(() => setNudgeDirection(null), 150);
  }, []);

  return { nudgeDirection, triggerNudge };
}

export interface PropertyFieldProps {
  schema: PropertySchema;
  value: unknown;
  onChange: (value: unknown) => void;
  hasError?: boolean;
}

export function PropertyField({ schema, value, onChange, hasError = false }: PropertyFieldProps) {
  const currentValue = value ?? schema.default;
  const prefersReducedMotion = useReducedMotion();
  const { nudgeDirection, triggerNudge } = useNudgeFeedback();
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (schema.type !== 'number') return;
      if (e.key === 'ArrowUp') {
        triggerNudge('up');
      } else if (e.key === 'ArrowDown') {
        triggerNudge('down');
      }
    },
    [schema.type, triggerNudge]
  );

  switch (schema.type) {
    case 'string':
      return (
        <motion.div
          animate={hasError && !prefersReducedMotion ? shakeAnimation : {}}
          className="relative"
        >
          <input
            type="text"
            value={currentValue as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={schema.label}
            aria-invalid={hasError}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: 'var(--hivelab-surface-hover)',
              border: `1px solid ${hasError ? 'var(--hivelab-status-error)' : isFocused ? 'var(--hivelab-border-emphasis)' : 'var(--hivelab-border)'}`,
              color: 'var(--hivelab-text-primary)',
            }}
          />
          {hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ExclamationCircleIcon className="h-4 w-4" style={{ color: 'var(--hivelab-status-error)' }} />
            </motion.div>
          )}
        </motion.div>
      );

    case 'number':
      return (
        <motion.div
          animate={
            hasError && !prefersReducedMotion
              ? shakeAnimation
              : nudgeDirection && !prefersReducedMotion
                ? { y: nudgeDirection === 'up' ? -2 : 2 }
                : { y: 0 }
          }
          transition={nudgeDirection ? springPresets.snappy : undefined}
          className="relative"
        >
          <input
            type="number"
            value={currentValue as number}
            min={schema.min}
            max={schema.max}
            onChange={(e) => onChange(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={schema.label}
            aria-invalid={hasError}
            aria-valuemin={schema.min}
            aria-valuemax={schema.max}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm font-sans outline-none transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: 'var(--hivelab-surface-hover)',
              border: `1px solid ${hasError ? 'var(--hivelab-status-error)' : isFocused ? 'var(--hivelab-border-emphasis)' : 'var(--hivelab-border)'}`,
              color: 'var(--hivelab-text-primary)',
            }}
          />
          <AnimatePresence>
            {nudgeDirection && !prefersReducedMotion && (
              <motion.div
                initial={{ opacity: 0, y: nudgeDirection === 'up' ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2',
                  nudgeDirection === 'up' ? 'rotate-180' : ''
                )}
                style={{ color: 'var(--hivelab-connection)' }}
              >
                <ChevronDownIcon className="h-3 w-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );

    case 'boolean':
      return (
        <motion.button
          type="button"
          onClick={() => onChange(!currentValue)}
          whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
          role="switch"
          aria-checked={Boolean(currentValue)}
          aria-label={`${schema.label}: ${currentValue ? 'enabled' : 'disabled'}`}
          className="w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200"
          style={{
            backgroundColor: Boolean(currentValue) ? 'var(--hivelab-status-success)' : 'var(--hivelab-surface-active)',
          }}
        >
          {Boolean(currentValue) && !prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute inset-0 rounded-full blur-sm"
              style={{ backgroundColor: 'var(--hivelab-status-success)' }}
            />
          )}
          <motion.div
            animate={{
              x: Boolean(currentValue) ? 24 : 2,
              scale: Boolean(currentValue) ? 1 : 0.95,
            }}
            transition={springPresets.snappy}
            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md z-10"
          />
          <AnimatePresence>
            {Boolean(currentValue) && !prefersReducedMotion && (
              <motion.svg
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute left-[26px] top-1.5 w-3 h-3 z-20"
                style={{ color: 'var(--hivelab-status-success)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      );

    case 'select':
      return (
        <motion.div
          animate={hasError && !prefersReducedMotion ? shakeAnimation : {}}
        >
          <select
            value={currentValue as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={schema.label}
            aria-invalid={hasError}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: 'var(--hivelab-surface-hover)',
              border: `1px solid ${hasError ? 'var(--hivelab-status-error)' : isFocused ? 'var(--hivelab-border-emphasis)' : 'var(--hivelab-border)'}`,
              color: 'var(--hivelab-text-primary)',
            }}
          >
            {schema.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </motion.div>
      );

    case 'string-array':
      return (
        <ArrayEditor
          value={(currentValue as string[]) || []}
          onChange={(newValue) => onChange(newValue)}
          placeholder={schema.placeholder}
          addButtonText={schema.addButtonText}
          emptyMessage={schema.emptyMessage}
          maxItems={schema.maxItems}
          minItems={schema.minItems}
        />
      );

    default:
      return <span className="text-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>Unsupported type</span>;
  }
}
