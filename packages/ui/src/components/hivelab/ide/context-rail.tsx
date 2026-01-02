'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Pin,
  PinOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Trash2,
  Copy,
  Group,
  Keyboard,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { focusClasses, premiumMotion } from '../../../lib/premium-design';
import type { CanvasElement } from './types';
import { PropertiesPanel } from './properties-panel';

const RAIL_WIDTH = 300;

interface ContextRailProps {
  selectedElements: CanvasElement[];
  allElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onDuplicateElements: (ids: string[]) => void;
  onAlignElements?: (alignment: AlignmentType) => void;
  onDistributeElements?: (direction: 'horizontal' | 'vertical') => void;
}

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full text-center p-6"
    >
      <motion.div
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Settings className="h-10 w-10 text-white/20 mb-4" />
      </motion.div>
      <h3 className="text-sm font-medium text-white/80 mb-2">No Selection</h3>
      <p className="text-xs text-[#6B6B70] mb-6">
        Select an element to view properties
      </p>

      {/* Keyboard shortcuts hint */}
      <div className="space-y-2 text-left w-full max-w-[200px]">
        <p className="text-[10px] uppercase tracking-wider text-[#4A4A4F] font-medium mb-2">
          Quick Actions
        </p>
        <ShortcutHint shortcut="⌘K" label="Open AI" />
        <ShortcutHint shortcut="⌘E" label="Toggle elements" />
        <ShortcutHint shortcut="⌘T" label="Browse templates" />
      </div>
    </motion.div>
  );
}

function ShortcutHint({ shortcut, label }: { shortcut: string; label: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#6B6B70]">{label}</span>
      <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded text-[#9A9A9F] font-mono text-[10px]">
        {shortcut}
      </kbd>
    </div>
  );
}

function MultiSelectPanel({
  count,
  onDelete,
  onDuplicate,
  onAlign,
  onDistribute,
}: {
  count: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onAlign?: (alignment: AlignmentType) => void;
  onDistribute?: (direction: 'horizontal' | 'vertical') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={premiumMotion.spring.snappy}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">
          {count} Elements Selected
        </h3>
        <p className="text-xs text-[#6B6B70] mt-1">
          Modify multiple elements at once
        </p>
      </div>

      {/* Alignment */}
      {onAlign && (
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B70] font-medium mb-3">
            Alignment
          </p>
          <div className="grid grid-cols-6 gap-1">
            <AlignButton
              icon={<AlignLeft className="h-4 w-4" />}
              label="Align Left"
              onClick={() => onAlign('left')}
            />
            <AlignButton
              icon={<AlignCenter className="h-4 w-4" />}
              label="Align Center H"
              onClick={() => onAlign('center')}
            />
            <AlignButton
              icon={<AlignRight className="h-4 w-4" />}
              label="Align Right"
              onClick={() => onAlign('right')}
            />
            <AlignButton
              icon={<AlignStartVertical className="h-4 w-4" />}
              label="Align Top"
              onClick={() => onAlign('top')}
            />
            <AlignButton
              icon={<AlignCenterVertical className="h-4 w-4" />}
              label="Align Center V"
              onClick={() => onAlign('middle')}
            />
            <AlignButton
              icon={<AlignEndVertical className="h-4 w-4" />}
              label="Align Bottom"
              onClick={() => onAlign('bottom')}
            />
          </div>

          {/* Distribution */}
          {onDistribute && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => onDistribute('horizontal')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-lg',
                  'bg-white/[0.04] text-[#9A9A9F] hover:text-white hover:bg-white/[0.08]',
                  'border border-white/[0.06] transition-colors',
                  focusClasses()
                )}
              >
                Distribute H
              </button>
              <button
                type="button"
                onClick={() => onDistribute('vertical')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-lg',
                  'bg-white/[0.04] text-[#9A9A9F] hover:text-white hover:bg-white/[0.08]',
                  'border border-white/[0.06] transition-colors',
                  focusClasses()
                )}
              >
                Distribute V
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      <div className="px-4 py-4 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B70] font-medium mb-3">
          Bulk Actions
        </p>

        <button
          type="button"
          onClick={onDuplicate}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg',
            'bg-white/[0.04] text-white hover:bg-white/[0.08]',
            'border border-white/[0.06] transition-colors text-sm',
            focusClasses()
          )}
        >
          <Copy className="h-4 w-4 text-[#9A9A9F]" />
          Duplicate All
        </button>

        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg',
            'bg-red-500/10 text-red-400 hover:bg-red-500/20',
            'border border-red-500/20 transition-colors text-sm',
            focusClasses()
          )}
        >
          <Trash2 className="h-4 w-4" />
          Delete All
        </button>
      </div>
    </motion.div>
  );
}

function AlignButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'p-2 rounded-lg text-[#6B6B70] hover:text-white hover:bg-white/[0.08]',
        'transition-colors',
        focusClasses()
      )}
    >
      {icon}
    </button>
  );
}

export function ContextRail({
  selectedElements,
  allElements,
  onUpdateElement,
  onDeleteElements,
  onDuplicateElements,
  onAlignElements,
  onDistributeElements,
}: ContextRailProps) {
  const [isPinned, setIsPinned] = useState(false);
  const hasSelection = selectedElements.length > 0;
  const isMultiSelect = selectedElements.length > 1;

  // Auto-show/hide based on selection (unless pinned)
  const isVisible = isPinned || hasSelection;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: RAIL_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={premiumMotion.spring.default}
          className="h-full border-l border-white/[0.06] bg-[#111111] overflow-hidden flex flex-col"
        >
          {/* Pin button */}
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isPinned
                  ? 'bg-white/[0.10] text-white'
                  : 'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]',
                focusClasses()
              )}
              title={isPinned ? 'Unpin panel' : 'Pin panel'}
            >
              {isPinned ? (
                <Pin className="h-3.5 w-3.5" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {!hasSelection ? (
                <EmptyState key="empty" />
              ) : isMultiSelect ? (
                <MultiSelectPanel
                  key="multi"
                  count={selectedElements.length}
                  onDelete={() => onDeleteElements(selectedElements.map((e) => e.id))}
                  onDuplicate={() => onDuplicateElements(selectedElements.map((e) => e.id))}
                  onAlign={onAlignElements}
                  onDistribute={onDistributeElements}
                />
              ) : (
                <motion.div
                  key="single"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <PropertiesPanel
                    selectedElement={selectedElements[0]}
                    onUpdateElement={onUpdateElement}
                    onDeleteElement={(id) => onDeleteElements([id])}
                    onDuplicateElement={(id) => onDuplicateElements([id])}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
