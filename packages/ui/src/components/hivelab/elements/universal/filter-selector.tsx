'use client';

import { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../shared/types';

/**
 * FunnelIcon Selector Element
 *
 * A multi-select filter component with optional counts.
 */
export function FilterSelectorElement({ config, onChange, onAction }: ElementProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
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
    onChange?.({ selectedFilters: newFilters, filters: newFilters });
    onAction?.('filter', { selectedFilters: newFilters, filters: newFilters, toggled: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <FunnelIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option: { value?: string; label?: string; count?: number } | string, index: number) => {
          const value = typeof option === 'string' ? option : option.value || '';
          const label = typeof option === 'string' ? option : option.label || '';
          const count = typeof option === 'object' ? option.count : undefined;
          const isSelected = selectedFilters.includes(value);

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterToggle(value)}
              className="h-8"
            >
              {label}
              {config.showCounts && count && (
                <Badge variant="secondary" className="ml-2 h-4 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {selectedFilters.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedFilters.length} filter{selectedFilters.length !== 1 ? 's' : ''} applied
        </div>
      )}
    </div>
  );
}
