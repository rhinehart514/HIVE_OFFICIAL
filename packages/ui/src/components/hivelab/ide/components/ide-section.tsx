'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../../lib/utils';
import { FOCUS_RING_INSET } from '../../tokens';

export interface IDESectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Collapsible section for IDE panels.
 * Extracted from properties-panel for reuse across the IDE.
 */
export function IDESection({
  title,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
}: IDESectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('border-b border-[var(--ide-border-default)]', className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-left',
          'hover:bg-[var(--ide-interactive-hover)] transition-colors',
          FOCUS_RING_INSET,
          headerClassName
        )}
      >
        <span className="text-xs font-medium text-[var(--ide-text-secondary)] uppercase tracking-wider">
          {title}
        </span>
        {expanded ? (
          <ChevronDownIcon className="h-3.5 w-3.5 text-[var(--ide-text-muted)]" />
        ) : (
          <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--ide-text-muted)]" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className={cn('px-3 pb-3 space-y-3', contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
