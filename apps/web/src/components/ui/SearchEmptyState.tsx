'use client';

/**
 * SearchEmptyState - Contextual empty states for search results
 *
 * Three states per DESIGN_GAPS.md:
 * 1. No results - Show suggestions
 * 2. Initial state - Show recent searches and popular
 * 3. Error state - Show retry option
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { Button, Text } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type SearchEmptyVariant = 'no_results' | 'initial' | 'error';

interface SearchEmptyStateProps {
  variant: SearchEmptyVariant;
  query?: string;
  suggestions?: string[];
  recentSearches?: string[];
  popularSearches?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  onRetry?: () => void;
  onClearSearch?: () => void;
  className?: string;
}

export function SearchEmptyState({
  variant,
  query,
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  onSuggestionClick,
  onRetry,
  onClearSearch,
  className,
}: SearchEmptyStateProps) {
  if (variant === 'error') {
    return (
      <motion.div
        className={cn(
          'flex flex-col items-center justify-center py-12 px-6 text-center',
          className
        )}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-body font-medium text-white/80 mb-2">
          Search failed
        </h3>
        <p className="text-body-sm text-white/40 max-w-xs mb-4">
          We couldn't complete your search. Please try again.
        </p>
        {onRetry && (
          <Button variant="default" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === 'initial') {
    const hasRecent = recentSearches.length > 0;
    const hasPopular = popularSearches.length > 0;

    if (!hasRecent && !hasPopular) {
      return (
        <motion.div
          className={cn(
            'flex flex-col items-center justify-center py-12 px-6 text-center',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-white/30" />
          </div>
          <h3 className="text-body font-medium text-white/70 mb-1">
            Search HIVE
          </h3>
          <p className="text-body-sm text-white/40">
            Find spaces, people, events, and more
          </p>
        </motion.div>
      );
    }

    return (
      <motion.div
        className={cn('py-4 px-2', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Recent searches */}
        {hasRecent && (
          <div className="mb-6">
            <div className="flex items-center gap-2 px-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-label-sm text-white/30 uppercase tracking-wider">
                Recent
              </span>
            </div>
            <div className="space-y-1">
              {recentSearches.slice(0, 5).map((search, i) => (
                <motion.button
                  key={search}
                  onClick={() => onSuggestionClick?.(search)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg',
                    'text-body-sm text-white/60 hover:text-white',
                    'hover:bg-white/[0.04] transition-colors',
                    'flex items-center justify-between group'
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span>{search}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Popular searches */}
        {hasPopular && (
          <div>
            <div className="flex items-center gap-2 px-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-white/30" />
              <span className="text-label-sm text-white/30 uppercase tracking-wider">
                Popular
              </span>
            </div>
            <div className="space-y-1">
              {popularSearches.slice(0, 5).map((search, i) => (
                <motion.button
                  key={search}
                  onClick={() => onSuggestionClick?.(search)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg',
                    'text-body-sm text-white/60 hover:text-white',
                    'hover:bg-white/[0.04] transition-colors',
                    'flex items-center justify-between group'
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (hasRecent ? 5 : 0) * 0.03 + i * 0.03 }}
                >
                  <span>{search}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // No results state
  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-white/30" />
      </div>
      <h3 className="text-body font-medium text-white/70 mb-1">
        No results for "{query}"
      </h3>
      <p className="text-body-sm text-white/40 max-w-xs mb-4">
        Try a different search term or check your spelling
      </p>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="w-full max-w-xs">
          <p className="text-label-sm text-white/30 mb-2">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick?.(suggestion)}
                className={cn(
                  'px-3 py-1.5 rounded-full',
                  'text-label text-white/60 hover:text-white',
                  'bg-white/[0.04] hover:bg-white/[0.08]',
                  'border border-white/[0.06] hover:border-white/[0.1]',
                  'transition-all duration-150'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear search */}
      {onClearSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Button variant="ghost" size="sm" onClick={onClearSearch}>
            Clear search
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

SearchEmptyState.displayName = 'SearchEmptyState';
