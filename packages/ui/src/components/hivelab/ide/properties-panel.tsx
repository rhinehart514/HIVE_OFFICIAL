'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Settings,
  Type,
  Hash,
  ToggleLeft,
  List,
  Palette,
  Move,
  Maximize2,
  Trash2,
  Copy,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { springPresets, durationSeconds } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import type { CanvasElement } from './types';

// Validation shake animation
const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 },
};

// Hook for arrow key nudge feedback
function useNudgeFeedback() {
  const [nudgeDirection, setNudgeDirection] = useState<'up' | 'down' | null>(null);

  const triggerNudge = useCallback((direction: 'up' | 'down') => {
    setNudgeDirection(direction);
    setTimeout(() => setNudgeDirection(null), 150);
  }, []);

  return { nudgeDirection, triggerNudge };
}

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
}

// Element config schemas - defines what properties each element type has
const ELEMENT_SCHEMAS: Record<string, PropertySchema[]> = {
  'search-input': [
    { key: 'placeholder', type: 'string', label: 'Placeholder', default: 'Search...' },
    { key: 'showIcon', type: 'boolean', label: 'Show Icon', default: true },
    { key: 'autoFocus', type: 'boolean', label: 'Auto Focus', default: false },
  ],
  'form-builder': [
    { key: 'title', type: 'string', label: 'Form Title', default: 'Form' },
    { key: 'submitLabel', type: 'string', label: 'Submit Button', default: 'Submit' },
    { key: 'fields', type: 'array', label: 'Fields', default: [] },
  ],
  'date-picker': [
    { key: 'label', type: 'string', label: 'Label', default: 'Select Date' },
    { key: 'allowRange', type: 'boolean', label: 'Allow Range', default: false },
    { key: 'showTime', type: 'boolean', label: 'Show Time', default: false },
  ],
  'result-list': [
    { key: 'itemsPerPage', type: 'number', label: 'Items Per Page', default: 10 },
    { key: 'showPagination', type: 'boolean', label: 'Show Pagination', default: true },
    { key: 'layout', type: 'select', label: 'Layout', options: ['list', 'grid', 'cards'], default: 'list' },
  ],
  'poll-element': [
    { key: 'question', type: 'string', label: 'Question', default: 'What do you think?' },
    { key: 'allowMultiple', type: 'boolean', label: 'Multiple Choice', default: false },
    { key: 'showResults', type: 'boolean', label: 'Show Results', default: true },
  ],
  'countdown-timer': [
    { key: 'targetDate', type: 'string', label: 'Target Date', default: '' },
    { key: 'label', type: 'string', label: 'Label', default: 'Time Remaining' },
    { key: 'showDays', type: 'boolean', label: 'Show Days', default: true },
  ],
  'leaderboard': [
    { key: 'title', type: 'string', label: 'Title', default: 'Leaderboard' },
    { key: 'maxItems', type: 'number', label: 'Max Items', default: 10 },
    { key: 'showRank', type: 'boolean', label: 'Show Rank', default: true },
  ],
};

interface PropertySchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'color';
  label: string;
  default: unknown;
  options?: string[];
  min?: number;
  max?: number;
}

interface PropertyFieldProps {
  schema: PropertySchema;
  value: unknown;
  onChange: (value: unknown) => void;
  hasError?: boolean;
}

function PropertyField({ schema, value, onChange, hasError = false }: PropertyFieldProps) {
  const currentValue = value ?? schema.default;
  const prefersReducedMotion = useReducedMotion();
  const { nudgeDirection, triggerNudge } = useNudgeFeedback();
  const [isFocused, setIsFocused] = useState(false);

  // Handle arrow key nudge for number inputs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (schema.type !== 'number') return;
      if (e.key === 'ArrowUp') {
        triggerNudge('up');
      } else if (e.key === 'ArrowDown') {
        triggerNudge('down');
      }
    },
    [schema.type, triggerNudge]
  );

  switch (schema.type) {
    case 'string':
      return (
        <motion.div
          animate={hasError && !prefersReducedMotion ? shakeAnimation : {}}
          className="relative"
        >
          <input
            type="text"
            value={currentValue as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-[#252525] border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-all duration-150',
              hasError
                ? 'border-red-500 ring-2 ring-red-500/20'
                : isFocused
                  ? 'border-[#FFD700] ring-2 ring-[#FFD700]/20'
                  : 'border-[#333]'
            )}
          />
          {hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
            </motion.div>
          )}
        </motion.div>
      );

    case 'number':
      return (
        <motion.div
          animate={
            hasError && !prefersReducedMotion
              ? shakeAnimation
              : nudgeDirection && !prefersReducedMotion
                ? { y: nudgeDirection === 'up' ? -2 : 2 }
                : { y: 0 }
          }
          transition={nudgeDirection ? springPresets.snappy : undefined}
          className="relative"
        >
          <input
            type="number"
            value={currentValue as number}
            min={schema.min}
            max={schema.max}
            onChange={(e) => onChange(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-[#252525] border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-all duration-150 font-mono',
              hasError
                ? 'border-red-500 ring-2 ring-red-500/20'
                : isFocused
                  ? 'border-[#FFD700] ring-2 ring-[#FFD700]/20'
                  : 'border-[#333]'
            )}
          />
          {/* Arrow key feedback indicator */}
          <AnimatePresence>
            {nudgeDirection && !prefersReducedMotion && (
              <motion.div
                initial={{ opacity: 0, y: nudgeDirection === 'up' ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 text-[#FFD700]',
                  nudgeDirection === 'up' ? 'rotate-180' : ''
                )}
              >
                <ChevronDown className="h-3 w-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );

    case 'boolean':
      return (
        <motion.button
          type="button"
          onClick={() => onChange(!currentValue)}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className={cn(
            'w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200',
            currentValue ? 'bg-[#FFD700]' : 'bg-[#333] hover:bg-[#444]'
          )}
        >
          {/* Track glow when on */}
          {Boolean(currentValue) && !prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="absolute inset-0 rounded-full bg-[#FFD700] blur-sm"
            />
          )}
          {/* Thumb with spring physics */}
          <motion.div
            animate={{
              x: Boolean(currentValue) ? 24 : 2,
              scale: Boolean(currentValue) ? 1 : 0.95,
            }}
            transition={springPresets.snappy}
            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md z-10"
          />
          {/* Check mark inside thumb when on */}
          <AnimatePresence>
            {Boolean(currentValue) && !prefersReducedMotion && (
              <motion.svg
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute left-[26px] top-1.5 w-3 h-3 text-[#FFD700] z-20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      );

    case 'select':
      return (
        <motion.div
          animate={hasError && !prefersReducedMotion ? shakeAnimation : {}}
        >
          <select
            value={currentValue as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-[#252525] border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-all duration-150 cursor-pointer',
              hasError
                ? 'border-red-500 ring-2 ring-red-500/20'
                : isFocused
                  ? 'border-[#FFD700] ring-2 ring-[#FFD700]/20'
                  : 'border-[#333]'
            )}
          >
            {schema.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </motion.div>
      );

    default:
      return <span className="text-xs text-[#666]">Unsupported type</span>;
  }
}

function Section({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="border-b border-[#333]">
      <motion.button
        type="button"
        onClick={() => setExpanded(!expanded)}
        whileHover={prefersReducedMotion ? {} : { backgroundColor: 'rgba(37, 37, 37, 0.8)' }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
        className="flex items-center justify-between w-full px-3 py-2 text-left transition-colors"
      >
        <span className="text-xs font-medium text-[#888] uppercase tracking-wider">
          {title}
        </span>
        {/* Spring-animated chevron rotation */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
        >
          <ChevronRight className="h-3.5 w-3.5 text-[#666]" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : springPresets.gentle}
            className="overflow-hidden"
          >
            <motion.div
              initial={prefersReducedMotion ? {} : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.05, ...springPresets.snappy }
              }
              className="px-3 pb-3 space-y-3"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}: PropertiesPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!selectedElement) {
    return (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.02, 1],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Settings className="h-12 w-12 text-[#333] mb-4" />
        </motion.div>
        <h3 className="text-sm font-medium text-white mb-1">No Selection</h3>
        <p className="text-xs text-[#666]">Select an element to view its properties</p>
      </motion.div>
    );
  }

  const displayName = selectedElement.elementId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const schema = ELEMENT_SCHEMAS[selectedElement.elementId] || [];

  const updateConfig = (key: string, value: unknown) => {
    onUpdateElement(selectedElement.id, {
      config: { ...selectedElement.config, [key]: value },
    });
  };

  return (
    <motion.div
      key={selectedElement.id}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springPresets.snappy}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-[#333]">
        <div className="flex items-center justify-between">
          <motion.h3
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm font-medium text-white"
          >
            {displayName}
          </motion.h3>
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={() =>
                onUpdateElement(selectedElement.id, { visible: !selectedElement.visible })
              }
              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              className="p-1.5 text-[#666] hover:text-white rounded transition-colors"
              title={selectedElement.visible ? 'Hide' : 'Show'}
            >
              <AnimatePresence mode="wait">
                {selectedElement.visible ? (
                  <motion.div
                    key="visible"
                    initial={prefersReducedMotion ? {} : { scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={springPresets.snappy}
                  >
                    <Eye className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={prefersReducedMotion ? {} : { scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={springPresets.snappy}
                  >
                    <EyeOff className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              type="button"
              onClick={() =>
                onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })
              }
              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              animate={
                selectedElement.locked && !prefersReducedMotion
                  ? { rotate: [0, -5, 5, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
              className={cn(
                'p-1.5 rounded transition-colors',
                selectedElement.locked
                  ? 'text-[#FFD700] bg-[#FFD700]/10'
                  : 'text-[#666] hover:text-white'
              )}
              title={selectedElement.locked ? 'Unlock' : 'Lock'}
            >
              <Lock className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-[#666] mt-1"
        >
          ID: {selectedElement.id}
        </motion.p>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto">
        {/* Transform */}
        <Section title="Transform">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#666] mb-1 block">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    position: { ...selectedElement.position, x: Number(e.target.value) },
                  })
                }
                className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1 block">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    position: { ...selectedElement.position, y: Number(e.target.value) },
                  })
                }
                className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1 block">Width</label>
              <input
                type="number"
                value={selectedElement.size.width}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    size: { ...selectedElement.size, width: Number(e.target.value) },
                  })
                }
                className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1 block">Height</label>
              <input
                type="number"
                value={selectedElement.size.height}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    size: { ...selectedElement.size, height: Number(e.target.value) },
                  })
                }
                className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FFD700]"
              />
            </div>
          </div>
        </Section>

        {/* Element Config */}
        {schema.length > 0 && (
          <Section title="Configuration">
            {schema.map((prop) => (
              <div key={prop.key}>
                <label className="text-xs text-[#666] mb-1 block">{prop.label}</label>
                <PropertyField
                  schema={prop}
                  value={selectedElement.config[prop.key]}
                  onChange={(value) => updateConfig(prop.key, value)}
                />
              </div>
            ))}
          </Section>
        )}

        {/* Layout */}
        <Section title="Layout" defaultExpanded={false}>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Z-Index</label>
            <input
              type="number"
              value={selectedElement.zIndex || 1}
              onChange={(e) =>
                onUpdateElement(selectedElement.id, { zIndex: Number(e.target.value) })
              }
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FFD700]"
            />
          </div>
        </Section>
      </div>

      {/* Actions */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-3 py-3 border-t border-[#333] space-y-2"
      >
        <motion.button
          type="button"
          onClick={() => onDuplicateElement(selectedElement.id)}
          whileHover={prefersReducedMotion ? {} : { scale: 1.02, backgroundColor: '#333' }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#252525] text-white rounded-lg transition-colors text-sm"
        >
          <motion.div
            whileHover={prefersReducedMotion ? {} : { rotate: 15 }}
            transition={springPresets.snappy}
          >
            <Copy className="h-4 w-4" />
          </motion.div>
          Duplicate
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onDeleteElement(selectedElement.id)}
          whileHover={
            prefersReducedMotion
              ? {}
              : { scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.2)' }
          }
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-400 rounded-lg transition-colors text-sm group"
        >
          <motion.div
            whileHover={prefersReducedMotion ? {} : { rotate: -10, scale: 1.1 }}
            transition={springPresets.snappy}
          >
            <Trash2 className="h-4 w-4" />
          </motion.div>
          Delete
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
