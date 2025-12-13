'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';

export interface IDEPanelProps {
  children: ReactNode;
  side: 'left' | 'right';
  width?: number;
  open?: boolean;
  className?: string;
}

const DEFAULT_WIDTH = 280;

/**
 * Animated side panel for the IDE.
 * Slides in/out from the specified side.
 */
export function IDEPanel({
  children,
  side,
  width = DEFAULT_WIDTH,
  open = true,
  className,
}: IDEPanelProps) {
  const borderClass = side === 'left' ? 'border-r' : 'border-l';

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            borderClass,
            'border-[var(--ide-border-default)]',
            'bg-[var(--ide-surface-panel)]',
            'flex flex-col overflow-hidden',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface IDEPanelHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Header section for IDE panels.
 */
export function IDEPanelHeader({ children, className }: IDEPanelHeaderProps) {
  return (
    <div
      className={cn(
        'px-3 py-3 border-b border-[var(--ide-border-default)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface IDEPanelContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scrollable content area for IDE panels.
 */
export function IDEPanelContent({ children, className }: IDEPanelContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>{children}</div>
  );
}

export interface IDEPanelFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Footer section for IDE panels.
 */
export function IDEPanelFooter({ children, className }: IDEPanelFooterProps) {
  return (
    <div
      className={cn(
        'px-3 py-3 border-t border-[var(--ide-border-default)]',
        className
      )}
    >
      {children}
    </div>
  );
}
