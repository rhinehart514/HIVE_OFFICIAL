'use client';

/**
 * HeaderMenu — Space context drawer
 *
 * Right drawer (desktop) / bottom sheet (mobile) with:
 * - Inline tools list with quick-run
 * - Upcoming events with RSVP counts
 * - Members + Settings navigation
 *
 * Stream stays primary view; this is the secondary access point.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Settings, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

interface UpcomingEventItem {
  id: string;
  title: string;
  time: string;
  goingCount: number;
}

interface HeaderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLeader?: boolean;
  // Data
  tools?: PlacedToolDTO[];
  events?: UpcomingEventItem[];
  isLoadingTools?: boolean;
  // Actions
  onToolRun?: (tool: PlacedToolDTO) => void;
  onEventClick?: (eventId: string) => void;
  onMembers: () => void;
  onSettings?: () => void;
}

export function HeaderMenu({
  isOpen,
  onClose,
  isLeader,
  tools = [],
  events = [],
  isLoadingTools,
  onToolRun,
  onEventClick,
  onMembers,
  onSettings,
}: HeaderMenuProps) {
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
              'fixed bottom-0 left-0 right-0 z-50',
              'rounded-t-2xl max-h-[80vh] overflow-y-auto',
              'md:bottom-auto md:top-0 md:left-auto md:right-0 md:h-full md:w-72 md:max-h-none',
              'md:rounded-t-none',
              'bg-void border-t border-white/[0.05] md:border-t-0 md:border-l md:border-white/[0.05]'
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
              <span className="font-mono text-[11px] uppercase tracking-label text-white/50">
                Space
              </span>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white transition-colors duration-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-8 md:pb-4">
              {/* ── Apps section ── */}
              {(tools.length > 0 || isLoadingTools) && (
                <div className="mt-3 mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-label text-white/30 mb-2 block">
                    Apps
                  </span>
                  {isLoadingTools ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {tools.map((tool) => (
                        <button
                          key={tool.placementId}
                          onClick={() => {
                            onToolRun?.(tool);
                            onClose();
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                            'text-left hover:bg-white/[0.03] transition-colors duration-100'
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-white/50" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[13px] text-white truncate block">{tool.name}</span>
                            {tool.activityCount != null && tool.activityCount > 0 && (
                              <span className="text-[11px] text-white/30">
                                {tool.activityCount} interaction{tool.activityCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Events section ── */}
              {events.length > 0 && (
                <div className="mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-label text-white/30 mb-2 block">
                    Upcoming
                  </span>
                  <div className="space-y-1">
                    {events.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          onEventClick?.(event.id);
                          onClose();
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'text-left hover:bg-white/[0.03] transition-colors duration-100'
                        )}
                      >
                        <Calendar className="w-4 h-4 text-white/30 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] text-white truncate block">{event.title}</span>
                          <span className="text-[11px] text-white/30">
                            {event.time}{event.goingCount > 0 ? ` · ${event.goingCount} going` : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Divider ── */}
              {(tools.length > 0 || events.length > 0) && (
                <div className="border-t border-white/[0.05] my-2" />
              )}

              {/* ── Navigation items ── */}
              <div className="space-y-0.5">
                <button
                  onClick={() => { onMembers(); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'text-[14px] text-white/50 hover:text-white hover:bg-white/[0.03]',
                    'transition-colors duration-100'
                  )}
                >
                  <Users className="w-4 h-4" />
                  Members
                </button>

                {isLeader && onSettings && (
                  <button
                    onClick={() => { onSettings(); onClose(); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-[14px] text-white/50 hover:text-white hover:bg-white/[0.03]',
                      'transition-colors duration-100'
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

HeaderMenu.displayName = 'HeaderMenu';
