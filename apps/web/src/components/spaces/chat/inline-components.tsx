'use client';

/**
 * Inline Component Renderers
 *
 * Renders poll, countdown, and RSVP components inline in chat messages.
 * These are the interactive tools that appear below messages when created
 * via slash commands or AI intent.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching backend InlineComponent entity)
// ─────────────────────────────────────────────────────────────────────────────

interface PollConfig {
  question: string;
  options: string[];
  allowMultiple: boolean;
  showResults: 'always' | 'after_vote' | 'after_close';
  closesAt?: string;
}

interface CountdownConfig {
  title: string;
  targetDate: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

interface RsvpConfig {
  eventTitle: string;
  eventDate: string;
  maxCapacity?: number;
  allowMaybe: boolean;
}

interface SharedState {
  optionCounts?: Record<string, number>;
  rsvpCounts?: { yes: number; no: number; maybe: number };
  totalResponses: number;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isComplete: boolean;
  };
}

export interface InlineComponentData {
  id: string;
  type: 'poll' | 'countdown' | 'rsvp' | 'custom';
  config: PollConfig | CountdownConfig | RsvpConfig | Record<string, unknown>;
  sharedState: SharedState;
  userVote?: string[];
  userResponse?: 'yes' | 'no' | 'maybe';
}

interface InlineComponentProps {
  component: InlineComponentData;
  onVote?: (optionIndex: number) => void;
  onRsvp?: (response: 'yes' | 'no' | 'maybe') => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll Renderer
// ─────────────────────────────────────────────────────────────────────────────

function PollComponent({ component, onVote }: InlineComponentProps) {
  const config = component.config as PollConfig;
  const { optionCounts = {}, totalResponses = 0 } = component.sharedState;
  const userVote = component.userVote || [];

  return (
    <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
      <div className="text-sm font-medium text-white">{config.question}</div>

      <div className="space-y-2">
        {config.options.map((option, index) => {
          const count = optionCounts[option] || 0;
          const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
          const isSelected = userVote.includes(option);

          return (
            <button
              key={index}
              onClick={() => onVote?.(index)}
              disabled={!onVote}
              className={cn(
                'w-full relative rounded-lg p-3 text-left transition-all',
                'border border-white/[0.08]',
                isSelected
                  ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30'
                  : 'bg-white/[0.02] hover:bg-white/[0.04]',
                !onVote && 'cursor-default'
              )}
            >
              {/* Vote bar background */}
              <div
                className={cn(
                  'absolute inset-0 rounded-lg transition-all',
                  isSelected ? 'bg-[var(--color-gold)]/5' : 'bg-white/[0.02]'
                )}
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-gold)]" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/30" />
                  )}
                  <span className="text-sm text-white">{option}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{count}</span>
                  {totalResponses > 0 && <span>({Math.round(percentage)}%)</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-xs text-white/40">
        {totalResponses} {totalResponses === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown Renderer
// ─────────────────────────────────────────────────────────────────────────────

function CountdownComponent({ component }: InlineComponentProps) {
  const config = component.config as CountdownConfig;
  const [timeRemaining, setTimeRemaining] = React.useState(() => calculateTimeRemaining(config.targetDate));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(config.targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [config.targetDate]);

  if (timeRemaining.isComplete) {
    return (
      <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
        <div className="text-sm font-medium text-white mb-2">{config.title}</div>
        <div className="text-xs text-white/50">Event has started!</div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
      <div className="text-sm font-medium text-white mb-3">{config.title}</div>

      <div className="flex items-center gap-4">
        {config.showDays && timeRemaining.days > 0 && (
          <TimeUnit value={timeRemaining.days} label="days" />
        )}
        {config.showHours && (
          <TimeUnit value={timeRemaining.hours} label="hrs" />
        )}
        {config.showMinutes && (
          <TimeUnit value={timeRemaining.minutes} label="min" />
        )}
        {config.showSeconds && (
          <TimeUnit value={timeRemaining.seconds} label="sec" />
        )}
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function calculateTimeRemaining(targetDate: string) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isComplete: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// RSVP Renderer
// ─────────────────────────────────────────────────────────────────────────────

function RsvpComponent({ component, onRsvp }: InlineComponentProps) {
  const config = component.config as RsvpConfig;
  const { rsvpCounts = { yes: 0, no: 0, maybe: 0 } } = component.sharedState;
  const userResponse = component.userResponse;

  const eventDate = new Date(config.eventDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
      <div>
        <div className="text-sm font-medium text-white">{config.eventTitle}</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/50">
          <Clock className="w-3 h-3" />
          {formattedDate}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={userResponse === 'yes' ? 'cta' : 'secondary'}
          onClick={() => onRsvp?.('yes')}
          disabled={!onRsvp}
          className="flex-1"
        >
          Going ({rsvpCounts.yes})
        </Button>

        {config.allowMaybe && (
          <Button
            size="sm"
            variant={userResponse === 'maybe' ? 'cta' : 'secondary'}
            onClick={() => onRsvp?.('maybe')}
            disabled={!onRsvp}
            className="flex-1"
          >
            Maybe ({rsvpCounts.maybe})
          </Button>
        )}

        <Button
          size="sm"
          variant={userResponse === 'no' ? 'ghost' : 'secondary'}
          onClick={() => onRsvp?.('no')}
          disabled={!onRsvp}
          className="flex-1"
        >
          Can't go ({rsvpCounts.no})
        </Button>
      </div>

      {config.maxCapacity && (
        <div className="text-xs text-white/40">
          {rsvpCounts.yes} / {config.maxCapacity} spots filled
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Renderer
// ─────────────────────────────────────────────────────────────────────────────

export function InlineComponent({ component, onVote, onRsvp }: InlineComponentProps) {
  switch (component.type) {
    case 'poll':
      return <PollComponent component={component} onVote={onVote} />;
    case 'countdown':
      return <CountdownComponent component={component} />;
    case 'rsvp':
      return <RsvpComponent component={component} onRsvp={onRsvp} />;
    default:
      return null;
  }
}
