'use client';

/**
 * ElementBelt - Horizontal element toolbar for HiveLab
 *
 * Design Direction:
 * - Horizontal bar at bottom, like a tool belt
 * - Shows 6-8 most common elements
 * - "More" button opens full categorized palette
 * - AI can highlight relevant elements ("try adding a timer")
 * - Elements draggable to canvas
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design update
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, ChartBarIcon, CalendarIcon, EllipsisHorizontalIcon, MagnifyingGlassIcon, XMarkIcon, HandThumbUpIcon, DocumentTextIcon, ListBulletIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Vote = HandThumbUpIcon;
const FormInput = DocumentTextIcon;
const ListChecks = ListBulletIcon;
import * as React from 'react';

import { cn } from '../../../lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../design-system/components/Popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../design-system/primitives/Tooltip';

// ============================================================
// Types
// ============================================================

export interface ElementBeltItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
  tier?: 'universal' | 'connected' | 'space';
}

export interface ElementBeltProps {
  /** Called when an element starts being dragged */
  onDragStart?: (elementId: string) => void;
  /** Called when drag ends */
  onDragEnd?: () => void;
  /** Called when an element is clicked (for touch/click-to-add) */
  onElementClick?: (elementId: string) => void;
  /** Elements to highlight (AI suggestions) */
  highlightedElements?: string[];
  /** AI suggestion message */
  suggestionMessage?: string;
  /** Called when suggestion is dismissed */
  onDismissSuggestion?: () => void;
  /** Whether to show the full palette */
  showFullPalette?: boolean;
  /** Called when full palette toggle is clicked */
  onToggleFullPalette?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Quick Access Elements (most commonly used)
// ============================================================

const QUICK_ELEMENTS: ElementBeltItem[] = [
  { id: 'poll-element', name: 'Poll', icon: <Vote className="w-5 h-5" />, description: 'Collect votes' },
  { id: 'timer', name: 'ClockIcon', icon: <ClockIcon className="w-5 h-5" />, description: 'Track time' },
  { id: 'form-builder', name: 'Form', icon: <FormInput className="w-5 h-5" />, description: 'Collect data' },
  { id: 'chart-display', name: 'Chart', icon: <ChartBarIcon className="w-5 h-5" />, description: 'Visualize results' },
  { id: 'date-picker', name: 'Date', icon: <CalendarIcon className="w-5 h-5" />, description: 'Select dates' },
  { id: 'result-list', name: 'List', icon: <ListChecks className="w-5 h-5" />, description: 'Display items' },
];

// ============================================================
// Element Button Component
// ============================================================

interface ElementButtonProps {
  element: ElementBeltItem;
  isHighlighted?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}

function ElementButton({
  element,
  isHighlighted,
  onDragStart,
  onDragEnd,
  onClick,
}: ElementButtonProps) {
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.();
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          draggable
          // Use native HTML drag events (cast to bypass Framer Motion type conflict)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDragStart={handleDragStart as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDragEnd={handleDragEnd as any}
          onClick={onClick}
          whileHover={{ opacity: 0.9, y: -2 }}
          whileTap={{ opacity: 0.8 }}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1',
            'w-14 h-14 rounded-xl',
            'bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)]',
            'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]',
            'hover:border-[var(--hivelab-border-emphasis)] hover:bg-[var(--hivelab-surface-hover)]',
            'cursor-grab active:cursor-grabbing',
            'transition-colors duration-[var(--workshop-duration)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
            // Highlighted state (AI suggestion)
            isHighlighted && [
              'border-[var(--hivelab-border-emphasis)]',
              'text-[var(--hivelab-text-primary)]',
            ]
          )}
        >
          {element.icon}
          <span className="text-label-xs font-medium">{element.name}</span>

          {/* Gold pulse for highlighted elements */}
          {isHighlighted && (
            <motion.span
              className="absolute inset-0 rounded-xl border border-white/30"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium">{element.name}</p>
        {element.description && (
          <p className="text-[var(--hivelab-text-tertiary)] text-xs">{element.description}</p>
        )}
        <p className="text-[var(--hivelab-text-tertiary)] text-xs mt-1">Drag to add</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================
// Component
// ============================================================

export function ElementBelt({
  onDragStart,
  onDragEnd,
  onElementClick,
  highlightedElements = [],
  suggestionMessage,
  onDismissSuggestion,
  showFullPalette,
  onToggleFullPalette,
  className,
}: ElementBeltProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          // Dark-first design: Elevated surface
          'relative border-t border-[var(--hivelab-border)] bg-[var(--hivelab-bg)]',
          className
        )}
      >
        {/* AI Suggestion Banner */}
        <AnimatePresence>
          {suggestionMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-2',
                  'bg-[var(--hivelab-surface)] border-b border-[var(--hivelab-border)]'
                )}
              >
                <p className="text-sm text-[var(--hivelab-text-secondary)]">
                  <span className="text-[var(--hivelab-text-primary)] font-medium">Suggestion:</span>{' '}
                  {suggestionMessage}
                </p>
                {onDismissSuggestion && (
                  <button
                    onClick={onDismissSuggestion}
                    className={cn(
                      'p-1 rounded-md',
                      'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface-hover)]',
                      'transition-colors duration-[var(--workshop-duration)]'
                    )}
                    aria-label="Dismiss suggestion"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Element Belt */}
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {/* Quick access elements */}
          {QUICK_ELEMENTS.map((element) => (
            <ElementButton
              key={element.id}
              element={element}
              isHighlighted={highlightedElements.includes(element.id)}
              onDragStart={() => onDragStart?.(element.id)}
              onDragEnd={onDragEnd}
              onClick={() => onElementClick?.(element.id)}
            />
          ))}

          {/* Separator */}
          <div className="w-px h-10 bg-[var(--hivelab-border)] mx-2" />

          {/* More elements button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={onToggleFullPalette}
                className={cn(
                  'flex flex-col items-center justify-center gap-1',
                  'w-14 h-14 rounded-xl',
                  'bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)]',
                  'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)]',
                  'hover:border-[var(--hivelab-border-emphasis)] hover:bg-[var(--hivelab-surface-hover)]',
                  'transition-colors duration-[var(--workshop-duration)]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
                  showFullPalette && 'border-[var(--hivelab-border-emphasis)] bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)]'
                )}
                aria-label="Show all elements"
                aria-expanded={showFullPalette}
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
                <span className="text-label-xs font-medium">More</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">All Elements</p>
              <p className="text-[var(--hivelab-text-tertiary)] text-xs">Browse full catalog</p>
            </TooltipContent>
          </Tooltip>

          {/* MagnifyingGlassIcon elements button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <motion.button
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ opacity: 0.8 }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1',
                      'w-14 h-14 rounded-xl',
                      'bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)]',
                      'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)]',
                      'hover:border-[var(--hivelab-border-emphasis)] hover:bg-[var(--hivelab-surface-hover)]',
                      'transition-colors duration-[var(--workshop-duration)]',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]'
                    )}
                    aria-label="MagnifyingGlassIcon elements"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    <span className="text-label-xs font-medium">MagnifyingGlassIcon</span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-72 p-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hivelab-text-tertiary)]" />
                    <input
                      type="text"
                      placeholder="MagnifyingGlassIcon elements..."
                      autoFocus
                      className={cn(
                        'w-full pl-10 pr-4 py-2 rounded-lg',
                        'bg-[var(--hivelab-bg)] border border-[var(--hivelab-border)]',
                        'text-[var(--hivelab-text-primary)] placeholder:text-[var(--hivelab-text-tertiary)]',
                        'focus:outline-none focus:border-[var(--hivelab-border-emphasis)]',
                        'text-sm transition-colors duration-[var(--workshop-duration)]'
                      )}
                    />
                  </div>
                  <p className="text-xs text-[var(--hivelab-text-tertiary)] mt-2">
                    Type to search all 20+ elements
                  </p>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">MagnifyingGlassIcon</p>
              <p className="text-[var(--hivelab-text-tertiary)] text-xs">Find any element</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ElementBelt;
