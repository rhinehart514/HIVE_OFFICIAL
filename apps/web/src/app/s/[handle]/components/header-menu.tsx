'use client';

/**
 * HeaderMenu — Space context drawer
 *
 * Right drawer (desktop) / bottom sheet (mobile) with:
 * - Events, Apps, Members menu items
 * - Settings (leaders only)
 *
 * Stream stays primary view; this is the secondary access point.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, Users, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'apps', label: 'Apps', icon: Sparkles },
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
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
          />

          {/* Drawer — right panel on desktop, bottom sheet on mobile */}
          <motion.div
            className={cn(
              // Mobile: bottom sheet
              'fixed bottom-0 left-0 right-0 z-50',
              'rounded-t-2xl',
              // Desktop: right drawer
              'md:bottom-auto md:top-0 md:left-auto md:right-0 md:h-full md:w-64',
              'md:rounded-t-none',
              'bg-black border-t border-white/[0.05] md:border-t-0 md:border-l md:border-white/[0.05]'
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-8 h-1 rounded-full bg-white/[0.12]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 md:h-14 md:border-b md:border-white/[0.05]">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50">
                Space
              </span>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white transition-colors duration-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="py-1 pb-8 md:pb-2">
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
                      'text-[14px] text-white/50 hover:text-white hover:bg-white/[0.03]',
                      'transition-colors duration-100'
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
                  <div className="mx-4 my-1 border-t border-white/[0.05]" />
                  <button
                    onClick={() => {
                      onSettings();
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3',
                      'text-[14px] text-white/50 hover:text-white hover:bg-white/[0.03]',
                      'transition-colors duration-100'
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
