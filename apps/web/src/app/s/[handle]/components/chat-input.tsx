'use client';

/**
 * ChatInput - Message input for Space page
 *
 * Full-width input with send button.
 * Handles Enter to send, Shift+Enter for newline.
 * Supports file attachments for images.
 */

import * as React from 'react';
import { Send, X, Image as ImageIcon, Loader2, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui/design-system/primitives';
import {
  getAutocompleteSuggestions,
} from '@/lib/slash-command-parser';

export interface ChatAttachment {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ChatInputProps {
  spaceId?: string;
  onSend: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Callback when typing state changes */
  onTypingChange?: (isTyping: boolean) => void;
  /** Pre-fill value (consumed once, then cleared) */
  prefill?: string | null;
  /** Callback to clear prefill after consuming */
  onPrefillConsumed?: () => void;
}

export function ChatInput({
  spaceId,
  onSend,
  placeholder = '/ Try /poll, /rsvp, /countdown',
  disabled,
  className,
  onTypingChange,
  prefill,
  onPrefillConsumed,
}: ChatInputProps) {
  const [value, setValue] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = React.useState(false);
  const [slashSuggestions, setSlashSuggestions] = React.useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Consume prefill value
  React.useEffect(() => {
    if (prefill) {
      setValue(prefill);
      onPrefillConsumed?.();
      // Focus and place cursor at end
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = prefill.length;
          textareaRef.current.selectionEnd = prefill.length;
        }
      });
    }
  }, [prefill, onPrefillConsumed]);

  const handleFileSelect = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !spaceId) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const file = files[0];

      // Validate file type client-side
      if (!file.type.startsWith('image/')) {
        setUploadError('Only images are allowed');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File too large (max 10MB)');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/spaces/${spaceId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload');
      }

      const data = await response.json();
      setAttachments((prev) => [...prev, {
        url: data.url,
        filename: data.filename,
        size: data.size,
        mimeType: data.mimeType,
      }]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [spaceId]);

  const removeAttachment = React.useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = React.useCallback(async () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || isSending || disabled) return;

    // Clear typing indicator immediately
    if (onTypingChange) {
      onTypingChange(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }

    setIsSending(true);
    try {
      await onSend(trimmed, attachments.length > 0 ? attachments : undefined);
      setValue('');
      setAttachments([]);
      setUploadError(null);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Failed to send message
    } finally {
      setIsSending(false);
    }
  }, [value, attachments, onSend, isSending, disabled, onTypingChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle slash menu navigation
      if (showSlashMenu) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            Math.min(prev + 1, slashSuggestions.length - 1)
          );
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Tab' || (e.key === 'Enter' && slashSuggestions.length > 0)) {
          e.preventDefault();
          const suggestion = slashSuggestions[selectedSuggestionIndex];
          if (suggestion) {
            setValue(suggestion + ' ');
            setShowSlashMenu(false);
            textareaRef.current?.focus();
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSlashMenu(false);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, showSlashMenu, slashSuggestions, selectedSuggestionIndex]
  );

  // Auto-resize textarea and handle typing indicator
  const handleInput = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const newValue = textarea.value;
    setValue(newValue);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;

    // Check for slash command
    if (newValue.startsWith('/')) {
      const suggestions = getAutocompleteSuggestions(newValue);
      if (suggestions.length > 0) {
        setSlashSuggestions(suggestions);
        setShowSlashMenu(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowSlashMenu(false);
      }
    } else {
      setShowSlashMenu(false);
    }

    // Trigger typing indicator
    if (onTypingChange && textarea.value.length > 0) {
      onTypingChange(true);

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 2000);
    }
  }, [onTypingChange]);

  return (
    <div className={cn('p-3 relative', className)}>
      {/* Slash command menu */}
      {showSlashMenu && slashSuggestions.length > 0 && (
        <div
          className={cn(
            'absolute bottom-full left-3 right-3 mb-2',
            'bg-[#080808] border border-white/[0.06] rounded-xl',
            'py-2 max-h-[200px] overflow-y-auto'
          )}
        >
          <div className="px-3 py-1.5 text-xs text-white/50 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Command className="w-3 h-3" />
            Quick Actions
          </div>
          {slashSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => {
                setValue(suggestion + ' ');
                setShowSlashMenu(false);
                textareaRef.current?.focus();
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                index === selectedSuggestionIndex
                  ? 'bg-white/[0.06] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {suggestion}
            </button>
          ))}
          <div className="px-3 py-1.5 mt-1 text-xs text-white/50 border-t border-white/[0.06]">
            Tab or Enter • Esc to close
          </div>
        </div>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden bg-white/[0.06] border border-white/[0.06]"
            >
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="h-16 w-16 object-cover"
              />
              <button
                onClick={() => removeAttachment(index)}
                className={cn(
                  'absolute top-0.5 right-0.5 p-0.5 rounded-full',
                  'bg-black/60 hover:bg-black/80',
                  'opacity-0 group-hover:opacity-100',
                  'transition-opacity'
                )}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="text-xs text-red-400 mb-2 flex items-center gap-1">
          <X className="h-3 w-3" />
          {uploadError}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attachment button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0"
          disabled={disabled || isUploading || !spaceId}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 " />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Add image</span>
        </Button>

        {/* Text input - pill shape */}
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
              'rounded-2xl text-[15px]',
              'bg-white/[0.03]',
              'border border-white/[0.06]',
              'text-white placeholder:text-white/30',
              'resize-none',
              'focus:outline-none focus:ring-1 focus:ring-white/20',
              'disabled:opacity-50',
              'transition-colors'
            )}
            style={{ minHeight: 40, maxHeight: 120 }}
          />
        </div>

        {/* Send button */}
        <Button
          variant="cta"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0"
          onClick={handleSend}
          disabled={(!value.trim() && attachments.length === 0) || isSending || disabled}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}

ChatInput.displayName = 'ChatInput';
