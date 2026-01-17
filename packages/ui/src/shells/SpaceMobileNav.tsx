'use client';

/**
 * Space Mobile Navigation — Bottom Navigation When Inside a Space
 *
 * Replaces ShellMobileNav when viewing a specific space.
 * Shows space-specific tabs: Chat, Events, Resources, Members.
 *
 * Features:
 * - 4 space tabs with icons
 * - Active state with gold indicator
 * - Floating back button to return to main nav
 * - Safe area padding for notched devices
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  MessageCircleIcon,
  CalendarIcon,
  UsersIcon,
  ChevronLeftIcon,
} from './shell-icons';

// ============================================
// ICONS (local to this file)
// ============================================

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export type SpaceTab = 'chat' | 'events' | 'resources' | 'members';

export interface SpaceMobileNavItem {
  id: SpaceTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}

export interface SpaceMobileNavProps {
  /** Space ID for navigation */
  spaceId: string;
  /** Currently active tab */
  activeTab?: SpaceTab;
  /** Handler for tab selection */
  onTabSelect?: (tab: SpaceTab) => void;
  /** Handler for back button */
  onBack?: () => void;
  /** Handler for navigation */
  onNavigate?: (path: string) => void;
}

// ============================================
// TAB ITEMS
// ============================================

const SPACE_TAB_ITEMS: SpaceMobileNavItem[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircleIcon },
  { id: 'events', label: 'Events', icon: CalendarIcon },
  { id: 'resources', label: 'Files', icon: FolderIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
];

// ============================================
// COMPONENT
// ============================================

export function SpaceMobileNav({
  spaceId,
  activeTab = 'chat',
  onTabSelect,
  onBack,
  onNavigate,
}: SpaceMobileNavProps) {
  // Handle tab click
  const handleTabClick = (tab: SpaceTab) => {
    if (onTabSelect) {
      onTabSelect(tab);
    } else if (onNavigate) {
      const path = tab === 'chat'
        ? `/spaces/${spaceId}`
        : `/spaces/${spaceId}/${tab}`;
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      const path = tab === 'chat'
        ? `/spaces/${spaceId}`
        : `/spaces/${spaceId}/${tab}`;
      window.location.href = path;
    }
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('/spaces');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/spaces';
    }
  };

  return (
    <>
      {/* Floating Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        onClick={handleBack}
        className={cn(
          'fixed left-4 bottom-20 z-50',
          'flex items-center gap-1.5 px-3 py-2 rounded-full',
          'bg-neutral-900/90 backdrop-blur-xl',
          'border border-neutral-800/50',
          'text-sm text-neutral-300',
          'shadow-lg shadow-black/20',
          'transition-colors duration-100',
          'active:bg-neutral-800'
        )}
        aria-label="Back to Spaces"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span>Spaces</span>
      </motion.button>

      {/* Tab Navigation */}
      <nav
        className={cn(
          'bg-neutral-950/95 backdrop-blur-xl',
          'border-t border-neutral-800/50',
          // Safe area padding for notched devices
          'pb-[env(safe-area-inset-bottom,0px)]'
        )}
      >
        <div className="flex justify-around items-center h-14 px-2">
          {SPACE_TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1',
                  'flex-1 py-2 min-w-0',
                  'transition-colors duration-100',
                  active
                    ? 'text-white'
                    : 'text-neutral-500 active:text-neutral-300'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className="w-[18px] h-[18px]" />

                  {/* Active indicator — gold dot */}
                  {active && (
                    <motion.span
                      layoutId="space-nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-life-gold"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>

                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default SpaceMobileNav;
