'use client';

/**
 * IntentConfirmationInline Component
 *
 * Inline card for confirming detected user intents.
 * Shows preview of what will be created with confirm/cancel actions.
 */

import * as React from 'react';
import { Button } from '../../primitives';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

export type IntentType = 'event' | 'poll' | 'task' | 'announcement' | 'reminder' | 'question';

export interface IntentPreview {
  type: IntentType;
  title?: string;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface IntentConfirmationInlineProps {
  intent?: IntentPreview | null;
  onConfirm?: () => Promise<void>;
  onCancel?: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
  className?: string;
}

const INTENT_CONFIG: Record<
  IntentType,
  { icon: string; label: string; actionLabel: string; color: string }
> = {
  event: {
    icon: '📅',
    label: 'Create Event',
    actionLabel: 'Create Event',
    color: 'var(--color-life-gold)',
  },
  poll: {
    icon: '📊',
    label: 'Create Poll',
    actionLabel: 'Create Poll',
    color: 'var(--color-life-gold)',
  },
  task: {
    icon: '✅',
    label: 'Create Task',
    actionLabel: 'Create Task',
    color: 'var(--color-life-gold)',
  },
  announcement: {
    icon: '📢',
    label: 'Make Announcement',
    actionLabel: 'Announce',
    color: 'var(--color-life-gold)',
  },
  reminder: {
    icon: '⏰',
    label: 'Set Reminder',
    actionLabel: 'Set Reminder',
    color: 'var(--color-life-gold)',
  },
  question: {
    icon: '❓',
    label: 'Ask Question',
    actionLabel: 'Post Question',
    color: 'var(--color-life-gold)',
  },
};

const IntentConfirmationInline: React.FC<IntentConfirmationInlineProps> = ({
  intent,
  onConfirm,
  onCancel,
  onEdit,
  isLoading = false,
  className,
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  if (!intent) return null;

  const config = INTENT_CONFIG[intent.type];

  const handleConfirm = async () => {
    if (isConfirming || isLoading) return;

    setIsConfirming(true);
    try {
      await onConfirm?.();
    } finally {
      setIsConfirming(false);
    }
  };

  const renderMetadata = () => {
    if (!intent.metadata) return null;

    const entries = Object.entries(intent.metadata).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    );

    if (entries.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {entries.slice(0, 4).map(([key, value]) => (
          <span
            key={key}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
              'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]',
              'text-xs'
            )}
          >
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className="font-medium text-[var(--color-text-secondary)]">
              {String(value)}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-bg-elevated)]',
        'p-4',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        className
      )}
    >
      {/* Header with intent type */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            'bg-[var(--color-life-gold)]/10'
          )}
        >
          <span className="text-xl">{config.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="medium" className="text-[var(--color-text-primary)]">
            {config.label}
          </Text>
          <Text size="xs" tone="muted">
            Detected from your message
          </Text>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'p-2 rounded-lg',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              'hover:bg-[var(--color-bg-muted)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Preview content */}
      <div className="bg-[var(--color-bg-muted)] rounded-lg p-3 mb-3">
        {intent.title && (
          <Text size="sm" weight="medium" className="text-[var(--color-text-primary)]">
            {intent.title}
          </Text>
        )}
        {intent.description && (
          <Text size="sm" tone="secondary" className="mt-1 line-clamp-2">
            {intent.description}
          </Text>
        )}
        {renderMetadata()}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="cta"
          onClick={handleConfirm}
          disabled={isConfirming || isLoading}
          loading={isConfirming || isLoading}
          className="flex-1"
        >
          {config.actionLabel}
        </Button>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isConfirming || isLoading}
        >
          Cancel
        </Button>
      </div>

      {/* Loading overlay */}
      {(isConfirming || isLoading) && (
        <div className="absolute inset-0 bg-[var(--color-bg-elevated)]/50 rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
            <Text size="sm" tone="secondary">
              Creating...
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

IntentConfirmationInline.displayName = 'IntentConfirmationInline';

export { IntentConfirmationInline };
