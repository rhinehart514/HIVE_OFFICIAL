'use client';

/**
 * PremiumComposer - ChatGPT-style message input
 *
 * Design Philosophy:
 * - The composer is the STAR of the interface
 * - Floating glass appearance with prominent presence
 * - Large, inviting text input (17px)
 * - Gold send button that pulses when ready
 * - Centered, not edge-to-edge
 *
 * Inspired by: ChatGPT, Linear, Superhuman
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Send, Square, Sparkles, Plus, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';

// ============================================================
// Types
// ============================================================

export interface PremiumComposerProps {
  /** Placeholder text */
  placeholder?: string;
  /** Called when message is submitted */
  onSubmit: (message: string) => Promise<void> | void;
  /** Called when user is typing (for typing indicator) */
  onTyping?: () => void;
  /** Whether AI is generating a response */
  isGenerating?: boolean;
  /** Called to stop generation */
  onStop?: () => void;
  /** Whether the composer is disabled */
  disabled?: boolean;
  /** Show the quick actions bar */
  showQuickActions?: boolean;
  /** Quick action buttons */
  quickActions?: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
  /** Maximum character count */
  maxLength?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function PremiumComposer({
  placeholder = 'Message this space...',
  onSubmit,
  onTyping,
  isGenerating = false,
  onStop,
  disabled = false,
  showQuickActions = false,
  quickActions = [],
  maxLength = 4000,
  className,
}: PremiumComposerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [message, setMessage] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = message.trim().length > 0 && !disabled && !isSending;
  const isNearLimit = message.length > maxLength * 0.9;

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [message]);

  // Handle typing indicator
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Debounced typing indicator
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        // Typing stopped
      }, 2000);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSend) return;

    const trimmedMessage = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      await onSubmit(trimmedMessage);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Centered container */}
      <div className="max-w-[800px] mx-auto px-4 pb-6 pt-3">
        {/* Quick Actions Bar */}
        <AnimatePresence>
          {showQuickActions && quickActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={premium.motion.spring.default}
              className="flex items-center gap-2 mb-3 justify-center"
            >
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2',
                    'bg-white/[0.04] hover:bg-white/[0.08]',
                    'border border-white/[0.06] hover:border-white/[0.12]',
                    'rounded-xl text-sm text-[#9A9A9F] hover:text-white',
                    'transition-all duration-150'
                  )}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Composer */}
        <motion.div
          initial={false}
          animate={{
            scale: isFocused ? 1.005 : 1,
            borderColor: isFocused
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.10)',
          }}
          transition={premium.motion.spring.snappy}
          className={cn(
            // Glass morphism base
            'relative',
            'bg-[rgba(17,17,17,0.85)]',
            'backdrop-blur-[24px]',
            'border border-white/[0.10]',
            'rounded-[20px]',
            'shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]',
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isGenerating}
            maxLength={maxLength}
            rows={1}
            className={cn(
              'w-full',
              'px-6 py-5 pr-16',
              'bg-transparent',
              'text-[17px] leading-[1.6] text-[#FAFAFA]',
              'placeholder:text-[#6B6B70]',
              'resize-none outline-none',
              'min-h-[60px] max-h-[200px]',
              'scrollbar-hide',
              disabled && 'cursor-not-allowed'
            )}
            style={{ overflow: 'hidden' }}
          />

          {/* Send/Stop Button */}
          <div className="absolute right-3 bottom-3">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.button
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={premium.motion.spring.snappy}
                  onClick={onStop}
                  className={cn(
                    'w-11 h-11 rounded-xl',
                    'flex items-center justify-center',
                    'bg-white/[0.08] hover:bg-white/[0.12]',
                    'text-[#9A9A9F] hover:text-white',
                    'transition-colors duration-150'
                  )}
                  aria-label="Stop generating"
                >
                  <Square className="w-4 h-4" fill="currentColor" />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={canSend ? { scale: 1.05 } : {}}
                  whileTap={canSend ? { scale: 0.95 } : {}}
                  transition={premium.motion.spring.snappy}
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className={cn(
                    'w-11 h-11 rounded-xl',
                    'flex items-center justify-center',
                    'transition-all duration-200',
                    canSend
                      ? [
                          'bg-[#FFD700] hover:bg-[#E6C200]',
                          'text-black',
                          'shadow-[0_0_20px_rgba(255,215,0,0.25)]',
                          'hover:shadow-[0_0_30px_rgba(255,215,0,0.35)]',
                        ]
                      : [
                          'bg-white/[0.04]',
                          'text-[#4A4A4F]',
                          'cursor-not-allowed',
                        ]
                  )}
                  aria-label="Send message"
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Helper text */}
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-[12px] text-[#6B6B70]">
            <span className="text-[#9A9A9F]">Enter</span> to send
            <span className="mx-2 text-[#4A4A4F]">•</span>
            <span className="text-[#9A9A9F]">Shift+Enter</span> for new line
          </p>

          {/* Character count (only when near limit) */}
          <AnimatePresence>
            {isNearLimit && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'text-[12px] tabular-nums',
                  message.length >= maxLength ? 'text-red-400' : 'text-[#9A9A9F]'
                )}
              >
                {message.length}/{maxLength}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default PremiumComposer;
