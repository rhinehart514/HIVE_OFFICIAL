'use client';

/**
 * ExploreSearch - Unified search bar
 *
 * ChatGPT-style prominent search input.
 * Searches across all tabs simultaneously.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Input, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type ExploreSearchScope = 'spaces' | 'people' | 'events' | 'tools';

const SCOPE_LABELS: Record<ExploreSearchScope, string> = {
  spaces: 'in Spaces',
  people: 'in People',
  events: 'in Events',
  tools: 'in Tools',
};

export interface ExploreSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  scope?: ExploreSearchScope;
  className?: string;
}

export function ExploreSearch({
  value,
  onChange,
  placeholder = 'Search spaces, people, events...',
  scope,
  className,
}: ExploreSearchProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      className={cn('relative', className)}
    >
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className={cn(
            'transition-colors duration-200',
            isFocused ? 'text-white/60' : 'text-white/30'
          )}
        >
          <path
            d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 19L14.65 14.65"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Scope indicator */}
      {scope && (
        <div className="absolute left-11 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-[11px] font-medium text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded">
            {SCOPE_LABELS[scope]}
          </span>
        </div>
      )}

      {/* Input */}
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full h-14 pr-4 text-body-lg rounded-2xl',
          scope ? 'pl-[7.5rem]' : 'pl-12'
        )}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
