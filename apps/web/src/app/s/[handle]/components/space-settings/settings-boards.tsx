'use client';

import * as React from 'react';
import { Hash, Pencil, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, toast } from '@hive/ui';
import type { Board } from './types';

const inputClassName = cn(
  'w-full px-3 py-2',
  'rounded-lg text-sm',
  'bg-white/[0.05] border border-white/[0.05]',
  'text-white placeholder:text-white/50',
  'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
  'transition-colors duration-150'
);

interface SettingsBoardsProps {
  boards: Board[];
  isLeader: boolean;
  onBoardDelete?: (boardId: string) => Promise<void>;
  onBoardUpdate?: (
    boardId: string,
    updates: { name?: string; description?: string; isVisible?: boolean }
  ) => Promise<void>;
}

export function SettingsBoards({
  boards,
  isLeader,
  onBoardDelete,
  onBoardUpdate,
}: SettingsBoardsProps) {
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = React.useState<string | null>(null);
  const [boardEdits, setBoardEdits] = React.useState<
    Record<string, { name: string; description: string }>
  >({});

  const handleBoardDelete = async (boardId: string, boardName: string) => {
    if (!onBoardDelete) return;
    setDeletingBoardId(boardId);
    try {
      await onBoardDelete(boardId);
      toast.success('Board archived', `"${boardName}" has been archived`);
    } catch {
      toast.error('Failed to delete board', 'Please try again');
    } finally {
      setDeletingBoardId(null);
    }
  };

  const handleBoardEdit = (board: Board) => {
    setEditingBoardId(board.id);
    setBoardEdits({
      ...boardEdits,
      [board.id]: {
        name: board.name,
        description: board.description || '',
      },
    });
  };

  const handleBoardSave = async (boardId: string) => {
    if (!onBoardUpdate || !boardEdits[boardId]) return;
    const edits = boardEdits[boardId];
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;

    const updates: { name?: string; description?: string } = {};
    if (edits.name !== board.name) updates.name = edits.name;
    if (edits.description !== (board.description || '')) updates.description = edits.description;

    if (Object.keys(updates).length === 0) {
      setEditingBoardId(null);
      return;
    }

    try {
      await onBoardUpdate(boardId, updates);
      toast.success('Board updated', 'Changes saved successfully');
      setEditingBoardId(null);
    } catch {
      toast.error('Failed to update board', 'Please try again');
    }
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Board Management
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Organize and configure your space&apos;s boards
      </Text>

      {boards.length === 0 ? (
        <div className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.05]">
          <Text size="sm" tone="muted">No boards yet — add one to keep things organized</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.05]"
            >
              {editingBoardId === board.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2">
                      <Text size="xs" weight="medium" tone="muted">Name</Text>
                    </label>
                    <input
                      type="text"
                      value={boardEdits[board.id]?.name || ''}
                      onChange={(e) =>
                        setBoardEdits({
                          ...boardEdits,
                          [board.id]: { ...boardEdits[board.id], name: e.target.value },
                        })
                      }
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">
                      <Text size="xs" weight="medium" tone="muted">Description</Text>
                    </label>
                    <textarea
                      value={boardEdits[board.id]?.description || ''}
                      onChange={(e) =>
                        setBoardEdits({
                          ...boardEdits,
                          [board.id]: { ...boardEdits[board.id], description: e.target.value },
                        })
                      }
                      placeholder="What's this board for?"
                      rows={2}
                      className={cn(inputClassName, 'resize-none')}
                    />
                    <Text size="xs" tone="muted" className="mt-1">
                      {(boardEdits[board.id]?.description || '').length}/500 characters
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="cta" size="sm" onClick={() => handleBoardSave(board.id)}>
                      <Save className="w-3 h-3 mr-1.5" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingBoardId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Hash className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Text weight="medium">{board.name}</Text>
                      {board.description && (
                        <Text size="sm" tone="muted" className="mt-0.5 line-clamp-2">
                          {board.description}
                        </Text>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {board.isDefault && (
                          <Text size="xs" className="text-white/50">Default</Text>
                        )}
                        {board.isLocked && (
                          <Text size="xs" className="text-amber-400">Locked</Text>
                        )}
                        {board.isVisible === false && (
                          <Text size="xs" className="text-amber-400">Hidden</Text>
                        )}
                      </div>
                    </div>
                  </div>

                  {isLeader && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {onBoardUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBoardEdit(board)}
                          className="text-white/50 hover:text-white hover:bg-white/[0.10]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {!board.isDefault && onBoardDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBoardDelete(board.id, board.name)}
                          disabled={deletingBoardId === board.id}
                          className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {deletingBoardId === board.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLeader && (
        <Text size="sm" tone="muted" className="mt-4">
          Only space leaders can manage boards
        </Text>
      )}
    </>
  );
}
