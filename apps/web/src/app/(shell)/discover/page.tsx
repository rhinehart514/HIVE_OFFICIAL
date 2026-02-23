'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  Clock,
  GitFork,
  MapPin,
  Play,
  Users,
  Video,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Radio,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { cn } from '@/lib/utils';

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
  const params = new URLSearchParams({ sort: 'trending', limit: '8' });
  const res = await fetch(`/api/tools/discover?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const tools = data?.data?.tools || data?.tools || [];
  return tools.map((t: Record<string, unknown>) => ({
    id: t.id,
    title: t.title || t.name,
    description: t.description,
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

function dayLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((start.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function categoryIcon(cat?: string): string {
  const map: Record<string, string> = {
    governance: '🗳', scheduling: '📅', commerce: '🛒',
    content: '📝', social: '💬', events: '🎉',
    'org-management': '🏛', 'campus-life': '🎓',
  };
  return cat ? (map[cat] || '⚡') : '⚡';
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

function eventHref(event: FeedEvent): string {
  if (event.spaceHandle) return `/s/${event.spaceHandle}`;
  if (event.spaceId) return `/s/${event.spaceId}`;
  return '/discover';
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
/*  Hero Event                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function HeroEvent({ event, onRsvp }: { event: FeedEvent; onRsvp: (id: string, spaceId: string) => void }) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const coverSrc = event.imageUrl || event.coverImageUrl;
  const hasImage = !!coverSrc;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <Link href={eventHref(event)} className="block relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] hover:border-white/[0.14] transition-all duration-300">
        {/* Cover image or category gradient */}
        <div className="relative h-48 w-full overflow-hidden">
          {hasImage ? (
            <img
              src={coverSrc!}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br', eventGradient(event.category, event.eventType))} />
          )}
          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

          {/* Time badge — frosted glass */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            {live ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/20 text-[11px] font-semibold text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Live now
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.08] text-[11px] font-medium text-white/70">
                <Clock className="w-3 h-3" />
                {dayLabel(event.startDate)} · {timeLabel(event.startDate)}
              </span>
            )}
          </div>

          {/* Space pill — top right */}
          {event.spaceName && (
            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.08]">
              <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
              <span className="text-[11px] text-white/60 truncate max-w-[100px]">{event.spaceName}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pt-4 pb-5">
          <h2 className="text-[22px] font-semibold text-white leading-tight tracking-[-0.02em] mb-1.5">
            {event.title}
          </h2>

          {cleanDescription(event.description) && (
            <p className="text-[13px] text-white/40 line-clamp-2 leading-relaxed mb-3">{cleanDescription(event.description)}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 text-[12px] text-white/30 mb-4">
            {event.location && (
              <span className="flex items-center gap-1.5">
                {event.isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[180px]">{event.isOnline ? 'Online' : event.location}</span>
              </span>
            )}
            {event.rsvpCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {event.rsvpCount} going
              </span>
            )}
            {event.friendsAttending && event.friendsAttending > 0 && (
              <span className="flex items-center gap-1.5 text-[#FFD700]/50">
                {event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* RSVP floats outside the link to prevent nested interactive */}
      {event.spaceId && (
        <div className="px-5 pb-5 -mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRsvp(event.id, event.spaceId!); }}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.98]',
              isGoing
                ? 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:bg-white/[0.08]'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isGoing
              ? <><Check className="w-4 h-4" />Going</>
              : 'Attend'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Today Strip                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function TodayStrip({ events, onRsvp }: { events: FeedEvent[]; onRsvp: (id: string, spaceId: string) => void }) {
  if (events.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
          <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">Today</span>
        </div>
        <span className="text-[11px] text-white/20 tabular-nums">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {events.map((event, i) => {
          const live = isHappeningNow(event.startDate, event.endDate);
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          const coverSrc = event.imageUrl || event.coverImageUrl;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 w-[200px]"
            >
              <Link
                href={eventHref(event)}
                className="group block relative overflow-hidden rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-[#0a0a0a] transition-all duration-200"
              >
                {/* Mini cover — gradient or image */}
                <div className="h-16 w-full overflow-hidden relative">
                  {coverSrc ? (
                    <img src={coverSrc} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  ) : (
                    <div className={cn('w-full h-full bg-gradient-to-br opacity-80', eventGradient(event.category, event.eventType))} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  {/* Time badge on image */}
                  <span className={cn(
                    'absolute top-2 left-2.5 text-[10px] font-semibold',
                    live ? 'text-red-400' : 'text-white/50'
                  )}>
                    {live ? '● LIVE' : timeLabel(event.startDate)}
                  </span>
                  {isGoing && (
                    <span className="absolute top-2 right-2.5">
                      <Check className="w-3 h-3 text-[#FFD700]" />
                    </span>
                  )}
                </div>

                <div className="px-3 pb-3 pt-1.5">
                  <p className="text-[13px] font-medium text-white leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {event.location && (
                      <span className="text-[10px] text-white/25 flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate max-w-[80px]">{event.isOnline ? 'Online' : event.location}</span>
                      </span>
                    )}
                    {event.rsvpCount > 0 && (
                      <span className="text-[10px] text-white/20">{event.rsvpCount} going</span>
                    )}
                  </div>
                </div>
              </Link>
              {/* Quick RSVP for non-going items */}
              {event.spaceId && !isGoing && (
                <button
                  onClick={() => onRsvp(event.id, event.spaceId!)}
                  className="mt-1.5 w-full text-[10px] font-medium text-white/30 hover:text-white/60 transition-colors text-center py-1"
                >
                  Quick RSVP
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Feed Event Card                                                    */
/* ─────────────────────────────────────────────────────────────────── */

function FeedEventCard({ event, onRsvp }: { event: FeedEvent; onRsvp: (id: string, spaceId: string) => void }) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const coverSrc = event.imageUrl || event.coverImageUrl;

  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden hover:border-white/[0.12] transition-all duration-200">
      <Link href={eventHref(event)} className="block">
        {/* Cover strip */}
        <div className="h-28 w-full overflow-hidden relative">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br', eventGradient(event.category, event.eventType))} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 to-transparent" />

          {/* Live badge */}
          {live && (
            <span className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/20 text-[10px] font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="p-4">
          {/* Space + time */}
          <div className="flex items-center justify-between mb-2">
            {event.spaceName ? (
              <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
                <span className="truncate max-w-[160px]">{event.spaceName}</span>
              </span>
            ) : <span />}
            <span className={cn(
              'text-[11px] font-medium shrink-0',
              live ? 'text-red-400' : 'text-white/30'
            )}>
              {live ? '● Live' : `${dayLabel(event.startDate)} · ${timeLabel(event.startDate)}`}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-white leading-snug mb-1 group-hover:text-white/90 transition-colors">
            {event.title}
          </h3>

          {/* Description — show first line */}
          {cleanDescription(event.description) && (
            <p className="text-[12px] text-white/30 line-clamp-1 leading-relaxed mb-2">{cleanDescription(event.description)}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-[11px] text-white/25">
            {event.location && (
              <span className="flex items-center gap-1">
                {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                <span className="truncate max-w-[140px]">{event.isOnline ? 'Online' : event.location}</span>
              </span>
            )}
            {event.rsvpCount > 0 && (
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.rsvpCount} going</span>
            )}
            {event.friendsAttending && event.friendsAttending > 0 && (
              <span className="text-[#FFD700]/40">{event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </Link>

      {/* RSVP button — outside link */}
      {event.spaceId && (
        <div className="px-4 pb-4 -mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRsvp(event.id, event.spaceId!); }}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.98]',
              isGoing
                ? 'bg-white/[0.05] border border-white/[0.08] text-white/40 hover:bg-white/[0.07]'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isGoing ? <><Check className="w-3.5 h-3.5" />Going</> : 'Attend'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Embedded Tool Card                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function EmbeddedToolCard({ tool }: { tool: FeedTool }) {
  return (
    <Link href={`/t/${tool.id}`} className="group block rounded-2xl border border-white/[0.06] bg-[#080808] p-4 hover:border-[#FFD700]/10 hover:bg-[#FFD700]/[0.02] transition-all duration-200">
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-[11px] text-[#FFD700]/60 font-medium">
          <span className="text-base leading-none">{categoryIcon(tool.category)}</span>
          <span className="font-sans uppercase tracking-[0.12em]">Creation</span>
          {tool.spaceOriginName && (
            <span className="text-white/20 font-normal normal-case tracking-normal">· {tool.spaceOriginName}</span>
          )}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-[#FFD700]/40 transition-colors" />
      </div>

      <h3 className="text-[15px] font-semibold text-white leading-snug group-hover:text-white/90">{tool.title}</h3>
      {tool.description && (
        <p className="mt-1.5 text-[12px] text-white/30 line-clamp-2 leading-relaxed">{tool.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-[11px] text-white/20">
        {tool.useCount > 0 && (
          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{tool.useCount} uses</span>
        )}
        {tool.forkCount > 0 && (
          <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{tool.forkCount} forks</span>
        )}
      </div>

      {/* Participate CTA */}
      <div className="mt-3 flex items-center gap-2 text-[12px] font-medium text-[#FFD700]/50 group-hover:text-[#FFD700]/80 transition-colors">
        <Zap className="w-3.5 h-3.5" />
        Open
        <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Activity Strip (Recent Creations)                                  */
/* ─────────────────────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ActivityStrip({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-[#FFD700]/40" />
          <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">Recent creations</span>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={item.toolId ? `/t/${item.toolId}` : '#'}
              className="shrink-0 w-[190px] rounded-xl border border-white/[0.06] bg-[#080808] p-3 flex flex-col gap-2 hover:border-[#FFD700]/10 hover:bg-[#FFD700]/[0.02] transition-all duration-200 block"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FFD700]/50" />
                <span className="text-[10px] text-white/30">{relativeTime(item.timestamp)}</span>
              </div>
              <p className="text-[13px] font-medium text-white leading-snug line-clamp-2">{item.headline}</p>
              {item.toolName && (
                <span className="text-[10px] text-[#FFD700]/40 truncate">{item.toolName}</span>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Right Rail                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function FeedRightRail({
  events,
  spaces,
  todayCount,
  totalCount,
}: {
  events: FeedEvent[];
  spaces: FeedSpace[];
  todayCount: number;
  totalCount: number;
}) {
  // Next few events excluding today
  const upcoming = events.filter(e => !isToday(e.startDate)).slice(0, 4);
  const topSpaces = spaces.slice(0, 5);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 sticky top-6 self-start order-2 gap-0">

      {/* Campus pulse — always shows something */}
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
          <div className="flex flex-col gap-1">
            {upcoming.map((ev) => (
              <Link
                key={ev.id}
                href={eventHref(ev)}
                className="group flex items-start gap-2.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/[0.03] transition-colors"
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-3">
            <p className="text-[12px] text-white/25">No upcoming events yet</p>
            <p className="text-[10px] text-white/15 mt-0.5">Events from your spaces will appear here</p>
          </div>
        )}
      </div>

      {/* Hairline */}
      <div className="h-px bg-white/[0.05] mb-5" />

      {/* Spaces to explore */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-white/25">Spaces</p>
          <Link href="/spaces" className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
            Browse all
          </Link>
        </div>
        {topSpaces.length > 0 ? (
          <div className="flex flex-col gap-1">
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

      {/* Hairline */}
      <div className="h-px bg-white/[0.05] mb-5" />

      {/* Create CTA */}
      <Link
        href="/lab"
        className="group flex items-center gap-3 rounded-xl border border-[#FFD700]/[0.08] bg-[#FFD700]/[0.03] px-3.5 py-3 hover:border-[#FFD700]/[0.15] hover:bg-[#FFD700]/[0.05] transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-[#FFD700]/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-white/70 group-hover:text-white/90 transition-colors">Build something</p>
          <p className="text-[10px] text-white/25">AI-powered creation in 30s</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-[#FFD700]/40 transition-colors shrink-0" />
      </Link>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Empty State                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function EmptyState() {
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

  if (isLoadingFallback) {
    return <FeedSkeleton />;
  }

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
        transition={{ duration: 0.3 }}
        className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-1"
      >
        <p className="text-[13px] text-white/35">Here&apos;s what&apos;s happening across campus — personalized picks appear as you join spaces and RSVP to events.</p>
      </motion.div>
      {fallbackEvents.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <FeedEventCard event={event} onRsvp={() => {}} />
        </motion.div>
      ))}
      {fallbackTools.map((tool, i) => (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: (fallbackEvents.length + i) * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <EmbeddedToolCard tool={tool} />
        </motion.div>
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
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
        <div className="h-48 bg-white/[0.03] animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-5 w-3/4 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-white/[0.03] rounded animate-pulse" />
          <div className="h-10 w-full bg-white/[0.04] rounded-xl animate-pulse mt-2" />
        </div>
      </div>
      {/* Strip skeleton */}
      <div className="flex gap-2.5 overflow-hidden mt-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="shrink-0 w-[200px] rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <div className="h-16 bg-white/[0.03] animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 bg-white/[0.04] rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-white/[0.03] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {/* Card skeletons */}
      {[0, 1].map(i => (
        <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden mt-3">
          <div className="h-28 bg-white/[0.03] animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-32 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-9 w-full bg-white/[0.04] rounded-xl animate-pulse mt-1" />
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
  | { type: 'space'; data: FeedSpace };

const TODAY_STRIP_MAX = 5;

function buildFeed(events: FeedEvent[], tools: FeedTool[], spaces: FeedSpace[], heroId: string, todayStripCount: number = 0): FeedItem[] {
  const todayIds = events
    .filter(e => isToday(e.startDate) && e.id !== heroId)
    .slice(0, todayStripCount)
    .map(e => e.id);
  const stripIdSet = new Set([heroId, ...todayIds]);
  const remaining = events.filter(e => !stripIdSet.has(e.id));

  const items: FeedItem[] = [];
  let toolIdx = 0;

  for (let i = 0; i < remaining.length; i++) {
    items.push({ type: 'event', data: remaining[i] });

    if ((i + 1) % 3 === 0 && toolIdx < tools.length) {
      items.push({ type: 'tool', data: tools[toolIdx++] });
    }
  }

  while (toolIdx < tools.length) items.push({ type: 'tool', data: tools[toolIdx++] });

  return items;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Page                                                               */
/* ─────────────────────────────────────────────────────────────────── */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const handleRsvp = useCallback((eventId: string, spaceId: string) => {
    rsvpMutation.mutate({ eventId, spaceId });
  }, [rsvpMutation]);

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
    buildFeed(events, tools, spaces, heroEvent?.id || '', todayEvents.length)
  , [events, tools, spaces, heroEvent, todayEvents.length]);

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
    <div className="flex gap-10 w-full px-4 py-6 md:px-8">

      {/* Right rail */}
      <FeedRightRail
        events={events}
        spaces={spaces}
        todayCount={todayCount}
        totalCount={events.length}
      />

      {/* Main feed */}
      <div className="flex-1 min-w-0 max-w-[680px] order-1">
        {/* Header */}
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
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {/* Hero */}
            {heroEvent && <HeroEvent event={heroEvent} onRsvp={handleRsvp} />}

            {/* Today strip */}
            {todayEvents.length > 0 && <TodayStrip events={todayEvents} onRsvp={handleRsvp} />}

            {/* Recent creations */}
            {activity.length > 0 && <ActivityStrip items={activity} />}

            {/* Feed body */}
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
                          <div key={`divider-${day}`} className="flex items-center gap-3 pt-3 pb-1">
                            <span className="text-[11px] uppercase tracking-[0.12em] text-white/20 font-medium">{day}</span>
                            <div className="flex-1 h-px bg-white/[0.04]" />
                          </div>
                        );
                      }
                    }
                    return (
                      <div key={`${item.type}-${item.data.id}`}>
                        {dayDivider}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
                        >
                          {item.type === 'event' && <FeedEventCard event={item.data} onRsvp={handleRsvp} />}
                          {item.type === 'tool' && <EmbeddedToolCard tool={item.data} />}
                        </motion.div>
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
  );
}
