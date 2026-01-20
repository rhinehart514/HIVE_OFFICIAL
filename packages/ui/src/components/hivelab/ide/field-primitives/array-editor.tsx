'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { PlusIcon, TrashIcon, Bars2Icon } from '@heroicons/react/24/outline';
import { cn } from '../../../../lib/utils';

// HiveLab dark theme
const COLORS = {
  bg: 'var(--hivelab-surface, #141414)',
  bgHover: 'var(--hivelab-surface-hover, #1A1A1A)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  borderFocus: 'rgba(255, 255, 255, 0.2)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  error: '#ef4444',
};

export interface ArrayEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  addButtonText?: string;
  maxItems?: number;
  minItems?: number;
  emptyMessage?: string;
  disabled?: boolean;
}

export function ArrayEditor({
  value = [],
  onChange,
  label,
  placeholder = 'Enter item...',
  addButtonText = 'Add Item',
  maxItems = 20,
  minItems = 0,
  emptyMessage = 'No items yet',
  disabled = false,
}: ArrayEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItemValue, setNewItemValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const newItemRef = useRef<HTMLInputElement>(null);

  const canAdd = value.length < maxItems && !disabled;
  const canRemove = value.length > minItems && !disabled;

  const handleAdd = useCallback(() => {
    if (!canAdd) return;
    const trimmed = newItemValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setNewItemValue('');
      // Focus back to input for rapid entry
      setTimeout(() => newItemRef.current?.focus(), 50);
    }
  }, [canAdd, newItemValue, value, onChange]);

  const handleRemove = useCallback((index: number) => {
    if (!canRemove) return;
    onChange(value.filter((_, i) => i !== index));
  }, [canRemove, value, onChange]);

  const handleUpdate = useCallback((index: number, newValue: string) => {
    const trimmed = newValue.trim();
    if (trimmed && !value.some((v, i) => i !== index && v === trimmed)) {
      const updated = [...value];
      updated[index] = trimmed;
      onChange(updated);
    }
    setEditingIndex(null);
  }, [value, onChange]);

  const handleReorder = useCallback((reordered: string[]) => {
    onChange(reordered);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index?: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index !== undefined) {
        // Finish editing existing item
        handleUpdate(index, (e.target as HTMLInputElement).value);
      } else {
        // Add new item
        handleAdd();
      }
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setNewItemValue('');
    }
  }, [handleAdd, handleUpdate]);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label
          className="block text-xs font-medium uppercase tracking-wide"
          style={{ color: COLORS.textSecondary }}
        >
          {label}
          {maxItems < 20 && (
            <span style={{ color: COLORS.textTertiary }}> ({value.length}/{maxItems})</span>
          )}
        </label>
      )}

      {/* Items list */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {value.length === 0 ? (
          <div
            className="px-3 py-4 text-center text-xs"
            style={{ color: COLORS.textTertiary }}
          >
            {emptyMessage}
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={handleReorder}
            className="divide-y"
            style={{ borderColor: COLORS.border }}
          >
            <AnimatePresence initial={false}>
              {value.map((item, index) => (
                <Reorder.Item
                  key={item}
                  value={item}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 group',
                    !disabled && 'cursor-grab active:cursor-grabbing'
                  )}
                  style={{ borderColor: COLORS.border }}
                >
                  {/* Drag handle */}
                  <Bars2Icon
                    className="w-3.5 h-3.5 flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
                    style={{ color: COLORS.textTertiary }}
                  />

                  {/* Item content */}
                  {editingIndex === index ? (
                    <input
                      ref={inputRef}
                      type="text"
                      defaultValue={item}
                      autoFocus
                      onBlur={(e) => handleUpdate(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="flex-1 bg-transparent text-sm outline-none px-1 -mx-1 rounded"
                      style={{
                        color: COLORS.text,
                        border: `1px solid ${COLORS.borderFocus}`,
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => !disabled && setEditingIndex(index)}
                      className={cn(
                        'flex-1 text-sm truncate px-1 -mx-1 rounded',
                        !disabled && 'hover:bg-white/5 cursor-text'
                      )}
                      style={{ color: COLORS.text }}
                    >
                      {item}
                    </span>
                  )}

                  {/* Delete button */}
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      style={{ color: COLORS.error }}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}

        {/* Add new item */}
        {canAdd && (
          <div
            className="flex items-center gap-2 px-2 py-1.5 border-t"
            style={{ borderColor: COLORS.border }}
          >
            <PlusIcon
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: COLORS.accent }}
            />
            <input
              ref={newItemRef}
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#5A5A5A]"
              style={{ color: COLORS.text }}
            />
            {newItemValue.trim() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={handleAdd}
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  color: COLORS.accent,
                }}
              >
                Add
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      {maxItems < 20 && value.length >= maxItems && (
        <p className="text-xs" style={{ color: COLORS.textTertiary }}>
          Maximum {maxItems} items reached
        </p>
      )}
    </div>
  );
}
