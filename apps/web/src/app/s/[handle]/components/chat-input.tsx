'use client';

/**
 * ChatInput - Message input for Space page
 *
 * Full-width input with send button.
 * Handles Enter to send, Shift+Enter for newline.
 */

import * as React from 'react';
import { Send, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui/design-system/primitives';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  onSend,
  placeholder = 'Type a message...',
  disabled,
  className,
}: ChatInputProps) {
  const [value, setValue] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = React.useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(trimmed);
      setValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [value, onSend, isSending, disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-resize textarea
  const handleInput = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setValue(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  return (
    <div className={cn('flex items-end gap-2 p-3', className)}>
      {/* Plus button (for attachments/tools - placeholder) */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 flex-shrink-0"
        disabled={disabled}
      >
        <Plus className="h-5 w-5" />
        <span className="sr-only">Add attachment</span>
      </Button>

      {/* Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          className={cn(
            'w-full px-4 py-2.5',
            'rounded-xl text-sm',
            'bg-white/[0.04] hover:bg-white/[0.06]',
            'border border-white/[0.06]',
            'text-white placeholder:text-white/30',
            'resize-none',
            'focus:outline-none focus:ring-2 focus:ring-white/50',
            'disabled:opacity-50',
            'transition-all duration-150'
          )}
          style={{ minHeight: 40, maxHeight: 120 }}
        />
      </div>

      {/* Send button */}
      <Button
        variant="default"
        size="sm"
        className="h-9 w-9 p-0 flex-shrink-0"
        onClick={handleSend}
        disabled={!value.trim() || isSending || disabled}
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}

ChatInput.displayName = 'ChatInput';
