'use client';

/**
 * ReactionPicker Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P0 Blocker - Used in Spaces/Chat for message reactions.
 * Three variants: minimal (quick picks), grid (full), popover (positioned).
 */

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../../lib/utils';
import { Text, Button } from '../primitives';

// Default quick-pick emojis
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Full emoji grid (categorized)
const EMOJI_CATEGORIES = {
  recent: ['👍', '❤️', '😂', '🔥', '👀', '🙌'],
  smileys: ['😊', '😂', '🥹', '😍', '🤔', '😅', '😭', '🥳', '😎', '🫡'],
  gestures: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤘', '💪', '🙏', '👀'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖'],
  symbols: ['✅', '❌', '⭐', '🔥', '💯', '🎉', '🚀', '💡', '⚡', '🏆'],
};

export interface ReactionPickerProps {
  /** Selected emoji callback */
  onSelect: (emoji: string) => void;
  /** Variant type */
  variant?: 'minimal' | 'grid' | 'popover';
  /** Quick-pick emojis (for minimal variant) */
  quickEmojis?: string[];
  /** Trigger element (for popover variant) */
  trigger?: React.ReactNode;
  /** Currently selected emoji (for highlighting) */
  selected?: string;
  /** Additional className */
  className?: string;
}

/**
 * EmojiButton - Reusable emoji button
 */
const EmojiButton: React.FC<{
  emoji: string;
  onClick: () => void;
  selected?: boolean;
  size?: 'sm' | 'default';
}> = ({ emoji, onClick, selected, size = 'default' }) => (
  <button
    type="button"
    className={cn(
      'flex items-center justify-center rounded-lg',
      'transition-all duration-[var(--duration-snap)]',
      'hover:bg-[var(--color-bg-elevated)] hover:opacity-90',
      'active:opacity-80',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
      selected && 'bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-accent-gold)]/30',
      size === 'sm' ? 'w-8 h-8 text-lg' : 'w-10 h-10 text-xl'
    )}
    onClick={onClick}
    aria-label={`React with ${emoji}`}
  >
    {emoji}
  </button>
);

/**
 * ReactionPickerMinimal - Quick emoji bar
 */
const ReactionPickerMinimal: React.FC<Omit<ReactionPickerProps, 'variant' | 'trigger'>> = ({
  onSelect,
  quickEmojis = QUICK_EMOJIS,
  selected,
  className,
}) => (
  <div
    className={cn(
      'inline-flex items-center gap-1 p-1',
      'bg-[var(--color-bg-card)] rounded-xl',
      'border border-[var(--color-border)]',
      'shadow-lg',
      className
    )}
    role="group"
    aria-label="Quick reactions"
  >
    {quickEmojis.map((emoji) => (
      <EmojiButton
        key={emoji}
        emoji={emoji}
        onClick={() => onSelect(emoji)}
        selected={emoji === selected}
        size="sm"
      />
    ))}
  </div>
);

/**
 * ReactionPickerGrid - Full emoji grid with categories
 */
const ReactionPickerGrid: React.FC<Omit<ReactionPickerProps, 'variant' | 'trigger'>> = ({
  onSelect,
  selected,
  className,
}) => {
  const [category, setCategory] = React.useState<keyof typeof EMOJI_CATEGORIES>('recent');

  return (
    <div
      className={cn(
        'w-72 p-3',
        'bg-[var(--color-bg-card)] rounded-xl',
        'border border-[var(--color-border)]',
        'shadow-xl',
        className
      )}
    >
      {/* Category tabs */}
      <div className="flex gap-1 mb-3 pb-2 border-b border-[var(--color-border)]">
        {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((cat) => (
          <button
            key={cat}
            type="button"
            className={cn(
              'px-2 py-1 text-xs rounded-md capitalize',
              'transition-colors duration-[var(--duration-snap)]',
              category === cat
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-1">
        {EMOJI_CATEGORIES[category].map((emoji) => (
          <EmojiButton
            key={emoji}
            emoji={emoji}
            onClick={() => onSelect(emoji)}
            selected={emoji === selected}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * ReactionPickerPopover - Positioned popover with grid
 */
const ReactionPickerPopover: React.FC<ReactionPickerProps> = ({
  onSelect,
  trigger,
  selected,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <span className="text-lg">😊</span>
          </Button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          sideOffset={5}
          align="start"
        >
          <ReactionPickerGrid onSelect={handleSelect} selected={selected} />
          <Popover.Arrow className="fill-[var(--color-bg-card)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

/**
 * ReactionPicker - Main export with variant selection
 */
const ReactionPicker: React.FC<ReactionPickerProps> = ({
  variant = 'minimal',
  ...props
}) => {
  switch (variant) {
    case 'grid':
      return <ReactionPickerGrid {...props} />;
    case 'popover':
      return <ReactionPickerPopover {...props} />;
    case 'minimal':
    default:
      return <ReactionPickerMinimal {...props} />;
  }
};

ReactionPicker.displayName = 'ReactionPicker';

export {
  ReactionPicker,
  ReactionPickerMinimal,
  ReactionPickerGrid,
  ReactionPickerPopover,
  QUICK_EMOJIS,
  EMOJI_CATEGORIES,
};
