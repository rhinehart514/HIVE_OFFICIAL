'use client';

/**
 * ClaimedStorefront — Storefront state for claimed but pre-active spaces
 *
 * Leader's welcome message, upcoming events, deployed apps, "Join" button.
 * Enough to understand the org before committing.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight, ChevronLeft, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';

interface StorefrontEvent {
  id: string;
  title: string;
  time: string;
  rsvpCount?: number;
}

interface StorefrontApp {
  id: string;
  name: string;
  icon?: string;
}

interface ClaimedStorefrontProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
  };
  upcomingEvents?: StorefrontEvent[];
  deployedApps?: StorefrontApp[];
  onJoin: () => void;
  isJoining?: boolean;
  joinError?: string | null;
  onClearError?: () => void;
}

export function ClaimedStorefront({
  space,
  upcomingEvents = [],
  deployedApps = [],
  onJoin,
  isJoining = false,
  joinError = null,
  onClearError,
}: ClaimedStorefrontProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center px-4 flex-shrink-0">
        <a
          href="/discover"
          className="flex items-center gap-1 text-[13px] text-white/40 hover:text-white/60 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Spaces
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-14">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-6">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar size="lg" className="mb-4">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback className="text-lg">{getInitials(space.name)}</AvatarFallback>
              </Avatar>

              <h2
                className="text-xl font-semibold text-white mb-1"
                style={{ fontFamily: "var(--font-clash, 'Clash Display', sans-serif)" }}
              >
                {space.name}
              </h2>

              <span className="text-[13px] font-sans text-white/40 mb-3">
                @{space.handle}
              </span>

              <div className="flex items-center gap-1.5 text-[13px] text-white/40">
                <Users className="h-3.5 w-3.5" />
                <span>{space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}</span>
              </div>
            </div>

            {/* Description */}
            {space.description && (
              <p className="text-[14px] text-white/50 leading-relaxed text-center mb-6 line-clamp-3">
                {space.description}
              </p>
            )}

            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3 h-3 text-[var(--color-gold)]" />
                  <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">
                    Upcoming Events
                  </p>
                </div>
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between">
                      <span className="text-[13px] text-white/60 truncate">{event.title}</span>
                      <span className="text-[11px] text-white/30 flex-shrink-0 ml-2">
                        {new Date(event.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deployed apps */}
            {deployedApps.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-[var(--color-gold)]" />
                  <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">
                    Apps
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deployedApps.slice(0, 4).map((app) => (
                    <span
                      key={app.id}
                      className="px-3 py-1 rounded-full border border-white/[0.06] text-[12px] text-white/50 bg-white/[0.02]"
                    >
                      {app.icon ? `${app.icon} ` : ''}{app.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            <AnimatePresence mode="wait">
              {joinError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[13px] text-red-300 leading-snug">{joinError}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Join CTA */}
            <Button
              variant="cta"
              size="default"
              onClick={() => {
                onClearError?.();
                onJoin();
              }}
              disabled={isJoining}
              loading={isJoining}
              className="w-full justify-center"
            >
              {isJoining ? 'Joining...' : 'Join Space'}
              {!isJoining && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

ClaimedStorefront.displayName = 'ClaimedStorefront';
