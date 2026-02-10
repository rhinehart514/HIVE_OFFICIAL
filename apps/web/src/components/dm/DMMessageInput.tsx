'use client';

/**
 * DMMessageInput - Message input for DM panel
 */

import * as React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDM } from '@/contexts/dm-context';
import { Button } from '@hive/ui/design-system/primitives';

export function DMMessageInput() {
  const { sendMessage, isSending, activeConversationId } = useDM();
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = React.useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || !activeConversationId) return;

    try {
      await sendMessage(trimmed);
      setValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Error handled by context
    }
  }, [value, sendMessage, isSending, activeConversationId]);

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
    <div
      className="flex items-end gap-2 p-3 flex-shrink-0"
      style={{
        borderTop: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isSending}
          rows={1}
          className={cn(
            'w-full px-4 py-2.5',
            'rounded-lg text-sm',
            'bg-white/[0.06] hover:bg-white/[0.06]',
            'border border-white/[0.06]',
            'text-white placeholder:text-white/50',
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
        className="h-10 w-10 p-0 flex-shrink-0 rounded-full"
        onClick={handleSend}
        disabled={!value.trim() || isSending}
        style={{
          backgroundColor: value.trim() ? 'var(--life-gold)' : 'rgba(255,255,255,0.08)',
          color: value.trim() ? 'var(--bg-base)' : 'var(--text-tertiary)',
        }}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 " />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}

DMMessageInput.displayName = 'DMMessageInput';
