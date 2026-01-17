'use client';

/**
 * CommandPalette - ⌘K Navigation
 * Source: docs/design-system/TEMPLATES.md (Shell Template - Command Palette)
 *
 * Migrated from: atomic/00-Global/organisms/command-palette.tsx
 * All hardcoded hex values replaced with CSS variables.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Design Philosophy:
 * - Primary navigation method (Raycast/Linear style)
 * - Centered modal with blur backdrop
 * - Fuzzy search with keyboard navigation
 * - White focus, gold for featured items ONLY
 *
 * Trigger: ⌘K (Mac) / Ctrl+K (Windows)
 *
 * VISUAL STRUCTURE:
 * ┌─────────────────────────────────────────────┐
 * │ 🔍 Search or type a command...    ⌘K  ✕   │
 * ├─────────────────────────────────────────────┤
 * │ SPACES                                      │
 * │  ┌──┐ Engineering Club      →              │
 * │  └──┘ 42 members                           │
 * │  ┌──┐ Design Systems                       │
 * │  └──┘ 28 members                           │
 * │                                            │
 * │ ACTIONS                                    │
 * │  ⚡ Create new tool         ⌘N  [gold]    │
 * │  ⚙ Settings                 ⌘,            │
 * ├─────────────────────────────────────────────┤
 * │ ↑↓ navigate  ↵ select  esc close          │
 * └─────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  category?: string;
  onSelect?: () => void;
  /** Featured items get gold treatment (sparingly!) */
  featured?: boolean;
}

export interface CommandPaletteProps {
  /** Whether the palette is open */
  open: boolean;
  /** Called when palette should close */
  onOpenChange: (open: boolean) => void;
  /** Items to display */
  items: CommandPaletteItem[];
  /** Placeholder text */
  placeholder?: string;
  /** Called when an item is selected */
  onSelect?: (item: CommandPaletteItem) => void;
  /** Called when search query changes */
  onSearch?: (query: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS class */
  className?: string;
}

// ============================================
// ICONS
// ============================================

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const CommandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const HashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BoltIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Default icons for categories
const categoryIcons: Record<string, React.ReactNode> = {
  spaces: <HashIcon className="h-4 w-4" />,
  events: <CalendarIcon className="h-4 w-4" />,
  people: <UsersIcon className="h-4 w-4" />,
  settings: <SettingsIcon className="h-4 w-4" />,
  ai: <BoltIcon className="h-4 w-4" />,
};

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * CommandPalette - ⌘K Navigation
 *
 * Raycast/Linear-style command palette with fuzzy search and keyboard navigation.
 * Uses CSS variables for all colors (no hardcoded hex).
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <CommandPalette
 *   open={open}
 *   onOpenChange={setOpen}
 *   items={[
 *     { id: '1', label: 'Go to Spaces', category: 'Navigation' },
 *     { id: '2', label: 'Create Tool', category: 'Actions', featured: true },
 *   ]}
 * />
 * ```
 */
export const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  (
    {
      open,
      onOpenChange,
      items,
      placeholder = 'Search or type a command...',
      onSelect,
      onSearch,
      loading = false,
      emptyMessage = 'No results found',
      className,
    },
    ref
  ) => {
    const [query, setQuery] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Filter items based on query
    const filteredItems = React.useMemo(() => {
      if (!query) return items;
      const lowerQuery = query.toLowerCase();
      return items.filter(
        (item) =>
          item.label.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.category?.toLowerCase().includes(lowerQuery)
      );
    }, [items, query]);

    // Group items by category
    const groupedItems = React.useMemo(() => {
      const groups: Record<string, CommandPaletteItem[]> = {};
      filteredItems.forEach((item) => {
        const category = item.category || 'General';
        if (!groups[category]) groups[category] = [];
        groups[category].push(item);
      });
      return groups;
    }, [filteredItems]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    const handleSelect = (item: CommandPaletteItem) => {
      item.onSelect?.();
      onSelect?.(item);
      onOpenChange(false);
      setQuery('');
    };

    // Focus input when opened
    React.useEffect(() => {
      if (open) {
        setQuery('');
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, [open]);

    // Scroll selected item into view
    React.useEffect(() => {
      const selectedElement = listRef.current?.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    // Keyboard shortcut listener
    React.useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          onOpenChange(!open);
        }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [open, onOpenChange]);

    return (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop - Apple/OpenAI frosted glass */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(12px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.5)',
              }}
              onClick={() => onOpenChange(false)}
            />

            {/* Palette */}
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                'fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2',
                className
              )}
              onKeyDown={handleKeyDown}
            >
              {/* Panel - frosted glass with premium shadow */}
              <div
                className="overflow-hidden rounded-xl border border-[var(--color-border)]/60"
                style={{
                  background: 'rgba(20, 20, 20, 0.85)',
                  backdropFilter: 'blur(24px) saturate(1.5)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                }}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
                  <SearchIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      onSearch?.(e.target.value);
                      setSelectedIndex(0);
                    }}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-[var(--color-text-primary)] text-sm tracking-[-0.01em] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <kbd className="flex h-5 items-center rounded border border-[var(--color-border)] bg-[var(--color-bg-page)] px-1.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                      <CommandIcon className="h-3 w-3" />
                    </kbd>
                    <kbd className="flex h-5 items-center rounded border border-[var(--color-border)] bg-[var(--color-bg-page)] px-1.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                      K
                    </kbd>
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Results */}
                <div
                  ref={listRef}
                  className="max-h-[400px] overflow-y-auto py-2 scrollbar-thin"
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-text-primary)]" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                      {emptyMessage}
                    </div>
                  ) : (
                    Object.entries(groupedItems).map(([category, categoryItems]) => (
                      <div key={category}>
                        <div className="px-4 py-2 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.08em]">
                          {category}
                        </div>
                        {categoryItems.map((item) => {
                          const globalIndex = filteredItems.indexOf(item);
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <button
                              key={item.id}
                              data-index={globalIndex}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-2.5 text-left',
                                'transition-all duration-150',
                                isSelected
                                  ? 'bg-[var(--color-bg-hover)]'
                                  : 'hover:bg-[var(--color-bg-hover)]/50'
                              )}
                              style={isSelected ? {
                                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
                              } : undefined}
                            >
                              {/* Icon */}
                              <div
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg',
                                  item.featured
                                    ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                                    : 'bg-[var(--color-bg-page)] text-[var(--color-text-muted)]'
                                )}
                              >
                                {item.icon ||
                                  categoryIcons[item.category?.toLowerCase() || ''] || (
                                    <HashIcon className="h-4 w-4" />
                                  )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  'text-sm font-medium truncate tracking-[-0.01em]',
                                  item.featured ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)]'
                                )}>
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-[var(--color-text-muted)] truncate tracking-normal">
                                    {item.description}
                                  </div>
                                )}
                              </div>

                              {/* Shortcut or arrow */}
                              {item.shortcut ? (
                                <div className="flex items-center gap-1">
                                  {item.shortcut.map((key, i) => (
                                    <kbd
                                      key={i}
                                      className="flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-bg-page)] px-1.5 text-[10px] font-medium text-[var(--color-text-muted)]"
                                    >
                                      {key}
                                    </kbd>
                                  ))}
                                </div>
                              ) : isSelected ? (
                                <ArrowRightIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg-page)] px-1 text-[10px]">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg-page)] px-1 text-[10px]">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg-page)] px-1 text-[10px]">esc</kbd>
                      close
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

CommandPalette.displayName = 'CommandPalette';

export default CommandPalette;
