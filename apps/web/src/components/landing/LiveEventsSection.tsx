'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, Users, ArrowRight } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

interface EventPreview {
  id: string;
  title: string;
  startTime: string;
  space: { name: string } | null;
  goingCount: number;
}

// Static fallback events for when API returns empty
const FALLBACK_EVENTS: EventPreview[] = [
  {
    id: 'f1',
    title: 'UB Hacking Spring Kickoff',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    space: { name: 'UB Hacking' },
    goingCount: 127,
  },
  {
    id: 'f2',
    title: 'Dance Marathon Interest Meeting',
    startTime: new Date(Date.now() + 172800000).toISOString(),
    space: { name: 'Dance Marathon' },
    goingCount: 84,
  },
  {
    id: 'f3',
    title: 'SWE Resume Workshop',
    startTime: new Date(Date.now() + 259200000).toISOString(),
    space: { name: 'Society of Women Engineers' },
    goingCount: 56,
  },
];

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Tomorrow, ${timeStr}`;
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dayStr}, ${timeStr}`;
}

export function LiveEventsSection() {
  const prefersReduced = useReducedMotion();
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    // Fetch upcoming events for UB
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString();

    fetch(`/api/events?upcoming=true&limit=5&from=${now}&to=${weekFromNow}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        const fetched = d.data?.events || [];
        setEvents(fetched.length > 0 ? fetched.slice(0, 5) : FALLBACK_EVENTS);
        setLoaded(true);
      })
      .catch(() => {
        setEvents(FALLBACK_EVENTS);
        setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  const reveal = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, margin: '-60px' } as const,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
        };

  if (!loaded) return null;

  return (
    <section className="bg-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <motion.div {...reveal()} className="mb-10">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#EC4899]/70">
            This week at UB
          </span>
          <h2 className={`${clashDisplay} text-[clamp(28px,5vw,40px)] font-semibold tracking-tight text-white`}>
            What&apos;s happening now
          </h2>
        </motion.div>

        <div className="space-y-3">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              {...reveal(i * 0.06)}
              className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/[0.1]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EC4899]/10">
                <Calendar className="h-4 w-4 text-[#EC4899]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-white/80">
                  {event.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-white/35">
                  <span>{formatEventDate(event.startTime)}</span>
                  {event.space && (
                    <>
                      <span className="text-white/15">·</span>
                      <span>{event.space.name}</span>
                    </>
                  )}
                </div>
              </div>
              {event.goingCount > 0 && (
                <div className="flex shrink-0 items-center gap-1 text-[12px] text-white/30">
                  <Users className="h-3 w-3" />
                  <span>{event.goingCount}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div {...reveal(0.3)} className="mt-6">
          <Link
            href="/enter"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/60 transition-colors"
          >
            See all events
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
