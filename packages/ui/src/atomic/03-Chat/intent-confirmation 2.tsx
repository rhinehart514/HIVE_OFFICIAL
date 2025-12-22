'use client';

/**
 * IntentConfirmation - Confirmation UI for chat-detected component intents
 *
 * Shows when HiveLab detects a component creation intent in a chat message.
 * Allows users to preview and confirm before creating inline components.
 *
 * Part of HiveLab Winter 2025 Strategy: Chat-First Foundation
 *
 * @example
 * ```tsx
 * <IntentConfirmation
 *   intent={detectedIntent}
 *   onConfirm={handleCreate}
 *   onCancel={handleCancel}
 *   isCreating={isLoading}
 * />
 * ```
 */

import {
  BarChart3,
  Calendar,
  Timer,
  Megaphone,
  Sparkles,
  X,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../00-Global/atoms/button';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type IntentType = 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'help' | 'none';

export interface DetectedIntent {
  hasIntent: boolean;
  intentType: IntentType;
  confidence?: number;
  preview?: string;
  confirmation?: string;
  params?: Record<string, unknown>;
  canCreate?: boolean;
  error?: string;
}

export interface IntentConfirmationProps {
  /** The detected intent from the API */
  intent: DetectedIntent;

  /** Called when user confirms creation */
  onConfirm: () => void;

  /** Called when user cancels */
  onCancel: () => void;

  /** Whether component is being created */
  isCreating?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Metadata
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_METADATA: Record<IntentType, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}> = {
  poll: {
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Poll',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  rsvp: {
    icon: <Calendar className="h-5 w-5" />,
    label: 'RSVP',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  countdown: {
    icon: <Timer className="h-5 w-5" />,
    label: 'Countdown',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  announcement: {
    icon: <Megaphone className="h-5 w-5" />,
    label: 'Announcement',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  help: {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Help',
    color: 'text-white/60',
    bgColor: 'bg-white/10',
  },
  none: {
    icon: null,
    label: 'Unknown',
    color: 'text-white/40',
    bgColor: 'bg-white/5',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IntentConfirmation Component
 *
 * Displays when HiveLab AI detects a component creation intent in chat.
 * Shows preview of what will be created with confirm/cancel actions.
 */
export function IntentConfirmation({
  intent,
  onConfirm,
  onCancel,
  isCreating = false,
  className,
}: IntentConfirmationProps) {
  const metadata = INTENT_METADATA[intent.intentType] || INTENT_METADATA.none;

  // Don't render if no intent or can't create
  if (!intent.hasIntent || intent.intentType === 'none' || intent.intentType === 'help') {
    return null;
  }

  const confidencePercent = intent.confidence ? Math.round(intent.confidence * 100) : null;

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.12] bg-[#1a1a1a]',
        'shadow-lg shadow-black/30 overflow-hidden',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        className
      )}
      role="dialog"
      aria-label="Component creation confirmation"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              metadata.bgColor,
              metadata.color
            )}>
              {metadata.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">
                  Create {metadata.label}
                </span>
                {confidencePercent !== null && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    confidencePercent >= 80
                      ? 'bg-green-500/20 text-green-400'
                      : confidencePercent >= 60
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-white/10 text-white/50'
                  )}>
                    {confidencePercent}% confidence
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                HiveLab detected a component intent
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isCreating}
            className={cn(
              'p-1.5 rounded-md text-white/40 hover:text-white/70',
              'hover:bg-white/[0.06] transition-colors',
              isCreating && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      {(intent.preview || intent.confirmation) && (
        <div className="px-4 py-3">
          <div className="text-sm text-white/80 leading-relaxed">
            {intent.confirmation || intent.preview}
          </div>

          {/* Show params preview if available */}
          {intent.params && Object.keys(intent.params).length > 0 && (
            <div className="mt-3 space-y-1.5">
              {Object.entries(intent.params).map(([key, value]) => {
                // Skip internal fields
                if (key.startsWith('_')) return null;

                // Format the value for display
                let displayValue: string;
                if (Array.isArray(value)) {
                  displayValue = value.join(', ');
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (value instanceof Date) {
                  displayValue = value.toLocaleDateString();
                } else {
                  displayValue = String(value);
                }

                // Format the key for display
                const displayKey = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();

                return (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="text-white/40 shrink-0">{displayKey}:</span>
                    <span className="text-white/70">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {intent.error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400">{intent.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            {intent.canCreate === false
              ? 'Only leaders can create components'
              : 'This will be added to the chat'
            }
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isCreating}
              className="text-white/60 hover:text-white hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConfirm}
              disabled={isCreating || intent.canCreate === false}
              className={cn(
                'gap-1.5 transition-all',
                intent.canCreate === false
                  ? 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                  : 'bg-[var(--hive-gold-cta)] hover:brightness-110 text-black'
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Create
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact Variant (for inline display)
// ─────────────────────────────────────────────────────────────────────────────

export interface IntentConfirmationInlineProps {
  /** The detected intent */
  intent: DetectedIntent;

  /** Called when user confirms */
  onConfirm: () => void;

  /** Called when user dismisses */
  onDismiss: () => void;

  /** Creating state */
  isCreating?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Inline variant for showing in chat message area
 */
export function IntentConfirmationInline({
  intent,
  onConfirm,
  onDismiss,
  isCreating = false,
  className,
}: IntentConfirmationInlineProps) {
  const metadata = INTENT_METADATA[intent.intentType] || INTENT_METADATA.none;

  if (!intent.hasIntent || intent.intentType === 'none' || intent.intentType === 'help') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5',
        'bg-white/[0.03] border border-white/[0.08] rounded-lg',
        'animate-in slide-in-from-left-2 fade-in duration-150',
        className
      )}
    >
      <div className={cn(
        'p-1.5 rounded-md shrink-0',
        metadata.bgColor,
        metadata.color
      )}>
        {metadata.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">
          {intent.preview || `Create ${metadata.label.toLowerCase()}?`}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={isCreating}
          className="h-7 px-2 text-white/50 hover:text-white hover:bg-white/[0.06]"
        >
          Skip
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onConfirm}
          disabled={isCreating || intent.canCreate === false}
          className={cn(
            'h-7 px-3 gap-1',
            'bg-[var(--hive-gold-cta)] hover:brightness-110 text-black'
          )}
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Create
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default IntentConfirmation;
