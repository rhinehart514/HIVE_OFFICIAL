'use client';

/**
 * ElementWrapper HOC
 *
 * Wraps elements to provide:
 * - Edit mode affordances (selection, drag handles, config access)
 * - Runtime mode passthrough (clean, no chrome)
 * - Preview mode (static preview for templates)
 *
 * This separates concerns between IDE editing and deployed rendering.
 */

import * as React from 'react';
import { cn } from '../../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Settings2, Trash2 } from 'lucide-react';
import type { ElementMode, ExtendedElementProps } from './types';

// ============================================================
// Wrapper Props
// ============================================================

interface ElementWrapperProps {
  /** The element to wrap */
  children: React.ReactNode;
  /** Rendering mode */
  mode?: ElementMode;
  /** Element instance ID */
  instanceId: string;
  /** Element type ID */
  elementType: string;
  /** Whether this element is selected */
  isSelected?: boolean;
  /** Whether this element is being dragged */
  isDragging?: boolean;
  /** Callback when element is clicked */
  onSelect?: () => void;
  /** Callback to open config panel */
  onConfigure?: () => void;
  /** Callback to delete element */
  onDelete?: () => void;
  /** Drag handle props from DnD library */
  dragHandleProps?: Record<string, unknown>;
  /** Additional class names */
  className?: string;
}

// ============================================================
// Wrapper Component
// ============================================================

export function ElementWrapper({
  children,
  mode = 'runtime',
  instanceId,
  elementType,
  isSelected = false,
  isDragging = false,
  onSelect,
  onConfigure,
  onDelete,
  dragHandleProps,
  className,
}: ElementWrapperProps) {
  // Runtime mode: clean passthrough
  if (mode === 'runtime') {
    return <>{children}</>;
  }

  // Preview mode: static, non-interactive
  if (mode === 'preview') {
    return (
      <div className={cn('pointer-events-none', className)}>
        {children}
      </div>
    );
  }

  // Edit mode: full IDE chrome
  return (
    <EditModeWrapper
      instanceId={instanceId}
      elementType={elementType}
      isSelected={isSelected}
      isDragging={isDragging}
      onSelect={onSelect}
      onConfigure={onConfigure}
      onDelete={onDelete}
      dragHandleProps={dragHandleProps}
      className={className}
    >
      {children}
    </EditModeWrapper>
  );
}

// ============================================================
// Edit Mode Wrapper
// ============================================================

interface EditModeWrapperProps {
  children: React.ReactNode;
  instanceId: string;
  elementType: string;
  isSelected: boolean;
  isDragging: boolean;
  onSelect?: () => void;
  onConfigure?: () => void;
  onDelete?: () => void;
  dragHandleProps?: Record<string, unknown>;
  className?: string;
}

function EditModeWrapper({
  children,
  instanceId,
  elementType,
  isSelected,
  isDragging,
  onSelect,
  onConfigure,
  onDelete,
  dragHandleProps,
  className,
}: EditModeWrapperProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const showControls = isSelected || isHovered;

  return (
    <motion.div
      layout
      data-instance-id={instanceId}
      data-element-type={elementType}
      className={cn(
        'relative group rounded-lg transition-all duration-150',
        // Border styling
        'ring-1 ring-inset',
        isSelected
          ? 'ring-primary ring-2'
          : isHovered
          ? 'ring-border/60'
          : 'ring-transparent',
        // Dragging state
        isDragging && 'opacity-50 scale-[1.02]',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 z-10"
          >
            <div
              {...dragHandleProps}
              className={cn(
                'flex items-center justify-center w-6 h-8 rounded cursor-grab',
                'bg-background border border-border shadow-sm',
                'text-muted-foreground hover:text-foreground hover:bg-muted',
                'transition-colors duration-100'
              )}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Toolbar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-9 right-0 z-10 flex items-center gap-1"
          >
            {/* Element type label */}
            <span className="px-2 py-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-l">
              {formatElementType(elementType)}
            </span>

            {/* Config button */}
            {onConfigure && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure();
                }}
                className={cn(
                  'flex items-center justify-center w-7 h-7',
                  'bg-background border border-border shadow-sm',
                  'text-muted-foreground hover:text-foreground hover:bg-muted',
                  'transition-colors duration-100'
                )}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-r',
                  'bg-background border border-border shadow-sm',
                  'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                  'transition-colors duration-100'
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          layoutId={`selection-${instanceId}`}
          className="absolute inset-0 rounded-lg ring-2 ring-primary pointer-events-none"
        />
      )}

      {/* Element Content */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

// ============================================================
// Higher-Order Component
// ============================================================

/**
 * HOC to create an element that respects edit/runtime mode
 */
export function withElementWrapper<TProps extends ExtendedElementProps>(
  WrappedComponent: React.ComponentType<TProps>,
  elementType: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithWrapper = React.forwardRef<HTMLDivElement, TProps & Partial<ElementWrapperProps>>(
    (props, ref) => {
      const {
        mode = 'runtime',
        isSelected,
        onFocus,
        onBlur,
        ...elementProps
      } = props;

      return (
        <div ref={ref}>
          <ElementWrapper
            mode={mode}
            instanceId={props.id}
            elementType={elementType}
            isSelected={isSelected}
            onSelect={onFocus}
          >
            <WrappedComponent {...(elementProps as unknown as TProps)} mode={mode} />
          </ElementWrapper>
        </div>
      );
    }
  );

  WithWrapper.displayName = `withElementWrapper(${displayName})`;

  return WithWrapper;
}

// ============================================================
// Utilities
// ============================================================

function formatElementType(elementType: string): string {
  // Convert kebab-case to Title Case
  return elementType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
