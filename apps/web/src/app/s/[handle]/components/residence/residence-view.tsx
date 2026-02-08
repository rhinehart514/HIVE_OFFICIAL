'use client';

/**
 * ResidenceView - Full member experience
 *
 * Layout: 60/40 split (feed left, boards right)
 *
 * Features:
 * - Header with animated border on first visit
 * - Unified feed with scroll-triggered reveals
 * - Boards sidebar with room transitions
 * - Chat composer at bottom
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  ArrivalTransition,
  ArrivalZone,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION } from '@hive/ui/tokens';
import { ResidenceHeader } from './residence-header';

// ============================================================
// Types
// ============================================================

interface ResidenceViewProps {
  space: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    onlineCount: number;
    memberCount: number;
    activeTodayCount?: number;
    isVerified?: boolean;
    recentMessageCount?: number;
  };
  /** Whether user is a leader */
  isLeader?: boolean;
  /** Whether this is the first visit (show animations) */
  isFirstVisit?: boolean;
  /** Whether to skip all entrance animations */
  skipAnimation?: boolean;
  /** Callback for members button */
  onMembersClick?: () => void;
  /** Callback for settings button */
  onSettingsClick?: () => void;
  /** Callback for create event button */
  onCreateEventClick?: () => void;
  /** Callback for space info */
  onSpaceInfoClick?: () => void;
  /** Children (sidebar + feed) */
  children: React.ReactNode;
}

// ============================================================
// Component
// ============================================================

export function ResidenceView({
  space,
  isLeader = false,
  isFirstVisit = false,
  skipAnimation = false,
  onMembersClick,
  onSettingsClick,
  onCreateEventClick,
  onSpaceInfoClick,
  children,
}: ResidenceViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = isFirstVisit && !skipAnimation && !shouldReduceMotion;

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#050504' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
        ease: MOTION.ease.premium,
      }}
    >
      <ArrivalTransition skipAnimation={!shouldAnimate}>
        {/* Header */}
        <ArrivalZone zone="header">
          <ResidenceHeader
            space={space}
            isLeader={isLeader}
            animateBorder={shouldAnimate}
            onMembersClick={onMembersClick}
            onSettingsClick={onSettingsClick}
            onCreateEventClick={onCreateEventClick}
            onSpaceInfoClick={onSpaceInfoClick}
          />
        </ArrivalZone>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {children}
        </div>
      </ArrivalTransition>
    </motion.div>
  );
}

// ============================================================
// Feed Wrapper with staggered entrance
// ============================================================

interface FeedWrapperProps {
  children: React.ReactNode;
  isFirstVisit?: boolean;
}

export function FeedWrapper({ children, isFirstVisit: _isFirstVisit = false }: FeedWrapperProps) {
  return (
    <ArrivalZone zone="content" className="flex-1 flex flex-col min-w-0">
      {children}
    </ArrivalZone>
  );
}

// ============================================================
// Sidebar Wrapper
// ============================================================

interface SidebarWrapperProps {
  children: React.ReactNode;
  isFirstVisit?: boolean;
}

export function SidebarWrapper({ children, isFirstVisit: _isFirstVisit = false }: SidebarWrapperProps) {
  return (
    <ArrivalZone zone="sidebar" className="w-[280px] shrink-0">
      {children}
    </ArrivalZone>
  );
}

// ============================================================
// Board Room Transition
// ============================================================

interface BoardRoomTransitionProps {
  boardId: string;
  children: React.ReactNode;
}

export function BoardRoomTransition({
  boardId,
  children,
}: BoardRoomTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={boardId}
        initial={{
          opacity: 0,
          x: shouldReduceMotion ? 0 : SPACES_MOTION.board.slideX,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        exit={{
          opacity: 0,
          x: shouldReduceMotion ? 0 : -SPACES_MOTION.board.slideX,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : SPACES_MOTION.board.duration,
          ease: MOTION.ease.premium,
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Feed Item with scroll-triggered reveal
// ============================================================

interface FeedItemRevealProps {
  children: React.ReactNode;
  index: number;
  maxAnimated?: number;
}

export function FeedItemReveal({
  children,
  index,
  maxAnimated = 10,
}: FeedItemRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  // Only animate first N items
  if (index >= maxAnimated || shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * SPACES_MOTION.crossing.feedStagger,
        ease: MOTION.ease.premium,
      }}
    >
      {children}
    </motion.div>
  );
}

ResidenceView.displayName = 'ResidenceView';
FeedWrapper.displayName = 'FeedWrapper';
SidebarWrapper.displayName = 'SidebarWrapper';
BoardRoomTransition.displayName = 'BoardRoomTransition';
FeedItemReveal.displayName = 'FeedItemReveal';
