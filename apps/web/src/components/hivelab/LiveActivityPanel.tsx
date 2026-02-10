'use client';

/**
 * LiveActivityPanel - Real-time activity stream for the lab IDE.
 *
 * Shows live timeline events and counter values for a deployed tool.
 * Reads from RTDB via useToolStateRealtime hook.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION } from '@hive/ui/tokens/motion';
import {
  useToolStateRealtime,
  type ToolStateTimelineEvent,
} from '@/hooks/use-tool-state-realtime';

interface LiveActivityPanelProps {
  deploymentId: string | null;
  className?: string;
}

const ACTION_LABELS: Record<string, string> = {
  vote: 'voted',
  rsvp: 'RSVPed',
  rsvp_created: 'RSVPed',
  rsvp_updated: 'updated RSVP',
  submit: 'submitted',
  signup: 'signed up',
  withdraw: 'withdrew',
  toggle_complete: 'toggled task',
  add_item: 'added item',
  remove_item: 'removed item',
  increment: 'incremented',
  decrement: 'decremented',
  toggle: 'toggled',
  save_input: 'saved input',
  select: 'selected',
  search: 'searched',
  select_slot: 'selected slot',
  select_date: 'picked date',
  select_user: 'selected user',
  select_member: 'selected member',
  select_tag: 'toggled tag',
  start: 'started timer',
  stop: 'stopped timer',
  reset: 'reset timer',
  lap: 'recorded lap',
  set_progress: 'set progress',
  increment_progress: 'advanced progress',
  reset_progress: 'reset progress',
  update_score: 'updated score',
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TimelineEventRow({ event }: { event: ToolStateTimelineEvent }) {
  const label = ACTION_LABELS[event.action] || event.action;
  const userId = event.userId?.slice(0, 8) || 'anon';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
      className="flex items-center gap-2 py-1.5 px-2 text-xs border-b border-white/[0.04] last:border-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)] shrink-0" />
      <span className="text-white/70 truncate flex-1">
        <span className="text-white/40">{userId}</span>{' '}
        {label}
      </span>
      <span className="text-white/30 tabular-nums shrink-0">
        {formatRelativeTime(event.timestamp)}
      </span>
    </motion.div>
  );
}

function CounterRow({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 text-xs">
      <span className="text-white/50 truncate">{name}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.2, color: 'var(--life-gold)' }}
        animate={{ scale: 1, color: 'rgba(255,255,255,0.9)' }}
        transition={{ duration: 0.3 }}
        className="font-mono font-medium tabular-nums"
      >
        {value.toLocaleString()}
      </motion.span>
    </div>
  );
}

export function LiveActivityPanel({ deploymentId, className = '' }: LiveActivityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { counters, timeline, isConnected, error } = useToolStateRealtime(deploymentId, {
    enabled: !!deploymentId,
  });

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline, autoScroll]);

  // Detect manual scroll to pause auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
  };

  // Sort counters for stable display
  const counterEntries = Object.entries(counters).sort(([a], [b]) => a.localeCompare(b));

  if (!deploymentId) {
    return (
      <div className={`flex items-center justify-center h-full text-white/30 text-sm ${className}`}>
        Deploy a tool to see live activity
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-black/20 rounded-lg border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-400' : error ? 'bg-red-400' : 'bg-white/20'
          }`}
        />
        <span className="text-xs font-medium text-white/70">
          {isConnected ? 'Live' : error ? 'Disconnected' : 'Connecting...'}
        </span>
        {!autoScroll && timeline.length > 0 && (
          <button
            onClick={() => {
              setAutoScroll(true);
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }}
            className="ml-auto text-[10px] text-[var(--life-gold)] hover:text-[var(--life-gold)]/80 transition-colors"
          >
            Resume scroll
          </button>
        )}
      </div>

      {/* Counters */}
      {counterEntries.length > 0 && (
        <div className="border-b border-white/[0.06] py-1">
          {counterEntries.map(([name, value]) => (
            <CounterRow key={name} name={name} value={value} />
          ))}
        </div>
      )}

      {/* Timeline */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {timeline.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-xs py-8">
            Waiting for activity...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {timeline.map((event) => (
              <TimelineEventRow key={event.id} event={event} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
