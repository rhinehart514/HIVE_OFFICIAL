'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@hive/ui';
import { Button } from '@hive/ui';
import { ArrowPathIcon, CheckIcon, GlobeAltIcon, LockClosedIcon, UsersIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface ToolSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: {
    id: string;
    name: string;
    description: string;
    visibility?: 'public' | 'private' | 'space';
    category?: string;
    status?: 'draft' | 'published' | 'archived';
  };
  onSave: (updates: {
    name: string;
    description: string;
    visibility: 'public' | 'private' | 'space';
    category: string;
  }) => Promise<void>;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can find and use this tool',
    icon: GlobeAltIcon,
  },
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Only you can see and use this tool',
    icon: LockClosedIcon,
  },
  {
    value: 'space' as const,
    label: 'Space Only',
    description: 'Only members of your space can use this tool',
    icon: UsersIcon,
  },
];

const CATEGORY_OPTIONS = [
  { value: 'productivity', label: 'Productivity' },
  { value: 'events', label: 'Events' },
  { value: 'communication', label: 'Communication' },
  { value: 'games', label: 'Games' },
  { value: 'education', label: 'Education' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

export function ToolSettingsModal({
  open,
  onOpenChange,
  tool,
  onSave,
}: ToolSettingsModalProps) {
  const [name, setName] = useState(tool.name);
  const [description, setDescription] = useState(tool.description);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'space'>(
    tool.visibility || 'private'
  );
  const [category, setCategory] = useState(tool.category || 'other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with new tool data
  useEffect(() => {
    if (open) {
      setName(tool.name);
      setDescription(tool.description);
      setVisibility(tool.visibility || 'private');
      setCategory(tool.category || 'other');
      setError(null);
    }
  }, [open, tool]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        visibility,
        category,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    name !== tool.name ||
    description !== tool.description ||
    visibility !== (tool.visibility || 'private') ||
    category !== (tool.category || 'other');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--text-primary)]">
            Tool Settings
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Configure your tool's name, visibility, and category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tool name"
              className={cn(
                'w-full px-4 py-3 rounded-lg',
                'bg-[var(--bg-subtle)] border border-[var(--border-subtle)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'transition-all duration-200',
                'hover:border-[var(--border-default)]',
                'focus:outline-none focus:border-[var(--border-emphasis)] focus:ring-2 focus:ring-white/10'
              )}
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this tool do?"
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-lg resize-none',
                'bg-[var(--bg-subtle)] border border-[var(--border-subtle)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'transition-all duration-200',
                'hover:border-[var(--border-default)]',
                'focus:outline-none focus:border-[var(--border-emphasis)] focus:ring-2 focus:ring-white/10'
              )}
            />
          </div>

          {/* Visibility Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Visibility
            </label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = visibility === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                      isSelected
                        ? 'border-[var(--border-emphasis)] bg-[var(--bg-muted)]'
                        : 'border-[var(--border-subtle)] bg-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-subtle)]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-[var(--bg-emphasis)]' : 'bg-[var(--bg-muted)]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-medium',
                            isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          )}
                        >
                          {option.label}
                        </span>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-[var(--life-gold)]" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                    category === option.value
                      ? 'bg-[var(--text-primary)] text-[var(--bg-ground)]'
                      : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-emphasis)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSubmitting || !hasChanges}
            className={cn(
              'flex-1',
              hasChanges
                ? 'bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold)]/90'
                : 'bg-[var(--bg-muted)] text-[var(--text-tertiary)]'
            )}
          >
            {isSubmitting ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
