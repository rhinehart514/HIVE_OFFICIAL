'use client';

/**
 * SpacePreviewSheet Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Mobile bottom sheet for space preview before joining
 * Apple Glass Dark surface, drag-to-dismiss, gold activity pulse.
 *
 * Recipe:
 *   container: Bottom sheet (85vh max), frosted glass
 *   header: Space avatar, name, member count, activity dot
 *   body: Description, upcoming event card, recent activity
 *   footer: Join CTA (gold) or Enter button (if member)
 *   motion: Spring drag, opacity backdrop
 */

import * as React from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass surface for sheet
const glassSheetSurface = {
  background: 'linear-gradient(180deg, rgba(20,19,18,0.98) 0%, rgba(10,10,9,0.99) 100%)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
};

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
};

// LOCKED: Gold for activity
const HIVE_GOLD = '#D4AF37';

// Container variants
const sheetContainerVariants = cva(
  [
    'fixed inset-x-0 bottom-0 z-50',
    'rounded-t-[20px]',
    'border-t border-white/10',
    'shadow-2xl',
    // Safe area handling
    'pb-[env(safe-area-inset-bottom,0px)]',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'max-h-[85vh]',
        compact: 'max-h-[70vh]',
        full: 'max-h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Header variants
const sheetHeaderVariants = cva(
  [
    'flex items-start gap-4',
    'px-5 pt-5 pb-4',
    'border-b border-white/[0.06]',
  ].join(' ')
);

// Body variants
const sheetBodyVariants = cva(
  [
    'flex-1 overflow-y-auto',
    'px-5 py-4',
    'space-y-4',
  ].join(' ')
);

// Footer variants
const sheetFooterVariants = cva(
  [
    'flex items-center gap-3',
    'px-5 py-4',
    'border-t border-white/[0.06]',
  ].join(' ')
);

// Activity indicator variants
const activityDotVariants = cva(
  [
    'w-2 h-2 rounded-full',
    'shrink-0',
  ].join(' '),
  {
    variants: {
      status: {
        live: 'bg-[#D4AF37] animate-pulse',
        recent: 'bg-white/40',
        quiet: 'bg-white/20',
      },
    },
    defaultVariants: {
      status: 'quiet',
    },
  }
);

// Types
export type ActivityStatus = 'live' | 'recent' | 'quiet';

export interface SpacePreviewData {
  /** Space ID */
  id: string;
  /** Space name */
  name: string;
  /** Space handle (e.g., @ub-consulting) */
  handle: string;
  /** Description */
  description?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Member count */
  memberCount: number;
  /** Activity status */
  activityStatus: ActivityStatus;
  /** Activity text (e.g., "Active now", "Active today") */
  activityText?: string;
  /** Whether current user is a member */
  isMember: boolean;
  /** Space type/category */
  category?: string;
  /** Upcoming event (optional) */
  upcomingEvent?: {
    id: string;
    title: string;
    date: string;
    attendeeCount?: number;
  };
}

export interface SpacePreviewSheetProps {
  /** Whether sheet is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Space data to preview */
  space: SpacePreviewData | null;
  /** Join handler (for non-members) */
  onJoin?: (spaceId: string) => void;
  /** Enter handler (for members) */
  onEnter?: (spaceId: string) => void;
  /** Join loading state */
  isJoining?: boolean;
  /** Size variant */
  size?: 'default' | 'compact' | 'full';
  /** Custom avatar component */
  renderAvatar?: (space: SpacePreviewData) => React.ReactNode;
  /** Custom event card component */
  renderEventCard?: (event: NonNullable<SpacePreviewData['upcomingEvent']>) => React.ReactNode;
}

// Drag handle component
const DragHandle: React.FC = () => (
  <div className="flex justify-center pt-3 pb-1">
    <div className="w-9 h-1 rounded-full bg-white/20" />
  </div>
);

// Default avatar fallback
const DefaultAvatar: React.FC<{ name: string; avatarUrl?: string }> = ({ name, avatarUrl }) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10">
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
      <span className="text-xl font-semibold text-white/60">{initials}</span>
    </div>
  );
};

// Default event card
const DefaultEventCard: React.FC<{
  event: NonNullable<SpacePreviewData['upcomingEvent']>;
}> = ({ event }) => (
  <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/40 mb-1">UPCOMING EVENT</p>
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        <p className="text-xs text-white/50 mt-1">{event.date}</p>
      </div>
      {event.attendeeCount !== undefined && (
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-white tabular-nums">
            {event.attendeeCount}
          </p>
          <p className="text-label-xs text-white/40">going</p>
        </div>
      )}
    </div>
  </div>
);

// Main component
const SpacePreviewSheet: React.FC<SpacePreviewSheetProps> = ({
  open,
  onClose,
  space,
  onJoin,
  onEnter,
  isJoining = false,
  size = 'default',
  renderAvatar,
  renderEventCard,
}) => {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = React.useState(false);

  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // Close if dragged down more than 100px or with high velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  // Handle CTA click
  const handleCTA = () => {
    if (!space) return;

    if (space.isMember) {
      onEnter?.(space.id);
    } else {
      onJoin?.(space.id);
    }
  };

  return (
    <AnimatePresence>
      {open && space && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springConfig}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={cn(sheetContainerVariants({ size }))}
            style={glassSheetSurface}
          >
            {/* Drag handle */}
            <DragHandle />

            {/* Header */}
            <div className={cn(sheetHeaderVariants())}>
              {/* Avatar */}
              {renderAvatar ? (
                renderAvatar(space)
              ) : (
                <DefaultAvatar name={space.name} avatarUrl={space.avatarUrl} />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">
                  {space.name}
                </h2>
                <p className="text-sm text-white/50 truncate">{space.handle}</p>

                {/* Activity & members */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(activityDotVariants({ status: space.activityStatus }))} />
                    <span className="text-xs text-white/50">
                      {space.activityText ||
                        (space.activityStatus === 'live' ? 'Active now' :
                         space.activityStatus === 'recent' ? 'Active today' : 'Quiet')}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-white/50 tabular-nums">
                    {space.memberCount.toLocaleString()} member{space.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className={cn(sheetBodyVariants())}>
              {/* Description */}
              {space.description && (
                <p className="text-sm text-white/70 leading-relaxed">
                  {space.description}
                </p>
              )}

              {/* Category badge */}
              {space.category && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-xs font-medium text-white/60">
                    {space.category}
                  </span>
                </div>
              )}

              {/* Upcoming event */}
              {space.upcomingEvent && (
                renderEventCard ? (
                  renderEventCard(space.upcomingEvent)
                ) : (
                  <DefaultEventCard event={space.upcomingEvent} />
                )
              )}
            </div>

            {/* Footer with CTA */}
            <div className={cn(sheetFooterVariants())}>
              {/* Secondary action - close */}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex-1 h-12 rounded-full',
                  'font-medium text-sm',
                  'bg-white/[0.06] text-white/70',
                  'hover:bg-white/[0.1] hover:text-white',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                )}
              >
                Close
              </button>

              {/* Primary CTA */}
              <button
                type="button"
                onClick={handleCTA}
                disabled={isJoining}
                className={cn(
                  'flex-1 h-12 rounded-full',
                  'font-semibold text-sm',
                  'transition-all duration-150',
                  // Focus (WHITE)
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
                  // Disabled
                  'disabled:pointer-events-none disabled:opacity-50',
                  // Style based on membership
                  space.isMember
                    ? 'bg-white text-[#0A0A09] hover:opacity-90'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-[#0A0A09] hover:opacity-90'
                )}
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Joining...
                  </span>
                ) : space.isMember ? (
                  'Enter Space'
                ) : (
                  'Join Space'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

SpacePreviewSheet.displayName = 'SpacePreviewSheet';

export {
  SpacePreviewSheet,
  // Export variants
  sheetContainerVariants,
  sheetHeaderVariants,
  sheetBodyVariants,
  sheetFooterVariants,
  activityDotVariants,
  // Export components for customization
  DragHandle,
  DefaultAvatar,
  DefaultEventCard,
  // Export style helpers
  glassSheetSurface,
  HIVE_GOLD,
};
