'use client';

/**
 * ElementGroup Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Collapsible element categories for HiveLab palette
 * Glass surface, chevron rotation animation, tier badges.
 *
 * Recipe:
 *   header: Sticky, glass bg, chevron toggle
 *   content: Grid of element items
 *   tiers: Badge colors (Everyone=green, Connected=blue, Leaders=gold)
 *   collapse: Smooth height transition
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass surface for header
const glassHeaderSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
};

// LOCKED: Tier colors
const TIER_COLORS = {
  everyone: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  connected: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  leaders: {
    bg: 'bg-[#D4AF37]/20',
    text: 'text-[#D4AF37]',
    border: 'border-[#D4AF37]/30',
  },
};

// Container variants
const elementGroupContainerVariants = cva(
  [
    'rounded-xl',
    'border border-white/[0.06]',
    'overflow-hidden',
  ].join(' ')
);

// Header variants
const elementGroupHeaderVariants = cva(
  [
    'flex items-center justify-between',
    'px-3 py-2.5',
    'cursor-pointer',
    'transition-colors duration-150',
    'hover:bg-white/[0.02]',
    // Focus (WHITE)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50',
  ].join(' ')
);

// Content variants
const elementGroupContentVariants = cva(
  [
    'px-3 pb-3',
  ].join(' ')
);

// Element item variants
const elementItemVariants = cva(
  [
    'flex flex-col items-center justify-center',
    'p-3',
    'rounded-xl',
    'border border-white/[0.06]',
    'bg-white/[0.02]',
    'cursor-grab active:cursor-grabbing',
    'transition-all duration-150',
    // Hover (brightness, not scale)
    'hover:brightness-125 hover:border-white/10',
    // Focus (WHITE)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    // Disabled
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'min-h-[64px]',
        default: 'min-h-[80px]',
        lg: 'min-h-[96px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Tier badge variants
const tierBadgeVariants = cva(
  [
    'inline-flex items-center',
    'px-1.5 py-0.5',
    'rounded text-[10px] font-medium',
    'border',
  ].join(' ')
);

// Types
export type ElementTier = 'everyone' | 'connected' | 'leaders';

export interface ElementItem {
  /** Unique identifier */
  id: string;
  /** Element name */
  name: string;
  /** Element type */
  type: string;
  /** Icon (component or emoji) */
  icon: React.ReactNode;
  /** Description */
  description?: string;
  /** Access tier */
  tier?: ElementTier;
  /** Disabled state */
  disabled?: boolean;
  /** Drag data (for drag-and-drop) */
  dragData?: Record<string, unknown>;
}

export interface ElementGroupData {
  /** Group ID */
  id: string;
  /** Group name */
  name: string;
  /** Group icon */
  icon?: React.ReactNode;
  /** Elements in this group */
  elements: ElementItem[];
  /** Default expanded state */
  defaultExpanded?: boolean;
}

export interface ElementGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Group data */
  group: ElementGroupData;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Expansion change handler */
  onExpandedChange?: (expanded: boolean) => void;
  /** Element click handler */
  onElementClick?: (element: ElementItem) => void;
  /** Element drag start handler */
  onElementDragStart?: (element: ElementItem, event: React.DragEvent) => void;
  /** Show tier badges */
  showTierBadges?: boolean;
  /** Grid columns */
  columns?: 2 | 3 | 4;
  /** Element item size */
  elementSize?: 'sm' | 'default' | 'lg';
}

// Chevron icon
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <motion.svg
    className="w-4 h-4 text-white/40"
    viewBox="0 0 16 16"
    fill="currentColor"
    initial={false}
    animate={{ rotate: expanded ? 180 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <path
      fillRule="evenodd"
      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z"
      clipRule="evenodd"
    />
  </motion.svg>
);

// Tier badge component
const TierBadge: React.FC<{ tier: ElementTier }> = ({ tier }) => {
  const colors = TIER_COLORS[tier];
  const labels = {
    everyone: 'Everyone',
    connected: 'Connected',
    leaders: 'Leaders',
  };

  return (
    <span className={cn(tierBadgeVariants(), colors.bg, colors.text, colors.border)}>
      {labels[tier]}
    </span>
  );
};

// Element item component
const ElementItemCard: React.FC<{
  element: ElementItem;
  size: 'sm' | 'default' | 'lg';
  showTierBadge?: boolean;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent) => void;
}> = ({ element, size, showTierBadge, onClick, onDragStart }) => {
  return (
    <button
      type="button"
      className={cn(elementItemVariants({ size }))}
      onClick={onClick}
      disabled={element.disabled}
      draggable={!element.disabled}
      onDragStart={(e) => {
        if (element.dragData) {
          e.dataTransfer.setData('application/json', JSON.stringify(element.dragData));
        }
        e.dataTransfer.setData('text/plain', element.id);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart?.(e);
      }}
    >
      {/* Icon */}
      <div className="text-2xl mb-1.5 text-white/60">{element.icon}</div>

      {/* Name */}
      <span className="text-[11px] font-medium text-white/70 text-center leading-tight">
        {element.name}
      </span>

      {/* Tier badge */}
      {showTierBadge && element.tier && element.tier !== 'everyone' && (
        <div className="mt-1.5">
          <TierBadge tier={element.tier} />
        </div>
      )}
    </button>
  );
};

// Main component
const ElementGroup = React.forwardRef<HTMLDivElement, ElementGroupProps>(
  (
    {
      className,
      group,
      expanded: controlledExpanded,
      onExpandedChange,
      onElementClick,
      onElementDragStart,
      showTierBadges = true,
      columns = 3,
      elementSize = 'default',
      ...props
    },
    ref
  ) => {
    const [internalExpanded, setInternalExpanded] = React.useState(
      group.defaultExpanded ?? true
    );
    const expanded = controlledExpanded ?? internalExpanded;

    const handleToggle = () => {
      const newExpanded = !expanded;
      setInternalExpanded(newExpanded);
      onExpandedChange?.(newExpanded);
    };

    const gridCols = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };

    return (
      <div
        ref={ref}
        className={cn(elementGroupContainerVariants(), className)}
        {...props}
      >
        {/* Header */}
        <button
          type="button"
          className={cn(elementGroupHeaderVariants())}
          style={glassHeaderSurface}
          onClick={handleToggle}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            {group.icon && (
              <span className="text-white/50">{group.icon}</span>
            )}
            <span className="text-sm font-medium text-white/80">{group.name}</span>
            <span className="text-xs text-white/40">({group.elements.length})</span>
          </div>
          <ChevronIcon expanded={expanded} />
        </button>

        {/* Content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={cn(elementGroupContentVariants())}>
                <div className={cn('grid gap-2', gridCols[columns])}>
                  {group.elements.map((element) => (
                    <ElementItemCard
                      key={element.id}
                      element={element}
                      size={elementSize}
                      showTierBadge={showTierBadges}
                      onClick={() => onElementClick?.(element)}
                      onDragStart={(e) => onElementDragStart?.(element, e)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

ElementGroup.displayName = 'ElementGroup';

// Element palette component (multiple groups)
export interface ElementPaletteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Groups of elements */
  groups: ElementGroupData[];
  /** Element click handler */
  onElementClick?: (element: ElementItem) => void;
  /** Element drag start handler */
  onElementDragStart?: (element: ElementItem, event: React.DragEvent) => void;
  /** Show tier badges */
  showTierBadges?: boolean;
  /** Grid columns per group */
  columns?: 2 | 3 | 4;
  /** Search query for filtering */
  searchQuery?: string;
}

const ElementPalette = React.forwardRef<HTMLDivElement, ElementPaletteProps>(
  (
    {
      className,
      groups,
      onElementClick,
      onElementDragStart,
      showTierBadges = true,
      columns = 3,
      searchQuery = '',
      ...props
    },
    ref
  ) => {
    // Filter elements by search query
    const filteredGroups = React.useMemo(() => {
      if (!searchQuery.trim()) return groups;

      const query = searchQuery.toLowerCase();
      return groups
        .map((group) => ({
          ...group,
          elements: group.elements.filter(
            (el) =>
              el.name.toLowerCase().includes(query) ||
              el.type.toLowerCase().includes(query) ||
              el.description?.toLowerCase().includes(query)
          ),
        }))
        .filter((group) => group.elements.length > 0);
    }, [groups, searchQuery]);

    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        {filteredGroups.map((group) => (
          <ElementGroup
            key={group.id}
            group={group}
            onElementClick={onElementClick}
            onElementDragStart={onElementDragStart}
            showTierBadges={showTierBadges}
            columns={columns}
          />
        ))}

        {filteredGroups.length === 0 && searchQuery && (
          <div className="py-8 text-center">
            <p className="text-sm text-white/40">No elements match "{searchQuery}"</p>
          </div>
        )}
      </div>
    );
  }
);

ElementPalette.displayName = 'ElementPalette';

export {
  ElementGroup,
  ElementPalette,
  ElementItemCard,
  TierBadge,
  ChevronIcon,
  // Export variants
  elementGroupContainerVariants,
  elementGroupHeaderVariants,
  elementGroupContentVariants,
  elementItemVariants,
  tierBadgeVariants,
  // Export constants
  TIER_COLORS,
  // Export style helpers
  glassHeaderSurface as elementGroupGlassHeaderSurface,
};
