'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Check,
  ExternalLink,
  MapPin,
  Users,
  Video,
  X,
} from 'lucide-react';
import type { FeedEvent } from './types';
import { SpaceAvatar } from './SpaceAvatar';
import {
  isHappeningNow,
  timeLabel,
  dayLabel,
  fullTimeLabel,
  cleanDescription,
} from './time-utils';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const modalSpring = { type: 'spring' as const, damping: 28, stiffness: 300, mass: 0.8 };
const modalFade = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  event: FeedEvent | null;
  onClose: () => void;
}

export function EventDetailDrawer({ event, onClose }: Props) {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDivElement>(null);

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, spaceId }: { eventId: string; spaceId?: string }) => {
      const url = spaceId
        ? `/api/spaces/${spaceId}/events/${eventId}/rsvp`
        : `/api/events/${eventId}/rsvp`;
      const res = await secureApiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'going' }),
      });
      if (!res.ok) throw new Error('RSVP failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-events'] }),
  });

  // Close on Escape
  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [event, onClose]);

  // Lock scroll
  useEffect(() => {
    if (!event) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [event]);

  if (!event) return null;

  const live = isHappeningNow(event.startDate, event.endDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const coverSrc = event.imageUrl || event.coverImageUrl;
  const desc = cleanDescription(event.description);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={modalFade}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={modalFade}
          />

          {/* Panel — slides up on mobile, centered on desktop */}
          <motion.div
            ref={modalRef}
            className="relative w-full sm:max-w-[520px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-[#111] border border-white/[0.08] shadow-md shadow-black/40 flex flex-col"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={modalSpring}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 border border-white/[0.1] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image / gradient header */}
            <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden">
              {coverSrc ? (
                <img src={coverSrc} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface border-l-2 border-l-[#FFD700]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/30 to-transparent" />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                {live && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/25 border border-red-500/20 text-[11px] font-semibold text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    Live now
                  </span>
                )}
              </div>

              {/* Title at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
                <h2 className="text-[24px] font-semibold text-white leading-tight tracking-[-0.02em]">
                  {event.title}
                </h2>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
              {/* Time & Location */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-white/40" />
                  </div>
                  <div>
                    <p className="text-[14px] text-white/80 font-medium">
                      {fullTimeLabel(event.startDate, event.endDate)}
                    </p>
                    <p className="text-[12px] text-white/30 mt-0.5">
                      {dayLabel(event.startDate)} &middot; {timeLabel(event.startDate)}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                      {event.isOnline ? (
                        <Video className="w-4 h-4 text-white/40" />
                      ) : (
                        <MapPin className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-[14px] text-white/80 font-medium">
                        {event.isOnline ? 'Online event' : event.location}
                      </p>
                    </div>
                  </div>
                )}

                {(event.rsvpCount > 0 ||
                  (event.friendsAttending && event.friendsAttending > 0)) && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-white/40" />
                    </div>
                    <div>
                      <p className="text-[14px] text-white/80 font-medium">
                        {event.rsvpCount} going
                        {event.friendsAttending && event.friendsAttending > 0 && (
                          <span className="text-[#FFD700]/60">
                            {' '}
                            &middot; {event.friendsAttending} friend
                            {event.friendsAttending > 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                      {event.friendsAttendingNames &&
                        event.friendsAttendingNames.length > 0 && (
                          <p className="text-[12px] text-[#FFD700]/40 mt-0.5">
                            {event.friendsAttendingNames.join(', ')}
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {desc && (
                <p className="text-[13px] text-white/40 leading-relaxed">{desc}</p>
              )}

              {/* Match reasons */}
              {event.matchReasons && event.matchReasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {event.matchReasons.map((reason, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/35"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              {/* Space link */}
              {event.spaceName && (
                <Link
                  href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-colors group"
                >
                  <SpaceAvatar
                    name={event.spaceName}
                    url={event.spaceAvatarUrl}
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/70 font-medium truncate group-hover:text-white/90 transition-colors">
                      {event.spaceName}
                    </p>
                    <p className="text-[11px] text-white/30">View space</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors shrink-0" />
                </Link>
              )}
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-[#111]">
              <button
                onClick={() =>
                  rsvpMutation.mutate({ eventId: event.id, spaceId: event.spaceId })
                }
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-3 rounded-full text-[14px] font-semibold transition-colors duration-100 active:scale-[0.98]',
                  isGoing
                    ? 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:bg-white/[0.08]'
                    : 'bg-white text-black hover:bg-white/90',
                )}
              >
                {isGoing ? (
                  <>
                    <Check className="w-4 h-4" />
                    Going
                  </>
                ) : (
                  'Attend'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
