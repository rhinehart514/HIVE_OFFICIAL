'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getElementById } from '@hive/core';
import { cn } from '../../../lib/utils';
import type { CanvasElement } from './types';

// HiveLab Dark Panel Colors (shared with context-rail)
const PICKER_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #252525)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  outputGreen: '#22C55E',
  outputGreenLight: 'rgba(34, 197, 94, 0.15)',
  inputBlue: '#3B82F6',
  inputBlueLight: 'rgba(59, 130, 246, 0.15)',
};

export interface PortPickerProps {
  element: CanvasElement;
  direction: 'input' | 'output';
  anchorPosition: { x: number; y: number };
  onSelect: (portName: string) => void;
  onClose: () => void;
}

export function PortPicker({
  element,
  direction,
  anchorPosition,
  onSelect,
  onClose
}: PortPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Get element spec to find available ports
  const spec = getElementById(element.elementId);
  const ports = direction === 'output'
    ? (spec?.outputs || ['output'])
    : (spec?.inputs || ['input']);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    // Close on Escape
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isOutput = direction === 'output';
  const accentColor = isOutput ? PICKER_COLORS.outputGreen : PICKER_COLORS.inputBlue;
  const accentBg = isOutput ? PICKER_COLORS.outputGreenLight : PICKER_COLORS.inputBlueLight;

  // Format port name for display (camelCase → Title Case)
  const formatPortName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="fixed z-[9999] min-w-[180px] max-w-[240px] rounded-lg shadow-xl"
        style={{
          left: anchorPosition.x,
          top: anchorPosition.y,
          backgroundColor: PICKER_COLORS.bg,
          border: `1px solid ${PICKER_COLORS.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: PICKER_COLORS.border }}
        >
          <div className="flex items-center gap-2">
            {isOutput ? (
              <ArrowRightIcon className="w-3.5 h-3.5" style={{ color: accentColor }} />
            ) : (
              <ArrowLeftIcon className="w-3.5 h-3.5" style={{ color: accentColor }} />
            )}
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: PICKER_COLORS.textSecondary }}
            >
              {isOutput ? 'Outputs' : 'Inputs'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" style={{ color: PICKER_COLORS.textTertiary }} />
          </button>
        </div>

        {/* Port list */}
        <div className="py-1">
          {ports.length === 0 ? (
            <div
              className="px-3 py-2 text-xs"
              style={{ color: PICKER_COLORS.textTertiary }}
            >
              No {direction}s available
            </div>
          ) : (
            ports.map((port) => (
              <button
                key={port}
                onClick={() => onSelect(port)}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-2 text-left',
                  'transition-colors duration-150',
                  'hover:bg-white/5 focus:bg-white/5 focus:outline-none'
                )}
              >
                {/* Port indicator dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Port name */}
                <span
                  className="text-sm font-medium flex-1 truncate"
                  style={{ color: PICKER_COLORS.textPrimary }}
                >
                  {formatPortName(port)}
                </span>

                {/* Type hint badge */}
                <span
                  className="text-label-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: accentBg,
                    color: accentColor,
                  }}
                >
                  {port}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Element name footer */}
        <div
          className="px-3 py-1.5 border-t"
          style={{ borderColor: PICKER_COLORS.border }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="text-label-xs"
              style={{ color: PICKER_COLORS.textTertiary }}
            >
              From:
            </span>
            <span
              className="text-label-xs font-medium truncate"
              style={{ color: PICKER_COLORS.textSecondary }}
            >
              {(element.config?.label as string) || spec?.name || element.elementId}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Re-export for convenience
export type { PortPickerProps as PortPickerPropsType };
