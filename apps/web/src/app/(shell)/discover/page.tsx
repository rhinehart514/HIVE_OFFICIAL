'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  ExternalLink,
  MapPin,
  Users,
  Video,
  X,
  Zap,
  ArrowRight,
  Radio,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { cn } from '@/lib/utils';
import { FeedToolCard } from './components/FeedToolCard';
import { FeedActivityCard } from './components/FeedActivityCard';
import { ToolCanvasInline } from './components/ToolCanvasInline';

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface FeedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  isUserRsvped?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  spaceAvatarUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  eventType?: string;
  category?: string;
  friendsAttending?: number;
  matchReasons?: string[];
}

interface FeedSpace {
  id: string;
  handle?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  category?: string;
  mutualCount?: number;
  upcomingEventCount?: number;
  nextEventTitle?: string;
}

interface FeedTool {
  id: string;
  title: string;
  description?: string;
  creatorId?: string;
  creatorName?: string;
  spaceOriginName?: string;
  forkCount: number;
  useCount: number;
  category?: string;
  createdAt: string;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Data fetching                                                      */
/* ─────────────────────────────────────────────────────────────────── */

async function fetchFeedEvents(): Promise<FeedEvent[]> {
  const params = new URLSearchParams({ timeRange: 'upcoming', maxItems: '50', sort: 'soonest' });
  const res = await fetch(`/api/events/personalized?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const payload = await res.json();
  return (payload.data || payload).events || [];
}

async function fetchFeedSpaces(): Promise<FeedSpace[]> {
  const params = new URLSearchParams({ category: 'all', sort: 'trending', limit: '10' });
  const res = await fetch(`/api/spaces/browse-v2?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const spaces = data?.data?.spaces || data?.spaces || [];
  return spaces
    .filter((s: Record<string, unknown>) => !s.isJoined)
    .map((s: Record<string, unknown>) => ({
      id: s.id,
      handle: s.handle || s.slug,
      name: s.name,
      description: s.description,
      avatarUrl: s.iconURL || s.bannerImage,
      memberCount: (s.memberCount as number) || 0,
      isVerified: s.isVerified,
      isJoined: s.isJoined,
      category: s.category,
      mutualCount: s.mutualCount,
      upcomingEventCount: s.upcomingEventCount,
      nextEventTitle: s.nextEventTitle,
    }));
}

async function fetchFeedTools(): Promise<FeedTool[]> {
  const params = new URLSearchParams({ sort: 'trending', limit: '15' });
  const res = await fetch(`/api/tools/discover?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const tools = data?.data?.tools || data?.tools || [];
  return tools.map((t: Record<string, unknown>) => ({
    id: t.id,
    title: t.title || t.name,
    description: t.description,
    creatorId: (t.creator as Record<string, unknown>)?.id,
    creatorName: (t.creator as Record<string, unknown>)?.name,
    spaceOriginName: (t.spaceOrigin as Record<string, unknown>)?.name,
    forkCount: (t.forkCount as number) || 0,
    useCount: (t.useCount as number) || 0,
    category: t.category,
    createdAt: t.createdAt as string,
  }));
}

interface ActivityItem {
  id: string;
  type: string;
  headline: string;
  toolId?: string;
  toolName?: string;
  spaceId?: string;
  spaceName?: string;
  timestamp: string;
}

async function fetchGlobalActivity(): Promise<ActivityItem[]> {
  const res = await fetch('/api/feed/global?limit=8', { credentials: 'include' });
  if (!res.ok) return [];
  const payload = await res.json();
  const items: ActivityItem[] = payload?.data?.items || [];
  return items.filter(i => i.type === 'tool_created' || i.type === 'tool_deployed');
}

async function rsvpToEvent(spaceId: string, eventId: string): Promise<void> {
  const res = await fetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'going' }),
  });
  if (!res.ok) throw new Error('RSVP failed');
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function isHappeningNow(startDate: string, endDate?: string): boolean {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : start + 2 * 3600 * 1000;
  return now >= start && now <= end;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function timeLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMs < 0 && Math.abs(diffMs) < 2 * 3600 * 1000) return 'Happening now';
  if (diffMin <= 15 && diffMin >= 0) return 'Starting soon';
  if (diffMin < 60 && diffMin >= 0) return `In ${diffMin}m`;
  return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fullTimeLabel(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  let label = start.toLocaleDateString('en-US', opts);
  if (endDate) {
    const end = new Date(endDate);
    label += ` – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return label;
}

function dayLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((start.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}


function cleanDescription(raw?: string): string | undefined {
  if (!raw) return undefined;
  const stripped = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > 0 ? stripped : undefined;
}

function eventGradient(category?: string, eventType?: string): string {
  const key = (category || eventType || '').toLowerCase();
  if (key.includes('social') || key.includes('party') || key.includes('networking'))
    return 'from-amber-950/80 to-stone-950/60';
  if (key.includes('academic') || key.includes('lecture') || key.includes('class') || key.includes('study'))
    return 'from-indigo-950/80 to-slate-950/60';
  if (key.includes('sport') || key.includes('game') || key.includes('athletic') || key.includes('fitness'))
    return 'from-emerald-950/80 to-teal-950/60';
  if (key.includes('art') || key.includes('music') || key.includes('perform') || key.includes('creat'))
    return 'from-violet-950/80 to-purple-950/60';
  if (key.includes('greek') || key.includes('fraternity') || key.includes('sorority'))
    return 'from-rose-950/80 to-red-950/60';
  if (key.includes('food') || key.includes('dining') || key.includes('cook'))
    return 'from-orange-950/80 to-amber-950/60';
  return 'from-zinc-900/80 to-zinc-950/60';
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Shared Avatar                                                      */
/* ─────────────────────────────────────────────────────────────────── */

function SpaceAvatar({ name, url, size = 32 }: { name?: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name || ''} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div className="rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 text-white/50 font-medium" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {letter}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Event Detail Modal                                                 */
/* ─────────────────────────────────────────────────────────────────── */

const modalSpring = { type: 'spring' as const, damping: 28, stiffness: 300, mass: 0.8 };
const modalFade = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

function EventDetailModal({
  event,
  onClose,
  onRsvp,
}: {
  event: FeedEvent;
  onClose: () => void;
  onRsvp: (id: string, spaceId: string) => void;
}) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const coverSrc = event.imageUrl || event.coverImageUrl;
  const desc = cleanDescription(event.description);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={modalFade}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={modalFade}
      />

      {/* Modal panel */}
      <motion.div
        ref={modalRef}
        layoutId={`event-card-${event.id}`}
        className="relative w-full max-w-[520px] max-h-[85vh] overflow-hidden rounded-2xl bg-[#111] border border-white/[0.08] shadow-2xl shadow-black/40 flex flex-col"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={modalSpring}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image / gradient header */}
        <div className="relative h-56 w-full shrink-0 overflow-hidden">
          {coverSrc ? (
            <img src={coverSrc} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br', eventGradient(event.category, event.eventType))} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/30 to-transparent" />

          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {live && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/25 backdrop-blur-md border border-red-500/20 text-[11px] font-semibold text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Live now
              </span>
            )}
          </div>

          {/* Title overlaid at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <h2 className="text-[24px] font-semibold text-white leading-tight tracking-[-0.02em]">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">

          {/* Time & Location details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-white/40" />
              </div>
              <div>
                <p className="text-[14px] text-white/80 font-medium">{fullTimeLabel(event.startDate, event.endDate)}</p>
                <p className="text-[12px] text-white/30 mt-0.5">{dayLabel(event.startDate)} · {timeLabel(event.startDate)}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  {event.isOnline ? <Video className="w-4 h-4 text-white/40" /> : <MapPin className="w-4 h-4 text-white/40" />}
                </div>
                <div>
                  <p className="text-[14px] text-white/80 font-medium">{event.isOnline ? 'Online event' : event.location}</p>
                </div>
              </div>
            )}

            {(event.rsvpCount > 0 || (event.friendsAttending && event.friendsAttending > 0)) && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-white/40" />
                </div>
                <div>
                  <p className="text-[14px] text-white/80 font-medium">
                    {event.rsvpCount} going
                    {event.friendsAttending && event.friendsAttending > 0 && (
                      <span className="text-[#FFD700]/60"> · {event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {desc && (
            <div>
              <p className="text-[13px] text-white/40 leading-relaxed">{desc}</p>
            </div>
          )}

          {/* Match reasons */}
          {event.matchReasons && event.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.matchReasons.map((reason, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/35">
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Space link */}
          {event.spaceName && (
            <Link
              href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
            >
              <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={28} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/70 font-medium truncate group-hover:text-white/90 transition-colors">{event.spaceName}</p>
                <p className="text-[11px] text-white/25">View space</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
            </Link>
          )}
        </div>

        {/* Sticky footer — RSVP action */}
        {event.spaceId && (
          <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-[#111]">
            <button
              onClick={() => onRsvp(event.id, event.spaceId!)}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.98]',
                isGoing
                  ? 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:bg-white/[0.08]'
                  : 'bg-white text-black hover:bg-white/90'
              )}
            >
              {isGoing ? <><Check className="w-4 h-4" />Going</> : 'Attend'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Hero Event                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function HeroEvent({ event, onSelect }: { event: FeedEvent; onSelect: (e: FeedEvent) => void }) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const coverSrc = event.imageUrl || event.coverImageUrl;

  return (
    <motion.div
      layoutId={`event-card-${event.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(event)}
      className="relative group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] hover:border-white/[0.12] transition-colors duration-300"
    >
      {/* Full-bleed image with overlaid content */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', eventGradient(event.category, event.eventType))} />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {live ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/20 text-[11px] font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live now
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/[0.08] text-[11px] font-medium text-white/70">
              {dayLabel(event.startDate)} · {timeLabel(event.startDate)}
            </span>
          )}
          {isGoing && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FFD700]/10 backdrop-blur-md border border-[#FFD700]/20 text-[11px] font-medium text-[#FFD700]/80">
              <Check className="w-3 h-3" /> Going
            </span>
          )}
        </div>

        {/* Bottom content — overlaid on image */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Space context */}
          {event.spaceName && (
            <div className="flex items-center gap-1.5 mb-2">
              <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={16} />
              <span className="text-[12px] text-white/50">{event.spaceName}</span>
            </div>
          )}

          <h2 className="text-[24px] font-semibold text-white leading-tight tracking-[-0.02em] mb-2">
            {event.title}
          </h2>

          {/* Inline meta */}
          <div className="flex items-center gap-4 text-[12px] text-white/40">
            {event.location && (
              <span className="flex items-center gap-1.5">
                {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                <span className="truncate max-w-[200px]">{event.isOnline ? 'Online' : event.location}</span>
              </span>
            )}
            {event.rsvpCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                {event.rsvpCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Today Strip                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function TodayStrip({ events, onSelect }: { events: FeedEvent[]; onSelect: (e: FeedEvent) => void }) {
  if (events.length === 0) return null;

  return (
    <div className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
          <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">Today</span>
        </div>
        <span className="text-[11px] text-white/20 tabular-nums">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {events.map((event, i) => {
          const live = isHappeningNow(event.startDate, event.endDate);
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          const coverSrc = event.imageUrl || event.coverImageUrl;

          return (
            <motion.button
              key={event.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onSelect(event)}
              className="shrink-0 w-[180px] text-left group cursor-pointer relative overflow-hidden rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-[#0a0a0a] transition-all duration-200"
            >
              {/* Micro image header */}
              <div className="h-14 w-full overflow-hidden relative">
                {coverSrc ? (
                  <img src={coverSrc} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                ) : (
                  <div className={cn('w-full h-full bg-gradient-to-br opacity-60', eventGradient(event.category, event.eventType))} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                <span className={cn(
                  'absolute top-2 left-2.5 text-[10px] font-semibold',
                  live ? 'text-red-400' : 'text-white/50'
                )}>
                  {live ? '● LIVE' : timeLabel(event.startDate)}
                </span>
                {isGoing && <Check className="absolute top-2 right-2.5 w-3 h-3 text-[#FFD700]" />}
              </div>

              <div className="px-3 pb-2.5 pt-1">
                <p className="text-[12px] font-medium text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {event.title}
                </p>
                {event.rsvpCount > 0 && (
                  <span className="text-[10px] text-white/20 mt-1 block">{event.rsvpCount} going</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Feed Event Card                                                    */
/* ─────────────────────────────────────────────────────────────────── */

function FeedEventCard({ event, onSelect }: { event: FeedEvent; onSelect: (e: FeedEvent) => void }) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const coverSrc = event.imageUrl || event.coverImageUrl;

  return (
    <motion.div
      layoutId={`event-card-${event.id}`}
      onClick={() => onSelect(event)}
      className="group cursor-pointer rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden hover:border-white/[0.12] transition-all duration-200"
    >
      {/* Image — 16:9-ish ratio */}
      <div className="relative h-36 w-full overflow-hidden">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', eventGradient(event.category, event.eventType))} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />

        {/* Time badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {live ? (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/20 text-[10px] font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/[0.08] text-[10px] font-medium text-white/60">
              {dayLabel(event.startDate)} · {timeLabel(event.startDate)}
            </span>
          )}
          {isGoing && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD700]/10 backdrop-blur-sm border border-[#FFD700]/20 text-[10px] text-[#FFD700]/80">
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3.5">
        {/* Space context */}
        {event.spaceName && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
            <span className="text-[11px] text-white/30 truncate">{event.spaceName}</span>
          </div>
        )}

        <h3 className="text-[15px] font-semibold text-white leading-snug group-hover:text-white/90 transition-colors">
          {event.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-white/25">
          {event.location && (
            <span className="flex items-center gap-1">
              {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              <span className="truncate max-w-[140px]">{event.isOnline ? 'Online' : event.location}</span>
            </span>
          )}
          {event.rsvpCount > 0 && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.rsvpCount}</span>
          )}
          {event.friendsAttending && event.friendsAttending > 0 && (
            <span className="text-[#FFD700]/40">{event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* EmbeddedToolCard removed — replaced by FeedToolCard */

/* ActivityStrip removed — activity now renders inline via FeedActivityCard */

/* ─────────────────────────────────────────────────────────────────── */
/*  Right Rail                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function FeedRightRail({
  events,
  spaces,
  tools,
  todayCount,
  totalCount,
  onSelectEvent,
}: {
  events: FeedEvent[];
  spaces: FeedSpace[];
  tools: FeedTool[];
  todayCount: number;
  totalCount: number;
  onSelectEvent: (e: FeedEvent) => void;
}) {
  const upcoming = events.filter(e => !isToday(e.startDate)).slice(0, 4);
  const topSpaces = spaces.slice(0, 5);
  const trending = tools.slice(0, 3);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 sticky top-6 self-start order-2 gap-0">

      {/* Campus pulse */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
            <Radio className="w-3 h-3 text-[#FFD700]/70" />
          </div>
          <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">Campus pulse</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-semibold text-white tracking-tight tabular-nums leading-none">
            {todayCount > 0 ? todayCount : totalCount}
          </span>
          <span className="text-[12px] text-white/35">
            {todayCount > 0 ? `event${todayCount !== 1 ? 's' : ''} today` : `upcoming event${totalCount !== 1 ? 's' : ''}`}
          </span>
        </div>
        {topSpaces.length > 0 && (
          <div className="flex items-center gap-1 mt-3 text-[11px] text-white/25">
            <TrendingUp className="w-3 h-3" />
            <span>{topSpaces.length} active space{topSpaces.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Next up */}
      <div className="mb-5">
        <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-white/25 mb-3">Next up</p>
        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {upcoming.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="group flex items-start gap-2.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/[0.03] transition-colors text-left w-full"
              >
                <span className="text-[11px] text-white/30 shrink-0 tabular-nums w-14 pt-px">
                  {dayLabel(ev.startDate) === 'Tomorrow' ? 'Tmrw' : dayLabel(ev.startDate).split(',')[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/60 group-hover:text-white/90 transition-colors truncate leading-snug">
                    {ev.title}
                  </p>
                  <span className="text-[10px] text-white/20">{timeLabel(ev.startDate)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-3">
            <p className="text-[12px] text-white/25">No upcoming events yet</p>
            <p className="text-[10px] text-white/15 mt-0.5">Events from your spaces will appear here</p>
          </div>
        )}
      </div>

      <div className="h-px bg-white/[0.05] mb-5" />

      {/* Spaces */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-white/25">Spaces</p>
          <Link href="/spaces" className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
            Browse all
          </Link>
        </div>
        {topSpaces.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {topSpaces.map(sp => (
              <Link
                key={sp.id}
                href={`/s/${sp.handle || sp.id}`}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/[0.03] transition-colors"
              >
                <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 bg-white/[0.06] flex items-center justify-center">
                  {sp.avatarUrl
                    ? <img src={sp.avatarUrl} alt="" className="h-full w-full object-cover" />
                    : <span className="text-[9px] text-white/40 font-medium">{sp.name?.[0]}</span>
                  }
                </div>
                <span className="text-[12px] text-white/50 group-hover:text-white/80 transition-colors line-clamp-1 flex-1 min-w-0">
                  {sp.name}
                </span>
                {sp.isVerified && <span className="text-[10px] text-[#FFD700]/50">✓</span>}
                {sp.upcomingEventCount && sp.upcomingEventCount > 0 ? (
                  <span className="text-[10px] text-white/20 tabular-nums">{sp.upcomingEventCount} events</span>
                ) : (
                  <span className="text-[10px] text-white/15 tabular-nums">{sp.memberCount}</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-3">
            <p className="text-[12px] text-white/25">Discover campus communities</p>
            <Link href="/spaces" className="text-[10px] text-[#FFD700]/40 hover:text-[#FFD700]/60 transition-colors mt-1 inline-flex items-center gap-1">
              Explore spaces <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        )}
      </div>

      {trending.length > 0 && (
        <>
          <div className="h-px bg-white/[0.05] mb-5" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-[#FFD700]/70" />
              </div>
              <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">Trending</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {trending.map(t => (
                <Link
                  key={t.id}
                  href={`/t/${t.id}`}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/60 group-hover:text-white/90 transition-colors truncate leading-snug">
                      {t.title}
                    </p>
                    <span className="text-[10px] text-white/20">
                      {t.useCount > 0 ? `${t.useCount} uses` : 'New'}{t.creatorName ? ` · ${t.creatorName}` : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Empty State                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function EmptyState({ onSelectEvent }: { onSelectEvent: (e: FeedEvent) => void }) {
  const [fallbackEvents, setFallbackEvents] = useState<FeedEvent[]>([]);
  const [fallbackTools, setFallbackTools] = useState<FeedTool[]>([]);
  const [isLoadingFallback, setIsLoadingFallback] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [evRes, toolRes] = await Promise.allSettled([
          fetch('/api/events?campusId=ub-buffalo&upcoming=true&limit=5&sort=soonest', { credentials: 'include' }),
          fetch('/api/tools/discover?sort=trending&limit=4', { credentials: 'include' }),
        ]);

        if (!cancelled) {
          if (evRes.status === 'fulfilled' && evRes.value.ok) {
            const evData = await evRes.value.json();
            const events = (evData.events || evData.data?.events || []).map((e: Record<string, unknown>) => ({
              id: e.id || e.eventId,
              title: e.title || e.name,
              startDate: (e.startDate || e.startAt) as string,
              endDate: e.endDate as string | undefined,
              location: e.location as string | undefined,
              isOnline: e.isOnline as boolean | undefined,
              rsvpCount: (e.rsvpCount as number) || 0,
              spaceName: e.spaceName as string | undefined,
              spaceHandle: e.spaceHandle as string | undefined,
              spaceId: e.spaceId as string | undefined,
              coverImageUrl: (e.imageUrl || e.coverImageUrl) as string | undefined,
              category: e.category as string | undefined,
              eventType: e.eventType as string | undefined,
            }));
            setFallbackEvents(events);
          }

          if (toolRes.status === 'fulfilled' && toolRes.value.ok) {
            const toolData = await toolRes.value.json();
            const tools = (toolData.data?.tools || toolData.tools || []).map((t: Record<string, unknown>) => ({
              id: t.id as string,
              title: (t.title || t.name) as string,
              description: t.description as string | undefined,
              creatorName: (t.creator as Record<string, unknown>)?.name as string | undefined,
              forkCount: (t.forkCount as number) || 0,
              useCount: (t.useCount as number) || 0,
              category: t.category as string | undefined,
              createdAt: t.createdAt as string,
            }));
            setFallbackTools(tools);
          }
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setIsLoadingFallback(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (isLoadingFallback) return <FeedSkeleton />;

  if (fallbackEvents.length === 0 && fallbackTools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
          <Globe className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-[16px] text-white/60 font-medium">Your campus feed is warming up</p>
        <p className="text-[13px] text-white/25 mt-2 max-w-[280px] leading-relaxed">
          Join spaces and RSVP to events — your personalized feed builds from there
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link href="/spaces" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[13px] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-all font-medium">
            Browse spaces
          </Link>
          <Link href="/lab" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/[0.12] text-[13px] text-[#FFD700]/70 hover:text-[#FFD700] hover:bg-[#FFD700]/15 transition-all font-medium">
            <Zap className="w-3.5 h-3.5" />
            Create something
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-1"
      >
        <p className="text-[13px] text-white/35">Here&apos;s what&apos;s happening across campus — personalized picks appear as you join spaces.</p>
      </motion.div>
      {fallbackEvents.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <FeedEventCard event={event} onSelect={onSelectEvent} />
        </motion.div>
      ))}
      {fallbackTools.map((tool, i) => (
        <FeedToolCard
          key={tool.id}
          tool={tool}
          onRemix={() => {}}
          isRemixing={false}
          index={fallbackEvents.length + i}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Skeleton                                                           */
/* ─────────────────────────────────────────────────────────────────── */

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
        <div className="h-[280px] bg-white/[0.03] animate-pulse" />
      </div>
      <div className="flex gap-2 overflow-hidden mt-7">
        {[0, 1, 2].map(i => (
          <div key={i} className="shrink-0 w-[180px] rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <div className="h-14 bg-white/[0.03] animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {[0, 1].map(i => (
        <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden mt-3">
          <div className="h-36 bg-white/[0.03] animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-32 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Feed interleaver                                                   */
/* ─────────────────────────────────────────────────────────────────── */

type FeedItem =
  | { type: 'event'; data: FeedEvent }
  | { type: 'tool'; data: FeedTool }
  | { type: 'activity'; data: ActivityItem }
  | { type: 'space'; data: FeedSpace };

const TODAY_STRIP_MAX = 5;

function buildFeed(events: FeedEvent[], tools: FeedTool[], spaces: FeedSpace[], heroId: string, todayStripCount: number = 0, activityItems: ActivityItem[] = []): FeedItem[] {
  const todayIds = events
    .filter(e => isToday(e.startDate) && e.id !== heroId)
    .slice(0, todayStripCount)
    .map(e => e.id);
  const stripIdSet = new Set([heroId, ...todayIds]);
  const remaining = events.filter(e => !stripIdSet.has(e.id));

  const items: FeedItem[] = [];
  let toolIdx = 0;
  let actIdx = 0;

  for (let i = 0; i < remaining.length; i++) {
    items.push({ type: 'event', data: remaining[i] });
    // Tool every 2 events
    if ((i + 1) % 2 === 0 && toolIdx < tools.length) {
      items.push({ type: 'tool', data: tools[toolIdx++] });
    }
    // Activity every 4 feed items
    if ((i + 1) % 4 === 0 && actIdx < activityItems.length) {
      items.push({ type: 'activity', data: activityItems[actIdx++] });
    }
  }

  while (toolIdx < tools.length) items.push({ type: 'tool', data: tools[toolIdx++] });
  while (actIdx < activityItems.length) items.push({ type: 'activity', data: activityItems[actIdx++] });
  return items;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Page                                                               */
/* ─────────────────────────────────────────────────────────────────── */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [remixingToolId, setRemixingToolId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/enter?redirect=/discover');
  }, [authLoading, user, router]);

  const eventsQuery = useQuery({ queryKey: ['feed-events'], queryFn: fetchFeedEvents, staleTime: 60_000, enabled: !authLoading && !!user });
  const spacesQuery = useQuery({ queryKey: ['feed-spaces'], queryFn: fetchFeedSpaces, staleTime: 5 * 60_000, enabled: !authLoading && !!user });
  const toolsQuery = useQuery({ queryKey: ['feed-tools'], queryFn: fetchFeedTools, staleTime: 5 * 60_000, enabled: !authLoading && !!user });
  const activityQuery = useQuery({ queryKey: ['global-activity'], queryFn: fetchGlobalActivity, staleTime: 60_000, enabled: !authLoading && !!user });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, spaceId }: { eventId: string; spaceId: string }) => rsvpToEvent(spaceId, eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-events'] }),
  });

  const remixMutation = useMutation({
    mutationFn: async (toolId: string) => {
      setRemixingToolId(toolId);
      const res = await fetch(`/api/tools/${toolId}/clone`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'remix' }),
      });
      if (!res.ok) throw new Error('Remix failed');
      return res.json();
    },
    onSuccess: (data) => {
      const newId = data?.data?.toolId || data?.toolId;
      if (newId) router.push(`/lab/${newId}`);
    },
    onSettled: () => setRemixingToolId(null),
  });

  const handleRemix = useCallback((toolId: string) => {
    remixMutation.mutate(toolId);
  }, [remixMutation]);

  const handleToggleExpand = useCallback((toolId: string) => {
    setExpandedToolId(prev => prev === toolId ? null : toolId);
  }, []);

  const handleRsvp = useCallback((eventId: string, spaceId: string) => {
    rsvpMutation.mutate({ eventId, spaceId });
  }, [rsvpMutation]);

  const handleSelectEvent = useCallback((event: FeedEvent) => {
    setSelectedEvent(event);
  }, []);

  const events = eventsQuery.data || [];
  const spaces = spacesQuery.data || [];
  const tools = toolsQuery.data || [];
  const activity = activityQuery.data || [];

  const heroEvent = useMemo(() => {
    const live = events.find(e => isHappeningNow(e.startDate, e.endDate));
    return live || events[0] || null;
  }, [events]);

  const todayEvents = useMemo(() =>
    events.filter(e => isToday(e.startDate) && e.id !== heroEvent?.id).slice(0, TODAY_STRIP_MAX)
  , [events, heroEvent]);

  const feed = useMemo(() =>
    buildFeed(events, tools, spaces, heroEvent?.id || '', todayEvents.length, activity)
  , [events, tools, spaces, heroEvent, todayEvents.length, activity]);

  const isLoading = eventsQuery.isLoading || spacesQuery.isLoading;

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 rounded-full border-2 border-white/[0.06] border-t-white/30 animate-spin" />
      </div>
    );
  }

  const todayCount = events.filter(e => isToday(e.startDate)).length;

  return (
    <>
      {/* Event detail modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRsvp={handleRsvp}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-10 w-full px-4 py-6 md:px-8">
        {/* Right rail */}
        <FeedRightRail
          events={events}
          spaces={spaces}
          tools={tools}
          todayCount={todayCount}
          totalCount={events.length}
          onSelectEvent={handleSelectEvent}
        />

        {/* Main feed */}
        <div className="flex-1 min-w-0 max-w-[680px] order-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center justify-between"
          >
            <h1 className="text-[13px] font-sans uppercase tracking-[0.14em] text-white/25">Feed</h1>
            {todayCount > 0 && (
              <span className="text-[11px] text-white/20 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                {todayCount} event{todayCount !== 1 ? 's' : ''} today
              </span>
            )}
          </motion.div>

          {isLoading ? (
            <FeedSkeleton />
          ) : !heroEvent && feed.length === 0 ? (
            <EmptyState onSelectEvent={handleSelectEvent} />
          ) : (
            <div className="space-y-3">
              {heroEvent && <HeroEvent event={heroEvent} onSelect={handleSelectEvent} />}
              {todayEvents.length > 0 && <TodayStrip events={todayEvents} onSelect={handleSelectEvent} />}

              {feed.length > 0 && (
                <div className="space-y-3 pt-2">
                  {(() => {
                    let lastDay = '';
                    return feed.map((item, i) => {
                      let dayDivider: React.ReactNode = null;
                      if (item.type === 'event') {
                        const day = dayLabel(item.data.startDate);
                        if (day !== lastDay && day !== 'Today') {
                          lastDay = day;
                          dayDivider = (
                            <div key={`divider-${day}`} className="flex items-center gap-3 pt-4 pb-1">
                              <span className="text-[11px] uppercase tracking-[0.12em] text-white/20 font-medium">{day}</span>
                              <div className="flex-1 h-px bg-white/[0.04]" />
                            </div>
                          );
                        }
                      }
                      return (
                        <div key={`${item.type}-${item.data.id}`}>
                          {dayDivider}
                          {item.type === 'event' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
                            >
                              <FeedEventCard event={item.data} onSelect={handleSelectEvent} />
                            </motion.div>
                          )}
                          {item.type === 'tool' && (
                            <FeedToolCard
                              tool={item.data}
                              onRemix={handleRemix}
                              isRemixing={remixingToolId === item.data.id}
                              index={i}
                              isExpanded={expandedToolId === item.data.id}
                              onToggleExpand={handleToggleExpand}
                              expandedContent={<ToolCanvasInline toolId={item.data.id} />}
                            />
                          )}
                          {item.type === 'activity' && (
                            <FeedActivityCard item={item.data} index={i} />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
