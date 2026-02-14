'use client';

/**
 * Chat Search Modal
 *
 * Full-featured search for chat messages with filters.
 * Uses Modal primitive + search results with jump-to-message.
 */

import * as React from 'react';
import { Search, X, Filter, Calendar, User, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from '../../primitives/Modal';
import { Input } from '../../primitives/Input';
import { Button } from '../../primitives/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../../primitives/Avatar';
import { Text } from '../../primitives/Text';
import { Skeleton } from '../../primitives/Skeleton';

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================
// Types
// ============================================================

export interface SearchResultMessage {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  boardId?: string;
  boardName?: string;
}

export interface ChatSearchFilters {
  boardId?: string;
  authorId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ChatSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  boards?: Array<{ id: string; name: string }>;
  // Search state (controlled from hook)
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResultMessage[];
  totalCount: number;
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
  filters: ChatSearchFilters;
  onFiltersChange: (filters: ChatSearchFilters) => void;
  onSearch: () => void;
  onLoadMore: () => void;
  onClearSearch: () => void;
  // Navigation
  onJumpToMessage: (messageId: string, boardId?: string) => void;
}

// ============================================================
// Helpers
// ============================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-500/30 text-white rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// ============================================================
// Sub-components
// ============================================================

function SearchResultItem({
  message,
  query,
  onJump,
}: {
  message: SearchResultMessage;
  query: string;
  onJump: () => void;
}) {
  return (
    <button
      onClick={onJump}
      className={cn(
        'w-full text-left p-3 rounded-xl',
        'bg-white/[0.02] hover:bg-white/[0.05]',
        'border border-white/[0.04] hover:border-white/[0.06]',
        'transition-all duration-150',
        'group'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar size="sm">
          {message.author.avatarUrl && (
            <AvatarImage src={message.author.avatarUrl} alt={message.author.name} />
          )}
          <AvatarFallback>{getInitials(message.author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text size="sm" className="font-medium text-white">
              {message.author.name}
            </Text>
            {message.boardName && (
              <>
                <span className="text-white/20">in</span>
                <Text size="xs" className="text-white/50">
                  #{message.boardName}
                </Text>
              </>
            )}
            <Text size="xs" className="text-white/30 ml-auto">
              {formatDate(message.createdAt)}
            </Text>
          </div>
          <Text size="sm" className="text-white/70 line-clamp-2">
            {highlightMatch(message.content, query)}
          </Text>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageSquare className="w-4 h-4 text-white/40" />
        </div>
      </div>
    </button>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-white/30" />
      </div>
      {query ? (
        <>
          <Text className="text-white/70 font-medium mb-1">No messages found</Text>
          <Text size="sm" className="text-white/40 max-w-xs">
            No messages match "{query}". Try a different search term or adjust your filters.
          </Text>
          <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-xs">
            <Text size="xs" className="text-white/30 w-full mb-1">Try searching for:</Text>
            {['links', 'images', 'announcements'].map((suggestion) => (
              <span
                key={suggestion}
                className="px-2.5 py-1 rounded-full text-xs text-white/50 bg-white/[0.04] border border-white/[0.06]"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <Text className="text-white/70 font-medium mb-1">Search messages</Text>
          <Text size="sm" className="text-white/40">
            Enter at least 2 characters to search
          </Text>
        </>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ChatSearchModal({
  open,
  onOpenChange,
  spaceId,
  boards = [],
  query,
  onQueryChange,
  results,
  totalCount,
  hasMore,
  isSearching,
  error,
  filters,
  onFiltersChange,
  onSearch,
  onLoadMore,
  onClearSearch,
  onJumpToMessage,
}: ChatSearchModalProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  // Focus input on open
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Search on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      onSearch();
    }
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  // Jump to message and close modal
  const handleJump = (messageId: string, boardId?: string) => {
    onJumpToMessage(messageId, boardId);
    onOpenChange(false);
  };

  // Clear everything on close
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClearSearch();
    }
    onOpenChange(isOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="lg" className="max-h-[80vh] flex flex-col">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white/50" />
            Search Messages
          </ModalTitle>
        </ModalHeader>

        <ModalBody className="flex-1 flex flex-col min-h-0">
          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search messages..."
                className="pr-10"
              />
              {query && (
                <button
                  onClick={() => {
                    onQueryChange('');
                    onClearSearch();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant="default"
              size="default"
              onClick={onSearch}
              disabled={query.trim().length < 2 || isSearching}
            >
              Search
            </Button>
            {boards.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-white/10')}
              >
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters (collapsible) */}
          {showFilters && boards.length > 1 && (
            <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Text size="xs" className="text-white/50 mb-2">
                Filter by board
              </Text>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onFiltersChange({ ...filters, boardId: undefined })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    !filters.boardId
                      ? 'bg-white/10 text-white'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'
                  )}
                >
                  All boards
                </button>
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => onFiltersChange({ ...filters, boardId: board.id })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      filters.boardId === board.id
                        ? 'bg-white/10 text-white'
                        : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'
                    )}
                  >
                    #{board.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <Text size="sm" className="text-red-400">
                {error}
              </Text>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
            {/* Results count */}
            {results.length > 0 && (
              <Text size="xs" className="text-white/40 mb-3">
                {totalCount} {totalCount === 1 ? 'result' : 'results'}
              </Text>
            )}

            {/* Loading state */}
            {isSearching && results.length === 0 && (
              <div className="space-y-2">
                <SearchResultSkeleton />
                <SearchResultSkeleton />
                <SearchResultSkeleton />
              </div>
            )}

            {/* Empty state */}
            {!isSearching && results.length === 0 && <EmptyState query={query} />}

            {/* Results list */}
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((message) => (
                  <SearchResultItem
                    key={message.id}
                    message={message}
                    query={query}
                    onJump={() => handleJump(message.id, message.boardId)}
                  />
                ))}

                {/* Load more */}
                {hasMore && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLoadMore}
                      disabled={isSearching}
                      className="w-full"
                    >
                      {isSearching ? 'Loading...' : 'Load more results'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Keyboard hint */}
          <div className="pt-4 border-t border-white/5 mt-4">
            <Text size="xs" className="text-white/30">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50">Enter</kbd> to search,{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50">Esc</kbd> to close
            </Text>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ChatSearchModal;
