'use client';

/**
 * CampusDock - Bottom dock for Campus navigation
 *
 * 64px height, contains two sections:
 * 1. Spaces section - User's joined spaces as orbs
 * 2. Tools section - User's created/deployed tools
 *
 * Features:
 * - Glass effect background
 * - Drag to reorder spaces
 * - Overflow handling (+N indicator)
 * - Active space highlighting
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { DockOrb, type WarmthLevel } from './DockOrb';
import { useCampusOptional } from './CampusProvider';

// ============================================
// CONSTANTS
// ============================================

const DOCK_HEIGHT = 64;
const MAX_VISIBLE_SPACES = 8;
const MAX_VISIBLE_TOOLS = 4;

// ============================================
// TYPES
// ============================================

export interface DockSpaceItem {
  id: string;
  name: string;
  slug?: string;
  avatar?: string;
  onlineCount: number;
  unreadCount?: number;
  warmth: WarmthLevel;
}

export interface DockToolItem {
  id: string;
  name: string;
  icon?: string;
  activeUsers: number;
  isDeployed?: boolean;
}

export interface CampusDockProps {
  // Spaces section
  spaces: DockSpaceItem[];
  activeSpaceId?: string;
  maxVisibleSpaces?: number;
  onSpaceClick?: (spaceId: string) => void;
  onSpaceReorder?: (newOrder: string[]) => void;

  // Tools section
  tools: DockToolItem[];
  maxVisibleTools?: number;
  onToolClick?: (toolId: string) => void;
  onToolQuickRun?: (toolId: string) => void;

  // Overflow
  onBrowseMoreSpaces?: () => void;
  onBrowseMoreTools?: () => void;

  // Builder access
  isBuilder?: boolean;

  className?: string;
}

// ============================================
// ICONS
// ============================================

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"
      />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ============================================
// SUBCOMPONENTS
// ============================================

interface OverflowIndicatorProps {
  count: number;
  onClick?: () => void;
}

function OverflowIndicator({ count, onClick }: OverflowIndicatorProps) {
  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ opacity: 0.8 }}
      onClick={onClick}
      className={cn(
        'w-11 h-11',
        'flex items-center justify-center',
        'rounded-xl',
        'bg-[var(--bg-surface)]',
        'border border-[var(--border-default)]',
        'text-sm font-medium text-[var(--text-secondary)]',
        'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'transition-colors duration-150'
      )}
      aria-label={`${count} more items`}
    >
      +{count}
    </motion.button>
  );
}

interface DockDividerProps {
  className?: string;
}

function DockDivider({ className }: DockDividerProps) {
  return (
    <div
      className={cn(
        'w-px h-8',
        'bg-[var(--border-default)]',
        'mx-3',
        className
      )}
      aria-hidden="true"
    />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CampusDock({
  spaces,
  activeSpaceId,
  maxVisibleSpaces = MAX_VISIBLE_SPACES,
  onSpaceClick,
  onSpaceReorder,
  tools,
  maxVisibleTools = MAX_VISIBLE_TOOLS,
  onToolClick,
  onToolQuickRun,
  onBrowseMoreSpaces,
  onBrowseMoreTools,
  isBuilder = false,
  className,
}: CampusDockProps) {
  const router = useRouter();
  const campus = useCampusOptional();

  // Get space order from context or use default
  const spaceOrder = campus?.spaceOrder || spaces.map((s) => s.id);

  // Sort spaces by order
  const sortedSpaces = React.useMemo(() => {
    const orderMap = new Map(spaceOrder.map((id, index) => [id, index]));
    return [...spaces].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? Infinity;
      const bIndex = orderMap.get(b.id) ?? Infinity;
      return aIndex - bIndex;
    });
  }, [spaces, spaceOrder]);

  // Visible items
  const visibleSpaces = sortedSpaces.slice(0, maxVisibleSpaces);
  const hiddenSpaceCount = Math.max(0, sortedSpaces.length - maxVisibleSpaces);

  const visibleTools = tools.slice(0, maxVisibleTools);
  const hiddenToolCount = Math.max(0, tools.length - maxVisibleTools);

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
    },
    [onSpaceClick, spaces, router]
  );

  const handleToolClick = React.useCallback(
    (toolId: string) => {
      if (onToolClick) {
        onToolClick(toolId);
      } else {
        router.push(`/lab/${toolId}`);
      }
    },
    [onToolClick, router]
  );

  // Hover preview handlers
  const handleSpaceHover = React.useCallback(
    (spaceId: string, position: { x: number; y: number }) => {
      campus?.setHoveredOrbId(spaceId);
      campus?.setPreviewPosition(position);
    },
    [campus]
  );

  const handleToolHover = React.useCallback(
    (toolId: string, position: { x: number; y: number }) => {
      campus?.setHoveredOrbId(toolId);
      campus?.setPreviewPosition(position);
    },
    [campus]
  );

  const handleHoverEnd = React.useCallback(() => {
    campus?.setHoveredOrbId(null);
    campus?.setPreviewPosition(null);
  }, [campus]);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'hidden lg:flex items-center justify-center gap-2 px-4',
        'bg-[var(--bg-ground)]/90 backdrop-blur-xl',
        'border-t border-[var(--border-subtle)]',
        className
      )}
      style={{ height: DOCK_HEIGHT }}
    >
      {/* Spaces Section */}
      <div className="flex items-center gap-2">
        {visibleSpaces.map((space) => (
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
            onHover={(pos) => handleSpaceHover(space.id, pos)}
            onHoverEnd={handleHoverEnd}
          />
        ))}

        {/* Overflow indicator */}
        {hiddenSpaceCount > 0 && (
          <OverflowIndicator
            count={hiddenSpaceCount}
            onClick={onBrowseMoreSpaces || (() => router.push('/spaces/browse'))}
          />
        )}

        {/* Add space button (if no spaces) */}
        {visibleSpaces.length === 0 && (
          <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ opacity: 0.8 }}
            onClick={() => router.push('/spaces/browse')}
            className={cn(
              'flex items-center gap-2 px-4 py-2',
              'rounded-xl',
              'bg-[var(--bg-surface)]',
              'border border-dashed border-[var(--border-default)]',
              'text-sm text-[var(--text-secondary)]',
              'hover:border-[var(--life-gold)] hover:text-[var(--text-primary)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              'transition-colors duration-150'
            )}
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>Join a space</span>
          </motion.button>
        )}
      </div>

      {/* Divider */}
      {(visibleSpaces.length > 0 || tools.length > 0) && <DockDivider />}

      {/* Tools Section */}
      {isBuilder && (
        <div className="flex items-center gap-2">
          {visibleTools.map((tool) => (
            <DockOrb
              key={tool.id}
              id={tool.id}
              type="tool"
              name={tool.name}
              icon={<WrenchIcon className="w-5 h-5" />}
              activeUsers={tool.activeUsers}
              warmth={tool.activeUsers > 0 ? 'low' : 'none'}
              onClick={() => handleToolClick(tool.id)}
              onHover={(pos) => handleToolHover(tool.id, pos)}
              onHoverEnd={handleHoverEnd}
            />
          ))}

          {/* Overflow indicator */}
          {hiddenToolCount > 0 && (
            <OverflowIndicator
              count={hiddenToolCount}
              onClick={onBrowseMoreTools || (() => router.push('/tools'))}
            />
          )}

          {/* Create tool button (if builder with no tools) */}
          {visibleTools.length === 0 && (
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={() => router.push('/tools/create')}
              className={cn(
                'flex items-center gap-2 px-4 py-2',
                'rounded-xl',
                'bg-[var(--bg-surface)]',
                'border border-dashed border-[var(--border-default)]',
                'text-sm text-[var(--text-secondary)]',
                'hover:border-[var(--life-gold)] hover:text-[var(--text-primary)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                'transition-colors duration-150'
              )}
            >
              <WrenchIcon className="w-5 h-5" />
              <span>Create tool</span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

export default CampusDock;
