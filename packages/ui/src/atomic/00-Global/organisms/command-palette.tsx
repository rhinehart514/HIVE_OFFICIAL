/**
 * CommandPalette - ⌘K Navigation
 *
 * Design Philosophy:
 * - Primary navigation method (Raycast/Linear style)
 * - Centered modal with blur backdrop
 * - Fuzzy search with keyboard navigation
 * - White focus, gold for featured items
 *
 * Trigger: ⌘K (Mac) / Ctrl+K (Windows)
 */
'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  ArrowRight,
  Hash,
  Calendar,
  Users,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import * as React from "react";

import { cn } from "../../../lib/utils";

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  category?: string;
  onSelect?: () => void;
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
}

// Default icons for categories
const categoryIcons: Record<string, React.ReactNode> = {
  spaces: <Hash className="h-4 w-4" />,
  events: <Calendar className="h-4 w-4" />,
  people: <Users className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  ai: <Sparkles className="h-4 w-4" />,
};

const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  (
    {
      open,
      onOpenChange,
      items,
      placeholder = "Search or type a command...",
      onSelect,
      onSearch,
      loading = false,
      emptyMessage = "No results found",
    },
    ref
  ) => {
    const [query, setQuery] = React.useState("");
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
        const category = item.category || "General";
        if (!groups[category]) groups[category] = [];
        groups[category].push(item);
      });
      return groups;
    }, [filteredItems]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    const handleSelect = (item: CommandPaletteItem) => {
      item.onSelect?.();
      onSelect?.(item);
      onOpenChange(false);
      setQuery("");
    };

    // Focus input when opened
    React.useEffect(() => {
      if (open) {
        setQuery("");
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, [open]);

    // Scroll selected item into view
    React.useEffect(() => {
      const selectedElement = listRef.current?.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    // Keyboard shortcut listener
    React.useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          onOpenChange(!open);
        }
      };
      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [open, onOpenChange]);

    return (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />

            {/* Palette */}
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
              onKeyDown={handleKeyDown}
            >
              <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-[#2A2A2A] px-4 py-3">
                  <Search className="h-5 w-5 text-[#818187]" />
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
                    className="flex-1 bg-transparent text-[#FAFAFA] text-sm placeholder:text-[#71717A] focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <kbd className="flex h-5 items-center rounded border border-[#2A2A2A] bg-[#1A1A1A] px-1.5 text-[10px] font-medium text-[#818187]">
                      <Command className="h-3 w-3" />
                    </kbd>
                    <kbd className="flex h-5 items-center rounded border border-[#2A2A2A] bg-[#1A1A1A] px-1.5 text-[10px] font-medium text-[#818187]">
                      K
                    </kbd>
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-1 text-[#818187] hover:bg-white/[0.04] hover:text-[#FAFAFA] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Results */}
                <div
                  ref={listRef}
                  className="max-h-[400px] overflow-y-auto py-2 scrollbar-thin"
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2A2A2A] border-t-[#FAFAFA]" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#818187]">
                      {emptyMessage}
                    </div>
                  ) : (
                    Object.entries(groupedItems).map(([category, categoryItems]) => (
                      <div key={category}>
                        <div className="px-4 py-2 text-xs font-medium text-[#818187] uppercase tracking-wider">
                          {category}
                        </div>
                        {categoryItems.map((item, index) => {
                          const globalIndex = filteredItems.indexOf(item);
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <button
                              key={item.id}
                              data-index={globalIndex}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                isSelected
                                  ? "bg-white/[0.06]"
                                  : "hover:bg-white/[0.04]"
                              )}
                            >
                              {/* Icon */}
                              <div
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-lg",
                                  item.featured
                                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                                    : "bg-[#1A1A1A] text-[#818187]"
                                )}
                              >
                                {item.icon ||
                                  categoryIcons[item.category?.toLowerCase() || ""] || (
                                    <Hash className="h-4 w-4" />
                                  )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "text-sm font-medium truncate",
                                  item.featured ? "text-[#FFD700]" : "text-[#FAFAFA]"
                                )}>
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-[#818187] truncate">
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
                                      className="flex h-5 min-w-[20px] items-center justify-center rounded border border-[#2A2A2A] bg-[#1A1A1A] px-1.5 text-[10px] font-medium text-[#818187]"
                                    >
                                      {key}
                                    </kbd>
                                  ))}
                                </div>
                              ) : isSelected ? (
                                <ArrowRight className="h-4 w-4 text-[#818187]" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between border-t border-[#2A2A2A] px-4 py-2 text-xs text-[#818187]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[#2A2A2A] bg-[#1A1A1A] px-1 text-[10px]">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[#2A2A2A] bg-[#1A1A1A] px-1 text-[10px]">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-[#2A2A2A] bg-[#1A1A1A] px-1 text-[10px]">esc</kbd>
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
CommandPalette.displayName = "CommandPalette";

export { CommandPalette };
