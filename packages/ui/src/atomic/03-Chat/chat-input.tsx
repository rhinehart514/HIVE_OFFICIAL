'use client';

/**
 * ChatInput - OpenAI-style message input
 *
 * Features:
 * - Auto-expanding textarea
 * - Send/Stop button toggle
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Character counter (optional)
 * - Minimal, clean design
 * - Mobile-optimized
 */

import { Send, Square } from 'lucide-react';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../00-Global/atoms/button';
import '../../styles/scrollbar.css';

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

  /** Is AI currently generating? */
  isGenerating?: boolean;

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
 * - Clean, minimal styling
 */
export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  onSubmit,
  onStop,
  isGenerating = false,
  placeholder = 'Message HIVE AI...',
  maxLength = 2000,
  showCounter = false,
  disabled = false,
  className
}, ref) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
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
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
});
