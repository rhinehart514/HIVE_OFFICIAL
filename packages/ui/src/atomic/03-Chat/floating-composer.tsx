'use client';

/**
 * FloatingComposer - Glass Morphism Chat Input
 *
 * Edge-to-edge aesthetic matching the redesigned spaces experience:
 * - Floating at bottom with glass morphism
 * - Minimal, clean design
 * - Send button with gold hover state
 * - Slash command support
 *
 * Part of Phase 3: Chat Redesign
 */

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Slash, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Spring config
const SPRING_BUTTER = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 20,
  mass: 1,
};

export interface FloatingComposerHandle {
  setValue: (value: string) => void;
  focus: () => void;
  getValue: () => string;
  clear: () => void;
}

export interface FloatingComposerProps {
  /** Callback when user submits message */
  onSubmit: (message: string) => void;
  /** Callback when user is typing */
  onTyping?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Max character limit */
  maxLength?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Enable slash commands hint */
  showSlashHint?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FloatingComposer Component
 *
 * Glass morphism input that floats at the bottom of the chat area.
 * Clean, minimal design matching the edge-to-edge aesthetic.
 */
export const FloatingComposer = forwardRef<FloatingComposerHandle, FloatingComposerProps>(
  function FloatingComposer(
    {
      onSubmit,
      onTyping,
      placeholder = 'Type a message...',
      maxLength = 2000,
      disabled = false,
      showSlashHint = true,
      className,
    },
    ref
  ) {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        setValue: (value: string) => setMessage(value),
        focus: () => textareaRef.current?.focus(),
        getValue: () => message,
        clear: () => {
          setMessage('');
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        },
      }),
      [message]
    );

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
      }
    }, [message]);

    // Notify typing
    useEffect(() => {
      if (message && onTyping) {
        onTyping();
      }
    }, [message, onTyping]);

    const handleSubmit = useCallback(() => {
      if (message.trim() && !disabled) {
        onSubmit(message.trim());
        setMessage('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }, [message, disabled, onSubmit]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to send, Shift+Enter for newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const canSend = message.trim().length > 0 && !disabled;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_BUTTER}
        className={cn(
          'relative mx-4 mb-4',
          className
        )}
      >
        {/* Glass container */}
        <div
          className={cn(
            'relative rounded-2xl transition-all duration-300',
            'bg-white/[0.03] backdrop-blur-xl',
            'border',
            isFocused
              ? 'border-white/[0.16] shadow-[0_0_30px_rgba(255,255,255,0.04)]'
              : 'border-white/[0.08]'
          )}
        >
          {/* Input area */}
          <div className="flex items-end gap-3 p-3">
            {/* Slash hint */}
            {showSlashHint && !message && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-white/30 text-[12px] hover:bg-white/[0.06] hover:text-white/50 transition-colors"
                onClick={() => {
                  setMessage('/');
                  textareaRef.current?.focus();
                }}
              >
                <Slash className="w-3 h-3" />
                <span>commands</span>
              </motion.button>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'flex-1 bg-transparent resize-none outline-none',
                'text-[15px] text-white placeholder:text-white/30',
                'min-h-[24px] max-h-[120px]',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ lineHeight: '24px' }}
            />

            {/* Send button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200',
                canSend
                  ? 'bg-white/[0.08] text-white hover:bg-[#FFD700] hover:text-black'
                  : 'bg-white/[0.03] text-white/20 cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Character count (only when approaching limit) */}
          <AnimatePresence>
            {message.length > maxLength * 0.8 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2"
              >
                <span
                  className={cn(
                    'text-[11px]',
                    message.length > maxLength * 0.95
                      ? 'text-red-400'
                      : 'text-white/30'
                  )}
                >
                  {message.length}/{maxLength}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

export default FloatingComposer;
