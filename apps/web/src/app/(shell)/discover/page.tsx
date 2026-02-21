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
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  coverImageUrl?: string;
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
  const hasImage = !!event.coverImageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]"
    >
      {/* Cover image */}
      {hasImage && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={event.coverImageUrl!}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.85) 100%)' }} />
          {/* Live badge over image */}
          {live && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live now
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-5 pt-4 pb-5">
        {/* Time + space row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={`text-[12px] font-medium ${live && !hasImage ? 'text-red-400' : 'text-white/35'}`}>
            {live && !hasImage
              ? '● Live now'
              : `${dayLabel(event.startDate)} · ${timeLabel(event.startDate)}`}
          </span>
          {event.spaceName && (
            <Link
              href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'}
              className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/50 transition-colors shrink-0"
            >
              <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
              <span className="truncate max-w-[120px]">{event.spaceName}</span>
            </Link>
          )}
        </div>

        {/* Title */}
        <h2 className="text-[20px] font-semibold text-white leading-tight tracking-[-0.01em] mb-2">
          {event.title}
        </h2>

        {event.description && (
          <p className="text-[13px] text-white/40 line-clamp-2 leading-relaxed mb-3">{event.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[12px] text-white/30 mb-4">
          {event.location && (
            <span className="flex items-center gap-1">
              {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              <span className="truncate max-w-[140px]">{event.isOnline ? 'Online' : event.location}</span>
            </span>
          )}
          {event.rsvpCount > 0 && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.rsvpCount} going</span>
          )}
        </div>

        {/* RSVP */}
        {event.spaceId && (
          <button
            onClick={() => onRsvp(event.id, event.spaceId!)}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]',
              isGoing
                ? 'bg-white/[0.07] border border-white/[0.10] text-white/60'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isGoing
              ? <><Check className="w-4 h-4" />Going</>
              : 'Attend'}
          </button>
        )}
      </div>
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
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-white/30">Today</span>
        <span className="text-[12px] text-white/20">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {events.map((event, i) => {
          const live = isHappeningNow(event.startDate, event.endDate);
          const isGoing = event.isUserRsvped || event.userRsvp === 'going';
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 w-[190px] rounded-xl border border-white/[0.06] bg-[#080808] p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold ${live ? 'text-red-400' : 'text-white/30'}`}>
                  {live ? '● LIVE' : timeLabel(event.startDate)}
                </span>
                {isGoing && <Check className="w-3 h-3 text-[#FFD700]" />}
              </div>
              <p className="text-[13px] font-medium text-white leading-snug line-clamp-2">{event.title}</p>
              {event.rsvpCount > 0 && (
                <span className="text-[11px] text-white/25">{event.rsvpCount} going</span>
              )}
              {event.spaceId && !isGoing && (
                <button
                  onClick={() => onRsvp(event.id, event.spaceId!)}
                  className="mt-auto text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors text-left"
                >
                  RSVP →
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
  const hasImage = !!event.coverImageUrl;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      {/* Cover image — full width when present */}
      {hasImage && (
        <div className="h-36 w-full overflow-hidden">
          <img
            src={event.coverImageUrl!}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Space + time */}
        <div className="flex items-center justify-between mb-2.5">
          {event.spaceName ? (
            <Link
              href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'}
              className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/50 transition-colors"
            >
              <SpaceAvatar name={event.spaceName} url={event.spaceAvatarUrl} size={14} />
              <span className="truncate max-w-[160px]">{event.spaceName}</span>
            </Link>
          ) : <span />}
          <span className={`text-[11px] font-medium shrink-0 ${live ? 'text-red-400' : 'text-white/30'}`}>
            {live ? '● Live' : `${dayLabel(event.startDate)} · ${timeLabel(event.startDate)}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-white leading-snug mb-1.5">{event.title}</h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[12px] text-white/25 mb-3">
          {event.location && (
            <span className="flex items-center gap-1">
              {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              <span className="truncate max-w-[140px]">{event.isOnline ? 'Online' : event.location}</span>
            </span>
          )}
          {event.rsvpCount > 0 && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.rsvpCount} going</span>
          )}
        </div>

        {/* Check-in button */}
        {event.spaceId && (
          <button
            onClick={() => onRsvp(event.id, event.spaceId!)}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]',
              isGoing
                ? 'bg-white/[0.06] border border-white/[0.08] text-white/50'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isGoing ? <><Check className="w-3.5 h-3.5" />Going</> : 'Attend'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Embedded Tool Card                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function EmbeddedToolCard({ tool }: { tool: FeedTool }) {
  return (
    <Link href={`/t/${tool.id}`} className="group block rounded-2xl border border-white/[0.06] bg-[#080808] p-4 hover:border-white/[0.1] transition-all">
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-[11px] text-[#FFD700]/60 font-medium">
          <span className="text-base leading-none">{categoryIcon(tool.category)}</span>
          <span className="font-sans uppercase tracking-[0.12em]">Tool</span>
          {tool.spaceOriginName && (
            <span className="text-white/20 font-normal normal-case tracking-normal">· {tool.spaceOriginName}</span>
          )}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>

      <h3 className="text-[15px] font-semibold text-white leading-snug group-hover:text-white/90">{tool.title}</h3>
      {tool.description && (
        <p className="mt-1.5 text-[13px] text-white/30 line-clamp-2 leading-relaxed">{tool.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-[12px] text-white/20">
        {tool.useCount > 0 && (
          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{tool.useCount} uses</span>
        )}
        {tool.forkCount > 0 && (
          <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{tool.forkCount} forks</span>
        )}
      </div>

      {/* Use CTA */}
      <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#FFD700]/70 group-hover:text-[#FFD700] transition-colors">
        <Zap className="w-3.5 h-3.5" />
        Open tool
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Space Discovery Card                                              */
/* ─────────────────────────────────────────────────────────────────── */

function SpaceDiscoveryCard({ space }: { space: FeedSpace }) {
  return (
    <Link href={`/s/${space.handle || space.id}`} className="group flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 hover:border-white/[0.08] hover:bg-white/[0.03] transition-all">
      <SpaceAvatar name={space.name} url={space.avatarUrl} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[14px] font-medium text-white truncate">{space.name}</span>
          {space.isVerified && <span className="text-[#FFD700] text-[11px]">✓</span>}
        </div>
        {space.description && (
          <p className="text-[12px] text-white/30 line-clamp-1 mt-0.5">{space.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/20">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{space.memberCount}</span>
          {!!space.upcomingEventCount && space.upcomingEventCount > 0 && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{space.upcomingEventCount} upcoming</span>
          )}
          {!!space.mutualCount && space.mutualCount > 0 && (
            <span className="text-[#FFD700]/50">{space.mutualCount} mutual{space.mutualCount > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors shrink-0 mt-0.5" />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Empty State                                                        */
/* ─────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────── */
/*  Feed Tease — end of feed, hints at what's coming                  */
/* ─────────────────────────────────────────────────────────────────── */

function FeedTease() {
  const coming = [
    { icon: '🏆', label: 'Club leaderboards' },
    { icon: '📍', label: 'Live campus map' },
    { icon: '🎙', label: 'Space announcements' },
  ];

  return (
    <div className="mt-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5">
      <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/20 mb-3">More coming to your feed</p>
      <div className="flex flex-col gap-2">
        {coming.map((item) => (
          <div key={item.label} className="flex items-center gap-3 opacity-40">
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[13px] text-white/50">{item.label}</span>
            <span className="ml-auto text-[10px] font-sans text-white/20 uppercase tracking-wider">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4 text-xl">🌱</div>
      <p className="text-[15px] text-white/50 font-medium">Nothing yet</p>
      <p className="text-[13px] text-white/25 mt-1 max-w-[240px]">
        Events, tools, and spaces from your campus will show up here
      </p>
      <Link href="/spaces" className="mt-5 flex items-center gap-1.5 text-[13px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors font-medium">
        Browse spaces <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Skeleton                                                           */
/* ─────────────────────────────────────────────────────────────────── */

function FeedSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] h-[200px]" />
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map(i => <div key={i} className="shrink-0 w-[190px] h-[110px] rounded-xl bg-white/[0.03] border border-white/[0.04]" />)}
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.04]" style={{ height: 130 + i * 20 }} />
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
  // Remaining events: exclude hero + the first N today events shown in the strip
  const todayIds = events
    .filter(e => isToday(e.startDate) && e.id !== heroId)
    .slice(0, todayStripCount)
    .map(e => e.id);
  const stripIdSet = new Set([heroId, ...todayIds]);
  const remaining = events.filter(e => !stripIdSet.has(e.id));

  const items: FeedItem[] = [];
  let toolIdx = 0;
  let spaceIdx = 0;

  for (let i = 0; i < remaining.length; i++) {
    items.push({ type: 'event', data: remaining[i] });

    // Every 3 events, drop a tool
    if ((i + 1) % 3 === 0 && toolIdx < tools.length) {
      items.push({ type: 'tool', data: tools[toolIdx++] });
    }

    // Every 5 events, drop a space suggestion
    if ((i + 1) % 5 === 0 && spaceIdx < spaces.length) {
      items.push({ type: 'space', data: spaces[spaceIdx++] });
    }
  }

  // Append remaining tools / spaces at end
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

  // Pick hero: live first, then earliest upcoming
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
        <div className="w-6 h-6 rounded-full border-2 border-white/[0.06] border-t-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[13px] font-sans uppercase tracking-[0.15em] text-white/30">What&apos;s happening at UB</h1>
      </div>

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

          {/* Feed tease when body is empty but hero exists */}
          {feed.length === 0 && heroEvent && <FeedTease />}

          {/* Feed body */}
          {feed.length > 0 && (
            <div className="space-y-3 pt-2">
              {(() => {
                let lastDay = '';
                return feed.map((item, i) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  let dayDivider: any = null;
                  if (item.type === 'event') {
                    const day = dayLabel(item.data.startDate);
                    if (day !== lastDay && day !== 'Today') {
                      lastDay = day;
                      dayDivider = (
                        <div key={`divider-${day}`} className="flex items-center gap-3 pt-2">
                          <span className="text-[11px] uppercase tracking-[0.12em] text-white/25">{day}</span>
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
                        {item.type === 'space' && <SpaceDiscoveryCard space={item.data} />}
                      </motion.div>
                    </div>
                  );
                });
              })()}
              <FeedTease />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
