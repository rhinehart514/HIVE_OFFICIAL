'use client';

/**
 * ProfileEventCard - Zone 2: Upcoming events they're organizing
 *
 * Design Philosophy:
 * - Shows what they're ORGANIZING — upcoming activities
 * - Event emoji indicator, name, date + RSVPs
 * - Context (organizing with [Space])
 * - Max 2 upcoming events shown
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProfileEvent {
  id: string;
  name: string;
  emoji?: string;
  date: string; // Formatted date string, e.g., "Mar 15"
  rsvpCount: number;
  spaceName?: string;
}

export interface ProfileEventCardProps {
  event: ProfileEvent;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileEventCard({
  event,
  onClick,
  className,
}: ProfileEventCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-4 text-left overflow-hidden w-full',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
      whileTap={{ opacity: 0.9 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Subtle glass overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
          borderRadius: '16px',
        }}
      />

      <div className="relative">
        {/* Emoji + Event Name */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-lg flex-shrink-0">
            {event.emoji || '🎯'}
          </span>
          <h4
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {event.name}
          </h4>
        </div>

        {/* Date + RSVPs */}
        <p
          className="text-sm font-normal"
          style={{ color: 'var(--text-secondary)' }}
        >
          {event.date} · {event.rsvpCount} RSVP{event.rsvpCount !== 1 ? 's' : ''}
        </p>

        {/* Context - Space name */}
        {event.spaceName && (
          <p
            className="text-[13px] font-normal mt-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Organizing with {event.spaceName}
          </p>
        )}
      </div>
    </motion.button>
  );
}

export default ProfileEventCard;
