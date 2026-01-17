'use client';

/**
 * CommandBar — ⌘K Command Palette (LOCKED 2026-01-11)
 *
 * Linear/Raycast/VS Code style command palette for keyboard-first navigation.
 *
 * LOCKED DECISIONS:
 * 1. Container: Full Modal with backdrop blur (560px, centered)
 * 2. Search Input: Integrated (⌘ icon left, ESC hint right)
 * 3. Result Grouping: Smart Groups (type headers only when 2+ results)
 * 4. Keyboard Hints: Contextual Footer (navigation hints + close)
 */

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Label } from '../primitives/Label';
import { Mono } from '../primitives/Mono';
import { SimpleAvatar, getInitials } from '../primitives/Avatar';
import { PresenceDot } from '../primitives/PresenceDot';

// ============================================
// TYPES
// ============================================

export type CommandBarResultType = 'space' | 'person' | 'tool' | 'action' | 'page';

// Legacy type aliases for backwards compatibility
/** @deprecated Use CommandBarResult instead */
export interface CommandBarUser {
  name?: string;
  handle?: string;
  avatarUrl?: string;
}

/** @deprecated Use CommandBarResult instead */
export interface CommandBarNotification {
  id: string;
  text: string;
  time: string;
  unread?: boolean;
}

export interface CommandBarResult {
  id: string;
  type: CommandBarResultType;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  avatarUrl?: string;
  avatarFallback?: string;
  isOnline?: boolean;
  shortcut?: string;
  onSelect?: () => void;
}

export interface CommandBarProps {
  /** Whether the command bar is open */
  isOpen: boolean;
  /** Called when the command bar should close */
  onClose: () => void;
  /** Current search query */
  query: string;
  /** Called when search query changes */
  onQueryChange: (query: string) => void;
  /** Search results grouped by type */
  results: CommandBarResult[];
  /** Index of currently highlighted result */
  highlightedIndex: number;
  /** Called when highlighted index changes */
  onHighlightChange: (index: number) => void;
  /** Called when a result is selected */
  onSelect: (result: CommandBarResult) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Recent searches (shown when query is empty) */
  recentSearches?: CommandBarResult[];
  /** Custom className for the modal */
  className?: string;
}

// ============================================
// ICONS
// ============================================

const SpaceIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const ToolIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>
);

const PageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ActionIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

// ============================================
// HELPERS
// ============================================

const typeLabels: Record<CommandBarResultType, string> = {
  space: 'Spaces',
  person: 'People',
  tool: 'Tools',
  action: 'Actions',
  page: 'Pages',
};

const typeIcons: Record<CommandBarResultType, React.ReactNode> = {
  space: <SpaceIcon className="w-4 h-4" />,
  person: null, // Uses avatar
  tool: <ToolIcon className="w-4 h-4" />,
  action: <ActionIcon className="w-4 h-4" />,
  page: <PageIcon className="w-4 h-4" />,
};

function groupResults(results: CommandBarResult[]): Map<CommandBarResultType, CommandBarResult[]> {
  const groups = new Map<CommandBarResultType, CommandBarResult[]>();

  for (const result of results) {
    const existing = groups.get(result.type) || [];
    existing.push(result);
    groups.set(result.type, existing);
  }

  return groups;
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ResultRowProps {
  result: CommandBarResult;
  isHighlighted: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

function ResultRow({ result, isHighlighted, onSelect, onMouseEnter }: ResultRowProps) {
  const showAvatar = result.type === 'person' || result.avatarUrl;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'transition-colors duration-100',
        'text-left',
        isHighlighted
          ? 'bg-white/[0.08]'
          : 'hover:bg-white/[0.04]'
      )}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0">
        {showAvatar ? (
          <div className="relative">
            <SimpleAvatar
              fallback={getInitials(result.avatarFallback || result.title)}
              src={result.avatarUrl}
              size="sm"
            />
            {result.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5">
                <PresenceDot status="online" size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'bg-white/[0.06] text-white/60'
          )}>
            {result.icon || typeIcons[result.type]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Text size="sm" className="text-white truncate">
          {result.title}
        </Text>
        {result.subtitle && (
          <Text size="xs" tone="muted" className="truncate">
            {result.subtitle}
          </Text>
        )}
      </div>

      {/* Shortcut */}
      {result.shortcut && (
        <Mono size="xs" className="text-white/30 flex-shrink-0">
          {result.shortcut}
        </Mono>
      )}
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CommandBar({
  isOpen,
  onClose,
  query,
  onQueryChange,
  results,
  highlightedIndex,
  onHighlightChange,
  onSelect,
  placeholder = 'Search spaces, people, tools...',
  isLoading = false,
  recentSearches = [],
  className,
}: CommandBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onHighlightChange(Math.min(highlightedIndex + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onHighlightChange(Math.max(highlightedIndex - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[highlightedIndex]) {
            onSelect(results[highlightedIndex]);
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
  }, [isOpen, highlightedIndex, results, onHighlightChange, onSelect, onClose]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Group results for smart headers
  const groupedResults = React.useMemo(() => groupResults(results), [results]);
  const displayResults = query ? results : recentSearches;
  const showGroups = query && results.length > 0;

  // Track flat index for highlighting
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* LOCKED: Backdrop - bg-black/60 backdrop-blur-md */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* LOCKED: Container - 560px, centered, top third */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed z-50',
              'left-1/2 top-[20%] -translate-x-1/2',
              'w-full max-w-[560px] mx-4',
              className
            )}
          >
            <Card
              elevation="floating"
              noPadding
              className="overflow-hidden"
            >
              {/* LOCKED: Search Input - ⌘ icon left, ESC hint right */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                {/* ⌘ Icon */}
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  'bg-white/[0.08] text-white/50'
                )}>
                  <Mono size="sm">⌘</Mono>
                </div>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    'flex-1 bg-transparent border-none outline-none',
                    'text-white placeholder:text-white/30',
                    'text-[15px]'
                  )}
                />

                {/* ESC Hint */}
                <Mono size="xs" className="text-white/30 flex-shrink-0">
                  ESC
                </Mono>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[400px] overflow-y-auto p-2"
                role="listbox"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  </div>
                ) : displayResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <SearchIcon className="w-8 h-8 text-white/20 mb-2" />
                    <Text size="sm" tone="muted">
                      {query ? 'No results found' : 'Start typing to search...'}
                    </Text>
                  </div>
                ) : showGroups ? (
                  // LOCKED: Smart Groups - headers only when 2+ results per category
                  Array.from(groupedResults.entries()).map(([type, items]) => {
                    const showHeader = items.length >= 2;

                    return (
                      <div key={type} className="mb-2 last:mb-0">
                        {showHeader && (
                          <div className="flex items-center justify-between px-3 py-1.5">
                            <Label size="sm" className="uppercase tracking-wider text-white/40">
                              {typeLabels[type]}
                            </Label>
                            <Text size="xs" tone="muted">
                              {items.length}
                            </Text>
                          </div>
                        )}
                        {items.map((result) => {
                          flatIndex++;
                          const currentIndex = flatIndex;
                          return (
                            <div key={result.id} role="option" aria-selected={highlightedIndex === currentIndex}>
                              <ResultRow
                                result={result}
                                isHighlighted={highlightedIndex === currentIndex}
                                onSelect={() => onSelect(result)}
                                onMouseEnter={() => onHighlightChange(currentIndex)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  // Flat list (recent searches or single results)
                  displayResults.map((result) => {
                    flatIndex++;
                    const currentIndex = flatIndex;
                    return (
                      <div key={result.id} role="option" aria-selected={highlightedIndex === currentIndex}>
                        <ResultRow
                          result={result}
                          isHighlighted={highlightedIndex === currentIndex}
                          onSelect={() => onSelect(result)}
                          onMouseEnter={() => onHighlightChange(currentIndex)}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* LOCKED: Contextual Footer - keyboard hints */}
              <div className={cn(
                'flex items-center justify-between gap-4 px-4 py-2.5',
                'bg-white/[0.02] border-t border-white/[0.06]'
              )}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Mono size="xs" className="text-white/40">↑↓</Mono>
                    <Text size="xs" tone="muted">navigate</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mono size="xs" className="text-white/40">↵</Mono>
                    <Text size="xs" tone="muted">select</Text>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mono size="xs" className="text-white/40">esc</Mono>
                  <Text size="xs" tone="muted">close</Text>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// HOOK: useCommandBar
// ============================================

export interface UseCommandBarOptions {
  /** Search function */
  onSearch?: (query: string) => Promise<CommandBarResult[]>;
  /** Debounce delay in ms */
  debounce?: number;
  /** Called when a result is selected */
  onSelect?: (result: CommandBarResult) => void;
}

export function useCommandBar(options: UseCommandBarOptions = {}) {
  const { onSearch, debounce = 150, onSelect } = options;

  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<CommandBarResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle ⌘K shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!onSearch || !query) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const searchResults = await onSearch(query);
        setResults(searchResults);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounce);

    return () => clearTimeout(timeout);
  }, [query, onSearch, debounce]);

  // Reset state when closed
  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setHighlightedIndex(0);
  }, []);

  // Handle selection
  const handleSelect = React.useCallback((result: CommandBarResult) => {
    result.onSelect?.();
    onSelect?.(result);
    handleClose();
  }, [onSelect, handleClose]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    highlightedIndex,
    setHighlightedIndex,
    isLoading,
    close: handleClose,
    select: handleSelect,
    props: {
      isOpen,
      onClose: handleClose,
      query,
      onQueryChange: setQuery,
      results,
      highlightedIndex,
      onHighlightChange: setHighlightedIndex,
      onSelect: handleSelect,
      isLoading,
    },
  };
}

export default CommandBar;
