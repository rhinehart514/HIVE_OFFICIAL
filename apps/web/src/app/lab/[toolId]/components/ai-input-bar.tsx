'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface AIInputBarProps {
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function AIInputBar({
  onSubmit,
  isGenerating = false,
  placeholder = 'Describe what you want to create...',
  disabled = false,
}: AIInputBarProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on ⌘K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = () => {
    if (!value.trim() || isGenerating || disabled) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 py-3 bg-[var(--bg-ground)] border-t border-[var(--border-subtle)]">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg
          bg-[var(--bg-subtle)] border
          transition-all duration-200
          ${isFocused
            ? 'border-[var(--border-emphasis)] ring-2 ring-white/[0.10]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* AI Icon */}
        <div className="flex-shrink-0">
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <SparklesIcon className="w-5 h-5 text-[var(--life-gold)]" />
            </motion.div>
          ) : (
            <SparklesIcon className={`w-5 h-5 ${isFocused ? 'text-[var(--life-gold)]' : 'text-[var(--text-tertiary)]'}`} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isGenerating}
          placeholder={isGenerating ? 'Generating...' : placeholder}
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
            text-sm outline-none disabled:cursor-not-allowed"
        />

        {/* Submit button */}
        <AnimatePresence>
          {value.trim() && !isGenerating && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleSubmit}
              disabled={disabled}
              className="flex-shrink-0 w-8 h-8 rounded-lg
                bg-[var(--life-subtle)] text-[var(--life-gold)]
                flex items-center justify-center
                transition-all duration-150
                hover:bg-[var(--life-glow)]
                active:opacity-80
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Keyboard shortcut hint */}
        {!isFocused && !value && (
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]
            text-[var(--text-muted)] text-xs font-mono">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Generating status */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mt-2 px-1 text-xs text-[var(--text-tertiary)]"
          >
            <div className="flex gap-1">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]"
              />
            </div>
            <span>AI is thinking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
