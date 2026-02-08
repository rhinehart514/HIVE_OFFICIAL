'use client';

/**
 * ActivityPreview - Muted feed preview behind glass
 *
 * Shows a glimpse of what's happening inside the space:
 * - Recent messages (blurred/muted)
 * - Upcoming events
 * - Activity hints
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { Calendar, MessageSquare, Sparkles } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  useInView,
  MOTION,
} from '@hive/ui/design-system/primitives';



// ============================================================
// Types
// ============================================================

interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  goingCount?: number;
}

interface ActivityPreviewProps {
  /** Recent message count */
  messageCount?: number;
  /** Last active label (e.g., "5 min ago") */
  lastActiveLabel?: string;
  /** Upcoming events */
  upcomingEvents?: UpcomingEvent[];
  /** Delay before animation starts */
  delay?: number;
}

// ============================================================
// Event Preview Card
// ============================================================

function EventPreviewCard({
  event,
  index,
  delay,
}: {
  event: UpcomingEvent;
  index: number;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="p-3 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : delay + index * 0.1,
        ease: MOTION.ease.premium,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/70 truncate">
            {event.title}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {event.time}
          </p>
        </div>
        {(event.goingCount ?? 0) > 0 && (
          <span className="text-xs text-white/40 shrink-0">
            {event.goingCount} going
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Message Preview (placeholder)
// ============================================================

function MessagePreviewPlaceholder({
  index,
  delay,
}: {
  index: number;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  // Random widths for variety
  const widths = ['60%', '80%', '45%', '70%', '55%'];
  const width = widths[index % widths.length];

  return (
    <motion.div
      className="flex items-start gap-3 py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : delay + index * 0.05,
      }}
    >
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-white/[0.04] shrink-0" />

      {/* Content placeholder */}
      <div className="flex-1">
        <div className="w-24 h-3 rounded bg-white/[0.04] mb-1.5" />
        <div
          className="h-3 rounded bg-white/[0.03]"
          style={{ width }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ActivityPreview({
  messageCount = 0,
  lastActiveLabel,
  upcomingEvents = [],
  delay = 0,
}: ActivityPreviewProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  const hasEvents = upcomingEvents.length > 0;
  const hasActivity = messageCount > 0 || hasEvents;

  if (!hasActivity) {
    return (
      <motion.div
        ref={ref}
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.base,
          delay: shouldReduceMotion ? 0 : delay,
        }}
      >
        <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/30">
          Be the first to start a conversation
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : delay,
      }}
    >
      {/* Upcoming Events */}
      {hasEvents && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#FFD700]/60" />
            <span className="text-xs uppercase tracking-wider text-white/40">
              Next Up
            </span>
          </div>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 2).map((event, index) => (
              <EventPreviewCard
                key={event.id}
                event={event}
                index={index}
                delay={delay + 0.2}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Hint */}
      {messageCount > 0 && (
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
            delay: shouldReduceMotion ? 0 : delay + 0.4,
          }}
        >
          <MessageSquare className="w-4 h-4 text-white/30" />
          <span className="text-xs text-white/40">
            {messageCount} messages
            {lastActiveLabel && ` · Active ${lastActiveLabel}`}
          </span>
        </motion.div>
      )}

      {/* Message preview placeholders */}
      <div className="space-y-1 opacity-50">
        {Array.from({ length: Math.min(messageCount, 4) }).map((_, i) => (
          <MessagePreviewPlaceholder
            key={i}
            index={i}
            delay={delay + 0.5}
          />
        ))}
      </div>
    </motion.div>
  );
}

ActivityPreview.displayName = 'ActivityPreview';
