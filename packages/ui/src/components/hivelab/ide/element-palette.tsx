'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Search,
  FormInput,
  BarChart3,
  Filter,
  Calendar,
  Users,
  ListChecks,
  Timer,
  Trophy,
  Vote,
  PieChart,
  CalendarDays,
  Building,
  UserPlus,
  Network,
  UsersRound,
  UserCheck,
  CalendarRange,
  Newspaper,
  TrendingUp,
  Megaphone,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { springPresets, staggerPresets } from '@hive/tokens';
import { ShineBorder } from '../../motion-primitives/shine-border';
import { GlowEffect } from '../../motion-primitives/glow-effect';

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
}

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
    icon: <Search className="h-4 w-4" />,
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
    icon: <Calendar className="h-4 w-4" />,
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
    icon: <PieChart className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Ranked scores & gamification',
    icon: <Trophy className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },
  {
    id: 'countdown-timer',
    name: 'Countdown',
    description: 'Count down to event',
    icon: <Timer className="h-4 w-4" />,
    category: 'display',
    tier: 'universal',
  },

  // Filter (1)
  {
    id: 'filter-selector',
    name: 'Filter Selector',
    description: 'Multi-select filters',
    icon: <Filter className="h-4 w-4" />,
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
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'action',
    tier: 'universal',
  },
  {
    id: 'timer',
    name: 'Timer',
    description: 'Stopwatch for sessions',
    icon: <Timer className="h-4 w-4" />,
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
    icon: <CalendarDays className="h-4 w-4" />,
    category: 'input',
    tier: 'connected',
  },
  {
    id: 'space-picker',
    name: 'Space Picker',
    description: 'Browse campus spaces',
    icon: <Building className="h-4 w-4" />,
    category: 'input',
    tier: 'connected',
  },
  {
    id: 'user-selector',
    name: 'User Selector',
    description: 'Pick campus users',
    icon: <Users className="h-4 w-4" />,
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
    icon: <UserPlus className="h-4 w-4" />,
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
    icon: <UserCheck className="h-4 w-4" />,
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
    icon: <TrendingUp className="h-4 w-4" />,
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
    icon: <Shield className="h-4 w-4" />,
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
    onDragStart();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  // Premium shine colors based on tier
  const shineColors = isPremiumTier
    ? ['#A855F7', '#EC4899'] // Purple-pink for space tier
    : ['#3B82F6', '#06B6D4']; // Blue-cyan for connected tier

  return (
    <motion.div
      draggable
      // Native HTML5 drag handlers - use any cast to avoid Framer Motion type conflict
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragStart={handleDragStart as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragEnd={handleDragEnd as any}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isDragging ? 0.95 : 1,
        rotate: isDragging ? 2 : 0,
      }}
      exit={{ opacity: 0, x: -10 }}
      transition={{
        ...springPresets.snappy,
        delay: prefersReducedMotion ? 0 : index * staggerPresets.fast,
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        boxShadow: isPremiumTier
          ? '0 4px 20px rgba(168, 85, 247, 0.2)'
          : isConnectedTier
            ? '0 4px 16px rgba(59, 130, 246, 0.15)'
            : '0 4px 12px rgba(0,0,0,0.3)',
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative p-3 bg-[#1a1a1a] border border-[#333] rounded-xl cursor-grab active:cursor-grabbing transition-colors group overflow-hidden',
        isDragging && 'border-[#FFD700]/50 shadow-lg',
        isPremiumTier && 'border-purple-500/30',
        isConnectedTier && 'border-blue-500/20'
      )}
    >
      {/* Premium shine border effect on hover */}
      {(isPremiumTier || isConnectedTier) && isHovered && !prefersReducedMotion && (
        <ShineBorder
          shineColor={shineColors}
          duration={6}
          borderWidth={1}
        />
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Icon with optional glow for premium tier */}
        {isPremiumTier && !prefersReducedMotion ? (
          <GlowEffect
            color="#A855F7"
            size="sm"
            mode="breathe"
            blur="soft"
            active={isHovered}
          >
            <motion.div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                category?.bg,
                category?.color
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={springPresets.bouncy}
            >
              {element.icon}
            </motion.div>
          </GlowEffect>
        ) : (
          <motion.div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              category?.bg,
              category?.color
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springPresets.bouncy}
          >
            {element.icon}
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{element.name}</p>
            {element.tier !== 'universal' && (
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
          <p className="text-xs text-[#888] truncate group-hover:text-[#aaa] transition-colors">
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

  // Filter elements by user context - space-tier requires isSpaceLeader
  const availableElements = ELEMENTS.filter((el) => {
    if (el.tier === 'universal') return true;
    if (el.tier === 'connected') return true;
    if (el.tier === 'space') return userContext?.isSpaceLeader === true;
    return false;
  });

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
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white mb-2">Elements</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements..."
            className="w-full bg-[#252525] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#444]"
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
              className="flex items-center gap-2 px-2 py-1.5 w-full text-left rounded-lg hover:bg-[#252525] transition-colors"
            >
              <motion.div
                animate={{ rotate: expandedCategories.includes(group.id) ? 90 : 0 }}
                transition={springPresets.snappy}
                className="text-[#666]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
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
                className="ml-auto text-xs text-[#555] bg-[#252525] px-1.5 py-0.5 rounded"
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springPresets.gentle}
                  className="space-y-2 mt-2 overflow-hidden"
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
                <Search className="h-8 w-8 text-[#444] mx-auto mb-2" />
              </motion.div>
              <p className="text-sm text-[#666]">No elements found</p>
              <p className="text-xs text-[#555]">Try a different search</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#333] text-xs text-[#666]">
        Drag elements to canvas
      </div>
    </div>
  );
}
