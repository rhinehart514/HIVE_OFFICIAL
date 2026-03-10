'use client';

/**
 * Inline Components — Interactive cards embedded in chat messages
 *
 * Renders polls, RSVPs, countdowns, signups, and event cards inline
 * within the Space chat feed. Receives data from the API via
 * InlineComponentData and dispatches interactions via onVote/onRsvp.
 */

import * as React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface InlineComponentData {
  id: string;
  type: 'poll' | 'countdown' | 'rsvp' | 'signup' | 'event';
  config?: Record<string, unknown>;
  sharedState?: Record<string, unknown>;
  userVote?: string[];
  userResponse?: 'yes' | 'no' | 'maybe';
  userSlot?: string;
  [key: string]: unknown;
}

interface InlineComponentProps {
  component: InlineComponentData;
  onVote?: (optionIndex: number) => void;
  onRsvp?: (response: string) => void;
}

// ============================================
// SHARED STYLES
// ============================================

const CARD_CLASSES =
  'mt-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 max-w-sm';

// ============================================
// POLL CARD
// ============================================

function PollCard({
  component,
  onVote,
}: {
  component: InlineComponentData;
  onVote?: (optionIndex: number) => void;
}) {
  const config = (component.config ?? {}) as {
    question?: string;
    options?: string[];
  };
  const sharedState = (component.sharedState ?? {}) as {
    optionCounts?: Record<string, number>;
    totalResponses?: number;
  };

  const question = config.question ?? 'Poll';
  const options = config.options ?? [];
  const optionCounts = sharedState.optionCounts ?? {};
  const totalVotes = sharedState.totalResponses ?? 0;
  const userVote = component.userVote ?? [];
  const hasVoted = userVote.length > 0;

  const handleVote = (idx: number) => {
    if (hasVoted) return;
    onVote?.(idx);
  };

  // Find which option has the most votes
  let maxCount = 0;
  for (const opt of options) {
    const count = optionCounts[opt] ?? 0;
    if (count > maxCount) maxCount = count;
  }

  return (
    <div className={CARD_CLASSES}>
      <p className="text-white text-sm font-medium mb-3 leading-snug">
        {question}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((option, idx) => {
          const count = optionCounts[option] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = userVote.includes(option);
          const isLeading = count > 0 && count === maxCount;
          const showResults = hasVoted;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={hasVoted}
              className={`
                relative overflow-hidden rounded-xl h-10 px-3 text-left text-sm
                transition-colors duration-200
                ${showResults ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.06]'}
                ${isMyVote
                  ? 'border border-[#FFD700]/40 bg-[#FFD700]/[0.06]'
                  : 'border border-white/[0.08] bg-white/[0.02]'
                }
                disabled:cursor-default
              `}
            >
              {/* Fill bar */}
              {showResults && (
                <div
                  className={`absolute inset-y-0 left-0 transition-[width,background-color] duration-500 ease-out ${
                    isMyVote || isLeading
                      ? 'bg-[#FFD700]/[0.12]'
                      : 'bg-white/[0.04]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center justify-between h-full">
                <span
                  className={`truncate ${
                    isMyVote
                      ? 'text-[#FFD700]'
                      : isLeading && showResults
                        ? 'text-[#FFD700]/80'
                        : 'text-white/70'
                  }`}
                >
                  {option}
                </span>
                {showResults && (
                  <span
                    className={`text-xs ml-2 shrink-0 ${
                      isMyVote ? 'text-[#FFD700]/80' : 'text-white/30'
                    }`}
                  >
                    {pct}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center mt-3">
        <span className="text-xs text-white/30">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

// ============================================
// RSVP CARD
// ============================================

function RsvpCard({
  component,
  onRsvp,
}: {
  component: InlineComponentData;
  onRsvp?: (response: string) => void;
}) {
  const config = (component.config ?? {}) as {
    eventTitle?: string;
    eventDate?: string;
    maxCapacity?: number;
    allowMaybe?: boolean;
    location?: string;
  };
  const sharedState = (component.sharedState ?? {}) as {
    rsvpCounts?: { yes: number; no: number; maybe: number };
    totalResponses?: number;
  };

  const title = config.eventTitle ?? 'Event';
  const eventDate = config.eventDate;
  const allowMaybe = config.allowMaybe ?? true;
  const rsvpCounts = sharedState.rsvpCounts ?? { yes: 0, no: 0, maybe: 0 };
  const userResponse = component.userResponse;

  const formattedDate = React.useMemo(() => {
    if (!eventDate) return null;
    try {
      return new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  }, [eventDate]);

  return (
    <div className={CARD_CLASSES}>
      <div className="mb-3">
        <p className="text-white text-sm font-medium leading-snug">{title}</p>
        {formattedDate && (
          <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </p>
        )}
        {config.location && (
          <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {config.location}
          </p>
        )}
      </div>

      {/* RSVP buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRsvp?.('yes')}
          className={`
            px-4 h-9 rounded-3xl text-sm font-medium transition-colors duration-200
            ${userResponse === 'yes'
              ? 'bg-[#22C55E]/[0.15] text-[#22C55E] border border-[#22C55E]/30'
              : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
            }
          `}
        >
          Going{userResponse === 'yes' ? ' \u2713' : ''}
        </button>

        {allowMaybe && (
          <button
            onClick={() => onRsvp?.('maybe')}
            className={`
              px-4 h-9 rounded-3xl text-sm font-medium transition-colors duration-200
              ${userResponse === 'maybe'
                ? 'bg-[#FFD700]/[0.10] text-[#FFD700] border border-[#FFD700]/30'
                : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
              }
            `}
          >
            Maybe{userResponse === 'maybe' ? ' \u2713' : ''}
          </button>
        )}
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-xs text-white/30 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {rsvpCounts.yes} going
        </span>
        {rsvpCounts.maybe > 0 && (
          <span className="text-xs text-white/30">
            {rsvpCounts.maybe} maybe
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// COUNTDOWN CARD
// ============================================

function CountdownCard({
  component,
}: {
  component: InlineComponentData;
}) {
  const config = (component.config ?? {}) as {
    title?: string;
    targetDate?: string;
  };

  const title = config.title ?? 'Countdown';
  const targetDate = config.targetDate;

  const [timeLeft, setTimeLeft] = React.useState(() => computeTimeLeft(targetDate));

  React.useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={CARD_CLASSES}>
      <p className="text-white text-sm font-medium mb-3 leading-snug flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-[#FFD700]/60" />
        {title}
      </p>

      {timeLeft.isComplete ? (
        <p className="text-[#FFD700] text-sm font-medium">Complete!</p>
      ) : (
        <div className="flex items-center gap-3">
          {timeLeft.days > 0 && (
            <TimeUnit value={timeLeft.days} label="days" />
          )}
          <TimeUnit value={timeLeft.hours} label="hrs" />
          <TimeUnit value={timeLeft.minutes} label="min" />
          <TimeUnit value={timeLeft.seconds} label="sec" />
        </div>
      )}

      {targetDate && (
        <p className="text-xs text-white/30 mt-3">
          {formatTargetDate(targetDate)}
        </p>
      )}
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-white text-lg font-semibold tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[11px] text-white/30 mt-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function computeTimeLeft(targetDate?: string) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };

  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isComplete: false,
  };
}

function formatTargetDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ============================================
// SIGNUP CARD
// ============================================

function SignupCard({
  component,
}: {
  component: InlineComponentData;
}) {
  const config = (component.config ?? {}) as {
    title?: string;
    slots?: string[];
    limitPerSlot?: number;
  };
  const sharedState = (component.sharedState ?? {}) as {
    slotCounts?: Record<string, number>;
    slotMembers?: Record<string, string[]>;
    totalResponses?: number;
  };

  const title = config.title ?? 'Sign Up';
  const slots = config.slots ?? [];
  const slotCounts = sharedState.slotCounts ?? {};
  const slotMembers = sharedState.slotMembers ?? {};
  const limitPerSlot = config.limitPerSlot;
  const userSlot = component.userSlot as string | undefined;
  const totalSignups = sharedState.totalResponses ?? 0;

  return (
    <div className={CARD_CLASSES}>
      <p className="text-white text-sm font-medium mb-3 leading-snug">
        {title}
      </p>

      <div className="flex flex-col gap-1.5">
        {slots.map((slot) => {
          const count = slotCounts[slot] ?? 0;
          const members = slotMembers[slot] ?? [];
          const isFull = limitPerSlot ? count >= limitPerSlot : false;
          const isMine = userSlot === slot;

          return (
            <div
              key={slot}
              className={`
                flex items-center justify-between px-3 py-2 rounded-xl text-sm
                border transition-colors duration-200
                ${isMine
                  ? 'border-[#FFD700]/30 bg-[#FFD700]/[0.06]'
                  : 'border-white/[0.08] bg-white/[0.02]'
                }
              `}
            >
              <div className="flex-1 min-w-0">
                <span className={`truncate ${isMine ? 'text-[#FFD700]' : 'text-white/70'}`}>
                  {slot}
                </span>
                {members.length > 0 && (
                  <span className="text-xs text-white/30 ml-2">
                    {members.slice(0, 3).join(', ')}
                    {members.length > 3 ? ` +${members.length - 3}` : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-2 shrink-0">
                {limitPerSlot && (
                  <span className="text-xs text-white/30">
                    {count}/{limitPerSlot}
                  </span>
                )}
                {isMine ? (
                  <span className="text-xs text-[#FFD700]/80">Claimed</span>
                ) : isFull ? (
                  <span className="text-xs text-white/30">Full</span>
                ) : (
                  <span className="text-xs text-white/50">Open</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center mt-3">
        <span className="text-xs text-white/30">
          {totalSignups} signed up
        </span>
      </div>
    </div>
  );
}

// ============================================
// EVENT CARD
// ============================================

function EventCard({
  component,
  onRsvp,
}: {
  component: InlineComponentData;
  onRsvp?: (response: string) => void;
}) {
  const config = (component.config ?? {}) as {
    title?: string;
    date?: string;
    location?: string;
    description?: string;
  };
  const sharedState = (component.sharedState ?? {}) as {
    rsvpCounts?: { yes: number; no: number; maybe: number };
    totalResponses?: number;
  };

  const title = config.title ?? 'Event';
  const date = config.date;
  const location = config.location;
  const description = config.description;
  const rsvpCounts = sharedState.rsvpCounts ?? { yes: 0, no: 0, maybe: 0 };
  const userResponse = component.userResponse;

  const formattedDate = React.useMemo(() => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  }, [date]);

  return (
    <div className={`${CARD_CLASSES} border-l-2 border-l-[#FFD700]/40`}>
      <p className="text-white text-sm font-medium leading-snug">{title}</p>

      {description && (
        <p className="text-xs text-white/30 mt-1 line-clamp-2">{description}</p>
      )}

      <div className="flex flex-col gap-1 mt-2">
        {formattedDate && (
          <p className="text-xs text-white/50 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#FFD700]/50" />
            {formattedDate}
          </p>
        )}
        {location && (
          <p className="text-xs text-white/30 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-white/30" />
            {location}
          </p>
        )}
      </div>

      {/* RSVP + count */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => onRsvp?.('yes')}
          className={`
            px-4 h-8 rounded-3xl text-xs font-medium transition-colors duration-200
            ${userResponse === 'yes'
              ? 'bg-[#22C55E]/[0.15] text-[#22C55E] border border-[#22C55E]/30'
              : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
            }
          `}
        >
          {userResponse === 'yes' ? 'Going \u2713' : 'RSVP'}
        </button>

        <span className="text-xs text-white/30 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {rsvpCounts.yes} going
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export function InlineComponent({ component, onVote, onRsvp }: InlineComponentProps) {
  switch (component.type) {
    case 'poll':
      return <PollCard component={component} onVote={onVote} />;
    case 'rsvp':
      return <RsvpCard component={component} onRsvp={onRsvp} />;
    case 'countdown':
      return <CountdownCard component={component} />;
    case 'signup':
      return <SignupCard component={component} />;
    case 'event':
      return <EventCard component={component} onRsvp={onRsvp} />;
    default:
      return null;
  }
}
