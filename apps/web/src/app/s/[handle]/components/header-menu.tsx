'use client';

/**
 * HeaderMenu - Drawer menu replacing tabs
 *
 * Options: All Events, All Apps, Members, Settings (leaders)
 * Opens as overlay — stream stays primary view.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, Users, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/ui/design-system/primitives';

interface HeaderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLeader?: boolean;
  onAllEvents: () => void;
  onAllApps: () => void;
  onMembers: () => void;
  onSettings?: () => void;
}

const menuItems = [
  { id: 'events', label: 'All Events', icon: Calendar },
  { id: 'apps', label: 'All Apps', icon: Sparkles },
  { id: 'members', label: 'Members', icon: Users },
] as const;

export function HeaderMenu({
  isOpen,
  onClose,
  isLeader,
  onAllEvents,
  onAllApps,
  onMembers,
  onSettings,
}: HeaderMenuProps) {
  const handlers: Record<string, () => void> = {
    events: onAllEvents,
    apps: onAllApps,
    members: onMembers,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-64',
              'bg-[var(--bg-ground)] border-l border-white/[0.06]'
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
          >
            {/* Close */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-white">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handlers[item.id]?.();
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3',
                      'text-sm text-white/60 hover:text-white hover:bg-white/[0.04]',
                      'transition-colors'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}

              {/* Settings — leaders only */}
              {isLeader && onSettings && (
                <>
                  <div className="mx-4 my-2 border-t border-white/[0.06]" />
                  <button
                    onClick={() => {
                      onSettings();
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3',
                      'text-sm text-white/60 hover:text-white hover:bg-white/[0.04]',
                      'transition-colors'
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

HeaderMenu.displayName = 'HeaderMenu';
