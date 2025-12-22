'use client';

/**
 * CommandPreview - Live preview of parsed slash command
 *
 * Shows a preview of what the command will create (poll, timer, etc.)
 * along with validation errors before the user sends.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Timer,
  CalendarCheck,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ParsedCommandPreview {
  command: string;
  primaryArg: string;
  listArgs: string[];
  flags: Record<string, string | boolean>;
  isValid: boolean;
  errors: string[];
}

export interface CommandPreviewProps {
  /** The parsed command data */
  parsed: ParsedCommandPreview | null;
  /** Whether the preview is visible */
  visible: boolean;
  /** Command description */
  description?: string;
}

/**
 * CommandPreview Component
 *
 * Renders a preview of the slash command showing what will be created.
 * Displays validation errors if the command is incomplete or invalid.
 */
export function CommandPreview({
  parsed,
  visible,
  description,
}: CommandPreviewProps) {
  if (!visible || !parsed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'absolute bottom-full left-0 right-0 mb-2 z-50',
          'bg-gray-900/98 backdrop-blur-xl',
          'border rounded-xl overflow-hidden',
          'shadow-2xl shadow-black/40',
          parsed.isValid && parsed.errors.length === 0
            ? 'border-white/[0.12]'
            : 'border-amber-500/30'
        )}
      >
        {/* Preview based on command type */}
        {parsed.command === 'poll' && (
          <PollPreview parsed={parsed} />
        )}
        {parsed.command === 'timer' && (
          <TimerPreview parsed={parsed} />
        )}
        {parsed.command === 'rsvp' && (
          <RsvpPreview parsed={parsed} />
        )}
        {parsed.command === 'announce' && (
          <AnnouncePreview parsed={parsed} />
        )}

        {/* Validation errors */}
        {parsed.errors.length > 0 && (
          <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {parsed.errors.map((error, i) => (
                  <p key={i} className="text-sm text-amber-200/80">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ready indicator */}
        {parsed.isValid && parsed.errors.length === 0 && (
          <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Ready to send</span>
            </div>
            <span className="text-xs text-white/40">
              Press Enter ↵
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Poll Preview
 */
function PollPreview({ parsed }: { parsed: ParsedCommandPreview }) {
  const question = parsed.primaryArg || 'Your question here...';
  const options = parsed.listArgs.length > 0
    ? parsed.listArgs
    : ['Option 1', 'Option 2'];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <p className="text-xs text-white/50">Poll Preview</p>
          <p className="text-sm font-medium text-white">{question}</p>
        </div>
      </div>

      <div className="space-y-2 ml-10">
        {options.map((option, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]"
          >
            <div className="w-4 h-4 rounded-full border-2 border-white/30" />
            <span className="text-sm text-white/80">{option}</span>
          </div>
        ))}
      </div>

      {/* Flags */}
      {(parsed.flags['multi'] || parsed.flags['expires']) && (
        <div className="mt-3 ml-10 flex items-center gap-2 text-xs text-white/40">
          {parsed.flags['multi'] && (
            <span className="px-2 py-0.5 bg-white/[0.06] rounded">
              Multiple choice
            </span>
          )}
          {parsed.flags['expires'] && (
            <span className="px-2 py-0.5 bg-white/[0.06] rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expires in {String(parsed.flags['expires'])}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Timer Preview
 */
function TimerPreview({ parsed }: { parsed: ParsedCommandPreview }) {
  const title = parsed.primaryArg || 'Countdown';
  const duration = parsed.listArgs[0] || '25m';

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <Timer className="w-4 h-4 text-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <p className="text-xs text-white/50">Timer Preview</p>
          <p className="text-sm font-medium text-white">{title}</p>
        </div>
      </div>

      <div className="ml-10 p-4 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center">
        <div className="text-3xl font-mono font-bold text-white">
          {formatDurationDisplay(duration)}
        </div>
        <p className="text-xs text-white/40 mt-1">
          Will start counting down when sent
        </p>
      </div>
    </div>
  );
}

/**
 * RSVP Preview
 */
function RsvpPreview({ parsed }: { parsed: ParsedCommandPreview }) {
  const eventName = parsed.primaryArg || 'Event Name';
  const date = parsed.flags['date'] as string || 'TBD';
  const maxCapacity = parsed.flags['max'] as string | undefined;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <CalendarCheck className="w-4 h-4 text-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <p className="text-xs text-white/50">RSVP Preview</p>
          <p className="text-sm font-medium text-white">{eventName}</p>
        </div>
      </div>

      <div className="ml-10 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{date}</span>
          </div>
          {maxCapacity && (
            <div className="flex items-center gap-1 text-white/60">
              <Users className="w-4 h-4" />
              <span className="text-sm">Max {maxCapacity}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium">
            Going
          </button>
          <button className="flex-1 py-2 rounded-lg bg-white/[0.06] text-white/60 text-sm font-medium">
            Maybe
          </button>
          <button className="flex-1 py-2 rounded-lg bg-white/[0.06] text-white/60 text-sm font-medium">
            Can&apos;t Go
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Announce Preview
 */
function AnnouncePreview({ parsed }: { parsed: ParsedCommandPreview }) {
  const message = parsed.primaryArg || parsed.listArgs.join(', ') || 'Your announcement here...';
  const style = (parsed.flags['style'] as string) || 'info';

  const styleColors: Record<string, string> = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    urgent: 'bg-red-500/10 border-red-500/30 text-red-200',
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <p className="text-xs text-white/50">Announcement Preview</p>
          <p className="text-sm font-medium text-white/60">Leaders only</p>
        </div>
      </div>

      <div className={cn(
        'ml-10 p-4 rounded-lg border',
        styleColors[style] || styleColors.info
      )}>
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}

/**
 * Format duration for display (e.g., "25m" → "25:00")
 */
function formatDurationDisplay(duration: string): string {
  const match = duration.match(/^(\d+)(s|m|h)$/);
  if (!match) return duration;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return `00:${value.toString().padStart(2, '0')}`;
    case 'm':
      return `${value.toString().padStart(2, '0')}:00`;
    case 'h':
      return `${value}:00:00`;
    default:
      return duration;
  }
}

export default CommandPreview;
