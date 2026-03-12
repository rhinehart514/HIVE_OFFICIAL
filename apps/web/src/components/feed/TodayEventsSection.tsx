'use client';

import { useCallback } from 'react';
import { Check, MapPin, Video } from 'lucide-react';
import { Mono } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import type { FeedEvent } from './types';
import { SpaceAvatar } from './SpaceAvatar';
import { isHappeningNow, isToday, timeLabel } from './time-utils';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  events: FeedEvent[];
  onSelectEvent: (e: FeedEvent) => void;
}

function socialSignal(e: FeedEvent): string | null {
  const names = e.friendsAttendingNames;
  if (names && names.length > 0) {
    if (names.length === 1) return `${names[0]} is going`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are going`;
    return `${names[0]} and ${names.length - 1} friends going`;
  }
  if (e.friendsAttending && e.friendsAttending > 0)
    return `${e.friendsAttending} friend${e.friendsAttending > 1 ? 's' : ''} going`;
  return e.rsvpCount > 0 ? `${e.rsvpCount} going` : null;
}

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 6) return 'late-night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

function todaySubLabel(n: number): string {
  const t = getTimeOfDay();
  const s = n !== 1 ? 's' : '';
  if (n === 0) return '';
  if (t === 'late-night') return `${n} event${s} lined up for tomorrow`;
  if (t === 'morning') return n === 1 ? 'Quiet morning — 1 event so far' : `${n} events ahead today`;
  if (t === 'afternoon') return n >= 5 ? `Big night ahead — ${n} events` : `${n} event${s} before sunset`;
  return n >= 5 ? `${n} events tonight — campus is moving` : `${n} event${s} still happening`;
}

export function TodayEventsSection({ events, onSelectEvent }: Props) {
  const queryClient = useQueryClient();
  const todayEvents = events
    .filter((e) => isToday(e.startDate) && !isHappeningNow(e.startDate, e.endDate))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, spaceId, status }: { eventId: string; spaceId?: string; status: string }) => {
      const url = spaceId
        ? `/api/spaces/${spaceId}/events/${eventId}/rsvp`
        : `/api/events/${eventId}/rsvp`;
      const res = await secureApiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('RSVP failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-events'] }),
  });

  const handleRsvp = useCallback(
    (e: React.MouseEvent, eventId: string, spaceId?: string, status = 'going') => {
      e.stopPropagation();
      rsvpMutation.mutate({ eventId, spaceId, status });
    },
    [rsvpMutation],
  );

  if (todayEvents.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/50" />
          <Mono size="label" className="text-white/50">
            HAPPENING TODAY
          </Mono>
        </div>
        <span className="text-[11px] text-white/30 tabular-nums">
          {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-white/50 text-[14px] -mt-1 mb-3">
        {todaySubLabel(todayEvents.length)}
      </p>

      <div className="space-y-2">
        {todayEvents.map((event) => {
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          const coverSrc = event.imageUrl || event.coverImageUrl;
          const signal = socialSignal(event);

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="group cursor-pointer rounded-xl border border-white/[0.05] bg-card overflow-hidden hover:border-white/[0.10] transition-colors duration-100"
            >
              <div className="flex">
                <div className="relative w-24 shrink-0 overflow-hidden">
                  {coverSrc ? (
                    <img src={coverSrc} alt="" className="w-full h-full object-cover min-h-[88px]" />
                  ) : (
                    <div className="w-full h-full min-h-[88px] bg-surface border-l-2 border-l-[#FFD700]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {event.spaceName && (
                        <>
                          <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
                          <span className="text-[11px] text-white/30 truncate max-w-[120px]">{event.spaceName}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] text-white/30 shrink-0 tabular-nums">{timeLabel(event.startDate)}</span>
                  </div>
                  <p className="text-[14px] font-medium text-white/70 leading-snug line-clamp-1 group-hover:text-white transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50">
                    {event.location && (
                      <span className="flex items-center gap-1">
                        {event.isOnline ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[100px]">
                          {event.isOnline ? 'Online' : event.location}
                        </span>
                      </span>
                    )}
                    {signal && (
                      <span
                        className={cn(
                          event.friendsAttending && event.friendsAttending > 0
                            ? 'text-[#FFD700]/50'
                            : 'text-white/50',
                        )}
                      >
                        {signal}
                      </span>
                    )}
                  </div>

                  {/* RSVP buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={(e) => handleRsvp(e, event.id, event.spaceId)}
                      className={cn(
                        'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
                        isGoing
                          ? 'bg-white/[0.05] border border-white/[0.05] text-white/50'
                          : 'bg-white/[0.05] border border-white/[0.05] text-white/70 hover:bg-white/[0.10]',
                      )}
                    >
                      {isGoing ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Going
                        </span>
                      ) : (
                        'Going'
                      )}
                    </button>
                    {!isGoing && (
                      <button
                        onClick={(e) => handleRsvp(e, event.id, event.spaceId, 'maybe')}
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-transparent border border-white/[0.05] text-white/30 hover:text-white/50 hover:border-white/[0.10] transition-colors"
                      >
                        Maybe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
