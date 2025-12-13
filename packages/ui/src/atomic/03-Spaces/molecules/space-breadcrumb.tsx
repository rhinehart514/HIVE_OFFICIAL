'use client';

/**
 * SpaceBreadcrumb - Navigation context indicator for Spaces
 *
 * Shows the user's current location within the space hierarchy.
 * Pattern: Campus > Space Name > Board Name
 *
 * ## Features
 * - Truncates on mobile (Campus > ... > Board)
 * - Animated board name transitions
 * - Click to navigate
 * - Compact single-line design
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { springPresets } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

export interface SpaceBreadcrumbProps {
  /** Campus name (defaults to "Spaces" if not provided) */
  campusName?: string;
  /** Space name (required) */
  spaceName: string;
  /** Space ID for navigation */
  spaceId: string;
  /** Current board/channel name (optional) */
  boardName?: string;
  /** Board ID for navigation */
  boardId?: string;
  /** Compact mode for mobile - truncates middle segments */
  isCompact?: boolean;
  /** Callback when a breadcrumb segment is clicked */
  onNavigate?: (target: 'campus' | 'space' | 'board') => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Motion Variants
// ============================================================

const segmentVariants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springPresets.default
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: { duration: 0.15 }
  },
};

// ============================================================
// Sub-components
// ============================================================

interface BreadcrumbSegmentProps {
  children: React.ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
  isActive?: boolean;
  className?: string;
}

function BreadcrumbSegment({
  children,
  onClick,
  isClickable = true,
  isActive = false,
  className
}: BreadcrumbSegmentProps) {
  const baseClasses = cn(
    'text-sm truncate max-w-[120px] md:max-w-[200px]',
    isActive
      ? 'text-white font-medium'
      : 'text-gray-400',
    isClickable && !isActive && 'hover:text-white cursor-pointer transition-colors',
    className
  );

  if (isClickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(baseClasses, 'bg-transparent border-none p-0')}
        type="button"
      >
        {children}
      </button>
    );
  }

  return <span className={baseClasses}>{children}</span>;
}

function Separator() {
  return (
    <ChevronRight
      className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mx-1"
      aria-hidden="true"
    />
  );
}

// ============================================================
// Component
// ============================================================

export function SpaceBreadcrumb({
  campusName = 'Spaces',
  spaceName,
  spaceId,
  boardName,
  boardId,
  isCompact = false,
  onNavigate,
  className,
}: SpaceBreadcrumbProps) {
  const handleCampusClick = React.useCallback(() => {
    onNavigate?.('campus');
  }, [onNavigate]);

  const handleSpaceClick = React.useCallback(() => {
    onNavigate?.('space');
  }, [onNavigate]);

  const handleBoardClick = React.useCallback(() => {
    onNavigate?.('board');
  }, [onNavigate]);

  // In compact mode, show: Campus > ... > Board (if board exists)
  // Otherwise: Campus > Space > Board
  const showSpace = !isCompact || !boardName;
  const showEllipsis = isCompact && boardName;

  return (
    <nav
      aria-label="Space navigation"
      className={cn(
        'flex items-center overflow-hidden',
        className
      )}
    >
      {/* Home/Campus */}
      <BreadcrumbSegment
        onClick={handleCampusClick}
        isClickable={!!onNavigate}
      >
        <span className="flex items-center gap-1">
          <Home className="w-3.5 h-3.5 hidden sm:inline" aria-hidden="true" />
          <span className="hidden sm:inline">{campusName}</span>
          <span className="sm:hidden">Home</span>
        </span>
      </BreadcrumbSegment>

      <Separator />

      {/* Ellipsis for compact mode */}
      {showEllipsis && (
        <>
          <BreadcrumbSegment
            onClick={handleSpaceClick}
            isClickable={!!onNavigate}
            className="text-gray-500"
          >
            ...
          </BreadcrumbSegment>
          <Separator />
        </>
      )}

      {/* Space Name */}
      {showSpace && (
        <>
          <BreadcrumbSegment
            onClick={boardName ? handleSpaceClick : undefined}
            isClickable={!!onNavigate && !!boardName}
            isActive={!boardName}
          >
            {spaceName}
          </BreadcrumbSegment>
          {boardName && <Separator />}
        </>
      )}

      {/* Board Name (animated) */}
      <AnimatePresence mode="wait">
        {boardName && (
          <motion.div
            key={boardId || boardName}
            variants={segmentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center min-w-0"
          >
            <BreadcrumbSegment isActive>
              #{boardName}
            </BreadcrumbSegment>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ============================================================
// Exports
// ============================================================

export default SpaceBreadcrumb;
