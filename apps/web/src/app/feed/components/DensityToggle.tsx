'use client';

/**
 * DensityToggle - Compact toggle for feed density selection
 *
 * Icon-only buttons with tooltip on hover.
 * Uses monospace characters for consistent sizing.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DENSITY_OPTIONS, type DensityOption } from '../hooks/useFeedDensity';
import type { FeedDensity } from '../feed-tokens';

// ============================================
// COMPONENT
// ============================================

interface DensityToggleProps {
  value: FeedDensity;
  onChange: (density: FeedDensity) => void;
  className?: string;
}

export function DensityToggle({ value, onChange, className }: DensityToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]',
        className
      )}
      role="radiogroup"
      aria-label="Feed density"
    >
      {DENSITY_OPTIONS.map((option) => (
        <DensityButton
          key={option.value}
          option={option}
          isActive={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

// ============================================
// DENSITY BUTTON
// ============================================

interface DensityButtonProps {
  option: DensityOption;
  isActive: boolean;
  onClick: () => void;
}

function DensityButton({ option, isActive, onClick }: DensityButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative">
      <motion.button
        type="button"
        role="radio"
        aria-checked={isActive}
        aria-label={option.label}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={cn(
          'relative px-2 py-1.5 rounded-md text-label-sm font-mono transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
          isActive
            ? 'bg-white/[0.08] text-white'
            : 'text-white/40 hover:text-white/60'
        )}
        whileTap={{ scale: 0.95 }}
      >
        <span aria-hidden="true">{option.icon}</span>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="density-indicator"
            className="absolute inset-0 rounded-md bg-white/[0.08]"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
            style={{ zIndex: -1 }}
          />
        )}
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={cn(
            'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50',
            'px-2 py-1 rounded bg-black/90 border border-white/10',
            'whitespace-nowrap pointer-events-none'
          )}
        >
          <p className="text-label-sm font-medium text-white">{option.label}</p>
          <p className="text-label-sm text-white/50">{option.description}</p>
        </motion.div>
      )}
    </div>
  );
}

DensityToggle.displayName = 'DensityToggle';
