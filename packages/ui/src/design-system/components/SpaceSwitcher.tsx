'use client';

/**
 * Space Switcher — Spotlight-style Space Navigation
 *
 * A fast, keyboard-navigable modal for jumping between spaces.
 * Inspired by macOS Spotlight and VS Code Command Palette.
 *
 * Features:
 * - Instant fuzzy search
 * - Pinned + Recent sections
 * - Live presence indicators
 * - Keyboard navigation (↑↓ to navigate, ↵ to open, ESC to close)
 * - Create Space action
 *
 * Part of the Shell design system.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export interface SpaceSwitcherSpace {
  id: string;
  name: string;
  memberCount: number;
  activeNow?: number;
  isPinned?: boolean;
  lastVisited?: string;
  category?: string;
  iconUrl?: string;
}

export interface SpaceSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  spaces?: SpaceSwitcherSpace[];
  onSelectSpace?: (space: SpaceSwitcherSpace) => void;
  onCreateSpace?: () => void;
  /** Placeholder text for the search input */
  placeholder?: string;
}

// ============================================
// ICONS
// ============================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-3 h-3', className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 4v4l2.29 2.29-3.28 3.28L12 10.59 9.01 13.57l3.29 3.28-2.29 2.29h-4v-4l5.66-5.66L8.39 6.19 6.1 8.49V4h10z" />
    </svg>
  );
}

// Noise texture overlay for material feel
function NoiseTexture({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-inherit"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity,
      }}
    />
  );
}

// ============================================
// SPACE ROW COMPONENT
// ============================================

function SpaceRow({
  space,
  onClick,
  isSelected,
}: {
  space: SpaceSwitcherSpace;
  onClick: () => void;
  isSelected?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group',
        isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
      )}
      whileHover={{ x: 2 }}
    >
      {/* Avatar */}
      {space.iconUrl ? (
        <img
          src={space.iconUrl}
          alt={space.name}
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/60 font-medium text-sm flex-shrink-0">
          {space.name.charAt(0)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{space.name}</span>
          {space.isPinned && (
            <PinIcon className="text-[var(--life-gold)]/60 flex-shrink-0" />
          )}
        </div>
        <div className="text-[11px] text-white/40">
          {space.memberCount} members
          {space.lastVisited && ` · ${space.lastVisited}`}
        </div>
      </div>

      {/* Presence indicator */}
      {space.activeNow && space.activeNow > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">{space.activeNow}</span>
        </div>
      )}

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SpaceSwitcher({
  isOpen,
  onClose,
  spaces = [],
  onSelectSpace,
  onCreateSpace,
  placeholder = 'Jump to a space...',
}: SpaceSwitcherProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Reset state when opened
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter spaces
  const filteredSpaces = React.useMemo(() => {
    if (!searchQuery.trim()) return spaces;
    const query = searchQuery.toLowerCase();
    return spaces.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
    );
  }, [searchQuery, spaces]);

  const pinnedSpaces = filteredSpaces.filter((s) => s.isPinned);
  const recentSpaces = filteredSpaces.filter((s) => !s.isPinned);
  const allFilteredSpaces = [...pinnedSpaces, ...recentSpaces];

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allFilteredSpaces.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allFilteredSpaces[selectedIndex]) {
            onSelectSpace?.(allFilteredSpaces[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allFilteredSpaces, onSelectSpace, onClose]);

  // Reset selection when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Switcher panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg mx-4"
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)',
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.08),
                  0 25px 50px -12px rgba(0,0,0,0.5),
                  0 0 80px rgba(255,215,0,0.05)
                `,
              }}
            >
              <NoiseTexture opacity={0.02} />

              {/* Search input */}
              <div className="relative p-4 border-b border-white/[0.06]">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] text-white/30 font-medium">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Space list */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {/* Pinned section */}
                {pinnedSpaces.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-[10px] text-white/30 uppercase tracking-wider font-medium">
                      Pinned
                    </div>
                    {pinnedSpaces.map((space, index) => (
                      <SpaceRow
                        key={space.id}
                        space={space}
                        isSelected={selectedIndex === index}
                        onClick={() => {
                          onSelectSpace?.(space);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Recent section */}
                {recentSpaces.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[10px] text-white/30 uppercase tracking-wider font-medium">
                      Recent
                    </div>
                    {recentSpaces.map((space, index) => (
                      <SpaceRow
                        key={space.id}
                        space={space}
                        isSelected={selectedIndex === pinnedSpaces.length + index}
                        onClick={() => {
                          onSelectSpace?.(space);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {allFilteredSpaces.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-white/40 text-sm">
                      {spaces.length === 0 ? 'No spaces yet' : 'No spaces found'}
                    </p>
                    {spaces.length === 0 && onCreateSpace && (
                      <button
                        onClick={() => {
                          onCreateSpace();
                          onClose();
                        }}
                        className="mt-2 text-[var(--life-gold)] text-sm hover:underline"
                      >
                        Create your first space
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="p-3 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] text-white/30">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white/[0.05]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white/[0.05]">↵</kbd>
                    Open
                  </span>
                </div>

                {onCreateSpace && (
                  <motion.button
                    onClick={() => {
                      onCreateSpace();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--life-gold)]/10 text-[var(--life-gold)] text-sm font-medium hover:bg-[var(--life-gold)]/20 transition-colors"
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ opacity: 0.8 }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Space
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SpaceSwitcher;
