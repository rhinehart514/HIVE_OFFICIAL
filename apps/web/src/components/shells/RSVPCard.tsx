'use client';

/**
 * RSVPCard — Native RSVP format shell.
 *
 * Title + date/location + capacity bar + "I'm in" toggle + attendee faces.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, RSVPConfig, RSVPState } from '@/lib/shells/types';

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getTimeUntil(iso: string): string | null {
  try {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Past deadline';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  } catch {
    return null;
  }
}

function RSVPCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<RSVPConfig, RSVPState>) {
  const { title, dateTime, capacity, deadline, location } = config;
  const attendees = state?.attendees ?? {};
  const count = Object.keys(attendees).length;
  const isIn = !!attendees[currentUserId];

  const isPastDeadline = deadline ? new Date(deadline).getTime() < Date.now() : false;
  const isFull = capacity ? count >= capacity : false;
  const canRSVP = !isPastDeadline && (!isFull || isIn);

  const deadlineText = deadline ? getTimeUntil(deadline) : null;

  const attendeeList = useMemo(
    () => Object.values(attendees).slice(0, 5),
    [attendees]
  );

  const extraCount = Math.max(0, count - 5);

  const handleToggle = () => {
    if (!canRSVP && !isIn) return;
    onAction({ type: 'rsvp_toggle' });
  };

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {/* Title + meta */}
      <div className="mb-3">
        <p className="text-white text-sm font-medium leading-snug">{title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          {dateTime && (
            <p className="text-[12px] text-white/50">{formatDateTime(dateTime)}</p>
          )}
          {location && (
            <p className="text-[12px] text-white/30">{location}</p>
          )}
        </div>
      </div>

      {/* Capacity bar */}
      {capacity && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-white/50">
              <span className="text-white font-medium">{count}</span>/{capacity}
            </span>
            {isFull && <span className="text-[#FFD700]/60 font-medium">Full</span>}
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isFull ? 'bg-[#FFD700]/40' : 'bg-white/25'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (count / capacity) * 100)}%` }}
              transition={{ duration: 0.3, ease: MOTION.ease.default as unknown as string }}
            />
          </div>
        </div>
      )}

      {/* RSVP button + attendee faces */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleToggle}
          disabled={!canRSVP && !isIn}
          className={`
            px-4 h-9 rounded-full text-sm font-medium transition-colors duration-100
            ${isIn
              ? 'bg-white/[0.10] text-white border border-white/30'
              : canRSVP
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.06]'
            }
          `}
        >
          {isIn ? "I'm in \u2713" : "I'm in"}
        </button>

        {/* Face stack */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {attendeeList.map((a, i) => (
              <div
                key={a.userId}
                className="w-7 h-7 rounded-full border-2 border-[#111] bg-white/[0.08] flex items-center justify-center overflow-hidden"
                style={{ zIndex: 5 - i }}
              >
                {a.photoURL ? (
                  <img
                    src={a.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-white/40">
                    {a.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            ))}
          </div>
          {extraCount > 0 && (
            <span className="text-[12px] text-white/30 ml-1.5">+{extraCount}</span>
          )}
          {count === 0 && (
            <span className="text-[12px] text-white/30">Be the first</span>
          )}
        </div>
      </div>

      {/* Deadline */}
      {deadlineText && (
        <p className={`text-[12px] mt-2 ${isPastDeadline ? 'text-red-400/60' : 'text-white/30'}`}>
          {deadlineText}
        </p>
      )}
    </div>
  );
}

export default RSVPCard;
