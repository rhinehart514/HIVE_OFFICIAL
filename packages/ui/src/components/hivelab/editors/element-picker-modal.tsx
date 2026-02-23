'use client';

/**
 * ElementPickerModal — Grid of elements for Compose mode
 *
 * Shows available elements grouped by category.
 * Click to add (no drag-drop). Used by SimpleEditor's compose mode.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { springPresets } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import { FOCUS_RING } from '../tokens';
import type { UserContext } from '../../../lib/hivelab/element-system';

interface ElementDef {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'universal' | 'connected' | 'space';
}

// Focused element set — matches element-palette.tsx
const PICKER_ELEMENTS: ElementDef[] = [
  { id: 'search-input', name: 'Search Input', description: 'Text search with suggestions', category: 'input', tier: 'universal' },
  { id: 'form-builder', name: 'Form Builder', description: 'Collect structured data', category: 'input', tier: 'universal' },
  { id: 'date-picker', name: 'Date Picker', description: 'Select dates and times', category: 'input', tier: 'universal' },
  { id: 'result-list', name: 'Result List', description: 'Display filterable items', category: 'display', tier: 'universal' },
  { id: 'chart-display', name: 'Chart Display', description: 'Visualize poll/vote results', category: 'display', tier: 'universal' },
  { id: 'leaderboard', name: 'Leaderboard', description: 'Ranked scores & gamification', category: 'display', tier: 'universal' },
  { id: 'countdown-timer', name: 'Countdown', description: 'Count down to event', category: 'display', tier: 'universal' },
  { id: 'filter-selector', name: 'Filter Selector', description: 'Multi-select filters', category: 'filter', tier: 'universal' },
  { id: 'poll-element', name: 'Poll / Vote', description: 'Collect votes & decisions', category: 'action', tier: 'universal' },
  { id: 'counter', name: 'Counter', description: 'Track attendance & counts', category: 'action', tier: 'universal' },
  { id: 'timer', name: 'Timer', description: 'Stopwatch for sessions', category: 'action', tier: 'universal' },
  { id: 'event-picker', name: 'Event Picker', description: 'Browse campus events', category: 'input', tier: 'connected' },
  { id: 'space-picker', name: 'Space Picker', description: 'Browse campus spaces', category: 'input', tier: 'connected' },
  { id: 'user-selector', name: 'User Selector', description: 'Pick campus users', category: 'input', tier: 'connected' },
  { id: 'connection-list', name: 'Connection List', description: 'Display your connections', category: 'display', tier: 'connected' },
  { id: 'rsvp-button', name: 'RSVP Button', description: 'Event attendance', category: 'action', tier: 'connected' },
  { id: 'member-selector', name: 'Member Selector', description: 'Select space members', category: 'input', tier: 'space' },
  { id: 'member-list', name: 'Member List', description: 'Display space members', category: 'display', tier: 'space' },
  { id: 'space-events', name: 'Space Events', description: 'Your space events', category: 'display', tier: 'space' },
  { id: 'space-feed', name: 'Space Feed', description: 'Recent space posts', category: 'display', tier: 'space' },
  { id: 'space-stats', name: 'Space Stats', description: 'Space analytics', category: 'display', tier: 'space' },
  { id: 'announcement', name: 'Announcement', description: 'Post announcements', category: 'action', tier: 'space' },
  { id: 'role-gate', name: 'Role Gate', description: 'Restrict by role', category: 'layout', tier: 'space' },
];

const CATEGORIES = [
  { id: 'input', name: 'Input', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'display', name: 'Display', color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'filter', name: 'Filter', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'action', name: 'Action', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'layout', name: 'Layout', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

export interface ElementPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (elementId: string) => void;
  userContext?: UserContext;
}

export function ElementPickerModal({ open, onClose, onSelect, userContext }: ElementPickerModalProps) {
  const [search, setSearch] = useState('');

  const available = PICKER_ELEMENTS.filter((el) => {
    if (el.tier === 'space' && !userContext?.isSpaceLeader) return false;
    if (search) {
      const q = search.toLowerCase();
      return el.name.toLowerCase().includes(q) || el.description.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    elements: available.filter((el) => el.category === cat.id),
  })).filter((g) => g.elements.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springPresets.snappy}
            className="fixed inset-x-4 top-[10%] bottom-[10%] z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--hivelab-panel)] shadow-2xl md:inset-x-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Add Element</h2>
              <button
                type="button"
                onClick={onClose}
                className={cn('rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors', FOCUS_RING)}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-white/[0.06] px-5 py-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search elements..."
                  autoFocus
                  className={cn(
                    'w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none',
                    FOCUS_RING
                  )}
                />
              </div>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto p-5 space-y-6" style={{ maxHeight: 'calc(100% - 120px)' }}>
              {grouped.map((group) => (
                <div key={group.id}>
                  <h3 className={cn('text-[11px] font-mono uppercase tracking-[0.14em] mb-3', group.color)}>
                    {group.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {group.elements.map((el, i) => (
                      <motion.button
                        key={el.id}
                        type="button"
                        onClick={() => {
                          onSelect(el.id);
                          onClose();
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, ...springPresets.snappy }}
                        whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'flex flex-col items-start gap-1 rounded-xl border border-white/[0.06] p-3 text-left transition-colors',
                          FOCUS_RING
                        )}
                      >
                        <span className="text-sm font-medium text-white">{el.name}</span>
                        <span className="text-xs text-white/40 line-clamp-1">{el.description}</span>
                        {el.tier !== 'universal' && (
                          <span className={cn(
                            'mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded',
                            el.tier === 'connected'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          )}>
                            {el.tier === 'connected' ? 'Auth' : 'Space'}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}

              {available.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-white/40">No elements found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
