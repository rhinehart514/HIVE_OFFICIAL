'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

const PLACEHOLDER_EXAMPLES = [
  'Make a poll for your next study spot...',
  'Build a bracket for best campus food...',
  'Create an RSVP for your next event...',
  'Rank the best Ellicott food options...',
  'Who\'s coming to Lockwood study night...',
];

const PLACEHOLDER_ROTATE_MS = 3500;
const TYPING_IDLE_MS = 500;

export function PromptInput({
  onSubmit,
  disabled,
  autoPrompt,
}: {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
  autoPrompt?: string;
}) {
  const [value, setValue] = useState(autoPrompt ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const [showAiReading, setShowAiReading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoPrompt) {
      setValue(autoPrompt);
      // Auto-submit if we got a prompt from query params
      setTimeout(() => onSubmit(autoPrompt), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Rotate placeholder text
  useEffect(() => {
    if (value.length > 0) return; // Don't rotate when user has typed
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, PLACEHOLDER_ROTATE_MS);
    return () => clearInterval(interval);
  }, [value.length]);

  const handleTypingIdle = useCallback(() => {
    setIsTyping(false);
    if (value.trim().length > 3) {
      setShowAiReading(true);
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    setShowAiReading(false);
    setIsTyping(false);
    onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;

    // Track typing state for glow intensity + AI reading indicator
    setIsTyping(true);
    setShowAiReading(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(handleTypingIdle, TYPING_IDLE_MS);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  return (
    <div className="w-full">
      <div
        className="relative rounded-2xl transition-shadow duration-200"
        style={{
          boxShadow: isTyping
            ? 'inset 0 0 20px rgba(255,215,0,0.05)'
            : undefined,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          disabled={disabled}
          rows={1}
          className={[
            'w-full px-4 py-3 pr-12 rounded-2xl text-[15px] bg-white/[0.05] border',
            'text-white placeholder:text-white/30 resize-none',
            'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
            'focus:shadow-[inset_0_0_20px_rgba(255,215,0,0.05)]',
            'focus:border-[#FFD700]/30',
            'disabled:opacity-50 transition-shadow transition-colors duration-200',
            isTyping ? 'border-[#FFD700]/30' : 'border-white/[0.05]',
          ].join(' ')}
          style={{ minHeight: 48, maxHeight: 120 }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="absolute right-2 bottom-2 h-9 w-9 flex items-center justify-center
            rounded-full bg-white text-black disabled:opacity-30 disabled:bg-white/20
            hover:bg-white/90 transition-colors duration-100"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      {showAiReading && !disabled && value.trim().length > 3 && (
        <p
          className="mt-2 text-white/30 text-[11px] tracking-wider"
          style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          AI is reading...
        </p>
      )}
    </div>
  );
}
