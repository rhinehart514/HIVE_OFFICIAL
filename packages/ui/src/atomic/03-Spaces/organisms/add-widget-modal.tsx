'use client';

/**
 * Add Widget Modal
 * Modal for creating a new widget in a space
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, BarChart3, Link, FileText, Rss, Sparkles } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { Input } from '../../00-Global/atoms/input';

// ============================================================
// Types
// ============================================================

export type WidgetType = 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom';

export interface AddWidgetInput {
  type: WidgetType;
  title: string;
  config?: Record<string, unknown>;
}

export interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AddWidgetInput) => Promise<void>;
  className?: string;
}

// ============================================================
// Widget Type Options
// ============================================================

const WIDGET_TYPES: Array<{
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultTitle: string;
}> = [
  {
    type: 'calendar',
    label: 'Calendar',
    description: 'Display upcoming events',
    icon: Calendar,
    defaultTitle: 'Events',
  },
  {
    type: 'poll',
    label: 'Poll',
    description: 'Create polls and surveys',
    icon: BarChart3,
    defaultTitle: 'Poll',
  },
  {
    type: 'links',
    label: 'Links',
    description: 'Curated link collection',
    icon: Link,
    defaultTitle: 'Quick Links',
  },
  {
    type: 'files',
    label: 'Files',
    description: 'Shared files and documents',
    icon: FileText,
    defaultTitle: 'Files',
  },
  {
    type: 'rss',
    label: 'RSS Feed',
    description: 'Import content from RSS',
    icon: Rss,
    defaultTitle: 'News Feed',
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Build your own widget',
    icon: Sparkles,
    defaultTitle: 'Custom Widget',
  },
];

// ============================================================
// Main Component
// ============================================================

export function AddWidgetModal({
  open,
  onOpenChange,
  onSubmit,
  className,
}: AddWidgetModalProps) {
  const [selectedType, setSelectedType] = React.useState<WidgetType | null>(null);
  const [title, setTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<'select' | 'configure'>('select');

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedType(null);
      setTitle('');
      setError(null);
      setStep('select');
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

  // Handle type selection
  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type);
    const widgetOption = WIDGET_TYPES.find((w) => w.type === type);
    setTitle(widgetOption?.defaultTitle || '');
    setStep('configure');
  };

  // Validation
  const trimmedTitle = title.trim();
  const isValid = selectedType && trimmedTitle.length > 0 && trimmedTitle.length <= 50;

  const handleSubmit = async () => {
    if (!isValid || !selectedType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ type: selectedType, title: trimmedTitle });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create widget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedType(null);
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
              <h2 className="text-base font-semibold text-[var(--hive-text-primary)]">
                {step === 'select' ? 'Add Widget' : 'Configure Widget'}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {step === 'select' ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {WIDGET_TYPES.map((widgetType) => {
                      const Icon = widgetType.icon;
                      return (
                        <button
                          key={widgetType.type}
                          onClick={() => handleSelectType(widgetType.type)}
                          className="flex flex-col items-start p-3 rounded-xl border border-[var(--hive-border-default)] hover:border-[var(--hive-brand-primary)] bg-[var(--hive-background-tertiary)] hover:bg-[var(--hive-brand-primary)]/5 transition-all text-left group"
                        >
                          <Icon className="h-5 w-5 mb-2 text-[var(--hive-text-tertiary)] group-hover:text-[var(--hive-brand-primary)] transition-colors" />
                          <span className="text-sm font-medium text-[var(--hive-text-secondary)] group-hover:text-[var(--hive-text-primary)] transition-colors">
                            {widgetType.label}
                          </span>
                          <span className="text-xs text-[var(--hive-text-tertiary)] line-clamp-2">
                            {widgetType.description}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="configure"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* Selected type indicator */}
                    {selectedType && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--hive-background-tertiary)]">
                        {(() => {
                          const widgetOption = WIDGET_TYPES.find((w) => w.type === selectedType);
                          if (!widgetOption) return null;
                          const Icon = widgetOption.icon;
                          return (
                            <>
                              <Icon className="h-4 w-4 text-[var(--hive-brand-primary)]" />
                              <span className="text-sm font-medium text-[var(--hive-text-primary)]">
                                {widgetOption.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Widget title */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                        Widget Title
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for this widget"
                        className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                        maxLength={50}
                        autoFocus
                      />
                      {trimmedTitle.length > 0 && (
                        <p className="mt-1 text-xs text-[var(--hive-text-tertiary)]">
                          {50 - trimmedTitle.length} characters remaining
                        </p>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-[var(--hive-status-error)] bg-[var(--hive-status-error)]/10 rounded-lg p-2">
                        {error}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--hive-border-default)]">
              <div>
                {step === 'configure' && (
                  <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {step === 'configure' && (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                    className="bg-white text-black hover:bg-neutral-100"
                  >
                    {isSubmitting ? 'Creating...' : 'Add Widget'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

AddWidgetModal.displayName = 'AddWidgetModal';
