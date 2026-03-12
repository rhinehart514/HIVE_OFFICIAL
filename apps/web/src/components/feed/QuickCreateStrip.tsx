'use client';

import Link from 'next/link';
import { Mono } from '@hive/ui/design-system/primitives';

const CREATE_OPTIONS = [
  { label: 'Poll', hint: 'poll', emoji: '📊' },
  { label: 'Bracket', hint: 'bracket', emoji: '🏆' },
  { label: 'RSVP', hint: 'rsvp', emoji: '📋' },
  { label: 'Signup', hint: 'signup', emoji: '✍️' },
  { label: 'Countdown', hint: 'countdown', emoji: '⏳' },
];

export function QuickCreateStrip() {
  return (
    <section className="py-4">
      <Mono size="label" className="text-white/50 mb-3">
        MAKE SOMETHING
      </Mono>
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 snap-x">
        {CREATE_OPTIONS.map((opt) => (
          <Link
            key={opt.hint}
            href={`/build?hint=${opt.hint}`}
            className="flex-shrink-0 snap-start flex items-center gap-2 px-4 py-3 rounded-2xl
              border border-white/[0.05] bg-card hover:bg-card-hover
              transition-colors duration-100 group"
          >
            <span className="text-base">{opt.emoji}</span>
            <span className="text-[13px] text-white/50 group-hover:text-white/70 transition-colors">
              {opt.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
