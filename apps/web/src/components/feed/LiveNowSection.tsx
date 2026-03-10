'use client';

import { useEffect, useReducer } from 'react';
import { Check, MapPin, Users, Video } from 'lucide-react';
import { Mono } from '@hive/ui/design-system/primitives';
import Link from 'next/link';
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

  if (liveEvents.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
          <Mono size="label" className="text-white/50">
            Live now
          </Mono>
        </div>
        <p className="text-sm text-white/50 py-2">
          Nothing happening right now — but your orgs are always posting.
          Scroll down to see what&apos;s coming up.
        </p>
        <Link
          href="/build"
          className="inline-flex items-center px-4 py-2 mt-2 rounded-full bg-[#FFD700] text-black text-sm font-semibold hover:bg-[#FFE033] transition-colors duration-100"
        >
          Start something
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <Mono size="label" className="text-white/50">
          Live now
        </Mono>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {liveEvents.map((event, i) => {
          const isLive = isHappeningNow(event.startDate, event.endDate);
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          const coverSrc = event.imageUrl || event.coverImageUrl;

          return (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="shrink-0 w-[260px] text-left group cursor-pointer relative overflow-hidden rounded-xl border border-red-500/15 hover:border-red-500/25 bg-[#0a0a0a] transition-colors duration-100"
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
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/20 text-[10px] font-semibold text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-[10px] font-medium text-amber-400/80">
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
