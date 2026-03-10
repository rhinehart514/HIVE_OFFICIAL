'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={`"Best pizza place near campus" or "Who's coming Friday"...`}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 pr-12 rounded-2xl text-[15px] bg-white/[0.03] border border-white/[0.08]
            text-white placeholder:text-white/25 resize-none focus:outline-none focus:outline-2 focus:outline-[#FFD700]
            disabled:opacity-50 transition-colors duration-100"
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
    </div>
  );
}
