'use client';

/**
 * SpaceEntryAnimation Component
 *
 * Entry animation overlay when entering a space.
 * Shows space name with fade + scale effect.
 */

import * as React from 'react';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

export interface SpaceEntryAnimationProps {
  spaceName?: string;
  spaceIcon?: string;
  category?: string;
  autoComplete?: boolean;
  autoCompleteDelay?: number;
  skippable?: boolean;
  onComplete?: () => void;
  className?: string;
}

const SpaceEntryAnimation: React.FC<SpaceEntryAnimationProps> = ({
  spaceName = 'Space',
  spaceIcon,
  category,
  autoComplete = true,
  autoCompleteDelay = 1500,
  skippable = true,
  onComplete,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false);

  const handleComplete = React.useCallback(() => {
    if (isAnimatingOut) return;

    setIsAnimatingOut(true);
    // Wait for exit animation
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 300);
  }, [isAnimatingOut, onComplete]);

  // Auto-complete after delay
  React.useEffect(() => {
    if (!autoComplete) return;

    const timer = setTimeout(() => {
      handleComplete();
    }, autoCompleteDelay);

    return () => clearTimeout(timer);
  }, [autoComplete, autoCompleteDelay, handleComplete]);

  // Handle click to skip
  const handleClick = () => {
    if (skippable) {
      handleComplete();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    if (!skippable) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleComplete();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [skippable, handleComplete]);

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'fixed inset-0 z-[100]',
        'flex items-center justify-center',
        'bg-[var(--color-bg-ground)]',
        'transition-opacity duration-300',
        isAnimatingOut ? 'opacity-0' : 'opacity-100',
        skippable && 'cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'text-center space-y-4',
          'transition-all duration-300 ease-smooth',
          isAnimatingOut
            ? 'opacity-0 scale-95'
            : 'opacity-100 scale-100 animate-in fade-in zoom-in-95 duration-500'
        )}
      >
        {/* Space Icon */}
        {spaceIcon ? (
          <div className="mx-auto w-24 h-24 rounded-2xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border)] animate-in fade-in duration-700 delay-100">
            <img
              src={spaceIcon}
              alt={spaceName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="mx-auto w-24 h-24 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center animate-in fade-in duration-700 delay-100">
            <Text size="lg" className="text-[var(--color-text-muted)] text-3xl">
              {spaceName.charAt(0).toUpperCase()}
            </Text>
          </div>
        )}

        {/* Space Name */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Text
            size="lg"
            weight="semibold"
            className="text-[var(--color-text-primary)] text-2xl"
          >
            {spaceName}
          </Text>

          {category && (
            <div className="animate-in fade-in duration-500 delay-300">
              <Text
                size="sm"
                className={cn(
                  'inline-block px-3 py-1 rounded-full',
                  'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
                  'border border-[var(--color-border)]'
                )}
              >
                {category}
              </Text>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-1 pt-4 animate-in fade-in duration-500 delay-500">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce"
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>

        {/* Skip hint */}
        {skippable && (
          <Text
            size="xs"
            tone="muted"
            className="pt-6 animate-in fade-in duration-500 delay-700"
          >
            Click or press Escape to skip
          </Text>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          'bg-gradient-to-b from-[var(--color-life-gold)]/5 via-transparent to-transparent',
          'opacity-50'
        )}
      />
    </div>
  );
};

SpaceEntryAnimation.displayName = 'SpaceEntryAnimation';

export { SpaceEntryAnimation };
