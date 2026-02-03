'use client';

/**
 * Element Gallery Page
 *
 * Public page showcasing all 27 HiveLab elements.
 * Organized by tier (Universal, Connected, Space).
 * Users can explore what's possible before building tools.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SparklesIcon, ShieldCheckIcon, MagnifyingGlassIcon, ChevronRightIcon, WrenchIcon, TrophyIcon, Squares2X2Icon, LinkIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Grid3X3 = Squares2X2Icon;
const Plug = LinkIcon;
import { cn, Button } from '@hive/ui';

// Element data - simplified version of the full element system
const ELEMENTS = {
  universal: {
    title: 'Universal Elements',
    description: 'Available to everyone. No data connection required.',
    icon: Grid3X3,
    color: 'emerald',
    elements: [
      { id: 'search-input', name: 'MagnifyingGlassIcon Input', description: 'Text search with autocomplete' },
      { id: 'filter-selector', name: 'Filter Selector', description: 'Multi-select filter categories' },
      { id: 'result-list', name: 'Result List', description: 'Paginated list display' },
      { id: 'date-picker', name: 'Date Picker', description: 'Date and time selection' },
      { id: 'tag-cloud', name: 'Tag Cloud', description: 'Visual tag display' },
      { id: 'map-view', name: 'Map View', description: 'Geographic map display' },
      { id: 'chart-display', name: 'Chart Display', description: 'Data visualization (bar, line, pie)' },
      { id: 'form-builder', name: 'Form Builder', description: 'Dynamic form creation' },
      { id: 'countdown-timer', name: 'Countdown Timer', description: 'Timer with visual countdown' },
      { id: 'timer', name: 'Timer', description: 'Stopwatch and timer' },
      { id: 'counter', name: 'Counter', description: 'Increment/decrement counter' },
      { id: 'poll-element', name: 'Poll', description: 'Voting with real-time results' },
      { id: 'leaderboard', name: 'Leaderboard', description: 'Ranked standings display' },
      { id: 'notification-center', name: 'Notification Display', description: 'Notification center' },
    ],
  },
  connected: {
    title: 'Connected Elements',
    description: 'Pull data from campus events, spaces, and users.',
    icon: Plug,
    color: 'blue',
    elements: [
      { id: 'event-picker', name: 'Event Picker', description: 'Browse and select campus events' },
      { id: 'space-picker', name: 'Space Picker', description: 'Browse and select spaces' },
      { id: 'user-selector', name: 'User Selector', description: 'MagnifyingGlassIcon and select users' },
      { id: 'rsvp-button', name: 'RSVP Button', description: 'Event RSVP with capacity tracking' },
      { id: 'connection-list', name: 'Connection List', description: 'Show user connections' },
    ],
  },
  space: {
    title: 'Space Elements',
    description: 'Space leaders only. Access your space\'s private data.',
    icon: ShieldCheckIcon,
    color: 'amber',
    elements: [
      { id: 'member-list', name: 'Member List', description: 'Display space members' },
      { id: 'member-selector', name: 'Member Selector', description: 'Select from space members' },
      { id: 'space-events', name: 'Space Events', description: 'Show space\'s events' },
      { id: 'space-feed', name: 'Space Feed', description: 'Display space posts' },
      { id: 'space-stats', name: 'Space Stats', description: 'Engagement metrics' },
      { id: 'announcement', name: 'Announcement', description: 'Create announcements' },
      { id: 'role-gate', name: 'Role Gate', description: 'Show/hide by member role' },
    ],
  },
};

const TIER_COLORS: Record<string, string> = {
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
};

const TIER_TEXT_COLORS: Record<string, string> = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
};

export default function ElementGalleryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Filter elements based on search
  const filteredElements = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query && !selectedTier) return ELEMENTS;

    const filtered: typeof ELEMENTS = {} as typeof ELEMENTS;

    for (const [tier, data] of Object.entries(ELEMENTS)) {
      if (selectedTier && tier !== selectedTier) continue;

      const matchingElements = data.elements.filter(
        el =>
          el.name.toLowerCase().includes(query) ||
          el.description.toLowerCase().includes(query)
      );

      if (matchingElements.length > 0 || !query) {
        filtered[tier as keyof typeof ELEMENTS] = {
          ...data,
          elements: query ? matchingElements : data.elements,
        };
      }
    }

    return filtered;
  }, [searchQuery, selectedTier]);

  const totalElements = Object.values(ELEMENTS).reduce(
    (sum, tier) => sum + tier.elements.length,
    0
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.08] sticky top-0 bg-black/90 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)] flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold text-lg">HiveLab</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/lab">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <WrenchIcon className="w-4 h-4 mr-2" />
                  My Tools
                </Button>
              </Link>
              <Link href="/lab/create">
                <Button size="sm" className="bg-[var(--hive-gold-cta)] text-black hover:brightness-110">
                  Create Tool
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="text-[var(--hive-gold-cta)]">{totalElements}</span> Building Blocks
            </h1>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Drag, drop, and combine elements to create powerful tools for your space.
              No coding required.
            </p>
          </motion.div>

          {/* MagnifyingGlassIcon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 max-w-md mx-auto"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="MagnifyingGlassIcon elements..."
                className={cn(
                  'w-full pl-12 pr-4 py-3 rounded-xl',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'text-white placeholder:text-white/40',
                  'focus:outline-none focus:border-white/20',
                  'transition-colors'
                )}
              />
            </div>
          </motion.div>

          {/* Tier filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex items-center justify-center gap-2 flex-wrap"
          >
            <button
              onClick={() => setSelectedTier(null)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                !selectedTier
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              All
            </button>
            {Object.entries(ELEMENTS).map(([tier, data]) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier === selectedTier ? null : tier)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  selectedTier === tier
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <data.icon className="w-4 h-4" />
                {data.title.replace(' Elements', '')}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Element Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {Object.entries(filteredElements).map(([tier, data], tierIndex) => (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: tierIndex * 0.1 }}
                className="mb-12"
              >
                {/* Tier header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      `bg-gradient-to-br ${TIER_COLORS[data.color]}`
                    )}
                  >
                    <data.icon className={cn('w-5 h-5', TIER_TEXT_COLORS[data.color])} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{data.title}</h2>
                    <p className="text-sm text-white/50">{data.description}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm text-white/40">
                      {data.elements.length} element{data.elements.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Elements grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.elements.map((element, index) => (
                    <motion.div
                      key={element.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'group relative p-4 rounded-xl border transition-all duration-200',
                        'bg-white/[0.02] border-white/[0.08]',
                        'hover:bg-white/[0.04] hover:border-white/[0.12]',
                        'cursor-pointer'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white group-hover:text-[var(--hive-gold-cta)] transition-colors">
                            {element.name}
                          </h3>
                          <p className="text-sm text-white/50 mt-1">
                            {element.description}
                          </p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                      </div>

                      {/* Tier badge */}
                      {tier === 'space' && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <TrophyIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-amber-400">Leaders only</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {Object.keys(filteredElements).length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <MagnifyingGlassIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No elements match your search.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-[var(--hive-gold-cta)] hover:underline"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to build something?
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            Combine these elements to create custom tools for your space.
            AI helps you build faster.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/lab/create">
              <Button size="lg" className="bg-[var(--hive-gold-cta)] text-black hover:brightness-110">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Start Building
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="ghost" className="text-white/60 hover:text-white">
                Browse Templates
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-white/40">
            Part of <Link href="/" className="text-white/60 hover:text-white">HIVE</Link> — The operating system for campus communities
          </p>
        </div>
      </footer>
    </div>
  );
}
