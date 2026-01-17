'use client';

/**
 * TagInput Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Multi-value input for tags, interests, or categories.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * EMPTY STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Add tags...                                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Placeholder text in muted color
 * - Input field styled like standard input
 * - Border: var(--color-border)
 *
 * WITH TAGS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌─────────┐ ┌─────────────┐ ┌──────────┐                              │
 * │  │ React ✕ │ │ TypeScript ✕ │ │ Node.js ✕ │  Add more...               │
 * │  └─────────┘ └─────────────┘ └──────────┘                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Tags as rounded pills
 * - Each tag has: text + remove button (✕)
 * - Input field for adding more after tags
 *
 * INDIVIDUAL TAG:
 * ┌─────────────────────┐
 * │  React           ✕  │
 * └─────────────────────┘
 *      │              │
 *      │              └── Remove button (appears on hover or always)
 *      └── Tag text
 *
 * TAG VARIANTS:
 * - Default: bg-elevated, border, muted text
 * - Primary: bg-primary/10, primary border
 * - Gold: bg-gold/20, gold text (for special tags)
 *
 * WITH SUGGESTIONS DROPDOWN:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌─────────┐ ┌──────────┐  type|                                       │
 * │  │ React ✕ │ │ Vue ✕    │                                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  ┌──────────────────────────────────────────┐                          │
 * │  │  TypeScript                              │                          │
 * │  │  Tailwind                                │                          │
 * │  │  Testing Library                         │                          │
 * │  └──────────────────────────────────────────┘                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * STATES:
 * - Default: Normal input styling
 * - Focused: White focus ring (NOT gold)
 * - Disabled: 50% opacity, no interaction
 * - Error: Red border, error text below
 * - Max reached: Input hidden, "Max X tags" shown
 *
 * KEYBOARD:
 * - Enter: Add current text as tag
 * - Backspace on empty: Remove last tag
 * - Arrow keys: Navigate suggestions
 * - Escape: Close suggestions
 *
 * COLORS:
 * - Tag background: var(--color-bg-elevated)
 * - Tag border: var(--color-border)
 * - Remove button: muted → white on hover
 * - Gold variant: #FFD700/20 background
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const tagVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white',
        primary: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',
        gold: 'bg-life-gold/20 border border-life-gold/30 text-life-gold',
        muted: 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        default: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TagInputProps extends VariantProps<typeof tagVariants> {
  /** Current tags */
  value: string[];
  /** Change handler */
  onChange: (tags: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum number of tags */
  max?: number;
  /** Suggestions list */
  suggestions?: string[];
  /** Show suggestions on focus */
  showSuggestionsOnFocus?: boolean;
  /** Allow custom tags (not in suggestions) */
  allowCustom?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Additional className */
  className?: string;
}

/**
 * TagInput - Multi-value tag input
 */
const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = 'Add tags...',
  max,
  suggestions = [],
  showSuggestionsOnFocus = false,
  allowCustom = true,
  disabled = false,
  error,
  variant = 'default',
  size = 'default',
  className,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isMaxReached = max !== undefined && value.length >= max;

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(s)
  );

  // Add a tag
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (isMaxReached) return;
    if (!allowCustom && !suggestions.includes(trimmed)) return;

    onChange([...value, trimmed]);
    setInputValue('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Close suggestions on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 p-2 min-h-[42px]',
          'bg-[var(--color-bg-elevated)] border rounded-xl transition-colors',
          error ? 'border-red-500' : 'border-[var(--color-border)]',
          disabled && 'opacity-50 cursor-not-allowed',
          'focus-within:ring-2 focus-within:ring-white/20'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tags */}
        {value.map((tag) => (
          <div key={tag} className={tagVariants({ variant, size })}>
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="p-0.5 rounded hover:bg-white/10 transition-colors text-[var(--color-text-muted)] hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Input */}
        {!isMaxReached && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => showSuggestionsOnFocus && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled}
            className={cn(
              'flex-1 min-w-[120px] bg-transparent border-none outline-none',
              'text-sm placeholder:text-[var(--color-text-muted)]',
              disabled && 'cursor-not-allowed'
            )}
          />
        )}

        {/* Max indicator */}
        {isMaxReached && (
          <Text size="xs" tone="muted">
            Max {max} tags
          </Text>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                index === highlightedIndex
                  ? 'bg-white/10 text-white'
                  : 'hover:bg-white/5'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <Text size="xs" className="mt-1 text-red-500">
          {error}
        </Text>
      )}
    </div>
  );
};

TagInput.displayName = 'TagInput';

/**
 * Tag - Standalone tag component
 */
export interface TagProps extends VariantProps<typeof tagVariants> {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

const Tag: React.FC<TagProps> = ({
  children,
  onRemove,
  variant,
  size,
  className,
}) => (
  <div className={cn(tagVariants({ variant, size }), className)}>
    <span>{children}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-white/10 transition-colors text-[var(--color-text-muted)] hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

Tag.displayName = 'Tag';

export { TagInput, Tag, tagVariants };
