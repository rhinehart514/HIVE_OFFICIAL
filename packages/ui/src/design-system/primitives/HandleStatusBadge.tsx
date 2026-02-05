'use client';

/**
 * HandleStatusBadge Primitive - LOCKED 2026-01-14
 *
 * Standalone badge for handle availability status
 * Used alongside HandleInput for enhanced feedback
 *
 * States: idle, checking, available, taken, invalid
 * Includes optional handle suggestions when taken
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { easingArrays } from '@hive/tokens';

export type HandleBadgeStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export interface HandleStatusBadgeProps {
  /** Current handle availability status */
  status: HandleBadgeStatus;
  /** Handle suggestions when taken */
  suggestions?: string[];
  /** Callback when a suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void;
  /** Custom message to display (overrides default) */
  message?: string;
  /** Additional class names */
  className?: string;
}

// Status configurations
const statusConfig: Record<
  HandleBadgeStatus,
  {
    icon: React.ElementType | null;
    iconClass: string;
    text: string;
    textClass: string;
  }
> = {
  idle: {
    icon: null,
    iconClass: '',
    text: '',
    textClass: '',
  },
  checking: {
    icon: Loader2,
    iconClass: 'text-white/40 animate-spin',
    text: 'Checking...',
    textClass: 'text-white/50',
  },
  available: {
    icon: Check,
    iconClass: 'text-green-500',
    text: 'Available',
    textClass: 'text-green-500',
  },
  taken: {
    icon: X,
    iconClass: 'text-red-500',
    text: 'Taken',
    textClass: 'text-red-400',
  },
  invalid: {
    icon: AlertCircle,
    iconClass: 'text-amber-500',
    text: '3-20 chars, letters/numbers only',
    textClass: 'text-amber-400',
  },
};

function HandleStatusBadge({
  status,
  suggestions,
  onSuggestionClick,
  message,
  className,
}: HandleStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayText = message ?? config.text;

  // Don't render anything for idle state
  if (status === 'idle') {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status row */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15, ease: easingArrays.default }}
          className="flex items-center justify-center gap-2"
        >
          {Icon && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
              }}
            >
              <Icon className={cn('w-4 h-4', config.iconClass)} />
            </motion.div>
          )}
          <span className={cn('text-sm', config.textClass)}>{displayText}</span>
        </motion.div>
      </AnimatePresence>

      {/* Suggestions (only show when taken and suggestions exist) */}
      <AnimatePresence>
        {status === 'taken' && suggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: easingArrays.default }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs text-white/40">Try:</span>
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.15 }}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    'bg-white/[0.06] text-white/70',
                    'hover:bg-white/[0.1] hover:text-white',
                    'transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                  )}
                >
                  @{suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

HandleStatusBadge.displayName = 'HandleStatusBadge';

export { HandleStatusBadge };
