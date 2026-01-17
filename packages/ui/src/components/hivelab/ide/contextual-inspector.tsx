'use client';

/**
 * ContextualInspector - Floating/Docked properties panel for HiveLab elements
 *
 * Design Direction:
 * - No persistent right panel. Inspector appears near the selected element
 * - Simple elements: floating inspector (compact)
 * - Complex elements: inspector auto-docks to right
 * - User can manually pin/unpin
 * - Gold selection border on selected element
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design update
 */

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon, ClipboardDocumentIcon, Bars3Icon, ChevronDownIcon, ChevronUpIcon, BookmarkIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Pin = BookmarkIcon;
const PinOff = BookmarkIcon;
import * as React from 'react';

import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface InspectorProperty {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'color' | 'textarea';
  value: string | number | boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface InspectorSection {
  id: string;
  title: string;
  properties: InspectorProperty[];
  defaultExpanded?: boolean;
}

export interface ContextualInspectorProps {
  /** Whether the inspector is visible */
  isOpen: boolean;
  /** Whether docked to right side (vs floating) */
  isDocked: boolean;
  /** Whether pinned (stays open even when element deselected) */
  isPinned: boolean;
  /** Selected element ID */
  elementId?: string;
  /** Selected element name */
  elementName?: string;
  /** Selected element icon */
  elementIcon?: React.ReactNode;
  /** Property sections to display */
  sections: InspectorSection[];
  /** Position when floating (relative to canvas) */
  floatingPosition?: { x: number; y: number };
  /** Callback when property changes */
  onPropertyChange?: (propertyId: string, value: string | number | boolean) => void;
  /** Callback when close is clicked */
  onClose?: () => void;
  /** Callback when pin toggle is clicked */
  onTogglePin?: () => void;
  /** Callback when dock toggle is clicked */
  onToggleDock?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when duplicate is clicked */
  onDuplicate?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Property Input Components
// ============================================================

interface PropertyInputProps {
  property: InspectorProperty;
  onChange: (value: string | number | boolean) => void;
}

function PropertyInput({ property, onChange }: PropertyInputProps) {
  const baseInputClass = cn(
    'w-full px-3 py-2 rounded-lg',
    'bg-[var(--hivelab-bg)] border border-[var(--hivelab-border)]',
    'text-sm text-[var(--hivelab-text-primary)] placeholder:text-[var(--hivelab-text-tertiary)]',
    'focus:outline-none focus:border-[var(--hivelab-border-emphasis)]',
    'transition-colors duration-[var(--workshop-duration)]'
  );

  switch (property.type) {
    case 'text':
      return (
        <input
          type="text"
          value={property.value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.placeholder}
          className={baseInputClass}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={property.value as number}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={property.min}
          max={property.max}
          step={property.step}
          className={baseInputClass}
        />
      );

    case 'select':
      return (
        <select
          value={property.value as string}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          {property.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={property.value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className={cn(
              'w-4 h-4 rounded',
              'bg-[var(--hivelab-bg)] border border-[var(--hivelab-border)]',
              'checked:bg-[var(--hivelab-text-primary)] checked:border-[var(--hivelab-text-primary)]',
              'focus:ring-2 focus:ring-white/50'
            )}
          />
          <span className="text-sm text-[var(--hivelab-text-secondary)]">Enabled</span>
        </label>
      );

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={property.value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <input
            type="text"
            value={property.value as string}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseInputClass, 'flex-1')}
          />
        </div>
      );

    case 'textarea':
      return (
        <textarea
          value={property.value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.placeholder}
          rows={3}
          className={cn(baseInputClass, 'resize-none')}
        />
      );

    default:
      return null;
  }
}

// ============================================================
// Section Component
// ============================================================

interface InspectorSectionComponentProps {
  section: InspectorSection;
  onPropertyChange: (propertyId: string, value: string | number | boolean) => void;
}

function InspectorSectionComponent({
  section,
  onPropertyChange,
}: InspectorSectionComponentProps) {
  const [isExpanded, setIsExpanded] = React.useState(section.defaultExpanded ?? true);

  return (
    <div className="border-b border-[var(--hivelab-border)] last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3',
          'text-left hover:bg-[var(--hivelab-surface)]',
          'transition-colors duration-[var(--workshop-duration)]'
        )}
      >
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--hivelab-text-tertiary)]">
          {section.title}
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-[var(--hivelab-text-tertiary)]" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-[var(--hivelab-text-tertiary)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {section.properties.map((property) => (
                <div key={property.id}>
                  <label className="block text-xs text-[var(--hivelab-text-secondary)] mb-1.5">
                    {property.label}
                  </label>
                  <PropertyInput
                    property={property}
                    onChange={(value) => onPropertyChange(property.id, value)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ContextualInspector({
  isOpen,
  isDocked,
  isPinned,
  elementId,
  elementName,
  elementIcon,
  sections,
  floatingPosition,
  onPropertyChange,
  onClose,
  onTogglePin,
  onToggleDock,
  onDelete,
  onDuplicate,
  className,
}: ContextualInspectorProps) {
  // Floating position with boundary constraints
  const [dragPosition, setDragPosition] = React.useState(floatingPosition || { x: 0, y: 0 });

  React.useEffect(() => {
    if (floatingPosition) {
      setDragPosition(floatingPosition);
    }
  }, [floatingPosition]);

  const inspectorContent = (
    <>
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          'border-b border-[var(--hivelab-border)]',
          'bg-[var(--hivelab-bg)]/50',
          !isDocked && 'cursor-move'
        )}
      >
        {!isDocked && <Bars3Icon className="w-4 h-4 text-[var(--hivelab-text-tertiary)] flex-shrink-0" />}

        {/* Element info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {elementIcon && (
            <span className="text-[var(--hivelab-text-primary)] flex-shrink-0">{elementIcon}</span>
          )}
          <span className="text-sm font-medium text-[var(--hivelab-text-primary)] truncate">
            {elementName || 'Select an element'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onTogglePin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onTogglePin}
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
                'transition-colors duration-[var(--workshop-duration)]',
                isPinned && 'text-[var(--hivelab-text-primary)]'
              )}
              aria-label={isPinned ? 'Unpin inspector' : 'Pin inspector'}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </motion.button>
          )}

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
                'transition-colors duration-[var(--workshop-duration)]'
              )}
              aria-label="Close inspector"
            >
              <XMarkIcon className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Properties */}
      {elementId ? (
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <InspectorSectionComponent
              key={section.id}
              section={section}
              onPropertyChange={onPropertyChange || (() => {})}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-[var(--hivelab-text-tertiary)] text-center">
            Select an element on the canvas to view its properties
          </p>
        </div>
      )}

      {/* Footer actions */}
      {elementId && (onDelete || onDuplicate) && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-3',
            'border-t border-[var(--hivelab-border)]'
          )}
        >
          {onDuplicate && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDuplicate}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'text-sm text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]',
                'hover:bg-[var(--hivelab-surface)]',
                'transition-colors duration-[var(--workshop-duration)]'
              )}
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              Duplicate
            </motion.button>
          )}

          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDelete}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'text-sm text-red-400 hover:text-red-300',
                'hover:bg-red-500/10',
                'transition-colors'
              )}
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </motion.button>
          )}
        </div>
      )}
    </>
  );

  // Docked version
  if (isDocked) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 w-80 z-30',
              'bg-[var(--hivelab-panel)] border-l border-[var(--hivelab-border)]',
              'flex flex-col',
              className
            )}
          >
            {inspectorContent}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Floating version
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDrag={(_, info) => {
            setDragPosition((prev) => ({
              x: prev.x + info.delta.x,
              y: prev.y + info.delta.y,
            }));
          }}
          style={{
            x: dragPosition.x,
            y: dragPosition.y,
          }}
          className={cn(
            'fixed z-40 w-72',
            'bg-[var(--hivelab-panel)] border border-[var(--hivelab-border)] rounded-xl',
            'shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
            'flex flex-col max-h-[400px]',
            className
          )}
        >
          {inspectorContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ContextualInspector;
