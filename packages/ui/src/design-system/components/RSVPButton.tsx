'use client';

/**
 * RSVPButton Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Event RSVP action button with status states.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEFAULT STATE (Not attending):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✓  RSVP                                                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Border: 1px var(--color-border)
 * - Background: transparent
 * - Text: text-primary
 * - Hover: bg-hover
 *
 * GOING STATE (Active RSVP):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✓  Going                                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Background: Gold (#FFD700) - THIS IS A KEY ACTION
 * - Text: Black
 * - Checkmark icon animated on state change
 * - Hover shows "Cancel" text
 *
 * MAYBE STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ?  Maybe                                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Background: var(--color-bg-elevated)
 * - Border: 1px dashed var(--color-border)
 * - Text: text-muted
 *
 * LOADING STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ◌  Loading...                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Spinner animation replaces icon
 * - Text faded
 * - Pointer events disabled
 *
 * FULL STATE (Event at capacity):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✕  Full                                                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Background: var(--color-bg-elevated)
 * - Text: text-muted
 * - Disabled, no hover effect
 *
 * DROPDOWN VARIANT (Multi-option):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✓  RSVP                                                          ▼    │
 * └─────────────────────────────────────────────────────────────────────────┘
 *     ┌─────────────────────────────────────────────────────────────────────┐
 *     │  ✓  Going                                                          │
 *     │  ?  Maybe                                                          │
 *     │  ✕  Not going                                                      │
 *     └─────────────────────────────────────────────────────────────────────┘
 *
 * COMPACT VARIANT (Icon only):
 * ┌──────┐
 * │  ✓   │   32x32px, icon only
 * └──────┘   Tooltip shows full status
 *
 * SIZE VARIANTS:
 * - sm: h-8, text-xs, px-3
 * - default: h-10, text-sm, px-4
 * - lg: h-12, text-base, px-6
 *
 * COLORS:
 * - Going: Gold (#FFD700) bg, black text - RSVP is an achievement action
 * - Maybe: Elevated bg, dashed border
 * - Not going: Ghost appearance
 * - Full: Muted, disabled
 *
 * ANIMATION:
 * - State change: scale-95 → scale-100, 150ms
 * - Icon: rotate-in on going state
 * - Hover on going: Shows cancel intent
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

type RSVPStatus = 'none' | 'going' | 'maybe' | 'not_going';

const rsvpButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      status: {
        none: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-bg-hover)]',
        going: 'bg-life-gold text-black hover:bg-life-gold/80',
        maybe: 'border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white/50',
        not_going: 'border border-[var(--color-border)] bg-transparent text-white/40',
      },
    },
    defaultVariants: {
      size: 'default',
      status: 'none',
    },
  }
);

export interface RSVPButtonProps extends VariantProps<typeof rsvpButtonVariants> {
  /** Current RSVP status */
  status?: RSVPStatus;
  /** Status change handler */
  onStatusChange?: (status: RSVPStatus) => void;
  /** Loading state */
  loading?: boolean;
  /** Event is full */
  isFull?: boolean;
  /** Show dropdown with all options */
  showDropdown?: boolean;
  /** Compact icon-only mode */
  compact?: boolean;
  /** Attendee count */
  attendeeCount?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * RSVPButton - Event RSVP action
 */
const RSVPButton: React.FC<RSVPButtonProps> = ({
  size = 'default',
  status = 'none',
  onStatusChange,
  loading = false,
  isFull = false,
  showDropdown = false,
  compact = false,
  attendeeCount,
  disabled = false,
  className,
}) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Status labels
  const statusLabels: Record<RSVPStatus, string> = {
    none: 'RSVP',
    going: isHovering ? 'Cancel' : 'Going',
    maybe: 'Maybe',
    not_going: 'Not going',
  };

  // Status icons
  const StatusIcon = ({ s }: { s: RSVPStatus }) => {
    if (loading) {
      return (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} strokeOpacity={0.25} />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
    }

    switch (s) {
      case 'going':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        );
      case 'maybe':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        );
      case 'not_going':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        );
    }
  };

  // Handle click - toggle going or show dropdown
  const handleClick = () => {
    if (loading || disabled || isFull) return;

    if (showDropdown) {
      setDropdownOpen(true);
      return;
    }

    // Toggle between none and going
    const newStatus = status === 'going' ? 'none' : 'going';
    onStatusChange?.(newStatus);
  };

  // Handle dropdown selection
  const handleSelect = (newStatus: RSVPStatus) => {
    onStatusChange?.(newStatus);
    setDropdownOpen(false);
  };

  // Full state
  if (isFull && status !== 'going') {
    return (
      <button
        className={cn(
          rsvpButtonVariants({ size }),
          'opacity-50 cursor-not-allowed',
          'border border-[var(--color-border)] bg-transparent text-white/40',
          className
        )}
        disabled
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        {!compact && <span>Full</span>}
      </button>
    );
  }

  // Compact mode with tooltip
  if (compact) {
    return (
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={handleClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              disabled={loading || disabled}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-xl transition-all',
                status === 'going' && 'bg-life-gold text-black',
                status === 'maybe' && 'border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)]',
                status === 'none' && 'border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]',
                status === 'not_going' && 'border border-[var(--color-border)] text-white/40',
                loading && 'opacity-50 cursor-wait',
                disabled && 'opacity-50 cursor-not-allowed',
                className
              )}
            >
              <StatusIcon s={status} />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-lg"
              sideOffset={8}
            >
              {statusLabels[status]}
              <Tooltip.Arrow className="fill-[var(--color-bg-elevated)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  // Dropdown variant
  if (showDropdown) {
    return (
      <Popover.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <Popover.Trigger asChild>
          <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            disabled={loading || disabled}
            className={cn(
              rsvpButtonVariants({ size, status }),
              loading && 'opacity-50 cursor-wait pointer-events-none',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
          >
            <StatusIcon s={status} />
            <span>{statusLabels[status]}</span>
            {attendeeCount !== undefined && status === 'going' && (
              <span className="ml-1 opacity-70">({attendeeCount})</span>
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 min-w-[140px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
            sideOffset={8}
            align="start"
          >
            {(['going', 'maybe', 'not_going'] as RSVPStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  s === status ? 'bg-white/10' : 'hover:bg-white/5',
                  s === 'going' && 'text-life-gold'
                )}
              >
                <StatusIcon s={s} />
                <span className="capitalize">{s.replace('_', ' ')}</span>
              </button>
            ))}
            <Popover.Arrow className="fill-[var(--color-bg-elevated)]" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  // Default button
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={loading || disabled}
      className={cn(
        rsvpButtonVariants({ size, status }),
        loading && 'opacity-50 cursor-wait pointer-events-none',
        disabled && 'opacity-50 cursor-not-allowed',
        status === 'going' && isHovering && 'bg-life-gold/80',
        className
      )}
    >
      <StatusIcon s={status} />
      <span>{statusLabels[status]}</span>
      {attendeeCount !== undefined && status === 'going' && (
        <span className="ml-1 opacity-70">({attendeeCount})</span>
      )}
    </button>
  );
};

RSVPButton.displayName = 'RSVPButton';

/**
 * RSVPButtonGroup - Multiple RSVP buttons in a row
 */
export interface RSVPButtonGroupProps {
  /** Current status */
  status?: RSVPStatus;
  /** Status change handler */
  onStatusChange?: (status: RSVPStatus) => void;
  /** Size */
  size?: 'sm' | 'default' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

const RSVPButtonGroup: React.FC<RSVPButtonGroupProps> = ({
  status = 'none',
  onStatusChange,
  size = 'default',
  loading = false,
  className,
}) => {
  return (
    <div className={cn('flex gap-2', className)}>
      <RSVPButton
        size={size}
        status={status === 'going' ? 'going' : 'none'}
        onStatusChange={() => onStatusChange?.(status === 'going' ? 'none' : 'going')}
        loading={loading}
      />
      <button
        onClick={() => onStatusChange?.(status === 'maybe' ? 'none' : 'maybe')}
        disabled={loading}
        className={cn(
          'px-3 rounded-xl text-sm transition-colors',
          status === 'maybe'
            ? 'bg-[var(--color-bg-elevated)] text-white border border-dashed border-[var(--color-border)]'
            : 'text-white/50 hover:text-white',
          size === 'sm' && 'h-8 text-xs',
          size === 'default' && 'h-10',
          size === 'lg' && 'h-12 text-base'
        )}
      >
        Maybe
      </button>
    </div>
  );
};

RSVPButtonGroup.displayName = 'RSVPButtonGroup';

export { RSVPButton, RSVPButtonGroup };
