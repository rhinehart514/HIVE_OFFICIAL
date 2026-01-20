'use client';

/**
 * Leader Quick Actions Bar
 *
 * Floating action bar for space leaders with quick access to:
 * - Invite Members
 * - Create Event
 * - Settings
 * - Analytics
 *
 * Mobile-friendly design with expandable menu.
 *
 * @version 1.0.0 - Spaces Perfection Plan (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@hive/ui';

// =============================================================================
// TYPES
// =============================================================================

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  highlight?: boolean;
}

interface LeaderQuickActionsProps {
  spaceId: string;
  onOpenInviteModal: () => void;
  onOpenEventModal: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LeaderQuickActions({
  spaceId,
  onOpenInviteModal,
  onOpenEventModal,
}: LeaderQuickActionsProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const actions: QuickAction[] = [
    {
      id: 'invite',
      label: 'Invite',
      icon: UserPlusIcon,
      onClick: () => {
        onOpenInviteModal();
        setIsExpanded(false);
      },
      highlight: true,
    },
    {
      id: 'event',
      label: 'Event',
      icon: CalendarDaysIcon,
      onClick: () => {
        onOpenEventModal();
        setIsExpanded(false);
      },
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      onClick: () => {
        router.push(`/spaces/${spaceId}/analytics`);
        setIsExpanded(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      onClick: () => {
        router.push(`/spaces/${spaceId}/settings`);
        setIsExpanded(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Actions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    x: 20,
                    transition: { delay: (actions.length - index) * 0.03 },
                  }}
                  onClick={action.onClick}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-full',
                    'bg-neutral-900/95 backdrop-blur-sm border',
                    'shadow-lg shadow-black/20',
                    'transition-all duration-200',
                    action.highlight
                      ? 'border-life-gold/30 hover:border-life-gold/50 hover:bg-life-gold/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      action.highlight ? 'text-life-gold' : 'text-neutral-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      action.highlight ? 'text-life-gold' : 'text-white'
                    )}
                  >
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ opacity: 0.8 }}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center',
          'shadow-lg shadow-black/30',
          'transition-all duration-300',
          isExpanded
            ? 'bg-neutral-800 border border-white/10'
            : 'bg-life-gold hover:bg-life-gold/90'
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <XMarkIcon className="h-6 w-6 text-white" />
          ) : (
            <SparklesIcon className="h-6 w-6 text-black" />
          )}
        </motion.div>

        {/* Pulse indicator when collapsed */}
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-life-gold"
          />
        )}
      </motion.button>

      {/* Label for FAB */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -left-20 bottom-3 pointer-events-none"
          >
            <span className="text-xs text-neutral-500 whitespace-nowrap">
              Leader Actions
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
