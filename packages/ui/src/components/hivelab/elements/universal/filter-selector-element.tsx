'use client';

/**
 * Filter Selector Element - Refactored with Core Abstractions
 *
 * Premium animated filter pills with:
 * - Multi-select support
 * - Animated checkmarks
 * - Count badges
 */

import * as React from 'react';
import { useState } from 'react';
import { FunnelIcon, CheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterSelectorConfig {
  label?: string;
  options?: Array<string | FilterOption>;
  allowMultiple?: boolean;
  showCounts?: boolean;
}

interface FilterSelectorElementProps extends ElementProps {
  config: FilterSelectorConfig;
  mode?: ElementMode;
}

// ============================================================
// Helper
// ============================================================

function normalizeFilterOption(option: string | FilterOption): FilterOption {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return {
    value: option.value || String(option),
    label: option.label || option.value || String(option),
    count: option.count
  };
}

// ============================================================
// Main Filter Selector Element
// ============================================================

export function FilterSelectorElement({
  config,
  onChange,
  mode = 'runtime',
}: FilterSelectorElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const options = config.options || [];
  const allowMultiple = config.allowMultiple !== false;

  const handleFilterToggle = (value: string) => {
    let newFilters: string[];

    if (allowMultiple) {
      newFilters = selectedFilters.includes(value)
        ? selectedFilters.filter(f => f !== value)
        : [...selectedFilters, value];
    } else {
      newFilters = selectedFilters.includes(value) ? [] : [value];
    }

    setSelectedFilters(newFilters);
    if (!selectedFilters.includes(value)) {
      setJustSelected(value);
      setTimeout(() => setJustSelected(null), 300);
    }

    if (onChange) {
      onChange({ selectedFilters: newFilters, filters: newFilters });
    }
  };

  const clearAll = () => {
    setSelectedFilters([]);
    onChange?.({ selectedFilters: [], filters: [] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={selectedFilters.length > 0 && !prefersReducedMotion ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <FunnelIcon className={`h-4 w-4 transition-colors duration-200 ${
              selectedFilters.length > 0 ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </motion.div>
          <span className="text-sm font-medium">{config.label || 'Filters'}</span>
        </div>

        {/* Clear all button */}
        <AnimatePresence>
          {selectedFilters.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={springPresets.snappy}
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="flex flex-wrap gap-2"
        layout
      >
        {(options as Array<string | FilterOption>).map((rawOption, index: number) => {
          const option = normalizeFilterOption(rawOption);
          const { value, label, count } = option;
          const isSelected = selectedFilters.includes(value);
          const wasJustSelected = justSelected === value;

          return (
            <motion.div
              key={value}
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              layout
            >
              <motion.button
                onClick={() => handleFilterToggle(value)}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                animate={wasJustSelected && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
                transition={springPresets.snappy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
                }`}
              >
                {/* Animated checkmark for selected state */}
                <AnimatePresence mode="wait">
                  {isSelected && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={springPresets.snappy}
                      className="overflow-hidden"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <span>{label}</span>

                {config.showCounts && count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Selected count indicator */}
      <AnimatePresence>
        {selectedFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={springPresets.snappy}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-primary font-medium">
              {selectedFilters.length} filter{selectedFilters.length !== 1 ? 's' : ''} active
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {options.length - selectedFilters.length} more available
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterSelectorElement;
