'use client';

/**
 * SpaceSidebar - Navigation Sidebar Shell
 *
 * Contains:
 * - Boards list (with unread badges)
 * - Pinned tools section
 * - Members preview (online count + avatars)
 *
 * 200px width, 12px padding
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  SPACE_LAYOUT,
  SPACE_TYPOGRAPHY,
  spaceTypographyClasses,
} from '@hive/tokens';
import { BoardsList, type BoardsListProps } from './sidebar/boards-list';
import { ToolsList, type ToolsListProps } from './sidebar/tools-list';
import { MembersPreview, type MembersPreviewProps } from './sidebar/members-preview';

interface SpaceSidebarProps {
  /** Boards section props */
  boards: BoardsListProps;
  /** Tools section props (optional) */
  tools?: ToolsListProps;
  /** Members preview props */
  members: MembersPreviewProps;
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean;
  /** Additional class names */
  className?: string;
}

export function SpaceSidebar({
  boards,
  tools,
  members,
  isCollapsed = false,
  className,
}: SpaceSidebarProps) {
  // Collapsed state: show only icons
  if (isCollapsed) {
    return (
      <div className={cn('flex flex-col items-center gap-2 py-2', className)}>
        {/* Collapsed board icons would go here */}
        {boards.boards.slice(0, 5).map((board) => (
          <button
            key={board.id}
            onClick={() => boards.onBoardChange(board.id)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'transition-colors relative',
              board.id === boards.activeBoard
                ? 'bg-white/[0.08] text-white'
                : 'hover:bg-white/[0.04] text-white/50'
            )}
            title={board.name}
          >
            <span className="text-sm font-medium">#</span>
            {board.unreadCount && board.unreadCount > 0 && board.id !== boards.activeBoard && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-gold)]" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      style={{ gap: `${SPACE_LAYOUT.sectionGap}px` }}
    >
      {/* Boards Section */}
      <section>
        <h3 className={cn(spaceTypographyClasses.sectionLabel, 'mb-3 px-1')}>
          Boards
        </h3>
        <BoardsList {...boards} />
      </section>

      {/* Tools Section (if provided) */}
      {tools && (tools.tools.length > 0 || tools.isLeader) && (
        <section>
          <h3 className={cn(spaceTypographyClasses.sectionLabel, 'mb-3 px-1')}>
            Tools
          </h3>
          <ToolsList {...tools} />
        </section>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Members Preview - Bottom */}
      <section className="pt-4 border-t border-white/[0.06]">
        <MembersPreview {...members} />
      </section>
    </div>
  );
}

SpaceSidebar.displayName = 'SpaceSidebar';

export default SpaceSidebar;
