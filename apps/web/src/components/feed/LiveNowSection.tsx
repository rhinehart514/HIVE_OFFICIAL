'use client';

import { useEffect, useReducer } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Users, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedEvent } from './types';
import { SpaceAvatar } from './SpaceAvatar';
import { isHappeningNow, startsWithinHour, timeLabel, eventGradient } from './time-utils';

interface Props {
  events: FeedEvent[];
  onSelectEvent: (e: FeedEvent) => void;
}

export function LiveNowSection({ events, onSelectEvent }: Props) {
  // Force re-render every 60s so time badges stay fresh
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const liveEvents = events.filter(
    (e) => isHappeningNow(e.startDate, e.endDate) || startsWithinHour(e.startDate),
  );

  if (liveEvents.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">
          Live now
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {liveEvents.map((event, i) => {
          const isLive = isHappeningNow(event.startDate, event.endDate);
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          const coverSrc = event.imageUrl || event.coverImageUrl;

          return (
            <motion.button
              key={event.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onSelectEvent(event)}
              className="shrink-0 w-[260px] text-left group cursor-pointer relative overflow-hidden rounded-xl border border-red-500/15 hover:border-red-500/25 bg-[#0a0a0a] transition-all duration-200"
            >
              <div className="relative h-28 w-full overflow-hidden">
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt=""
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-full h-full bg-gradient-to-br opacity-60',
                      eventGradient(event.category, event.eventType),
                    )}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

                {/* Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  {isLive ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/20 text-[10px] font-semibold text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/20 text-[10px] font-medium text-amber-400/80">
                      {timeLabel(event.startDate)}
                    </span>
                  )}
                  {isGoing && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[10px] text-[#FFD700]/80">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="px-3 pb-3 pt-1.5">
                {event.spaceName && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
                    <span className="text-[11px] text-white/30 truncate">{event.spaceName}</span>
                  </div>
                )}
                <p className="text-[13px] font-medium text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/60">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      {event.isOnline ? (
                        <Video className="w-2.5 h-2.5" />
                      ) : (
                        <MapPin className="w-2.5 h-2.5" />
                      )}
                      <span className="truncate max-w-[120px]">
                        {event.isOnline ? 'Online' : event.location}
                      </span>
                    </span>
                  )}
                  {event.rsvpCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      {event.rsvpCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
