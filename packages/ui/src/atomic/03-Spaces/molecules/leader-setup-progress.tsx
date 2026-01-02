'use client';

/**
 * LeaderSetupProgress - Sidebar widget showing setup checklist for leaders
 *
 * Displays the onboarding tasks with completion status. Visible to leaders
 * until all tasks are completed. Uses the same data as useLeaderOnboarding hook.
 *
 * Features:
 * - Visual progress bar with gold theme
 * - Clickable task items that trigger actions
 * - Collapsible widget pattern
 * - Auto-hides when all complete
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Wrench, Calendar, Users, Palette, ChevronRight, Crown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CollapsibleWidget } from './collapsible-widget';

// ============================================================
// Types
// ============================================================

export interface SetupTask {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  /** Action to take when clicked */
  action?: 'deploy-tool' | 'create-event' | 'invite-members' | 'customize-sidebar';
}

export interface LeaderSetupProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Space ID for persistence */
  spaceId: string;
  /** List of setup tasks */
  tasks: SetupTask[];
  /** Number of completed tasks */
  completedCount: number;
  /** Total number of tasks */
  totalCount: number;
  /** Percentage complete (0-100) */
  percentComplete: number;
  /** Callback when a task action is clicked */
  onTaskAction?: (action: SetupTask['action']) => void;
  /** Whether to use collapsible widget wrapper */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Inline mode (no wrapper) */
  inline?: boolean;
}

// ============================================================
// Task Icon Mapper
// ============================================================

function getTaskIcon(action: SetupTask['action']) {
  switch (action) {
    case 'deploy-tool':
      return Wrench;
    case 'create-event':
      return Calendar;
    case 'invite-members':
      return Users;
    case 'customize-sidebar':
      return Palette;
    default:
      return Check;
  }
}

// ============================================================
// Main Component
// ============================================================

export const LeaderSetupProgress = React.forwardRef<HTMLDivElement, LeaderSetupProgressProps>(
  (
    {
      spaceId,
      tasks,
      completedCount,
      totalCount,
      percentComplete,
      onTaskAction,
      collapsible = true,
      defaultCollapsed = false,
      inline = false,
      className,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();

    // Don't render if all tasks complete
    if (completedCount >= totalCount) {
      return null;
    }

    const content = (
      <div className="flex flex-col gap-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Setup progress</span>
            <span className="text-white font-medium">
              {completedCount}/{totalCount} complete
            </span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={shouldReduceMotion ? { width: `${percentComplete}%` } : { width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-white to-white/80 rounded-full"
            />
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-1.5">
          {tasks.map((task, index) => {
            const Icon = getTaskIcon(task.action);
            const isClickable = !task.completed && task.action && onTaskAction;

            return (
              <motion.div
                key={task.id}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {isClickable ? (
                  <button
                    onClick={() => onTaskAction?.(task.action)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-lg',
                      'bg-neutral-800/30 hover:bg-neutral-800/50',
                      'border border-transparent hover:border-white/15',
                      'transition-all group text-left'
                    )}
                  >
                    <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center group-hover:border-white/50 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-neutral-200 group-hover:text-white transition-colors">
                        {task.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white/70 transition-colors" />
                  </button>
                ) : (
                  <div
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg',
                      task.completed ? 'bg-emerald-500/5' : 'bg-neutral-800/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        task.completed
                          ? 'bg-emerald-500 text-white'
                          : 'border border-neutral-600'
                      )}
                    >
                      {task.completed ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm flex-1',
                        task.completed
                          ? 'text-neutral-500 line-through'
                          : 'text-neutral-400'
                      )}
                    >
                      {task.label}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Encouragement text */}
        <p className="text-xs text-neutral-500 text-center">
          {percentComplete < 50
            ? "You're doing great! Keep setting up your space."
            : percentComplete < 100
              ? 'Almost there! Just a few more steps.'
              : 'All done! Your space is ready.'}
        </p>
      </div>
    );

    // INLINE MODE: No wrapper, just content with horizontal padding
    if (inline || !collapsible) {
      return (
        <div ref={ref} className={cn('px-4', className)} {...props}>
          {/* Section header for inline mode */}
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-[#FFD700]" />
            <span className="font-medium text-sm text-neutral-100">Leader Setup</span>
          </div>
          {content}
        </div>
      );
    }

    // STANDALONE MODE: Use CollapsibleWidget
    return (
      <div ref={ref} className={className} {...props}>
        <CollapsibleWidget
          title="Leader Setup"
          icon={<Crown className="h-4 w-4 text-[#FFD700]" />}
          badge={
            <span className="text-xs font-medium text-white">
              {percentComplete}%
            </span>
          }
          defaultCollapsed={defaultCollapsed}
          persistKey={`leader-setup-${spaceId}`}
          glass
        >
          {content}
        </CollapsibleWidget>
      </div>
    );
  }
);

LeaderSetupProgress.displayName = 'LeaderSetupProgress';

export default LeaderSetupProgress;
