'use client';

/**
 * Add Tab Modal
 * Modal for creating a new tab in a space
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Layout, Folder, Sparkles } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { Input } from '../../00-Global/atoms/input';

// ============================================================
// Types
// ============================================================

export type TabType = 'feed' | 'widget' | 'resource' | 'custom';

export interface AddTabInput {
  name: string;
  type: TabType;
}

export interface AddTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AddTabInput) => Promise<void>;
  existingTabNames?: string[];
  className?: string;
}

// ============================================================
// Tab Type Options
// ============================================================

const TAB_TYPES: Array<{
  type: TabType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: 'feed',
    label: 'Feed',
    description: 'A feed of posts and discussions',
    icon: FileText,
  },
  {
    type: 'widget',
    label: 'Widgets',
    description: 'Add polls, calendars, and more',
    icon: Layout,
  },
  {
    type: 'resource',
    label: 'Resources',
    description: 'Files, links, and documents',
    icon: Folder,
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Create your own tab type',
    icon: Sparkles,
  },
];

// ============================================================
// Main Component
// ============================================================

export function AddTabModal({
  open,
  onOpenChange,
  onSubmit,
  existingTabNames = [],
  className,
}: AddTabModalProps) {
  const [name, setName] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<TabType>('feed');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setName('');
      setSelectedType('feed');
      setError(null);
    }
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Validation
  const trimmedName = name.trim();
  const isDuplicateName = existingTabNames.some(
    (existing) => existing.toLowerCase() === trimmedName.toLowerCase()
  );
  const isValid = trimmedName.length > 0 && trimmedName.length <= 30 && !isDuplicateName;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ name: trimmedName, type: selectedType });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tab');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative w-full max-w-md mx-4 bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-2xl shadow-2xl',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hive-border-default)]">
              <h2 className="text-base font-semibold text-[var(--hive-text-primary)]">Add Tab</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Tab name */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                  Tab Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Events, Resources, Discussion"
                  className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                  maxLength={30}
                  autoFocus
                />
                {isDuplicateName && (
                  <p className="mt-1 text-xs text-[var(--hive-status-error)]">
                    A tab with this name already exists
                  </p>
                )}
                {trimmedName.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--hive-text-tertiary)]">
                    {30 - trimmedName.length} characters remaining
                  </p>
                )}
              </div>

              {/* Tab type selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-2">
                  Tab Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TAB_TYPES.map((tabType) => {
                    const Icon = tabType.icon;
                    const isSelected = selectedType === tabType.type;
                    return (
                      <button
                        key={tabType.type}
                        onClick={() => setSelectedType(tabType.type)}
                        className={cn(
                          'flex flex-col items-start p-3 rounded-xl border transition-all text-left',
                          isSelected
                            ? 'border-[var(--hive-brand-primary)] bg-[var(--hive-brand-primary)]/10'
                            : 'border-[var(--hive-border-default)] hover:border-[var(--hive-border-hover)] bg-[var(--hive-background-tertiary)]'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 mb-2',
                            isSelected
                              ? 'text-[var(--hive-brand-primary)]'
                              : 'text-[var(--hive-text-tertiary)]'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isSelected
                              ? 'text-[var(--hive-text-primary)]'
                              : 'text-[var(--hive-text-secondary)]'
                          )}
                        >
                          {tabType.label}
                        </span>
                        <span className="text-xs text-[var(--hive-text-tertiary)] line-clamp-2">
                          {tabType.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-[var(--hive-status-error)] bg-[var(--hive-status-error)]/10 rounded-lg p-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--hive-border-default)]">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="bg-white text-black hover:bg-neutral-100"
              >
                {isSubmitting ? 'Creating...' : 'Create Tab'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

AddTabModal.displayName = 'AddTabModal';
