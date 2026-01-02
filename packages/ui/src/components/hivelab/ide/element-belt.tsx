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
import {
  Vote,
  Timer,
  FormInput,
  BarChart3,
  Calendar,
  ListChecks,
  MoreHorizontal,
  Search,
  X,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../atomic/00-Global/atoms/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../atomic/00-Global/atoms/tooltip';

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
  { id: 'timer', name: 'Timer', icon: <Timer className="w-5 h-5" />, description: 'Track time' },
  { id: 'form-builder', name: 'Form', icon: <FormInput className="w-5 h-5" />, description: 'Collect data' },
  { id: 'chart-display', name: 'Chart', icon: <BarChart3 className="w-5 h-5" />, description: 'Visualize results' },
  { id: 'date-picker', name: 'Date', icon: <Calendar className="w-5 h-5" />, description: 'Select dates' },
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
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1',
            'w-14 h-14 rounded-xl',
            'bg-[#1A1A1A] border border-[#2A2A2A]',
            'text-[#A1A1A6] hover:text-[#FAFAFA]',
            'hover:border-[#3A3A3A] hover:bg-[#242424]',
            'cursor-grab active:cursor-grabbing',
            'transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
            // Highlighted state (AI suggestion)
            isHighlighted && [
              'border-white/50',
              'text-white',
            ]
          )}
        >
          {element.icon}
          <span className="text-[10px] font-medium">{element.name}</span>

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
          <p className="text-[#818187] text-xs">{element.description}</p>
        )}
        <p className="text-[#818187] text-xs mt-1">Drag to add</p>
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
          'relative border-t border-[#2A2A2A] bg-[#0A0A0A]',
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
                  'bg-white/[0.03] border-b border-white/[0.06]'
                )}
              >
                <p className="text-sm text-[#A1A1A6]">
                  <span className="text-white font-medium">Suggestion:</span>{' '}
                  {suggestionMessage}
                </p>
                {onDismissSuggestion && (
                  <button
                    onClick={onDismissSuggestion}
                    className={cn(
                      'p-1 rounded-md',
                      'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]',
                      'transition-colors'
                    )}
                    aria-label="Dismiss suggestion"
                  >
                    <X className="w-4 h-4" />
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
          <div className="w-px h-10 bg-[#2A2A2A] mx-2" />

          {/* More elements button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleFullPalette}
                className={cn(
                  'flex flex-col items-center justify-center gap-1',
                  'w-14 h-14 rounded-xl',
                  'bg-[#1A1A1A] border border-[#2A2A2A]',
                  'text-[#818187] hover:text-[#FAFAFA]',
                  'hover:border-[#3A3A3A] hover:bg-[#242424]',
                  'transition-colors duration-100',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                  showFullPalette && 'border-[#3A3A3A] bg-[#242424] text-[#FAFAFA]'
                )}
                aria-label="Show all elements"
                aria-expanded={showFullPalette}
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">All Elements</p>
              <p className="text-[#818187] text-xs">Browse full catalog</p>
            </TooltipContent>
          </Tooltip>

          {/* Search elements button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1',
                      'w-14 h-14 rounded-xl',
                      'bg-[#1A1A1A] border border-[#2A2A2A]',
                      'text-[#818187] hover:text-[#FAFAFA]',
                      'hover:border-[#3A3A3A] hover:bg-[#242424]',
                      'transition-colors duration-100',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                    )}
                    aria-label="Search elements"
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Search</span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-72 p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#818187]" />
                    <input
                      type="text"
                      placeholder="Search elements..."
                      autoFocus
                      className={cn(
                        'w-full pl-10 pr-4 py-2 rounded-lg',
                        'bg-[#0A0A0A] border border-[#2A2A2A]',
                        'text-[#FAFAFA] placeholder:text-[#818187]',
                        'focus:outline-none focus:border-[#3A3A3A]',
                        'text-sm'
                      )}
                    />
                  </div>
                  <p className="text-xs text-[#818187] mt-2">
                    Type to search all 20+ elements
                  </p>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">Search</p>
              <p className="text-[#818187] text-xs">Find any element</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ElementBelt;
