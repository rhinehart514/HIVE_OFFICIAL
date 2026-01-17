'use client';

/**
 * SpacePreviewModal Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Desktop modal for space preview before joining
 * Apple Glass Dark surface, centered overlay, gold activity pulse.
 *
 * Recipe:
 *   container: Centered modal (max-w-md), frosted glass
 *   header: Space avatar, name, member count, activity dot
 *   body: Description, upcoming event card, recent activity
 *   footer: Join CTA (gold) or Enter button (if member)
 *   motion: Spring scale + fade
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Reuse types from SpacePreviewSheet
import {
  type SpacePreviewData,
  type ActivityStatus,
  activityDotVariants,
  DefaultAvatar,
  DefaultEventCard,
  HIVE_GOLD,
} from './SpacePreviewSheet';

// LOCKED: Glass surface for modal
const glassModalSurface = {
  background: 'linear-gradient(180deg, rgba(30,29,27,0.98) 0%, rgba(20,19,18,0.99) 100%)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
};

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// Container variants
const modalContainerVariants = cva(
  [
    'relative z-50',
    'w-full',
    'rounded-2xl',
    'border border-white/10',
    'shadow-2xl',
    'overflow-hidden',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-md',
        lg: 'max-w-lg',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Header variants
const modalHeaderVariants = cva(
  [
    'flex items-start gap-4',
    'px-6 pt-6 pb-4',
    'border-b border-white/[0.06]',
  ].join(' ')
);

// Body variants
const modalBodyVariants = cva(
  [
    'px-6 py-5',
    'space-y-4',
    'max-h-[50vh] overflow-y-auto',
  ].join(' ')
);

// Footer variants
const modalFooterVariants = cva(
  [
    'flex items-center gap-3',
    'px-6 py-5',
    'border-t border-white/[0.06]',
  ].join(' ')
);

// Stats row component
const StatsRow: React.FC<{
  memberCount: number;
  activityStatus: ActivityStatus;
  activityText?: string;
  onlineCount?: number;
}> = ({ memberCount, activityStatus, activityText, onlineCount }) => (
  <div className="flex items-center gap-4 text-sm">
    {/* Activity */}
    <div className="flex items-center gap-2">
      <span className={cn(activityDotVariants({ status: activityStatus }))} />
      <span className="text-white/60">
        {activityText ||
          (activityStatus === 'live' ? 'Active now' :
           activityStatus === 'recent' ? 'Active today' : 'Quiet')}
      </span>
    </div>

    <span className="text-white/20">·</span>

    {/* Members */}
    <span className="text-white/60 tabular-nums">
      {memberCount.toLocaleString()} member{memberCount !== 1 ? 's' : ''}
    </span>

    {/* Online count (optional) */}
    {onlineCount !== undefined && onlineCount > 0 && (
      <>
        <span className="text-white/20">·</span>
        <span className="text-[#D4AF37]/80 tabular-nums">
          {onlineCount} online
        </span>
      </>
    )}
  </div>
);

// Close button component
const CloseButton: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'absolute top-4 right-4',
      'w-8 h-8 rounded-lg',
      'flex items-center justify-center',
      'text-white/40 hover:text-white/70',
      'bg-white/[0.04] hover:bg-white/[0.08]',
      'transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
      className
    )}
    aria-label="Close"
  >
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
    </svg>
  </button>
);

// Types
export interface SpacePreviewModalProps {
  /** Whether modal is open */
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
  size?: 'sm' | 'default' | 'lg';
  /** Custom avatar component */
  renderAvatar?: (space: SpacePreviewData) => React.ReactNode;
  /** Custom event card component */
  renderEventCard?: (event: NonNullable<SpacePreviewData['upcomingEvent']>) => React.ReactNode;
  /** Online member count (optional) */
  onlineCount?: number;
  /** Custom footer content */
  renderFooter?: (space: SpacePreviewData, handlers: { onJoin: () => void; onEnter: () => void }) => React.ReactNode;
}

// Main component
const SpacePreviewModal: React.FC<SpacePreviewModalProps> = ({
  open,
  onClose,
  space,
  onJoin,
  onEnter,
  isJoining = false,
  size = 'default',
  renderAvatar,
  renderEventCard,
  onlineCount,
  renderFooter,
}) => {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Handle CTA click
  const handleJoin = () => {
    if (!space) return;
    onJoin?.(space.id);
  };

  const handleEnter = () => {
    if (!space) return;
    onEnter?.(space.id);
  };

  const handleCTA = () => {
    if (!space) return;
    if (space.isMember) {
      handleEnter();
    } else {
      handleJoin();
    }
  };

  return (
    <AnimatePresence>
      {open && space && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={springConfig}
            className={cn(modalContainerVariants({ size }))}
            style={glassModalSurface}
            role="dialog"
            aria-modal="true"
            aria-labelledby="space-preview-title"
          >
            {/* Close button */}
            <CloseButton onClick={onClose} />

            {/* Header */}
            <div className={cn(modalHeaderVariants())}>
              {/* Avatar */}
              {renderAvatar ? (
                renderAvatar(space)
              ) : (
                <DefaultAvatar name={space.name} avatarUrl={space.avatarUrl} />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 pr-8">
                <h2
                  id="space-preview-title"
                  className="text-xl font-semibold text-white truncate"
                >
                  {space.name}
                </h2>
                <p className="text-sm text-white/50 truncate">{space.handle}</p>

                {/* Stats */}
                <div className="mt-3">
                  <StatsRow
                    memberCount={space.memberCount}
                    activityStatus={space.activityStatus}
                    activityText={space.activityText}
                    onlineCount={onlineCount}
                  />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className={cn(modalBodyVariants())}>
              {/* Description */}
              {space.description && (
                <p className="text-sm text-white/70 leading-relaxed">
                  {space.description}
                </p>
              )}

              {/* Category badge */}
              {space.category && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white/[0.06] text-xs font-medium text-white/60">
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
            <div className={cn(modalFooterVariants())}>
              {renderFooter ? (
                renderFooter(space, { onJoin: handleJoin, onEnter: handleEnter })
              ) : (
                <>
                  {/* Secondary action - close */}
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      'flex-1 h-11 rounded-xl',
                      'font-medium text-sm',
                      'bg-white/[0.06] text-white/70',
                      'hover:bg-white/[0.1] hover:text-white',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                    )}
                  >
                    Cancel
                  </button>

                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={handleCTA}
                    disabled={isJoining}
                    className={cn(
                      'flex-1 h-11 rounded-xl',
                      'font-semibold text-sm',
                      'transition-all duration-150',
                      // Focus (WHITE)
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                      'focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1D1B]',
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
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

SpacePreviewModal.displayName = 'SpacePreviewModal';

export {
  SpacePreviewModal,
  // Export variants
  modalContainerVariants as spacePreviewModalContainerVariants,
  modalHeaderVariants as spacePreviewModalHeaderVariants,
  modalBodyVariants as spacePreviewModalBodyVariants,
  modalFooterVariants as spacePreviewModalFooterVariants,
  // Export components
  StatsRow as SpacePreviewStatsRow,
  CloseButton as SpacePreviewCloseButton,
  // Export style helpers
  glassModalSurface as spacePreviewModalGlassSurface,
};

// Re-export types from SpacePreviewSheet for convenience
export type { SpacePreviewData, ActivityStatus };
