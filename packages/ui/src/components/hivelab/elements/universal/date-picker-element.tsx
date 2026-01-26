'use client';

/**
 * Date Picker Element - Refactored with Core Abstractions
 *
 * Simple date/datetime picker with:
 * - Native browser input
 * - Optional time support
 * - Helper text
 */

import * as React from 'react';
import { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

import { Input } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface DatePickerConfig {
  includeTime?: boolean;
  helperText?: string;
  label?: string;
}

interface DatePickerElementProps extends ElementProps {
  config: DatePickerConfig;
  mode?: ElementMode;
}

// ============================================================
// Main Date Picker Element
// ============================================================

export function DatePickerElement({
  config,
  onChange,
  mode = 'runtime',
}: DatePickerElementProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{config.label || 'Date & Time'}</span>
      </div>

      <Input
        type={config.includeTime ? 'datetime-local' : 'date'}
        value={selectedDate}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setSelectedDate(value);
          if (onChange) {
            onChange({ selectedDate: value });
          }
        }}
      />

      {config.helperText && (
        <p className="text-xs text-muted-foreground">{config.helperText}</p>
      )}
    </div>
  );
}

export default DatePickerElement;
