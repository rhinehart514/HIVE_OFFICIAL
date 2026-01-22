'use client';

/**
 * BentoWidget - Sortable widget wrapper with edit controls
 *
 * Wraps individual widgets with:
 * - Drag handle for reordering
 * - Visibility toggle (eye icon)
 * - Size picker dropdown
 * - Consistent styling
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetConfig, WidgetSize } from '@hive/core';
import { WIDGET_METADATA } from '../hooks/use-bento-grid';
import { cn } from '@/lib/utils';

// LOCKED: Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// Size to grid span mapping
const SIZE_CLASSES: Record<WidgetSize, string> = {
  '1x1': '',
  '2x1': 'md:col-span-2',
  '2x2': 'md:col-span-2 lg:row-span-2',
  '1x2': 'lg:row-span-2',
  '4x1': 'md:col-span-2 lg:col-span-4',
};

interface BentoWidgetProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  onToggleVisibility?: () => void;
  onResize?: (size: WidgetSize) => void;
  children: React.ReactNode;
  className?: string;
}

export function BentoWidget({
  widget,
  isEditMode,
  onToggleVisibility,
  onResize,
  children,
  className,
}: BentoWidgetProps) {
  const [showSizePicker, setShowSizePicker] = React.useState(false);
  const sizePickerRef = React.useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Close size picker on click outside
  React.useEffect(() => {
    if (!showSizePicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sizePickerRef.current && !sizePickerRef.current.contains(e.target as Node)) {
        setShowSizePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSizePicker]);

  const metadata = WIDGET_METADATA[widget.type];
  const allowedSizes = metadata?.allowedSizes || ['1x1'];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        SIZE_CLASSES[widget.size],
        isDragging && 'z-50',
        className
      )}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: isDragging ? 0.8 : 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
      }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Edit mode overlay */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.2)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit controls */}
      <AnimatePresence>
        {isEditMode && (
          <>
            {/* Drag handle - top left */}
            <motion.button
              {...attributes}
              {...listeners}
              className="absolute top-3 left-3 z-20 p-2 rounded-lg cursor-grab active:cursor-grabbing"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              aria-label="Drag to reorder"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                <circle cx="5" cy="4" r="1" fill="currentColor" />
                <circle cx="11" cy="4" r="1" fill="currentColor" />
                <circle cx="5" cy="8" r="1" fill="currentColor" />
                <circle cx="11" cy="8" r="1" fill="currentColor" />
                <circle cx="5" cy="12" r="1" fill="currentColor" />
                <circle cx="11" cy="12" r="1" fill="currentColor" />
              </svg>
            </motion.button>

            {/* Visibility toggle - top right */}
            <motion.button
              onClick={onToggleVisibility}
              className="absolute top-3 right-3 z-20 p-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              aria-label={widget.visible ? 'Hide widget' : 'Show widget'}
            >
              {widget.visible ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </motion.button>

            {/* Size picker - bottom right (only if multiple sizes allowed) */}
            {allowedSizes.length > 1 && (
              <motion.div
                ref={sizePickerRef}
                className="absolute bottom-3 right-3 z-20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <button
                  onClick={() => setShowSizePicker(!showSizePicker)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {widget.size}
                </button>

                <AnimatePresence>
                  {showSizePicker && (
                    <motion.div
                      className="absolute bottom-full right-0 mb-2 p-1 rounded-lg"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                    >
                      {allowedSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            onResize?.(size);
                            setShowSizePicker(false);
                          }}
                          className={cn(
                            'block w-full px-3 py-1.5 text-xs font-medium rounded text-left whitespace-nowrap transition-colors',
                            size === widget.size
                              ? 'bg-white/10 text-white'
                              : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Widget content */}
      <div className={cn(isEditMode && 'pointer-events-none')}>{children}</div>
    </motion.div>
  );
}

export default BentoWidget;
