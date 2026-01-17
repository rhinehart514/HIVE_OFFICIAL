'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button, Badge, Switch } from '@hive/ui/design-system/primitives';

// Re-export Switch from design system for backward compatibility
export { Switch };

export function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/[0.06] last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
      </div>
      <Switch size="sm" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'default',
  isLoading = false,
  requireTyping = false,
  typingWord = 'DELETE',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
  requireTyping?: boolean;
  typingWord?: string;
}) {
  const [typedText, setTypedText] = useState('');

  if (!open) return null;

  const canConfirm = !requireTyping || typedText === typingWord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`relative w-full max-w-md mx-4 rounded-xl bg-neutral-950 border p-6 shadow-2xl ${
          variant === 'danger' ? 'border-red-500/30' : 'border-white/[0.08]'
        }`}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {variant === 'danger' && (
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrashIcon className="h-8 w-8 text-red-400" />
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-2 text-center">{title}</h2>
        <p className="text-sm text-white/60 mb-6 text-center">{description}</p>

        {requireTyping && (
          <div className="mb-6">
            <p className="text-sm text-white mb-2 text-center">Type &quot;{typingWord}&quot; to confirm:</p>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={`Type ${typingWord}`}
              className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder:text-white/30 focus:outline-none ${
                variant === 'danger' ? 'border-red-500/30 focus:border-red-500' : 'border-white/20 focus:border-white/40'
              }`}
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setTypedText('');
              onOpenChange(false);
            }}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'brand'}
            onClick={() => {
              onConfirm();
              setTypedText('');
            }}
            disabled={isLoading || !canConfirm}
            className="flex-1"
          >
            {isLoading && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
        className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[var(--hive-brand-primary)]" aria-hidden="true" />
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && (
            <Badge variant="default" className="text-xs bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)] border-0">
              {badge}
            </Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
