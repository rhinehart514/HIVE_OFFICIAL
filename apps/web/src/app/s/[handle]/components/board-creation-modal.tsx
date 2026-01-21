'use client';

/**
 * BoardCreationModal - Create new board for a Space
 * CREATED: Jan 21, 2026
 *
 * Simple modal for space leaders to create new boards/channels.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { HashtagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button, Text } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';

interface BoardCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
  spaceHandle: string;
}

export function BoardCreationModal({
  isOpen,
  onClose,
  onCreate,
  spaceHandle,
}: BoardCreationModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState('');

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const handleCreate = async () => {
    // Validation
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) {
      setError('Board name is required');
      return;
    }

    // Basic validation for board name (alphanumeric and hyphens)
    if (!/^[a-z0-9-]+$/.test(trimmedName)) {
      setError('Board name can only contain letters, numbers, and hyphens');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreate(trimmedName, description.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.15, ease: MOTION.ease.premium }}
        className="fixed left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.1), 0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2
                className="text-[22px] font-semibold text-white mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Create Board
              </h2>
              <Text size="sm" tone="muted">
                Add a new board to @{spaceHandle}
              </Text>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Board Name */}
            <div>
              <label className="block mb-2">
                <Text size="sm" weight="medium">
                  Board Name
                </Text>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  <HashtagIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="general, announcements, random"
                  disabled={isCreating}
                  autoFocus
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5',
                    'rounded-xl text-sm',
                    'bg-white/[0.04] border border-white/[0.08]',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:ring-2 focus:ring-white/20',
                    'disabled:opacity-50',
                    'transition-all duration-150'
                  )}
                />
              </div>
              <Text size="xs" tone="muted" className="mt-1.5">
                Lowercase, no spaces. Use hyphens for multi-word names.
              </Text>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block mb-2">
                <Text size="sm" weight="medium">
                  Description <span className="text-white/30">(optional)</span>
                </Text>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this board for?"
                disabled={isCreating}
                rows={2}
                className={cn(
                  'w-full px-4 py-2.5',
                  'rounded-xl text-sm',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'text-white placeholder:text-white/30',
                  'resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-white/20',
                  'disabled:opacity-50',
                  'transition-all duration-150'
                )}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <Text size="sm" className="text-red-400">
                  {error}
                </Text>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="default"
              size="default"
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              loading={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Board'}
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

BoardCreationModal.displayName = 'BoardCreationModal';
