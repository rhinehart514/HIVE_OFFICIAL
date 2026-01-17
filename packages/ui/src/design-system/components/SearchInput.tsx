'use client';

/**
 * SearchInput Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Expandable search input for navigation and filtering contexts.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * COLLAPSED STATE (icon-only):
 * ┌──────┐
 * │  🔍  │   40x40px ghost button, rounded-xl, magnifying glass icon
 * └──────┘   Hover: bg-[var(--color-bg-hover)]
 *
 * EXPANDED STATE:
 * ┌─────────────────────────────────────────────┐
 * │  🔍  Search...                          ✕   │
 * └─────────────────────────────────────────────┘
 * - Height: 40px (h-10)
 * - Width: 240px default, configurable
 * - Background: var(--color-bg-elevated)
 * - Border: 1px var(--color-border), focus: white/50 ring
 * - Icon: left-aligned, text-muted
 * - Clear button: appears when value exists, right-aligned
 * - Border-radius: rounded-xl (12px)
 *
 * LOADING STATE:
 * ┌─────────────────────────────────────────────┐
 * │  ⟳  Searching...                            │
 * └─────────────────────────────────────────────┘
 * - Spinner replaces search icon
 * - Input disabled during search
 *
 * COLORS:
 * - Background: #141414 (--color-bg-elevated)
 * - Border: rgba(255,255,255,0.08) (--color-border)
 * - Text: #FAFAFA (--color-text-primary)
 * - Placeholder: #818187 (--color-text-muted)
 * - Focus ring: rgba(255,255,255,0.5) - WHITE, never gold
 *
 * ANIMATION:
 * - Expand: 200ms ease-out width transition
 * - Focus: 150ms border color transition
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

export interface SearchInputProps {
  /** Current search value */
  value?: string;
  /** Value change handler */
  onChange?: (value: string) => void;
  /** Search submit handler (on Enter) */
  onSearch?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether search is in progress */
  loading?: boolean;
  /** Expandable mode (starts as icon) */
  expandable?: boolean;
  /** Default expanded state (for expandable mode) */
  defaultExpanded?: boolean;
  /** Width when expanded */
  width?: number | string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Auto focus on expand */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 text-xs',
  default: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

const iconSizes = {
  sm: 'w-4 h-4',
  default: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * SearchInput - Main component
 */
const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  loading = false,
  expandable = false,
  defaultExpanded = true,
  width = 240,
  size = 'default',
  disabled = false,
  autoFocus = false,
  className,
}) => {
  const [expanded, setExpanded] = React.useState(!expandable || defaultExpanded);
  const [localValue, setLocalValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle expand
  const handleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Handle collapse (only if expandable and empty)
  const handleBlur = () => {
    if (expandable && !localValue) {
      setExpanded(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  // Handle clear
  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && localValue) {
      onSearch?.(localValue);
    }
    if (e.key === 'Escape') {
      if (localValue) {
        handleClear();
      } else if (expandable) {
        setExpanded(false);
        inputRef.current?.blur();
      }
    }
  };

  // Collapsed state (icon button)
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center',
          sizeStyles[size],
          size === 'sm' ? 'w-8' : size === 'lg' ? 'w-12' : 'w-10',
          'rounded-xl',
          'bg-transparent hover:bg-[var(--color-bg-hover)]',
          'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
          'transition-colors duration-[var(--duration-snap)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-label="Open search"
      >
        <SearchIcon className={iconSizes[size]} />
      </button>
    );
  }

  // Expanded state
  return (
    <div
      className={cn(
        'relative flex items-center',
        sizeStyles[size],
        'rounded-xl',
        'bg-[var(--color-bg-elevated)]',
        'border border-[var(--color-border)]',
        'focus-within:ring-2 focus-within:ring-white/50',
        'transition-all duration-200 ease-out',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
    >
      {/* Search/Loading icon */}
      <div className="flex-shrink-0 pl-3">
        {loading ? (
          <div
            className={cn(
              iconSizes[size],
              'border-2 border-[var(--color-border)] border-t-white rounded-full animate-spin'
            )}
          />
        ) : (
          <SearchIcon
            className={cn(iconSizes[size], 'text-[var(--color-text-muted)]')}
          />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        autoFocus={autoFocus}
        className={cn(
          'flex-1 bg-transparent px-3 outline-none',
          'text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-muted)]',
          'disabled:cursor-not-allowed'
        )}
        aria-label="Search"
      />

      {/* Clear button */}
      {localValue && !loading && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'flex-shrink-0 pr-3',
            'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
            'transition-colors duration-[var(--duration-snap)]'
          )}
          aria-label="Clear search"
        >
          <CloseIcon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
      )}
    </div>
  );
};

SearchInput.displayName = 'SearchInput';

/**
 * Simple icons
 */
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export { SearchInput };
