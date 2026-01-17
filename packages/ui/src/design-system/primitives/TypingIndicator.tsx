'use client';

/**
 * TypingIndicator Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Pulse animation (opacity), gold for multiple users
 * Shows who is currently typing in a chat.
 *
 * Recipe:
 *   animation: Pulse (opacity 0.3 → 1 → 0.3)
 *   timing: 1.2s cycle, 150ms stagger
 *   size: 6px (w-1.5 h-1.5)
 *   color: Gray single, GOLD multiple (activity = life)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const typingIndicatorVariants = cva(
  [
    'inline-flex items-center gap-1.5',
    'transition-all duration-[var(--duration-smooth)]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface TypingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof typingIndicatorVariants> {
  /** Array of user names who are typing */
  users: string[];
  /** Maximum names to show before "and X others" */
  maxNames?: number;
  /** Show animated dots */
  showDots?: boolean;
}

/**
 * Format typing users into display text
 */
function formatTypingText(users: string[], maxNames: number): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${users[0]} is typing`;
  if (users.length === 2) return `${users[0]} and ${users[1]} are typing`;
  if (users.length <= maxNames) {
    const lastUser = users[users.length - 1];
    const otherUsers = users.slice(0, -1).join(', ');
    return `${otherUsers}, and ${lastUser} are typing`;
  }
  const shown = users.slice(0, maxNames - 1).join(', ');
  const othersCount = users.length - (maxNames - 1);
  return `${shown} and ${othersCount} others are typing`;
}

/**
 * Animated typing dots
 */
const TypingDots: React.FC<{ isMultiple: boolean; className?: string }> = ({
  isMultiple,
  className,
}) => {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            // CRITICAL: Gold when multiple users, gray when single
            isMultiple
              ? 'bg-[var(--color-accent-gold)]'
              : 'bg-[var(--color-text-muted)]',
            'animate-typing-pulse'
          )}
          style={{
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      {/* LOCKED: Pulse animation (opacity only) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes typing-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-typing-pulse {
          animation: typing-pulse 1.2s ease-in-out infinite;
        }
      `}} />
    </span>
  );
};

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  (
    { className, size, users, maxNames = 3, showDots = true, ...props },
    ref
  ) => {
    // Don't render if no one is typing
    if (users.length === 0) {
      return null;
    }

    const isMultiple = users.length > 1;
    const typingText = formatTypingText(users, maxNames);

    return (
      <div
        ref={ref}
        className={cn(typingIndicatorVariants({ size }), className)}
        role="status"
        aria-label={typingText}
        {...props}
      >
        {showDots && <TypingDots isMultiple={isMultiple} />}
        <span
          className={cn(
            'text-[var(--color-text-muted)]',
            // Highlight when multiple users
            isMultiple && 'text-[var(--color-text-secondary)]'
          )}
        >
          {typingText}
        </span>
      </div>
    );
  }
);

TypingIndicator.displayName = 'TypingIndicator';

/**
 * Compact typing indicator - just dots
 */
export interface TypingDotsOnlyProps {
  /** Is someone typing? */
  isTyping: boolean;
  /** Are multiple people typing? */
  isMultiple?: boolean;
  /** Additional className */
  className?: string;
}

const TypingDotsOnly: React.FC<TypingDotsOnlyProps> = ({
  isTyping,
  isMultiple = false,
  className,
}) => {
  if (!isTyping) return null;
  return <TypingDots isMultiple={isMultiple} className={className} />;
};

export {
  TypingIndicator,
  TypingDotsOnly,
  TypingDots,
  typingIndicatorVariants,
  formatTypingText,
};
