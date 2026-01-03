'use client';

/**
 * MinimalSidebar
 * Resend/YC/SF-inspired navigation sidebar
 *
 * Design principles:
 * - Ultra-minimal, typography-driven
 * - Same bg as page (no visual box)
 * - Subtle hover states (bg fill only)
 * - White active indicators (gold is earned)
 * - Fast animations (100-200ms)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_SPRING,
  LABEL_TRANSITION,
} from './sidebar.constants';
import { useSidebarState, useSpacesDropdownState } from './use-sidebar-state';
import { SidebarNavItem } from './sidebar-nav-item';
import { SpacesDropdown } from './sidebar-spaces-dropdown';
import { SidebarProfileAvatar } from './sidebar-profile-avatar';
import type { MinimalSidebarProps } from './sidebar.types';

// HIVE marks (icons)
import { StreamMark, ClusterMark, BuildMark } from '../../atoms/hive-marks';

export function MinimalSidebar({
  spaces = [],
  activeSpaceId,
  onSpaceSelect,
  onBrowseClick,
  onFeedClick,
  onBuildClick,
  onProfileClick,
  user,
  isBuilder = false,
  pathname = '',
  isExpanded: controlledExpanded,
  onExpandChange,
}: MinimalSidebarProps) {
  // Support both controlled and uncontrolled modes
  const internalState = useSidebarState(true);
  const { isOpen: spacesOpen, toggle: toggleSpaces } = useSpacesDropdownState(true);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalState.isExpanded;

  const toggle = React.useCallback(() => {
    if (isControlled) {
      onExpandChange?.(!isExpanded);
    } else {
      internalState.toggle();
    }
  }, [isControlled, isExpanded, onExpandChange, internalState]);

  const expand = React.useCallback(() => {
    if (isControlled) {
      onExpandChange?.(true);
    } else {
      internalState.expand();
    }
  }, [isControlled, onExpandChange, internalState]);

  // Determine active nav item based on pathname
  const activeItem = React.useMemo(() => {
    if (pathname.startsWith('/feed')) return 'feed';
    if (pathname.startsWith('/spaces')) return 'spaces';
    if (pathname.startsWith('/tools')) return 'build';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'spaces'; // Default
  }, [pathname]);

  // Handle clicking collapsed sidebar to expand
  const handleCollapsedClick = () => {
    if (!isExpanded) {
      expand();
    }
  };

  return (
    <motion.nav
      initial={false}
      animate={{ width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
      transition={SIDEBAR_SPRING}
      onClick={!isExpanded ? handleCollapsedClick : undefined}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50',
        'flex flex-col',
        'bg-[#0A0A0A]',
        !isExpanded && 'cursor-pointer'
      )}
    >
      {/* Subtle right edge */}
      <div
        className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent 100%)',
        }}
      />

      {/* Header: Logo + Collapse toggle */}
      <div className={cn(
        'flex items-center py-4',
        isExpanded ? 'px-4 justify-between' : 'px-0 justify-center'
      )}>
        <motion.div
          layout
          className="text-white/50 hover:text-white/70 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpanded) expand();
          }}
        >
          <HiveMark size={24} />
        </motion.div>

        {/* Collapse button (only when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={LABEL_TRANSITION}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="p-1.5 rounded-md text-[#52525B] hover:text-[#A1A1A6] hover:bg-white/[0.03] transition-colors"
              aria-label="Collapse sidebar"
            >
              <CollapseIcon />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <div className={cn('flex-1 py-2', isExpanded ? 'px-2' : 'px-2')}>
        <div className="space-y-0.5">
          {/* Feed (Coming Soon) */}
          <SidebarNavItem
            icon={<StreamMark size={20} />}
            label="Feed"
            isExpanded={isExpanded}
            isActive={activeItem === 'feed'}
            badge="Soon"
            disabled
            onClick={onFeedClick}
          />

          {/* Spaces (with dropdown) */}
          <div>
            <SidebarNavItem
              icon={<ClusterMark size={20} />}
              label="Spaces"
              isExpanded={isExpanded}
              isActive={activeItem === 'spaces'}
              hasDropdown
              isDropdownOpen={spacesOpen}
              onClick={() => {
                if (isExpanded) {
                  toggleSpaces();
                } else {
                  expand();
                }
              }}
            />
            <SpacesDropdown
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              onSpaceSelect={onSpaceSelect}
              onBrowseClick={onBrowseClick}
              isOpen={spacesOpen}
              isExpanded={isExpanded}
            />
          </div>

          {/* Build/HiveLab (gold accent) */}
          {isBuilder && (
            <SidebarNavItem
              icon={<BuildMark size={20} />}
              label="Build"
              isExpanded={isExpanded}
              isActive={activeItem === 'build'}
              variant="gold"
              onClick={onBuildClick}
            />
          )}
        </div>
      </div>

      {/* Footer: Profile */}
      <div className={cn('py-4', isExpanded ? 'px-2' : 'px-2')}>
        <SidebarProfileAvatar
          user={user}
          isExpanded={isExpanded}
          onClick={onProfileClick}
        />
      </div>
    </motion.nav>
  );
}

// HIVE Logo mark
const HIVE_LOGO_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

function HiveMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1500 1500" fill="currentColor">
      <path d={HIVE_LOGO_PATH} />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

export default MinimalSidebar;
