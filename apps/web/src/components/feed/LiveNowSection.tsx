'use client';

import { useEffect, useReducer } from 'react';
import { Check, MapPin, Users, Video } from 'lucide-react';
import { Mono } from '@hive/ui/design-system/primitives';
import type { FeedEvent } from './types';
import { SpaceAvatar } from './SpaceAvatar';
import { isHappeningNow, startsWithinHour, timeLabel } from './time-utils';

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
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-breathe" />
        <Mono size="label" className="text-white/50">
          Live now
        </Mono>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
        {liveEvents.map((event) => {
          const isLive = isHappeningNow(event.startDate, event.endDate);
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          const coverSrc = event.imageUrl || event.coverImageUrl;

          return (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="shrink-0 w-[260px] snap-start text-left group cursor-pointer relative overflow-hidden rounded-2xl border border-white/[0.05] hover:border-[#FFD700]/50 bg-card transition-colors duration-100"
            >
              <div className="relative h-28 w-full overflow-hidden">
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt=""
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-card border-l-2 border-l-[#FFD700]" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-card/80" />

                {/* Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {isLive ? (
                    <span className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/30 border border-red-500/30 text-[11px] font-semibold text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-breathe" />
                      LIVE
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-amber-500/30 border border-amber-500/30 text-[11px] font-medium text-amber-400">
                      {timeLabel(event.startDate)}
                    </span>
                  )}
                  {isGoing && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD700]/[0.05] border border-[#FFD700]/30 text-[11px] text-[#FFD700]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="px-3 pb-3 pt-2">
                {event.spaceName && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
                    <span className="text-[11px] text-white/30 truncate">{event.spaceName}</span>
                  </div>
                )}
                <p className="text-[13px] font-medium text-white/70 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50">
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
