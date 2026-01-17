'use client';

/**
 * CampusDrawer - Mobile pull-up drawer for Campus navigation
 *
 * Three states:
 * - closed: Off screen
 * - peek (20%): Just space orbs visible
 * - half (50%): Spaces + tools sections
 * - full (80%): Everything + search
 *
 * Gesture support: swipe up/down to change states
 */

import * as React from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { DockOrb } from '../campus/DockOrb';
import { useCampusOptional, type DrawerState } from '../campus/CampusProvider';
import type { DockSpaceItem, DockToolItem } from '../campus/CampusDock';

// ============================================
// CONSTANTS
// ============================================

const SNAP_POINTS: Record<DrawerState, number> = {
  closed: 0,
  peek: 0.2,
  half: 0.5,
  full: 0.8,
};

const DRAWER_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
};

// ============================================
// TYPES
// ============================================

export interface CampusDrawerProps {
  // Data
  spaces: DockSpaceItem[];
  tools: DockToolItem[];
  activeSpaceId?: string;
  isBuilder?: boolean;

  // State (controlled)
  state?: DrawerState;
  onStateChange?: (state: DrawerState) => void;

  // Actions
  onSpaceClick?: (spaceId: string) => void;
  onToolClick?: (toolId: string) => void;
  onSearchClick?: () => void;

  className?: string;
}

// ============================================
// ICONS
// ============================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CampusDrawer({
  spaces,
  tools,
  activeSpaceId,
  isBuilder = false,
  state: controlledState,
  onStateChange,
  onSpaceClick,
  onToolClick,
  onSearchClick,
  className,
}: CampusDrawerProps) {
  const router = useRouter();
  const campus = useCampusOptional();
  const dragControls = useDragControls();

  // Use controlled or context state
  const drawerState = controlledState ?? campus?.drawerState ?? 'closed';
  const setDrawerState = onStateChange ?? campus?.setDrawerState ?? (() => {});

  // Calculate height based on state
  const getHeight = React.useCallback((state: DrawerState) => {
    if (typeof window === 'undefined') return 0;
    return window.innerHeight * SNAP_POINTS[state];
  }, []);

  // Handle drag end - snap to nearest point
  const handleDragEnd = React.useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;

      // Quick swipe detection
      if (Math.abs(velocity) > 500) {
        if (velocity < 0) {
          // Swipe up
          if (drawerState === 'closed') setDrawerState('peek');
          else if (drawerState === 'peek') setDrawerState('half');
          else if (drawerState === 'half') setDrawerState('full');
        } else {
          // Swipe down
          if (drawerState === 'full') setDrawerState('half');
          else if (drawerState === 'half') setDrawerState('peek');
          else if (drawerState === 'peek') setDrawerState('closed');
        }
        return;
      }

      // Snap to nearest based on position
      const currentHeight = getHeight(drawerState);
      const newHeight = currentHeight - offset;
      const viewportHeight = window.innerHeight;
      const ratio = newHeight / viewportHeight;

      // Find nearest snap point
      const states: DrawerState[] = ['closed', 'peek', 'half', 'full'];
      let nearestState: DrawerState = 'closed';
      let nearestDistance = Infinity;

      for (const state of states) {
        const distance = Math.abs(SNAP_POINTS[state] - ratio);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestState = state;
        }
      }

      setDrawerState(nearestState);
    },
    [drawerState, setDrawerState, getHeight]
  );

  // Handlers
  const handleSpaceClick = React.useCallback(
    (spaceId: string) => {
      if (onSpaceClick) {
        onSpaceClick(spaceId);
      } else {
        const space = spaces.find((s) => s.id === spaceId);
        if (space?.slug) {
          router.push(`/spaces/s/${space.slug}`);
        } else {
          router.push(`/spaces/${spaceId}`);
        }
      }
      setDrawerState('closed');
    },
    [onSpaceClick, spaces, router, setDrawerState]
  );

  const handleToolClick = React.useCallback(
    (toolId: string) => {
      if (onToolClick) {
        onToolClick(toolId);
      } else {
        router.push(`/tools/${toolId}`);
      }
      setDrawerState('closed');
    },
    [onToolClick, router, setDrawerState]
  );

  const handleSearchClick = React.useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      campus?.openSpotlight();
    }
    setDrawerState('closed');
  }, [onSearchClick, campus, setDrawerState]);

  // Toggle between peek and closed
  const handleHandleClick = React.useCallback(() => {
    if (drawerState === 'closed') {
      setDrawerState('peek');
    } else if (drawerState === 'peek') {
      setDrawerState('half');
    } else if (drawerState === 'half') {
      setDrawerState('full');
    } else {
      setDrawerState('peek');
    }
  }, [drawerState, setDrawerState]);

  // Don't render on desktop
  if (campus?.isDesktop) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {drawerState !== 'closed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40 lg:hidden"
            onClick={() => setDrawerState('closed')}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{
          y: `${100 - SNAP_POINTS[drawerState] * 100}%`,
        }}
        transition={DRAWER_SPRING}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-[var(--bg-ground)]',
          'border-t border-[var(--border-subtle)]',
          'rounded-t-2xl',
          'shadow-[0_-8px_32px_rgba(0,0,0,0.5)]',
          'touch-none',
          'lg:hidden',
          className
        )}
        style={{ height: '80vh' }}
      >
        {/* Handle */}
        <button
          onClick={handleHandleClick}
          onPointerDown={(e) => dragControls.start(e)}
          className={cn(
            'w-full py-3',
            'flex flex-col items-center gap-2',
            'cursor-grab active:cursor-grabbing'
          )}
        >
          <div className="w-9 h-1 rounded-full bg-[var(--bg-emphasis)]" />
          <motion.div
            animate={{ rotate: drawerState === 'full' ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUpIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </motion.div>
        </button>

        {/* Content */}
        <div className="px-4 pb-safe overflow-y-auto" style={{ maxHeight: 'calc(80vh - 56px)' }}>
          {/* Search (full state only) */}
          <AnimatePresence>
            {(drawerState === 'half' || drawerState === 'full') && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={handleSearchClick}
                className={cn(
                  'w-full mb-4 px-4 py-3',
                  'flex items-center gap-3',
                  'bg-[var(--bg-surface)]',
                  'border border-[var(--border-default)]',
                  'rounded-xl',
                  'text-sm text-[var(--text-muted)]'
                )}
              >
                <SearchIcon className="w-5 h-5" />
                <span>Search spaces & tools...</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Spaces Section */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Your Spaces
            </h3>
            <div className="flex flex-wrap gap-3">
              {spaces.slice(0, 12).map((space) => (
                <DockOrb
                  key={space.id}
                  id={space.id}
                  type="space"
                  name={space.name}
                  avatar={space.avatar}
                  onlineCount={space.onlineCount}
                  unreadCount={space.unreadCount}
                  warmth={space.warmth}
                  isActive={space.id === activeSpaceId}
                  onClick={() => handleSpaceClick(space.id)}
                />
              ))}
              {spaces.length === 0 && (
                <button
                  onClick={() => {
                    router.push('/spaces/browse');
                    setDrawerState('closed');
                  }}
                  className={cn(
                    'px-4 py-2',
                    'border border-dashed border-[var(--border-default)]',
                    'rounded-xl',
                    'text-sm text-[var(--text-muted)]',
                    'hover:border-[var(--life-gold)]'
                  )}
                >
                  Browse spaces
                </button>
              )}
            </div>
          </div>

          {/* Tools Section (half/full state) */}
          <AnimatePresence>
            {isBuilder && (drawerState === 'half' || drawerState === 'full') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Your Tools
                </h3>
                <div className="flex flex-wrap gap-3">
                  {tools.slice(0, 8).map((tool) => (
                    <DockOrb
                      key={tool.id}
                      id={tool.id}
                      type="tool"
                      name={tool.name}
                      icon={<WrenchIcon className="w-5 h-5" />}
                      activeUsers={tool.activeUsers}
                      warmth={tool.activeUsers > 0 ? 'low' : 'none'}
                      onClick={() => handleToolClick(tool.id)}
                    />
                  ))}
                  {tools.length === 0 && (
                    <button
                      onClick={() => {
                        router.push('/tools/create');
                        setDrawerState('closed');
                      }}
                      className={cn(
                        'px-4 py-2',
                        'border border-dashed border-[var(--border-default)]',
                        'rounded-xl',
                        'text-sm text-[var(--text-muted)]',
                        'hover:border-[var(--life-gold)]'
                      )}
                    >
                      Create a tool
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile Tab Bar (when drawer is closed) */}
      <AnimatePresence>
        {drawerState === 'closed' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={DRAWER_SPRING}
            className={cn(
              'fixed bottom-0 inset-x-0 z-40',
              'flex items-center justify-around py-2 pb-safe',
              'bg-[var(--bg-ground)]/95 backdrop-blur-md',
              'border-t border-[var(--border-subtle)]',
              'lg:hidden'
            )}
          >
            <button
              onClick={() => setDrawerState('peek')}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                'text-[var(--text-secondary)]'
              )}
            >
              <div className="flex -space-x-2">
                {spaces.slice(0, 3).map((space) => (
                  <div
                    key={space.id}
                    className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--bg-ground)] overflow-hidden"
                  >
                    {space.avatar ? (
                      <img src={space.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-[8px]">
                        {space.name[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px]">Spaces</span>
            </button>

            <button
              onClick={handleSearchClick}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                'text-[var(--text-secondary)]'
              )}
            >
              <SearchIcon className="w-6 h-6" />
              <span className="text-[10px]">Search</span>
            </button>

            {isBuilder && (
              <button
                onClick={() => {
                  router.push('/tools');
                }}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2',
                  'text-[var(--text-secondary)]'
                )}
              >
                <WrenchIcon className="w-6 h-6" />
                <span className="text-[10px]">Lab</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CampusDrawer;
