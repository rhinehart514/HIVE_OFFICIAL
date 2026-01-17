'use client';

/**
 * LeaderSetupProgress Component
 *
 * Sidebar widget showing space setup progress for leaders.
 * Displays checklist of setup tasks with progress indicator.
 */

import * as React from 'react';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

export interface SetupTask {
  id: string;
  label: string;
  completed: boolean;
  action?: () => void;
}

export interface LeaderSetupProgressProps {
  tasks?: SetupTask[];
  onDismiss?: () => void;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

const LeaderSetupProgress: React.FC<LeaderSetupProgressProps> = ({
  tasks = [],
  onDismiss,
  onTaskClick,
  className,
}) => {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = progressPercent === 100;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-bg-elevated)]',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--color-life-gold)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <Text size="sm" weight="medium">
              Space Setup
            </Text>
          </div>
          {isComplete && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'p-1 rounded-lg',
                'hover:bg-[var(--color-bg-muted)] transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white/50'
              )}
            >
              <svg
                className="w-4 h-4 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isComplete ? 'bg-green-500' : 'bg-[var(--color-life-gold)]'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <Text size="xs" tone="muted" className="mt-1">
          {completedCount} of {totalCount} complete
        </Text>
      </div>

      {/* Task List */}
      <div className="p-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => {
              task.action?.();
              onTaskClick?.(task.id);
            }}
            disabled={task.completed}
            className={cn(
              'w-full flex items-center gap-3 px-2 py-2 rounded-lg',
              'text-left transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50',
              task.completed
                ? 'opacity-60 cursor-default'
                : 'hover:bg-[var(--color-bg-muted)] cursor-pointer'
            )}
          >
            {/* Checkbox */}
            <div
              className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                'transition-colors',
                task.completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-[var(--color-border)] bg-transparent'
              )}
            >
              {task.completed && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>

            {/* Label */}
            <Text
              size="sm"
              className={cn(task.completed && 'line-through text-[var(--color-text-muted)]')}
            >
              {task.label}
            </Text>

            {/* Arrow for incomplete tasks */}
            {!task.completed && (
              <svg
                className="w-4 h-4 text-[var(--color-text-muted)] ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

LeaderSetupProgress.displayName = 'LeaderSetupProgress';

export { LeaderSetupProgress };
