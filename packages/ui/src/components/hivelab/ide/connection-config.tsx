'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon, TrashIcon, BoltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getElementById } from '@hive/core';
import { cn } from '../../../lib/utils';
import type { Connection, CanvasElement } from './types';

// HiveLab Dark Panel Colors (shared with context-rail)
const PANEL_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #252525)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  error: 'var(--hivelab-status-error)',
  errorLight: 'var(--hivelab-status-error-muted)',
  outputGreen: 'var(--hivelab-flow-output)',
  inputBlue: 'var(--hivelab-flow-input)',
};

// Available transforms for connections
const TRANSFORMS = [
  { value: '', label: 'None', description: 'Pass data through unchanged' },
  { value: 'toArray', label: 'To Array', description: 'Wrap single value in array' },
  { value: 'toCount', label: 'Count', description: 'Return array length or 0' },
  { value: 'toSorted', label: 'Sorted', description: 'Sort by score descending' },
  { value: 'toTop5', label: 'Top 5', description: 'Keep only top 5 items' },
  { value: 'toBoolean', label: 'Boolean', description: 'Convert to true/false' },
  { value: 'toString', label: 'String', description: 'Convert to string' },
] as const;

export interface ConnectionConfigProps {
  connection: Connection;
  elements: CanvasElement[];
  onUpdate: (updates: Partial<Connection>) => void;
  onDelete: () => void;
}

export function ConnectionConfig({
  connection,
  elements,
  onUpdate,
  onDelete,
}: ConnectionConfigProps) {
  // Find source and target elements
  const sourceElement = elements.find(el => el.instanceId === connection.from.instanceId);
  const targetElement = elements.find(el => el.instanceId === connection.to.instanceId);

  // Get element specs for display names
  const sourceSpec = sourceElement ? getElementById(sourceElement.elementId) : null;
  const targetSpec = targetElement ? getElementById(targetElement.elementId) : null;

  const currentTransform = connection.transform || '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: PANEL_COLORS.border }}
      >
        <BoltIcon className="w-4 h-4" style={{ color: PANEL_COLORS.accent }} />
        <span
          className="text-sm font-medium"
          style={{ color: PANEL_COLORS.textPrimary }}
        >
          Connection
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source */}
        <div className="space-y-2">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            Source
          </label>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: PANEL_COLORS.bgActive }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: PANEL_COLORS.outputGreen }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: PANEL_COLORS.textPrimary }}
              >
                {(sourceElement?.config?.label as string) || sourceSpec?.name || 'Unknown'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <ArrowRightIcon className="w-3 h-3" style={{ color: PANEL_COLORS.textTertiary }} />
              <span
                className="text-xs"
                style={{ color: PANEL_COLORS.outputGreen }}
              >
                {connection.from.port}
              </span>
            </div>
          </div>
        </div>

        {/* Flow indicator */}
        <div className="flex justify-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: PANEL_COLORS.accentLight }}
          >
            <ArrowRightIcon
              className="w-4 h-4 rotate-90"
              style={{ color: PANEL_COLORS.accent }}
            />
          </div>
        </div>

        {/* Target */}
        <div className="space-y-2">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            Target
          </label>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: PANEL_COLORS.bgActive }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: PANEL_COLORS.inputBlue }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: PANEL_COLORS.textPrimary }}
              >
                {(targetElement?.config?.label as string) || targetSpec?.name || 'Unknown'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <ArrowRightIcon className="w-3 h-3" style={{ color: PANEL_COLORS.textTertiary }} />
              <span
                className="text-xs"
                style={{ color: PANEL_COLORS.inputBlue }}
              >
                {connection.to.port}
              </span>
            </div>
          </div>
        </div>

        {/* Transform selector */}
        <div className="space-y-2 pt-2">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            Transform
          </label>
          <div className="relative">
            <select
              value={currentTransform}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  // Remove transform if "None" selected
                  onUpdate({ transform: undefined });
                } else {
                  onUpdate({ transform: value as Connection['transform'] });
                }
              }}
              className={cn(
                'w-full px-3 py-2 pr-8 rounded-lg appearance-none',
                'text-sm font-medium',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-white/20'
              )}
              style={{
                backgroundColor: PANEL_COLORS.bgActive,
                color: PANEL_COLORS.textPrimary,
                border: `1px solid ${PANEL_COLORS.border}`,
              }}
            >
              {TRANSFORMS.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: PANEL_COLORS.textTertiary }}
            />
          </div>

          {/* Transform description */}
          <p
            className="text-xs"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            {TRANSFORMS.find(t => t.value === currentTransform)?.description || 'Select a transform'}
          </p>
        </div>
      </div>

      {/* Delete button */}
      <div
        className="p-4 border-t"
        style={{ borderColor: PANEL_COLORS.border }}
      >
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ opacity: 0.8 }}
          onClick={onDelete}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg',
            'flex items-center justify-center gap-2',
            'text-sm font-medium',
            'transition-colors duration-150'
          )}
          style={{
            backgroundColor: PANEL_COLORS.errorLight,
            color: PANEL_COLORS.error,
          }}
        >
          <TrashIcon className="w-4 h-4" />
          Delete Connection
        </motion.button>
      </div>
    </div>
  );
}

export type { ConnectionConfigProps as ConnectionConfigPropsType };
