'use client';

/**
 * BoardHeader - Header for active board
 *
 * Shows:
 * - Board name with # prefix
 * - Search action
 * - Board-specific actions
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { Search, MoreHorizontal, Pin, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui';
import { SPACE_COLORS } from '@hive/tokens';

interface BoardHeaderProps {
  boardName: string;
  isPinned?: boolean;
  isMuted?: boolean;
  onSearch?: () => void;
  onTogglePin?: () => void;
  onToggleMute?: () => void;
  onOptions?: () => void;
  className?: string;
}

export function BoardHeader({
  boardName,
  isPinned = false,
  isMuted = false,
  onSearch,
  onTogglePin,
  onToggleMute,
  onOptions,
  className,
}: BoardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b',
        className
      )}
      style={{ borderColor: SPACE_COLORS.borderSubtle }}
    >
      {/* Left: Board name */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-white/40 text-lg">#</span>
        <h2 className="text-base font-medium text-white truncate">
          {boardName}
        </h2>
        {isPinned && (
          <Pin className="w-3.5 h-3.5 text-[var(--color-gold)]/60" />
        )}
        {isMuted && (
          <BellOff className="w-3.5 h-3.5 text-white/30" />
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearch}
            className="text-white/40 hover:text-white/60 px-2"
            title="Search in board"
          >
            <Search className="w-4 h-4" />
          </Button>
        )}

        {onOptions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOptions}
            className="text-white/40 hover:text-white/60 px-2"
            title="Board options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

BoardHeader.displayName = 'BoardHeader';

export default BoardHeader;
