'use client';

/**
 * ChatComposer Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Rich text chat input with file uploads, mentions, and commands.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEFAULT STATE (Empty):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📎    Type a message...                                        Send   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *      │        │                                                      │
 *      │        └── Placeholder text, text-muted                       │
 *      └── Attachment button (ghost)                                   │
 *                                                   Send button (disabled when empty)
 *
 * TYPING STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📎    Hello, I wanted to share an update about the...     [Send]      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                                                 │
 *                                       Send button (gold when has content)
 *
 * WITH MENTIONS (@user autocomplete):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📎    Hey @ja|                                              [Send]    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  ┌──────────────────────────────────────────┐                          │
 * │  │  🟢 Jane Doe (@jane)                     │                          │
 * │  │  🔴 James Smith (@james)                 │                          │
 * │  │  ⚪ Jacob Wilson (@jacob)                │                          │
 * │  └──────────────────────────────────────────┘                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * WITH SLASH COMMANDS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📎    /po|                                                  [Send]    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  ┌──────────────────────────────────────────┐                          │
 * │  │  /poll - Create a quick poll            │                          │
 * │  │  /post - Create a feed post             │                          │
 * │  └──────────────────────────────────────────┘                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * WITH ATTACHMENTS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────────────────┐  ┌────────────────┐                                │
 * │  │  📄 doc.pdf    │  │  🖼️ image.png  │   <- Attachment previews       │
 * │  │       ✕        │  │       ✕        │      with remove buttons       │
 * │  └────────────────┘  └────────────────┘                                │
 * │  📎    Add more context here...                              [Send]    │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * EXPANDED (Multi-line):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  This is a longer message that spans                                   │
 * │  multiple lines and expands the                                        │
 * │  composer automatically...                                             │
 * │                                                                         │
 * │  📎  😀  ⌘  📷                                              [Send]     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *       │   │   │   │
 *       │   │   │   └── Media/Image
 *       │   │   └── Commands
 *       │   └── Emoji picker
 *       └── Attachment
 *
 * REPLY MODE (Replying to a message):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ↩ Replying to Jane Doe                                          ✕     │
 * │  "Hey everyone, I wanted to share..."                                   │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  📎    Type your reply...                                    [Send]    │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * TOOLBAR BUTTONS:
 * - Attachment (📎): Opens file picker
 * - Emoji (😀): Opens emoji picker
 * - Commands (⌘): Shows available slash commands
 * - Media (📷): Quick image/video upload
 *
 * STATES:
 * - Empty: Placeholder shown, send disabled
 * - Typing: Text shown, send enabled (gold)
 * - Uploading: Shows progress, send disabled
 * - Sending: Spinner, send disabled
 * - Error: Red border, error message
 *
 * KEYBOARD SHORTCUTS:
 * - Enter: Send message
 * - Shift+Enter: New line
 * - @ + typing: Show mention autocomplete
 * - / at start: Show command palette
 * - Escape: Close autocomplete/cancel reply
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { Button } from '../primitives/Button';

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  progress?: number;
}

export interface ChatReplyTo {
  id: string;
  authorName: string;
  content: string;
}

export interface ChatComposerProps {
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Submit handler */
  onSubmit?: (message: { content: string; attachments?: ChatAttachment[]; replyTo?: string }) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Message being replied to */
  replyTo?: ChatReplyTo;
  /** Cancel reply handler */
  onCancelReply?: () => void;
  /** Attachments */
  attachments?: ChatAttachment[];
  /** Add attachment handler */
  onAddAttachment?: (files: File[]) => void;
  /** Remove attachment handler */
  onRemoveAttachment?: (id: string) => void;
  /** Sending state */
  isSending?: boolean;
  /** Error state */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Auto-focus input */
  autoFocus?: boolean;
  /** Max character length */
  maxLength?: number;
  /** Show character count */
  showCharCount?: boolean;
  /** Available commands */
  commands?: Array<{ name: string; description: string }>;
  /** Available mentions */
  mentions?: Array<{ id: string; name: string; handle: string; avatar?: string }>;
  /** Additional className */
  className?: string;
}

/**
 * ChatComposer - Rich chat input
 */
const ChatComposer: React.FC<ChatComposerProps> = ({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  replyTo,
  onCancelReply,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  isSending = false,
  error,
  disabled = false,
  autoFocus = false,
  maxLength,
  showCharCount = false,
  className,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  // Handle submit
  const handleSubmit = () => {
    if (!value.trim() && attachments.length === 0) return;
    if (isSending || disabled) return;

    onSubmit?.({
      content: value,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: replyTo?.id,
    });
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && replyTo) {
      onCancelReply?.();
    }
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddAttachment?.(files);
    }
    e.target.value = '';
  };

  const hasContent = value.trim().length > 0 || attachments.length > 0;
  const isOverLimit = maxLength && value.length > maxLength;

  return (
    <div
      className={cn(
        'bg-[var(--color-bg-elevated)] border rounded-2xl overflow-hidden transition-colors',
        error ? 'border-red-500' : 'border-[var(--color-border)]',
        disabled && 'opacity-50',
        className
      )}
    >
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-hover)] border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            <Text size="xs" tone="muted" className="truncate">
              Replying to <span className="font-medium text-white">{replyTo.authorName}</span>
            </Text>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[var(--color-text-muted)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <Text size="xs" className="max-w-[120px] truncate">
                {file.name}
              </Text>
              {file.progress !== undefined && file.progress < 100 ? (
                <Text size="xs" tone="muted">{file.progress}%</Text>
              ) : (
                <button
                  onClick={() => onRemoveAttachment?.(file.id)}
                  className="p-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors text-[var(--color-text-muted)] hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          autoFocus={autoFocus}
          rows={1}
          className={cn(
            'flex-1 bg-transparent border-none outline-none resize-none',
            'text-sm placeholder:text-[var(--color-text-muted)]',
            'min-h-[24px] max-h-[200px]',
            'disabled:cursor-not-allowed'
          )}
        />

        {/* Character count */}
        {showCharCount && maxLength && (
          <Text
            size="xs"
            tone={isOverLimit ? undefined : 'muted'}
            className={cn(isOverLimit && 'text-red-500')}
          >
            {value.length}/{maxLength}
          </Text>
        )}

        {/* Send button */}
        <Button
          variant={hasContent && !isOverLimit ? 'cta' : 'ghost'}
          size="sm"
          onClick={handleSubmit}
          disabled={!hasContent || isOverLimit || isSending || disabled}
          className="flex-shrink-0"
        >
          {isSending ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          ) : (
            'Send'
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 pb-3">
          <Text size="xs" className="text-red-500">
            {error}
          </Text>
        </div>
      )}
    </div>
  );
};

ChatComposer.displayName = 'ChatComposer';

/**
 * ChatComposerMinimal - Compact version
 */
export interface ChatComposerMinimalProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const ChatComposerMinimal: React.FC<ChatComposerMinimalProps> = ({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Message...',
  disabled = false,
  className,
}) => {
  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 h-10 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl',
        disabled && 'opacity-50',
        className
      )}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[var(--color-text-muted)]"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          value.trim()
            ? 'text-life-gold hover:bg-life-gold/10'
            : 'text-[var(--color-text-muted)]'
        )}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </div>
  );
};

ChatComposerMinimal.displayName = 'ChatComposerMinimal';

export { ChatComposer, ChatComposerMinimal };
