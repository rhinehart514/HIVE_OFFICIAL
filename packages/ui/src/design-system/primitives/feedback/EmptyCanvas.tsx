'use client';

/**
 * EmptyCanvas — Canvas-framed empty state
 *
 * IA-ARCHITECT: "Empty = canvas, not absence"
 * The action IS the empty state. Invitation, not explanation.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';
import { cn } from '../../../lib/utils';

export interface EmptyCanvasProps {
  /** Primary message (invitation to act) */
  message: string;
  /** Optional secondary hint */
  hint?: string;
  /** Optional icon (renders above message) */
  icon?: React.ReactNode;
  /** Optional action element (input, button, etc.) */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

const sizeStyles = {
  sm: {
    container: 'py-8',
    message: 'text-[14px]',
    hint: 'text-[12px]',
  },
  default: {
    container: 'py-16',
    message: 'text-[16px]',
    hint: 'text-[13px]',
  },
  lg: {
    container: 'py-24',
    message: 'text-[20px]',
    hint: 'text-[14px]',
  },
};

export function EmptyCanvas({
  message,
  hint,
  icon,
  action,
  className,
  size = 'default',
}: EmptyCanvasProps) {
  const shouldReduceMotion = useReducedMotion();
  const styles = sizeStyles[size];

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-white/20">{icon}</div>
      )}
      <p className={cn('text-white/40 mb-2', styles.message)}>
        {message}
      </p>
      {hint && (
        <p className={cn('text-white/25 mb-4', styles.hint)}>
          {hint}
        </p>
      )}
      {action && (
        <div className="mt-2 w-full max-w-sm">
          {action}
        </div>
      )}
    </div>
  );

  if (shouldReduceMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: MOTION.duration.base,
        ease: MOTION.ease.premium,
      }}
    >
      {content}
    </motion.div>
  );
}

EmptyCanvas.displayName = 'EmptyCanvas';
