'use client';

/**
 * HeroInput - Distinctive chat input for Spaces
 *
 * Design Direction:
 * - 56px minimum height (feels substantial, not an afterthought)
 * - Background: #141414 (slightly elevated)
 * - Border: 1px #2E2E33, gold glow on focus
 * - Radius: 12px
 * - Placeholder: "Message #general..." (tells you where you are)
 *
 * Actions below input:
 * - 📎 — Attach file
 * - / — Slash commands
 * - @ — Mentions
 * - ⚡ — Tools panel
 * - 👥 — Members panel
 * - 📅 — Events panel
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  AtSign,
  Zap,
  Users,
  Calendar,
  Slash,
  X,
  Smile,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface HeroInputProps {
  /** Board/channel name for placeholder */
  boardName?: string;
  /** Value (controlled) */
  value?: string;
  /** onChange handler */
  onChange?: (value: string) => void;
  /** Submit handler */
  onSubmit?: (content: string) => void;
  /** Attach file handler */
  onAttach?: () => void;
  /** Mentions handler */
  onMention?: () => void;
  /** Tools panel handler */
  onOpenTools?: () => void;
  /** Members panel handler */
  onOpenMembers?: () => void;
  /** Events panel handler */
  onOpenEvents?: () => void;
  /** Emoji picker handler */
  onOpenEmoji?: () => void;
  /** Slash command handler */
  onSlashCommand?: (command: string) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether currently sending */
  isSending?: boolean;
  /** Max character length */
  maxLength?: number;
  /** Reply preview (when replying to a message) */
  replyTo?: {
    id: string;
    authorName: string;
    preview: string;
  };
  /** Cancel reply handler */
  onCancelReply?: () => void;
  /** Additional className */
  className?: string;
}

export interface HeroInputHandle {
  focus: () => void;
  clear: () => void;
  setValue: (value: string) => void;
}

// ============================================================
// Component
// ============================================================

export const HeroInput = React.forwardRef<HeroInputHandle, HeroInputProps>(
  function HeroInput(
    {
      boardName = 'general',
      value: controlledValue,
      onChange,
      onSubmit,
      onAttach,
      onMention,
      onOpenTools,
      onOpenMembers,
      onOpenEvents,
      onOpenEmoji,
      onSlashCommand,
      disabled = false,
      isSending = false,
      maxLength = 2000,
      replyTo,
      onCancelReply,
      className,
    },
    ref
  ) {
    const [internalValue, setInternalValue] = React.useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    // Controlled/uncontrolled value handling
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const setValue = (newValue: string) => {
      if (onChange) {
        onChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    };

    // Expose imperative methods
    React.useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      clear: () => {
        setValue('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      },
      setValue: (newValue: string) => setValue(newValue),
    }));

    // Auto-resize textarea
    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        // Min 56px, max 200px
        textarea.style.height = `${Math.min(Math.max(scrollHeight, 56), 200)}px`;
      }
    }, [value]);

    // Handle submit
    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || disabled || isSending) return;

      // Check for slash command
      if (trimmed.startsWith('/') && onSlashCommand) {
        onSlashCommand(trimmed);
      } else if (onSubmit) {
        onSubmit(trimmed);
      }

      setValue('');
    };

    // Handle key down
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const canSubmit = value.trim().length > 0 && !disabled && !isSending;

    return (
      <div className={cn('px-4 pb-4', className)}>
        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 mb-2 rounded-t-xl',
                  'bg-[#1A1A1A] border border-b-0 border-[#2A2A2A]'
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#818187]">Replying to </span>
                  <span className="text-xs font-medium text-[#A1A1A6]">
                    {replyTo.authorName}
                  </span>
                  <p className="text-xs text-[#818187] truncate mt-0.5">
                    {replyTo.preview}
                  </p>
                </div>
                {onCancelReply && (
                  <button
                    onClick={onCancelReply}
                    className="p-1 rounded text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]"
                    aria-label="Cancel reply"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input container */}
        <motion.div
          className={cn(
            'relative rounded-xl overflow-hidden',
            'bg-[#141414] border transition-all duration-200',
            isFocused
              ? 'border-[#3A3A3A] shadow-[0_0_0_3px_rgba(255,215,0,0.15)]'
              : 'border-[#2A2A2A]',
            disabled && 'opacity-50 cursor-not-allowed',
            replyTo && 'rounded-t-none'
          )}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Message #${boardName}...`}
            disabled={disabled || isSending}
            maxLength={maxLength}
            rows={1}
            className={cn(
              'w-full px-4 py-4 pr-14',
              'bg-transparent text-[#FAFAFA] placeholder:text-[#818187]',
              'resize-none outline-none',
              'text-[15px] leading-relaxed',
              'min-h-[56px]'
            )}
          />

          {/* Send button */}
          <div className="absolute right-3 bottom-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg',
                'transition-all duration-150',
                canSubmit
                  ? 'bg-[#FFD700] text-[#0A0A0A] shadow-sm hover:brightness-110'
                  : 'bg-[#2A2A2A] text-[#818187] cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Action buttons row */}
        <div className="flex items-center gap-1 mt-2 px-1">
          {/* Attach file */}
          {onAttach && (
            <ActionButton
              onClick={onAttach}
              icon={<Paperclip className="w-4 h-4" />}
              label="Attach file"
              disabled={disabled}
            />
          )}

          {/* Slash commands */}
          <ActionButton
            onClick={() => {
              setValue(value + '/');
              textareaRef.current?.focus();
            }}
            icon={<Slash className="w-4 h-4" />}
            label="Slash commands"
            disabled={disabled}
          />

          {/* Mentions */}
          {onMention && (
            <ActionButton
              onClick={onMention}
              icon={<AtSign className="w-4 h-4" />}
              label="Mention someone"
              disabled={disabled}
            />
          )}

          {/* Emoji */}
          {onOpenEmoji && (
            <ActionButton
              onClick={onOpenEmoji}
              icon={<Smile className="w-4 h-4" />}
              label="Add emoji"
              disabled={disabled}
            />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tools panel */}
          {onOpenTools && (
            <ActionButton
              onClick={onOpenTools}
              icon={<Zap className="w-4 h-4" />}
              label="Tools"
              disabled={disabled}
              shortcut="⌘T"
            />
          )}

          {/* Members panel */}
          {onOpenMembers && (
            <ActionButton
              onClick={onOpenMembers}
              icon={<Users className="w-4 h-4" />}
              label="Members"
              disabled={disabled}
              shortcut="⌘M"
            />
          )}

          {/* Events panel */}
          {onOpenEvents && (
            <ActionButton
              onClick={onOpenEvents}
              icon={<Calendar className="w-4 h-4" />}
              label="Events"
              disabled={disabled}
              shortcut="⌘E"
            />
          )}
        </div>

        {/* Typing indicator slot */}
        <div className="h-6 px-1 mt-1">
          {/* Typing users will be rendered here by parent */}
        </div>
      </div>
    );
  }
);

// ============================================================
// Action Button Component
// ============================================================

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  shortcut?: string;
}

function ActionButton({
  onClick,
  icon,
  label,
  disabled,
  shortcut,
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-lg',
        'text-[#818187] hover:text-[#FAFAFA]',
        'hover:bg-white/[0.04]',
        'transition-colors duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={label}
    >
      {icon}
      {shortcut && (
        <span className="text-[10px] text-[#52525B]">{shortcut}</span>
      )}
    </motion.button>
  );
}

export default HeroInput;
