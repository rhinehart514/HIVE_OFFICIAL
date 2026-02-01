'use client';

/**
 * BoardsList - Reorderable list of boards
 *
 * Features:
 * - Active board highlight
 * - Unread badges
 * - Drag-to-reorder (leaders only)
 * - Add board button (leaders only)
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { Reorder } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoardItem, type Board } from './board-item';

export interface BoardsListProps {
  boards: Board[];
  activeBoard: string;
  onBoardChange: (boardId: string) => void;
  /** For leaders only */
  onCreateBoard?: () => void;
  /** For leaders only */
  onReorderBoards?: (boardIds: string[]) => void;
  /** Board options handler */
  onBoardOptions?: (boardId: string) => void;
}

export function BoardsList({
  boards,
  activeBoard,
  onBoardChange,
  onCreateBoard,
  onReorderBoards,
  onBoardOptions,
}: BoardsListProps) {
  const [localBoards, setLocalBoards] = React.useState(boards);
  const canReorder = !!onReorderBoards;

  // Sync local boards with prop changes
  React.useEffect(() => {
    setLocalBoards(boards);
  }, [boards]);

  const handleReorder = (newOrder: Board[]) => {
    setLocalBoards(newOrder);
    if (onReorderBoards) {
      onReorderBoards(newOrder.map((b) => b.id));
    }
  };

  if (canReorder) {
    return (
      <div className="space-y-1">
        <Reorder.Group
          axis="y"
          values={localBoards}
          onReorder={handleReorder}
          className="space-y-1"
        >
          {localBoards.map((board) => (
            <Reorder.Item key={board.id} value={board}>
              <BoardItem
                board={board}
                isActive={board.id === activeBoard}
                showDragHandle={true}
                onClick={() => onBoardChange(board.id)}
                onOptionsClick={
                  onBoardOptions ? () => onBoardOptions(board.id) : undefined
                }
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add board button */}
        {onCreateBoard && (
          <button
            onClick={onCreateBoard}
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'flex items-center gap-2',
              'text-white/40 hover:text-white/60',
              'hover:bg-white/[0.04]',
              'transition-all duration-150',
              'border border-dashed border-white/[0.06] hover:border-white/[0.12]',
              'mt-2'
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add board</span>
          </button>
        )}
      </div>
    );
  }

  // Non-reorderable list (regular members)
  return (
    <div className="space-y-1">
      {localBoards.map((board) => (
        <BoardItem
          key={board.id}
          board={board}
          isActive={board.id === activeBoard}
          onClick={() => onBoardChange(board.id)}
          onOptionsClick={
            onBoardOptions ? () => onBoardOptions(board.id) : undefined
          }
        />
      ))}
    </div>
  );
}

BoardsList.displayName = 'BoardsList';

export default BoardsList;
