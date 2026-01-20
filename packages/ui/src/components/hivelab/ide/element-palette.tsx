'use client';

import { useState, useCallback, useRef } from 'react';
import { MagnifyingGlassIcon, ChartBarIcon, FunnelIcon, CalendarIcon, UsersIcon, ClockIcon, TrophyIcon, ChartPieIcon, CalendarDaysIcon, BuildingOfficeIcon, UserPlusIcon, UserIcon, ArrowTrendingUpIcon, ShieldCheckIcon, ChevronRightIcon, DocumentTextIcon, ListBulletIcon, HandThumbUpIcon, GlobeAltIcon, NewspaperIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const FormInput = DocumentTextIcon;
const ListChecks = ListBulletIcon;
const Vote = HandThumbUpIcon;
const Network = GlobeAltIcon;
const UsersRound = UsersIcon;
const CalendarRange = CalendarDaysIcon;
const Newspaper = NewspaperIcon;
const Megaphone = MegaphoneIcon;
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { springPresets, staggerPresets } from '@hive/tokens';

interface UserContext {
  userId?: string;
  campusId?: string;
  isSpaceLeader?: boolean;
  leadingSpaceIds?: string[];
}

interface ElementPaletteProps {
  onDragStart: (elementId: string) => void;
  onDragEnd: () => void;
  /** User context for filtering elements by tier */
  userContext?: UserContext;
}

interface ElementDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'input' | 'display' | 'filter' | 'action' | 'layout';
  tier: 'universal' | 'connected' | 'space';
  /** Element status - 'ready' means fully implemented, 'coming-soon' means stub/no backend */
  status?: 'ready' | 'coming-soon';
}

// Elements that are not yet fully implemented (stub or missing backend APIs)
// These will be hidden from the palette until ready
const HIDDEN_ELEMENTS = new Set([
  'study-spot-finder', // Calls /api/campus/buildings/study-spots - API doesn't exist
  'dining-picker',     // Calls /api/campus/dining - API doesn't exist
]);

// Elements that are coming soon - show greyed out with badge
// Note: Space-tier elements work fine when deployed to a space context.
// They show placeholder UI in preview but function correctly when deployed.
const COMING_SOON_ELEMENTS = new Set<string>([
  // Currently no elements are marked as coming-soon
  // Space-tier elements (member-list, space-events, etc.) work when deployed to a space
]);

// Focused element set for tool building - 20 elements total
const ELEMENTS: ElementDefinition[] = [
  // ===================
  // UNIVERSAL TIER - Core tool-building elements
  // ===================

  // Input (4)
  {
    id: 'search-input',
    name: 'Search Input',
    description: 'Text search with suggestions',
    icon: <MagnifyingGlassIcon className="h-4 w-4" />,
    category: 'input',
    tier: 'universal',
  },
  {
    id: 'form-builder',
    name: 'Form Builder',
    description: 'Collect structured data',
    icon: <FormInput className="h-4 w-4" />,
    category: 'input',
    tier: 'universal',
  },
  {
    id: 'date-picker',
    name: 'Date Picker',
    description: 'Select dates and times',
    icon: <CalendarIcon className="h-4 w-4" />,
    category: 'input',
    tier: 'universal',
  },

  // Display (4)
  {
    id: 'result-list',
    name: 'Result List',
    description: 'Display filterable items',
    icon: <ListChecks className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },
  {
    id: 'chart-display',
    name: 'Chart Display',
    description: 'Visualize poll/vote results',
    icon: <ChartPieIcon className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Ranked scores & gamification',
    icon: <TrophyIcon className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },
  {
    id: 'countdown-timer',
    name: 'Countdown',
    description: 'Count down to event',
    icon: <ClockIcon className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },

  // Filter (1)
  {
    id: 'filter-selector',
    name: 'Filter Selector',
    description: 'Multi-select filters',
    icon: <FunnelIcon className="h-4 w-4" />,
    category: 'filter',
    tier: 'universal',
  },

  // Action - Core engagement elements (4)
  {
    id: 'poll-element',
    name: 'Poll / Vote',
    description: 'Collect votes & decisions',
    icon: <Vote className="h-4 w-4" />,
    category: 'action',
    tier: 'universal',
  },
  {
    id: 'counter',
    name: 'Counter',
    description: 'Track attendance & counts',
    icon: <ChartBarIcon className="h-4 w-4" />,
    category: 'action',
    tier: 'universal',
  },
  {
    id: 'timer',
    name: 'Timer',
    description: 'Stopwatch for sessions',
    icon: <ClockIcon className="h-4 w-4" />,
    category: 'action',
    tier: 'universal',
  },

  // ===================
  // CONNECTED TIER (5)
  // ===================

  // Input
  {
    id: 'event-picker',
    name: 'Event Picker',
    description: 'Browse campus events',
    icon: <CalendarDaysIcon className="h-4 w-4" />,
    category: 'input',
    tier: 'connected',
  },
  {
    id: 'space-picker',
    name: 'Space Picker',
    description: 'Browse campus spaces',
    icon: <BuildingOfficeIcon className="h-4 w-4" />,
    category: 'input',
    tier: 'connected',
  },
  {
    id: 'user-selector',
    name: 'User Selector',
    description: 'Pick campus users',
    icon: <UsersIcon className="h-4 w-4" />,
    category: 'input',
    tier: 'connected',
  },

  // Display
  {
    id: 'connection-list',
    name: 'Connection List',
    description: 'Display your connections',
    icon: <Network className="h-4 w-4" />,
    category: 'display',
    tier: 'connected',
  },

  // Action
  {
    id: 'rsvp-button',
    name: 'RSVP Button',
    description: 'Event attendance',
    icon: <UserPlusIcon className="h-4 w-4" />,
    category: 'action',
    tier: 'connected',
  },

  // ===================
  // SPACE TIER (7) - Leaders only
  // ===================

  // Input
  {
    id: 'member-selector',
    name: 'Member Selector',
    description: 'Select space members',
    icon: <UserIcon className="h-4 w-4" />,
    category: 'input',
    tier: 'space',
  },

  // Display
  {
    id: 'member-list',
    name: 'Member List',
    description: 'Display space members',
    icon: <UsersRound className="h-4 w-4" />,
    category: 'display',
    tier: 'space',
  },
  {
    id: 'space-events',
    name: 'Space Events',
    description: 'Your space events',
    icon: <CalendarRange className="h-4 w-4" />,
    category: 'display',
    tier: 'space',
  },
  {
    id: 'space-feed',
    name: 'Space Feed',
    description: 'Recent space posts',
    icon: <Newspaper className="h-4 w-4" />,
    category: 'display',
    tier: 'space',
  },
  {
    id: 'space-stats',
    name: 'Space Stats',
    description: 'Space analytics',
    icon: <ArrowTrendingUpIcon className="h-4 w-4" />,
    category: 'display',
    tier: 'space',
  },

  // Action
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Post announcements',
    icon: <Megaphone className="h-4 w-4" />,
    category: 'action',
    tier: 'space',
  },

  // Layout
  {
    id: 'role-gate',
    name: 'Role Gate',
    description: 'Restrict by role',
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    category: 'layout',
    tier: 'space',
  },
];

const CATEGORIES = [
  { id: 'input', name: 'Input', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'display', name: 'Display', color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'filter', name: 'Filter', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'action', name: 'Action', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'layout', name: 'Layout', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

interface ElementCardProps {
  element: ElementDefinition;
  onDragStart: () => void;
  onDragEnd: () => void;
  index?: number;
}

function ElementCard({ element, onDragStart, onDragEnd, index = 0 }: ElementCardProps) {
  const category = CATEGORIES.find((c) => c.id === element.category);
  const prefersReducedMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Premium tier gets special effects
  const isPremiumTier = element.tier === 'space';
  const isConnectedTier = element.tier === 'connected';
  const isComingSoon = element.status === 'coming-soon';

  const handleDragStart = (e: React.DragEvent) => {
    // Prevent dragging coming soon elements
    if (isComingSoon) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
    onDragStart();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <motion.div
      draggable={!isComingSoon}
      // Native HTML5 drag handlers - use any cast to avoid Framer Motion type conflict
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragStart={handleDragStart as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragEnd={handleDragEnd as any}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: isComingSoon ? 0.5 : 1,
        x: 0,
        scale: isDragging ? 0.95 : 1,
        rotate: isDragging ? 2 : 0,
      }}
      exit={{ opacity: 0, x: -10 }}
      transition={{
        ...springPresets.snappy,
        delay: prefersReducedMotion ? 0 : index * staggerPresets.fast,
      }}
      whileHover={isComingSoon ? {} : {
        opacity: 0.9,
        y: -2,
        boxShadow: isPremiumTier
          ? '0 4px 20px rgba(168, 85, 247, 0.2)'
          : isConnectedTier
            ? '0 4px 16px rgba(59, 130, 246, 0.15)'
            : '0 4px 12px rgba(0,0,0,0.3)',
      }}
      whileTap={isComingSoon ? {} : { opacity: 0.8 }}
      role="button"
      aria-label={`${element.name}: ${element.description}. ${isComingSoon ? 'Coming soon.' : 'Drag to canvas to add.'}`}
      aria-roledescription={isComingSoon ? 'coming soon element' : 'draggable element'}
      aria-disabled={isComingSoon}
      className={cn(
        'relative p-3 bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)] rounded-xl transition-colors duration-[var(--workshop-duration)] group overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
        isDragging && 'border-[var(--hivelab-border-emphasis)] shadow-lg',
        isPremiumTier && !isComingSoon && 'border-purple-500/30',
        isConnectedTier && !isComingSoon && 'border-blue-500/20',
        isComingSoon ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
      )}
    >
      <div className="flex items-start gap-3 relative z-10">
        <motion.div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            category?.bg,
            category?.color,
            isComingSoon && 'opacity-50'
          )}
          whileHover={isComingSoon ? {} : { opacity: 0.9 }}
          transition={springPresets.bouncy}
        >
          {element.icon}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              'text-sm font-medium truncate',
              isComingSoon ? 'text-white/50' : 'text-white'
            )}>
              {element.name}
            </p>
            {isComingSoon && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
                Soon
              </span>
            )}
            {!isComingSoon && element.tier !== 'universal' && (
              <motion.span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded',
                  element.tier === 'connected'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                )}
                animate={!prefersReducedMotion ? {
                  boxShadow: [
                    '0 0 0 0 rgba(99,102,241,0)',
                    '0 0 0 4px rgba(99,102,241,0.15)',
                    '0 0 0 0 rgba(99,102,241,0)',
                  ],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                {element.tier === 'connected' ? 'Auth' : 'Space'}
              </motion.span>
            )}
          </div>
          <p className={cn(
            'text-xs truncate transition-colors duration-[var(--workshop-duration)]',
            isComingSoon
              ? 'text-[var(--hivelab-text-tertiary)]/50'
              : 'text-[var(--hivelab-text-tertiary)] group-hover:text-[var(--hivelab-text-secondary)]'
          )}>
            {element.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ElementPalette({ onDragStart, onDragEnd, userContext }: ElementPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    CATEGORIES.map((c) => c.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter elements by user context and implementation status
  // - Hide completely: elements with no backend (HIDDEN_ELEMENTS)
  // - Show greyed out: elements coming soon (COMING_SOON_ELEMENTS)
  // - Space-tier: requires isSpaceLeader
  const availableElements = ELEMENTS
    .filter((el) => {
      // First filter: hide broken elements
      if (HIDDEN_ELEMENTS.has(el.id)) return false;

      // Then check tier access
      if (el.tier === 'universal') return true;
      if (el.tier === 'connected') return true;
      if (el.tier === 'space') return userContext?.isSpaceLeader === true;
      return false;
    })
    .map((el) => ({
      ...el,
      // Mark coming soon elements
      status: COMING_SOON_ELEMENTS.has(el.id) ? 'coming-soon' as const : 'ready' as const,
    }));

  const filteredElements = searchQuery
    ? availableElements.filter(
        (el) =>
          el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          el.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableElements;

  const groupedElements = CATEGORIES.map((category) => ({
    ...category,
    elements: filteredElements.filter((el) => el.category === category.id),
  })).filter((group) => group.elements.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[var(--hivelab-border)]">
        <h3 className="text-sm font-medium text-[var(--hivelab-text-primary)] mb-2">Elements</h3>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--hivelab-text-tertiary)]" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements..."
            aria-label="Search elements by name or description"
            className="w-full bg-[var(--hivelab-surface-hover)] border border-[var(--hivelab-border)] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[var(--hivelab-text-primary)] placeholder:text-[var(--hivelab-text-tertiary)] outline-none focus:border-[var(--hivelab-border-emphasis)] focus:ring-2 focus:ring-white/20 transition-colors duration-[var(--workshop-duration)]"
          />
        </div>
      </div>

      {/* Element List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {groupedElements.map((group, groupIndex) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springPresets.snappy,
              delay: groupIndex * 0.05,
            }}
          >
            <button
              type="button"
              onClick={() => toggleCategory(group.id)}
              aria-expanded={expandedCategories.includes(group.id)}
              aria-controls={`category-${group.id}`}
              aria-label={`${group.name} elements, ${group.elements.length} available`}
              className="flex items-center gap-2 px-2 py-1.5 w-full text-left rounded-lg hover:bg-[var(--hivelab-surface-hover)] transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            >
              <motion.div
                animate={{ rotate: expandedCategories.includes(group.id) ? 90 : 0 }}
                transition={springPresets.snappy}
                className="text-[var(--hivelab-text-tertiary)]"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </motion.div>
              <motion.span
                className={cn('text-xs font-medium uppercase tracking-wider', group.color)}
                animate={{
                  color: expandedCategories.includes(group.id) ? undefined : undefined,
                }}
              >
                {group.name}
              </motion.span>
              <motion.span
                className="ml-auto text-xs text-[var(--hivelab-text-tertiary)] bg-[var(--hivelab-surface-hover)] px-1.5 py-0.5 rounded"
                animate={{
                  scale: expandedCategories.includes(group.id) ? 1 : 0.9,
                  opacity: expandedCategories.includes(group.id) ? 1 : 0.7,
                }}
              >
                {group.elements.length}
              </motion.span>
            </button>

            <AnimatePresence mode="wait">
              {expandedCategories.includes(group.id) && (
                <motion.div
                  id={`category-${group.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springPresets.gentle}
                  className="space-y-2 mt-2 overflow-hidden"
                  role="group"
                  aria-label={`${group.name} elements`}
                >
                  {group.elements.map((element, index) => (
                    <ElementCard
                      key={element.id}
                      element={element}
                      index={index}
                      onDragStart={() => onDragStart(element.id)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        <AnimatePresence>
          {filteredElements.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springPresets.gentle}
              className="text-center py-8"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MagnifyingGlassIcon className="h-8 w-8 text-[var(--hivelab-text-tertiary)] mx-auto mb-2" />
              </motion.div>
              <p className="text-sm text-[var(--hivelab-text-tertiary)]">No elements found</p>
              <p className="text-xs text-[var(--hivelab-text-tertiary)]">Try a different search</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[var(--hivelab-border)] text-xs text-[var(--hivelab-text-tertiary)]">
        Drag elements to canvas
      </div>
    </div>
  );
}
