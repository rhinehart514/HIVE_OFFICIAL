'use client';

/**
 * LeaderCreateFAB - Context-aware floating action button for leaders
 *
 * Smart FAB that adapts to context:
 * - Default: Quick actions menu (event, tool, announcement)
 * - On Events tab: Create event
 * - On Tools section: Add tool
 *
 * @version 1.0.0 - Phase 1 New Build (Feb 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Wrench, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTION, durationSeconds } from '@hive/tokens';

type CreateAction = 'event' | 'tool' | 'announcement';

interface LeaderCreateFABProps {
  /** Current active tab/context */
  context?: 'feed' | 'events' | 'tools' | 'members';
  /** Handler for create event */
  onCreateEvent?: () => void;
  /** Handler for add tool */
  onAddTool?: () => void;
  /** Handler for create announcement */
  onCreateAnnouncement?: () => void;
  /** Custom class name */
  className?: string;
}

interface ActionOption {
  id: CreateAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  handler?: () => void;
}

export function LeaderCreateFAB({
  context = 'feed',
  onCreateEvent,
  onAddTool,
  onCreateAnnouncement,
  className,
}: LeaderCreateFABProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Define available actions based on handlers
  const actions = React.useMemo<ActionOption[]>(() => {
    const options: ActionOption[] = [];

    if (onCreateEvent) {
      options.push({
        id: 'event',
        label: 'Create Event',
        icon: Calendar,
        color: 'bg-white/[0.06]',
        handler: onCreateEvent,
      });
    }

    if (onAddTool) {
      options.push({
        id: 'tool',
        label: 'Add Tool',
        icon: Wrench,
        color: 'bg-white/[0.06]',
        handler: onAddTool,
      });
    }

    if (onCreateAnnouncement) {
      options.push({
        id: 'announcement',
        label: 'Dashboard',
        icon: LayoutDashboard,
        color: 'bg-white/[0.06]',
        handler: onCreateAnnouncement,
      });
    }

    return options;
  }, [onCreateEvent, onAddTool, onCreateAnnouncement]);

  // Context-aware behavior: direct action or menu
  const primaryAction = React.useMemo<ActionOption | null>(() => {
    if (context === 'events' && onCreateEvent) {
      return actions.find(a => a.id === 'event') || null;
    }
    if (context === 'tools' && onAddTool) {
      return actions.find(a => a.id === 'tool') || null;
    }
    // Default: show menu if multiple actions
    return actions.length === 1 ? actions[0] : null;
  }, [context, actions, onCreateEvent, onAddTool]);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleMainButtonClick = () => {
    if (primaryAction) {
      // Direct action mode
      primaryAction.handler?.();
    } else {
      // Menu mode
      setIsOpen(!isOpen);
    }
  };

  const handleActionClick = (action: ActionOption) => {
    action.handler?.();
    setIsOpen(false);
  };

  // Don't render if no actions available
  if (actions.length === 0) return null;

  return (
    <div className={cn('fixed bottom-6 right-6 z-40', className)}>
      {/* Action Menu Items */}
      <AnimatePresence>
        {isOpen && !primaryAction && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col items-end gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    'flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full',
                    'bg-[var(--bg-ground)] border border-white/[0.08]',
                    'text-white/80 hover:text-white text-sm font-medium',
                    'shadow-lg shadow-black/30',
                    'transition-colors duration-150',
                    'hover:bg-white/[0.06]',
                  )}
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{
                    duration: durationSeconds.quick,
                    delay: index * 0.04,
                    ease: MOTION.ease.premium,
                  }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="pr-1">{action.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={handleMainButtonClick}
        className={cn(
          'w-12 h-12 rounded-full',
          'bg-gold-500 hover:bg-gold-400',
          'flex items-center justify-center',
          'shadow-lg shadow-black/40',
          'transition-shadow duration-200',
          'hover:shadow-[0_0_24px_rgba(255,215,0,0.25)]',
        )}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? 'Close create menu' : 'Create'}
      >
        <motion.div
          animate={{ rotate: isOpen && !primaryAction ? 45 : 0 }}
          transition={{ duration: durationSeconds.quick, ease: MOTION.ease.premium }}
        >
          {primaryAction ? (
            <primaryAction.icon className="w-6 h-6 text-black" />
          ) : (
            <Plus className="w-6 h-6 text-black" strokeWidth={2.5} />
          )}
        </motion.div>
      </motion.button>

      {/* Backdrop (closes menu when clicking outside) */}
      <AnimatePresence>
        {isOpen && !primaryAction && (
          <motion.div
            className="fixed inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

LeaderCreateFAB.displayName = 'LeaderCreateFAB';

export default LeaderCreateFAB;
