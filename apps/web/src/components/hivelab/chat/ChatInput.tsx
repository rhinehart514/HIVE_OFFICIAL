'use client';

/**
 * ChatInput — Textarea + send button for the lab chat.
 *
 * Adapts between initial prompt mode (large, centered, template chips)
 * and refinement mode (inline, bottom-anchored).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Sparkles } from 'lucide-react';
import { BrandSpinner } from '@hive/ui';

interface ChatInputProps {
  onSend: (text: string) => void;
  isGenerating?: boolean;
  isCreatingTool?: boolean;
  hasExistingTool?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

export function ChatInput({
  onSend,
  isGenerating,
  isCreatingTool,
  hasExistingTool,
  placeholder,
  autoFocus,
  initialValue,
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = isGenerating || isCreatingTool;

  const defaultPlaceholder = hasExistingTool
    ? 'Want to change anything?'
    : 'Describe what you want to build...';

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Auto-submit initialValue on mount (for ?prompt= redirect)
  const hasAutoSubmitted = useRef(false);
  useEffect(() => {
    if (initialValue && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      onSend(initialValue);
      setValue('');
    }
  }, [initialValue, onSend]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isDisabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="relative w-full">
      <div
        className={`
          flex items-end gap-2 rounded-2xl border transition-all duration-200
          ${isDisabled
            ? 'border-white/[0.04] bg-[#080808]'
            : 'border-white/[0.08] bg-[#080808] hover:border-white/[0.10] focus-within:border-white/[0.12]'
          }
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={placeholder || defaultPlaceholder}
          rows={1}
          className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-white/25
            resize-none outline-none text-[15px] leading-relaxed
            disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        />

        <div className="flex-shrink-0 pr-2 pb-2">
          <AnimatePresence mode="wait">
            {isDisabled ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-8 h-8 flex items-center justify-center"
              >
                {isCreatingTool ? (
                  <BrandSpinner size="sm" variant="gold" />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-white/30" />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="send"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSubmit}
                disabled={!value.trim()}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                  ${value.trim()
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/[0.08] text-white/30'
                  }
                  disabled:cursor-not-allowed
                `}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
