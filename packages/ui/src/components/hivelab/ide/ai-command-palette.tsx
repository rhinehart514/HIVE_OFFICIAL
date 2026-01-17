'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, MagnifyingGlassIcon, Squares2X2Icon, TrashIcon, ClipboardDocumentIcon, BoltIcon, ChatBubbleLeftIcon, ArrowRightIcon, ArrowPathIcon, PlusCircleIcon, SwatchIcon, CommandLineIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const PlusCircle = PlusCircleIcon;
const Palette = SwatchIcon;
const Command = CommandLineIcon;
import { cn } from '../../../lib/utils';
import { ideClasses } from '@hive/tokens';

interface AICommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, type: CommandType) => Promise<void>;
  loading?: boolean;
  streamingText?: string;
  /** Number of selected elements - affects available commands (Cursor-like) */
  selectedCount?: number;
}

type CommandType = 'generate' | 'modify' | 'add' | 'explain' | 'action';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: CommandType;
  prefix?: string;
  /** Show only when selection count matches */
  selectionMode?: 'none' | 'single' | 'multi' | 'any';
}

// Commands that appear when NO elements are selected
const NO_SELECTION_COMMANDS: Command[] = [
  {
    id: 'generate',
    label: 'Generate Tool',
    description: 'Create a new tool from scratch',
    icon: <SparklesIcon className="h-4 w-4" />,
    type: 'generate',
    prefix: 'Create a tool that...',
    selectionMode: 'none',
  },
  {
    id: 'add-element',
    label: 'Add Element',
    description: 'Add a specific element to canvas',
    icon: <PlusCircle className="h-4 w-4" />,
    type: 'add',
    prefix: 'Add a...',
    selectionMode: 'none',
  },
];

// Commands that appear when ONE element is selected
const SINGLE_SELECTION_COMMANDS: Command[] = [
  {
    id: 'modify-single',
    label: 'Modify Element',
    description: 'Change the selected element',
    icon: <Palette className="h-4 w-4" />,
    type: 'modify',
    prefix: 'Make this element...',
    selectionMode: 'single',
  },
  {
    id: 'duplicate-variation',
    label: 'Create Variation',
    description: 'Duplicate with changes',
    icon: <ClipboardDocumentIcon className="h-4 w-4" />,
    type: 'modify',
    prefix: 'Create a variation that...',
    selectionMode: 'single',
  },
  {
    id: 'connect-single',
    label: 'Connect To...',
    description: 'Link this element to another',
    icon: <BoltIcon className="h-4 w-4" />,
    type: 'action',
    prefix: 'Connect this to...',
    selectionMode: 'single',
  },
];

// Commands that appear when MULTIPLE elements are selected
const MULTI_SELECTION_COMMANDS: Command[] = [
  {
    id: 'modify-batch',
    label: 'Modify All Selected',
    description: 'Change all selected elements',
    icon: <Palette className="h-4 w-4" />,
    type: 'modify',
    prefix: 'Make all selected...',
    selectionMode: 'multi',
  },
  {
    id: 'group',
    label: 'Group Elements',
    description: 'Create a group from selection',
    icon: <Squares2X2Icon className="h-4 w-4" />,
    type: 'action',
    prefix: 'Group these as...',
    selectionMode: 'multi',
  },
  {
    id: 'align',
    label: 'Align & Distribute',
    description: 'Arrange selected elements',
    icon: <Squares2X2Icon className="h-4 w-4" />,
    type: 'action',
    prefix: 'Align...',
    selectionMode: 'multi',
  },
];

// Commands available regardless of selection
const UNIVERSAL_COMMANDS: Command[] = [
  {
    id: 'layout',
    label: 'Arrange Layout',
    description: 'Reorganize elements',
    icon: <Squares2X2Icon className="h-4 w-4" />,
    type: 'action',
    prefix: 'Arrange elements...',
    selectionMode: 'any',
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Get help understanding',
    icon: <ChatBubbleLeftIcon className="h-4 w-4" />,
    type: 'explain',
    prefix: 'Explain how...',
    selectionMode: 'any',
  },
];

// Get commands based on selection count (Cursor-like behavior)
function getCommandsForSelection(selectedCount: number): Command[] {
  if (selectedCount === 0) {
    return [...NO_SELECTION_COMMANDS, ...UNIVERSAL_COMMANDS];
  }
  if (selectedCount === 1) {
    return [...SINGLE_SELECTION_COMMANDS, ...UNIVERSAL_COMMANDS];
  }
  return [...MULTI_SELECTION_COMMANDS, ...UNIVERSAL_COMMANDS];
}

const SUGGESTIONS = [
  'Create a poll for voting on event dates',
  'Add a search bar that filters results',
  'Make a form to collect RSVPs',
  'Build a leaderboard for member activity',
  'Add a countdown timer to the canvas',
  'Connect the search input to the result list',
];

export function AICommandPalette({
  open,
  onClose,
  onSubmit,
  loading = false,
  streamingText,
  selectedCount = 0,
}: AICommandPaletteProps) {
  const [input, setInput] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get selection-aware commands (Cursor-like behavior)
  const availableCommands = getCommandsForSelection(selectedCount);

  // Filter commands based on input
  const filteredCommands = input
    ? availableCommands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(input.toLowerCase()) ||
          cmd.description.toLowerCase().includes(input.toLowerCase())
      )
    : availableCommands;

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setInput('');
      setSelectedCommand(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCommand) {
          setSelectedCommand(null);
          setInput('');
        } else {
          onClose();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (loading) return;

        if (selectedCommand) {
          // Submit the full prompt
          onSubmit(input, selectedCommand.type);
        } else if (input.length > 3) {
          // Freeform prompt - determine type
          onSubmit(input, 'generate');
        } else if (filteredCommands[selectedIndex]) {
          // Select a command
          const cmd = filteredCommands[selectedIndex];
          setSelectedCommand(cmd);
          setInput(cmd.prefix || '');
        }
        return;
      }
    },
    [filteredCommands, selectedCommand, selectedIndex, input, loading, onClose, onSubmit]
  );

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setSelectedCommand({ id: 'freeform', label: 'Generate', description: '', icon: null, type: 'generate' });
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div className={cn(
              "rounded-2xl shadow-2xl overflow-hidden border",
              ideClasses.bgToolbar,
              ideClasses.borderDefault
            )}>
              {/* Input Area */}
              <div className={cn("flex items-center gap-3 px-5 py-4 border-b", ideClasses.borderDefault)}>
                {loading ? (
                  <ArrowPathIcon className="h-5 w-5 text-neutral-400 animate-spin flex-shrink-0" />
                ) : (
                  <SparklesIcon className="h-5 w-5 text-white flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedCommand
                      ? `${selectedCommand.label}...`
                      : 'Ask AI anything or select a command...'
                  }
                  className="flex-1 bg-transparent text-[var(--hivelab-text-primary)] text-lg placeholder:text-[var(--hivelab-text-tertiary)] outline-none"
                  disabled={loading}
                />
                <div className="flex items-center gap-1.5 text-xs text-[var(--hivelab-text-tertiary)]">
                  <kbd className="px-1.5 py-0.5 bg-[var(--hivelab-surface)] rounded border border-[var(--hivelab-border)]">
                    <Command className="h-3 w-3 inline" />K
                  </kbd>
                </div>
              </div>

              {/* Streaming response */}
              {streamingText && (
                <div className="px-5 py-4 border-b border-[var(--hivelab-border)] bg-[var(--hivelab-surface)]">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--hivelab-surface-hover)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <SparklesIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <p className="text-sm text-[var(--hivelab-text-secondary)] whitespace-pre-wrap">{streamingText}</p>
                  </div>
                </div>
              )}

              {/* Command List */}
              {!selectedCommand && !loading && (
                <div ref={listRef} className="max-h-[320px] overflow-y-auto">
                  {filteredCommands.length > 0 ? (
                    <div className="py-2">
                      {/* Selection context indicator (Cursor-like) */}
                      <div className="px-4 py-1.5 text-xs font-medium text-[var(--hivelab-text-tertiary)] uppercase tracking-wider flex items-center justify-between">
                        <span>Commands</span>
                        {selectedCount > 0 && (
                          <span className="text-[var(--hivelab-text-primary)] normal-case font-normal">
                            {selectedCount} element{selectedCount > 1 ? 's' : ''} selected
                          </span>
                        )}
                      </div>
                      {filteredCommands.map((cmd, index) => (
                        <button
                          key={cmd.id}
                          type="button"
                          className={cn(
                            'w-full px-4 py-3 flex items-center gap-3 transition-colors duration-[var(--workshop-duration)]',
                            index === selectedIndex
                              ? 'bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)]'
                              : 'text-[var(--hivelab-text-tertiary)] hover:bg-[var(--hivelab-surface)] hover:text-[var(--hivelab-text-primary)]'
                          )}
                          onClick={() => {
                            setSelectedCommand(cmd);
                            setInput(cmd.prefix || '');
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              index === selectedIndex
                                ? 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)]'
                                : 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-tertiary)]'
                            )}
                          >
                            {cmd.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{cmd.label}</p>
                            <p className="text-xs text-[var(--hivelab-text-tertiary)]">{cmd.description}</p>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 opacity-40" />
                        </button>
                      ))}
                    </div>
                  ) : input.length > 0 ? (
                    <div className="py-2">
                      <button
                        type="button"
                        className="w-full px-4 py-3 flex items-center gap-3 bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)]"
                        onClick={() => onSubmit(input, 'generate')}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)] flex items-center justify-center">
                          <SparklesIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">Generate from prompt</p>
                          <p className="text-xs text-[var(--hivelab-text-tertiary)] truncate">"{input}"</p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 opacity-40" />
                      </button>
                    </div>
                  ) : null}

                  {/* Quick Suggestions */}
                  {!input && (
                    <div className="py-2 border-t border-[var(--hivelab-border)]">
                      <div className="px-4 py-1.5 text-xs font-medium text-[var(--hivelab-text-tertiary)] uppercase tracking-wider">
                        Suggestions
                      </div>
                      <div className="px-4 py-2 flex flex-wrap gap-2">
                        {SUGGESTIONS.slice(0, 4).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 text-xs bg-[var(--hivelab-surface)] hover:bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] rounded-full transition-colors duration-[var(--workshop-duration)]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Command - Input Mode */}
              {selectedCommand && !loading && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)] flex items-center justify-center">
                      {selectedCommand.icon}
                    </div>
                    <span className="text-sm font-medium text-[var(--hivelab-text-primary)]">{selectedCommand.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommand(null);
                        setInput('');
                      }}
                      className="ml-auto text-xs text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)]"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-[var(--hivelab-text-tertiary)] mb-2">{selectedCommand.description}</p>
                  <p className="text-xs text-[var(--hivelab-text-tertiary)]">Press Enter to submit</p>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2.5 bg-[var(--hivelab-surface)] border-t border-[var(--hivelab-border)] flex items-center justify-between text-xs text-[var(--hivelab-text-tertiary)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-[var(--hivelab-bg)] rounded text-[10px]">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-[var(--hivelab-bg)] rounded text-[10px]">↵</kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-[var(--hivelab-bg)] rounded text-[10px]">esc</kbd>
                    close
                  </span>
                </div>
                <span>Powered by AI</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
