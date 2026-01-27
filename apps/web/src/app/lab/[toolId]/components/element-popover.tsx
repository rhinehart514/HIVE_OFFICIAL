'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface ElementConfig {
  [key: string]: unknown;
}

interface ElementPopoverProps {
  element: {
    id: string;
    elementId: string;
    instanceId: string;
    config: ElementConfig;
  };
  position: { x: number; y: number };
  onClose: () => void;
  onUpdate: (config: ElementConfig) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// Element-specific config schemas
const ELEMENT_CONFIGS: Record<string, Array<{
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  defaultValue?: unknown;
}>> = {
  'poll-element': [
    { key: 'question', label: 'Question', type: 'text', placeholder: 'What would you like to ask?' },
    { key: 'options', label: 'Options (comma separated)', type: 'textarea', placeholder: 'Option 1, Option 2, Option 3' },
    { key: 'allowMultiple', label: 'Allow multiple votes', type: 'boolean', defaultValue: false },
    { key: 'showResults', label: 'Show results', type: 'boolean', defaultValue: true },
  ],
  'countdown-timer': [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Event name' },
    { key: 'targetDate', label: 'Target date', type: 'text', placeholder: 'YYYY-MM-DD HH:MM' },
    { key: 'showDays', label: 'Show days', type: 'boolean', defaultValue: true },
    { key: 'showHours', label: 'Show hours', type: 'boolean', defaultValue: true },
  ],
  'form-builder': [
    { key: 'title', label: 'Form title', type: 'text', placeholder: 'Form title' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
    { key: 'submitLabel', label: 'Submit button text', type: 'text', placeholder: 'Submit', defaultValue: 'Submit' },
  ],
  'chart-display': [
    { key: 'title', label: 'Chart title', type: 'text', placeholder: 'Chart title' },
    { key: 'chartType', label: 'Chart type', type: 'select', options: ['bar', 'line', 'pie', 'doughnut'] },
    { key: 'showLegend', label: 'Show legend', type: 'boolean', defaultValue: true },
  ],
  'leaderboard': [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Leaderboard title' },
    { key: 'maxItems', label: 'Max items', type: 'number', defaultValue: 10 },
    { key: 'showRank', label: 'Show rank numbers', type: 'boolean', defaultValue: true },
  ],
  'button-element': [
    { key: 'label', label: 'Button text', type: 'text', placeholder: 'Click me' },
    { key: 'variant', label: 'Style', type: 'select', options: ['primary', 'secondary', 'ghost'] },
    { key: 'action', label: 'Action', type: 'select', options: ['link', 'submit', 'custom'] },
  ],
};

export function ElementPopover({
  element,
  position,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: ElementPopoverProps) {
  const [config, setConfig] = useState<ElementConfig>(element.config || {});
  const popoverRef = useRef<HTMLDivElement>(null);

  const schema = ELEMENT_CONFIGS[element.elementId] || [];

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleChange = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  const handleDelete = () => {
    if (confirm('Delete this element?')) {
      onDelete();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-50 w-80 rounded-xl bg-[#1E1D1B] border border-white/[0.06] shadow-2xl overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 340),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Cog6ToothIcon className="w-4 h-4 text-[#6B6B70]" />
            <span className="font-medium text-[#FAF9F7] capitalize">
              {element.elementId.replace(/-/g, ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.04] text-[#6B6B70] hover:text-[#A3A19E]"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Config fields */}
        <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
          {schema.length === 0 ? (
            <p className="text-[#6B6B70] text-sm text-center py-4">
              No configurable options
            </p>
          ) : (
            schema.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-[#A3A19E] mb-1.5">
                  {field.label}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={(config[field.key] as string) || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-[#FAF9F7] placeholder:text-[#6B6B70] text-sm
                      focus:outline-none focus:border-white/[0.24] transition-colors"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={(config[field.key] as string) || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-[#FAF9F7] placeholder:text-[#6B6B70] text-sm resize-none
                      focus:outline-none focus:border-white/[0.24] transition-colors"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={(config[field.key] as number) ?? field.defaultValue ?? ''}
                    onChange={(e) => handleChange(field.key, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-[#FAF9F7] text-sm
                      focus:outline-none focus:border-white/[0.24] transition-colors"
                  />
                )}

                {field.type === 'boolean' && (
                  <button
                    onClick={() => handleChange(field.key, !config[field.key])}
                    className={`
                      relative w-10 h-6 rounded-full transition-colors duration-200
                      ${config[field.key] ? 'bg-[var(--life-gold)]/30' : 'bg-white/[0.06]'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 rounded-full transition-all duration-200
                        ${config[field.key]
                          ? 'left-5 bg-[var(--life-gold)]'
                          : 'left-1 bg-[#6B6B70]'
                        }
                      `}
                    />
                  </button>
                )}

                {field.type === 'select' && field.options && (
                  <select
                    value={(config[field.key] as string) || field.options[0]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-[#FAF9F7] text-sm
                      focus:outline-none focus:border-white/[0.24] transition-colors"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#1E1D1B]">
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-1">
            <button
              onClick={onDuplicate}
              className="p-2 rounded-lg text-[#6B6B70] hover:text-[#A3A19E] hover:bg-white/[0.04]
                transition-colors"
              title="Duplicate"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-[#6B6B70] hover:text-red-400 hover:bg-red-500/10
                transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-[#A3A19E] text-sm font-medium
              hover:bg-white/[0.10] transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
