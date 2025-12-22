'use client';

/**
 * CommandAutocomplete - Dropdown for slash command suggestions
 *
 * Shows available commands as user types "/" in chat input.
 * Supports keyboard navigation (arrow keys, enter, escape).
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Timer,
  CalendarCheck,
  Megaphone,
  Command,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Icon mapping for commands
const COMMAND_ICONS: Record<string, React.ElementType> = {
  BarChart3,
  Timer,
  CalendarCheck,
  Megaphone,
};

export interface CommandSuggestion {
  name: string;
  description: string;
  syntax: string;
  icon: string;
  requiredRole: 'member' | 'leader';
}

export interface CommandAutocompleteProps {
  /** List of matching commands to display */
  suggestions: CommandSuggestion[];
  /** Currently selected index */
  selectedIndex: number;
  /** Callback when a command is selected */
  onSelect: (command: CommandSuggestion) => void;
  /** Callback when selection changes via keyboard */
  onSelectionChange: (index: number) => void;
  /** Whether the autocomplete is visible */
  visible: boolean;
  /** The current partial command being typed */
  query: string;
  /** User's role in the space */
  userRole?: 'member' | 'leader' | 'owner';
}

/**
 * CommandAutocomplete Component
 *
 * Renders a floating dropdown above the chat input showing
 * available slash commands that match the current input.
 */
export function CommandAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
  onSelectionChange,
  visible,
  query,
  userRole = 'member',
}: CommandAutocompleteProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Filter out commands user can't use
  const availableSuggestions = suggestions.filter(cmd => {
    if (cmd.requiredRole === 'leader') {
      return userRole === 'leader' || userRole === 'owner';
    }
    return true;
  });

  if (!visible || availableSuggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'absolute bottom-full left-0 right-0 mb-2 z-50',
          'bg-gray-900/98 backdrop-blur-xl',
          'border border-white/[0.08] rounded-xl',
          'shadow-2xl shadow-black/40',
          'overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
          <Command className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/50">
            {query ? `Commands matching "/${query}"` : 'Available commands'}
          </span>
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          className="max-h-[280px] overflow-y-auto py-1"
          role="listbox"
          aria-label="Slash commands"
        >
          {availableSuggestions.map((command, index) => {
            const IconComponent = COMMAND_ICONS[command.icon] || Command;
            const isSelected = index === selectedIndex;
            const isLeaderOnly = command.requiredRole === 'leader';

            return (
              <button
                key={command.name}
                onClick={() => onSelect(command)}
                onMouseEnter={() => onSelectionChange(index)}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'w-full px-3 py-2.5 flex items-start gap-3',
                  'text-left transition-colors duration-100',
                  isSelected
                    ? 'bg-white/[0.08]'
                    : 'hover:bg-white/[0.04]'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    'transition-colors duration-100',
                    isSelected
                      ? 'bg-[var(--hive-gold-cta)]/20 text-[var(--hive-gold-cta)]'
                      : 'bg-white/[0.06] text-white/60'
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      /{command.name}
                    </span>
                    {isLeaderOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-white/50">
                        Leaders
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 truncate mt-0.5">
                    {command.description}
                  </p>
                  <code className="text-xs text-white/30 mt-1 block font-mono">
                    {command.syntax}
                  </code>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="text-xs text-white/40 self-center shrink-0">
                    Enter ↵
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded text-[10px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded text-[10px]">Esc</kbd>
              Cancel
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandAutocomplete;
