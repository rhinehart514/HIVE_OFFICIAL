'use client';

/**
 * MentionAutocomplete Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P1 Blocker - @user mention dropdown for chat.
 * Two variants: basic (names only), preview (with avatar & status).
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text, SimpleAvatar } from '../primitives';

export interface MentionUser {
  id: string;
  name: string;
  handle?: string;
  avatar?: string | null;
  status?: 'online' | 'away' | 'offline';
}

export interface MentionAutocompleteProps {
  /** List of users to show */
  users: MentionUser[];
  /** Currently selected index */
  selectedIndex?: number;
  /** Callback when user is selected */
  onSelect: (user: MentionUser) => void;
  /** Variant type */
  variant?: 'basic' | 'preview';
  /** Search query (for highlighting) */
  query?: string;
  /** Loading state */
  loading?: boolean;
  /** Position relative to input */
  position?: { top: number; left: number } | null;
  /** Max height */
  maxHeight?: number;
  /** Additional className */
  className?: string;
}

const statusColors: Record<string, string> = {
  online: 'bg-[var(--color-accent-gold)]',
  away: 'bg-[var(--color-accent-gold)]/50',
  offline: 'bg-[var(--color-text-muted)]',
};

/**
 * MentionAutocomplete - Main component
 */
const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  users,
  selectedIndex = -1,
  onSelect,
  variant = 'preview',
  query = '',
  loading = false,
  position,
  maxHeight = 240,
  className,
}) => {
  const listRef = React.useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-[var(--color-accent-gold)] font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (users.length === 0 && !loading) {
    return null;
  }

  const content = (
    <div
      ref={listRef}
      className={cn(
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        'rounded-lg shadow-lg overflow-hidden',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        className
      )}
      style={{ maxHeight }}
      role="listbox"
      aria-label="User mentions"
    >
      {loading ? (
        <div className="flex items-center justify-center py-4 px-3">
          <div className="h-4 w-4 border-2 border-[var(--color-border)] border-t-white rounded-full animate-spin" />
          <Text size="sm" tone="muted" className="ml-2">
            Searching...
          </Text>
        </div>
      ) : variant === 'basic' ? (
        // Basic variant - names only
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              data-index={index}
              onClick={() => onSelect(user)}
              className={cn(
                'w-full text-left px-3 py-2',
                'transition-colors duration-[var(--duration-snap)]',
                'focus-visible:outline-none',
                index === selectedIndex
                  ? 'bg-[var(--color-bg-hover)]'
                  : 'hover:bg-[var(--color-bg-hover)]'
              )}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <Text size="sm">{highlightMatch(user.name)}</Text>
              {user.handle && (
                <Text size="xs" tone="muted" className="ml-2">
                  @{highlightMatch(user.handle)}
                </Text>
              )}
            </button>
          ))}
        </div>
      ) : (
        // Preview variant - with avatar & status
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              data-index={index}
              onClick={() => onSelect(user)}
              className={cn(
                'w-full text-left px-3 py-2',
                'flex items-center gap-3',
                'transition-colors duration-[var(--duration-snap)]',
                'focus-visible:outline-none',
                index === selectedIndex
                  ? 'bg-[var(--color-bg-hover)]'
                  : 'hover:bg-[var(--color-bg-hover)]'
              )}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="relative flex-shrink-0">
                <SimpleAvatar
                  src={user.avatar}
                  fallback={user.name}
                  size="sm"
                />
                {user.status && (
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5',
                      'h-2.5 w-2.5 rounded-full',
                      'border-2 border-[var(--color-bg-elevated)]',
                      statusColors[user.status]
                    )}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Text size="sm" weight="medium" className="truncate">
                  {highlightMatch(user.name)}
                </Text>
                {user.handle && (
                  <Text size="xs" tone="muted" className="truncate">
                    @{highlightMatch(user.handle)}
                  </Text>
                )}
              </div>
              {user.status === 'online' && (
                <span className="flex-shrink-0">
                  <Text size="xs" className="text-[var(--color-accent-gold)]">
                    Online
                  </Text>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {users.length === 0 && !loading && (
        <div className="py-4 px-3 text-center">
          <Text size="sm" tone="muted">
            No users found
          </Text>
        </div>
      )}
    </div>
  );

  // If position is provided, render as absolute positioned
  if (position) {
    return (
      <div
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          zIndex: 50,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

MentionAutocomplete.displayName = 'MentionAutocomplete';

/**
 * useMentionAutocomplete - Hook for managing mention state
 */
export interface UseMentionAutocompleteOptions {
  users: MentionUser[];
  onMention: (user: MentionUser) => void;
}

export interface UseMentionAutocompleteReturn {
  isOpen: boolean;
  query: string;
  filteredUsers: MentionUser[];
  selectedIndex: number;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleInputChange: (value: string, cursorPosition: number) => void;
  selectUser: (user: MentionUser) => void;
  close: () => void;
}

const useMentionAutocomplete = ({
  users,
  onMention,
}: UseMentionAutocompleteOptions): UseMentionAutocompleteReturn => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Filter users based on query
  const filteredUsers = React.useMemo(() => {
    if (!query) return users.slice(0, 8);
    const lowerQuery = query.toLowerCase();
    return users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.handle?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8);
  }, [users, query]);

  // Reset selected index when filtered users change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredUsers]);

  const handleInputChange = (value: string, cursorPosition: number) => {
    // Find @ before cursor
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setIsOpen(true);
      setQuery(mentionMatch[1]);
    } else {
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        if (filteredUsers[selectedIndex]) {
          e.preventDefault();
          selectUser(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  const selectUser = (user: MentionUser) => {
    onMention(user);
    close();
  };

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  return {
    isOpen,
    query,
    filteredUsers,
    selectedIndex,
    handleKeyDown,
    handleInputChange,
    selectUser,
    close,
  };
};

export { MentionAutocomplete, useMentionAutocomplete };
