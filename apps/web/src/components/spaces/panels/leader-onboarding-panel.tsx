/**
 * Leader Onboarding Panel - Setup checklist for new space leaders
 *
 * Shows a checklist of key actions for new space leaders:
 * - Invite first member
 * - Create first event
 * - Post announcement
 * - Customize settings
 *
 * Can be dismissed and won't show again once all items are done.
 *
 * @version 1.0.0 - Jan 2026
 */

"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlusIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui';

// ============================================================
// Types
// ============================================================

export interface OnboardingTask {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: boolean;
  action?: () => void;
  actionLabel?: string;
}

export interface LeaderOnboardingPanelProps {
  spaceName: string;
  /** Number of members (excluding leader) */
  memberCount: number;
  /** Number of events */
  eventCount: number;
  /** Number of messages in chat */
  messageCount: number;
  /** Whether space has custom settings (banner, description, etc.) */
  hasCustomSettings: boolean;
  /** Callback to invite members */
  onInvite?: () => void;
  /** Callback to create event */
  onCreateEvent?: () => void;
  /** Callback to open chat */
  onOpenChat?: () => void;
  /** Callback to open settings */
  onOpenSettings?: () => void;
  /** Callback when panel is dismissed */
  onDismiss?: () => void;
  /** Whether panel has been dismissed (persisted preference) */
  isDismissed?: boolean;
  className?: string;
}

// ============================================================
// Constants
// ============================================================

const EASE_OUT = [0.22, 1, 0.36, 1];

// ============================================================
// Sub-Components
// ============================================================

function TaskItem({
  task,
  index
}: {
  task: OnboardingTask;
  index: number;
}) {
  const Icon = task.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: EASE_OUT }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all',
        task.isComplete
          ? 'bg-white/[0.06] opacity-60'
          : 'bg-white/[0.06] hover:bg-white/[0.06]'
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
        task.isComplete
          ? 'bg-[var(--status-success-subtle)]'
          : 'bg-[var(--life-gold)]/10'
      )}>
        {task.isComplete ? (
          <CheckCircleSolid className="w-5 h-5 text-[var(--status-success)]" />
        ) : (
          <Icon className="w-4 h-4 text-[var(--life-gold)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            task.isComplete ? 'text-white/50 line-through' : 'text-white'
          )}>
            {task.label}
          </span>
        </div>
        <p className="text-xs text-white/50 mt-0.5">
          {task.description}
        </p>
      </div>

      {/* Action button */}
      {!task.isComplete && task.action && (
        <Button
          onClick={task.action}
          size="sm"
          variant="ghost"
          className="flex-shrink-0 text-xs"
        >
          {task.actionLabel || 'Do it'}
        </Button>
      )}
    </motion.div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative">
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full bg-[var(--life-gold)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        />
      </div>
      <p className="text-xs text-white/50 mt-2">
        {progress === 100 ? (
          <span className="text-[var(--status-success)]">All set! You're ready to go.</span>
        ) : (
          `${progress}% complete`
        )}
      </p>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function LeaderOnboardingPanel({
  spaceName,
  memberCount,
  eventCount,
  messageCount,
  hasCustomSettings,
  onInvite,
  onCreateEvent,
  onOpenChat,
  onOpenSettings,
  onDismiss,
  isDismissed = false,
  className,
}: LeaderOnboardingPanelProps) {
  // Build task list
  const tasks: OnboardingTask[] = [
    {
      id: 'invite',
      label: 'Invite your first member',
      description: 'Spread the word and grow your community',
      icon: UserPlusIcon,
      isComplete: memberCount > 0,
      action: onInvite,
      actionLabel: 'Invite',
    },
    {
      id: 'event',
      label: 'Create an event',
      description: 'Meetings, hangouts, study sessions — anything goes',
      icon: CalendarIcon,
      isComplete: eventCount > 0,
      action: onCreateEvent,
      actionLabel: 'Create',
    },
    {
      id: 'chat',
      label: 'Post an announcement',
      description: 'Say hello and set the tone for your space',
      icon: ChatBubbleLeftIcon,
      isComplete: messageCount > 0,
      action: onOpenChat,
      actionLabel: 'Post',
    },
    {
      id: 'settings',
      label: 'Customize your space',
      description: 'Add a banner, description, and make it yours',
      icon: Cog6ToothIcon,
      isComplete: hasCustomSettings,
      action: onOpenSettings,
      actionLabel: 'Settings',
    },
  ];

  const completedCount = tasks.filter(t => t.isComplete).length;
  const progress = Math.round((completedCount / tasks.length) * 100);
  const allComplete = completedCount === tasks.length;

  // Don't render if dismissed or all complete
  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className={cn(
          'relative rounded-lg overflow-hidden',
          'bg-white/[0.06]',
          'border border-[var(--life-gold)]/10',
          'p-5',
          className
        )}
      >
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white/50 hover:bg-white/[0.06] transition-all"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--life-gold)]/10 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-[var(--life-gold)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Welcome to {spaceName}!
            </h3>
            <p className="text-sm text-white/50 mt-0.5">
              Complete these steps to get your space ready for members.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <ProgressBar progress={progress} />
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <TaskItem key={task.id} task={task} index={index} />
          ))}
        </div>

        {/* All complete celebration */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-5 pt-4 border-t border-white/[0.06] text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--status-success-subtle)] text-[var(--status-success)] text-sm font-medium">
              <CheckCircleIcon className="w-4 h-4" />
              Your space is ready!
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="block mx-auto mt-3 text-xs text-white/50 hover:text-white/50"
              >
                Dismiss this panel
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default LeaderOnboardingPanel;
