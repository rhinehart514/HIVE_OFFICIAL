'use client';

/**
 * RSVPButton - Signature HIVE RSVP interaction
 *
 * The hero moment: tap → number ticks → avatar joins → "You're in."
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../atoms/button';

export interface RSVPButtonProps {
  /** Current RSVP state */
  isGoing: boolean;
  /** Number of people going */
  count: number;
  /** Callback when RSVP changes */
  onRSVP: (going: boolean) => void;
  /** Loading state during API call */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  className?: string;
}

export function RSVPButton({
  isGoing,
  count,
  onRSVP,
  isLoading = false,
  disabled = false,
  className,
}: RSVPButtonProps) {
  const [animateCount, setAnimateCount] = React.useState(false);

  const handleClick = () => {
    if (isLoading || disabled) return;

    // Trigger count animation
    setAnimateCount(true);
    setTimeout(() => setAnimateCount(false), 500);

    onRSVP(!isGoing);
  };

  return (
    <Button
      variant={isGoing ? 'brand' : 'outline'}
      onClick={handleClick}
      disabled={disabled}
      loading={isLoading}
      className={cn(
        'relative min-w-[120px] gap-2',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isGoing ? (
          <motion.span
            key="going"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            <span>Going</span>
          </motion.span>
        ) : (
          <motion.span
            key="rsvp"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span>RSVP</span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Count badge */}
      <motion.span
        key={count}
        initial={animateCount ? { scale: 1.3 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className={cn(
          'ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
          isGoing
            ? 'bg-background-primary/20 text-background-primary'
            : 'bg-background-interactive text-text-secondary'
        )}
      >
        {count}
      </motion.span>
    </Button>
  );
}

/**
 * RSVPButtonWithStack - Full RSVP component with avatar stack
 */
export interface RSVPButtonWithStackProps extends RSVPButtonProps {
  /** Users who are going */
  users: Array<{ id: string; name: string; imageUrl?: string }>;
  /** Current user ID (for join animation) */
  currentUserId?: string;
}

export function RSVPButtonWithStack({
  users,
  currentUserId,
  isGoing,
  ...props
}: RSVPButtonWithStackProps) {
  // The avatar stack would be rendered separately
  // This is the button portion
  return (
    <RSVPButton
      isGoing={isGoing}
      {...props}
    />
  );
}
