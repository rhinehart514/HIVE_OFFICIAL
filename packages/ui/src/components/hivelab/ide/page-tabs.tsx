'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { PlusIcon, TrashIcon, ClipboardDocumentIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '../../../lib/utils';
import type { Page } from './types';
import { FOCUS_RING } from '../tokens';

interface PageTabsProps {
  pages: Page[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, name: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
  onSetStartPage: (pageId: string) => void;
}

export function PageTabs({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onDuplicatePage,
  onReorderPages,
  onSetStartPage,
}: PageTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = useCallback((pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    setEditValue(page.name);
    setEditingId(pageId);
    setContextMenu(null);
  }, [pages]);

  const commitRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      onRenamePage(editingId, editValue.trim());
    }
    setEditingId(null);
  }, [editingId, editValue, onRenamePage]);

  const handleReorder = useCallback(
    (reordered: Page[]) => {
      // Find what moved by comparing order
      const oldIndex = pages.findIndex((p) => p.id !== reordered[pages.indexOf(p)]?.id);
      const newIndex = reordered.findIndex((p) => p.id === pages[oldIndex]?.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        onReorderPages(oldIndex, newIndex);
      }
    },
    [pages, onReorderPages]
  );

  return (
    <div
      className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-hide"
      style={{
        backgroundColor: 'var(--hivelab-bg)',
        borderBottom: '1px solid var(--hivelab-border)',
      }}
    >
      <Reorder.Group
        axis="x"
        values={pages}
        onReorder={handleReorder}
        className="flex items-center gap-0.5"
        as="div"
      >
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          const isEditing = page.id === editingId;

          return (
            <Reorder.Item
              key={page.id}
              value={page}
              as="div"
              dragListener={!isEditing}
            >
              <motion.button
                type="button"
                onClick={() => {
                  if (!isEditing) onSelectPage(page.id);
                }}
                onDoubleClick={() => startRename(page.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ pageId: page.id, x: e.clientX, y: e.clientY });
                }}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                  'transition-colors duration-150 cursor-pointer select-none whitespace-nowrap',
                  isActive
                    ? 'text-[var(--life-gold)]'
                    : 'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]'
                )}
                style={{
                  backgroundColor: isActive
                    ? 'rgba(212, 175, 55, 0.08)'
                    : 'transparent',
                }}
                layout
              >
                {page.isStartPage && (
                  <StarIconSolid className="h-3 w-3 text-[var(--life-gold)] flex-shrink-0" />
                )}
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className={cn(
                      'bg-transparent border-b border-[var(--life-gold)] text-xs font-medium w-20',
                      'outline-none text-[var(--hivelab-text-primary)]'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span>{page.name}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="page-tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[var(--life-gold)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Add page button */}
      <button
        type="button"
        onClick={onAddPage}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0',
          'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)]',
          'hover:bg-[var(--hivelab-surface-hover)] transition-colors duration-150',
          FOCUS_RING
        )}
        title="Add page"
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[200] py-1 rounded-xl shadow-xl"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'var(--hivelab-panel)',
              border: '1px solid var(--hivelab-border)',
              minWidth: 160,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ContextMenuItem
              icon={<span className="text-xs">Aa</span>}
              label="Rename"
              onClick={() => startRename(contextMenu.pageId)}
            />
            <ContextMenuItem
              icon={<ClipboardDocumentIcon className="h-3.5 w-3.5" />}
              label="Duplicate"
              onClick={() => {
                onDuplicatePage(contextMenu.pageId);
                setContextMenu(null);
              }}
            />
            <ContextMenuItem
              icon={<StarIcon className="h-3.5 w-3.5" />}
              label="Set as start page"
              onClick={() => {
                onSetStartPage(contextMenu.pageId);
                setContextMenu(null);
              }}
              disabled={pages.find((p) => p.id === contextMenu.pageId)?.isStartPage}
            />
            {pages.length > 1 && (
              <>
                <div className="my-1 border-t" style={{ borderColor: 'var(--hivelab-border)' }} />
                <ContextMenuItem
                  icon={<TrashIcon className="h-3.5 w-3.5" />}
                  label="Delete"
                  onClick={() => {
                    onDeletePage(contextMenu.pageId);
                    setContextMenu(null);
                  }}
                  danger
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium',
        'transition-colors duration-100',
        disabled && 'opacity-40 cursor-not-allowed',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface-hover)]'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
