'use client';

/**
 * ChatInput - OpenAI-style message input
 *
 * Features:
 * - Auto-expanding textarea
 * - Send/Stop button toggle
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Character counter (optional)
 * - Tool insertion toolbar (polls, events, countdowns)
 * - Slash command autocomplete (/poll, /rsvp, /countdown, /announce, /welcome, /remind, /automate)
 * - Minimal, clean design
 * - Mobile-optimized
 *
 * Part of HiveLab Winter 2025 Strategy: Chat-First Foundation
 */

import { Send, Square, Zap, BarChart3, Calendar, Timer, Megaphone, HelpCircle, Sparkles, Bell, UserPlus } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../00-Global/atoms/button';
import { ChatToolbar, type ToolInsertData, type ToolType } from './chat-toolbar';
import '../../styles/scrollbar.css';

// Re-export types from chat-toolbar for convenience
export type { ToolInsertData, ToolType } from './chat-toolbar';

// ─────────────────────────────────────────────────────────────────────────────
// Slash Command Types & Data
// ─────────────────────────────────────────────────────────────────────────────

export interface SlashCommandSuggestion {
  command: string;
  description: string;
  syntax: string;
  icon: React.ReactNode;
}

const SLASH_COMMANDS: SlashCommandSuggestion[] = [
  // Component creation commands
  {
    command: '/poll',
    description: 'Create a poll',
    syntax: '/poll "Question?" Option1 Option2',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    command: '/rsvp',
    description: 'Create an RSVP',
    syntax: '/rsvp "Event Name" --date=tomorrow',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    command: '/countdown',
    description: 'Create a countdown',
    syntax: '/countdown "Event" 2024-12-20',
    icon: <Timer className="h-4 w-4" />,
  },
  {
    command: '/announce',
    description: 'Post announcement',
    syntax: '/announce Your message here',
    icon: <Megaphone className="h-4 w-4" />,
  },
  // Automation commands (HiveLab Phase 3)
  {
    command: '/welcome',
    description: 'Auto-greet new members',
    syntax: '/welcome "Hey {member}! Welcome!"',
    icon: <UserPlus className="h-4 w-4 text-amber-500" />,
  },
  {
    command: '/remind',
    description: 'Event reminder automation',
    syntax: '/remind 30 "Don\'t miss {event}!"',
    icon: <Bell className="h-4 w-4 text-amber-500" />,
  },
  {
    command: '/automate',
    description: 'Create custom automation',
    syntax: '/automate welcome "Greeting Bot"',
    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
  },
  {
    command: '/help',
    description: 'Show available commands',
    syntax: '/help [command]',
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

/** Imperative handle for ChatInput */
export interface ChatInputHandle {
  /** Set the input value programmatically */
  setValue: (value: string) => void;
  /** Focus the input */
  focus: () => void;
  /** Get current value */
  getValue: () => string;
  /** Clear the input */
  clear: () => void;
}

export interface ChatInputProps {
  /** Callback when user submits message */
  onSubmit: (message: string) => void;

  /** Callback when user stops generation */
  onStop?: () => void;

  /** Callback when user inserts a tool (poll, event, countdown) */
  onInsertTool?: (data: ToolInsertData) => void;

  /** Callback when "More tools" is clicked */
  onOpenToolGallery?: () => void;

  /** Is AI currently generating? */
  isGenerating?: boolean;

  /** Show the tool insertion toolbar */
  showToolbar?: boolean;

  /** Whether user can insert tools */
  canInsertTools?: boolean;

  /** Enable slash command autocomplete */
  enableSlashCommands?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Max character limit */
  maxLength?: number;

  /** Show character counter */
  showCounter?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatInput Component
 *
 * Bottom-anchored input area with OpenAI-style interaction:
 * - Expandable textarea (grows with content)
 * - Send button → Stop button toggle during generation
 * - Enter to send, Shift+Enter for newline
 * - Slash command autocomplete with keyboard navigation
 * - Clean, minimal styling
 */
export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  onSubmit,
  onStop,
  onInsertTool,
  onOpenToolGallery,
  isGenerating = false,
  showToolbar = false,
  canInsertTools = true,
  enableSlashCommands = true,
  placeholder = 'Message HIVE AI...',
  maxLength = 2000,
  showCounter = false,
  disabled = false,
  className
}, ref) {
  const [message, setMessage] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Filter slash commands based on input
  const filteredCommands = useMemo(() => {
    if (!enableSlashCommands || !message.startsWith('/')) {
      return [];
    }

    const partial = message.slice(1).toLowerCase().split(' ')[0];

    // If command is complete (has space after), don't show autocomplete
    if (message.includes(' ') && message.indexOf(' ') > 1) {
      return [];
    }

    if (!partial) {
      return SLASH_COMMANDS;
    }

    return SLASH_COMMANDS.filter(cmd =>
      cmd.command.slice(1).startsWith(partial)
    );
  }, [message, enableSlashCommands]);

  // Show/hide autocomplete based on filtered commands
  useEffect(() => {
    setShowAutocomplete(filteredCommands.length > 0);
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    setValue: (value: string) => {
      setMessage(value);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    getValue: () => message,
    clear: () => {
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
  }), [message]);

  // Auto-resize textarea (wrapper handles max-height)
  useEffect(() => {
    const textarea = textareaRef.current;
    const wrapper = wrapperRef.current;

    if (textarea && wrapper) {
      // Reset to auto to get accurate scrollHeight
      textarea.style.height = 'auto';

      // Get actual content height
      const scrollHeight = textarea.scrollHeight;

      // Set textarea height (no Math.min - wrapper handles max)
      textarea.style.height = `${scrollHeight}px`;

      // Auto-scroll wrapper to bottom if content exceeds max-height
      if (scrollHeight > 200) {
        wrapper.scrollTop = wrapper.scrollHeight;
      }
    }
  }, [message]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (message.trim() && !disabled && !isGenerating) {
      onSubmit(message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleStop = () => {
    if (isGenerating && onStop) {
      onStop();
    }
  };

  // Select a slash command from autocomplete
  const selectCommand = useCallback((command: SlashCommandSuggestion) => {
    setMessage(command.command + ' ');
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle autocomplete navigation
    if (showAutocomplete && filteredCommands.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          return;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          return;

        case 'Tab':
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            selectCommand(filteredCommands[selectedIndex]);
            return;
          }
          break;

        case 'Escape':
          e.preventDefault();
          setShowAutocomplete(false);
          return;
      }
    }

    // Enter to send (without Shift, and not in autocomplete)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = message.trim().length > 0 && !disabled;
  const characterCount = message.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.9;

  return (
    <div className={cn(
      'border-t border-white/[0.08] bg-black',
      className
    )}>
      <div className="max-w-3xl mx-auto px-6 py-5">
        <div className={cn(
          'relative rounded-xl border transition-all duration-200',
          'bg-white/[0.03]',
          disabled
            ? 'border-white/[0.06] opacity-50'
            : 'border-white/[0.12] hover:border-white/[0.18] focus-within:border-white/25'
        )}>
          {/* Slash command autocomplete dropdown */}
          {showAutocomplete && filteredCommands.length > 0 && (
            <div
              ref={autocompleteRef}
              className={cn(
                'absolute left-2 right-2 bottom-full mb-2',
                'bg-[#1a1a1a] border border-white/[0.12] rounded-lg',
                'shadow-lg shadow-black/40 overflow-hidden',
                'z-50'
              )}
              role="listbox"
              aria-label="Slash command suggestions"
            >
              <div className="px-3 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Zap className="h-3 w-3 text-[var(--hive-gold-cta)]" />
                  <span>Quick Actions</span>
                </div>
              </div>
              <div className="py-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                {filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.command}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    onClick={() => selectCommand(cmd)}
                    className={cn(
                      'w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-white/[0.08]'
                        : 'hover:bg-white/[0.04]'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0 p-1.5 rounded-md mt-0.5',
                      index === selectedIndex
                        ? 'bg-[var(--hive-gold-cta)]/20 text-[var(--hive-gold-cta)]'
                        : 'bg-white/[0.06] text-white/60'
                    )}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-white text-sm">
                          {cmd.command}
                        </span>
                        <span className="text-white/50 text-xs">
                          {cmd.description}
                        </span>
                      </div>
                      <div className="text-white/30 text-xs mt-0.5 font-mono truncate">
                        {cmd.syntax}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="flex-shrink-0 text-[10px] text-white/40 mt-1">
                        ↵ select
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="px-3 py-1.5 border-t border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-3 text-[10px] text-white/40">
                  <span><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-white/60">↑↓</kbd> navigate</span>
                  <span><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-white/60">Tab</kbd> select</span>
                  <span><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-white/60">Esc</kbd> dismiss</span>
                </div>
              </div>
            </div>
          )}

          {/* Tool insertion toolbar */}
          {showToolbar && onInsertTool && (
            <ChatToolbar
              onInsertTool={onInsertTool}
              onOpenGallery={onOpenToolGallery}
              visible={showToolbar}
              canInsert={canInsertTools && !disabled && !isGenerating}
            />
          )}

          {/* Scrollable wrapper */}
          <div
            ref={wrapperRef}
            className="max-h-[200px] overflow-y-auto custom-scrollbar"
          >
            {/* Textarea with hidden scrollbar */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isGenerating}
              maxLength={maxLength}
              rows={1}
              className={cn(
                'w-full px-6 py-4 pr-14',
                'bg-transparent text-white placeholder:text-white/60',
                'resize-none outline-none scrollbar-hide',
                'text-[15px] leading-relaxed font-normal',
                'transition-[height] duration-200 ease-out'
              )}
              style={{ minHeight: '52px', overflow: 'hidden' }}
            />
          </div>

          {/* Action button (Send/Stop) */}
          <div className="absolute right-2.5 bottom-2.5">
            {isGenerating ? (
              <Button
                onClick={handleStop}
                size="icon"
                variant="ghost"
                className={cn(
                  'h-9 w-9 rounded-lg',
                  'bg-white/[0.06] hover:bg-white/[0.12]',
                  'text-white/60 hover:text-white/80'
                )}
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4" fill="currentColor" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-lg transition-all',
                  canSubmit
                    ? 'bg-[var(--hive-gold-cta)] hover:brightness-110 text-black shadow-sm'
                    : 'bg-white/[0.06] text-white/25 cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Character counter */}
        {showCounter && (
          <div className="mt-2 px-2 flex justify-end">
            <span className={cn(
              'text-xs tabular-nums',
              isNearLimit ? 'text-red-400' : 'text-white/30'
            )}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )}

        {/* Helper text */}
        <p className="mt-3 px-2 text-xs text-white/35 text-center tracking-wide">
          {enableSlashCommands
            ? 'Type / for quick actions • Enter to send • Shift+Enter for new line'
            : 'Press Enter to send, Shift+Enter for new line'
          }
        </p>
      </div>
    </div>
  );
});
