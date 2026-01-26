'use client';

/**
 * Search Input Element - Refactored with Core Abstractions
 *
 * Premium search with:
 * - Animated suggestions
 * - Keyboard navigation
 * - Debounced search
 */

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Input } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface SearchInputConfig {
  placeholder?: string;
  debounceMs?: number;
  showSuggestions?: boolean;
}

interface SearchInputElementProps extends ElementProps {
  config: SearchInputConfig;
  mode?: ElementMode;
}

// ============================================================
// Main Search Input Element
// ============================================================

export function SearchInputElement({
  config,
  onChange,
  mode = 'runtime',
}: SearchInputElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceMs = config.debounceMs || 300;

  useEffect(() => {
    if (query.length > 0) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setIsSearching(false);
      if (onChange && query !== '') {
        onChange({ query, searchTerm: query });
      }

      // Mock suggestions for demo
      if (config.showSuggestions && query.length > 2) {
        setSuggestions([
          `${query} in spaces`,
          `${query} in users`,
          `${query} in posts`
        ]);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onChange, config.showSuggestions]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      setQuery(suggestions[selectedIndex]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
      transition={springPresets.snappy}
    >
      <div className="relative">
        {/* Animated search icon */}
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
          animate={isSearching && !prefersReducedMotion ? { rotate: [0, 360] } : {}}
          transition={isSearching ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        >
          <MagnifyingGlassIcon className={`h-4 w-4 transition-colors duration-200 ${
            isFocused ? 'text-primary' : 'text-muted-foreground'
          }`} />
        </motion.div>

        <Input
          ref={inputRef}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding suggestions to allow click
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder || 'Search...'}
          className={`pl-10 pr-10 transition-all duration-200 ${
            isFocused
              ? 'ring-2 ring-primary/20 border-primary/50'
              : ''
          }`}
        />

        {/* Clear button with animation */}
        <AnimatePresence>
          {query.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springPresets.snappy}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Animated suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={springPresets.snappy}
            className="absolute z-20 w-full mt-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    selectedIndex === index
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <SparklesIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{suggestion}</span>
                </motion.button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
              Use ↑↓ to navigate, Enter to select
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SearchInputElement;
